import { Network } from '@capacitor/network';

/**
 * URL de base du serveur API. Vide (chemins relatifs) en web, où le front
 * et l'API sont servis par la même origine. Dans l'APK Capacitor, les fichiers
 * sont embarqués localement (aucun serveur au même endroit) : VITE_API_BASE_URL
 * doit alors pointer vers le déploiement public (ex. Vercel) au moment du build.
 */
const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').replace(/\/$/, '');

/** Construit l'URL complète d'un endpoint API (`apiUrl('/api/chat')`). */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

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
