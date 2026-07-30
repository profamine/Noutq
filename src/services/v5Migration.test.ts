import { describe, expect, it } from 'vitest';
import { migrateV4Snapshot, parseLessonProgress } from './v5Migration';

const card = {
  interval: 3,
  easeFactor: 2.5,
  repetitions: 2,
  dueDate: '2026-08-01',
};

describe('V5 migration', () => {
  it('preserves completedUnits and totalXP while moving corrected SRS keys', () => {
    const oldKey = 'أَيُّ مَادَّةٍ تُحِبّ؟';
    const snapshot = {
      completedUnits: JSON.stringify(['u1', 'u7', 'u15']),
      totalXP: '430',
      srsState: JSON.stringify({ [oldKey]: card }),
    };

    const migrated = migrateV4Snapshot(snapshot);
    const srs = JSON.parse(migrated.srsState ?? '{}');

    expect(migrated.completedUnits).toBe(snapshot.completedUnits);
    expect(migrated.totalXP).toBe('430');
    expect(srs[oldKey]).toBeUndefined();
    expect(srs['أَيَّ مَادَّةٍ تُحِبُّ؟']).toEqual(card);
  });

  it('keeps an existing canonical card and removes the orphaned legacy key', () => {
    const oldKey = 'أَيُّ مَادَّةٍ تُحِبّ؟';
    const newKey = 'أَيَّ مَادَّةٍ تُحِبُّ؟';
    const newerCard = { ...card, interval: 14, repetitions: 4 };
    const snapshot = {
      completedUnits: '["u15"]',
      totalXP: '60',
      srsState: JSON.stringify({ [oldKey]: card, [newKey]: newerCard }),
    };

    const migrated = migrateV4Snapshot(snapshot);
    const srs = JSON.parse(migrated.srsState ?? '{}');
    expect(migrated.changed).toBe(true);
    expect(srs[oldKey]).toBeUndefined();
    expect(srs[newKey]).toEqual(newerCard);
  });

  it('is idempotent after all legacy keys have been removed', () => {
    const snapshot = {
      completedUnits: '["u15"]',
      totalXP: '60',
      srsState: JSON.stringify({ 'أَيَّ مَادَّةٍ تُحِبُّ؟': card }),
    };
    const migrated = migrateV4Snapshot(snapshot);
    expect(migrated.changed).toBe(false);
    expect(migrated.srsState).toBe(snapshot.srsState);
  });
});

describe('legacy lesson progress', () => {
  it('resumes a valid V4 step without changing its index', () => {
    expect(parseLessonProgress('{"stepIndex":4,"lives":2}', 10)).toEqual({
      stepIndex: 4,
      lives: 2,
    });
  });

  it('rejects a removed/out-of-range step and clamps lives', () => {
    expect(parseLessonProgress('{"stepIndex":10,"lives":2}', 10)).toBeNull();
    expect(parseLessonProgress('{"stepIndex":2,"lives":99}', 10)).toEqual({
      stepIndex: 2,
      lives: 3,
    });
  });
});
