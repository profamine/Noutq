import curriculumSource from '../../../content/v5/curriculum.json';

export type V5TrackId = 'core' | 'grammar';

export interface V5Track {
  id: V5TrackId;
  titleAr: string;
  titleHy: string;
  requiredUnits: string[];
  assessmentId: string;
}

export interface V5TrackStatus {
  completed: boolean;
  completedCount: number;
  requiredCount: number;
  percent: number;
}

export const curriculumV5 = curriculumSource;
export const LEGACY_UNIT_IDS = curriculumSource.legacyUnitIds as readonly string[];

export function getV5Track(trackId: V5TrackId): V5Track {
  const track = curriculumSource.tracks.find((item) => item.id === trackId);
  if (!track) throw new Error(`UNKNOWN_V5_TRACK:${trackId}`);
  return track as V5Track;
}

export function getV5TrackStatus(
  completedUnits: readonly string[],
  trackId: V5TrackId,
): V5TrackStatus {
  const track = getV5Track(trackId);
  return statusFor(completedUnits, track.requiredUnits);
}

function statusFor(completedUnits: readonly string[], units: readonly string[]): V5TrackStatus {
  const completed = new Set(completedUnits);
  const completedCount = units.filter((id) => completed.has(id)).length;
  const requiredCount = units.length;
  return {
    completed: requiredCount > 0 && completedCount === requiredCount,
    completedCount,
    requiredCount,
    percent: requiredCount === 0 ? 100 : Math.round((completedCount / requiredCount) * 100),
  };
}

/**
 * Unités hors des deux parcours notés : `optional` (approfondissement) et
 * `review` (révision générale). Sans cela, les terminer n'avance aucun
 * compteur et le travail de l'apprenant reste invisible.
 */
export function getV5SideTrackUnits(track: 'optional' | 'review'): string[] {
  return curriculumSource.units
    .filter((unit) => unit.track === track)
    .flatMap((unit) => unit.legacySources as string[]);
}

export function getV5SideTrackStatus(
  completedUnits: readonly string[],
  track: 'optional' | 'review',
): V5TrackStatus {
  return statusFor(completedUnits, getV5SideTrackUnits(track));
}
