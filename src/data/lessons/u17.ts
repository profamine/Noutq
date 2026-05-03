import { LessonData, pair } from '../types';

export const u17: LessonData = {
  id: "u17",
  title: "Գնումներ",
  titleAr: "التسوق",
  xpReward: 65,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "سُوق / دُكَّان / ثَمَن / غَالٍ / رَخِيص / أُرِيدُ",
      armenian: "Շուկա / Խանութ / Գին / Թանկ / Էժան / Ուզում եմ",
      transliteration: "sūq / dukkān / thaman / ghālin / rakhīṣ / urīdu",
      hint: "Գնումների հիմնական բառեր", hintIcon: "🛒",
    },
    {
      id: 2, type: "listen",
      arabic: "بِكَمْ هَذَا؟ — هَذَا بِعَشَرَةِ دَرَاهِم",
      armenian: "Ինչքա՞ն արժե սա: — Սա տասը դիրհամ է:",
      transliteration: "bikam hādhā? — hādhā bi-ʿasharat darāhim",
      hint: "بِكَمْ = ինչքա՞ն (how much) · دَرَاهِم = դիրհամներ", hintIcon: "💰",
    },
    {
      id: 3, type: "quiz",
      arabic: "غَالٍ", armenian: "Թանկ",
      transliteration: "ghālin",
      meaning: "Ո՞րն է 'غَالٍ' իմաստը:",
      options: [
        { text: "Էժան", correct: false },
        { text: "Թանկ", correct: true },
        { text: "Շուկա", correct: false },
        { text: "Գին", correct: false },
      ],
    },
    {
      id: 31, type: "quiz",
      arabic: "غَالٍ", armenian: "Թանկ", transliteration: "ghālin",
      meaning: "Կրկնություն: Ո՞րն է 'غَالٍ':",
      options: [{ text: "Էժան", correct: false }, { text: "Թանկ", correct: true }],
    },
    {
      id: 4, type: "listen",
      arabic: "أُرِيدُ أَنْ أَشْتَرِيَ هَذَا",
      armenian: "Ուզում եմ սա գնել",
      transliteration: "urīdu an ashtariya hādhā",
      hint: "أَشْتَرِيَ = գնել (to buy)", hintIcon: "🛍️",
    },
    {
      id: 5, type: "match",
      arabic: "التسوق", armenian: "Գնումներ", transliteration: "",
      meaning: "Կապեք գնումների բառերը:",
      pairs: [
        pair("سُوق", "Շուկա"),
        pair("غَالٍ", "Թանկ"),
        pair("رَخِيص", "Էժան"),
        pair("أُرِيدُ", "Ուզում եմ"),
      ],
    },
    {
      id: 6, type: "quiz",
      arabic: "بِكَمْ هَذَا؟", armenian: "Ինչքա՞ն արժե սա:",
      transliteration: "bikam hādhā?",
      meaning: "Ի՞նչ է 'بِكَمْ هَذَا؟' իմաստը:",
      options: [
        { text: "Ինչքա՞ն արժե սա: ✓", correct: true },
        { text: "Ի՞նչ է սա: ✗", correct: false },
        { text: "Որտե՞ղ է սա: ✗", correct: false },
      ],
    },
    {
      id: 7, type: "speak",
      arabic: "بِكَمْ هَذَا؟ — هَذَا غَالٍ",
      armenian: "Ինչքա՞ն արժե սա: — Սա թանկ է",
      transliteration: "bikam hādhā? — hādhā ghālin",
      meaning: "Կրկնեք երկխոսությունը:", hintIcon: "🎙️",
    },
    {
      id: 8, type: "write",
      arabic: "غَالٍ", armenian: "Թանկ",
      transliteration: "ghālin",
      meaning: "Գրե՛ք 'Թանկ' արաբերեն:",
      hint: "غ + ا + لٍ",
    },
  ],
};
