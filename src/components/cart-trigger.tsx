'use client';

import Link from 'next/link';
import { useCart, openCartDrawer } from './cart-store';
import { AccountIcon, BagIcon, SearchIcon } from './shop-icons';

export function CartTrigger({ iconOnly = false }: { iconOnly?: boolean }) {
  const lines = useCart();
  const quantity = lines.reduce((total, line) => total + line.quantity, 0);
  return <button className={`shop-cart-trigger${iconOnly ? ' shop-cart-trigger-icon' : ''}`} type="button" aria-label={`Abrir carrito, ${quantity} ${quantity === 1 ? 'producto' : 'productos'}`} onClick={openCartDrawer}><BagIcon />{!iconOnly && <span>Carrito</span>}<span className="shop-cart-badge" aria-hidden="true">{quantity}</span></button>;
}

export function ShopNavTools() {
  return <div className="shop-nav-tools"><Link href="/insumos#buscar-productos" className="shop-icon-link" aria-label="Buscar productos"><SearchIcon /></Link><Link href="/cuenta" className="shop-icon-link" aria-label="Mi cuenta"><AccountIcon /></Link><CartTrigger iconOnly /></div>;
}
