#!/usr/bin/env python3
"""artstore.py — 태그 아트 저장소를 다루는 공용 모듈 (v3.51.0)

v3.50.0 까지 아트는 `index.html` 안 `TAGIMG` 에 base64 로 박혀 있었고,
도구 다섯(`artgen` `artcrop` `cardcrop` `recompress` `cardshot`)이 **각자** 그 블록을
정규식으로 다시 쓰고 있었다. 다섯 벌의 base64 처리는 갈라지기만 했다 —
실제로 `artgen.py` 는 «덧붙이기» 라 키가 중복되고 `cardcrop.py` 는 «제자리 교체» 였다.

v3.51.0 에서 아트를 `docs/art/<키>.webp` 로 뺐으므로, 그 접근을 여기 한 곳에 모은다.

정본이 **둘**이다 — 이것이 이 모듈의 존재 이유다
────────────────────────────────────────────────────────────
  ① `index.html` 의 `TAGART` — **어떤 키가 있는가** (CSS 규칙을 만드는 근거)
  ② `docs/art/*.webp`        — **그림 자체**

  둘이 어긋나면 조용히 깨진다. 목록에만 있으면 그 태그가 **그림 없이** 뜨고(404),
  파일에만 있으면 아무도 안 쓰는 파일이 용량만 먹는다. 화면이 죽지 않으니 눈에 안 띈다.
  `dev/sync.js` 가 1:1 로 대조해 막지만, **도구는 애초에 둘을 함께 고쳐야 한다.**

  ⚠ 기존 키의 **그림만** 바꾸는 일(재크롭·재압축)은 `write()` 하나로 끝난다 —
    HTML 을 건드릴 이유가 없다. 목록이 안 바뀌기 때문이다.
  ⚠ **새 키를 더할 때만** `add_keys()` 로 HTML 도 함께 고친다.

⚠⚠ 아트를 바꿨으면 **반드시 버전을 올릴 것.** base64 시절에는 아트를 고치면 HTML 이
   바뀌어 저절로 갱신됐지만, 이제 아트는 `art/키.webp?v=VERSION` 으로 요청되고
   서비스워커가 **cache-first** 로 담는다. 버전이 그대로면 **바뀐 그림이 영구히 안 보인다.**
   (`docs/sw.js` 머리말 참고)

⚠ 파일 이름은 **NFC** 로 쓴다. macOS 는 한글 파일명을 NFD 로 저장하는데 CSS 는
  `encodeURIComponent(NFC 키)` 로 요청하므로, NFD 로 남으면 그 태그만 404 가 난다.
  `dev/sync.js` 가 이것도 감시한다.
"""
import io, os, re, sys, unicodedata as ud

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
HTML = os.path.join(ROOT, 'docs', 'index.html')
ART  = os.path.join(ROOT, 'docs', 'art')

LOWRE = re.compile(r'^\d-[1-4]-')          # ★4 이하 = 세로 카드
MARK  = 'const TAGART=['


def nfc(k):
    return ud.normalize('NFC', k)


def load_html():
    return io.open(HTML, encoding='utf-8').read()


def _span(src):
    """TAGART 블록의 [시작, 끝) — 끝은 `\\n];` 를 포함한다."""
    i = src.index(MARK)
    j = src.index('\n];', i) + len('\n];')
    return i, j


_cache = None


def keys(src=None):
    """HTML 의 `TAGART` 목록. **순서를 지킨다** — CSS 클래스 `.aNN` 의 N 이 이 순서다.

    src 를 안 주면 한 번 읽어 두고 재사용한다 (`write()` 가 장마다 부르므로).
    목록을 늘리는 `add_keys()` 가 이 캐시를 버린다.
    """
    global _cache
    if src is not None:
        i, j = _span(src)
        return [nfc(x[1:-1]) for x in re.findall(r'"[^"]+"', src[i:j])]
    if _cache is None:
        _cache = keys(load_html())
    return list(_cache)


