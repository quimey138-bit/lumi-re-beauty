import Link from "next/link";
import { BrandLogo } from "../components/brand-logo";
import { ProductsGrid } from "../components/products";
import { whatsappUrl } from "../lib/whatsapp";

export default function InsumosPage() {
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
          <a href="https://lumiere.site.agendapro.com/ar/sucursal/144425" className="nav-appointment">
            AGENDAR TURNO
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="inner-hero">
        <span className="eyebrow">LUMIÈRE BEAUTY</span>

        <h1>
          Todo lo que
          <br />
          necesitás.
        </h1>

        <p>
          Descubrí nuestra selección de insumos y productos
          pensados para acompañar tu rutina de belleza.
        </p>
      </section>

      {/* PRODUCTOS */}
      <section className="insumos-page-section">
        <div className="section-heading">
          <span className="eyebrow">SELECCIÓN LUMIÈRE</span>

          <h2>Insumos</h2>

          <p>
            Una selección de productos para acompañarte
            en cada momento.
          </p>
        </div>

        <ProductsGrid />
      </section>

      {/* CTA */}
      <section className="page-cta">
        <span className="eyebrow">LUMIÈRE</span>

        <h2>
          ¿Buscás algo
          <br />
          en particular?
        </h2>

        <a href={whatsappUrl("Hola, quiero consultar por los productos de Lumière.")} className="primary-button">
          CONSULTAR
        </a>
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
