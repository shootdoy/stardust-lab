#!/usr/bin/env python3
"""recompress.py — 아트와 내장 아이콘을 통째로 다시 압축한다.

★4 이하 아트 90장이 들어오면서 파일이 911KB 가 됐다 (v1.79.0). 그래서 만든 도구다.
**v3.51.0 에서 아트를 HTML 밖으로 뺐으므로 압박은 크게 줄었다** —
지금 `index.html` 은 409KB, 아트가 따로 333KB 다. 그래도 전송량은 줄일 값이다.

이 스크립트가 건드리는 것
  1. `docs/art/` ★4 이하 90장 — 세로. 폭을 줄이고 품질을 낮춘다 (가장 큰 덩어리)
  2. `docs/art/` ★6·★5·공통 56장 — 가로. 배율로 줄인다
  3. TYPEICON 18개 — PNG → webp. 44px 유지 (표시 14px 의 3.1배라 줄일 이유 없음)
  4. 애플터치아이콘 152x152 PNG → webp
  3·4 는 아직 `index.html` 안 base64 다 (작아서 뺄 이유가 없다).

**원본을 쓸 수 있으면 원본에서 다시 뽑는다.** `--src` 로 크롭 폴더를 주면
그 안에 있는 키는 원본에서, 없는 키는 **기존 아트 파일**에서 재인코딩한다.
기존본에서 다시 뽑으면 손실이 겹치므로 원본 폴더를 주는 편이 낫다.

  python3 dev/recompress.py --src ../art_in --src ../art2            # 미리보기
  python3 dev/recompress.py --src ../art_in --src ../art2 --write    # 적용

⚠ **`--only-low` 를 빼면 ★6·★5 까지 줄인다.** ★6·★5 의 카드 원본은 `art_src/` 에 있으나
  (v3.49.0 에서 받았다) 저성급 원본과 폴더가 다르다 — 한 번 줄이면 되돌릴 수 없으니
  `--src` 없이 돌리지 말 것. `dev/sync.js` 가 하한으로도 감시한다.
⚠⚠ **버전을 반드시 올릴 것** — `?v=` 가 그대로면 서비스워커가 옛 그림을 계속 준다.
"""
import io, os, re, sys, math, base64, argparse
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import artstore

HTML  = artstore.HTML
LOWRE = artstore.LOWRE


def hb(key, n):
    """HTML 안에서 이 항목이 차지하는 바이트 (키 + base64 + 따옴표·쉼표)"""
    return len(key) + math.ceil(n / 3) * 4 + 6


