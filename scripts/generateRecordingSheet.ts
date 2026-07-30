import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lessonsData } from '../src/data/lessons';

/**
 * Génère la feuille de production audio à partir du backlog réel, afin que la
 * liste des enregistrements à réaliser ne soit jamais saisie à la main et ne
 * puisse pas diverger du contenu de l'application.
 *
 * Sortie : content/v5/audio-recording-sheet.csv (UTF-8 avec BOM, lisible tel
 * quel dans Excel sous Windows).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const backlogPath = path.join(projectRoot, 'content', 'v5', 'audio-recording-backlog.json');
const curriculumPath = path.join(projectRoot, 'content', 'v5', 'curriculum.json');
const outputPath = path.join(projectRoot, 'content', 'v5', 'audio-recording-sheet.csv');

interface BacklogItem {
  audio_id: string;
  exercise_id: string;
  arabic_text: string;
  type: string;
  expected_filename: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}

interface CurriculumActivity {
  id: string;
  unit?: string;
  type: string;
  arabic?: string;
  transliteration?: string;
  armenian?: string;
  promptAr?: string;
  promptHy?: string;
}

const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8')) as { items: BacklogItem[] };
const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8')) as {
  units: Array<{ id: string; titleAr: string; titleHy: string; legacySources: string[] }>;
  newActivities: CurriculumActivity[];
  review: CurriculumActivity[];
  assessments: Array<{ id: string; titleAr: string; items: CurriculumActivity[] }>;
};

// ── Index de contexte ───────────────────────────────────────────────────────
const unitTitleAr = new Map(curriculum.units.map((u) => [u.id, u.titleAr]));
const legacyToUnitTitle = new Map<string, string>();
for (const unit of curriculum.units) {
  for (const legacy of unit.legacySources) legacyToUnitTitle.set(legacy, unit.titleAr);
}

const activityById = new Map<string, CurriculumActivity>();
for (const activity of curriculum.newActivities) activityById.set(activity.id, activity);
for (const activity of curriculum.review) activityById.set(activity.id, activity);
for (const assessment of curriculum.assessments) {
  for (const item of assessment.items) activityById.set(item.id, item);
}

const legacyStepById = new Map<string, { transliteration: string; armenian: string; unit: string }>();
for (const [lessonId, lesson] of Object.entries(lessonsData)) {
  for (const step of lesson.steps) {
    legacyStepById.set(step.audio ?? `${lessonId}.${step.id}`, {
      transliteration: step.transliteration ?? '',
      armenian: step.armenian ?? '',
      unit: lessonId,
    });
  }
}

// ── Règles de production ────────────────────────────────────────────────────
/** Consonnes absentes de l'arménien : la prise lente aide réellement. */
const HARD_PHONEMES = /[عحصضطظثذق]/;
/** Unités de décodage : lettres, voyelles longues, tanwīn. */
const DECODING_UNITS = new Set(['u1', 'u2', 'u3', 'C01', 'C02', 'C03', 'G01']);
// Interlocuteur féminin : تُحِبِّينَ, أنتِ, et le suffixe ـكِ. Le lookahead ne doit
// exclure que les *lettres* arabes (U+0621–U+064A) : l'exclure sur tout le bloc
// arabe raterait « حَالُكِ؟ », le ؟ arabe appartenant lui aussi à ce bloc.
const FEMININE_ADDRESSEE = /(ِينَ|أَنْتِ|كِ(?![ء-ي]))/;
/** Paire minimale masculin/féminin présentée en contraste sur une même ligne. */
const CONTRAST_PAIR = /\s\/\s/;

/**
 * Le genre de l'interlocuteur ne détermine pas celui du locuteur : une question
 * adressée à une femme peut être posée par un homme. Ce qui impose une voix
 * féminine, c'est la *réponse* du dialogue quand la question s'adresse au
 * féminin. Les paires de contraste (أَنْتَ / أَنْتِ) sont au contraire lues par
 * une seule voix, sinon le contraste phonétique est brouillé.
 */
