/* Service worker Šachového trenažéru: aplikace v mobilu + práce bez internetu.
   Pravidla: index.html/config.js/navigace = nejdřív síť (nová verze hned), ostatní = cache a obnova na pozadí.
   Supabase (účty) se NIKDY neukládá do cache. Při změně pravidel zvyš VERSION. */
const VERSION = 'trener-v1';
const PRECACHE = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'];
const SWR_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' && await cache.match('index.html'));
    if (hit) return hit;
    throw err;
  }
}
async function staleWhileRevalidate(e) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(e.request);
  const fresh = fetch(e.request).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
    return res;
  }).catch(() => null);
  if (hit) { e.waitUntil(fresh); return hit; }
  return (await fresh) || Response.error();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // jen GET
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;        // účty nikdy necachovat
  const same = url.origin === self.location.origin;
  if (same) {
    const p = url.pathname;
    if (req.mode === 'navigate' || p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('/config.js'))
      return e.respondWith(networkFirst(req));
    if (p.endsWith('/sw.js')) return;
    return e.respondWith(staleWhileRevalidate(e));
  }
  if (SWR_HOSTS.includes(url.hostname)) return e.respondWith(staleWhileRevalidate(e));
  // ostatní cizí domény projdou beze změny
});
