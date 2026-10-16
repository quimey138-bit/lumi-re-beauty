'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, useCartBusy, writeCart } from './cart-store';
import { quoteCart } from '../domain/commerce';
import { cartSuggestions, changeCartQuantity } from '../domain/storefront';
import { money } from '../data/products';
import { CartLineItem } from './cart-line-item';
import { AddToCart } from './add-to-cart';
import { ShippingEstimate } from './shipping-estimate';
import { BagIcon } from './shop-icons';

export function CartDrawer() {
  const lines = useCart();
  const busy = useCartBusy();
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const quote = lines.length ? quoteCart(lines) : { items: [], total: 0 };
  const suggestions = cartSuggestions(lines);
  const suggestionContent = <><span className="shop-eyebrow">PARA TU RUTINA</span><h3>También te puede gustar</h3><div className="shop-suggestions-list">{suggestions.map(product => <article key={product.id}><div className="shop-suggestion-photo"><Image src={`/products/${product.image}`} alt={product.name} fill sizes="(max-width: 600px) 150px, 160px" /></div><h4>{product.name}</h4><p>{money(product.priceCents)}</p><AddToCart id={product.id} name={product.name} priceCents={product.priceCents} /></article>)}</div></>;

  useEffect(() => {
    const show = () => { if (!dialog.current?.open) previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setMessage(''); setOpen(true); };
    window.addEventListener('lumiere-cart-open', show);
    return () => window.removeEventListener('lumiere-cart-open', show);
  }, []);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previousOverflow = document.body.style.overflow;
    if (!element.open) element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { if (element.open) element.close(); document.body.style.overflow = previousOverflow; previousFocus.current?.focus(); };
  }, [open]);

  function update(id: string, quantity: number) {
    try { writeCart(changeCartQuantity(lines, id, quantity)); setMessage(''); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el carrito'); }
  }

  return <dialog ref={dialog} className="shop-cart-dialog" aria-labelledby="shop-cart-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false); } }}>
    <div className={`shop-drawer-layout${suggestions.length ? ' has-suggestions' : ''}`}>
      {suggestions.length > 0 && <aside className="shop-cart-suggestions shop-suggestions" aria-label="Sugerencias de productos">{suggestionContent}</aside>}
      <section className="shop-cart-main"><header className="shop-cart-header"><div><span className="shop-eyebrow">TU SELECCIÓN LUMIÈRE</span><h2 id="shop-cart-title">Tu carrito <small>({lines.reduce((total, line) => total + line.quantity, 0)})</small></h2></div><button type="button" className="shop-cart-close" aria-label="Cerrar carrito" onClick={() => setOpen(false)} autoFocus>×</button></header>
        <div className="shop-cart-scroll">{quote.items.length ? <><div className="shop-cart-lines">{quote.items.map(item => <CartLineItem key={item.id} item={item} disabled={busy} update={update} />)}</div><p role="status" className="shop-cart-status">{message}</p><div className="shop-pickup"><strong>Retiro en el estudio · Sin costo</strong><a href="https://maps.app.goo.gl/wK2Db8JKDRtgoRxe8" target="_blank" rel="noopener noreferrer">Ver ubicación en Palermo ↗</a></div><ShippingEstimate /></> : <div className="shop-cart-empty"><BagIcon /><h3>Tu próximo ritual empieza acá.</h3><p>Todavía no agregaste productos.</p><Link href="/insumos" onClick={() => setOpen(false)}>Descubrir la selección →</Link></div>}{suggestions.length > 0 && <section className="shop-mobile-suggestions shop-suggestions" aria-label="Sugerencias de productos">{suggestionContent}</section>}</div>
        {quote.items.length > 0 && <footer className="shop-cart-footer"><p className="shop-cart-subtotal"><span>Subtotal</span><strong>{money(quote.total)}</strong></p><p className="shop-cart-disclaimer">Precios en pesos argentinos. Stock y precios finales se verifican antes de pagar. Retiro en el estudio.</p><Link className="shop-button-outline" href="/carrito" onClick={() => setOpen(false)}>Ver carrito</Link><Link className="shop-button-solid" href="/checkout" onClick={() => setOpen(false)}>Finalizar compra →</Link></footer>}
      </section>
    </div>
  </dialog>;
}
