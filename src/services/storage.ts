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
  | 'notificationsEnabled';

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
