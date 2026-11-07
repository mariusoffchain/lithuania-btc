import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker.mjs";

const env = {
  ASSETS: {
    fetch: async () =>
      new Response("{}", { headers: { "Content-Type": "application/json" } }),
  },
};
const get = (path, method = "GET") =>
  worker.fetch(new Request("https://lithuaniabtc.com" + path, { method }), env);

test("shared data is readable from other origins", async () => {
  for (const path of ["/data/events.json", "/llms.txt", "/read/events.md"]) {
    const res = await get(path);
    assert.equal(res.headers.get("Access-Control-Allow-Origin"), "*", path);
  }
  const preflight = await get("/data/events.json", "OPTIONS");
  assert.equal(preflight.status, 204);
});

test("pages keep their default cross-origin policy", async () => {
  const res = await get("/en/");
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), null);
});

test("non-canonical hosts still redirect", async () => {
  const res = await worker.fetch(
    new Request("https://www.lithuaniabtc.com/data/events.json"),
    env,
  );
  assert.equal(res.status, 301);
  assert.equal(
    res.headers.get("Location"),
    "https://lithuaniabtc.com/data/events.json",
  );
});
