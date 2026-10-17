'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { BrandLogo } from '../app/components/brand-logo';
import { ShopNavTools } from './cart-trigger';

export function SiteHeader({ home = false }: { home?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const links = [
    { href: home ? '#inicio' : '/', label: 'Inicio' },
    { href: home ? '#insumos' : '/insumos', label: 'Insumos' },
    { href: home ? '#servicios' : '/servicios', label: 'Servicios' },
    { href: home ? '#nosotros' : '/#nosotros', label: 'Nosotras' },
    { href: '/reservar', label: 'Reservar en Lumière' },
    { href: '/fidelidad', label: 'Mis sellos' },
  ];

  return <>
    <header className="navbar unified-navbar">
      <Link href={home ? '#inicio' : '/'} className="brand-home" aria-label="Lumière — Inicio"><BrandLogo /></Link>
      <nav className="main-nav" aria-label="Navegación principal">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      <div className="nav-actions">
        <ShopNavTools />
        <a href="https://lumiere.site.agendapro.com/ar/sucursal/144425" className="nav-appointment">AGENDAR TURNO</a>
        <button ref={menuButton} type="button" className="menu-button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="lumiere-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '×' : '☰'}</button>
      </div>
    </header>
    {menuOpen && <nav className="mobile-menu" id="lumiere-mobile-menu" aria-label="Menú móvil" onKeyDown={event => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } }}>
      {links.map(link => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
      <a href="https://lumiere.site.agendapro.com/ar/sucursal/144425" className="mobile-menu-button" onClick={() => setMenuOpen(false)}>AGENDAR TURNO</a>
    </nav>}
  </>;
}
