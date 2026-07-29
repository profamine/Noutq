import { describe, it, expect } from 'vitest';
import { computeStreak } from './App';

describe('computeStreak', () => {
  it('keeps the streak unchanged if never studied', () => {
    expect(computeStreak(5, null)).toEqual({ streak: 5, freezesRemaining: 0, freezeConsumed: false });
  });

  it('keeps the streak unchanged if already studied today', () => {
    const today = new Date().toDateString();
    expect(computeStreak(3, today)).toEqual({ streak: 3, freezesRemaining: 0, freezeConsumed: false });
  });

  it('keeps the streak unchanged if studied yesterday (still on track)', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(computeStreak(3, yesterday.toDateString())).toEqual({ streak: 3, freezesRemaining: 0, freezeConsumed: false });
  });

  it('resets to 0 after missing more than one day with no freeze available', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(computeStreak(5, threeDaysAgo.toDateString(), 0)).toEqual({
      streak: 0,
      freezesRemaining: 0,
      freezeConsumed: false,
    });
  });

  it('resets to 0 after missing exactly one day with no freeze available', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(computeStreak(5, twoDaysAgo.toDateString(), 0)).toEqual({
      streak: 0,
      freezesRemaining: 0,
      freezeConsumed: false,
    });
  });

  it('protects the streak when exactly one day is missed and a freeze is available', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(computeStreak(5, twoDaysAgo.toDateString(), 2)).toEqual({
      streak: 5,
      freezesRemaining: 1,
      freezeConsumed: true,
    });
  });

  it('does not protect the streak when more than one day is missed, even with a freeze available', () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    expect(computeStreak(5, fourDaysAgo.toDateString(), 2)).toEqual({
      streak: 0,
      freezesRemaining: 2,
      freezeConsumed: false,
    });
  });
});
