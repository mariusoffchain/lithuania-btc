// Register only in the release build, where /sw.js is generated.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((error) =>
        console.warn("Offline support unavailable:", error.message),
      ),
  );
}
