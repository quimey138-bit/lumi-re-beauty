import { PlatformShell } from '../../components/platform-shell';
import { CartView } from '../../components/cart-view';
import { supabaseConfig,siteUrl } from '../../lib/config';
import { requireIdentity } from '../../server/auth';
export const metadata={title:'Checkout | Lumière',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Page(){
  if(supabaseConfig())await requireIdentity();
  const enabled=!!(supabaseConfig()&&siteUrl()&&process.env.MERCADOPAGO_ACCESS_TOKEN&&process.env.MERCADOPAGO_WEBHOOK_SECRET&&process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.MERCADOPAGO_ENABLED==='true');
  return <PlatformShell title="Finalizá tu compra"><CartView checkout enabled={enabled}/></PlatformShell>;
}
