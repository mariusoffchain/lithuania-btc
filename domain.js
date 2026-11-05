import { calendarEvent } from "./calendar.js";
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
      !p.name?.trim() || /^(unnamed(?: place)?$|t\/n fun casino)/i.test(p.name.trim()) ||
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
    planned: events.filter((e) => e.status === "planned"),
    upcoming: events
      .filter(
        (e) => e.status !== "planned" && new Date(e.end || e.start) >= now,
      )
      .sort((a, b) => new Date(a.start) - new Date(b.start)),
    past: events
      .filter((e) => e.status !== "planned" && new Date(e.end || e.start) < now)
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
export function ics(event, language = "en") {
  return calendarEvent(event, language, COUNTRY.origin, COUNTRY.name);
}


// Match names, addresses and BTC Map categories independently of accents.
export function normalizeSearch(value) {
  return String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
export function matchesPlace(place, query) {
  const categories = { local_cafe: "cafe coffee kavine", restaurant: "restaurant food restoranas", local_bar: "bar pub baras", hotel: "hotel accommodation viesbutis", shopping_cart: "shop store parduotuve", storefront: "shop store parduotuve", local_movies: "cinema movie kinas", palette: "art culture menas" };
  const text = normalizeSearch([place.name, place.address, place.city, place.category, place.icon, place.description, categories[place.icon]].filter(Boolean).join(" "));
  return normalizeSearch(query).split(/\s+/).every(word => text.includes(word));
}
// Screen-space connected groups keep even identical coordinates selectable.
export function groupNearbyPlaces(places, project, radius = 44) {
  const groups = [];
  for (const place of places) {
    const point = project([place.lon, place.lat]);
    const neighbours = groups.filter(group => group.some(item => Math.hypot(item.point.x - point.x, item.point.y - point.y) < radius));
    const merged = [{place, point}, ...neighbours.flat()];
    for (const group of neighbours) groups.splice(groups.indexOf(group), 1);
    groups.push(merged);
  }
  return groups.map(group => group.map(item => item.place));
}
