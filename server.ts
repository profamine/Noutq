import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

import apiApp from './api/index.js'; // Note: Node respects .js extension for TS files with ts-node/tsx

// ─── Serveur principal ───────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  const app = express();
  const PORT = 3000;
  const IS_PROD = process.env.NODE_ENV === 'production';

  // Mount API paths
  app.use(apiApp);

  // ── Middleware Vite (dev) ou fichiers statiques (prod) ──────────────────
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ── Démarrage ───────────────────────────────────────────────────────────
  app.listen(PORT, '0.0.0.0', () => {
    const env = IS_PROD ? 'production' : 'développement';
    console.log(`✅ Serveur ${env} démarré → http://localhost:${PORT}`);
    console.log(`🤖 Modèle Gemini : gemini-2.5-flash`);
  });
}

startServer().catch((err) => {
  console.error('❌ Erreur fatale au démarrage :', err);
  process.exit(1);
});