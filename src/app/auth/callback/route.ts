import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { safeNext } from '../../../domain/security';
import { siteUrl } from '../../../lib/config';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = siteUrl();
  if(!origin)return Response.json({error:'Dirección pública del sitio pendiente de configuración'},{status:503});
  const db = await createClient();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')), origin));
  }
  return NextResponse.redirect(new URL('/ingresar?error=confirmation', origin));
}
