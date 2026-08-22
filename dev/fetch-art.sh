#!/usr/bin/env bash
# fetch-art.sh — 공식 사이트에서 카드 이미지 원본을 받아 art_src/ 에 «키» 이름으로 둔다.
#
#   bash dev/fetch-art.sh            이미 있는 파일은 건너뛴다
#   bash dev/fetch-art.sh --force    다시 받아 덮어쓴다
#   bash dev/fetch-art.sh --list     받을 목록만 보여준다 (내려받지 않음)
#
# ⚠⚠ **`art_src/` 는 `.gitignore` 대상이다. 원본을 저장소에 커밋하지 말 것** (2026-08-22 잭 지정).
#    공식 카드 자산을 공개 저장소로 재배포하는 셈이 되고, 이 프로젝트가 README 에 밝혀 둔
#    «비공식 팬 도구» 라는 성격과도 맞지 않는다. 저장소에는 **받는 방법만** 둔다 —
#    `docs/`·`data/` 를 뺀 것과 같은 원칙이다.
#    ⚠ 뒷면에는 **카드 QR 과 시리얼성 코드**가 찍혀 있다. 이것도 공개하지 않는다.
#
# ── URL 규칙 (2026-08-22 실측)
#   https://pokemontagstar.co.kr/data/goodsImages/<기준번호><면>.png
#     <면> = 9  → 앞면 (그림)   · 96~109KB
#     <면> = 10 → 뒷면 (스탯·QR) · 63~66KB
#   모두 300x169 (16:9) PNG. 지금 내장 아트(★6 144x81)보다 크므로 원본으로 쓸 수 있다.
#
# ⚠⚠ **기준번호는 추측할 수 없다.** 대체로 연속이지만(…568 → …642) **미라이돈만
#    1776043321** 로 완전히 다른 구간이다. 규칙으로 생성하면 그 한 장을 조용히 놓친다.
#    새 태그를 더할 때는 **목록 페이지에서 번호를 직접 확인해** 아래 표에 적을 것.
#
# ── 아트로 쓸 때
#   받은 것은 «카드 전체» (흰 테두리·이름띠·에너지 배지 포함) 다. 내장 아트는 «그림만» 이라
#   그대로 넣으면 다른 칸과 모양이 어긋난다. `dev/artcrop.py` 는 **세로 판형(★4 이하) 전용**
#   이므로 가로 카드용 크롭 비율을 따로 잡아야 한다.
#   ⚠ 이 파일들을 `art_in/` 에 키 이름으로 두지 말 것 — `recompress.py` 가 원본으로 알고
#     «카드 전체» 로 다시 인코딩해 v2.4.0 의 «그림만» 크롭을 되돌린다.

set -u
cd "$(dirname "$0")/.." || exit 1

BASE_URL='https://pokemontagstar.co.kr/data/goodsImages'
OUT='art_src'

# 기준번호<TAB>키<TAB>코드   — 목록 페이지에서 확인해 추가한다
read -r -d '' TAGS <<'EOF'
1776047568	1-6-뮤츠	1-1-001
1776047577	1-6-뮤	1-1-002
1776047584	1-6-자시안	1-1-003
1776047593	1-6-자마젠타	1-1-004
1776047604	1-6-마기라스	1-1-005
1776047614	1-6-메타그로스	1-1-006
1776043321	1-6-미라이돈	1-1-007
1776047642	1-6-이상해꽃	1-1-008
1776047634	1-6-리자몽	1-1-009
1776047626	1-6-거북왕	1-1-010
EOF

FORCE=0; LIST=0
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    --list)  LIST=1 ;;
    *) echo "모르는 옵션: $a" >&2; exit 2 ;;
  esac
done

if [ "$LIST" = 1 ]; then
  printf '%s\n' "$TAGS" | while IFS=$'\t' read -r n key code; do
    [ -n "$n" ] || continue
    printf '  %-12s %-14s %s\n' "$n" "$key" "$code"
  done
  printf '  총 %s종 (앞면+뒷면 = %s장)\n' \
    "$(printf '%s\n' "$TAGS" | grep -c .)" "$(( $(printf '%s\n' "$TAGS" | grep -c .) * 2 ))"
  exit 0
fi

mkdir -p "$OUT" || exit 1
got=0; skip=0; fail=0

printf '%s\n' "$TAGS" | while IFS=$'\t' read -r n key code; do
  [ -n "$n" ] || continue
  for pair in "9:앞" "10:뒤"; do
    suf="${pair%%:*}"; face="${pair##*:}"
    dst="$OUT/$key-$face.png"
    if [ -s "$dst" ] && [ "$FORCE" = 0 ]; then
      echo "  건너뜀  $key-$face"
      continue
    fi
    tmp="$dst.part"
    hc=$(curl -sSL --max-time 30 -o "$tmp" -w '%{http_code}' "$BASE_URL/$n$suf.png")
    if [ "$hc" != "200" ] || [ ! -s "$tmp" ]; then
      rm -f "$tmp"; echo "  ★ 실패   $key-$face (HTTP $hc)"; continue
    fi
    # PNG 인지 확인한다 — 오류 페이지를 200 으로 주는 경우가 있다
    if ! file -b "$tmp" | grep -q '^PNG image'; then
      rm -f "$tmp"; echo "  ★ PNG 아님 $key-$face"; continue
    fi
    mv "$tmp" "$dst"
    printf '  받음    %-16s %s\n' "$key-$face" "$(file -b "$dst" | grep -oE '[0-9]+ x [0-9]+')"
  done
done

echo
echo "  → $OUT/ ($(ls "$OUT" 2>/dev/null | wc -l | tr -d ' ')개 · $(du -sh "$OUT" 2>/dev/null | cut -f1))"
echo "  ⚠ art_src/ 는 커밋하지 않는다 (.gitignore)"
