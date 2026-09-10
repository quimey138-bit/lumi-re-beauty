import Image from "next/image";
import { whatsappUrl } from "../lib/whatsapp";

const products = [
  { id: "limpiador-balsamo", name: "Limpiador / Bálsamo", category: "CUIDADO FACIAL", price: "$38.000", image: "limpiador-balsamo.jpg" },
  { id: "hidratantes-labios", name: "Hidratantes de labios con protector solar", category: "CUIDADO LABIAL", price: "$18.000", image: "hidratantes-labios.jpg" },
  { id: "home-spray", name: "Home spray - Verbena y Cher", category: "AROMAS", price: "$10.000", image: "home-spray.jpg" },
  { id: "body-splash", name: "Body Splash", category: "CUERPO", price: "$9.000", image: "body-splash.jpg" },
  { id: "ritual-mist", name: "Ritual mist", category: "BIENESTAR", price: "$9.000", image: "ritual-mist.jpg" },
  { id: "peines-guasha", name: "Peines / guasha", category: "ACCESORIOS", price: "$12.000", image: "peines-guasha.jpg" },
  { id: "vinchas", name: "Vinchas", category: "ACCESORIOS", price: "$9.500", image: "vinchas.jpg" },
  { id: "munequeras-skincare", name: "Muñequeras para skincare", category: "ACCESORIOS", price: "$20.000 el par", image: "munequeras-skincare.jpg" },
];

export function ProductsGrid() {
  return <div className="lumiere-products-grid">
    {products.map(product => <article className="lumiere-product" key={product.id}>
      <div className="lumiere-product-photo">
        {product.image ? <Image src={`/products/${product.image}`} alt={product.name} fill sizes="(max-width: 600px) 90vw, (max-width: 1000px) 44vw, 29vw" style={{ objectFit: "contain" }} /> : <span className="lumiere-product-pending">Fotografía próximamente</span>}
      </div>
      <div className="lumiere-product-info">
        <span className="lumiere-product-category">{product.category}</span>
        <h3>{product.name}</h3>
        <p className="lumiere-product-price">{product.price}</p>
        <a href={whatsappUrl(`Hola, quiero consultar disponibilidad de ${product.name} (${product.price}).`)} aria-label={`Consultar por WhatsApp: ${product.name}`}>CONSULTAR POR WHATSAPP →</a>
      </div>
    </article>)}
  </div>;
}
