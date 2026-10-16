import { AppointmentActions } from './appointment-actions';
export type AppointmentRow={id:string;starts_at:string;ends_at:string;status:string;customer_id:string;services:{name:string}|null;professionals:{name:string}|null};
export type AppointmentContact={appointment_id:string;full_name:string;phone:string};
export function AppointmentList({rows,manage=false,contacts=[]}:{rows:AppointmentRow[];manage?:boolean;contacts?:AppointmentContact[]}) {
  const now = new Date();
  return <section className="platform-card"><h2>{manage?'Agenda':'Mis turnos'}</h2>{!rows.length&&<p>No hay turnos para esta consulta.</p>}{rows.map(a=>{
    const contact=contacts.find(c=>c.appointment_id===a.id);
    return <article className="platform-row" key={a.id}><h3>{a.services?.name||'Servicio'}</h3><p>{new Date(a.starts_at).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',dateStyle:'long',timeStyle:'short'})} · {a.professionals?.name}</p><p>Estado: {a.status}</p>{manage&&<p>Cliente: {contact?.full_name||'Contacto no disponible'} {contact?.phone&&<>· <a href={`tel:${contact.phone.replace(/[^+0-9]/g,'')}`}>{contact.phone}</a></>}</p>}{a.status==='confirmado'&&<AppointmentActions id={a.id} manage={manage} canChange={new Date(a.starts_at)>now} ended={new Date(a.ends_at)<=now} />}</article>;
  })}</section>;
}
