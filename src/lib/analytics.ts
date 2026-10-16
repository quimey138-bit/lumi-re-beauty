type EventName = 'view_item'|'add_to_cart'|'begin_checkout'|'purchase'|'schedule_appointment'|'claim_reward';
type Item = {item_id:string;item_name:string;price:number;quantity:number};
export type CommerceEvent = { event:EventName;event_id:string;ecommerce?:{currency:'ARS';value:number;items:Item[];transaction_id?:string} };
declare global { interface Window { dataLayer?:Record<string,unknown>[]; fbq?:(...args:unknown[])=>void; gtag?:(...args:unknown[])=>void; } }
export function track(event:CommerceEvent) {
  if (typeof window==='undefined') return false;
  try {if(localStorage.getItem('lumiere-consent')!=='granted')return false;} catch {return false;}
  window.dataLayer ||= [];
  if (event.ecommerce) window.dataLayer.push({ ecommerce:null });
  window.dataLayer.push(event);
  const pixelEvent = {view_item:'ViewContent',add_to_cart:'AddToCart',begin_checkout:'InitiateCheckout',purchase:'Purchase',schedule_appointment:'Schedule',claim_reward:'ClaimReward'}[event.event];
  try {
    if(!process.env.NEXT_PUBLIC_GTM_ID)window.gtag?.('event',event.event,{...event.ecommerce,event_id:event.event_id});
    window.fbq?.(event.event==='claim_reward'?'trackCustom':'track',pixelEvent,{currency:'ARS',value:event.ecommerce?.value},{eventID:event.event_id});
  } catch { /* Third-party tracking must not interrupt a successful transaction. */ }
  return true;
}
