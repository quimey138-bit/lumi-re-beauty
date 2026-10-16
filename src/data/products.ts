export const products = [
  { id: 'limpiador-balsamo', name: 'Limpiador / Bálsamo', category: 'CUIDADO FACIAL', priceCents: 3800000, image: 'limpiador-balsamo.jpg' },
  { id: 'hidratantes-labios', name: 'Hidratantes de labios con protector solar', category: 'CUIDADO LABIAL', priceCents: 1800000, image: 'hidratantes-labios.jpg' },
  { id: 'home-spray', name: 'Home spray - Verbena y Cher', category: 'AROMAS', priceCents: 1000000, image: 'home-spray.jpg' },
  { id: 'body-splash', name: 'Body Splash', category: 'CUERPO', priceCents: 900000, image: 'body-splash.jpg' },
  { id: 'ritual-mist', name: 'Ritual mist', category: 'BIENESTAR', priceCents: 900000, image: 'ritual-mist.jpg' },
  { id: 'peines-guasha', name: 'Peines / guasha', category: 'ACCESORIOS', priceCents: 1200000, image: 'peines-guasha.jpg' },
  { id: 'vinchas', name: 'Vinchas', category: 'ACCESORIOS', priceCents: 950000, image: 'vinchas.jpg' },
  { id: 'munequeras-skincare', name: 'Muñequeras para skincare (el par)', category: 'ACCESORIOS', priceCents: 2000000, image: 'munequeras-skincare.jpg' },
] as const;
export const money = (cents: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cents / 100);
