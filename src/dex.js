/* ══ 수집 기준 추천-25 (BEST-A25 의 «내가 가진 것만» 판) ──── */
const DEXBEST_N=25, DEXBEST_SHORT=38;   // 추림 폭은 목표 장수보다 넉넉해야 한다
/* 고정 BEST-A25 와 **같은 기준을 써야 한다** — 한쪽만 바꾸면 두 추천이 말없이 어긋난다.
   v3.3.0 에 1탄 ★5 를 되돌려 50보스 전체가 됐다 (잭 지정). */
const dexBossSet=()=>BOSSES.slice();
function dexBattleIds(){
  const out=new Set();
  ['1','2'].forEach(st=>DEXRANK.forEach(r=>dexList(st,r).forEach(it=>{
    if(it.card && dex.has(dexKey(st,r,it.no,it.n))) out.add(it.card.id); })));
  POOL.filter(p=>p.s==='공통'&&(p.r==='R'||p.r==='S'))
    .forEach(c=>{ if(dex.has('공통-'+c.r+'-@'+c.n)) out.add(c.id); });
  return [...out];
}
function dexSoloRank(ids){
  const bs=dexBossSet(), sc={};
  ids.forEach(id=>sc[id]=0);
  bs.forEach(b=>ids.forEach(id=>{
    const c=POOL.find(p=>p.id===id); let best=0;
    c.mv.forEach(m=>{ const r=evalMove(c,b,m,false); if(r.dmg>best) best=r.dmg; });
    sc[id]+=best; }));
  return [...ids].sort((a,b)=>sc[b]-sc[a]);
}
function dexSeqTotal(set){
  owned=toBag(set); let t=0;
  for(const b of dexBossSet()) t+=buildSeq(b).reduce((a,r)=>a+(r.dmg||0),0);
  return t;
}
function calcDexBest(cb){        // cb={step,done} — 벗은 콜백 이름은 undef.js 가 오탐한다
  const cand=dexBattleIds();
  if(cand.length<=DEXBEST_N){ cb.done(cand,false); return; }
  const snap=new Bag(owned), short=dexSoloRank(cand).slice(0,DEXBEST_SHORT), cur=[];
  dexCalcBusy=true;
  const step=()=>{
    let bi=null,bv=-1;
    for(const id of short){ if(cur.includes(id)) continue;
      const v=dexSeqTotal(cur.concat([id])); if(v>bv){bv=v;bi=id;} }
    if(bi!=null) cur.push(bi);
    cb.step(cur.length, Math.min(DEXBEST_N,short.length));
    if(cur.length<DEXBEST_N && cur.length<short.length) setTimeout(step,0);
    else { owned=snap; dexCalcBusy=false; cb.done(cur,true); }
  };
  setTimeout(step,0);
}
function renderDexBestMsg(txt){
  const m=document.getElementById('dexBestMsg'); if(m) m.innerHTML=txt;
  ['dexBestOn','dexBestClr'].forEach(id=>{
    const b=document.getElementById(id); if(b) b.hidden=!dexBest; });
}

