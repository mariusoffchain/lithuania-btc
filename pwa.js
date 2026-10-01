// Apply edge-to-edge safe areas only to the installed app, leaving browser layout unchanged.
const standalone = window.matchMedia("(display-mode: standalone)");
function syncDisplayMode() {
  const installed = standalone.matches || navigator.standalone === true;
  document.documentElement.classList.toggle("installed-pwa", installed);
  document.querySelector('meta[name="viewport"]').content =
    "width=device-width, initial-scale=1" +
    (installed ? ", viewport-fit=cover" : "");
}
syncDisplayMode();
standalone.addEventListener("change", syncDisplayMode);
// Register only in the release build, where /sw.js is generated.
if ("serviceWorker" in navigator && window.isSecureContext) {
  let changingVersion = false;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !changingVersion) {
      changingVersion = true;
      location.reload();
    }
  });
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) =>
        console.warn("Offline support unavailable:", error.message),
      ),
  );
}
