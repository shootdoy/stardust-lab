#!/usr/bin/env python3
"""artgen.py — 태그 아트 이미지를 `docs/art/<키>.webp` 로 넣는다.

규격은 **카드 생김새를 따른다** (잭 지정 2026-08-13):
  ★6·★5·공통 = 가로 카드 → webp 144x81
  ★4 이하    = 세로 카드 → webp 108x192
  둘 다 장당 3.9KB 이하.

쓰는 법
  1) 이미지를 한 폴더에 모은다. 파일명은 **`<탄>-<성급>-<태그이름>.png`** (예: `2-4-마스카나.png`).
     탄은 `1`·`2`·`공통`, 성급은 `6`~`2` (공통은 `R`/`S`).
     **같은 포켓몬이라도 성급마다 그림이 다르므로 성급을 반드시 넣는다.**
     이름은 `POOL`/`SUBS` 의 이름과 **정확히 같아야** 한다.
  2) python3 dev/artgen.py <이미지폴더>            # 미리보기만
     python3 dev/artgen.py <이미지폴더> --write    # 실제로 넣기

동작
  - 원본 비율을 지키며 목표 크기로 **가운데를 채워 자른다**(cover).
  - 품질을 낮춰 가며 목표 용량(기본 3.9KB) 안에 들어오게 맞춘다.
  - `SUBS`/`POOL` 에 없는 이름이면 **넣지 않고 알린다** — 오타로 죽은 키가 쌓이는 걸 막는다.
  - 이미 있는 키는 건너뛴다 (`--force` 로 덮어쓰기).

⚠ **다섯 도구 중 `index.html` 을 함께 고치는 것은 이것뿐이다.** 새 키가 늘면
  `TAGART` 목록에도 들어가야 CSS 규칙이 생긴다 (`artstore.add_keys`).
  기존 키의 그림만 바꾸는 재크롭·재압축은 파일만 덮어쓴다.
⚠ 키는 목록 **끝에** 붙는다. 중간에 끼우면 `.aNN` 번호가 밀려 엉뚱한 그림이 뜬다.
⚠ 아트를 넣으면 `dev/sync.js` 의 **`TAGIMG_N`·`LOW_N`** 도 함께 올려야 검사가 통과한다.
⚠⚠ **버전을 반드시 올릴 것** — `?v=` 가 그대로면 서비스워커가 옛 그림을 계속 준다.
"""
import sys, os, re, io, argparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import artstore

LAND = (144, 81)          # ★6·★5·공통 — 가로 카드 (기존 자산 규격 중 큰 쪽)
PORT = (108, 192)         # ★4 이하  — 세로 카드


def target(rank):
    """성급으로 목표 크기를 고른다. 공통(R/S)은 가로다."""
    return PORT if rank in ('4', '3', '2', '1') else LAND
MAX_BYTES = 3900          # 기존 최대치(3.86KB)를 넘지 않게


def known_names(src):
    """POOL(MEASURED·COMMON) 과 SUBS 계열에서 (탄, 성급, 이름) 을 긁는다."""
    names = set()
    # 저성급 배열: ['이름', '1-2-026', ...]
    for arr, rk in [('LOW4','4'), ('LOW3','3'), ('LOW2','2'),
                    ('LOW4_2','4'), ('LOW3_2','3'), ('LOW2_2','2')]:
        i = src.find('const %s=[' % arr)
        if i < 0:
            continue
        j = src.index('\n];', i)
        for nm, code in re.findall(r"\['([^']+)',\s*'(\d-\d-\d{3})'", src[i:j]):
            names.add((code.split('-')[1], rk, nm))
    # POOL — MEASURED 는 ['1','6','뮤츠','1-1-001',...] 꼴, COMMON 은 ['R','피카츄','R-1-1',...] 꼴
    i = src.find('const MEASURED=[')
    if i >= 0:
        j = src.index('\n];', i)
        for st, rk, nm in re.findall(r"\['(\d)',\s*'(\d)',\s*'([^']+)'", src[i:j]):
            names.add((st, rk, nm))
    i = src.find('const COMMON=[')
    if i >= 0:
        j = src.index('\n];', i)
        for rk, nm in re.findall(r"\['([RS])',\s*'([^']+)'", src[i:j]):
            names.add(('공통', rk, nm))
    return names


def encode(path, rank):
    from PIL import Image
    W, H = target(rank)
    im = Image.open(path).convert('RGB')
    # cover 크롭 — 비율을 지키며 가운데를 채운다
    sr, tr = im.width / im.height, W / H
    if sr > tr:
        nw = int(im.height * tr)
        im = im.crop(((im.width - nw) // 2, 0, (im.width + nw) // 2, im.height))
    else:
        nh = int(im.width / tr)
        im = im.crop((0, (im.height - nh) // 2, im.width, (im.height + nh) // 2))
    im = im.resize((W, H), Image.LANCZOS)
    for q in (80, 70, 62, 55, 48, 40, 33, 27, 22):
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= MAX_BYTES:
            return buf.getvalue(), q
    return buf.getvalue(), q


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folder')
    ap.add_argument('--write', action='store_true')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()

    src = artstore.load_html()
    have = set(artstore.keys(src))
    okmap = {'%s-%s-%s' % (s, r, n) for s, r, n in known_names(src)}

    add, skip, bad = [], [], []
    for fn in sorted(os.listdir(a.folder)):
        if not re.search(r'\.(png|jpe?g|webp)$', fn, re.I):
            continue
        key = artstore.nfc(re.sub(r'\.(png|jpe?g|webp)$', '', fn, flags=re.I))
        if key not in okmap:
            bad.append(key); continue
        if key in have and not a.force:
            skip.append(key); continue
        data, q = encode(os.path.join(a.folder, fn), key.split('-')[1])
        add.append((key, data, len(data), q))

    for k in bad:
        print('  ✗ 이름이 데이터에 없다 — 건너뜀: %s' % k)
    if skip:
        print('  · 이미 있음 %d건 (덮어쓰려면 --force)' % len(skip))
    if not add:
        print('넣을 게 없다.'); return
    tot = sum(x[2] for x in add)
    fresh = [k for k, _, _, _ in add if k not in have]
    print('넣을 %d장 (새 키 %d · 덮어쓰기 %d) · 평균 %.2fKB · 합계 %.0fKB'
          % (len(add), len(fresh), len(add) - len(fresh), tot / len(add) / 1024, tot / 1024))
    for k, _, n, q in add[:5]:
        print('   %s  %.2fKB q%d  %dx%d' % ((k, n / 1024, q) + target(k.split('-')[1])))
    if len(add) > 5:
        print('   … 외 %d장' % (len(add) - 5))

    if not a.write:
        print('\n미리보기만 했다. 실제로 넣으려면 --write')
        return

    if fresh:
        _, added = artstore.add_keys(fresh)     # 목록을 먼저 늘린다 — write() 가 목록을 확인한다
        print('\nTAGART 에 %d키 더했다 (끝에 붙임)' % len(added))
    for k, data, _, _ in add:
        artstore.write(k, data)
    print('아트 %d장 썼다.' % len(add))
    if fresh:
        print('  ⚠ `dev/sync.js` 의 TAGIMG_N·LOW_N 도 올릴 것 — 안 올리면 검사가 막는다')
    artstore.report()


if __name__ == '__main__':
    main()
