/* Seahorse Manager — Service Worker
   Lịch sử chi tiết từng bản đã DỌN GỌN (v3.20.101 — Sếp: "màn đăng nhập/cập nhật load rất chậm" —
   khối ghi chú lịch sử ở đây đã phình to bất thường qua nhiều đợt sửa liên tiếp trong 1 phiên,
   không phải code chạy nhưng làm nặng file không cần thiết). Các bản gần nhất, còn liên quan trực
   tiếp tới cơ chế cập nhật/cache của CHÍNH FILE NÀY:
   - v3.20.100: FIX crash "Out of Memory" — renderInventory() (phía index.html) từng tự mở lại modal
     liên tục mỗi lần đồng bộ nền; đổi sang nút bấm tĩnh.
   - v3.20.85: FIX gốc "kẹt bản cũ" thật — APP_VERSION viết cứng trong index.html quên tăng, không
     phải lỗi cache SW.
   - v3.20.84: PRECACHE ép {cache:'reload'} cho mọi file khi cài SW mới (bỏ qua cache HTTP/CDN) — vá
     đúng lỗi "cập nhật xong vẫn bản cũ", đổi lại mỗi lần cập nhật tải mới toàn bộ, chậm hơn trước.
   - v3.20.101: CHỈ ép {cache:'reload'} cho index.html (file thực sự cần luôn mới) — icon/manifest/
     thư viện Excel dùng cache bình thường (hiếm đổi, không phải nguồn gây lỗi "kẹt bản cũ") — giảm
     tải mạng mỗi lần cập nhật mà không tái phát lỗi cũ.
   Chiến lược: Network-first cho index.html (luôn mới); cache-first cho tài sản tĩnh (icon/manifest/lib).
   Cache tự đổi tên khi SW_VERSION bên dưới đổi.
   ⚠ QUAN TRỌNG: tăng SW_VERSION mỗi khi release bản mới của index.html để buộc trình duyệt bỏ cache cũ.
*/

const SW_VERSION = 'v3.20.103';
const CACHE_NAME = `seahorse-${SW_VERSION}`;

// Pre-cache critical files on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './lib/xlsx-js-style.min.js'   // v3.10.09 Phase A: self-host thư viện style (cache để dùng offline)
];

self.addEventListener('install', event => {
  console.log('[SW] Install', SW_VERSION);
  /* v3.20.84: cache.addAll() mặc định tin cache HTTP của trình duyệt, không ép tải mới hoàn toàn —
     có thể nạp nhầm index.html CŨ vào cache đặt tên theo phiên bản MỚI ("cập nhật xong vẫn bản cũ").
     v3.20.101 (Sếp: "màn đăng nhập/cập nhật load rất chậm"): v3.20.84 ép TẢI MỚI TOÀN BỘ mọi file
     (kể cả icon/manifest/thư viện Excel gần như không đổi giữa các bản) — đúng nhưng nặng, mỗi lần
     cập nhật tải lại cả những thứ không cần. Chỉ file THỰC SỰ cần luôn-mới (đúng nguồn gây lỗi cũ)
     mới ép {cache:'reload'} + phá cache CDN; còn lại dùng cache bình thường (nhanh hơn, vẫn tự làm
     mới theo chu kỳ cache tiêu chuẩn của trình duyệt/CDN — không tái phát lỗi "kẹt bản cũ" vì các
     file này không phải nguồn gây lỗi đó). */
  const FORCE_FRESH = new Set(['./', './index.html']);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(PRECACHE_URLS.map(url => {
        if(FORCE_FRESH.has(url)){
          const bustUrl = url + (url.includes('?') ? '&' : '?') + '_sw=' + Date.now();
          return fetch(new Request(bustUrl, {cache:'reload'}))
            .then(res => { if(res.ok) return cache.put(url, res); })
            .catch(e => console.warn('[SW] Precache fail (bỏ qua, không chặn cài đặt):', url, e));
        }
        return fetch(url)
          .then(res => { if(res.ok) return cache.put(url, res); })
          .catch(e => console.warn('[SW] Precache fail (bỏ qua, không chặn cài đặt):', url, e));
      })))
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
    // v3.12.35 — CACHE-FIRST + CẬP NHẬT NỀN (stale-while-revalidate) cho index.html.
    //   FIX "mở app chậm": trước đây network-first chờ mạng tải 5.2MB (tới 3.5s) MỖI lần mở
    //   dù cache có bản y hệt. Giờ: có cache → phục vụ NGAY (mở tức thì, cả offline/mạng yếu),
    //   fetch nền cập nhật cache cho lần sau. BẢN MỚI vẫn được phát hiện như cũ qua
    //   version.json (không cache) + checkForUpdate (auto chạy lúc boot) → auto-reload,
    //   lúc reload cache đã được fetch nền cập nhật → lên bản mới nhanh. SW_VERSION bump
    //   khi release vẫn xóa cache cũ + precache bản mới như trước.
    event.respondWith((async () => {
      const cached = await caches.match(req);
      const networkUpdate = fetch(req, {cache:'no-store'}).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => null);
      if (cached) {
        // Có cache → trả ngay; mạng chạy nền cập nhật (không await)
        return cached;
      }
      // Chưa có cache (lần cài đầu) → chờ mạng; fail → thử cache index chung
      const net = await networkUpdate;
      if (net) return net;
      return caches.match('./index.html');
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
