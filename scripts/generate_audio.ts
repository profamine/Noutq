import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import lessons
// Note: This script assumes it is run with ts-node or tsx from the project root.
import { lessonsData } from '../src/data/lessons';

const PUBLIC_AUDIO_DIR = path.resolve(__dirname, '../public/audio');

async function downloadAudio(text: string, filePath: string) {
  const url = `http://localhost:3000/api/tts?text=${encodeURIComponent(text)}&lang=ar`;
  console.log(`Downloading: ${text}`);
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status} ${res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ Saved to ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to download ${text}:`, err);
  }
}

async function generateAll() {
  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
    fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  }

  const allWords = new Set<string>();

  for (const lessonId of Object.keys(lessonsData)) {
    const lesson = lessonsData[lessonId];
    for (const step of lesson.steps) {
      if (step.arabic) {
        allWords.add(step.arabic);
      }
      if (step.pairs) {
        for (const pair of step.pairs) {
          allWords.add(pair.arabic);
        }
      }
      if (step.options) {
        for (const opt of step.options) {
          if (opt.arabic) allWords.add(opt.arabic);
        }
      }
    }
  }

  console.log(`Found ${allWords.size} unique Arabic phrases to generate.`);

  for (const word of allWords) {
    // Generate a safe filename
    const safeName = word.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_').substring(0, 50);
    const fileName = `${safeName}.wav`;
    const filePath = path.join(PUBLIC_AUDIO_DIR, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`⏭️ Skipping (already exists): ${word}`);
      continue;
    }

    await downloadAudio(word, filePath);
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log('🎉 Done compiling audio files!');
}

generateAll().catch(console.error);
