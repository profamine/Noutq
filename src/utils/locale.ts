export type AppLanguage = 'hy' | 'ar';

const MONTHS: Record<AppLanguage, string[]> = {
  hy: [
    'հունվար', 'փետրվար', 'մարտ', 'ապրիլ', 'մայիս', 'հունիս',
    'հուլիս', 'օգոստոս', 'սեպտեմբեր', 'հոկտեմբեր', 'նոյեմբեր', 'դեկտեմբեր',
  ],
  ar: [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ],
};

const WEEKDAYS: Record<AppLanguage, string[]> = {
  hy: ['կիրակի', 'երկուշաբթի', 'երեքշաբթի', 'չորեքշաբթի', 'հինգշաբթի', 'ուրբաթ', 'շաբաթ'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

const WEEKDAY_INITIALS: Record<AppLanguage, string[]> = {
  hy: ['Կ', 'Ե', 'Ե', 'Չ', 'Հ', 'Ու', 'Շ'],
  ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
};

export function formatMonthYear(date: Date, language: AppLanguage): string {
  const value = `${MONTHS[language][date.getMonth()]} ${date.getFullYear()}`;
  return language === 'hy' ? `${value} թ.` : value;
}

export function formatFullDate(date: Date, language: AppLanguage): string {
  const weekday = WEEKDAYS[language][date.getDay()];
  const value = `${weekday}، ${date.getDate()} ${MONTHS[language][date.getMonth()]} ${date.getFullYear()}`;
  return language === 'hy' ? `${value} թ.` : value;
}

export function getWeekdayInitial(date: Date, language: AppLanguage): string {
  return WEEKDAY_INITIALS[language][date.getDay()];
}
