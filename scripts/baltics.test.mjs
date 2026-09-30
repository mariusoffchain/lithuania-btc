import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  inCountry,
  placeCountry,
  filterPlaces,
  inScope,
  countryAddress,
} from "../domain.js";
const read = (p) =>
  JSON.parse(readFileSync(new URL("../" + p, import.meta.url)));
const boundary = read("profiles/baltics/boundary.geojson");
const config = read("profiles/baltics/config.json");
const out = mkdtempSync(join(tmpdir(), "baltics-test-"));
execFileSync(process.execPath, ["scripts/build-release.mjs", out], {
  env: { ...process.env, SITE_PROFILE: "baltics" },
});
const output = (p) => readFileSync(join(out, p), "utf8");
test("regional geography includes all capitals and Estonian islands, excludes neighbours", () => {
  for (const [lat, lon, code] of [
    [54.6872, 25.2797, "LT"],
    [56.9496, 24.1052, "LV"],
    [59.437, 24.744, "EE"],
    [58.248, 22.487, "EE"],
    [59.9139, 10.7522, null],
    [60.1699, 24.9384, null],
    [54.7104, 20.4522, null],
  ]) {
    assert.equal(placeCountry({ lat, lon }, boundary), code);
    assert.equal(inCountry({ lat, lon }, boundary), !!code);
  }
});
test("country filtering keeps merchants and events in the chosen scope", () => {
  const snapshot = read("profiles/baltics/merchants-snapshot.json");
  const places = filterPlaces(
    [...snapshot.places, ...snapshot.places],
    boundary,
  ).map((p) => ({ ...p, country: placeCountry(p, boundary) }));
  assert.equal(places.length, snapshot.places.length);
  for (const c of config.countries)
    assert.ok(places.filter((p) => inScope(p, c.code)).length > 0);
  assert.equal(inScope({ country: "LT" }, "LV"), false);
  assert.equal(inScope({ country: "LT" }, ""), true);
  assert.equal(
    countryAddress("Riga", "LV", config.countries),
    "🇱🇻 Latvia · Riga",
  );
  assert.equal(countryAddress("Vilnius", "LT"), "Vilnius");
});
test("regional build uses shared Lithuanian data and its own identity, cache and metadata", () => {
  const events = JSON.parse(output("data/events.json"));
  const source = read("data/events.json");
  assert.equal(events.filter((e) => e.country === "LT").length, source.length);
  assert.equal(new Set(events.map((e) => e.id)).size, events.length);
  for (const e of events)
    assert.ok(config.countries.some((c) => c.code === e.country));
  const html = output("index.html");
  assert.match(html, /<html lang="en"/);
  assert.match(html, /rel="canonical" href="https:\/\/bitcoinbaltics.com\/"/);
  assert.match(html, /baltics-share.jpg/);
  assert.ok(!html.includes("share-atlas-en"));
  assert.ok(!html.includes('hreflang="lt"'));
  assert.ok(!html.includes("Lietuvoje"));
  assert.equal(
    JSON.parse(output("manifest.webmanifest")).name,
    "Bitcoin Baltics",
  );
  assert.match(output("sw.js"), /bitcoin-baltics-map-v1/);
  assert.ok(!output("sw.js").includes("lithuania-btc-"));
  assert.ok(!output("sitemap.xml").includes("lithuaniabtc.com"));
  assert.ok(!output("llms.txt").includes("available in Lithuanian"));
  assert.match(output("about/index.html"), /id="community-config"/);
  assert.match(
    output("about/index.html"),
    /class="desktop-about" aria-current="page" data-about-link href="\/about\/"/,
  );
});
