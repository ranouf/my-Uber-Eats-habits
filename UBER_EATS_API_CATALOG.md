# Catalogue du service API Uber Eats

Inventaire du 30 octobre 2026 : **109 opérations**, retrouvées dans 103 bundles chargés sur l'accueil et dans les captures réseau de l'accueil et de l'historique. Le client RPC du site utilise POST et le préfixe `/_p/api/`. Le service se trouve dans [src/api.services.ts](src/api.services.ts).

Ce catalogue couvre les références accessibles lors de cette analyse, sans prétendre inventorier toutes les API d'Uber. Les ressources tierces, la télémétrie publicitaire et les API distinctes des SDK de paiement ne sont pas ajoutées au service. Aucune opération métier de mutation n'a été exécutée pour cette analyse.

## Utilisation

```js
import { createApiClient } from "./src/api-client.js";

const api = createApiClient("ca-fr");
const { data: firstPage } = await api.getPastOrdersV1({ lastWorkflowUUID: "" });
if (firstPage.meta.hasMore) {
  const { data: nextPage } = await api.getPastOrdersV1({
    lastWorkflowUUID: firstPage.orderUuids.at(-1),
  });
  console.log(nextPage.orderUuids.length);
}
```

La CLI NSwag génère le service TypeScript depuis `openapi.local.json`. `npm run api:generate` produit aussi le JavaScript utilisé par l’extension. Utiliser la fabrique `createApiClient` pour appliquer l’intercepteur de session et d’erreurs ; aucun cookie ni jeton n’est lu ou enregistré. Les réponses conservent leur enveloppe `status`/`data`. Les erreurs HTTP ou RPC produisent `UberEatsApiError` ; le paramètre `signal` permet l’annulation.

Les huit contrats détaillés sont partiels ; les autres restent ouverts (`any` dans la sortie NSwag), sans garantie sur leurs paramètres ou leurs réponses. Vérifier leur contrat avant utilisation. Les champs inconnus ne sont pas supprimés. La [comparaison des clients non officiels](UBER_EATS_UNOFFICIAL_CLIENTS.md) décrit les autres schémas trouvés et la commande de génération.

La classification « lecture présumée » suit le nom de la route, pas un contrat public garantissant l'absence d'effet. La présence d'une méthode ne constitue pas une autorisation de modifier un compte, payer ou passer commande. Les routes uniquement repérées dans un bundle n'ont pas été validées par une exécution réseau.

## Opérations

