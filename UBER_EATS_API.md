# Lecture de l'historique Uber Eats

Observation du site connecté le 30 octobre 2026, depuis `/ca-fr/orders`, avec vérification du bouton de pagination natif. Deux réponses de dix commandes ont été examinées. Les captures réseau brutes restent hors du dépôt ; les tests utilisent des exemples fictifs.

## Requête observée

```http
POST https://www.ubereats.com/_p/api/getPastOrdersV1?localeCode=ca-fr
Content-Type: application/json
x-csrf-token: x
```

Première page :

```json
{ "lastWorkflowUUID": "" }
```

Page suivante : transmettre dans `lastWorkflowUUID` le dernier identifiant de `data.orderUuids` de la réponse précédente. C'est le corps effectivement envoyé par le bouton « Afficher plus ». La réponse fournit aussi `paginationData.nextCursor`, mais ce curseur n'était pas envoyé par le site dans les deux requêtes observées. Ne pas le substituer à l'identifiant de commande sans nouvelle vérification.

La requête utilise la session du site. L'extension envoie les cookies par le mécanisme normal `credentials: "same-origin"`, sans les lire, les copier ni les enregistrer. Aucun token supplémentaire n'est créé.

## Champs utilisés

| Champ                                                           | Utilisation                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `status`                                                        | Vérification de la réponse `success`                          |
| `data.orderUuids`                                               | Identifiants dans l'ordre de récence retourné par le site     |
| `data.ordersMap[id]`                                            | Données d'une commande                                        |
| `baseEaterOrder.uuid`                                           | Identifiant stable de commande                                |
| `baseEaterOrder.lastStateChangeAt`                              | Date ISO, présentée dans le fuseau du navigateur avec l'année |
| `baseEaterOrder.shoppingCart.items[].quantity/title`            | Quantités et noms des articles                                |
| `storeInfo.uuid/title/slug`                                     | Regroupement, nom et lien du restaurant                       |
| `fareInfo.checkoutInfo[key = "eats_fare.total"].formattedValue` | Montant total déjà formaté par Uber Eats                      |
| `data.meta.hasMore`                                             | Affichage du bouton de page suivante                          |

Le lien du restaurant reprend le slug et l'UUID encodé en base64url, comme les liens du site. Le reçu utilise `/ca-fr/orders?mod=orderReceipt&modctx=IDENTIFIANT`. Les commandes dupliquées entre deux pages sont dédupliquées par identifiant ; les restaurants sont regroupés par UUID et conservent l'ordre des commandes reçu.

## Appels distincts

`getActiveOrdersV1` renvoie les commandes en cours et leur suivi. Il n'est pas utilisé pour construire l'historique des commandes passées. Les appels de brouillons, factures et télémétrie ne sont pas nécessaires au panneau.

## Notes publiques et personnelles

Les ressources publiques du site ont été examinées le 1 novembre 2026 sans reprendre l'observation du navigateur personnel :

- [Formulaire de notation](https://www.ubereats.com/_static/client-42362-5d0b6c22d697a175.js) : `getPendingRatingV1` reçoit `{ orderUuid, entryPoint }`. Le formulaire désigne sa page restaurant par `ratingInputPagesOrder.storeRatingPage`, puis `ratingInputPagesMap[id]` fournit `type: "STORE_RATING"`, `uuid` et `identifiers`.
- Le même composant construit `submitRatingV1` avec `workflowUUID`, `entryPoint` et `ratingItems`. Une étoile restaurant utilise `{ uuid, value, schema: "FIVE_STARS", subjectType: "STORE" }`, avec les identifiants `ONE_STAR` à `FIVE_STAR`. L'extension envoie uniquement cet élément, sans champ de pourboire, commentaire ou note de livreur.
- [Historique officiel](https://www.ubereats.com/_static/client-40870-1693fb432b9ab521.js) : le site conditionne l'accès au formulaire à `ratingInfo.isRatable`. L'extension respecte cet indicateur et relit le formulaire avant chaque envoi. La réponse doit correspondre à la commande et au restaurant affichés.
- [Affichage des avis](https://www.ubereats.com/_static/client-25083-47b08f0eaea84644.js) : la moyenne publique utilise `rating.ratingValue` et le nombre d'avis `rating.reviewCount`, récupérés via `getStoreV1` avec `storeUuid`. Le champ `storeInfo.rating` de l’historique représente la note personnelle, pas cette moyenne publique.

Pour la note personnelle, le [composant de l’historique](https://www.ubereats.com/_static/client-77247-280999144a1ddd9c.js) transmet `storeInfo.rating` au [composant d’étoiles](https://www.ubereats.com/_static/client-40870-1693fb432b9ab521.js). Celui-ci affiche une étoile pleine pour chaque booléen vrai : `[true, true, true, true, false]` signifie 4/5. L’extension donne priorité à ce champ, même si `ratingInfo.userRatings` est vide et si `isRatable` vaut false. Elle reconnaît aussi les éléments `FIVE_STARS`/`STORE` de `userRatings` lorsque le tableau d’étoiles est absent ou vide. Les notes connues restent visibles en lecture seule et alimentent la moyenne personnelle. Les tests reproduisent ces contrats avec des données fictives ; aucun avis réel n’est envoyé pour les valider.

L'[aide Uber Eats](https://help.uber.com/fr-FR/ubereats/stores/article/i-had-an-issue-with-my-delivery-person-?nodeId=80c0a22a-2781-499c-84f1-fb0e8efb71f8) rattache l'évaluation à une commande livrée. Les règles d'éligibilité restent imposées par Uber Eats ; l'extension ne force pas la modification d'une ancienne note refusée par le site.

## Limites et validation

La documentation officielle [Consumer Delivery APIs](https://developer.uber.com/docs/consumer-delivery/introduction) mentionne l'historique, mais les spécifications détaillées sont proposées sur accès accordé par Uber. Le contrat décrit ici provient des appels du site, pas d'une API publique garantie pour les extensions.

Le panneau charge une page à l'ouverture, puis les suivantes sur demande, y compris depuis l'accueil français. Il ne prétend pas avoir chargé tout l'historique lorsque `hasMore` vaut `true`. Les réponses 401/403 sont distinguées d'un historique vide ; une réponse invalide produit une erreur de lecture. La lecture des commandes ne passe, ne modifie et n'annule aucune commande.
