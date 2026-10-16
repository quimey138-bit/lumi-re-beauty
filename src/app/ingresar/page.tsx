import { PlatformShell, ConfigurationNotice } from '../../components/platform-shell';
import { supabaseConfig } from '../../lib/config';
import { safeNext } from '../../domain/security';
import { AuthForm } from './form';
export const metadata = { title: 'Ingresar | Lumière', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{next?:string;error?:string}> }) {
  const params = await searchParams;
  return <PlatformShell title="Mi Lumière">{params.error && <p role="alert">No se pudo confirmar el acceso. Intentá iniciar sesión nuevamente.</p>}{supabaseConfig() ? <AuthForm next={safeNext(params.next)} /> : <ConfigurationNotice />}</PlatformShell>;
}
