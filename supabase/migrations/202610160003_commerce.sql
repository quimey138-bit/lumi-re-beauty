begin;
create table public.products(id text primary key,name text not null,price_cents bigint not null check(price_cents>0),stock integer check(stock>=0),active boolean not null default true);
create table public.orders(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references public.profiles(id),request_key uuid not null,
 total_cents bigint not null check(total_cents>0),currency text not null default 'ARS' check(currency='ARS'),
 status text not null default 'pending' check(status in ('pending','paid','expired','paid_review','refunded')),
 payment_id text unique,preference_id text,checkout_url text,analytics_consent boolean not null default false,
 created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 minutes',unique(customer_id,request_key)
);
create table public.order_items(order_id uuid references public.orders(id),product_id text references public.products(id),name text not null,quantity integer not null check(quantity between 1 and 20),price_cents bigint not null check(price_cents>0),primary key(order_id,product_id));
create table public.conversion_jobs(id uuid primary key default gen_random_uuid(),order_id uuid not null unique references public.orders(id),state text not null default 'pending' check(state in ('pending','processing','sent','failed')),attempts integer not null default 0,due_at timestamptz not null default now(),lease_until timestamptz,lease_token uuid);
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.conversion_jobs enable row level security;
create policy products_read on public.products for select using(active or public.is_admin());
create policy orders_read on public.orders for select to authenticated using(customer_id=auth.uid() or public.is_admin());
create policy items_read on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=auth.uid() or public.is_admin())));
grant select on public.products to anon,authenticated;
grant select on public.orders,public.order_items to authenticated;
grant all on public.products,public.orders,public.order_items,public.conversion_jobs to service_role;

create function public.set_product_stock(p_id text,p_stock integer) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() or p_stock<0 or p_stock>100000 then raise exception 'forbidden or invalid stock'; end if;
 update public.products set stock=p_stock where id=p_id;
 if not found then raise exception 'unknown product'; end if;
end $$;
create function public.create_order(p_lines jsonb,p_key uuid,p_consent boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; line jsonb; product public.products; quantity integer; v_total bigint:=0;
begin
 if auth.uid() is null then raise exception 'unauthorized'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 select id into v_id from public.orders where customer_id=auth.uid() and request_key=p_key;
 if v_id is not null then return v_id; end if;
 if (select count(*) from public.orders where customer_id=auth.uid() and status='pending')>=3 then raise exception 'too many pending orders'; end if;
 if jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines) not between 1 and 30 then raise exception 'invalid cart'; end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(p_lines))<>jsonb_array_length(p_lines) then raise exception 'duplicate product'; end if;
 -- Lock products in stable order before reserving, preventing overselling/deadlocks.
 for line in select value from jsonb_array_elements(p_lines) order by value->>'id' loop
   if jsonb_typeof(line->'quantity')<>'number' or (line->>'quantity')::numeric<>trunc((line->>'quantity')::numeric) then raise exception 'invalid quantity'; end if;
   quantity:=(line->>'quantity')::integer;
   if quantity not between 1 and 20 then raise exception 'invalid quantity'; end if;
   select * into product from public.products where id=line->>'id' and active for update;
   if product.id is null or product.stock is null or product.stock<quantity then raise exception 'stock unavailable'; end if;
   v_total:=v_total+product.price_cents*quantity;
 end loop;
 insert into public.orders(customer_id,request_key,total_cents,analytics_consent) values(auth.uid(),p_key,v_total,coalesce(p_consent,false)) returning id into v_id;
 for line in select value from jsonb_array_elements(p_lines) order by value->>'id' loop
   quantity:=(line->>'quantity')::integer;
   insert into public.order_items(order_id,product_id,name,quantity,price_cents) select v_id,id,name,quantity,price_cents from public.products where id=line->>'id';
   update public.products set stock=stock-quantity where id=line->>'id';
 end loop;
 return v_id;
end $$;
create function public.expire_orders() returns integer language plpgsql security definer set search_path='' as $$
declare o public.orders; n integer:=0;
begin
 for o in select * from public.orders where status='pending' and expires_at<now() order by id for update skip locked loop
   update public.products p set stock=p.stock+i.quantity from public.order_items i where i.order_id=o.id and i.product_id=p.id;
   update public.orders set status='expired' where id=o.id; n:=n+1;
 end loop; return n;
end $$;
create function public.settle_order(p_order uuid,p_payment text,p_amount bigint,p_currency text,p_status text) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
 select * into o from public.orders where id=p_order for update;
 if o.id is null or o.total_cents<>p_amount or p_currency<>'ARS' then raise exception 'payment mismatch'; end if;
 if o.payment_id is not null and o.payment_id<>p_payment then raise exception 'different payment requires manual reconciliation'; end if;
 if p_status='approved' then
   if o.status in ('paid','paid_review','refunded') then return; end if;
   update public.orders set payment_id=p_payment,status=case when o.status='expired' then 'paid_review' else 'paid' end where id=p_order;
   if o.status<>'expired' and o.analytics_consent then insert into public.conversion_jobs(order_id) values(p_order) on conflict do nothing; end if;
 elsif p_status in ('refunded','charged_back') and o.payment_id=p_payment then
   update public.orders set status='refunded' where id=p_order;
 end if;
end $$;
revoke all on function public.set_product_stock(text,integer),public.create_order(jsonb,uuid,boolean),public.expire_orders(),public.settle_order(uuid,text,bigint,text,text) from public;
grant execute on function public.set_product_stock(text,integer),public.create_order(jsonb,uuid,boolean) to authenticated;
grant execute on function public.expire_orders(),public.settle_order(uuid,text,bigint,text,text) to service_role;
commit;
