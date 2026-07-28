import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Lightbulb } from 'lucide-react';
import { lessonsData } from '../data/lessons';
import type { LessonStep, QuizOption } from '../data/lessons';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  onBack: () => void;
}

interface GrammarQuestion {
  meaning: string;       // question en arménien (step.meaning)
  arabic: string;        // mot ou phrase arabe
  options: QuizOption[];
  hint?: string;
}

const QUESTION_COUNT = 8;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestions(): GrammarQuestion[] {
  const pool: GrammarQuestion[] = [];
  Object.values(lessonsData).forEach(lesson => {
    lesson.steps.forEach((step: LessonStep) => {
      if (
        step.type === 'quiz' &&
        step.options &&
        step.options.length >= 2 &&
        step.meaning
      ) {
        pool.push({
          meaning: step.meaning,
          arabic: step.arabic,
          options: step.options,
          hint: step.hint,
        });
      }
    });
  });
  return shuffle(pool).slice(0, QUESTION_COUNT);
}

export default function GrammarPractice({ onBack }: Props) {
  const { language } = useLanguage();
  const questions = useMemo(() => buildQuestions(), []);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (q.options[idx].correct) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowHint(false);
    } else {
      setDone(true);
    }
  };

  const handleReplay = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setShowHint(false);
  };

  // ── Écran score final ──────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50 z-20">
        <div className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm">
          <button
            onClick={onBack}
            aria-label={language === 'ar' ? 'العودة' : 'Վերադառնալ'}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="flex-1 text-center text-lg font-bold text-gray-800">Քերականություն / قواعد</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
            {pct}%
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{score}/{questions.length} ճիշտ</h3>
            <p className="text-gray-500 text-sm">{pct >= 70 ? '🌟 Հիանալի արդյունք!' : '💪 Կրկնի՛ր քերականությունը'}</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={handleReplay}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Կրկին խաղալ / إعادة
            </button>
            <button onClick={onBack} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold">
              Վերադառնալ / العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50 z-20 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm">
        <button
          onClick={onBack}
          aria-label={language === 'ar' ? 'العودة' : 'Վերադառնալ'}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold text-gray-800">Քերականություն / قواعد</h2>
          <p className="text-xs text-gray-500">{current + 1} / {questions.length}</p>
        </div>
        <div className="w-10 text-right text-sm font-bold text-orange-600">{score} ✓</div>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 bg-gray-200">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col p-5 gap-5">
        {/* Question */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
          <p className="text-base font-semibold text-gray-700 text-center">{q.meaning}</p>
          <div className="bg-orange-50 rounded-xl px-4 py-3 text-center">
            <span className="text-3xl font-bold text-gray-900" dir="rtl">{q.arabic}</span>
          </div>
        </div>

        {/* Indice */}
        {q.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 text-sm text-amber-600 mx-auto"
          >
            <Lightbulb size={15} />
            {showHint ? 'Թաքցնել / إخفاء' : 'Ակնարկ / تلميح'}
          </button>
        )}
        {showHint && q.hint && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-center">
            {q.hint}
          </div>
        )}

        {/* Options */}
        <div className="flex flex-col gap-3">
          {q.options.map((opt, idx) => {
            let cls = 'bg-white border-2 border-gray-200 text-gray-800';
            if (selected !== null) {
              if (opt.correct) cls = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800';
              else if (idx === selected) cls = 'bg-red-50 border-2 border-red-400 text-red-700';
              else cls = 'bg-white border-2 border-gray-100 text-gray-400';
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className={`w-full py-4 px-5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] shadow-sm flex items-center justify-between ${cls}`}
              >
                <span>{opt.text}</span>
                {selected !== null && opt.correct && <CheckCircle size={18} className="text-emerald-600 shrink-0" />}
                {selected !== null && idx === selected && !opt.correct && <XCircle size={18} className="text-red-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Bouton suivant */}
        {selected !== null && (
          <button
            onClick={handleNext}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-bold mt-2"
          >
            {current < questions.length - 1 ? 'Հաջորդ / التالي →' : 'Ավարտ / انتهى ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
