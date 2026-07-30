# Android App Links pour les QR audio du livre

Permet à `https://noutq.vercel.app/a/{audioId}` d'ouvrir directement
l'application Noutq (sans passer par la page web de secours) quand elle est
installée.

## Ce qui est déjà en place

- `android/app/src/main/AndroidManifest.xml` : intent-filter HTTPS
  `autoVerify="true"`, host `noutq.vercel.app`, `pathPrefix="/a/"`.
- `public/.well-known/assetlinks.json` : présent mais avec un **placeholder**
  (`sha256_cert_fingerprints`) — l'App Link ne se vérifiera pas tant qu'il
  n'est pas remplacé par une vraie empreinte.
- `vercel.json` : route explicite pour `/.well-known/assetlinks.json` avant le
  catch-all SPA, afin qu'il soit servi tel quel et non remplacé par
  `index.html`.

Tant que le placeholder est en place, le comportement reste **sûr** : Android
n'ouvre pas l'app automatiquement, le lien retombe sur la page web de secours
(`/a/{audioId}`), rien n'est cassé.

## Ce que vous devez remplir vous-même

Un package name ou une empreinte inventés ne peuvent pas être devinés par un
agent : ils dépendent de votre compte de signature. Voici comment obtenir la
vraie empreinte.

### Empreinte de debug (build local / CI actuel)

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copiez la ligne `SHA256:` (format `AA:BB:CC:...`, 32 paires hexadécimales).

### Empreinte de release (future signature de production)

```bash
keytool -list -v -keystore /chemin/vers/votre-release.keystore -alias VOTRE_ALIAS
```

Il vous sera demandé le mot de passe du keystore. Copiez de la même façon la
ligne `SHA256:`.

### Remplir assetlinks.json

Remplacez le placeholder par un tableau contenant les empreintes debug **et**
release (les deux sont valides simultanément — utile pendant que vous testez
en debug avant la première release signée) :

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.noutq.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:...empreinte debug...",
        "DD:EE:FF:...empreinte release..."
      ]
    }
  }
]
```

Puis déployez (`vercel --prod` ou push sur la branche liée) pour que le
fichier soit servi sur le domaine réel.

## Vérifier après déploiement

1. Le fichier doit être accessible tel quel, sans redirection ni HTML autour :

   ```bash
   curl -s https://noutq.vercel.app/.well-known/assetlinks.json
   ```

2. Outil officiel Google de validation :
   `https://developers.google.com/digital-asset-links/tools/generator`
   (choisir "Android App", renseigner le domaine, le package name et
   l'empreinte).

3. Sur un appareil ou émulateur avec l'APK installé :

   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://noutq.vercel.app/a/u7.1"
   ```

   Résultat attendu : Noutq s'ouvre directement sur l'activité de l'unité 7,
   étape 1 (« Ողջույններ »), sans écran de choix d'application.

4. Statut de la vérification déjà effectuée par Android :

   ```bash
   adb shell pm get-app-links com.noutq.app
   ```

   Doit afficher `noutq.vercel.app: verified`. Si ce n'est pas le cas,
   revérifiez assetlinks.json (JSON valide, bon package name, bonne
   empreinte) puis réinstallez l'APK — Android ne revérifie qu'à
   l'installation ou via `pm verify-app-links --re-verify com.noutq.app`.

## Repli volontaire : custom scheme

Ce projet ne configure pas de custom scheme (`noutq://`) en complément des
App Links HTTPS. Les QR imprimés dans le livre pointent uniquement vers
`https://noutq.vercel.app/a/{audioId}` : c'est le lien qui doit rester valide
à vie, y compris pour un lecteur sans l'app installée (page web de secours).
Un custom scheme pourrait être ajouté plus tard comme raccourci interne,
mais ne doit jamais remplacer le lien HTTPS dans le livre.
