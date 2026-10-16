import { z } from 'zod';
import { apiIdentity, failure, HttpError } from '../../../server/http';
export async function POST(request:Request) {
  try {
    const {db} = await apiIdentity(request,['admin']);
    const {customer,milestone,product} = z.object({customer:z.uuid(),milestone:z.union([z.literal(6),z.literal(8),z.literal(15)]),product:z.string().min(1).max(80).optional()}).parse(await request.json());
    const {data,error} = await db.rpc('redeem_reward',{p_customer:customer,p_milestone:milestone,p_product:product||null});
    if (error) throw new HttpError(409,'El premio no está disponible o ya fue canjeado');
    return Response.json({id:data});
  } catch(error) { return failure(error); }
}
