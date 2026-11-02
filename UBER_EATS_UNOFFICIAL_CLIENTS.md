# Clients et schémas Uber Eats non officiels

Recherche effectuée le 1 novembre 2026 dans les dépôts publics. Aucun de ces projets n’est un service officiel Uber. Aucun client tiers n’a été installé et aucun cookie personnel ne leur a été transmis.

| Projet                                                                                                      | Couverture constatée                                                                 | Utilité et limites pour cette extension                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Openweb : schéma Uber Eats](https://github.com/imoonkey/openweb/blob/main/src/sites/ubereats/openapi.yaml) | OpenAPI 3.1 ; recherche, historique, restaurant, article et adaptateurs de panier    | Référence proche des opérations du site. Certaines réponses sont déjà transformées et les chemins `/internal/*` appartiennent à ses adaptateurs, pas à Uber. Ce schéma ne peut donc pas remplacer directement le contrat réseau de l’extension. Dépôt sous licence MIT. |
| [Simple Uber Eats](https://github.com/alfredolvera/simple-uber-eats)                                        | Intégration Home Assistant de suivi des commandes via les points d’accès web         | Référence complémentaire pour le suivi, pas un schéma complet de l’historique et des évaluations. Dépôt sous licence MIT.                                                                                                                                               |
| [golang-ubereats](https://github.com/dan-v/golang-ubereats)                                                 | Client Go : liste des restaurants par position et détails des restaurants            | Exemple de modèles de restaurants ; dépôt archivé. Ne couvre pas le besoin de relecture des notes personnelles. Licence MIT.                                                                                                                                            |
| [API Evangelist : Uber Eats](https://github.com/api-evangelist/uber-eats)                                   | Profil tiers des API Marketplace, Reporting et Direct, avec spécifications associées | Concerne surtout les intégrations partenaires et marchands. Les contrats `api.uber.com` ne correspondent pas aux appels de session `www.ubereats.com/_p/api`. Aucune licence de dépôt détectée lors de la recherche ; contenu non recopié.                              |

## Choix retenu

Le fichier `openapi.local.json` est une reconstruction propre au projet à partir du [catalogue existant](UBER_EATS_API_CATALOG.md). Il conserve les 109 noms d’opérations inventoriés. Les opérations sans contrat détaillé portent `x-contract-status: unverified` ; leur présence ne signifie pas qu’elles ont été exécutées ou qu’elles fonctionnent encore. Les huit contrats partiellement décrits restent marqués `partial`.

Le schéma décrit les réponses réseau enveloppées dans `status` et `data`, contrairement à certaines réponses transformées des bibliothèques communautaires. Il n’ajoute pas de route découverte chez un tiers sans vérification préalable de sa provenance et de son contrat. Aucun code de ces bibliothèques n’est intégré.

La [documentation officielle Consumer Delivery](https://developer.uber.com/docs/consumer-delivery/introduction) indique que les spécifications détaillées sont accessibles sur demande. Elle ne fournit pas un schéma public des opérations internes utilisées ici. L’absence de schéma public ne garantit pas qu’il n’en existe aucun sous accès partenaire.

## Génération et intercepteur

Prérequis : Node 24 et SDK .NET 10. La CLI NSwag 14.7.1 est épinglée dans `dotnet-tools.json`.

```powershell
npm ci
npm run api:generate
```

La commande restaure l’outil, lance `dotnet nswag run api.config.nswag`, puis compile `src/api.services.ts` vers `src/api.services.js` pour Chrome. Ces deux fichiers sont générés : modifier le schéma ou la configuration, puis régénérer. La CI vérifie qu’une régénération ne change aucun de ces fichiers.

Comme les intercepteurs des projets Emprez et Air Inuit, `src/api-interceptor.js` centralise les paramètres de session et les erreurs. Ici, le transport repose sur `fetch`, sans dépendance Angular : `credentials: same-origin`, en-tête CSRF, locale, erreurs HTTP et RPC. Il conserve le signal d’annulation et laisse les requêtes vers d’autres services intactes. Aucun jeton Bearer des autres projets n’est repris.

Toujours construire le client avec `createApiClient` de `src/api-client.js` pour appliquer cet intercepteur. Les réponses conservent leur enveloppe ; le lecteur de commandes utilise son champ `data`. La construction du client ne lance aucune requête. Les mutations restent déclenchées uniquement par un appel explicite.

Le mécanisme d’injection HTTP du [modèle Fetch de NSwag](https://github.com/RicoSuter/NSwag/blob/master/src/NSwag.CodeGeneration.TypeScript/Templates/FetchClient.liquid) permet de conserver l’intercepteur hors des fichiers générés.
