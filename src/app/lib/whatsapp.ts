export function whatsappUrl(message = "Hola, quiero hacer una consulta sobre Lumière.") {
  return `https://wa.me/5491158875779?text=${encodeURIComponent(message)}`;
}
