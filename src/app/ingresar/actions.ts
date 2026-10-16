'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { siteUrl } from '../../lib/config';
import { safeNext } from '../../domain/security';
const credentials = z.object({ email: z.email().max(254), password: z.string().min(10).max(128), name: z.string().trim().max(120) });
export async function authenticate(_previous: { message:string }, form: FormData) {
  const db = await createClient();
  if (!db) return { message: 'El acceso todavía no está configurado.' };
  const parsed = credentials.safeParse({ email: form.get('email'), password: form.get('password'), name: form.get('name') || '' });
  if (!parsed.success) return { message: 'Ingresá un email válido y una contraseña de al menos 10 caracteres.' };
  const { email, password, name } = parsed.data;
  if (form.get('mode') === 'register') {
    if (!name) return { message: 'Completá tu nombre.' };
    const base = siteUrl();
    if (!base) return { message: 'El estudio debe configurar la dirección del sitio.' };
    const { error } = await db.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${base}/auth/callback` } });
    return { message: error ? 'No pudimos crear tu cuenta. Revisá los datos o intentá más tarde.' : 'Revisá tu email para confirmar la cuenta. Si ya estaba registrada, podés iniciar sesión.' };
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return { message: 'No pudimos iniciar sesión. Revisá tu email y contraseña.' };
  redirect(safeNext(form.get('next')));
}
export async function signOut() {
  const db = await createClient();
  if (db) await db.auth.signOut();
  redirect('/ingresar');
}
