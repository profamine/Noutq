import { Preferences } from '@capacitor/preferences';

export type StorageKey =
  | 'completedUnits'
  | 'totalXP'
  | 'streak'
  | 'lastStudyDate'
  | 'studyHistory'
  | 'speechSetupDone'
  | 'chatHistory'
  | 'userName'
  | 'vocabScores'
  | 'notificationsEnabled'
  | 'srsState'
  | 'streakFreezes'
  | 'dailyGoalXP'
  | 'xpAtDayStart'
  | 'xpAtDayStartDate'
  | 'placementTestDone'
  | 'themePreference';

/** Toutes les clés incluses dans l'export/import de sauvegarde locale. */
export const BACKUP_KEYS: StorageKey[] = [
  'completedUnits', 'totalXP', 'streak', 'lastStudyDate', 'studyHistory',
  'speechSetupDone', 'userName', 'vocabScores', 'notificationsEnabled',
  'srsState', 'streakFreezes', 'dailyGoalXP', 'xpAtDayStart',
  'xpAtDayStartDate', 'placementTestDone', 'themePreference',
];

const BACKUP_FORMAT_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  data: Partial<Record<StorageKey, string>>;
}

/** Rassemble toutes les données locales dans un objet exportable en JSON. */
export async function exportBackup(): Promise<BackupPayload> {
  const data: Partial<Record<StorageKey, string>> = {};
  for (const key of BACKUP_KEYS) {
    const value = await storageGet(key);
    if (value !== null) data[key] = value;
  }
  return { version: BACKUP_FORMAT_VERSION, exportedAt: new Date().toISOString(), data };
}

/** Restaure une sauvegarde précédemment exportée. Rejette si le format est invalide. */
export async function importBackup(payload: unknown): Promise<void> {
  if (
    typeof payload !== 'object' || payload === null ||
    !('data' in payload) || typeof (payload as BackupPayload).data !== 'object'
  ) {
    throw new Error('INVALID_BACKUP_FORMAT');
  }
  const { data } = payload as BackupPayload;
  for (const key of BACKUP_KEYS) {
    const value = data[key];
    if (typeof value === 'string') await storageSet(key, value);
  }
}

let migrated = false;

/** One-shot migration from localStorage → Preferences on first run. */
async function migrateFromLocalStorage(): Promise<void> {
  if (migrated) return;
  migrated = true;

  const { value: done } = await Preferences.get({ key: '_lsMigrated' });
  if (done === 'true') return;

  const keys: StorageKey[] = [
    'completedUnits', 'totalXP', 'streak', 'lastStudyDate',
    'studyHistory', 'speechSetupDone',
  ];
  for (const key of keys) {
    const lsVal = localStorage.getItem(key);
    if (lsVal !== null) {
      await Preferences.set({ key, value: lsVal });
      localStorage.removeItem(key);
    }
  }
  await Preferences.set({ key: '_lsMigrated', value: 'true' });
}

export async function storageGet(key: StorageKey): Promise<string | null> {
  await migrateFromLocalStorage();
  const { value } = await Preferences.get({ key });
  return value;
}

export async function storageSet(key: StorageKey, value: string): Promise<void> {
  await migrateFromLocalStorage();
  await Preferences.set({ key, value });
}

export async function storageRemove(key: StorageKey): Promise<void> {
  await migrateFromLocalStorage();
  await Preferences.remove({ key });
}
