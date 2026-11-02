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

function renderOrder(order, onRate) {
  const node = element("li", "order");
  const header = element("div", "order-header");
  header.append(
    element("strong", "order-date", order.date),
    link("Voir le reçu ↗", order.receiptUrl),
  );
  node.append(header, element("p", "order-total", order.total));
  if (order.canRate || order.personalRating > 0) {
    const rating = element("div", "personal-rating");
    rating.append(element("p", "rating-label", "Votre note"));
    const stars = element("div", "rating-stars");
    stars.setAttribute("role", "group");
    stars.dataset.orderId = order.id;
    stars.setAttribute("aria-label", `Votre note pour la commande du ${order.date}`);
    for (let value = 1; value <= 5; value++) {
      const button = element("button", "rating-star", order.personalRating >= value ? "★" : "☆");
      button.type = "button";
      button.dataset.value = String(value);
      button.setAttribute("aria-label", `Mettre ${value} étoile${value > 1 ? "s" : ""}`);
      button.setAttribute("aria-pressed", String(order.personalRating === value));
      button.disabled = !order.canRate || Boolean(order.ratingBusy);
      button.addEventListener("click", () => onRate(order, value));
      stars.append(button);
    }
    rating.append(stars);
    if (order.canRate) {
      rating.append(
        element("p", "rating-help", "Un clic envoie votre note à Uber Eats pour cette commande."),
      );
    }
    if (order.personalRating === null) {
      rating.append(element("p", "rating-help", "Votre note existante n’est pas disponible."));
    }
    const ratingStatus = element("p", "rating-message", order.ratingMessage);
    ratingStatus.setAttribute("aria-live", "polite");
    rating.append(ratingStatus);
    node.append(rating);
  }
  const items = element("ul", "items");
  for (const item of order.items) items.append(element("li", "", item));
  node.append(items);
  return node;
}

export function renderRestaurants(results, restaurants, query, onRate) {
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
      element(
        "span",
        "public-rating",
        restaurant.publicRating?.ratingValue != null
          ? `Clients : ★ ${restaurant.publicRating.ratingValue.toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5 · ${restaurant.publicRating.reviewCount} avis`
          : restaurant.ratingLoaded
            ? "Note des clients indisponible"
            : "Chargement de la note des clients…",
      ),
    );
    const ratedOrders = restaurant.orders.filter((order) => order.personalRating > 0);
    if (ratedOrders.length) {
      const average =
        ratedOrders.reduce((sum, order) => sum + order.personalRating, 0) / ratedOrders.length;
      const value = average.toLocaleString("fr-CA", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      label.append(
        element(
          "span",
          "public-rating personal-average",
          ratedOrders.length === 1
            ? `Votre note : ★ ${value} / 5`
            : `Votre moyenne : ★ ${value} / 5 · ${ratedOrders.length} notes chargées`,
        ),
      );
    }
    summary.append(label, element("span", "count", String(restaurant.orders.length)));
    const content = element("div", "restaurant-content");
    content.append(link("Voir le restaurant ↗", restaurant.url));
    const orders = element("ol", "orders");
    for (const order of restaurant.orders) orders.append(renderOrder(order, onRate));
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
        <button class="primary load-more" type="button" hidden>Charger plus de commandes</button>
        <p class="notice">Du plus récent au plus ancien. L’historique est lu directement depuis votre compte Uber Eats. Chargez plus de commandes pour remonter dans le temps.</p>
        <p class="notice">Ouvrez le reçu pour consulter les détails et les personnalisations des articles.</p>
      </div>
      <footer>Historique et notes Uber Eats · Aucun stockage local</footer>
    </aside>`;
  shadow.append(content);
  document.body.append(host);
  return { host, shadow };
}
