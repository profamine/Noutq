/**
 * Aucune dépendance serveur (fs, express) : ce module est importé aussi bien
 * par le resolver Node (src/server/audioResolver.ts) que par le client
 * (capture du deep link Capacitor dans App.tsx). Garder les deux en phase
 * évite qu'un audio_id jugé valide côté app soit rejeté côté serveur, ou l'inverse.
 */
export function isValidAudioId(audioId: string): boolean {
  return /^[a-z0-9.-]+$/i.test(audioId);
}

/** Extrait l'audio_id d'un chemin `/a/{audioId}` (avec ou sans domaine/query). Ne valide pas le format. */
export function extractAudioIdFromPath(pathOrUrl: string): string | null {
  try {
    const path = pathOrUrl.includes('://') ? new URL(pathOrUrl).pathname : pathOrUrl;
    const match = path.match(/^\/a\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}
