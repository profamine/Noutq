import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { migrateV4Snapshot, parseLessonProgress, type V4Snapshot } from './v5Migration';

interface MigrationFixture extends V4Snapshot {
  name: string;
  lessonProgress: string | null;
  stepCount: number;
}

const fixtureDir = path.resolve(process.cwd(), 'src', 'services', '__fixtures__');
const fixtures = fs.readdirSync(fixtureDir)
  .filter((name) => name.startsWith('v4-case-') && name.endsWith('.json'))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(fixtureDir, name), 'utf8')) as MigrationFixture);

describe('V4 → V5 migration stress fixtures', () => {
  it('loads all six required migration cases', () => {
    expect(fixtures).toHaveLength(6);
  });

  it.each(fixtures)('$name preserves completion and XP without crashing', (fixture) => {
    const migrated = migrateV4Snapshot(fixture);
    expect(migrated.completedUnits).toBe(fixture.completedUnits);
    expect(migrated.totalXP).toBe(fixture.totalXP);
  });

  it('resumes CASE C at the exact valid u7 step and rejects CASE F', () => {
    const caseC = fixtures.find((fixture) => fixture.name.startsWith('CASE C'))!;
    const caseF = fixtures.find((fixture) => fixture.name.startsWith('CASE F'))!;
    expect(parseLessonProgress(caseC.lessonProgress!, caseC.stepCount)).toEqual({ stepIndex: 5, lives: 2 });
    expect(parseLessonProgress(caseF.lessonProgress!, caseF.stepCount)).toBeNull();
  });

  it('moves all corrected CASE E cards without orphan or duplicate legacy keys', () => {
    const caseE = fixtures.find((fixture) => fixture.name.startsWith('CASE E'))!;
    const migrated = migrateV4Snapshot(caseE);
    const state = JSON.parse(migrated.srsState ?? '{}');
    expect(Object.keys(state)).toHaveLength(3);
    expect(state['أَيْنَ تُؤْلِمُك؟']).toBeUndefined();
    expect(state['أَيُّ مَادَّةٍ تُحِبّ؟']).toBeUndefined();
    expect(state["كَيْفَ تَقُولُ 'ես հայ եմ' بِالعَرَبِيَّة؟"]).toBeUndefined();
    expect(state['أَيْنَ تَشْعُرُ بِالأَلَمِ؟']).toBeDefined();
    expect(state['أَيَّ مَادَّةٍ تُحِبُّ؟']).toBeDefined();
    expect(state['كَيْفَ تَقُولُ: «أَنَا أَرْمَنِيٌّ / أَرْمَنِيَّةٌ»؟']).toBeDefined();
  });
});