def enc(im, w, h, q):
    b = io.BytesIO()
    im.resize((w, h), Image.LANCZOS).save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', action='append', default=[], help='원본 크롭 폴더 (여러 번 가능)')
    ap.add_argument('--low-w', type=int, default=64, help='★4 이하 가로 픽셀')
    ap.add_argument('--low-q', type=int, default=35)
    ap.add_argument('--hi-scale', type=float, default=0.75, help='★6·★5·공통 축소 배율')
    ap.add_argument('--hi-q', type=int, default=40)
    ap.add_argument('--icon-q', type=int, default=80)
    ap.add_argument('--only-low', action='store_true',
                    help='★4 이하만 건드린다 (★6·★5·공통 아트와 아이콘은 원본 그대로)')
    ap.add_argument('--write', action='store_true')
    a = ap.parse_args()

    src = {}
    for d in a.src:
        if not os.path.isdir(d):
            print('  ✗ 폴더 없음: %s' % d); continue
        for fn in os.listdir(d):
            if re.search(r'\.(png|jpe?g|webp)$', fn, re.I):
                src[artstore.nfc(re.sub(r'\.\w+$', '', fn))] = os.path.join(d, fn)

    s = io.open(HTML, encoding='utf-8').read()
    before = len(s.encode())

    keys = artstore.keys(s)
    old_art = sum(artstore.size(k) for k in keys)

    def source(key):
        if key in src:
            return Image.open(src[key]).convert('RGB'), '원본'
        raw = artstore.read(key)
        if raw is None:
            return None, '없음'
        return Image.open(io.BytesIO(raw)).convert('RGB'), '기존'

    out, from_src, kept, gone = [], 0, 0, []
    for k in keys:
        if a.only_low and not LOWRE.match(k):
            kept += 1; continue
        im, how = source(k)
        if im is None:
            gone.append(k); continue
        from_src += (how == '원본')
        if LOWRE.match(k):
            w = a.low_w; h = round(w * 192 / 108); q = a.low_q
        else:
            w = max(60, round(im.width * a.hi_scale)); h = round(w * im.height / im.width); q = a.hi_q
        out.append((k, enc(im, w, h, q)))

    touched = {k for k, _ in out}
    new_art = sum(len(d) for _, d in out) + sum(artstore.size(k) for k in keys if k not in touched)

    # 타입 아이콘 (알파 유지) — 아직 HTML 안 base64 다
    i2 = s.index('const TYPEICON='); j2 = s.index('\n};', i2)
    ti = re.findall(r'"([^"]+)":"([^"]+)"', s[i2:j2])
    old_ti = sum(hb(k, len(base64.b64decode(v))) for k, v in ti)
    tiout = []
    for k, v in ti:
        if a.only_low:
            tiout.append((k, base64.b64decode(v))); continue
        im = Image.open(io.BytesIO(base64.b64decode(v))).convert('RGBA')
        b = io.BytesIO(); im.save(b, 'WEBP', quality=a.icon_q, method=6)
        tiout.append((k, b.getvalue()))
    new_ti = sum(hb(k, len(d)) for k, d in tiout)

    # 애플터치아이콘 PNG → webp
    m = None if a.only_low else re.search(r'data:image/png;base64,([A-Za-z0-9+/=]{8000,})', s)
    icon_gain = 0
    if m:
        im = Image.open(io.BytesIO(base64.b64decode(m.group(1)))).convert('RGB')
        b = io.BytesIO(); im.save(b, 'WEBP', quality=82, method=6)
        newicon = base64.b64encode(b.getvalue()).decode()
        icon_gain = len(m.group(1)) - len(newicon)

    lowb = sum(len(d) for k, d in out if LOWRE.match(k))
    hib = sum(len(d) for k, d in out if not LOWRE.match(k))
    after = before - (old_ti - new_ti) - icon_gain
    if a.only_low:
        print('★4 이하만 재압축 — ★6·★5·공통 %d장과 아이콘은 그대로 통과' % kept)
    print('원본에서 재인코딩 %d장 · 기존 아트에서 %d장' % (from_src, len(out) - from_src))
    if gone:
        print('  ★ 목록에 있는데 파일이 없다 — %s' % ' · '.join(gone))
    if lowb:
        print('  ★4 이하 %dx%d q%d  → %5.0fKB' % (a.low_w, round(a.low_w * 192 / 108), a.low_q, lowb / 1024))
    if hib:
        print('  ★6·★5·공통 배율%.2f q%d → %5.0fKB' % (a.hi_scale, a.hi_q, hib / 1024))
    print('  아트 폴더  %.0fKB → %.0fKB' % (old_art / 1024, new_art / 1024))
    print('  TYPEICON %.0fKB → %.0fKB · 앱아이콘 -%.0fKB' % (old_ti / 1024, new_ti / 1024, icon_gain / 1024))
    print('  index.html %.0fKB → %.0fKB · 합계 %.0fKB → %.0fKB'
          % (before / 1024, after / 1024, (before + old_art) / 1024, (after + new_art) / 1024))

    if not a.write:
        print('\n미리보기만 했다. 적용하려면 --write')
        return

    for k, d in out:
        artstore.write(k, d)
    if not a.only_low:
        i2 = s.index('const TYPEICON='); j2 = s.index('\n};', i2)
        tibody = ',\n'.join('"%s":"%s"' % (k, base64.b64encode(d).decode()) for k, d in tiout)
        s = s[:i2] + 'const TYPEICON={\n' + tibody + s[j2:]
        if m:
            s = s.replace('data:image/png;base64,' + m.group(1), 'data:image/webp;base64,' + newicon)
        io.open(HTML, 'w', encoding='utf-8').write(s)
    print('\n아트 %d장 덮어썼다%s.' % (len(out), ' · 아이콘도 다시 넣었다' if not a.only_low else ''))
    artstore.report()


if __name__ == '__main__':
    main()
