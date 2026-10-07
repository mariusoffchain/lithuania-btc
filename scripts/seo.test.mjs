import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const out = mkdtempSync(join(tmpdir(), "lithuania-seo-"));
execFileSync(process.execPath, ["scripts/build-release.mjs", out]);
const get = (p) => readFileSync(join(out, p), "utf8");
for (const [path, lang] of [
  ["", "lt"],
  ["en/", "en"],
  ["about/", "lt"],
  ["en/about/", "en"],
]) {
  test(`${path || "/"} has indexable localized metadata and sharing image`, () => {
    const html = get(path + "index.html");
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.match(
      html,
      new RegExp(`rel="canonical" href="https://lithuaniabtc.com/${path}"`),
    );
    assert.match(
      html,
      new RegExp(
        `og:image"\\s+content="https://lithuaniabtc.com/assets/share-atlas-${lang}-v2.jpg"`,
      ),
    );
    assert.ok(
      readFileSync(join(out, `assets/share-atlas-${lang}-v2.jpg`)).length >
        10000,
    );
    const schema = JSON.parse(
      html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1],
    );
    assert.equal(
      schema["@type"],
      path.includes("about") ? "AboutPage" : "WebSite",
    );
    const alternate = path.includes("about") ? "about/" : "";
    assert.match(
      html,
      new RegExp(
        `hreflang="en"\\s+href="https://lithuaniabtc.com/en/${alternate}"`,
      ),
    );
    assert.match(
      html,
      new RegExp(
        `hreflang="lt"\\s+href="https://lithuaniabtc.com/${alternate}"`,
      ),
    );
    if (path.includes("about")) {
      assert.match(html, /<h1>/);
      assert.equal((html.match(/<h2>/g) || []).length, 6);
      assert.ok(!html.includes('src="atlas-app.js"'));
      const community = JSON.parse(
        html.match(
          /<script type="application\/json" id="community-config">(.*?)<\/script>/s,
        )[1],
      );
      assert.deepEqual(
        community.initiatives.map((i) => i.id),
        ["meetups", "walks"],
      );
    }
    assert.ok(
      get("sitemap.xml").includes(`https://lithuaniabtc.com/${path}</loc>`),
    );
  });
}
test("About pages are available in the offline shell", () => {
  assert.ok(get("sw.js").includes('"/about/"'));
  assert.ok(get("sw.js").includes('"/en/about/"'));
});
test("About uses the shared header and four complete mobile links", () => {
  for (const path of ["about/", "en/about/"]) {
    const html = get(path + "index.html");
    const nav = html.match(/<nav class="mobile-bottom-nav"[\s\S]*?<\/nav>/)[0];
    assert.equal((nav.match(/<a\b/g) || []).length, 4);
    assert.equal((nav.match(/<\/a\s*>/g) || []).length, 4);
    assert.ok(!nav.includes("<button"));
    assert.match(nav, /folk-icon folk-meetup/);
    for (const id of ["socials", "add-place", "appearance", "language"])
      assert.ok(html.includes(`id="${id}"`));
    assert.ok(!html.includes('id="about-theme"'));
  }
});
test("Home pages carry one H1 and a crawlable event list before JavaScript", () => {
  for (const [path, heading] of [
    ["", "Bitcoin vietos ir renginiai Lietuvoje"],
    ["en/", "Bitcoin map and events in Lithuania"],
  ]) {
    const html = get(path + "index.html");
    assert.deepEqual(
      [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]),
      [heading],
    );
    const list = html.match(/<div id="event-list"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/aside>/)[1];
    assert.ok((list.match(/class="event-card/g) || []).length >= 3);
  }
});
