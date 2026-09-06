"use client";

import Link from "next/link";
import { useState } from "react";
import "./turnos.css";

const services = [
  { name: "Faciales & Cosmiatría", duration: 90, team: [0, 1] },
  { name: "Cejas & Pestañas", duration: 60, team: [0, 2] },
  { name: "Uñas", duration: 60, team: [2] },
  { name: "Masajes", duration: 60, team: [1] },
  { name: "Depilación", duration: 45, team: [0, 1] },
  { name: "Maquillaje", duration: 60, team: [2] },
  { name: "Peinados & Accesorios", duration: 60, team: [1, 2] },
  { name: "Novias, Novios & Sociales", duration: 120, team: [1, 2] },
];
const team = ["Lucía", "Valentina", "Sofía"];
const steps = ["Servicio", "Profesional", "Día y hora", "Tus datos", "Seña"];
type Booking = { id: number; service: number; person: number; date: string; time: string; name: string; phone: string; email: string; status: "Pendiente" | "Confirmado" | "Rechazado" };
function days(offset: number) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + 1 + offset + i);
    return { value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, label: date.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }), closed: date.getDay() === 0 };
  });
}
function prettyDate(value: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : "A elegir"; }

export default function TurnosDemo() {
  const [view, setView] = useState<"booking" | "admin">("booking");
  const [step, setStep] = useState(0);
  const [service, setService] = useState(0);
  const [person, setPerson] = useState(-1);
  const [offset, setOffset] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [terms, setTerms] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<number | null>(null);
  const selected = services[service];
  const current = bookings.find(b => b.id === submitted);
  const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
  function available(p: number, d: string, t: string) {
    const minutes = (v: string) => Number(v.split(":")[0]) * 60 + Number(v.split(":")[1]);
    const start = minutes(t);
    if (start + selected.duration > 19 * 60 || (p === 1 && t === "09:00") || (p === 2 && t === "12:00")) return false;
    return !bookings.some(b => b.person === p && b.date === d && b.status !== "Rechazado" && start < minutes(b.time) + services[b.service].duration && start + selected.duration > minutes(b.time));
  }
  function candidates(t: string) { return selected.team.filter(p => (person === -1 || p === person) && available(p, date, t)); }
  function reset() { setPerson(-1); setOffset(0); setStep(0); setSubmitted(null); setReceipt(false); setTerms(false); setTime(""); setDate(""); setName(""); setPhone(""); setEmail(""); setNotice(""); }
  function submit() {
    const assigned = candidates(time)[0];
    if (assigned === undefined) { setNotice("Ese horario ya no está disponible. Elegí otro."); setStep(2); return; }
    const id = Date.now();
    setBookings([...bookings, { id, service, person: assigned, date, time, name, phone, email, status: "Pendiente" }]);
    setSubmitted(id); setNotice("");
  }
  function update(id: number, status: Booking["status"]) { setBookings(bookings.map(b => b.id === id ? { ...b, status } : b)); setNotice(status === "Confirmado" ? "Turno aprobado en la demo. Avisos de email y WhatsApp simulados; no enviados." : "Solicitud rechazada en la demo. El horario vuelve a estar disponible."); }
  return (
    <main className="booking-demo">
      <header className="booking-header"><Link href="/" className="logo-text">LUMIÈRE</Link><Link href="/">Volver al sitio ↗</Link></header>
      <div className="demo-banner"><strong>MAQUETA INTERACTIVA</strong> Datos de ejemplo. No se reservan turnos ni se realizan pagos o envíos. Al recargar, se reinicia.</div>
      <div className="demo-switch" aria-label="Vista de la maqueta"><button aria-pressed={view === "booking"} onClick={() => {setView("booking"); setNotice("");}}>Vista cliente</button><button aria-pressed={view === "admin"} onClick={() => {setView("admin"); setNotice("");}}>Panel de Lumière <span>{bookings.filter(b => b.status === "Pendiente").length}</span></button></div>
      {view === "booking" ? <>
        <div className="booking-title"><span className="booking-eyebrow">UN ESPACIO PARA VOS</span><h1>Reservá tu momento.</h1><p>Elegí cómo cuidarte. Nosotras nos ocupamos del resto.</p></div>
        {current ? <section className="booking-success"><span className="success-symbol">{current.status === "Confirmado" ? "✓" : current.status === "Rechazado" ? "–" : "◷"}</span><p className="booking-eyebrow">{current.status.toUpperCase()} · DEMO</p><h2>{current.status === "Pendiente" ? "Recibimos tu solicitud" : current.status === "Confirmado" ? "Tu momento está confirmado" : "La solicitud no fue aprobada"}</h2><p>{current.status === "Pendiente" ? "El horario queda apartado mientras se revisa la seña. La confirmación llegará después de aprobar el pago." : current.status === "Confirmado" ? "Así se verá la confirmación cuando el equipo apruebe la transferencia." : "Podés elegir un nuevo horario y volver a solicitar tu turno."}</p><div className="success-summary"><strong>{services[current.service].name}</strong><span>Con {team[current.person]} · {prettyDate(current.date)} · {current.time}</span><span>Seña de ejemplo: $10.000</span></div><button className="booking-primary" onClick={() => setView("admin")}>Probar revisión de seña →</button><button className="booking-text-button" onClick={reset}>Crear otra reserva de prueba</button></section> : <>
        <ol className="booking-steps">{steps.map((title, i) => <li key={title} aria-current={step === i ? "step" : undefined}><button disabled={i > step} onClick={() => setStep(i)}><span>{i < step ? "✓" : String(i + 1).padStart(2, "0")}</span>{title}</button></li>)}</ol>
        <div className="booking-layout"><section className="booking-card">
          <p className="booking-eyebrow">PASO {step + 1} DE 5</p><h2>{["¿Qué te gustaría hacer?", "Elegí a tu profesional", "Encontrá tu horario", "Conozcámonos un poquito", "El último paso: tu seña"][step]}</h2>
          {step === 0 && <><p>Los tiempos e importes de esta maqueta son ilustrativos.</p><div className="service-options">{services.map((s, i) => <button className={service === i ? "chosen" : ""} aria-pressed={service === i} key={s.name} onClick={() => {setService(i); setPerson(-1); setTime("");}}><span>{String(i + 1).padStart(2, "0")}</span><strong>{s.name}</strong><small>{s.duration} min aprox.</small></button>)}</div></>}
          {step === 1 && <><p>Profesionales ficticias para explorar el recorrido.</p><div className="person-options">{[-1, ...selected.team].map(p => <button aria-pressed={person === p} className={person === p ? "chosen" : ""} key={p} onClick={() => {setPerson(p); setTime("");}}><span className="person-avatar">{p === -1 ? "✧" : team[p][0]}</span><strong>{p === -1 ? "Sin preferencia" : team[p]}</strong><small>{p === -1 ? "Te asignamos una profesional disponible" : "Profesional de ejemplo"}</small></button>)}</div></>}
          {step === 2 && <><p>Disponibilidad de ejemplo, según profesional y duración.</p><div className="date-nav"><button disabled={offset === 0} onClick={() => setOffset(offset - 7)}>← Anterior</button><span>Próximos días</span><button disabled={offset >= 21} onClick={() => setOffset(offset + 7)}>Siguiente →</button></div><div className="date-options">{days(offset).map(d => <button key={d.value} disabled={d.closed} aria-pressed={date === d.value} className={date === d.value ? "chosen" : ""} onClick={() => {setDate(d.value); setTime("");}}>{d.label}<small>{d.closed ? "Cerrado" : "Ver horarios"}</small></button>)}</div><h3>{date ? prettyDate(date) : "Primero elegí un día"}</h3>{date && <div className="time-options">{slots.map(t => <button key={t} disabled={!candidates(t).length} aria-pressed={time === t} className={time === t ? "chosen" : ""} onClick={() => setTime(t)}>{t}</button>)}</div>}<p className="booking-note">Los horarios deshabilitados no están disponibles. Podés probar otro día o profesional.</p></>}
          {step === 3 && <form id="booking-details" onSubmit={e => {e.preventDefault(); if (name.trim()) setStep(4);}}><p>Usá datos ficticios para probar la maqueta.</p><label>Nombre y apellido<input required value={name} onChange={e => setName(e.target.value)} placeholder="Ej.: Ana Demo" autoComplete="off" /></label><label>WhatsApp<input type="tel" required pattern="[+0-9 ()-]{8,20}" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej.: +54 9 11 0000 0000" autoComplete="off" /></label><label>Email<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ana@example.com" autoComplete="off" /></label></form>}
          {step === 4 && <><p>En el turnero real, el equipo confirmará el turno después de verificar la transferencia.</p><div className="transfer-demo"><span>SEÑA DE EJEMPLO</span><strong>$10.000</strong><p>Los datos bancarios se configurarán al activar el turnero.</p><b>No realices una transferencia para esta prueba.</b></div><button className="receipt-button" aria-pressed={receipt} onClick={() => setReceipt(!receipt)}>{receipt ? "✓ Comprobante de ejemplo adjuntado · Quitar" : "＋ Usar comprobante de ejemplo"}</button><p className="booking-note">Simula la carga de un comprobante sin subir archivos personales.</p><label className="booking-checkbox"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />Entiendo que esta solicitud queda pendiente hasta que se verifique la seña.</label></>}
          {notice && <p role="status">{notice}</p>}
          <div className="booking-actions"><button className="booking-text-button" disabled={step === 0} onClick={() => setStep(step - 1)}>← Atrás</button>{step === 3 ? <button key="details-submit" type="submit" form="booking-details" className="booking-primary">Continuar →</button> : <button key="step-next" type="button" className="booking-primary" disabled={(step === 2 && (!date || !time)) || (step === 4 && (!receipt || !terms))} onClick={() => step === 4 ? submit() : setStep(step + 1)}>{step === 4 ? "Enviar solicitud de prueba" : "Continuar →"}</button>}</div>
        </section><aside className="booking-summary"><span className="booking-eyebrow">TU MOMENTO LUMIÈRE</span><h2>Un ratito para vos.</h2><dl><dt>Servicio</dt><dd>{selected.name}</dd><dt>Profesional</dt><dd>{person === -1 ? "Sin preferencia" : team[person]}</dd><dt>Día y hora</dt><dd>{date ? prettyDate(date) : "A elegir"}{time && ` · ${time}`}</dd><dt>Duración de ejemplo</dt><dd>{selected.duration} minutos</dd></dl><div className="summary-deposit"><span>Seña de ejemplo</span><strong>$10.000</strong></div><p>La seña se descuenta del total del servicio. Importe sujeto a configuración.</p><span className="summary-flower" aria-hidden="true">✳</span></aside></div></>}
      </> : <>
        <div className="booking-title"><span className="booking-eyebrow">ORGANIZÁ CADA MOMENTO</span><h1>Agenda de Lumière.</h1><p>Panel de demostración sin acceso privado ni notificaciones reales.</p></div>
        <div className="admin-stats">{["Pendiente", "Confirmado", "Rechazado"].map(s => <div key={s}><strong>{bookings.filter(b => b.status === s).length}</strong><span>{s === "Pendiente" ? "Señas por revisar" : s === "Confirmado" ? "Turnos confirmados" : "Solicitudes rechazadas"}</span></div>)}</div>
        <section className="booking-card admin-card"><div className="admin-heading"><h2>Reservas de prueba</h2><label>Profesional<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas las profesionales</option>{team.map((p, i) => <option key={p} value={i}>{p}</option>)}</select></label></div>{notice && <p className="admin-notice" role="status">{notice}</p>}{!bookings.filter(b => filter === "all" || b.person === Number(filter)).length ? <div className="admin-empty"><span>✧</span><h3>Tu agenda empieza acá</h3><p>Creá una reserva desde la vista cliente para probar la revisión de la seña.</p><button className="booking-primary" onClick={() => {reset();setView("booking");}}>Probar una reserva →</button></div> : bookings.filter(b => filter === "all" || b.person === Number(filter)).map(b => <article className="admin-booking" key={b.id}><div><span className={`booking-status status-${b.status}`}>{b.status}</span><h3>{b.name}</h3><p>{services[b.service].name} · {team[b.person]}</p><strong>{prettyDate(b.date)} · {b.time}</strong><p>{b.phone} · {b.email}</p></div><div className="admin-controls"><button onClick={() => setPreview(preview === b.id ? null : b.id)}>Ver comprobante de ejemplo</button>{b.status === "Pendiente" && <><button className="booking-primary" onClick={() => update(b.id, "Confirmado")}>Aprobar seña</button><button onClick={() => update(b.id, "Rechazado")}>Rechazar solicitud</button></>}</div>{preview === b.id && <div className="receipt-preview"><strong>COMPROBANTE SIMULADO · $10.000</strong><p>No es una transferencia real. En el sistema final se verá aquí el archivo enviado por la clienta.</p></div>}{b.status === "Confirmado" && <div className="receipt-preview"><strong>Vista previa del aviso · No enviado</strong><p>Nuevo turno para {team[b.person]}: {b.name}, {services[b.service].name}, {prettyDate(b.date)} a las {b.time}. WhatsApp de la clienta: {b.phone}. Seña aprobada: $10.000.</p><small>Canales previstos: email y WhatsApp.</small></div>}</article>)}</section>
      </>}
      <footer className="booking-footer">LUMIÈRE · Cuidado, belleza y bienestar.<br /><small>Maqueta navegable · Profesionales, disponibilidad y montos ilustrativos.</small></footer>
    </main>
  );
}