/* ══ 전투 태그 목록 (roster) ──── */
function renderRoster(){
  const host=document.getElementById('roster'); host.innerHTML='';
  const inSet=MYPOOL.filter(p=>p.s===rosterSet||p.s==='공통');
  classRanks().forEach(k=>{
    const list=inSet.filter(p=>p.r===k); if(!list.length)return;
    const on=list.filter(p=>owned.has(p.id)).length;
    const d=el(`<details open>
      <summary><span class="band" style="background:${RARITY[k].color}"></span>${RARITY[k].label}
        ${list[0].s==='공통'?'<span class="badge b-set">탄 공통</span>':''}
        <span class="ct">${on} / ${list.length}</span></summary>
      ${k==='4'?`<p class="tab-note" style="margin:2px 0 6px">★4 는 <b>기술 위력이 미표기</b>라
        기본 100 으로 계산합니다 — 예상 피해와 판정을 ★5·★6 만큼 믿지 마세요.</p>`:''}
      <div class="bulk"><button class="mini" data-b="on">전체 켜기</button>
        <button class="mini" data-b="off">전체 끄기</button></div>
      <div class="pool"></div></details>`);
    const pool=d.querySelector('.pool');
    list.forEach(c=>{
      const n=el(chip(c,{pressed:owned.has(c.id)}));
      n.addEventListener('click',()=>{ if(dexCalcBusy) return;
        owned.has(c.id)?owned.delete(c.id):owned.setCnt(c.id,1);
        save(); renderAll()});
      pool.appendChild(n);
    });
    d.querySelectorAll('[data-b]').forEach(btn=>btn.addEventListener('click',()=>{
      list.forEach(c=>btn.dataset.b==='on'?owned.setCnt(c.id,1):owned.delete(c.id));save();renderAll()}));
    host.appendChild(d);
  });
  document.getElementById('rs1').setAttribute('aria-pressed',rosterSet==='1');
  document.getElementById('rs2').setAttribute('aria-pressed',rosterSet==='2');
  // 중복 보유를 쓰지 않으므로 «장수» 와 «종» 이 늘 같다. 분모 있는 한 가지 표기로 통일한다.
  document.getElementById('ownHint').innerHTML=
    `${CLASSES[tagClass].label} 전투 <b>${owned.size}</b> / ${classPool().length}`
    + ` · 수집 <b>${dex.size}</b> / ${dexTotal()}`;
}

/* 수집 탭 — 전투 보유(owned)와 완전히 분리된 dex 집합만 쓴다.
   여기서 무엇을 켜고 꺼도 추천 계산과 전투 탭에는 아무 영향이 없다. */
const dexOn=(r,it)=>dex.has(dexKey(rosterSet,r,it.no,it.n));
const dexCnt=(r,it)=>dex.cnt(dexKey(rosterSet,r,it.no,it.n));
function dexToggle(r,it){ const k=dexKey(rosterSet,r,it.no,it.n);
  dex.has(k)?dex.delete(k):dex.setCnt(k,1); }
