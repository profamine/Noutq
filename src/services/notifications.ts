import { LocalNotifications } from '@capacitor/local-notifications';

const DAILY_NOTIF_ID = 42;

/**
 * Demande la permission d'afficher des notifications locales.
 * Retourne true si accordée, false sinon (ou hors Capacitor).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    // Hors Capacitor (navigateur web) : l'API n'est pas disponible
    return false;
  }
}

/**
 * Planifie un rappel quotidien à 19h00.
 * Annule d'abord toute notification existante (id=42) pour éviter les doublons.
 */
export async function scheduleDailyReminderNotification(): Promise<void> {
  try {
    // Annuler l'ancienne notification avant de replanifier
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_NOTIF_ID }] });

    await LocalNotifications.schedule({
      notifications: [{
        id: DAILY_NOTIF_ID,
        title: '📚 Noutq — Ժամանակն է արաբերեն սովորել',
        body: 'Շarbunakir qo streak-ə. Sovorir 5 ropje aysor! 🔥\nواصل تعلمك اليوم لمدة 5 دقائق!',
        schedule: {
          on: { hour: 19, minute: 0 },
          repeats: true,
        },
        sound: undefined,
        smallIcon: 'ic_launcher_foreground',
      }],
    });
  } catch (err) {
    console.warn('[Notifications] Impossible de planifier :', err);
  }
}

/**
 * Annule le rappel quotidien (id=42).
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_NOTIF_ID }] });
  } catch {
    /* noop — hors Capacitor */
  }
}
