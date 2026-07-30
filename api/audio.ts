import type { Request, Response } from 'express';
import path from 'path';
import { handleAudioResolver } from '../src/server/audioResolver.js';

export default function audioResolver(req: Request, res: Response): void {
  try {
    const value = req.query?.audioId;
    const audioId = Array.isArray(value) ? value[0] : value;
    handleAudioResolver(
      req,
      res,
      path.resolve(process.cwd(), 'public', 'audio', 'manifest.v2.json'),
      typeof audioId === 'string' ? audioId : '',
      process.env.NOUTQ_WEB_AUDIO_ENABLED === 'true',
    );
  } catch (err) {
    // handleAudioResolver a son propre try/catch ; celui-ci ne couvre que ce
    // qui l'entoure (lecture de req.query, résolution de chemin) pour éviter
    // un FUNCTION_INVOCATION_FAILED opaque côté Vercel sans aucune trace utile.
    console.error('[api/audio] unhandled error:', err);
    res.status(500).send('Audio resolver unavailable');
  }
}
