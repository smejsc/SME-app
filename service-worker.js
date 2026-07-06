/* Seahorse Manager — Service Worker  [BUILD-TAG: v3.10.07-NV-IDB — PRODUCTION]
   Strategy: Network-first for index.html (so updates load fast),
             Cache-first for static assets (icons, manifest).
   Cache version bumps automatically when SW_VERSION changes below.
   ⚠ IMPORTANT: Bump SW_VERSION mỗi khi release version mới của index.html
   để force trình duyệt invalidate cache cũ.
*/

const SW_VERSION = 'v3.10.07';
const CACHE_NAME = `seahorse-${SW_VERSION}`;

// Pre-cache critical files on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Install', SW_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(e => {
        console.warn('[SW] Precache partial fail:', e);
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate', SW_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith('seahorse-') && k !== CACHE_NAME)
        .map(k => { console.log('[SW] Delete old cache', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache Google Apps Script (cloud sync) — always go to network
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) {
    return;
  }
  // Never cache CDN fonts (handled by browser cache headers)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    return;
  }
  // Never cache version.json (we want fresh check)
  if (url.pathname.endsWith('/version.json')) {
    return;
  }

  // Strategy: network-first for HTML, cache-first for assets
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // v3.10.03: NETWORK-FIRST + TIMEOUT cho index.html.
    //   Ưu tiên mạng (bản mới nhất). Mạng YẾU (>3.5s chưa về) → dùng cache ngay (không treo màn trắng),
    //   vẫn cập nhật cache ngầm cho lần sau. Mất mạng/offline → fallback cache. Không có cache → chờ mạng.
    event.respondWith((async () => {
      const cachedPromise = caches.match(req);
      const networkPromise = fetch(req, {cache:'no-store'}).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      });
      // Nếu mạng chậm >3.5s: dùng cache (nếu có) để không treo; mạng vẫn chạy nền cập nhật cache.
      const timeoutFallback = new Promise(resolve => setTimeout(async () => {
        const c = await cachedPromise;
        resolve(c || null);
      }, 3500));
      try {
        const winner = await Promise.race([networkPromise.catch(() => null), timeoutFallback]);
        if (winner) return winner;                       // mạng về kịp HOẶC timeout có cache
        // tới đây: mạng chưa về + chưa có cache trong 3.5s → chờ hẳn mạng
        const net = await networkPromise.catch(() => null);
        if (net) return net;
        // mạng fail hẳn → cache cuối cùng
        return (await cachedPromise) || caches.match('./index.html');
      } catch (e) {
        return (await cachedPromise) || caches.match('./index.html');
      }
    })());
  } else {
    // Cache-first for assets
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});

// Allow page to trigger immediate update
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
