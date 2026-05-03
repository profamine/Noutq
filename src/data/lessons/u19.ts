import { LessonData, pair } from '../types';

export const u19: LessonData = {
  id: "u19",
  title: "Օրվա կյանք",
  titleAr: "الروتين اليومي",
  xpReward: 65,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "أَسْتَيْقِظُ / أَفْطِرُ / أَعْمَلُ / أَدْرُسُ / أَنَامُ",
      armenian: "Արթնանում եմ / Նախաճաշում եմ / Աշխատում եմ / Սովորում եմ / Քնում եմ",
      transliteration: "astayqiẓu / afṭiru / aʿmalu / adrusu / anāmu",
      hint: "Առօրյա գործունեության բայեր", hintIcon: "⏰",
    },
    {
      id: 2, type: "listen",
      arabic: "أَسْتَيْقِظُ السَّاعَة السَّابِعَة صَبَاحًا",
      armenian: "Զարթնում եմ ժամը յոթին առավոտյան",
      transliteration: "astayqiẓu s-sāʿata s-sābiʿa ṣabāḥan",
      hint: "السَّاعَة السَّابِعَة = ժամը յոթին (7 o'clock) · صَبَاحًا = առավոտյան", hintIcon: "🌅",
    },
    {
      id: 3, type: "listen",
      arabic: "أَعْمَلُ",
      armenian: "Ես աշխատում եմ",
      transliteration: "aʿmalu",
      hint: "أَعْمَلُ = I work · արմատը՝ عَمِلَ", hintIcon: "💼",
    },
    {
      id: 4, type: "quiz",
      arabic: "أَنَامُ", armenian: "Քնում եմ",
      transliteration: "anāmu",
      meaning: "Ո՞րն է 'أَنَامُ' իմաստը:",
      options: [
        { text: "Զարթնում եմ ✗", correct: false },
        { text: "Քնում եմ ✓", correct: true },
        { text: "Ուտում եմ ✗", correct: false },
        { text: "Գնում եմ ✗", correct: false },
      ],
    },
    {
      id: 41, type: "quiz",
      arabic: "أَنَامُ", armenian: "Քնում եմ", transliteration: "anāmu",
      meaning: "Կրկնություն: Ո՞րն է 'أَنَامُ':",
      options: [{ text: "Զարթնում եմ", correct: false }, { text: "Քնում եմ", correct: true }],
    },
    {
      id: 5, type: "match",
      arabic: "الروتين", armenian: "Օրվա կյանք", transliteration: "",
      meaning: "Կապեք բայերը իրենց իմաստներին:",
      pairs: [
        pair("أَسْتَيْقِظُ", "Զարթնում եմ"),
        pair("أَعْمَلُ", "Աշխատում եմ"),
        pair("أَدْرُسُ", "Սովորում եմ"),
        pair("أَنَامُ", "Քնում եմ"),
      ],
    },
    {
      id: 6, type: "quiz",
      arabic: "صَبَاحًا", armenian: "Առավոտյան",
      transliteration: "ṣabāḥan",
      meaning: "Ի՞նչ է 'صَبَاحًا' իմաստը:",
      options: [
        { text: "Առավոտյան ✓", correct: true },
        { text: "Կեսօրին ✗", correct: false },
        { text: "Երեկոյան ✗", correct: false },
      ],
    },
    {
      id: 7, type: "speak",
      arabic: "أَسْتَيْقِظُ صَبَاحًا وَأَعْمَلُ وَأَنَامُ مُبَكِّرًا",
      armenian: "Առավոտյան արթնանում եմ, աշխատում եմ և շուտ քնում եմ",
      transliteration: "astayqiẓu ṣabāḥan wa-aʿmalu wa-anāmu mubakkiran",
      meaning: "Կրկնեք նախադասությունը:", hintIcon: "🎙️",
    },
    {
      id: 8, type: "write",
      arabic: "أَنَامُ", armenian: "Քնում եմ",
      transliteration: "anāmu",
      meaning: "Գրե՛ք 'Քնում եմ' արաբերեն:",
      hint: "أ + ن + ا + م + ُ",
    },
  ],
};
