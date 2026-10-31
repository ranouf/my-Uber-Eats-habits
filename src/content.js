(async () => {
  const { groupRestaurants, loadOrderPage } = await import(chrome.runtime.getURL("src/orders.js"));
  const { createPanel, renderRestaurants } = await import(chrome.runtime.getURL("src/ui.js"));
  const { shadow } = createPanel();
  const launcher = shadow.querySelector(".launcher");
  const panel = shadow.querySelector(".panel");
  const close = shadow.querySelector(".close");
  const status = shadow.querySelector(".status");
  const search = shadow.querySelector("input");
  const results = shadow.querySelector(".restaurants");
  const historyLink = shadow.querySelector(".history-link");
  const refresh = shadow.querySelector(".refresh");
  const more = shadow.querySelector(".load-more");
  let orders = [];
  let restaurants = [];
  let cursor = "";
  let loaded = false;
  let loading = false;
  let previousPath;

  function render() {
    renderRestaurants(results, restaurants, search.value);
  }

  async function load(reset = false) {
    if (loading) return;
    loading = true;
    refresh.disabled = true;
    more.disabled = true;
    status.textContent = "Chargement de votre historique Uber Eats…";
    if (reset) {
      orders = [];
      restaurants = [];
      cursor = "";
      loaded = false;
      more.hidden = true;
      search.hidden = true;
      render();
    }
    try {
      const page = await loadOrderPage(cursor);
      orders.push(...page.orders);
      cursor = page.cursor;
      loaded = true;
      restaurants = groupRestaurants(orders);
      search.hidden = !restaurants.length;
      historyLink.hidden = true;
      more.hidden = !page.hasMore;
      status.textContent = restaurants.length
        ? `${restaurants.length} restaurants · ${restaurants.reduce((sum, restaurant) => sum + restaurant.orders.length, 0)} commandes chargées`
        : "Aucune commande passée dans votre historique Uber Eats.";
      render();
    } catch (error) {
      status.textContent =
        error instanceof SyntaxError || error instanceof TypeError
          ? "Impossible de lire l’historique Uber Eats. Actualisez la page et réessayez."
          : error.message;
    } finally {
      loading = false;
      refresh.disabled = false;
      more.disabled = false;
    }
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      close.focus({ preventScroll: true });
      if (!loaded) void load();
    } else launcher.focus({ preventScroll: true });
  }

  function updateRoute() {
    if (previousPath === location.pathname) return;
    previousPath = location.pathname;
    const isHistory = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?orders\/?$/.test(location.pathname);
    const prefix = location.pathname.match(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/)?.[0] || "";
    historyLink.href = `${location.origin}${prefix}/orders`;
    historyLink.hidden = isHistory || loaded;
    if (isHistory) setOpen(true);
  }

  launcher.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
  search.addEventListener("input", render);
  refresh.addEventListener("click", () => void load(true));
  more.addEventListener("click", () => void load());
  new MutationObserver(updateRoute).observe(document.body, { childList: true, subtree: true });
  updateRoute();
})();
