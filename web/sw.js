const CACHE = 'lehrerapp-v1';
const PHOTOS = 'lehrerapp-fotos'; // Schüler-/Klassenfotos: Adresse enthält Versionsnummer, daher gefahrlos zwischenspeicherbar
const SHELL = ['/', '/shim.js', '/kmap.js', '/material.js', '/lehrmaterial.js', '/skins.js', '/manifest.webmanifest', '/icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== PHOTOS).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method === 'GET' && u.pathname === '/api/file' && /^(Schuelerfotos|Klassenfotos)\//.test(u.searchParams.get('path') || '')) {
    const key = u.origin + u.pathname + '?path=' + encodeURIComponent(u.searchParams.get('path')) + '&v=' + (u.searchParams.get('v') || '');
    e.respondWith(caches.open(PHOTOS).then(async (c) => {
      const hit = u.searchParams.get('v') ? await c.match(key) : null; if (hit) return hit;
      try { const r = await fetch(e.request); if (r.ok && /^image\//.test(r.headers.get('content-type') || '')) { c.put(key, r.clone()); const base = key.split('&v=')[0] + '&v='; c.keys().then((ks) => ks.forEach((k) => { if (k.url.startsWith(base) && k.url !== key) c.delete(k); })); } return r; }
      catch (err) { const old = await c.match(key); if (old) return old; throw err; }
    }));
    return;
  }
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  if (u.hostname.endsWith('spotify.com') || /open-meteo\.com$|bigdatacloud\.net$/.test(u.hostname)) return;
  if (u.origin !== location.origin) { // CDN-Bibliotheken (PDF) cachen
    e.respondWith(caches.open(CACHE).then(async (c) => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
    return;
  }
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('/'))));
});
