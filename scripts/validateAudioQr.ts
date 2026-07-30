import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import jsQR from 'jsqr';
import { isValidAudioId } from '../src/server/audioResolver';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..');
const manifestPath = path.join(projectRoot, 'public', 'audio', 'manifest.v2.json');
const qrMetadataPath = path.join(projectRoot, 'output', 'qr', 'audio-qr-manifest.json');

/** Taille minimale imprimée acceptée (18mm à 300 DPI ⇒ ≥ 213 px de côté). */
const MIN_PRINT_PX = Math.ceil((18 / 25.4) * 300);

let failures = 0;
function fail(message: string): void {
  failures += 1;
  console.error(`✗ ${message}`);
}
function ok(message: string): void {
  console.log(`✓ ${message}`);
}

interface ManifestEntry {
  audioId: string;
  exerciseId: string;
  status: 'available' | 'missing';
  includeInBookQr: boolean;
}
interface Manifest {
  entries: Record<string, ManifestEntry>;
}
interface QrItem {
  audioId: string;
  target: string;
  qrFile: string;
  sha256: string;
}
interface QrMetadata {
  baseUrl: string;
  items: QrItem[];
}

if (!fs.existsSync(qrMetadataPath)) {
  console.log('Aucun output/qr/audio-qr-manifest.json — rien à valider (INCLUDE_AUDIO_QR=false, état normal).');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Manifest;
const qrMeta = JSON.parse(fs.readFileSync(qrMetadataPath, 'utf8')) as QrMetadata;

// ── Base URL ─────────────────────────────────────────────────────────────
if (!/^https:\/\//.test(qrMeta.baseUrl)) {
  fail(`base URL n'est pas HTTPS : ${qrMeta.baseUrl}`);
} else if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(qrMeta.baseUrl)) {
  fail(`base URL pointe vers une adresse locale : ${qrMeta.baseUrl}`);
} else {
  ok(`base URL HTTPS valide : ${qrMeta.baseUrl}`);
}

// ── Chaque QR généré ─────────────────────────────────────────────────────
const seenAudioIds = new Set<string>();
const seenTargets = new Map<string, string>();

for (const item of qrMeta.items) {
  const label = item.audioId;

  if (seenAudioIds.has(item.audioId)) fail(`audio_id dupliqué dans les QR : ${item.audioId}`);
  seenAudioIds.add(item.audioId);

  if (!isValidAudioId(item.audioId)) fail(`audio_id de forme invalide : ${item.audioId}`);
  if (/[؀-ۿ]/.test(path.basename(item.qrFile))) fail(`nom de fichier QR contient de l'arabe : ${item.qrFile}`);

  const entry = manifest.entries[item.audioId];
  if (!entry) {
    fail(`QR pour un audio_id absent du manifest : ${item.audioId}`);
    continue;
  }
  if (!entry.includeInBookQr) fail(`QR généré pour une activité non éligible (includeInBookQr=false) : ${item.audioId}`);

  const expectedTarget = `${qrMeta.baseUrl}/a/${encodeURIComponent(item.audioId)}`;
  if (item.target !== expectedTarget) fail(`target incohérent pour ${label} : ${item.target} != ${expectedTarget}`);
  if (/\.mp3(\?|$)/i.test(item.target)) fail(`QR pointe directement vers un MP3 : ${label}`);
  if (/^file:\/\//.test(item.target)) fail(`QR pointe vers file:// : ${label}`);
  if (/localhost|127\.0\.0\.1/.test(item.target)) fail(`QR pointe vers localhost : ${label}`);
  if (item.target.includes('..') || item.target.includes('%2e%2e')) fail(`séquence de path traversal détectée dans le target : ${label}`);

  const priorTarget = seenTargets.get(item.target);
  if (priorTarget && priorTarget !== item.audioId) fail(`même target pour deux audio_id différents : ${priorTarget} et ${item.audioId} -> ${item.target}`);
  seenTargets.set(item.target, item.audioId);

  const qrAbsPath = path.join(projectRoot, item.qrFile);
  if (!fs.existsSync(qrAbsPath)) {
    fail(`image QR manquante sur le disque : ${item.qrFile}`);
    continue;
  }

  const buffer = fs.readFileSync(qrAbsPath);
  const actualSha = crypto.createHash('sha256').update(buffer).digest('hex');
  if (actualSha !== item.sha256) fail(`sha256 ne correspond pas au fichier réel : ${label}`);

  let png: PNG;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    fail(`image QR illisible (PNG corrompu) : ${label}`);
    continue;
  }
  if (png.width < MIN_PRINT_PX || png.height < MIN_PRINT_PX) {
    fail(`QR plus petit que le minimum imprimable de 18mm/300DPI (${MIN_PRINT_PX}px) : ${label} = ${png.width}x${png.height}`);
  }

  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!decoded) {
    fail(`QR illisible par un décodeur indépendant : ${label}`);
  } else if (decoded.data !== item.target) {
    fail(`QR décodé ne correspond pas au target attendu : ${label} — lu "${decoded.data}", attendu "${item.target}"`);
  } else {
    ok(`${label} -> décodé et vérifié : ${decoded.data}`);
  }
}

// ── Couverture : toute activité d'écoute éligible a-t-elle un QR ? ────────
const includeAudioQr = process.env.INCLUDE_AUDIO_QR !== 'false';
const sampleIds = process.env.AUDIO_QR_SAMPLE_IDS?.split(',').map((s) => s.trim()).filter(Boolean);
if (includeAudioQr && !sampleIds) {
  const eligibleIds = Object.values(manifest.entries).filter((e) => e.includeInBookQr).map((e) => e.audioId);
  const missingQr = eligibleIds.filter((id) => !seenAudioIds.has(id));
  if (missingQr.length) {
    fail(`activité(s) éligible(s) sans QR généré (${missingQr.length}) : ${missingQr.slice(0, 10).join(', ')}${missingQr.length > 10 ? '…' : ''}`);
  } else {
    ok(`toutes les activités éligibles (${eligibleIds.length}) ont un QR`);
  }
} else if (sampleIds?.length) {
  console.log(`Lot restreint (AUDIO_QR_SAMPLE_IDS) : couverture totale non vérifiée (attendu en phase échantillon).`);
}

console.log(`\n${failures === 0 ? 'Validation QR réussie' : `Validation QR ÉCHOUÉE — ${failures} problème(s)`} — ${qrMeta.items.length} QR contrôlés.`);
process.exit(failures === 0 ? 0 : 1);
