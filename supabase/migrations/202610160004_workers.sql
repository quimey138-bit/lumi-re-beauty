begin;
create function public.claim_notifications(p_limit integer default 3)
returns setof public.notification_jobs language plpgsql security definer set search_path='' as $$
begin
 update public.notification_jobs set state='failed',last_error='lease_expired' where state='processing' and attempts>=5 and lease_until<now();
 return query update public.notification_jobs j set state='processing',attempts=j.attempts+1,lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid()
 where j.id in(select id from public.notification_jobs where due_at<=now() and attempts<5 and (state='pending' or (state='processing' and lease_until<now())) order by due_at for update skip locked limit least(greatest(p_limit,1),3)) returning j.*
; end $$;
create function public.finish_notification(p_id uuid,p_token uuid,p_result text)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.notification_jobs set
 state=case when p_result='sent' then 'sent' when p_result='cancelled' then 'cancelled' when attempts>=5 and p_result<>'not_configured' then 'failed' else 'pending' end,
 attempts=case when p_result='not_configured' then greatest(attempts-1,0) else attempts end,
 due_at=now()+case when p_result='not_configured' then interval '1 hour' else interval '1 minute'*power(2,attempts) end,
 last_error=case when p_result in ('sent','cancelled') then null else left(p_result,80) end,lease_until=null,lease_token=null
 where id=p_id and state='processing' and lease_token=p_token;
end $$;
create function public.claim_conversions(p_limit integer default 3)
returns setof public.conversion_jobs language plpgsql security definer set search_path='' as $$
begin
 update public.conversion_jobs set state='failed' where state='processing' and attempts>=5 and lease_until<now();
 return query update public.conversion_jobs j set state='processing',attempts=j.attempts+1,lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid()
 where j.id in(select id from public.conversion_jobs where due_at<=now() and attempts<5 and (state='pending' or(state='processing' and lease_until<now())) order by due_at for update skip locked limit least(greatest(p_limit,1),3)) returning j.*
; end $$;
create function public.finish_conversion(p_id uuid,p_token uuid,p_result text) returns void language sql security definer set search_path='' as $$
 update public.conversion_jobs set state=case when p_result in ('sent','cancelled') then 'sent' when attempts>=5 and p_result<>'not_configured' then 'failed' else 'pending' end,
 attempts=case when p_result='not_configured' then greatest(attempts-1,0) else attempts end,
 due_at=now()+interval '1 hour',lease_until=null,lease_token=null where id=p_id and state='processing' and lease_token=p_token
$$;
alter table public.orders add column checkout_lease_until timestamptz;
alter table public.orders add column paid_at timestamptz;
create function public.record_paid_at() returns trigger language plpgsql set search_path='' as $$
begin if new.status='paid' and old.status<>'paid' then new.paid_at:=now(); end if;return new;end $$;
create trigger orders_paid_at before update on public.orders for each row execute function public.record_paid_at();
revoke all on function public.claim_notifications(integer),public.finish_notification(uuid,uuid,text),public.claim_conversions(integer),public.finish_conversion(uuid,uuid,text),public.record_paid_at() from public;
grant execute on function public.claim_notifications(integer),public.finish_notification(uuid,uuid,text),public.claim_conversions(integer),public.finish_conversion(uuid,uuid,text) to service_role;
commit;
