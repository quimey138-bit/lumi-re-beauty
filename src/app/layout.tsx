import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./components/whatsapp-button";

export const metadata: Metadata = {
  title: "Lumière Beauty",
  description:
    "Lumière Beauty — Productos de belleza, skincare, maquillaje y perfumería.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}<WhatsAppButton /></body>
    </html>
  );
}