/* ══ 수집 탭 렌더 ──── */
function renderDex(){
  const host=document.getElementById('dexHost'); if(!host)return;
  host.innerHTML='';
  // 번호 오름차순 단일 목록. 번호가 없는 레귤러·스페셜은 뒤에 붙인다.
  const rows=[];
  DEXRANK.forEach(r=>dexList(rosterSet,r).forEach(it=>rows.push({r,it})));
  rows.sort((a,b)=>(a.it.no??999)-(b.it.no??999));
  ['R','S'].forEach(rk=>POOL.filter(p=>p.s==='공통'&&p.r===rk)
    .forEach(c=>rows.push({r:rk,it:{no:null,n:c.n,t:c.t,card:c},common:true})));

  const keyOf=x=>x.common ? '공통-'+x.r+'-@'+x.it.n : dexKey(rosterSet,x.r,x.it.no,x.it.n);
  const isOn =x=>dex.has(keyOf(x));
  const RKLAB={'6':'★6','5':'★5','4':'★4','3':'★3','2':'★2','R':'레귤러','S':'스페셜'};

  const g=el('<div class="dexg"></div>');
  rows.forEach(x=>{
    const col=RARITY[x.r].color, it=x.it, cn=dex.cnt(keyOf(x));
    const n=el(`<button class="dx" style="--c:${col};--sc:${it.no?SETC[rosterSet]:col}" aria-pressed="${isOn(x)}">
      <span class="hd"><span class="no${it.no?'':' un'}">${it.no??'–'}</span>
        ${cn>1?`<span class="rk" style="background:var(--sc)">x${cn}</span>`:''}
        <span class="rk">${RKLAB[x.r]}</span></span>
      <span class="dn">${it.n}</span>
      <span class="dt">${it.t.map(t=>`<i class="ci ${TK[t]}" title="${t}"></i>`).join('')}
        ${it.card&&it.card.g?`<span class="sep"></span><i class="gi ${GK[it.card.g]}" title="${it.card.g}"></i>`:''}
      </span></button>`);
    n.addEventListener('click',()=>{const k=keyOf(x);
      dex.has(k)?dex.delete(k):dex.setCnt(k,1);
      save(); renderDex()});
    g.appendChild(n);
  });
  host.appendChild(g);

  const have=rows.filter(isOn).length;
  const h=document.getElementById('dexHint');
  if(h) h.textContent=`${rosterSet}탄 ${have} / ${rows.length}종 수집 · 전투 보유와 별개로 저장됩니다`;
  host.dataset.keys=JSON.stringify(rows.map(keyOf));
}
/* 분류를 바꿔도 **보유는 그대로다** — 보는 창만 바뀐다. 저장까지 해서 다음에도 그 창으로 연다. */
/* ══ 전투 분류 스위치 (두 군데를 함께 갱신한다) ──── */
function setTagClass(v){ tagClass=v; useClass(); save(); renderAll(); }
function renderTagClass(){
  /* 스위치가 두 군데(컬렉션·매치)다. **둘 다 갱신할 것** — 한쪽만 하면
     다른 화면에서 눌린 표시가 어긋난다 (같은 `tagClass` 를 보는데도). */
  ['tagClassSw','matchClassSw'].forEach(id=>{
    const n=document.getElementById(id); if(!n) return;
    n.querySelectorAll('button').forEach(b=>
      b.setAttribute('aria-pressed', String(b.dataset.tc===tagClass)));
  });
  const mn=document.getElementById('matchClassNote');
  if(mn){
    const C=CLASSES[tagClass], n=classPool().filter(p=>owned.has(p.id)).length;
    mn.innerHTML = `<b>${C.label}</b> ${C.sub} 로 계산합니다 · 보유 <b>${n}</b>장`
      + (n<3 ? ' — <b>3장은 있어야 로테이션이 섭니다</b>' : '');
  }
  const sw=document.getElementById('tagClassSw'); if(!sw) return;
  const C=CLASSES[tagClass];
  const list=MYPOOL.filter(p=>(p.s===rosterSet||p.s==='공통')&&C.ranks.includes(p.r));
  const on=list.filter(p=>owned.has(p.id)).length;
  /* 안내는 **분류 이름을 박아 쓰지 않는다** — A·B 만 있던 시절 문구가 C 에도 그대로 떴다
     (v3.23.0 · 잭 지적). 겹치는 성급도 `CLASSES` 에서 그때그때 구한다. */
  const others=Object.keys(CLASSES).filter(k=>k!==tagClass);
  const dup=others.flatMap(k=>CLASSES[k].ranks.filter(r=>C.ranks.includes(r))
    .map(r=>({r, k}))).filter((v,i,a)=>a.findIndex(x=>x.r===v.r)===i);
  document.getElementById('tagClassNote').innerHTML =
    `<b>${C.label}</b> ${C.sub} · 이 분류에서 <b>${on}</b> / ${list.length}장 보유`
    + others.map(k=>` <span class="qm">|</span> ${CLASSES[k].label} ${ownedSets[k].size}장`).join('')
    + `<br><b>분류마다 따로 저장됩니다.</b> 추천도 지금 분류가 받는 성급만 씁니다.`
    + (dup.length
        ? ` ${dup.map(d=>rlab(d.r)).join('·')}는 <b>${dup.map(d=>CLASSES[d.k].label).join('·')}</b>에도`
          + ` 뜨지만 <b>보유는 별개</b>예요 — 한쪽에서 켜도 다른 쪽에 안 켜집니다.`
        : ` 이 분류의 성급은 다른 분류와 겹치지 않습니다.`);
}
/* ══ 컬렉션 서브탭 · 뷰 전환 ──── */
function setColTab(v){
  colTab=v;
  document.getElementById('colBattle').hidden = v!=='battle';
  document.getElementById('colDex').hidden   = v!=='dex';
  document.getElementById('ct1').setAttribute('aria-pressed',v==='battle');
  document.getElementById('ct2').setAttribute('aria-pressed',v==='dex');
  const b=document.getElementById('b23ct'); if(b) b.hidden = v!=='battle';
  /* 분류 스위치는 «전투태그» 를 볼 때만 쓸모가 있다 */
  ['tagClassSw','tagClassNote'].forEach(id=>{
    const n=document.getElementById(id); if(n) n.hidden = v!=='battle'; });
  renderAll();
}

