import { LessonData, pair } from '../types';

export const u21: LessonData = {
  id: "u21",
  title: "Թվեր և դրանց կիրառումը",
  titleAr: "الأعداد وتوظيفها",
  xpReward: 60,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "الأَعْدَاد",
      armenian: "Թվեր",
      transliteration: "al-aʿdād",
      hint: "3-10 թվերի հետ գոյականը դրվում է հոգնակի սեռական հոլովով (جمع مجرور):", 
      hintIcon: "🔢",
    },
    {
      id: 2, type: "quiz",
      arabic: "عِنْدِي ـ ـ ـ ؟ (كُتُب)",
      armenian: "Ես ունեմ ... (գրքեր)",
      transliteration: "ʿindī ... kutub",
      meaning: "Լրացրեք նախադասությունը ճիշտ թվով:",
      options: [
        { text: "ثَلَاثَةُ كُتُبٍ", correct: true },
        { text: "ثَلَاثَةُ كِتَابٍ", correct: false },
        { text: "ثَلَاثَةَ كُتُبًا", correct: false },
      ],
    },
    {
      id: 3, type: "quiz",
      arabic: "فِي القِسْمِ ـ ـ ـ ؟ (طُلَّاب)",
      armenian: "Դասարանում կան ... (ուսանողներ)",
      transliteration: "fī l-qismi ... ṭullāb",
      meaning: "Ընտրեք ճիշտ համադրությունը:",
      options: [
        { text: "خَمْسَةُ طُلَّابٍ", correct: true },
        { text: "خَمْسَ طُلَّابٍ", correct: false },
        { text: "خَمْسُونَ طُلَّابٍ", correct: false },
      ],
    },
    {
      id: 4, type: "quiz",
      arabic: "قَرَأْتُ ـ ـ ـ ؟ (دُرُوس)",
      armenian: "Ես կարդացի ... (դասեր)",
      transliteration: "qaraʾtu ... durūs",
      meaning: "Ընտրեք ճիշտ պատասխանը:",
      options: [
        { text: "سَبْعَةَ دُرُوسٍ", correct: true },
        { text: "سَبْعَةَ دَرْسٍ", correct: false },
        { text: "سَبْعُونَ دُرُوسٍ", correct: false },
      ],
    },
    {
      id: 5, type: "match",
      arabic: "مطابقة",
      armenian: "Համապատասխանեցում",
      transliteration: "",
      meaning: "Կապեք թվերը բառերի հետ:",
      pairs: [
        pair("ثَلَاثَةُ طُلَّابٍ", "Երեք ուսանող"),
        pair("خَمْسَةُ كُتُبٍ", "Հինգ գիրք"),
        pair("سَبْعَةُ أَيَّامٍ", "Յոթ օր"),
        pair("عَشَرَةُ رِجَالٍ", "Տաս տղամարդ"),
      ],
    },
    {
      id: 6, type: "write",
      arabic: "ثَلَاثَةُ كُتُبٍ",
      armenian: "Երեք գիրք",
      transliteration: "thalāthatu kutubin",
      meaning: "Գրե՛ք 'thalāthatu kutubin' արաբերեն:",
      hint: "ثلاثة كتب",
    },
    {
      id: 7, type: "quiz",
      arabic: "تصحيح الخطأ: خَمْسَةُ كِتَابٍ",
      armenian: "Ուղղեք սխալը՝ «Հինգ գիրք»:",
      transliteration: "Taṣḥīḥ: khamsatu kitābin",
      meaning: "Ինչպե՞ս է ճիշտ:",
      options: [
        { text: "خَمْسَةُ كُتُبٍ", correct: true },
        { text: "خَمْسُ كُتُبٍ", correct: false },
      ]
    }
  ],
};
