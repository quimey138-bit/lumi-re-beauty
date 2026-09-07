import Link from "next/link";
import catalog from "../../data/catalog.json";
import { AGENDA_URL, CATALOG_DATE } from "../../data/booking";
import { whatsappUrl } from "../lib/whatsapp";

const categories = [
  { name: "Faciales", id: "faciales", description: "Higiene profunda, dermaplaning, peeling y tratamientos para el cuidado de tu piel." },
  { name: "Masajes", id: "masajes", description: "Masajes descontracturantes, relajantes, drenaje linfático y piedras calientes." },
  { name: "Cejas y Pestañas", id: "cejas-pestanas", description: "Perfilado, laminado, lifting y tintura para realzar tu mirada." },
  { name: "Corporales", id: "corporales", description: "Higiene y renovación de espalda y glúteos, con opciones de dermaplaning y peeling." },
  { name: "Manos y Pies", id: "manos-pies", description: "Manicuría, pedicuría, esmaltado, kapping, soft gel y nail art." },
];
function price(value: number) { return value === 0 ? "Gratis*" : `$${value.toLocaleString("es-AR")}`; }
function duration(value: number) { return value === 90 ? "1 h 30 min" : `${value / 60} h`; }

export function ServicesGrid() {
  return <div className="lumiere-services-grid">{categories.map((category, index) => <article className="lumiere-service-card" key={category.id}>
    <div className="lumiere-service-top"><span>{catalog.filter(s => s.category === category.name).length} SERVICIOS</span><span aria-hidden="true">0{index + 1}</span></div>
    <h3>{category.name}</h3><p>{category.description}</p>
    <Link href={`/servicios#${category.id}`}>Ver tratamientos <span aria-hidden="true">→</span></Link>
  </article>)}</div>;
}

export function ServicesCatalog() {
  return <div className="services-catalog">
    <nav className="catalog-nav" aria-label="Categorías de servicios">{categories.map(c => <a key={c.id} href={`#${c.id}`}>{c.name}</a>)}</nav>
    <p className="catalog-source">Precios en pesos argentinos y duración publicada en <a href={AGENDA_URL} target="_blank" rel="noopener noreferrer">AgendaPro</a>. Catálogo consultado el {CATALOG_DATE}. Confirmá el precio y la disponibilidad al reservar.</p>
    {categories.map(c => <section key={c.id} id={c.id} className="catalog-category" aria-labelledby={`${c.id}-title`}>
      <div className="catalog-category-heading"><h2 id={`${c.id}-title`}>{c.name}</h2><span>{catalog.filter(s => s.category === c.name).length} servicios</span></div>
      <div className="catalog-list">{catalog.filter(s => s.category === c.name).map(s => <details className="catalog-item" key={s.id}>
        <summary><h3>{s.name}</h3><span className="catalog-meta"><span>{duration(s.duration)}{s.sessions > 1 ? ` por sesión · Pack de ${s.sessions}` : " en agenda"}</span><strong>{price(s.price)}</strong></span><span className="catalog-toggle" aria-hidden="true">+</span></summary>
        <div className="catalog-body">{s.note && <p className="catalog-note">{s.note}</p>}
          {s.description ? <p className="catalog-description">{s.description}</p> : <p>Consultanos para conocer los detalles de este servicio.</p>}
          {s.price === 0 && <p className="catalog-note">* Publicado como “Gratis” en AgendaPro. Consultá las condiciones antes de reservar.</p>}
          <div className="catalog-actions"><a className="primary-button" href={AGENDA_URL} target="_blank" rel="noopener noreferrer">RESERVAR EN AGENDAPRO ↗</a><a href={whatsappUrl(`Hola, quiero consultar por ${s.name}.`)} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></div>
        </div>
      </details>)}</div>
    </section>)}
  </div>;
}

export function ServicesHelp() {
  return <div className="lumiere-services-help"><div><h2>¿No sabés qué tratamiento elegir?</h2><p>Escribinos y te ayudamos a encontrar el servicio indicado para vos.</p></div><a href={whatsappUrl("Hola, me gustaría que me ayuden a elegir un tratamiento.")} className="primary-button" target="_blank" rel="noopener noreferrer">CONSULTAR POR WHATSAPP</a></div>;
}
