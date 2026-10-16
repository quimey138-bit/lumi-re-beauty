import { PlatformShell, ConfigurationNotice } from '../../components/platform-shell';
import { AppointmentList } from '../../components/appointment-list';
import { AgendaFiltersForm, Pagination } from '../../components/agenda-filters';
import { requireIdentity } from '../../server/auth';
import { loadAgenda } from '../../server/agenda';
import { supabaseConfig } from '../../lib/config';
import { parseAgendaFilters, type SearchValues } from '../../domain/dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi agenda | Lumière', robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<SearchValues> }) {
  if (!supabaseConfig()) return <PlatformShell title="Mi agenda"><ConfigurationNotice /></PlatformShell>;
  const { db } = await requireIdentity(['profesional', 'admin']);
  const filters = parseAgendaFilters(await searchParams);
  const agenda = await loadAgenda(db, filters);
  return <PlatformShell title="Mi agenda"><AgendaFiltersForm filters={filters} />
    {agenda.error ? <p role="alert">No se pudo cargar tu agenda.</p> : <>
      {agenda.contactsError && <p role="alert">No se pudieron cargar los contactos.</p>}
      <AppointmentList rows={agenda.rows} contacts={agenda.contacts} manage />
      <Pagination base="/profesional" filters={filters} total={agenda.count} />
    </>}
  </PlatformShell>;
}
