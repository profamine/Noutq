import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowLeft, Volume2, RotateCcw, BarChart2 } from 'lucide-react';
import { lessonsData } from '../data/lessons';
import { useArabicTTS } from '../hooks/useArabicTTS';
import { storageGet, storageSet } from '../services/storage';

interface VocabularyPracticeProps {
  onBack: () => void;
}

type Mode = 'train' | 'test';

interface VocabItem {
  arabic: string;
  armenian: string;
  transliteration: string;
  unit: string; // 'u1', 'u2', …
}

const ALL_UNIT = 'all';

// ── Extraire tout le vocabulaire par unité ────────────────────────────────────
function buildAllVocab(): VocabItem[] {
  const list: VocabItem[] = [];
  Object.entries(lessonsData).forEach(([unit, lesson]) => {
    lesson.steps.forEach(step => {
      if (step.type === 'listen' && step.arabic && step.armenian && step.arabic.length < 50) {
        list.push({
          arabic: step.arabic,
          armenian: step.armenian,
          transliteration: step.transliteration || '',
          unit,
        });
      }
    });
  });
  return list;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function VocabularyPractice({ onBack }: VocabularyPracticeProps) {
  // ── Données ──────────────────────────────────────────────────────────────
  const allVocab = useMemo(() => buildAllVocab(), []);
  const units = useMemo(() => [ALL_UNIT, ...Object.keys(lessonsData)], []);

  // ── États ─────────────────────────────────────────────────────────────────
  const [selectedUnit, setSelectedUnit] = useState<string>(ALL_UNIT);
  const [mode, setMode] = useState<Mode>('train');
  const [vocabScores, setVocabScores] = useState<Record<string, number>>({});
  // Pile courante mélangée
  const [pile, setPile] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  // Mode test
  const [testResult, setTestResult] = useState<{ known: number; unknown: number } | null>(null);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);

  const { speak } = useArabicTTS();

  // ── Chargement des scores persistés ───────────────────────────────────────
  useEffect(() => {
    storageGet('vocabScores').then(raw => {
      if (raw) {
        try { setVocabScores(JSON.parse(raw)); } catch { /* noop */ }
      }
    });
  }, []);

  // ── Reconstruire la pile quand l'unité ou le mode change ──────────────────
  const filtered = useMemo(() =>
    selectedUnit === ALL_UNIT
      ? allVocab
      : allVocab.filter(v => v.unit === selectedUnit),
  [allVocab, selectedUnit]);

  const resetPile = useCallback(() => {
    setPile(shuffle(filtered));
    setCurrentIndex(0);
    setIsFlipped(false);
    setTestResult(null);
    setKnownCount(0);
    setUnknownCount(0);
  }, [filtered]);

  useEffect(() => { resetPile(); }, [resetPile]);

  const currentWord = pile[currentIndex];

  // ── Navigation entraînement ────────────────────────────────────────────────
  const nextWord = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev + 1) % pile.length), 150);
  };

  const prevWord = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev - 1 + pile.length) % pile.length), 150);
  };

  // ── Mode test — Je sais / Je ne sais pas ──────────────────────────────────
  const handleKnown = async (known: boolean) => {
    const newKnown = knownCount + (known ? 1 : 0);
    const newUnknown = unknownCount + (known ? 0 : 1);

    if (currentIndex < pile.length - 1) {
      setCurrentIndex(c => c + 1);
      setIsFlipped(false);
      setKnownCount(newKnown);
      setUnknownCount(newUnknown);
    } else {
      // Fin du paquet — calculer et persister le score
      const total = pile.length;
      const pct = Math.round((newKnown / total) * 100);
      const key = selectedUnit;
      const updated = { ...vocabScores, [key]: pct };
      setVocabScores(updated);
      await storageSet('vocabScores', JSON.stringify(updated));
      setTestResult({ known: newKnown, unknown: newUnknown });
    }
  };

  // ── Écran vide ─────────────────────────────────────────────────────────────
  if (!currentWord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <p className="text-gray-500 text-center mb-4">Այս բաժնում բառեր չկան / لا توجد كلمات في هذه الوحدة</p>
        <button onClick={onBack} className="px-4 py-2 bg-blue-500 text-white rounded-xl">Վերադառնալ</button>
      </div>
    );
  }

  // ── Écran résultat test ────────────────────────────────────────────────────
  if (mode === 'test' && testResult) {
    const pct = Math.round((testResult.known / pile.length) * 100);
    return (
      <div className="flex-1 flex flex-col bg-gray-50 h-full w-full absolute inset-0 z-10">
        <div className="bg-white px-4 pt-6 pb-4 flex items-center shadow-sm">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <h2 className="flex-1 text-center text-lg font-bold text-gray-800">Արդյունք / النتيجة</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black text-white ${pct >= 70 ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
            {pct}%
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              ✅ {testResult.known}  ❌ {testResult.unknown}
            </h3>
            <p className="text-gray-500 text-sm">{pct >= 70 ? '🌟 Հիանալի!' : '💪 Շարունակի՛ր'}</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button onClick={resetPile} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
              <RotateCcw size={18} /> Կրկին / مرة أخرى
            </button>
            <button onClick={onBack} className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold">
              Վերադառնալ / العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Interface principale ───────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full w-full absolute inset-0 z-10 overflow-hidden">

      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-3 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-gray-800">Բառապաշար (مراجعة)</h2>
            {/* Indicateur de progression */}
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <span>{currentIndex + 1} / {pile.length}</span>
              {vocabScores[selectedUnit] !== undefined && (
                <span className="ml-2 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                  <BarChart2 size={10} /> {vocabScores[selectedUnit]}%
                </span>
              )}
            </p>
          </div>
          {/* Toggle mode */}
          <button
            onClick={() => { setMode(m => m === 'train' ? 'test' : 'train'); resetPile(); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${mode === 'test' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-300'}`}
          >
            {mode === 'train' ? 'Test' : 'Train'}
          </button>
        </div>

        {/* Sélecteur d'unité — défilable horizontalement */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {units.map(u => {
            const score = u !== ALL_UNIT ? vocabScores[u] : undefined;
            const isActive = u === selectedUnit;
            return (
              <button
                key={u}
                onClick={() => { setSelectedUnit(u); }}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${isActive ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
              >
                <span>{u === ALL_UNIT ? 'Բոլոր / الكل' : u.toUpperCase()}</span>
                {score !== undefined && (
                  <span className={`text-[9px] mt-0.5 ${isActive ? 'text-blue-100' : 'text-emerald-600'}`}>{score}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className="relative w-full max-w-sm aspect-[4/3] perspective-1000 cursor-pointer"
          onClick={() => mode === 'train' && setIsFlipped(!isFlipped)}
        >
          <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* Face avant — Arabe */}
            <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
              <span className="text-5xl font-bold text-gray-800 leading-tight text-center" dir="rtl">
                {currentWord.arabic}
              </span>
              {mode === 'train' && (
                <p className="text-sm text-gray-400 mt-8">Սեղمե՛ք՝ շրջելու / انقر للقلب</p>
              )}
              {mode === 'test' && (
                <p className="text-xs text-blue-600 mt-6 font-medium">Ի՞նչ է նշանակում / ما معنى هذه الكلمة؟</p>
              )}
            </div>

            {/* Face arrière — Arménien + Translittération */}
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

        {/* Contrôles selon le mode */}
        {mode === 'train' ? (
          <div className="flex items-center justify-center gap-6 mt-10 w-full max-w-sm">
            <button onClick={prevWord} className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-xl font-bold">←</button>
            <button
              className="w-16 h-16 rounded-full bg-blue-500 shadow-md flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-all"
              onClick={e => { e.stopPropagation(); speak(currentWord.arabic); }}
            >
              <Volume2 size={28} />
            </button>
            <button onClick={nextWord} className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 active:scale-95 transition-all text-xl font-bold">→</button>
          </div>
        ) : (
          /* Mode Test : Je sais / Je ne sais pas */
          <div className="flex gap-4 mt-8 w-full max-w-sm">
            <button
              onClick={() => handleKnown(false)}
              className="flex-1 py-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-2xl font-bold hover:bg-red-100 active:scale-95 transition-all"
            >
              ❌ Չգիտեմ
            </button>
            <button
              className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 active:scale-95 transition-all self-center shrink-0"
              onClick={() => speak(currentWord.arabic)}
            >
              <Volume2 size={22} />
            </button>
            <button
              onClick={() => handleKnown(true)}
              className="flex-1 py-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-700 rounded-2xl font-bold hover:bg-emerald-100 active:scale-95 transition-all"
            >
              ✅ Գիտեմ
            </button>
          </div>
        )}

        {/* Bouton reset */}
        <button
          onClick={resetPile}
          className="mt-6 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RotateCcw size={13} /> Մխոտ / خلط مجدد
        </button>
      </div>
    </div>
  );
}
