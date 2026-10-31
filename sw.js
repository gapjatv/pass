/* 갑자 금고 서비스워커
 * - 앱 화면 파일만 저장 (계정 데이터·서버 통신은 절대 저장하지 않음)
 * - 항상 최신 파일을 먼저 받아오고, 인터넷이 안 될 때만 저장본 사용
 *   → index.html 을 GitHub 에 다시 올리면 자동으로 새 버전이 적용됨
 */
const CACHE = 'gapja-vault-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // 같은 사이트의 GET 요청만 처리 (구글 서버 통신은 건드리지 않음)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
