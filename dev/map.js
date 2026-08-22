#!/usr/bin/env node
/* map.js — `src/` 의 구획 목차를 **그때그때** 뽑아 찍는다 (v3.54.0)
 *
 * 왜 도구인가 — 목차를 문서에 베껴 적으면 낡는다. CLAUDE.md 의 «코드 구조» 표는
 * 줄 번호에 «v1.47.1 기준» 이라 적혀 있었고, v3.5x 에 이르러선 3천 판 지난 숫자였다.
 * 그래서 지도는 **적지 않고 뽑는다.**
 *
 *   node dev/map.js            전체 목차
 *   node dev/map.js style.css  한 파일만
 *   node dev/map.js --gaps     구획 없이 긴 구간만 (어디에 표시를 더할지)
 *
 * 구획 표시는 `/* ══ 이름 ══ *\/` 꼴이다. `dev/undef.js` 가 «평가»·«렌더» 마커로
 * 구간을 자르므로 **그 두 개는 이름을 바꾸지 말 것.**
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const GAP = 120;        // 이보다 긴 무표시 구간은 «길을 잃는» 구간으로 본다

const FILES = ['index.html', 'style.css', 'data.js', 'state.js', 'eval.js',
               'render.js', 'qr.js', 'dex.js', 'hist.js', 'boot.js'];

const clean = t => t.replace(/\/\*|\*\/|══|─+/g, '').trim().replace(/\s+/g, ' ');

function scan(f) {
  const lines = fs.readFileSync(path.join(SRC, f), 'utf8').split('\n');
  const marks = [];
  lines.forEach((l, i) => { if (l.includes('══')) marks.push({ line: i + 1, name: clean(l) }); });
  const pts = [1, ...marks.map(m => m.line), lines.length + 1];
  const gaps = [];
  for (let i = 0; i < pts.length - 1; i++) gaps.push({ at: pts[i], len: pts[i + 1] - pts[i] });
  return { f, lines: lines.length, marks, gaps };
}

const only = process.argv.slice(2).find(a => !a.startsWith('--'));
const gapsOnly = process.argv.includes('--gaps');
const list = (only ? [only] : FILES).filter(f => fs.existsSync(path.join(SRC, f)));

let worst = 0;
for (const f of list) {
  const r = scan(f);
  const big = r.gaps.filter(g => g.len > GAP).sort((a, b) => b.len - a.len);
  worst = Math.max(worst, big.length ? big[0].len : 0);
  if (gapsOnly) {
    if (big.length) {
      console.log(`${r.f}  ${r.lines}줄 · 구획 ${r.marks.length}개`);
      for (const g of big) {
        const nm = r.marks.find(m => m.line === g.at);
        console.log(`  ★ ${String(g.at).padStart(4)} 부터 ${String(g.len).padStart(4)}줄 무표시`
          + `   ${nm ? nm.name.slice(0, 46) : '(파일 머리)'}`);
      }
    }
    continue;
  }
  console.log(`\n── ${r.f}  ${r.lines}줄 · 구획 ${r.marks.length}개`
    + (big.length ? `  ★ 무표시 최대 ${big[0].len}줄` : ''));
  for (const m of r.marks) {
    const g = r.gaps.find(x => x.at === m.line);
    console.log(`  ${String(m.line).padStart(4)}  ${m.name.slice(0, 66)}`
      + (g && g.len > GAP ? `   ★ ${g.len}줄` : ''));
  }
}
if (gapsOnly && !worst) console.log(`구획 없이 ${GAP}줄 넘는 구간 없음`);
