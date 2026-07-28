import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ override: true });

function createGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const MAX_CHAT_MESSAGES = 50;
const MAX_CHAT_PARTS = 10;
const MAX_CHAT_TEXT_LENGTH = 8_000;
const MAX_CHAT_TOTAL_LENGTH = 50_000;
const MAX_SYSTEM_INSTRUCTION_LENGTH = 12_000;
const MAX_TTS_TEXT_LENGTH = 500;
const MAX_AUDIO_DATA_LENGTH = 8 * 1024 * 1024;
const AUDIO_MIME_TYPE_PATTERN = /^audio\/(webm|ogg|wav|mp4|mpeg)(;\s*codecs=[\w.-]+)?$/i;

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatRequestBody {
  contents: ChatMessage[];
  systemInstruction?: string;
}

function encodeWAV(pcmBytes: Buffer, sampleRate = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  
  const buffer = Buffer.alloc(44 + pcmBytes.length);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + pcmBytes.length, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); 
  buffer.writeUInt16LE(1, 20); 
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(pcmBytes.length, 40);
  pcmBytes.copy(buffer, 44);
  return buffer;
}

const app = express();

// CORS : l'app Capacitor (origine capacitor://localhost ou https://localhost)
// appelle cette API depuis un déploiement public distinct. Endpoints sans
// cookies/session, un accès large ne pose pas de risque de vol de session.
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

app.use(express.json({ limit: '10mb' }));

app.get('/api/status', (_req: Request, res: Response): void => {
  res.set('Cache-Control', 'no-store');
  res.json({ aiAvailable: Boolean(process.env.GEMINI_API_KEY) });
});

function validateChatBody(
  req: Request<{}, {}, ChatRequestBody>,
  res: Response,
  next: NextFunction
): void {
  const { contents, systemInstruction } = req.body ?? {};
  if (
    !Array.isArray(contents) ||
    contents.length === 0 ||
    contents.length > MAX_CHAT_MESSAGES
  ) {
    res.status(400).json({ error: 'INVALID_CHAT_CONTENTS' });
    return;
  }

  let totalLength = 0;
  const contentsAreValid = contents.every((message) => {
    if (
      !message ||
      (message.role !== 'user' && message.role !== 'model') ||
      !Array.isArray(message.parts) ||
      message.parts.length === 0 ||
      message.parts.length > MAX_CHAT_PARTS
    ) {
      return false;
    }

    return message.parts.every((part) => {
      if (!part || typeof part.text !== 'string') return false;
      const textLength = part.text.trim().length;
      totalLength += textLength;
      return textLength > 0 && textLength <= MAX_CHAT_TEXT_LENGTH;
    });
  });

  if (!contentsAreValid || totalLength > MAX_CHAT_TOTAL_LENGTH) {
    res.status(400).json({ error: 'INVALID_CHAT_CONTENTS' });
    return;
  }

  if (
    systemInstruction !== undefined &&
    (typeof systemInstruction !== 'string' ||
      systemInstruction.length > MAX_SYSTEM_INSTRUCTION_LENGTH)
  ) {
    res.status(400).json({ error: 'INVALID_SYSTEM_INSTRUCTION' });
    return;
  }

  next();
}

app.post(
  '/api/chat',
  validateChatBody,
  async (req: Request<{}, {}, ChatRequestBody>, res: Response): Promise<void> => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
        return;
      }
      const { contents, systemInstruction } = req.body;
      const ai = createGenAIClient();
      
      const formattedContents = contents.map(m => ({
        role: m.role,
        parts: m.parts.map(p => ({ text: p.text }))
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formattedContents,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      res.json({ text: response.text });
    } catch (err) {
      console.error('Chat API Error:', err);
      res.status(502).json({ error: 'AI_PROVIDER_ERROR' });
    }
  }
);

