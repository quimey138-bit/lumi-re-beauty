import { describe, it, expect } from 'vitest';
import { quoteCart, parseCart } from '../src/domain/commerce';
import { availableSlots, reminderAt } from '../src/domain/booking';
import { safeNext,sameOrigin } from '../src/domain/security';
import { earnedRewards } from '../src/domain/loyalty';

describe('server cart pricing', () => {
  it('uses catalog prices instead of supplied totals', () => {
    expect(quoteCart([{ id: 'vinchas', quantity: 2, price: 1 }]).total).toBe(1900000);
  });
  it.each([0, -1, 1.5, 100, NaN, Infinity])('rejects invalid quantity %s', quantity => {
    expect(() => quoteCart([{ id: 'vinchas', quantity }])).toThrow();
  });
  it('rejects unknown products and duplicate lines', () => {
    expect(() => quoteCart([{ id: 'fake', quantity: 1 }])).toThrow();
    expect(() => quoteCart([{ id: 'vinchas', quantity: 1 }, { id: 'vinchas', quantity: 1 }])).toThrow();
  });
  it('recovers from corrupt storage without accepting an invalid cart', () => {
    expect(parseCart('bad json')).toEqual([]);
    expect(parseCart('[{"id":"vinchas","quantity":-2}]')).toEqual([]);
    expect(parseCart('[{"id":"vinchas","quantity":1}]')).toEqual([{ id: 'vinchas', quantity: 1 }]);
  });
});
describe('availability', () => {
  it('excludes overlapping bookings but allows adjacent intervals', () => {
    expect(availableSlots({ date: '2026-10-20', open: '09:00', close: '12:00', duration: 60,
      busy: [{ start: '2026-10-20T13:00:00Z', end: '2026-10-20T14:00:00Z' }], now: new Date('2026-10-16T00:00:00Z')
    })).toEqual(['09:00', '11:00']);
  });
  it('returns no slots for invalid dates or past days', () => {
    expect(availableSlots({ date: '2026-02-30', open: '09:00', close: '12:00', duration: 60, busy: [], now: new Date('2026-01-01') })).toEqual([]);
  });
  it('schedules 24 hours before and omits already due reminders', () => {
    expect(reminderAt('2026-10-20T15:00:00Z', new Date('2026-10-18T15:00:00Z'))).toBe('2026-10-19T15:00:00.000Z');
    expect(reminderAt('2026-10-20T15:00:00Z', new Date('2026-10-19T16:00:00Z'))).toBeNull();
  });
});
describe('authorization and rewards', () => {
  it('uses the actual request host when Next normalizes an internal URL',()=>{
    expect(sameOrigin(new Request('http://localhost:3100/api/appointments',{headers:{host:'127.0.0.1:3100',origin:'http://127.0.0.1:3100'}}))).toBe(true);
    expect(sameOrigin(new Request('http://localhost:3100/api/appointments',{headers:{host:'127.0.0.1:3100',origin:'https://evil.test'}}))).toBe(false);
    expect(sameOrigin(new Request('http://localhost:3100/api/appointments'))).toBe(false);
  });
  it.each(['https://evil.test', '//evil.test', '/\\evil.test', '/%2fevil.test', null])('rejects unsafe redirect %s', input => {
    expect(safeNext(input)).toBe('/cuenta');
  });
  it('permits known local destinations only', () => { expect(safeNext('/admin')).toBe('/admin'); });
  it('unlocks 6, 8 and 15 once and excludes already redeemed milestones', () => {
    expect(earnedRewards(7, [])).toEqual([6]);
    expect(earnedRewards(15, [6])).toEqual([8, 15]);
    expect(earnedRewards(30, [6, 8, 15])).toEqual([]);
  });
});
