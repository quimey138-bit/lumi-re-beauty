export type LoyaltyRule = {
  milestone: number;
  enabled: boolean;
  conditions: string;
  discount_percent: number | null;
  eligible_product_ids: string[] | null;
};

export type LoyaltyActivity = { id: string; created_at: string };
export type LoyaltyRedemption = { milestone: number; created_at: string; conditions_snapshot: unknown };
export type LoyaltyCardData = {
  count: number;
  stamps: LoyaltyActivity[];
  redemptions: LoyaltyRedemption[];
  rules: LoyaltyRule[];
  error: boolean;
};

export function loyaltyRewardState(count: number, milestone: number, redeemed: number[], enabled: boolean) {
  const remaining = Math.max(0, milestone - count);
  const status = redeemed.includes(milestone) ? 'redeemed' : remaining > 0 ? 'locked' : enabled ? 'available' : 'pending';
  return { remaining, status };
}

export function nextLoyaltyMilestone(count: number) {
  return [6, 8, 15].find(milestone => count < milestone) ?? null;
}

export function historicalRewardName(redemption: Pick<LoyaltyRedemption, 'milestone' | 'conditions_snapshot'>) {
  if (redemption.milestone !== 6) return redemption.milestone === 8 ? 'Un regalo sorpresa' : 'Un producto para vos';
  const snapshot = redemption.conditions_snapshot;
  const discount = snapshot && typeof snapshot === 'object' && 'discount_percent' in snapshot ? snapshot.discount_percent : null;
  return typeof discount === 'number' && discount >= 1 && discount <= 100 ? `${discount}% de descuento` : 'Descuento especial';
}

export function historicalRewardConditions(snapshot: unknown) {
  return snapshot && typeof snapshot === 'object' && 'conditions' in snapshot && typeof snapshot.conditions === 'string' ? snapshot.conditions : null;
}

export function stampPositions(count: number) {
  return Array.from({ length: 15 }, (_, index) => ({ number: index + 1, earned: index < count, milestone: [6, 8, 15].includes(index + 1) }));
}
