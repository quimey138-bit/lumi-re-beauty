import 'server-only';
import type { getIdentity } from './auth';
import type { LoyaltyCardData } from '../domain/loyalty-card';

export async function loadLoyaltyCard({ db, user }: NonNullable<Awaited<ReturnType<typeof getIdentity>>>): Promise<LoyaltyCardData> {
  const [stamps, redemptions, rules] = await Promise.all([
    db.from('loyalty_stamps').select('id,created_at', { count: 'exact' }).eq('customer_id', user.id).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(30),
    db.from('reward_redemptions').select('milestone,created_at,conditions_snapshot').eq('customer_id', user.id).order('created_at', { ascending: false }),
    db.from('reward_rules').select('milestone,enabled,conditions,discount_percent,eligible_product_ids').order('milestone'),
  ]);
  return {
    count: stamps.count ?? 0,
    stamps: stamps.data ?? [],
    redemptions: redemptions.data ?? [],
    rules: rules.data ?? [],
    error: Boolean(stamps.error || redemptions.error || rules.error),
  };
}
