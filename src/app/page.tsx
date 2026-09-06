"use client";
import { useState } from "react";
import { whatsappUrl } from "./lib/whatsapp";
import { ServicesGrid, ServicesHelp } from "./components/services";
const categories = [
  {
    name: "Skincare",
    description: "Cuidado y bienestar para tu piel",
  },
  {
    name: "Maquillaje",
    description: "Todo para crear tu look",
  },
  {
    name: "Perfumería",
    description: "Fragancias para cada momento",
  },
  {
    name: "Accesorios",
    description: "Detalles que completan tu estilo",
  },
];

const products = [
  {
    name: "Producto destacado",
    category: "Belleza",
    price: "Consultar",
  },
  {
    name: "Producto destacado",
    category: "Skincare",
    price: "Consultar",
  },
  {
    name: "Producto destacado",
    category: "Maquillaje",
    price: "Consultar",
  },
  {
    name: "Producto destacado",
    category: "Accesorios",
    price: "Consultar",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main>

{/* NAVBAR */}
<header className="navbar">
  <a href="#inicio" className="logo-text">
    LUMIÈRE
  </a>

  <nav className="main-nav">
    <a href="#inicio">Inicio</a>
    <a href="#servicios">Servicios</a>
    <a href="#insumos">Insumos</a>
    <a href="#nosotros">Nosotras</a>
  </nav>

  <div className="nav-actions">
    <a href="/turnos" className="nav-appointment">
      AGENDAR TURNO
    </a>

        <button
      className="menu-button"
      aria-label="Abrir menú"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      {menuOpen ? "×" : "☰"}
    </button>
  </div>
</header>
{menuOpen && (
  <div className="mobile-menu">
    <a href="#inicio" onClick={() => setMenuOpen(false)}>
      Inicio
    </a>

    <a href="#servicios" onClick={() => setMenuOpen(false)}>
      Servicios
    </a>

    <a href="#insumos" onClick={() => setMenuOpen(false)}>
      Insumos
    </a>

    <a href="#nosotros" onClick={() => setMenuOpen(false)}>
      Nosotras
    </a>

    <a
      href="/turnos"
      className="mobile-menu-button"
      onClick={() => setMenuOpen(false)}
    >
      AGENDAR TURNO
    </a>
  </div>
)}

{/* HERO */}
<section id="inicio" className="hero">
  <div className="hero-content">
    <span className="eyebrow">LUMIÈRE BEAUTY</span>

    <h1>
      Tu mejor versión
      <br />
      empieza en Lumière.
    </h1>

    <p>
      Un espacio pensado para vos, donde belleza, cuidado y
      bienestar se encuentran.
    </p>

    <div className="hero-buttons">
      <a
        href="/turnos"
        className="primary-button"
      >
        AGENDAR TURNO
      </a>

      <a
        href="#insumos"
        className="secondary-button"
      >
        VER INSUMOS
      </a>
    </div>
  </div>

  <div className="hero-visual">
    <div className="hero-placeholder">
      <span>BEAUTY · CARE · LIFESTYLE</span>
      <strong>LUMIÈRE</strong>
    </div>
  </div>
</section>

{/* SERVICIOS */}
<section id="servicios" className="section lumiere-services-section">
  <div className="section-heading">
    <span className="eyebrow">SERVICIOS LUMIÈRE</span>
    <h2>Cuidado, belleza y bienestar en un solo lugar</h2>
    <p>Descubrí nuestros tratamientos y encontrá el indicado para vos.</p>
  </div>
  <ServicesGrid />
  <ServicesHelp />
</section>

{/* INSUMOS */}
<section id="insumos" className="section products-section">
  <div className="section-heading products-heading">
    <div>
      <span className="eyebrow">LUMIÈRE BEAUTY</span>

      <h2>Insumos</h2>

      <p>
        Descubrí nuestra selección de productos y encontrá
        todo lo que necesitás.
      </p>
    </div>

    <a href="#contacto" className="text-link">
      CONSULTAR →
    </a>
  </div>

  <div className="products-grid">
    {products.map((product, index) => (
      <article className="product-card" key={index}>
        <div className="product-image">
          <span className="product-number">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="product-placeholder">
            <span>{product.category}</span>
            <strong>LUMIÈRE</strong>
          </div>
        </div>

        <div className="product-info">
          <span className="product-category">
            {product.category}
          </span>

          <h3>{product.name}</h3>

          <p className="product-price">
            {product.price}
          </p>

          <a href="#contacto" className="product-link">
            CONSULTAR →
          </a>
        </div>
      </article>
    ))}
  </div>
</section>
      {/* BANNER */}
      <section className="ritual-banner">
        <div>
          <span className="eyebrow">TU MOMENTO</span>

          <h2>
            La belleza también
            <br />
            es un ritual.
          </h2>

          <p>
            Tomate un momento para vos.
          </p>

          <a href="#productos" className="primary-button">
            DESCUBRIR
          </a>
        </div>
      </section>

{/* SOBRE LUMIÈRE */}
<section id="nosotros" className="about-section">
  <div className="about-image">
    <div className="about-placeholder">
      <span>LUMIÈRE BEAUTY</span>
      <strong>Tu momento</strong>
    </div>
  </div>

  <div className="about-content">
    <span className="eyebrow">SOBRE LUMIÈRE</span>

    <h2>
      Tu mejor versión
      <br />
      empieza acá.
    </h2>

    <p>
      Lumière es un espacio pensado para acompañarte en tus
      momentos de belleza y cuidado personal.
    </p>

    <p>
      Descubrí nuestros servicios, conocé nuestros insumos y
      encontrá un momento para vos.
    </p>

    <a href="#contacto" className="text-link">
      CONOCÉ LUMIÈRE →
    </a>
  </div>
</section>

{/* CONTACTO */}
<section id="contacto" className="contact-section">
  <div className="contact-heading">
    <span className="eyebrow">CONTACTO</span>

    <h2>
      Estamos para
      <br />
      ayudarte.
    </h2>

    <p>
      ¿Tenés una consulta o querés reservar tu turno?
      Ponete en contacto con Lumière.
    </p>
  </div>

  <div className="contact-actions">
    <a
      href="https://lumiere.site.agendapro.com"
      className="contact-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>01</span>

      <div>
        <small>TURNOS</small>
        <h3>Agendá tu turno</h3>
      </div>

      <strong>↗</strong>
    </a>

    <a
      href={whatsappUrl()}
      className="contact-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>02</span>

      <div>
        <small>CONSULTAS</small>
        <h3>WhatsApp</h3>
      </div>

      <strong>↗</strong>
    </a>

    <a
      href="https://www.instagram.com/lumierebeauty.ar"
      className="contact-card"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>03</span>

      <div>
        <small>REDES</small>
        <h3>Instagram</h3>
      </div>

      <strong>↗</strong>
    </a>
  </div>
</section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <div className="logo-text">LUMIÈRE</div>
          <p>Beauty · Skincare · Lifestyle</p>
        </div>

        <div className="footer-links">
          <div>
            <h4> TIENDA </h4>
            <a href="#productos">Productos</a>
            <a href="#categorias">Categorías</a>
          </div>

          <div>
            <h4> AYUDA </h4>
            <a href="#">Preguntas frecuentes</a>
            <a href="#">Envíos</a>
            <a href="#">Contacto</a>
          </div>

          <div>
            <h4>SEGUINOS</h4>
            <a href="#">Instagram</a>
            <a href="#">Tik Tok</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Lumière Beauty</span>
          <span>Todos los derechos reservados</span>
        </div>
      </footer>
    </main>
  );
}