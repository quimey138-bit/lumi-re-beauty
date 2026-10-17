import type { Metadata } from "next";
import "./globals.css";
import "./platform.css";
import "./storefront.css";
import { CartDrawer } from "../components/cart-drawer";
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
      <body>{children}<CartDrawer /><WhatsAppButton /><Analytics /><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(businessSchema(siteUrl()))}}/>{siteUrl()&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(productSchema(siteUrl()!))}}/>}</body>
    </html>
  );
}
