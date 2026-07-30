import { describe, it, expect } from 'vitest';
import { isValidAudioId, extractAudioIdFromPath } from './audioId';

describe('isValidAudioId', () => {
  it('accepts real audio_id shapes', () => {
    for (const id of ['u7.1', 'u8.71', 'u15.7', 'v5.c03.01', 'v5.c05.01']) {
      expect(isValidAudioId(id)).toBe(true);
    }
  });

  it('rejects malformed or unsafe input', () => {
    for (const id of ['../../etc/passwd', 'bad id', 'a<script>', '', 'a/b', 'a?b=c']) {
      expect(isValidAudioId(id)).toBe(false);
    }
  });
});

describe('extractAudioIdFromPath', () => {
  it('extracts the ID from a bare path', () => {
    expect(extractAudioIdFromPath('/a/u7.1')).toBe('u7.1');
  });

  it('extracts the ID from a full HTTPS URL', () => {
    expect(extractAudioIdFromPath('https://noutq.vercel.app/a/v5.c05.01')).toBe('v5.c05.01');
  });

  it('stops at a query string or fragment', () => {
    expect(extractAudioIdFromPath('https://noutq.vercel.app/a/u7.1?utm=book')).toBe('u7.1');
    expect(extractAudioIdFromPath('https://noutq.vercel.app/a/u7.1#section')).toBe('u7.1');
  });

  it('returns null for a non-audio path, never guessing', () => {
    expect(extractAudioIdFromPath('https://noutq.vercel.app/')).toBeNull();
    expect(extractAudioIdFromPath('https://noutq.vercel.app/api/status')).toBeNull();
    expect(extractAudioIdFromPath('not a url at all')).toBeNull();
  });

  it('decodes a URL-encoded audio_id', () => {
    expect(extractAudioIdFromPath('/a/u7.1%20')).toBe('u7.1 ');
  });
});
