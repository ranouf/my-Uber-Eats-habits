import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createApiClient } from "../src/api-client.js";
import { createApiInterceptor, UberEatsApiError } from "../src/api-interceptor.js";

test("lit les deux pages avec la session du navigateur et le curseur observé", async () => {
  const calls = [];
  const pages = [
    { orderUuids: ["order-2", "order-1"], ordersMap: {}, meta: { hasMore: true } },
    { orderUuids: ["order-0"], ordersMap: {}, meta: { hasMore: false } },
  ];
  const controller = new AbortController();
  const api = createApiClient("ca-fr", async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json({ status: "success", data: pages[calls.length - 1] });
  });
  assert.equal(calls.length, 0);
  const firstPage = (await api.getPastOrdersV1({ lastWorkflowUUID: "" })).data;
  const secondPage = await api.getPastOrdersV1(
    { lastWorkflowUUID: firstPage.orderUuids.at(-1) },
    controller.signal,
  );
  assert.deepEqual(secondPage.data.orderUuids, ["order-0"]);
  assert.equal(calls[0].url, "https://www.ubereats.com/_p/api/getPastOrdersV1?localeCode=ca-fr");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.credentials, "same-origin");
  assert.equal(calls[0].options.headers.get("content-type"), "application/json");
  assert.equal(calls[0].options.headers.get("x-csrf-token"), "x");
  assert.deepEqual(JSON.parse(calls[0].options.body), { lastWorkflowUUID: "" });
  assert.deepEqual(JSON.parse(calls[1].options.body), { lastWorkflowUUID: "order-1" });
  assert.equal(calls[1].options.signal, controller.signal);
});

test("ne déclenche une mutation que sur appel explicite et conserve le corps fourni", async () => {
  const calls = [];
  const api = createApiClient("en-CA", async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json({ status: "success", data: { accepted: true } });
  });
  assert.equal(calls.length, 0);
  const request = { workflowUUID: "fixture-only", reason: "fixture-only" };
  assert.deepEqual((await api.cancelOrderV1(request)).data, { accepted: true });
  assert.deepEqual(calls, [
    {
      url: "https://www.ubereats.com/_p/api/cancelOrderV1?localeCode=en-CA",
      body: request,
    },
  ]);
});

test("distingue une erreur HTTP d'une erreur RPC renvoyée en HTTP 200", async () => {
  const denied = createApiClient("ca-fr", async () => new Response(null, { status: 401 }));
  await assert.rejects(denied.getPastOrdersV1({ lastWorkflowUUID: "" }), (error) => {
    assert.ok(error instanceof UberEatsApiError);
    assert.equal(error.operation, "getPastOrdersV1");
    assert.equal(error.httpStatus, 401);
    return true;
  });
  const details = { code: "UNAUTHENTICATED", message: "Fixture" };
  const failed = createApiClient("ca-fr", async () =>
    Response.json({ status: "failure", data: details }),
  );
  await assert.rejects(failed.getPastOrdersV1({ lastWorkflowUUID: "" }), (error) => {
    assert.ok(error instanceof UberEatsApiError);
    assert.equal(error.httpStatus, 200);
    assert.deepEqual(error.details, details);
    return true;
  });
});

test("propage l'annulation sans la transformer en erreur métier", async () => {
  const controller = new AbortController();
  controller.abort();
  const api = createApiClient("ca-fr", async (_url, options) => {
    options.signal.throwIfAborted();
    return Response.json({ status: "success", data: {} });
  });
  await assert.rejects(api.getOrderEntitiesV1({}, controller.signal), { name: "AbortError" });
});

test("limite les paramètres de session aux opérations Uber Eats et préserve les en-têtes", async () => {
  const calls = [];
  const response = Response.json({ status: "success", data: {} });
  const intercepted = createApiInterceptor("fr-FR", async (...args) => {
    calls.push(args);
    return response;
  });
  const options = { headers: { "x-request-id": "fixture" }, method: "POST" };
  await intercepted("https://example.com/_p/api/getUserV1", options);
  assert.equal(calls[0][1], options);
  assert.equal(calls[0][0], "https://example.com/_p/api/getUserV1");
  await intercepted("https://www.ubereats.com/_p/api/getUserV1", options);
  assert.equal(calls[1][1].headers.get("x-request-id"), "fixture");
  assert.equal(calls[1][1].headers.get("x-csrf-token"), "x");
  assert.equal(new URL(calls[1][0]).searchParams.get("localeCode"), "fr-FR");
  assert.equal(options.headers["x-csrf-token"], undefined);
});

test("chaque opération du schéma local possède une méthode générée", () => {
  const schema = JSON.parse(readFileSync("openapi.local.json", "utf8"));
  const api = createApiClient("ca-fr", () => {
    throw new Error("Aucun appel ne doit être exécuté.");
  });
  assert.equal(Object.keys(schema.paths).length, 109);
  for (const path of Object.values(schema.paths)) {
    assert.equal(typeof api[path.post.operationId], "function");
    assert.ok(["partial", "unverified"].includes(path.post["x-contract-status"]));
  }
});
