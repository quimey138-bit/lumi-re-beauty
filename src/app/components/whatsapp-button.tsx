import { whatsappUrl } from "../lib/whatsapp";

export function WhatsAppButton() {
  return (
    <a className="whatsapp-float" href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="Consultar a Lumière por WhatsApp (abre una pestaña nueva)">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a9 9 0 0 1-13.4 7.9L3 21l1.5-4.5A9 9 0 1 1 21 11.5Z" />
        <path d="M8 7.5c-.7 2.8 2.7 6.4 5.5 7.1.8.2 1.7-.4 2-1.2l-2-1.1-.9.8a8 8 0 0 1-2.7-2.7l.7-.9L9.5 7.5Z" />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
