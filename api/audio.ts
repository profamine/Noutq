import type { Request, Response } from 'express';
import path from 'path';
import { handleAudioResolver } from '../src/server/audioResolver.js';

export default function audioResolver(req: Request, res: Response): void {
  const value = req.query.audioId;
  const audioId = Array.isArray(value) ? value[0] : value;
  handleAudioResolver(
    req,
    res,
    path.resolve(process.cwd(), 'public', 'audio', 'manifest.v2.json'),
    typeof audioId === 'string' ? audioId : '',
  );
}
