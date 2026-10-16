'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="platform"><h1>No pudimos cargar esta sección</h1><section className="platform-card"><p>Intentá nuevamente en unos instantes. Si el problema continúa, contactá al estudio.</p><div className="platform-actions"><button onClick={reset}>Intentar de nuevo</button><Link href="/">Volver al inicio</Link></div></section></main>;
}