def path(key):
    return os.path.join(ART, nfc(key) + '.webp')


def has(key):
    return os.path.exists(path(key))


def read(key):
    """그림 바이트. 없으면 None — 부르는 쪽이 «원본 없음» 으로 다뤄야 한다."""
    p = path(key)
    return io.open(p, 'rb').read() if os.path.exists(p) else None


def size(key):
    p = path(key)
    return os.path.getsize(p) if os.path.exists(p) else 0


def write(key, data):
    """그림을 덮어쓴다. 목록에 없는 키면 멈춘다 — 아무도 안 쓰는 파일을 만들지 않는다.

    ⚠ 먼저 NFC 로 맞춘다. macOS 가 준 파일명은 NFD 라서, 안 맞추면 목록에 있는 키인데도
      «없다» 며 멈춘다 (v3.51.0 작업 중 실제로 걸렸다).
    """
    key = nfc(key)
    if key not in keys():
        sys.exit('★ %s 는 TAGART 목록에 없다. 새 키는 add_keys() 로 함께 더할 것' % key)
    os.makedirs(ART, exist_ok=True)
    io.open(path(key), 'wb').write(data)


def files():
    """디스크에 있는 키 (정렬). 목록과 대조할 때 쓴다."""
    try:
        return sorted(nfc(f)[:-5] for f in os.listdir(ART) if f.endswith('.webp'))
    except FileNotFoundError:
        return []


def _block(ks):
    """키 목록을 원래 폭(108자)에 맞춰 다시 접는다."""
    lines, cur = [], '  '
    for k in ks:
        t = '"%s",' % k
        if len(cur) + len(t) > 108:
            lines.append(cur.rstrip()); cur = '  '
        cur += t
    lines.append(cur.rstrip().rstrip(','))
    return MARK + '\n' + '\n'.join(lines) + '\n];'


def add_keys(new, write_html=True):
    """새 키를 `TAGART` **뒤에** 더한다. 이미 있는 키는 조용히 넘긴다.

    ⚠ 순서를 **끝에만** 더하는 것이 중요하다. 중간에 끼우면 `.aNN` 번호가 밀려
      «이미 캐시된 옛 번호» 와 어긋난다 — 404 도 안 나고 엉뚱한 그림이 뜬다.
    """
    global _cache
    src = load_html()
    cur = keys(src)
    add = [nfc(k) for k in new if nfc(k) not in cur]
    if not add:
        return src, []
    out = src[:_span(src)[0]] + _block(cur + add) + src[_span(src)[1]:]
    if write_html:
        io.open(HTML, 'w', encoding='utf-8').write(out)
    _cache = cur + add            # write() 가 곧 이 키를 쓴다 — 캐시를 맞춰 둔다
    return out, add


def report():
    """도구가 끝날 때 함께 찍는 확인용 요약. «되읽어 확인» 절차를 강제한다."""
    ks, fs = keys(), files()
    miss = [k for k in ks if k not in set(fs)]
    orph = [f for f in fs if f not in set(ks)]
    tot = sum(size(k) for k in ks)
    print('  되읽기: 목록 %d키 · 파일 %d개 · 아트 %.0fKB · HTML %.0fKB'
          % (len(ks), len(fs), tot / 1024, len(load_html().encode()) / 1024))
    if miss:
        print('  ★ 목록에 있는데 파일이 없다 (그림 없이 뜬다): %s' % ' · '.join(miss[:5]))
    if orph:
        print('  ★ 파일만 있고 목록에 없다 (안 쓰인다): %s' % ' · '.join(orph[:5]))
    print('  ⚠ 아트를 바꿨으면 **버전을 올릴 것** — ?v= 가 그대로면 바뀐 그림이 안 보인다')
    print('  그다음 `node dev/check.js`')
    return not (miss or orph)


if __name__ == '__main__':
    report()
