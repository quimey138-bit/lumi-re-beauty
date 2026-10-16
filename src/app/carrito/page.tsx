import { PlatformShell } from '../../components/platform-shell';
import { CartView } from '../../components/cart-view';
export const metadata={title:'Carrito | Lumière',robots:{index:false,follow:false}};
export default function Page(){return <PlatformShell title="Tu carrito"><CartView/></PlatformShell>;}
