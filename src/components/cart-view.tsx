'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart,writeCart,lockCartForCheckout,useCartBusy } from './cart-store';
import { quoteCart } from '../domain/commerce';
import { money } from '../data/products';
import { track } from '../lib/analytics';
import { consentReceipt } from '../lib/privacy';
import { CartLineItem } from './cart-line-item';
import { ShippingEstimate } from './shipping-estimate';
import { changeCartQuantity,cartFingerprint } from '../domain/storefront';
export function CartView({checkout=false,enabled=false}:{checkout?:boolean;enabled?:boolean}){
  const lines=useCart();const [message,setMessage]=useState('');const busy=useCartBusy();const [attempt,setAttempt]=useState<{fingerprint:string;key:string}|null>(null);
  if(!lines.length)return <section className="platform-card"><p>Tu carrito está vacío.</p><Link href="/insumos">Descubrir productos →</Link></section>;
  const quote=quoteCart(lines);
  function update(id:string,quantity:number){try{writeCart(changeCartQuantity(lines,id,quantity));setMessage('');}catch(error){setMessage(error instanceof Error?error.message:'No se pudo actualizar');}}
  async function pay(){
    if(busy)return;
    const release=lockCartForCheckout();setMessage('');const fingerprint=cartFingerprint(lines);const requestKey=attempt?.fingerprint===fingerprint?attempt.key:crypto.randomUUID();setAttempt({fingerprint,key:requestKey});
    try{
      track({event:'begin_checkout',event_id:requestKey,ecommerce:{currency:'ARS',value:quote.total/100,items:quote.items.map(i=>({item_id:i.id,item_name:i.name,price:i.priceCents/100,quantity:i.quantity}))}});
      let consent=false;try{consent=localStorage.getItem('lumiere-consent')==='granted';}catch{}
      const response=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lines,key:requestKey,consent,consentToken:consent?consentReceipt():undefined})});const data=await response.json();
      if(!response.ok)throw new Error(data.error);window.location.assign(data.url);
    }catch(error){setMessage(error instanceof Error?error.message:'No se pudo iniciar el pago');release();}
  }
  return <section className="platform-card shop-cart-page"><div>{quote.items.map(item=><CartLineItem key={item.id} item={item} disabled={busy} update={update}/>)}</div>
    <div className="shop-cart-page-summary"><h2>Subtotal: {money(quote.total)}</h2><div className="shop-pickup"><strong>Retiro en el estudio · Sin costo</strong><a href="https://maps.app.goo.gl/wK2Db8JKDRtgoRxe8" target="_blank" rel="noopener noreferrer">Ver ubicación en Palermo ↗</a></div><p>Los envíos por Correo Argentino estarán disponibles al habilitar la cotización. Por ahora, el checkout es solo para retiro.</p><ShippingEstimate/>
    {checkout?<><p>El stock y los precios se verifican nuevamente antes de pagar.</p><button disabled={!enabled||busy} onClick={pay}>{busy?'Preparando pago…':'Pagar con Mercado Pago'}</button>{!enabled&&<p role="status">Los pagos online todavía no están habilitados. No se realizará ningún cobro.</p>}</>:<Link className="primary-button" href="/checkout">Continuar al checkout</Link>}<p role="status">{message}</p></div>
  </section>;
}
