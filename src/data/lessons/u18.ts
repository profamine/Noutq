import { LessonData, pair } from '../types';

export const u18: LessonData = {
  id: "u18",
  title: "Ուղղություններ",
  titleAr: "الاتجاهات",
  xpReward: 65,
  steps: [
    {
      id: 1, type: "listen",
      arabic: "يَمِين / يَسَار / أَمَامَ / خَلْفَ / مُسْتَقِيم / اِذْهَبْ",
      armenian: "Աջ / Ձախ / Առջև / Հետև / Ուղիղ / Գնա",
      transliteration: "yamīn / yasār / amāma / khalfa / mustaqīm / idhhab",
      hint: "Ուղղությունների հասկացություններ", hintIcon: "🧭",
    },
    {
      id: 2, type: "listen",
      arabic: "اِذْهَبْ يَمِينًا ثُمَّ يَسَارًا",
      armenian: "Գնա աջ, ապա ձախ",
      transliteration: "idhhab yamīnan thumma yasāran",
      hint: "اِذْهَبْ = գնա (go!) · ثُمَّ = ապա (then)", hintIcon: "🗺️",
    },
    {
      id: 3, type: "quiz",
      arabic: "يَمِين", armenian: "Աջ",
      transliteration: "yamīn",
      meaning: "Ո՞րն է 'يَمِين' իմաստը:",
      options: [
        { text: "Ձախ ✗", correct: false },
        { text: "Աջ ✓", correct: true },
        { text: "Առջև ✗", correct: false },
        { text: "Հետև ✗", correct: false },
      ],
    },
    {
      id: 31, type: "quiz",
      arabic: "يَمِين", armenian: "Աջ", transliteration: "yamīn",
      meaning: "Կրկնություն: Ո՞րն է 'يَمِين':",
      options: [{ text: "Ձախ", correct: false }, { text: "Աջ", correct: true }],
    },
    {
      id: 4, type: "listen",
      arabic: "أَيْنَ ٱلْمَحَطَّة؟ — اِمْشِ مُسْتَقِيمًا",
      armenian: "Որտե՞ղ է կայարանը: — Գնա ուղիղ",
      transliteration: "ayna l-maḥaṭṭa? — imshi mustaqīman",
      hint: "المَحَطَّة = կայարան · اِمْشِ = քայլիր/գնա (walk!)", hintIcon: "🚉",
    },
    {
      id: 5, type: "match",
      arabic: "الاتجاهات", armenian: "Ուղղություններ", transliteration: "",
      meaning: "Կապեք ուղղությունները:",
      pairs: [
        pair("يَمِين", "Աջ"),
        pair("يَسَار", "Ձախ"),
        pair("أَمَامَ", "Առջև"),
        pair("خَلْفَ", "Հետև"),
      ],
    },
    {
      id: 6, type: "quiz",
      arabic: "اِذْهَبْ", armenian: "Գնա",
      transliteration: "idhhab",
      meaning: "Ի՞նչ է 'اِذْهَبْ' իմաստը:",
      options: [
        { text: "Գնա ✓", correct: true },
        { text: "Արի ✗", correct: false },
        { text: "Կանգնիր ✗", correct: false },
      ],
    },
    {
      id: 7, type: "speak",
      arabic: "اِذْهَبْ يَمِينًا ثُمَّ مُسْتَقِيمًا",
      armenian: "Գնա աջ, ապա ուղիղ",
      transliteration: "idhhab yamīnan thumma mustaqīman",
      meaning: "Կրկնեք նախադասությունը:", hintIcon: "🎙️",
    },
    {
      id: 8, type: "write",
      arabic: "يَمِين", armenian: "Աջ",
      transliteration: "yamīn",
      meaning: "Գրե՛ք 'Աջ' արաբերեն:",
      hint: "ي + م + ي + ن",
    },
  ],
};
