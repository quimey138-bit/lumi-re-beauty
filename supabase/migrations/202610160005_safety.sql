begin;
alter table public.orders add column consent_token_hash text;
create index on public.orders(consent_token_hash);
create function public.revoke_tracking(p_hash text) returns void language sql security definer set search_path='' as $$
 update public.orders set analytics_consent=false where consent_token_hash=p_hash and length(p_hash)=64
$$;
alter table public.appointments add column revision integer not null default 0;
alter table public.notification_jobs add column revision integer not null default 0;
alter table public.notification_jobs drop constraint notification_jobs_appointment_id_kind_channel_key;
alter table public.notification_jobs add unique(appointment_id,kind,channel,revision);
create table public.reward_rules(
 milestone integer primary key check(milestone in(6,8,15)),enabled boolean not null default false,
 conditions text not null default '',discount_percent integer check(discount_percent between 1 and 100),eligible_product_id text references public.products(id),
 check(not enabled or(length(trim(conditions))>0 and(milestone<>6 or discount_percent is not null) and(milestone<>15 or eligible_product_id is not null)))
);
insert into public.reward_rules(milestone) values(6),(8),(15);
alter table public.reward_rules enable row level security;
create policy reward_rules_read on public.reward_rules for select using(true);
create function public.configure_reward(p_milestone integer,p_conditions text,p_discount integer,p_product text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 update public.reward_rules set enabled=true,conditions=left(trim(p_conditions),1000),discount_percent=p_discount,eligible_product_id=p_product where milestone=p_milestone;
 if not found then raise exception 'invalid milestone'; end if;
end $$;
create or replace function public.redeem_reward(p_customer uuid,p_milestone integer) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 if not exists(select 1 from public.reward_rules where milestone=p_milestone and enabled) then raise exception 'reward not configured'; end if;
 perform 1 from public.profiles where id=p_customer for update;
 if p_milestone not in(6,8,15) or (select count(*) from public.loyalty_stamps where customer_id=p_customer)<p_milestone then raise exception 'milestone not reached'; end if;
 insert into public.reward_redemptions(customer_id,milestone,actor_id) values(p_customer,p_milestone,auth.uid()) returning id into v_id;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'redeem_reward',v_id);
 return v_id;
end $$;
create function public.reschedule_appointment(p_id uuid,p_start timestamptz) returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments; v_end timestamptz; v_local timestamp; v_revision integer; u public.profiles;
begin
 select * into a from public.appointments where id=p_id for update;
 if auth.uid() is null or a.id is null or not(a.customer_id=auth.uid() or public.can_manage_professional(a.professional_id)) then raise exception 'forbidden'; end if;
 if a.status<>'confirmado' or a.starts_at<=now() or p_start<=now() or p_start>now()+interval '90 days' then raise exception 'invalid date'; end if;
 perform pg_advisory_xact_lock(hashtextextended(a.professional_id::text,0));
 v_end:=p_start+(a.ends_at-a.starts_at);v_local:=p_start at time zone 'America/Argentina/Buenos_Aires';
 if not exists(select 1 from public.working_hours w where w.professional_id=a.professional_id and w.weekday=extract(dow from v_local)
  and v_local::time>=w.opens and (v_end at time zone 'America/Argentina/Buenos_Aires')::date=v_local::date and (v_end at time zone 'America/Argentina/Buenos_Aires')::time<=w.closes)
  or exists(select 1 from public.schedule_blocks where professional_id=a.professional_id and starts_at<v_end and ends_at>p_start) then raise exception 'outside availability'; end if;
 update public.appointments set starts_at=p_start,ends_at=v_end,revision=revision+1 where id=p_id returning revision into v_revision;
 update public.notification_jobs set state='cancelled' where appointment_id=p_id and state in('pending','processing');
 select * into u from public.profiles where id=a.customer_id;
 insert into public.notification_jobs(appointment_id,kind,channel,due_at,revision) values(p_id,'studio','whatsapp',now(),v_revision),(p_id,'studio','email',now(),v_revision);
 if u.whatsapp_consent and u.phone<>'' then
  insert into public.notification_jobs(appointment_id,kind,channel,due_at,revision) values(p_id,'confirmation','whatsapp',now(),v_revision);
  if p_start-interval '24 hours'>now() then insert into public.notification_jobs(appointment_id,kind,channel,due_at,revision) values(p_id,'reminder','whatsapp',p_start-interval '24 hours',v_revision);end if;
 end if;
 if u.email_consent and u.email<>'' then
  insert into public.notification_jobs(appointment_id,kind,channel,due_at,revision) values(p_id,'confirmation','email',now(),v_revision);
  if p_start-interval '24 hours'>now() then insert into public.notification_jobs(appointment_id,kind,channel,due_at,revision) values(p_id,'reminder','email',p_start-interval '24 hours',v_revision);end if;
 end if;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'reschedule',p_id);
