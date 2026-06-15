import React, { useState, useEffect, useCallback, useRef, useId, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Turtle,
  Volume2,
  ChevronRight,
  ChevronLeft,
  Star,
  Trophy,
  Heart,
  Zap,
  RotateCcw,
  BookOpen,
  Eye,
  EyeOff,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Target,
  Award,
  Clock,
  Hash,
  Edit3,
  Link2,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useArabicTTS } from '../hooks/useArabicTTS';
import { lessonsData, type LessonData, type LessonStep, type QuizOption } from '../data/lessons';
import { Preferences } from '@capacitor/preferences';

// ===== Sound Effects (Real Web Audio + Vibration) =====
const lazyAudioContext = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as Record<string, any>).webkitAudioContext)();
    }
    return ctx;
  };
})();

const playSound = (type: 'correct' | 'wrong' | 'complete' | 'click' | 'speak') => {
  try {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'correct': navigator.vibrate(50); break;
        case 'wrong': navigator.vibrate([100, 50, 100]); break;
        case 'complete': navigator.vibrate([50, 30, 50, 30, 50]); break;
        default: navigator.vibrate(20);
      }
    }
  } catch (e) {}

  try {
    const ctx = lazyAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // Do5
      osc.frequency.setValueAtTime(659.25, t + 0.1); // Mi5
      osc.frequency.setValueAtTime(783.99, t + 0.2); // Sol5
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(150, t + 0.3);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === 'complete') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(554.37, t + 0.15);
      osc.frequency.setValueAtTime(659.25, t + 0.3);
      osc.frequency.setValueAtTime(880, t + 0.45);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.6);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + 0.08);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (type === 'speak') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(800, t + 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  } catch (e) {}
};

// ===== Animated Counter Component =====
function AnimatedCounter({ value, duration = 500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const start = previousValue.current;
    previousValue.current = value;
    if (start === value) return;

    const steps = Math.ceil(duration / 16);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplay(Math.round(start + (value - start) * Math.min(progress, 1)));
      if (step >= steps) clearInterval(timer);
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display}</span>;
}

// ===== Circular Progress Component =====
function CircularProgress({ progress, size = 40, strokeWidth = 3 }: { progress: number; size?: number; strokeWidth?: number }) {
  const gradientId = useId();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ===== Particle Effect Component =====
function ParticleExplosion({ active }: { active: boolean }) {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => {
      const angle = (i / 20) * 360;
      const distance = 60 + Math.random() * 100;
      const x = Math.cos((angle * Math.PI) / 180) * distance;
      const y = Math.sin((angle * Math.PI) / 180) * distance;
      const colors = ['🌟', '⭐', '✨', '💫', '🎉', '🎊'];
      const emoji = colors[Math.floor(Math.random() * colors.length)];
      const size = 14 + Math.random() * 16;
      const duration = 0.6 + Math.random() * 0.5;
      return { x, y, emoji, size, duration };
    });
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2"
          style={{
            fontSize: p.size,
            animation: `particleFly ${p.duration}s ease-out forwards`,
            '--tx': `${p.x}px`,
            '--ty': `${p.y}px`,
            opacity: 0,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(var(--tx, 50px), var(--ty, -50px)) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ===== Hearts Display =====
function HeartsDisplay({ lives, maxLives = 3 }: { lives: number; maxLives?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLives }).map((_, i) => (
        <Heart
          key={i}
          size={18}
          className={`transition-all duration-300 ${
            i < lives ? 'text-red-500 fill-red-500 scale-100' : 'text-gray-300 scale-90'
          } ${i === lives ? 'animate-pulse' : ''}`}
        />
      ))}
    </div>
  );
}

// ===== Waveform Animation =====
function WaveformAnimation({ active }: { active: boolean }) {
  const heights = useMemo(
    () => Array.from({ length: 20 }, () => 20 + Math.random() * 40),
    []
  );

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            active ? 'bg-gradient-to-t from-red-500 to-red-300' : 'bg-gray-300'
          }`}
          style={{
            height: active ? `${h}px` : '8px',
            animation: active ? `wave 0.5s ease-in-out ${i * 0.05}s infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0% { height: 8px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
}

