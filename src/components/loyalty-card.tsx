'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { rewards } from '../domain/loyalty';
import { historicalRewardConditions, historicalRewardName, loyaltyRewardState, nextLoyaltyMilestone, stampPositions, type LoyaltyCardData } from '../domain/loyalty-card';
import { products } from '../data/products';

function LumiereStamp() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 7c1.8 10.6 6.4 15.2 17 17-10.6 1.8-15.2 6.4-17 17-1.8-10.6-6.4-15.2-17-17C17.6 22.2 22.2 17.6 24 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M35 5v8M31 9h8M9 34v6M6 37h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>;
}

function rewardName(milestone: number, data: LoyaltyCardData) {
  if (milestone === 6) return `${data.rules.find(rule => rule.milestone === 6 && rule.enabled)?.discount_percent ?? 20}% de descuento`;
  return milestone === 8 ? 'Un regalo sorpresa' : 'Un producto para vos';
}

export function LoyaltyCard({ data, compact = false }: { data: LoyaltyCardData; compact?: boolean }) {
  const router = useRouter();
  const [refreshing, refresh] = useTransition();
  const nextMilestone = nextLoyaltyMilestone(data.count);
  const filled = Math.min(15, data.count);
  const redeemed = data.redemptions.map(item => item.milestone);
  const activity = [
    ...data.stamps.map((stamp, index) => ({ id: stamp.id, date: stamp.created_at, title: 'Sello sumado', detail: `${data.count - index} ${data.count - index === 1 ? 'sello acumulado' : 'sellos acumulados'}` })),
    ...data.redemptions.map(redemption => ({ id: `reward-${redemption.milestone}`, date: redemption.created_at, title: 'Premio entregado', detail: `${redemption.milestone} sellos · ${historicalRewardName(redemption)}` })),
  ].sort((first, second) => second.date.localeCompare(first.date));

  if (data.error) return <section className="ritual-card ritual-error" aria-label="Mis sellos"><h2>No pudimos cargar tus sellos</h2><p>Tu progreso sigue guardado. Intentá actualizar la tarjeta.</p><button type="button" disabled={refreshing} onClick={() => refresh(() => router.refresh())}>{refreshing ? 'Actualizando…' : 'Volver a intentar'}</button></section>;

  return <section className={`ritual${compact ? ' ritual-compact' : ''}`} aria-label="Mi ritual Lumière">
    <div className="ritual-heading"><div><span className="ritual-eyebrow">CADA VISITA, UN POQUITO MÁS CERCA</span><h2>Mi ritual Lumière</h2><p>Momentos para vos. Detalles de nuestra parte.</p></div><button className="ritual-refresh" type="button" disabled={refreshing} onClick={() => refresh(() => router.refresh())}>{refreshing ? 'Actualizando…' : 'Actualizar mis sellos'}<span aria-hidden="true"> ↻</span></button></div>

    <div className="ritual-card ritual-stamp-card" aria-busy={refreshing}>
      <div className="ritual-card-top"><h3>TU CARTILLA</h3><p aria-live="polite"><strong>{data.count}</strong> {data.count === 1 ? 'sello' : 'sellos'}</p></div>
      <ol className="ritual-stamps" aria-label={`${data.count} sellos acumulados. Cartilla de 15 sellos.`}>
        {stampPositions(data.count).map(stamp => <li key={`${stamp.number}-${stamp.earned && stamp.number === filled ? data.stamps[0]?.id ?? 'earned' : stamp.earned ? 'earned' : 'pending'}`} className={`${stamp.earned ? 'is-earned' : 'is-pending'}${stamp.milestone ? ' is-milestone' : ''}`} style={{ animationDelay: `${Math.min(stamp.number - 1, 6) * 65}ms` }} aria-label={`Sello ${stamp.number}: ${stamp.earned ? 'acreditado' : 'pendiente'}${stamp.milestone ? ', hito de recompensa' : ''}`}><span className="ritual-stamp-circle"><LumiereStamp />{stamp.earned && <span className="ritual-stamp-ink" aria-hidden="true" />}</span><span className="ritual-stamp-number">{stamp.number}{stamp.milestone && <span aria-hidden="true"> ✧</span>}</span></li>)}
      </ol>
      <div className="ritual-progress"><progress max={15} value={filled} aria-label="Progreso de la cartilla" /><p>{nextMilestone ? <>Te {nextMilestone - data.count === 1 ? 'falta' : 'faltan'} <strong>{nextMilestone - data.count} {nextMilestone - data.count === 1 ? 'sello' : 'sellos'}</strong> para tu próximo detalle.</> : 'Llegaste a los tres hitos. ¡Gracias por elegirnos!'}</p></div>
      <p className="ritual-fine-print">Cada visita completada y validada por el estudio suma un sello.{data.count > 15 && ' Tu total sigue acumulándose; la cartilla muestra los primeros 15.'}</p>
    </div>

    <div className="ritual-rewards" aria-label="Tus recompensas">{rewards.map(reward => {
      const rule = data.rules.find(item => item.milestone === reward.milestone);
      const state = loyaltyRewardState(data.count, reward.milestone, redeemed, Boolean(rule?.enabled));
      const redemption = data.redemptions.find(item => item.milestone === reward.milestone);
      const title = redemption ? historicalRewardName(redemption) : rewardName(reward.milestone, data);
      const conditions = redemption ? historicalRewardConditions(redemption.conditions_snapshot) : rule?.enabled ? rule.conditions : null;
      const eligible = products.filter(product => rule?.eligible_product_ids?.includes(product.id));
      const status = state.status === 'redeemed' ? 'Entregado ✓' : state.status === 'available' ? 'Disponible en el estudio' : state.status === 'pending' ? 'Coordiná con el estudio' : `Faltan ${state.remaining}`;
      return <article className={`ritual-reward ritual-reward-${state.status}`} key={reward.milestone}>
        <div className="ritual-reward-row"><div><span className="ritual-eyebrow">TU DETALLE N.º {reward.milestone === 6 ? '1' : reward.milestone === 8 ? '2' : '3'}</span><h3>{title}</h3><p>{reward.milestone} sellos · {reward.milestone === 6 ? 'Canje en el estudio' : 'Entrega en el estudio'}</p></div><span className="ritual-reward-status">{status}</span></div>
        {conditions ? <details className="ritual-conditions"><summary>{redemption ? 'Condiciones al canjear' : 'Ver condiciones'}</summary><p>{conditions}</p>{!redemption && reward.milestone === 15 && eligible.length > 0 && <p>Elegí en el estudio entre: {eligible.map(product => product.name).join(', ')}. Sujeto a disponibilidad al canjear.</p>}</details> : !redemption && <p className="ritual-conditions-pending">El estudio confirmará las condiciones antes del canje.</p>}
      </article>;
    })}</div>

    {!compact && <section className="ritual-activity" aria-label="Actividad de tus sellos"><h3>TU ACTIVIDAD</h3>{activity.length ? <><ul>{activity.slice(0, 15).map(item => <li key={item.id}><span><strong>{item.title}</strong><small>{item.detail}</small></span><time dateTime={item.date}>{new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(item.date))}</time></li>)}</ul>{activity.length > 15 && <p className="ritual-fine-print">Mostrando los últimos 15 movimientos.</p>}</> : <div className="ritual-empty-activity"><span aria-hidden="true">✧</span><p>Tu historia de cuidado empieza acá.</p><small>Después de tu primera visita, vas a ver tu sello y su fecha.</small></div>}</section>}
    <div className="ritual-footer"><p>Los premios se entregan personalmente en Lumière. Cada hito se canjea una sola vez.</p>{compact ? <Link href="/fidelidad">Ver mi cartilla y actividad →</Link> : <Link href="/reservar">Elegir mi próximo tratamiento →</Link>}</div>
  </section>;
}
