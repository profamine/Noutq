import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lessonsData } from '../src/data/lessons';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const audioDir = path.join(projectRoot, 'public', 'audio');
const legacyManifestPath = path.join(audioDir, 'manifest.json');
const outputPath = path.join(audioDir, 'manifest.v2.json');
const curriculumPath = path.join(projectRoot, 'content', 'v5', 'curriculum.json');
const backlogPath = path.join(projectRoot, 'content', 'v5', 'audio-recording-backlog.json');

type AudioStatus = 'available' | 'missing';

interface AudioSpec {
  status: AudioStatus;
  src?: string;
  fallback?: string;
}

interface AudioEntry {
  exerciseId: string;
  audioId: string;
  text: string;
  status: AudioStatus;
  src?: string;
  fallback?: string;
  stablePath: string;
  activityType: string;
  expectedFilename: string;
  legacyAliases?: string[];
  /** Décidé une fois ici — ni le générateur de QR ni le générateur DOCX ne
   *  redécident cette règle indépendamment, pour éviter toute divergence. */
  includeInBookQr: boolean;
  unitTitleAr?: string;
  unitTitleHy?: string;
}

interface CurriculumActivity {
  id: string;
  unit?: string;
  arabic?: string;
  promptAr?: string;
  type: string;
  audio?: AudioSpec;
}

interface Curriculum {
  release: string;
  units: Array<{ id: string; titleAr: string; titleHy: string; track: string; legacySources: string[] }>;
  newActivities: CurriculumActivity[];
  review: CurriculumActivity[];
  assessments: Array<{ items: CurriculumActivity[] }>;
  textMigrations: Array<{
    exerciseId: string;
    from: string;
    to: string;
    legacyAudioAlias: boolean;
    legacyAudioText?: string;
  }>;
  bookQrOverrides?: Array<{ audioId: string; includeInBookQr: boolean }>;
}

const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8')) as Curriculum;
const legacyManifest = JSON.parse(fs.readFileSync(legacyManifestPath, 'utf8')) as Record<string, string>;
const migrationByExercise = new Map(curriculum.textMigrations.map((item) => [item.exerciseId, item]));
const bookQrOverrideByAudioId = new Map(
  (curriculum.bookQrOverrides ?? []).map((item) => [item.audioId, item.includeInBookQr]),
);
const v5UnitTitleById = new Map(curriculum.units.map((unit) => [unit.id, unit]));

/** Types dont la valeur d'écoute est intrinsèque à l'activité — seuls ceux-ci
 *  reçoivent un QR sans déclaration explicite (voir bookQrOverrides pour le reste). */
const LISTENING_TYPES = new Set(['listen', 'listening', 'listening-discrimination']);

function resolveIncludeInBookQr(audioId: string, activityType: string): boolean {
  const override = bookQrOverrideByAudioId.get(audioId);
  if (override !== undefined) return override;
  return LISTENING_TYPES.has(activityType);
}

const entries: Record<string, AudioEntry> = {};
const textIndex: Record<string, string> = {};
const legacyTextSources: Record<string, string> = {};

/**
 * Noms de fichiers produits historiquement par scripts/generateAll.ts, dérivés
 * du texte arabe et non de l'identifiant. Des enregistrements valides existent
 * sous ces noms sans figurer dans manifest.json ; sans cette résolution ils
 * seraient déclarés « missing » alors que l'audio est présent sur le disque.
 */
