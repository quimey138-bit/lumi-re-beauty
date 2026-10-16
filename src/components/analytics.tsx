'use client';
import Script from 'next/script';
import {useSyncExternalStore,useState} from 'react';
function subscribe(callback:()=>void){window.addEventListener('lumiere-consent',callback);window.addEventListener('storage',callback);return()=>{window.removeEventListener('lumiere-consent',callback);window.removeEventListener('storage',callback);};}
function snapshot(){try{return localStorage.getItem('lumiere-consent')||'unknown';}catch{return 'denied';}}
export function Analytics(){
  const consent=useSyncExternalStore(subscribe,snapshot,()=>'unknown');const [editing,setEditing]=useState(false);const [message,setMessage]=useState('');
  const gtm=/^GTM-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GTM_ID||'')?process.env.NEXT_PUBLIC_GTM_ID:'';
  const ga=/^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA4_ID||'')?process.env.NEXT_PUBLIC_GA4_ID:'';
  const pixel=/^\d+$/.test(process.env.NEXT_PUBLIC_META_PIXEL_ID||'')?process.env.NEXT_PUBLIC_META_PIXEL_ID:'';
  async function choose(value:string){
    setMessage('');
    try{
      if(value==='granted'&&localStorage.getItem('lumiere-consent')!=='granted')localStorage.setItem('lumiere-consent-receipt',crypto.randomUUID());
      localStorage.setItem('lumiere-consent',value);window.dispatchEvent(new Event('lumiere-consent'));
      window.fbq?.('consent',value==='granted'?'grant':'revoke');
      window.gtag?.('consent','update',{analytics_storage:value==='granted'?'granted':'denied',ad_storage:value==='granted'?'granted':'denied',ad_user_data:value==='granted'?'granted':'denied',ad_personalization:value==='granted'?'granted':'denied'});
      const token=localStorage.getItem('lumiere-consent-receipt');
      if(value!=='granted'&&token){const response=await fetch('/api/privacy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});if(!response.ok){setMessage('Preferencias locales guardadas. No se pudo actualizar la medición de compras; intentá guardar nuevamente.');return;}}
    }catch{setMessage('No se pudieron guardar las preferencias. La medición queda deshabilitada.');return;}
    setEditing(false);
  }
  return <>{consent==='granted'&&<>
    {gtm&&<Script id="lumiere-gtm" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments)};gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id=${gtm}';document.head.appendChild(s);`}</Script>}
    {!gtm&&ga&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive"/><Script id="lumiere-ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${ga}');`}</Script></>}
    {pixel&&<Script id="lumiere-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>}
  </>}
    {(consent==='unknown'||editing)?<aside className="consent-banner" aria-label="Preferencias de privacidad"><p>Podemos usar cookies de medición y publicidad para entender cómo se usa Lumière. Elegí si querés habilitarlas.</p><button onClick={()=>choose('granted')}>Aceptar</button><button onClick={()=>choose('denied')}>Solo necesarias</button><p role="status">{message}</p></aside>:<button className="consent-settings" onClick={()=>setEditing(true)}>Privacidad</button>}
  </>;
}
