(async () => {
  const { groupRestaurants, loadOrderPage } = await import(chrome.runtime.getURL("src/orders.js"));
  const { RatingUnavailableError, loadPublicRating, submitRestaurantRating } = await import(
    chrome.runtime.getURL("src/ratings.js")
  );
  const { createPanel, renderRestaurants } = await import(chrome.runtime.getURL("src/ui.js"));
  const { markOrderedRestaurants } = await import(chrome.runtime.getURL("src/cards.js"));
  const { shadow } = createPanel();
  const launcher = shadow.querySelector(".launcher");
  const panel = shadow.querySelector(".panel");
  const close = shadow.querySelector(".close");
  const status = shadow.querySelector(".status");
  const search = shadow.querySelector("input");
  const results = shadow.querySelector(".restaurants");
  const historyLink = shadow.querySelector(".history-link");
  const refresh = shadow.querySelector(".refresh");
  const sentinel = shadow.querySelector(".load-sentinel");
  const paginationLoading = shadow.querySelector(".pagination-loading");
  const pagination = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !panel.hidden && !selectedId) void load();
    },
    { root: shadow.querySelector(".panel-body"), rootMargin: "0px 0px 100px 0px" },
  );
  let orders = [];
  let restaurants = [];
  let cursor = "";
  let loaded = false;
  let loading = false;
  let hasMore = false;
  let previousPath;
  const publicRatings = new Map();
  const historyPages = new Map();
  const indexedOrders = new Map();
  let indexedRestaurants = [];
  let selectedId = null;
  let indexRevision = 0;

  function historyPage(cursor) {
    if (!historyPages.has(cursor)) {
      historyPages.set(
        cursor,
        loadOrderPage(cursor).catch((error) => {
          historyPages.delete(cursor);
          throw error;
        }),
      );
    }
    return historyPages.get(cursor);
  }

  function visibleRestaurants() {
    return selectedId
      ? indexedRestaurants.filter((restaurant) => restaurant.id === selectedId)
      : restaurants;
  }

  function recordOrders(pageOrders) {
    for (const order of pageOrders) indexedOrders.set(order.id, order);
    indexedRestaurants = groupRestaurants([...indexedOrders.values()]);
  }

  function selectedSummary() {
    const count = visibleRestaurants()[0].orders.length;
    return `${count} commande${count > 1 ? "s" : ""} chez ce restaurant`;
  }

  function historySummary() {
    return restaurants.length
      ? `${restaurants.length} restaurants · ${restaurants.reduce((sum, restaurant) => sum + restaurant.orders.length, 0)} commandes chargées`
      : "Aucune commande passée dans votre historique Uber Eats.";
  }

  function updateBadges() {
    markOrderedRestaurants(indexedRestaurants, (id) => {
      selectedId = id;
      search.value = "";
      search.hidden = false;
      historyLink.hidden = true;
      setOpen(true);
      pagination.unobserve(sentinel);
      render();
      results.querySelector("details").open = true;
      shadow.querySelector(".panel-body").scrollTop = 0;
      status.textContent = selectedSummary();
      void loadPublicRatings();
    });
  }

  async function indexHistory() {
    const revision = ++indexRevision;
    let nextCursor = "";
    try {
      let page;
      do {
        page = await historyPage(nextCursor);
        if (revision !== indexRevision) return;
        recordOrders(page.orders);
        updateBadges();
        if (selectedId) {
          render();
          results.querySelector("details").open = true;
          status.textContent = selectedSummary();
          void loadPublicRatings();
        }
        nextCursor = page.cursor;
      } while (page.hasMore);
    } catch {
      // Le chargement du panneau affiche les erreurs et permet de réessayer.
    }
  }

  function render() {
    renderRestaurants(results, visibleRestaurants(), search.value, rateOrder);
  }

  async function rateOrder(order, stars) {
    order.ratingBusy = true;
    order.ratingMessage = "Envoi de votre note à Uber Eats…";
    render();
    try {
      await submitRestaurantRating(order, stars);
      order.personalRating = stars;
      order.ratingMessage = "Note envoyée à Uber Eats.";
    } catch (error) {
      if (error instanceof RatingUnavailableError) {
        order.canRate = false;
        order.ratingMessage = "";
      } else {
        order.ratingMessage =
          error instanceof TypeError || error instanceof SyntaxError
            ? "Impossible d’envoyer la note. Réessayez."
            : error.message;
      }
    } finally {
      order.ratingBusy = false;
      render();
      if (!panel.hidden) {
        results
          .querySelector(`[data-order-id="${CSS.escape(order.id)}"] [data-value="${stars}"]`)
          ?.focus({ preventScroll: true });
      }
    }
  }

  async function loadPublicRatings() {
    await Promise.all(
      visibleRestaurants().map(async (restaurant) => {
        if (restaurant.publicRating?.ratingValue != null) return;
        try {
          if (!publicRatings.has(restaurant.id)) {
            publicRatings.set(restaurant.id, loadPublicRating(restaurant.id));
          }
          restaurant.publicRating = await publicRatings.get(restaurant.id);
        } catch {
          restaurant.publicRating = null;
        }
        restaurant.ratingLoaded = true;
      }),
    );
    render();
  }

  async function load(reset = false) {
    if (loading) return;
    loading = true;
    paginationLoading.hidden = !loaded || reset;
    refresh.disabled = true;
    pagination.unobserve(sentinel);
    status.textContent = "Chargement de votre historique Uber Eats…";
    if (reset) {
      selectedId = null;
      indexRevision++;
      historyPages.clear();
      indexedOrders.clear();
      indexedRestaurants = [];
      updateBadges();
      orders = [];
      restaurants = [];
      cursor = "";
      loaded = false;
      publicRatings.clear();
      hasMore = false;
      search.hidden = true;
      render();
    }
    try {
      const page = await historyPage(cursor);
      recordOrders(page.orders);
      orders.push(...page.orders);
      cursor = page.cursor;
      loaded = true;
      restaurants = groupRestaurants(orders);
      search.hidden = !restaurants.length;
      historyLink.hidden = true;
      hasMore = page.hasMore;
      status.textContent = selectedId ? selectedSummary() : historySummary();
      render();
      void loadPublicRatings();
      updateBadges();
      if (reset && /\/(?:feed|search)\/?$|\/store\//.test(location.pathname)) void indexHistory();
    } catch (error) {
      hasMore = false;
      status.textContent =
        error instanceof SyntaxError || error instanceof TypeError
          ? "Impossible de lire l’historique Uber Eats. Actualisez la page et réessayez."
          : error.message;
    } finally {
      loading = false;
      paginationLoading.hidden = true;
      refresh.disabled = false;
      if (hasMore && !panel.hidden && !selectedId) pagination.observe(sentinel);
    }
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      close.focus({ preventScroll: true });
      if (!loaded && !selectedId) void load();
      else if (hasMore && !selectedId) pagination.observe(sentinel);
    } else {
      pagination.unobserve(sentinel);
      launcher.focus({ preventScroll: true });
    }
  }

  function updateRoute() {
    if (previousPath === location.pathname) return;
    previousPath = location.pathname;
    const isHistory = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?orders\/?$/.test(location.pathname);
    const prefix = location.pathname.match(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/)?.[0] || "";
    historyLink.href = `${location.origin}${prefix}/orders`;
    historyLink.hidden = isHistory || loaded;
    if (isHistory) {
      selectedId = null;
      search.value = "";
      render();
      setOpen(true);
    } else if (/\/(?:feed|search)\/?$|\/store\//.test(location.pathname)) void indexHistory();
  }

  launcher.addEventListener("click", () => {
    selectedId = null;
    search.value = "";
    render();
    if (loaded) status.textContent = historySummary();
    setOpen(true);
  });
  close.addEventListener("click", () => setOpen(false));
  shadow.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });
  search.addEventListener("input", () => {
    selectedId = null;
    if (!loaded) {
      void load();
      return;
    }
    if (hasMore) pagination.observe(sentinel);
    status.textContent = historySummary();
    render();
  });
  refresh.addEventListener("click", () => void load(true));
  new MutationObserver(() => {
    updateRoute();
    updateBadges();
  }).observe(document.body, { childList: true, subtree: true });
  updateRoute();
})();
