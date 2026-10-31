import { readFileSync } from "node:fs";
import path from "node:path";

import { chromium, expect, test } from "@playwright/test";

import { groupRestaurants } from "../src/orders.js";

const root = path.resolve(".");
const { version } = JSON.parse(readFileSync("manifest.json", "utf8"));
const fixture = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>
body { margin:0; font:16px Arial,sans-serif; color:#000; background:#fff; }
header { display:flex; align-items:center; gap:48px; padding:26px 40px; border-bottom:1px solid #eee; }
header strong { font-size:28px; font-weight:400; } header strong span { font-weight:700; color:#06c167; }
header input { padding:14px 22px; border:0; border-radius:999px; background:#f3f3f3; width:360px; }
main { max-width:800px; padding:32px 40px; }
main > div { padding:24px 0; border-bottom:1px solid #eee; } main a { color:#000; } main ul { color:#545454; }
</style></head><body><header><strong>Uber <span>Eats</span></strong><input aria-label="Search Uber Eats" placeholder="Search Uber Eats"></header><main><h1>Past Orders</h1>
  <div><span>In Progress</span><span>Restaurant en cours</span><a href="/orders/current">Track order</a></div>
  <div>
    <a href="/store/la-cantine/store-a"><figure></figure></a>
    <a href="/store/la-cantine/store-a">La Cantine</a>
    <div>3 items for CA$42.50</div><div>•</div><div>Oct 25 at 7:05 PM</div><div>•</div>
    <a href="/orders?mod=orderReceipt&modctx=order-3">View receipt</a>
    <ul><li><ul><li>2<span>Soupe à l’oignon</span></li><li>1<span>Salade verte</span></li></ul></li></ul>
  </div>
  <div>
    <a href="/store/bangkok/store-b">Maison Bangkok</a>
    <span>2 items for CA$36.00</span><span> • </span><span>Oct 20 at 6:30 PM</span><span> • </span>
    <a href="/orders?mod=orderReceipt&modctx=order-2">View receipt</a>
    <ul><li>1<span>Pad thaï</span></li><li>1<span>Riz sauté</span></li></ul>
  </div>
  <div>
    <a href="/store/la-cantine/store-a">La Cantine</a>
    <div>1 item for CA$18.50</div><div>•</div><div>Sep 12 at 7:00 PM</div><div>•</div>
    <a href="/orders?mod=orderReceipt&modctx=order-1">View receipt</a>
    <ul><li>1<span>Soupe à l’oignon</span></li></ul>
  </div>
</main></body></html>`;

const apiOrders = [
  {
    id: "order-3",
    store: "a",
    date: "2026-10-25T23:05:00Z",
    total: "42,50 $",
    items: [
      [2, "Soupe à l’oignon"],
      [1, "Salade verte"],
    ],
  },
  {
    id: "order-2",
    store: "b",
    date: "2026-10-20T22:30:00Z",
    total: "36,00 $",
    items: [
      [1, "Pad thaï"],
      [1, "Riz sauté"],
    ],
  },
  {
    id: "order-1",
    store: "a",
    date: "2026-09-12T23:00:00Z",
    total: "18,50 $",
    items: [[1, "Soupe à l’oignon"]],
  },
];
function apiResponse(orders, hasMore) {
  return {
    status: "success",
    data: {
      orderUuids: orders.map((order) => order.id),
      ordersMap: Object.fromEntries(
        orders.map((order) => [
          order.id,
          {
            baseEaterOrder: {
              uuid: order.id,
              lastStateChangeAt: order.date,
              shoppingCart: {
                items: order.items.map(([quantity, title]) => ({ quantity, title })),
              },
            },
            storeInfo: {
              uuid:
                order.store === "a"
                  ? "00000000-0000-0000-0000-000000000001"
                  : "00000000-0000-0000-0000-000000000002",
              title: order.store === "a" ? "La Cantine" : "Maison Bangkok",
              slug: order.store === "a" ? "la-cantine" : "maison-bangkok",
            },
            fareInfo: { checkoutInfo: [{ key: "eats_fare.total", formattedValue: order.total }] },
          },
        ]),
      ),
      paginationData: { nextCursor: "unused-server-cursor" },
      meta: { hasMore },
    },
  };
}
let context;
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(path.join(root, ".codex/browser-tests"), {
    channel: "chromium",
    headless: true,
    timezoneId: "America/Toronto",
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  });
  await context.route("https://www.ubereats.com/**", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === "/_p/api/getPastOrdersV1") {
      expect(request.method()).toBe("POST");
      expect(request.headers()["x-csrf-token"]).toBe("x");
      const { lastWorkflowUUID } = request.postDataJSON();
      expect(["", "order-1"]).toContain(lastWorkflowUUID);
      return route.fulfill({
        json: lastWorkflowUUID
          ? apiResponse([apiOrders[2], { ...apiOrders[2], id: "order-0" }], false)
          : apiResponse(apiOrders, true),
      });
    }
    return route.fulfill({
      contentType: "text/html",
      body: new URL(request.url()).pathname.endsWith("/orders")
        ? fixture
        : fixture.replace(
            /<main>[\s\S]*<\/main>/,
            "<main><h1>Vos restaurants à proximité</h1></main>",
          ),
    });
  });
});
test.afterAll(async () => {
  await context?.close();
});

test("regroupe les commandes et élimine les doublons sans changer leur ordre", () => {
  const orders = [
    { id: "3", restaurantId: "a", restaurant: "La Cantine", restaurantUrl: "/a" },
    { id: "2", restaurantId: "b", restaurant: "Maison Bangkok", restaurantUrl: "/b" },
    { id: "1", restaurantId: "a", restaurant: "La Cantine", restaurantUrl: "/a" },
  ];
  const restaurants = groupRestaurants([...orders, orders[0]]);
  expect(restaurants.map((restaurant) => restaurant.name)).toEqual([
    "La Cantine",
    "Maison Bangkok",
  ]);
  expect(restaurants[0].orders.map((order) => order.id)).toEqual(["3", "1"]);
});

test("affiche les commandes API dans le panneau et filtre les restaurants", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://www.ubereats.com/ca-fr/orders");
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await expect(page.locator(".panel .version")).toHaveText(`v${version}`);
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  await expect(page.locator("details[open] .order-total")).toHaveText(["42,50 $", "18,50 $"]);
  await expect(page.locator("details[open] .items li")).toHaveText([
    "2 × Soupe à l’oignon",
    "1 × Salade verte",
    "1 × Soupe à l’oignon",
  ]);
  await expect(page.getByRole("link", { name: "Voir le reçu ↗" }).first()).toHaveAttribute(
    "href",
    /\/ca-fr\/orders\?mod=orderReceipt&modctx=order-3$/,
  );
  await page.screenshot({ path: ".codex/panel-desktop.png" });
  await page.getByRole("searchbox").fill("bangkok");
  await expect(page.locator(".restaurant-name")).toHaveText(["Maison Bangkok"]);
  await page.getByRole("searchbox").fill("introuvable");
  await expect(page.getByText("Aucun restaurant ne correspond à votre recherche.")).toBeVisible();
  await page.close();
});

test("charge les commandes depuis l’accueil français sans naviguer vers l’historique", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://www.ubereats.com/ca-fr/feed?diningMode=DELIVERY&pl=test");
  await expect(page.locator('main a[href*="mod=orderReceipt"]')).toHaveCount(0);
  await expect(page.locator(".launcher .version")).toHaveText(`v${version}`);
  await page.locator(".launcher").screenshot({ path: ".codex/panel-launcher.png" });
  const request = page.waitForRequest((request) => request.url().includes("/getPastOrdersV1"));
  await page.getByRole("button", { name: "Mes restaurants", exact: true }).click();
  expect(new URL((await request).url()).searchParams.get("localeCode")).toBe("ca-fr");
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await expect(page).toHaveURL(/\/ca-fr\/feed\?/);
  await expect(page.getByRole("link", { name: /Ouvrir mon historique/ })).toBeHidden();
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  await page.screenshot({ path: ".codex/panel-feed.png" });
  await page.close();
});

test("pagine avec le dernier identifiant et conserve le restaurant ouvert", async () => {
  const page = await context.newPage();
  await page.goto("https://www.ubereats.com/orders");
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  await page.getByRole("button", { name: "Charger plus de commandes" }).click();
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 4 commandes chargées");
  await expect(page.locator("details[open] .order")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Charger plus de commandes" })).toBeHidden();
  await page.getByRole("button", { name: "Actualiser les commandes" }).click();
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await page.close();
});

test("affiche le panneau sur mobile et le ferme au clavier", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("https://www.ubereats.com/ca-fr/orders");
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  const panel = page.getByRole("complementary", { name: "UberEatHabits — Mes restaurants" });
  expect((await panel.boundingBox()).width).toBe(390);
  await page.screenshot({ path: ".codex/panel-mobile.png" });
  await page.getByRole("button", { name: "Fermer le panneau" }).focus();
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await page.close();
});

test("distingue une session expirée d’un historique vide et permet de réessayer", async () => {
  const page = await context.newPage();
  await page.route("**/_p/api/getPastOrdersV1?*", (route) =>
    route.fulfill({ status: 401, json: { status: "failure" } }),
  );
  await page.goto("https://www.ubereats.com/ca-fr/orders");
  await expect(page.getByRole("status")).toContainText("Reconnectez-vous");
  await expect(page.locator(".restaurant")).toHaveCount(0);
  await page.unroute("**/_p/api/getPastOrdersV1?*");
  await page.getByRole("button", { name: "Actualiser les commandes" }).click();
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await page.close();
});

test("affiche explicitement un historique vide sans pagination", async () => {
  const page = await context.newPage();
  await page.route("**/_p/api/getPastOrdersV1?*", (route) =>
    route.fulfill({ json: apiResponse([], false) }),
  );
  await page.goto("https://www.ubereats.com/ca-fr/orders");
  await expect(page.getByRole("status")).toHaveText(
    "Aucune commande passée dans votre historique Uber Eats.",
  );
  await expect(page.getByRole("button", { name: "Charger plus de commandes" })).toBeHidden();
  await page.close();
});
