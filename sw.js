// سكينة — يحفظ التطبيق والخط ونص المصحف في الهاتف ليعمل بدون إنترنت
const VERSION = "sakina-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];
const DATA = [
  "https://cdn.jsdelivr.net/gh/thetruetruth/quran-data-kfgqpc@main/warsh/font/warsh.10.woff2",
  "https://cdn.jsdelivr.net/gh/thetruetruth/quran-data-kfgqpc@main/warsh/data/warshData_v10.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    await Promise.all(DATA.map((url) => cache.add(new Request(url, { mode: "cors" })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // صفحات التطبيق: من الشبكة أولاً (للتحديثات)، ومن الهاتف عند انقطاع الإنترنت
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
        return res;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true })) || caches.match("./index.html");
      }
    })());
    return;
  }

  // الخط ونص المصحف: من الهاتف أولاً
  if (url.hostname === "cdn.jsdelivr.net") {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
      return res;
    })());
  }
  // التلاوات تُشغَّل مباشرة من الإنترنت
});
