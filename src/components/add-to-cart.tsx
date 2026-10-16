'use client';
import { useState } from 'react';
import { addToCart, openCartDrawer, useCartBusy } from './cart-store';
import { track } from '../lib/analytics';
export function AddToCart({id,name,priceCents}:{id:string;name:string;priceCents:number}){
  const [message,setMessage]=useState('');
  const busy=useCartBusy();
  return <div className="shop-add-to-cart"><button type="button" className="platform-cart-button" disabled={busy} onClick={()=>{try{addToCart(id);setMessage('');track({event:'add_to_cart',event_id:crypto.randomUUID(),ecommerce:{currency:'ARS',value:priceCents/100,items:[{item_id:id,item_name:name,price:priceCents/100,quantity:1}]}});openCartDrawer();}catch(error){setMessage(error instanceof Error?error.message:'No se pudo agregar');}}}>Agregar al carrito</button><p className="shop-add-message" role="status">{message}</p></div>;
}
