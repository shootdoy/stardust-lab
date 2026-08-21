#!/usr/bin/env python3
"""cardshot.py — **도감 상세 팝업** 스크린샷 한 장에서 카드를 찾아 태그 아트로 넣는다.
 
`dexcrop.py` 는 도감 «격자» 화면용이고, 이건 카드 하나를 크게 띄운 «상세 팝업» 용이다.
팝업 쪽이 카드가 커서(약 500x890 · 격자는 356x632) 더 선명하다.
 
  python3 dev/cardshot.py <스샷.png> <키> [<스샷2.png> <키2> ...] [--write]
  예) python3 dev/cardshot.py ~/IMG_7010.png 1-4-고릴타 --write
 
찾는 법 — 팝업 카드만 **또렷한 흰색**(뒤 카드는 어둡게 깔린다)이라 그걸로 가른다.
찾은 카드는 `art_in/<키>.png` 로도 남긴다. **그래야 다음에 `artcrop.py` 를 돌릴 때
«원본 없음» 목록에서 빠진다** — 안 남기면 내장본에서 되잘라 또 흐려진다.
 
자른 그림 구간·출력 규격은 `artcrop.py` 와 같은 값을 쓴다 (거기서 가져온다).
"""
import io, os, re, sys, base64, argparse
import numpy as np
from PIL import Image
 
HERE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(HERE, '..', 'index.html')
KEEP = os.path.join(HERE, '..', 'art_in')
sys.path.insert(0, HERE)
from artcrop import crop_art, enc, MAXB, OUT   # 같은 구간·같은 규격을 쓴다
 
 
def find_card(path):
    """팝업 카드의 흰 테두리를 찾아 잘라 낸다. 못 찾으면 None."""
    im = Image.open(path).convert('RGB')
    a = np.asarray(im, dtype=float)
    mx = a.max(axis=2); mn = a.min(axis=2)
    w = (mx > 228) & ((mx - mn) < 22)
    ys = np.where(w.mean(axis=1) > 0.02)[0]
    if not len(ys): return None, im.size
    segs, s = [], ys[0]
    for g in np.where(np.diff(ys) > 25)[0]:
        segs.append((s, ys[g])); s = ys[g + 1]
    segs.append((s, ys[-1]))
    # 앞면 카드는 «세로로 가장 긴 덩어리 중 첫 번째». 뒷면(QR·스탯)은 그 아래에 따로 잡힌다.
    segs = [(u, v) for u, v in segs if v - u > 300]
    if not segs: return None, im.size
    u, v = segs[0]
    xs = np.where(w[u:v].mean(axis=0) > 0.02)[0]
    card = im.crop((xs.min(), u, xs.max(), v))
    return card, card.size
 
 
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('args', nargs='+', help='<스샷> <키> 쌍을 이어서')
    ap.add_argument('-q', type=int, default=40)
    ap.add_argument('--write', action='store_true')
    a = ap.parse_args()
    if len(a.args) % 2:
        print('  ✗ <스샷> <키> 는 짝으로 줘야 한다'); return
 
    pairs = list(zip(a.args[0::2], a.args[1::2]))
    s = io.open(HTML, encoding='utf-8').read()
    i = s.index('const TAGIMG={'); j = s.index('\n};', i)
    ent = re.findall(r'"([^"]+)":"([^"]+)"', s[i:j])
    have = {k for k, _ in ent}
 
    made = {}
    for path, key in pairs:
        if key not in have:
            print('  ✗ %s — TAGIMG 에 없는 키다. 오타인지 볼 것' % key); continue
        card, size = find_card(path)
        if card is None:
            print('  ✗ %s — 카드를 못 찾았다 (%s)' % (key, os.path.basename(path))); continue
        r = size[0] / size[1]
        if not (0.50 < r < 0.63):
            print('  ✗ %s — 찾은 영역 비율이 카드 같지 않다 %dx%d (%.2f)' % (key, size[0], size[1], r)); continue
        d = enc(crop_art(card), a.q); q = a.q
        while len(d) > MAXB and q > 8:
            q -= 4; d = enc(crop_art(card), q)
        made[key] = (d, card, size, q)
        print('  ○ %-16s 카드 %dx%d → %dx%d q%d %.2fKB' % (key, size[0], size[1], OUT[0], OUT[1], q, len(d) / 1024))
 
    if not made:
        print('넣을 것이 없다'); return
    if not a.write:
        print('\n미리보기만 했다. 적용하려면 --write'); return
 
    os.makedirs(KEEP, exist_ok=True)
    for key, (d, card, _, _) in made.items():
        card.save(os.path.join(KEEP, key + '.png'))       # 원본을 남겨 둔다
    out = [(k, made[k][0] if k in made else base64.b64decode(v)) for k, v in ent]
    body = ',\n'.join('"%s":"%s"' % (k, base64.b64encode(d).decode()) for k, d in out)
    s = s[:i] + 'const TAGIMG={\n' + body + s[j:]
    with io.open(HTML, 'w', encoding='utf-8') as f:
        f.write(s)
    chk = io.open(HTML, encoding='utf-8').read()
    k1 = chk.index('const TAGIMG={'); k2 = chk.index('\n};', k1)
    print('\n%d장 넣었다. 되읽기: TAGIMG %d키 · 파일 %.0fKB · 원본은 art_in/ 에 남겼다'
          % (len(made), len(re.findall(r'"[^"]+":"', chk[k1:k2])), len(chk.encode()) / 1024))
 
 
if __name__ == '__main__':
    main()