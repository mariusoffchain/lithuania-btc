import { COUNTRY } from "../country-config.js";
import { writeFile, readFile } from "node:fs/promises";
import { API, filterPlaces } from "../domain.js";
const response = await fetch(API, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw Error(`BTC Map HTTP ${response.status}`);
const places = await response.json();
const boundary = JSON.parse(
  await readFile(new URL("../" + COUNTRY.boundaryPath, import.meta.url)),
);
const filtered = filterPlaces(places, boundary);
if (!filtered.length)
  throw Error("No matching places; existing snapshot preserved");
await writeFile(
  new URL("../data/merchants-snapshot.json", import.meta.url),
  JSON.stringify(
    { fetchedAt: new Date().toISOString(), source: API, places: filtered },
    null,
    2,
  ) + "\n",
);
console.log(
  `${filtered.length} places saved; update fixture count in test if legitimate changes occur.`,
);
