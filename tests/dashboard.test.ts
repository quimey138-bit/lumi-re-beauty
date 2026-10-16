import { it, expect } from 'vitest';
import { parseAgendaFilters, pageHref } from '../src/domain/dashboard';
import { appointmentCommand } from '../src/domain/appointment-command';

it('bounds pagination and validates dates and filters', () => {
  expect(parseAgendaFilters({ page: '-5', clientPage: 'NaN', date: '2026-02-30', status: 'anything' })).toMatchObject({ page: 1, clientPage: 1, date: '', status: '', period: 'upcoming' });
  expect(parseAgendaFilters({ page: '3', date: '2026-10-20', status: 'confirmado' })).toMatchObject({ page: 3, date: '2026-10-20', status: 'confirmado' });
});
it('preserves agenda and customer filters when switching pages', () => {
  const url = pageHref('/admin', parseAgendaFilters({ date: '2026-10-20', q: 'Ana', page: '2' }), { clientPage: 3 });
  const params = new URL(url, 'https://local.test').searchParams;
  expect(params.get('page')).toBe('2'); expect(params.get('clientPage')).toBe('3');
  expect(params.get('q')).toBe('Ana'); expect(params.get('date')).toBe('2026-10-20');
});
it('requires a timestamp when rescheduling and never forwards a customer id', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  expect(() => appointmentCommand({ id, action: 'reschedule' })).toThrow();
  expect(appointmentCommand({ id, action: 'reschedule', start: '2026-10-20T15:00:00Z', customer: 'forged' })).toEqual({ name: 'reschedule_appointment', params: { p_id: id, p_start: '2026-10-20T15:00:00Z' } });
  expect(appointmentCommand({ id, action: 'absent' })).toEqual({ name: 'mark_absent', params: { p_id: id } });
});
