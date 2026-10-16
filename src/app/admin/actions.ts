'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireIdentity } from '../../server/auth';
export async function manageStudio(_state:{message:string;rewardId?:string},form:FormData):Promise<{message:string;rewardId?:string}> {
  const {db}=await requireIdentity(['admin']);
  try {
    const kind=z.enum(['professional','hours','mapping','product','reward','reward-rule','block','unblock','staff']).parse(form.get('kind'));
    let error;
    let rewardId:string|undefined;
    if(kind==='staff') {
      ({error}=await db.rpc('set_staff_role',{p_user:z.uuid().parse(form.get('user_id')),p_role:z.enum(['cliente','profesional']).parse(form.get('role'))}));
    } else if(kind==='professional') {
      const name=z.string().trim().min(2).max(120).parse(form.get('name'));
      const user=z.union([z.uuid(),z.literal('')]).parse(form.get('user_id')||'');
      ({error}=await db.rpc('manage_professional',{p_name:name,p_user:user||null}));
    } else if(kind==='hours') {
      const professional=z.uuid().parse(form.get('professional'));
      const weekday=z.coerce.number().int().min(0).max(6).parse(form.get('weekday'));
      const opens=z.string().regex(/^\d{2}:\d{2}$/).parse(form.get('opens'));
      const closes=z.string().regex(/^\d{2}:\d{2}$/).parse(form.get('closes'));
      ({error}=await db.rpc('manage_hours',{p_professional:professional,p_weekday:weekday,p_opens:opens,p_closes:closes}));
    } else if(kind==='mapping') {
      ({error}=await db.rpc('assign_service',{p_professional:z.uuid().parse(form.get('professional')),p_service:z.string().min(1).max(80).parse(form.get('service'))}));
    } else if(kind==='product') {
      ({error}=await db.rpc('set_product_stock',{p_id:z.string().min(1).max(80).parse(form.get('product')),p_stock:z.coerce.number().int().min(0).max(100000).parse(form.get('stock'))}));
    } else if(kind==='reward-rule') {
      ({error}=await db.rpc('configure_reward_options',{
        p_milestone:z.coerce.number().refine(n=>[6,8,15].includes(n)).parse(form.get('milestone')),
        p_conditions:z.string().trim().min(1).max(1000).parse(form.get('conditions')),
        p_discount:form.get('discount')?z.coerce.number().int().min(1).max(100).parse(form.get('discount')):null,
        p_products:z.array(z.string().min(1).max(80)).max(100).parse(form.getAll('products')),
      }));
    } else if(kind==='block') {
      const instant=(name:string)=>z.iso.datetime({offset:true}).parse(`${z.iso.datetime({local:true}).parse(`${form.get(name)}:00`)}-03:00`);
      ({error}=await db.rpc('add_schedule_block',{p_professional:z.uuid().parse(form.get('professional')),p_start:instant('start'),p_end:instant('end')}));
    } else if(kind==='unblock') {
      ({error}=await db.rpc('remove_schedule_block',{p_id:z.uuid().parse(form.get('block'))}));
    } else {
      const result=await db.rpc('redeem_reward',{p_customer:z.uuid().parse(form.get('customer')),p_milestone:z.coerce.number().refine(n=>[6,8,15].includes(n)).parse(form.get('milestone')),p_product:form.get('product')?z.string().min(1).max(80).parse(form.get('product')):null});
      error=result.error;
      if(!error) rewardId=result.data;
    }
    if(error) return {message:'No se pudo guardar. Revisá los datos, permisos y condiciones de la operación.'};
    revalidatePath('/admin');revalidatePath('/reservar');revalidatePath('/cuenta');
    return {message:'Guardado correctamente.',...(rewardId?{rewardId}:{})};
  } catch {return {message:'Revisá los datos ingresados.'};}
}
