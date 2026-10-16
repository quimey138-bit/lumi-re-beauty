begin;
create extension if not exists btree_gist;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'cliente' check(role in ('cliente','profesional','admin')),
  full_name text not null default '', email text not null default '', phone text not null default '',
  whatsapp_consent boolean not null default false, email_consent boolean not null default false,
  created_at timestamptz not null default now()
);
create function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,email,full_name) values(new.id,coalesce(new.email,''),left(coalesce(new.raw_user_meta_data->>'full_name',''),120));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin')
$$;

create table public.professionals (
  id uuid primary key default gen_random_uuid(), user_id uuid unique references public.profiles(id),
  name text not null, active boolean not null default true
);
create table public.services (
  id text primary key, name text not null, duration_minutes integer not null check(duration_minutes between 15 and 480),
  price_cents bigint not null check(price_cents>=0), active boolean not null default true
);
create table public.professional_services (
  professional_id uuid references public.professionals(id), service_id text references public.services(id),
  primary key(professional_id,service_id)
);
create table public.working_hours (
  id uuid primary key default gen_random_uuid(), professional_id uuid not null references public.professionals(id),
  weekday integer not null check(weekday between 0 and 6), opens time not null, closes time not null,
  check(opens<closes), unique(professional_id,weekday,opens)
);
create table public.schedule_blocks (
  id uuid primary key default gen_random_uuid(), professional_id uuid not null references public.professionals(id),
  starts_at timestamptz not null, ends_at timestamptz not null, check(starts_at<ends_at)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  professional_id uuid not null references public.professionals(id), service_id text not null references public.services(id),
  starts_at timestamptz not null, ends_at timestamptz not null,
  status text not null default 'confirmado' check(status in ('confirmado','completado','cancelado','ausente')),
  request_key uuid not null, created_at timestamptz not null default now(), check(starts_at<ends_at),
  unique(customer_id,request_key),
  exclude using gist(professional_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(status<>'cancelado')
);
create index on public.appointments(customer_id,starts_at);
create table public.audit_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id),
  action text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
create table public.loyalty_stamps (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  appointment_id uuid not null unique references public.appointments(id), created_at timestamptz not null default now()
);
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
  milestone integer not null check(milestone in (6,8,15)), actor_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), unique(customer_id,milestone)
);
create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(), appointment_id uuid not null references public.appointments(id),
  kind text not null check(kind in ('confirmation','reminder','studio')),
  channel text not null check(channel in ('whatsapp','email')), due_at timestamptz not null,
  state text not null default 'pending' check(state in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0, lease_until timestamptz, lease_token uuid, last_error text,
  unique(appointment_id,kind,channel)
);
create index on public.notification_jobs(state,due_at);

