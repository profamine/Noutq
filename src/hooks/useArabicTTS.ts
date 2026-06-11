/**
 * useArabicTTS — synthèse vocale arabe fiable, web + mobile (Android/iOS).
 *
 * Stratégie :
 *   1. Web Speech API UNIQUEMENT si une vraie voix arabe est installée.
 *      (On ne lit JAMAIS de l'arabe avec une voix par défaut non-arabe :
 *       c'était le bug Android principal.)
 *   2. Sinon, repli immédiat sur le TTS serveur (/api/tts) qui renvoie un WAV.
 *   3. Mise en cache des blobs audio pour éviter les appels répétés.
 *
 * Remplace la logique dupliquée de LessonScreen / ChatScreen / SpeechSetupScreen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

type Platform = 'android' | 'ios' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'desktop';
}

/** Charge les voix système de façon asynchrone (obligatoire sur Chrome/Android). */
function getVoicesAsync(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
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
    // Filet de sécurité : si l'événement ne se déclenche jamais.
    setTimeout(() => finish(window.speechSynthesis.getVoices()), timeoutMs);
  });
}

export function useArabicTTS() {
  const [isPlaying, setIsPlaying] = useState(false);
  const platform = useRef<Platform>('desktop');
  const audioCache = useRef<Map<string, string>>(new Map()); // texte+vitesse -> objectURL
  const currentAudio = useRef<HTMLAudioElement | null>(null);
  const arabicVoice = useRef<SpeechSynthesisVoice | null>(null);

  // Préchargement plateforme + voix au montage.
  useEffect(() => {
    platform.current = detectPlatform();
    let cancelled = false;
    getVoicesAsync().then((voices) => {
      if (cancelled) return;
      arabicVoice.current = voices.find((v) => v.lang.startsWith('ar')) ?? null;
    });
    return () => {
      cancelled = true;
      stop();
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

  /** Repli serveur : récupère un WAV propre depuis /api/tts et le joue. */
  const playServerTTS = useCallback(async (text: string, speed: number) => {
    const cacheKey = `${text}__server`;
    let url = audioCache.current.get(cacheKey);

    try {
      if (!url) {
        const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=ar`);
        if (!res.ok) throw new Error(`TTS serveur ${res.status}`);
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        audioCache.current.set(cacheKey, url);
      }

      const audio = new Audio(url);
      currentAudio.current = audio;
      audio.playbackRate = speed; // 0.7 = lent, 1.0 = normal
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
    } catch (err) {
      console.error('[TTS] repli serveur échoué :', err);
      setIsPlaying(false);
    }
  }, []);

  /**
   * Joue le texte arabe.
   * @param text  texte arabe à prononcer
   * @param speed 1.0 (normal) ou 0.7 (lent)
   */
  const speak = useCallback(
    async (text: string, speed = 1.0) => {
      if (!text) return;
      stop();
      setIsPlaying(true);

      // Sur mobile sans voix arabe → directement le serveur (pas d'attente inutile).
      const canUseNative =
        'speechSynthesis' in window && arabicVoice.current !== null;

      if (!canUseNative) {
        await playServerTTS(text, speed);
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ar-SA';
        u.rate = speed < 1 ? 0.55 : 0.85;
        u.pitch = 1;
        u.volume = 1;
        u.voice = arabicVoice.current!;

        let fellBack = false;
        // Si la synthèse ne démarre pas en 2 s (bug Android silencieux), on bascule.
        const guard = setTimeout(() => {
          if (!fellBack) {
            fellBack = true;
            window.speechSynthesis.cancel();
            playServerTTS(text, speed);
          }
        }, 2000);

        u.onstart = () => clearTimeout(guard);
        u.onend = () => {
          clearTimeout(guard);
          if (!fellBack) setIsPlaying(false);
        };
        u.onerror = () => {
          clearTimeout(guard);
          if (!fellBack) {
            fellBack = true;
            playServerTTS(text, speed);
          }
        };

        window.speechSynthesis.speak(u);
      } catch (err) {
        console.error('[TTS] synthèse native échouée :', err);
        await playServerTTS(text, speed);
      }
    },
    [playServerTTS, stop],
  );

  return { speak, stop, isPlaying, platform: platform.current };
}
