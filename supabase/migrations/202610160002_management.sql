begin;
create function public.manage_professional(p_name text,p_user uuid default null) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 if length(trim(p_name)) not between 2 and 120 then raise exception 'invalid name'; end if;
 if p_user is not null and not exists(select 1 from public.profiles where id=p_user and role='profesional') then raise exception 'invalid professional account'; end if;
 insert into public.professionals(name,user_id) values(trim(p_name),p_user) returning id into v_id; return v_id;
end $$;
create function public.manage_hours(p_professional uuid,p_weekday integer,p_opens time,p_closes time) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_professional::text,0));
 delete from public.working_hours where professional_id=p_professional and weekday=p_weekday;
 insert into public.working_hours(professional_id,weekday,opens,closes) values(p_professional,p_weekday,p_opens,p_closes);
end $$;
create function public.assign_service(p_professional uuid,p_service text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'forbidden'; end if;
 insert into public.professional_services values(p_professional,p_service) on conflict do nothing;
end $$;
revoke all on function public.manage_professional(text,uuid),public.manage_hours(uuid,integer,time,time),public.assign_service(uuid,text) from public;
grant execute on function public.manage_professional(text,uuid),public.manage_hours(uuid,integer,time,time),public.assign_service(uuid,text) to authenticated;
commit;
