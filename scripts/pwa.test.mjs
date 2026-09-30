import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
const template = await readFile(
  new URL("../sw-template.js", import.meta.url),
  "utf8",
);
function worker() {
  const handlers = {},
    stores = new Map();
  let online = true;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const data = stores.get(name);
      const key = (r) => (typeof r === "string" ? r : r.url);
      return {
        addAll: async (paths) =>
          paths.forEach((p) => data.set(p, new Response("cached:" + p))),
        match: async (r) => data.get(key(r))?.clone(),
        put: async (r, v) => data.set(key(r), v.clone()),
        keys: async () => [...data.keys()],
        delete: async (r) => data.delete(key(r)),
      };
    },
    keys: async () => [...stores.keys()],
    delete: async (n) => stores.delete(n),
  };
  vm.runInNewContext(
    template
      .replace("__VERSION__", "test")
      .replace("__PRECACHE__", JSON.stringify(["/en/", "/data/events.json"])),
    {
      URL,
      Response,
      AbortController,
      setTimeout,
      clearTimeout,
      caches,
      fetch: async () => {
        if (!online) throw Error("offline");
        return new Response("network");
      },
      self: {
        location: { origin: "https://example.com" },
        clients: { claim: async () => {} },
        addEventListener: (type, fn) => (handlers[type] = fn),
      },
    },
  );
  return {
    stores,
    setOnline: (value) => (online = value),
    async install() {
      let p;
      handlers.install({ waitUntil: (v) => (p = v) });
      await p;
    },
    fetch(url) {
      let p;
      handlers.fetch({
        request: { url, method: "GET" },
        respondWith: (v) => (p = v),
      });
      return p;
    },
  };
}
test("offline navigation preserves query URLs and cached local data", async () => {
  const w = worker();
  await w.install();
  w.setOnline(false);
  assert.equal(
    await (await w.fetch("https://example.com/en/?event=proof")).text(),
    "cached:/en/",
  );
  assert.equal(
    await (await w.fetch("https://example.com/data/events.json")).text(),
    "cached:/data/events.json",
  );
});
test("only the selected map provider is cached and visited tiles work offline", async () => {
  const w = worker();
  await w.fetch("https://tiles.openfreemap.org/tile.pbf");
  w.setOnline(false);
  assert.equal(
    await (await w.fetch("https://tiles.openfreemap.org/tile.pbf")).text(),
    "network",
  );
  assert.equal(w.fetch("https://other.example/tile.pbf"), undefined);
});
test("map cache is bounded and offline misses do not invent a response", async () => {
  const w = worker();
  for (let i = 0; i < 260; i++)
    await w.fetch("https://tiles.openfreemap.org/" + i + ".pbf");
  assert.equal(w.stores.get("lt-btc-map-v1").size, 256);
  w.setOnline(false);
  assert.equal(
    (await w.fetch("https://tiles.openfreemap.org/0.pbf")).type,
    "error",
  );
});
