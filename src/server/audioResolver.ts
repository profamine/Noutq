import type { Request, Response } from 'express';
import fs from 'fs';
import { isValidAudioId } from '../shared/audioId';

export { isValidAudioId };

interface AudioEntry {
  status: 'available' | 'missing';
  src?: string;
  fallback?: string;
  activityType?: string;
  unitTitleAr?: string;
  unitTitleHy?: string;
  text?: string;
}

interface AudioManifest {
  entries: Record<string, AudioEntry>;
}

/**
 * Le manifeste est un artefact de build : il ne change pas pendant la vie du
 * processus. On le garde en mémoire, indexé par chemin, pour éviter une lecture
 * disque synchrone à chaque requête. La clé de cache inclut mtime + taille afin
 * qu'une régénération pendant le développement soit prise en compte.
 */
const manifestCache = new Map<string, { key: string; manifest: AudioManifest }>();

function loadManifest(manifestPath: string): AudioManifest {
  const stat = fs.statSync(manifestPath);
  const key = `${stat.mtimeMs}:${stat.size}`;
  const cached = manifestCache.get(manifestPath);
  if (cached?.key === key) return cached.manifest;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as AudioManifest;
  manifestCache.set(manifestPath, { key, manifest });
  return manifest;
}

const ACTIVITY_LABEL_AR: Record<string, string> = {
  listen: 'استماع', listening: 'استماع', 'listening-discrimination': 'تمييز سمعي',
  speak: 'نطق', 'mini-dialogue': 'حوار', production: 'إنتاج',
  quiz: 'اختبار', match: 'مطابقة', write: 'كتابة', writing: 'كتابة', reading: 'قراءة',
};
const ACTIVITY_LABEL_HY: Record<string, string> = {
  listen: 'Լսողություն', listening: 'Լսողություն', 'listening-discrimination': 'Լսողական տարբերակում',
  speak: 'Արտասանություն', 'mini-dialogue': 'Երկխոսություն', production: 'Արտադրություն',
  quiz: 'Թեստ', match: 'Համապատասխանեցում', write: 'Գրություն', writing: 'Գրություն', reading: 'Ընթերցում',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string
  ));
}

/**
 * Page de secours affichée quand l'App Link n'ouvre pas l'application
 * (app non installée, lien pas encore vérifié par Android, ou navigateur
 * desktop). L'audio reste Local-first : cette page ne prétend jamais pouvoir
 * le lire — voir NOUTQ_WEB_AUDIO_ENABLED.
 */
