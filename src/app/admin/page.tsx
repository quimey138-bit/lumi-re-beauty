import Image from 'next/image';
import QRCode from 'qrcode';
import { PlatformShell, ConfigurationNotice } from '../../components/platform-shell';
import { AppointmentList } from '../../components/appointment-list';
import { StudioManagement } from '../../components/studio-management';
import { AgendaFiltersForm, Pagination } from '../../components/agenda-filters';
import { requireIdentity } from '../../server/auth';
import { loadAgenda } from '../../server/agenda';
import { supabaseConfig, siteUrl } from '../../lib/config';
import { money } from '../../data/products';
import { parseAgendaFilters, pageSize, type SearchValues } from '../../domain/dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Administración | Lumière', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchValues> }) {
  if (!supabaseConfig()) return <PlatformShell title="Administración"><ConfigurationNotice /></PlatformShell>;
  const { db } = await requireIdentity(['admin']);
  const filters = parseAgendaFilters(await searchParams);
  let clientQuery = db.from('profiles').select('id,full_name,email,phone,role', { count: 'exact' });
  if (filters.q) clientQuery = clientQuery.ilike('full_name', '%' + filters.q.replace(/[\\%_]/g, '\\$&') + '%');
  const offset = (filters.clientPage - 1) * pageSize;
  const [agenda, clients, staff, professionals, services, orders, blocks, rules] = await Promise.all([
    loadAgenda(db, filters),
    clientQuery.order('created_at', { ascending: false }).order('id').range(offset, offset + pageSize - 1),
    db.from('profiles').select('id,full_name,email').eq('role', 'profesional').limit(200),
    db.from('professionals').select('id,name').eq('active', true),
    db.from('services').select('id,name').eq('active', true),
    db.from('orders').select('id,total_cents,status,refunded_cents').order('created_at', { ascending: false }).limit(100),
    db.from('schedule_blocks').select('id,starts_at,professionals(name)').gt('ends_at', new Date().toISOString()).order('starts_at').limit(100),
    db.from('reward_rules').select('milestone,enabled,conditions,discount_percent,eligible_product_id').order('milestone'),
  ]);
  const base = siteUrl();
  const qr = base ? await QRCode.toDataURL(base + '/fidelidad', { width: 240, margin: 2 }) : null;
  return <PlatformShell title="Administración de Lumière">
    <section className="platform-card"><h2>Ventas verificadas</h2>
      {orders.error ? <p>No se pudieron consultar los pedidos.</p> : <>
        <p>{money((orders.data || []).filter(o => ['paid','partially_refunded'].includes(o.status)).reduce((n, o) => n + Number(o.total_cents)-Number(o.refunded_cents), 0))} · {(orders.data || []).filter(o => ['paid','partially_refunded'].includes(o.status)).length} pedidos pagados</p>
        <p>Esta métrica corresponde a los últimos 100 pedidos.</p>
        {orders.data?.some(o => o.status === 'paid_review') && <p role="alert">Hay pagos que requieren reconciliación manual por vencimiento de stock.</p>}
      </>}
    </section>
    <AgendaFiltersForm filters={filters} professionals={professionals.data || []} />
    {agenda.error ? <p role="alert">No se pudo cargar la agenda.</p> : <>
      {agenda.contactsError && <p role="alert">No se pudieron cargar los contactos de la agenda.</p>}
      <AppointmentList rows={agenda.rows} contacts={agenda.contacts} manage />
      <Pagination base="/admin" filters={filters} total={agenda.count} />
    </>}
    <section className="platform-card"><h2>Clientes</h2>
      <form method="get" className="platform-form">
        <input name="period" type="hidden" value={filters.period} /><input name="date" type="hidden" value={filters.date} />
        <input name="status" type="hidden" value={filters.status} /><input name="professional" type="hidden" value={filters.professional} />
        <label>Buscar por nombre<input name="q" defaultValue={filters.q} maxLength={80} /></label><button>Buscar</button>
      </form>
      {clients.error ? <p>No se pudieron cargar los clientes.</p> : <>
        {!clients.data?.length && <p>No hay clientes para esta búsqueda.</p>}
        {clients.data?.map(c => <article className="platform-row" key={c.id}><strong>{c.full_name || 'Sin nombre'}</strong><p>{c.email} · {c.phone} · {c.role}</p></article>)}
        <Pagination base="/admin" filters={filters} total={clients.count || 0} clients />
      </>}
    </section>
    <section className="platform-card"><h2>Condiciones de recompensas</h2>
      {rules.error ? <p>No se pudieron cargar las condiciones.</p> : rules.data?.map(r => <p key={r.milestone}><strong>{r.milestone} sellos:</strong> {r.enabled ? r.conditions : 'Pendiente de configurar'}</p>)}
    </section>
    <StudioManagement clients={clients.data || []} staff={staff.data || []} professionals={professionals.data || []} services={services.data || []} blocks={(blocks.data || []) as unknown as Parameters<typeof StudioManagement>[0]['blocks']} />
    <section className="platform-card"><h2>QR del local</h2>
      {qr ? <><Image src={qr} alt="QR para abrir la tarjeta de fidelidad Lumière" width={240} height={240} unoptimized /><p>Imprimí este QR para que tus clientas accedan a su tarjeta.</p><a href={qr} download="lumiere-fidelidad.png">Descargar QR</a></> : <p>Configurá la dirección pública del sitio para generar el QR.</p>}
    </section>
  </PlatformShell>;
}