create function public.can_manage_professional(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_admin() or exists(select 1 from public.professionals p join public.profiles u on u.id=p.user_id where p.id=p_id and p.user_id=auth.uid() and u.role='profesional')
$$;
create function public.book_appointment(p_service text,p_professional uuid,p_start timestamptz,p_key uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_duration integer; v_end timestamptz; v_local timestamp; v_id uuid; v_profile public.profiles;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select id into v_id from public.appointments where customer_id=auth.uid() and request_key=p_key;
  if v_id is not null then return v_id; end if;
  if p_start<=now() or p_start>now()+interval '90 days' then raise exception 'invalid date'; end if;
  -- Same lock is used by schedule mutation functions: no availability/write race.
  perform pg_advisory_xact_lock(hashtextextended(p_professional::text,0));
  select s.duration_minutes into v_duration from public.services s
    join public.professional_services ps on ps.service_id=s.id
    join public.professionals p on p.id=ps.professional_id
    where s.id=p_service and p.id=p_professional and s.active and p.active;
  if v_duration is null then raise exception 'unavailable service'; end if;
  v_end:=p_start+make_interval(mins=>v_duration); v_local:=p_start at time zone 'America/Argentina/Buenos_Aires';
  if not exists(select 1 from public.working_hours w where w.professional_id=p_professional
    and w.weekday=extract(dow from v_local) and v_local::time>=w.opens
    and (v_end at time zone 'America/Argentina/Buenos_Aires')::date=v_local::date
    and (v_end at time zone 'America/Argentina/Buenos_Aires')::time<=w.closes) then raise exception 'outside working hours'; end if;
  if exists(select 1 from public.schedule_blocks b where b.professional_id=p_professional and b.starts_at<v_end and b.ends_at>p_start) then raise exception 'blocked'; end if;
  insert into public.appointments(customer_id,professional_id,service_id,starts_at,ends_at,request_key)
    values(auth.uid(),p_professional,p_service,p_start,v_end,p_key) returning id into v_id;
  select * into v_profile from public.profiles where id=auth.uid();
  insert into public.notification_jobs(appointment_id,kind,channel,due_at) values(v_id,'studio','whatsapp',now()),(v_id,'studio','email',now());
  if v_profile.whatsapp_consent and v_profile.phone<>'' then
    insert into public.notification_jobs(appointment_id,kind,channel,due_at) values(v_id,'confirmation','whatsapp',now());
    if p_start-interval '24 hours'>now() then insert into public.notification_jobs(appointment_id,kind,channel,due_at) values(v_id,'reminder','whatsapp',p_start-interval '24 hours'); end if;
  end if;
  if v_profile.email_consent and v_profile.email<>'' then
    insert into public.notification_jobs(appointment_id,kind,channel,due_at) values(v_id,'confirmation','email',now());
    if p_start-interval '24 hours'>now() then insert into public.notification_jobs(appointment_id,kind,channel,due_at) values(v_id,'reminder','email',p_start-interval '24 hours'); end if;
  end if;
  insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'book',v_id);
  return v_id;
end $$;

create function public.availability_busy(p_professional uuid,p_date date)
returns table(starts_at timestamptz,ends_at timestamptz) language sql stable security definer set search_path='' as $$
  select a.starts_at,a.ends_at from public.appointments a where a.professional_id=p_professional and a.status<>'cancelado'
    and a.starts_at<(p_date+1)::timestamp at time zone 'America/Argentina/Buenos_Aires'
    and a.ends_at>p_date::timestamp at time zone 'America/Argentina/Buenos_Aires'
  union all select b.starts_at,b.ends_at from public.schedule_blocks b where b.professional_id=p_professional
    and b.starts_at<(p_date+1)::timestamp at time zone 'America/Argentina/Buenos_Aires'
    and b.ends_at>p_date::timestamp at time zone 'America/Argentina/Buenos_Aires'
$$;
create function public.cancel_appointment(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id=p_id for update;
  if a.id is null or auth.uid() is null or not(a.customer_id=auth.uid() or public.can_manage_professional(a.professional_id)) then raise exception 'forbidden'; end if;
  if a.status<>'confirmado' or a.starts_at<=now() then raise exception 'invalid state'; end if;
  update public.appointments set status='cancelado' where id=p_id;
  update public.notification_jobs set state='cancelled' where appointment_id=p_id and state in ('pending','processing');
  insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'cancel',p_id);
end $$;
create function public.complete_appointment(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.appointments;
begin
  select * into a from public.appointments where id=p_id for update;
  if a.id is null or not public.can_manage_professional(a.professional_id) then raise exception 'forbidden'; end if;
  if a.status='completado' then return; end if;
  if a.status<>'confirmado' or a.ends_at>now() then raise exception 'visit has not ended'; end if;
  update public.appointments set status='completado' where id=p_id;
  insert into public.loyalty_stamps(customer_id,appointment_id) values(a.customer_id,p_id) on conflict(appointment_id) do nothing;
  update public.notification_jobs set state='cancelled' where appointment_id=p_id and kind='reminder' and state in ('pending','processing');
  insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'complete',p_id);
end $$;
create function public.redeem_reward(p_customer uuid,p_milestone integer) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  perform 1 from public.profiles where id=p_customer for update;
  if p_milestone not in (6,8,15) or (select count(*) from public.loyalty_stamps where customer_id=p_customer)<p_milestone then raise exception 'milestone not reached'; end if;
  insert into public.reward_redemptions(customer_id,milestone,actor_id) values(p_customer,p_milestone,auth.uid()) returning id into v_id;
  return v_id;
end $$;

-- RLS is enabled for every exposed table. Direct writes to transactional tables are forbidden.
alter table public.profiles enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
grant select on public.profiles to authenticated;
grant update(full_name,phone,whatsapp_consent,email_consent) on public.profiles to authenticated;

alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.schedule_blocks enable row level security;
create policy professionals_read on public.professionals for select using(active or public.is_admin());
create policy services_read on public.services for select using(active or public.is_admin());
create policy professional_services_read on public.professional_services for select using(true);
create policy working_hours_read on public.working_hours for select using(true);
create policy blocks_read on public.schedule_blocks for select to authenticated using(public.can_manage_professional(professional_id));
grant select on public.professionals,public.services,public.professional_services,public.working_hours to anon,authenticated;
grant select on public.schedule_blocks to authenticated;

alter table public.appointments enable row level security;
alter table public.loyalty_stamps enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.audit_events enable row level security;
alter table public.notification_jobs enable row level security;
create policy appointments_read on public.appointments for select to authenticated using(customer_id=auth.uid() or public.can_manage_professional(professional_id));
create policy stamps_read on public.loyalty_stamps for select to authenticated using(customer_id=auth.uid() or public.is_admin());
create policy rewards_read on public.reward_redemptions for select to authenticated using(customer_id=auth.uid() or public.is_admin());
create policy audit_read on public.audit_events for select to authenticated using(public.is_admin());
grant select on public.appointments,public.loyalty_stamps,public.reward_redemptions,public.audit_events to authenticated;
grant usage on schema public to anon,authenticated,service_role;
grant all on all tables in schema public to service_role;

-- Functions default to PUBLIC EXECUTE in Postgres: revoke explicitly.
revoke all on function public.create_profile() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.can_manage_professional(uuid) from public;
revoke all on function public.book_appointment(text,uuid,timestamptz,uuid) from public;
revoke all on function public.cancel_appointment(uuid) from public;
revoke all on function public.complete_appointment(uuid) from public;
revoke all on function public.redeem_reward(uuid,integer) from public;
revoke all on function public.availability_busy(uuid,date) from public;
grant execute on function public.is_admin(),public.can_manage_professional(uuid) to anon,authenticated;
grant execute on function public.book_appointment(text,uuid,timestamptz,uuid),public.cancel_appointment(uuid),public.complete_appointment(uuid),public.redeem_reward(uuid,integer) to authenticated;
grant execute on function public.availability_busy(uuid,date) to anon,authenticated;
commit;
