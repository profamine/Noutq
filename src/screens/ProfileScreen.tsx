import React, { useState, useEffect, useRef } from 'react';
import {
  Flame, Zap, Calendar as CalendarIcon, Trophy, Target, BookOpen, Star, Globe,
  Pencil, Check, Bell, BellOff, Shield, Download, Upload, Sun, Moon, Monitor,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';
import { storageGet, storageSet, exportBackup, importBackup } from '../services/storage';
import { requestNotificationPermission, scheduleDailyReminderNotification, cancelDailyReminder } from '../services/notifications';
import { formatMonthYear, getWeekdayInitial } from '../utils/locale';
import { computeAchievements } from '../data/achievements';
import { getLeagueStatus } from '../data/leagues';
import { getV5TrackStatus, getV5SideTrackStatus } from '../data/v5/curriculum';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementCardProps {
  key?: React.Key;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  progress: number;
  completed?: boolean;
  xp?: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: string | number;
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_LESSONS = 22;

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export default function ProfileScreen({
  completedUnits,
  totalXP,
  streak,
  streakFreezes,
  dailyGoalXP,
  xpToday,
  onSetDailyGoalXP,
}: {
  completedUnits: string[];
  totalXP: number;
  streak: number;
  streakFreezes: number;
  dailyGoalXP: number;
  xpToday: number;
  onSetDailyGoalXP: (goal: number) => void;
}) {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  // ── Chargement async depuis le storage (remplace localStorage synchrone) ─
  const [ready, setReady] = useState(false);
  const [userName, setUserName] = useState('');
  const [studyDates, setStudyDates] = useState<string[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [name, history, notif] = await Promise.all([
        storageGet('userName'),
        storageGet('studyHistory'),
        storageGet('notificationsEnabled'),
      ]);
      setUserName(name || (language === 'hy' ? 'Արամ' : 'أحمد'));
      try {
        const parsedHistory = JSON.parse(history || '[]');
        if (Array.isArray(parsedHistory)) {
          setStudyDates(parsedHistory.filter((date): date is string => typeof date === 'string'));
        }
      } catch { /* données corrompues — conserver un historique vide */ }
      setNotifEnabled(notif === 'true');
      setReady(true);
    })();
  }, [language]);

  // ── Nom éditable ────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      // Persisté dans @capacitor/preferences, pas localStorage
      await storageSet('userName', trimmed);
    }
    setEditingName(false);
  };

  // ── Toggle notifications ────────────────────────────────────────────────
  const handleNotifToggle = async () => {
    if (!notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const scheduled = await scheduleDailyReminderNotification();
        if (scheduled) {
          await storageSet('notificationsEnabled', 'true');
          setNotifEnabled(true);
        }
      }
    } else {
      await cancelDailyReminder();
      await storageSet('notificationsEnabled', 'false');
      setNotifEnabled(false);
    }
  };

  // ── Sauvegarde / restauration ────────────────────────────────────────────
  const handleExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `noutq-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    if (!window.confirm(t('profile.backup.import_confirm'))) return;
    try {
      const text = await file.text();
      await importBackup(JSON.parse(text));
      setBackupMessage(t('profile.backup.import_done'));
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setBackupMessage(t('profile.backup.import_error'));
      setTimeout(() => setBackupMessage(null), 4000);
    }
  };

  // ── Données dérivées ─────────────────────────────────────────────────────
  const levelBadge = completedUnits.length < 4 ? 'A1' : completedUnits.length < 10 ? 'A2' : 'B1';

  const achievements = computeAchievements({ lessonsCompleted: completedUnits.length, streak, totalXP });
  const achCount = achievements.filter((a) => a.completed).length;
  const league = getLeagueStatus(totalXP);

  const goalsPercent = Math.round((completedUnits.length / TOTAL_LESSONS) * 100);
  const dailyGoalPercent = Math.min(100, Math.round((xpToday / dailyGoalXP) * 100));
  const coreStatus = getV5TrackStatus(completedUnits, 'core');
  const grammarStatus = getV5TrackStatus(completedUnits, 'grammar');
  const optionalStatus = getV5SideTrackStatus(completedUnits, 'optional');
  const reviewStatus = getV5SideTrackStatus(completedUnits, 'review');

  const historyDates = Array.from({ length: 28 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    return date;
  });
  const daysActiveLast28 = historyDates.filter((date) =>
    studyDates.includes(date.toDateString()),
  ).length;

  // Éviter le flash de valeurs vides pendant le chargement async
  if (!ready) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 pb-24 md:pb-6">
      {/* ── Hero Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 pt-10 pb-6 w-full">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('nav.profile')}</h1>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'hy' ? 'ar' : 'hy')}
              aria-label={language === 'hy' ? 'Փոխել լեզուն արաբերենի' : 'تغيير اللغة إلى الأرمنية'}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors"
            >
              <Globe size={16} className="text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {language === 'hy' ? 'Հայ' : 'عربي'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-900">
                {levelBadge}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* Nom éditable */}
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    className="text-xl font-bold text-gray-900 dark:text-gray-50 border-b-2 border-blue-500 outline-none bg-transparent w-36"
                    maxLength={30}
                  />
                  <button onClick={saveName} className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 truncate">{userName}</h2>
                  <button
                    onClick={() => { setNameInput(userName); setEditingName(true); }}
                    className="text-gray-400 hover:text-blue-500 transition-colors shrink-0"
                    aria-label={t('profile.edit_name')}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('profile.member_since')}</p>

              <div className={`mt-2 inline-flex items-center gap-1.5 border text-xs font-bold px-3 py-1 rounded-full ${league.tier.badgeClass}`}>
                <Star size={11} fill="currentColor" />
                {t(league.tier.labelKey)}
              </div>
            </div>

            {/* Total XP pill */}
            <div className="flex flex-col items-center bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-900 rounded-2xl px-4 py-3">
              <Zap size={18} className="text-yellow-500 mb-0.5" />
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-none">{totalXP}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">XP</span>
            </div>
          </div>

          {/* Progression vers la prochaine ligue */}
          {league.next ? (
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                <span>{t(league.tier.labelKey)}</span>
                <span>{league.xpToNext} {t('profile.league.to_next')} {t(league.next.labelKey)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${league.progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">{t('profile.league.max')} 🏆</p>
          )}
        </div>
      </div>

      <div className="p-5 space-y-8 max-w-2xl mx-auto w-full">
        {/* ── Stats Grid ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">{t('profile.stats')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Flame size={22} />}
              iconBg="bg-orange-100 text-orange-500"
              value={streak}
              label={t('profile.streak')}
            />
            <StatCard
              icon={<BookOpen size={22} />}
              iconBg="bg-blue-100 text-blue-500"
              value={completedUnits.length}
              label={t('profile.lessons_done')}
            />
            <StatCard
              icon={<Trophy size={22} />}
              iconBg="bg-yellow-100 text-yellow-500"
              value={`${achCount}/${achievements.length}`}
              label={t('profile.achievements')}
            />
            <StatCard
              icon={<Target size={22} />}
              iconBg="bg-green-100 text-green-600"
              value={`${goalsPercent}%`}
              label={t('profile.goals')}
            />
          </div>
        </section>

        {/* ── V5 Track completion — independent core / grammar status ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">
            {language === 'ar' ? 'مسارات Noutq V5' : 'Noutq V5 ուղիներ'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'core',
                label: language === 'ar' ? 'المسار الأساسي A1' : 'Հիմնական A1 ուղի',
                status: coreStatus,
                color: 'bg-blue-500',
              },
              {
                id: 'grammar',
                label: language === 'ar' ? 'الامتداد النحوي' : 'Քերականական ընդլայնում',
                status: grammarStatus,
                color: 'bg-violet-500',
              },
              {
                id: 'optional',
                label: language === 'ar' ? 'وحدات الإثراء' : 'Հարստացման միավորներ',
                status: optionalStatus,
                color: 'bg-teal-500',
              },
              {
                id: 'review',
                label: language === 'ar' ? 'المراجعة الشاملة' : 'Ընդհանուր վերանայում',
                status: reviewStatus,
                color: 'bg-amber-500',
              },
            ].map(({ id, label, status, color }) => (
              <div key={id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {status.completed
                        ? (language === 'ar' ? 'مكتمل بصورة مستقلة' : 'Ավարտված է անկախ կարգավիճակով')
                        : `${status.completedCount}/${status.requiredCount}`}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-black px-2 py-1 rounded-full ${
                    status.completed
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {status.completed ? '✓' : `${status.percent}%`}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${status.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
            {language === 'ar'
              ? 'إتمام الامتداد النحوي ووحدات الإثراء والمراجعة ليس شرطًا لإتمام المسار الأساسي A1.'
              : 'Քերականական ընդլայնումը, հարստացման միավորները և վերանայումը պարտադիր չեն հիմնական A1 ուղին ավարտելու համար։'}
          </p>
        </section>

        {/* ── Daily Goal ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3">{t('profile.daily_goal.title')}</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {xpToday} / {dailyGoalXP} XP <span className="text-gray-400 dark:text-gray-500 font-normal">({t('profile.daily_goal.progress')})</span>
              </span>
              {xpToday >= dailyGoalXP && <span className="text-lg">🎉</span>}
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{t('profile.daily_goal.choose')}</p>
            <div className="flex gap-2">
              {[10, 30, 50, 100].map((goal) => (
                <button
                  key={goal}
                  onClick={() => onSetDailyGoalXP(goal)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    dailyGoalXP === goal
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Streak Freeze ── */}
        <section>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 dark:bg-sky-950/50 text-sky-500">
              <Shield size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t('profile.streak_freeze.title')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.streak_freeze.desc')}</p>
            </div>
            <div className="text-center shrink-0">
              <div className="text-xl font-bold text-sky-500">{streakFreezes}</div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500">{t('profile.streak_freeze.available')}</div>
            </div>
          </div>
        </section>

        {/* ── Achievements ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-300">{t('profile.achievements')}</h2>
            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">{achCount}/{achievements.length}</span>
          </div>
          <div className="space-y-3">
            {achievements.map(({ def, completed, progressPercent }) => {
              const title: string = t(def.titleKey);
              const description: string = t(def.descKey);
              return (
                <AchievementCard
                  key={def.id}
                  icon={achievementIcon(def.id)}
                  iconBg={achievementIconBg(def.id)}
                  title={title}
                  description={description}
                  progress={progressPercent}
                  completed={completed}
                  xp={def.xp}
                />
              );
            })}
          </div>
        </section>

        {/* ── Learning Calendar ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <CalendarIcon size={16} className="text-gray-400" />
            {t('profile.calendar')}
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                {formatMonthYear(new Date(), language)}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>{t('profile.learned')}</span>
                <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 ml-2" />
                <span>{t('profile.missed')}</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
              {historyDates.slice(0, 7).map((date) => (
                <div key={date.toDateString()} className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                  {getWeekdayInitial(date, language)}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {historyDates.map((date, i) => {
                const isActive = studyDates.includes(date.toDateString());
                const isToday = i === 27;

                return (
                  <div
                    key={i}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold
                      transition-transform active:scale-90
                      ${isActive ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}
                      ${isToday ? 'ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-green-500' : ''}
                    `}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-around text-center">
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{daysActiveLast28}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('profile.days_month')}</div>
              </div>
              <div className="w-px bg-gray-100 dark:bg-gray-800" />
              <div>
                <div className="text-lg font-bold text-orange-500">{streak} 🔥</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('profile.streak_label')}</div>
              </div>
              <div className="w-px bg-gray-100 dark:bg-gray-800" />
              <div>
                <div className="text-lg font-bold text-gray-800 dark:text-gray-100">{Math.round((daysActiveLast28 / 28) * 100)}%</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{t('profile.monthly_label')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Paramètres ── */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-700 dark:text-gray-300">{t('profile.settings')}</h2>

          <button
            onClick={handleNotifToggle}
            role="switch"
            aria-checked={notifEnabled}
            aria-label={t('profile.toggle_reminders')}
            className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${notifEnabled ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t('profile.daily_reminders')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.reminder_time')}</p>
              </div>
            </div>
            {/* Toggle visuel */}
            <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${notifEnabled ? 'left-7' : 'left-1'}`} />
            </div>
          </button>

          {/* Thème */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3">{t('profile.theme.title')}</p>
            <div className="flex gap-2">
              {([
                { id: 'light', icon: Sun, label: t('profile.theme.light') },
                { id: 'dark', icon: Moon, label: t('profile.theme.dark') },
                { id: 'system', icon: Monitor, label: t('profile.theme.system') },
              ] as { id: ThemePreference; icon: typeof Sun; label: string }[]).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                    theme === id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sauvegarde / restauration */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t('profile.backup.title')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('profile.backup.desc')}</p>
            {backupMessage && (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">{backupMessage}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Download size={14} /> {t('profile.backup.export')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Upload size={14} /> {t('profile.backup.import')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Icônes des succès (aspect visuel séparé des données) ────────────────────

function achievementIcon(id: string): React.ReactNode {
  if (id.startsWith('streak')) return <Flame size={22} />;
  if (id.startsWith('xp')) return <Zap size={22} />;
  if (id === 'lessons_all') return <Star size={22} />;
  return <Trophy size={22} />;
}

function achievementIconBg(id: string): string {
  if (id.startsWith('streak')) return 'bg-orange-100 text-orange-500';
  if (id.startsWith('xp')) return 'bg-purple-100 text-purple-500';
  if (id === 'lessons_all') return 'bg-green-100 text-green-500';
  return 'bg-yellow-100 text-yellow-500';
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, value, label }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-none">{value}</div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

// ─── AchievementCard ──────────────────────────────────────────────────────────

function AchievementCard({
  icon, iconBg, title, description, progress, completed = false, xp,
}: AchievementCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${completed ? 'border-yellow-200 dark:border-yellow-900' : 'border-gray-100 dark:border-gray-800'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${completed ? 'opacity-100' : 'opacity-50'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{title}</h3>
          {xp !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${completed ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              +{xp} XP
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">{description}</p>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-yellow-400' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className={`text-sm font-bold shrink-0 ${completed ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}>
        {progress}%
      </div>
    </div>
  );
}
