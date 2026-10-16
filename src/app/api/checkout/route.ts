import {z} from 'zod';
import {createHash} from 'node:crypto';
import {apiIdentity,failure,HttpError} from '../../../server/http';
import {quoteCart} from '../../../domain/commerce';
import {siteUrl} from '../../../lib/config';
import {adminClient} from '../../../lib/supabase/admin';
import {createPreference,paymentEnabled} from '../../../integrations/mercadopago';
export async function POST(request:Request){
  try{
    const {db,profile}=await apiIdentity(request);const site=siteUrl();
    if(!paymentEnabled()||!site||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new HttpError(503,'Los pagos online todavía no están habilitados');
    if(!profile.full_name||!profile.phone)throw new HttpError(400,'Completá tu perfil antes de comprar');
    const input=z.object({lines:z.unknown(),key:z.uuid(),consent:z.boolean().default(false),consentToken:z.uuid().optional()}).parse(await request.json());
    if(input.consent&&!input.consentToken)throw new HttpError(400,'Revisá las preferencias de privacidad');
    const quote=quoteCart(input.lines);
    const {data:id,error}=await db.rpc('create_order',{p_lines:quote.items.map(i=>({id:i.id,quantity:i.quantity})),p_key:input.key,p_consent:input.consent,p_consent_hash:input.consentToken?createHash('sha256').update(input.consentToken).digest('hex'):null});
    if(error)throw new HttpError(409,'No hay stock confirmado para tu carrito o tenés pedidos pendientes. Consultá con el estudio.');
    const {data:order,error:loadError}=await db.from('orders').select('id,status,expires_at,checkout_url,order_items(product_id,name,quantity,price_cents)').eq('id',id).single();
    if(loadError||!order||order.status!=='pending'||Date.parse(order.expires_at)<=Date.now())throw new HttpError(409,'Este pedido ya no está disponible');
    if(order.checkout_url)return Response.json({url:order.checkout_url});
    const admin=adminClient();
    const now=new Date().toISOString();const lease=new Date(Date.now()+120000).toISOString();
    const {data:claimed,error:claimError}=await admin.from('orders').update({checkout_lease_until:lease}).eq('id',id).eq('status','pending').gt('expires_at',now).is('checkout_url',null).or(`checkout_lease_until.is.null,checkout_lease_until.lt.${now}`).select('id').maybeSingle();
    if(claimError||!claimed)throw new HttpError(409,'El pago se está preparando. Intentá nuevamente en unos instantes.');
    try{
      const preference=await createPreference({id:order.id,expires_at:order.expires_at,items:order.order_items},site);
      const {data:saved,error:saveError}=await admin.from('orders').update({preference_id:preference.id,checkout_url:preference.url,checkout_lease_until:null}).eq('id',id).eq('status','pending').gt('expires_at',new Date().toISOString()).eq('checkout_lease_until',lease).select('id').maybeSingle();
      if(saveError||!saved)throw new HttpError(409,'El pedido venció o cambió mientras se preparaba el pago. No continúes con ese enlace.');
      return Response.json({url:preference.url});
    }catch(error){await admin.from('orders').update({checkout_lease_until:null}).eq('id',id).eq('checkout_lease_until',lease);throw error;}
  }catch(error){return failure(error);}
}
