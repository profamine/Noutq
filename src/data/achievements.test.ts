import { describe, it, expect } from 'vitest';
import { computeAchievements, ACHIEVEMENTS } from './achievements';

describe('computeAchievements', () => {
  it('marks nothing completed at zero progress', () => {
    const result = computeAchievements({ lessonsCompleted: 0, streak: 0, totalXP: 0 });
    expect(result.every((r) => !r.completed)).toBe(true);
  });

  it('marks every achievement completed once all thresholds are exceeded', () => {
    const result = computeAchievements({ lessonsCompleted: 999, streak: 999, totalXP: 999999 });
    expect(result.every((r) => r.completed)).toBe(true);
    expect(result).toHaveLength(ACHIEVEMENTS.length);
  });

  it('computes partial progress percent toward a threshold', () => {
    const result = computeAchievements({ lessonsCompleted: 5, streak: 0, totalXP: 0 });
    const first = result.find((r) => r.def.id === 'lessons_10');
    expect(first?.progressPercent).toBe(50);
    expect(first?.completed).toBe(false);
  });
});
