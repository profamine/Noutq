import { describe, it, expect } from 'vitest';
import { getLeagueStatus } from './leagues';

describe('getLeagueStatus', () => {
  it('starts in the bronze league at 0 XP', () => {
    expect(getLeagueStatus(0).tier.id).toBe('bronze');
  });

  it('promotes to the next tier exactly at its threshold', () => {
    expect(getLeagueStatus(499).tier.id).toBe('bronze');
    expect(getLeagueStatus(500).tier.id).toBe('silver');
  });

  it('reaches the top tier and reports no further progression', () => {
    const status = getLeagueStatus(10000);
    expect(status.tier.id).toBe('master');
    expect(status.next).toBeNull();
    expect(status.progressPercent).toBe(100);
  });

  it('computes progress toward the next tier', () => {
    const status = getLeagueStatus(750); // silver (500) -> gold (1500)
    expect(status.tier.id).toBe('silver');
    expect(status.next?.id).toBe('gold');
    expect(status.xpToNext).toBe(750);
    expect(status.progressPercent).toBe(25);
  });
});
