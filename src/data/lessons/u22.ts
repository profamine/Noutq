import { LessonData, pair } from '../types';

export const u22: LessonData = {
  id: "u22",
  title: "Քերականական ձայնավորներ",
  titleAr: "الحركات الإعرابية",
  xpReward: 60,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "الحَرَكَاتُ الإِعْرَابِيَّة",
      armenian: "Քերականական ձայնավորներ (Harakat)",
      transliteration: "al-ḥarakātu l-iʿrābiyya",
      hint: "Բայ՝ َ (fatha), Ենթակա՝ ُ (damma), Խնդիր՝ َ (fatha), Կապով/Նախդիրով՝ ِ (kasra)",
      hintIcon: "📝",
    },
    {
      id: 2, type: "quiz",
      arabic: "كَتَبَ ـ ـ ـ ؟ الدَّرْسَ",
      armenian: "Ուսանողը գրեց դասը:",
      transliteration: "kataba ... ad-darsa",
      meaning: "Տեղադրեք ճիշտ վերջավորությամբ գոյականը (Ենթակա):",
      options: [
        { text: "الطَّالِبُ ✓", correct: true },
        { text: "الطَّالِبَ ✗", correct: false },
        { text: "الطَّالِبِ ✗", correct: false },
      ],
    },
    {
      id: 3, type: "quiz",
      arabic: "ذَهَبَ الوَلَدُ إِلَى ـ ـ ـ ؟",
      armenian: "Տղան գնաց դպրոց:",
      transliteration: "dhahaba l-waladu ilā ...",
      meaning: "Տեղադրեք ճիշտ վերջավորությամբ գոյականը (إِلَى -ից հետո):",
      options: [
        { text: "المَدْرَسَةِ ✓", correct: true },
        { text: "المَدْرَسَةُ ✗", correct: false },
        { text: "المَدْرَسَةَ ✗", correct: false },
      ],
    },
    {
      id: 4, type: "quiz",
      arabic: "قَرَأَ الطَّالِبُ ـ ـ ـ ؟",
      armenian: "Ուսանողը գիրք կարդաց:",
      transliteration: "qaraʾa ṭ-ṭālibu ...",
      meaning: "Տեղադրեք ճիշտ վերջավորությամբ գոյականը (Ուղիղ խնդիր):",
      options: [
        { text: "الكِتَابَ ✓", correct: true },
        { text: "الكِتَابُ ✗", correct: false },
        { text: "الكِتَابِ ✗", correct: false },
      ],
    },
    {
      id: 5, type: "match",
      arabic: "الكلمة المناسبة",
      armenian: "Ճիշտ բառը",
      transliteration: "",
      meaning: "Կապեք նախադասությունները ճիշտ ձևերով:",
      pairs: [
        pair("هَذَا...", "كِتَابٌ (kitābun)"),
        pair("رَأَيْتُ...", "طَالِبًا (ṭāliban)"),
        pair("مَرَرْتُ بِـ...", "مُدَرِّسٍ (mudarrisin)"),
      ],
    },
    {
      id: 6, type: "quiz",
      arabic: "تصحيح الخطأ: جَاءَ الطَّالِبَ",
      armenian: "Ուղղեք սխալը (Եկավ ուսանողը):",
      transliteration: "Taṣḥīḥ: jāʾa ṭ-ṭāliba",
      meaning: "Ո՞րն է ճիշտ ձևը ենթակայի համար:",
      options: [
        { text: "جَاءَ الطَّالِبُ ✓", correct: true },
        { text: "جَاءَ الطَّالِبِ ✗", correct: false },
      ],
    },
    {
      id: 7, type: "write",
      arabic: "فِي البَيْتِ",
      armenian: "Տանը",
      transliteration: "fī l-bayti",
      meaning: "Գրե՛ք 'fī l-bayti':",
      hint: "في البيتِ",
    }
  ],
};
