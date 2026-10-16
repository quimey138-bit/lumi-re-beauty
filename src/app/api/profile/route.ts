import { z } from 'zod';
import { apiIdentity, failure } from '../../../server/http';
const schema = z.object({ full_name:z.string().trim().min(2).max(120), phone:z.string().regex(/^\+?[1-9]\d{7,14}$/), whatsapp_consent:z.boolean(), email_consent:z.boolean() });
export async function PATCH(request: Request) {
  try {
    const { db, user } = await apiIdentity(request);
    const input = schema.parse(await request.json());
    const { error } = await db.from('profiles').update(input).eq('id',user.id);
    if (error) throw error;
    return Response.json({ ok:true });
  } catch (error) { return failure(error); }
}
