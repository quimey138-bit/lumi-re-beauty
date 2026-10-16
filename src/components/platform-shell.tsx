import Link from 'next/link';
import type { ReactNode } from 'react';
export function PlatformShell({ title, children }: { title:string; children:ReactNode }) {
  return <main className="platform"><header><Link href="/">LUMIÈRE BEAUTY</Link><nav aria-label="Mi Lumière"><Link href="/reservar">Reservar</Link><Link href="/cuenta">Mi cuenta</Link><Link href="/carrito">Carrito</Link></nav></header><h1>{title}</h1>{children}</main>;
}
export function ConfigurationNotice() {
  return <section className="platform-card" role="status"><h2>Estamos preparando tu cuenta Lumière</h2><p>El acceso y las reservas propias estarán disponibles cuando el estudio termine de configurar el sistema.</p><p>Mientras tanto, podés reservar desde <a href="https://lumiere.site.agendapro.com/ar/sucursal/144425">AgendaPro</a>.</p></section>;
}
