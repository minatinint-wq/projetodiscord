const VERSION = "sesh-pwa-v1";
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const CORE = ["/", "/app", "/install.html", "/install.js", "/manifest.webmanifest", "/branding/sesh-192.png", "/branding/sesh-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname === "/ws") return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put("/app", copy));
          return response;
        })
        .catch(() => caches.match("/app").then((response) => response || caches.match("/"))),
    );
    return;
  }
  if (!["script", "style", "font", "image"].includes(request.destination)) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        if (response.ok && !url.pathname.startsWith("/nameplates/") && !url.pathname.startsWith("/profile-art/"))
          caches.open(RUNTIME).then((cache) => cache.put(request, response.clone()));
        return response;
      });
      return cached || fresh;
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
