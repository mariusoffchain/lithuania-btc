import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { filterPlaces } from "../domain.js";
import { COUNTRY } from "../country-config.js";

// Read the same sources as the app; never maintain a second event catalogue.
export async function buildLLMs(root, out, site) {
  const json = async (path) =>
    JSON.parse(await readFile(resolve(root, path), "utf8"));
  const events = await json("data/events.json");
  const snapshot = await json("data/merchants-snapshot.json");
  const places = filterPlaces(
    snapshot.places,
    await json(COUNTRY.boundaryPath),
  );
  const origin = COUNTRY.origin;
  const text = (value) => String(value || "").replace(/[\r\n]+/g, " ");
  await mkdir(resolve(out, "read"), { recursive: true });
  const overview = `# ${COUNTRY.name}\n\nBitcoin-accepting places, meetups and walks in Lithuania. The default site is Lithuanian; /en/ is English. All event times use ${COUNTRY.timezone}.\n\n## Navigation\n\n- [Lithuanian map](${origin}/)\n- [English map](${origin}/en/)\n- [Events](${origin}/en/?view=events)\n- [Ecosystem and community photos](${origin}/en/ecosystem/)\n- [Ecosystem](${origin}/en/ecosystem/)\n- [About](${origin}/en/about/)\n- [Open-source repository](${COUNTRY.repository})\n\nOn mobile, use Map, Events, Ecosystem and About in the bottom navigation. On desktop the map and event list share the home page.\n\n## Community links\n\n${(
    site.initiatives || []
  )
    .map(
      (i) =>
        `### ${text(i.name)}\n\n${i.links
          .filter((l) => l.kind !== "event")
          .map((l) => `- [${text(l.name)}](${l.url})`)
          .join("\n")}`,
    )
    .join("\n\n")}\n`;
  const eventText = `# Events\n\nDates below are ISO timestamps with time-zone offsets. Entries marked date to be announced have no confirmed date or venue. For dated entries, compare the end date with the current time to distinguish upcoming and past events.\n\n${events.map((e) => `## ${text(e.title.en)}\n\nLithuanian title: ${text(e.title.lt)}\n\nType: ${text(e.type)}\n\n${e.status === "planned" ? "Date and location to be announced." : `Start: ${e.start}\n\nEnd: ${e.end || e.start}\n\nVenue: ${text(e.venue)}\n\nAddress: ${text(e.address)}${e.addressUncertain ? " (not confirmed)" : ""}`}\n\n${text(e.description.en)}\n\n${text(e.description.lt)}\n\n[Event details](${origin}/en/?event=${encodeURIComponent(e.id)})${e.website ? `\n\n[Event website](${e.website})` : ""}`).join("\n\n")}\n`;
  const merchantText = `# Bitcoin-accepting places in Lithuania\n\nSaved BTC Map snapshot fetched at ${snapshot.fetchedAt}. This is not a live inventory; check BTC Map and the merchant before travelling. The interactive site attempts to load newer data. Only places within the country boundary are included below.\n\nSources and attribution: [BTC Map](https://btcmap.org/), [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).\n\n${places.map((p) => `## ${text(p.name) || "Unnamed place"}\n\nAddress: ${text(p.address) || "Not supplied"}\n\nCoordinates: ${p.lat}, ${p.lon}\n\n[BTC Map entry](https://btcmap.org/merchant/${encodeURIComponent(p.osm_id || p.id)})`).join("\n\n")}\n`;
  for (const [name, content] of [
    ["overview", overview],
    ["events", eventText],
    ["merchants", merchantText],
  ])
    await writeFile(resolve(out, `read/${name}.md`), content);
  await writeFile(
    resolve(out, "llms.txt"),
    `# ${COUNTRY.name}\n\n> A community map of Bitcoin-accepting places, meetups and walks in Lithuania, available in Lithuanian and English.\n\nEvent dates may be unconfirmed. Merchant records are a dated snapshot, not a guarantee of current acceptance. Follow source links for verification. This file is a reading guide, not a grant of additional rights over third-party content.\n\n## Text resources\n\n- [Overview and community links](${origin}/read/overview.md)\n- [Events in English and Lithuanian](${origin}/read/events.md)\n- [Merchant snapshot and attribution](${origin}/read/merchants.md)\n\n## Website\n\n- [Lithuanian home](${origin}/)\n- [English home](${origin}/en/)\n- [Ecosystem](${origin}/en/ecosystem/)\n- [About](${origin}/en/about/)\n- [Sitemap](${origin}/sitemap.xml)\n`,
  );
}
