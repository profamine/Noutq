import curriculumSource from '../../content/v5/curriculum.json';
import { storageGet, storageRemove, storageSet } from './storage';
import type { SrsStateMap } from './srs';

export const V5_MIGRATION_VERSION = 2;

export interface V4Snapshot {
  completedUnits: string | null;
  totalXP: string | null;
  srsState: string | null;
}

export interface V5MigrationResult extends V4Snapshot {
  changed: boolean;
}

function parseSrs(raw: string | null): SrsStateMap {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as SrsStateMap
      : {};
  } catch {
    return {};
  }
}

/**
 * Pure, idempotent migration. Active SRS state keeps only the canonical key,
 * while runV5Migration preserves the original V4 snapshot for rollback.
 */
export function migrateV4Snapshot(snapshot: V4Snapshot): V5MigrationResult {
  const srs = parseSrs(snapshot.srsState);
  let changed = false;

  for (const migration of curriculumSource.textMigrations) {
    const legacyState = srs[migration.from];
    if (migration.migrateSrsKey && legacyState) {
      if (!srs[migration.to]) {
        srs[migration.to] = { ...legacyState };
      }
      delete srs[migration.from];
      changed = true;
    }
  }

  return {
    completedUnits: snapshot.completedUnits,
    totalXP: snapshot.totalXP,
    srsState: changed ? JSON.stringify(srs) : snapshot.srsState,
    changed,
  };
}

export async function runV5Migration(): Promise<void> {
  const version = Number(await storageGet('v5MigrationVersion') ?? '0');
  if (version >= V5_MIGRATION_VERSION) return;

  const snapshot: V4Snapshot = {
    completedUnits: await storageGet('completedUnits'),
    totalXP: await storageGet('totalXP'),
    srsState: await storageGet('srsState'),
  };

  const existingBackup = await storageGet('v5MigrationBackup');
  if (!existingBackup) {
    await storageSet('v5MigrationBackup', JSON.stringify(snapshot));
  }
  const migrated = migrateV4Snapshot(snapshot);
  if (migrated.changed && migrated.srsState !== null) {
    await storageSet('srsState', migrated.srsState);
  }
  await storageSet('v5MigrationVersion', String(V5_MIGRATION_VERSION));
}

export async function rollbackV5Migration(): Promise<boolean> {
  const rawBackup = await storageGet('v5MigrationBackup');
  if (!rawBackup) return false;

  try {
    const backup = JSON.parse(rawBackup) as V4Snapshot;
    if (backup.completedUnits !== null) await storageSet('completedUnits', backup.completedUnits);
    if (backup.totalXP !== null) await storageSet('totalXP', backup.totalXP);
    if (backup.srsState !== null) await storageSet('srsState', backup.srsState);
    else await storageRemove('srsState');
    await storageRemove('v5MigrationVersion');
    return true;
  } catch {
    return false;
  }
}

export interface LessonProgress {
  stepIndex: number;
  lives: number;
}

export function parseLessonProgress(raw: string, stepCount: number): LessonProgress | null {
  try {
    const value = JSON.parse(raw) as Partial<LessonProgress>;
    if (
      !Number.isInteger(value.stepIndex) ||
      !Number.isInteger(value.lives) ||
      value.stepIndex! < 0 ||
      value.stepIndex! >= stepCount
    ) {
      return null;
    }
    return {
      stepIndex: value.stepIndex!,
      lives: Math.max(0, Math.min(3, value.lives!)),
    };
  } catch {
    return null;
  }
}
