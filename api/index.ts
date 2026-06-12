import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ override: true });

function createGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function extractErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'Une erreur inconnue est survenue.';
  return err.message || 'Une erreur inconnue est survenue.';
}

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
app.use(express.json({ limit: '10mb' }));

function validateChatBody(
  req: Request<{}, {}, ChatRequestBody>,
  res: Response,
  next: NextFunction
): void {
  if (!req.body?.contents || !Array.isArray(req.body.contents)) {
    res.status(400).json({ error: '`contents` est requis et doit être un tableau.' });
    return;
  }
  next();
}

app.post(
  '/api/chat',
  validateChatBody,
  async (req: Request<{}, {}, ChatRequestBody>, res: Response): Promise<void> => {
    try {
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
      res.status(500).json({ error: extractErrorMessage(err) });
    }
  }
);

app.get('/api/tts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, lang } = req.query;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: '`text` is required.' });
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({ error: 'GEMINI_API_KEY non configurée sur le serveur.' });
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
      res.status(400).json({ error: "Le texte ne contient aucun caractère prononçable après nettoyage." });
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
        error: "Le modèle n'a pas retourné de flux audio.",
        details: textResponse 
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
    res.status(500).json({ error: extractErrorMessage(err) });
  }
});

app.post('/api/transcribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { audioData, mimeType, expectedLanguage } = req.body;
    if (!audioData || typeof audioData !== 'string') {
      res.status(400).json({ error: 'audioData is required and must be a string' });
      return;
    }

    if (audioData.length > 15 * 1024 * 1024) {
      res.status(413).json({ error: 'audioData base64 payload is too large' });
      return;
    }

    let prompt = 'Please carefully transcribe this audio.';
    if (expectedLanguage) {
      prompt += ` The expected language is ${expectedLanguage}. Only output the exact transcription text, with no extra formatting, markdown, or conversational filler.`;
    }

    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: audioData, mimeType: mimeType || 'audio/webm' } }
          ]
        }
      ]
    });

    res.json({ text: (response.text || "").trim() });
  } catch (err) {
    console.error('STT API Error:', err);
    res.status(500).json({ error: extractErrorMessage(err) });
  }
});

export default app;