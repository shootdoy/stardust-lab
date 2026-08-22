/* sw.js — 아트 캐싱과 오프라인 (v3.51.0)
 *
 * 왜 필요한가 — v3.51.0 에서 태그 아트 146장을 `art/<키>.webp` 로 HTML 밖으로 뺐다.
 * 그 전에는 한 파일이라 «받으면 곧 오프라인» 이었는데, 파일이 나뉘면서 그 성질이 깨졌다.
 * 이 워커가 그것을 되돌린다.
 *
 * ⚠⚠ **HTML 을 cache-first 로 두지 말 것.** 이 앱은 자기 URL 을 `cache:'no-store'` 로 받아
 *    `const VERSION` 을 비교해 «새 버전» 알림을 띄운다. 그것이 캐시에서 답을 받으면
 *    **버전이 늘 같아 보여 알림이 영구히 안 뜬다** — 사용자가 옛 판에 갇힌다.
 *    GitHub Pages 는 커스텀 헤더를 못 걸어서 그 감지가 갱신을 알리는 **유일한 수단**이다.
 *    그래서 ① no-store 요청은 아예 손대지 않고 ② 문서는 network-first 로 둔다.
 *
 * ⚠ 캐시 이름에 버전이 들어간다. 버전은 등록 URL(`sw.js?v=3.51.0`)에서 읽는다 —
 *   여기에 버전을 **또** 적으면 index.html 과 갈라진다. 한 곳(VERSION)만 고치면 되게 했다.
 *   등록 URL 이 바뀌면 브라우저가 새 워커로 보고 교체하므로 갱신도 저절로 걸린다.
 *
 * ⚠ 아트 목록을 여기 적지 않는다. 146개를 두 곳에 두면 반드시 갈라진다 —
 *   페이지가 `TAGART` 를 근거로 `warm` 메시지를 보내고, 워커는 받은 것만 담는다.
 */
const V = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'stardust-' + V;
const SHELL = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .catch(() => {})           // 하나라도 실패하면 설치를 막지 않는다
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 페이지가 TAGART 로 만든 목록을 보내 온다. 첫 그림이 뜬 뒤에 담으므로 화면을 막지 않는다. */
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type !== 'warm' || !Array.isArray(d.urls)) return;
  e.waitUntil(caches.open(CACHE).then(async c => {
    for (let i = 0; i < d.urls.length; i += 12) {          // 12개씩 — 한꺼번에 열면 느려진다
      await Promise.all(d.urls.slice(i, i + 12).map(u =>
        c.match(u).then(hit => hit || fetch(u).then(r => r.ok && c.put(u, r.clone())))
                  .catch(() => {})));
    }
  }));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;         // 광고·집계는 손대지 않는다

  // ⚠ 갱신 감지가 쓰는 요청 — 절대 가로채지 않는다
  if (req.cache === 'no-store' || req.cache === 'reload') return;

  /* 아트와 고정 자산(폰트·로고·카드) — 둘 다 «거의 안 바뀌고 바뀌면 ?v= 가 바뀐다».
     v3.52.0 에서 `asset/` 을 더했다. 목록은 여기 적지 않는다 — 경로 모양으로만 가른다. */
  const isArt = /\/art\/[^/]+\.webp$/.test(url.pathname)
             || /\/asset\/[^/]+$/.test(url.pathname);
  if (isArt) {
    // 내용이 바뀌면 ?v= 가 바뀌므로 캐시를 그대로 믿어도 된다
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()));
        return r;
      }))
    );
    return;
  }

  // 문서·그 밖 — network-first, 실패하면 캐시 (오프라인)
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok && (req.mode === 'navigate' || url.pathname.endsWith('.html')))
        caches.open(CACHE).then(c => c.put(req, r.clone()));
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
