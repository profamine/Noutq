import { describe, expect, it } from 'vitest';
import { buildAudioStableUrl, normalizePublicBaseUrl } from './publicUrl';

describe('NOUTQ_PUBLIC_BASE_URL', () => {
  it('keeps QR disabled when no canonical URL is configured', () => {
    expect(normalizePublicBaseUrl(undefined)).toBeNull();
    expect(normalizePublicBaseUrl('   ')).toBeNull();
  });

  it('normalizes a valid HTTPS base URL', () => {
    expect(normalizePublicBaseUrl('https://noutq.example/app/')).toBe('https://noutq.example/app');
  });

  it('rejects HTTP in production and URLs with query state', () => {
    expect(() => normalizePublicBaseUrl('http://noutq.example')).toThrow('REQUIRES_HTTPS');
    expect(() => normalizePublicBaseUrl('https://noutq.example?x=1')).toThrow('INVALID');
  });

  it('builds a stable resolver URL and rejects malformed IDs', () => {
    expect(buildAudioStableUrl('https://noutq.example', 'u7.1')).toBe('https://noutq.example/a/u7.1');
    expect(() => buildAudioStableUrl('https://noutq.example', '../secret')).toThrow('INVALID_AUDIO_ID');
  });
});
