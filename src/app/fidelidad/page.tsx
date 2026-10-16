import Link from 'next/link';
import { PlatformShell } from '../../components/platform-shell';
import { LoyaltyCard } from '../../components/loyalty-card';
import { getIdentity } from '../../server/auth';
import { loadLoyaltyCard } from '../../server/loyalty-card';
import { supabaseConfig } from '../../lib/config';
import { createClient } from '../../lib/supabase/server';
import './sellos.css';

export const metadata={title:'Mis sellos | Lumière',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';

export default async function Page() {
  const identity=supabaseConfig()?await getIdentity():null;
  if(!identity) {
    const db=await createClient();
    const rule=db?await db.from('reward_rules').select('discount_percent').eq('milestone',6).eq('enabled',true).maybeSingle():null;
    const discount=rule?.error?'Descuento especial':`${rule?.data?.discount_percent??20}% de descuento`;
    return <div className="ritual-page"><PlatformShell title="Cada visita, un detalle"><section className="ritual-welcome"><p>Tu ritual de cuidado también tiene recompensas. Ingresá para ver tu cartilla, tus sellos y los detalles que te esperan.</p><ul><li><strong>{discount}</strong><span>A los 6 sellos</span></li><li><strong>Un regalo sorpresa</strong><span>A los 8 sellos · Entrega en el estudio</span></li><li><strong>Un producto para vos</strong><span>A los 15 sellos · Entrega en el estudio</span></li></ul><Link href="/ingresar?next=%2Ffidelidad">Ingresar para ver mis sellos</Link><small>El equipo acredita un sello por cada visita completada. Las condiciones y el canje de los premios se confirman en el estudio.</small></section></PlatformShell></div>;
  }
  const data=await loadLoyaltyCard(identity);
  return <div className="ritual-page"><PlatformShell title={`Hola, ${identity.profile.full_name||'bienvenida'}`}><LoyaltyCard data={data}/></PlatformShell></div>;
}
