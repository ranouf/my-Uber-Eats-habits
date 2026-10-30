(async () => {
  const { collectOrders, groupRestaurants } = await import(chrome.runtime.getURL("src/orders.js"));
  const { createPanel, renderRestaurants } = await import(chrome.runtime.getURL("src/ui.js"));
  const { shadow } = createPanel(chrome.runtime.getManifest().version);
  const launcher = shadow.querySelector(".launcher");
  const panel = shadow.querySelector(".panel");
  const close = shadow.querySelector(".close");
  const status = shadow.querySelector(".status");
  const search = shadow.querySelector("input");
  const results = shadow.querySelector(".restaurants");
  const historyLink = shadow.querySelector(".history-link");
  let restaurants = [];
  let previousSignature;
  let wasHistory = false;
  let scheduled = false;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) close.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  }

  function render() {
    renderRestaurants(results, restaurants, search.value);
  }

  function update() {
    const isHistory = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?orders\/?$/.test(location.pathname);
    if (isHistory && !wasHistory) setOpen(true);
    wasHistory = isHistory;
    historyLink.hidden = isHistory;
    const orders = isHistory ? collectOrders() : [];
    const signature = JSON.stringify([isHistory, orders]);
    if (signature === previousSignature) return;
    previousSignature = signature;
    restaurants = groupRestaurants(orders);
    search.hidden = !restaurants.length;
    status.textContent = !isHistory
      ? "Ouvrez votre historique pour retrouver vos restaurants et leurs dernières commandes."
      : restaurants.length
        ? `${restaurants.length} restaurants · ${restaurants.reduce((sum, restaurant) => sum + restaurant.orders.length, 0)} commandes chargées`
        : "Aucune commande passée chargée pour le moment. Attendez le chargement de l’historique.";
    render();
  }

  launcher.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
  search.addEventListener("input", render);
  shadow.querySelector(".refresh").addEventListener("click", () => {
    previousSignature = undefined;
    update();
  });
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      update();
    }, 120);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  update();
})();
