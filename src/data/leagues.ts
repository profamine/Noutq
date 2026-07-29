export interface LeagueTier {
  id: string;
  min: number;
  labelKey: string;
  badgeClass: string;
}

export const LEAGUE_TIERS: LeagueTier[] = [
  { id: 'bronze', min: 0, labelKey: 'profile.league.bronze', badgeClass: 'bg-amber-50 border-amber-200 text-amber-700' },
  { id: 'silver', min: 500, labelKey: 'profile.league.silver', badgeClass: 'bg-slate-100 border-slate-300 text-slate-600' },
  { id: 'gold', min: 1500, labelKey: 'profile.league.gold', badgeClass: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
  { id: 'diamond', min: 4000, labelKey: 'profile.league.diamond', badgeClass: 'bg-cyan-50 border-cyan-300 text-cyan-700' },
  { id: 'master', min: 8000, labelKey: 'profile.league.master', badgeClass: 'bg-purple-50 border-purple-300 text-purple-700' },
];

export interface LeagueStatus {
  tier: LeagueTier;
  next: LeagueTier | null;
  xpToNext: number;
  progressPercent: number;
}

/** Détermine la ligue actuelle d'un apprenant à partir de son XP total. */
export function getLeagueStatus(totalXP: number): LeagueStatus {
  let tier = LEAGUE_TIERS[0];
  for (const t of LEAGUE_TIERS) {
    if (totalXP >= t.min) tier = t;
  }
  const idx = LEAGUE_TIERS.indexOf(tier);
  const next = LEAGUE_TIERS[idx + 1] ?? null;

  if (!next) return { tier, next: null, xpToNext: 0, progressPercent: 100 };

  const span = next.min - tier.min;
  const progress = totalXP - tier.min;
  return {
    tier,
    next,
    xpToNext: next.min - totalXP,
    progressPercent: Math.max(0, Math.min(100, Math.round((progress / span) * 100))),
  };
}
