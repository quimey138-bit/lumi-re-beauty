import {createHash} from 'node:crypto';
import {z} from 'zod';
import {sameOrigin} from '../../../domain/security';
import {adminClient} from '../../../lib/supabase/admin';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Origen no permitido'},{status:403});
  try{
    // A random, private browser receipt authorizes revocation only, never data reads.
    const {token}=z.object({token:z.uuid()}).parse(await request.json());
    const {error}=await adminClient().rpc('revoke_tracking',{p_hash:createHash('sha256').update(token).digest('hex')});
    if(error)throw error;return Response.json({ok:true});
  }catch{return Response.json({error:'No se pudo revocar la medición de compras. Intentá nuevamente.'},{status:503});}
}
