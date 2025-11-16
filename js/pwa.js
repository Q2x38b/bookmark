const SW_URL = "/service-worker.js";
const SW_SCOPE = "/";

registerServiceWorker();
setupStandaloneMetadata();

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: SW_SCOPE,
        updateViaCache: "none"
      });
      if (registration.installing) {
        registration.installing.addEventListener("statechange", () => {
          if (
            registration.installing &&
            registration.installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.info("BMarks service worker updated.");
          }
        });
      }
    } catch (error) {
      console.warn("BMarks service worker registration failed.", error);
    }
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register);
  }
}

function setupStandaloneMetadata() {
  const setDisplayMode = () => {
    const displayMode = window.matchMedia("(display-mode: standalone)").matches
      ? "standalone"
      : navigator.standalone
      ? "standalone"
      : "browser";
    document.documentElement.dataset.displayMode = displayMode;
  };

  setDisplayMode();
  window.addEventListener("visibilitychange", setDisplayMode);
  window.matchMedia("(display-mode: standalone)").addEventListener("change", setDisplayMode);
}
