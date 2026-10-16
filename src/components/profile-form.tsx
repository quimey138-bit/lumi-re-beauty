'use client';
import { useState } from 'react';
export function ProfileForm({profile}:{profile:{full_name:string;phone:string;whatsapp_consent:boolean;email_consent:boolean}}) {
  const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  return <form className="platform-form platform-card" onSubmit={async e=>{
    e.preventDefault();setBusy(true); const form=new FormData(e.currentTarget);
    try {const response=await fetch('/api/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:form.get('full_name'),phone:form.get('phone'),whatsapp_consent:form.has('whatsapp_consent'),email_consent:form.has('email_consent')})}); const data=await response.json();setMessage(response.ok?'Perfil guardado':data.error);} catch {setMessage('No se pudo guardar el perfil');} finally {setBusy(false);}
  }}><h2>Tu perfil</h2><label>Nombre y apellido<input name="full_name" required minLength={2} maxLength={120} defaultValue={profile.full_name} autoComplete="name" /></label><label>WhatsApp con código de país<input name="phone" type="tel" required pattern="\+?[1-9][0-9]{7,14}" defaultValue={profile.phone} placeholder="+5491155555555" autoComplete="tel" /></label>
    <label className="platform-check"><input type="checkbox" name="whatsapp_consent" defaultChecked={profile.whatsapp_consent} />Acepto recibir confirmaciones y recordatorios de mis turnos por WhatsApp.</label>
    <label className="platform-check"><input type="checkbox" name="email_consent" defaultChecked={profile.email_consent} />Acepto recibir confirmaciones y recordatorios de mis turnos por email.</label>
    <button disabled={busy}>Guardar perfil</button><p role="status">{message}</p></form>;
}
