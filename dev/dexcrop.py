#!/usr/bin/env python3
"""dexcrop.py — 도감 캡처(격자 화면)에서 카드를 한 장씩 잘라낸다.

잭이 주는 캡처는 **세로 스크롤 도감**이라 한 화면에 카드가 2열 x 여러 행으로 보인다.
카드 테두리가 밝은 회백색이고 배경이 짙어서, **밝기 투영으로 격자를 찾아낸다** —
좌표를 손으로 박지 않으므로 기기·스크롤 위치가 달라도 동작한다.

쓰는 법
  python3 dev/dexcrop.py <캡처.png> <이름1> <이름2> ...      # 미리보기
  python3 dev/dexcrop.py <캡처.png> <이름...> --out <폴더>    # 실제로 저장

  이름은 **왼→오, 위→아래 순서**로 준다 (도감 순서와 같다).
  파일명 규칙은 artgen.py 과 같은 `<탄>-<성급>-<이름>` 이다.
    python3 dev/dexcrop.py cap.png 1-4-고릴타 1-4-에이스번 ... --out /tmp/art

주의
  - **잘린 카드 수와 준 이름 수가 다르면 멈춘다.** 화면 위아래에 반쯤 걸친 카드가 있으면
    개수가 어긋나므로, 그때는 캡처를 다시 찍거나 `--rows` 로 쓸 행을 골라야 한다.
  - 자른 뒤 눈으로 한 장은 확인할 것. 순서가 밀리면 **전부 엉뚱한 이름이 붙는다.**
"""
import sys, os, argparse

def runs(v, th, minlen):
    out, s = [], None
    for i, x in enumerate(v):
        if x > th and s is None:
            s = i
        elif x <= th and s is not None:
            if i - s >= minlen:
                out.append((s, i))
            s = None
    if s is not None and len(v) - s >= minlen:
        out.append((s, len(v)))
    return out

def find_grid(path):
    from PIL import Image
    import numpy as np
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    lum = a.mean(axis=2)
    mask = lum > 150
    Wpx, Hpx = im.size
    # 카드 하나는 화면 너비의 1/4 은 넘는다 — 그보다 좁은 덩어리(아이콘·글자)는 버린다
    cols = [c for c in runs(mask.sum(axis=0), Hpx * 0.02, int(Wpx * 0.18))]
    rows = [r for r in runs(mask.sum(axis=1), Wpx * 0.03, int(Hpx * 0.10))]
    return im, cols, rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot')
    ap.add_argument('names', nargs='*')
    ap.add_argument('--out')
    ap.add_argument('--rows', help='쓸 행 번호, 0부터. 예 "1,2,3"')
    a = ap.parse_args()

    im, cols, rows = find_grid(a.shot)
    if a.rows:
        keep = [int(x) for x in a.rows.split(',')]
        rows = [rows[i] for i in keep if i < len(rows)]
    print('찾은 격자: %d열 x %d행 = %d장' % (len(cols), len(rows), len(cols) * len(rows)))
    for i, (x0, x1) in enumerate(cols):
        print('   열%d  x %d~%d (%dpx)' % (i, x0, x1, x1 - x0))
    for i, (y0, y1) in enumerate(rows):
        print('   행%d  y %d~%d (%dpx)' % (i, y0, y1, y1 - y0))

    boxes = [(x0, y0, x1, y1) for (y0, y1) in rows for (x0, x1) in cols]
    if not a.names:
        print('\n이름을 안 줬다. 개수만 확인했다.')
        return
    if len(a.names) != len(boxes):
        print('\n★ 잘린 카드 %d장 ≠ 준 이름 %d개 — 멈춘다.' % (len(boxes), len(a.names)))
        print('  화면에 반쯤 걸친 카드가 있으면 --rows 로 쓸 행만 고를 것.')
        sys.exit(1)
    if not a.out:
        for nm, b in zip(a.names, boxes):
            print('   %-18s %s' % (nm, b))
        print('\n미리보기만 했다. 저장하려면 --out <폴더>')
        return
    os.makedirs(a.out, exist_ok=True)
    for nm, b in zip(a.names, boxes):
        im.crop(b).save(os.path.join(a.out, nm + '.png'))
    print('\n%s 에 %d장 저장했다. 한 장은 눈으로 확인하고 artgen.py 로 넣을 것.'
          % (a.out, len(boxes)))

if __name__ == '__main__':
    main()
