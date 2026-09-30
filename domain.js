import { COUNTRY } from "./country-config.js";
export const API = COUNTRY.merchantsURL;
export function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i],
      [px, py] = ring[j];
    if (y > lat !== py > lat && lon < ((px - x) * (lat - y)) / (py - y) + x)
      inside = !inside;
  }
  return inside;
}
export function inCountry(place, feature) {
  if (
    !Number.isFinite(place.lon) ||
    !Number.isFinite(place.lat) ||
    place.deleted_at
  )
    return false;
  const g = feature.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.some(
    (p) =>
      inRing(place.lon, place.lat, p[0]) &&
      !p.slice(1).some((r) => inRing(place.lon, place.lat, r)),
  );
}
export function filterPlaces(places, boundary) {
  if (!Array.isArray(places)) throw new Error("Invalid places response");
  const seen = new Set();
  return places.filter((p) => {
    if (
      !Number.isSafeInteger(p.id) ||
      seen.has(p.id) ||
      !inCountry(p, boundary)
    )
      return false;
    seen.add(p.id);
    return true;
  });
}
export function dateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COUNTRY.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function eventGroups(events, now = new Date()) {
  return {
    upcoming: events
      .filter((e) => new Date(e.end || e.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start)),
    past: events
      .filter((e) => new Date(e.end || e.start) < now)
      .sort((a, b) => new Date(b.start) - new Date(a.start)),
  };
}
export function safeURL(value) {
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
function foldCalendarLine(line) {
  let result = "",
    length = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (length + bytes > 75) {
      result += "\r\n ";
      length = 1;
    }
    result += char;
    length += bytes;
  }
  return result;
}
export function ics(event, language = "en") {
  const esc = (s) =>
    String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = (s) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//" + COUNTRY.name + "//Calendar//EN",
    "BEGIN:VEVENT",
    "UID:" + event.id + "@" + new URL(COUNTRY.origin).hostname,
    "DTSTAMP:" + stamp(new Date()),
    "DTSTART:" + stamp(event.start),
    "DTEND:" + stamp(event.end || event.start),
    "SUMMARY:" + esc(event.title[language] || event.title.en),
    "LOCATION:" + esc(event.venue + ", " + event.address),
    "DESCRIPTION:" + esc(event.description[language] || event.description.en),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(foldCalendarLine)
    .join("\r\n");
}
