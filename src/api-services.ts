/**
 * Client autonome de l'API interne du site Uber Eats, inventoriée le 30 octobre 2026.
 * À utiliser depuis le site connecté. Aucun appel n'est effectué à la construction.
 * Les DTO décrivent uniquement les champs observés ; les autres contrats restent unknown.
 * Sources et limites : UBER_EATS_API_CATALOG.md.
 */
export type ApiRequestBody = Record<string, unknown>;

export interface PastOrdersRequest {
  lastWorkflowUUID?: string;
  limit?: number;
}
export interface PastOrderItem {
  quantity: number;
  title: string;
}
export type StoreRatingValue = "ONE_STAR" | "TWO_STAR" | "THREE_STAR" | "FOUR_STAR" | "FIVE_STAR";
export interface StorePublicRating {
  ratingValue: number;
  reviewCount: number | string;
}
export interface StoreRatingItem {
  uuid: string;
  value: StoreRatingValue;
  schema: "FIVE_STARS";
  subjectType: "STORE";
}
export interface StoreRatingRequest {
  workflowUUID: string;
  entryPoint: string;
  ratingItems: StoreRatingItem[];
}
export interface PendingRatingRequest {
  orderUuid: string;
  entryPoint: string;
}
export interface PendingRatingData {
  workflowUUID: string;
  ratingInputPagesOrder: { storeRatingPage?: string };
  ratingInputPagesMap: Record<
    string,
    { type: string; uuid?: string; identifiers?: StoreRatingValue[] }
  >;
}
export interface PastOrder {
  baseEaterOrder: {
    uuid: string;
    storeUuid: string;
    lastStateChangeAt: string;
    completedAt: string | null;
    currencyCode: string;
    shoppingCart: { items: PastOrderItem[] };
  };
  storeInfo: { uuid: string; title: string; slug: string; rating: StorePublicRating | null };
  ratingInfo: { isRatable: boolean; userRatings: unknown[] };
  fareInfo: { totalPrice: number; checkoutInfo: { key: string; formattedValue: string }[] };
}
export interface PastOrdersData {
  ordersMap: Record<string, PastOrder>;
  orderUuids: string[];
  paginationData?: { nextCursor?: string | null } | null;
  meta: { hasMore: boolean };
}
export interface ActiveOrdersRequest {
  orderUuid: string | null;
  timezone: string;
  showAppUpsellIllustration: boolean;
  isDirectTracking: boolean;
}
export interface ActiveOrdersData {
  orders: unknown[];
}
export interface DraftOrdersRequest {
  removeAdapters?: boolean;
}
export interface DraftOrdersData {
  draftOrders: unknown[];
  cartsView: unknown;
}
export interface OrderEntitiesData {
  orderEntities: unknown;
  orderEntitiesView: unknown[];
}
export interface UserRequest {
  shouldGetSubsMetadata?: boolean;
}
export interface UserData {
  isLoggedIn: boolean;
  [key: string]: unknown;
}
export type ApiResponse<T> = { status: "success"; data: T } | { status: "failure"; data: unknown };

export class UberEatsApiError extends Error {
  readonly operation: string;
  readonly httpStatus: number;
  readonly details: unknown;

