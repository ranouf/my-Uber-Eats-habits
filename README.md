# UberEatHabits

Extension Chrome en préparation pour retrouver les restaurants Uber Eats par date de dernière commande, puis consulter les dernières commandes de chaque restaurant.

## Configuration de publication

La démarche reprend celle de BNRI Évolution avec un projet Google Cloud, un client OAuth et un refresh token dédiés à UberEatHabits.

Le projet `ubereathabits` (numéro `802143951052`) est créé dans l'organisation `carnould.com`. Chrome Web Store API est activée et la facturation est désactivée. Le client OAuth, le refresh token et la fiche Chrome Web Store restent à créer.

Commandes utilisées :

```sh
gcloud projects create ubereathabits --name=UberEatHabits --organization=506633713783 --no-enable-cloud-apis --quiet
gcloud billing projects describe ubereathabits
gcloud services enable chromewebstore.googleapis.com --project=ubereathabits --quiet
```

La création d'un client OAuth destiné à Chrome Web Store se fait dans [Google Auth Platform](https://console.cloud.google.com/auth/clients?project=ubereathabits). Les commandes `gcloud iam oauth-clients` gèrent d'autres types de clients et ne proposent pas la portée Chrome Web Store. Utiliser un client de type **Application de bureau**, dédié à UberEatHabits, puis télécharger son JSON hors des fichiers suivis par Git. Le consentement de l'éditeur reste une étape interactive.

1. Créer le projet Google Cloud `UberEatHabits`.
2. Activer Chrome Web Store API dans ce projet.
3. Configurer l'écran de consentement OAuth pour UberEatHabits.
4. Créer un client OAuth dédié à la publication.
5. Autoriser le compte éditeur avec la portée `https://www.googleapis.com/auth/chromewebstore` et obtenir un nouveau refresh token avec accès hors ligne.
6. Créer la fiche Chrome Web Store de cette extension pour obtenir son identifiant.
7. Enregistrer les valeurs dans les secrets du dépôt `ranouf/my-Uber-Eats-habits` avec `gh secret set`.
8. Exécuter le workflow manuel **Validate Chrome Web Store credentials**.

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
npm run chrome-store:dry-run
```

La seconde commande nécessite les cinq variables d'environnement. Elle vérifie l'accès OAuth et la fiche de l'extension sans publier. Ne jamais enregistrer les secrets dans un fichier suivi par Git.

## Références

- [Utiliser Chrome Web Store API](https://developer.chrome.com/docs/webstore/using-api)
- [OAuth et durée de vie des refresh tokens](https://developers.google.com/identity/protocols/oauth2#expiration)
