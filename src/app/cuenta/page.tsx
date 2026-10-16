import Link from 'next/link';
import { PlatformShell,ConfigurationNotice } from '../../components/platform-shell';
import { ProfileForm } from '../../components/profile-form';
import { AppointmentList,type AppointmentRow } from '../../components/appointment-list';
import { requireIdentity } from '../../server/auth';
import { supabaseConfig } from '../../lib/config';
import { LoyaltyCard } from '../../components/loyalty-card';
import { loadLoyaltyCard } from '../../server/loyalty-card';
import { signOut } from '../ingresar/actions';
import '../fidelidad/sellos.css';
export const metadata={title:'Mi cuenta | Lumière',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page() {
  if(!supabaseConfig()) return <PlatformShell title="Mi Lumière"><ConfigurationNotice /></PlatformShell>;
  const identity=await requireIdentity();
  const {db,profile,user}=identity;
  const [appointments,loyalty]=await Promise.all([
    db.from('appointments').select('id,starts_at,ends_at,status,customer_id,services(name),professionals(name)').eq('customer_id',user.id).order('starts_at',{ascending:false}).limit(50),
    loadLoyaltyCard(identity),
  ]);
  return <PlatformShell title={`Hola, ${profile.full_name||'bienvenida'}`}><div className="platform-actions"><Link href="/reservar">Reservar turno</Link>{profile.role==='admin'&&<Link href="/admin">Administración</Link>}{profile.role==='profesional'&&<Link href="/profesional">Mi agenda</Link>}<form action={signOut}><button className="platform-secondary">Cerrar sesión</button></form></div>
    <ProfileForm profile={profile} />
    <LoyaltyCard data={loyalty} compact />
    {appointments.error?<p role="alert">No se pudo cargar tu historial.</p>:<AppointmentList rows={appointments.data as unknown as AppointmentRow[]} />}
  </PlatformShell>;
}
