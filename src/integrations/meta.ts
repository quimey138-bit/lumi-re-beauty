import 'server-only';
import {createHash} from 'node:crypto';
import {NotConfigured} from './notifications';
export async function sendPurchase(order:{id:string;customer_id:string;total_cents:number;paid_at:string;order_items:{product_id:string;quantity:number;price_cents:number}[]},site:string){
  const pixel=process.env.NEXT_PUBLIC_META_PIXEL_ID;const token=process.env.META_CAPI_ACCESS_TOKEN;const version=process.env.META_GRAPH_VERSION;
  if(!pixel||!/^\d+$/.test(pixel)||!token||!version||!/^v\d+\.\d+$/.test(version))throw new NotConfigured();
  const response=await fetch(`https://graph.facebook.com/${version}/${pixel}/events`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:token,...(process.env.META_TEST_EVENT_CODE?{test_event_code:process.env.META_TEST_EVENT_CODE}:{}),data:[{event_name:'Purchase',event_time:Math.floor(Date.parse(order.paid_at)/1000),event_id:`purchase:${order.id}`,action_source:'website',event_source_url:`${site}/checkout/resultado`,user_data:{external_id:[createHash('sha256').update(order.customer_id).digest('hex')]},custom_data:{currency:'ARS',value:Number(order.total_cents)/100,order_id:order.id,content_type:'product',contents:order.order_items.map(i=>({id:i.product_id,quantity:i.quantity,item_price:Number(i.price_cents)/100}))}}]}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('provider_error');
}
