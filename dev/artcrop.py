#!/usr/bin/env python3
"""artcrop.py — ★4 이하 아트를 «카드 전체» 에서 «그림만» 으로 다시 자른다.

v1.78~2.2.0 의 저성급 아트는 **카드를 통째로** 담고 있었다 (흰 테두리 · 이름띠 ·
Pokémon 글자까지). 그런데 ★5·★6 아트는 **그림만** 잘라 넣은 것이라
매칭 그리드에서 위 줄(상대)만 «크롭 안 된 태그» 로 보였다 (2026-08-14 잭 지적).

카드 판형은 전 성급이 같아 비율 하나로 처리된다:
  세로 **10.5%~63%** 가 그림 영역이다 (v2.4.0 에서 조정).
  v2.3.0 은 5.5%~65.5% 였는데 **위쪽에 카드 흰 테두리와 검은 액자 호가 남았다** (잭 지적) —
  카드가 둥근 모서리라 크롭 폭(가운데 84:149)에서는 액자가 10% 근처까지 내려온다.
  13% 까지 내리면 가디안·뜨아거 머리가 잘려 10.5% 로 정했다.
  아래 63% 아래는 별·이름·에너지 띠다. 가로는 출력 비율에 맞춰 가운데를 남긴다.

  python3 dev/artcrop.py --src ../art_in --src ../art2            # 미리보기
  python3 dev/artcrop.py --src ../art_in --src ../art2 --write    # 적용

**원본 크롭이 있으면 원본에서 자른다.** 없으면 **기존 아트 파일**에서 자르는데,
이미 84x149 로 줄여 둔 그림을 다시 잘라 늘리는 것이라 **눈에 띄게 흐려진다** —
그런 키는 실행할 때마다 이름을 찍어 주니 도감을 다시 찍어 넣는 편이 낫다.

⚠ v3.51.0 부터 아트는 `docs/art/<키>.webp` 파일이다 (`index.html` 에는 키 목록만).
  기존 키의 그림만 바뀌므로 **HTML 은 건드리지 않는다.**
⚠⚠ **버전을 반드시 올릴 것** — `?v=` 가 그대로면 서비스워커가 옛 그림을 계속 준다.
"""
import io, os, re, argparse, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import artstore

LOWRE = artstore.LOWRE
OUT = (84, 149)          # 재압축(v1.80.0) 규격 그대로
TOP, BOT = 0.105, 0.630   # 카드에서 그림이 차지하는 세로 구간
PREV_TOP, PREV_BOT = 0.055, 0.655   # v2.3.0 이 이미 잘라 둔 구간 (기존본 되잘림 보정용)
MAXB = 3900


def crop_art(im, pre=False):
    """pre=True 면 «이미 PREV 구간으로 잘린 그림» 이므로 새 구간을 그 안의 상대 좌표로 환산한다.
       안 그러면 이미 자른 것을 또 같은 비율로 잘라 엉뚱한 데가 남는다.
       ⚠ 이 경로는 **한 번만** 맞다 — 원본 없는 키를 두 번 돌리면 계속 파고든다."""
    W, H = im.size
    if pre:
        span = PREV_BOT - PREV_TOP
        t = (TOP - PREV_TOP) / span
        b = (BOT - PREV_TOP) / span
        y0, y1 = int(H * t), int(H * b)
        h = y1 - y0
        w = min(W, int(h * OUT[0] / OUT[1]))
    else:
        y0, y1 = int(H * TOP), int(H * BOT)
        h = y1 - y0
        w = min(W, int(h * OUT[0] / OUT[1]))
    x0 = max(0, W // 2 - w // 2)
    return im.crop((x0, y0, x0 + w, y1))


def enc(im, q):
    b = io.BytesIO()
    im.resize(OUT, Image.LANCZOS).save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', action='append', default=[])
    ap.add_argument('-q', type=int, default=40)
    ap.add_argument('--write', action='store_true')
    a = ap.parse_args()

    src = {}
    for d in a.src:
        if os.path.isdir(d):
            for fn in os.listdir(d):
                if re.search(r'\.(png|jpe?g|webp)$', fn, re.I):
                    src[artstore.nfc(re.sub(r'\.\w+$', '', fn))] = os.path.join(d, fn)

    keys = [k for k in artstore.keys() if LOWRE.match(k)]
    before = sum(artstore.size(k) for k in keys)

    out, soft, gone = [], [], []
    for k in keys:
        pre = k not in src
        if pre:
            raw = artstore.read(k)
            if raw is None:
                gone.append(k); continue
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            soft.append(k)
        else:
            im = Image.open(src[k]).convert('RGB')
        d = enc(crop_art(im, pre), a.q)
        q = a.q
        while len(d) > MAXB and q > 8:
            q -= 4; d = enc(crop_art(im, pre), q)
        out.append((k, d))

    if not out:
        print('처리할 것이 없다.'); return
    tot = sum(len(d) for _, d in out)
    print('★4 이하 %d장 다시 자름 · 평균 %.2fKB · 최대 %.2fKB'
          % (len(out), tot / len(out) / 1024, max(len(d) for _, d in out) / 1024))
    print('아트  ★4 이하 %.0fKB → %.0fKB' % (before / 1024, tot / 1024))
    if soft:
        print('  ★ 원본이 없어 기존 아트에서 자름 (흐려짐) — %s' % ' · '.join(soft))
    if gone:
        print('  ★ 목록에 있는데 파일이 없다 — %s' % ' · '.join(gone))

    if not a.write:
        print('\n미리보기만 했다. 적용하려면 --write')
        return
    for k, d in out:
        artstore.write(k, d)
    print('\n%d장 덮어썼다 (목록은 그대로 — HTML 은 안 건드렸다).' % len(out))
    artstore.report()


if __name__ == '__main__':
    main()
