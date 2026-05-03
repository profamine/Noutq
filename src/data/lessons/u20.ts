import { LessonData, pair } from '../types';

export const u20: LessonData = {
  id: "u20",
  title: "Վերջնական թեստ",
  titleAr: "مراجعة شاملة",
  xpReward: 100,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "مُرَاجَعَة شَامِلَة — كُلُّ مَا تَعَلَّمْتَهُ",
      armenian: "Ամբողջական վերանայում — Ամեն ինչ, ինչ սովորել ես",
      transliteration: "murājaʿa shāmila — kullu mā taʿallamtahu",
      hint: "Վերջնական թեստ — u1-ից u19 բառերը", hintIcon: "📚",
    },
    {
      id: 2, type: "quiz",
      arabic: "كَيْفَ حَالُك؟", armenian: "Ինչպե՞ս ես:",
      transliteration: "kayfa ḥāluk?",
      meaning: "Ո՞րն է ճիշտ պատասխանը 'Լավ եմ':",
      options: [
        { text: "أَنَا بِخَيْر ✓", correct: true },
        { text: "أَنَا جَائِع ✗", correct: false },
        { text: "أَنَا نَائِم ✗", correct: false },
      ],
    },
    {
      id: 21, type: "quiz",
      arabic: "كَيْفَ حَالُك؟", armenian: "Ինչպե՞ս ես:", transliteration: "kayfa ḥāluk?",
      meaning: "Կրկնություն: 'Լավ եմ' արաբերեն:",
      options: [{ text: "أَنَا بِخَيْر ✓", correct: true }, { text: "أَنَا جَائِع ✗", correct: false }],
    },
    {
      id: 3, type: "quiz",
      arabic: "الكِتَابُ عَلَى المَكْتَبِ", armenian: "Գիրքը գրասեղանի վրա է",
      transliteration: "al-kitābu ʿalā l-maktabi",
      meaning: "Ի՞նչ է 'عَلَى' իմաստը:",
      options: [
        { text: "Մեջ (in) ✗", correct: false },
        { text: "Վրա (on) ✓", correct: true },
        { text: "Առջև (front) ✗", correct: false },
      ],
    },
    {
      id: 31, type: "quiz",
      arabic: "عَلَى", armenian: "Վրա (on)", transliteration: "ʿalā",
      meaning: "Կրկնություն: Ի՞նչ է 'عَلَى':",
      options: [{ text: "Մեջ", correct: false }, { text: "Վրա", correct: true }],
    },
    {
      id: 4, type: "match",
      arabic: "مراجعة", armenian: "Վերանայում", transliteration: "",
      meaning: "Վերջնական համապատասխանեցում — կապեք:",
      pairs: [
        pair("مَرْحَبًا", "Բարև"),
        pair("شُكْرًا", "Շնորհակալություն"),
        pair("نَعَم", "Այո"),
        pair("لَا", "Ոչ"),
      ],
    },
    {
      id: 5, type: "quiz",
      arabic: "أَنَا أَدْرُسُ العَرَبِيَّة", armenian: "Ես արաբերեն եմ սովորում",
      transliteration: "anā adrusu l-ʿarabiyya",
      meaning: "Ի՞նչ է 'أَدْرُسُ' իմաստը:",
      options: [
        { text: "Քնում եմ ✗", correct: false },
        { text: "Սովորում եմ ✓", correct: true },
        { text: "Գնում եմ ✗", correct: false },
      ],
    },
    {
      id: 6, type: "speak",
      arabic: "أَهْلًا، أَنَا اسْمِي ... أَنَا مِنْ أَرْمِينِيَا وَأَدْرُسُ العَرَبِيَّة",
      armenian: "Բարև, իմ անունն է ..., ես Հայաստանից եմ և արաբերեն եմ սովորում",
      transliteration: "ahlan, anā ismī … wa-anā min Armīniyā wa-adrusu l-ʿarabiyya",
      meaning: "Ամբողջական ներկայացման տեսք:", hintIcon: "🎙️",
    },
    {
      id: 7, type: "speak",
      arabic: "هَلْ تَتَكَلَّمُ العَرَبِيَّة؟ — نَعَم، قَلِيلًا، أَدْرُسُ!",
      armenian: "Արաբերեն խոսու՞մ ես: — Այո, մի փոքր, սովորում եմ:",
      transliteration: "hal tatakallamu l-ʿarabiyya? — naʿam, qalīlan, adrusu!",
      meaning: "Վերջնական երկխոսություն:", hintIcon: "🏆",
    },
    {
      id: 8, type: "write",
      arabic: "شُكْرًا", armenian: "Շնորհակալություն",
      transliteration: "shukran",
      meaning: "Գրե՛ք 'Շնորհակալություն' արաբերեն:",
      hint: "ش + ك + ر + ا + ً",
    },
  ],
};
