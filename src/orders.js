function getLocale() {
  return location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/)?.[1] || "ca-fr";
}

export async function requestApi(operation, body) {
  const locale = getLocale();
  const response = await fetch(`/_p/api/${operation}?localeCode=${locale}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-csrf-token": "x" },
    body: JSON.stringify(body),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Reconnectez-vous à Uber Eats, puis actualisez les commandes.");
  }
  if (!response.ok) throw new Error("Uber Eats ne peut pas traiter la demande pour le moment.");
  const payload = await response.json();
  if (payload.status !== "success")
    throw new Error("Uber Eats n’a pas accepté la demande. Actualisez et réessayez.");
  return payload.data;
}

export async function loadOrderPage(lastWorkflowUUID = "") {
  const locale = getLocale();
  const { ordersMap, orderUuids, meta } = await requestApi("getPastOrdersV1", { lastWorkflowUUID });
  const orders = orderUuids.map((id) => {
    const { baseEaterOrder: order, storeInfo: store, fareInfo: fare, ratingInfo } = ordersMap[id];
    const ownRating = ratingInfo.userRatings.find(
      (rating) =>
        rating.schema === "FIVE_STARS" &&
        rating.subjectType === "STORE" &&
        rating.uuid === store.uuid,
    );
    const ratingIndex = ["ONE_STAR", "TWO_STAR", "THREE_STAR", "FOUR_STAR", "FIVE_STAR"].indexOf(
      ownRating?.value,
    );
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
      publicRating: store.rating,
      personalRating: ownRating
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