let view='battle';
const VIEWS={battle:['viewBattle','vB'],collection:['viewCollection','vC'],hist:['viewHist','vH'],chance:['viewChance','vX']};
function setView2(v){
  view=v;
  Object.entries(VIEWS).forEach(([k,ids])=>{
    document.getElementById(ids[0]).hidden = k!==v;
    document.getElementById(ids[1]).setAttribute('aria-pressed',k===v);
  });
  window.scrollTo({top:0,behavior:'instant'});
  renderDock();
}
/* 상대 탄 토글. **마지막 하나는 못 끈다** — 후보가 0장이 되면 서브를 아예 못 고른다.
   탄을 끄면 이미 넣어 둔 서브는 **건드리지 않는다** (그 자체는 멀쩡한 데이터다).
   다만 픽커의 탄 스위치가 꺼진 탄을 가리키고 있으면 켜진 쪽으로 옮긴다. */
document.querySelectorAll('#tagClassSw button,#matchClassSw button').forEach(b=>
  b.addEventListener('click',()=>setTagClass(b.dataset.tc)));
document.querySelectorAll('#foeSetsSw button').forEach(b=>
  b.addEventListener('click',()=>{
    const k=b.dataset.fs, other=k==='1'?'2':'1';
    if(foeSets[k] && !foeSets[other]) return;      // 마지막 하나
    foeSets[k]=!foeSets[k];
    if(!foeSets[foeSet]) foeSet = foeSets['1']?'1':'2';
    /* 꺼진 탄의 보스를 쥐고 있으면 켜진 탄의 첫 보스로 옮긴다. `setBoss` 를 타므로
       서브도 함께 비워진다 — 지난 파티 기준 추천이 새 보스에 남는 것보다 낫다. */
    if(!foeSets[setView]){
      setView = foeSets['1']?'1':'2';
      const f=BOSSES.find(b=>b.s===setView&&b.r===bossRank) || BOSSES.find(b=>b.s===setView);
      if(f){ bossRank=f.r; setBoss(f.id); }
    }
    save(); renderAll();
  }));
document.querySelectorAll('.ranksort button').forEach(b=>
  b.addEventListener('click',()=>{rankSort=b.dataset.sort; save(); renderRank()}));
document.querySelectorAll('.seg button').forEach(b=>
  b.addEventListener('click',()=>{detail=Number(b.dataset.lv); save(); renderDetail()}));
