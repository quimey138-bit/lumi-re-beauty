begin;
-- Receipts remember revocations even before the corresponding checkout exists.
create table public.tracking_receipts(token_hash text primary key check(token_hash ~ '^[0-9a-f]{64}$'),revoked boolean not null default false);
alter table public.tracking_receipts enable row level security;
revoke all on public.tracking_receipts from public,anon,authenticated;
grant all on public.tracking_receipts to service_role;

alter function public.create_order(jsonb,uuid,boolean) rename to _create_order_v1;
revoke all on function public._create_order_v1(jsonb,uuid,boolean) from public,anon,authenticated;
create function public.create_order(p_lines jsonb,p_key uuid,p_consent boolean,p_consent_hash text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;v_allowed boolean:=false;
begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 if p_consent_hash is not null and p_consent_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid consent receipt';end if;
 if p_consent and p_consent_hash is null then raise exception 'consent receipt required';end if;
 if p_consent_hash is not null then
  perform pg_advisory_xact_lock(hashtextextended(p_consent_hash,2));
  insert into public.tracking_receipts(token_hash) values(p_consent_hash) on conflict do nothing;
  select p_consent and not revoked into v_allowed from public.tracking_receipts where token_hash=p_consent_hash;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,3));
 select id into v_id from public.orders where customer_id=auth.uid() and request_key=p_key;
 if v_id is not null then return v_id;end if;
 v_id:=public._create_order_v1(p_lines,p_key,false);
 update public.orders set analytics_consent=coalesce(v_allowed,false),consent_token_hash=p_consent_hash where id=v_id;
 return v_id;
end $$;
alter table public.conversion_jobs drop constraint conversion_jobs_state_check;
alter table public.conversion_jobs add check(state in('pending','processing','sent','failed','cancelled'));
create or replace function public.revoke_tracking(p_hash text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_hash is null or p_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid receipt';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_hash,2));
 insert into public.tracking_receipts(token_hash,revoked) values(p_hash,true) on conflict(token_hash) do update set revoked=true;
 update public.orders set analytics_consent=false where consent_token_hash=p_hash;
 update public.conversion_jobs set state='cancelled' where state in('pending','processing') and order_id in(select id from public.orders where consent_token_hash=p_hash);
end $$;
create or replace function public.finish_conversion(p_id uuid,p_token uuid,p_result text) returns void language sql security definer set search_path='' as $$
 update public.conversion_jobs set state=case when p_result='sent' then 'sent' when p_result='cancelled' then 'cancelled' when attempts>=5 and p_result<>'not_configured' then 'failed' else 'pending' end,
 attempts=case when p_result='not_configured' then greatest(attempts-1,0) else attempts end,
 due_at=now()+interval '1 hour',lease_until=null,lease_token=null where id=p_id and state='processing' and lease_token=p_token
$$;

-- Serialize the lookup as well as insertion for duplicate request keys.
alter function public.book_appointment(text,uuid,timestamptz,uuid) rename to _book_appointment_v1;
revoke all on function public._book_appointment_v1(text,uuid,timestamptz,uuid) from public,anon,authenticated;
create function public.book_appointment(p_service text,p_professional uuid,p_start timestamptz,p_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'unauthorized';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_key::text,4));
 return public._book_appointment_v1(p_service,p_professional,p_start,p_key);
end $$;
alter function public.reschedule_appointment(uuid,timestamptz) rename to _reschedule_appointment_v1;
revoke all on function public._reschedule_appointment_v1(uuid,timestamptz) from public,anon,authenticated;
create function public.reschedule_appointment(p_id uuid,p_start timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
 select * into a from public.appointments where id=p_id;
 if auth.uid() is null or a.id is null or not(a.customer_id=auth.uid() or public.can_manage_professional(a.professional_id)) then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(a.professional_id::text,0));
 if not exists(select 1 from public.professionals p join public.professional_services ps on ps.professional_id=p.id join public.services s on s.id=ps.service_id
  where p.id=a.professional_id and s.id=a.service_id and p.active and s.active) then raise exception 'professional or service unavailable';end if;
 perform public._reschedule_appointment_v1(p_id,p_start);
end $$;
create or replace function public.set_staff_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare v_role text;
begin
 if not public.is_admin() or p_role not in('cliente','profesional') then raise exception 'forbidden';end if;
 select role into v_role from public.profiles where id=p_user for no key update;
 if v_role is null or v_role='admin' then raise exception 'protected or unknown account';end if;
 update public.profiles set role=p_role where id=p_user;
 update public.professionals set active=(p_role='profesional') where user_id=p_user;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'set_role_'||p_role,p_user);
end $$;

-- Payment snapshots may arrive out of order; refund state is terminal and refunds never decrease.
alter table public.orders add column refunded_cents bigint not null default 0 check(refunded_cents>=0 and refunded_cents<=total_cents);
alter table public.orders add column payment_updated_at timestamptz;
alter table public.orders drop constraint orders_status_check;
alter table public.orders add check(status in('pending','paid','expired','paid_review','partially_refunded','refunded'));
drop function public.settle_order(uuid,text,bigint,text,text);
create function public.settle_order(p_order uuid,p_payment text,p_amount bigint,p_currency text,p_status text,p_refunded bigint default 0,p_updated timestamptz default null)
returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;v_refunded bigint;v_status text;
begin
 select * into o from public.orders where id=p_order for update;
 if o.id is null or o.total_cents<>p_amount or p_currency<>'ARS' or p_refunded<0 or p_refunded>p_amount then raise exception 'payment mismatch';end if;
 if o.payment_id is not null and o.payment_id<>p_payment then raise exception 'different payment requires manual reconciliation';end if;
 if p_updated is not null and o.payment_updated_at is not null and p_updated<o.payment_updated_at then return;end if;
 if p_status not in('approved','refunded','charged_back') then return;end if;
 if o.status='refunded' then return;end if;
 v_refunded:=case when p_status in('refunded','charged_back') then p_amount else greatest(o.refunded_cents,p_refunded) end;
 if v_refunded=p_amount then
  v_status:='refunded';
  if o.status='pending' then update public.products p set stock=p.stock+i.quantity from public.order_items i where i.order_id=o.id and i.product_id=p.id;end if;
 elsif o.status in('expired','paid_review') then v_status:='paid_review';
 elsif v_refunded>0 then v_status:='partially_refunded';
 else v_status:='paid';end if;
 update public.orders set status=v_status,payment_id=p_payment,refunded_cents=v_refunded,payment_updated_at=coalesce(p_updated,payment_updated_at),
  paid_at=case when p_status='approved' then coalesce(paid_at,now()) else paid_at end where id=p_order;
 if v_status='paid' and o.analytics_consent then insert into public.conversion_jobs(order_id) values(p_order) on conflict do nothing;end if;
 if v_status<>'paid' then update public.conversion_jobs set state='cancelled' where order_id=p_order and state in('pending','processing');end if;
end $$;
revoke all on function public.create_order(jsonb,uuid,boolean,text),public.book_appointment(text,uuid,timestamptz,uuid),public.reschedule_appointment(uuid,timestamptz),public.settle_order(uuid,text,bigint,text,text,bigint,timestamptz) from public,anon,authenticated;
grant execute on function public.create_order(jsonb,uuid,boolean,text),public.book_appointment(text,uuid,timestamptz,uuid),public.reschedule_appointment(uuid,timestamptz) to authenticated;
grant execute on function public.settle_order(uuid,text,bigint,text,text,bigint,timestamptz) to service_role;
commit;
