// 포획 확률 분석 — `data/catch_raw.txt` 를 그대로 읽는다 (2026-08-17)
//
// **원문에 한 줄씩 덧붙이기만 하면 된다.** 형식:
//   보스이름 서브1 서브2 볼종류 겟/노겟
//   스페셜태그배틀 보스이름 볼종류 겟/노겟
//   다이맥스 보스이름 볼종류 겟/노겟     ← 또는 «보스이름 다이맥스 …»
//
// 한국 태그스타에 남은 «확률 올리는 장치» 는 둘뿐이다 (CLAUDE.md «포획 확률 조사»):
//   ① 보스를 쓰러뜨린다  ② 룰렛에서 좋은 볼에 멈춘다
// ⚠ **②는 이 실측에서 효과가 나오지 않았다** — 아래 «볼 종류» 칸을 볼 것.
//
// ⚠ 표본이 적을 때 비율만 보면 착각한다. 반드시 구간(윌슨)을 함께 볼 것.
//    실제로 27건·39건 시점에 두 번이나 반대 방향을 읽었다 (기록: CLAUDE.md).
 
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAW = path.join(__dirname, '..', 'data', 'catch_raw.txt');
 
/* 오타 교정 — 원문을 고치지 않고 여기서 흡수한다 */
const FIX = {
  '토데부기': '토대부기', '애프롱': '애프룡', '플라리곤': '플라이곤', '갈모매': '갈모메',
  '패리퍼': '페리퍼', '포푸니': '포푸니라', '누겔리온': '누겔레온', '피카추': '피카츄',
  '이브이': '에브이', '나인테일': '알로라 나인테일',
};
const BALL = /^(몬스터|슈퍼|하이퍼)(볼|벌|졸)/;   // 볼 이름 오타까지 받는다
 
/* 보스 성급은 앱 데이터에서 끌어온다. 이름이 두 성급에 걸치면 '?' —
   ⚠ **아무 쪽으로 찍어 넣지 말 것.** 메타그로스·루카리오·마기라스·잠만보가 그렇다. */
function rankTable() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const js = html.split('<script>')[1].split('</script>')[0];
  const sb = { console: { log() {} }, Math, JSON, Object, Array, Map, Set, String, Number,
    /* 앱 코드가 스타일을 붙이려 하므로 최소한의 document 를 흉내 낸다 */
    document: { createElement: () => ({}), head: { appendChild() {} }, getElementById: () => null } };
  sb.globalThis = sb;
  vm.runInNewContext(js.slice(0, js.indexOf('const KEY=')) + ';globalThis.__B=BOSSES;', sb);
  const t = {};
  sb.__B.forEach(b => { (t[b.n] = t[b.n] || new Set()).add(b.r); });
  return t;
}
const RANK = rankTable();
 
const rows = [], skipped = [];
fs.readFileSync(RAW, 'utf8').split('\n').map(s => s.trim()).filter(Boolean).forEach(line => {
  const t = line.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const last = t[t.length - 1];
  const got = /노겟$/.test(last) ? false : /겟$/.test(last) ? true : null;
  let ball = null;
  t.forEach(w => { const m = w.match(BALL); if (m) ball = m[1]; });
  if (got === null || !ball) { skipped.push(line); return; }
 
  let mode = '지역', i = 0;
  if (t[0] === '스페셜태그배틀') { mode = '스페셜'; i = 1; }
  else if (t[0] === '다이맥스') { mode = '다맥'; i = 1; }
  const raw = t[i].replace(/[0-9]$/, '');
  const boss = FIX[raw] || raw;
  if (t[i + 1] === '다이맥스') mode = '다맥';
  const set = RANK[boss];
  rows.push({ boss, rank: !set ? 'X' : set.size === 1 ? [...set][0] : '?', ball, got, mode, line });
});
 
const wilson = (k, n, z = 1.96) => {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d;
  const h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
};
const comb = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return r; };
const fisher = (a, b, c, d) => {
  const n = a + b + c + d, obs = comb(a + b, a) * comb(c + d, c); let t = 0;
  for (let x = 0; x <= a + b; x++) {
    const z = a + c - x; if (z < 0 || z > c + d) continue;
    const p = comb(a + b, x) * comb(c + d, z); if (p <= obs + 1e-9) t += p;
  }
  return t / comb(n, a + c);
};
const gk = rs => rs.filter(r => r.got).length;
const line = (lab, rs) => {
  const n = rs.length; if (!n) return;
  const k = gk(rs), [lo, hi] = wilson(k, n);
  console.log('  ' + lab.padEnd(17) + (k + '/' + n).padStart(7) + ((k / n * 100).toFixed(0) + '%').padStart(6)
    + '   ' + (lo * 100).toFixed(0) + '~' + (hi * 100).toFixed(0) + '%' + (hi - lo > 0.30 ? '  ← 넓다' : ''));
};
 
console.log('포획 표본 ' + rows.length + '건' + (skipped.length ? ' (제외 ' + skipped.length + '건)' : ''));
skipped.forEach(l => console.log('  제외: ' + l + '   ← 볼이나 결과가 없다'));
const unk = [...new Set(rows.filter(r => r.rank === 'X').map(r => r.boss))];
if (unk.length) console.log('  ⚠ 보스 목록에 없는 이름: ' + unk.join(', ') + ' — FIX 표에 넣을 것');
 
console.log('\n  ' + '구분'.padEnd(16) + '겟/판'.padStart(7) + '비율'.padStart(6) + '   95% 구간');
line('전체', rows);
console.log('');
['몬스터', '슈퍼', '하이퍼'].forEach(b => line('볼 · ' + b, rows.filter(r => r.ball === b)));
console.log('');
['6', '5', 'R', '?'].forEach(r => line('보스 ★' + r, rows.filter(v => v.rank === r)));
console.log('');
['지역', '다맥', '스페셜'].forEach(m => line('모드 · ' + m, rows.filter(r => r.mode === m)));
 
/* ⚠ 볼 배분은 보스 성급과 얽혀 있다 (하이퍼는 ★6 판에 몰린다).
   그래서 **★5 안에서만** 볼을 비교해야 한다. */
console.log('\n★5 안에서만 본 볼 비교 (얽힘 제거)');
['몬스터', '슈퍼', '하이퍼'].forEach(b => line('  ' + b, rows.filter(r => r.rank === '5' && r.ball === b)));
 
const mm = rows.filter(r => r.ball === '몬스터'), hh = rows.filter(r => r.ball === '하이퍼');
console.log('\n몬스터 vs 하이퍼  피셔 p = '
  + fisher(gk(mm), mm.length - gk(mm), gk(hh), hh.length - gk(hh)).toFixed(3)
  + '   (1 에 가까우면 «차이 없음»)');
 
const half = Math.floor(rows.length / 2);
console.log('앞 ' + half + '판 ' + gk(rows.slice(0, half)) + '겟 · 뒤 ' + (rows.length - half) + '판 ' + gk(rows.slice(half)) + '겟');
let run = 0, mx = 0;
rows.forEach(r => { if (r.got) { mx = Math.max(mx, run); run = 0; } else run++; });
mx = Math.max(mx, run);
const p = gk(rows) / rows.length;
console.log('최장 연속 실패 ' + mx + '판 · 독립 가정 기대 약 '
  + Math.round(Math.log(rows.length * p) / -Math.log(1 - p)) + '판');
 
console.log('\n⚠ 표본이 전부 «격파 성공» 이다 — «격파가 확률을 올리는가» 는 아직 못 본다.');
console.log('   격파 실패한 판의 결과를 함께 넣으면 그때 처음 비교할 수 있다.');
 