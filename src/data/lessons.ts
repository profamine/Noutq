import { LessonData, LessonStep, MatchPair, QuizOption } from './types';

import { u1 } from './lessons/u1';
import { u2 } from './lessons/u2';
import { u3 } from './lessons/u3';
import { u4 } from './lessons/u4';
import { u5 } from './lessons/u5';
import { u6 } from './lessons/u6';
import { u7 } from './lessons/u7';
import { u8 } from './lessons/u8';
import { u9 } from './lessons/u9';
import { u10 } from './lessons/u10';
import { u11 } from './lessons/u11';
import { u12 } from './lessons/u12';
import { u13 } from './lessons/u13';
import { u14 } from './lessons/u14';
import { u15 } from './lessons/u15';
import { u16 } from './lessons/u16';
import { u17 } from './lessons/u17';
import { u18 } from './lessons/u18';
import { u19 } from './lessons/u19';
import { u20 } from './lessons/u20';

import { u21 } from './lessons/u21';
import { u22 } from './lessons/u22';

import { getV5StepsByLegacyUnit } from './v5/newActivities';

const baseLessons: Record<string, LessonData> = {
  u1,
  u2,
  u3,
  u4,
  u5,
  u6,
  u7,
  u8,
  u9,
  u10,
  u11,
  u12,
  u13,
  u14,
  u15,
  u16,
  u17,
  u18,
  u19,
  u20,
  u21,
  u22,
};

/**
 * Les activités V5 (content/v5/curriculum.json) sont ajoutées à la fin de leur
 * unité historique, afin que le document pédagogique et l'application décrivent
 * exactement le même contenu.
 */
const v5StepsByUnit = getV5StepsByLegacyUnit();

export const lessonsData: Record<string, LessonData> = Object.fromEntries(
  Object.entries(baseLessons).map(([id, lesson]) => {
    const extra = v5StepsByUnit[id];
    return [id, extra?.length ? { ...lesson, steps: [...lesson.steps, ...extra] } : lesson];
  }),
);

export type { LessonData, LessonStep, MatchPair, QuizOption };