app.get('/api/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, lang } = req.query;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'INVALID_TTS_TEXT' });
      return;
    }
    if (text.length > MAX_TTS_TEXT_LENGTH) {
      res.status(413).json({ error: 'TTS_TEXT_TOO_LONG' });
      return;
    }
    if (lang !== undefined && lang !== 'ar') {
      res.status(400).json({ error: 'INVALID_TTS_LANGUAGE' });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
      return;
    }

    const ai = createGenAIClient();
    
    // NETTOYAGE : Suppression des kashidas (ـ), des points de suspension et des points d'interrogation pour le moteur TTS
    let cleanText = text.trim()
      .replace(/[\u0640]/g, '') // Enlever le tatweel/kashida de prolongation arabe
      .replace(/[؟?\.…_ـ]+/g, ' ') // Remplacer la ponctuation graphique/trous de texte par des espaces simples
      .replace(/\s+/g, ' ') // Nettoyer les doubles espaces créés
      .trim();

    // Si après nettoyage le texte est vide (ex: juste un point d'interrogation envoyé)
    if (!cleanText) {
      res.status(400).json({ error: 'INVALID_TTS_TEXT' });
      return;
    }

    const isArabic = (lang === 'ar') || /[\u0600-\u06FF]/.test(cleanText);

    // Répétition 3x pour les lettres courtes afin de fournir assez de matière phonétique au synthétiseur
    const ttsText = (isArabic && cleanText.length <= 3)
      ? `${cleanText} ${cleanText} ${cleanText}`
      : cleanText;

    // Utilisation stricte de gemini-2.5-flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: ttsText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
        // L'instruction système définit un cadre applicatif strict pour contourner la modération médicale/sensible
        systemInstruction: isArabic 
          ? "Tu agis exclusivement comme un moteur automatisé de synthèse vocale (Text-To-Speech) pour une application d'apprentissage de l'arabe. Ton unique rôle est de lire à voix haute le texte fourni, exactement tel qu'il est vocalisé, avec une élocution claire. Ignore complètement le sens contextuel ou médical des mots (ex: douleur, anatomie), ne donne aucun conseil, et ne génère aucun mot d'introduction ou commentaire."
          : "Tu dois lire à voix haute le texte fourni, de manière claire et articulée, sans ajouter de fioritures ou de commentaires."
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find(p => p.inlineData?.data);
    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      const textResponse = candidate?.content?.parts?.find(p => p.text)?.text;
      console.warn(`⚠️ Pas de flux audio généré pour "${cleanText}". Réponse texte :`, textResponse);
      
      res.status(422).json({ 
        error: 'AUDIO_NOT_GENERATED',
      });
      return;
    }

    const pcmBytes = Buffer.from(base64Audio, 'base64');
    const wavBuffer = encodeWAV(pcmBytes, 24000);

    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'public, max-age=31536000, immutable'); 
    res.send(wavBuffer);
  } catch (err) {
    console.error('TTS API Error:', err);
    res.status(502).json({ error: 'AI_PROVIDER_ERROR' });
  }
});

app.post('/api/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, mimeType, expectedLanguage } = req.body;
    if (!audioData || typeof audioData !== 'string') {
      res.status(400).json({ error: 'INVALID_AUDIO_DATA' });
      return;
    }

    if (audioData.length > MAX_AUDIO_DATA_LENGTH) {
      res.status(413).json({ error: 'INVALID_AUDIO_DATA' });
      return;
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audioData)) {
      res.status(400).json({ error: 'INVALID_AUDIO_DATA' });
      return;
    }

    const safeMimeType = typeof mimeType === 'string' ? mimeType : 'audio/webm';
    if (!AUDIO_MIME_TYPE_PATTERN.test(safeMimeType)) {
      res.status(400).json({ error: 'INVALID_AUDIO_FORMAT' });
      return;
    }

    const languageGuidance =
      expectedLanguage === 'Arabic (ar-SA)'
        ? ' The expected language is Arabic (ar-SA).'
        : expectedLanguage === 'Arabic or Armenian'
          ? ' The expected language is Arabic or Armenian.'
          : '';
    if (expectedLanguage !== undefined && !languageGuidance) {
      res.status(400).json({ error: 'INVALID_EXPECTED_LANGUAGE' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'AI_NOT_CONFIGURED' });
      return;
    }

    const prompt =
      `Please carefully transcribe this audio.${languageGuidance}` +
      ' Only output the exact transcription text, with no extra formatting, markdown, or conversational filler.';

    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: audioData, mimeType: safeMimeType } }
          ]
        }
      ]
    });

    res.json({ text: (response.text || "").trim() });
  } catch (err) {
    console.error('STT API Error:', err);
    res.status(502).json({ error: 'AI_PROVIDER_ERROR' });
  }
});

export default app;
