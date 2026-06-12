import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importation des leçons
import { lessonsData } from '../src/data/lessons';

// Chemin vers le dossier public
const PUBLIC_AUDIO_DIR = path.resolve(__dirname, '../public/audio');

async function downloadAudio(text: string, filePath: string) {
  const url = `http://localhost:3000/api/tts?text=${encodeURIComponent(text)}&lang=ar`;
  console.log(`📥 Téléchargement depuis Gemini : ${text}`);
  
  try {
    const res = await fetch(url);
    
    // Si le serveur répond avec un code d'erreur (422, 400, etc.)
    if (!res.ok) {
      console.warn(`⚠️  [Passé] Impossible de générer l'audio pour "${text}" (Code serveur : ${res.status})`);
      return false; // Signale qu'aucun fichier n'a été créé
    }
    
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ Enregistré sous : ${filePath}`);
    return true; // Signale un téléchargement réussi
  } catch (err) {
    console.error(`❌ Échec réseau critique pour "${text}" :`, err);
    return false;
  }
}

export async function generateAll() {
  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
    fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  }

  const allWords = new Set<string>();

  for (const lessonId of Object.keys(lessonsData)) {
    const lesson = lessonsData[lessonId];
    for (const step of lesson.steps) {
      if (step.arabic) allWords.add(step.arabic);
      if (step.pairs) {
        for (const pair of step.pairs) {
          allWords.add(pair.arabic);
        }
      }
      if (step.options) {
        for (const opt of step.options as any[]) {
          if (opt.arabic) allWords.add(opt.arabic);
        }
      }
    }
  }

  console.log(`🔍 Trouvé : ${allWords.size} phrases/mots arabes uniques à générer.`);

  const manifest: Record<string, string> = {};
  const chunks = [];
  const wordsArr = Array.from(allWords);
  
  for (let i = 0; i < wordsArr.length; i += 10) {
    chunks.push(wordsArr.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    let requestsMade = false;

    await Promise.all(chunk.map(async (word) => {
      const safeName = word.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50);
      const fileName = `${safeName}.wav`;
      const filePath = path.join(PUBLIC_AUDIO_DIR, fileName);

      manifest[word] = `/audio/${fileName}`;

      if (fs.existsSync(filePath)) {
        console.log(`⏭️  Déjà existant (passé) : ${word}`);
        return;
      }

      // Marquer qu'on envoie au moins une requête au serveur sur ce chunk
      requestsMade = true;
      await downloadAudio(word, filePath);
    }));
    
    // On fait la pause uniquement si on a réellement sollicité l'API
    if (requestsMade) {
      console.log("⏳ Pause de sécurité de 4.5s pour respecter les quotas de Google AI Studio...");
      await new Promise(resolve => setTimeout(resolve, 4500)); 
    }
  }

  const manifestPath = path.join(PUBLIC_AUDIO_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✅ Manifeste mis à jour et sauvegardé sous : ${manifestPath}`);

  console.log('🎉 Génération et compilation de tous les fichiers audio terminée !');
}

generateAll().catch(console.error);