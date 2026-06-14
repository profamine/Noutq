import { Network } from '@capacitor/network';

/**
 * Vérifie la connectivité via Capacitor Network (Android/iOS)
 * avec repli sur navigator.onLine pour le navigateur web.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    // Hors Capacitor (navigateur web) : supposer connecté si navigator.onLine est vrai.
    return navigator.onLine ?? true;
  }
}

/**
 * fetch() avec AbortController + timeout configurable.
 * Lance AbortError si la requête dépasse timeoutMs millisecondes.
 */
export function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}