end $$;
create function public.mark_absent(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
 select * into a from public.appointments where id=p_id for update;
 if a.id is null or not public.can_manage_professional(a.professional_id) then raise exception 'forbidden';end if;
 if a.status<>'confirmado' or a.ends_at>now() then raise exception 'visit not ended';end if;
 update public.appointments set status='ausente' where id=p_id;
 update public.notification_jobs set state='cancelled' where appointment_id=p_id and state in('pending','processing');
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'absent',p_id);
end $$;
create function public.add_schedule_block(p_professional uuid,p_start timestamptz,p_end timestamptz) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_professional::text,0));
 if p_start>=p_end or p_start<now() or exists(select 1 from public.appointments where professional_id=p_professional and status='confirmado' and starts_at<p_end and ends_at>p_start) then raise exception 'invalid or occupied interval';end if;
 insert into public.schedule_blocks(professional_id,starts_at,ends_at) values(p_professional,p_start,p_end) returning id into v_id;return v_id;
end $$;
create function public.appointment_contacts(p_ids uuid[]) returns table(appointment_id uuid,full_name text,phone text) language sql stable security definer set search_path='' as $$
 select a.id,u.full_name,u.phone from public.appointments a join public.profiles u on u.id=a.customer_id where a.id=any(p_ids) and public.can_manage_professional(a.professional_id)
$$;

-- Explicitly undo both PUBLIC privileges and historical Supabase default grants.
-- Only Lumière-owned objects are touched; unrelated application objects are preserved.
revoke all on public.profiles,public.professionals,public.services,public.professional_services,public.working_hours,public.schedule_blocks,public.appointments,public.audit_events,public.loyalty_stamps,public.reward_redemptions,public.notification_jobs,public.products,public.orders,public.order_items,public.conversion_jobs,public.reward_rules from public,anon,authenticated;
grant select on public.profiles,public.schedule_blocks,public.appointments,public.audit_events,public.loyalty_stamps,public.reward_redemptions,public.orders,public.order_items to authenticated;
grant update(full_name,phone,whatsapp_consent,email_consent) on public.profiles to authenticated;
grant select on public.professionals,public.services,public.professional_services,public.working_hours,public.products,public.reward_rules to anon,authenticated;
grant all on public.reward_rules to service_role;
do $$ declare f record;begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=any(array[
 'create_profile','is_admin','can_manage_professional','book_appointment','availability_busy','cancel_appointment','complete_appointment','redeem_reward','manage_professional','manage_hours','assign_service','set_product_stock','create_order','expire_orders','settle_order','claim_notifications','finish_notification','claim_conversions','finish_conversion','record_paid_at','revoke_tracking','configure_reward','reschedule_appointment','mark_absent','add_schedule_block','appointment_contacts'])
 loop execute format('revoke all on function %s from public,anon,authenticated',f.signature);end loop;
end $$;
grant execute on function public.is_admin(),public.can_manage_professional(uuid),public.availability_busy(uuid,date) to anon,authenticated;
grant execute on function public.book_appointment(text,uuid,timestamptz,uuid),public.cancel_appointment(uuid),public.complete_appointment(uuid),public.redeem_reward(uuid,integer),public.manage_professional(text,uuid),public.manage_hours(uuid,integer,time,time),public.assign_service(uuid,text),public.set_product_stock(text,integer),public.create_order(jsonb,uuid,boolean),public.configure_reward(integer,text,integer,text),public.reschedule_appointment(uuid,timestamptz),public.mark_absent(uuid),public.add_schedule_block(uuid,timestamptz,timestamptz),public.appointment_contacts(uuid[]) to authenticated;
grant execute on function public.revoke_tracking(text),public.expire_orders(),public.settle_order(uuid,text,bigint,text,text),public.claim_notifications(integer),public.finish_notification(uuid,uuid,text),public.claim_conversions(integer),public.finish_conversion(uuid,uuid,text) to service_role;
commit;
