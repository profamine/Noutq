import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => new Map<string, string>());

vi.mock('./storage', () => ({
  storageGet: vi.fn(async (key: string) => state.get(key) ?? null),
  storageSet: vi.fn(async (key: string, value: string) => { state.set(key, value); }),
  storageRemove: vi.fn(async (key: string) => { state.delete(key); }),
}));

import { rollbackV5Migration, runV5Migration, V5_MIGRATION_VERSION } from './v5Migration';

describe('versioned V5 migration and rollback', () => {
  beforeEach(() => state.clear());

  it('runs once, preserves V4 state, removes orphan SRS keys, and rolls back', async () => {
    const completedUnits = '["u1","u7","u15"]';
    const totalXP = '430';
    const legacySrs = JSON.stringify({
      'أَيُّ مَادَّةٍ تُحِبّ؟': {
        interval: 3,
        easeFactor: 2.5,
        repetitions: 2,
        dueDate: '2026-08-01',
      },
    });
    state.set('completedUnits', completedUnits);
    state.set('totalXP', totalXP);
    state.set('srsState', legacySrs);

    await runV5Migration();
    const afterFirstRun = state.get('srsState');
    await runV5Migration();

    expect(state.get('completedUnits')).toBe(completedUnits);
    expect(state.get('totalXP')).toBe(totalXP);
    expect(state.get('v5MigrationVersion')).toBe(String(V5_MIGRATION_VERSION));
    expect(state.get('srsState')).toBe(afterFirstRun);
    expect(afterFirstRun).not.toContain('أَيُّ مَادَّةٍ تُحِبّ؟');
    expect(afterFirstRun).toContain('أَيَّ مَادَّةٍ تُحِبُّ؟');

    expect(await rollbackV5Migration()).toBe(true);
    expect(state.get('completedUnits')).toBe(completedUnits);
    expect(state.get('totalXP')).toBe(totalXP);
    expect(state.get('srsState')).toBe(legacySrs);
    expect(state.has('v5MigrationVersion')).toBe(false);
  });
});
