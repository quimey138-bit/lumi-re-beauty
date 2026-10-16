import { beforeAll, afterAll, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { readFileSync,readdirSync } from 'node:fs';

const db = new PGlite({ extensions: { btree_gist } });
const customer = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const professional = '44444444-4444-4444-8444-444444444444';
async function asUser(id: string, sql: string) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${id}', false);`);
  try { return await db.exec(sql); } finally { await db.exec('reset role'); }
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to anon,authenticated,service_role;
    create schema auth; create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
  for(const file of readdirSync('supabase/migrations').sort()) await db.exec(readFileSync(`supabase/migrations/${file}`, 'utf8'));
  await db.exec(`insert into auth.users(id,email) values ('${customer}','a@example.test'),('${other}','b@example.test'),('${admin}','c@example.test');
    update public.profiles set role='admin' where id='${admin}';
    insert into public.professionals(id,name) values ('${professional}','Profesional de prueba');
    insert into public.services(id,name,duration_minutes,price_cents) values ('test','Servicio de prueba',60,100000);
    insert into public.professional_services values ('${professional}','test');
    insert into public.working_hours(professional_id,weekday,opens,closes) select '${professional}',n,'09:00','18:00' from generate_series(0,6) n;`);
// WASM/Postgres initialization and seven migrations can exceed 30s on Windows.
// Keep assertions unchanged and bound only this integration fixture's startup.
}, 120000);
afterAll(async () => { await db.close(); }, 30000);
it('prevents clients from promoting themselves', async () => {
  await expect(asUser(customer, `update public.profiles set role='admin' where id='${customer}'`)).rejects.toThrow();
});
it('hides another customer profile', async () => {
  const result = await asUser(customer, 'select id from public.profiles');
  expect(result[0].rows).toEqual([{ id: customer }]);
});
it('reserves once, rejects overlap, and does not leak customer data in availability', async () => {
  const day = new Date(Date.now() + 3*86400000).toISOString().slice(0,10);
  const start = `${day}T13:00:00Z`;
  await asUser(customer, `select public.book_appointment('test','${professional}','${start}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`);
  await expect(asUser(other, `select public.book_appointment('test','${professional}','${start}','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)).rejects.toThrow();
  const own = await asUser(other, 'select id from public.appointments');
  expect(own[0].rows).toEqual([]);
});
it('blocks unverified visit stamps and awards exactly one stamp per completed visit', async () => {
  const appointment = await db.query<{id:string}>('select id from public.appointments limit 1');
  const id = appointment.rows[0].id;
  await expect(asUser(customer, `select public.complete_appointment('${id}')`)).rejects.toThrow();
  await expect(asUser(admin, `select public.complete_appointment('${id}')`)).rejects.toThrow();
  await db.exec(`update public.appointments set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id='${id}'`);
  await asUser(admin, `select public.complete_appointment('${id}')`);
  await asUser(admin, `select public.complete_appointment('${id}')`);
  const stamps = await asUser(customer, 'select id from public.loyalty_stamps');
  expect(stamps[0].rows).toHaveLength(1);
});
it('rejects reward claims before the milestone', async () => {
  await expect(asUser(admin, `select public.redeem_reward('${customer}',6)`)).rejects.toThrow();
});
it('refuses checkout before stock has been confirmed', async()=>{
  await db.exec("insert into public.products(id,name,price_cents) values('test-product','Test',950000)");
  await expect(asUser(customer, `select public.create_order('[{"id":"test-product","quantity":1}]','cccccccc-cccc-4ccc-8ccc-cccccccccccc',false)`)).rejects.toThrow();
});
it('prices orders in Postgres, reserves stock once and rejects overselling', async()=>{
  await asUser(admin,"select public.set_product_stock('test-product',2)");
  const query=`select public.create_order('[{"id":"test-product","quantity":2,"price":1}]','dddddddd-dddd-4ddd-8ddd-dddddddddddd',false)`;
  await asUser(customer,query);await asUser(customer,query);
  const order=await db.query<{total_cents:number}>('select total_cents from public.orders');
  expect(Number(order.rows[0].total_cents)).toBe(1900000);
  await expect(asUser(other,`select public.create_order('[{"id":"test-product","quantity":1}]','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',false)`)).rejects.toThrow();
});
it('does not let a client acknowledge payment or mutate stock', async()=>{
  await expect(asUser(customer,"update public.products set stock=100 where id='test-product'")).rejects.toThrow();
  await expect(asUser(customer,"select public.settle_order(gen_random_uuid(),'fake',1900000,'ARS','approved')")).rejects.toThrow();
});
it('rejects amount mismatches and handles repeated approved payments once', async()=>{
  const {rows}=await db.query<{id:string}>('select id from public.orders limit 1');const id=rows[0].id;
  await expect(db.exec(`select public.settle_order('${id}','p1',1,'ARS','approved')`)).rejects.toThrow();
  await db.exec(`select public.settle_order('${id}','p1',1900000,'ARS','approved'); select public.settle_order('${id}','p1',1900000,'ARS','approved')`);
  const paid=await db.query<{status:string}>(`select status from public.orders where id='${id}'`);
  expect(paid.rows[0].status).toBe('paid');
});
it('keeps unconfigured notifications pending and cancels jobs when a booking is cancelled',async()=>{
  const jobs=await db.query<{id:string;lease_token:string}>('select * from public.claim_notifications(3)');
  expect(jobs.rows.length).toBeGreaterThan(0);
  const job=jobs.rows[0];
  await db.exec(`select public.finish_notification('${job.id}','${job.lease_token}','not_configured')`);
  const pending=await db.query<{state:string;attempts:number}>(`select state,attempts from public.notification_jobs where id='${job.id}'`);
  expect(pending.rows[0]).toEqual({state:'pending',attempts:0});
  const day=new Date(Date.now()+4*86400000).toISOString().slice(0,10);
  const created=await asUser(customer,`select public.book_appointment('test','${professional}','${day}T13:00:00Z','ffffffff-ffff-4fff-8fff-ffffffffffff') as id`);
  const id=created[0].rows[0].id;
  await asUser(customer,`select public.cancel_appointment('${id}')`);
  const cancelled=await db.query<{state:string}>(`select state from public.notification_jobs where appointment_id='${id}'`);
  expect(cancelled.rows.every(j=>j.state==='cancelled')).toBe(true);
});
it('does not expose privileged worker/payment functions to anon through inherited grants',async()=>{
  await db.exec('set role anon');
  try{await expect(db.exec('select public.expire_orders()')).rejects.toThrow();}
  finally{await db.exec('reset role');}
});
it('does not leave a crashed fifth notification attempt permanently processing',async()=>{
  await db.exec("update public.notification_jobs set state='processing',attempts=5,lease_until=now()-interval '1 hour' where state='pending'");
  await db.exec('select public.claim_notifications(3)');
  const stuck=await db.query("select id from public.notification_jobs where state='processing' and attempts=5 and lease_until<now()");
  expect(stuck.rows).toEqual([]);
});
it('revokes consent for queued purchases using a private browser receipt',async()=>{
  await db.exec("update public.orders set analytics_consent=true,consent_token_hash=repeat('a',64)");
  await db.exec("select public.revoke_tracking(repeat('a',64))");
  const orders=await db.query<{analytics_consent:boolean}>('select analytics_consent from public.orders');
  expect(orders.rows.every(o=>!o.analytics_consent)).toBe(true);
});
it('reschedules atomically and invalidates previous revision notification jobs',async()=>{
  const day=new Date(Date.now()+5*86400000).toISOString().slice(0,10);
  const created=await asUser(customer,`select public.book_appointment('test','${professional}','${day}T13:00:00Z','abababab-abab-4bab-8bab-abababababab') as id`);
  const id=created[0].rows[0].id;
  await asUser(customer,`select public.reschedule_appointment('${id}','${day}T15:00:00Z')`);
  const appointment=await db.query<{revision:number;starts_at:Date}>(`select revision,starts_at from public.appointments where id='${id}'`);
  expect(appointment.rows[0].revision).toBe(1);
  const old=await db.query<{state:string}>(`select state from public.notification_jobs where appointment_id='${id}' and revision=0`);
  expect(old.rows.every(j=>j.state==='cancelled')).toBe(true);
  await expect(asUser(other,`select public.reschedule_appointment('${id}','${day}T16:00:00Z')`)).rejects.toThrow();
});
it('only an admin can grant professional access and admin accounts cannot be demoted through that operation',async()=>{
  await expect(asUser(customer,`select public.set_staff_role('${other}','profesional')`)).rejects.toThrow();
  await asUser(admin,`select public.set_staff_role('${other}','profesional')`);
  await asUser(admin,`select public.set_staff_role('${other}','cliente');select public.set_staff_role('${other}','profesional')`);
  await expect(asUser(admin,`select public.set_staff_role('${admin}','cliente')`)).rejects.toThrow();
  await db.exec(`update public.professionals set user_id='${other}' where id='${professional}'; update public.profiles set full_name='Cliente de prueba',phone='+5491155555555' where id='${customer}'`);
  const {rows}=await db.query<{id:string}>(`select id from public.appointments where customer_id='${customer}' limit 1`);
  const contacts=await asUser(other,`select * from public.appointment_contacts(array['${rows[0].id}']::uuid[])`);
  expect(contacts[0].rows[0]).toMatchObject({full_name:'Cliente de prueba',phone:'+5491155555555'});
  const denied=await asUser(customer,`select * from public.appointment_contacts(array['${rows[0].id}']::uuid[])`);
  expect(denied[0].rows).toEqual([]);
});
it('blocks a future slot and makes it available again after authorized removal',async()=>{
  const day=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  const created=await asUser(admin,`select public.add_schedule_block('${professional}','${day}T13:00:00Z','${day}T14:00:00Z') as id`);
  const id=created[0].rows[0].id;
  await expect(asUser(customer,`select public.book_appointment('test','${professional}','${day}T13:00:00Z',gen_random_uuid())`)).rejects.toThrow();
  await expect(asUser(customer,`select public.remove_schedule_block('${id}')`)).rejects.toThrow();
  await asUser(admin,`select public.remove_schedule_block('${id}')`);
  await asUser(customer,`select public.book_appointment('test','${professional}','${day}T13:00:00Z',gen_random_uuid())`);
});
it('enforces configured reward conditions and lets the customer choose an eligible product once',async()=>{
  await db.exec(`with visits as (insert into public.appointments(customer_id,professional_id,service_id,starts_at,ends_at,status,request_key)
    select '${customer}','${professional}','test',now()-make_interval(days=>n),now()-make_interval(days=>n)+interval '1 hour','completado',gen_random_uuid() from generate_series(10,23) n returning id)
    insert into public.loyalty_stamps(customer_id,appointment_id) select '${customer}',id from visits`);
  await expect(asUser(admin,`select public.redeem_reward('${customer}',6)`)).rejects.toThrow();
  await asUser(admin,"select public.configure_reward_options(6,'Descuento de prueba',10,'{}')");
  await asUser(admin,`select public.redeem_reward('${customer}',6)`);
  await expect(asUser(admin,`select public.redeem_reward('${customer}',6)`)).rejects.toThrow();
  await db.exec("insert into public.products(id,name,price_cents,stock) values('gift-product','Producto a elección',100000,1)");
  await asUser(admin,"select public.configure_reward_options(15,'Elegir producto habilitado',null,array['test-product','gift-product'])");
  await expect(asUser(admin,`select public.redeem_reward('${customer}',15,'not-eligible')`)).rejects.toThrow();
  await asUser(admin,`select public.redeem_reward('${customer}',15,'gift-product')`);
  await expect(asUser(admin,`select public.redeem_reward('${customer}',15,'gift-product')`)).rejects.toThrow();
  const gift=await db.query<{stock:number}>("select stock from public.products where id='gift-product'");
  expect(gift.rows[0].stock).toBe(0);
});
it('remembers revocation that arrives before the order is created',async()=>{
  await asUser(admin,"select public.set_product_stock('test-product',10)");
  const hash='b'.repeat(64);
  await db.exec(`select public.revoke_tracking('${hash}')`);
  const result=await asUser(customer,`select public.create_order('[{"id":"test-product","quantity":1}]',gen_random_uuid(),true,'${hash}') as id`);
  const id=result[0].rows[0].id;
  const {rows}=await db.query<{analytics_consent:boolean;consent_token_hash:string}>(`select analytics_consent,consent_token_hash from public.orders where id='${id}'`);
  expect(rows[0]).toEqual({analytics_consent:false,consent_token_hash:hash});
});
it('does not turn an already refunded payment into a paid order when webhooks arrive out of order',async()=>{
  const created=await asUser(other,`select public.create_order('[{"id":"test-product","quantity":1}]',gen_random_uuid(),false) as id`);
  const id=created[0].rows[0].id;
  await db.exec(`select public.settle_order('${id}','refund-first',950000,'ARS','refunded');select public.settle_order('${id}','refund-first',950000,'ARS','approved')`);
  const {rows}=await db.query<{status:string}>(`select status from public.orders where id='${id}'`);
  expect(rows[0].status).toBe('refunded');
});
it('rejects rescheduling onto an inactive professional',async()=>{
  const {rows}=await db.query<{id:string;starts_at:string}>(`select id,starts_at from public.appointments where customer_id='${customer}' and status='confirmado' limit 1`);
  await db.exec(`update public.professionals set active=false where id='${professional}'`);
  const start=new Date(rows[0].starts_at).toISOString();
  try{await expect(asUser(customer,`select public.reschedule_appointment('${rows[0].id}','${start}')`)).rejects.toThrow();}
  finally{await db.exec(`update public.professionals set active=true where id='${professional}'`);}
});
it('reactivates an associated professional when access is explicitly restored',async()=>{
  await asUser(admin,`select public.set_staff_role('${other}','cliente');select public.set_staff_role('${other}','profesional')`);
  const {rows}=await db.query<{active:boolean}>(`select active from public.professionals where user_id='${other}'`);
  expect(rows[0].active).toBe(true);
});
it('keeps the newest payment snapshot and records partial refunds without increasing stock',async()=>{
  const created=await asUser(other,`select public.create_order('[{"id":"test-product","quantity":1}]',gen_random_uuid(),false) as id`);
  const id=created[0].rows[0].id;
  await db.exec(`select public.settle_order('${id}','partial',950000,'ARS','approved',0,'2026-10-16T13:00:00Z');
    select public.settle_order('${id}','partial',950000,'ARS','approved',100000,'2026-10-16T13:10:00Z');
    select public.settle_order('${id}','partial',950000,'ARS','approved',0,'2026-10-16T13:00:00Z')`);
  const {rows}=await db.query<{status:string;refunded_cents:number}>(`select status,refunded_cents from public.orders where id='${id}'`);
  expect(rows[0].status).toBe('partially_refunded');expect(Number(rows[0].refunded_cents)).toBe(100000);
});

it('closes direct booking and stock reservation RPCs for the unpaid review release', async () => {
  const sql = readFileSync('supabase/release/close-unpaid-checkout.sql', 'utf8');
  await db.exec(sql);
  await db.exec(sql); // Repeating the release guard must be safe.
  await expect(asUser(customer, `select public.book_appointment('test','${professional}',now()+interval '3 days',gen_random_uuid())`)).rejects.toThrow(/permission denied/i);
  await expect(asUser(customer, `select public.create_order('[{"id":"test-product","quantity":1}]',gen_random_uuid(),false)`)).rejects.toThrow(/permission denied/i);
  await expect(asUser(customer, `select public._book_appointment_v1('test','${professional}',now()+interval '3 days',gen_random_uuid())`)).rejects.toThrow(/permission denied/i);
  await expect(asUser(customer, `select public._create_order_v1('[{"id":"test-product","quantity":1}]',gen_random_uuid(),false)`)).rejects.toThrow(/permission denied/i);
  const result = await asUser(customer, 'select id from public.profiles');
  expect(result[0].rows).toEqual([{ id: customer }]);
});
