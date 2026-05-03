import React from 'react';
import { Flame, Zap, Calendar as CalendarIcon, Trophy, Target, BookOpen, Star, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AchievementCardProps {
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

const WEEKDAY_LABELS = ['Կ', 'Ե', 'Ե', 'Չ', 'Հ', 'Ո', 'Շ'];

// ─── ProfileScreen ────────────────────────────────────────────────────────────

export default function ProfileScreen({
  completedUnits,
  totalXP,
  streak,
}: {
  completedUnits: string[];
  totalXP: number;
  streak: number;
}) {
  const { t, language, setLanguage } = useLanguage();

  const levelBadge = completedUnits.length < 4 ? 'A1' : completedUnits.length < 8 ? 'A2' : 'B1';

  const studyDates: string[] = JSON.parse(
    localStorage.getItem('studyHistory') || '[]'
  );

  const ach1Done  = completedUnits.length >= 1;
  const ach2Done  = streak >= 3;
  const ach3Done  = completedUnits.length >= 10;
  const ach4Done  = completedUnits.length >= 20;
  const achCount  = [ach1Done, ach2Done, ach3Done, ach4Done].filter(Boolean).length;

  const daysActiveLast28 = Array.from({ length: 28 }).filter((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - i));
    return studyDates.includes(date.toDateString());
  }).length;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 pb-24">
      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
          
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'hy' ? 'ar' : 'hy')}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <Globe size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {language === 'hy' ? 'Հայ' : 'عربي'}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-md">
              {language === 'hy' ? 'Ա' : 'أ'}
            </div>
            {/* Level badge on avatar */}
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              {levelBadge}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">Արամ</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('profile.member_since')}</p>

            {/* League badge */}
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
              <Star size={11} fill="currentColor" />
              {t('profile.bronze_league')}
            </div>
          </div>

          {/* Total XP pill */}
          <div className="flex flex-col items-center bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3">
            <Zap size={18} className="text-yellow-500 mb-0.5" />
            <span className="text-lg font-bold text-gray-800 leading-none">{totalXP}</span>
            <span className="text-[10px] text-gray-500 font-medium mt-0.5">XP</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-8">
        {/* ── Stats Grid ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 mb-3">{t('profile.stats')}</h2>
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
              value={`${achCount}/4`}
              label={t('profile.achievements')}
            />
            <StatCard
              icon={<Target size={22} />}
              iconBg="bg-green-100 text-green-600"
              value="45%"
              label={t('profile.goals')}
            />
          </div>
        </section>

        {/* ── Achievements ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-700">{t('profile.achievements')}</h2>
            <button className="text-blue-600 text-sm font-bold active:opacity-60">
              {t('profile.see_all')}
            </button>
          </div>
          <div className="space-y-3">
            <AchievementCard
              icon={<Trophy size={22} />}
              iconBg="bg-yellow-100 text-yellow-500"
              title={t('profile.ach1.title')}
              description={t('profile.ach1.desc')}
              progress={ach1Done ? 100 : 0}
              completed={ach1Done}
              xp={50}
            />
            <AchievementCard
              icon={<Flame size={22} />}
              iconBg="bg-orange-100 text-orange-500"
              title={t('profile.ach2.title')}
              description={t('profile.ach2.desc')}
              progress={Math.min(100, (streak / 3) * 100)}
              completed={ach2Done}
              xp={100}
            />
            <AchievementCard
              icon={<Target size={22} />}
              iconBg="bg-blue-100 text-blue-500"
              title={t('profile.ach3.title')}
              description={t('profile.ach3.desc')}
              progress={Math.min(100, (completedUnits.length / 10) * 100)}
              completed={ach3Done}
              xp={200}
            />
            <AchievementCard
              icon={<Star size={22} />}
              iconBg="bg-green-100 text-green-500"
              title="Ավարտել բոլորը"
              description="Ավարտել բոլոր 20 դասերը"
              progress={Math.min(100, (completedUnits.length / 20) * 100)}
              completed={ach4Done}
              xp={500}
            />
          </div>
        </section>

        {/* ── Learning Calendar ── */}
        <section>
          <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CalendarIcon size={16} className="text-gray-400" />
            {t('profile.calendar')}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            {/* Month label */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-700">{t('profile.month_name')}</span>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>{t('profile.learned')}</span>
                <div className="w-3 h-3 rounded-sm bg-gray-100 ml-2" />
                <span>{t('profile.missed')}</span>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
              {WEEKDAY_LABELS.map((d, i) => (
                <div key={i} className="text-[10px] text-gray-400 font-bold">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 28 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - i));
                const dateStr = date.toDateString();
                const isActive = studyDates.includes(dateStr);
                const isToday = i === 27;

                return (
                  <div
                    key={i}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-[11px] font-semibold
                      transition-transform active:scale-90
                      ${isActive ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                      ${isToday ? 'ring-2 ring-offset-1 ring-green-500' : ''}
                    `}
                  >
                    {date.getDate()}
                  </div>
                );
              })}
            </div>

            {/* Streak summary */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-around text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">{daysActiveLast28}</div>
                <div className="text-[10px] text-gray-500">{t('profile.days_month')}</div>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <div className="text-lg font-bold text-orange-500">{streak} 🔥</div>
                <div className="text-[10px] text-gray-500">{t('profile.streak_label')}</div>
              </div>
              <div className="w-px bg-gray-100" />
              <div>
                <div className="text-lg font-bold text-gray-800">{Math.round((daysActiveLast28 / 28) * 100)}%</div>
                <div className="text-[10px] text-gray-500">{t('profile.monthly_label')}</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, iconBg, value, label }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-gray-800 leading-none">{value}</div>
        <div className="text-[11px] text-gray-500 font-medium mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

// ─── AchievementCard ──────────────────────────────────────────────────────────

function AchievementCard({
  icon,
  iconBg,
  title,
  description,
  progress,
  completed = false,
  xp,
}: AchievementCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 ${
        completed ? 'border-yellow-200' : 'border-gray-100'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${
          completed ? 'opacity-100' : 'opacity-50'
        }`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h3 className="font-bold text-gray-800 text-sm truncate">{title}</h3>
          {xp !== undefined && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                completed
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              +{xp} XP
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mb-2">{description}</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completed ? 'bg-yellow-400' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Percent */}
      <div
        className={`text-sm font-bold shrink-0 ${
          completed ? 'text-yellow-500' : 'text-gray-400'
        }`}
      >
        {progress}%
      </div>
    </div>
  );
}