function speakerFor(type: string, text: string): string {
  if (CONTRAST_PAIR.test(text)) return 'primary-male';
  if (type === 'mini-dialogue') {
    return FEMININE_ADDRESSEE.test(text)
      ? 'two-voices (reply: female)'
      : 'two-voices (reply: male)';
  }
  return 'primary-male';
}

/**
 * Une prise lente ne se justifie que pour les exercices de décodage et pour les
 * items courts dont le phonème difficile *est* l'objet de l'exercice. La régler
 * sur « toute phrase contenant un ع » reviendrait à doubler tout le corpus,
 * pour un bénéfice nul : la lecture ralentie est déjà disponible dans
 * l'application via le contrôle de vitesse de lecture.
 */
function slowTakeFor(unit: string, text: string): string {
  if (DECODING_UNITS.has(unit)) return 'yes';
  const isShortDrill = text.replace(/[ً-ْ\s—.،؟]/g, '').length <= 12;
  return isShortDrill && HARD_PHONEMES.test(text) ? 'yes' : 'no';
}

function contextFor(item: BacklogItem): string {
  const activity = activityById.get(item.audio_id);
  if (activity?.unit) return unitTitleAr.get(activity.unit) ?? activity.unit;
  const legacyUnit = item.audio_id.match(/^(u\d+)\./)?.[1];
  if (legacyUnit) return legacyToUnitTitle.get(legacyUnit) ?? legacyUnit;
  if (item.audio_id.startsWith('v5.x01.')) return 'اختبار المسار الأساسي';
  if (item.audio_id.startsWith('v5.x02.')) return 'اختبار الامتداد النحوي';
  if (item.audio_id.startsWith('v5.r01.')) return 'المراجعة الشاملة';
  return '';
}

function unitFor(item: BacklogItem): string {
  const activity = activityById.get(item.audio_id);
  if (activity?.unit) return activity.unit;
  return item.audio_id.match(/^(u\d+)\./)?.[1] ?? '';
}

const csvCell = (value: string): string => {
  const text = (value ?? '').replace(/\r?\n/g, ' ').trim();
  return /[",;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const HEADER = [
  'audio_id', 'arabic_text', 'transliteration', 'meaning_hy', 'unit',
  'activity_type', 'context', 'priority', 'speaker', 'slow_take',
  'status', 'take_chosen', 'reviewer', 'notes',
];

const rows = backlog.items
  .slice()
  .sort((a, b) => a.priority.localeCompare(b.priority) || a.audio_id.localeCompare(b.audio_id))
  .map((item) => {
    const activity = activityById.get(item.audio_id);
    const legacy = legacyStepById.get(item.audio_id);
    const unit = unitFor(item);
    const text = item.arabic_text || activity?.promptAr || '';
    return [
      item.audio_id,
      text,
      activity?.transliteration ?? legacy?.transliteration ?? '',
      activity?.armenian ?? activity?.promptHy ?? legacy?.armenian ?? '',
      unit,
      item.type,
      contextFor(item),
      item.priority,
      speakerFor(item.type, text),
      slowTakeFor(unit, text),
      'pending',
      '',
      '',
      '',
    ].map(csvCell).join(',');
  });

// BOM : sans lui Excel sous Windows affiche l'arabe en caractères illisibles.
fs.writeFileSync(outputPath, `﻿${HEADER.join(',')}\n${rows.join('\n')}\n`, 'utf8');

const byPriority = backlog.items.reduce<Record<string, number>>((acc, item) => {
  acc[item.priority] = (acc[item.priority] ?? 0) + 1;
  return acc;
}, {});

console.log(
  `Generated ${path.relative(projectRoot, outputPath)} with ${rows.length} rows ` +
  `(${Object.entries(byPriority).sort().map(([p, n]) => `${p}:${n}`).join(' ')}).`,
);
