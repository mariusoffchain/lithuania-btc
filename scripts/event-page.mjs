// A static page per dated event, built from the site's own About page so it keeps
// the same header, navigation, theme and styles. The map keeps its modal and links here.
import { esc, eventFacts, eventSchema } from "./event-data.mjs";

const LABELS = {
  en: {
    events: "Events",
    venue: "Venue",
    address: "Address",
    country: "Country",
    organiser: "Organiser",
    checked: "Details checked on",
    imageSource: "Image source",
    showMap: "Show on the map",
    allEvents: "All events",
  },
  lt: {
    events: "Renginiai",
    venue: "Vieta",
    address: "Adresas",
    country: "Šalis",
    organiser: "Organizatorius",
    checked: "Informacija patikrinta",
    imageSource: "Vaizdo šaltinis",
    showMap: "Rodyti žemėlapyje",
    allEvents: "Visi renginiai",
  },
};

function replaceOnce(html, pattern, value) {
  if (!pattern.test(html))
    throw Error("Event page template is missing " + pattern);
  return html.replace(pattern, value);
}

export function atlasEventPage({
  template,
  event,
  lang,
  origin,
  name,
  home,
  canonical,
  alternates = {},
  alternatePath,
  organiser,
  timezone,
  defaultCountry,
  showCountry = false,
  structuredData = true,
}) {
  const f = eventFacts(event, { lang, timezone, defaultCountry });
  const L = LABELS[lang];
  const title = `${f.title}, ${f.shortDate} | ${name}`;
  const external = (label, url) =>
    url
      ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
      : esc(label);
  let head = template.slice(0, template.indexOf("</head>"));
  const meta = (keys, value) => {
    head = head.replace(
      new RegExp(
        `(<meta\\s+(?:name|property)="(?:${keys})"\\s+content=")[^"]*`,
        "g",
      ),
      (_, start) => start + esc(value),
    );
  };
  head = replaceOnce(
    head,
    /<title>[^<]*<\/title>/,
    () => `<title>${esc(title)}</title>`,
  );
  meta("description|og:description|twitter:description", f.metaDescription);
  meta("og:title|twitter:title", title);
  meta("og:url", canonical);
  head = replaceOnce(
    head,
    /(<link\s+rel="canonical"\s+href=")[^"]*/,
    "$1" + canonical,
  )
    .replace(
      /<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/g,
      "",
    )
    .replace(/<script type="application\/ld\+json">.*?<\/script>/s, "");
  head +=
    Object.entries(alternates)
      .map(
        ([hl, href]) =>
          `<link rel="alternate" hreflang="${hl}" href="${href}">`,
      )
      .join("") +
    (structuredData
      ? `<script type="application/ld+json">${eventSchema(event, { url: canonical, origin, lang, timezone, defaultCountry, organiser })}</script>`
      : "");
  const facts = [
    [L.venue, f.venue && external(f.venue, f.venueWebsite)],
    [L.address, f.address && external(f.address, f.mapURL)],
    [L.country, showCountry && f.countryName && esc(f.countryName)],
    [L.organiser, organiser?.name && external(organiser.name, organiser.url)],
  ].filter(([, value]) => value);
  const figure = f.image
    ? `<figure class="event-detail-cover"><img src="${esc(f.image.src)}" alt="${esc(f.title)}" width="${f.image.width}" height="${f.image.height}" decoding="async">${f.image.source ? `<figcaption>${external(L.imageSource, f.image.source)}</figcaption>` : ""}</figure>`
    : "";
  const main = `<main class="about-content event-detail"><header class="about-intro"><a class="about-kicker" href="${home}?view=events">${L.events} / ${esc(name)}</a><h1>${esc(f.title)}</h1><p><time datetime="${f.startDay}">${esc(f.date)}</time>${f.time ? ` · ${esc(f.time)}` : ""}</p></header>
<div class="event-detail-body${figure ? " has-artwork" : ""}"><div class="event-detail-copy">${facts.length ? `<dl class="event-facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}${f.description ? `<p class="event-detail-description">${esc(f.description)}</p>` : ""}${f.links.length ? `<p class="event-detail-links">${f.links.map((l) => external(l.name + " ↗", l.url)).join("")}</p>` : ""}${f.checked ? `<p class="event-detail-note">${L.checked} ${esc(f.checked.replace(/\.$/, ""))}.</p>` : ""}</div>${figure}</div>
<footer class="about-contribute"><a href="${home}?event=${encodeURIComponent(f.id)}">${L.showMap} →</a><a href="${home}?view=events">${L.allEvents} →</a></footer></main>`;
  let body = template.slice(template.indexOf("</head>"));
  body = replaceOnce(
    body,
    /<main class="about-content">[\s\S]*?<\/main>/,
    () => main,
  )
    .replace(/(class="(?:desktop|mobile)-about") aria-current="page"/g, "$1")
    .replace(
      /<body class="([^"]*)"/,
      `<body class="$1 event-detail-page"${alternatePath ? ` data-alternate="${alternatePath}"` : ""}`,
    );
  return head + body;
}
