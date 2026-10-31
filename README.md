# UberEatHabits

Extension Chrome qui ajoute directement dans Uber Eats un panneau regroupant les restaurants par dernière commande, avec leurs commandes passées et les liens vers les reçus.

## Installation locale

Dans `chrome://extensions`, activer le mode développeur, choisir **Charger l'extension non empaquetée**, puis sélectionner le dossier racine `my-Uber-Eats-habits` qui contient `manifest.json`. Si une erreur de chargement est déjà ouverte, cliquer sur **Retry**.

Après une mise à jour des fichiers, recharger **UberEatHabits** dans `chrome://extensions`, puis actualiser l'onglet Uber Eats. Le panneau **Mes restaurants** s'ouvre automatiquement sur l'historique. Sur les autres pages, notamment `/ca-fr/feed?diningMode=DELIVERY`, cliquer sur le bouton noir **Mes restaurants** en bas à droite : les commandes sont chargées directement sans quitter la page.

Le panneau reprend la police du site et ses surfaces noires, blanches et grises. Il regroupe les commandes retournées par l'API du site et permet de chercher un restaurant. **Charger plus de commandes** récupère la page suivante ; **Actualiser** reprend les commandes les plus récentes. Les articles proviennent de la réponse API ; chaque reçu donne accès aux personnalisations et au détail complet. Les données restent en mémoire dans l'onglet, sans stockage persistant ni envoi à un service tiers. L'accès est limité au site `https://www.ubereats.com/*`. Aucun identifiant de publication n'est inclus dans l'extension.

La source et la pagination vérifiées sont décrites dans [l'analyse API](UBER_EATS_API.md). La session Uber Eats existante est utilisée, sans création ni copie de token. Cette API interne peut évoluer ; une erreur de session ou de lecture est affichée explicitement.

## Versionnement

La version installée est affichée sur le bouton **Mes restaurants** et dans l'en-tête du panneau, à partir du manifeste Chrome.

Avant chaque modification livrée, exécuter `npm run version:bump` pour incrémenter le correctif. Le cycle npm synchronise automatiquement `package.json`, `package-lock.json` et `manifest.json`. Le workflow de validation refuse une version qui n'est pas supérieure à celle du commit précédent. Les changements mineurs ou majeurs utilisent respectivement `npm version minor --no-git-tag-version` et `npm version major --no-git-tag-version`.

## Configuration de publication

La démarche reprend celle de BNRI Évolution avec un projet Google Cloud, un client OAuth et un refresh token dédiés à UberEatHabits.

Le projet `ubereathabits` (numéro `802143951052`) est créé dans l'organisation `carnould.com`. Chrome Web Store API est activée et la facturation est désactivée. Le client de bureau **UberEatHabits Publication** et un nouveau refresh token sont créés. Les secrets du client, du token et de l'éditeur sont enregistrés dans le dépôt. La fiche Chrome Web Store reste à créer après construction de l'extension ; `CHROME_EXTENSION_ID` n'est donc pas encore configuré.

Commandes utilisées :

```sh
gcloud projects create ubereathabits --name=UberEatHabits --organization=506633713783 --no-enable-cloud-apis --quiet
gcloud billing projects describe ubereathabits
gcloud services enable chromewebstore.googleapis.com --project=ubereathabits --quiet
```

La création d'un client OAuth destiné à Chrome Web Store se fait dans [Google Auth Platform](https://console.cloud.google.com/auth/clients?project=ubereathabits). Les commandes `gcloud iam oauth-clients` gèrent d'autres types de clients et ne proposent pas la portée Chrome Web Store. Le client est de type **Application de bureau**, dédié à UberEatHabits. Le flux a utilisé la bibliothèque officielle Google fournie avec le SDK et uniquement la portée Chrome Web Store : la commande `gcloud auth application-default login` exigeait aussi la portée Google Cloud. Le consentement de l'éditeur est une étape interactive.

1. Créer le projet Google Cloud `UberEatHabits`.
2. Activer Chrome Web Store API dans ce projet.
3. Configurer l'écran de consentement OAuth pour UberEatHabits.
4. Créer un client OAuth dédié à la publication.
5. Autoriser le compte éditeur avec la portée `https://www.googleapis.com/auth/chromewebstore` et obtenir un nouveau refresh token avec accès hors ligne.
6. Créer la fiche Chrome Web Store de cette extension pour obtenir son identifiant.
7. Enregistrer les valeurs dans les secrets du dépôt `ranouf/my-Uber-Eats-habits` avec `gh secret set`.
8. Exécuter le workflow manuel **Validate Chrome Web Store credentials**. Il vérifie OAuth par défaut ; activer `check_extension` après création de la fiche pour vérifier également l'accès à cette extension.

Secrets attendus :

- `CHROME_CLIENT_ID` : nouveau client OAuth UberEatHabits.
- `CHROME_CLIENT_SECRET` : secret de ce nouveau client.
- `CHROME_REFRESH_TOKEN` : nouveau jeton obtenu pour ce client.
- `CHROME_EXTENSION_ID` : identifiant de la nouvelle fiche UberEatHabits.
- `CHROME_PUBLISHER_ID` : identifiant du compte éditeur propriétaire de cette fiche, à relever dans son tableau de bord.

L'identifiant éditeur est attribué par Google au compte de publication ; il peut être identique pour plusieurs extensions de ce même compte. Il ne se génère pas comme un token.

Les identifiants de publication servent aux workflows GitHub. Ils ne seront pas inclus dans l'extension installée ni utilisés pour accéder aux commandes Uber Eats.

## Vérification locale

```sh
npm run check
npm run format:check
npm test
npm run chrome-store:oauth-check
npm run chrome-store:dry-run
```

La vérification OAuth nécessite les trois secrets du client et du token. La dernière commande nécessite les cinq variables d'environnement et vérifie aussi la fiche de l'extension sans publier. Ne jamais enregistrer les secrets dans un fichier suivi par Git.

Les tests chargent l'extension dans un Chromium isolé et vérifient le panneau injecté, le regroupement, la recherche, le chargement de nouvelles commandes et la fermeture du panneau. Ils utilisent des commandes fictives et produisent des captures desktop/mobile dans le dossier temporaire ignoré. Installer le navigateur de test avec `npx playwright install chromium` avant la première exécution. Le workflow **Validate extension** exécute ces contrôles sur les modifications de `main` et les PR.

## Références

- [Utiliser Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)
- [OAuth et durée de vie des refresh tokens](https://developers.google.com/identity/protocols/oauth2#expiration)
