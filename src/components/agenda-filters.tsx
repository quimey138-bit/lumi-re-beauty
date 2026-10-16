import Link from 'next/link';
import { pageHref, pageSize, type AgendaFilters } from '../domain/dashboard';

export function AgendaFiltersForm({ filters, professionals = [] }: { filters: AgendaFilters; professionals?: { id: string; name: string }[] }) {
  return <form className="platform-card platform-form" method="get">
    <h2>Buscar turnos</h2>
    <label>Período<select name="period" defaultValue={filters.period}><option value="upcoming">Desde hoy</option><option value="all">Todo el historial</option></select></label>
    <label>Día específico (opcional)<input type="date" name="date" defaultValue={filters.date} /></label>
    <label>Estado<select name="status" defaultValue={filters.status}><option value="">Todos</option>{['confirmado', 'completado', 'cancelado', 'ausente'].map(s => <option key={s} value={s}>{s}</option>)}</select></label>
    {professionals.length > 0 && <label>Profesional<select name="professional" defaultValue={filters.professional}><option value="">Todas</option>{professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
    {filters.q && <input type="hidden" name="q" value={filters.q} />}
    <button>Aplicar filtros</button>
  </form>;
}
export function Pagination({ base, filters, total, clients = false }: { base: '/admin' | '/profesional'; filters: AgendaFilters; total: number; clients?: boolean }) {
  const current = clients ? filters.clientPage : filters.page;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const patch = (value: number) => clients ? { clientPage: value } : { page: value };
  return <nav aria-label={clients ? 'Páginas de clientes' : 'Páginas de agenda'} className="platform-actions">
    {current > 1 && <Link href={pageHref(base, filters, patch(current - 1))}>← Anterior</Link>}
    <span>Página {current} de {pages} · {total} registros</span>
    {current < pages && <Link href={pageHref(base, filters, patch(current + 1))}>Siguiente →</Link>}
  </nav>;
}
