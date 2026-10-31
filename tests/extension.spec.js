import { readFileSync } from "node:fs";
import path from "node:path";

import { chromium, expect, test } from "@playwright/test";

import { collectOrders, groupRestaurants } from "../src/orders.js";

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

let context;
let orders;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(path.join(root, ".codex/browser-tests"), {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${root}`, `--load-extension=${root}`],
  });
  const page = await context.newPage();
  await page.goto("chrome://extensions/");
  const extension = page.locator("extensions-item").filter({ hasText: "UberEatHabits" });
  await expect(extension).toHaveCount(1);
  await context.route("https://www.ubereats.com/**", (route) =>
    route.fulfill({ body: fixture, contentType: "text/html" }),
  );
  await page.goto("https://www.ubereats.com/orders");
  orders = await page.evaluate(collectOrders);
  await page.close();
});

test.afterAll(async () => {
  await context?.close();
});

test("extrait les commandes passées et conserve les restaurants dans l'ordre de récence", () => {
  expect(orders).toHaveLength(3);
  expect(orders[0]).toMatchObject({
    restaurant: "La Cantine",
    date: "Oct 25 at 7:05 PM",
    total: "3 items for CA$42.50",
    items: ["2 × Soupe à l’oignon", "1 × Salade verte"],
  });
  expect(orders[1]).toMatchObject({ date: "Oct 20 at 6:30 PM", total: "2 items for CA$36.00" });
  const grouped = groupRestaurants([...orders, orders[0]]);
  expect(grouped.map((restaurant) => restaurant.name)).toEqual(["La Cantine", "Maison Bangkok"]);
  expect(grouped[0].orders.map((order) => order.id)).toEqual(["order-3", "order-1"]);
});

test("affiche les dernières commandes par restaurant et filtre la liste", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://www.ubereats.com/orders");
  await expect(
    page.getByRole("complementary", { name: "UberEatHabits — Mes restaurants" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await expect(page.locator(".panel .version")).toHaveText(`v${version}`);
  await expect(page.locator(".restaurant-name")).toHaveText(["La Cantine", "Maison Bangkok"]);
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  await expect(page.locator("details[open] .order-date")).toHaveText([
    "Oct 25 at 7:05 PM",
    "Sep 12 at 7:00 PM",
  ]);
  await expect(page.getByRole("link", { name: "Voir le reçu ↗" }).first()).toHaveAttribute(
    "href",
    /modctx=order-3/,
  );
  await page.screenshot({ path: ".codex/panel-desktop.png" });
  await page.getByRole("searchbox").fill("bangkok");
  await expect(page.locator(".restaurant-name")).toHaveText(["Maison Bangkok"]);
  await page.getByRole("searchbox").fill("introuvable");
  await expect(page.getByText("Aucun restaurant ne correspond à votre recherche.")).toBeVisible();
  await page.close();
});

test("ouvre le panneau depuis le site et guide vers l'historique", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("https://www.ubereats.com/feed");
  await expect(page.locator(".launcher .version")).toHaveText(`v${version}`);
  await page.locator(".launcher").screenshot({ path: ".codex/panel-launcher.png" });
  await page.getByRole("button", { name: "Mes restaurants", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Ouvrez votre historique");
  await expect(page.getByRole("link", { name: /Ouvrir mon historique/ })).toHaveAttribute(
    "href",
    "https://www.ubereats.com/orders",
  );
  await page.getByRole("button", { name: "Fermer le panneau" }).click();
  await expect(page.getByRole("button", { name: "Mes restaurants", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mes restaurants", exact: true }).click();
  await page.getByRole("link", { name: /Ouvrir mon historique/ }).click();
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 3 commandes chargées");
  await page.close();
});

test("actualise les commandes chargées sans perdre le restaurant ouvert", async () => {
  const page = await context.newPage();
  await page.goto("https://www.ubereats.com/orders");
  await page.locator(".restaurant-name").filter({ hasText: "La Cantine" }).click();
  await page.evaluate(() => {
    const card = document
      .querySelector('a[href*="modctx=order-1"]')
      .closest("main > div")
      .cloneNode(true);
    card.querySelector('a[href*="modctx="]').href = "/orders?mod=orderReceipt&modctx=order-0";
    document.querySelector("main").append(card);
  });
  await expect(page.getByRole("status")).toHaveText("2 restaurants · 4 commandes chargées");
  await expect(page.locator("details[open] .order")).toHaveCount(3);
  await page.close();
});

test("affiche un panneau utilisable sur mobile et le ferme au clavier", async () => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("https://www.ubereats.com/orders");
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
