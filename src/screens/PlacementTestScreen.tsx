import React, { useMemo, useState } from 'react';
import { GraduationCap, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { lessonsData } from '../data/lessons';
import type { LessonStep } from '../data/types';

interface PlacementQuestion {
  unit: string;
  step: LessonStep;
}

// Unités réparties sur toute la progression, du plus simple au plus avancé.
const CANDIDATE_UNITS = ['u1', 'u3', 'u5', 'u8', 'u11', 'u14', 'u17', 'u20'];

function pickPlacementQuestions(): PlacementQuestion[] {
  const questions: PlacementQuestion[] = [];
  for (const unit of CANDIDATE_UNITS) {
    const lesson = lessonsData[unit];
    if (!lesson) continue;
    const step = lesson.steps.find((s) => s.type === 'quiz' && s.options && s.options.length >= 2);
    if (step) questions.push({ unit, step });
  }
  return questions;
}

/**
 * Recommande une unité de départ : la première unité suivant la dernière
 * réponse correcte, en s'arrêtant à la première erreur (les questions sont
 * ordonnées par difficulté croissante, donc un échec signale une vraie lacune).
 */
function recommendStartUnit(results: { unit: string; correct: boolean }[]): string {
  const allUnitIds = Object.keys(lessonsData);
  let lastCorrectIdx = -1;
  for (const r of results) {
    if (!r.correct) break;
    const idx = allUnitIds.indexOf(r.unit);
    if (idx > lastCorrectIdx) lastCorrectIdx = idx;
  }
  const recommendedIdx = Math.min(lastCorrectIdx + 1, allUnitIds.length - 1);
  return allUnitIds[Math.max(0, recommendedIdx)];
}

export default function PlacementTestScreen({
  onDone,
}: {
  onDone: (recommendedUnitId: string | null) => void;
}) {
  const { t, language } = useLanguage();
  const questions = useMemo(() => pickPlacementQuestions(), []);

  const [phase, setPhase] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<{ unit: string; correct: boolean }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const current = questions[index];

  const handleAnswer = (optionIndex: number) => {
    if (selected !== null || !current) return;
    setSelected(optionIndex);
    const correct = current.step.options?.[optionIndex]?.correct === true;
    const nextResults = [...results, { unit: current.unit, correct }];
    setResults(nextResults);

    setTimeout(() => {
      setSelected(null);
      if (index < questions.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setPhase('result');
      }
    }, 700);
  };

  const recommendedUnit = phase === 'result' ? recommendStartUnit(results) : null;
  const correctCount = results.filter((r) => r.correct).length;
  const isBeginnerLevel = recommendedUnit === Object.keys(lessonsData)[0];

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-950 z-30 items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-950/50 rounded-full flex items-center justify-center mb-6">
          <GraduationCap size={36} className="text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-3">{t('placement.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-8">{t('placement.intro')}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setPhase('quiz')}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors"
          >
            {t('placement.start')}
          </button>
          <button
            onClick={() => onDone(null)}
            className="w-full py-3 text-gray-500 dark:text-gray-400 text-sm font-semibold"
          >
            {t('placement.skip')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && current) {
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-950 z-30 p-6">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-8 mt-4">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mb-2">
            {t('placement.question_progress')} {index + 1}/{questions.length}
          </p>
          <p className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2" dir="rtl">
            {current.step.arabic}
          </p>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">{current.step.meaning}</p>

          <div className="space-y-3">
            {current.step.options?.map((opt, i) => {
              const isSelected = selected === i;
              const showCorrect = selected !== null && opt.correct;
              const showWrong = isSelected && !opt.correct;
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                  dir="rtl"
                  className={`w-full py-4 px-4 rounded-2xl border-2 text-lg font-semibold text-right transition-colors flex items-center justify-between ${
                    showCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : showWrong
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-400'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100'
                  }`}
                >
                  <span>{opt.text}</span>
                  {showCorrect && <CheckCircle size={20} />}
                  {showWrong && <XCircle size={20} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 dark:bg-gray-950 z-30 items-center justify-center p-6 text-center">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white mb-6 ${
        correctCount >= questions.length * 0.6 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'
      }`}>
        {correctCount}/{questions.length}
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('placement.result_title')}</h2>
      {isBeginnerLevel ? (
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">{t('placement.beginner')}</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
          {t('placement.recommend')}{' '}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {lessonsData[recommendedUnit!]?.title}
          </span>
        </p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => onDone(recommendedUnit)}
          className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          {isBeginnerLevel ? t('placement.continue_normal') : t('placement.go_to_lesson')}
          <ArrowRight size={18} className={language === 'ar' ? 'rotate-180' : ''} />
        </button>
      </div>
    </div>
  );
}
