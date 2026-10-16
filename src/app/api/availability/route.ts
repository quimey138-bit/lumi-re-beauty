import { z } from 'zod';
import { createClient } from '../../../lib/supabase/server';
import { availableSlots } from '../../../domain/booking';
import { failure, HttpError } from '../../../server/http';
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const professional = z.uuid().parse(url.searchParams.get('professional'));
    const service = z.string().min(1).max(80).parse(url.searchParams.get('service'));
    const date = z.iso.date().parse(url.searchParams.get('date'));
    const day = new Date(`${date}T12:00:00-03:00`);
    if (day.getTime()<Date.now()-86400000 || day.getTime()>Date.now()+90*86400000) throw new HttpError(400,'Elegí una fecha dentro de los próximos 90 días');
    const db = await createClient();
    if (!db) throw new HttpError(503,'Agenda pendiente de configuración');
    const [services, hours, busy, mapping] = await Promise.all([
      db.from('services').select('duration_minutes').eq('id',service).eq('active',true).single(),
      db.from('working_hours').select('opens,closes').eq('professional_id',professional).eq('weekday',day.getUTCDay()),
      db.rpc('availability_busy',{p_professional:professional,p_date:date}),
      db.from('professional_services').select('professional_id').eq('professional_id',professional).eq('service_id',service).single(),
    ]);
    if (services.error || hours.error || busy.error || mapping.error) throw new HttpError(400,'No se pudo consultar la disponibilidad');
    const slots = [...new Set((hours.data || []).flatMap(w => availableSlots({ date,open:w.opens,close:w.closes,duration:services.data.duration_minutes,busy:(busy.data || []).map((b:{starts_at:string;ends_at:string}) => ({start:b.starts_at,end:b.ends_at})) })))].sort();
    return Response.json({slots},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return failure(error); }
}
