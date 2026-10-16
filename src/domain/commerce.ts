import { z } from 'zod';
import { products } from '../data/products';
export type CartLine = { id: string; quantity: number };
const cartSchema = z.array(z.object({ id: z.string().max(80), quantity: z.number().int().min(1).max(20) })).min(1).max(30);
export function quoteCart(input: unknown) {
  const lines = cartSchema.parse(input);
  if (new Set(lines.map(l => l.id)).size !== lines.length) throw new Error('Productos duplicados');
  const items = lines.map(line => {
    const product = products.find(p => p.id === line.id);
    if (!product) throw new Error('Producto no disponible');
    return { ...line, name: product.name, priceCents: product.priceCents, subtotal: product.priceCents * line.quantity };
  });
  return { items, total: items.reduce((sum, item) => sum + item.subtotal, 0), currency: 'ARS' as const };
}
export function parseCart(raw: unknown): CartLine[] {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(value) && value.length === 0) return [];
    return quoteCart(value).items.map(({ id, quantity }) => ({ id, quantity }));
  } catch { return []; }
}
