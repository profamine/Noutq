import { describe, expect, it } from 'vitest';
import { completeLessonOnce } from './progress';

describe('legacy completion and XP compatibility', () => {
  it('awards XP once for a newly completed legacy lesson', () => {
    expect(completeLessonOnce({ completedUnits: ['u1'], totalXP: 50 }, 'u2', 60)).toEqual({
      completedUnits: ['u1', 'u2'],
      totalXP: 110,
      changed: true,
    });
  });

  it('does not grant duplicate XP for an already completed lesson', () => {
    expect(completeLessonOnce({ completedUnits: ['u1', 'u2'], totalXP: 110 }, 'u2', 60)).toEqual({
      completedUnits: ['u1', 'u2'],
      totalXP: 110,
      changed: false,
    });
  });

  it('rejects invalid XP rewards', () => {
    expect(() => completeLessonOnce({ completedUnits: [], totalXP: 0 }, 'u1', -1)).toThrow('INVALID_XP_REWARD');
  });
});
