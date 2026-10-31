export async function loadOrderPage(lastWorkflowUUID = "") {
  const locale = location.pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/)?.[1] || "ca-fr";
  const response = await fetch(`/_p/api/getPastOrdersV1?localeCode=${locale}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json", "x-csrf-token": "x" },
    body: JSON.stringify({ lastWorkflowUUID }),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Reconnectez-vous à Uber Eats, puis actualisez les commandes.");
  }
  if (!response.ok) throw new Error("Uber Eats ne peut pas charger l’historique pour le moment.");
  const payload = await response.json();
  if (payload.status !== "success")
    throw new Error("Uber Eats n’a pas renvoyé l’historique attendu.");
  const { ordersMap, orderUuids, meta } = payload.data;
  const orders = orderUuids.map((id) => {
    const { baseEaterOrder: order, storeInfo: store, fareInfo: fare } = ordersMap[id];
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
        orders: [],
      });
    }
    restaurants.get(order.restaurantId).orders.push(order);
  }
  return [...restaurants.values()];
}
