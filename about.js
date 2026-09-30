const en = document.documentElement.lang === "en";
const button = document.querySelector("#about-theme");
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
