import React, { useState, useMemo } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { lessonsData } from '../data/lessons';

interface VocabularyPracticeProps {
  onBack: () => void;
}

export default function VocabularyPractice({ onBack }: VocabularyPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const allVocab = useMemo(() => {
    const vocabList: { arabic: string; armenian: string; transliteration: string }[] = [];
    Object.values(lessonsData).forEach((lesson) => {
      lesson.steps.forEach((step) => {
        if (step.type === 'listen' && step.arabic && step.armenian && step.arabic.length < 50) {
          vocabList.push({
            arabic: step.arabic,
            armenian: step.armenian,
            transliteration: step.transliteration || '',
          });
        }
      });
    });
    return vocabList.sort(() => Math.random() - 0.5);
  }, []);

  const currentWord = allVocab[currentIndex];

  const nextWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % allVocab.length);
    }, 150);
  };

  const prevWord = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + allVocab.length) % allVocab.length);
    }, 150);
  };

  if (!currentWord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p>No vocabulary available.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full w-full absolute inset-0 z-10 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold text-gray-800">Բառապաշար (مراجعة)</h2>
          <p className="text-xs text-gray-500">{currentIndex + 1} / {allVocab.length}</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className="relative w-full max-w-sm aspect-[4/3] perspective-1000 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* Front — Arabic */}
            <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
              <span className="text-5xl font-bold text-gray-800 leading-tight text-center" dir="rtl">
                {currentWord.arabic}
              </span>
              <p className="text-sm text-gray-400 mt-8">Սեղմեք քարտը՝ շրջելու համար / انقر للقلب</p>
            </div>

            {/* Back — Armenian & Transliteration */}
            <div className="absolute w-full h-full backface-hidden bg-blue-50 rounded-3xl shadow-lg border border-blue-100 flex flex-col items-center justify-center p-8 rotate-y-180">
              <span className="text-3xl font-bold text-blue-900 text-center mb-4">
                {currentWord.armenian}
              </span>
              {currentWord.transliteration && (
                <span className="text-lg text-blue-700 bg-white px-4 py-2 rounded-full shadow-sm">
                  {currentWord.transliteration}
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mt-12 w-full max-w-sm">
          <button
            onClick={prevWord}
            className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-xl font-bold"
          >
            ←
          </button>

          <button
            className="w-16 h-16 rounded-full bg-blue-500 shadow-md flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(currentWord.arabic);
                utterance.lang = 'ar-SA';
                window.speechSynthesis.speak(utterance);
              }
            }}
          >
            <Volume2 size={28} />
          </button>

          <button
            onClick={nextWord}
            className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-xl font-bold"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
