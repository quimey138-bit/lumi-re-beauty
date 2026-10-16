import { describe, expect, it } from 'vitest';
import { bookingDuration, bookingMoney, filterBookingServices, type BookingService } from '../src/domain/booking-catalog';
import { bookingTeamMember } from '../src/data/booking-team';

const services: BookingService[] = [
  { id: 'facial', name: 'SESIÓN HIGIENE PROFUNDA', category: 'Faciales', description: 'Hidratación de la piel', note: '', duration_minutes: 120, price_cents: 7200000 },
  { id: 'masaje', name: 'MASAJE CORPORAL', category: 'Masajes', description: 'Relajante con drenaje', note: '', duration_minutes: 90, price_cents: 5000000 },
];
const mappings = [{ service_id: 'facial', professional_id: 'natt' }, { service_id: 'masaje', professional_id: 'virginia' }];

describe('booking catalog', () => {
  it('searches accented names and descriptions without case or accent sensitivity', () => {
    expect(filterBookingServices(services, mappings, { query: 'sesion hidratacion', category: '', professional: '' }).map(item => item.id)).toEqual(['facial']);
  });
  it('combines category and professional filters without leaking unrelated services', () => {
    expect(filterBookingServices(services, mappings, { query: '', category: 'Faciales', professional: 'virginia' })).toEqual([]);
    expect(filterBookingServices(services, mappings, { query: 'corporal', category: 'Masajes', professional: 'virginia' }).map(item => item.id)).toEqual(['masaje']);
  });
  it('keeps the stored price and duration in the filtered catalog', () => {
    expect(filterBookingServices(services, mappings, { query: '', category: '', professional: '' })[0]).toBe(services[0]);
    expect(bookingMoney(7200000)).toContain('72.000');
    expect(bookingDuration(90)).toBe('1 h 30 min');
    expect(bookingDuration(45)).toBe('45 min');
  });
  it('uses the provided days without inventing working hours', () => {
    expect(bookingTeamMember({ id: 'natt', name: 'Nat' }, [])).toMatchObject({ name: 'Natt', days: 'Lunes a sábado', hoursConfigured: false, photo: '/team/natt.jpg' });
    expect(bookingTeamMember({ id: 'virginia', name: 'Virginia' }, [])).toMatchObject({ days: 'Lunes, martes y sábado', hoursConfigured: false, photo: null });
  });
  it('shows actual working days once the owner configures the agenda', () => {
    expect(bookingTeamMember({ id: 'maru', name: 'Maru' }, [{ professional_id: 'maru', weekday: 6 }, { professional_id: 'other', weekday: 1 }, { professional_id: 'maru', weekday: 6 }])).toMatchObject({ days: 'Sábado', hoursConfigured: true });
  });
});
