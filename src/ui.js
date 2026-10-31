function element(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function link(text, url) {
  const node = element("a", "text-link", text);
  node.href = url;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
  return node;
}

function renderOrder(order) {
  const node = element("li", "order");
  const header = element("div", "order-header");
  header.append(
    element("strong", "order-date", order.date),
    link("Voir le reçu ↗", order.receiptUrl),
  );
  node.append(header, element("p", "order-total", order.total));
  const items = element("ul", "items");
  for (const item of order.items) items.append(element("li", "", item));
  node.append(items);
  return node;
}

export function renderRestaurants(results, restaurants, query) {
  const openIds = new Set(
    [...results.querySelectorAll("details[open]")].map((card) => card.dataset.id),
  );
  results.replaceChildren();
  const filtered = restaurants.filter((restaurant) =>
    restaurant.name.toLocaleLowerCase("fr").includes(query.toLocaleLowerCase("fr")),
  );
  for (const restaurant of filtered) {
    const card = element("details", "restaurant");
    card.dataset.id = restaurant.id;
    card.open = openIds.has(restaurant.id);
    const summary = element("summary", "restaurant-summary");
    const label = element("span", "restaurant-label");
    label.append(
      element("strong", "restaurant-name", restaurant.name),
      element("span", "last-order", restaurant.orders[0].date),
    );
    summary.append(label, element("span", "count", String(restaurant.orders.length)));
    const content = element("div", "restaurant-content");
    content.append(link("Voir le restaurant ↗", restaurant.url));
    const orders = element("ol", "orders");
    for (const order of restaurant.orders) orders.append(renderOrder(order));
    content.append(orders);
    card.append(summary, content);
    results.append(card);
  }
  if (restaurants.length && !filtered.length) {
    results.append(element("p", "empty", "Aucun restaurant ne correspond à votre recherche."));
  }
}

export function createPanel() {
  const { version } = chrome.runtime.getManifest();
  const host = element("div", "");
  host.id = "uber-eat-habits-extension";
  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("panel.css", import.meta.url).href;
  shadow.append(stylesheet);
  const content = element("div", "");
  content.innerHTML = `
    <button class="launcher" type="button" aria-label="Mes restaurants" aria-expanded="false" aria-controls="habits-panel">
      <span class="launcher-icon" aria-hidden="true">↺</span><span class="launcher-label">Mes restaurants<small class="version">v${version}</small></span>
    </button>
    <aside id="habits-panel" class="panel" aria-label="UberEatHabits — Mes restaurants" hidden>
      <header class="panel-header">
        <div><div class="brand-row"><span class="brand">UberEat<span>Habits</span></span><small class="version">v${version}</small></div><h2>Mes restaurants</h2></div>
        <button class="icon-button close" type="button" aria-label="Fermer le panneau">×</button>
      </header>
      <div class="panel-body">
        <p class="subtitle">Vos dernières commandes, au même endroit.</p>
        <a class="primary history-link" href="https://www.ubereats.com/orders">Ouvrir mon historique <span aria-hidden="true">↗</span></a>
        <div class="status-row"><p class="status" role="status" aria-live="polite"></p><button class="icon-button refresh" type="button" aria-label="Actualiser les commandes">↻</button></div>
        <label for="restaurant-search" class="sr-only">Rechercher un restaurant</label>
        <input id="restaurant-search" type="search" placeholder="Rechercher un restaurant" hidden />
        <section class="restaurants" aria-label="Restaurants récemment commandés"></section>
        <p class="notice">Du plus récent au plus ancien. Seules les commandes chargées sur Uber Eats sont affichées. Utilisez « Show more » ou « Afficher plus » sur le site pour remonter davantage dans l’historique.</p>
        <p class="notice">Les articles visibles sont un aperçu. Ouvrez le reçu pour le détail complet.</p>
      </div>
      <footer>Lecture locale · Aucune donnée enregistrée ni transmise</footer>
    </aside>`;
  shadow.append(content);
  document.body.append(host);
  return { host, shadow };
}
