import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { normalizePublicBaseUrl, buildAudioStableUrl } from '../src/config/publicUrl';

dotenv.config();

/**
 * Génère les QR audio à partir du seul manifeste (source de vérité déjà
 * enrichie par generateV5AudioManifest.ts — `includeInBookQr` y est décidé
 * une seule fois, ni ce script ni le générateur DOCX ne redécident la règle).
 *
 * Déterministe : même audioId + même NOUTQ_PUBLIC_BASE_URL -> même image PNG
 * (le sha256 de sortie est stable entre deux exécutions).
 *
 * N'échoue jamais silencieusement sur un domaine absent ou non-HTTPS : voir
 * normalizePublicBaseUrl (déjà utilisé par validateV5.ts).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const manifestPath = path.join(projectRoot, 'public', 'audio', 'manifest.v2.json');
const outDir = path.join(projectRoot, 'output', 'qr', 'audio');
const metadataPath = path.join(projectRoot, 'output', 'qr', 'audio-qr-manifest.json');

const INCLUDE_AUDIO_QR = process.env.INCLUDE_AUDIO_QR !== 'false';

interface ManifestEntry {
  audioId: string;
  exerciseId: string;
  text: string;
  status: 'available' | 'missing';
  activityType: string;
  includeInBookQr: boolean;
  unitTitleAr?: string;
  unitTitleHy?: string;
}

interface Manifest {
  entries: Record<string, ManifestEntry>;
}

interface QrResult {
  audioId: string;
  target: string;
  qrFile: string;
  sha256: string;
  generatedAt: string;
}

async function main(): Promise<void> {
  if (!INCLUDE_AUDIO_QR) {
    console.log('INCLUDE_AUDIO_QR=false — aucun QR généré (voulu).');
    // Un dossier de sortie vide et absent de metadata est un état valide, pas
    // une erreur : le générateur DOCX doit interpréter "pas de QR" ainsi.
    return;
  }

  // Échoue fort et tôt : jamais de QR vers une URL localhost/placeholder.
  const baseUrl = normalizePublicBaseUrl(process.env.NOUTQ_PUBLIC_BASE_URL, true);
  if (!baseUrl) {
    console.error(
      'INCLUDE_AUDIO_QR=true mais NOUTQ_PUBLIC_BASE_URL est absent ou invalide.\n' +
      'Renseignez un domaine HTTPS réel dans .env avant de générer les QR du livre.',
    );
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
  let eligible = Object.values(manifest.entries).filter((entry) => entry.includeInBookQr);

  // Permet un lot restreint (ex. les 5 échantillons avant généralisation au
  // livre entier) sans toucher au reste du pipeline.
  const sampleIds = process.env.AUDIO_QR_SAMPLE_IDS?.split(',').map((id) => id.trim()).filter(Boolean);
  if (sampleIds?.length) {
    const unknown = sampleIds.filter((id) => !eligible.some((entry) => entry.audioId === id));
    if (unknown.length) {
      console.error(`AUDIO_QR_SAMPLE_IDS contient des ID non éligibles au QR ou introuvables : ${unknown.join(', ')}`);
      process.exitCode = 1;
      return;
    }
    eligible = eligible.filter((entry) => sampleIds.includes(entry.audioId));
  }

  fs.mkdirSync(outDir, { recursive: true });

  const results: QrResult[] = await Promise.all(
    eligible.map(async (entry): Promise<QrResult> => {
      const target = buildAudioStableUrl(baseUrl, entry.audioId);
      // Nom de fichier dérivé de l'ID (déjà [a-z0-9.-] par isValidAudioId côté
      // resolver) — jamais du texte arabe, pour rester filesystem-safe partout.
      const qrFile = path.join(outDir, `${entry.audioId}.png`);
      const buffer = await QRCode.toBuffer(target, {
        type: 'png',
        errorCorrectionLevel: 'M',
        margin: 4, // quiet zone
        scale: 10, // ~250px de côté à 25 modules, largement > 18mm à 300 DPI à l'impression
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      fs.writeFileSync(qrFile, buffer);
      return {
        audioId: entry.audioId,
        target,
        qrFile: path.relative(projectRoot, qrFile).replace(/\\/g, '/'),
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        generatedAt: new Date().toISOString(),
      };
    }),
  );

  fs.writeFileSync(
    metadataPath,
    `${JSON.stringify({ baseUrl, count: results.length, items: results }, null, 2)}\n`,
    'utf8',
  );

  const missingAudio = eligible.filter((entry) => entry.status === 'missing').length;
  console.log(`Généré ${results.length} QR dans ${path.relative(projectRoot, outDir)}`);
  if (missingAudio > 0) {
    console.log(
      `  ⚠ ${missingAudio} d'entre eux pointent vers un audio encore manquant ` +
      '(le lien reste valide, l’app affichera le fallback tant que le fichier n’est pas livré).',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
