import assert from 'node:assert/strict';

const base = new URL(process.argv[2] || 'http://127.0.0.1:3100');
assert(['127.0.0.1', 'localhost'].includes(base.hostname) && base.protocol === 'http:', 'Solo se permite un servidor local de prueba');
const cases = [
  { path:'/api/appointments', method:'POST', origin:base.origin, status:503 },
  { path:'/api/appointments', method:'PATCH', origin:'https://invalid.example.test', status:403 },
  { path:'/api/checkout', method:'POST', origin:base.origin, status:503 },
  { path:'/api/profile', method:'PATCH', origin:base.origin, status:503 },
  { path:'/api/cron/notifications', method:'GET', status:401 },
  { path:'/api/webhooks/mercadopago', method:'POST', status:503 },
];
for (const check of cases) {
  const headers = { 'Content-Type':'application/json', ...(check.origin ? { Origin:check.origin } : {}) };
  const response = await fetch(new URL(check.path, base), { method:check.method, headers, ...(check.method==='GET'?{}:{body:'{}'}), signal:AbortSignal.timeout(60000) });
  assert.equal(response.status, check.status, `${check.method} ${check.path}`);
  const data = await response.json(); assert.equal(typeof data.error, 'string');
  console.log(`PASS ${check.method} ${check.path}: ${response.status}`);
}
const callback=await fetch(new URL('/auth/callback',base),{redirect:'manual',signal:AbortSignal.timeout(60000)});
assert.equal(callback.status,307);
assert.equal(new URL(callback.headers.get('location')).origin,base.origin,'El callback debe conservar el origen público configurado');
console.log('PASS GET /auth/callback: redirección al origen público');
console.log('Pruebas HTTP sin credenciales: 7/7. No se crean reservas ni pagos.');
