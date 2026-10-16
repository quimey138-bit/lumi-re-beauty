import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '../lib/supabase/server';
export type Role = 'cliente' | 'profesional' | 'admin';
export async function getIdentity() {
  const db = await createClient();
  if (!db) return null;
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await db.from('profiles').select('id,role,full_name,email,phone,whatsapp_consent,email_consent').eq('id', user.id).single();
  if (profileError || !profile) throw new Error('No se pudo cargar el perfil. Verificá las migraciones de Supabase.');
  return { db, user, profile: profile as { id:string; role:Role; full_name:string; email:string; phone:string; whatsapp_consent:boolean; email_consent:boolean } };
}
export async function requireIdentity(roles?: Role[]) {
  const identity = await getIdentity();
  if (!identity) redirect('/ingresar');
  if (roles && !roles.includes(identity.profile.role)) redirect('/cuenta');
  return identity;
}