/* ══ 버전 표시 · 초기화 · 갱신 감지 ──── */
const verEl=document.getElementById('ver');
const VLABEL='v'+VERSION+' · '+BUILT;
{ const v=document.getElementById('ver'); if(v) v.textContent=VLABEL; }
// 초기화 확인은 보정 탭의 인라인 UI 로 받는다 (샌드박스 iframe 이 confirm 을 막으므로).
function wipe(){
  try{ localStorage.removeItem(KEY) }catch(e){}
  try{ window.storage && window.storage.delete && window.storage.delete(KEY) }catch(e){}
  // save() 가 저장하는 모든 항목을 되돌린다 — 하나라도 빠지면 다음 save 때 옛 값이 되살아난다
  ownedSets={A:DEFAULT_OWNED(), B:new Bag(), C:new Bag()}; useClass(); chance={...CHANCE_DEFAULTS};
  guideHidden=false; detail=0; rankSort='score'; bossRank='6';
  dmaxLv=5; megaTier='대성공'; mode='지역'; foes=[null,null]; foeSets={'1':true,'2':true};
  tagClass='A'; dex=new Bag(); playRec=false; gver={...GVER_DEFAULT};
  renderAll();
}
const wipeBtn=document.getElementById('wipeBtn'),
      wipeAsk=document.getElementById('wipeAsk'),
      wipeNo=document.getElementById('wipeNo'),
      wipeYes=document.getElementById('wipeYes');
let wipeT=0;
function wipeHide(){wipeAsk.hidden=true;wipeBtn.hidden=false;clearTimeout(wipeT)}
wipeBtn.addEventListener('click',()=>{
  wipeBtn.hidden=true; wipeAsk.hidden=false;
  clearTimeout(wipeT); wipeT=setTimeout(wipeHide,8000);   // 8초간 응답 없으면 자동 취소
});
wipeNo.addEventListener('click',wipeHide);
wipeYes.addEventListener('click',()=>{
  wipeHide(); wipe();
  wipeBtn.textContent='초기화 완료'; 
  setTimeout(()=>{wipeBtn.textContent='처음 상태로 초기화…'},2200);
});
console.log('스타더스트 랩 '+VLABEL);

/* 홈 화면 웹앱은 HTML 을 강하게 캐시한다. 새 버전이 올라왔는지 직접 확인한다. */
function hardReload(){
  const u=location.pathname+'?v='+Date.now()+location.hash;
  location.replace(u);
}
async function checkUpdate(){
  try{
    if(typeof location==='undefined'||!location.protocol.startsWith('http')) return;  // file:// · 미리보기 제외
    if(typeof fetch!=='function') return;
    const r=await fetch(location.pathname+'?_='+Date.now(),{cache:'no-store'});
    if(!r.ok) return;
    const t=await r.text();
    const m=t.match(/const VERSION='([^']+)'/);
    if(m && m[1]!==VERSION){
      document.getElementById('updV').textContent='v'+m[1];
      document.getElementById('upd').hidden=false;
    }
  }catch(e){}
}
const updGo=document.getElementById('updGo');
if(updGo) updGo.addEventListener('click',hardReload);
setTimeout(checkUpdate,1200);
try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}) }catch(e){}

/* ══ 방문자 집계 · GA4 · v3.12.0 · 잭 지정 ══
   **`GA` 에 측정 ID 를 넣으면 켜진다 · G- 로 시작한다. 비어 있으면 아무 스크립트도 안 붙는다.**
   받는 곳: analytics.google.com → 관리 → 데이터 스트림 → 웹 스트림 추가 → 측정 ID 복사.

   **왜 GA4 인가** — 클라우드플레어 웹 애널리틱스도 무료지만 «방문» 을 «호스트명과 다른
   리퍼러가 있는 페이지뷰» 로 세고, 같은 사람이 열 번 오면 열 명으로 잡는다.
   이 앱은 **홈 화면 웹앱**으로 열려 리퍼러가 대개 비어 있어서 그 정의와 안 맞는다.
   GA4 는 쿠키로 사람 단위를 세므로 «몇 명이 쓰는가» 를 볼 수 있다.
   **CF 로 바꾸려거든 이 함정을 먼저 볼 것.**

   ⚠ **배포본(github.io)에서만 돈다.** 미리보기·로컬에서 세면 내 열람이 방문자로 잡힌다.
   ⚠ 애드센스 보고서에도 페이지뷰가 있지만 **순 방문자는 안 준다** — 그래서 따로 붙인다.
   ⚠ **머리말에 별도 스크립트 태그로 두지 말 것** — `dev/` 도구들이 스크립트 태그의
      첫 조각을 본문으로 보기 때문에 조각이 늘면 fixture·interact·undef 가 통째로 죽는다.
   ⚠ **이 주석에 스크립트 여는 태그나 «ID(» 를 글자 그대로 쓰지 말 것** —
      앞엣것은 도구가 거기서 잘라 문법 오류를 내고, 뒤엣것은 undef 가 함수 호출로 오탐한다.
      v3.11.0 에서 셋 다 실제로 겪었다.
   ⚠ GA4 는 쿠키를 쓴다. 애드센스도 쿠키를 쓰므로 개인정보 처리방침이 이미 필요한 상태지만,
      **처리방침에 분석 쿠키도 함께 적어 둘 것.** ══ */
