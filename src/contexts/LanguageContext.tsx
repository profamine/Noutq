import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'hy' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Bottom Nav
  'nav.home': { hy: 'Գլխավոր', ar: 'الرئيسية' },
  'nav.practice': { hy: 'Վարժություն', ar: 'تدريب' },
  'nav.chat': { hy: 'Զրույց (AI)', ar: 'محادثة (AI)' },
  'nav.profile': { hy: 'Պրոֆիլ', ar: 'حسابي' },
  'nav.streak_banner': { hy: 'օր անընդմեջ', ar: 'أيام متتالية' },

  // Home Screen
  'home.title': { hy: 'Արաբերեն', ar: 'العربية' },
  'home.subtitle': { hy: 'Մակարդակ A1 · 600 բառ', ar: 'المستوى A1 · 600 كلمة' },
  'home.unit1.title': { hy: 'Միավոր 1: Տառեր', ar: 'الوحدة 1: الحروف' },
  'home.unit1.subtitle': { hy: 'Տառեր և հիմնական շարժումներ', ar: 'الحروف والحركات الأساسية' },
  'home.unit2.title': { hy: 'Միավոր 2: Երկարացումներ', ar: 'الوحدة 2: المدود' },
  'home.unit2.subtitle': { hy: 'Երկարացումներ և կարճ բառեր', ar: 'المدود وكلمات قصيرة' },
  'home.unit3.title': { hy: 'Միավոր 3: Թանուին', ar: 'الوحدة 3: التنوين' },
  'home.unit3.subtitle': { hy: 'Թանուին ընդհանուր', ar: 'التنوين' },
  'home.unit4.title': { hy: 'Միավոր 4: Իրաբ', ar: 'الوحدة 4: الحركات الإعرابية' },
  'home.unit4.subtitle': { hy: 'Հիմնական «իրաբ»', ar: 'الحركات الإعرابية الأولى' },
  'home.unit5.title': { hy: 'Միավոր 5: Թվեր', ar: 'الوحدة 5: الأعداد' },
  'home.unit5.subtitle': { hy: 'Թվեր 1–10', ar: 'الأعداد من 1 إلى 10' },
  'home.unit6.title': { hy: 'Միավոր 6: Բայեր', ar: 'الوحدة 6: أفعال وضمائر' },
  'home.unit6.subtitle': { hy: 'Հիմնական բայեր և դերանուններ', ar: 'أفعال أساسية وضمائر' },
  'home.unit7.title': { hy: 'Միավոր 7: Ծանոթություն', ar: 'الوحدة 7: التعارف' },
  'home.unit7.subtitle': { hy: 'Ծանոթություն և պարզ նախադասություններ', ar: 'التعارف وجمل بسيطة' },
  'home.unit8.title': { hy: 'Միավոր 8: Ժամանակ', ar: 'الوحدة 8: الوقت' },
  'home.unit8.subtitle': { hy: 'Ժամանակ, օրեր և ամիսներ', ar: 'الوقت وأيام الأسبوع وشهور السنة' },
  'home.unit9.title': { hy: 'Միավոր 9: Գույներ', ar: 'الوحدة 9: الألوان' },
  'home.unit9.subtitle': { hy: 'Արաբերենի հիմնական գույները', ar: 'الألوان الأساسية' },
  'home.unit10.title': { hy: 'Միավոր 10: Ընտանիք', ar: 'الوحدة 10: العائلة' },
  'home.unit10.subtitle': { hy: 'Ընտանիքի անդամներ', ar: 'أفراد العائلة' },
  'home.unit11.title': { hy: 'Միավոր 11: Ուտելիք', ar: 'الوحدة 11: الطعام' },
  'home.unit11.subtitle': { hy: 'Ուտելիքներ և ըմպելիքներ', ar: 'الطعام والشراب' },
  'home.unit12.title': { hy: 'Միավոր 12: Տեղեր', ar: 'الوحدة 12: الأماكن' },
  'home.unit12.subtitle': { hy: 'Տեղեր և նախդիրներ', ar: 'الأماكن وحروف الجر' },
  'home.unit13.title': { hy: 'Միավոր 13: Մարմնամասեր', ar: 'الوحدة 13: أعضاء الجسم' },
  'home.unit13.subtitle': { hy: 'Մարմնի մասերն արաբերեն', ar: 'أعضاء الجسم بالعربية' },
  'home.unit14.title': { hy: 'Միավոր 14: Եղանակային', ar: 'الوحدة 14: الطقس' },
  'home.unit14.subtitle': { hy: 'Եղանակային և կլիմայական', ar: 'الطقس والمناخ' },
  'home.unit15.title': { hy: 'Միավոր 15: Դպրոցում', ar: 'الوحدة 15: في المدرسة' },
  'home.unit15.subtitle': { hy: 'Դպրոցում արաբերեն', ar: 'المفردات المدرسية' },
  'home.unit16.title': { hy: 'Միավոր 16: Խոսում եմ', ar: 'الوحدة 16: أتحدث عربياً' },
  'home.unit16.subtitle': { hy: 'Լիակատար զրույց արաբերենով', ar: 'محادثة كاملة بالعربية' },
  'home.unit17.title': { hy: 'Միավոր 17: Գնումներ', ar: 'الوحدة 17: التسوق' },
  'home.unit17.subtitle': { hy: 'Գնումներ և գին', ar: 'التسوق والأسعار' },
  'home.unit18.title': { hy: 'Միավոր 18: Ուղղություններ', ar: 'الوحدة 18: الاتجاهات' },
  'home.unit18.subtitle': { hy: 'Ուղղություններ արաբերեն', ar: 'الاتجاهات بالعربية' },
  'home.unit19.title': { hy: 'Միավոր 19: Օրվա կյանք', ar: 'الوحدة 19: الروتين' },
  'home.unit19.subtitle': { hy: 'Օրական գործունեություններ', ar: 'الروتين اليومي' },
  'home.unit20.title': { hy: 'Միավոր 20: Վերջնական թեստ', ar: 'الوحدة 20: المراجعة' },
  'home.unit20.subtitle': { hy: 'Ամբողջական վերջնական թեստ', ar: 'مراجعة شاملة ونهائية' },
  'home.unit21.title': { hy: 'Միավոր 21: Թվերի կիրառում', ar: 'الوحدة 21: توظيف الأعداد' },
  'home.unit21.subtitle': { hy: 'Արաբական թվեր և դրանց կիրառումը', ar: 'الأعداد وتوظيفها في جمل' },
  'home.unit22.title': { hy: 'Միավոր 22: Հարաքաթներ', ar: 'الوحدة 22: الحركات الإعرابية' },
  'home.unit22.subtitle': { hy: 'Քերականական ձայնավորներ', ar: 'الحركات الإعرابية والجر' },

  'home.completed': { hy: 'Ավարտված', ar: 'مكتمل' },
  'home.current_lesson': { hy: 'Հաջորդ առաջարկվող դասը', ar: 'الدرس التالي المقترح' },
  'home.available': { hy: 'Հասանելի դաս', ar: 'درس متاح' },
  'home.start': { hy: 'Սկսել →', ar: 'ابدأ →' },
  'home.lessons_completed': { hy: 'դաս ավարտված', ar: 'درس مكتمل' },

  'home.node.u1': { hy: 'Տառեր', ar: 'الحروف' },
  'home.node.u2': { hy: 'Երկարացումներ', ar: 'المدود' },
  'home.node.u3': { hy: 'Թանուին', ar: 'التنوين' },
  'home.node.u4': { hy: 'Իրաբ', ar: 'الإعراب' },
  'home.node.u5': { hy: 'Թվեր', ar: 'الأعداد' },
  'home.node.u6': { hy: 'Բայեր', ar: 'أفعال' },
  'home.node.u7': { hy: 'Ծանոթություն', ar: 'تعارف' },
  'home.node.u8': { hy: 'Ժամանակ', ar: 'الوقت' },
  'home.node.u9': { hy: 'Գույներ', ar: 'الألوان' },
  'home.node.u10': { hy: 'Ընտանիք', ar: 'العائلة' },
  'home.node.u11': { hy: 'Ուտելիք', ar: 'الطعام' },
  'home.node.u12': { hy: 'Տեղեր', ar: 'الأماكن' },
  'home.node.u13': { hy: 'Մարմին', ar: 'الجسم' },
  'home.node.u14': { hy: 'Եղանակ', ar: 'الطقس' },
  'home.node.u15': { hy: 'Դպրոցում', ar: 'المدرسة' },
  'home.node.u16': { hy: 'Խոսում եմ', ar: 'أتحدث' },
  'home.node.u17': { hy: 'Գնումներ', ar: 'التسوق' },
  'home.node.u18': { hy: 'Ուղղություններ', ar: 'الاتجاهات' },
  'home.node.u19': { hy: 'Օրվա կյանք', ar: 'الروتين' },
  'home.node.u20': { hy: 'Թեստ', ar: 'الاختبار' },
  'home.node.u21': { hy: 'Թվերի կիրառում', ar: 'الأعداد' },
  'home.node.u22': { hy: 'Հարաքաթներ', ar: 'الحركات' },

  // Lesson Screen
  'arabic': { hy: 'Արաբերեն', ar: 'العربية' },
  'armenian': { hy: 'Հայերեն', ar: 'الأرمينية' },
  'lesson.listen_and_learn': { hy: 'Լսել և սովորել', ar: 'استمع وتعلم' },
  'lesson.speak': { hy: 'Խոսել', ar: 'تحدث' },
  'lesson.quiz': { hy: 'Թեստ', ar: 'اختبار' },
  'lesson.match': { hy: 'Համապատասխանեցնել', ar: 'مطابقة' },
  'lesson.write': { hy: 'Գրել', ar: 'اكتب' },
  'lesson.listen_and_read': { hy: 'Լսեք և կարդացեք', ar: 'استمع واقرأ' },
  'lesson.pronounce_sentence': { hy: 'Արտասանեք այս նախադասությունը', ar: 'انطق هذه الجملة' },
  'lesson.hide_transliteration': { hy: 'Թաքցնել տառադարձությունը', ar: 'إخفاء النطق' },
  'lesson.show_transliteration': { hy: 'Ցույց տալ տառադարձությունը', ar: 'إظهار النطق' },
  'lesson.hide_hint': { hy: 'Թաքցնել հուշումը', ar: 'إخفاء التلميح' },
  'lesson.show_hint': { hy: 'Ցույց տալ հուշումը', ar: 'إظهار التلميح' },
  'lesson.excellent': { hy: 'Գերազանց է! 🌟', ar: 'ممتاز! 🌟' },
  'lesson.excellent_desc': { hy: 'Շատ լավ արտասանություն +15 XP', ar: 'نطق رائع جداً +15 XP' },
  'lesson.good': { hy: 'Լավ է! 👍', ar: 'جيد! 👍' },
  'lesson.good_desc': { hy: 'Կարող եք ավելի լավ +8 XP', ar: 'يمكنك أن تفعل أفضل +8 XP' },
  'lesson.poor': { hy: 'Փորձեք նորից 💪', ar: 'حاول مرة أخرى 💪' },
  'lesson.poor_desc': { hy: 'Արտասանությունը պարզ չէր', ar: 'النطق لم يكن واضحاً' },
  'lesson.continue': { hy: 'Շարունակել', ar: 'متابعة' },
  'lesson.finish': { hy: 'Ավարտել դասը', ar: 'إنهاء الدرس' },
  'lesson.skip': { hy: 'Բաց թողնել →', ar: 'تخطي →' },
  'lesson.quit_title': { hy: 'Իսկապե՞ս ուզում եք դուրս գալ:', ar: 'هل تريد الخروج حقاً؟' },
  'lesson.quit_desc': { hy: 'Կարող եք ավելի ուշ շարունակել այս քայլից', ar: 'يمكنك المتابعة لاحقاً من هذه الخطوة' },
  'lesson.stay': { hy: 'Մնալ', ar: 'البقاء' },
  'lesson.quit': { hy: 'Դուրս գալ', ar: 'خروج' },
  'lesson.out_of_lives': { hy: 'Կյանքերը սպառվեցին!', ar: 'نفدت المحاولات!' },
  'lesson.out_of_lives_desc': { hy: 'Մի անհանգստացեք, փորձեք նորից', ar: 'لا تقلق، حاول مرة أخرى' },
  'lesson.try_again': { hy: 'Փորձել նորից', ar: 'حاول مرة أخرى' },
  'lesson.go_back': { hy: 'Վերադառնալ', ar: 'رجوع' },
  'lesson.lesson_complete': { hy: 'Գերազանց է!', ar: 'ممتاز!' },
  'lesson.lesson_complete_desc': { hy: 'Դուք ավարտեցիք դասը', ar: 'لقد أنهيت الدرس' },
  'lesson.xp_earned': { hy: 'XP վաստակած', ar: 'XP المكتسبة' },
  'lesson.accuracy': { hy: 'Ճշգրտություն', ar: 'الدقة' },
  'lesson.time': { hy: 'Ժամանակ', ar: 'الوقت' },
  'lesson.streak_bonus': { hy: 'Շարունակական բոնուս', ar: 'مكافأة متتالية' },
  'lesson.streak_fire': { hy: 'Շարունակական! 🔥', ar: 'متتالية! 🔥' },
  'lesson.translate_this': { hy: 'Թարգմանեք այս նախադասությունը', ar: 'ترجم هذه الجملة' },
  'lesson.check': { hy: 'Ստուգել', ar: 'تحقق' },
  'lesson.correct_answer_is': { hy: 'Ճիշտ պատասխանն է՝', ar: 'الإجابة الصحيحة هي:' },
  'lesson.resume_title': { hy: 'Շարունակե՞լ', ar: 'متابعة الدرس؟' },
  'lesson.resume_question': { hy: 'Ցանկանո՞ւմ եք շարունակել այնտեղից, որտեղ կանգ եք առել։', ar: 'هل تريد المتابعة من حيث توقفت؟' },
  'lesson.restart': { hy: 'Սկսել նորից', ar: 'البدء من جديد' },

  // Profile Screen
  'profile.stats': { hy: 'Վիճակագրություն', ar: 'الإحصائيات' },
  'profile.streak': { hy: 'Օր անընդմեջ', ar: 'أيام متتالية' },
  'profile.lessons_done': { hy: 'Ավարտած դասեր', ar: 'دروس مكتملة' },
  'profile.achievements': { hy: 'Նվաճումներ', ar: 'الإنجازات' },
  'profile.goals': { hy: 'Նպատակներ', ar: 'الأهداف' },
  'profile.see_all': { hy: 'Տեսնել բոլորը →', ar: 'عرض الكل →' },
  'profile.calendar': { hy: 'Ուսումնական օրացույց', ar: 'تقويم التعلم' },
  'profile.learned': { hy: 'Սովորել է', ar: 'تَعَلَّم' },
  'profile.missed': { hy: 'Բաց է թողել', ar: 'فوّت' },
  'profile.ach1.title': { hy: 'Առաջին քայլեր', ar: 'الخطوات الأولى' },
  'profile.ach1.desc': { hy: 'Ավարտել առաջին դասը', ar: 'أكمل الدرس الأول' },
  'profile.ach2.title': { hy: 'Կրակոտ շաբաթ', ar: 'أسبوع ناري' },
  'profile.ach2.desc': { hy: '7 օր անընդմեջ սովորել', ar: 'تعلم 7 أيام متتالية' },
  'profile.ach3.title': { hy: 'Բառապաշար', ar: 'المفردات' },
  'profile.ach3.desc': { hy: 'Ավարտել 10 դաս', ar: 'أكمل 10 دروس' },
  'profile.ach4.title': { hy: 'Ամբողջական ուղի', ar: 'المسار الكامل' },
  'profile.ach4.desc': { hy: 'Ավարտել բոլոր 22 դասերը', ar: 'أكمل جميع الدروس الـ 22' },
  'profile.ach5.title': { hy: 'Լավ սկիզբ', ar: 'بداية جيدة' },
  'profile.ach5.desc': { hy: 'Ավարտել 5 դաս', ar: 'أكمل 5 دروس' },
  'profile.ach6.title': { hy: 'Աշխատասեր', ar: 'مجتهد' },
  'profile.ach6.desc': { hy: 'Հավաքել 500 XP', ar: 'اجمع 500 XP' },
  'profile.ach7.title': { hy: 'Երկաթե կամք', ar: 'إرادة حديدية' },
  'profile.ach7.desc': { hy: '30 օր անընդմեջ սովորել', ar: 'تعلم 30 يوماً متتالياً' },
  'profile.ach8.title': { hy: 'Գիտակ', ar: 'خبير' },
  'profile.ach8.desc': { hy: 'Հավաքել 2000 XP', ar: 'اجمع 2000 XP' },
  'profile.ach9.title': { hy: 'Լեգենդ', ar: 'أسطورة' },
  'profile.ach9.desc': { hy: '100 օր անընդմեջ սովորել', ar: 'تعلم 100 يوم متتالٍ' },
  'profile.edit_name': { hy: 'Խմբագրել անունը', ar: 'تعديل الاسم' },
  'profile.save': { hy: 'Պահպանել', ar: 'حفظ' },
  'profile.language': { hy: 'Լեզու', ar: 'اللغة' },
  'profile.member_since': { hy: 'Անդամ՝ 2026-ից', ar: 'عضو منذ 2026' },
  'profile.bronze_league': { hy: 'Բրոնզե լիգա', ar: 'الدوري البرونزي' },
  'profile.league.bronze': { hy: 'Բրոնզե լիգա', ar: 'الدوري البرونزي' },
  'profile.league.silver': { hy: 'Արծաթե լիգա', ar: 'الدوري الفضي' },
  'profile.league.gold': { hy: 'Ոսկե լիգա', ar: 'الدوري الذهبي' },
  'profile.league.diamond': { hy: 'Ադամանդե լիգա', ar: 'دوري الماس' },
  'profile.league.master': { hy: 'Վարպետների լիգա', ar: 'دوري الأساتذة' },
  'profile.league.to_next': { hy: 'XP մինչև', ar: 'XP حتى' },
  'profile.league.max': { hy: 'Առավելագույն մակարդակ', ar: 'أعلى مستوى' },
  'profile.days_month': { hy: 'Ամսվա օր', ar: 'يوم في الشهر' },
  'profile.streak_label': { hy: 'Շարունակական', ar: 'متتالية' },
  'profile.monthly_label': { hy: 'Ամսական', ar: 'شهري' },
  'profile.settings': { hy: 'Պարամետրեր', ar: 'الإعدادات' },
  'profile.daily_reminders': { hy: 'Ամենօրյա հիշեցումներ', ar: 'التذكيرات اليومية' },
  'profile.reminder_time': { hy: 'Ամեն օր՝ 19:00', ar: 'يومياً — 19:00' },
  'profile.toggle_reminders': { hy: 'Միացնել կամ անջատել ամենօրյա հիշեցումները', ar: 'تشغيل التذكيرات اليومية أو إيقافها' },
  'profile.streak_freeze.title': { hy: 'Շարունակականության պաշտպանություն', ar: 'حماية التتابع' },
  'profile.streak_freeze.desc': { hy: 'Բաց թողած մեկ օրը չի ընդհատի ձեր շարունակականությունը', ar: 'يوم فائت واحد لن يوقف تتابعك' },
  'profile.streak_freeze.available': { hy: 'հասանելի', ar: 'متاحة' },
  'profile.daily_goal.title': { hy: 'Օրական նպատակ', ar: 'الهدف اليومي' },
  'profile.daily_goal.progress': { hy: 'այսօր', ar: 'اليوم' },
  'profile.daily_goal.choose': { hy: 'Ընտրեք ձեր օրական նպատակը', ar: 'اختر هدفك اليومي' },
  'profile.theme.title': { hy: 'Տեսք', ar: 'المظهر' },
  'profile.theme.light': { hy: 'Բաց', ar: 'فاتح' },
  'profile.theme.dark': { hy: 'Մուգ', ar: 'داكن' },
  'profile.theme.system': { hy: 'Համակարգային', ar: 'تلقائي' },
  'profile.backup.title': { hy: 'Տվյալների կրկնօրինակում', ar: 'نسخ احتياطي للبيانات' },
  'profile.backup.desc': { hy: 'Պահպանեք ձեր առաջընթացը ֆայլում կամ վերականգնեք այն', ar: 'احفظ تقدمك في ملف أو استعده' },
  'profile.backup.export': { hy: 'Արտահանել', ar: 'تصدير' },
  'profile.backup.import': { hy: 'Ներմուծել', ar: 'استيراد' },
  'profile.backup.import_confirm': { hy: 'Սա կփոխարինի ընթացիկ առաջընթացը։ Շարունակե՞լ։', ar: 'سيستبدل هذا تقدمك الحالي. متابعة؟' },
  'profile.backup.import_done': { hy: 'Տվյալները վերականգնվեցին', ar: 'تم استعادة البيانات' },
  'profile.backup.import_error': { hy: 'Ֆայլը վավեր չէ', ar: 'الملف غير صالح' },

  // Chat Screen
  'chat.title': { hy: 'AI Ուսուցիչ', ar: 'المعلم الذكي' },
  'chat.status': { hy: 'Առցանց · Պատրաստ է օգնել', ar: 'متصل · جاهز للمساعدة' },
  'chat.status_checking': { hy: 'Ծառայության ստուգում…', ar: 'جارٍ التحقق من الخدمة…' },
  'chat.status_unavailable': { hy: 'AI ծառայությունը հասանելի չէ', ar: 'خدمة الذكاء الاصطناعي غير متاحة' },
  'chat.status_offline': { hy: 'Անցանց ռեժիմ', ar: 'غير متصل' },
  'chat.error_unavailable': { hy: 'AI ուսուցիչն այժմ հասանելի չէ։ Դասերն ու տեղական ձայնագրությունները շարունակում են աշխատել։', ar: 'المعلم الذكي غير متاح حالياً. ما زالت الدروس والتسجيلات المحلية تعمل.' },
  'chat.error_timeout': { hy: 'Հարցման ժամանակը սպառվեց։ Կրկին փորձեք։', ar: 'انتهت مهلة الطلب. يرجى المحاولة مجدداً.' },
  'chat.error_generic': { hy: 'Չհաջողվեց կապվել AI ուսուցչի հետ։ Կրկին փորձեք ավելի ուշ։', ar: 'تعذّر الاتصال بالمعلم الذكي. يرجى المحاولة لاحقاً.' },
  'chat.error_rate_limited': { hy: 'Չափազանց շատ հարցումներ։ Սպասեք մեկ րոպե և կրկին փորձեք։', ar: 'طلبات كثيرة جداً. انتظر دقيقة وحاول مجدداً.' },
  'chat.offline_saved': { hy: 'Հաղորդագրությունը պահպանված է անցանց ռեժիմում', ar: 'تم حفظ الرسالة في وضع عدم الاتصال' },
  'chat.send': { hy: 'Ուղարկել հաղորդագրությունը', ar: 'إرسال الرسالة' },
  'chat.record': { hy: 'Ձայնագրել հաղորդագրություն', ar: 'تسجيل رسالة صوتية' },
  'chat.stop_recording': { hy: 'Դադարեցնել ձայնագրումը', ar: 'إيقاف التسجيل' },
  'chat.clear': { hy: 'Ջնջել զրույցը', ar: 'مسح المحادثة' },
  'chat.settings': { hy: 'Կարգավորումներ', ar: 'الإعدادات' },
  'chat.help': { hy: 'Օգնություն', ar: 'مساعدة' },
  'chat.input_placeholder': { hy: 'Գրեք արաբերեն կամ հայերեն...', ar: 'اكتب بالعربية أو بالأرمنية...' },
  'chat.hide_translation': { hy: 'Թաքցնել թարգմանությունը', ar: 'إخفاء الترجمة' },
  'chat.show_translation': { hy: 'Տեսնել թարգմանությունը', ar: 'إظهار الترجمة' },
  'chat.new_words': { hy: 'Նոր բառեր / كلمات جديدة', ar: 'كلمات جديدة / Նոր բառեր' },
  'chat.quick_hello': { hy: 'Բարև', ar: 'مرحبا' },
  'chat.quick_thanks': { hy: 'Շնորհակալություն', ar: 'شكراً لك' },
  'chat.quick_test': { hy: 'Թեստ', ar: 'اختبار' },
  'chat.quick_help': { hy: 'Օգնություն', ar: 'مساعدة' },
  'chat.quick_new_words': { hy: 'Նոր բառեր', ar: 'كلمات جديدة' },
  'chat.quick_correction': { hy: 'Ուղղում', ar: 'تصحيح' },
  'chat.scenarios.title': { hy: 'Խաղալ իրավիճակ', ar: 'لعب دور' },
  'chat.scenarios.restaurant': { hy: 'Ռեստորանում', ar: 'في المطعم' },
  'chat.scenarios.directions': { hy: 'Ճանապարհ հարցնել', ar: 'السؤال عن الاتجاهات' },
  'chat.scenarios.shopping': { hy: 'Գնումներ', ar: 'التسوق' },
  'chat.scenarios.introduce': { hy: 'Ծանոթություն', ar: 'التعارف' },
  'chat.scenarios.active': { hy: 'Ակտիվ իրավիճակ', ar: 'السيناريو النشط' },
  'chat.scenarios.end': { hy: 'Ավարտել', ar: 'إنهاء' },

  // Placement Test
  'placement.title': { hy: 'Դասավորման թեստ', ar: 'اختبار تحديد المستوى' },
  'placement.intro': { hy: 'Պատասխանեք մի քանի հարցի, որպեսզի մենք առաջարկենք ձեզ հարմար սկզբնակետ։', ar: 'أجب عن بضعة أسئلة لنقترح عليك نقطة بداية مناسبة.' },
  'placement.start': { hy: 'Սկսել թեստը', ar: 'ابدأ الاختبار' },
  'placement.skip': { hy: 'Բաց թողնել և սկսել սկզբից', ar: 'تخطي والبدء من الأول' },
  'placement.question_progress': { hy: 'Հարց', ar: 'سؤال' },
  'placement.result_title': { hy: 'Արդյունք', ar: 'النتيجة' },
  'placement.recommend': { hy: 'Առաջարկվում է սկսել՝', ar: 'يُقترح البدء من:' },
  'placement.beginner': { hy: 'Խորհուրդ ենք տալիս սկսել հենց սկզբից', ar: 'نوصي بالبدء من الصفر' },
  'placement.go_to_lesson': { hy: 'Սկսել այստեղից', ar: 'ابدأ من هنا' },
  'placement.continue_normal': { hy: 'Սկսել սկզբից', ar: 'ابدأ من الأول' },

  // Vocabulary — SRS
  'vocab.review_due': { hy: 'կրկնելու համար այսօր', ar: 'للمراجعة اليوم' },

  // About Modal
  'about.title': { hy: 'Հավելվածի մասին', ar: 'حول التطبيق' },
  'about.p1': {
    hy: 'Այս հավելվածը թվային ուսուցողական հարթակ է՝ նախատեսված ոչ արաբախոսների համար։ Այն նպատակ ունի զարգացնել նրանց լեզվական հմտությունները ինտերակտիվ և ժամանակակից եղանակով՝ հիմնվելով կրթության ոլորտում նորագույն տեխնոլոգիաների վրա:',
    ar: 'هذا التطبيق هو منصة تعليمية رقمية موجّهة للناطقين بغير اللغة العربية (اللغة الأرمنية)، يهدف إلى تطوير مهاراتهم اللغوية بطريقة تفاعلية وحديثة، اعتمادًا على أحدث التقنيات في التعليم.',
  },
  'about.p2': {
    hy: 'Հավելվածը կենտրոնանում է սովորողների դժվարությունների հաղթահարման վրա, հատկապես՝ ճիշտ արտասանության, գրագրության և հաղորդակցման մեջ՝ ճշգրիտ ձայնային վարժությունների, ինտերակտիվ գործունեությունների և պարզեցված բովանդակության միջոցով:',
    ar: 'يركّز التطبيق على معالجة الصعوبات التي يواجهها المتعلمون، خاصة في النطق الصحيح، والكتابة، والتواصل، من خلال تدريبات صوتية دقيقة، وأنشطة تفاعلية، ومحتوى مبسّط يواكب احتياجاتهم.',
  },
  'about.p3': {
    hy: 'Այն ապահովում է ճկուն ուսուցման փորձ՝ դասարանից դուրս, ցանկացած ժամանակ և ցանկացած վայրում սովորելու հնարավորությամբ, ինչպես նաև խելացի հաշվետվությունների միջոցով օգտակար առաջընթացի շարունակական մշտադիտարկմամբ:',
    ar: 'يوفّر التطبيق تجربة تعلّم مرنة خارج حدود الصف، مع إمكانية التعلم في أي وقت ومن أي مكان، إضافة إلى متابعة مستمرة لتقدّم المستخدم عبر تقارير ذكية تساعده على تحسين مستواه.',
  },
  'about.features_title': { hy: 'Այն նաև հիմնված է՝', ar: 'كما يعتمد على:' },
  'about.feature1': { hy: 'Կարճ ուսուցում (Micro-learning)', ar: 'التعلم القصير (Micro-learning)' },
  'about.feature2': { hy: 'Խթանող լեզվական խաղեր', ar: 'الألعاب اللغوية التحفيزية' },
  'about.feature3': { hy: 'Արտասանության ավտոմատ ուղղում արհեստական բանականության միջոցով', ar: 'التصحيح الآلي للنطق باستخدام الذكاء الاصطناعي' },
  'about.feature4': { hy: 'Գրական լեզվի կապը հաղորդակցական կիրառությունների հետ', ar: 'ربط اللغة الفصحى بالاستخدامات التواصلية' },
  'about.goal': {
    hy: 'Եվ նպատակ ունի արաբերենի ուսուցումը դարձնել զվարճալի, արդյունավետ և կայուն փորձ:',
    ar: 'ويهدف إلى جعل تعلم اللغة العربية تجربة ممتعة، فعّالة، ومستدامة.',
  },
  'about.team_title': { hy: 'Թիմ', ar: 'فريق العمل' },
  'about.team_desc': {
    hy: 'Այս հավելվածը մշակվել է ոչ արաբախոսներին արաբերեն ուսուցանող մասնագիտացված հետազոտական թիմի կողմից՝',
    ar: 'تم تطوير هذا التطبيق من طرف فريق بحثي متخصص في تعليم اللغة العربية للناطقين بغيرها:',
  },
  'about.team_members': {
    hy: 'Խալիդ Մոհամեդ Ազլմադ, Մոհամեդ Շաուքի, Ամին Ամահան, Սոնա Տոնիկյան',
    ar: 'خالد محمد أزلماض، محمد شوقي، أمين أمهان، صونا طونيكيان',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('hy');

  // Load language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'hy' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="w-full h-full">
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
