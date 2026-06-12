/**
 * useArabicTTS — synthèse vocale arabe fiable, web + mobile (Android/iOS).
 *
 * Ordre de priorité :
 *   1. Audio PRÉ-GÉNÉRÉ (manifest.json) — instantané, fiable, hors-ligne. RECOMMANDÉ.
 *   2. Web Speech API native — avec lang='ar-SA'. Sur Android, fonctionne même
 *      sans voix arabe explicite si Google TTS est installé (cas courant).
 *      Correctifs Android intégrés (anti-race cancel/speak + resume).
 *   3. Repli serveur /api/tts (WAV) — DÉSACTIVÉ dans Capacitor (pas de serveur).
 *      Actif uniquement en mode web.
 *
 * Correctifs Android intégrés :
 *   - Pas de cancel() juste avant speak() (sinon Android ignore speak silencieusement).
 *   - resume() de relance après speak() (Android met l'utterance en pause).
 *   - Déblocage de l'audio au 1er geste utilisateur (sinon play() après await est bloqué).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type Platform = 'android' | 'ios' | 'desktop';

/** Détecte si l'app tourne dans un conteneur Capacitor (APK natif). */
function isCapacitorApp(): boolean {
  return !!(window as unknown as Record<string, unknown>)['Capacitor'];
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

/** Charge les voix système de façon asynchrone (obligatoire sur Chrome/Android). */
function getVoicesAsync(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([]);
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) return resolve(existing);

    let settled = false;
    const finish = (v: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(v);
    };
    const handler = () => finish(window.speechSynthesis.getVoices());
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
  });
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useArabicTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const platform = useRef<Platform>('desktop');
  const audioCache = useRef<Map<string, string>>(new Map());
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const arabicVoice = useRef<SpeechSynthesisVoice | null>(null);
  const manifest = useRef<Record<string, string>>({});
  const audioUnlocked = useRef(false);

  useEffect(() => {
    platform.current = detectPlatform();
    let cancelled = false;

    getVoicesAsync().then((voices) => {
      if (cancelled) return;
      // Préfère une voix arabe « locale » (hors-ligne) si disponible.
      arabicVoice.current =
        voices.find((v) => v.lang.startsWith('ar') && v.localService) ??
        voices.find((v) => v.lang.startsWith('ar')) ??
        null;
    });

    fetch('/audio/manifest.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((m) => { if (!cancelled) manifest.current = m; })
      .catch(() => {});

    // Débloque l'audio mobile au 1er geste utilisateur (résout NotAllowedError).
    const unlock = () => {
      if (audioUnlocked.current) return;
      try {
        const a = new Audio();
        a.muted = true;
        a.play().catch(() => {});
        audioUnlocked.current = true;
      } catch { /* noop */ }
      // Réveille aussi le moteur de synthèse sur Android.
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.resume(); } catch { /* noop */ }
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: false });
    window.addEventListener('touchstart', unlock, { once: false });

    return () => {
      cancelled = true;
      stop();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      for (const url of audioCache.current.values()) URL.revokeObjectURL(url);
      audioCache.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playUrl = useCallback(async (url: string, speed: number) => {
    const audio = new Audio(url);
    currentAudio.current = audio;
    audio.playbackRate = speed;
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    await audio.play();
  }, []);

  /** Repli serveur : récupère un WAV depuis /api/tts puis le joue. */
  const playServerTTS = useCallback(async (text: string, speed: number) => {
    try {
      const cacheKey = `${text}__server`;
      let url = audioCache.current.get(cacheKey);
      if (!url) {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=ar`);
        if (!res.ok) throw new Error(`TTS serveur ${res.status}`);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.current.set(cacheKey, url);
      }
      await playUrl(url, speed);
    } catch (err) {
      console.error('[TTS] repli serveur échoué :', err);
      setIsPlaying(false);
    }
  }, [playUrl]);

  /** Synthèse native Android-safe (sans course cancel/speak, avec resume). */
  const playNative = useCallback((text: string, speed: number) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = speed < 1 ? 0.6 : 0.9;
    u.pitch = 1;
    u.volume = 1;
    if (arabicVoice.current) u.voice = arabicVoice.current;

    const inCapacitor = isCapacitorApp();
    // Sur Android, on réduit le délai de garde : si le moteur TTS ne répond pas
    // rapidement dans Capacitor, on ne peut pas tomber sur le serveur (absent).
    const guardMs = inCapacitor ? 4000 : 2500;

    let fellBack = false;
    const guard = setTimeout(() => {
      if (!fellBack) {
        fellBack = true;
        window.speechSynthesis.cancel();
        if (!inCapacitor) playServerTTS(text, speed);
        else setIsPlaying(false);
      }
    }, guardMs);

    u.onstart = () => clearTimeout(guard);
    u.onend = () => { clearTimeout(guard); if (!fellBack) setIsPlaying(false); };
    u.onerror = () => {
      clearTimeout(guard);
      if (!fellBack) {
        fellBack = true;
        if (!inCapacitor) playServerTTS(text, speed);
        else setIsPlaying(false);
      }
    };

    // IMPORTANT Android : pas de cancel() juste avant ; on speak() puis on resume().
    window.speechSynthesis.speak(u);
    // Android met parfois l'utterance en pause immédiatement → on la relance.
    setTimeout(() => { try { window.speechSynthesis.resume(); } catch { /* noop */ } }, 80);
  }, [playServerTTS]);

  const speak = useCallback(async (text: string, speed = 1.0) => {
    const clean = text?.trim();
    if (!clean) return;
    stop();
    setIsPlaying(true);

    const inCapacitor = isCapacitorApp();

    // 1) Audio pré-généré (le plus fiable, surtout sur Android).
    const preGen = manifest.current[clean];
    if (preGen) {
      try { await playUrl(preGen, speed); return; } catch { /* on continue */ }
    }

    // 2) Voix native Web Speech API.
    //    - Sur le web : uniquement si une voix arabe est détectée.
    //    - Sur Android Capacitor : on tente quand même avec lang='ar-SA' car
    //      le TTS Google peut lire l'arabe sans voix explicite dans la liste.
    const canUseNative =
      'speechSynthesis' in window &&
      (arabicVoice.current !== null || (inCapacitor && platform.current === 'android'));

    if (canUseNative) {
      try { playNative(clean, speed); return; }
      catch (err) { console.error('[TTS] native échouée :', err); }
    }

    // 3) Repli serveur — DÉSACTIVÉ dans Capacitor (aucun serveur Express dans l'APK).
    if (!inCapacitor) {
      await playServerTTS(clean, speed);
    } else {
      console.warn('[TTS] Texte absent du manifest et pas de voix arabe installée :', clean);
      setIsPlaying(false);
    }
  }, [playNative, playServerTTS, playUrl, stop]);

  return { speak, stop, isPlaying, platform: platform.current };
}