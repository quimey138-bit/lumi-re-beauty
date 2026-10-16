const destinations = new Set(['/cuenta', '/admin', '/profesional', '/reservar', '/fidelidad', '/checkout']);
export function safeNext(value: unknown): string {
  return typeof value === 'string' && destinations.has(value) ? value : '/cuenta';
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const target = new URL(request.url);
  // Next may normalize the internal hostname to localhost; Host is the browser's destination.
  const host = request.headers.get('host');
  if(host) target.host = host;
  return !!origin && origin === target.origin;
}
