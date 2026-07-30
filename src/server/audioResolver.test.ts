import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { handleAudioResolver } from './audioResolver';

const manifestPath = path.resolve(process.cwd(), 'public', 'audio', 'manifest.v2.json');
// Manifeste figé dédié au cas « ID connu mais audio absent » : le contenu réel
// finit par ne plus avoir d'entrée manquante une fois tous les enregistrements
// livrés, ce test ne doit donc pas dépendre de l'état d'avancement réel.
const missingIdManifestPath = path.resolve(__dirname, '__fixtures__', 'manifest.missing-id.json');
let server: http.Server;
let baseUrl: string;
let missingIdServer: http.Server;
let missingIdBaseUrl: string;

async function listen(app: express.Express): Promise<{ server: http.Server; baseUrl: string }> {
  const srv = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = srv.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_ADDRESS_UNAVAILABLE');
  return { server: srv, baseUrl: `http://127.0.0.1:${address.port}` };
}

beforeAll(async () => {
  const app = express();
  app.get('/a/:audioId', (req, res) => handleAudioResolver(req, res, manifestPath));
  ({ server, baseUrl } = await listen(app));

  const missingIdApp = express();
  missingIdApp.get('/a/:audioId', (req, res) => handleAudioResolver(req, res, missingIdManifestPath));
  ({ server: missingIdServer, baseUrl: missingIdBaseUrl } = await listen(missingIdApp));
});

afterAll(async () => {
  await Promise.all(
    [server, missingIdServer].map(
      (s) => new Promise<void>((resolve, reject) => s.close((error) => error ? reject(error) : resolve())),
    ),
  );
});

describe('stable audio resolver', () => {
  it('redirects a known available ID to its real local asset', async () => {
    const response = await fetch(`${baseUrl}/a/u7.1`, { redirect: 'manual' });
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toMatch(/^\/audio\//);
  });

  it('returns a bilingual fallback for a known missing ID', async () => {
    const response = await fetch(`${missingIdBaseUrl}/a/fixture.missing.01`, { redirect: 'manual' });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('الصوت غير متاح');
  });

  it('returns 404 for an unknown ID and 400 for a malformed ID', async () => {
    expect((await fetch(`${baseUrl}/a/not.real`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/a/bad%20id`)).status).toBe(400);
  });

  it('retains legacy aliases for every corrected Arabic source', () => {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    for (const id of ['u13.7', 'u15.7', 'u16.3']) {
      expect(manifest.entries[id].legacyAliases).toHaveLength(1);
      expect(manifest.legacyTextSources[manifest.entries[id].legacyAliases[0]]).toMatch(/^\/audio\//);
    }
  });
});
