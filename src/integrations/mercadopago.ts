import 'server-only';
import { z } from 'zod';
const base='https://api.mercadopago.com';
export function paymentEnabled(){return process.env.MERCADOPAGO_ENABLED==='true'&&!!process.env.MERCADOPAGO_ACCESS_TOKEN&&!!process.env.MERCADOPAGO_WEBHOOK_SECRET;}
async function mp(path:string,options:RequestInit={}){
  const token=process.env.MERCADOPAGO_ACCESS_TOKEN;if(!token)throw new Error('Pagos pendientes de configuración');
  const response=await fetch(base+path,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('El proveedor de pagos no respondió correctamente');return response.json();
}
export async function createPreference(order:{id:string;expires_at:string;items:{product_id:string;name:string;quantity:number;price_cents:number}[]},site:string){
  const data=await mp('/checkout/preferences',{method:'POST',headers:{'X-Idempotency-Key':order.id},body:JSON.stringify({
    external_reference:order.id,items:order.items.map(i=>({id:i.product_id,title:i.name,quantity:i.quantity,currency_id:'ARS',unit_price:Number(i.price_cents)/100})),
    back_urls:{success:`${site}/checkout/resultado?order=${order.id}`,pending:`${site}/checkout/resultado?order=${order.id}`,failure:`${site}/checkout/resultado?order=${order.id}`},
    notification_url:`${site}/api/webhooks/mercadopago`,binary_mode:true,expires:true,expiration_date_to:order.expires_at,
  })});
  const mode=process.env.MERCADOPAGO_LIVE_MODE==='true';
  const result=z.object({id:z.string(),init_point:z.url(),sandbox_init_point:z.url().optional()}).parse(data);
  const url=mode?result.init_point:result.sandbox_init_point;
  if(!url||!new URL(url).hostname.endsWith('.mercadopago.com.ar'))throw new Error('URL de pago inválida');
  return {id:result.id,url};
}
export async function verifiedPayment(id:string){
  const [payment,account]=await Promise.all([mp(`/v1/payments/${encodeURIComponent(id)}`),mp('/users/me')]);
  const result=z.object({id:z.union([z.number(),z.string()]),external_reference:z.uuid(),status:z.string(),transaction_amount:z.number().nonnegative(),transaction_amount_refunded:z.number().nonnegative().default(0),date_last_updated:z.iso.datetime({offset:true}).optional(),currency_id:z.string(),collector_id:z.number(),live_mode:z.boolean()}).parse(payment);
  if(String(result.id)!==id||result.collector_id!==account.id||result.live_mode!==(process.env.MERCADOPAGO_LIVE_MODE==='true'))throw new Error('El pago no corresponde a la cuenta o al entorno esperado');
  return result;
}
