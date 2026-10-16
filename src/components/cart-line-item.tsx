import Image from 'next/image';
import { products, money } from '../data/products';
import { RemoveIcon } from './shop-icons';

export type CartItem = { id: string; name: string; priceCents: number; quantity: number; subtotal: number };

export function CartLineItem({ item, update, disabled = false }: { item: CartItem; update: (id: string, quantity: number) => void; disabled?: boolean }) {
  const product = products.find(entry => entry.id === item.id);
  return <article className="shop-cart-item">
    <div className="shop-cart-image">{product && <Image src={`/products/${product.image}`} alt={item.name} fill sizes="84px" />}</div>
    <div className="shop-cart-item-info"><h3>{item.name}</h3><p>{money(item.priceCents)} <small>por unidad</small></p><div className="shop-quantity" role="group" aria-label={`Cantidad de ${item.name}`}><button type="button" aria-label={`Restar una unidad de ${item.name}`} disabled={disabled || item.quantity <= 1} onClick={() => update(item.id, item.quantity - 1)}>−</button><output aria-label={`Unidades de ${item.name}`}>{item.quantity}</output><button type="button" aria-label={`Sumar una unidad de ${item.name}`} disabled={disabled || item.quantity >= 20} onClick={() => update(item.id, item.quantity + 1)}>+</button></div><strong className="shop-cart-line-total">Subtotal: {money(item.subtotal)}</strong></div>
    <button className="shop-cart-remove" type="button" aria-label={`Quitar ${item.name} del carrito`} disabled={disabled} onClick={() => update(item.id, 0)}><RemoveIcon /></button>
  </article>;
}