function renderFallbackPage(audioId: string, entry: AudioEntry, audioReachableOnWeb: boolean): string {
  const activityLabelAr = (entry.activityType && ACTIVITY_LABEL_AR[entry.activityType]) || entry.activityType || '';
  const activityLabelHy = (entry.activityType && ACTIVITY_LABEL_HY[entry.activityType]) || '';
  const isAvailable = entry.status === 'available';

  const heading = isAvailable
    ? 'هذا الصوت جاهز داخل تطبيق Noutq'
    : 'الصوت غير متاح حاليًا';
  const bodyAr = isAvailable
    ? 'افتح تطبيق Noutq وتوجّه إلى هذا النشاط للاستماع — الصوت محفوظ محليًا ولا يحتاج إنترنت.'
    : 'يمكنك متابعة نشاط القراءة أو الكتابة داخل تطبيق Noutq. سيتوفر هذا الصوت لاحقًا بالمعرّف نفسه، دون الحاجة لأي رابط جديد.';
  const bodyHy = isAvailable
    ? 'Բացեք Noutq հավելվածը և անցեք այս առաջադրանքին՝ լսելու համար. ձայնը պահված է լոկալ և ինտերնետ չի պահանջում։'
    : 'Կարող եք շարունակել կարդալու կամ գրելու առաջադրանքը Noutq հավելվածում։ Այս ձայնը հասանելի կլինի ավելի ուշ, նույն հասցեով։';

  const metaRows = [
    entry.unitTitleAr && `<dt>الوحدة</dt><dd>${escapeHtml(entry.unitTitleAr)}${entry.unitTitleHy ? ` <span dir="ltr" style="color:#6b7280">— ${escapeHtml(entry.unitTitleHy)}</span>` : ''}</dd>`,
    activityLabelAr && `<dt>نوع النشاط</dt><dd>${escapeHtml(activityLabelAr)}${activityLabelHy ? ` <span dir="ltr" style="color:#6b7280">— ${escapeHtml(activityLabelHy)}</span>` : ''}</dd>`,
    entry.text && `<dt>النص</dt><dd style="font-size:1.4rem">${escapeHtml(entry.text)}</dd>`,
  ].filter(Boolean).join('');

  return (
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<title>Noutq — ${escapeHtml(heading)}</title>` +
    '<main dir="rtl" style="font-family:Arial,sans-serif;max-width:34rem;margin:3rem auto;padding:1.5rem;line-height:1.8;color:#111827">' +
    '<p style="font-weight:bold;color:#0F3D2E;font-size:1.1rem;margin:0 0 1.5rem">Noutq</p>' +
    `<h1 style="font-size:1.4rem">${escapeHtml(heading)}</h1>` +
    (metaRows ? `<dl style="background:#f9fafb;border-radius:0.75rem;padding:1rem 1.25rem;margin:1.25rem 0">${metaRows}</dl>` : '') +
    `<p>${escapeHtml(bodyAr)}</p>` +
    (audioReachableOnWeb && entry.src ? `<p><a href="${escapeHtml(entry.src)}" style="display:inline-block;background:#1F6F54;color:#fff;text-decoration:none;padding:0.6rem 1.25rem;border-radius:0.5rem;font-weight:bold">🔊 تشغيل الصوت هنا</a></p>` : '') +
    `<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0">` +
    `<p dir="ltr" style="color:#374151">${escapeHtml(bodyHy)}</p>` +
    '</main>'
  );
}

export function handleAudioResolver(
  req: Request,
  res: Response,
  manifestPath: string,
  audioIdOverride?: string,
  webAudioEnabled = false,
): void {
  const audioId = audioIdOverride ?? req.params?.audioId;
  if (!isValidAudioId(audioId)) {
    res.status(400).send('Invalid audio ID');
    return;
  }

  try {
    const manifest = loadManifest(manifestPath);
    const entry = manifest.entries[audioId];
    if (!entry) {
      res.status(404).send('Audio ID not found');
      return;
    }
    // req.accepts() est une méthode Express — indisponible sur le req brut
    // qu'expose une Vercel Serverless Function (api/audio.ts n'est pas une
    // app Express, contrairement à server.ts en dev). On lit l'en-tête
    // Accept directement pour que ça fonctionne dans les deux runtimes.
    const acceptHeader = String(req.headers?.accept ?? '');
    const prefersJson = acceptHeader.includes('application/json') && !acceptHeader.includes('text/html');
    if (prefersJson) {
      res.json({ audioId, ...entry, webAudioEnabled });
      return;
    }
    // L'audio est Local-first (embarqué dans l'APK) : même quand un fichier
    // existe et pourrait techniquement être servi par ce déploiement, on ne
    // redirige vers lui que si l'exploitant a explicitement choisi de publier
    // une copie web (NOUTQ_WEB_AUDIO_ENABLED=true) — jamais par défaut.
    if (entry.status === 'available' && entry.src && webAudioEnabled) {
      res.redirect(302, entry.src);
      return;
    }

    // res.type() est aussi une méthode Express uniquement ; res.send() d'une
    // chaîne retombe déjà sur text/html par défaut dans Express ET dans le
    // runtime Node de Vercel, donc inutile et non portable ici.
    res.status(200).send(
      renderFallbackPage(audioId, entry, webAudioEnabled && entry.status === 'available'),
    );
  } catch (err) {
    // Sans ce log, une régression ici est invisible : le catch précédent
    // avalait l'erreur et ne laissait qu'un 503 générique dans les logs Vercel.
    console.error('[audioResolver] unexpected error for audioId=%s: %o', audioId, err);
    res.status(503).send('Audio resolver unavailable');
  }
}
