/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import PracticeScreen from './screens/PracticeScreen';
import BottomNav from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import SpeechSetupScreen from './screens/SpeechSetupScreen';
import PlacementTestScreen from './screens/PlacementTestScreen';
import { storageGet, storageSet } from './services/storage';
import { requestNotificationPermission, scheduleDailyReminderNotification } from './services/notifications';
import { runV5Migration } from './services/v5Migration';
import { completeLessonOnce } from './services/progress';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'profile' | 'chat' | 'practice';

export interface StreakOutcome {
  streak: number;
  freezesRemaining: number;
  freezeConsumed: boolean;
}

const MAX_STREAK_FREEZES = 2;

/**
 * Pure function — keeps unit-testable; no side effects.
 * Si exactement un jour a été manqué et qu'une protection ("streak freeze")
 * est disponible, la série est préservée et une protection est consommée.
 */
export function computeStreak(
  rawStreak: number,
  lastStudyDate: string | null,
  freezesAvailable = 0,
): StreakOutcome {
  const noChange: StreakOutcome = { streak: rawStreak, freezesRemaining: freezesAvailable, freezeConsumed: false };
  if (!lastStudyDate) return noChange;

  const today = new Date().toDateString();
  if (lastStudyDate === today) return noChange;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastStudyDate === yesterday.toDateString()) return noChange;

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  if (lastStudyDate === twoDaysAgo.toDateString() && freezesAvailable > 0) {
    return { streak: rawStreak, freezesRemaining: freezesAvailable - 1, freezeConsumed: true };
  }

  return { streak: 0, freezesRemaining: freezesAvailable, freezeConsumed: false };
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showPlacementTest, setShowPlacementTest] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [dailyGoalXP, setDailyGoalXPState] = useState(30);
  const [xpAtDayStart, setXpAtDayStart] = useState(0);

  // Keep lastStudyDate accessible synchronously in callbacks without re-render
  const lastStudyDateRef = useRef<string>('');

  // ── Load persisted state ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await runV5Migration();
      const [setupDone, units, xp, rawStreakStr, lastDate, freezesStr, goalStr, dayStartXpStr, dayStartDate, placementDone] = await Promise.all([
        storageGet('speechSetupDone'),
        storageGet('completedUnits'),
        storageGet('totalXP'),
        storageGet('streak'),
        storageGet('lastStudyDate'),
        storageGet('streakFreezes'),
        storageGet('dailyGoalXP'),
        storageGet('xpAtDayStart'),
        storageGet('xpAtDayStartDate'),
        storageGet('placementTestDone'),
      ]);

      setShowSetup(setupDone !== 'true');

      let parsedUnitsList: string[] = [];
      try {
        const parsedUnits = JSON.parse(units || '[]');
        if (Array.isArray(parsedUnits)) {
          parsedUnitsList = parsedUnits.filter((id): id is string => typeof id === 'string');
          setCompletedUnits(parsedUnitsList);
        }
      } catch { /* données corrompues — conserver la valeur initiale */ }

      // Le test de positionnement n'est proposé qu'aux tout nouveaux apprenants.
      setShowPlacementTest(placementDone !== 'true' && parsedUnitsList.length === 0);
      const parsedXp = Number(xp || '0');
      const validXp = Number.isFinite(parsedXp) && parsedXp >= 0 ? parsedXp : 0;
      setTotalXP(validXp);

      const parsedStreak = Number(rawStreakStr || '0');
      const rawStreak = Number.isFinite(parsedStreak) && parsedStreak >= 0 ? parsedStreak : 0;
      const parsedFreezes = Number(freezesStr || '0');
      const freezesAvailable = Number.isFinite(parsedFreezes) && parsedFreezes >= 0 ? parsedFreezes : 0;

      const outcome = computeStreak(rawStreak, lastDate, freezesAvailable);
      setStreak(outcome.streak);
      setStreakFreezes(outcome.freezesRemaining);
      if (outcome.streak !== rawStreak) await storageSet('streak', String(outcome.streak));
      if (outcome.freezeConsumed) await storageSet('streakFreezes', String(outcome.freezesRemaining));
      lastStudyDateRef.current = lastDate || '';

      const parsedGoal = Number(goalStr || '30');
      setDailyGoalXPState(Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : 30);

      // Objectif quotidien : réinitialiser le point de référence si on a changé de jour.
      const today = new Date().toDateString();
      if (dayStartDate !== today) {
        setXpAtDayStart(validXp);
        await Promise.all([
          storageSet('xpAtDayStart', String(validXp)),
          storageSet('xpAtDayStartDate', today),
        ]);
      } else {
        const parsedDayStart = Number(dayStartXpStr || '0');
        setXpAtDayStart(Number.isFinite(parsedDayStart) && parsedDayStart >= 0 ? parsedDayStart : 0);
      }

      setReady(true);

      // Activer les rappels quotidiens si l'utilisateur les a précédemment activés
      try {
        const notifEnabled = await storageGet('notificationsEnabled');
        if (notifEnabled === 'true') {
          const granted = await requestNotificationPermission();
          if (granted) await scheduleDailyReminderNotification();
        }
      } catch { /* ne pas bloquer l'app si les notifications échouent */ }
    })();
  }, []);

  // ── Android back button ───────────────────────────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');
        const handle = await CapApp.addListener('backButton', () => {
          if (currentScreen === 'lesson') {
            setActiveLesson(null);
            setCurrentScreen('home');
          } else if (currentScreen !== 'home') {
            setCurrentScreen('home');
          }
          // On home screen, let Android handle back (minimize app)
        });
        cleanup = () => { handle.remove(); };
      } catch { /* not running in Capacitor */ }
    })();
    return () => { cleanup?.(); };
  }, [currentScreen]);

  // ── Callbacks ─────────────────────────────────────────────────────────────
  const markUnitComplete = useCallback((lessonId: string, xpEarned: number) => {
    const today = new Date().toDateString();

    const completion = completeLessonOnce({ completedUnits, totalXP }, lessonId, xpEarned);
    if (completion.changed) {
      setCompletedUnits(completion.completedUnits);
      setTotalXP(completion.totalXP);
      storageSet('completedUnits', JSON.stringify(completion.completedUnits));
      storageSet('totalXP', String(completion.totalXP));
    }

    if (lastStudyDateRef.current !== today) {
      setStreak(prev => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newStreak = lastStudyDateRef.current === yesterday.toDateString() ? prev + 1 : 1;
        storageSet('streak', String(newStreak));

        // Récompense : +1 protection de série tous les 7 jours, plafonnée.
        if (newStreak > 0 && newStreak % 7 === 0) {
          setStreakFreezes(prevFreezes => {
            const nextFreezes = Math.min(MAX_STREAK_FREEZES, prevFreezes + 1);
            storageSet('streakFreezes', String(nextFreezes));
            return nextFreezes;
          });
        }
        return newStreak;
      });
      lastStudyDateRef.current = today;
      storageSet('lastStudyDate', today);
    }

    storageGet('studyHistory').then(raw => {
      let history: string[] = [];
      try {
        const parsed = JSON.parse(raw || '[]');
        if (Array.isArray(parsed)) history = parsed.filter((date): date is string => typeof date === 'string');
      } catch { /* données corrompues — repartir d'un historique vide */ }
      if (!history.includes(today)) {
        history.push(today);
        storageSet('studyHistory', JSON.stringify(history));
      }
    });
  }, [completedUnits, totalXP]);

  const navigateToLesson = useCallback((lessonId: string) => {
    setActiveLesson(lessonId);
    setCurrentScreen('lesson');
  }, []);

  const goBack = useCallback(() => {
    setActiveLesson(null);
    setCurrentScreen('home');
  }, []);

  const handleSetupDone = useCallback(() => {
    storageSet('speechSetupDone', 'true');
    setShowSetup(false);
  }, []);

  const handlePlacementDone = useCallback((recommendedUnitId: string | null) => {
    storageSet('placementTestDone', 'true');
    setShowPlacementTest(false);
    if (recommendedUnitId) {
      setActiveLesson(recommendedUnitId);
      setCurrentScreen('lesson');
    }
  }, []);

  const setDailyGoalXP = useCallback((goal: number) => {
    setDailyGoalXPState(goal);
    storageSet('dailyGoalXP', String(goal));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!ready) return null;

  const showNav = currentScreen !== 'lesson';

  if (showSetup) {
    return (
      <div className="flex flex-col flex-1 h-full w-full bg-gray-50 dark:bg-gray-950 relative md:rounded-3xl shadow-none md:shadow-2xl">
        <SpeechSetupScreen onDone={handleSetupDone} />
      </div>
    );
  }

  if (showPlacementTest) {
    return (
      <div className="flex flex-col flex-1 h-full w-full bg-gray-50 dark:bg-gray-950 relative md:rounded-3xl shadow-none md:shadow-2xl">
        <PlacementTestScreen onDone={handlePlacementDone} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full w-full bg-gray-50 dark:bg-gray-950 relative rounded-none md:rounded-3xl shadow-none md:shadow-2xl">
      {showNav && (
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}

      <div className="flex-1 w-full flex flex-col h-full bg-white dark:bg-gray-900 md:border-l border-gray-100 dark:border-gray-800 relative">
        {currentScreen === 'home'     && <HomeScreen onStartLesson={navigateToLesson} completedUnits={completedUnits} totalXP={totalXP} streak={streak} />}
        {currentScreen === 'lesson'   && <LessonScreen onBack={goBack} lessonId={activeLesson} onComplete={markUnitComplete} />}
        {currentScreen === 'profile'  && (
          <ProfileScreen
            completedUnits={completedUnits}
            totalXP={totalXP}
            streak={streak}
            streakFreezes={streakFreezes}
            dailyGoalXP={dailyGoalXP}
            xpToday={Math.max(0, totalXP - xpAtDayStart)}
            onSetDailyGoalXP={setDailyGoalXP}
          />
        )}
        {currentScreen === 'chat'     && <ChatScreen />}
        {currentScreen === 'practice' && <PracticeScreen />}
      </div>
    </div>
  );
}
