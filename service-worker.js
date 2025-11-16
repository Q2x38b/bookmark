const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `bmarks-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/share-target/index.html",
  "/login.html",
  "/register.html",
  "/documentaion/index.html",
  "/manifest.webmanifest",
  "/styles/main.css",
  "/styles/home.css",
  "/styles/auth.css",
  "/styles/app.css",
  "/js/app.js",
  "/js/auth.js",
  "/js/config.js",
  "/js/pwa.js",
  "/assets/google.svg",
  "/icons/icon-32.png",
  "/icons/icon-48.png",
  "/icons/icon-72.png",
  "/icons/icon-96.png",
  "/icons/icon-128.png",
  "/icons/icon-192.png",
  "/icons/icon-256.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("bmarks-static-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (handleShareTarget(event)) {
    return;
  }

  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only cache same-origin requests.
  if (url.origin !== self.location.origin) {
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(request));
  }
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      return cached;
    }
    return fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
      return response;
    });
  });
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => caches.match(request));
}

function handleShareTarget(event) {
  const { request } = event;
  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    !["/share-target", "/share-target/"].includes(url.pathname)
  ) {
    return false;
  }

  if (!["POST", "GET"].includes(request.method)) {
    return false;
  }

  const sharePromise =
    request.method === "POST"
      ? request.formData().then((formData) =>
          normalizeSharePayload({
            url: formData.get("url"),
            text: formData.get("text"),
            title: formData.get("title")
          })
        )
      : Promise.resolve(
          normalizeSharePayload({
            url: url.searchParams.get("url"),
            text: url.searchParams.get("text"),
            title: url.searchParams.get("title")
          })
        );

  respondToShareTarget(event, sharePromise);
  return true;
}

function respondToShareTarget(event, sharePromise) {
  event.respondWith(
    (async () => {
      const { targetUrl } = await sharePromise;
      return Response.redirect(targetUrl, 303);
    })()
  );

  event.waitUntil(
    (async () => {
      const { targetUrl } = await sharePromise;
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      const focusedClient =
        allClients.find((client) => client.visibilityState === "visible") ||
        allClients[0];

      if (focusedClient) {
        try {
          await focusedClient.navigate(targetUrl);
        } catch (_error) {
          // Ignore navigation failures (e.g., same-document navigations)
        }
        await focusedClient.focus();
      } else {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
}

function normalizeSharePayload(raw = {}) {
  const sharedUrl = (raw.url || "").trim();
  const sharedText = (raw.text || "").trim();
  const sharedTitle = (raw.title || "").trim();

  const extractedUrl =
    sharedUrl || tryExtractUrlFromText(sharedText) || "";
  const content = extractedUrl || sharedText || "";
  let title = sharedTitle || "";

  if (!title) {
    if (extractedUrl && sharedText && sharedText !== extractedUrl) {
      title = sharedText.slice(0, 120);
    } else if (!extractedUrl && sharedText) {
      title = sharedText.slice(0, 60);
    }
  }

  const params = new URLSearchParams();
  if (content) {
    params.set("content", content);
  }
  if (title) {
    params.set("title", title);
  }
  params.set("new", "1");

  return { targetUrl: `/?${params.toString()}` };
}

function tryExtractUrlFromText(text = "") {
  if (!text) {
    return "";
  }
  const match = text.match(/(https?:\/\/|www\.)[^\s)]+/i);
  if (!match) {
    return "";
  }
  let candidate = match[0];
  candidate = candidate.replace(/[)\],.;!?]+$/, "");
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  return candidate;
}
