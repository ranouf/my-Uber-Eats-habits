export function collectOrders() {
  const receiptSelector = 'a[href*="mod=orderReceipt"]';
  return [...document.querySelectorAll(`main ${receiptSelector}`)]
    .map((receipt) => {
      let card = receipt.parentElement;
      while (
        card.tagName !== "MAIN" &&
        (!card.querySelector('a[href*="/store/"]') || !card.querySelector("li"))
      ) {
        card = card.parentElement;
      }
      if (card.tagName === "MAIN" || card.querySelectorAll(receiptSelector).length !== 1) {
        return null;
      }

      const restaurant = [...card.querySelectorAll('a[href*="/store/"]')].find(
        (link) => link.textContent.trim() && !link.querySelector("figure"),
      );
      if (!restaurant) return null;

      const text = card.innerText;
      const restaurantName = restaurant.innerText.trim();
      const metadata = text
        .slice(
          text.indexOf(restaurantName) + restaurantName.length,
          text.indexOf(receipt.innerText.trim()),
        )
        .split(/[•\n]/)
        .map((part) => part.trim())
        .filter(Boolean);
      const date = metadata.at(-1);
      const receiptUrl = new URL(receipt.href);
      const restaurantUrl = new URL(restaurant.href);
      const items = [...card.querySelectorAll("li")]
        .filter((item) => !item.querySelector("li"))
        .map((item) => item.innerText.replace(/\s+/g, " ").replace(/^(\d+)\s*/, "$1 × "));

      return {
        id: receiptUrl.searchParams.get("modctx"),
        restaurantId: restaurantUrl.pathname.split("/").filter(Boolean).at(-1),
        restaurant: restaurant.textContent.trim(),
        restaurantUrl: restaurantUrl.href,
        date,
        total: metadata.find((part) => /[$€£¥]/.test(part)),
        receiptUrl: receiptUrl.href,
        items,
      };
    })
    .filter(Boolean);
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
