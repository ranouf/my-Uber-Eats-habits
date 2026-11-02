import { createApiClient } from "./api-client.js";

function getLocale() {
  return location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/)?.[1] || "ca-fr";
}

export async function requestApi(operation, body) {
  const client = createApiClient(getLocale());
  const payload = await client[operation](body);
  return payload.data;
}

export async function loadOrderPage(lastWorkflowUUID = "") {
  const locale = getLocale();
  const { ordersMap, orderUuids, meta } = await requestApi("getPastOrdersV1", { lastWorkflowUUID });
  const orders = orderUuids.map((id) => {
    const { baseEaterOrder: order, storeInfo: store, fareInfo: fare, ratingInfo } = ordersMap[id];
    const ownRating = ratingInfo.userRatings.find(
      (rating) => rating.schema === "FIVE_STARS" && rating.subjectType === "STORE",
    );
    const ratingIndex = ["ONE_STAR", "TWO_STAR", "THREE_STAR", "FOUR_STAR", "FIVE_STAR"].indexOf(
      ownRating?.value,
    );
    const historyRating = Array.isArray(store.rating) && store.rating.length > 0;
    const storeId = btoa(
      String.fromCharCode(
        ...store.uuid
          .replaceAll("-", "")
          .match(/../g)
          .map((hex) => parseInt(hex, 16)),
      ),
    )
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/, "");
    return {
      id,
      restaurantId: store.uuid,
      restaurant: store.title,
      publicRating: Array.isArray(store.rating) ? null : store.rating,
      personalRating: historyRating
        ? store.rating.filter(Boolean).length
        : ownRating
          ? ratingIndex < 0
            ? null
            : ratingIndex + 1
          : ratingInfo.userRatings.length === 0
            ? 0
            : null,
      canRate: ratingInfo.isRatable,
      restaurantUrl: new URL(`/${locale}/store/${store.slug}/${storeId}`, location.origin).href,
      date: new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(order.lastStateChangeAt),
      ),
      total: fare.checkoutInfo.find((line) => line.key === "eats_fare.total").formattedValue,
      receiptUrl: new URL(`/${locale}/orders?mod=orderReceipt&modctx=${id}`, location.origin).href,
      items: order.shoppingCart.items.map((item) => `${item.quantity} × ${item.title}`),
    };
  });
  return { orders, cursor: orderUuids.at(-1), hasMore: meta.hasMore };
}
export function groupRestaurants(orders) {
  const restaurants = new Map();
  const seen = new Set();
  for (const order of orders) {
    if (seen.has(order.id)) continue;
    seen.add(order.id);
    if (!restaurants.has(order.restaurantId)) {
      restaurants.set(order.restaurantId, {
        id: order.restaurantId,
        name: order.restaurant,
        url: order.restaurantUrl,
        publicRating: order.publicRating,
        orders: [],
      });
    }
    restaurants.get(order.restaurantId).orders.push(order);
  }
  return [...restaurants.values()];
}
