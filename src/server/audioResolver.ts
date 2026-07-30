import type { Request, Response } from 'express';
import fs from 'fs';

interface AudioEntry {
  status: 'available' | 'missing';
  src?: string;
  fallback?: string;
}

interface AudioManifest {
  entries: Record<string, AudioEntry>;
}

export function isValidAudioId(audioId: string): boolean {
  return /^[a-z0-9.-]+$/i.test(audioId);
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

export function handleAudioResolver(
  req: Request,
  res: Response,
  manifestPath: string,
  audioIdOverride?: string,
): void {
  const audioId = audioIdOverride ?? req.params.audioId;
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
    if (req.accepts('json') && !req.accepts('html')) {
      res.json({ audioId, ...entry });
      return;
    }
    if (entry.status === 'available' && entry.src) {
      res.redirect(302, entry.src);
      return;
    }

    res.status(200).type('html').send(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">' +
      '<title>Noutq — الصوت غير متاح</title>' +
      '<main dir="rtl" style="font-family:Arial,sans-serif;max-width:34rem;margin:4rem auto;padding:1.5rem;line-height:1.7">' +
      '<h1>الصوت غير متاح حاليًا</h1>' +
      '<p>يمكنك متابعة نشاط القراءة أو الكتابة داخل تطبيق Noutq.</p>' +
      '<hr><p dir="ltr">Ձայնը դեռ հասանելի չէ։ Շարունակեք կարդալու կամ գրելու առաջադրանքը Noutq հավելվածում։</p>' +
      '</main>',
    );
  } catch {
    res.status(503).send('Audio resolver unavailable');
  }
}
