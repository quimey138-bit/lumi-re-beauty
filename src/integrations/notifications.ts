import 'server-only';
import {z} from 'zod';
export class NotConfigured extends Error {}
export type Notification={id:string;kind:'confirmation'|'reminder'|'studio';channel:'whatsapp'|'email';name:string;service:string;professional:string;when:string;phone:string;email:string};
export async function deliverNotification(n:Notification){
  if(n.channel==='whatsapp'){
    const template=n.kind==='reminder'?process.env.WHATSAPP_REMINDER_TEMPLATE:n.kind==='studio'?process.env.WHATSAPP_STUDIO_TEMPLATE:process.env.WHATSAPP_CONFIRMATION_TEMPLATE;
    const token=process.env.WHATSAPP_ACCESS_TOKEN;const sender=process.env.WHATSAPP_PHONE_NUMBER_ID;const version=process.env.WHATSAPP_GRAPH_VERSION;
    if(!template||!token||!sender||!version||!/^v\d+\.\d+$/.test(version)||!/^\d+$/.test(sender))throw new NotConfigured();
    const to=n.kind==='studio'?process.env.STUDIO_WHATSAPP:n.phone;
    if(!to)throw new NotConfigured();
    const parameters=(n.kind==='studio'?[n.name,n.service,n.professional,n.when,n.phone]:[n.name,n.service,n.when]).map(text=>({type:'text',text}));
    const response=await fetch(`https://graph.facebook.com/${version}/${sender}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:to.replace(/\D/g,''),type:'template',template:{name:template,language:{code:process.env.WHATSAPP_TEMPLATE_LANGUAGE||'es_AR'},components:[{type:'body',parameters}]}}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('provider_error');
    return z.object({messages:z.array(z.object({id:z.string().min(1)})).min(1)}).parse(await response.json()).messages[0].id;
  }else{
    const key=process.env.RESEND_API_KEY;const from=process.env.EMAIL_FROM;const to=n.kind==='studio'?process.env.STUDIO_EMAIL:n.email;
    if(!key||!from||!to)throw new NotConfigured();
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':n.id},body:JSON.stringify({from,to:[to],subject:n.kind==='reminder'?'Recordatorio de tu turno Lumière':'Turno confirmado en Lumière',text:`${n.name}, ${n.service} con ${n.professional}. ${n.when}.${n.kind==='studio'?` Contacto de la clienta: ${n.phone}`:''}`}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('provider_error');
    return z.object({id:z.string().min(1)}).parse(await response.json()).id;
  }
}
