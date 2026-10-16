'use client';
import { useSyncExternalStore,useMemo } from 'react';
import { parseCart,type CartLine } from '../domain/commerce';
const key='lumiere-cart-v1';
let checkoutBusy=false;
export function useCartBusy(){return useSyncExternalStore(subscribe,()=>checkoutBusy,()=>false);}
export function lockCartForCheckout(){
  if(checkoutBusy)throw new Error('Ya se está preparando el pago');
  checkoutBusy=true;window.dispatchEvent(new Event('lumiere-cart'));
  return()=>{checkoutBusy=false;window.dispatchEvent(new Event('lumiere-cart'));};
}
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener('lumiere-cart',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('lumiere-cart',callback);};}
function snapshot(){try{return localStorage.getItem(key)||'[]';}catch{return '[]';}}
export function useCart(){const raw=useSyncExternalStore(subscribe,snapshot,()=>'[]');return useMemo(()=>parseCart(raw),[raw]);}
export function writeCart(lines:CartLine[]){
  if(checkoutBusy)throw new Error('Esperá a que termine de prepararse el pago para modificar el carrito');
  const clean=parseCart(lines);if(lines.length&&!clean.length)throw new Error('Revisá las cantidades del carrito');
  try{localStorage.setItem(key,JSON.stringify(clean));window.dispatchEvent(new Event('lumiere-cart'));}catch{throw new Error('Habilitá el almacenamiento del navegador para guardar tu carrito');}
}
export function addToCart(id:string){const lines=parseCart(snapshot());const current=lines.find(l=>l.id===id);if(current)current.quantity+=1;else lines.push({id,quantity:1});writeCart(lines);}
export function openCartDrawer(){window.dispatchEvent(new Event('lumiere-cart-open'));}
