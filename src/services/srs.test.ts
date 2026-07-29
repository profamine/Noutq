import { describe, it, expect } from 'vitest';
import { reviewCard, isDue, countDue, sortByPriority } from './srs';

describe('reviewCard', () => {
  it('schedules a new card 1 day out after a first correct answer', () => {
    const state = reviewCard(undefined, true);
    expect(state.repetitions).toBe(1);
    expect(state.interval).toBe(1);
  });

  it('increases the interval on consecutive correct answers', () => {
    let state = reviewCard(undefined, true);
    state = reviewCard(state, true);
    expect(state.repetitions).toBe(2);
    expect(state.interval).toBe(3);
    const before = state;
    state = reviewCard(state, true);
    expect(state.repetitions).toBe(3);
    expect(state.interval).toBeGreaterThan(before.interval);
  });

  it('resets the interval to today on a wrong answer', () => {
    let state = reviewCard(undefined, true);
    state = reviewCard(state, true);
    state = reviewCard(state, false);
    expect(state.repetitions).toBe(0);
    expect(state.interval).toBe(0);
    expect(isDue(state)).toBe(true);
  });
});

describe('isDue', () => {
  it('treats a never-seen card as due', () => {
    expect(isDue(undefined)).toBe(true);
  });

  it('treats a card scheduled in the future as not due', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    expect(isDue({ interval: 10, easeFactor: 2.5, repetitions: 2, dueDate: future.toISOString().slice(0, 10) })).toBe(false);
  });
});

describe('countDue', () => {
  it('counts never-seen and overdue words as due', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    const state = { b: { interval: 1, easeFactor: 2.5, repetitions: 1, dueDate: past.toISOString().slice(0, 10) } };
    expect(countDue(['a', 'b'], state)).toBe(2); // 'a' never seen, 'b' overdue
  });
});

describe('sortByPriority', () => {
  it('places never-seen and due items before future items', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const state = {
      known: { interval: 10, easeFactor: 2.5, repetitions: 2, dueDate: future.toISOString().slice(0, 10) },
    };
    const items = ['known', 'unknown'];
    const sorted = sortByPriority(items, (x) => x, state);
    expect(sorted[0]).toBe('unknown');
  });
});
