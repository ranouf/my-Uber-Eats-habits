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

## Limites

La documentation officielle [Consumer Delivery APIs](https://developer.uber.com/docs/consumer-delivery/introduction) mentionne l'historique, mais les spécifications détaillées sont proposées sur accès accordé par Uber. Le contrat décrit ici provient des appels du site, pas d'une API publique garantie pour les extensions.

Le panneau charge une page à l'ouverture, puis les suivantes sur demande, y compris depuis l'accueil français. Il ne prétend pas avoir chargé tout l'historique lorsque `hasMore` vaut `true`. Les réponses 401/403 sont distinguées d'un historique vide ; une réponse invalide produit une erreur de lecture. La lecture des commandes ne passe, ne modifie et n'annule aucune commande.
