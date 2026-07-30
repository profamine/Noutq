export function normalizePublicBaseUrl(
  rawValue: string | undefined,
  production = true,
): string | null {
  const value = rawValue?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('INVALID_NOUTQ_PUBLIC_BASE_URL');
  }

  if (production && url.protocol !== 'https:') {
    throw new Error('NOUTQ_PUBLIC_BASE_URL_REQUIRES_HTTPS');
  }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('INVALID_NOUTQ_PUBLIC_BASE_URL');
  }

  return url.toString().replace(/\/+$/, '');
}

export function buildAudioStableUrl(baseUrl: string, audioId: string): string {
  if (!/^[a-z0-9.-]+$/i.test(audioId)) throw new Error('INVALID_AUDIO_ID');
  return `${baseUrl}/a/${encodeURIComponent(audioId)}`;
}
