'use client';

import { useState } from 'react';

export function ShippingEstimate() {
  const [message, setMessage] = useState('');
  return <details className="shop-shipping"><summary>Calcular envío <span aria-hidden="true">+</span></summary><p>Correo Argentino: cotización automática pendiente de habilitación. Por ahora podés comprar con retiro en el estudio.</p><form onSubmit={event => { event.preventDefault(); setMessage('La cotización para este destino todavía no está disponible. No se agregó ningún costo de envío. El checkout sigue disponible solo para retiro en el estudio.'); }}>
    <label>País<select name="country" defaultValue="AR"><option value="AR">Argentina</option></select></label>
    <label>Provincia / CABA<input name="province" autoComplete="address-level1" required maxLength={70} /></label>
    <label>Ciudad<input name="city" autoComplete="address-level2" required maxLength={100} /></label>
    <label>Código postal<input name="postcode" autoComplete="postal-code" required maxLength={8} pattern="[0-9]{4}|[A-Za-z][0-9]{4}[A-Za-z]{3}" title="Código postal de 4 números o CPA de 8 caracteres" placeholder="Ej.: 1425" /></label>
    <button type="submit">Consultar envío</button><p role="status">{message}</p>
  </form></details>;
}
