/**
 * Répétition espacée (SM-2 simplifié) pour le vocabulaire.
 * Une carte "due" doit être révisée aujourd'hui ; les cartes ratées reviennent le jour même.
 */

export interface CardState {
  interval: number;      // jours avant la prochaine révision
  easeFactor: number;    // facilité (>= 1.3)
  repetitions: number;    // répétitions correctes consécutives
  dueDate: string;        // ISO yyyy-mm-dd
}

export type SrsStateMap = Record<string, CardState>;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isDue(state: CardState | undefined): boolean {
  if (!state) return true; // jamais révisée → prioritaire
  return state.dueDate <= todayISO();
}

/**
 * Met à jour l'état d'une carte après une révision.
 * `known = false` réinitialise l'intervalle (revoir aujourd'hui même).
 * `known = true` augmente l'intervalle selon SM-2 simplifié.
 */
export function reviewCard(prev: CardState | undefined, known: boolean): CardState {
  const easeFactor = prev?.easeFactor ?? 2.5;

  if (!known) {
    return { interval: 0, easeFactor: Math.max(1.3, easeFactor - 0.2), repetitions: 0, dueDate: todayISO() };
  }

  const repetitions = (prev?.repetitions ?? 0) + 1;
  const nextEase = Math.min(2.8, easeFactor + 0.1);
  let interval: number;
  if (repetitions === 1) interval = 1;
  else if (repetitions === 2) interval = 3;
  else interval = Math.round((prev?.interval ?? 1) * nextEase);

  return { interval, easeFactor: nextEase, repetitions, dueDate: addDays(interval) };
}

/** Nombre de cartes dues aujourd'hui parmi une liste de mots. */
export function countDue(words: string[], state: SrsStateMap): number {
  return words.reduce((n, w) => n + (isDue(state[w]) ? 1 : 0), 0);
}

/**
 * Trie une liste de mots par priorité de révision : jamais vues et en retard
 * d'abord, puis mélange léger pour éviter un ordre toujours identique.
 */
export function sortByPriority<T>(items: T[], getKey: (item: T) => string, state: SrsStateMap): T[] {
  const withPriority = items.map((item) => {
    const key = getKey(item);
    const cardState = state[key];
    const due = isDue(cardState);
    const dueDate = cardState?.dueDate ?? '0000-00-00'; // jamais vue = priorité maximale
    return { item, due, dueDate, jitter: Math.random() };
  });

  withPriority.sort((a, b) => {
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
    return a.jitter - b.jitter;
  });

  return withPriority.map((w) => w.item);
}
