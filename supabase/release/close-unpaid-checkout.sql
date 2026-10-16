-- Ejecutar en SQL Editor ANTES de publicar Supabase en la web de revisión.
-- No repite migraciones ni seeds. Si falta el esquema esperado, no cambia nada.
begin;
do $$
begin
  if to_regprocedure('public.book_appointment(text,uuid,timestamptz,uuid)') is null
     or to_regprocedure('public._book_appointment_v1(text,uuid,timestamptz,uuid)') is null
     or to_regprocedure('public.create_order(jsonb,uuid,boolean,text)') is null
     or to_regprocedure('public._create_order_v1(jsonb,uuid,boolean)') is null
     or to_regclass('public.tracking_receipts') is null
     or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='payment_updated_at') then
    raise exception 'El esquema no coincide con la migracion 007. Revisar lo aplicado antes de continuar.';
  end if;
end $$;

-- Sin pago de seña verificado, no se permite crear turnos por RPC directa.
-- Sin pagos ni worker de vencimiento, tampoco se permite reservar stock por RPC.
revoke all on function public.book_appointment(text,uuid,timestamptz,uuid),
  public._book_appointment_v1(text,uuid,timestamptz,uuid),
  public.create_order(jsonb,uuid,boolean,text),
  public._create_order_v1(jsonb,uuid,boolean)
  from public, anon, authenticated;

do $$
begin
  if has_function_privilege('authenticated','public.book_appointment(text,uuid,timestamptz,uuid)','execute')
     or has_function_privilege('anon','public.book_appointment(text,uuid,timestamptz,uuid)','execute')
     or has_function_privilege('authenticated','public._book_appointment_v1(text,uuid,timestamptz,uuid)','execute')
     or has_function_privilege('authenticated','public.create_order(jsonb,uuid,boolean,text)','execute')
     or has_function_privilege('anon','public.create_order(jsonb,uuid,boolean,text)','execute')
     or has_function_privilege('authenticated','public._create_order_v1(jsonb,uuid,boolean)','execute')
     or has_table_privilege('authenticated','public.appointments','insert')
     or has_table_privilege('anon','public.appointments','insert')
     or has_table_privilege('authenticated','public.orders','insert')
     or has_table_privilege('anon','public.orders','insert') then
    raise exception 'Hay privilegios inesperados de creacion. Revisar ACL antes de publicar.';
  end if;
end $$;
commit;

select
  has_function_privilege('authenticated','public.book_appointment(text,uuid,timestamptz,uuid)','execute') as reservas_habilitadas,
  has_function_privilege('authenticated','public.create_order(jsonb,uuid,boolean,text)','execute') as pedidos_habilitados;
-- Ambos valores deben ser false. No volver a concederlos hasta integrar los pagos.
