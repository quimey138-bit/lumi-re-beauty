import { BrandLogo } from "../components/brand-logo";
import { SiteHeader } from "../../components/site-header";
import { ServicesCatalog, ServicesHelp } from "../components/services";

export const metadata = { title: 'Servicios y tratamientos | Lumière Beauty', description: 'Tratamientos faciales, masajes, cejas, pestañas, manos y pies de Lumière Beauty. Consultá el catálogo y reservá tu turno.', alternates: { canonical: '/servicios' } };

export default function ServiciosPage() {
  return (
    <main className="inner-page">
      {/* HEADER */}
      <SiteHeader />

      {/* HERO */}
      <section className="inner-hero">
        <span className="eyebrow">LUMIÈRE BEAUTY</span>

        <h1>
          Servicios Lumière
        </h1>

        <p>
          Cuidado, belleza y bienestar en un solo lugar.
          Descubrí nuestros tratamientos y encontrá el indicado para vos.
        </p>
      </section>

      {/* SERVICIOS */}
      <section className="section lumiere-services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <h2 id="services-title">Un momento para vos</h2>
        </div>
        <ServicesCatalog />
        <ServicesHelp />
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <BrandLogo variant="footer" />
          <p>Beauty · Care · Lifestyle</p>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Lumière Beauty</span>
          <span>Todos los derechos reservados.</span>
        </div>
      </footer>
    </main>
  );
}