(function(){
  var GA='G-XFK3680S0D';   /* 스타더스트 랩 웹 스트림 · 2026-08-14 */
  if(!GA) return;
  if(!/(^|\.)github\.io$/.test(location.hostname)) return;   /* 배포본만 */
  var g=document.createElement('script'); g.async=true;
  g.src='https://www.googletagmanager.com/gtag/js?id='+GA;
  document.head.appendChild(g);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',GA);
  /* ══ 방문 누락 보정 (v3.40.0 · 잭 지적) ══
     GA4 는 «페이지 로드» 때 한 번 신호를 보낸다. 그런데 이 앱은 현장에서 탭·홈 화면 앱을
     **띄워 둔 채 오간다** — 며칠을 써도 로드는 한 번뿐이라 방문이 1회로 잡혔다.
     그래서 앱이 다시 앞으로 나올 때, 30분(GA4 기본 세션 만료) 넘게 숨어 있었으면
     page_view 를 한 번 더 보낸다. ⚠ 캐시는 원인이 아니었다 — gtag 는 캐시된 페이지에서도
     그대로 실행된다. 이 보정을 «캐시 때문» 으로 다시 설명하지 말 것. */
  var seen=Date.now();
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){ seen=Date.now(); return; }
    if(Date.now()-seen>30*60*1000){ seen=Date.now(); window.gtag('event','page_view'); }
  });
})();
/* 쓰임새 신호 — 방문자 수만으로는 «열어만 보는지 실제로 쓰는지» 를 못 가른다.
   판 저장에만 건다 (가장 손이 많이 가는 동작). gtag 가 없으면(로컬·차단) 조용히 넘어간다. */
function track(name){ try{ if(window.gtag) window.gtag('event',name); }catch(e){} }
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) saveFlush();          // 미뤄 둔 저장을 놓치지 않는다
  else checkUpdate();
});
/* pagehide 는 iOS 에서 «탭 닫기·앱 전환» 을 잡는다. 검증 샌드박스에는 window 가 없을 수 있어 감싼다. */
try{ if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('pagehide',saveFlush); }catch(e){}

document.querySelectorAll('.dock button').forEach(b=>
  b.addEventListener('click',()=>goSection(b.dataset.go)));
document.querySelectorAll('[data-dlv]').forEach(b=>
  b.addEventListener('click',()=>{dmaxLv=Number(b.dataset.dlv); save(); renderAll()}));
document.querySelectorAll('[data-mg]').forEach(b=>
  b.addEventListener('click',()=>{megaTier=b.dataset.mg; save(); renderAll()}));
document.getElementById('qrClose').addEventListener('click',closeQR);
document.getElementById('qrModal').addEventListener('click',closeQR);

/* 서브 선택 팝업 닫기 (v1.82.0). 바깥·✕·Esc 셋 다 먹는다.
   시트 안쪽 클릭은 막아야 한다 — 안 막으면 성급 단추를 눌러도 팝업이 닫힌다. */
