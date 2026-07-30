import { describe, expect, it } from 'vitest';
import { curriculumV5, getV5TrackStatus, LEGACY_UNIT_IDS } from './curriculum';
import { lessonsData } from '../lessons';

describe('V5 curriculum overlay', () => {
  it('keeps the complete u1…u22 legacy registry', () => {
    expect(LEGACY_UNIT_IDS).toEqual(Array.from({ length: 22 }, (_, index) => `u${index + 1}`));
    expect(Object.keys(lessonsData)).toEqual(LEGACY_UNIT_IDS);
  });

  it('reports Core and Grammar completion independently', () => {
    const allLegacy = [...LEGACY_UNIT_IDS];
    expect(getV5TrackStatus(allLegacy, 'core').completed).toBe(true);
    expect(getV5TrackStatus(allLegacy, 'grammar').completed).toBe(true);

    const coreOnly = allLegacy.filter((id) => !['u3', 'u4', 'u6', 'u9', 'u21', 'u22'].includes(id));
    expect(getV5TrackStatus(coreOnly, 'core').completed).toBe(true);
    expect(getV5TrackStatus(coreOnly, 'grammar').completed).toBe(false);
  });

  it('preserves the real legacy exercise u8.71', () => {
    expect(lessonsData.u8.steps.some((step) => step.id === 71)).toBe(true);
  });

  it('proves every X01 item from Core sources and keeps X02 optional', () => {
    const core = curriculumV5.tracks.find((track) => track.id === 'core')!;
    const grammar = curriculumV5.tracks.find((track) => track.id === 'grammar')!;
    const x01 = curriculumV5.assessments.find((assessment) => assessment.id === 'X01') as {
      items: Array<{ conceptScope: string; sourceUnits: string[] }>;
    };
    const x02 = curriculumV5.assessments.find((assessment) => assessment.id === 'X02')!;

    for (const item of x01.items) {
      expect(item.conceptScope).toBe('core');
      expect(item.sourceUnits.length).toBeGreaterThan(0);
      expect(item.sourceUnits.every((id) => core.requiredUnits.includes(id))).toBe(true);
      expect(item.sourceUnits.every((id) => !grammar.requiredUnits.includes(id))).toBe(true);
    }
    expect(x02.optionalForCore).toBe(true);
  });
});
