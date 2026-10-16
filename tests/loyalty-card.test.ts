import { describe, expect, it } from 'vitest';
import { historicalRewardConditions, historicalRewardName, loyaltyRewardState, nextLoyaltyMilestone, stampPositions } from '../src/domain/loyalty-card';

describe('digital stamp card', () => {
  it('keeps the original discount and conditions of delivered rewards', () => {
    const snapshot={discount_percent:20,conditions:'Entrega en el estudio'};
    expect(historicalRewardName({milestone:6,conditions_snapshot:snapshot})).toBe('20% de descuento');
    expect(historicalRewardConditions(snapshot)).toBe('Entrega en el estudio');
    expect(historicalRewardName({milestone:6,conditions_snapshot:{}})).toBe('Descuento especial');
    expect(historicalRewardConditions(null)).toBeNull();
  });
  it('does not invent stamps for an empty account', () => {
    expect(stampPositions(0).filter(stamp => stamp.earned)).toHaveLength(0);
    expect(stampPositions(0)).toHaveLength(15);
    expect(nextLoyaltyMilestone(0)).toBe(6);
  });
  it('fills exactly the earned positions and marks the three reward milestones', () => {
    expect(stampPositions(8).filter(stamp => stamp.earned)).toHaveLength(8);
    expect(stampPositions(8).filter(stamp => stamp.milestone).map(stamp => stamp.number)).toEqual([6,8,15]);
    expect(nextLoyaltyMilestone(6)).toBe(8);
    expect(nextLoyaltyMilestone(8)).toBe(15);
  });
  it('never repeats or resets rewards after the fifteenth stamp', () => {
    expect(stampPositions(20).filter(stamp => stamp.earned)).toHaveLength(15);
    expect(nextLoyaltyMilestone(20)).toBeNull();
    expect(loyaltyRewardState(20,6,[6],true)).toEqual({ remaining:0,status:'redeemed' });
  });
  it('does not advertise a reward as redeemable until its rules are enabled', () => {
    expect(loyaltyRewardState(6,6,[],false)).toEqual({ remaining:0,status:'pending' });
    expect(loyaltyRewardState(6,6,[],true)).toEqual({ remaining:0,status:'available' });
    expect(loyaltyRewardState(4,6,[],true)).toEqual({ remaining:2,status:'locked' });
  });
});