  constructor(operation: string, httpStatus: number, details: unknown) {
    super(`Échec de l'appel Uber Eats ${operation} (HTTP ${httpStatus}).`);
    this.name = "UberEatsApiError";
    this.operation = operation;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export const uberEatsApiOperations = [
  "addItemsToDraftOrderV2",
  "addItemsToGroupDraftOrderV2",
  "addItemsToOrderV1",
  "addMemberToDraftOrderV1",
  "addMemberToDraftOrderV2",
  "allStoresV1",
  "applyPromoV1",
  "cancelOrderV1",
  "checkAndUpdateGratisV1",
  "checkoutOrdersByDraftOrdersV1",
  "confirmCartUpdatesV1",
  "createBundleGroup",
  "createDraftOrderByOrderUuidV1",
  "createDraftOrderV2",
  "createEaterFavoritesV1",
  "createGuestOrdersByDraftOrdersV1",
  "deleteEaterFavoritesV1",
  "discardBundleGroup",
  "discardDraftOrdersV1",
  "emitXlbHomeFeedEventV1",
  "flagReviewV1",
  "getActiveOrdersV1",
  "getArrearsV1",
  "getBusinessPoliciesForUserV2",
  "getBusinessProfilesV1",
  "getCanonicalProductItemV1",
  "getCartFaresV1",
  "getCartsViewForEaterUuidV1",
  "getCatalogPresentationV2",
  "getCheckoutPresentationV1",
  "getClosestChainStoreFeedV1",
  "getComplianceAds",
  "getDeliveryLocationConfigV2",
  "getDeliveryLocationV1",
  "getDeliveryLocationV2",
  "getDeliveryLocationsV2",
  "getDraftOrderByUuidV1",
  "getDraftOrderByUuidV2",
  "getDraftOrdersByEaterUuidV1",
  "getEaterMessagingContentV1",
  "getEaterOrderCountsV1",
  "getEatsPassV1",
  "getFeedByIdV1",
  "getFeedDraftOrderItemsUpdateV1",
  "getFeedEuDisclaimerV1",
  "getFeedV1",
  "getGuestCheckoutEligibilityV1",
  "getInStoreSearchV1",
  "getInstructionForLocationV1",
  "getInvoiceStatusV1",
  "getItemSubstitutionsV1",
  "getLatestPendingRatingV1",
  "getLearningContentV1",
  "getMealPlanByUuidV1",
  "getMealPlanDeliveryLocationV1",
  "getMealPlanOrdersViewV1",
  "getMembershipsAndOfferingsForUserV1",
  "getMenuItemV1",
  "getNavigationLinksV1",
  "getOnlineOrderingCustomizationV1",
  "getOrderEntitiesV1",
  "getOrderEntityByUuidV1",
  "getOriginalCartV1",
  "getOriginsLocationDetailsFromCoordinateV1",
  "getPaginatedStoresV1",
  "getPastOrdersV1",
  "getPendingRatingV1",
  "getProfilesForUserV1",
  "getRepeatOrderViewV1",
  "getSearchFeedV1",
  "getSearchHomeV2",
  "getSearchSubstitutionsV1",
  "getSearchSuggestionsV1",
  "getSeoFeedV1",
  "getSessionElapseV1",
  "getStoreV1",
  "getSupportedLanguagesV1",
  "getTaxProfilesConfig",
  "getUberBalancesV1",
  "getUberOneMbsV1",
  "getUserPromoDetailsV1",
  "getUserPromoViewsV1",
  "getUserV1",
  "getVouchersDataV2",
  "logSessionActivityV1",
  "mapsSearchV1",
  "provideDateOfBirthV1",
  "removeItemsFromDraftOrderV2",
  "removeItemsFromGroupDraftOrderV2",
  "removeMemberFromDraftOrderV1",
  "removeMemberFromDraftOrderV2",
  "replaceItemsInDraftOrderV1",
  "searchBusinessExpenseCodesForUserV1",
  "searchSuggestV2",
  "setLocationDetailsWithAddressV1",
  "setNupEventsV1",
  "setRobotEventsV1",
  "setTargetLocationV1",
  "setUserConsentV1",
  "submitRatingV1",
  "updateActiveOrderDeliveryLocationV1",
  "updateComplianceV1",
  "updateDraftOrderV2",
  "updateItemInDraftOrderV2",
  "updateItemInGroupDraftOrderV2",
  "updateItemsInOrderV1",
  "updateOfferStateV1",
  "upsertDeliveryLocationV2",
  "upsertDeliveryLocationWithInstructionV1",
] as const;
export type UberEatsApiOperation = (typeof uberEatsApiOperations)[number];

export class UberEatsApiService {
  readonly localeCode: string;
  private readonly fetcher: typeof fetch;

  constructor(localeCode = "ca-fr", fetcher: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.localeCode = localeCode;
    this.fetcher = fetcher;
  }

  private async request<T>(
    operation: UberEatsApiOperation,
    body: object,
    signal?: AbortSignal,
  ): Promise<T> {
    const url = new URL(`/_p/api/${operation}`, "https://www.ubereats.com");
    url.searchParams.set("localeCode", this.localeCode);
    const response = await this.fetcher(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json", "x-csrf-token": "x" },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) throw new UberEatsApiError(operation, response.status, undefined);
    const payload: ApiResponse<T> = await response.json();
    if (payload.status !== "success")
      throw new UberEatsApiError(operation, response.status, payload.data);
    return payload.data;
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  addItemsToDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("addItemsToDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  addItemsToGroupDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("addItemsToGroupDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  addItemsToOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("addItemsToOrderV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  addMemberToDraftOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("addMemberToDraftOrderV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  addMemberToDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("addMemberToDraftOrderV2", request, signal);
  }

  allStoresV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("allStoresV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  applyPromoV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("applyPromoV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  cancelOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("cancelOrderV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  checkAndUpdateGratisV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("checkAndUpdateGratisV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  checkoutOrdersByDraftOrdersV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("checkoutOrdersByDraftOrdersV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  confirmCartUpdatesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("confirmCartUpdatesV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  createBundleGroup<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("createBundleGroup", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  createDraftOrderByOrderUuidV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("createDraftOrderByOrderUuidV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  createDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("createDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  createEaterFavoritesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("createEaterFavoritesV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  createGuestOrdersByDraftOrdersV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("createGuestOrdersByDraftOrdersV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  deleteEaterFavoritesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("deleteEaterFavoritesV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  discardBundleGroup<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("discardBundleGroup", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  discardDraftOrdersV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("discardDraftOrdersV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  emitXlbHomeFeedEventV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("emitXlbHomeFeedEventV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  flagReviewV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("flagReviewV1", request, signal);
  }

  getActiveOrdersV1(request: ActiveOrdersRequest, signal?: AbortSignal): Promise<ActiveOrdersData> {
    return this.request<ActiveOrdersData>("getActiveOrdersV1", request, signal);
  }

  getArrearsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getArrearsV1", request, signal);
  }

  getBusinessPoliciesForUserV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getBusinessPoliciesForUserV2", request, signal);
  }

  getBusinessProfilesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getBusinessProfilesV1", request, signal);
  }

  getCanonicalProductItemV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getCanonicalProductItemV1", request, signal);
  }

  getCartFaresV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getCartFaresV1", request, signal);
  }

  getCartsViewForEaterUuidV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getCartsViewForEaterUuidV1", request, signal);
  }

  getCatalogPresentationV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getCatalogPresentationV2", request, signal);
  }

  getCheckoutPresentationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getCheckoutPresentationV1", request, signal);
  }

  getClosestChainStoreFeedV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getClosestChainStoreFeedV1", request, signal);
  }

  getComplianceAds<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getComplianceAds", request, signal);
  }

  getDeliveryLocationConfigV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDeliveryLocationConfigV2", request, signal);
  }

  getDeliveryLocationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDeliveryLocationV1", request, signal);
  }

