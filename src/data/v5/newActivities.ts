import curriculumSource from '../../../content/v5/curriculum.json';
import type { LessonStep } from '../types';

/**
 * Les activités V5 sont décrites dans content/v5/curriculum.json mais l'écran de
 * leçon ne connaît que les types historiques. Ce module les convertit en
 * LessonStep afin qu'elles soient réellement jouables, au lieu de n'exister que
 * dans le document pédagogique.
 *
 * Chaque étape injectée conserve son identifiant V5 dans `audio` : c'est lui qui
 * sert de clé audio stable (/a/{audioId}) et qui évite de dépendre du numéro
 * d'étape, susceptible de changer.
 */

/** Décalage d'identifiant : les leçons existantes vont jusqu'à 141. */
const V5_STEP_ID_OFFSET = 900;

const TYPE_TO_STEP: Record<string, LessonStep['type']> = {
  listening: 'listen',
  reading: 'listen',
  'mini-dialogue': 'listen',
  production: 'speak',
  writing: 'write',
};

interface RawActivity {
  id: string;
  unit: string;
  type: string;
  arabic?: string;
  transliteration?: string;
  armenian?: string;
}

const legacyUnitByV5Unit = new Map<string, string>(
  curriculumSource.units
    .filter((unit) => (unit.legacySources ?? []).length > 0)
    .map((unit) => [unit.id, unit.legacySources[0]]),
);

function toStep(activity: RawActivity, index: number): LessonStep | null {
  const type = TYPE_TO_STEP[activity.type];
  if (!type || !activity.arabic) return null;
  return {
    id: V5_STEP_ID_OFFSET + index,
    type,
    arabic: activity.arabic,
    armenian: activity.armenian ?? '',
    transliteration: activity.transliteration ?? '',
    audio: activity.id,
    meaning: type === 'listen' ? undefined : activity.armenian,
  };
}

/** Étapes V5 supplémentaires, regroupées par identifiant d'unité historique. */
export function getV5StepsByLegacyUnit(): Record<string, LessonStep[]> {
  const grouped: Record<string, LessonStep[]> = {};
  const activities = curriculumSource.newActivities as RawActivity[];

  activities.forEach((activity, index) => {
    const legacyUnit = legacyUnitByV5Unit.get(activity.unit);
    if (!legacyUnit) return;
    const step = toStep(activity, index);
    if (!step) return;
    (grouped[legacyUnit] ??= []).push(step);
  });

  return grouped;
}
