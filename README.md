# Noutq — Apprendre l'arabe (interface arménienne)

Application d'apprentissage de l'arabe (niveau A1, ~600 mots, 22 leçons) avec interface en arménien : leçons interactives, flashcards, exercices d'écoute et de grammaire, chat avec un tuteur IA, reconnaissance et synthèse vocale.

## Stack

- **Front** : React 19 + Vite 6 + Tailwind CSS 4
- **Serveur** : Express (sert le front et les routes `/api/*`)
- **IA** : Gemini 2.5 Flash via `@google/genai` — chat, TTS et transcription, **côté serveur uniquement** (la clé API ne quitte jamais le serveur)
- **Mobile** : Capacitor 8 (Android)

## Lancer en local

1. Installer les dépendances :
   ```
   npm install
   ```
2. Créer un fichier `.env` à la racine (voir `.env.example`) avec votre clé Gemini :
   ```
   GEMINI_API_KEY=votre_clé
   ```
3. Démarrer :
   ```
   npm run dev
   ```
   L'application est servie sur http://localhost:3000.

Sans clé API, les leçons et exercices fonctionnent (audio pré-généré dans `public/audio/`) ; seuls le chat IA, la transcription vocale et la génération TTS à la volée sont indisponibles.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Express + Vite middleware) |
| `npm run build` | Build de production (front + serveur) dans `dist/` |
| `npm run start` | Lance le build de production |
| `npm run lint` | Vérification TypeScript (`tsc --noEmit`) |
| `npx tsx scripts/generateAll.ts` | Pré-génère les fichiers audio des leçons (serveur dev démarré requis) |
| `npm run android:build` | Build + synchronisation Capacitor Android |
| `npm run android:open` | Ouvre le projet Android Studio |
