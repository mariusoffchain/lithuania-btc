// Build the approved Atlas only; keep design sources and historical prototypes private.
import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { COUNTRY } from "../country-config.js";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, process.argv[2] || "public-build");
if (out === root) throw Error("Output must be a separate directory");
const origin = COUNTRY.origin;
await mkdir(out, { recursive: true });
const files = [
  "country-config.js",
  "manifest.webmanifest",
  "pwa.js",
  "atlas-app.js",
  "domain.js",
  "site.css",
  "templates.css",
  "atlas-editions.css",
  "navigation.css",
  "LICENSE",
  "vendor/maplibre-gl.js",
  "vendor/maplibre-gl.css",
  "vendor/maplibre-LICENSE.txt",
  "data/events.json",
  "data/site.json",
  COUNTRY.boundaryPath,
  "data/map-style.json",
  "data/map-light.json",
  "data/merchants-snapshot.json",
];
const assets = (await readdir(resolve(root, "assets"))).filter(
  (n) =>
    /\.(svg|woff2)$/.test(n) ||
    [
      "logo.png",
      "vytis-cutout.png",
      "share-card.jpg",
      "IBM-Plex-OFL.txt",
      "zolak-provenance.txt",
    ].includes(n),
);
for (const f of [...files, ...assets.map((n) => "assets/" + n)]) {
  await mkdir(dirname(resolve(out, f)), { recursive: true });
  await copyFile(resolve(root, f), resolve(out, f));
}
const site = JSON.parse(
  await readFile(resolve(root, "data/site.json"), "utf8"),
);
for (const photo of site.gallery || []) {
  if (!/^assets\/events\/[a-zA-Z0-9._-]+$/.test(photo.src))
    throw Error("Invalid gallery path");
  await mkdir(dirname(resolve(out, photo.src)), { recursive: true });
  await copyFile(resolve(root, photo.src), resolve(out, photo.src));
}
await copyFile(
  resolve(root, "assets/events/provenance.txt"),
  resolve(out, "assets/events/provenance.txt"),
);
const template = (await readFile(resolve(root, "atlas.html"), "utf8")).replace(
  "</head>",
  '<link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/assets/logo.png"><meta name="apple-mobile-web-app-title" content="Lithuania BTC"><script defer src="/pwa.js"></script></head>',
);
for (const lang of ["", "lt", "en"]) {
  const en = lang === "en",
    path = en ? "/en/" : "/";
  const description = en
    ? "Find places accepting Bitcoin in Lithuania, community meetups and Bitcoin walks."
    : "Bitcoin priimančios vietos Lietuvoje, bendruomenės susitikimai ir pasivaikščiojimai.";
  let html = template
    .replace("<head>", '<head><base href="/">')
    .replace(
      '<html lang="lt">',
      `<html lang="${en ? "en" : "lt"}" data-language="${en ? "en" : "lt"}">`,
    );
  html = html
    .replace(
      /(<meta (?:name="description"|property="og:description") content=")[^"]*/,
      `$1${description}`,
    )
    .replace(
      /(<meta property="og:description" content=")[^"]*/,
      `$1${description}`,
    )
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${origin + path}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${origin + path}`)
    .replace(
      'property="og:locale" content="lt_LT"',
      `property="og:locale" content="${en ? "en_GB" : "lt_LT"}"`,
    )
    .replace(
      'property="og:locale:alternate" content="en_GB"',
      `property="og:locale:alternate" content="${en ? "lt_LT" : "en_GB"}"`,
    );
  html = html
    .replaceAll("https://lithuaniabtc.com", origin)
    .replaceAll("Lithuania BTC", COUNTRY.name);
  // Formatting-independent metadata update.
  const meta = (key, value) => {
    html = html.replace(
      new RegExp(
        '(<meta\\s+(?:name|property)="' + key + '"\\s+content=")[^"]*',
        "g",
      ),
      "$1" + value,
    );
  };
  meta("description", description);
  meta("og:description", description);
  meta("og:url", origin + path);
  meta("og:locale", en ? "en_GB" : "lt_LT");
  meta("og:locale:alternate", en ? "lt_LT" : "en_GB");
  // Deliver translated initial labels even before the application runs.
  if (en)
    html = html
      .replaceAll(">Pridėti vietą<", ">Add a place<")
      .replaceAll(">Pasivaikščiojimai<", ">Walks<")
      .replaceAll(">Priima Bitcoin<", ">Accepting Bitcoin<")
      .replaceAll(">Susitikimai<", ">Meetups<")
      .replace(
        "Kad būtų rodomas žemėlapis ir renginiai, naršyklėje įjunk „JavaScript“.",
        "Enable JavaScript to display the map and events.",
      )
      .replace(">Atverti „BTC Map“<", ">Open BTC Map<");
  await mkdir(resolve(out, lang), { recursive: true });
  await writeFile(resolve(out, lang, "index.html"), html);
}
await writeFile(
  resolve(out, "robots.txt"),
  `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
);
await writeFile(
  resolve(out, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/en/"].map((p) => `<url><loc>${origin + p}</loc></url>`).join("")}</urlset>\n`,
);
const manifest = JSON.parse(
  await readFile(resolve(root, "manifest.webmanifest"), "utf8"),
);
manifest.name = COUNTRY.name;
manifest.short_name = COUNTRY.name;
await writeFile(
  resolve(out, "manifest.webmanifest"),
  JSON.stringify(manifest, null, 2),
);
await copyFile(resolve(root, "_headers"), resolve(out, "_headers"));
console.log(`Atlas release prepared: ${out}`);

// Version the offline shell from its content, including data and generated pages.
const precache = [
  "/",
  "/en/",
  "/lt/",
  ...files.filter((f) => f !== "LICENSE").map((f) => "/" + f),
  ...assets.map((f) => "/assets/" + f),
  ...(site.gallery || []).map((p) => "/" + p.src),
];
const hash = createHash("sha256");
for (const url of precache)
  hash.update(
    await readFile(
      resolve(out, url.slice(1) + (url.endsWith("/") ? "index.html" : "")),
    ),
  );
const worker = await readFile(resolve(root, "sw-template.js"), "utf8");
hash.update(worker);
const version = hash.digest("hex").slice(0, 16);
await writeFile(
  resolve(out, "sw.js"),
  worker
    .replace("__VERSION__", version)
    .replace("__PRECACHE__", JSON.stringify(precache)),
);
