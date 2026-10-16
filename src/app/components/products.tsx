'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import { whatsappUrl } from '../lib/whatsapp';
import { products, money } from '../../data/products';
import { AddToCart } from '../../components/add-to-cart';
import { ProductEvent } from '../../components/product-event';
import { carouselPagination } from '../../domain/storefront';

function readPosition(element: HTMLUListElement) {
  const first = element.firstElementChild;
  if (!first) return { page: 0, pages: 1, perPage: 1, atStart: true, atEnd: true };
  const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
  return carouselPagination(element.clientWidth, first.getBoundingClientRect().width, gap, element.children.length, element.scrollLeft, element.scrollWidth);
}

function preservePosition(previous: ReturnType<typeof carouselPagination>, next: ReturnType<typeof carouselPagination>) {
  return previous.page === next.page && previous.pages === next.pages && previous.perPage === next.perPage && previous.atStart === next.atStart && previous.atEnd === next.atEnd ? previous : next;
}

export function ProductsGrid({ searchable = false }: { searchable?: boolean }) {
  const track = useRef<HTMLUListElement>(null);
  const trackId = useId();
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ page: 0, pages: 1, perPage: 1, atStart: true, atEnd: true });
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const matches = products.filter(product => normalize(product.name + ' ' + product.category).includes(normalize(query.trim())));
  const itemCount = matches.length;

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    element.scrollTo({left:0,behavior:'instant'});
    const observer = new ResizeObserver(() => { const next = readPosition(element); setPosition(previous => preservePosition(previous, next)); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [query]);

  function goToPage(page: number) {
    const element = track.current;
    const first = element?.firstElementChild;
    if (!element || !first) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    const target = Math.max(0, Math.min(position.pages - 1, page));
    const left = Math.min(element.scrollWidth - element.clientWidth, target * position.perPage * (first.getBoundingClientRect().width + gap));
    element.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  return <div className="products-carousel" role="region" aria-roledescription="carrusel" aria-label="Productos Lumière">
    <div className="products-carousel-toolbar">{searchable ? <label className="shop-product-search">Buscá tu producto<input id="buscar-productos" type="search" placeholder="Skincare, aromas, accesorios…" value={query} onChange={event => setQuery(event.target.value)} /></label> : <span className="shop-carousel-hint">Deslizá y descubrí tu próximo favorito</span>}<div className="products-carousel-arrows"><button type="button" aria-label="Ver productos anteriores" aria-controls={trackId} disabled={position.atStart || !itemCount} onClick={() => goToPage(position.page - 1)}>←</button><button type="button" aria-label="Ver más productos" aria-controls={trackId} disabled={position.atEnd || !itemCount} onClick={() => goToPage(position.page + 1)}>→</button></div></div>
    {itemCount ? <><ul ref={track} id={trackId} className="products-carousel-track" tabIndex={0} aria-label="Productos disponibles" onScroll={event => { const next = readPosition(event.currentTarget); setPosition(previous => preservePosition(previous, next)); }} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) { event.preventDefault(); goToPage(position.page + (event.key === 'ArrowRight' ? 1 : -1)); } }}>{matches.map(product => <li key={product.id} className="products-carousel-slide"><article className="lumiere-product" id={product.id}>
      <ProductEvent id={product.id} name={product.name} priceCents={product.priceCents} />
      <div className="lumiere-product-photo"><Image src={'/products/' + product.image} alt={product.name} fill sizes="(max-width: 600px) 80vw, (max-width: 1000px) 44vw, 23vw" style={{objectFit:'contain'}} /></div>
      <div className="lumiere-product-info"><span className="lumiere-product-category">{product.category}</span><h3>{product.name}</h3><p className="lumiere-product-price">{money(product.priceCents)}</p><AddToCart id={product.id} name={product.name} priceCents={product.priceCents} /><a href={whatsappUrl('Hola, quiero consultar disponibilidad de ' + product.name + ' (' + money(product.priceCents) + ').')} aria-label={'Consultar por WhatsApp: ' + product.name} target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a></div>
    </article></li>)}</ul><div className="products-carousel-pagination" aria-label="Páginas de productos">{Array.from({length:position.pages},(_,index)=><button type="button" key={index} aria-label={'Ver grupo ' + (index + 1) + ' de productos'} aria-pressed={position.page===index} aria-controls={trackId} onClick={()=>goToPage(index)} />)}<span role="status">{itemCount} productos · {position.page + 1} / {position.pages}</span></div></> : <div className="shop-product-empty"><p role="status">No encontramos productos con ese nombre.</p><button type="button" onClick={()=>setQuery('')}>Ver todos los productos</button></div>}
  </div>;
}
