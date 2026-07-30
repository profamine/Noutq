import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script d'essai — PAS branché sur le pipeline de production.
 * Génère les 38 éléments manquants du backlog réel avec la voix Roger
 * (compte gratuit, aucune voix arabophone native disponible) afin d'évaluer
 * la qualité sur l'ensemble du contenu réel avant toute décision d'adoption.
 * N'écrit jamais dans public/audio.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const backlogPath = path.join(projectRoot, 'content', 'v5', 'audio-recording-backlog.json');
const outDir = path.join(projectRoot, '.tmp', 'elevenlabs-full-backlog');
fs.mkdirSync(outDir, { recursive: true });

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY manquante dans .env');
  process.exit(1);
}

const VOICE_ID = 'CwhRBWXzGAHq8TQ4Fs17'; // Roger — seule voix testable sur le plan gratuit
const VOICE_NAME = 'roger';

interface BacklogItem {
  audio_id: string;
  arabic_text: string;
  priority: string;
}

const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8')) as { items: BacklogItem[] };

async function synthesize(text: string, outPath: string): Promise<void> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_64`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`Génération de ${backlog.items.length} éléments avec la voix ${VOICE_NAME}…\n`);
  const results: { audio_id: string; priority: string; ok: boolean; error?: string }[] = [];

  for (const item of backlog.items) {
    const outPath = path.join(outDir, `${item.audio_id}-${VOICE_NAME}.mp3`);
    process.stdout.write(`  [${item.priority}] ${item.audio_id}… `);
    try {
      await synthesize(item.arabic_text, outPath);
      console.log('OK');
      results.push({ audio_id: item.audio_id, priority: item.priority, ok: true });
    } catch (err) {
      const message = (err as Error).message;
      console.log('ÉCHEC :', message.slice(0, 120));
      results.push({ audio_id: item.audio_id, priority: item.priority, ok: false, error: message });
    }
    // Respecte le débit de l'API sur le plan gratuit.
    await sleep(600);
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n${okCount}/${results.length} générés avec succès dans ${path.relative(projectRoot, outDir)}`);

  const summaryPath = path.join(outDir, '_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf8');

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('\nÉchecs :');
    failed.forEach((f) => console.log(`  - ${f.audio_id}: ${f.error?.slice(0, 150)}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
