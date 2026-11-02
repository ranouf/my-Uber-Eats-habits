function createOrderedBadge(restaurant, onSelect) {
  const host = document.createElement("span");
  host.dataset.habitsBadge = restaurant.id;
  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("panel.css", import.meta.url).href;
  const button = document.createElement("button");
  button.className = "ordered-badge";
  button.type = "button";
  button.textContent = "↺ Déjà commandé";
  button.setAttribute("aria-label", `Voir mes commandes chez ${restaurant.name}`);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(restaurant.id);
  });
  shadow.append(stylesheet, button);
  return host;
}

export function markOrderedRestaurants(restaurants, onSelect) {
  const byId = new Map();
  for (const restaurant of restaurants) {
    byId.set(restaurant.id, restaurant);
    byId.set(new URL(restaurant.url).pathname.split("/").at(-1), restaurant);
  }
  const storeId = location.pathname.match(/\/store\/(?:[^/]+\/)?([^/]+)\/?$/)?.[1];
  const restaurant = byId.get(storeId);
  const heading = document.querySelector("main h1") || document.querySelector("h1");
  const detailBadge = document.querySelector("[data-habits-detail-badge]");
  if (
    detailBadge &&
    (detailBadge.dataset.habitsBadge !== restaurant?.id ||
      heading?.nextElementSibling !== detailBadge)
  ) {
    detailBadge.remove();
  }
  if (restaurant && heading && !document.querySelector("[data-habits-detail-badge]")) {
    const host = createOrderedBadge(restaurant, onSelect);
    host.dataset.habitsDetailBadge = "";
    heading.after(host);
  }
  if (!/\/(?:feed|search)\/?$/.test(location.pathname)) return;
  for (const link of document.querySelectorAll('a[href*="/store/"]')) {
    const id = new URL(link.href).pathname.split("/").filter(Boolean).at(-1);
    const restaurant = byId.get(id);
    const card = link.closest('[data-testid="store-card"]') || link;
    const existing = card.querySelector("[data-habits-badge]");
    if (existing && existing.dataset.habitsBadge !== restaurant?.id) existing.remove();
    if (!restaurant || card.querySelector("[data-habits-badge]")) continue;
    card.append(createOrderedBadge(restaurant, onSelect));
  }
}
