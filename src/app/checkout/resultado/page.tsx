import {PlatformShell,ConfigurationNotice} from '../../../components/platform-shell';
import {PurchaseEvent} from '../../../components/purchase-event';
import {supabaseConfig} from '../../../lib/config';
import {requireIdentity} from '../../../server/auth';
import {money} from '../../../data/products';
import {z} from 'zod';
export const metadata={title:'Estado de tu compra | Lumière',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{order?:string}>}){
 if(!supabaseConfig())return <PlatformShell title="Tu compra"><ConfigurationNotice/></PlatformShell>;
 const {db,user}=await requireIdentity();const params=await searchParams;const id=z.uuid().safeParse(params.order);
 if(!id.success)return <PlatformShell title="Tu compra"><p>No se encontró el pedido.</p></PlatformShell>;
 const {data:order,error}=await db.from('orders').select('id,status,total_cents,analytics_consent,order_items(product_id,name,price_cents,quantity)').eq('id',id.data).eq('customer_id',user.id).single();
 if(error||!order)return <PlatformShell title="Tu compra"><p>No se encontró el pedido.</p></PlatformShell>;
 const paid=order.status==='paid';
 const statuses:Record<string,string>={paid:'Pago verificado. Coordiná el retiro con el estudio.',pending:'Estamos esperando la confirmación del pago. Volvé a consultar esta página en unos instantes.',expired:'La reserva de stock venció. Si realizaste un pago, contactá al estudio.',paid_review:'Recibimos el pago después del vencimiento. El estudio debe verificar el stock antes de entregar el pedido.',partially_refunded:'Este pago tiene un reembolso parcial. Coordiná los detalles del pedido con el estudio.',refunded:'Este pago fue reembolsado o contracargado.'};
 return <PlatformShell title="Estado de tu compra">
   <section className="platform-card"><p>{statuses[order.status]||'Pedido en revisión'}</p><p>Pedido: {order.id}</p><strong>{money(Number(order.total_cents))}</strong><p>Esta pantalla muestra el estado guardado por el servidor; la redirección de Mercado Pago no confirma el cobro.</p></section>
   {paid&&order.analytics_consent&&<PurchaseEvent event={{
     event:'purchase',event_id:`purchase:${order.id}`,
     ecommerce:{currency:'ARS',value:Number(order.total_cents)/100,transaction_id:order.id,items:order.order_items.map(i=>({item_id:i.product_id,item_name:i.name,price:Number(i.price_cents)/100,quantity:i.quantity}))}
   }}/>}
 </PlatformShell>;
}
