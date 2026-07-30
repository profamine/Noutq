import { describe, it, expect } from 'vitest';
import { findStepByAudioId, lessonsData } from './lessons';

describe('findStepByAudioId (résolution du deep link /a/{audioId})', () => {
  it('resolves a legacy V4 audio_id to its real position', () => {
    const result = findStepByAudioId('u7.1');
    expect(result).not.toBeNull();
    expect(result!.lessonId).toBe('u7');
    expect(lessonsData.u7.steps[result!.stepIndex].arabic).toBe('مَرْحَبًا');
  });

  it('preserves u8.71 as a real, distinct legacy ID (repetition step)', () => {
    const result = findStepByAudioId('u8.71');
    expect(result).not.toBeNull();
    expect(result!.lessonId).toBe('u8');
  });

  it('resolves a V5 audio_id injected into its legacy host unit', () => {
    const result = findStepByAudioId('v5.c05.01');
    expect(result).not.toBeNull();
    expect(lessonsData[result!.lessonId].steps[result!.stepIndex].audio).toBe('v5.c05.01');
  });

  it('returns null for an unknown audio_id instead of guessing', () => {
    expect(findStepByAudioId('u999.1')).toBeNull();
    expect(findStepByAudioId('v5.zz.99')).toBeNull();
  });

  it('never invents a lessonId for a legacy-style but nonexistent ID', () => {
    expect(findStepByAudioId('u7.999')).toBeNull();
  });
});
