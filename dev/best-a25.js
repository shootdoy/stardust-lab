// BEST-A25 재계산 — **전투태그A(★5·★6)** 용. B(★4·★5) 목록은 아직 없다 — 전 후보 56장 정확 탐욕 (50보스 전체 · 중복 없음)
// 규칙(찬스 기본값·KHP 등)이 바뀌면 이걸 돌려 const BESTA25 를 갱신한다.
const fs=require('fs'),vm=require('vm');
const s=fs.readFileSync('../docs/index.html','utf8');
const js=s.split('<script>')[1].split('</script>')[0];
const head=js.split('const KEY=')[0];
const ev=js.split('/* ══ 평가 ══ */')[1].split('/* ══ 렌더 ══ */')[0];
const test=`
/* 2026-08-14 잭 지정 — **1탄 ★5 보스를 다시 넣었다.** 40보스 전체가 기준이다.
   v1.50.1 에 «1탄→2탄 전환 중이라 1탄 ★5 는 안 잡는다» 며 뺐던 것을 되돌린 것. */
const bosses=BOSSES.slice();   // 53보스 전체 (★6 20 + ★5 30 + 레귤러 3 · v3.7.0)
console.log('기준 보스 '+bosses.length+'개 · 후보 '+POOL.length+'장 · 정확 탐욕');
/* 지표 — **① 2턴 격파한 보스 수 ② 피해 합** 순 (v3.4.0 · 잭 지정).
   v3.3.0 까지는 피해 합 하나였는데 **엔진이 «2턴 격파 우선» 이라 단조롭지 않았다** —
   좋은 카드가 늘면 더 적은 피해로 끝내서 합이 «줄어드는» 일이 있어 보존율이 100% 를 넘었다.
   격파 수는 카드가 늘어 나빠질 수 없으므로 단조롭다. 동점이 많아 피해 합을 2차로 둔다. */
const score=set=>{ owned=toBag(set); let ko=0,t=0;
  for(const b of bosses){ const q=buildSeq(b);
    if(q.ko2) ko++;
    t+=q.reduce((a,r)=>a+(r.dmg||0),0); }
  return {ko,t}; };
const better=(a,b)=> a.ko!==b.ko ? a.ko>b.ko : a.t>b.t;
const ids=POOL.map(p=>p.id), cur=[], steps=[];
let prev={ko:0,t:0};
while(cur.length<27){                          // 25 + 포화 확인용 2장
  let bi=null,bv=null;
  for(const id of ids){ if(cur.includes(id)) continue;
    const v=score(cur.concat([id])); if(!bv||better(v,bv)){bv=v;bi=id;} }
  cur.push(bi); steps.push({ko:bv.ko,t:bv.t,dko:bv.ko-prev.ko,dt:bv.t-prev.t}); prev=bv;
  process.stderr.write('\\r'+cur.length+'/27');
}
process.stderr.write('\\n');
const full=score(ids);
console.log('전체 56장 — 2턴 격파 '+full.ko+'/'+bosses.length+'보스 · 피해 합 '+Math.round(full.t));
cur.forEach((id,i)=>{
  const st=steps[i];
  console.log(String(i+1).padStart(2)+'. '+id.padEnd(16)
    +' 2턴격파 '+String(st.ko).padStart(2)+'/'+bosses.length
    +' (+'+st.dko+')  피해 '+String(Math.round(st.t)).padStart(6)
    +' (+'+String(Math.round(st.dt)).padStart(6)+')');
});
console.log('');
console.log('BEST-A25:');
console.log(JSON.stringify(cur.slice(0,25).sort()));
`;
const sb={console,JSON,Math,Array,Set,Map,String,Object,Number,process,window:{},
  document:{getElementById:()=>null,querySelectorAll:()=>[],createElement:()=>({set textContent(v){}}),head:{appendChild(){}}},setTimeout,clearTimeout,
  localStorage:{setItem(){throw 0},getItem(){throw 0},removeItem(){throw 0}}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(head+ev+test,sb);
 