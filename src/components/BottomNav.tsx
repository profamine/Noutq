import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  BookOpen,
  User,
  MessageCircle,
  Sparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

// ===== Types =====
interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  hasNotification?: boolean;
}

interface BottomNavProps {
  currentScreen: string;
  setCurrentScreen: (s: string) => void;
  unreadMessages?: number;
  dailyStreak?: number;
}

// ===== Ripple Effect Hook =====
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  return { ripples, addRipple };
}

// ===== Ripple Component =====
function RippleEffect({ ripples }: { ripples: Array<{ x: number; y: number; id: number }> }) {
  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-20 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
          }}
        />
      ))}
    </>
  );
}

// ===== Badge Component =====
function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md shadow-red-200 animate-in zoom-in duration-300 border-2 border-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ===== Dot Indicator =====
function ActiveDot({ active }: { active: boolean }) {
  return (
    <div
      className={`w-1 h-1 rounded-full transition-all duration-500 ${
        active ? 'bg-emerald-500 scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'
      }`}
    />
  );
}

// ===== Nav Item Button =====
function NavButton({
  item,
  isActive,
  onClick,
}: {
  key?: React.Key;
  item: NavItem;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const { ripples, addRipple } = useRipple();
  const Icon = item.icon;
  const [bouncing, setBouncing] = useState(false);
  const prevActiveRef = useRef(isActive);

  useEffect(() => {
    if (isActive && !prevActiveRef.current) {
      setBouncing(true);
      const timer = setTimeout(() => setBouncing(false), 400);
      prevActiveRef.current = isActive;
      return () => clearTimeout(timer);
    }
    prevActiveRef.current = isActive;
  }, [isActive]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    onClick(e);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 overflow-hidden group min-w-[64px] ${
        isActive
          ? 'text-emerald-600'
          : 'text-gray-400 hover:text-gray-600 active:scale-95'
      }`}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Ripple Container */}
      <RippleEffect ripples={ripples} />

      {/* Background glow for active */}
      {isActive && (
        <div className="absolute inset-0 bg-emerald-50 rounded-2xl transition-all duration-500 animate-in fade-in duration-300" />
      )}

      {/* Icon container */}
      <div
        className={`relative z-10 transition-all duration-300 ${
          isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
        } ${bouncing ? 'animate-bounce-once' : ''}`}
      >
        <Icon
          size={24}
          strokeWidth={isActive ? 2.5 : 2}
          className={`transition-all duration-300 ${
            isActive ? 'drop-shadow-sm' : ''
          }`}
        />

        {/* Notification badge */}
        {item.badge !== undefined && item.badge > 0 && (
          <NotificationBadge count={item.badge} />
        )}

        {/* Small notification dot */}
        {item.hasNotification && !item.badge && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Label */}
      <span
        className={`relative z-10 text-[10px] mt-1 font-semibold transition-all duration-300 leading-tight ${
          isActive ? 'text-emerald-700 opacity-100' : 'opacity-70'
        }`}
      >
        {item.label}
      </span>

      {/* Active dot indicator */}
      <div className="relative z-10 mt-0.5">
        <ActiveDot active={isActive} />
      </div>
    </button>
  );
}

// ===== Main Bottom Nav =====
export default function BottomNav({
  currentScreen,
  setCurrentScreen,
  unreadMessages = 0,
  dailyStreak = 0,
}: BottomNavProps) {
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: Home,
      label: t('nav.home'),
    },
    {
      id: 'practice',
      icon: BookOpen,
      label: t('nav.practice'),
      hasNotification: true,
    },
    {
      id: 'chat',
      icon: MessageCircle,
      label: t('nav.chat'),
      badge: unreadMessages,
    },
    {
      id: 'profile',
      icon: User,
      label: t('nav.profile'),
    },
  ];

  // Calculate active indicator position
  const activeIndex = navItems.findIndex((item) => item.id === currentScreen);

  return (
    <>
      {/* Global styles for animations */}
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 0.3;
          }
          100% {
            transform: scale(10);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
        
        @keyframes bounce-once {
          0%, 100% {
            transform: scale(1.1) translateY(0);
          }
          50% {
            transform: scale(1.1) translateY(-4px);
          }
        }
        .animate-bounce-once {
          animation: bounce-once 0.4s ease-in-out;
        }
        
        @keyframes slide-up-fade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up-fade 0.3s ease-out;
        }
        
        /* Safe area padding for iOS */
        .pb-safe {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Streak banner (shown when streak is active) */}
        {dailyStreak >= 3 && (
          <div className="flex justify-center mb-1 animate-slide-up">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Zap size={10} />
              {dailyStreak} {t('nav.streak_banner')} 🔥
            </div>
          </div>
        )}

        {/* Main nav bar */}
        <div className="relative bg-white/95 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {/* Top sliding indicator line */}
          <div className="absolute top-0 left-0 right-0 h-[3px]">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out shadow-sm shadow-emerald-300"
              style={{
                width: `${100 / navItems.length}%`,
                marginLeft: `${(activeIndex / navItems.length) * 100}%`,
              }}
            />
          </div>

          {/* Nav items */}
          <div className="flex justify-around items-center px-2 pt-2 pb-safe">
            {navItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={currentScreen === item.id}
                onClick={() => setCurrentScreen(item.id)}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}