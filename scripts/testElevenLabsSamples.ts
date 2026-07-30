import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script d'essai ponctuel — PAS branché sur le pipeline de production.
 * Génère quelques échantillons ElevenLabs dans un dossier séparé pour
 * validation d'écoute avant toute décision d'adoption. N'écrit jamais dans
 * public/audio.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', '.tmp', 'elevenlabs-samples');
fs.mkdirSync(outDir, { recursive: true });

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error('ELEVENLABS_API_KEY manquante dans .env');
  process.exit(1);
}

// Échantillons choisis pour représenter les cas difficiles identifiés :
// syllabe courte, tanwīn, cluster de phonèmes absents de l'arménien (ع/ح/ظ),
// et la phrase u14 corrigée récemment (accusatif اليَوْمَ).
const SAMPLES: { id: string; text: string; note: string }[] = [
  { id: 'u1-syllabe', text: 'بَ / بِ / بُ', note: 'syllabe courte — décodage' },
  { id: 'u3-tanwin', text: 'كِتَابٌ', note: 'tanwīn -un' },
  { id: 'u13-phonemes-durs', text: 'عِنْدِي أَلَمٌ فِي ظَهْرِي', note: 'ع + ظ + hamza' },
  { id: 'u14-corrige', text: 'الجَوُّ اليَوْمَ مُشْمِس', note: 'accusatif اليَوْمَ (correction récente)' },
];

async function listVoices(): Promise<{ voice_id: string; name: string }[]> {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey! },
  });
  if (!res.ok) throw new Error(`GET /voices ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { voices: { voice_id: string; name: string }[] };
  return data.voices;
}

async function synthesize(voiceId: string, text: string, outPath: string): Promise<void> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${await res.text()}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
}

async function main() {
  // Voix passée en argument (bibliothèque partagée ArabicVoices) ou, à défaut,
  // la première voix du compte (bibliothèque par défaut, non arabophone).
  const [overrideId, overrideLabel] = process.argv.slice(2);

  let voiceId = overrideId;
  let voiceName = overrideLabel ?? overrideId;

  if (!voiceId) {
    console.log('Récupération des voix disponibles…');
    const voices = await listVoices();
    if (voices.length === 0) throw new Error('Aucune voix disponible sur ce compte.');
    console.log(`${voices.length} voix trouvées :`);
    voices.slice(0, 10).forEach((v) => console.log(`  - ${v.name} (${v.voice_id})`));
    voiceId = voices[0].voice_id;
    voiceName = voices[0].name;
  }

  const suffix = overrideId ? `-${overrideLabel ?? 'alt'}` : '';
  console.log(`\nVoix utilisée pour les échantillons : ${voiceName}\n`);

  for (const sample of SAMPLES) {
    const outPath = path.join(outDir, `${sample.id}${suffix}.mp3`);
    process.stdout.write(`  ${sample.id} (${sample.note})… `);
    try {
      await synthesize(voiceId, sample.text, outPath);
      console.log('OK ->', path.relative(process.cwd(), outPath));
    } catch (err) {
      console.log('ÉCHEC :', (err as Error).message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
