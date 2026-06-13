import React, { useState } from 'react';
import { BookOpen, Headphones, PenTool, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import VocabularyPractice from '../components/VocabularyPractice';

export default function PracticeScreen() {
  const { t } = useLanguage();
  const [activeMode, setActiveMode] = useState<'vocab' | null>(null);

  if (activeMode === 'vocab') {
    return <VocabularyPractice onBack={() => setActiveMode(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-24 md:pb-6 w-full">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-6 pt-12 pb-8 md:rounded-b-3xl text-white shadow-md w-full">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">تدريب</h1>
          <p className="text-blue-100 mb-4 opacity-90">
            Վարժություններ (Practice)
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">

        <button
          onClick={() => setActiveMode('vocab')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 text-lg">Բառապաշար</h3>
              <p className="text-sm text-gray-500">Flashcards (Քարտեր)</p>
            </div>
          </div>
          <CheckCircle2 className="text-emerald-500" />
        </button>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow opacity-70 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
              <Headphones size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 text-lg">Լսողություն</h3>
              <p className="text-sm text-gray-500">استماع (Շուտով)</p>
            </div>
          </div>
          <CheckCircle2 className="text-gray-300" />
        </button>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow opacity-70 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <PenTool size={24} />
            </div>
            <div className="text-right">
              <h3 className="font-bold text-gray-800 text-lg">Քերականություն</h3>
              <p className="text-sm text-gray-500">قواعد (Շուտով)</p>
            </div>
          </div>
          <CheckCircle2 className="text-gray-300" />
        </button>

      </div>
    </div>
  );
}
