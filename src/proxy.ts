import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from './lib/config';
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  if (!config) return response;
  const client = createServerClient(config.url, config.key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: values => {
      values.forEach(({ name, value }) => request.cookies.set(name, value));
      response = NextResponse.next({ request });
      values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    },
  } });
  await client.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/cuenta/:path*', '/admin/:path*', '/profesional/:path*', '/reservar/:path*', '/fidelidad/:path*', '/checkout/:path*', '/ingresar', '/auth/:path*', '/api/appointments/:path*', '/api/profile/:path*', '/api/loyalty/:path*', '/api/checkout/:path*'] };
