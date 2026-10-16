import { products } from '../data/products';
import { quoteCart, type CartLine } from './commerce';

export function changeCartQuantity(lines: CartLine[], id: string, quantity: number): CartLine[] {
  if (!lines.some(line => line.id === id)) throw new Error('El producto ya no está en el carrito');
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) throw new Error('Elegí entre 1 y 20 unidades');
  const updated = quantity === 0 ? lines.filter(line => line.id !== id) : lines.map(line => line.id === id ? { ...line, quantity } : line);
  if (updated.length) quoteCart(updated);
  return updated;
}

export function cartSuggestions(lines: CartLine[]) {
  const present = new Set(lines.map(line => line.id));
  return products.filter(product => !present.has(product.id)).slice(0, 4);
}

export function cartFingerprint(lines: CartLine[]) {
  return JSON.stringify(lines.map(line => ({ id: line.id, quantity: line.quantity })).sort((first, second) => first.id.localeCompare(second.id)));
}

export function carouselPagination(width: number, cardWidth: number, gap: number, itemCount: number, scrollLeft: number, scrollWidth: number) {
  if (width <= 0 || cardWidth <= 0 || itemCount <= 0) return { page: 0, pages: 1, perPage: 1, atStart: true, atEnd: true };
  const perPage = Math.max(1, Math.round((width + gap) / (cardWidth + gap)));
  const pages = Math.max(1, Math.ceil(itemCount / perPage));
  const page = scrollWidth - width - scrollLeft <= 2 ? pages - 1 : Math.min(pages - 1, Math.max(0, Math.round(scrollLeft / (perPage * (cardWidth + gap)))));
  return { page, pages, perPage, atStart: scrollLeft <= 2, atEnd: scrollWidth - width - scrollLeft <= 2 };
}