| Opération                                   | Nature indicative    | Preuve                       | Source publique                                                                                       |
| ------------------------------------------- | -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `addItemsToDraftOrderV2`                    | Mutation / événement | Référence RPC dans le bundle | [client-11697-0e7967cfddb9538e.js](https://www.ubereats.com/_static/client-11697-0e7967cfddb9538e.js) |
| `addItemsToGroupDraftOrderV2`               | Mutation / événement | Référence RPC dans le bundle | [client-11697-0e7967cfddb9538e.js](https://www.ubereats.com/_static/client-11697-0e7967cfddb9538e.js) |
| `addItemsToOrderV1`                         | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `addMemberToDraftOrderV1`                   | Mutation / événement | Référence RPC dans le bundle | [client-16459-972e5cac9596ac7c.js](https://www.ubereats.com/_static/client-16459-972e5cac9596ac7c.js) |
| `addMemberToDraftOrderV2`                   | Mutation / événement | Appel RPC dans le bundle     | [client-44693-6bc9f9f5495de3a3.js](https://www.ubereats.com/_static/client-44693-6bc9f9f5495de3a3.js) |
| `allStoresV1`                               | Lecture présumée     | Appel RPC dans le bundle     | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `applyPromoV1`                              | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `cancelOrderV1`                             | Mutation / événement | Référence RPC dans le bundle | [client-85682-efa728d34af5d11a.js](https://www.ubereats.com/_static/client-85682-efa728d34af5d11a.js) |
| `checkAndUpdateGratisV1`                    | Mutation / événement | Réseau observé               | [client-30749-3d656670dba8eb0f.js](https://www.ubereats.com/_static/client-30749-3d656670dba8eb0f.js) |
| `checkoutOrdersByDraftOrdersV1`             | Mutation / événement | Référence RPC dans le bundle | [client-85682-efa728d34af5d11a.js](https://www.ubereats.com/_static/client-85682-efa728d34af5d11a.js) |
| `confirmCartUpdatesV1`                      | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `createBundleGroup`                         | Mutation / événement | Référence RPC dans le bundle | [client-83226-7ee8f7e8c20b62e5.js](https://www.ubereats.com/_static/client-83226-7ee8f7e8c20b62e5.js) |
| `createDraftOrderByOrderUuidV1`             | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `createDraftOrderV2`                        | Mutation / événement | Référence RPC dans le bundle | [client-33040-a6c0acaf61fbeb7a.js](https://www.ubereats.com/_static/client-33040-a6c0acaf61fbeb7a.js) |
| `createEaterFavoritesV1`                    | Mutation / événement | Référence RPC dans le bundle | [client-51483-a458692ff36bc757.js](https://www.ubereats.com/_static/client-51483-a458692ff36bc757.js) |
| `createGuestOrdersByDraftOrdersV1`          | Mutation / événement | Appel RPC dans le bundle     | [client-69485-c577f3447886c8bc.js](https://www.ubereats.com/_static/client-69485-c577f3447886c8bc.js) |
| `deleteEaterFavoritesV1`                    | Mutation / événement | Référence RPC dans le bundle | [client-51483-a458692ff36bc757.js](https://www.ubereats.com/_static/client-51483-a458692ff36bc757.js) |
| `discardBundleGroup`                        | Mutation / événement | Référence RPC dans le bundle | [client-83226-7ee8f7e8c20b62e5.js](https://www.ubereats.com/_static/client-83226-7ee8f7e8c20b62e5.js) |
| `discardDraftOrdersV1`                      | Mutation / événement | Référence RPC dans le bundle | [client-72632-7cc254a8374ffc9a.js](https://www.ubereats.com/_static/client-72632-7cc254a8374ffc9a.js) |
| `emitXlbHomeFeedEventV1`                    | Mutation / événement | Référence RPC dans le bundle | [client-56183-a1a942b75e00635f.js](https://www.ubereats.com/_static/client-56183-a1a942b75e00635f.js) |
| `flagReviewV1`                              | Mutation / événement | Appel RPC dans le bundle     | [client-47314-07e407db811a0180.js](https://www.ubereats.com/_static/client-47314-07e407db811a0180.js) |
| `getActiveOrdersV1`                         | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getArrearsV1`                              | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getBusinessPoliciesForUserV2`              | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getBusinessProfilesV1`                     | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getCanonicalProductItemV1`                 | Lecture présumée     | Appel RPC dans le bundle     | [client-40920-cebfa18729b59457.js](https://www.ubereats.com/_static/client-40920-cebfa18729b59457.js) |
| `getCartFaresV1`                            | Lecture présumée     | Appel RPC dans le bundle     | [client-85659-ca594f487ed2591a.js](https://www.ubereats.com/_static/client-85659-ca594f487ed2591a.js) |
| `getCartsViewForEaterUuidV1`                | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getCatalogPresentationV2`                  | Lecture présumée     | Appel RPC dans le bundle     | [client-38714-cbc9226fd230caab.js](https://www.ubereats.com/_static/client-38714-cbc9226fd230caab.js) |
| `getCheckoutPresentationV1`                 | Lecture présumée     | Référence RPC dans le bundle | [client-33040-a6c0acaf61fbeb7a.js](https://www.ubereats.com/_static/client-33040-a6c0acaf61fbeb7a.js) |
| `getClosestChainStoreFeedV1`                | Lecture présumée     | Appel RPC dans le bundle     | [client-55065-384030b42452229d.js](https://www.ubereats.com/_static/client-55065-384030b42452229d.js) |
| `getComplianceAds`                          | Lecture présumée     | Appel RPC dans le bundle     | [client-56183-a1a942b75e00635f.js](https://www.ubereats.com/_static/client-56183-a1a942b75e00635f.js) |
| `getDeliveryLocationConfigV2`               | Lecture présumée     | Appel RPC dans le bundle     | [client-10560-31b89e612d2a7406.js](https://www.ubereats.com/_static/client-10560-31b89e612d2a7406.js) |
| `getDeliveryLocationV1`                     | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `getDeliveryLocationV2`                     | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `getDeliveryLocationsV2`                    | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `getDraftOrderByUuidV1`                     | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getDraftOrderByUuidV2`                     | Lecture présumée     | Appel RPC dans le bundle     | [client-44693-6bc9f9f5495de3a3.js](https://www.ubereats.com/_static/client-44693-6bc9f9f5495de3a3.js) |
| `getDraftOrdersByEaterUuidV1`               | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getEaterMessagingContentV1`                | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getEaterOrderCountsV1`                     | Lecture présumée     | Appel RPC dans le bundle     | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `getEatsPassV1`                             | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getFeedByIdV1`                             | Lecture présumée     | Appel RPC dans le bundle     | [client-50418-d4007ab8495c3998.js](https://www.ubereats.com/_static/client-50418-d4007ab8495c3998.js) |
| `getFeedDraftOrderItemsUpdateV1`            | Lecture présumée     | Référence RPC dans le bundle | [client-30749-3d656670dba8eb0f.js](https://www.ubereats.com/_static/client-30749-3d656670dba8eb0f.js) |
| `getFeedEuDisclaimerV1`                     | Lecture présumée     | Appel RPC dans le bundle     | [client-33583-81b4c72919c05df0.js](https://www.ubereats.com/_static/client-33583-81b4c72919c05df0.js) |
| `getFeedV1`                                 | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getGuestCheckoutEligibilityV1`             | Lecture présumée     | Appel RPC dans le bundle     | [client-93144-85736c968a23bbe2.js](https://www.ubereats.com/_static/client-93144-85736c968a23bbe2.js) |
| `getInStoreSearchV1`                        | Lecture présumée     | Appel RPC dans le bundle     | [client-94078-e019529648274506.js](https://www.ubereats.com/_static/client-94078-e019529648274506.js) |
| `getInstructionForLocationV1`               | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getInvoiceStatusV1`                        | Lecture présumée     | Réseau observé               | Requête réseau observée sur /ca-fr/orders                                                             |
| `getItemSubstitutionsV1`                    | Lecture présumée     | Appel RPC dans le bundle     | [client-30749-3d656670dba8eb0f.js](https://www.ubereats.com/_static/client-30749-3d656670dba8eb0f.js) |
| `getLatestPendingRatingV1`                  | Lecture présumée     | Réseau observé               | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `getLearningContentV1`                      | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getMealPlanByUuidV1`                       | Lecture présumée     | Appel RPC dans le bundle     | [client-16459-972e5cac9596ac7c.js](https://www.ubereats.com/_static/client-16459-972e5cac9596ac7c.js) |
| `getMealPlanDeliveryLocationV1`             | Lecture présumée     | Référence RPC dans le bundle | [client-16459-972e5cac9596ac7c.js](https://www.ubereats.com/_static/client-16459-972e5cac9596ac7c.js) |
| `getMealPlanOrdersViewV1`                   | Lecture présumée     | Appel RPC dans le bundle     | [client-44693-6bc9f9f5495de3a3.js](https://www.ubereats.com/_static/client-44693-6bc9f9f5495de3a3.js) |
| `getMembershipsAndOfferingsForUserV1`       | Lecture présumée     | Appel RPC dans le bundle     | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `getMenuItemV1`                             | Lecture présumée     | Appel RPC dans le bundle     | [client-31288-3e4476b2da499966.js](https://www.ubereats.com/_static/client-31288-3e4476b2da499966.js) |
| `getNavigationLinksV1`                      | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getOnlineOrderingCustomizationV1`          | Lecture présumée     | Appel RPC dans le bundle     | [client-92784-f9cad4b7c432eec2.js](https://www.ubereats.com/_static/client-92784-f9cad4b7c432eec2.js) |
| `getOrderEntitiesV1`                        | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getOrderEntityByUuidV1`                    | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getOriginalCartV1`                         | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getOriginsLocationDetailsFromCoordinateV1` | Lecture présumée     | Appel RPC dans le bundle     | [client-2448-f7ff345e5631513c.js](https://www.ubereats.com/_static/client-2448-f7ff345e5631513c.js)   |
| `getPaginatedStoresV1`                      | Lecture présumée     | Appel RPC dans le bundle     | [client-57787-39eef44c05e41818.js](https://www.ubereats.com/_static/client-57787-39eef44c05e41818.js) |
| `getPastOrdersV1`                           | Lecture présumée     | Réseau observé               | [client-56183-a1a942b75e00635f.js](https://www.ubereats.com/_static/client-56183-a1a942b75e00635f.js) |
| `getPendingRatingV1`                        | Lecture présumée     | Référence RPC dans le bundle | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `getProfilesForUserV1`                      | Lecture présumée     | Réseau observé               | [client-33040-a6c0acaf61fbeb7a.js](https://www.ubereats.com/_static/client-33040-a6c0acaf61fbeb7a.js) |
| `getRepeatOrderViewV1`                      | Lecture présumée     | Appel RPC dans le bundle     | [client-33040-a6c0acaf61fbeb7a.js](https://www.ubereats.com/_static/client-33040-a6c0acaf61fbeb7a.js) |
| `getSearchFeedV1`                           | Lecture présumée     | Appel RPC dans le bundle     | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `getSearchHomeV2`                           | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getSearchSubstitutionsV1`                  | Lecture présumée     | Appel RPC dans le bundle     | [client-30749-3d656670dba8eb0f.js](https://www.ubereats.com/_static/client-30749-3d656670dba8eb0f.js) |
| `getSearchSuggestionsV1`                    | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `getSeoFeedV1`                              | Lecture présumée     | Référence RPC dans le bundle | [client-65504-73284a6a46edf4a0.js](https://www.ubereats.com/_static/client-65504-73284a6a46edf4a0.js) |
| `getSessionElapseV1`                        | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getStoreV1`                                | Lecture présumée     | Appel RPC dans le bundle     | [client-47314-07e407db811a0180.js](https://www.ubereats.com/_static/client-47314-07e407db811a0180.js) |
| `getSupportedLanguagesV1`                   | Lecture présumée     | Appel RPC dans le bundle     | [client-58415-5d79c71a92ffbc83.js](https://www.ubereats.com/_static/client-58415-5d79c71a92ffbc83.js) |
| `getTaxProfilesConfig`                      | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getUberBalancesV1`                         | Lecture présumée     | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getUberOneMbsV1`                           | Lecture présumée     | Appel RPC dans le bundle     | [client-93144-85736c968a23bbe2.js](https://www.ubereats.com/_static/client-93144-85736c968a23bbe2.js) |
| `getUserPromoDetailsV1`                     | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getUserPromoViewsV1`                       | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getUserV1`                                 | Lecture présumée     | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `getVouchersDataV2`                         | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `logSessionActivityV1`                      | Mutation / événement | Appel RPC dans le bundle     | [client-83226-7ee8f7e8c20b62e5.js](https://www.ubereats.com/_static/client-83226-7ee8f7e8c20b62e5.js) |
| `mapsSearchV1`                              | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `provideDateOfBirthV1`                      | Mutation / événement | Appel RPC dans le bundle     | [client-69485-c577f3447886c8bc.js](https://www.ubereats.com/_static/client-69485-c577f3447886c8bc.js) |
| `removeItemsFromDraftOrderV2`               | Mutation / événement | Référence RPC dans le bundle | [client-63536-d225e3b15870817a.js](https://www.ubereats.com/_static/client-63536-d225e3b15870817a.js) |
| `removeItemsFromGroupDraftOrderV2`          | Mutation / événement | Référence RPC dans le bundle | [client-63536-d225e3b15870817a.js](https://www.ubereats.com/_static/client-63536-d225e3b15870817a.js) |
| `removeMemberFromDraftOrderV1`              | Mutation / événement | Référence RPC dans le bundle | [client-16459-972e5cac9596ac7c.js](https://www.ubereats.com/_static/client-16459-972e5cac9596ac7c.js) |
| `removeMemberFromDraftOrderV2`              | Mutation / événement | Appel RPC dans le bundle     | [client-44693-6bc9f9f5495de3a3.js](https://www.ubereats.com/_static/client-44693-6bc9f9f5495de3a3.js) |
| `replaceItemsInDraftOrderV1`                | Mutation / événement | Référence RPC dans le bundle | [client-11697-0e7967cfddb9538e.js](https://www.ubereats.com/_static/client-11697-0e7967cfddb9538e.js) |
| `searchBusinessExpenseCodesForUserV1`       | Lecture présumée     | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `searchSuggestV2`                           | Lecture présumée     | Référence RPC dans le bundle | [client-11065-07dcc8bdd3b72f0c.js](https://www.ubereats.com/_static/client-11065-07dcc8bdd3b72f0c.js) |
| `setLocationDetailsWithAddressV1`           | Mutation / événement | Appel RPC dans le bundle     | [client-56183-a1a942b75e00635f.js](https://www.ubereats.com/_static/client-56183-a1a942b75e00635f.js) |
| `setNupEventsV1`                            | Mutation / événement | Référence RPC dans le bundle | [client-41704-d0017dd09789770d.js](https://www.ubereats.com/_static/client-41704-d0017dd09789770d.js) |
| `setRobotEventsV1`                          | Mutation / événement | Réseau observé               | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `setTargetLocationV1`                       | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `setUserConsentV1`                          | Mutation / événement | Référence RPC dans le bundle | [client-94642-809ed03d0e178134.js](https://www.ubereats.com/_static/client-94642-809ed03d0e178134.js) |
| `submitRatingV1`                            | Mutation / événement | Référence RPC dans le bundle | [client-99445-f835838cadb79f83.js](https://www.ubereats.com/_static/client-99445-f835838cadb79f83.js) |
| `updateActiveOrderDeliveryLocationV1`       | Mutation / événement | Appel RPC dans le bundle     | [client-10560-31b89e612d2a7406.js](https://www.ubereats.com/_static/client-10560-31b89e612d2a7406.js) |
| `updateComplianceV1`                        | Mutation / événement | Appel RPC dans le bundle     | [client-55065-384030b42452229d.js](https://www.ubereats.com/_static/client-55065-384030b42452229d.js) |
| `updateDraftOrderV2`                        | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `updateItemInDraftOrderV2`                  | Mutation / événement | Appel RPC dans le bundle     | [client-4563-ac87f8b3b440b65b.js](https://www.ubereats.com/_static/client-4563-ac87f8b3b440b65b.js)   |
| `updateItemInGroupDraftOrderV2`             | Mutation / événement | Référence RPC dans le bundle | [client-63536-d225e3b15870817a.js](https://www.ubereats.com/_static/client-63536-d225e3b15870817a.js) |
| `updateItemsInOrderV1`                      | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `updateOfferStateV1`                        | Mutation / événement | Appel RPC dans le bundle     | [client-4563-ac87f8b3b440b65b.js](https://www.ubereats.com/_static/client-4563-ac87f8b3b440b65b.js)   |
| `upsertDeliveryLocationV2`                  | Mutation / événement | Appel RPC dans le bundle     | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |
| `upsertDeliveryLocationWithInstructionV1`   | Mutation / événement | Référence RPC dans le bundle | [client-main-e2109a7234156878.js](https://www.ubereats.com/_static/client-main-e2109a7234156878.js)   |

## Vérification

`npm run typecheck` vérifie le fichier en mode strict. `npm run test:api` teste le transport avec des réponses fictives, sans appel au compte réel. Les tests ne valident pas l'existence de chaque route ni les paramètres inconnus. Le contrat détaillé de l'historique reste documenté dans [UBER_EATS_API.md](UBER_EATS_API.md).
