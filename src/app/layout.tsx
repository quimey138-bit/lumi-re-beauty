import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppButton } from "./components/whatsapp-button";

export const metadata: Metadata = {
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
    <html lang="es">
      <body>{children}<WhatsAppButton /></body>
    </html>
  );
}