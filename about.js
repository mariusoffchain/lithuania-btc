import { COUNTRY } from "./country-config.js";
import { renderInitiatives } from "./navigation.js";
const en = document.documentElement.lang === "en";
const button = document.querySelector("#appearance");
button.innerHTML = '<span class="folk-icon" aria-hidden="true"></span>';
function syncTheme() {
  const dark = document.body.classList.contains("mode-dark");
  button.querySelector("span").className =
    "folk-icon folk-" + (dark ? "sun" : "moon");
  button.setAttribute(
    "aria-label",
    en
      ? dark
        ? "Switch to light mode"
        : "Switch to dark mode"
      : dark
        ? "Šviesus režimas"
        : "Tamsus režimas",
  );
  document.querySelectorAll('a[href^="/"]').forEach((a) => {
    const url = new URL(a.getAttribute("href"), location.origin);
    url.searchParams.set("mode", dark ? "dark" : "light");
    a.href = url.pathname + url.search;
  });
}
button.addEventListener("click", () => {
  const dark = !document.body.classList.contains("mode-dark");
  document.body.classList.toggle("mode-dark", dark);
  document.body.classList.toggle("mode-light", !dark);
  const url = new URL(location.href);
  url.searchParams.set("mode", dark ? "dark" : "light");
  history.replaceState(null, "", url);
  syncTheme();
});
syncTheme();

const language = document.querySelector("#language");
language.hidden = COUNTRY.languages?.length === 1;
language.textContent = en ? "LT" : "EN";
language.setAttribute(
  "aria-label",
  en ? "Perjungti į lietuvių kalbą" : "Switch to English",
);
language.onclick = () => {
  location.href =
    (en ? "/about/" : "/en/about/") +
    "?mode=" +
    (document.body.classList.contains("mode-dark") ? "dark" : "light");
};
document
  .querySelectorAll("[data-about-link]")
  .forEach(
    (a) => ((a.querySelector("span") || a).textContent = en ? "About" : "Apie"),
  );
document.querySelector(".add-label").textContent = en
  ? "Add a place"
  : "Pridėti vietą";
// Built from the same community configuration as the map, without a network waterfall.
const config = JSON.parse(
  document.querySelector("#community-config").textContent,
);
renderInitiatives(config, en ? "en" : "lt");
