// Editable Atlas cards. Serve designs/ locally, capture at 1200 × 630 as JPEG.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const data = async (path, mime) =>
  `data:${mime};base64,${(await readFile(new URL("../" + path, import.meta.url))).toString("base64")}`;
const geo = JSON.parse(
  await readFile(new URL("../data/lithuania.geojson", import.meta.url), "utf8"),
);
const rings =
  geo.geometry.type === "Polygon"
    ? geo.geometry.coordinates
    : geo.geometry.coordinates.flat();
const xy = ([lon, lat]) => [
  710 + (lon - 20.85) * 67,
  435 - (lat - 53.88) * 112,
];
const path = rings
  .map(
    (r) =>
      r
        .map(
          (p, i) =>
            (i ? "L" : "M") +
            xy(p)
              .map((v) => v.toFixed(1))
              .join(" "),
        )
        .join(" ") + "Z",
  )
  .join(" ");
const logo = await data("assets/logo.png", "image/png"),
  serif = await data("assets/PlexSerif.woff2", "font/woff2"),
  sans = await data("assets/PlexSans.woff2", "font/woff2"),
  folk = await data("assets/folk-diamond.svg", "image/svg+xml");
await mkdir(new URL("../designs/", import.meta.url), { recursive: true });
for (const lang of ["lt", "en"]) {
  const lt = lang === "lt";
  const markers = [
    [25.28, 54.69],
    [23.9, 54.9],
    [21.14, 55.71],
  ]
    .map((p) => {
      const [x, y] = xy(p);
      return `<circle cx="${x}" cy="${y}" r="12" fill="#bb453c" stroke="#f1ead6" stroke-width="4"/>`;
    })
    .join("");
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>Atlas share card ${lang}</title><style>
@font-face{font-family:PlexSerif;src:url('${serif}')}@font-face{font-family:Plex;src:url('${sans}')}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#123c30;color:#f1ead6;font-family:Plex,sans-serif;overflow:hidden}.eyebrow{position:absolute;top:55px;left:60px;font-size:19px;letter-spacing:3px;text-transform:uppercase}.logo{position:absolute;left:60px;top:112px;width:76px;height:92px;object-fit:contain}h1{position:absolute;left:155px;top:101px;margin:0;font-family:PlexSerif,serif;font-size:91px;font-weight:400;line-height:1.08;letter-spacing:-3px}h1 span{display:block;color:#dfb355}p{position:absolute;left:62px;top:357px;width:590px;margin:0;font-size:31px;line-height:1.35}.map{position:absolute;inset:0}.map-label{position:absolute;left:750px;top:466px;font-size:15px;letter-spacing:3px;color:#c1c4ad}.rule{position:absolute;left:60px;right:60px;top:534px;border-top:1px solid #648071}footer{position:absolute;left:60px;right:60px;top:563px;display:flex;justify-content:space-between;font-size:20px}.ornament{width:112px;height:20px;background:#f1ead6;mask:url('${folk}') left center/20px 20px repeat-x;opacity:.7}
</style><svg class="map" width="1200" height="630" viewBox="0 0 1200 630" aria-hidden="true"><path d="${path}" fill="#f1ead6" fill-rule="evenodd"/>${markers}</svg><div class="eyebrow">${lt ? "Bitcoin Lietuvoje" : "Bitcoin in Lithuania"}</div><img class="logo" src="${logo}" alt=""><h1>Lithuania<span>BTC</span></h1><p>${lt ? "Atrask Bitcoin priimančias vietas<br>ir bendruomenės renginius." : "Find Bitcoin-friendly places<br>and community events."}</p><div class="map-label">${lt ? "LIETUVA" : "LITHUANIA"}</div><div class="rule"></div><footer><span>lithuaniabtc.com${lt ? "" : "/en/"}</span><span class="ornament"></span></footer></html>`;
  await writeFile(
    new URL(`../designs/share-atlas-${lang}.html`, import.meta.url),
    html,
  );
}
