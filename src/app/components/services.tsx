import { whatsappUrl } from "../lib/whatsapp";

const services = [
  { title: "Faciales & Cosmiatría", description: "Tratamientos personalizados para el cuidado y bienestar de tu piel.", label: "PIEL" },
  { title: "Cejas & Pestañas", description: "Servicios para realzar y definir tu mirada.", label: "MIRADA" },
  { title: "Uñas", description: "Cuidado y belleza para tus manos y uñas.", label: "MANOS" },
  { title: "Masajes", description: "Un espacio dedicado al bienestar y la relajación.", label: "BIENESTAR" },
  { title: "Depilación", description: "Servicios de depilación adaptados a tus necesidades.", label: "CUIDADO" },
  { title: "Maquillaje", description: "Maquillaje profesional para eventos y ocasiones especiales.", label: "BELLEZA" },
  { title: "Peinados & Accesorios", description: "Peinados y detalles para completar tu look.", label: "ESTILO" },
  { title: "Novias, Novios & Sociales", description: "Preparación para casamientos, producciones y eventos especiales.", label: "OCASIONES ESPECIALES" },
];

export function ServicesGrid() {
  return (
    <div className="lumiere-services-grid">
      {services.map((service, index) => (
        <article className="lumiere-service-card" key={service.title}>
          <div className="lumiere-service-top">
            <span>{service.label}</span>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
          <a href={whatsappUrl(`Hola, quiero consultar por ${service.title}.`)} target="_blank" rel="noopener noreferrer" aria-label={`Consultar sobre ${service.title}`}>
            Consultar por WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </article>
      ))}
    </div>
  );
}

export function ServicesHelp() {
  return (
    <div className="lumiere-services-help">
      <div>
        <h2>¿No sabés qué tratamiento elegir?</h2>
        <p>Escribinos y te ayudamos a encontrar el servicio indicado para vos.</p>
      </div>
      <a href={whatsappUrl("Hola, me gustaría que me ayuden a elegir un tratamiento.")} className="primary-button" target="_blank" rel="noopener noreferrer">CONSULTAR POR WHATSAPP</a>
    </div>
  );
}
