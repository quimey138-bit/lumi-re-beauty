import { AdminForm } from './admin-form';
import { products } from '../data/products';

type Person = { id: string; full_name: string; email: string };
type Professional = { id: string; name: string };
export function StudioManagement({ clients, staff, professionals, services, blocks }: {
  clients: Person[]; staff: Person[]; professionals: Professional[]; services: { id: string; name: string }[];
  blocks: { id: string; starts_at: string; professionals: { name: string } | null }[];
}) {
  const professionalOptions = professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>);
  const milestones = <><option value="6">6 sellos · Descuento especial</option><option value="8">8 sellos · Regalo sorpresa</option><option value="15">15 sellos · Producto gratis</option></>;
  return <div className="platform-grid">
    <AdminForm kind="staff" title="Acceso profesional">
      <p>Seleccioná una cuenta registrada para habilitar o retirar su acceso profesional.</p>
      <label>Cuenta<select name="user_id" required>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select></label>
      <label>Rol<select name="role"><option value="profesional">Profesional</option><option value="cliente">Cliente</option></select></label>
    </AdminForm>
    <AdminForm kind="professional" title="Agregar profesional">
      <label>Nombre<input name="name" required maxLength={120} /></label>
      <label>Cuenta asociada (opcional)<select name="user_id"><option value="">Sin acceso personal todavía</option>{staff.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select></label>
    </AdminForm>
    <AdminForm kind="mapping" title="Habilitar servicio">
      <label>Profesional<select name="professional" required>{professionalOptions}</select></label>
      <label>Servicio<select name="service" required>{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </AdminForm>
    <AdminForm kind="hours" title="Configurar jornada">
      <label>Profesional<select name="professional" required>{professionalOptions}</select></label>
      <label>Día<select name="weekday">{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((d, i) => <option value={i} key={d}>{d}</option>)}</select></label>
      <label>Apertura<input type="time" name="opens" required /></label><label>Cierre<input type="time" name="closes" required /></label>
      <p>La jornada reemplaza los horarios de ese día de semana. Para descansos y excepciones, usá un bloqueo.</p>
    </AdminForm>
    <AdminForm kind="block" title="Bloquear un horario">
      <label>Profesional<select name="professional" required>{professionalOptions}</select></label>
      <label>Desde (hora de Argentina)<input name="start" type="datetime-local" required /></label>
      <label>Hasta (hora de Argentina)<input name="end" type="datetime-local" required /></label>
      <p>El bloqueo no puede superponerse con una reserva confirmada.</p>
    </AdminForm>
    {blocks.length > 0 && <AdminForm kind="unblock" title="Retirar bloqueo">
      <label>Bloqueo<select name="block" required>{blocks.map(b => <option key={b.id} value={b.id}>{b.professionals?.name} · {new Date(b.starts_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</option>)}</select></label>
    </AdminForm>}
    <AdminForm kind="product" title="Confirmar stock">
      <label>Producto<select name="product">{products.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
      <label>Unidades disponibles para nuevas compras<input type="number" name="stock" min={0} max={100000} required /></label>
      <p>No incluyas unidades ya reservadas por pedidos pendientes.</p>
    </AdminForm>
    <AdminForm kind="reward-rule" title="Configurar una recompensa">
      <label>Hito<select name="milestone">{milestones}</select></label>
      <label>Condiciones de entrega<textarea name="conditions" required maxLength={1000} rows={3} /></label>
      <label>Descuento porcentual (obligatorio para 6 sellos)<input name="discount" type="number" min={1} max={100} /></label>
      <fieldset><legend>Productos elegibles (seleccioná uno o más para 15 sellos)</legend>{products.map(p => <label className="platform-check" key={p.id}><input type="checkbox" name="products" value={p.id}/>{p.name}</label>)}</fieldset>
      <p>Al guardar se habilita este premio. Las condiciones se muestran en la tarjeta de la clienta.</p>
    </AdminForm>
    <AdminForm kind="reward" title="Entregar recompensa">
      <p>Confirmá las condiciones del premio antes de registrar la entrega. Buscá a la clienta por nombre en la lista de clientes.</p>
      <label>Clienta<select name="customer" required>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name || c.email}</option>)}</select></label>
      <label>Premio<select name="milestone">{milestones}</select></label>
      <label>Producto elegido por la clienta (para 15 sellos)<select name="product"><option value="">No corresponde</option>{products.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
    </AdminForm>
  </div>;
}
