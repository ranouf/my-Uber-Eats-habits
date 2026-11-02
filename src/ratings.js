import { requestApi } from "./orders.js";

export class RatingUnavailableError extends Error {
  constructor() {
    super("Cette commande ne peut plus être notée sur Uber Eats.");
  }
}

export async function loadPublicRating(storeUuid) {
  const store = await requestApi("getStoreV1", { storeUuid });
  return store.rating;
}

export async function submitRestaurantRating(order, stars) {
  const pending = await requestApi("getPendingRatingV1", {
    orderUuid: order.id,
    entryPoint: "order_page",
  });
  const pageId = pending?.ratingInputPagesOrder?.storeRatingPage;
  const page = pending?.ratingInputPagesMap?.[pageId];
  if (!page || page.type !== "STORE_RATING") {
    throw new RatingUnavailableError();
  }
  if (pending.workflowUUID !== order.id || page.uuid !== order.restaurantId) {
    throw new Error("Uber Eats n’a pas renvoyé le formulaire de cette commande.");
  }
  const value = page.identifiers[stars - 1];
  if (!value) throw new Error("Cette note n’est pas proposée par Uber Eats.");
  await requestApi("submitRatingV1", {
    workflowUUID: pending.workflowUUID,
    entryPoint: "order_page",
    ratingItems: [{ uuid: page.uuid, value, schema: "FIVE_STARS", subjectType: "STORE" }],
  });
}
