/* StallBook offline cache.
   Bump VERSION on every release: the new worker downloads fresh files, then the app offers a reload.
   The page is cached only as './' because Cloudflare redirects /index.html to /,
   and Safari refuses a cached page that came from a redirect. */
const VERSION = '4.0';
const CACHE = 'stallbook-' + VERSION;
const CORE = ['./', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'fonts/atkinson-400-latin.woff2', 'fonts/atkinson-400-latin-ext.woff2', 'fonts/atkinson-700-latin.woff2', 'fonts/atkinson-700-latin-ext.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Serve from the phone first, refresh in the background. Every page load is the one-page app. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const nav = req.mode === 'navigate';
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(nav ? './' : req, {ignoreSearch: true});
    const net = fetch(req).then(res => {
      if (res && res.ok && !res.redirected) c.put(nav ? './' : req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
