import { afterEach, it, expect, vi } from 'vitest';
import { deliverNotification, NotConfigured, type Notification } from '../src/integrations/notifications';
import { createPreference, verifiedPayment } from '../src/integrations/mercadopago';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const notification: Notification = { id:'unit-job', kind:'reminder', channel:'whatsapp', name:'Persona de prueba', service:'Servicio de prueba', professional:'Profesional de prueba', when:'20 de octubre, 12:00', phone:'+5491155555555', email:'test@example.test' };
const order = { id:'11111111-1111-4111-8111-111111111111', expires_at:'2026-10-20T15:00:00Z', items:[{product_id:'test-product',name:'Producto de prueba',quantity:2,price_cents:950000}] };

it('does not acknowledge an unconfigured WhatsApp integration', async () => {
  vi.stubEnv('WHATSAPP_ACCESS_TOKEN','');
  await expect(deliverNotification(notification)).rejects.toBeInstanceOf(NotConfigured);
});
function whatsappFixture() {
  vi.stubEnv('WHATSAPP_ACCESS_TOKEN','unit-test-value-not-a-credential');
  vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID','123');
  vi.stubEnv('WHATSAPP_GRAPH_VERSION','v1.0');
  vi.stubEnv('WHATSAPP_REMINDER_TEMPLATE','unit_test_template');
}
it('requires a provider message id before marking WhatsApp as accepted', async () => {
  whatsappFixture();
  vi.stubGlobal('fetch',async () => Response.json({}));
  await expect(deliverNotification(notification)).rejects.toThrow();
});
it('sends a templated WhatsApp reminder to the normalized client number', async () => {
  whatsappFixture();let sent:Record<string,unknown> = {};
  vi.stubGlobal('fetch',async (_url:string,init:RequestInit) => { sent=JSON.parse(String(init.body));return Response.json({messages:[{id:'unit-message'}]}); });
  await deliverNotification(notification);
  expect(sent).toMatchObject({to:'5491155555555',type:'template',template:{name:'unit_test_template',components:[{type:'body',parameters:[{type:'text',text:'Persona de prueba'},{type:'text',text:'Servicio de prueba'},{type:'text',text:'20 de octubre, 12:00'}]}]}});
});
it('rejects email provider errors and missing acceptance ids', async () => {
  vi.stubEnv('RESEND_API_KEY','unit-test-value-not-a-credential');vi.stubEnv('EMAIL_FROM','studio@example.test');
  vi.stubGlobal('fetch',async () => Response.json({error:'test'},{status:429}));
  await expect(deliverNotification({...notification,channel:'email'})).rejects.toThrow();
  vi.stubGlobal('fetch',async () => Response.json({}));
  await expect(deliverNotification({...notification,channel:'email'})).rejects.toThrow();
});
it('uses integer-cent order prices, a stable reference and a sandbox checkout URL', async () => {
  vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN','unit-test-value-not-a-credential');vi.stubEnv('MERCADOPAGO_LIVE_MODE','false');
  let payload:Record<string,unknown> = {};
  vi.stubGlobal('fetch',async (_url:string,init:RequestInit) => {payload=JSON.parse(String(init.body));return Response.json({id:'pref-test',init_point:'https://www.mercadopago.com.ar/checkout/test',sandbox_init_point:'https://sandbox.mercadopago.com.ar/checkout/test'});});
  const preference=await createPreference(order,'https://studio.example.test');
  expect(preference.url).toBe('https://sandbox.mercadopago.com.ar/checkout/test');
  expect(payload).toMatchObject({external_reference:order.id,items:[{id:'test-product',quantity:2,currency_id:'ARS',unit_price:9500}]});
});
it('rejects payment account or environment mismatches after re-querying the provider', async () => {
  vi.stubEnv('MERCADOPAGO_ACCESS_TOKEN','unit-test-value-not-a-credential');vi.stubEnv('MERCADOPAGO_LIVE_MODE','false');
  vi.stubGlobal('fetch',async (url:string) => Response.json(url.endsWith('/users/me')?{id:1}:{id:123,external_reference:order.id,status:'approved',transaction_amount:19000,currency_id:'ARS',collector_id:2,live_mode:false}));
  await expect(verifiedPayment('123')).rejects.toThrow('cuenta');
});
