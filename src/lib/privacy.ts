'use client';
export function consentReceipt(){
  let token=localStorage.getItem('lumiere-consent-receipt');
  if(!token){token=crypto.randomUUID();localStorage.setItem('lumiere-consent-receipt',token);}
  return token;
}
