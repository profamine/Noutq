import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { lessonsData } from '../src/data/lessons';
import { LEGACY_UNIT_IDS } from '../src/data/v5/curriculum';
import { buildAudioStableUrl, normalizePublicBaseUrl } from '../src/config/publicUrl';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(projectRoot, 'content', 'v5', 'curriculum.json'), 'utf8'));
const glossary = JSON.parse(fs.readFileSync(path.join(projectRoot, 'content', 'v5', 'glossary.json'), 'utf8'));
const lexicalRequirements = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'content', 'v5', 'lexical-requirements.json'), 'utf8'),
);
const audioManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'public', 'audio', 'manifest.v2.json'), 'utf8'));
const audioBacklog = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'content', 'v5', 'audio-recording-backlog.json'), 'utf8'),
);

const errors: string[] = [];
const allExerciseIds = new Set<string>();
const allSourceIds = new Set<string>();

function check(condition: unknown, message: string): void {
  if (!condition) errors.push(message);
}

function addUnique(id: string, kind: string): void {
  check(!allExerciseIds.has(id), `duplicate ${kind} ID: ${id}`);
  allExerciseIds.add(id);
}

function normalizeArabicStrict(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[؟?!،,؛;:.…«»"'()[\]{}ـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeArabicLoose(value: string): string {
  return normalizeArabicStrict(value)
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, '');
}

function phonemeTokens(value: string): string[] {
  return value.split('/').map((item) => item.trim()).filter(Boolean);
}

function assertNoDuplicatePhonemeCategories(): void {
  const seen = new Map<string, string>();
  for (const category of curriculum.pronunciationGuide.categories) {
    for (const value of category.sounds) {
      for (const sound of phonemeTokens(value)) {
        const previous = seen.get(sound);
        check(!previous, `phoneme ${sound} appears in both category ${previous} and ${category.id}`);
        seen.set(sound, category.id);
      }
    }
  }
  for (const sound of curriculum.pronunciationGuide.requiredSounds) {
    check(seen.has(sound), `phoneme inventory is missing ${sound}`);
  }
  for (const sound of seen.keys()) {
    check(curriculum.pronunciationGuide.requiredSounds.includes(sound), `unexpected phoneme outside inventory: ${sound}`);
  }
  check(
    seen.size === curriculum.pronunciationGuide.requiredSounds.length,
    'phoneme inventory and category membership counts differ',
  );
}

assertNoDuplicatePhonemeCategories();

for (const [lessonId, lesson] of Object.entries(lessonsData)) {
  check(lesson.id === lessonId, `lesson registry mismatch: ${lessonId} != ${lesson.id}`);
  const localStepIds = new Set<number>();
  for (const step of lesson.steps) {
    check(!localStepIds.has(step.id), `duplicate step ID: ${lessonId}.${step.id}`);
    localStepIds.add(step.id);
    // Les activités V5 injectées dans les leçons sont adressées par leur
    // identifiant stable (step.audio), pas par « unité.étape ».
    const audioId = step.audio ?? `${lessonId}.${step.id}`;
    const fullId = `${lessonId}.${step.id}`;
    if (!step.audio) {
      addUnique(fullId, 'exercise');
      allSourceIds.add(fullId);
    }
    if (step.type === 'listen') {
      const mapping = audioManifest.entries[audioId];
      check(Boolean(mapping), `listening activity has no audio mapping: ${audioId}`);
      check(
        mapping?.status === 'available' || Boolean(mapping?.fallback),
        `listening activity has neither asset nor fallback: ${audioId}`,
      );
    }
  }
}

check(Object.prototype.hasOwnProperty.call(lessonsData, 'u8'), 'u8 is missing');
check(lessonsData.u8.steps.some((step) => step.id === 71), 'u8.71 must remain a real legacy ID');
check(
  lessonsData.u15.steps.some((step) => step.id === 7 && step.arabic === 'أَيَّ مَادَّةٍ تُحِبُّ؟'),
  'u15.7 Arabic correction is missing',
);

