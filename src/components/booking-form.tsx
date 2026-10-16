'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { bookingCategories, bookingDuration, bookingMoney, filterBookingServices, type BookingProfessional, type BookingService, type ServiceMapping } from '../domain/booking-catalog';

function Portrait({ professional, size = 64 }: { professional: BookingProfessional; size?: number }) {
  return <span className={`booking-portrait booking-portrait-${professional.name.toLowerCase()}`} style={{ width: size, height: size }}>
    {professional.photo ? <Image src={professional.photo} alt={professional.name} fill sizes={`${size}px`} /> : <span aria-hidden="true">{professional.name.slice(0, 1)}</span>}
  </span>;
}

export function BookingForm({ services, professionals, mappings, dateBounds }: { services: BookingService[]; professionals: BookingProfessional[]; mappings: ServiceMapping[]; dateBounds: { today: string; lastDay: string } }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['Faciales']);
  const [service, setService] = useState('');
  const [professional, setProfessional] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const bookingPanel = useRef<HTMLElement>(null);
  const catalogPanel = useRef<HTMLElement>(null);
  const requestVersion = useRef(0);
  const selectedService = services.find(item => item.id === service);
  const selectedProfessional = professionals.find(item => item.id === professional);
  const eligibleProfessionals = professionals.filter(person => mappings.some(mapping => mapping.professional_id === person.id && mapping.service_id === service));
  const filteredServices = filterBookingServices(services, mappings, { query, category, professional: teamFilter });
  const categories = [...bookingCategories.filter(name => services.some(item => item.category === name)), ...new Set(services.map(item => item.category).filter(name => !bookingCategories.includes(name)))];

  function resetAvailability() {
    requestVersion.current += 1;
    setBusy(false);
    setSlots([]);
    setTime('');
    setMessage('');
  }

  function chooseService(selected: BookingService) {
    resetAvailability();
    setService(selected.id);
    setDate('');
    const eligible = professionals.filter(person => mappings.some(mapping => mapping.professional_id === person.id && mapping.service_id === selected.id));
    setProfessional(eligible.find(person => person.id === teamFilter)?.id ?? (eligible.length === 1 ? eligible[0].id : ''));
    bookingPanel.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    bookingPanel.current?.focus({ preventScroll: true });
  }

  async function searchAvailability() {
    const version = ++requestVersion.current;
    setBusy(true);
    setMessage('');
    setTime('');
    setSlots([]);
    try {
      const response = await fetch(`/api/availability?${new URLSearchParams({ service, professional, date })}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo consultar la agenda.');
      if (!Array.isArray(data.slots) || data.slots.some((slot: unknown) => typeof slot !== 'string' || !/^\d{2}:\d{2}$/.test(slot))) throw new Error('No se pudo consultar la agenda.');
      if (version !== requestVersion.current) return;
      setSlots(data.slots);
      if (!data.slots.length) setMessage('No hay horarios disponibles para esta fecha. Probá otro día o consultá al estudio.');
    } catch (error) {
      if (version === requestVersion.current) setMessage(error instanceof Error ? error.message : 'No se pudo consultar la agenda.');
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }

  function clearFilters() {
    setQuery('');
    setCategory('');
    setTeamFilter('');
  }

  return <div className="booking-experience">
    <section className="booking-intro" aria-label="Lumière Beauty y profesionales">
      <div className="booking-studio">
        <Image className="booking-logo" src="/logo-lumiere.png" alt="Lumière Beauty" width={112} height={112} />
        <div><span className="booking-eyebrow">UN MOMENTO PARA VOS</span><h2>Lumière Beauty</h2><p>Tu mejor versión empieza en Lumière.</p><a className="booking-location" href="https://maps.app.goo.gl/wK2Db8JKDRtgoRxe8" target="_blank" rel="noopener noreferrer">↗ Cómo llegar al estudio</a></div>
      </div>
      <div className="booking-team"><span className="booking-eyebrow">CONOCÉ A NUESTRO EQUIPO</span><div className="booking-team-list">
        {professionals.map(person => <button className="booking-team-person" key={person.id} type="button" aria-pressed={teamFilter === person.id} aria-label={`Ver servicios de ${person.name}`} onClick={() => { setTeamFilter(teamFilter === person.id ? '' : person.id); setExpanded(categories); }}><Portrait professional={person} /><span>{person.name}</span></button>)}
      </div><p>Elegí una profesional para ver sus servicios.</p></div>
    </section>

    <ol className="booking-steps" aria-label="Pasos de la reserva"><li className="is-current"><span>01</span> Elegí tu servicio</li><li className={selectedService ? 'is-current' : ''}><span>02</span> Profesional y horario</li><li><span>03</span> Seña y confirmación</li></ol>

    <div className="booking-layout">
      <aside className="booking-filters" aria-label="Filtros de servicios">
        <label className="booking-search"><span>Buscá tu tratamiento</span><input type="search" placeholder="¿Qué servicio buscás?" value={query} onChange={event => { setQuery(event.target.value); if (event.target.value) setExpanded(categories); }} /></label>
        <nav className="booking-category-nav" aria-label="Categorías de servicios"><button type="button" aria-pressed={!category} onClick={() => setCategory('')}>Todos los servicios <span>{services.length}</span></button>{categories.map(name => <button type="button" key={name} aria-pressed={category === name} onClick={() => { setCategory(name); setExpanded(current => [...new Set([...current, name])]); }}>{name}<span>{services.filter(item => item.category === name).length}</span></button>)}</nav>
        <div className="booking-help"><span className="booking-eyebrow">A TU TIEMPO</span><p>¿No sabés qué elegir?</p><a href="https://wa.me/5491158875779?text=Hola%2C%20necesito%20ayuda%20para%20elegir%20un%20tratamiento." target="_blank" rel="noopener noreferrer">Te asesoramos por WhatsApp ↗</a></div>
      </aside>

      <section ref={catalogPanel} tabIndex={-1} className="booking-catalog" aria-label="Catálogo de tratamientos">
        <div className="booking-results"><p role="status">{filteredServices.length} {filteredServices.length === 1 ? 'servicio para vos' : 'servicios para vos'}{teamFilter ? ` · ${professionals.find(person => person.id === teamFilter)?.name}` : ''}</p>{(query || category || teamFilter) && <button className="booking-clear" type="button" onClick={clearFilters}>Limpiar filtros</button>}</div>
        {!filteredServices.length && <div className="booking-empty"><h2>No encontramos ese tratamiento</h2><p>Probá con otro nombre o cambiá los filtros.</p><button type="button" onClick={clearFilters}>Ver todos los servicios</button></div>}
        {categories.map((name, index) => {
          const items = filteredServices.filter(item => item.category === name);
          if (!items.length) return null;
          const open = expanded.includes(name);
          return <section className="booking-category" key={name}>
            <h2><button type="button" aria-expanded={open} aria-controls={`booking-category-${index}`} onClick={() => setExpanded(current => open ? current.filter(item => item !== name) : [...current, name])}><span>{name}<small>{items.length} {items.length === 1 ? 'servicio' : 'servicios'}</small></span><span aria-hidden="true">{open ? '−' : '+'}</span></button></h2>
            <div id={`booking-category-${index}`} hidden={!open}><div className="booking-service-grid">{items.map(item => {
              const people = professionals.filter(person => mappings.some(mapping => mapping.professional_id === person.id && mapping.service_id === item.id));
              return <article className={`booking-service${service === item.id ? ' is-selected' : ''}`} key={item.id}>
                <span className="booking-eyebrow">{item.category}</span><h3>{item.name}</h3>
                <div className="booking-service-meta"><span>{bookingDuration(item.duration_minutes)}</span><strong>{bookingMoney(item.price_cents)}</strong></div>
                <div className="booking-service-team">{people.map(person => <span className="booking-service-person" key={person.id}><Portrait professional={person} size={32} /><span>{person.name}</span></span>)}</div>
                {item.description && <><p className="booking-service-preview">{item.description}</p><details className="booking-service-description"><summary>Más información</summary><p>{item.description}</p>{item.note && <p className="booking-service-note">{item.note}</p>}</details></>}
                <button className="booking-schedule" type="button" disabled={!people.length} onClick={() => chooseService(item)} aria-label={`Agendar servicio: ${item.name}`}>{service === item.id ? 'Servicio seleccionado ✓' : 'Agendar servicio'}<span aria-hidden="true">↗</span></button>
                {!people.length && <small>Profesional pendiente de asignación.</small>}
              </article>;
            })}</div></div>
          </section>;
        })}
      </section>

      <section ref={bookingPanel} tabIndex={-1} className="booking-summary" aria-label="Tu reserva">
        <span className="booking-eyebrow">TU PRÓXIMO MOMENTO</span><h2>Tu reserva</h2>
        {!selectedService ? <div className="booking-summary-empty"><span aria-hidden="true">✧</span><p>Elegí el tratamiento que te gustaría disfrutar.</p><small>Después vas a poder elegir profesional, fecha y horario.</small></div> : <>
          <div className="booking-selected-service"><span>{selectedService.category}</span><h3>{selectedService.name}</h3><p>{bookingDuration(selectedService.duration_minutes)} <strong>{bookingMoney(selectedService.price_cents)}</strong></p><button type="button" className="booking-change-service" onClick={() => { catalogPanel.current?.scrollIntoView({ behavior: 'instant', block: 'start' }); catalogPanel.current?.focus({ preventScroll: true }); }}>Cambiar servicio</button></div>
          <fieldset className="booking-professionals"><legend>Elegí tu profesional</legend>{eligibleProfessionals.map(person => <label className={professional === person.id ? 'is-selected' : ''} key={person.id}><input type="radio" name="booking-professional" value={person.id} checked={professional === person.id} onChange={() => { setProfessional(person.id); setDate(''); resetAvailability(); }} /><Portrait professional={person} size={40} /><span><strong>{person.name}</strong><small>{person.specialty}</small></span></label>)}</fieldset>
          {selectedProfessional && <div className="booking-attendance"><strong>Días de atención</strong><p>{selectedProfessional.days}</p>{!selectedProfessional.hoursConfigured && <p className="booking-hours-pending">La agenda de {selectedProfessional.name} todavía no tiene horarios cargados. El estudio los habilitará próximamente.</p>}</div>}
          <label className="booking-date">Elegí la fecha<input type="date" value={date} min={dateBounds.today} max={dateBounds.lastDay} disabled={!professional || !selectedProfessional?.hoursConfigured} onChange={event => { setDate(event.target.value); resetAvailability(); }} /></label>
          <button className="booking-check-slots" type="button" disabled={!service || !professional || !date || busy || !selectedProfessional?.hoursConfigured} onClick={searchAvailability}>{busy ? 'Consultando…' : 'Ver horarios disponibles'}</button>
          <div className="booking-slots" aria-label="Horarios disponibles">{slots.map(slot => <button type="button" key={slot} aria-pressed={time === slot} onClick={() => setTime(slot)}>{slot}</button>)}</div>
          <p className="booking-message" role="status">{message}</p>
          {time && <p className="booking-time-summary">Seleccionaste el {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00-03:00`))} a las {time} h.</p>}
        </>}
        <div className="booking-deposit"><span>Seña para confirmar</span><strong>{bookingMoney(1000000)}</strong><p>Tu turno se confirma una vez aprobado el pago de la seña.</p></div>
        {selectedService && <><button className="booking-payment" type="button" disabled>Pago de seña próximamente</button><p className="booking-payment-note">Estamos preparando el pago online. Por ahora, no se confirma ninguna reserva desde este formulario.</p></>}
        <p className="booking-account-note">Tus datos y preferencias de contacto están en <Link href="/cuenta">Mi cuenta</Link>.</p>
      </section>
    </div>

  </div>;
}
