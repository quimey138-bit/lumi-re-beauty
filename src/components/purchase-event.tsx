'use client';
import {useEffect} from 'react';
import {track,type CommerceEvent} from '../lib/analytics';
export function PurchaseEvent({event}:{event:CommerceEvent}){
  useEffect(()=>{
    const emit=()=>{try{if(sessionStorage.getItem(`purchase:${event.event_id}`))return;if(track(event))sessionStorage.setItem(`purchase:${event.event_id}`,'1');}catch{/* Tracking cannot block checkout. */}};
    emit();window.addEventListener('lumiere-consent',emit);return()=>window.removeEventListener('lumiere-consent',emit);
  },[event]);return null;
}
