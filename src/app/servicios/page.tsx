import { BrandLogo } from "../components/brand-logo";
import Link from "next/link";
import { ServicesCatalog, ServicesHelp } from "../components/services";

export default function ServiciosPage() {
  return (
    <main className="inner-page">
      {/* HEADER */}
      <header className="navbar">
        <Link href="/" className="brand-home" aria-label="Lumière — Inicio">
    <BrandLogo />
  </Link>

        <nav className="main-nav">
          <Link href="/">Inicio</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/insumos">Insumos</Link>
          <Link href="/#nosotros">Nosotras</Link>
        </nav>

        <div className="nav-actions">
          <Link href="https://lumiere.site.agendapro.com/ar/sucursal/144425" className="nav-appointment">
            AGENDAR TURNO
          </Link>
        </div>
      </header>

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