check(
  LEGACY_UNIT_IDS.length === Object.keys(lessonsData).length &&
  LEGACY_UNIT_IDS.every((id) => Object.prototype.hasOwnProperty.call(lessonsData, id)),
  'navigation legacy units and lesson data are out of sync',
);
const homeSource = fs.readFileSync(path.join(projectRoot, 'src', 'screens', 'HomeScreen.tsx'), 'utf8');
const homeUnitIds = new Set(
  [...homeSource.matchAll(/onStartLesson\(['"](u\d+)['"]\)/g)].map((match) => match[1]),
);
check(
  homeUnitIds.size === LEGACY_UNIT_IDS.length && LEGACY_UNIT_IDS.every((id) => homeUnitIds.has(id)),
  'HomeScreen navigation and lesson data are out of sync',
);

for (const unit of curriculum.units) {
  for (const source of unit.legacySources) {
    check(Object.prototype.hasOwnProperty.call(lessonsData, source), `${unit.id} references missing legacy unit ${source}`);
  }
}

// ── Le document et l'application doivent décrire le même contenu ───────────
// Toute activité marquée « in-app » doit être réellement jouable, sinon le
// document promet un exercice que l'apprenant ne trouvera jamais.
const wiredV5AudioIds = new Set(
  Object.values(lessonsData).flatMap((lesson) =>
    lesson.steps.map((step) => step.audio).filter((id): id is string => Boolean(id?.startsWith('v5.'))),
  ),
);
for (const activity of curriculum.newActivities) {
  const delivery = (activity as { delivery?: string }).delivery ?? 'in-app';
  if (delivery !== 'in-app') continue;
  check(
    wiredV5AudioIds.has(activity.id),
    `activity marked in-app but not reachable in any lesson: ${activity.id}`,
  );
}
check(
  wiredV5AudioIds.size === curriculum.newActivities.filter(
    (activity) => ((activity as { delivery?: string }).delivery ?? 'in-app') === 'in-app',
  ).length,
  'lesson data exposes V5 activities that curriculum.json does not declare as in-app',
);

const v5Collections = [
  ...curriculum.newActivities,
  ...curriculum.review,
  ...curriculum.assessments.flatMap((assessment: { items: unknown[] }) => assessment.items),
];
for (const activity of v5Collections) {
  addUnique(activity.id, 'V5 exercise');
  allSourceIds.add(activity.id);
  check(/^v5\.[a-z0-9]+\.\d+$/i.test(activity.id), `invalid V5 exercise namespace: ${activity.id}`);
  if (activity.type === 'listening' || activity.type === 'listening-discrimination') {
    const mapping = audioManifest.entries[activity.id];
    check(Boolean(mapping), `listening activity has no audio mapping: ${activity.id}`);
    check(
      mapping?.status === 'available' || Boolean(mapping?.fallback),
      `listening activity has neither asset nor fallback: ${activity.id}`,
    );
  }
}

const stableAudioPaths = new Set<string>();
for (const [audioId, entry] of Object.entries(audioManifest.entries) as Array<[string, any]>) {
  check(entry.audioId === audioId, `audio ID mismatch: ${audioId}`);
  check(Boolean(entry.activityType), `audio entry has no activity type: ${audioId}`);
  check(entry.expectedFilename === `${audioId}.mp3`, `invalid expected audio filename: ${audioId}`);
  check(entry.stablePath === `/a/${encodeURIComponent(audioId)}`, `invalid stable resolver path: ${audioId}`);
  check(!stableAudioPaths.has(entry.stablePath), `duplicate stable audio/QR destination: ${entry.stablePath}`);
  stableAudioPaths.add(entry.stablePath);
  check(allSourceIds.has(entry.exerciseId), `audio references nonexistent exercise: ${entry.exerciseId}`);
  if (entry.status === 'available') {
    check(typeof entry.src === 'string', `available audio has no src: ${audioId}`);
    if (typeof entry.src === 'string' && entry.src.startsWith('/audio/')) {
      const file = path.join(projectRoot, 'public', decodeURIComponent(entry.src));
      check(fs.existsSync(file), `audio asset missing: ${audioId} -> ${entry.src}`);
    }
  } else {
    check(Boolean(entry.fallback), `missing audio has no explicit fallback: ${audioId}`);
  }
}

let canonicalBaseUrl: string | null = null;
try {
  canonicalBaseUrl = normalizePublicBaseUrl(process.env.NOUTQ_PUBLIC_BASE_URL, true);
} catch (error) {
  check(false, error instanceof Error ? error.message : 'invalid canonical public URL');
}
const qrTargets: Array<{ audioId: string; url: string }> = [];
if (canonicalBaseUrl) {
  const destinations = new Set<string>();
  for (const [audioId, entry] of Object.entries(audioManifest.entries) as Array<[string, any]>) {
    if (!['listen', 'listening', 'listening-discrimination'].includes(entry.activityType)) continue;
    const url = buildAudioStableUrl(canonicalBaseUrl, audioId);
    check(url.startsWith('https://'), `production QR target is not HTTPS: ${audioId}`);
    check(!destinations.has(url), `duplicate QR destination: ${url}`);
    destinations.add(url);
    qrTargets.push({ audioId, url });
  }
}
const reportsDir = path.join(projectRoot, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.join(reportsDir, 'v5-rc2-qr-status.json'),
  `${JSON.stringify({
    release: curriculum.release,
    enabled: Boolean(canonicalBaseUrl),
    canonicalBaseUrl,
    reason: canonicalBaseUrl ? null : 'NOUTQ_PUBLIC_BASE_URL is not configured; QR generation is explicitly disabled.',
    targetCount: qrTargets.length,
    targets: qrTargets,
  }, null, 2)}\n`,
  'utf8',
);

check(
  audioManifest.version === curriculum.audioManifestVersion,
  `audio manifest version ${audioManifest.version} does not match curriculum metadata ${curriculum.audioManifestVersion}`,
);
const missingAudioIds = Object.values(audioManifest.entries)
  .filter((entry: any) => entry.status === 'missing')
  .map((entry: any) => entry.audioId)
  .sort();
const backlogIds = audioBacklog.items.map((item: any) => item.audio_id).sort();
check(audioBacklog.release === curriculum.release, 'audio backlog release does not match curriculum release');
check(audioBacklog.manifestVersion === audioManifest.version, 'audio backlog manifest version mismatch');
check(audioBacklog.totalMissing === missingAudioIds.length, 'audio backlog totalMissing is inaccurate');
check(JSON.stringify(backlogIds) === JSON.stringify(missingAudioIds), 'audio backlog and manifest missing IDs differ');
for (const item of audioBacklog.items) {
  const entry = audioManifest.entries[item.audio_id];
  check(Boolean(entry), `audio backlog references unknown ID: ${item.audio_id}`);
  check(item.exercise_id === entry?.exerciseId, `audio backlog exercise mismatch: ${item.audio_id}`);
  check(item.arabic_text === entry?.text, `audio backlog Arabic text mismatch: ${item.audio_id}`);
  check(item.type === entry?.activityType, `audio backlog activity type mismatch: ${item.audio_id}`);
  check(item.expected_filename === entry?.expectedFilename, `audio backlog filename mismatch: ${item.audio_id}`);
  check(item.fallback_type === entry?.fallback, `audio backlog fallback mismatch: ${item.audio_id}`);
  check(['P0', 'P1', 'P2', 'P3'].includes(item.priority), `invalid audio backlog priority: ${item.audio_id}`);
}

for (const migration of curriculum.textMigrations) {
  check(allSourceIds.has(migration.exerciseId), `text migration references missing exercise: ${migration.exerciseId}`);
  check(
    !migration.legacyAudioAlias || Boolean(audioManifest.legacyTextSources[migration.from]),
    `legacy audio alias missing: ${migration.exerciseId}`,
  );
}

const lexicalIds = new Set<string>();
const lexicalEntries = new Set<string>();
const looseLexicalEntries = new Map<string, string[]>();
for (const item of [...glossary.words, ...glossary.expressions]) {
  check(!lexicalIds.has(item.id), `duplicate lexical ID: ${item.id}`);
  lexicalIds.add(item.id);
  const normalized = normalizeArabicStrict(item.arabic);
  check(!lexicalEntries.has(normalized), `duplicate glossary entry: ${item.arabic}`);
  lexicalEntries.add(normalized);
  const loose = normalizeArabicLoose(item.arabic);
  looseLexicalEntries.set(loose, [...(looseLexicalEntries.get(loose) ?? []), item.id]);
  check(Boolean(item.transliteration?.trim()), `glossary entry has no transliteration: ${item.id}`);
  check(Boolean(item.armenian?.trim()), `glossary entry has no Armenian meaning: ${item.id}`);
  if (item.id.startsWith('lex.')) {
    check(Boolean(item.partOfSpeech?.trim()), `word has no part of speech: ${item.id}`);
    check(Object.prototype.hasOwnProperty.call(item, 'relatedForm'), `word has no relatedForm field: ${item.id}`);
  }
  check(
    allSourceIds.has(item.source) || Object.prototype.hasOwnProperty.call(lessonsData, item.source),
    `glossary entry has invalid source: ${item.id} -> ${item.source}`,
  );
}

function validateGlossaryCoverage(): void {
  const requiredByClass = lexicalRequirements.required as Record<'LEXEME' | 'PHRASE', string[]>;
  const requiredIds = [...requiredByClass.LEXEME, ...requiredByClass.PHRASE];
  const uniqueRequired = new Set(requiredIds);
  check(uniqueRequired.size === requiredIds.length, 'duplicate lexical requirement ID');

  const missing = requiredIds.filter((id) => !lexicalIds.has(id));
  const extra = [...lexicalIds].filter((id) => !uniqueRequired.has(id));
  const present = requiredIds.length - missing.length;
  const coveragePercentage = requiredIds.length === 0
    ? 100
    : Number(((present / requiredIds.length) * 100).toFixed(2));

  const documentedContrasts = new Set(
    lexicalRequirements.intentionalDiacriticContrasts.map((ids: string[]) => [...ids].sort().join('|')),
  );
  for (const [normalized, ids] of looseLexicalEntries) {
    if (ids.length < 2) continue;
    check(
      documentedContrasts.has([...ids].sort().join('|')),
      `same Arabic entry differs only by unreviewed diacritics: ${normalized} (${ids.join(', ')})`,
    );
  }

  for (const [classification, values] of Object.entries(lexicalRequirements.excluded) as Array<[string, string[]]>) {
    for (const value of values) {
      check(
        !looseLexicalEntries.has(normalizeArabicLoose(value)),
        `${classification} item leaked into glossary: ${value}`,
      );
    }
  }

  const report = {
    release: curriculum.release,
    scope: lexicalRequirements.scope,
    totalRequired: requiredIds.length,
    requiredLexemes: requiredByClass.LEXEME.length,
    requiredPhrases: requiredByClass.PHRASE.length,
    totalPresent: present,
    missing,
    extra,
    duplicate: lexicalIds.size !== glossary.words.length + glossary.expressions.length,
    coveragePercentage,
  };
  fs.writeFileSync(
    path.join(reportsDir, 'v5-rc2-lexical-coverage.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  check(missing.length === 0, `glossary is missing ${missing.length} required Core/E01 entries`);
  check(coveragePercentage === 100, `glossary Core/E01 coverage is ${coveragePercentage}%`);
}

validateGlossaryCoverage();

const coreExam = curriculum.assessments.find((assessment: { id: string }) => assessment.id === 'X01');
const grammarExam = curriculum.assessments.find((assessment: { id: string }) => assessment.id === 'X02');
const coreTrack = curriculum.tracks.find((track: { id: string }) => track.id === 'core');
const grammarTrack = curriculum.tracks.find((track: { id: string }) => track.id === 'grammar');
check(Boolean(coreExam), 'X01 core exam is missing');
check(Boolean(grammarExam), 'X02 grammar exam is missing');
check(coreExam?.items.every((item: { conceptScope: string }) => item.conceptScope === 'core'), 'core exam depends on grammar-only concept');
check(Boolean(coreTrack), 'core track is missing');
check(Boolean(grammarTrack), 'grammar track is missing');
for (const item of coreExam?.items ?? []) {
  check(Array.isArray(item.sourceUnits) && item.sourceUnits.length > 0, `X01 item has no Core source evidence: ${item.id}`);
  for (const sourceUnit of item.sourceUnits ?? []) {
    check(coreTrack?.requiredUnits.includes(sourceUnit), `X01 item ${item.id} depends on non-Core unit ${sourceUnit}`);
    check(!grammarTrack?.requiredUnits.includes(sourceUnit), `X01 item ${item.id} depends on Grammar-only unit ${sourceUnit}`);
  }
}
check(grammarExam?.optionalForCore === true, 'grammar exam must be optional for Core A1');
check(coreExam?.completionIndependentOf?.includes('grammar'), 'X01 completion must be independent of grammar');

const languageQaCases = [
  {
    id: 'v5.c03.02',
    arabic: 'كَيْفَ حَالُكَ؟ — أَنَا بِخَيْرٍ، شُكْرًا.',
    transliteration: 'kayfa ḥāluka? — anā bikhayrin, shukran',
    armenian: 'Ինչպե՞ս ես (արական)։ — Լավ եմ, շնորհակալություն։',
  },
  {
    id: 'v5.c03.03',
    arabic: 'كَيْفَ حَالُكِ؟ — أَنَا بِخَيْرٍ، شُكْرًا.',
    transliteration: 'kayfa ḥāluki? — anā bikhayrin, shukran',
    armenian: 'Ինչպե՞ս ես (իգական)։ — Լավ եմ, շնորհակալություն։',
  },
  {
    id: 'v5.c03.04',
    arabic: 'هَلْ تَتَكَلَّمُ العَرَبِيَّةَ؟ / هَلْ تَتَكَلَّمِينَ العَرَبِيَّةَ؟',
    transliteration: 'hal tatakallamu l-ʿarabiyyata? / hal tatakallīna l-ʿarabiyyata?',
    armenian: 'Արաբերեն խոսո՞ւմ ես՝ արական / իգական',
  },
  {
    id: 'v5.c09.01',
    arabic: 'أَيَّ مَادَّةٍ تُحِبُّ؟ — أُحِبُّ الرِّيَاضِيَّاتِ.',
    transliteration: 'ayya māddatin tuḥibbu? — uḥibbu r-riyāḍiyyāti',
    armenian: 'Ո՞ր առարկան ես սիրում (արական)։ — Ես սիրում եմ մաթեմատիկան։',
  },
  {
    id: 'v5.c09.02',
    arabic: 'أَيَّ مَادَّةٍ تُحِبِّينَ؟ — أُحِبُّ الرِّيَاضِيَّاتِ.',
    transliteration: 'ayya māddatin tuḥibbīna? — uḥibbu r-riyāḍiyyāti',
    armenian: 'Ո՞ր առարկան ես սիրում (իգական)։ — Ես սիրում եմ մաթեմատիկան։',
  },
  {
    id: 'v5.e01.01',
    arabic: 'أَيْنَ تَشْعُرُ بِالأَلَمِ؟',
    transliteration: 'ayna tashʿuru bi-l-alami?',
    armenian: 'Որտե՞ղ ես ցավ զգում (արական)',
  },
  {
    id: 'v5.e01.02',
    arabic: 'أَيْنَ تَشْعُرِينَ بِالأَلَمِ؟',
    transliteration: 'ayna tashʿurīna bi-l-alami?',
    armenian: 'Որտե՞ղ ես ցավ զգում (իգական)',
  },
  {
    id: 'v5.e01.03',
    arabic: 'مَا الَّذِي يُؤْلِمُكَ؟ — رَأْسِي يُؤْلِمُنِي.',
    transliteration: 'mā lladhī yuʾlimuka? — raʾsī yuʾlimunī',
    armenian: 'Ի՞նչն է ցավում (արական)։ — Գլուխս ցավում է։',
  },
  {
    id: 'v5.e01.04',
    arabic: 'مَا الَّذِي يُؤْلِمُكِ؟ — عِنْدِي أَلَمٌ فِي ظَهْرِي.',
    transliteration: 'mā lladhī yuʾlimuki? — ʿindī alamun fī ẓahrī',
    armenian: 'Ի՞նչն է ցավում (իգական)։ — Մեջքս ցավում է։',
  },
  {
    id: 'v5.c11.01',
    arabic: 'اِذْهَبْ يَمِينًا.',
    transliteration: 'idhhab yamīnan',
    armenian: 'Գնա աջ (արական)',
  },
  {
    id: 'v5.c11.02',
    arabic: 'اِذْهَبِي يَمِينًا.',
    transliteration: 'idhhabī yamīnan',
    armenian: 'Գնա աջ (իգական)',
  },
];
const languageActivities = new Map(
  curriculum.newActivities.map((activity: { id: string }) => [activity.id, activity]),
);
for (const expected of languageQaCases) {
  const actual = languageActivities.get(expected.id) as {
    arabic?: string;
    transliteration?: string;
    armenian?: string;
  } | undefined;
  check(Boolean(actual), `Arabic QA activity is missing: ${expected.id}`);
  check(actual?.arabic === expected.arabic, `Arabic QA text mismatch: ${expected.id}`);
  check(actual?.transliteration === expected.transliteration, `transliteration QA mismatch: ${expected.id}`);
  check(actual?.armenian === expected.armenian, `Armenian QA mismatch: ${expected.id}`);
}

const rewardIds = new Set<string>();
for (const lesson of Object.values(lessonsData)) {
  check(!rewardIds.has(lesson.id), `duplicate XP reward identity: ${lesson.id}`);
  rewardIds.add(lesson.id);
  check(Number.isFinite(lesson.xpReward) && lesson.xpReward > 0, `invalid XP reward: ${lesson.id}`);
}

if (errors.length) {
  console.error(`V5 validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `V5 validation passed: ${allExerciseIds.size} exercises, ` +
  `${Object.keys(audioManifest.entries).length} audio mappings, ` +
  `${lexicalIds.size} glossary entries, 100% Core/E01 lexical coverage.`,
);
