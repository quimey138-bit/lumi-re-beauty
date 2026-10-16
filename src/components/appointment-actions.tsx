'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function AppointmentActions({id,manage=false,canChange=false,ended=false}:{id:string;manage?:boolean;canChange?:boolean;ended?:boolean}) {
  const router=useRouter();const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
  async function act(action:string,start?:string) {
    setBusy(true);
    setMessage('');
    try {const r=await fetch('/api/appointments',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action,start})});const data=await r.json();if(!r.ok)setMessage(data.error);else {setMessage('Turno actualizado');router.refresh();}} catch {setMessage('No se pudo actualizar el turno');} finally {setBusy(false);}
  }
  return <div>
    <div className="platform-actions">
      {manage&&ended&&<><button disabled={busy} onClick={()=>act('complete')}>Completar y acreditar sello</button><button disabled={busy} className="platform-secondary" onClick={()=>act('absent')}>Registrar ausencia</button></>}
      {canChange&&<button disabled={busy} className="platform-secondary" onClick={()=>act('cancel')}>Cancelar turno</button>}
    </div>
    {canChange&&<details className="platform-reschedule"><summary>Reprogramar turno</summary><form className="platform-form" onSubmit={event=>{
      event.preventDefault();const value=new FormData(event.currentTarget).get('start');
      const date=new Date(`${value}:00-03:00`);
      if(!Number.isFinite(date.getTime())){setMessage('Elegí una fecha y hora válidas');return;}
      void act('reschedule',date.toISOString());
    }}><label>Nueva fecha y hora (Argentina)<input name="start" type="datetime-local" required disabled={busy}/></label><p>Conservás el servicio y la profesional. El nuevo horario se confirma únicamente si está disponible.</p><button disabled={busy}>Confirmar nuevo horario</button></form></details>}
    <p role="status">{message}</p>
  </div>;
}
