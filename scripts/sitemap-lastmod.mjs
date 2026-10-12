// Add <lastmod> to the built sitemap. A page's date changes only when its built HTML changes,
// so search engines can trust it. Dates and content hashes live in sitemap-lastmod.json,
// which is committed after each release build.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!process.argv[2])
  throw Error("Usage: node scripts/sitemap-lastmod.mjs <build directory>");
const out = resolve(root, process.argv[2]);
const store = resolve(root, "sitemap-lastmod.json");
const sitemapPath = resolve(out, "sitemap.xml");

const seeded = existsSync(store);
const known = seeded ? JSON.parse(readFileSync(store, "utf8")) : {};
// First run: date existing pages from the last commit rather than from today.
const today = seeded
  ? new Date().toISOString().slice(0, 10)
  : execFileSync("git", ["log", "-1", "--format=%cs"], {
      cwd: root,
      encoding: "utf8",
    }).trim();

const next = {};
const sitemap = readFileSync(sitemapPath, "utf8").replace(
  /<url><loc>([^<]+)<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?<\/url>/g,
  (_, loc) => {
    const path = new URL(loc).pathname;
    const file = resolve(
      out,
      "." + path + (path.endsWith("/") ? "index.html" : ""),
    );
    if (!file.startsWith(out) || !existsSync(file))
      throw Error(`No built page for ${loc}`);
    const sha256 = createHash("sha256")
      .update(readFileSync(file))
      .digest("hex");
    const lastmod = known[loc]?.sha256 === sha256 ? known[loc].lastmod : today;
    next[loc] = { sha256, lastmod };
    return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  },
);
if (!Object.keys(next).length)
  throw Error("No <url> entries found in sitemap.xml");
writeFileSync(sitemapPath, sitemap);
writeFileSync(store, JSON.stringify(next, null, 2) + "\n");
console.log(`Sitemap lastmod: ${Object.keys(next).length} URLs`);
