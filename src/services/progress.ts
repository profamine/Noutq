export interface CompletionState {
  completedUnits: string[];
  totalXP: number;
}

export interface CompletionResult extends CompletionState {
  changed: boolean;
}

export function completeLessonOnce(
  state: CompletionState,
  lessonId: string,
  xpReward: number,
): CompletionResult {
  if (state.completedUnits.includes(lessonId)) {
    return { ...state, completedUnits: [...state.completedUnits], changed: false };
  }
  if (!Number.isFinite(xpReward) || xpReward < 0) {
    throw new Error('INVALID_XP_REWARD');
  }
  return {
    completedUnits: [...state.completedUnits, lessonId],
    totalXP: state.totalXP + xpReward,
    changed: true,
  };
}
