/**
 * SpeechSetupScreen — شاشة الإعداد الأولي (تظهر مرة واحدة عند أول تشغيل)
 * تطلب جميع الأذونات اللازمة: الصوت، الميكروفون، الإشعارات، الموقع
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2, Mic, CheckCircle, XCircle,
  ChevronRight, ChevronLeft, Smartphone, Settings,
  Bell, MapPin, Shield,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useArabicTTS } from '../hooks/useArabicTTS';

interface Props {
  onDone: () => void;
}

type StepId    = 'welcome' | 'synthesis' | 'recognition' | 'notifications' | 'done';
type TestState = 'idle' | 'testing' | 'ok' | 'fail' | 'denied';

type Platform = 'android' | 'ios' | 'desktop';

export default function SpeechSetupScreen({ onDone }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const { speak, ttsUnavailable } = useArabicTTS();

  const [step, setStep]           = useState<StepId>('welcome');
  const [ttsState, setTtsState]   = useState<TestState>('idle');
  const [micState, setMicState]   = useState<TestState>('idle');
  const [notifState, setNotifState] = useState<TestState>('idle');
  const [platform, setPlatform]   = useState<Platform>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua))              setPlatform('android');
    else if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios');
    else                                   setPlatform('desktop');

    // Vérifier si notifications déjà accordées
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifState('ok');
    }
    // Vérifier si micro déjà accordé (navigator.permissions API)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(r => {
        if (r.state === 'granted') setMicState('ok');
        if (r.state === 'denied')  setMicState('denied');
      }).catch(() => {});
    }
  }, []);

  // ─── Test TTS ────────────────────────────────────────────────────────────
  const testTTS = useCallback(async () => {
    setTtsState('testing');
    try {
      await speak('مرحباً، أهلاً وسهلاً', 1.0);
      setTimeout(() => setTtsState('ok'), 1500);
    } catch {
      setTtsState('fail');
    }
  }, [speak]);

  // ─── Test Microphone ─────────────────────────────────────────────────────
  const testMic = useCallback(async () => {
    setMicState('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicState('ok');
    } catch (e: any) {
      if (e?.name === 'NotAllowedError') {
        setMicState('denied');
      } else {
        setMicState('fail');
      }
    }
  }, []);

  // ─── Demander notifications ───────────────────────────────────────────────
  const requestNotifications = useCallback(async () => {
    if (!('Notification' in window)) {
      setNotifState('fail');
      return;
    }
    setNotifState('testing');
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setNotifState('ok');
        // Envoyer une notification de bienvenue
        new Notification(ar ? 'نوتق — مرحباً بك! 🎉' : 'Noutq — Բարի գալուստ! 🎉', {
          body: ar
            ? 'سنرسل لك تذكيرات يومية للمراجعة'
            : 'Մենք կուղարկենք ձեզ ամենօրյա կրկնության հիշեցումներ',
          icon: '/icons/icon-192x192.png',
        });
      } else {
        setNotifState('denied');
      }
    } catch {
      setNotifState('fail');
    }
  }, [ar]);

  // ─── Traductions ──────────────────────────────────────────────────────────
  const T = {
    // Étape 0 — Bienvenue / permissions globales
    welcome_title:  ar ? 'مرحباً بك في نوتق!'    : 'Բարի գալուստ Noutq!',
    welcome_sub:    ar ? 'قبل البدء، نحتاج بعض الأذونات' : 'Մինչ սկսելը՝ մի քանի թույլտվություն',
    welcome_desc:   ar
      ? 'هذا التطبيق يحتاج إلى: الميكروفون (للنطق)، الإشعارات (للتذكيرات)، الصوت (للاستماع). كل هذه الأذونات ضرورية لتجربة تعليمية كاملة.'
      : 'Հավելվածը կարիք ունի՝ Խոսափողի (արտասանության), Ծանուցումների (հիշեցումների), Ձայնի (ունկնդրման)։ Բոլոր թույլտվությունները անհրաժեշտ են ամբողջական ուսուցման փորձի համար։',
    welcome_btn:    ar ? 'ابدأ الإعداد'           : 'Սկսել կարգավորումը',

    title:    ar ? 'إعداد أولي'         : 'Նախնական կարգավորում',
    subtitle: ar ? 'خطوات قبل البدء'    : 'Քայլեր մինչ սկսելը',
    skip:     ar ? 'تخطي'               : 'Բաց թողնել',
    next:     ar ? 'التالي'             : 'Հաջորդ',
    done:     ar ? 'ابدأ التعلم!'       : 'Սկսել սովորել!',

    // TTS
    tts_title: ar ? 'الصوت العربي (TTS)'  : 'Արաբական ձայն (TTS)',
    tts_desc:  ar
      ? 'يحتاج التطبيق لقراءة الكلمات العربية بصوت عالٍ. يجب تثبيت حزمة الصوت العربي.'
      : 'Հավելվածը կարդում է արաբերեն բառեր բարձրաձայն: Անհրաժեշտ է արաբական ձայնային փաթեթ:',
    tts_btn:  ar ? '🔊 اختبر الصوت الآن'             : '🔊 Փորձել հիմա',
    tts_ok:   ar ? 'ممتاز! الصوت يعمل ✓'              : 'Հիանալի! Ձայնն աշխատում է ✓',
    tts_fail: ar ? 'لم يُسمع صوت — اتبع الخطوات أدناه' : 'Ձայն չկա — հետևեք ստորև բերված քայլերին',

    android_tts: ar ? [
      '① افتح إعدادات الهاتف',
      '② اذهب إلى: إمكانية الوصول ← تحويل النص إلى كلام',
      '③ اختر Google Text-to-Speech كمحرك',
      '④ اضغط ⚙️ ← تثبيت بيانات الصوت ← العربية',
      '⑤ ارجع وأعد الاختبار',
    ] : [
      '① Բացել Կարգավորումներ',
      '② Մատչելիություն → Խոսք',
      '③ Ընտրել Google TTS',
      '④ Տեղադրել արաբական ձայնային տվյալներ',
      '⑤ Վերադառնալ և կրկին փորձել',
    ],
    ios_tts: ar ? [
      '① افتح الإعدادات',
      '② اذهب إلى: إمكانية الوصول ← المحتوى المنطوق',
      '③ اضغط على "الأصوات" ثم اختر "العربية"',
      '④ حمّل أي صوت عربي',
      '⑤ ارجع وأعد الاختبار',
    ] : [
      '① Բացել Կարգավորումներ',
      '② Մատչելիություն → Խոսվածք',
      '③ Ձայներ → Արաբերեն',
      '④ Ներբեռնել ձայն',
      '⑤ Վերադառնալ և կրկին փորձել',
    ],
    desktop_tts: ar ? [
      '① تأكد من رفع مستوى الصوت في جهازك',
      '② جرّب متصفحاً آخر (Chrome أو Firefox)',
      '③ تحقق من أذونات الصوت في إعدادات المتصفح',
    ] : [
      '① Ստուգել ձեր սարքի ձայնի մակարդակը',
      '② Փորձել այլ դիտարկիչ (Chrome կամ Firefox)',
      '③ Ստուգել ձայնի թույլտվությունները դիտարկչի կարգավորումներում',
    ],

    // Microphone
    mic_title: ar ? 'الميكروفون (للنطق)'       : 'Խոսափող (արտասանության համար)',
    mic_desc:  ar
      ? 'تمارين النطق تتحقق من صحة كلامك. التطبيق يحتاج إذن استخدام الميكروفون.'
      : 'Արտասանության վարժություններն ստուգում են ձեր խոսքը: Հավելվածը կարիք ունի խոսափողի թույլտվության:',
    mic_btn:    ar ? '🎙️ اطلب إذن الميكروفون'  : '🎙️ Թույլ տալ',
    mic_ok:     ar ? 'الميكروفون جاهز ✓'         : 'Խոսափողը պատրաստ է ✓',
    mic_fail:   ar ? 'تعذّر الوصول — تحقق من إعدادات هاتفك' : 'Հասանելիությունն անհնար է — ստուգել կարգավորումները',
    mic_denied: ar ? 'تم رفض الإذن — فعّله من الإعدادات للمتابعة' : 'Մերժվեց — Կարգավորումներից ակտիվացրեք',

    // Notifications
    notif_title: ar ? 'الإشعارات'                : 'Ծանուցումներ',
    notif_desc:  ar
      ? 'نرسل لك تذكيرات يومية للمراجعة وتشجيعات لمواصلة سلسلة التعلم. يمكنك إلغاؤها في أي وقت.'
      : 'Մենք ուղարկում ենք ամենօրյա կրկնության հիշեցումներ և խրախուսանքներ սովորելու շղթան պահպանելու համար: Կարող եք ցանկացած ժամանակ անջատել:',
    notif_btn:   ar ? '🔔 فعّل الإشعارات'         : '🔔 Ակտիվացնել ծանուցումները',
    notif_ok:    ar ? 'الإشعارات مفعّلة ✓'         : 'Ծանուցումներն ակտիվ են ✓',
    notif_fail:  ar ? 'الإشعارات غير مدعومة في هذا المتصفح' : 'Ծանուցումները չեն աջակցվում այս դիտարկիչում',
    notif_denied: ar ? 'تم رفض الإذن — فعّله من إعدادات المتصفح' : 'Մերժվեց — ակտիվացրեք դիտարկչի կարգավորումներից',
    notif_skip:  ar ? 'تخطي (لن أتلقى تذكيرات)' : 'Բաց թողնել (հիշեցումներ չեն լինի)',

    // Fin
    done_title: ar ? 'أنت جاهز! 🎉'   : 'Պատրաստ եք! 🎉',
    done_desc:  ar
      ? 'يمكنك دائماً تغيير هذه الإعدادات لاحقاً من إعدادات هاتفك أو التطبيق.'
      : 'Դուք կարող եք միշտ փոխել այս կարգավորումները ձեր հեռախոսի կամ հավելվածի կարգավորումներից:',
  };

  // ─── Icône de statut ─────────────────────────────────────────────────────
  const StateIcon = ({ state }: { state: TestState }) => {
    if (state === 'ok')      return <CheckCircle className="text-green-500 shrink-0" size={22} />;
    if (state === 'fail')    return <XCircle className="text-red-400 shrink-0" size={22} />;
    if (state === 'denied')  return <XCircle className="text-orange-400 shrink-0" size={22} />;
    if (state === 'testing') return (
      <span className="animate-spin inline-block w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full shrink-0" />
    );
    return <div className="w-5 h-0.5 bg-gray-300 rounded shrink-0" />;
  };

  // ─── Étapes ──────────────────────────────────────────────────────────────
  const Steps: { id: StepId; icon: React.ReactNode; label: string }[] = [
    { id: 'synthesis',    icon: <Volume2 size={14} />,      label: 'TTS' },
    { id: 'recognition',  icon: <Mic size={14} />,          label: ar ? 'ميكروفون' : 'Mic' },
    { id: 'notifications',icon: <Bell size={14} />,         label: ar ? 'إشعارات' : 'Notif' },
    { id: 'done',         icon: <CheckCircle size={14} />,  label: ar ? 'جاهز' : 'Պատրաստ' },
  ];
  const visibleSteps = Steps.filter(s => s.id !== 'welcome');
  const currentIdx = visibleSteps.findIndex(s => s.id === step);

  const NavChevron = () => ar
    ? <ChevronLeft size={18} />
    : <ChevronRight size={18} />;

  const ttsGuide =
    platform === 'ios'     ? T.ios_tts :
    platform === 'android' ? T.android_tts :
    T.desktop_tts;

  const platformLabel =
    platform === 'ios'     ? 'iOS' :
    platform === 'android' ? 'Android' :
    ar ? 'المتصفح' : 'Desktop';

  // ─── Écran de bienvenue ───────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg">
            <Shield size={44} className="text-white" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{T.welcome_title}</h1>
            <p className="text-blue-600 font-medium text-sm">{T.welcome_sub}</p>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{T.welcome_desc}</p>

          {/* Résumé des permissions demandées */}
          <div className="w-full bg-blue-50 rounded-2xl p-4 space-y-3">
            {[
              { icon: <Volume2 size={18} className="text-blue-500" />, label: ar ? 'الصوت العربي — للاستماع للكلمات' : 'Արաբական ձայն — բառեր լսելու համար' },
              { icon: <Mic size={18} className="text-purple-500" />,   label: ar ? 'الميكروفون — للتحقق من النطق' : 'Խոսափող — արտասանությունը ստուգելու համար' },
              { icon: <Bell size={18} className="text-amber-500" />,   label: ar ? 'الإشعارات — لتذكيرات المراجعة اليومية' : 'Ծանուցումներ — ամենօրյա հիշեցումների համար' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-8 pt-3">
          <button
            onClick={() => setStep('synthesis')}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                       rounded-2xl font-bold text-base flex items-center justify-center gap-2
                       active:scale-95 transition-transform shadow-lg"
          >
            <span>{T.welcome_btn}</span>
            <NavChevron />
          </button>
        </div>
      </div>
    );
  }

  // ─── Écrans d'étapes ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white" dir={ar ? 'rtl' : 'ltr'}>

      {/* Bandeau TTS indisponible — disparaît après 5 s (géré par le hook) */}
      {ttsUnavailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center z-10">
          <p className="text-amber-800 text-xs font-medium">
            Ձայնային արտաբերումը հասանելի չէ։ Տեղադրեք Google TTS հայկական ձայնով։
          </p>
          <p className="text-amber-700 text-xs mt-0.5" dir="rtl">
            الصوت غير متاح. يرجى تثبيت Google TTS مع دعم اللغة العربية.
          </p>
        </div>
      )}

      {/* En-tête avec progression */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-12 pb-8 text-white text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">{T.title}</h1>
        <p className="text-blue-100 text-sm mt-1">{T.subtitle}</p>

        <div className="flex items-center justify-center gap-2 mt-5">
          {visibleSteps.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all
                ${s.id === step        ? 'bg-white text-blue-700'
                : i < currentIdx      ? 'bg-white/40 text-white'
                :                       'bg-white/10 text-white/50'}`}
            >
              {s.icon}
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        {/* ── Étape 1 : TTS ── */}
        {step === 'synthesis' && (
          <>
            <div className="bg-blue-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Volume2 className="text-blue-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.tts_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.tts_desc}</p>
            </div>

            <button
              onClick={testTTS}
              disabled={ttsState === 'testing'}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60"
            >
              {ttsState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.tts_btn}
            </button>

            {(ttsState === 'ok' || ttsState === 'fail') && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl
                ${ttsState === 'ok' ? 'bg-green-50' : 'bg-red-50'}`}>
                <StateIcon state={ttsState} />
                <p className={`text-sm font-medium ${ttsState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {ttsState === 'ok' ? T.tts_ok : T.tts_fail}
                </p>
              </div>
            )}

            {ttsState === 'fail' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings size={16} className="text-amber-600 shrink-0" />
                  <span className="font-bold text-amber-800 text-sm">
                    {platformLabel} — {ar ? 'خطوات التفعيل' : 'Ակտիվացման քայլեր'}
                  </span>
                </div>
                <ol className="space-y-2">
                  {ttsGuide.map((line, i) => (
                    <li key={i} className="text-sm text-amber-900 leading-relaxed">{line}</li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}

        {/* ── Étape 2 : Microphone ── */}
        {step === 'recognition' && (
          <>
            <div className="bg-purple-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mic className="text-purple-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.mic_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.mic_desc}</p>
            </div>

            <button
              onClick={testMic}
              disabled={micState === 'testing' || micState === 'ok'}
              className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold text-base
                         flex items-center justify-center gap-2
                         active:scale-95 transition-transform disabled:opacity-60"
            >
              {micState === 'testing'
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : T.mic_btn}
            </button>

            {micState === 'ok' && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50">
                <StateIcon state="ok" />
                <p className="text-sm font-medium text-green-700">{T.mic_ok}</p>
              </div>
            )}
            {(micState === 'fail' || micState === 'denied') && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50">
                <StateIcon state={micState} />
                <p className="text-sm font-medium text-orange-700">
                  {micState === 'denied' ? T.mic_denied : T.mic_fail}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Étape 3 : Notifications ── */}
        {step === 'notifications' && (
          <>
            <div className="bg-amber-50 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <Bell className="text-amber-600" size={20} />
                </div>
                <h2 className="font-bold text-gray-800">{T.notif_title}</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{T.notif_desc}</p>
            </div>

            {notifState !== 'ok' && (
              <button
                onClick={requestNotifications}
                disabled={notifState === 'testing'}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-base
                           flex items-center justify-center gap-2
                           active:scale-95 transition-transform disabled:opacity-60"
              >
                {notifState === 'testing'
                  ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  : T.notif_btn}
              </button>
            )}

            {notifState === 'ok' && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50">
                <StateIcon state="ok" />
                <p className="text-sm font-medium text-green-700">{T.notif_ok}</p>
              </div>
            )}
            {(notifState === 'fail' || notifState === 'denied') && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50">
                <StateIcon state={notifState} />
                <p className="text-sm font-medium text-orange-700">
                  {notifState === 'denied' ? T.notif_denied : T.notif_fail}
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Étape finale : Résumé ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{T.done_title}</h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{T.done_desc}</p>

            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3">
              {[
                { icon: <Volume2 size={16} />, label: T.tts_title,   state: ttsState },
                { icon: <Mic size={16} />,     label: T.mic_title,   state: micState },
                { icon: <Bell size={16} />,    label: T.notif_title, state: notifState },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {item.icon}<span>{item.label}</span>
                  </div>
                  <StateIcon state={item.state} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pied de page — boutons de navigation */}
      <div className="px-5 pb-8 pt-3 border-t border-gray-100 space-y-3">
        {step === 'synthesis' && (
          <div className="space-y-2">
            <button
              onClick={() => setStep('recognition')}
              disabled={ttsState === 'testing'}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                ttsState === 'testing'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white active:scale-95'
              }`}
            >
              <span>{T.next}</span><NavChevron />
            </button>
            {ttsState === 'fail' && (
              <p className="text-center text-xs text-amber-600 font-medium px-4">
                {ar
                  ? 'يمكنك المتابعة، لكن التجربة ستكون غير مكتملة بدون تفعيل الصوت.'
                  : 'Կարող եք շարունակել, բայց փորձը ամբողջական չի լինի:'}
              </p>
            )}
          </div>
        )}

        {step === 'recognition' && (
          <div className="space-y-2">
            <button
              onClick={() => setStep('notifications')}
              disabled={micState === 'testing'}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                micState === 'testing'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white active:scale-95'
              }`}
            >
              <span>{T.next}</span><NavChevron />
            </button>
            {(micState === 'fail' || micState === 'denied') && (
              <p className="text-center text-xs text-amber-600 font-medium px-4">
                {ar
                  ? 'يمكنك المتابعة، لكن تمارين النطق لن تكون متاحة.'
                  : 'Կարող եք շարունակել, բայց արտասանության վարժությունները հասանելի չեն:'}
              </p>
            )}
          </div>
        )}

        {step === 'notifications' && (
          <div className="space-y-2">
            <button
              onClick={() => setStep('done')}
              disabled={notifState === 'testing'}
              className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                notifState === 'testing'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-800 text-white active:scale-95'
              }`}
            >
              <span>{T.next}</span><NavChevron />
            </button>
            {notifState !== 'ok' && notifState !== 'testing' && (
              <button
                onClick={() => setStep('done')}
                className="w-full py-3 text-gray-400 text-sm font-medium active:scale-95 transition-transform"
              >
                {T.notif_skip}
              </button>
            )}
          </div>
        )}

        {step === 'done' && (
          <button
            onClick={onDone}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                       rounded-2xl font-bold text-lg flex items-center justify-center gap-2
                       active:scale-95 transition-transform shadow-lg"
          >
            <span>{T.done}</span><NavChevron />
          </button>
        )}
      </div>
    </div>
  );
}
