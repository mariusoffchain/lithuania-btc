import { COUNTRY } from "./country-config.js";
import {
  API,
  filterPlaces,
  dateKey,
  eventGroups,
  safeURL,
  ics,
} from "./domain.js";
const $ = (s) => document.querySelector(s);
const TXT = {
  en: {
    search: "Search a place…",
    lithuania: "Lithuania",
    merchants: "Accepting Bitcoin",
    events: "Events",
    calendar: "Meetups",
    timezone: "Vilnius time",
    addPlace: "Add a place",
    refresh: "Refresh",
    loading: "Loading BTC Map…",
    cached: "Saved data",
    live: "BTC Map",
    offline: "BTC Map is unavailable. Saved data shown.",
    noData: "Unable to load places. Please retry.",
    noUpcoming: "The next event has not been announced yet.",
    noEvents: "No events on this date.",
    recent: "Recent meetups",
    noMatch: "No matching places",
    pastEvent: "Past event",
    upcomingEvent: "Upcoming event",
    viewMap: "Show on map",
    addCalendar: "Add to calendar",
    eventPage: "Community page",
    verified: "Last verified",
    unverified: "No verification date",
    website: "Website",
    hours: "Opening hours",
    btcmap: "View on BTC Map",
    acceptance: "Listed on BTC Map. Confirm payment options with the venue.",
    mapUnavailable:
      "The basemap could not load. Check your connection and reload.",
    socialPending: "Community link not yet available",
    results: "Matching places",
    about: "Lithuania BTC community",
    retryMap: "Reload map",
    confSite: "Conference website",
    eventWebsite: "Event website",
    eventLinksHeading: "Event links",
    meetupEvent: "Meetup event",
    eventPageLabel: "Event page",
    walksHeading: "Walks",
    meetupsHeading: "Meetups",
    openLocation: "Open location (new window)",
  },
  lt: {
    search: "Ieškoti vietos...",
    lithuania: "Lietuva",
    merchants: "Priima Bitcoin",
    events: "Renginiai",
    calendar: "Susitikimai",
    timezone: "Lietuvos laiku",
    addPlace: "Pridėti vietą",
    refresh: "Atnaujinti",
    loading: "Įkeliami BTC Map duomenys...",
    cached: "Išsaugoti duomenys",
    live: "BTC Map",
    offline: "BTC Map nepasiekiamas. Rodomi išsaugoti duomenys.",
    noData: "Vietų įkelti nepavyko. Bandyk dar kartą.",
    noUpcoming: "Kitas renginys dar nepaskelbtas.",
    noEvents: "Šią dieną renginių nėra.",
    recent: "Ankstesni susitikimai",
    noMatch: "Vietų nerasta",
    pastEvent: "Praėjęs renginys",
    upcomingEvent: "Artėjantis renginys",
    viewMap: "Rodyti žemėlapyje",
    addCalendar: "Įtraukti į kalendorių",
    eventPage: "Bendruomenės puslapis",
    verified: "Paskutinį kartą patikrinta",
    unverified: "Patikrinimo data nenurodyta",
    website: "Svetainė",
    hours: "Darbo laikas",
    btcmap: "Atverti BTC Map",
    acceptance:
      "Vieta įtraukta į BTC Map. Dėl atsiskaitymo pasiteirauk vietoje.",
    mapUnavailable:
      "Žemėlapio pagrindo įkelti nepavyko. Patikrink ryšį ir įkelk puslapį iš naujo.",
    socialPending: "Bendruomenės nuoroda dar nepateikta",
    results: "Rastos vietos",
    about: "Lithuania BTC bendruomenė",
    retryMap: "Įkelti žemėlapį iš naujo",
    confSite: "Konferencijos svetainė",
    eventWebsite: "Renginio svetainė",
    eventLinksHeading: "Renginio nuorodos",
    meetupEvent: "Renginio puslapis „Meetup“",
    eventPageLabel: "Renginio puslapis",
    walksHeading: "Pasivaikščiojimai",
    meetupsHeading: "Susitikimai",
    openLocation: "Atverti vietą (naujame lange)",
  },
};
let lang = "lt";
try {
  const urlLang = new URLSearchParams(location.search).get("lang");
  lang =
    urlLang === "lt" || urlLang === "en"
      ? urlLang
      : document.documentElement.dataset.language ||
        localStorage.getItem("lt-btc-language") ||
        ((navigator.language || "").startsWith("lt") ? "lt" : "en");
} catch {}
if (!TXT[lang]) lang = "lt";
const t = (k) => TXT[lang][k] || k;
const isDark = () => document.body.classList.contains("mode-dark");
const mapStylePath = (dark) =>
  dark ? "./data/map-style.json" : "./data/map-light.json";
