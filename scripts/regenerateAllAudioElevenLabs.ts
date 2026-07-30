import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Régénère TOUT le contenu audio courant (les 258 entrées de manifest.v2.json)
 * avec une seule voix ElevenLabs (Roger — plan gratuit, aucune voix arabophone
 * native disponible, cf. décision utilisateur du 30/07). Écrit directement dans
 * public/audio/{audioId}.mp3 : c'est une régénération de production, pas un
 * essai (contrairement à testElevenLabsFullBacklog.ts).
 *
 * Idempotent : saute tout {audioId}.mp3 déjà présent, donc relançable sans
 * regénérer ce qui existe déjà (utile en cas d'interruption).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const audioDir = path.join(projectRoot, 'public', 'audio');
const manifestPath = path.join(audioDir, 'manifest.v2.json');

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY manquante dans .env');
  process.exit(1);
}

const VOICE_ID = 'CwhRBWXzGAHq8TQ4Fs17'; // Roger — même voix que le lot de test du 30/07
const VOICE_NAME = 'roger';

interface ManifestEntry {
  audioId: string;
  text: string;
}
interface Manifest {
  entries: Record<string, ManifestEntry>;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;

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
  const todo = Object.values(manifest.entries).filter((entry) => {
    if (!entry.text) return false;
    const outPath = path.join(audioDir, `${entry.audioId}.mp3`);
    return !fs.existsSync(outPath);
  });

  const alreadyDone = Object.keys(manifest.entries).length - todo.length;
  console.log(`${alreadyDone} déjà en ${VOICE_NAME}.mp3, ${todo.length} à générer.\n`);

  const results: { audioId: string; ok: boolean; error?: string }[] = [];
  let done = 0;

  for (const entry of todo) {
    const outPath = path.join(audioDir, `${entry.audioId}.mp3`);
    done += 1;
    process.stdout.write(`  [${done}/${todo.length}] ${entry.audioId}… `);
    try {
      await synthesize(entry.text, outPath);
      console.log('OK');
      results.push({ audioId: entry.audioId, ok: true });
    } catch (err) {
      const message = (err as Error).message;
      console.log('ÉCHEC :', message.slice(0, 150));
      results.push({ audioId: entry.audioId, ok: false, error: message });
    }
    await sleep(650);
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\n${okCount}/${results.length} générés (+ ${alreadyDone} déjà présents).`);

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log('\nÉchecs (relancer le script les reprendra) :');
    failed.forEach((f) => console.log(`  - ${f.audioId}: ${f.error?.slice(0, 150)}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
