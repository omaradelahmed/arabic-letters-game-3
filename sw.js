/* شكل الحرف — Service Worker
 * كل حاجة محلية: بعد أول زيارة اللعبة تشتغل بدون إنترنت.
 * ملحوظة: كل لعبة على github.io ليها بادئة كاش خاصة عشان ميمسحوش كاش بعض.
 */

const CACHE_PREFIX = 'hurouf3-';
const CACHE_VERSION = `${CACHE_PREFIX}v1`;
// أسماء كاش قديمة من نسخ سابقة (مفيش لحد الآن)
const LEGACY_CACHES = [];

const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

// بنجيب كل ملف من الشبكة متجاهلين كاش المتصفح، عشان النسخة الجديدة
// متخزّنش ملفات قديمة (GitHub Pages بيدي الملفات كاش 10 دقايق).
async function precache() {
  const cache = await caches.open(CACHE_VERSION);
  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        let response;
        try {
          response = await fetch(url, { cache: 'reload' });
        } catch {
          response = await fetch(url);
        }
        if (response && response.ok) await cache.put(url, response);
      } catch {
        /* ملف واحد فشل: نحاول تاني وقت الاستخدام، والباقي يفضل متخزّن */
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // بنمسح كاش النسخ القديمة بتاعت اللعبة دي بس — مش كاش اللعبة التانية
            .filter(
              (key) =>
                key !== CACHE_VERSION && (key.startsWith(CACHE_PREFIX) || LEGACY_CACHES.includes(key))
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // صفحات التنقل: جوه اللعبة نفسها بس (الجذر أو index.html).
  // أي ملف تاني (زي qr/shakl-qr.png أو ملف PDF) يروح للشبكة عادي.
  if (request.mode === 'navigate') {
    const isAppPage = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
    if (!isAppPage) return;

    event.respondWith(
      (async () => {
        const cached = await (await caches.open(CACHE_VERSION)).match('./index.html');
        if (cached) return cached;
        try {
          return await fetch(request);
        } catch {
          return new Response('اللعبة مش محمّلة على الجهاز. افتحها مرة واحدة والنت شغّال.', {
            status: 504,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })()
  );
});
