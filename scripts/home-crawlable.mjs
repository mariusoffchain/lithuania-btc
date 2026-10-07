// Server-rendered first paint for crawlers and visitors without JavaScript.
// atlas-app.js replaces the event list as soon as its own data has loaded.
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function swap(html, from, to) {
  if (!html.includes(from)) throw Error("Home markup not found: " + from);
  return html.replace(from, to);
}

export function crawlableHome(html, { heading, events, lang, timezone, countries }) {
  const locale = lang === "lt" ? "lt-LT" : "en-GB";
  const fmt = (d, opts) =>
    new Intl.DateTimeFormat(locale, { timeZone: timezone, ...opts }).format(
      new Date(d),
    );
  const now = new Date();
  const planned = events.filter((e) => e.status === "planned");
  const dated = events.filter((e) => e.status !== "planned" && e.start);
  const upcoming = dated
    .filter((e) => new Date(e.end || e.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const past = dated
    .filter((e) => new Date(e.end || e.start) < now)
    .sort((a, b) => new Date(b.start) - new Date(a.start));
  const country = (code) => countries?.find((c) => c.code === code)?.name;
  const card = (e) => {
    const title = esc(e.title[lang] || e.title.en);
    if (e.status === "planned")
      return `<div class="event-card planned-event"><div class="date-badge pending-date" aria-hidden="true"></div><div class="event-copy"><h3>${title}</h3><p>${lang === "lt" ? "Data bus paskelbta" : "Date to be announced"}</p></div></div>`;
    const place = [e.venue, country(e.country)].filter(Boolean).map(esc).join(", ");
    return `<div class="event-card"><div class="date-badge"><strong>${fmt(e.start, { day: "2-digit" })}</strong><span>${fmt(e.start, { month: lang === "lt" ? "long" : "short" })}</span></div><div class="event-copy"><h3>${title}</h3><p>${fmt(e.start, { hour: "2-digit", minute: "2-digit" })} · ${place}</p><p>${fmt(e.start, { year: "numeric" })}</p></div></div>`;
  };
  const list =
    `<section class="upcoming-events"><h3 class="list-heading">${lang === "lt" ? "Artimiausi renginiai" : "Upcoming events"}</h3>${[...upcoming, ...planned].map(card).join("")}</section>` +
    (past.length
      ? `<section class="past-events"><h3 class="list-heading">${lang === "lt" ? "Praėję renginiai" : "Past events"}</h3><div class="past-events-track">${past.map(card).join("")}</div></section>`
      : "");
  html = swap(
    html,
    '<main class="workspace">',
    `<main class="workspace"><h1 id="page-heading" class="sr-only">${esc(heading)}</h1>`,
  );
  return swap(
    html,
    '<div id="event-list" class="event-list" aria-live="polite"></div>',
    `<div id="event-list" class="event-list" aria-live="polite">${list}</div>`,
  );
}
