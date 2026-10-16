import { PlatformShell,ConfigurationNotice } from '../../components/platform-shell';
import { BookingForm } from '../../components/booking-form';
import { supabaseConfig } from '../../lib/config';
import { requireIdentity } from '../../server/auth';
import catalog from '../../data/catalog.json';
import { bookingTeamMember } from '../../data/booking-team';
import './reservar.css';
export const metadata={title:'Reservar | Lumière',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page() {
  if (!supabaseConfig()) return <PlatformShell title="Reservá tu momento"><ConfigurationNotice /></PlatformShell>;
  const {db}=await requireIdentity();
  const [services,professionals,mappings,hours]=await Promise.all([db.from('services').select('id,name,duration_minutes,price_cents').eq('active',true).order('id'),db.from('professionals').select('id,name').eq('active',true).order('name'),db.from('professional_services').select('professional_id,service_id'),db.from('working_hours').select('professional_id,weekday')]);
  const failed=services.error||professionals.error||mappings.error||hours.error;
  const now=new Date();
  const dateBounds={today:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),lastDay:new Date(now.getTime()+89*86400000).toISOString().slice(0,10)};
  const enrichedServices=(services.data||[]).map(service=>{
    const entry=catalog.find(item=>item.id===service.id);
    return {...service,price_cents:Number(service.price_cents),category:entry?.category||'Otros',description:entry?.description||'',note:entry?.note||''};
  });
  return <div className="booking-page"><PlatformShell title="Reservá tu momento">{failed?<p role="alert">No se pudo cargar la agenda. Intentá más tarde.</p>:!services.data?.length||!professionals.data?.length?<ConfigurationNotice />:<BookingForm services={enrichedServices} professionals={professionals.data.map(professional=>bookingTeamMember(professional,hours.data||[]))} mappings={mappings.data||[]} dateBounds={dateBounds} />}</PlatformShell></div>;
}
