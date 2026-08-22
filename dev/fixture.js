// 기준 컬렉션(1탄 ★6 10장)으로 20보스 추천을 한 번에 확인
const fs=require('fs'),vm=require('vm');
const s=fs.readFileSync('../release/index.html','utf8');
const js=s.split('<script>')[1].split('</script>')[0];
const head=js.split('const KEY=')[0];
const ev=js.split('/* ══ 평가 ══ */')[1].split('/* ══ 렌더 ══ */')[0];
const test=`
owned=FIXTURE_OWNED();   // 잭의 실제 컬렉션 26장 (앱 초기값은 0장)
console.log('기준 컬렉션 '+owned.total+'장 — '
  +POOL.filter(p=>owned.has(p.id)).map(p=>p.n).join(', '));
console.log('');
const sum=l=>Math.round(l.reduce((a,r)=>a+(r.dmg||0),0));
let gimBad=0, exBad=0, survBad=0, ko2=0;
let risky=0;
{
  BOSSES.forEach(b=>{
    const q=buildSeq(b);
    if(q.risky) risky++;
    if(q.ko2) ko2++;
    const g=q.map(r=>(r.move&&r.move.tagx)||(r.mega?'메가진화':null)).filter(Boolean);
    if(g.length!==new Set(g).size) gimBad++;
    for(let i=1;i<q.length;i++) if(!q[i].rand&&!q[i-1].rand&&q[i].c.id===q[i-1].c.id) exBad++;
    const uniq=[...new Set(q.filter(r=>!r.rand).map(r=>r.c.id))].length;
    // 2턴에 끝나는 계획이면 2대만 버티면 된다. 3턴째 태그는 예비라 검사에서 뺀다
    const need=q.ko2?2:3;
    q.filter(r=>!r.rand).forEach((r,i)=>{ if(q.ko2&&i===2) return;
      if(!survivesN(r.c,b,need)) survBad++; });
    console.log('  '+(b.s+'탄 '+b.n).padEnd(12)
      +q.map(r=>r.rand?'랜덤':r.c.n).join(' → ').padEnd(34)
      +String(sum(q)).padStart(5)+'  슬롯'+uniq+'/3');
  });
  console.log('');
}
console.log('기믹 중복 '+gimBad+'건 · 탈진 위반 '+exBad+'건 · 생존 위반 '+survBad+'건 · 후보 부족 '+risky+'보스 · 2턴격파 '+ko2+'보스');
globalThis.__bad = gimBad+exBad+survBad;   // 후보 부족은 위반이 아니라 정보라 뺀다
`;
const sb={console,JSON,Math,Array,Set,Map,String,Object,Number,window:{},
  document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({set textContent(v){}}),head:{appendChild(){}}},setTimeout,clearTimeout,
  localStorage:{setItem(){throw 0},getItem(){throw 0},removeItem(){throw 0}}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(head+ev+test,sb);
process.exit(sb.__bad ? 1 : 0);
 