import {timingSafeEqual} from 'node:crypto';
import {adminClient} from '../../../../lib/supabase/admin';
import {deliverNotification,NotConfigured} from '../../../../integrations/notifications';
import {sendPurchase} from '../../../../integrations/meta';
import {siteUrl} from '../../../../lib/config';
export const maxDuration=120;
export async function GET(request:Request){
  const secret=process.env.CRON_SECRET;const value=request.headers.get('authorization')||'';const expected=`Bearer ${secret}`;
  if(!secret||Buffer.byteLength(value)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(value),Buffer.from(expected)))return Response.json({error:'Unauthorized'},{status:401});
  try{
    const db=adminClient();const expired=await db.rpc('expire_orders');if(expired.error)throw expired.error;
    const jobs=await db.rpc('claim_notifications',{p_limit:3});if(jobs.error)throw jobs.error;
    let sent=0,pending=0,cancelled=0;
    for(const job of jobs.data||[]){
      let result='provider_error';
      try{
        const {data:a,error}=await db.from('appointments').select('status,revision,starts_at,profiles!appointments_customer_id_fkey(full_name,phone,email,whatsapp_consent,email_consent),services(name),professionals(name)').eq('id',job.appointment_id).single();
        if(error||!a)throw new Error('record_unavailable');
        // Recheck current state and consent immediately before delivery.
        const profile=a.profiles as unknown as {full_name:string;phone:string;email:string;whatsapp_consent:boolean;email_consent:boolean};
        const service=a.services as unknown as {name:string};const professional=a.professionals as unknown as {name:string};
        const allowed=job.kind==='studio'||(job.channel==='whatsapp'?profile.whatsapp_consent:profile.email_consent);
        const live=await db.from('notification_jobs').select('id').eq('id',job.id).eq('state','processing').eq('lease_token',job.lease_token).gt('lease_until',new Date().toISOString()).maybeSingle();
        if(live.error)throw live.error;
        if(!live.data||a.revision!==job.revision||a.status!=='confirmado'||!allowed||(job.kind==='reminder'&&Date.parse(a.starts_at)<=Date.now())){result='cancelled';cancelled++;}
        else{await deliverNotification({id:job.id,kind:job.kind,channel:job.channel,name:profile.full_name,phone:profile.phone,email:profile.email,service:service.name,professional:professional.name,when:new Date(a.starts_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'long',timeStyle:'short'})});result='sent';sent++;}
      }catch(error){if(error instanceof NotConfigured){result='not_configured';pending++;}}
      const finished=await db.rpc('finish_notification',{p_id:job.id,p_token:job.lease_token,p_result:result});if(finished.error)throw finished.error;
    }
    const conversions=await db.rpc('claim_conversions',{p_limit:3});if(conversions.error)throw conversions.error;
    for(const job of conversions.data||[]){
      let result='provider_error';
      try{
        const {data:order,error}=await db.from('orders').select('id,customer_id,status,total_cents,paid_at,analytics_consent,order_items(product_id,quantity,price_cents)').eq('id',job.order_id).single();
        if(error||!order)throw new Error('record_unavailable');
        if(order.status!=='paid'||!order.analytics_consent)result='cancelled';
        else {
          const live=await db.from('conversion_jobs').select('id').eq('id',job.id).eq('state','processing').eq('lease_token',job.lease_token).gt('lease_until',new Date().toISOString()).maybeSingle();
          const consent=await db.from('orders').select('id').eq('id',order.id).eq('status','paid').eq('analytics_consent',true).maybeSingle();
          if(live.error||consent.error)throw new Error('record_unavailable');
          if(!live.data||!consent.data)result='cancelled';
          else{const site=siteUrl();if(!site)throw new NotConfigured();await sendPurchase(order,site);result='sent';}
        }
      }catch(error){if(error instanceof NotConfigured)result='not_configured';}
      const finished=await db.rpc('finish_conversion',{p_id:job.id,p_token:job.lease_token,p_result:result});if(finished.error)throw finished.error;
    }
    return Response.json({sent,pendingConfiguration:pending,cancelled,expiredOrders:expired.data},{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'Worker unavailable'},{status:503});}
}
