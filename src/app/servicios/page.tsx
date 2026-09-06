import Link from "next/link";
import { ServicesGrid, ServicesHelp } from "../components/services";

export default function ServiciosPage() {
  return (
    <main className="inner-page">
      {/* HEADER */}
      <header className="navbar">
        <Link href="/" className="logo-text">
          LUMIÈRE
        </Link>

        <nav className="main-nav">
          <Link href="/">Inicio</Link>
          <Link href="/servicios">Servicios</Link>
          <Link href="/insumos">Insumos</Link>
          <Link href="/#nosotros">Nosotras</Link>
        </nav>

        <div className="nav-actions">
          <Link href="/#contacto" className="nav-appointment">
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
        <ServicesGrid />
        <ServicesHelp />
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="logo-text">LUMIÈRE</div>
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