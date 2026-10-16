import { z } from 'zod';

export type SearchValues = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => typeof v === 'string' ? v : '';
const page = (v: string) => /^\d{1,5}$/.test(v) ? Math.max(1, Math.min(10000, Number(v))) : 1;

export function parseAgendaFilters(values: SearchValues) {
  const date = z.iso.date().safeParse(first(values.date));
  const professional = z.uuid().safeParse(first(values.professional));
  const status = z.enum(['confirmado', 'completado', 'cancelado', 'ausente']).safeParse(first(values.status));
  return {
    page: page(first(values.page)), clientPage: page(first(values.clientPage)),
    date: date.success ? date.data : '', professional: professional.success ? professional.data : '',
    status: status.success ? status.data : '', period: first(values.period) === 'all' ? 'all' : 'upcoming',
    q: first(values.q).trim().slice(0, 80),
  };
}
export type AgendaFilters = ReturnType<typeof parseAgendaFilters>;
export function pageHref(base: '/admin' | '/profesional', filters: AgendaFilters, patch: Partial<AgendaFilters> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...patch })) if (value !== '') params.set(key, String(value));
  return `${base}?${params}`;
}
export function agendaRange(filters: AgendaFilters, now = new Date()) {
  const date = filters.date || (filters.period === 'upcoming' ? now.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) : '');
  if (!date) return null;
  const from = new Date(`${date}T00:00:00-03:00`);
  return { from: from.toISOString(), to: filters.date ? new Date(from.getTime() + 86400000).toISOString() : null };
}
export const pageSize = 30;
