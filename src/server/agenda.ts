import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { agendaRange, pageSize, type AgendaFilters } from '../domain/dashboard';
import type { AppointmentRow, AppointmentContact } from '../components/appointment-list';

export async function loadAgenda(db: SupabaseClient, filters: AgendaFilters) {
  let query = db.from('appointments').select('id,starts_at,ends_at,status,customer_id,services(name),professionals(name)', { count: 'exact' });
  const range = agendaRange(filters);
  if (range) query = query.gte('starts_at', range.from);
  if (range?.to) query = query.lt('starts_at', range.to);
  if (filters.professional) query = query.eq('professional_id', filters.professional);
  if (filters.status) query = query.eq('status', filters.status);
  const start = (filters.page - 1) * pageSize;
  const { data, count, error } = await query.order('starts_at').order('id').range(start, start + pageSize - 1);
  if (error) return { rows: [], count: 0, contacts: [], error: true };
  const rows = (data || []) as unknown as AppointmentRow[];
  if (!rows.length) return { rows, count: count || 0, contacts: [], error: false };
  const contacts = await db.rpc('appointment_contacts', { p_ids: rows.map(a => a.id) });
  return { rows, count: count || 0, contacts: (contacts.data || []) as AppointmentContact[], error: false, contactsError: !!contacts.error };
}
