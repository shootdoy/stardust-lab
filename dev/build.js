#!/usr/bin/env node
/* build.js — `src/` 를 이어 붙여 `docs/index.html` 을 만든다 (v3.52.0)
 *
 * 왜 나눴나 — 4,776줄 한 파일은 편집이 불편했다. CSS 923줄 중 886줄이 구획 표시 없이
 * 이어졌고 마크업 568줄에는 표시가 아예 없었다. 이제 소스는 10개로 나뉘고,
 * **배포물은 그대로 한 파일이다** — 로딩을 조금도 바꾸지 않으려는 것이다.
 *
 * 단일 파일로 갔던 것(v3.48.1)은 모바일로 작업하던 때의 제약이었다. PC 작업으로 옮겼으므로
 * 그 근거는 사라졌다 (2026-08-22 잭 확인). 다만 «두 벌이 어긋난다» 는 위험은 그대로이므로
 * 아래 세 겹으로 막는다.
 *
 * ⚠⚠ **`docs/index.html` 을 손으로 고치지 말 것. 생성물이다.**
 *   ① 훅이 편집마다 이 스크립트를 부른다 (`.claude/settings.json`)
 *   ② 손으로 고친 흔적이 보이면 **덮어쓰지 않고 멈춘다** (아래 `hand-edited` 판정) —
 *      말없이 덮어쓰면 그 편집이 사라진다. 이 저장소는 그런 사고를 두 번 겪었다
 *   ③ `dev/sync.js` 가 다시 빌드해 생성물과 대조한다 — 어긋나면 검사가 막는다
 *
 * ⚠ 이어 붙이기만 한다. 변환·압축·모듈화를 넣지 말 것 —
 *   JS 가 한 스코프를 공유하고 **정의 순서에 의존**한다 (`class Bag` 은 호이스팅되지 않아
 *   `BEST25` 보다 앞이어야 한다). 아래 ORDER 가 그 순서의 정본이다.
 *
 * ⚠ 파일을 더 나누거나 합칠 때는 ORDER 만 고치면 된다. 다른 곳은 손댈 필요가 없다.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(ROOT, 'docs', 'index.html');

/* JS 를 이어 붙이는 순서 — **바꾸면 앱이 깨진다** (위 주석 참고) */
const ORDER = [
  'data.js',      // CHART · MEASURED · POOL · BOSSES · TAGART · BEST25 · MEGA · 도감
  'state.js',     // 저장·불러오기 · Bag · owned/dex · 모드·분류
  'eval.js',      // 데미지·상성·로테이션 탐색 (`/* ══ 평가 ══ */`)
  'render.js',    // 화면 그리기 (`/* ══ 렌더 ══ */`)
  'qr.js',        // 트레이너 ID · QR · 서포트 티켓 · 순위
  'dex.js',       // 수집 탭 · 전투 분류 · 뷰 전환 · 버전·초기화
  'hist.js',      // 기록 탭 (v3.31~3.48)
  'boot.js',      // 남은 렌더 · 이벤트 바인딩 · 부팅 · 서비스워커 등록
];

const SHELL = 'index.html';   // 껍데기 + <body> 마크업 · 자리표시 두 개
const CSS   = 'style.css';
const MARK  = { style: '<!--@style-->', script: '<!--@script-->' };

/* ⚠ 던지고 끝내지 않는다 — `dev/sync.js` 가 이 모듈을 불러 다시 조립하므로,
   여기서 process.exit 하면 그 검사가 통째로 죽는다. 부르는 쪽이 잡는다. */
function read(f) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) throw new Error(`소스가 없다: src/${f}`);
  return fs.readFileSync(p, 'utf8');
}

/* 조립 — 각 소스가 개행으로 끝나므로 그대로 이어 붙이면 원래 줄 배치가 나온다. */
function assemble() {
  let out = read(SHELL);
  for (const mk of Object.values(MARK)) {
    const n = out.split(mk).length - 1;
    if (n !== 1) throw new Error(`src/${SHELL} 의 ${mk} 가 ${n}개다 (1개여야 한다)`);
  }
  out = out.replace(MARK.style,  '<style>\n' + read(CSS) + '</style>');
  out = out.replace(MARK.script, '<script>\n' + ORDER.map(read).join('') + '</script>');
  return out;
}

/* 소스 중 가장 최근에 고쳐진 시각 */
function newestSrc() {
  return [SHELL, CSS, ...ORDER]
    .map(f => fs.statSync(path.join(SRC, f)).mtimeMs)
    .reduce((a, b) => Math.max(a, b), 0);
}

function main() {
  let want;
  try { want = assemble(); }
  catch (e) { console.error('★ ' + e.message); return 2; }
  const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : null;

  if (have === want) { console.log('빌드  변화 없음 (생성물이 소스와 같다)'); return 0; }

  /* ⚠ 생성물이 소스보다 새로운데 내용이 다르면 **손으로 고친 것**이다.
     덮어쓰면 그 편집이 말없이 사라진다 — 멈추고 사람에게 넘긴다. */
  if (have !== null && fs.statSync(OUT).mtimeMs > newestSrc()) {
    console.error('★ docs/index.html 이 소스보다 새롭고 내용도 다르다 — 손으로 고쳤는가?');
    console.error('  생성물이라 다음 빌드에 지워진다. 그 편집을 src/ 로 옮긴 뒤 다시 돌릴 것.');
    console.error('  (일부러 버리려면 src/ 중 아무 파일이나 touch 한 뒤 다시 돌린다)');
    return 2;
  }
  fs.writeFileSync(OUT, want);
  const kb = n => (n / 1024).toFixed(0) + 'KB';
  console.log(`빌드  src/ 10개 → docs/index.html ${kb(Buffer.byteLength(want))}`
    + (have === null ? ' (새로 만듦)' : ` (${kb(Buffer.byteLength(have))} 에서 갱신)`));
  return 0;
}

module.exports = { assemble, ORDER, SHELL, CSS, SRC, OUT };
if (require.main === module) process.exit(main());
