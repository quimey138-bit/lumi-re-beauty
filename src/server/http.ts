import 'server-only';
import { getIdentity, type Role } from './auth';
import { supabaseConfig } from '../lib/config';
import { sameOrigin } from '../domain/security';
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function apiIdentity(request?: Request, roles?: Role[]) {
  if (request && !sameOrigin(request)) throw new HttpError(403, 'Origen no permitido');
  if (!supabaseConfig()) throw new HttpError(503, 'Autenticación pendiente de configuración');
  const identity = await getIdentity();
  if (!identity) throw new HttpError(401, 'Iniciá sesión para continuar');
  if (roles && !roles.includes(identity.profile.role)) throw new HttpError(403, 'Acceso no permitido');
  return identity;
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: 'No se pudo completar la operación. Revisá los datos o intentá nuevamente.' }, { status: 400 });
}
