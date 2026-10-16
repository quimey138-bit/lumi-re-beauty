begin;
create function public.set_staff_role(p_user uuid,p_role text) returns void language plpgsql security definer set search_path='' as $$
declare v_role text;
begin
 if not public.is_admin() or p_role not in('cliente','profesional') then raise exception 'forbidden';end if;
 select role into v_role from public.profiles where id=p_user for update;
 if v_role is null or v_role='admin' then raise exception 'protected or unknown account';end if;
 update public.profiles set role=p_role where id=p_user;
 if p_role='cliente' then update public.professionals set active=false where user_id=p_user;end if;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'set_role_'||p_role,p_user);
end $$;
create function public.remove_schedule_block(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare v_professional uuid;
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 select professional_id into v_professional from public.schedule_blocks where id=p_id for update;
 if v_professional is null then raise exception 'unknown block';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_professional::text,0));
 delete from public.schedule_blocks where id=p_id;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'remove_block',p_id);
end $$;

alter table public.reward_rules add column eligible_product_ids text[] not null default '{}';
update public.reward_rules set eligible_product_ids=array[eligible_product_id] where eligible_product_id is not null;
alter table public.reward_redemptions add column product_id text references public.products(id);
alter table public.reward_redemptions add column conditions_snapshot jsonb not null default '{}';

create function public.configure_reward_options(p_milestone integer,p_conditions text,p_discount integer,p_products text[])
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 if p_milestone not in(6,8,15) or length(trim(p_conditions)) not between 1 and 1000 then raise exception 'invalid conditions';end if;
 if p_milestone=6 and (p_discount is null or p_discount not between 1 and 100) then raise exception 'discount required';end if;
 if p_milestone=15 and (p_products is null or cardinality(p_products)<1) then raise exception 'eligible products required';end if;
 if exists(select 1 from unnest(coalesce(p_products,'{}')) item where not exists(select 1 from public.products where id=item and active)) then raise exception 'unknown eligible product';end if;
 update public.reward_rules set enabled=true,conditions=trim(p_conditions),discount_percent=case when p_milestone=6 then p_discount else null end,
   eligible_product_id=case when p_milestone=15 then p_products[1] else null end,
   eligible_product_ids=case when p_milestone=15 then p_products else '{}' end where milestone=p_milestone;
end $$;
create or replace function public.configure_reward(p_milestone integer,p_conditions text,p_discount integer,p_product text)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform public.configure_reward_options(p_milestone,p_conditions,p_discount,case when p_product is null then '{}'::text[] else array[p_product] end);
end $$;
drop function public.redeem_reward(uuid,integer);
create function public.redeem_reward(p_customer uuid,p_milestone integer,p_product text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;r public.reward_rules;v_stock integer;
begin
 if not public.is_admin() then raise exception 'forbidden';end if;
 select * into r from public.reward_rules where milestone=p_milestone and enabled for share;
 if r.milestone is null then raise exception 'reward not configured';end if;
 perform 1 from public.profiles where id=p_customer for update;
 if (select count(*) from public.loyalty_stamps where customer_id=p_customer)<p_milestone then raise exception 'milestone not reached';end if;
 if exists(select 1 from public.reward_redemptions where customer_id=p_customer and milestone=p_milestone) then raise exception 'already redeemed';end if;
 if p_milestone=15 then
  if p_product is null or not(p_product=any(r.eligible_product_ids)) then raise exception 'ineligible product';end if;
  select stock into v_stock from public.products where id=p_product and active for update;
  if v_stock is null or v_stock<1 then raise exception 'stock unavailable';end if;
  update public.products set stock=stock-1 where id=p_product;
 end if;
 insert into public.reward_redemptions(customer_id,milestone,actor_id,product_id,conditions_snapshot)
 values(p_customer,p_milestone,auth.uid(),case when p_milestone=15 then p_product else null end,jsonb_build_object('conditions',r.conditions,'discount_percent',r.discount_percent,'eligible_product_ids',r.eligible_product_ids)) returning id into v_id;
 insert into public.audit_events(actor_id,action,entity_id) values(auth.uid(),'redeem_reward',v_id);
 return v_id;
end $$;
revoke all on function public.set_staff_role(uuid,text),public.remove_schedule_block(uuid),public.configure_reward_options(integer,text,integer,text[]),public.configure_reward(integer,text,integer,text),public.redeem_reward(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.set_staff_role(uuid,text),public.remove_schedule_block(uuid),public.configure_reward_options(integer,text,integer,text[]),public.configure_reward(integer,text,integer,text),public.redeem_reward(uuid,integer,text) to authenticated;
commit;
