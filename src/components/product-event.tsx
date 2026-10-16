'use client';
import {useEffect,useRef} from 'react';
import {track} from '../lib/analytics';
export function ProductEvent({id,name,priceCents}:{id:string;name:string;priceCents:number}){
  const marker=useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const element=marker.current?.parentElement;if(!element)return;
    let visible=false,tracked=false;
    const emit=()=>{if(!visible||tracked)return;tracked=track({event:'view_item',event_id:crypto.randomUUID(),ecommerce:{currency:'ARS',value:priceCents/100,items:[{item_id:id,item_name:name,price:priceCents/100,quantity:1}]}});};
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);emit();},{threshold:0.25});
    observer.observe(element);window.addEventListener('lumiere-consent',emit);
    return()=>{observer.disconnect();window.removeEventListener('lumiere-consent',emit);};
  },[id,name,priceCents]);
  return <span ref={marker} hidden/>;
}
