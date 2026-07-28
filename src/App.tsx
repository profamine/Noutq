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
import SpeechSetupScreen from './screens/SpeechSetupScreen';
import { storageGet, storageSet } from './services/storage';
import { requestNotificationPermission, scheduleDailyReminderNotification } from './services/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'lesson' | 'profile' | 'chat' | 'practice';

/** Pure function — keeps unit-testable; no side effects. */
export function computeStreak(rawStreak: number, lastStudyDate: string | null): number {
  if (!lastStudyDate) return rawStreak;
  const today = new Date().toDateString();
  if (lastStudyDate === today) return rawStreak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastStudyDate === yesterday.toDateString()) return rawStreak;
  return 0;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const [ready, setReady] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [completedUnits, setCompletedUnits] = useState<string[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);

  // Keep lastStudyDate accessible synchronously in callbacks without re-render
  const lastStudyDateRef = useRef<string>('');

  // ── Load persisted state ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [setupDone, units, xp, rawStreakStr, lastDate] = await Promise.all([
        storageGet('speechSetupDone'),
        storageGet('completedUnits'),
        storageGet('totalXP'),
        storageGet('streak'),
        storageGet('lastStudyDate'),
      ]);

      setShowSetup(setupDone !== 'true');

      try {
        const parsedUnits = JSON.parse(units || '[]');
        if (Array.isArray(parsedUnits)) {
          setCompletedUnits(parsedUnits.filter((id): id is string => typeof id === 'string'));
        }
      } catch { /* données corrompues — conserver la valeur initiale */ }
      const parsedXp = Number(xp || '0');
      setTotalXP(Number.isFinite(parsedXp) && parsedXp >= 0 ? parsedXp : 0);

      const parsedStreak = Number(rawStreakStr || '0');
      const rawStreak = Number.isFinite(parsedStreak) && parsedStreak >= 0 ? parsedStreak : 0;
      const computed = computeStreak(rawStreak, lastDate);
      setStreak(computed);
      // Persist corrected streak if it was reset
      if (computed !== rawStreak) {
        await storageSet('streak', String(computed));
      }
      lastStudyDateRef.current = lastDate || '';

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

    if (!completedUnits.includes(lessonId)) {
      const nextUnits = [...completedUnits, lessonId];
      setCompletedUnits(nextUnits);
      storageSet('completedUnits', JSON.stringify(nextUnits));
      setTotalXP((currentXp) => {
        const nextXp = currentXp + xpEarned;
        storageSet('totalXP', String(nextXp));
        return nextXp;
      });
    }

    if (lastStudyDateRef.current !== today) {
      setStreak(prev => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newStreak = lastStudyDateRef.current === yesterday.toDateString() ? prev + 1 : 1;
        storageSet('streak', String(newStreak));
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
  }, [completedUnits]);

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

  // ── Render ────────────────────────────────────────────────────────────────
  if (!ready) return null;

  const showNav = currentScreen !== 'lesson';

  if (showSetup) {
    return (
      <div className="flex flex-col flex-1 h-full w-full bg-gray-50 relative md:rounded-3xl shadow-none md:shadow-2xl">
        <SpeechSetupScreen onDone={handleSetupDone} />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full w-full bg-gray-50 relative rounded-none md:rounded-3xl shadow-none md:shadow-2xl">
      {showNav && (
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}

      <div className="flex-1 w-full flex flex-col h-full bg-white md:border-l border-gray-100 relative">
        {currentScreen === 'home'     && <HomeScreen onStartLesson={navigateToLesson} completedUnits={completedUnits} totalXP={totalXP} streak={streak} />}
        {currentScreen === 'lesson'   && <LessonScreen onBack={goBack} lessonId={activeLesson} onComplete={markUnitComplete} />}
        {currentScreen === 'profile'  && <ProfileScreen completedUnits={completedUnits} totalXP={totalXP} streak={streak} />}
        {currentScreen === 'chat'     && <ChatScreen />}
        {currentScreen === 'practice' && <PracticeScreen />}
      </div>
    </div>
  );
}
