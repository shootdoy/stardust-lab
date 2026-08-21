#!/usr/bin/env python3
"""recompress.py — 내장 이미지를 통째로 다시 압축한다.

★4 이하 아트 90장이 들어오면서 파일이 911KB 가 됐다 (v1.79.0).
인앱 미리보기는 «490KB 안정 · 576KB 경계 · 657KB 실패» 라 이대로는 미리보기가 안 열린다.

이 스크립트가 건드리는 것
  1. TAGIMG ★4 이하 90장 — 세로. 폭을 줄이고 품질을 낮춘다 (가장 큰 덩어리)
  2. TAGIMG ★6·★5·공통 56장 — 가로. 배율로 줄인다
  3. TYPEICON 18개 — PNG → webp. 44px 유지 (표시 14px 의 3.1배라 줄일 이유 없음)
  4. 애플터치아이콘 152x152 PNG → webp

**원본을 쓸 수 있으면 원본에서 다시 뽑는다.** `--src` 로 크롭 폴더를 주면
그 안에 있는 키는 원본에서, 없는 키는 내장 webp 에서 재인코딩한다.
내장본에서 다시 뽑으면 손실이 겹치므로 원본 폴더를 주는 편이 낫다.

  python3 dev/recompress.py --src ../art_in --src ../art2            # 미리보기
  python3 dev/recompress.py --src ../art_in --src ../art2 --write    # 적용

**주의 — `--write` 를 `head` 로 파이프하지 말 것.** SIGPIPE 로 쓰기 전에 죽는다
(2026-08-14 artgen 에서 실제로 당했다). 끝나면 반드시 키 수와 파일 크기를 되읽어 확인한다.
"""
import io, os, re, sys, math, base64, argparse
from PIL import Image

HTML = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'index.html')
LOWRE = re.compile(r'^\d-[1-4]-')


def hb(key, n):
    """HTML 안에서 이 항목이 차지하는 바이트 (키 + base64 + 따옴표·쉼표)"""
    return len(key) + math.ceil(n / 3) * 4 + 6


def enc(im, w, h, q, alpha=False):
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
                src[re.sub(r'\.\w+$', '', fn)] = os.path.join(d, fn)

    s = io.open(HTML, encoding='utf-8').read()
    before = len(s.encode())

    i = s.index('const TAGIMG={'); j = s.index('\n};', i)
    ent = re.findall(r'"([^"]+)":"([^"]+)"', s[i:j])
    old_tag = sum(hb(k, len(base64.b64decode(v))) for k, v in ent)

    def source(key, b64):
        if key in src:
            return Image.open(src[key]).convert('RGB'), '원본'
        return Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB'), '내장'

    out, from_src, kept = [], 0, 0
    for k, v in ent:
        if a.only_low and not LOWRE.match(k):
            out.append((k, base64.b64decode(v))); kept += 1; continue
        im, how = source(k, v)
        from_src += (how == '원본')
        if LOWRE.match(k):
            w = a.low_w; h = round(w * 192 / 108); q = a.low_q
        else:
            w = max(60, round(im.width * a.hi_scale)); h = round(w * im.height / im.width); q = a.hi_q
        out.append((k, enc(im, w, h, q)))
    new_tag = sum(hb(k, len(d)) for k, d in out)

    # 타입 아이콘 (알파 유지)
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
    after = before - (old_tag - new_tag) - (old_ti - new_ti) - icon_gain
    if a.only_low:
        print('★4 이하만 재압축 — ★6·★5·공통 %d장과 아이콘은 원본 그대로 통과' % kept)
    print('원본에서 재인코딩 %d장 · 내장에서 %d장' % (from_src, len(ent) - kept - from_src))
    print('  ★4 이하 90장  %dx%d q%d  → %5.0fKB (webp)' % (a.low_w, round(a.low_w * 192 / 108), a.low_q, lowb / 1024))
    if not a.only_low:
        print('  ★6·★5·공통 56장  배율%.2f q%d → %5.0fKB (webp)' % (a.hi_scale, a.hi_q, hib / 1024))
    print('  TAGIMG  %.0fKB → %.0fKB (HTML 기준)' % (old_tag / 1024, new_tag / 1024))
    print('  TYPEICON %.0fKB → %.0fKB · 앱아이콘 -%.0fKB' % (old_ti / 1024, new_ti / 1024, icon_gain / 1024))
    print('  파일  %.0fKB → %.0fKB' % (before / 1024, after / 1024))
    lim = '안정' if after / 1024 <= 490 else ('경계' if after / 1024 <= 576 else ('위험' if after / 1024 <= 657 else '미리보기 실패'))
    print('  미리보기 판정: %s (490 안정 · 576 경계 · 657 실패)' % lim)

    if not a.write:
        print('\n미리보기만 했다. 적용하려면 --write')
        return

    body = ',\n'.join('"%s":"%s"' % (k, base64.b64encode(d).decode()) for k, d in out)
    s = s[:i] + 'const TAGIMG={\n' + body + s[j:]
    i2 = s.index('const TYPEICON='); j2 = s.index('\n};', i2)
    tibody = ',\n'.join('"%s":"%s"' % (k, base64.b64encode(d).decode()) for k, d in tiout)
    s = s[:i2] + 'const TYPEICON={\n' + tibody + s[j2:]
    if m:
        s = s.replace('data:image/png;base64,' + m.group(1), 'data:image/webp;base64,' + newicon)
    with io.open(HTML, 'w', encoding='utf-8') as f:
        f.write(s)
    chk = io.open(HTML, encoding='utf-8').read()
    k1 = chk.index('const TAGIMG={'); k2 = chk.index('\n};', k1)
    print('\n적용했다. 되읽기: TAGIMG %d키 · 파일 %.0fKB'
          % (len(re.findall(r'"[^"]+":"', chk[k1:k2])), len(chk.encode()) / 1024))


if __name__ == '__main__':
    main()
