const products = [
  {
    number: "01",
    category: "BELLEZA",
    name: "Producto destacado",
  },
  {
    number: "02",
    category: "SKINCARE",
    name: "Producto destacado",
  },
  {
    number: "03",
    category: "MAQUILLAJE",
    name: "Producto destacado",
  },
  {
    number: "04",
    category: "ACCESORIOS",
    name: "Producto destacado",
  },
];

export default function InsumosPage() {
  return (
    <main className="inner-page">
      {/* HEADER */}
      <header className="navbar">
        <a href="/" className="logo-text">
          LUMIÈRE
        </a>

        <nav className="main-nav">
          <a href="/">Inicio</a>
          <a href="/servicios">Servicios</a>
          <a href="/insumos">Insumos</a>
          <a href="/#nosotros">Nosotras</a>
        </nav>

        <div className="nav-actions">
          <a href="/#contacto" className="nav-appointment">
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

        <div className="insumos-grid">
          {products.map((product) => (
            <article className="insumo-page-card" key={product.number}>
              <div className="insumo-image">
                <span>{product.number}</span>

                <div>
                  <small>{product.category}</small>
                  <strong>LUMIÈRE</strong>
                </div>
              </div>

              <div className="insumo-info">
                <span>{product.category}</span>

                <h3>{product.name}</h3>

                <p>Consultar disponibilidad</p>

                <a href="/#contacto">
                  CONSULTAR →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="page-cta">
        <span className="eyebrow">LUMIÈRE</span>

        <h2>
          ¿Buscás algo
          <br />
          en particular?
        </h2>

        <a href="/#contacto" className="primary-button">
          CONSULTAR
        </a>
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