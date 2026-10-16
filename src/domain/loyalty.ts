export const rewards = [
  { milestone: 6, name: 'Descuento especial' },
  { milestone: 8, name: 'Regalo sorpresa' },
  { milestone: 15, name: 'Producto gratis a elección' },
] as const;
export function earnedRewards(stamps: number, redeemed: number[]) {
  return rewards.filter(r => r.milestone <= stamps && !redeemed.includes(r.milestone)).map(r => r.milestone);
}
