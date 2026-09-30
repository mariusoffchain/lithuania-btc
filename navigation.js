import { safeURL } from "./domain.js";
const $ = (s) => document.querySelector(s);
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function folkIcon(name) {
  const n = el("span", "folk-icon folk-" + name);
  n.setAttribute("aria-hidden", "true");
  return n;
}
function link(text, url) {
  const a = el("a", null, text);
  a.href = safeURL(url);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}
export function renderInitiatives(config, lang) {
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
      initiative.id === "walks"
        ? lang === "lt"
          ? "Pasivaikščiojimai"
          : "Walks"
        : lang === "lt"
          ? "Susitikimai"
          : "Meetups",
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
  $("#add-place").setAttribute(
    "aria-label",
    lang === "lt" ? "Pridėti vietą" : "Add a place",
  );
  $("#add-place").title = lang === "lt" ? "Pridėti vietą" : "Add a place";
}
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
