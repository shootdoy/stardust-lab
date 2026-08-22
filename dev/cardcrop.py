#!/usr/bin/env python3
"""cardcrop.py — 공식 카드 원본에서 «그림만» 잘라 기존 아트 파일을 **덮어쓴다**.

  python3 dev/cardcrop.py                 미리보기 (쓰지 않음)
  python3 dev/cardcrop.py --write         실제 교체
  python3 dev/cardcrop.py --only 1-1-007  코드나 이름으로 골라서

원본은 `dev/fetch-art.sh` 가 받아 둔 `art_src/<탄>탄/<코드>-<이름>-앞.png` 다.
`art_src/` 는 `.gitignore` 대상이다 — 원본을 저장소에 커밋하지 않는다.

────────────────────────────────────────────────────────────────────────
⚠ **HTML 을 건드리지 않는다.** v3.51.0 부터 아트는 `docs/art/<키>.webp` 파일이고
  `index.html` 에는 **키 목록(`TAGART`)만** 있다. 이 스크립트는 기존 키의 그림만
  갈아 끼우므로 목록이 바뀌지 않는다 — 파일만 덮어쓰면 끝이다.
  (v3.50.0 까지는 base64 를 정규식으로 제자리 치환했다. 그 복잡함이 사라졌다.)

⚠⚠ **버전을 반드시 올릴 것.** 아트는 `art/키.webp?v=VERSION` 으로 요청되고
   서비스워커가 cache-first 로 담는다. 버전이 그대로면 **바뀐 그림이 영구히 안 보인다.**

⚠⚠ **성급마다 «그림만» 창이 다르다** (2026-08-22 실측). 카드 장식의 위치가 다르다.
      ★6 — 별·에너지가 **아래 왼쪽**, 이름띠가 아래 가운데
      ★5 — 별·에너지·이름이 **왼쪽 세로 띠**에 몰려 있다
   그래서 ★5 에 ★6 창을 쓰면 왼쪽 장식이 잔뜩 들어온다. **한 창으로 묶지 말 것.**

⚠ 창은 **10장(★6)·15장(★5)의 픽셀 분산**으로 «틀» 과 «그림» 을 갈라 구한
  «16:9 최대 내접 사각형» 이다. 새 성급을 더할 때도 같은 방법으로 재서 넣을 것 —
  눈대중으로 넣으면 오벌 곡률에 걸려 귀퉁이에 테두리가 낀다.

⚠ 원본을 `Image.convert('RGB')` 로 바로 열지 말 것. 카드 밖은 **투명**이라
  흰색으로 바뀌어 검출과 크롭이 어긋난다. 검정으로 합성한 뒤 쓴다.
────────────────────────────────────────────────────────────────────────
"""
import io, os, re, sys, argparse, unicodedata as ud
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import artstore

SRC = os.path.join(artstore.ROOT, 'art_src')

# 카드 원본은 300x169. 아래 창은 그 좌표계다 (좌, 상, 우+1, 하+1).
WIN = {
    '6': (59, 17, 238, 118),   # 179x101 · 배지를 프레임 밖으로 밀어낸다
    '5': (99, 35, 267, 130),   # 168x95  · 왼쪽 장식 띠를 피한다
}
LAND      = (144, 81)          # ★6·★5·공통 가로 규격 (artgen.py 와 같다)
MAX_BYTES = 3900               # 장당 상한 (artgen.py 와 같다)
CARD      = (300, 169)


def load_flat(path):
    """투명 영역을 검정으로 합성해 RGB 로 돌려준다."""
    im = Image.open(path).convert('RGBA')
    return Image.alpha_composite(Image.new('RGBA', im.size, (0, 0, 0, 255)), im).convert('RGB')


def cover(im, W, H):
    """비율을 지키며 가운데를 채워 자른다 (artgen.py 와 같은 규칙)."""
    sr, tr = im.width / im.height, W / H
    if sr > tr:
        nw = int(im.height * tr)
        im = im.crop(((im.width - nw) // 2, 0, (im.width + nw) // 2, im.height))
    else:
        nh = int(im.width / tr)
        im = im.crop((0, (im.height - nh) // 2, im.width, (im.height + nh) // 2))
    return im.resize((W, H), Image.LANCZOS)


def encode(im):
    for q in (80, 70, 62, 55, 48, 40, 33, 27, 22):
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            return buf.getvalue(), q
    return buf.getvalue(), q


def app_index(src):
    """카드 코드 → (탄, 성급, 이름). 이름을 눈으로 읽지 않기 위한 정본이다."""
    out = {}
    i = src.find('const MEASURED=[')
    j = src.index('\n];', i)
    for st, rk, nm, code in re.findall(r"\['(\d)','(\d)','([^']+)','([^']+)'", src[i:j]):
        out[code] = (st, rk, nm)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--only', help='코드(1-1-007) 또는 이름 일부')
    a = ap.parse_args()

    src  = artstore.load_html()
    have = set(artstore.keys(src))
    byc  = app_index(src)

    rows, skip = [], []
    for d in sorted(os.listdir(SRC)):
        dp = os.path.join(SRC, d)
        if not os.path.isdir(dp):
            continue
        for fn in sorted(os.listdir(dp)):
            n = ud.normalize('NFC', fn)          # macOS 는 NFD 로 저장한다
            m = re.match(r'^(\d-\d-\d{3})-(.+)-앞\.png$', n)
            if not m:
                continue
            code, nm = m.groups()
            if code not in byc:
                skip.append((n, '앱에 없는 코드')); continue
            st, rk, appnm = byc[code]
            if appnm != nm:
                skip.append((n, f'이름이 앱과 다르다 (앱={appnm})')); continue
            if rk not in WIN:
                skip.append((n, f'★{rk} 는 가로 창이 없다 — 세로는 artcrop.py')); continue
            key = f'{st}-{rk}-{nm}'
            if key not in have:
                skip.append((n, f'TAGART 에 없는 키 {key}')); continue
            if a.only and a.only not in code and a.only not in nm:
                continue
            im = load_flat(os.path.join(dp, fn))
            if im.size != CARD:
                skip.append((n, f'카드 크기가 다르다 {im.size}')); continue
            data, q = encode(cover(im.crop(WIN[rk]), *LAND))
            rows.append((key, code, artstore.size(key), len(data), q, data))

    for n, why in skip:
        print(f'  · 건너뜀 {n} — {why}')
    if not rows:
        print('처리할 것이 없다.'); return

    print(f'\n{"코드":<10}{"키":<18}{"옛":>8}{"새":>8}{"q":>4}')
    for key, code, o, nn, q, _ in rows:
        print(f'{code:<10}{key:<18}{o/1024:>7.2f}K{nn/1024:>7.2f}K{q:>4}')
    do = sum(r[2] for r in rows); dn = sum(r[3] for r in rows)
    print(f'{len(rows)}장 · 합계 {do/1024:.1f}K → {dn/1024:.1f}K ({(dn-do)/1024:+.1f}KB)')
    over = [r[0] for r in rows if r[3] > MAX_BYTES]
    if over:
        print(f'  ★ 장당 상한 초과: {", ".join(over)}')

    if not a.write:
        print('\n미리보기만 했다. 실제 교체는 --write')
        return

    for key, _, _, _, _, data in rows:
        artstore.write(key, data)
    print(f'\n{len(rows)}장 덮어썼다 (목록은 그대로 — HTML 은 안 건드렸다).')
    artstore.report()


if __name__ == '__main__':
    main()
