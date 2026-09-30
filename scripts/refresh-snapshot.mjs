import { COUNTRY as DEFAULT_COUNTRY } from "../country-config.js";
import { writeFile, readFile } from "node:fs/promises";
import { filterPlaces } from "../domain.js";
const regional = process.env.SITE_PROFILE === "baltics";
const COUNTRY = regional
  ? JSON.parse(
      await readFile(
        new URL("../profiles/baltics/config.json", import.meta.url),
      ),
    )
  : DEFAULT_COUNTRY;
const API = COUNTRY.merchantsURL;
const response = await fetch(API, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw Error(`BTC Map HTTP ${response.status}`);
const places = await response.json();
const boundary = JSON.parse(
  await readFile(
    new URL(
      regional
        ? "../profiles/baltics/boundary.geojson"
        : "../" + COUNTRY.boundaryPath,
      import.meta.url,
    ),
  ),
);
const filtered = filterPlaces(places, boundary);
if (!filtered.length)
  throw Error("No matching places; existing snapshot preserved");
await writeFile(
  new URL(
    regional
      ? "../profiles/baltics/merchants-snapshot.json"
      : "../data/merchants-snapshot.json",
    import.meta.url,
  ),
  JSON.stringify(
    { fetchedAt: new Date().toISOString(), source: API, places: filtered },
    null,
    2,
  ) + "\n",
);
console.log(
  `${filtered.length} places saved; update fixture count in test if legitimate changes occur.`,
);
