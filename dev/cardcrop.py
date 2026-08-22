#!/usr/bin/env python3
"""cardcrop.py — 공식 카드 원본에서 «그림만» 잘라 `TAGIMG` 의 기존 키를 **제자리 교체**한다.

  python3 dev/cardcrop.py                 미리보기 (쓰지 않음)
  python3 dev/cardcrop.py --write         실제 교체
  python3 dev/cardcrop.py --only 1-1-007  코드나 이름으로 골라서

원본은 `dev/fetch-art.sh` 가 받아 둔 `art_src/<탄>탄/<코드>-<이름>-앞.png` 다.
`art_src/` 는 `.gitignore` 대상이다 — 원본을 저장소에 커밋하지 않는다.

────────────────────────────────────────────────────────────────────────
⚠⚠ **`artgen.py --force` 를 쓰지 말 것.** 그쪽은 기존 키를 건너뛰지 않으면서
   닫는 괄호 앞에 **덧붙이기만** 해서 키가 중복된다 (옛 항목이 남는다).
   JS 는 뒤 값이 이겨 화면은 맞지만 `TAGIMG` 키 수가 늘어 `sync.js` 가 막고
   용량도 헛되게 커진다. 그래서 이 스크립트는 정규식으로 **그 키의 값만** 바꾸고,
   치환이 정확히 1회가 아니면 멈춘다.

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
import io, os, re, sys, base64, argparse, unicodedata as ud
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..'))
HTML = os.path.join(ROOT, 'index.html')
SRC  = os.path.join(ROOT, 'art_src')

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

    src = io.open(HTML, encoding='utf-8').read()
    i = src.index('const TAGIMG={'); j = src.index('\n};', i)
    have = dict(re.findall(r'"([^"]+)":"([A-Za-z0-9+/=]+)"', src[i:j]))
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
                skip.append((n, f'TAGIMG 에 없는 키 {key}')); continue
            if a.only and a.only not in code and a.only not in nm:
                continue
            im = load_flat(os.path.join(dp, fn))
            if im.size != CARD:
                skip.append((n, f'카드 크기가 다르다 {im.size}')); continue
            data, q = encode(cover(im.crop(WIN[rk]), *LAND))
            rows.append((key, code, len(base64.b64decode(have[key])), len(data), q,
                         base64.b64encode(data).decode()))

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

    out = src
    for key, code, _, _, _, b64 in rows:
        pat = '"' + re.escape(key) + '":"[A-Za-z0-9+/=]+"'
        out, cnt = re.subn(pat, lambda m: '"' + key + '":"' + b64 + '"', out)
        if cnt != 1:
            sys.exit(f'★ {key}: 치환 {cnt}회 (1이어야 한다) — 아무것도 쓰지 않고 멈춘다')
    io.open(HTML, 'w', encoding='utf-8').write(out)
    print(f'\nindex.html 에 {len(rows)}장 제자리 교체했다.')
    print('  버전을 올리고 `node dev/check.js` 를 돌릴 것. TAGIMG 키 수는 그대로여야 한다.')


if __name__ == '__main__':
    main()
