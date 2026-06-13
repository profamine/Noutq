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
    
    // Si le serveur répond avec un code d'erreur (422, 400, 500, etc.)
    if (!res.ok) {
      console.warn(`⚠️  [Échec] Impossible de générer l'audio pour "${text}" (Code serveur : ${res.status})`);
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

  console.log(`🔍 Trouvé : ${allWords.size} phrases/mots arabes uniques à traiter.`);

  const manifest: Record<string, string> = {};
  const chunks = [];
  const wordsArr = Array.from(allWords);
  
  for (let i = 0; i < wordsArr.length; i += 10) {
    chunks.push(wordsArr.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    let requestsMade = false;

    await Promise.all(chunk.map(async (word) => {
      // 1. Nom de fichier standard (Garde les espaces et caractères arabes propres)
      const cleanStandardName = word.replace(/[\/\\\:\*\?\"<>\|]/g, '_').trim(); 
      const fileNameStandard = `${cleanStandardName}.wav`;
      const filePathStandard = path.join(PUBLIC_AUDIO_DIR, fileNameStandard);

      // 2. Nom de fichier de secours (Ancienne méthode avec uniquement des underscores)
      const safeNameUnderscore = word.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50);
      const fileNameUnderscore = `${safeNameUnderscore}.wav`;
      const filePathUnderscore = path.join(PUBLIC_AUDIO_DIR, fileNameUnderscore);

      // --- VERIFICATION DE L'EXISTENCE PHYSIQUE ---
      if (fs.existsSync(filePathStandard)) {
        console.log(`⏭️  Déjà existant (Standard) : ${word}`);
        manifest[word] = `/audio/${fileNameStandard}`;
        return;
      } 
      
      if (fs.existsSync(filePathUnderscore)) {
        console.log(`⏭️  Déjà existant (Underscore) : ${word}`);
        manifest[word] = `/audio/${fileNameUnderscore}`;
        return;
      }

      // Si le fichier n'existe nulle part, on tente de le télécharger
      requestsMade = true;
      const success = await downloadAudio(word, filePathStandard);
      
      if (success) {
        manifest[word] = `/audio/${fileNameStandard}`;
      } else {
        console.error(`❌ Non inclus dans le manifeste (Audio manquant) : ${word}`);
      }
    }));
    
    // On fait la pause uniquement si on a réellement sollicité l'API
    if (requestsMade) {
      console.log("⏳ Pause de sécurité de 4.5s pour respecter les quotas de Google AI Studio...");
      await new Promise(resolve => setTimeout(resolve, 4500)); 
    }
  }

  // Sauvegarde du manifeste
  const manifestPath = path.join(PUBLIC_AUDIO_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Manifeste mis à jour et sauvegardé sous : ${manifestPath}`);
  console.log('🎉 Génération et compilation de tous les fichiers audio terminée !');
}

generateAll().catch(console.error);