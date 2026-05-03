import { LessonData, pair } from '../types';

export const u5: LessonData = {
  id: "u5",
  title: "Թվեր 1-10 (الأرقام)",
  titleAr: "الأرقام من 1 إلى 10",
  xpReward: 50,
  steps: [
    { id: 1, type: "listen", arabic: "وَاحِد", armenian: "մեկ (1)", transliteration: "wāḥid", hintIcon: "1️⃣" },
    { id: 2, type: "listen", arabic: "اِثْنَان", armenian: "երկու (2)", transliteration: "ithnān", hintIcon: "2️⃣" },
    { id: 3, type: "listen", arabic: "ثَلَاثَة", armenian: "երեք (3)", transliteration: "thalātha", hintIcon: "3️⃣" },
    { id: 4, type: "listen", arabic: "أَرْبَعَة", armenian: "չորս (4)", transliteration: "arbaʿa", hintIcon: "4️⃣" },
    { id: 5, type: "listen", arabic: "خَمْسَة", armenian: "հինգ (5)", transliteration: "khamsa", hintIcon: "5️⃣" },
    { id: 6, type: "listen", arabic: "سِتَّة", armenian: "վեց (6)", transliteration: "sitta", hintIcon: "6️⃣" },
    { id: 7, type: "listen", arabic: "سَبْعَة", armenian: "յոթ (7)", transliteration: "sabʿa", hintIcon: "7️⃣" },
    
    {
      id: 8,
      type: "match",
      arabic: "أرقام الجزء الأول",
      armenian: "Մաս 1-ի թվերը",
      transliteration: "",
      meaning: "Համապատասխանեցրեք թվերը՝",
      pairs: [
        pair("وَاحِد (1)", "Մեկ (1)"),
        pair("اِثْنَان (2)", "Երկու (2)"),
        pair("ثَلَاثَة (3)", "Երեք (3)"),
        pair("أَرْبَعَة (4)", "Չորս (4)"),
      ],
    },
    
    { id: 9, type: "listen", arabic: "ثَمَانِيَة", armenian: "ութ (8)", transliteration: "thamāniya", hintIcon: "8️⃣" },
    { id: 10, type: "listen", arabic: "تِسْعَة", armenian: "ինը (9)", transliteration: "tisʿa", hintIcon: "9️⃣" },
    { id: 11, type: "listen", arabic: "عَشَرَة", armenian: "տասը (10)", transliteration: "ʿashara", hintIcon: "🔟" },
    
    {
      id: 12,
      type: "match",
      arabic: "أرقام الجزء الثاني",
      armenian: "Մաս 2-ի թվերը",
      transliteration: "",
      meaning: "Համապատասխանեցրեք թվերը՝",
      pairs: [
        pair("خَمْسَة (5)", "Հինգ (5)"),
        pair("سِتَّة (6)", "Վեց (6)"),
        pair("سَبْعَة (7)", "Յոթ (7)"),
      ],
    },
    
    {
      id: 13,
      type: "match",
      arabic: "أرقام الجزء الثالث",
      armenian: "Մաս 3-ի թվերը",
      transliteration: "",
      meaning: "Համապատասխանեցրեք թվերը՝",
      pairs: [
        pair("ثَمَانِيَة (8)", "Ութ (8)"),
        pair("تِسْعَة (9)", "Ինը (9)"),
        pair("عَشَرَة (10)", "Տասը (10)"),
      ],
    },
    
    {
      id: 14,
      type: "quiz",
      arabic: "عَشَرَة",
      armenian: "տասը (10)",
      transliteration: "ʿashara",
      meaning: "Ո՞րն է 'عَشَرَة' բառի ճիշտ թարգմանությունը:",
      options: [
        { text: "Հինգ (5)", correct: false },
        { text: "Յոթ (7)", correct: false },
        { text: "Տասը (10)", correct: true },
      ],
    },
    {
      id: 141,
      type: "quiz",
      arabic: "عَشَرَة",
      armenian: "տասը (10)",
      transliteration: "ʿashara",
      meaning: "Կրկնություն: Ո՞րն է 'عَشَرَة' բառի ճիշտ թարգմանությունը:",
      options: [
        { text: "Հինգ (5)", correct: false },
        { text: "Տասը (10)", correct: true },
      ],
    },
    {
      id: 15,
      type: "write",
      arabic: "وَاحِد",
      armenian: "մեկ (1)",
      transliteration: "wāḥid",
      meaning: "Գրե՛ք '1' արաբերեն:",
      hint: "و + ا + ح + د",
    },
    {
      id: 16,
      type: "speak",
      arabic: "وَاحِد، اِثْنَان، ثَلَاثَة",
      armenian: "Մեկ, երկու, երեք",
      transliteration: "wāḥid, ithnān, thalātha",
      meaning: "Արտասանե՛ք թվերը 1-ից 3-ը:",
      hintIcon: "🎙️",
    },
  ],
};
