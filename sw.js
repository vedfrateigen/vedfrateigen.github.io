// © 2026 Benjamin Teigen. Alle rettigheter forbeholdt – se LICENSE.
/* Gjør at Vedsal åpner seg også uten dekning. Henter alltid nyeste versjon når det er nett. */
const CACHE = "vedsal-2026-09-29-1518";
const FILER = ["./", "index.html", "pappa.html", "stil.css", "config.js", "felles.js", "kunde.js", "pappa.js",
  "ikon.svg", "ikon-192.png", "ikon-180.png", "manifest.webmanifest", "og-bilde.jpg", "bilder/sekkar.jpg", "bilder/stabel.jpg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((navn) => Promise.all(navn.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request)
    .then((svar) => {
      if (svar.ok) {
        const kopi = svar.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopi));
      }
      return svar;
    })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || Response.error())));
});
