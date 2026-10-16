import { expect, it, vi } from 'vitest';

// The identity boundary normally needs Next request cookies and remote Auth.
// Use an authenticated fixture so the test catches a booking-payment bypass.
vi.mock('../src/server/auth', () => ({
  getIdentity: async () => ({
    profile: { full_name: 'Prueba', phone: '5491100000000' },
    db: { rpc: async () => ({ data: 'unexpected-booking', error: null }) },
  }),
}));

import { POST } from '../src/app/api/appointments/route';

it('rejects direct booking requests while deposit verification is unavailable', async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-test-value');
  try {
    const response = await POST(new Request('https://lumiere.example/api/appointments', {
      method: 'POST',
      headers: { Origin: 'https://lumiere.example', 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'test', professional: '11111111-1111-4111-8111-111111111111', start: '2026-12-01T13:00:00Z', key: '22222222-2222-4222-8222-222222222222' }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty('id');
  } finally {
    vi.unstubAllEnvs();
  }
});
