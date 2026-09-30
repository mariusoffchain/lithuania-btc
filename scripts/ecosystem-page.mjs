import { aboutPage } from "./about-page.mjs";
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export function ecosystemPage({
  homeHTML,
  lang,
  origin,
  name,
  repository,
  site,
  events,
}) {
  const en = lang === "en",
    home = en ? "/en/" : "/",
    route = home + "ecosystem/";
  const copy = {
    title: en
      ? "Bitcoin ecosystem in Lithuania | Lithuania BTC"
      : "Bitcoin ekosistema Lietuvoje | Lithuania BTC",
    description: en
      ? "Explore Bitcoin communities, companies and conferences in Lithuania."
      : "Bitcoin bendruomenės, įmonės ir konferencijos Lietuvoje.",
    aboutLabel: en ? "Ecosystem" : "Ekosistema",
    heading: en ? "Bitcoin in Lithuania" : "Bitcoin Lietuvoje",
    intro: en
      ? "Meet the communities, builders and organisers behind Bitcoin in Lithuania."
      : "Susipažinkite su Bitcoin bendruomenėmis, kūrėjais ir renginių organizatoriais Lietuvoje.",
    sections: [],
    contributeHeading: "",
    contributeText: "",
    backLabel: en ? "Back to map" : "Grįžti į žemėlapį",
  };
  const groups = [
    ["communities", en ? "Communities" : "Bendruomenės"],
    ["companies", en ? "Companies" : "Įmonės"],
    [
      "conferences",
      en ? "Conferences and initiatives" : "Konferencijos ir iniciatyvos",
    ],
  ];
  const entries = [
    {
      id: "meetups",
      group: "communities",
      name: "Bitcoin Lithuania Meetup",
      description: en
        ? "Bitcoin meetups in Vilnius. Conversations, talks and new connections."
        : "Bitcoin bendruomenės susitikimai Vilniuje. Pokalbiai, pristatymai ir pažintys.",
      links: site.initiatives
        .find((x) => x.id === "meetups")
        .links.filter((x) => x.kind !== "event"),
    },
    {
      id: "walks",
      group: "communities",
      name: "BitcoinWalk Vilnius",
      description: en
        ? "Walks around Vilnius and conversations about Bitcoin."
        : "Pasivaikščiojimai Vilniuje ir pokalbiai apie Bitcoin.",
      links: site.initiatives
        .find((x) => x.id === "walks")
        .links.filter((x) => x.kind !== "event"),
    },
    {
      id: "bringin",
      group: "companies",
      name: "Bringin",
      description: en
        ? "Bitcoin-to-euro services, Lightning and payments. A company registered in Lithuania."
        : "Bitcoin ir eurų keitimo bei mokėjimų paslaugos. Lietuvoje registruota įmonė.",
      links: [{ name: "Bringin", url: "https://bringin.app/" }],
    },
    {
      id: "wavespace",
      group: "companies",
      name: "wave.space",
      description: en
        ? "Buy, sell and spend Bitcoin with wavecard. A company registered in Lithuania."
        : "Bitcoin pirkimas, pardavimas ir mokėjimai su „wavecard“. Lietuvoje registruota įmonė.",
      links: [{ name: "wave.space", url: "https://www.wave.space/" }],
    },
    {
      id: "proof",
      group: "conferences",
      name: "PROOF",
      description: en
        ? "A Vilnius conference exploring privacy, sovereignty and Bitcoin."
        : "Konferencija Vilniuje apie privatumą, suverenitetą ir Bitcoin.",
      links: [
        {
          name: en ? "Conference website" : "Konferencijos svetainė",
          url: "https://proofconference.com/",
        },
      ],
    },
  ];
  const eventOwner = (e) =>
    e.type === "conference" ? "proof" : e.type === "walk" ? "walks" : "meetups";
  const cards = entries
    .map((x) => {
      const related = events.filter((e) => eventOwner(e) === x.id);
      return `<article class="ecosystem-card" id="${x.id}" data-category="${x.group}"><p class="about-kicker">${groups.find((g) => g[0] === x.group)[1]}</p><h2>${esc(x.name)}</h2><p>${esc(x.description)}</p><div class="ecosystem-links">${x.links.map((l) => `<a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.name)} ↗</a>`).join("")}</div>${related.length ? `<details><summary>${en ? "Related events" : "Susiję renginiai"} (${related.length})</summary><ul>${related.map((e) => `<li><a href="${home}?event=${encodeURIComponent(e.id)}&view=events">${esc(e.title[lang] || e.title.en)}</a></li>`).join("")}</ul></details>` : ""}</article>`;
    })
    .join("");
  const photos = site.gallery
    .map(
      (p, i) =>
        `<button class="ecosystem-photo" data-photo="${i}" aria-label="${esc(p.alt[lang] || p.alt.en)}"><img loading="lazy" decoding="async" src="/${esc(p.src)}" alt="${esc(p.alt[lang] || p.alt.en)}"></button>`,
    )
    .join("");
  let html = aboutPage({
    homeHTML,
    copy,
    lang,
    origin,
    name,
    repository,
    initiatives: site.initiatives,
  });
  // About links remain About; only this document's metadata gets its own identity.
  html = html
    .replaceAll(origin + "/en/about/", origin + "/en/ecosystem/")
    .replaceAll(origin + "/about/", origin + "/ecosystem/")
    .replace('"@type":"AboutPage"', '"@type":"CollectionPage"')
    .replace('about-page"', 'about-page ecosystem-page"')
    .replaceAll(' aria-current="page"', "");
  html = html.replace(
    /<div class="about-sections">[\s\S]*?<\/main>/,
    `<nav class="ecosystem-filters" aria-label="${en ? "Categories" : "Kategorijos"}"><button data-filter="all" aria-pressed="true">${en ? "All" : "Visi"}</button>${groups.map(([id, label]) => `<button data-filter="${id}" aria-pressed="false">${label}</button>`).join("")}</nav><div class="ecosystem-grid">${cards}</div><section class="ecosystem-photos"><h2>${en ? "Community photos" : "Bendruomenės nuotraukos"}</h2><div class="ecosystem-photo-grid">${photos}</div></section><p>${en ? "Listings do not imply a partnership. Company offices are not necessarily shops accepting Bitcoin." : "Įtraukimas į sąrašą nereiškia partnerystės. Įmonių biurai nebūtinai yra Bitcoin priimančios prekybos vietos."}</p><a href="${home}">${copy.backLabel} →</a></main><dialog id="ecosystem-gallery"><button data-close aria-label="${en ? "Close" : "Uždaryti"}">×</button><img alt=""><p class="photo-caption"></p><div><button data-prev aria-label="${en ? "Previous photo" : "Ankstesnė nuotrauka"}">←</button><span class="photo-count"></span><button data-next aria-label="${en ? "Next photo" : "Kita nuotrauka"}">→</button></div></dialog>`,
  );
  return html.replace(
    "</head>",
    '<link rel="stylesheet" href="/ecosystem.css"><script type="module" src="/ecosystem.js"></script></head>',
  );
}