function folkIcon(kind) {
  const n = document.createElement("span");
  n.className = "folk-icon folk-" + kind;
  n.setAttribute("aria-hidden", "true");
  return n;
}
function renderAppearance() {
  const b = $("#appearance");
  b.replaceChildren(folkIcon(isDark() ? "sun" : "moon"));
  b.setAttribute(
    "aria-label",
    lang === "lt"
      ? isDark()
        ? "Šviesus režimas"
        : "Tamsus režimas"
      : isDark()
        ? "Switch to light mode"
        : "Switch to dark mode",
  );
  b.title = b.getAttribute("aria-label");
}
const placeName = (p) =>
  !p.name || p.name === "Unnamed"
    ? lang === "lt"
      ? "Vieta be pavadinimo"
      : "Unnamed place"
    : p.name;
const locale = () => (lang === "lt" ? "lt-LT" : "en-GB");
const fmt = (d, opts) =>
  new Intl.DateTimeFormat(locale(), {
    timeZone: COUNTRY.timezone,
    ...opts,
  }).format(new Date(d));
const todayKey = dateKey(new Date());
let [year, month] = todayKey.split("-").map(Number);
month--;
let selected = null,
  places = [],
  events = [],
  boundary,
  config = {},
  map,
  loaded = false,
  merchantsVisible = true,
  eventsVisible = true,
  walksVisible = true,
  popup,
  activeEvent = null,
  merchantMarkers = [],
  eventMarkers = [],
  fetchedAt = null,
  dataMode = "loading",
  dataFailed = false,
  requestSerial = 0,
  mapFailure = false;
