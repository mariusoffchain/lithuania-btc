import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const get = (p) =>
  readFileSync(new URL("../public-build/" + p, import.meta.url), "utf8");
for (const prefix of ["", "en/"])
  test(`ecosystem ${prefix || "lt"} has its own metadata, local relationships and offline route`, () => {
    const route = prefix + "ecosystem/",
      html = get(route + "index.html");
    assert.ok(
      html.includes(`rel="canonical" href="https://lithuaniabtc.com/${route}"`),
    );
    assert.ok(html.includes('"@type":"CollectionPage"'));
    assert.ok(!html.includes('src="atlas-app.js"'));
    for (const id of ["meetups", "walks", "proof", "bringin", "wavespace"])
      assert.ok(html.includes(`id="${id}"`));
    assert.ok(
      html.includes(`href="/${prefix}?event=meetup-315774816&view=events"`),
    );
    assert.ok(get("sw.js").includes(`"/${route}"`));
    assert.ok(get("sitemap.xml").includes("/" + route + "</loc>"));
    const nav = html.match(/<nav class="mobile-bottom-nav"[\s\S]*?<\/nav>/)[0];
    assert.equal((nav.match(/<a\b/g) || []).length, 4);
    assert.ok(nav.includes(`href="/${route}"`));
  });