// ===== Completion Screen =====
function CompletionScreen({
  xpEarned,
  accuracy,
  timeStr,
  onContinue,
}: {
  xpEarned: number;
  accuracy: number;
  timeStr: string;
  onContinue: () => void;
}) {
  const { t } = useLanguage();
  const [showStars, setShowStars] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const starCount = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  useEffect(() => {
    const timers = [
      setTimeout(() => setShowStars(1), 400),
      setTimeout(() => setShowStars(2), 800),
      setTimeout(() => setShowStars(3), 1200),
      setTimeout(() => setShowXP(true), 1600),
      setTimeout(() => setCelebrate(true), 500),
    ];
    playSound('complete');
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-600 z-50 flex flex-col items-center justify-center p-6">
      <ParticleExplosion active={celebrate} />

      <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Trophy */}
        <div className="relative">
          <div className="w-28 h-28 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-yellow-300/30">
            <Trophy size={56} className="text-yellow-300 drop-shadow-lg" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles size={28} className="text-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2 drop-shadow-md">
            {t('lesson.lesson_complete')}
          </h1>
          <p className="text-emerald-100 text-lg">{t('lesson.lesson_complete_desc')}</p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`transition-all duration-500 ${
                i <= showStars
                  ? 'scale-100 opacity-100'
                  : 'scale-0 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <Star
                size={i === 2 ? 56 : 44}
                className={`${
                  i <= starCount
                    ? 'text-yellow-300 fill-yellow-300 drop-shadow-lg'
                    : 'text-white/30'
                } ${i === 2 ? '-mt-4' : ''}`}
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        {showXP && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 space-y-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Zap size={20} className="text-yellow-300" />
                  <span className="font-medium">{t('lesson.xp_earned')}</span>
                </div>
                <span className="text-2xl font-black text-yellow-300">
                  +<AnimatedCounter value={xpEarned} />
                </span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Target size={20} className="text-emerald-300" />
                  <span className="font-medium">{t('lesson.accuracy')}</span>
                </div>
                <span className="text-2xl font-black text-emerald-300">
                  <AnimatedCounter value={accuracy} />%
                </span>
              </div>
              <div className="h-px bg-white/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/90">
                  <Clock size={20} className="text-blue-300" />
                  <span className="font-medium">{t('lesson.time')}</span>
                </div>
                <span className="text-lg font-bold text-blue-300">{timeStr}</span>
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-50 transition-all active:scale-98 shadow-xl shadow-black/10"
            >
              {t('lesson.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Main Lesson Screen =====
const normalize = (s: string) =>
  s.trim()
   .replace(/[\u200f\u200e\u200b]/g, '')   // remove directional marks
   .replace(/[\u064B-\u065F]/g, '')         // strip all tashkeel (diacritics)
   .replace(/[.,!?؟'"]/g, '')               // remove punctuation
   .replace(/\s+/g, ' ')
   .toLowerCase();

function getSimilarity(s1: string, s2: string): number {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function editDistance(s1: string, s2: string): number {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// Choisit le premier conteneur audio supporté par le navigateur courant.
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'audio/webm;codecs=opus', // Chrome / Android
    'audio/webm',
    'audio/mp4',              // Safari iOS 14.3+
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t));
}

export default function LessonScreen({
  onBack,
  lessonId,
  onComplete,
}: {
  onBack: () => void;
  lessonId: string | null;
  onComplete: (lessonId: string, xpEarned: number) => void;
}) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [feedback, setFeedback] = useState<'excellent' | 'good' | 'poor' | null>(null);
  const [lives, setLives] = useState(3);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const { speak, stop, isPlaying, ttsUnavailable } = useArabicTTS();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [shakeWrong, setShakeWrong] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Diagnostic data (mutable ref, no re-render needed)
  const diagRef = useRef({ transcript: '—', mimeType: '—', permState: '—', lastError: '—' });

  // ── Modale "Reprendre ?" — affichée si une progression partielle est sauvegardée ──
  const [resumeModal, setResumeModal] = useState<{ stepIndex: number; lives: number } | null>(null);

  // Au montage : vérifier si une progression partielle existe pour cette leçon
  useEffect(() => {
    if (!lessonId) return;
    Preferences.get({ key: `lessonProgress_${lessonId}` }).then(({ value }) => {
      if (!value) return;
      try {
        const saved = JSON.parse(value) as { stepIndex: number; lives: number };
        // N'afficher que si l'utilisateur n'est pas à l'étape 0 avec 3 vies
        if (saved.stepIndex > 0) setResumeModal(saved);
      } catch { /* données corrompues — ignorer */ }
    });
  }, [lessonId]);

  // À chaque changement d'étape ou de vies : persister la progression
  useEffect(() => {
    if (!lessonId || !lessonsData[lessonId] || showCompletion) return;
    Preferences.set({
      key: `lessonProgress_${lessonId}`,
      value: JSON.stringify({ stepIndex: currentStep, lives }),
    });
  }, [currentStep, lives, lessonId, showCompletion]);

  // Match State
  const [matchSelected, setMatchSelected] = useState<{ arabic: string | null; armenian: string | null }>({ arabic: null, armenian: null });
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  // Write State
  const [writeInput, setWriteInput] = useState('');
  const [writeAnswered, setWriteAnswered] = useState(false);
  const [writeCorrect, setWriteCorrect] = useState(false);

  // We should shuffle pairs whenever step changes.
  const [shuffledArabics, setShuffledArabics] = useState<string[]>([]);
  const [shuffledArmenians, setShuffledArmenians] = useState<string[]>([]);

  const isValidLesson = lessonId && lessonsData[lessonId];

  useEffect(() => {
    if (!isValidLesson) {
      onBack();
    }
  }, [isValidLesson, onBack]);

  // ✅ Auto-play DÉSACTIVÉ
  // La lecture démarre uniquement sur clic utilisateur
  // (bouton Écouter → handlePlayAudio, ou bouton Lent → handlePlaySlow)

  // Stop MediaRecorder and auto-stop timer on unmount.
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, []);

  if (!isValidLesson) return null;

  const lesson = lessonsData[lessonId!];
  const steps = lesson.steps;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Setup match step arrays
  useEffect(() => {
    if (step.type === 'match' && step.pairs) {
      const arabics = step.pairs.map((p) => p.arabic).sort(() => Math.random() - 0.5);
      const armenians = step.pairs.map((p) => p.armenian).sort(() => Math.random() - 0.5);
      setShuffledArabics(arabics);
      setShuffledArmenians(armenians);
    }
  }, [step]);

  const handlePlayAudio = () => speak(step.arabic, 1.0);
  const handlePlaySlow = () => speak(step.arabic, 0.7);

  const handleSimulatedRecord = () => {
    if (recording) {
      setRecording(false);
      playSound('click');

      setTimeout(() => {
        const rand = Math.random();
        if (rand > 0.5) {
          setFeedback('excellent');
          setXp((prev) => prev + 15);
          setStreak((prev) => prev + 1);
          setCorrectAnswers((prev) => prev + 1);
          playSound('correct');
          if (streak > 0 && (streak + 1) % 3 === 0) {
            setShowStreakBonus(true);
            setXp((prev) => prev + 5);
            setTimeout(() => setShowStreakBonus(false), 2000);
          }
        } else if (rand > 0.25) {
          setFeedback('good');
          setXp((prev) => prev + 8);
          setCorrectAnswers((prev) => prev + 1);
          playSound('correct');
        } else {
          setFeedback('poor');
          setStreak(0);
          setLives((prev) => Math.max(0, prev - 1)); // déduire une vie sur réponse vocale incorrecte
          playSound('wrong');
          setShakeWrong(true);
          setTimeout(() => setShakeWrong(false), 500);
        }
        setTotalAnswered((prev) => prev + 1);
      }, 1200);
    } else {
      setRecording(true);
      setFeedback(null);
      playSound('speak');
    }
  };

  const handleRecord = async () => {
    // ── Arrêt manuel ──────────────────────────────────────────────────────────
    if (recording) {
      console.log('[record] Arrêt manuel');
      mediaRecorderRef.current?.stop();
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
      return;
    }
    if (isTranscribing) return;

    // ── Support navigateur ─────────────────────────────────────────────────────
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      const msg = 'Microphone non supporté par ce navigateur';
      console.warn('[record]', msg);
      diagRef.current.lastError = msg;
      setMicError(msg);
      return;
    }

    // ── Vérification permission (non bloquante) ────────────────────────────────
    try {
      const perm = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
      diagRef.current.permState = perm?.state ?? 'unknown';
      console.log('[record] Permission micro :', perm?.state);
      if (perm?.state === 'denied') {
        const msg = "Microphone refusé. Activez l'accès dans les paramètres du navigateur.";
        diagRef.current.lastError = msg;
        setMicError(msg);
        return;
      }
    } catch { /* Permissions API non disponible (Firefox / iOS WebKit / Capacitor) */ }

    // ── Arrêt de la lecture TTS pour éviter l'écho au micro ───────────────────
    stop();

    setRecording(true);
    setFeedback(null);
    setMicError(null);
    playSound('speak');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      diagRef.current.permState = 'granted';
      console.log('[record] Flux audio obtenu, pistes :', stream.getAudioTracks().length);

      const mimeType = pickMimeType();
      diagRef.current.mimeType = mimeType ?? 'default';
      console.log('[record] MIME type :', mimeType ?? 'navigateur par défaut');

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log('[record] Chunk :', e.data.size, 'octets');
        }
      };

      mediaRecorder.onerror = (e) => {
        const msg = `Erreur MediaRecorder : ${(e as ErrorEvent).message ?? 'inconnue'}`;
        console.error('[record]', msg);
        diagRef.current.lastError = msg;
        setMicError(msg);
        setRecording(false);
      };

      mediaRecorder.onstop = () => {
        console.log('[record] Arrêté. Chunks :', audioChunksRef.current.length);
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());

        const totalBytes = audioChunksRef.current.reduce(
          (s, c) => s + (c as Blob).size, 0
        );
        if (totalBytes === 0) {
          const msg = 'Aucune donnée audio capturée. Vérifiez que le microphone fonctionne.';
          console.warn('[record]', msg);
          diagRef.current.lastError = msg;
          setMicError(msg);
          return;
        }

        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        console.log('[record] Blob :', blob.size, 'octets, type :', blob.type);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const raw = reader.result as string;
          if (!raw?.includes(',')) {
            const msg = 'Lecture audio échouée (FileReader vide)';
            console.error('[record]', msg);
            diagRef.current.lastError = msg;
            setMicError(msg);
            return;
          }
          const base64Data = raw.split(',')[1];
          console.log('[record] Base64 prêt, longueur :', base64Data.length);

          setIsTranscribing(true);

          // Affiche le résultat après 2,5 s pour laisser le temps de lire.
          const applyFeedback = (kind: 'excellent' | 'good' | 'poor', bonusStreak: boolean) => {
            setTimeout(() => {
              setIsTranscribing(false);
              if (kind === 'excellent') {
                setFeedback('excellent');
                setXp((p) => p + 15);
                setStreak((p) => p + 1);
                setCorrectAnswers((p) => p + 1);
                playSound('correct');
                if (bonusStreak) {
                  setShowStreakBonus(true);
                  setXp((p) => p + 5);
                  setTimeout(() => setShowStreakBonus(false), 2000);
                }
              } else if (kind === 'good') {
                setFeedback('good');
                setXp((p) => p + 8);
                setCorrectAnswers((p) => p + 1);
                playSound('correct');
              } else {
                setFeedback('poor');
                setStreak(0);
                playSound('wrong');
                setShakeWrong(true);
                setTimeout(() => setShakeWrong(false), 500);
              }
              setTotalAnswered((p) => p + 1);
            }, 2500);
          };

          try {
            const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
            const GEMINI_URL =
              'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
            console.log('[transcribe] Envoi à Gemini…');

            const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      text:
                        'Transcribe this Arabic (ar-SA) audio. Return ONLY the transcribed Arabic text. ' +
                        'No explanation, no translation, no markdown. ' +
                        'If the audio is silent, inaudible, or not in Arabic, reply with exactly "—".',
                    },
                    {
                      inline_data: {
                        data: base64Data,
                        mime_type: mediaRecorder.mimeType || 'audio/webm',
                      },
                    },
                  ],
                }],
              }),
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const transcript = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
            diagRef.current.transcript = transcript || '(vide)';
            console.log('[transcribe] Résultat :', JSON.stringify(transcript));

            // Audio silencieux ou non-arabe
            if (!transcript || transcript === '—') {
              console.warn('[transcribe] Audio inaudible ou vide');
              applyFeedback('poor', false);
              return;
            }

            const normalizedTranscript = normalize(transcript);
            const expected = normalize(step.arabic);
            const similarity = getSimilarity(normalizedTranscript, expected);
            console.log(
              '[transcribe] Similarité :', similarity.toFixed(2),
              '| Attendu :', expected,
              '| Reçu :', normalizedTranscript,
            );

            if (similarity > 0.75 || (expected && normalizedTranscript.includes(expected))) {
              const bonusStreak = streak > 0 && (streak + 1) % 3 === 0;
              applyFeedback('excellent', bonusStreak);
            } else if (
              similarity > 0.4 ||
              expected.split(' ').some((w) => w.length > 2 && normalizedTranscript.includes(w))
            ) {
              applyFeedback('good', false);
            } else {
              applyFeedback('poor', false);
            }
          } catch (err) {
            const msg = `Erreur Gemini : ${(err as Error).message ?? err}`;
            console.error('[transcribe]', msg);
            diagRef.current.lastError = msg;
            applyFeedback('poor', false);
          }
        };
      };

      mediaRecorder.start();
      console.log('[record] Démarré, état :', mediaRecorder.state);

      // Arrêt automatique après 5,5 s.
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          console.log('[record] Arrêt automatique (5,5 s)');
          mediaRecorderRef.current.stop();
        }
        autoStopTimerRef.current = null;
      }, 5500);
    } catch (err: unknown) {
      const name = (err as DOMException)?.name ?? '';
      console.error('[record] getUserMedia :', name, err);
      setRecording(false);
      let msg: string;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        msg = "Accès au microphone refusé. Vérifiez les permissions dans les paramètres.";
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'Aucun microphone détecté sur cet appareil.';
      } else if (name === 'NotReadableError') {
        msg = 'Microphone occupé par une autre application.';
      } else {
        msg = `Microphone inaccessible : ${name || ((err as Error)?.message ?? 'erreur inconnue')}`;
      }
      diagRef.current.lastError = msg;
      setMicError(msg);
    }
  };

  const handleQuizAnswer = (index: number) => {
    if (quizAnswered) return;
    setSelectedAnswer(index);
    setQuizAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    const isCorrect = step.options![index].correct;
    if (isCorrect) {
      setXp((prev) => prev + 10);
      setStreak((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      playSound('correct');
      if (streak > 0 && (streak + 1) % 3 === 0) {
        setShowStreakBonus(true);
        setXp((prev) => prev + 5);
        setTimeout(() => setShowStreakBonus(false), 2000);
      }
    } else {
      setLives((prev) => Math.max(0, prev - 1));
      setStreak(0);
      playSound('wrong');
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }
  };

  const handleMatchSelect = (type: 'arabic' | 'armenian', value: string) => {
    if (matchedPairs.includes(value)) return;

    setMatchSelected((prev) => {
      const next = { ...prev, [type]: value };

      if (next.arabic && next.armenian) {
        // Evaluate the pair
        const isPair = step.pairs?.some((p) => p.arabic === next.arabic && p.armenian === next.armenian);
        if (isPair) {
          setXp((prevXp) => prevXp + 5);
          playSound('correct');
          setMatchedPairs((mp) => {
            const updated = [...mp, next.arabic!, next.armenian!];
            if (step.pairs && updated.length >= step.pairs.length * 2) {
              setStreak((prevStreak) => prevStreak + 1);
              setCorrectAnswers((prevCA) => prevCA + 1);
              setTotalAnswered((prevTA) => prevTA + 1);
            }
            return updated;
          });
        } else {
          setLives((prevLives) => Math.max(0, prevLives - 1));
          setStreak(0);
          playSound('wrong');
          setShakeWrong(true);
          setTimeout(() => setShakeWrong(false), 500);
        }
        return { arabic: null, armenian: null }; // Reset selection
      }
      playSound('click');
      return next;
    });
  };

  const handleWriteSubmit = () => {
    if (writeAnswered) return;
    setWriteAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    const isCorrect = normalize(writeInput) === normalize(step.arabic);
    setWriteCorrect(isCorrect);
    
    if (isCorrect) {
      setXp((prev) => prev + 15);
      setStreak((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      playSound('correct');
    } else {
      setLives((prev) => Math.max(0, prev - 1));
      setStreak(0);
      playSound('wrong');
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setFeedback(null);
      setSelectedAnswer(null);
      setQuizAnswered(false);
      setShowHint(false);
      setRecording(false);
      setMatchSelected({ arabic: null, armenian: null });
      setMatchedPairs([]);
      setWriteInput('');
      setWriteAnswered(false);
      setWriteCorrect(false);
      playSound('click');
    } else {
      // Effacer la progression persistée : la leçon est terminée
      if (lessonId) Preferences.remove({ key: `lessonProgress_${lessonId}` });
      setShowCompletion(true);
    }
  };

  const handleExit = () => {
    if (currentStep > 0) {
      setExitConfirm(true);
    } else {
      onBack();
    }
  };

  const canProceed =
    step.type === 'listen' ||
    feedback !== null ||                               // speak: any feedback
    (step.type === 'quiz' && quizAnswered) ||          // quiz: answered (right or wrong)
    (step.type === 'match' && matchedPairs.length === (step.pairs?.length || 0) * 2) ||
    (step.type === 'write' && writeAnswered);          // write: submitted (right or wrong)

  if (showCompletion) {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

    return (
      <CompletionScreen
        xpEarned={xp}
        accuracy={totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 100}
        timeStr={timeStr}
        onContinue={() => {
          if (lessonId) onComplete(lessonId, xp);
          onBack();
        }}
      />
    );
  }

  // ── Modale "Reprendre là où vous vous êtes arrêté ?" ─────────────────────
  if (resumeModal) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
          <div className="text-center">
            <div className="text-4xl mb-3">📖</div>
            <h2 className="text-xl font-black text-gray-800 mb-1">Շարունակե՞լ</h2>
            <p className="text-gray-500 text-sm">
              Կա պահպանված առաջընթաց՝ {resumeModal.stepIndex + 1}-րդ քայլ,{' '}
              {'❤️'.repeat(resumeModal.lives)}{'🖤'.repeat(3 - resumeModal.lives)}
            </p>
            <p className="text-gray-400 text-xs mt-1" dir="rtl">هل تريد المتابعة من حيث توقفت؟</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setCurrentStep(resumeModal.stepIndex);
                setLives(resumeModal.lives);
                setResumeModal(null);
              }}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold"
            >
              ✅ Շարունակել / متابعة
            </button>
            <button
              onClick={() => {
                if (lessonId) Preferences.remove({ key: `lessonProgress_${lessonId}` });
                setResumeModal(null);
              }}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold"
            >
              🔄 Սկսել նորից / البدء من جديد
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (lives === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-red-500 to-red-700 z-50 flex flex-col items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-red-400/30 rounded-full flex items-center justify-center mx-auto">
            <Heart size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">{t('lesson.out_of_lives')}</h1>
          <p className="text-red-100 text-lg">{t('lesson.out_of_lives_desc')}</p>
          <div className="space-y-3 pt-4">
            <button
              onClick={() => {
                setLives(3);
                setCurrentStep(0);
                setXp(0);
                setStreak(0);
                setCorrectAnswers(0);
                setTotalAnswered(0);
                setFeedback(null);
                setSelectedAnswer(null);
                setQuizAnswered(false);
                setMatchSelected({ arabic: null, armenian: null });
                setMatchedPairs([]);
                setWriteInput('');
                setWriteAnswered(false);
                setWriteCorrect(false);
              }}
              className="w-full py-4 bg-white text-red-600 rounded-2xl font-bold text-lg"
            >
              <RotateCcw size={20} className="inline mr-2" />
              {t('lesson.try_again')}
            </button>
            <button onClick={onBack} className="w-full py-4 bg-red-600/50 text-white rounded-2xl font-bold text-lg border border-red-400/30">
              {t('lesson.go_back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Exit Confirmation Modal */}
      {exitConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">{t('lesson.quit_title')}</h3>
              <p className="text-gray-500 text-sm">{t('lesson.quit_desc')}</p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setExitConfirm(false)}
                  className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                >
                  {t('lesson.stay')}
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('lesson.quit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Bonus Popup */}
      {showStreakBonus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold">
            <Zap size={20} className="text-yellow-200" />
            {t('lesson.streak_bonus')} +5 XP
            <Sparkles size={16} className="text-yellow-200" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md px-4 py-3 border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={22} />
          </button>

          {/* Progress Bar */}
          <div className="flex-1 relative">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full" />
              </div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400 font-medium">
                {currentStep + 1}/{steps.length}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Lives */}
          <HeartsDisplay lives={lives} />

          {/* XP */}
          <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Zap size={14} className="text-amber-500" />
            <span className="text-xs font-bold text-amber-700">
              <AnimatedCounter value={xp} />
            </span>
          </div>
        </div>

        {/* Streak indicator */}
        {streak >= 2 && (
          <div className="mt-2 flex justify-center">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1.5 animate-in fade-in duration-300">
              <Zap size={12} className="text-orange-500" />
              <span className="text-xs font-bold text-orange-700">{streak} {t('lesson.streak_fire')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step Type Badge */}
      <div className="flex justify-center pt-5 pb-2">
        <div
          className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm ${
            step.type === 'listen'
              ? 'bg-blue-50 text-blue-600 border border-blue-200'
              : step.type === 'speak'
              ? 'bg-purple-50 text-purple-600 border border-purple-200'
              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
          }`}
        >
          {step.type === 'listen' && <Volume2 size={16} />}
          {step.type === 'speak' && <Mic size={16} />}
          {step.type === 'quiz' && <BookOpen size={16} />}
          {step.type === 'match' && <Link2 size={16} />}
          {step.type === 'write' && <Edit3 size={16} />}
          {step.type === 'listen' && t('lesson.listen_and_learn')}
          {step.type === 'speak' && t('lesson.speak')}
          {step.type === 'quiz' && t('lesson.quiz')}
          {step.type === 'match' && t('lesson.match')}
          {step.type === 'write' && t('lesson.write')}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col px-6 overflow-y-auto max-w-2xl mx-auto w-full ${shakeWrong ? 'animate-shake' : ''}`}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out 2;
          }
        `}</style>

        {/* Instruction */}
        <h2 className="text-lg font-bold text-gray-800 text-center mt-4">
          {step.type === 'listen' && t('lesson.listen_and_read')}
          {step.type === 'speak' && t('lesson.pronounce_sentence')}
          {step.type === 'quiz' && step.meaning}
          {step.type === 'match' && step.meaning}
          {step.type === 'write' && step.meaning}
        </h2>

        {/* Arabic Text Display */}
        {(step.type === 'listen' || step.type === 'speak') && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-6">
            {/* Arabic Word Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 w-full text-center">
              <div className="text-5xl font-arabic leading-loose text-gray-900 mb-4" dir="rtl">
                {step.highlightChar
                  ? step.arabic.split('').map((char, i) => {
                      if (step.arabic[i] === step.highlightChar) {
                        return (
                          <span key={i} className="text-red-500 font-bold relative">
                            {char}
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-400 rounded-full" />
                          </span>
                        );
                      }
                      return <span key={i}>{char}</span>;
                    })
                  : step.arabic}
              </div>

              {/* Transliteration */}
              {showTransliteration && (
                <p className="text-base text-gray-400 font-mono mb-2">{step.transliteration}</p>
              )}

              {/* Armenian meaning */}
              <p className="text-sm text-gray-500">{step.armenian}</p>

              {/* Toggle transliteration */}
              <button
                onClick={() => setShowTransliteration(!showTransliteration)}
                className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mx-auto transition-colors"
              >
                {showTransliteration ? <EyeOff size={14} /> : <Eye size={14} />}
                {showTransliteration ? t('lesson.hide_transliteration') : t('lesson.show_transliteration')}
              </button>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-5">
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                  isPlaying
                    ? 'bg-blue-400 scale-95'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 shadow-blue-200'
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-5 bg-white rounded-full animate-pulse" />
                    <div className="w-1 h-7 bg-white rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-4 bg-white rounded-full animate-pulse delay-150" />
                  </div>
                ) : (
                  <Play size={30} fill="white" className="text-white ml-1" />
                )}
              </button>
              <button
                onClick={handlePlaySlow}
                disabled={isPlaying}
                className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all active:scale-95 border border-gray-200"
                title="Slow"
              >
                <Turtle size={22} />
              </button>
            </div>

            {/* TTS unavailable banner — disparaît après 5 s */}
            {ttsUnavailable && (
              <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center animate-in fade-in duration-300">
                <p className="text-amber-800 text-xs font-medium leading-relaxed">
                  Ձայնային արտաբերումը հասանելի չէ։ Տեղադրեք Google TTS հայկական ձայնով։
                </p>
                <p className="text-amber-700 text-xs mt-1" dir="rtl">
                  الصوت غير متاح. يرجى تثبيت Google TTS مع دعم اللغة العربية.
                </p>
              </div>
            )}

            {/* Hint */}
            {step.hint && (
              <div className="w-full">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mx-auto transition-colors"
                >
                  <Lightbulb size={16} />
                  {showHint ? t('lesson.hide_hint') : t('lesson.show_hint')}
                </button>
                {showHint && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
                      <Lightbulb size={16} className="text-amber-500 flex-shrink-0" />
                      {step.hint}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recording waveform (for speak step) */}
            {step.type === 'speak' && recording && <WaveformAnimation active={recording} />}
          </div>
        )}

        {/* Quiz Content */}
        {step.type === 'quiz' && step.options && (
          <div className="flex-1 flex flex-col justify-center py-6 space-y-4">
            {/* Arabic word being quizzed */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 text-center mb-4">
              <p className="text-4xl font-arabic text-gray-900" dir="rtl">
                {step.arabic}
              </p>
              <p className="text-sm text-gray-400 mt-2 font-mono">{step.transliteration}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {step.options.map((option, idx) => {
                let optionStyle = 'bg-white border-gray-200 text-gray-800 hover:border-emerald-300 hover:bg-emerald-50';

                if (quizAnswered) {
                  if (option.correct) {
                    optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200';
                  } else if (idx === selectedAnswer && !option.correct) {
                    optionStyle = 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-200';
                  } else {
                    optionStyle = 'bg-gray-50 border-gray-200 text-gray-400';
                  }
                } else if (idx === selectedAnswer) {
                  optionStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleQuizAnswer(idx)}
                    disabled={quizAnswered}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all duration-300 flex items-center gap-3 ${optionStyle} ${
                      !quizAnswered ? 'active:scale-[0.98]' : ''
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {String.fromCharCode(1329 + idx)}
                    </span>
                    <span className="flex-1">{option.text}</span>
                    {quizAnswered && option.correct && <CheckCircle size={22} className="text-emerald-500 flex-shrink-0" />}
                    {quizAnswered && idx === selectedAnswer && !option.correct && (
                      <AlertCircle size={22} className="text-red-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Match Content */}
        {step.type === 'match' && step.pairs && (
          <div className="flex-1 flex flex-col justify-center py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 flex flex-col">
                {shuffledArabics.map((ar, idx) => {
                  const isMatched = matchedPairs.includes(ar);
                  const isSelected = matchSelected.arabic === ar;
                  return (
                    <button
                      key={`ar-${idx}`}
                      disabled={isMatched}
                      onClick={() => handleMatchSelect('arabic', ar)}
                      className={`h-24 p-4 rounded-2xl border-2 text-center font-bold text-2xl font-arabic transition-all flex items-center justify-center ${
                        isMatched
                          ? 'bg-gray-100 border-gray-200 text-gray-300 opacity-50'
                          : isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-700 w-[105%] z-10 shadow-md'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-slate-50 shadow-sm'
                      }`}
                      dir="rtl"
                    >
                      {ar}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3 flex flex-col">
                {shuffledArmenians.map((am, idx) => {
                  const isMatched = matchedPairs.includes(am);
                  const isSelected = matchSelected.armenian === am;
                  return (
                    <button
                      key={`am-${idx}`}
                      disabled={isMatched}
                      onClick={() => handleMatchSelect('armenian', am)}
                      className={`h-24 p-4 rounded-2xl border-2 text-center font-medium text-base transition-all flex items-center justify-center ${
                        isMatched
                          ? 'bg-gray-100 border-gray-200 text-gray-300 opacity-50'
                          : isSelected
                          ? 'bg-blue-50 border-blue-400 text-blue-700 w-[105%] ml-[5%] z-10 shadow-md'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-slate-50 shadow-sm'
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Hint */}
            {step.hint && (
              <div className="mt-8 text-center text-sm font-medium text-gray-400">
                {step.hint}
              </div>
            )}
          </div>
        )}

        {/* Write Content */}
        {step.type === 'write' && (
          <div className="flex-1 flex flex-col justify-center py-6 space-y-8">
            <div className="text-center">
              <p className="text-gray-500 mb-2">{t('lesson.translate_this')}</p>
              <h3 className="text-2xl font-bold text-gray-800">{step.armenian}</h3>
            </div>

            <div className="space-y-4">
              <textarea
                dir="rtl"
                disabled={writeAnswered}
                value={writeInput}
                onChange={(e) => setWriteInput(e.target.value)}
                placeholder="Գրեք արաբերեն այստեղ..."
                className={`w-full p-4 rounded-2xl border-2 font-arabic text-3xl transition-all min-h-[120px] focus:outline-none focus:ring-4 ${
                  writeAnswered
                    ? writeCorrect
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-emerald-200'
                      : 'border-red-500 bg-red-50 text-red-800 ring-red-200'
                    : 'border-gray-300 bg-white hover:border-blue-300 focus:border-blue-500 focus:ring-blue-100 shadow-inner'
                }`}
              />

              {!writeAnswered && (
                <button
                  onClick={handleWriteSubmit}
                  disabled={!writeInput.trim()}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:bg-gray-400 hover:bg-blue-700 transition"
                >
                  {t('lesson.check')}
                </button>
              )}
              
              {writeAnswered && !writeCorrect && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-center">
                  <p className="text-red-800 font-bold mb-1">{t('lesson.correct_answer_is')}</p>
                  <p className="text-3xl font-arabic text-red-600" dir="rtl">{step.arabic}</p>
                </div>
              )}
            </div>
            
            {/* Hint */}
            {step.hint && (
              <div className="w-full mt-4">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 mx-auto transition-colors"
                >
                  <Lightbulb size={16} />
                  {showHint ? t('lesson.hide_hint') : t('lesson.show_hint')}
                </button>
                {showHint && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-amber-800 text-sm font-medium flex items-center justify-center gap-2">
                      <Lightbulb size={16} className="text-amber-500 flex-shrink-0" />
                      {step.hint}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Area */}
        <div className="py-4">
          {feedback === 'excellent' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-emerald-800">{t('lesson.excellent')}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{t('lesson.excellent_desc')}</p>
              </div>
            </div>
          )}
          {feedback === 'good' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={22} className="text-amber-500" />
              </div>
              <div>
                <p className="font-bold text-amber-800">{t('lesson.good')}</p>
                <p className="text-xs text-amber-600 mt-0.5">{t('lesson.good_desc')}</p>
              </div>
            </div>
          )}
          {feedback === 'poor' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle size={22} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-800">{t('lesson.poor')}</p>
                <p className="text-xs text-red-600 mt-0.5">{t('lesson.poor_desc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-4 pb-6 space-y-3">
        <div className="max-w-2xl mx-auto w-full space-y-3">
          {/* Record button + mic-error banner + diagnostic modal */}
        {step.type === 'speak' && (
          <div className="pb-2 space-y-2">
            {/* Mic error banner */}
            {micError && (
              <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-800 animate-in fade-in duration-300">
                <AlertCircle size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {/* Mic button */}
              <button
                onClick={handleRecord}
                disabled={isTranscribing}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                  recording
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white scale-110 ring-4 ring-red-200 animate-pulse'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 active:scale-95 shadow-purple-200'
                } ${isTranscribing ? 'opacity-75 cursor-wait' : ''}`}
              >
                {isTranscribing ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : recording ? <MicOff size={32} /> : <Mic size={32} />}
              </button>

              {/* Diagnostic toggle button */}
              <button
                onClick={() => setShowDiag((v) => !v)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                title="Diagnostic microphone"
              >
                <Info size={16} />
              </button>
            </div>

            {/* Diagnostic panel */}
            {showDiag && (
              <div className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs font-mono space-y-1 animate-in fade-in duration-200">
                <p className="text-gray-400 font-sans font-semibold mb-2">Diagnostic microphone</p>
                <p><span className="text-gray-400">Permission :</span> {diagRef.current.permState}</p>
                <p><span className="text-gray-400">Format audio :</span> {diagRef.current.mimeType}</p>
                <p><span className="text-gray-400">Dernière transcription :</span> {diagRef.current.transcript}</p>
                <p><span className="text-gray-400">Dernière erreur :</span> {diagRef.current.lastError}</p>
                <p><span className="text-gray-400">MediaRecorder :</span> {typeof MediaRecorder !== 'undefined' ? '✓ supporté' : '✗ non supporté'}</p>
                <p><span className="text-gray-400">getUserMedia :</span> {navigator.mediaDevices?.getUserMedia ? '✓ disponible' : '✗ indisponible'}</p>
              </div>
            )}
          </div>
        )}

        {/* Next / Continue button */}
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
            canProceed
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {currentStep < steps.length - 1 ? (
            <>
              {t('lesson.continue')}
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              {t('lesson.finish')}
              <Trophy size={20} />
            </>
          )}
        </button>

        {/* Skip for listen steps */}
        {step.type === 'listen' && (
          <button
            onClick={handleNext}
            className="w-full py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
          >
            {t('lesson.skip')}
          </button>
        )}
        </div>
      </div>
    </div>
  );
}