function updateHomeLink() {
  const url = new URL(location.href);
  url.searchParams.delete("event");
  $(".brand").href = url.pathname + url.search;
}
updateHomeLink();
const dialog = $("#event-dialog");
let downloadURL;
let galleryDialog, galleryImg, galleryCloseBtn;
function galleryAlt(item) {
  return (item.alt && (item.alt[lang] || item.alt.en)) || "";
}
function updateGalleryLabels() {
  if (!galleryDialog) return;
  const label = lang === "lt" ? "Uždaryti" : "Close";
  galleryCloseBtn.textContent = label;
  galleryCloseBtn.setAttribute("aria-label", label);
  galleryDialog.setAttribute(
    "aria-label",
    lang === "lt" ? "Nuotrauka" : "Photo",
  );
}
function ensureGalleryDialog() {
  if (galleryDialog) return galleryDialog;
  galleryDialog = document.createElement("dialog");
  galleryDialog.className = "gallery-dialog";
  galleryCloseBtn = button(
    "",
    () => galleryDialog.close(),
    "gallery-dialog-close",
  );
  galleryImg = document.createElement("img");
  galleryImg.className = "gallery-dialog-img";
  galleryDialog.append(galleryCloseBtn, galleryImg);
  galleryDialog.addEventListener("close", () => {
    galleryImg.removeAttribute("src");
    galleryImg.alt = "";
  });
  document.body.append(galleryDialog);
  updateGalleryLabels();
  return galleryDialog;
}
function openGalleryPhoto(item) {
  ensureGalleryDialog();
  updateGalleryLabels();
  galleryImg.src = item.src;
  galleryImg.alt = galleryAlt(item);
  if (!galleryDialog.open) galleryDialog.showModal();
}
function renderGallery(container) {
  const items = config.gallery || [];
  if (!items.length) return;
  container.append(
    el("h3", "list-heading", lang === "lt" ? "Nuotraukos" : "Photos"),
  );
  const grid = el("div", "gallery-grid");
  items.forEach((item, i) => {
    const alt = galleryAlt(item);
    const b = button("", () => openGalleryPhoto(item), "gallery-thumb");
    b.setAttribute(
      "aria-label",
      alt || (lang === "lt" ? "Nuotrauka" : "Photo") + " " + (i + 1),
    );
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    img.loading = "lazy";
    img.width = 300;
    img.height = 300;
    b.append(img);
    grid.append(b);
  });
  container.append(grid);
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) {
    const parts = String(text).split(/(\bZolak\b)/gi);
    for (const part of parts) {
      if (/^zolak$/i.test(part)) {
        const logo = document.createElement("img");
        logo.src = "assets/zolak-official.svg";
        logo.alt = "";
        logo.className = "zolak-logo";
        n.append(logo);
      }
      n.append(document.createTextNode(part));
    }
  }
  return n;
}
function button(text, fn, cls) {
  const n = el("button", cls, text);
  n.type = "button";
  n.addEventListener("click", fn);
  return n;
}
function link(text, url) {
  const a = el("a", null, text);
  const safe = safeURL(url);
  if (safe) {
    a.href = safe;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
}
const PIN_SVG =
  '<path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>';
const ARROW_SVG = '<path d="M7 17 17 7M9 7h8v8"/>';
function svgIcon(paths, size = 15) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", size);
  s.setAttribute("height", size);
  s.setAttribute("fill", "none");
  s.setAttribute("stroke", "currentColor");
  s.setAttribute("stroke-width", "1.7");
  s.setAttribute("stroke-linecap", "round");
  s.setAttribute("stroke-linejoin", "round");
  s.innerHTML = paths;
  return s;
}
function externalLink(url, ariaLabel) {
  const safe = safeURL(url);
  if (!safe) return null;
  const a = el("a", "address-external-link");
  a.href = safe;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("aria-label", ariaLabel);
  a.append(svgIcon(ARROW_SVG, 14));
  return a;
}
const CITY_ONLY = /^(vilnius|kaunas|klaip[eė]da|[sš]iauliai|panev[eė][zž]ys)$/i;
function meaningfulAddress(address) {
  const v = (address || "").trim();
  return !!v && !CITY_ONLY.test(v);
}
async function json(url, timeout = 15000) {
  const c = new AbortController(),
    timer = setTimeout(() => c.abort(), timeout);
  try {
    const r = await fetch(url, {
      signal: c.signal,
      credentials: "omit",
      cache: "no-cache",
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
function renderSocials() {
  const icons = {
    telegram: '<path d="m3 10 18-7-4 18-6-5-4 3v-6L19 5 9 14Z"/>',
    facebook:
      '<path d="M15 21v-8h3l1-4h-4V7c0-2 1-2 4-2V1h-4c-4 0-5 3-5 6v2H7v4h3v8Z"/>',
    meetup:
      '<path d="m3 18 3-11 3-1 1 9 4-9 3 1-1 10 3-5 2 1-2 6-5 1 1-9-4 9H8L7 10 5 19Z"/>',
    luma: '<path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    walk: '<circle cx="14" cy="4" r="2"/><path d="m8 11 4-4 4 5 4 1M12 7l-2 8-4 6m4-6 5 1 2 5"/>',
  };
  const root = $("#socials");
  root.replaceChildren();
  for (const initiative of config.initiatives || []) {
    const details = el("details", "initiative");
    const summary = el(
      "summary",
      null,
      t(initiative.id === "walks" ? "walksHeading" : "meetupsHeading"),
    );
    summary.prepend(folkIcon(initiative.id === "walks" ? "walk" : "meetup"));
    details.append(summary);
    const panel = el("div", "initiative-panel");
    for (const item of initiative.links) {
      if (!safeURL(item.url)) continue;
      const a = link("", item.url);
      a.className = "initiative-link";
      const icon = el("span", "network-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML =
        '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        (icons[item.icon] || icons.globe) +
        "</svg>";
      const label = item.name;
      a.append(icon, el("span", null, label));
      panel.append(a);
    }
    details.append(panel);
    root.append(details);
    details.addEventListener("pointerenter", () => {
      if (
        !matchMedia("(max-width:760px)").matches &&
        matchMedia("(hover:hover)").matches
      ) {
        root.querySelectorAll("details").forEach((d) => {
          if (d !== details) d.open = false;
        });
        details.open = true;
      }
    });
    details.addEventListener("pointerleave", () => {
      if (
        !matchMedia("(max-width:760px)").matches &&
        matchMedia("(hover:hover)").matches &&
        !details.contains(document.activeElement)
      )
        details.open = false;
    });
    details.addEventListener("toggle", () => {
      if (!matchMedia("(max-width:760px)").matches && details.open)
        root.querySelectorAll("details").forEach((d) => {
          if (d !== details) d.open = false;
        });
    });
    details.addEventListener("focusout", () =>
      queueMicrotask(() => {
        if (
          !matchMedia("(max-width:760px)").matches &&
          !details.contains(document.activeElement)
        )
          details.open = false;
      }),
    );
  }
  $("#add-place").setAttribute("aria-label", t("addPlace"));
  $("#add-place").title = t("addPlace");
}
function localizeMapControls() {
  document
    .querySelector(".maplibregl-canvas")
    ?.setAttribute("aria-label", lang === "lt" ? "Žemėlapis" : "Map");
  const zoomIn = document.querySelector(".maplibregl-ctrl-zoom-in"),
    zoomOut = document.querySelector(".maplibregl-ctrl-zoom-out"),
    attrib = document.querySelector(".maplibregl-ctrl-attrib-button");
  const labels =
    lang === "lt"
      ? { in: "Priartinti", out: "Atitolinti", attrib: "Rodyti šaltinius" }
      : { in: "Zoom in", out: "Zoom out", attrib: "Toggle attribution" };
  if (zoomIn) {
    zoomIn.title = labels.in;
    zoomIn.setAttribute("aria-label", labels.in);
  }
  if (zoomOut) {
    zoomOut.title = labels.out;
    zoomOut.setAttribute("aria-label", labels.out);
  }
  if (attrib) {
    attrib.title = labels.attrib;
    attrib.setAttribute("aria-label", labels.attrib);
  }
}
function renderLabels() {
  renderAppearance();
  $(".nav-links").setAttribute(
    "aria-label",
    lang === "lt" ? "Bendruomenė" : "Community",
  );
  $(".map-pane").setAttribute(
    "aria-label",
    lang === "lt" ? "Bitcoin žemėlapis" : "Bitcoin map",
  );
  $(".calendar-pane").setAttribute("aria-label", t("events"));
  localizeMapControls();
  $("#fit").setAttribute(
    "aria-label",
    lang === "lt" ? "Atkurti Lietuvos vaizdą" : "Reset Lithuania view",
  );
  $("#fit").title = $("#fit").getAttribute("aria-label");
  document.documentElement.lang = lang;
  document.title = COUNTRY.name;
  document.querySelector("meta[name=description]").content =
    lang === "lt"
      ? "Bitcoin priimančios vietos Lietuvoje, bendruomenės susitikimai ir pasivaikščiojimai."
      : "Find places accepting Bitcoin in Lithuania, community meetups and Bitcoin walks.";
  document
    .querySelectorAll("[data-i18n]")
    .forEach((n) => (n.textContent = t(n.dataset.i18n)));
  $("#search").placeholder = t("search");
  $("#search").setAttribute("aria-label", t("search"));
  $("#language").textContent = lang === "lt" ? "EN" : "LT";
  $("#language").setAttribute(
    "aria-label",
    lang === "lt" ? "Switch to English" : "Perjungti į lietuvių kalbą",
  );
  $(".dialog-close").setAttribute(
    "aria-label",
    lang === "lt" ? "Uždaryti" : "Close",
  );
  renderSocials();
  renderCalendar();
  renderSourceLink();
  syncMobileLayout();
  renderStatus();
  renderSearch();
  if (galleryDialog) {
    if (galleryDialog.open) galleryDialog.close();
    updateGalleryLabels();
  }
  if (activeEvent && dialog.open) showEvent(activeEvent);
  if (popup) popup.remove();
  if (loaded) {
    renderMerchantMarkers();
    renderEventMarkers();
  }
  if (mapFailure) showMapError();
}
function renderStatus() {
  const n = $("#data-status");
  n.hidden = !dataFailed;
  if (!dataFailed) {
    n.textContent = "";
    return;
  }
  n.textContent = places.length
    ? t("offline") +
      (fetchedAt ? " · " + fmt(fetchedAt, { dateStyle: "short" }) : "")
    : t("noData");
  n.classList.add("data-warning");
}
function eventCard(e) {
  const b = button("", () => showEvent(e), "event-card");
  const date = el("div", "date-badge");
  date.append(
    el("strong", null, fmt(e.start, { day: "2-digit" })),
    el("span", null, fmt(e.start, { month: lang === "lt" ? "long" : "short" })),
  );
  const copy = el("div", "event-copy");
  copy.append(
    el("h3", null, e.title[lang] || e.title.en),
    el(
      "p",
      null,
      fmt(e.start, { hour: "2-digit", minute: "2-digit" }) + " · " + e.venue,
    ),
    el(
      "p",
      null,
      fmt(e.start, { year: "numeric" }) +
        " · " +
        t(new Date(e.end) < new Date() ? "pastEvent" : "upcomingEvent"),
    ),
  );
  b.append(date, copy);
  return b;
}

function calendarEvents() {
  return selected
    ? events
        .filter((e) => dateKey(e.start) === selected)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
    : eventGroups(events).upcoming;
}
function renderCalendar() {
  const groups = eventGroups(events),
    list = $("#event-list");
  list.replaceChildren();
  const upcoming = el("section", "upcoming-events");
  if (groups.upcoming.length)
    upcoming.append(
      el(
        "h3",
        "list-heading",
        lang === "lt" ? "Artimiausi renginiai" : "Upcoming events",
      ),
      ...groups.upcoming.map(eventCard),
    );
  else upcoming.append(el("p", "empty-state", t("noUpcoming")));
  list.append(upcoming);
  const gallery = el("div");
  gallery.id = "desktop-gallery";
  renderGallery(gallery);
  list.append(gallery);
  const mobileGallery = $("#community-gallery");
  mobileGallery.replaceChildren();
  renderGallery(mobileGallery);
  if (groups.past.length) {
    const past = el("section", "past-events");
    const heading = el(
      "h3",
      "list-heading",
      lang === "lt" ? "Praėję renginiai" : "Past events",
    );
    heading.id = "past-events-heading";
    const track = el("div", "past-events-track");
    track.setAttribute("role", "region");
    track.setAttribute("aria-labelledby", heading.id);
    track.tabIndex = 0;
    track.append(...groups.past.map(eventCard));
    past.append(heading, track);
    list.append(past);
  }
}
function showEvent(e) {
  const pageURL = new URL(location.href);
  pageURL.searchParams.set("event", e.id);
  history.replaceState(null, "", pageURL);
  activeEvent = e;
  const target = $("#event-detail");
  target.replaceChildren();
  const h = el("h2", null, e.title[lang] || e.title.en);
  h.id = "detail-title";
  target.append(
    el(
      "span",
      "badge",
      t(new Date(e.end) < new Date() ? "pastEvent" : "upcomingEvent"),
    ),
    h,
  );
  if (safeURL(e.website)) {
    const site = link(t("eventWebsite"), e.website);
    site.className = "detail-website-link";
    site.append(svgIcon(ARROW_SVG));
    target.append(site);
  }
  const meta = el("div", "detail-meta");
  meta.append(
    el("span", null, fmt(e.start, { dateStyle: "full" })),
    el(
      "span",
      null,
      fmt(e.start, { hour: "2-digit", minute: "2-digit" }) +
        (lang === "lt" ? "-" : "–") +
        fmt(e.end, { hour: "2-digit", minute: "2-digit" }),
    ),
  );
  meta.append(
    safeURL(e.venueWebsite)
      ? link(e.venue, e.venueWebsite)
      : el("span", null, e.venue),
  );
  target.append(meta);
  if (e.address) {
    const row = el("div", "detail-address");
    const pin = el("span", "address-icon");
    pin.setAttribute("aria-hidden", "true");
    pin.append(svgIcon(PIN_SVG));
    row.append(pin);
    // Prefer an explicit, verified location link; only fall back to a generated OpenStreetMap
    // search when the address is a real street-level address (not just a city name) and not flagged uncertain.
    const mapURL =
      safeURL(e.locationSource) ||
      (!e.addressUncertain && meaningfulAddress(e.address)
        ? "https://www.openstreetmap.org/search?query=" +
          encodeURIComponent(e.address)
        : null);
    if (mapURL) {
      const chooser = el("dialog", "map-choice");
      chooser.setAttribute(
        "aria-label",
        lang === "lt" ? "Atverti žemėlapyje" : "Open in maps",
      );
      chooser.append(
        el("h3", null, lang === "lt" ? "Atverti žemėlapyje" : "Open in maps"),
        el("p", null, e.address),
      );
      const query = encodeURIComponent(e.address);
      const choices = [
        [
          "Google Maps",
          "https://www.google.com/maps/search/?api=1&query=" + query,
        ],
        ["Apple Maps", "https://maps.apple.com/?q=" + query],
        ["Waze", "https://www.waze.com/ul?q=" + query],
        ["OpenStreetMap", mapURL],
      ];
      for (const [name, url] of choices) {
        const a = link(name, url);
        a.append(svgIcon(ARROW_SVG));
        a.addEventListener("click", () => chooser.close());
        chooser.append(a);
      }
      chooser.append(
        button(
          lang === "lt" ? "Uždaryti" : "Close",
          () => chooser.close(),
          "map-choice-close",
        ),
      );
      chooser.addEventListener("click", (ev) => {
        if (ev.target === chooser) {
          const r = chooser.getBoundingClientRect();
          if (
            ev.clientX < r.left ||
            ev.clientX > r.right ||
            ev.clientY < r.top ||
            ev.clientY > r.bottom
          )
            chooser.close();
        }
      });
      const addressLink = button(
        e.address,
        () => chooser.showModal(),
        "detail-address-link",
      );
      addressLink.setAttribute("aria-haspopup", "dialog");
      addressLink.append(svgIcon(ARROW_SVG, 14));
      row.append(addressLink, chooser);
    } else row.append(el("span", null, e.address));
    target.append(row);
  }
  target.append(el("p", null, e.description[lang] || e.description.en));
  // Per-platform priority: this event first, then permanent community links.
  const initiativeId =
    e.initiative || (e.type === "walk" ? "walks" : "meetups");
  const initiative = (config.initiatives || []).find(
    (i) => i.id === initiativeId,
  );
  const candidates = [
    ...(safeURL(e.url)
      ? [
          {
            name: new URL(e.url).hostname.endsWith("meetup.com")
              ? "Meetup"
              : t("eventPageLabel"),
            url: e.url,
          },
        ]
      : []),
    ...(e.links || []),
    ...(initiative?.links || []).filter((x) => x.kind !== "event"),
  ];
  const platform = (url) => {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host === "fb.me" || host === "facebook.com") return "facebook.com";
    if (host === "twitter.com" || host === "x.com") return "x.com";
    return host;
  };
  const used = new Set(
    [e.website, e.venueWebsite].filter(safeURL).map(platform),
  );
  const links = [];
  for (const item of candidates) {
    if (!safeURL(item.url)) continue;
    const key = platform(item.url);
    if (used.has(key)) continue;
    used.add(key);
    links.push(item);
  }
  if (links.length) {
    const sec = el("div", "detail-section");
    const list = el("div", "detail-links-list");
    for (const item of links) {
      const a = link(item.name, item.url);
      a.className = "detail-link";
      list.append(a);
    }
    sec.append(list);
    target.append(sec);
  }
  const actions = el("div", "detail-actions");
  if (Number.isFinite(e.lat) && Number.isFinite(e.lon))
    actions.append(
      button(
        t("viewMap"),
        () => {
          dialog.close();
          setMobileView("map");
          selected = dateKey(e.start);
          renderCalendar();
          if (map) {
            map.resize();
            map.flyTo({ center: [e.lon, e.lat], zoom: 16 });
            renderEventMarkers();
          }
        },
        "action-button",
      ),
    );
  if (downloadURL) URL.revokeObjectURL(downloadURL);
  downloadURL = URL.createObjectURL(
    new Blob([ics(e, lang)], { type: "text/calendar;charset=utf-8" }),
  );
  const a = el("a", null, t("addCalendar"));
  a.href = downloadURL;
  a.download = e.id + ".ics";
  actions.append(a);
  const shareStatus = el("span", "share-status");
  shareStatus.setAttribute("role", "status");
  actions.append(
    button(
      lang === "lt" ? "Kopijuoti nuorodą" : "Copy link",
      async () => {
        const url = new URL(location.href);
        url.searchParams.set("event", e.id);
        url.searchParams.set("lang", lang);
        if (/^\/(en|lt)\/$/.test(url.pathname)) url.pathname = "/" + lang + "/";
        url.searchParams.delete("edition");
        url.searchParams.delete("mode");
        try {
          await navigator.clipboard.writeText(url.href);
          shareStatus.textContent =
            lang === "lt" ? "Nuoroda nukopijuota" : "Link copied";
        } catch {
          shareStatus.replaceChildren();
          const field = el("input");
          field.readOnly = true;
          field.value = url.href;
          field.setAttribute(
            "aria-label",
            lang === "lt" ? "Renginio nuoroda" : "Event link",
          );
          shareStatus.append(field);
          field.select();
        }
      },
      "action-button",
    ),
  );
  target.append(actions, shareStatus);
  if (!dialog.open) dialog.showModal();
}
function renderMerchantMarkers() {
  merchantMarkers.forEach((m) => m.remove());
  merchantMarkers = [];
  if (!map || !loaded || !merchantsVisible) return;
  for (const p of places) {
    const b = button(
      "₿",
      (ev) => {
        ev.stopPropagation();
        openPlace(p);
      },
      "merchant-marker",
    );
    b.setAttribute("aria-label", placeName(p));
    b.title = placeName(p);
    merchantMarkers.push(
      new maplibregl.Marker({ element: b })
        .setLngLat([p.lon, p.lat])
        .addTo(map),
    );
  }
}
function renderEventMarkers() {
  eventMarkers.forEach((m) => m.remove());
  eventMarkers = [];
  if (!map || !loaded) return;
  const byLocation = new Map();
  for (const e of calendarEvents()) {
    if (e.type === "walk" ? !walksVisible : !eventsVisible) continue;
    if (!Number.isFinite(e.lat) || !Number.isFinite(e.lon)) continue;
    const key =
      (e.type === "walk" ? "walk" : "meetup") + ":" + e.lon + "," + e.lat;
    if (!byLocation.has(key)) byLocation.set(key, []);
    byLocation.get(key).push(e);
  }
  for (const group of byLocation.values()) {
    const e = group[0];
    const b = button(
      "",
      () => {
        if (group.length === 1) showEvent(e);
        else {
          activeEvent = null;
          const n = $("#event-detail");
          n.replaceChildren();
          const h = el("h2", null, e.venue);
          h.id = "detail-title";
          n.append(h, ...group.map(eventCard));
          dialog.showModal();
        }
      },
      "event-marker",
    );
    b.classList.add(e.type === "walk" ? "walk-marker" : "meetup-marker");
    b.append(folkIcon(e.type === "walk" ? "walk" : "meetup"));
    b.title = group.map((x) => x.title[lang] || x.title.en).join(" · ");
    b.setAttribute("aria-label", t("events") + " · " + e.venue);
    eventMarkers.push(
      new maplibregl.Marker({ element: b })
        .setLngLat([e.lon, e.lat])
        .addTo(map),
    );
  }
}
function openPlace(p) {
  if (!map) return;
  if (popup) popup.remove();
  const root = el("div", "merchant-popup");
  root.append(el("span", "badge", "BTC Map"), el("h2", null, placeName(p)));
  if (p.address) root.append(el("p", null, p.address));
  root.append(
    el(
      "p",
      "muted",
      p.verified_at
        ? t("verified") + " · " + fmt(p.verified_at, { dateStyle: "medium" })
        : t("unverified"),
    ),
  );
  if (p.opening_hours)
    root.append(el("p", null, t("hours") + " · " + p.opening_hours));
  root.append(el("p", "muted", t("acceptance")));
  const actions = el("div", "detail-actions");
  if (safeURL(p.website)) actions.append(link(t("website"), p.website));
  actions.append(
    link(
      t("btcmap"),
      "https://btcmap.org/merchant/" + encodeURIComponent(p.osm_id || p.id),
    ),
  );
  root.append(actions);
  popup = new maplibregl.Popup({ maxWidth: "300px", offset: 20 })
    .setLngLat([p.lon, p.lat])
    .setDOMContent(root)
    .addTo(map);
  const close = document.querySelector(".maplibregl-popup-close-button");
  if (close)
    close.setAttribute("aria-label", lang === "lt" ? "Uždaryti" : "Close");
}
function renderSearch() {
  const q = $("#search").value.trim().toLocaleLowerCase();
  const results = $("#search-results");
  results.replaceChildren();
  results.hidden = !q;
  if (!q) return;
  const matches = places
    .filter((p) =>
      ((p.name || "") + " " + (p.address || ""))
        .toLocaleLowerCase()
        .includes(q),
    )
    .slice(0, 12);
  if (!matches.length) results.append(el("p", "search-empty", t("noMatch")));
  for (const p of matches) {
    const b = button(
      "",
      () => {
        results.hidden = true;
        $("#search").value = "";
        if (!merchantsVisible) {
          merchantsVisible = true;
          $("#toggle-merchants").setAttribute("aria-pressed", "true");
          renderMerchantMarkers();
        }
        map?.flyTo({ center: [p.lon, p.lat], zoom: 16 });
        openPlace(p);
      },
      "search-result",
    );
    b.append(
      el("strong", null, placeName(p)),
      el("span", null, p.address || ""),
    );
    results.append(b);
  }
}
async function refreshPlaces() {
  const serial = ++requestSerial;
  try {
    const data = await json(API);
    const filtered = filterPlaces(data, boundary);
    if (serial !== requestSerial) return;
    places = filtered;
    fetchedAt = new Date().toISOString();
    dataMode = "live";
    dataFailed = false;
    try {
      localStorage.setItem(
        "lt-btc-places-v1",
        JSON.stringify({ fetchedAt, places }),
      );
    } catch {}
    renderStatus();
    renderMerchantMarkers();
    renderSearch();
  } catch (err) {
    if (serial === requestSerial) {
      dataFailed = true;
      renderStatus();
    }
  }
}
function showMapError() {
  mapFailure = true;
  const n = $("#map-error");
  n.hidden = false;
  n.replaceChildren(
    el("p", null, t("mapUnavailable")),
    button(t("retryMap"), () => location.reload(), "action-button"),
  );
}
function resetLithuaniaView(duration = 400) {
  if (!map) return;
  map.resize();
  const mobile = matchMedia("(max-width:760px)").matches;
  map.fitBounds(COUNTRY.bounds, {
    padding: mobile ? { top: 64, bottom: 90, left: 12, right: 12 } : 35,
    bearing: 0,
    pitch: 0,
    duration,
  });
}
async function initMap() {
  if (!window.maplibregl) {
    showMapError();
    return;
  }
  try {
    const style = await json(mapStylePath(isDark()));
    map = new maplibregl.Map({
      container: "map",
      style,
      center: COUNTRY.center,
      zoom: 6.4,
      minZoom: 4,
      maxZoom: 19,
      maxBounds: COUNTRY.navigationBounds,
      attributionControl: false,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution:
          '<a href="https://btcmap.org" target="_blank" rel="noopener">BTC Map</a>',
      }),
      "bottom-right",
    );
    localizeMapControls();
    resetLithuaniaView(0);
    map.on("style.load", () => {
      loaded = true;
      mapFailure = false;
      $("#map-error").hidden = true;
      map.addSource("lithuania", { type: "geojson", data: boundary });
      map.addLayer({
        id: "lithuania-border",
        type: "line",
        source: "lithuania",
        paint: {
          "line-color": isDark() ? "#8fb2a1" : "#285845",
          "line-width": 1.2,
          "line-opacity": 0.7,
        },
      });
      renderMerchantMarkers();
      renderEventMarkers();
    });
    let failures = 0;
    map.on("error", (e) => {
      console.warn("Map resource:", e.error?.message || "Unknown error");
      if (++failures >= 3) showMapError();
    });
    map.on("idle", () => {
      if (map.areTilesLoaded()) {
        mapFailure = false;
        $("#map-error").hidden = true;
      }
    });
    setTimeout(() => {
      if (!loaded) showMapError();
    }, 20000);
    new ResizeObserver(() => map?.resize()).observe($(".map-pane"));
  } catch {
    showMapError();
  }
}
$("#language").onclick = () => {
  lang = lang === "lt" ? "en" : "lt";
  try {
    localStorage.setItem("lt-btc-language", lang);
  } catch {}
  const u = new URL(location.href);
  u.searchParams.set("lang", lang);
  history.replaceState(null, "", u);
  updateHomeLink();
  renderLabels();
};
$(".dialog-close").onclick = () => dialog.close();
dialog.addEventListener("close", () => {
  activeEvent = null;
  const url = new URL(location.href);
  url.searchParams.delete("event");
  history.replaceState(null, "", url);
});
$("#search").addEventListener("input", renderSearch);
$("#search").addEventListener("keydown", (e) => {
  if (e.key === "Escape") $("#search-results").hidden = true;
  if (e.key === "ArrowDown") $("#search-results button")?.focus();
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) $("#search-results").hidden = true;
});
$("#fit").onclick = () => {
  popup?.remove();
  resetLithuaniaView();
};
for (const [id, kind] of [
  ["#toggle-merchants", "merchants"],
  ["#toggle-events", "events"],
  ["#toggle-walks", "walks"],
])
  $(id).onclick = () => {
    if (kind === "merchants") {
      merchantsVisible = !merchantsVisible;
      $(id).setAttribute("aria-pressed", String(merchantsVisible));
      renderMerchantMarkers();
    } else if (kind === "walks") {
      walksVisible = !walksVisible;
      $(id).setAttribute("aria-pressed", String(walksVisible));
      renderEventMarkers();
    } else {
      eventsVisible = !eventsVisible;
      $(id).setAttribute("aria-pressed", String(eventsVisible));
      renderEventMarkers();
    }
  };

$("#appearance").onclick = async () => {
  const b = $("#appearance");
  b.disabled = true;
  const dark = !isDark();
  try {
    const style = await json(mapStylePath(dark));
    document.body.classList.toggle("mode-dark", dark);
    document.body.classList.toggle("mode-light", !dark);
    const u = new URL(location.href);
    u.searchParams.set("mode", dark ? "dark" : "light");
    history.replaceState(null, "", u);
    updateHomeLink();
    renderAppearance();
    popup?.remove();
    if (map) {
      loaded = false;
      map.setStyle(style, { diff: false });
    } else initMap();
  } catch {
    showMapError();
  } finally {
    b.disabled = false;
  }
};

document.addEventListener("click", (e) => {
  if (!matchMedia("(max-width:760px)").matches)
    document.querySelectorAll(".initiative[open]").forEach((d) => {
      if (!d.contains(e.target)) d.open = false;
    });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!matchMedia("(max-width:760px)").matches)
      document.querySelectorAll(".initiative[open]").forEach((d) => {
        d.open = false;
        d.querySelector("summary").focus();
      });
  }
});
async function start() {
  renderLabels();
  try {
    [boundary, events, config] = await Promise.all([
      json("./" + COUNTRY.boundaryPath),
      json("./data/events.json"),
      json("./data/site.json"),
    ]);
    if (!Array.isArray(events)) throw Error("events");
    renderLabels();
    const requestedEvent = new URLSearchParams(location.search).get("event");
    const linkedEvent = events.find((e) => e.id === requestedEvent);
    if (linkedEvent) showEvent(linkedEvent);
    initMap();
    let snapshot;
    try {
      snapshot = JSON.parse(localStorage.getItem("lt-btc-places-v1"));
    } catch {}
    if (
      !snapshot?.fetchedAt ||
      !Number.isFinite(Date.parse(snapshot.fetchedAt)) ||
      !Array.isArray(snapshot.places) ||
      new Date(snapshot.fetchedAt) > new Date()
    ) {
      try {
        snapshot = await json("./data/merchants-snapshot.json");
      } catch {
        snapshot = null;
      }
    }
    if (snapshot) {
      places = filterPlaces(snapshot.places, boundary);
      fetchedAt = snapshot.fetchedAt;
      dataMode = "cached";
      renderStatus();
      renderMerchantMarkers();
    }
    refreshPlaces();
  } catch {
    dataMode = "error";
    dataFailed = true;
    renderStatus();
    $("#event-list").replaceChildren(
      el(
        "div",
        "empty-state",
        lang === "lt"
          ? "Kalendoriaus įkelti nepavyko."
          : "Unable to load the calendar.",
      ),
    );
  }
}
start();

