import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: "مرحباً",
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
    }
  });
  console.log(res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data?.substring(0, 100));
}
run();