/* ══ 픽커 닫기 · 사용법 안내 · 프리셋 ──── */
function closeFoePick(){ if(foePickAt<0) return; foePickAt=-1; foeChain=false; clearFoeQ(); renderFoes(); }
/* 검색어는 팝업을 여닫을 때마다 비운다. 남겨 두면 다음에 열었을 때
   **엉뚱하게 걸러진 목록**이 떠서 «태그가 사라졌다» 로 보인다. */
function clearFoeQ(){ foeQ=''; const q=document.getElementById('foeQ'); if(q) q.value=''; }
{
  const q=document.getElementById('foeQ');
  /* 입력 중에도 renderFoes 가 도는데, 검색창은 팝업 마크업에 **고정**이라 다시 그려지지
     않는다 — 그래서 포커스와 커서가 유지된다. 검색창을 `foeGrid` 안으로 옮기지 말 것. */
  q.addEventListener('input',()=>{ foeQ=q.value.trim(); renderFoes(); });
  q.addEventListener('keydown',e=>{
    if(e.key==='Escape'){ e.stopPropagation(); if(foeQ){ clearFoeQ(); renderFoes(); } else closeFoePick(); }
    if(e.key==='Enter'){ const b=document.querySelector('#foeGrid button'); if(b) b.click(); }
  });
}
document.getElementById('foeModal').addEventListener('click',closeFoePick);
document.querySelector('#foeModal .pickbox').addEventListener('click',e=>e.stopPropagation());
document.getElementById('foePickX').addEventListener('click',closeFoePick);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeFoePick(); });
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeQR()});
document.getElementById('guideX').addEventListener('click',()=>{
  guideHidden=true; save(); renderGuide()});
const brand=document.getElementById('brand');
brand.addEventListener('click',()=>{guideHidden=!guideHidden; save(); renderGuide()});
brand.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){e.preventDefault(); brand.click()}});
document.getElementById('chanceReset').addEventListener('click',()=>{
  chance={...CHANCE_DEFAULTS}; save(); renderAll()});
const preset=(st)=>{
  ownedSets[tagClass]=trimClass(new Bag(POOL.filter(p=>p.s===st&&p.r==='6').map(p=>p.id)),tagClass);
  useClass(); save(); renderAll();
};
document.querySelectorAll('.modesw button').forEach(b=>
  b.addEventListener('click',()=>{ mode=b.dataset.mode; save(); renderAll(); }));
document.querySelectorAll('#foeRank button').forEach(b=>
  b.addEventListener('click',()=>{ foeRank=b.dataset.r; renderFoes(); }));
document.querySelectorAll('#foeSet button').forEach(b=>
  b.addEventListener('click',()=>{ foeSet=b.dataset.s; renderFoes(); }));
document.getElementById('preset16').addEventListener('click',()=>preset('1'));
document.getElementById('preset26').addEventListener('click',()=>preset('2'));
document.getElementById('resetOwn').addEventListener('click',()=>{
  ownedSets[tagClass]=trimClass(new Bag(MYPOOL.map(p=>p.id)),tagClass); useClass(); save(); renderAll()});
document.getElementById('clearOwn').addEventListener('click',()=>{
  ownedSets[tagClass]=new Bag(); useClass(); save(); renderAll()});
Object.entries(VIEWS).forEach(([k,ids])=>
  document.getElementById(ids[1]).addEventListener('click',()=>setView2(k)));

/* ───────────────────── 실측 기록 (v3.31.0) ─────────────────────
   현장에서 판마다 «위치 · 선물 · 서브1 · 보스 · 서브2 · 겟» 을 남긴다.
   형식은 잭의 신형식(2026-08-19 확립)과 같아, «전체 복사» 결과를 채팅·분석에
   그대로 붙일 수 있다. 저장 키는 HKEY 하나이고 save()/wipe() 와 **무관하다** —
   현장 데이터는 다시 만들 수 없어서 전체 초기화에 딸려 지워지면 안 된다. */