// Mobile destinations reuse the existing controls and preserve map state.
function setMobileView(view) {
  if (!["map", "events", "community"].includes(view)) return;
  document.body.dataset.mobileView = view;
  document.querySelectorAll(".mobile-bottom-nav button").forEach((b) => {
    if (b.dataset.mobileView === view) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (view === "map") requestAnimationFrame(() => map?.resize());
}
function syncMobileLayout() {
  const mobile = matchMedia("(max-width:760px)").matches;
  const target = mobile ? $("#community-links") : $("#main-navigation");
  target.prepend($("#socials"));
  if (mobile) target.append($("#add-place"));
  else $("#socials").after($("#add-place"));
  $("#socials")
    .querySelectorAll("details")
    .forEach((d) => {
      d.open = mobile;
      d.querySelector("summary").tabIndex = mobile ? -1 : 0;
    });
  const labels =
    lang === "lt"
      ? { map: "Žemėlapis", events: "Renginiai", community: "Bendruomenė" }
      : { map: "Map", events: "Events", community: "Community" };
  document
    .querySelectorAll(".mobile-bottom-nav button")
    .forEach(
      (b) => (b.lastElementChild.textContent = labels[b.dataset.mobileView]),
    );
  $(".mobile-bottom-nav").setAttribute(
    "aria-label",
    lang === "lt" ? "Naršymas" : "Navigation",
  );
  $("#community-pane").setAttribute("aria-label", labels.community);
  setMobileView(document.body.dataset.mobileView || "map");
  requestAnimationFrame(() => map?.resize());
}
$(".mobile-bottom-nav").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) setMobileView(b.dataset.mobileView);
});
matchMedia("(max-width:760px)").addEventListener("change", syncMobileLayout);

function renderSourceLink() {
  const root = $("#community-source");
  root.replaceChildren();
  root.append(
    el(
      "h3",
      null,
      lang === "lt" ? "Pritaikyk savo bendruomenei" : "Make it yours",
    ),
    el(
      "p",
      null,
      lang === "lt"
        ? "Sukurk šios svetainės kopiją ir pritaikyk ją savo regionui ar šaliai."
        : "Fork this website and adapt it for your region or country.",
    ),
  );
  const source = link("GitHub ↗", COUNTRY.repository);
  source.className = "source-link";
  root.append(source);
}
