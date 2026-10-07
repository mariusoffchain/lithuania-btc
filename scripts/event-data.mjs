// Shared by every site that publishes event pages: one dated event, one page, one Event record.
// Planned events without a date stay in the lists only; search engines cannot show them as events.
export const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export const hasEventPage = (e) => e.status !== "planned" && Boolean(e.start);

export function eventSlug(e) {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(e.id))
    throw Error("Event id cannot be used as a URL path: " + e.id);
  return e.id;
}

const COUNTRY_NAMES = {
  en: { EE: "Estonia", LV: "Latvia", LT: "Lithuania" },
  lt: { EE: "Estija", LV: "Latvija", LT: "Lietuva" },
};
const LABELS = {
  en: { eventPage: "Event page", website: "Event website", source: "Source" },
  lt: {
    eventPage: "Renginio puslapis",
    website: "Renginio svetainė",
    source: "Šaltinis",
  },
};

const safeURL = (url) => {
  try {
    const u = new URL(url);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
};

const dayKey = (d, timeZone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));

// "Vytenio g. 50D, Vilnius" gives a street and a locality; a city alone has no street,
// and "Kablys, Vilnius" names the venue rather than a street.
function splitAddress(e) {
  const parts = String(e.address || e.venue || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const locality = parts.pop() || null;
  let street = parts.join(", ") || null;
  if (street && e.venue?.startsWith(street)) street = null;
  return { street, locality };
}

// Everything a page or a schema needs, formatted once in the page language.
export function eventFacts(
  e,
  {
    lang = "en",
    timezone = "Europe/Vilnius",
    defaultCountry,
    imageBase = "/",
  } = {},
) {
  const locale = lang === "lt" ? "lt-LT" : "en-GB";
  const L = LABELS[lang] || LABELS.en;
  const fmt = (d, o) =>
    new Intl.DateTimeFormat(locale, { timeZone: timezone, ...o }).format(
      new Date(d),
    );
  const end = e.end || e.start;
  const multiDay = dayKey(e.start, timezone) !== dayKey(end, timezone);
  const long = { day: "numeric", month: "long", year: "numeric" };
  const shortDate = multiDay
    ? new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        ...long,
      }).formatRange(new Date(e.start), new Date(end))
    : fmt(e.start, long);
  const hm = { hour: "2-digit", minute: "2-digit" };
  const time =
    e.dateOnly || multiDay
      ? null
      : fmt(e.start, hm) +
        (e.end ? (lang === "lt" ? "-" : "–") + fmt(e.end, hm) : "");
  const { street, locality } = splitAddress(e);
  const country = e.country || defaultCountry || null;
  const title = e.title[lang] || e.title.en;
  const description = e.description?.[lang] || e.description?.en || "";
  const place = [e.venue, locality]
    .filter((p, i, all) => p && (i === 0 || !all[0]?.includes(p)))
    .join(", ");
  const links = [];
  const add = (name, url) => {
    const href = safeURL(url);
    if (href && !links.some((l) => l.url === href))
      links.push({ name, url: href });
  };
  add(L.website, e.website);
  add(
    safeURL(e.url) && new URL(e.url).hostname.endsWith("meetup.com")
      ? "Meetup"
      : L.eventPage,
    e.url,
  );
  for (const l of e.links || []) add(l.name, l.url);
  const sources = (e.sources || []).filter(
    (s) => safeURL(s) && !links.some((l) => l.url === safeURL(s)),
  );
  sources.forEach((s, i) =>
    add(sources.length > 1 ? `${L.source} ${i + 1}` : L.source, s),
  );
  const src = e.image?.src;
  const image =
    src &&
    /^[a-z0-9][a-z0-9/._-]*\.(webp|jpe?g|png)$/i.test(src) &&
    !src.includes("..")
      ? {
          src: imageBase + src,
          width: e.image.width,
          height: e.image.height,
          source: safeURL(e.image.source),
        }
      : null;
  return {
    id: eventSlug(e),
    title,
    description,
    shortDate,
    date: multiDay ? shortDate : fmt(e.start, { dateStyle: "full" }),
    time,
    startDay: dayKey(e.start, timezone),
    venue: e.venue || null,
    venueWebsite: safeURL(e.venueWebsite),
    address: e.address && e.address !== e.venue ? e.address : null,
    street,
    locality,
    country,
    countryName: COUNTRY_NAMES[lang]?.[country] || null,
    mapURL:
      safeURL(e.locationSource) ||
      (!e.addressUncertain && street
        ? "https://www.openstreetmap.org/search?query=" +
          encodeURIComponent(e.address)
        : null),
    links,
    checked: e.sourceVerifiedAt ? fmt(e.sourceVerifiedAt, long) : null,
    image,
    metaDescription:
      [shortDate, place].filter(Boolean).join(", ") + ". " + description,
  };
}

// schema.org Event as Google documents it. Only facts present in the data are published:
// no invented prices, performers or availability.
export function eventSchema(
  e,
  {
    url,
    origin,
    lang = "en",
    timezone = "Europe/Vilnius",
    defaultCountry,
    organiser,
    imageBase,
  },
) {
  const f = eventFacts(e, { lang, timezone, defaultCountry, imageBase });
  const day = (d) => dayKey(d, timezone);
  const precise =
    Number.isFinite(e.lat) &&
    Number.isFinite(e.lon) &&
    e.locationPrecision !== "city" &&
    !e.addressUncertain;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": url + "#event",
    name: f.title,
    description: f.description || undefined,
    url,
    inLanguage: lang,
    startDate: e.dateOnly ? day(e.start) : e.start,
    endDate: e.end ? (e.dateOnly ? day(e.end) : e.end) : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: f.venue || f.locality || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: f.street || undefined,
        addressLocality: f.locality || undefined,
        addressCountry: f.country || undefined,
      },
      geo: precise
        ? { "@type": "GeoCoordinates", latitude: e.lat, longitude: e.lon }
        : undefined,
    },
    image: f.image ? [origin + f.image.src] : undefined,
    organizer: organiser?.name
      ? {
          "@type": "Organization",
          name: organiser.name,
          url: safeURL(organiser.url) || undefined,
        }
      : undefined,
  }).replaceAll("<", "\\u003c");
}
