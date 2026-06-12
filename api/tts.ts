import { GoogleGenerativeAI } from '@google/generative-ai';

// Sécurité pour vérifier que la clé est bien présente au démarrage
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) return new Response('Texte manquant', { status: 400 });
  if (!apiKey) return new Response('Clé API Gemini manquante dans le fichier .env', { status: 500 });

  try {
    // Utilisation du modèle de génération standard
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format d'appel ultra-compatible et simplifié pour le TTS
    const response = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ text: `Dis uniquement ce texte en arabe, de manière claire, lente et articulée, sans ajouter de commentaires : "${text}"` }] 
      }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }
          }
        }
      }
    });

    // Extraction sécurisée des données
    const part = response.response.candidates?.[0]?.content?.parts?.[0];
    
    if (!part || !part.inlineData || !part.inlineData.data) {
      console.error("Format de réponse inattendu de Gemini :", JSON.stringify(response));
      throw new Error("Aucune donnée audio dans la réponse de l'IA.");
    }

    const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
    const mimeType = part.inlineData.mimeType || 'audio/wav';

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': audioBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    // Cela permettra de voir le vrai coupable dans le terminal du serveur !
    console.error(' [Erreur Serveur TTS]:', error?.message || error);
    return new Response(`Erreur interne: ${error?.message || error}`, { status: 500 });
  }
}