function legacyFilenameCandidates(text: string): string[] {
  if (!text) return [];
  const standard = text.replace(/[/\\:*?"<>|]/g, '_').trim();
  const underscored = text.replace(/[^a-zA-Z0-9؀-ۿ]/g, '_').slice(0, 50);
  return [...new Set([standard, underscored])].filter(Boolean).map((name) => `${name}.wav`);
}

function resolveFromDisk(candidates: string[]): string | null {
  for (const filename of candidates) {
    if (fs.existsSync(path.join(audioDir, filename))) {
      return `/audio/${encodeURIComponent(filename)}`;
    }
  }
  return null;
}

/**
 * .mp3 est le format de livraison standard (voir content/v5/audio-recording-sheet.csv :
 * WAV 48kHz est l'archive maître, MP3 mono 44.1kHz/64kbps la version embarquée).
 * .wav reste accepté pour ne pas casser les anciens fichiers Gemini déposés
 * directement sous l'ID de l'exercice.
 */
function idBasedCandidates(exerciseId: string): string[] {
  return [`${exerciseId}.mp3`, `${exerciseId}.wav`];
}

function addEntry(
  exerciseId: string,
  text: string,
  audio: AudioSpec,
  activityType: string,
  unitTitle?: { titleAr: string; titleHy: string },
): void {
  if (entries[exerciseId]) throw new Error(`DUPLICATE_AUDIO_ID:${exerciseId}`);
  const migration = migrationByExercise.get(exerciseId);
  // Nom canonique attendu pour cet ID, indépendamment du nom réel trouvé sur le
  // disque (qui peut être un ancien nom dérivé du texte — voir legacyFilenameCandidates).
  const expectedFilename = `${exerciseId}.mp3`;
  // Le fichier nommé par ID (voix unique régénérée) prime TOUJOURS sur une
  // correspondance texte->wav héritée de l'ancien manifest.json, même quand
  // celui-ci déclarait déjà `audio` comme disponible : sinon l'ancien fichier
  // (voix Gemini) continue d'être servi silencieusement après régénération.
  const idBasedSrc = resolveFromDisk(idBasedCandidates(exerciseId));
  const diskSrc = idBasedSrc
    ?? (audio.status === 'missing' ? resolveFromDisk(legacyFilenameCandidates(text)) : null);
  const resolvedAudio = diskSrc
    ? { status: 'available' as const, src: diskSrc }
    : audio;
  const entry: AudioEntry = {
    exerciseId,
    audioId: exerciseId,
    text,
    status: resolvedAudio.status,
    stablePath: `/a/${encodeURIComponent(exerciseId)}`,
    activityType,
    expectedFilename,
    includeInBookQr: resolveIncludeInBookQr(exerciseId, activityType),
  };
  if (resolvedAudio.src) entry.src = resolvedAudio.src;
  if (resolvedAudio.fallback) entry.fallback = resolvedAudio.fallback;
  if (unitTitle) {
    entry.unitTitleAr = unitTitle.titleAr;
    entry.unitTitleHy = unitTitle.titleHy;
  }
  if (migration?.legacyAudioAlias) {
    entry.legacyAliases = [migration.from];
    const legacySource = legacyManifest[migration.legacyAudioText ?? migration.from];
    if (legacySource) legacyTextSources[migration.from] = legacySource;
  }
  entries[exerciseId] = entry;
  textIndex[text] ??= exerciseId;
}

for (const [lessonId, lesson] of Object.entries(lessonsData)) {
  for (const step of lesson.steps) {
    // Les activités V5 injectées dans les leçons sont déjà décrites par
    // curriculum.json ; elles sont traitées plus bas sous leur identifiant V5.
    if (step.audio?.startsWith('v5.')) continue;
    const exerciseId = `${lessonId}.${step.id}`;
    const src = legacyManifest[step.arabic];
    addEntry(
      exerciseId,
      step.arabic,
      src
        ? { status: 'available', src }
        : { status: 'missing', fallback: step.type === 'listen' ? 'reading' : 'native-tts-or-reading' },
      step.type,
      { titleAr: lesson.titleAr, titleHy: lesson.title },
    );
  }
}

const v5Activities = [
  ...curriculum.newActivities,
  ...curriculum.review,
  ...curriculum.assessments.flatMap((assessment) => assessment.items),
];

for (const activity of v5Activities) {
  if (!activity.audio) continue;
  const text = activity.arabic ?? activity.promptAr ?? '';
  const unit = activity.unit ? v5UnitTitleById.get(activity.unit) : undefined;
  addEntry(activity.id, text, activity.audio, activity.type, unit && { titleAr: unit.titleAr, titleHy: unit.titleHy });
}

const manifest = {
  version: 3,
  generatedFrom: [
    'src/data/lessons/u1.ts…u22.ts',
    'content/v5/curriculum.json',
    'public/audio/manifest.json',
  ],
  entries,
  textIndex,
  legacyTextSources,
};

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const coreLegacyIds = new Set(
  curriculum.units
    .filter((unit) => unit.track === 'core')
    .flatMap((unit) => unit.legacySources),
);

function priorityFor(entry: AudioEntry): 'P0' | 'P1' | 'P2' | 'P3' {
  if (
    entry.audioId.startsWith('u13.') ||
    entry.audioId.startsWith('v5.e01.') ||
    entry.audioId.startsWith('v5.r01.') ||
    entry.audioId.startsWith('v5.x01.') ||
    entry.audioId.startsWith('v5.x02.')
  ) {
    return 'P2';
  }
  const legacyUnit = entry.audioId.match(/^(u\d+)\./)?.[1];
  const isCore = (legacyUnit && coreLegacyIds.has(legacyUnit)) || /^v5\.c\d+\./.test(entry.audioId);
  if (isCore && ['listen', 'listening', 'listening-discrimination'].includes(entry.activityType)) return 'P0';
  if (isCore && ['speak', 'mini-dialogue', 'production'].includes(entry.activityType)) return 'P1';
  return 'P3';
}

const backlog = {
  schemaVersion: 1,
  release: curriculum.release,
  manifestVersion: manifest.version,
  totalMissing: Object.values(entries).filter((entry) => entry.status === 'missing').length,
  items: Object.values(entries)
    .filter((entry) => entry.status === 'missing')
    .map((entry) => ({
      audio_id: entry.audioId,
      exercise_id: entry.exerciseId,
      arabic_text: entry.text,
      type: entry.activityType,
      expected_filename: entry.expectedFilename,
      fallback_type: entry.fallback,
      priority: priorityFor(entry),
    }))
    .sort((left, right) => left.priority.localeCompare(right.priority) || left.audio_id.localeCompare(right.audio_id)),
};

fs.writeFileSync(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`, 'utf8');
console.log(
  `Generated ${path.relative(projectRoot, outputPath)} with ${Object.keys(entries).length} audio IDs ` +
  `and ${path.relative(projectRoot, backlogPath)} with ${backlog.totalMissing} missing assets.`,
);
