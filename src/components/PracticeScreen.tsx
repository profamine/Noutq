import React, { useState, useMemo } from 'react';
import { BookOpen, Headphones, PenTool, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import VocabularyPractice from '../components/VocabularyPractice';
import ListeningPractice from '../components/ListeningPractice';
import GrammarPractice from '../components/GrammarPractice';
import { lessonsData } from '../data/lessons';

type ActiveMode = 'vocab' | 'listening' | 'grammar' | null;

// Compter les questions disponibles pour chaque mode
function countListeningWords(): number {
  let count = 0;
  Object.values(lessonsData).forEach(lesson => {
    lesson.steps.forEach(step => {
      if (step.type === 'listen' && step.arabic && step.arabic.length < 30) count++;
    });
  });
  return count;
}

function countGrammarQuestions(): number {
  let count = 0;
  Object.values(lessonsData).forEach(lesson => {
    lesson.steps.forEach(step => {
      if (step.type === 'quiz' && step.options && step.options.length >= 2 && step.meaning) count++;
    });
  });
  return count;
}

export default function PracticeScreen() {
  const { t } = useLanguage();
  const [activeMode, setActiveMode] = useState<ActiveMode>(null);

  // Calculé une seule fois au montage
  const listeningCount = useMemo(() => countListeningWords(), []);
  const grammarCount = useMemo(() => countGrammarQuestions(), []);

  if (activeMode === 'vocab')     return <VocabularyPractice onBack={() => setActiveMode(null)} />;
  if (activeMode === 'listening') return <ListeningPractice  onBack={() => setActiveMode(null)} />;
  if (activeMode === 'grammar')   return <GrammarPractice    onBack={() => setActiveMode(null)} />;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-24 md:pb-6 w-full">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-6 pt-12 pb-8 md:rounded-b-3xl text-white shadow-md w-full">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">تدريب</h1>
          <p className="text-blue-100 mb-4 opacity-90">Վարժություններ (Practice)</p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* Vocabulaire — déjà actif */}
        <button
          onClick={() => setActiveMode('vocab')}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Բառապաշար</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Flashcards (Քարտեր)</p>
            </div>
          </div>
          <CheckCircle2 className="text-emerald-500" />
        </button>

        {/* Écoute — maintenant actif */}
        <button
          onClick={() => setActiveMode('listening')}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Headphones size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Լսողություն</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">استماع — {listeningCount} բառ</p>
            </div>
          </div>
          <CheckCircle2 className="text-purple-500" />
        </button>

        {/* Grammaire — maintenant actif */}
        <button
          onClick={() => setActiveMode('grammar')}
          className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <PenTool size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Քերականություն</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">قواعد — {grammarCount} հարց</p>
            </div>
          </div>
          <CheckCircle2 className="text-orange-500" />
        </button>

      </div>
    </div>
  );
}
