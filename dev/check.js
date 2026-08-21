#!/usr/bin/env node
/* check.js — 편집 검증 하네스. 다섯 검사를 한 번에 돌리고 종료 코드로 답한다.
 *
 *   node dev/check.js          전부
 *   node dev/check.js --quick  undef · interact 만 (CLAUDE.md 의 최소 절차)
 *
 * 왜 필요한가 — 이 파일을 고치다 **두 번 코드를 날렸다.** 둘 다 문법 검사는 통과했고,
 * 정의가 사라진 것은 실행해야 터졌다. 그래서 «편집 후 undef → interact» 가 규칙인데
 * 사람이 잊는다. 훅이 이 스크립트를 부르므로 잊을 수가 없게 된다.
 *
 * ⚠ 검사를 추가하면 **일부러 망가뜨려 잡히는지 확인할 것.** 통과만 하는 검사는 검사가 아니다.
 *   undef · interact · fixture 는 2026-08-22 사보타주로 확인했다 (셋 다 exit 1).
 *
 * ⚠ 여기 없는 것 — catch.js(포획 표본 분석) · damage.js(데미지 적합) ·
 *   best-*.js(재계산 10초) 는 편집 검증이 아니다. 데이터나 규칙을 바꿨을 때 따로 돌린다.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const QUICK = process.argv.includes('--quick');

/* 순서는 CLAUDE.md 의 절차를 따른다 — 정의 누락(undef)을 먼저 잡아야
   interact 의 «치명적» 이 무엇 때문인지 헷갈리지 않는다. */
const JOBS = [
  { id: 'undef',    quick: true,  why: '호출되나 정의 없는 식별자' },
  { id: 'interact', quick: true,  why: '가짜 DOM 에 올려 모든 클릭 발화' },
  { id: 'fixture',  quick: false, why: '기준 컬렉션으로 규칙 위반 검사' },
  { id: 'glyph',    quick: false, why: '제목이 서브셋 폰트에 없는 글자를 쓰는지' },
  { id: 'sync',     quick: false, why: '문서에 적힌 내용이 실제 코드에 있는지' },
];

/* 각 스크립트가 마지막에 찍는 «결론 한 줄» 을 요약으로 쓴다.
   못 찾으면 마지막 비어 있지 않은 줄을 그대로 보여 준다 — 형식이 바뀌어도 조용히 죽지 않게. */
const GIST = {
  undef:    /호출되나 정의 없음:.*/,
  interact: /오류: .*/,
  fixture:  /기믹 중복 .*/,
  glyph:    /제목 글리프.*|★.*/,
  sync:     /문서와 코드가 일치한다|★.*/,
};

const jobs = JOBS.filter(j => !QUICK || j.quick);
const t0 = Date.now();
const failed = [];

console.log(`\n  index.html 편집 검증${QUICK ? ' (quick)' : ''}\n`);

for (const j of jobs) {
  const r = spawnSync('node', [path.join(__dirname, `${j.id}.js`)], {
    cwd: __dirname,                 // undef·interact·fixture·best-* 가 상대경로를 쓴다
    encoding: 'utf8',
    timeout: 120000,
  });

  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split('\n').filter(s => s.trim());

  // spawn 자체가 실패했거나(파일 없음·타임아웃) 스크립트가 non-zero 로 끝났으면 실패다
  const bad = r.error != null || r.status !== 0;

  /* 터져서 죽은 경우에는 «XxxError: …» 를 먼저 찾는다 — 마지막 줄을 쓰면
     스택의 «at node:internal/…» 이 잡혀 원인이 안 보인다. */
  const err  = bad && lines.find(l => /^\s*\w*Error\b/.test(l));
  const hit  = lines.map(l => (GIST[j.id].exec(l) || [])[0]).filter(Boolean).pop();
  const gist = err || hit || lines[lines.length - 1] || '(출력 없음)';
  if (bad) failed.push({ ...j, out });

  console.log(`  ${bad ? '★' : 'OK'}  ${j.id.padEnd(9)} ${gist.slice(0, 90)}`);
  if (r.error) console.log(`      실행 못 함: ${r.error.message}`);
}

const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log();

if (!failed.length) {
  console.log(`  ── ${jobs.length}종 통과 · ${secs}s\n`);
  process.exit(0);
}

/* 실패한 것만 전체 출력을 다시 보여 준다 — 요약 한 줄로는 원인을 못 찾는다. */
for (const f of failed) {
  console.log(`\n  ─── ${f.id}.js — ${f.why}\n`);
  console.log(f.out.split('\n').map(l => '  │ ' + l).join('\n'));
}
console.log(`\n  ── ${failed.length}종 실패 (${failed.map(f => f.id).join(' · ')}) · ${secs}s\n`);
process.exit(1);