  getDeliveryLocationV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDeliveryLocationV2", request, signal);
  }

  getDeliveryLocationsV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDeliveryLocationsV2", request, signal);
  }

  getDraftOrderByUuidV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDraftOrderByUuidV1", request, signal);
  }

  getDraftOrderByUuidV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getDraftOrderByUuidV2", request, signal);
  }

  getDraftOrdersByEaterUuidV1(
    request: DraftOrdersRequest = {},
    signal?: AbortSignal,
  ): Promise<DraftOrdersData> {
    return this.request<DraftOrdersData>("getDraftOrdersByEaterUuidV1", request, signal);
  }

  getEaterMessagingContentV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getEaterMessagingContentV1", request, signal);
  }

  getEaterOrderCountsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getEaterOrderCountsV1", request, signal);
  }

  getEatsPassV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getEatsPassV1", request, signal);
  }

  getFeedByIdV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getFeedByIdV1", request, signal);
  }

  getFeedDraftOrderItemsUpdateV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getFeedDraftOrderItemsUpdateV1", request, signal);
  }

  getFeedEuDisclaimerV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getFeedEuDisclaimerV1", request, signal);
  }

  getFeedV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getFeedV1", request, signal);
  }

  getGuestCheckoutEligibilityV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getGuestCheckoutEligibilityV1", request, signal);
  }

  getInStoreSearchV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getInStoreSearchV1", request, signal);
  }

  getInstructionForLocationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getInstructionForLocationV1", request, signal);
  }

  getInvoiceStatusV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getInvoiceStatusV1", request, signal);
  }

  getItemSubstitutionsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getItemSubstitutionsV1", request, signal);
  }

  getLatestPendingRatingV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getLatestPendingRatingV1", request, signal);
  }

  getLearningContentV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getLearningContentV1", request, signal);
  }

  getMealPlanByUuidV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getMealPlanByUuidV1", request, signal);
  }

  getMealPlanDeliveryLocationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getMealPlanDeliveryLocationV1", request, signal);
  }

  getMealPlanOrdersViewV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getMealPlanOrdersViewV1", request, signal);
  }

  getMembershipsAndOfferingsForUserV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getMembershipsAndOfferingsForUserV1", request, signal);
  }

  getMenuItemV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getMenuItemV1", request, signal);
  }

  getNavigationLinksV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getNavigationLinksV1", request, signal);
  }

  getOnlineOrderingCustomizationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getOnlineOrderingCustomizationV1", request, signal);
  }

  getOrderEntitiesV1(
    request: Record<string, never> = {},
    signal?: AbortSignal,
  ): Promise<OrderEntitiesData> {
    return this.request<OrderEntitiesData>("getOrderEntitiesV1", request, signal);
  }

  getOrderEntityByUuidV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getOrderEntityByUuidV1", request, signal);
  }

  getOriginalCartV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getOriginalCartV1", request, signal);
  }

  getOriginsLocationDetailsFromCoordinateV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getOriginsLocationDetailsFromCoordinateV1", request, signal);
  }

  getPaginatedStoresV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getPaginatedStoresV1", request, signal);
  }

  getPastOrdersV1(
    request: PastOrdersRequest = { lastWorkflowUUID: "" },
    signal?: AbortSignal,
  ): Promise<PastOrdersData> {
    return this.request<PastOrdersData>("getPastOrdersV1", request, signal);
  }

  getPendingRatingV1(
    request: PendingRatingRequest,
    signal?: AbortSignal,
  ): Promise<PendingRatingData | null> {
    return this.request<PendingRatingData | null>("getPendingRatingV1", request, signal);
  }

  getProfilesForUserV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getProfilesForUserV1", request, signal);
  }

  getRepeatOrderViewV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getRepeatOrderViewV1", request, signal);
  }

  getSearchFeedV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSearchFeedV1", request, signal);
  }

  getSearchHomeV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSearchHomeV2", request, signal);
  }

  getSearchSubstitutionsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSearchSubstitutionsV1", request, signal);
  }

  getSearchSuggestionsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSearchSuggestionsV1", request, signal);
  }

  getSeoFeedV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSeoFeedV1", request, signal);
  }

  getSessionElapseV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSessionElapseV1", request, signal);
  }

  getStoreV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getStoreV1", request, signal);
  }

  getSupportedLanguagesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getSupportedLanguagesV1", request, signal);
  }

  getTaxProfilesConfig<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getTaxProfilesConfig", request, signal);
  }

  getUberBalancesV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getUberBalancesV1", request, signal);
  }

  getUberOneMbsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getUberOneMbsV1", request, signal);
  }

  getUserPromoDetailsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getUserPromoDetailsV1", request, signal);
  }

  getUserPromoViewsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getUserPromoViewsV1", request, signal);
  }

  getUserV1(request: UserRequest, signal?: AbortSignal): Promise<UserData> {
    return this.request<UserData>("getUserV1", request, signal);
  }

  getVouchersDataV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("getVouchersDataV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  logSessionActivityV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("logSessionActivityV1", request, signal);
  }

  mapsSearchV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("mapsSearchV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  provideDateOfBirthV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("provideDateOfBirthV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  removeItemsFromDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("removeItemsFromDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  removeItemsFromGroupDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("removeItemsFromGroupDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  removeMemberFromDraftOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("removeMemberFromDraftOrderV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  removeMemberFromDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("removeMemberFromDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  replaceItemsInDraftOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("replaceItemsInDraftOrderV1", request, signal);
  }

  searchBusinessExpenseCodesForUserV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("searchBusinessExpenseCodesForUserV1", request, signal);
  }

  searchSuggestV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("searchSuggestV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  setLocationDetailsWithAddressV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("setLocationDetailsWithAddressV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  setNupEventsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("setNupEventsV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  setRobotEventsV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("setRobotEventsV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  setTargetLocationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("setTargetLocationV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  setUserConsentV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("setUserConsentV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  submitRatingV1<TResponse = unknown>(
    request: StoreRatingRequest,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("submitRatingV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateActiveOrderDeliveryLocationV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateActiveOrderDeliveryLocationV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateComplianceV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateComplianceV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateItemInDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateItemInDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateItemInGroupDraftOrderV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateItemInGroupDraftOrderV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateItemsInOrderV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateItemsInOrderV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  updateOfferStateV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("updateOfferStateV1", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  upsertDeliveryLocationV2<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("upsertDeliveryLocationV2", request, signal);
  }

  /** Mutation ou événement : exécution uniquement sur appel explicite. */
  upsertDeliveryLocationWithInstructionV1<TResponse = unknown>(
    request: ApiRequestBody,
    signal?: AbortSignal,
  ): Promise<TResponse> {
    return this.request<TResponse>("upsertDeliveryLocationWithInstructionV1", request, signal);
  }
}
