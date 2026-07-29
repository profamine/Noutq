export type AchievementMetric = 'lessonsCompleted' | 'streak' | 'totalXP';

export interface AchievementDef {
  id: string;
  metric: AchievementMetric;
  threshold: number;
  xp: number;
  titleKey: string;
  descKey: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_lesson', metric: 'lessonsCompleted', threshold: 1, xp: 50, titleKey: 'profile.ach1.title', descKey: 'profile.ach1.desc' },
  { id: 'streak_7', metric: 'streak', threshold: 7, xp: 100, titleKey: 'profile.ach2.title', descKey: 'profile.ach2.desc' },
  { id: 'lessons_10', metric: 'lessonsCompleted', threshold: 10, xp: 200, titleKey: 'profile.ach3.title', descKey: 'profile.ach3.desc' },
  { id: 'lessons_all', metric: 'lessonsCompleted', threshold: 22, xp: 500, titleKey: 'profile.ach4.title', descKey: 'profile.ach4.desc' },
  { id: 'lessons_5', metric: 'lessonsCompleted', threshold: 5, xp: 75, titleKey: 'profile.ach5.title', descKey: 'profile.ach5.desc' },
  { id: 'xp_500', metric: 'totalXP', threshold: 500, xp: 100, titleKey: 'profile.ach6.title', descKey: 'profile.ach6.desc' },
  { id: 'streak_30', metric: 'streak', threshold: 30, xp: 300, titleKey: 'profile.ach7.title', descKey: 'profile.ach7.desc' },
  { id: 'xp_2000', metric: 'totalXP', threshold: 2000, xp: 250, titleKey: 'profile.ach8.title', descKey: 'profile.ach8.desc' },
  { id: 'streak_100', metric: 'streak', threshold: 100, xp: 1000, titleKey: 'profile.ach9.title', descKey: 'profile.ach9.desc' },
];

export interface AchievementProgress {
  def: AchievementDef;
  completed: boolean;
  progressPercent: number;
}

function metricValue(metric: AchievementMetric, ctx: { lessonsCompleted: number; streak: number; totalXP: number }): number {
  return ctx[metric];
}

export function computeAchievements(ctx: { lessonsCompleted: number; streak: number; totalXP: number }): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const value = metricValue(def.metric, ctx);
    const completed = value >= def.threshold;
    const progressPercent = Math.max(0, Math.min(100, Math.round((value / def.threshold) * 100)));
    return { def, completed, progressPercent };
  });
}
