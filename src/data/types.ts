export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface MatchPair {
  arabic: string;
  armenian: string;
}

export interface LessonStep {
  id: number;
  type: "listen" | "speak" | "quiz" | "match" | "write";
  arabic: string;
  armenian: string;
  transliteration: string;
  hint?: string;
  hintIcon?: string;
  highlightIndex?: number;
  highlightChar?: string;
  audio?: string;
  options?: QuizOption[];
  pairs?: MatchPair[];
  meaning?: string;
}

export interface LessonData {
  id: string;
  title: string;
  titleAr: string;
  steps: LessonStep[];
  xpReward: number;
}

export const pair = (arabic: string, armenian: string): MatchPair => ({
  arabic,
  armenian,
});
