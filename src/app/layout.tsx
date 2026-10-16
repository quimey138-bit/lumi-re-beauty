import type { Metadata } from "next";
import "./globals.css";
import "./platform.css";
import "./storefront.css";
import { CartDrawer } from "../components/cart-drawer";
import { CartTrigger } from "../components/cart-trigger";
import Link from "next/link";
import { Analytics } from "../components/analytics";
import { siteUrl } from "../lib/config";
import { businessSchema,productSchema,jsonLd } from "../lib/seo";
import { WhatsAppButton } from "./components/whatsapp-button";

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  metadataBase: siteUrl() ? new URL(siteUrl()!) : undefined,
  title: "Lumière Beauty",
  description:
    "Lumière Beauty — Tratamientos faciales, masajes, cejas y pestañas, corporales, manos y pies. Reservá tu turno online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body><div className="platform-toolbar" role="navigation" aria-label="Servicios online"><Link href="/cuenta">Mi cuenta</Link><Link href="/reservar">Reservar en Lumière</Link><CartTrigger /><Link href="/fidelidad">Mis sellos</Link></div>{children}<CartDrawer /><WhatsAppButton /><Analytics /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(businessSchema(siteUrl()))}}/>{siteUrl()&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(productSchema(siteUrl()!))}}/>}</body>
    </html>
  );
}
