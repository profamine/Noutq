/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import ProfileScreen from './screens/ProfileScreen';
import ChatScreen from './screens/ChatScreen';
import PracticeScreen from './screens/PracticeScreen';
import BottomNav from './components/BottomNav';
import { LanguageProvider } from './contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

import SpeechSetupScreen from './screens/SpeechSetupScreen';

type Screen = 'home' | 'lesson' | 'profile' | 'chat' | 'practice';

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const [showSetup, setShowSetup] = useState(() =>
    localStorage.getItem('speechSetupDone') !== 'true'
  );

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const [completedUnits, setCompletedUnits] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('completedUnits') || '[]'); }
    catch { return []; }
  });
  
  const [totalXP, setTotalXP] = useState<number>(() => {
    return Number(localStorage.getItem('totalXP') || '0');
  });
  
  const [streak, setStreak] = useState<number>(() => {
    const rawStreak = Number(localStorage.getItem('streak') || '0');
    const lastStudy = localStorage.getItem('lastStudyDate');
    if (!lastStudy) return rawStreak;
    const today = new Date().toDateString();
    if (lastStudy === today) return rawStreak;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastStudy !== yesterday.toDateString()) {
      localStorage.setItem('streak', '0');
      return 0; // reset visually
    }
    return rawStreak;
  });

  useEffect(() => {
    // any initialization logic that doesn't conflict with setStreak
  }, []);

  const markUnitComplete = useCallback((lessonId: string, xpEarned: number) => {
    const today = new Date().toDateString();
    
    setCompletedUnits(prev => {
      const alreadyDone = prev.includes(lessonId);
      const next = alreadyDone ? prev : [...prev, lessonId];
      if (!alreadyDone) {
        localStorage.setItem('completedUnits', JSON.stringify(next));
        setTotalXP(xp => {
          const n = xp + xpEarned;
          localStorage.setItem('totalXP', String(n));
          return n;
        });
      }
      return next;
    });

    const lastStudyDate = localStorage.getItem('lastStudyDate') || '';

    if (lastStudyDate !== today) {
      setStreak(prev => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const newStreak = lastStudyDate === yesterday.toDateString() ? prev + 1 : 1;
        localStorage.setItem('streak', String(newStreak));
        return newStreak;
      });
      localStorage.setItem('lastStudyDate', today);
    }

    const studyHistory: string[] = JSON.parse(
      localStorage.getItem('studyHistory') || '[]'
    );
    if (!studyHistory.includes(today)) {
      studyHistory.push(today);
      localStorage.setItem('studyHistory', JSON.stringify(studyHistory));
    }
  }, []);

  const navigateToLesson = useCallback((lessonId: string) => {
    setActiveLesson(lessonId);
    setCurrentScreen('lesson');
  }, []);

  const goBack = useCallback(() => {
    setActiveLesson(null);
    setCurrentScreen('home');
  }, []);

  const handleSetupDone = useCallback(() => {
    localStorage.setItem('speechSetupDone', 'true');
    setShowSetup(false);
  }, []);

  const showNav = currentScreen !== 'lesson';

  if (showSetup) {
    return (
      <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative sm:border-x sm:border-gray-200">
        <SpeechSetupScreen onDone={handleSetupDone} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden relative sm:border-x sm:border-gray-200">
      {currentScreen === 'home'    && <HomeScreen onStartLesson={navigateToLesson} completedUnits={completedUnits} totalXP={totalXP} streak={streak} />}
      {currentScreen === 'lesson'  && <LessonScreen onBack={goBack} lessonId={activeLesson} onComplete={markUnitComplete} />}
      {currentScreen === 'profile' && <ProfileScreen completedUnits={completedUnits} totalXP={totalXP} streak={streak} />}
      {currentScreen === 'chat'    && <ChatScreen />}
      {currentScreen === 'practice' && <PracticeScreen />}

      {showNav && (
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      )}
    </div>
  );
}