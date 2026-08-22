/* ══ 기록 저장 — localStorage 전용 · wipe 와 무관 ──── */
const HKEY=KEY+':hist';
let hist=[];
try{ const r=localStorage.getItem(HKEY); if(r) hist=JSON.parse(r)||[]; }catch(e){}
function hStore(){ try{ localStorage.setItem(HKEY, JSON.stringify(hist)); }catch(e){} }

/* 이름 목록 — 도감(POOL)과 서브(SUBS)에서 {이름·성급·탄} 을 모은다.
   **설정의 상대 탄(foeSets)을 따른다** (v3.31.1 · 잭 지정) — 꺼진 탄의 태그는
   현장에서 나올 수 없으니 목록에서 뺀다. 공통탄은 늘 남는다.
   v3.31.6 부터 탄을 보존한다 — 픽커의 1탄/2탄 스위치(foeModal 과 동일)가 쓴다.
   도감에 없는 이름(홍나숭이 그랬다)도 현장에선 나오므로 픽커가 자유 입력을 함께 받는다. */
function hCat(){
  const out=[], seen=new Set();
  const add=(n,r,s)=>{
    if(s!=='공통' && typeof foeSets!=='undefined' && foeSets[s]===false) return;
    const k=n+'|'+r+'|'+s;
    if(seen.has(k)) return;
    seen.add(k); out.push({n:String(n), r:String(r), s:String(s)});
  };
  POOL.forEach(p=>add(p.n,p.r,p.s)); SUBS.forEach(x=>add(x.n,x.r,x.s));
  return out;
}
const HRORD='65432R';
const hEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* v3.32.0 (잭 지정) — L 과 R 은 **동시에** 진행되는 일이 많다.
   그래서 위치마다 «작성 중» 드래프트를 따로 쥐고, L/R 버튼은 값이 아니라
   **드래프트 전환기**다. 드래프트는 localStorage 에도 적어 두어(HDKEY)
   현장에서 앱이 새로고침돼도 살아남는다.

   ⚠⚠ **LR 드래프트를 되살리지 말 것** (v3.56.0 에 없앴다 · 잭 지정 «LR 은 없애고 각각 기록»).
   v3.47~3.55 에는 스페셜 전용 드래프트 `LR` 이 따로 있었고, 판 종류를 스페셜로 바꾸면
   `hActiveP` 가 그쪽으로 **갈아치워졌다.** 그래서 실전에서 이렇게 깨졌다 —
   L 자리에 선물·상대를 넣어 두고 스페셜을 수락해 판 종류만 바꿨더니
   **넣어 둔 선물이 사라지고 지난번 LR 값이 떠 있었다.**
   지금은 자리마다(L·R) 판을 온전히 갖고, **판 종류는 그 판의 한 칸일 뿐**이다. */
/* ══ 드래프트 (자리마다 하나 — L · R) ──── */
const HDKEY=HKEY+':draft';
/* src: 'play' = 내가 한 판(플레이 화면에서 가져옴) · 'watch' = 남의 판을 옆에서 본 것(관전).
   기본은 관전이다 — 기록 탭에서 손으로 넣는 판은 대개 남의 판이기 때문이다 (v3.34.0 · 잭 지정). */
const hFresh=(p)=>({m:'지역', p, src:'watch',g:null,s1:null,b:null,s2:null,got:false});
let hDrafts={L:hFresh('L'),R:hFresh('R')};
let hActiveP='L';
let hLostLR=false;   // 옛 LR 드래프트를 옮길 자리가 없어 버렸는가 (아래 이관 참고)
let hEditIdx=null, hEditBuf=null;            // 목록에서 불러와 고치는 중이면 인덱스·버퍼
let hCur=hDrafts.L;                           // 항상 «지금 화면이 편집 중인 판» 을 가리킨다
try{
  const d=localStorage.getItem(HDKEY);
  if(d){ const o=JSON.parse(d)||{};
    if(o.drafts) hDrafts=Object.assign({L:hFresh('L'),R:hFresh('R')},o.drafts);
    /* v3.55.0 까지 쓰던 LR 드래프트를 이관한다 — 현장 데이터라 말없이 버리지 않는다.
       제 자리(p)가 비었으면 그리로, 아니면 반대편이 비었으면 그리로. 둘 다 차 있으면
       옮길 데가 없어 버리고 `hLostLR` 로 화면에 알린다. */
    if(o.drafts && o.drafts.LR){
      const lr=o.drafts.LR, has=d=>!!(d&&(d.g||d.g2||d.s1||d.b||d.s2||d.got));
      if(has(lr)){
        const want=(lr.p==='R')?'R':'L', other=(want==='L')?'R':'L';
        const to = !has(hDrafts[want]) ? want : (!has(hDrafts[other]) ? other : null);
        if(to){ hDrafts[to]=Object.assign({},lr,{p:to}); delete hDrafts[to].g2; }
        else hLostLR=true;
      }
      delete hDrafts.LR;
    }
    if(o.active && hDrafts[o.active]) hActiveP=o.active;
    hCur=hDrafts[hActiveP];
  }
}catch(e){}
function hDraftStore(){ try{ localStorage.setItem(HDKEY, JSON.stringify({drafts:hDrafts,active:hActiveP})); }catch(e){} }
const hHasContent=d=> !!(d && (d.g||d.s1||d.b||d.s2||d.got));
let hSlot=null, hWipeT=null;

/* 내보낼 때 이름의 **공백을 없앤다** (v3.46.0 · 잭 지정) — «가라르 직구리3» → «가라르직구리3».
   줄이 공백으로 갈리는 형식이라 이름 안의 공백은 자리를 흐트러뜨린다.
   ⚠ 앱 안에 저장된 이름은 그대로 두고 **내보낼 때만** 지운다 — 도감 대조는 원래 이름으로 한다. */
/* ══ 한 줄 만들기 · 현재 판 렌더 ──── */
const hFmt=t=> t ? String(t.n).replace(/\s+/g,'')+(t.r||'') : '?';
function hLine(e){
  const got=e.got?' 겟':'';
  const src=e.src==='play'?' [플레이]':' [관전]';
  /* 선물은 지역배틀과 **같은 자리**(위치 바로 뒤)에 적는다 — 되읽을 때 자리로 가른다.
     예: «LR 빠모2 스페셜태그배틀 제크로무6 겟 [플레이]» */
  /* 판 종류는 **모든 줄에 적는다** (v3.45.0 · 잭 지적) — 지역배틀만 빠져 있어
     줄마다 형식이 달랐다. 자리는 «위치 · 선물 · 판 종류 · 상대…» 로 통일한다.
     이름은 버튼과 같은 정식 명칭을 쓴다. */
  if(e.m==='스페셜') return e.p+' '+hFmt(e.g)+' 스페셜태그배틀 '+hFmt(e.b)+got+src;
  if(e.m==='다맥')   return e.p+' '+hFmt(e.g)+' 다이맥스포켓몬 '+hFmt(e.b)+got+src;
  return e.p+' '+hFmt(e.g)+' 지역배틀 '+hFmt(e.s1)+' '+hFmt(e.b)+' '+hFmt(e.s2)+got+src;
}

function renderHCur(){
  document.querySelectorAll('#hMode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===hCur.m));
  document.querySelectorAll('.hposg button').forEach(b=>{
    b.setAttribute('aria-pressed',b.dataset.p===hCur.p);
    /* 다른 자리에 작성 중인 판이 있으면 점을 켠다 — 동시 진행의 «저쪽도 쓰다 말았음» 표시 */
    b.classList.toggle('hasdraft', hEditIdx==null && !b.closest('.hposval')
      && b.dataset.p!==hCur.p && hHasContent(hDrafts[b.dataset.p]));
  });
  const pos=document.getElementById('hPos');
  if(pos) pos.classList.remove('hlr');   // v3.47.0 — 스페셜도 L/R 을 고른다 (내가 앉은 자리)
  document.querySelectorAll('.hgotg button').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.g==='1')===hCur.got));
  document.querySelectorAll('#hSrc button').forEach(b=>
    b.setAttribute('aria-pressed', b.dataset.src===(hCur.src||'watch')));
  const sv=document.getElementById('hSaveBtn'), cc=document.getElementById('hEditCancel');
  if(sv) sv.textContent = hEditIdx==null ? '저장' : (hEditIdx+1)+'판 수정 저장';
  if(cc) cc.hidden = hEditIdx==null;
  /* 선물은 **판 종류를 가리지 않고** 받는다 (기계 규칙: 매 판 선물 1장 필수 · v3.43.0 · 잭 지적).
     스페셜·다이맥스에서 꺼 두던 것을 켠다. 상대 서브 두 칸만 지역배틀 전용이다. */
  const local=hCur.m==='지역';
  document.querySelectorAll('.hslot').forEach(el=>{
    const k=el.dataset.k;
    el.classList.toggle('hs-off', !local && k!=='b' && k!=='g');
  });
  /* ⚠ **선물 칸은 하나다.** v3.55.0 까지는 스페셜일 때 «선물 L / 선물 R» 두 칸을 받아
     한 드래프트에서 두 줄을 만들었는데 그 모델을 없앴다 (v3.56.0) — 자리마다 판이
     따로이므로 각 자리가 자기 선물을 갖는다. 판 종류로 선물 칸을 다시 나누지 말 것. */
  [['g','hs-g'],['s1','hs-s1'],['b','hs-b'],['s2','hs-s2'],
   ['g','hs2-g']].forEach(([k,id])=>{
    const el=document.getElementById(id); if(!el) return;
    const t=hCur[k];
    el.innerHTML = t ? hEsc(t.n)+(t.r?'<b>★'+hEsc(t.r)+'</b>':'') : '—';
  });
  /* 플레이 화면 인라인 블록 — 설정에서 켰을 때만, 그리고 수정 중일 땐 감춘다
     (기록 탭에서 옛 판을 고치는 중에 플레이 화면 저장까지 열려 있으면 헷갈린다) */
  const showPR = playRec && hEditIdx==null;
  ['sPlayRecTop','sPlayRecBot'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.hidden=!showPR;
  });
  /* 기록 기능을 끄면 **기록 탭 자체를 감춘다** (v3.39.0 · 잭 지정 · 기본 꺼짐).
     보고 있던 중에 꺼졌으면 플레이 화면으로 돌려보낸다 — 빈 화면에 갇히지 않게.
     ⚠ 탭만 감출 뿐 **저장된 기록은 그대로 남는다** (HKEY 는 건드리지 않는다). */
  const vh=document.getElementById('vH');
  if(vh){
    vh.hidden=!playRec;
    if(!playRec && typeof view!=='undefined' && view==='hist') setView2('battle');
  }
  document.querySelectorAll('#playRecSw button').forEach(b=>
    b.setAttribute('aria-pressed', (b.dataset.pr==='1')===playRec));
}
/* ══ 목록 렌더 · 빈 판 확인 ──── */
function renderHList(){
  renderHStat();                     // 목록이 바뀌면 분석도 함께 다시 센다
  const box=document.getElementById('hList'), ct=document.getElementById('hCt'),
        badge=document.getElementById('vHct');
  if(ct) ct.textContent = hist.length ? hist.length+'판 · 오래된 판이 위' : '';
  if(badge) badge.textContent = hist.length||'';
  if(!box) return;
  if(!hist.length){ box.innerHTML='<p class="empty">아직 기록이 없습니다.<br>위에서 판을 저장하거나 일괄 입력을 쓰세요.</p>'; return; }
  box.innerHTML=hist.map((e,i)=>
    `<div class="hrow${i===hEditIdx?' hediting':''}"><span class="hno">${i+1}</span>`+
    `<button class="htxt" data-i="${i}" aria-label="${i+1}판 수정">${hEsc(hLine(e))}`+
      (e.ts?`<small class="hts">${hEsc(hClock(e.ts))}</small>`:'')+`</button>`+
    `<button class="hdel" data-i="${i}" aria-label="${i+1}판 삭제">✕</button></div>`).join('');
}

/* 판 저장 — 보스는 필수. 지역이면 저장 후 L↔R 을 자동으로 뒤집는다 (교대 플레이 전제).
   선물·서브는 못 봤으면 비워 두면 되고, 내보내기에서 «?» 로 나간다. */
let hEmptyArm=0;
document.getElementById('hSaveBtn').addEventListener('click',()=>{
  const note=document.getElementById('hNote');
  /* 보스도 못 볼 수 있다 (v3.32.1 · 잭 지정) — 연속된 판을 사실대로 남기는 것이
     목적이므로 **비움도 저장한다** (내보내기에서 «?»). 다만 «모든 칸이 빈 판» 은
     실수 저장을 막기 위해 두 번 탭으로 받는다 (alert 금지 규칙 — 인라인 확인). */
  const empty = !hCur.b && !hCur.g && !hCur.s1 && !hCur.s2 && !hCur.got;
  if(empty && hEditIdx==null){
    if(Date.now()-hEmptyArm>4000){
      hEmptyArm=Date.now();
      note.textContent='빈 판입니다 — 그래도 남기려면 한 번 더 누르세요';
      return;
    }
  }
  hEmptyArm=0;
  const e={m:hCur.m,p:hCur.p,src:hCur.src||'watch',got:hCur.got,ts:hCur.ts||Date.now(),
           gver:hCur.gver||gverStr(),          // 판마다 기계 버전을 남긴다 (v3.37.0)
           tid:hCur.tid||tidCur,               // 어느 트레이너 ID 로 했는지 (v3.41.0)
           g:hCur.g,s1:hCur.s1,b:hCur.b,s2:hCur.s2};
  if(e.m!=='지역'){ e.s1=e.s2=null; }   // 선물은 남긴다 — 판 종류와 무관하게 받는다
  /* ⚠⚠ **스페셜에서 두 줄을 만들지 말 것** (v3.47.0 의 규칙을 v3.56.0 에 철회 · 잭 지정).
     그때는 스페셜 전용 LR 드래프트가 있어 한 번 저장으로 L·R 두 줄을 냈다. 그런데
     그 모델이 «판 종류를 바꾸면 드래프트가 갈아치워지는» 버그의 뿌리였다.
     지금은 **자리마다 저장한다** — 양쪽을 다 봤으면 L 에서 한 번, R 에서 한 번.
     한쪽만 봤으면 한 줄만 남는 것이 맞다 (못 본 판을 지어내지 않는다). */
  if(hEditIdx!=null){
    /* 목록에서 불러온 판을 고쳐 저장 — 제자리에 반영하고 편집 모드를 닫는다 */
    hist[hEditIdx]=e; hStore(); renderHList();
    note.textContent=(hEditIdx+1)+'판 수정됨';
    hEditExit();
    return;
  }
  hist.push(e); hStore(); renderHList(); track('rec_save');
  note.textContent=hist.length+'판째 저장됨';
  /* 저장한 드래프트만 비운다. 자동 L↔R 교대는 뺐다 (v3.32.0 · 잭 지정 — 동시 진행) —
     대신 반대편에 쓰다 만 판이 있으면 그쪽으로 넘어간다. LR 드래프트는 원래 자리로. */
  hDrafts[hActiveP]=hFresh(hActiveP);
  { const o=hActiveP==='L'?'R':'L'; if(hHasContent(hDrafts[o])) hActiveP=o; }
  hCur=hDrafts[hActiveP];
  hDraftStore(); renderHCur();
});
/* 수정 모드 — 목록의 판을 눌러 진입한다. 작성 중이던 L/R 드래프트는 건드리지 않고
   별도 버퍼(hEditBuf)에서 고친다. 취소하면 원래 드래프트 화면으로 돌아온다. */
/* ══ 수정 진입 · 이탈 ──── */
function hEditStart(i){
  hEditIdx=i;
  hEditBuf=JSON.parse(JSON.stringify(hist[i]));
  hCur=hEditBuf;
  document.getElementById('hNote').textContent=(i+1)+'판 수정 중 — 저장하면 반영됩니다';
  renderHCur();
  window.scrollTo({top:0,behavior:'instant'});
}
function hEditExit(){
  hEditIdx=null; hEditBuf=null;
  hCur=hDrafts[hActiveP];
  renderHCur();
}
document.getElementById('hEditCancel').addEventListener('click',()=>{
  document.getElementById('hNote').textContent='수정 취소됨';
  hEditExit();
});
document.querySelectorAll('#hMode button').forEach(b=>b.addEventListener('click',()=>{
  const m=b.dataset.m;
  if(hEditIdx!=null){
    /* 수정 중에는 드래프트 전환 없이 그 판의 종류·위치만 고친다 */
    hCur.m=m;
    if(hCur.p==='LR') hCur.p='L';      // v3.47.0 — 판은 늘 한쪽 자리다 (LR 값은 없앴다)
    renderHCur(); return;
  }
  /* ⚠⚠ **판 종류는 그 판의 한 칸일 뿐이다. 드래프트를 갈아치우지 말 것.**
     실전 예 — L 에 선물·상대를 넣어 두고 게임 중, R 에서 스페셜이 떴다. L 이 수락하면
     L 의 판 종류만 지역배틀 → 스페셜태그배틀로 바뀐다. **넣어 둔 값은 그대로여야 한다.**
     v3.55.0 까지는 여기서 hActiveP 를 'LR' 로 옮겨 **선물이 사라지고 지난번 값이 떴다**
     (v3.56.0 에서 고침 · 잭 지적). */
  hCur.m=m;
  if(hCur.p!=='L'&&hCur.p!=='R') hCur.p='L';
  hDraftStore(); renderHCur();
}));
document.querySelectorAll('.hposg button').forEach(b=>b.addEventListener('click',()=>{
  /* 값만 바꾸는 자리 두 곳: ① 옛 판을 수정하는 중 ② 플레이 화면(.hposval) —
     플레이는 한쪽에서만 하므로 L/R 드래프트를 따로 둘 이유가 없다 (v3.36.1 · 잭 지정). */
  if(hEditIdx!=null || b.closest('.hposval')){
    hCur.p=b.dataset.p; renderHCur(); if(hEditIdx==null) hDraftStore(); return;
  }
  /* 기록 탭에서는 드래프트 전환 — L 을 쓰다 R 로 넘어가도 L 은 그대로 남는다 (관전 동시 진행) */
  hActiveP=b.dataset.p; hCur=hDrafts[hActiveP];
  hDraftStore(); renderHCur();
}));
document.querySelectorAll('.hgotg button').forEach(b=>b.addEventListener('click',()=>{hCur.got=b.dataset.g==='1';renderHCur();if(hEditIdx==null)hDraftStore()}));
document.querySelectorAll('#hSrc button').forEach(b=>b.addEventListener('click',()=>{
  hCur.src=b.dataset.src; renderHCur(); if(hEditIdx==null) hDraftStore();
}));
/* 플레이 화면에서 가져오기 (v3.34.0 · 잭 지정) — 내가 플레이할 때는 이미 «플레이» 탭에서
   보스와 서브를 고른 뒤다. 그것을 다시 치지 않도록 그대로 끌어온다.
   선물·겟은 화면에 없는 값이라 건드리지 않는다 (직접 넣는다). 출처는 «플레이» 로 바뀐다. */
/* ══ 플레이 화면에서 가져오기 · 게임기 버전 ──── */
function hPullPlay(note){
  const boss=BOSSES.find(x=>x.id===bossId);
  if(!boss){ if(note) note.textContent='플레이 탭에서 보스를 먼저 고르세요.'; return false; }
  /* 플레이 화면의 mode 값('지역'·'다맥'·'스페셜')은 기록의 판 종류와 같은 낱말이다.
     ⚠ 판 종류만 옮긴다 — 드래프트는 지금 자리를 그대로 쓴다 (v3.56.0 에 «LR» 을 없앴다). */
  hCur.m=mode;
  hCur.src='play';
  hCur.b={n:boss.n, r:String(boss.r)};
  const put=(k,at)=>{ const f=foes[at]&&SUBBY.get(foes[at]); if(f) hCur[k]={n:f.n, r:String(f.r)}; };
  if(mode==='지역'){ put('s1',0); put('s2',1); }
  const cnt=mode==='지역'?[foes[0],foes[1]].filter(Boolean).length:0;
  if(note) note.textContent='플레이 화면에서 가져왔습니다 — 보스'+(cnt?' · 서브 '+cnt+'장':'')+' · 선물과 결과는 직접 넣으세요';
  renderHCur(); if(hEditIdx==null) hDraftStore();
  return true;
}
document.getElementById('hFromPlay').addEventListener('click',()=>
  hPullPlay(document.getElementById('hNote')));
/* 플레이 화면의 «저장» — 보스·서브는 화면에서 자동으로 끌어오고, 선물·겟은 위아래 블록에
   넣은 값을 쓴다. 즉 플레이 중에는 «선물 고르기 → 배틀 → 겟 결과 → 저장» 만 하면 된다. */
document.getElementById('hPlaySave').addEventListener('click',()=>{
  const note=document.getElementById('hPlayNote');
  if(!hPullPlay(note)) return;
  document.getElementById('hSaveBtn').click();
  note.textContent=hist.length+'판째 저장됨 — 기록 탭에서 볼 수 있습니다';
});
document.querySelectorAll('#playRecSw button').forEach(b=>b.addEventListener('click',()=>{
  playRec=b.dataset.pr==='1'; save(); saveFlush(); renderHCur();   // 설정은 즉시 굳힌다
}));
/* 게임기 버전 (v3.37.0) — ± 로 메이저·마이너·패치, 빌드는 직접 입력.
   판을 저장할 때 이 문자열이 판마다 함께 남는다 (`e.gver`). */
function renderGver(){
  const set=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};
  set('verMaj',gver.maj); set('verMin',gver.min); set('verPat',gver.pat);
  set('verNow',gverStr());
  const b=document.getElementById('verBuild');
  if(b && b.value!==gver.build) b.value=gver.build;
}
document.querySelectorAll('.verrow[data-v] button').forEach(btn=>btn.addEventListener('click',()=>{
  const k=btn.closest('.verrow').dataset.v, d=Number(btn.dataset.d);
  gver[k]=Math.max(0,Math.min(99,(Number(gver[k])||0)+d));
  save(); renderGver();
}));
(()=>{ const el=document.getElementById('verBuild'); if(!el) return;
  el.addEventListener('input',()=>{
    const v=String(el.value||'').replace(/[^0-9]/g,'').slice(0,7);
    if(el.value!==v) el.value=v;
    gver.build=v; save(); renderGver();
  });
})();
renderGver();

/* 픽커 — foeModal 과 같은 시트. 초성 검색(foeMatch)을 그대로 쓴다.
   정확히 일치하는 도감 이름이 없으면 «그대로 쓰기» 줄이 성급 후보와 함께 뜬다. */
/* ══ 픽커 — 태그 고르기 ──── */
const hQ=document.getElementById('hQ');
/* 픽커 v3.31.5 — **상대 서브 픽커와 같은 컴포넌트 문법** (잭 지정):
   성급 거르개 한 줄 + 이름만 적힌 foegrid + «이어 고르기»(고르면 남은 칸으로 넘어감)
   + 바깥 눌러 닫기. 검색 중에는 거르개를 감추고 성급을 이름 옆에 함께 적는다 —
   전부 foeModal 의 규칙 그대로다. 다른 점 하나: 도감에 없는 이름을 받는
   «그대로 쓰기» 점선 버튼이 검색 시 맨 앞에 뜬다. */
let hRank='5', hSet='1';
const hSlotName={g:'선물',s1:'서브1',b:'보스',s2:'서브2'};
/* 이어 고르기 묶음 (v3.36.0 · 잭 지정) — **선물은 이어 고르기에서 뺀다.**
   선물은 판 시작에 받고 상대 3장은 그 뒤에 뜨므로 사이에 텀이 있다.
   선물을 고르면 거기서 닫히고, 상대는 서브1 → 보스 → 서브2 로 이어 받는다. */
const hOrder=()=> hSlot==='g' ? ['g'] : (hCur.m==='지역' ? ['s1','b','s2'] : ['b']);
function hSetTitle(){
  const o=hOrder(), i=o.indexOf(hSlot);
  const step = o.length>1 ? ` <span class="pickstep">${i+1} / ${o.length}</span>` : '';
  document.getElementById('hPickH').innerHTML=hEsc(hSlotName[hSlot])+' 선택'+step;
}
function hOpenPick(k){
  hSlot=k;
  document.getElementById('hModal').hidden=false;
  hQ.value=''; hSetTitle(); renderHPick(); hQ.focus();
}
document.querySelectorAll('.hslot').forEach(el=>el.addEventListener('click',()=>hOpenPick(el.dataset.k)));
function hClosePick(){ document.getElementById('hModal').hidden=true; hSlot=null; }
document.getElementById('hPickX').addEventListener('click',hClosePick);
document.getElementById('hModal').addEventListener('click',ev=>{
  if(ev.target===document.getElementById('hModal')) hClosePick();   // 바깥을 눌러 닫기
});
hQ.addEventListener('input',renderHPick);
document.querySelectorAll('#hRank button').forEach(b=>
  b.addEventListener('click',()=>{ hRank=b.dataset.r; renderHPick(); }));
document.querySelectorAll('#hSet button').forEach(b=>
  b.addEventListener('click',()=>{ hSet=b.dataset.s; renderHPick(); }));
function hPickTag(n,r){
  if(!hSlot) return;
  hCur[hSlot]={n,r:r||''}; renderHCur();
  if(hEditIdx==null) hDraftStore();            // 작성 중 드래프트는 새로고침에도 살아남는다
  const next=hOrder().find(k=>!hCur[k]);       // 이어 고르기 — 남은 빈 칸으로
  if(next){ hSlot=next; hQ.value=''; hSetTitle(); renderHPick(); }
  else hClosePick();
}
function renderHPick(){
  const q=hQ.value.trim(), g=document.getElementById('hGrid');
  document.querySelectorAll('#hRank button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.r===hRank));
  const searching=!!q;
  /* 검색 중에는 거르개를 감춘다 — 안 감추면 «눌러도 목록이 안 바뀐다» 로 보인다 (foeModal 규칙) */
  document.getElementById('hRank').hidden=searching;
  /* 탄 스위치도 foeModal 규칙 그대로: 검색 중·레귤러(공통이라 탄 없음)·켜진 탄이
     하나뿐이면 통째로 감춘다. 설정에서 끈 탄의 버튼은 감춘다. */
  const onSets=(typeof foeSets==='undefined')?['1','2']:['1','2'].filter(k=>foeSets[k]!==false);
  if(!onSets.includes(hSet)) hSet=onSets[0]||'1';
  const hs=document.getElementById('hSet');
  hs.hidden = searching || hRank==='R' || onSets.length<2;
  document.querySelectorAll('#hSet button').forEach(b=>{
    b.hidden = !onSets.includes(b.dataset.s);
    b.setAttribute('aria-pressed', b.dataset.s===hSet);
  });
  const cat=hCat(), list=[];
  if(searching){
    for(const t of cat) if(foeMatch(t.n,q)) list.push(t);
    list.sort((a,b)=>HRORD.indexOf(a.r)-HRORD.indexOf(b.r)||a.n.localeCompare(b.n,'ko'));
  } else {
    for(const t of cat) if(t.r===hRank && (hRank==='R'||t.s===hSet)) list.push(t);
    list.sort((a,b)=>a.n.localeCompare(b.n,'ko'));
  }
  const hint=document.getElementById('hPickHint');
  hint.hidden=false;
  hint.textContent = searching
    ? `«${q}» 검색 — 성급 상관없이 ${list.length}장`
    : (hSlot==='g' ? '선물 한 장만 넣습니다 — 상대는 배틀이 뜨면 서브1 부터 이어 받습니다'
      : hOrder().length>1 ? '고르면 남은 칸으로 넘어갑니다 · 한 장만 넣으려면 바깥을 눌러 닫으세요'
                          : '이 판 종류는 선물과 보스만 기록합니다');
  g.innerHTML='';
  if(searching && !list.some(t=>t.n===q) && q){
    /* 도감에 없는 이름 — 현장에선 나온다 (홍나숭 사례). 성급은 아는 만큼만. */
    [[hRank,'그대로 ★'+hRank],['','성급 모름']].forEach(([r,lab])=>{
      const b=document.createElement('button');
      b.className='hnew';
      b.innerHTML=`${hEsc(q)}<small>${lab}</small>`;
      b.addEventListener('click',()=>hPickTag(q,r));
      g.appendChild(b);
    });
  }
  if(searching && !list.length && !q) g.innerHTML='';
  list.forEach(t=>{
    const b=document.createElement('button');
    b.innerHTML = searching
      ? `${hEsc(t.n)}<small>${rlab(t.r)} · ${t.s==='공통'?'공통':t.s+'탄'}</small>`
      : hEsc(t.n);
    if(hCur[hSlot] && hCur[hSlot].n===t.n && hCur[hSlot].r===t.r){
      b.className='on'; b.setAttribute('aria-pressed','true');
    }
    b.addEventListener('click',()=>hPickTag(t.n,t.r));
    g.appendChild(b);
  });
}

/* 기록 분석 (v3.33.0 · 잭 지정 — 일괄 입력 자리를 대체) — 저장된 판으로 현장 판단에
   쓸 수치만 계산한다. 근거는 CLAUDE.md «건조 구간 진입 감지» · «★6 겟 전략» ·
   «10줄 구조 모델» 절이다. **여기 수치를 새 발견의 근거로 쓰지 말 것** —
   화면은 잭 기계 표본이 아니라 «지금 이 기계» 만 본다. */
/* ══ 분석 — ★6 판 vs 그 밖 ──── */
const hIs6=t=>!!t&&t.r==='6';
function hAnalyze(){
  const n=hist.length;
  if(!n) return null;
  const local=hist.filter(e=>e.m==='지역');
  const six=hist.filter(e=>hIs6(e.b));
  const gotAll=hist.filter(e=>e.got);
  /* 지금 건조 — 마지막 ★6 보스 이후 몇 판인가. 6판을 넘겼으면 곧 나온다
     (간격이 무작위보다 규칙적 · 실측 평균 1.5판). */
  let dry=0;
  for(let i=n-1;i>=0;i--){ if(hIs6(hist[i].b)) break; dry++; }
  /* 상대 풀 폭 — 최근 판의 서브·보스 종수. 끝물이면 좁아진다 (영상: 21슬롯 8종). */
  const recent=local.slice(-6);
  const slots=[]; recent.forEach(e=>[e.s1,e.b,e.s2].forEach(t=>{if(t)slots.push(t.n)}));
  const kinds=new Set(slots).size;
  /* ★2 서브 — 끝물에는 하위 성급이 상대 풀에서 빠진다. */
  const subs=[]; local.forEach(e=>[e.s1,e.s2].forEach(t=>{if(t&&t.r)subs.push(t.r)}));
  const r2=subs.filter(r=>r==='2').length;
  const strong=subs.filter(r=>r==='4'||r==='5').length;
  /* ★6 선물 — pool 잔량 배출 신호. 나오면 태그부족까지 이어서 할 값이 있다. */
  const gift6=hist.filter(e=>hIs6(e.g)).length;
  const lastGift6=hIs6(hist[n-1]&&hist[n-1].g);
  /* 전이 사슬 — 서브로 본 태그가 뒤 판에서 선물로 나온 사례 (시드=실물 카드 증거). */
  let chain=0;
  hist.forEach((e,i)=>{
    if(!e.g) return;
    for(let j=Math.max(0,i-8);j<i;j++){
      const p=hist[j];
      if([p.s1,p.s2,p.b].some(t=>t&&t.n===e.g.n&&t.r===e.g.r)){ chain++; break; }
    }
  });
  const gvers=[...new Set(hist.map(e=>e.gver).filter(Boolean))];
  const tc={}; hist.forEach(e=>{ if(e.tid) tc[e.tid]=(tc[e.tid]||0)+1; });
  const tids=Object.entries(tc).sort((a,b)=>b[1]-a[1]);
  return {n,gvers,tids,play:hist.filter(e=>e.src==='play').length,
    L:hist.filter(e=>e.p==='L').length,R:hist.filter(e=>e.p==='R').length,
    sp:hist.filter(e=>e.m==='스페셜').length,
    six:six.length, six6got:six.filter(e=>e.got).length, got:gotAll.length,
    dry, kinds, slots:slots.length, subs:subs.length, r2, strong, gift6, lastGift6, chain};
}
/* ══ 통계 렌더 ──── */
function renderHStat(){
  const box=document.getElementById('hStat'); if(!box) return;
  const a=hAnalyze();
  if(!a){ box.innerHTML='<p class="empty">판을 저장하면 여기에 분석이 나옵니다.</p>'; return; }
  const pct=(x,y)=>y?Math.round(x/y*100)+'%':'—';
  const rows=[];
  rows.push(['판 수', a.n+'판 · L '+a.L+' / R '+a.R+(a.sp?' · 스페셜 '+a.sp:'')]);
  rows.push(['출처', '플레이 '+a.play+' · 관전 '+(a.n-a.play)]);
  if(a.tids.length>1) rows.push(['트레이너 ID', a.tids.map(([k,c])=>tidLab(k)+' '+c).join(' · ')]);
  if(a.gvers.length) rows.push(['게임기 버전', a.gvers.join(' · ')
    +(a.gvers.length>1?' — 버전이 바뀐 판이 섞여 있습니다':'')]);
  rows.push(['★6 보스', a.six+'회 ('+pct(a.six,a.n)+') · 겟 '+a.six6got+' · 전체 겟 '+a.got]);
  rows.push(['★6 미출현', a.dry+'판째'+(a.dry>=6?' — 곧 나올 구간입니다 (자리를 지키세요)'
    : a.dry>=3?' — 건조 한복판일 수 있습니다':'')]);
  if(a.slots) rows.push(['상대 풀 폭', a.kinds+'종 / 최근 '+a.slots+'슬롯'
    +(a.slots>=9&&a.kinds<=a.slots*0.45?' — 좁습니다. 재고 끝물 신호':'')]);
  if(a.subs) rows.push(['서브 성급', '★2 '+pct(a.r2,a.subs)+' · ★4~5 '+pct(a.strong,a.subs)
    +(a.subs>=8&&a.r2===0?' — ★2 가 사라졌습니다 (끝물 신호)':'')]);
  if(a.chain) rows.push(['전이 사슬', a.chain+'건 — 서브로 본 태그가 뒤에 선물로 나온 횟수']);
  let h='<div class="hstat">'+rows.map(([k,v])=>
    `<div class="hst"><span class="hst-k">${hEsc(k)}</span><span class="hst-v">${hEsc(v)}</span></div>`).join('')+'</div>';
  if(a.gift6) h=`<p class="hstwarn"><b>★6 선물 ${a.gift6}건</b> — pool 잔량이 나오는 중입니다.`
    +`${a.lastGift6?' 방금도 ★6 이었습니다.':''} 태그부족으로 멈출 때까지 이어서 하면 잔량을 받습니다.</p>`+h;
  box.innerHTML=h;
}

/* 목록 — 한 판 삭제는 즉시, 전체 삭제는 인라인 확인 (alert/confirm 금지 규칙). */
document.getElementById('hList').addEventListener('click',ev=>{
  const d=ev.target.closest('.hdel');
  if(d){
    const i=Number(d.dataset.i);
    hist.splice(i,1); hStore();
    if(hEditIdx!=null){                      // 고치던 판이 지워지거나 앞이 줄면 정리
      if(i===hEditIdx) hEditExit();
      else if(i<hEditIdx) hEditIdx--;
    }
    renderHList(); renderHCur(); return;
  }
  const t=ev.target.closest('.htxt');
  if(t) hEditStart(Number(t.dataset.i));       // 줄을 누르면 그 판을 불러와 고친다
});
/* 내보내기 (v3.38.0 · 잭 지정) — 날짜와 기기 버전은 **바뀔 때만 «# » 헤더 한 줄**로 넣는다.
   판마다 붙이면 줄이 번잡하고, 둘 다 며칠에 한 번 바뀌는 값이라 헤더가 읽기 쉽다.
   시각(ts)·버전(gver)은 저장할 때 이미 자동으로 들어간다 — 손으로 넣는 값이 아니다. */
/* ══ 내보내기 · 기록 초기화 ──── */
const hDay=ts=>{const d=new Date(ts); return (d.getMonth()+1)+'/'+d.getDate()};
const hClock=ts=>{const d=new Date(ts);
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function hExport(){
  const out=[]; let day='', ver='';
  hist.forEach(e=>{
    const d=e.ts?hDay(e.ts):'', v=e.gver||'';
    if((d&&d!==day)||(v&&v!==ver)){
      out.push('# '+[d||day, v||ver].filter(Boolean).join(' · '));
      day=d||day; ver=v||ver;
    }
    out.push(hLine(e));
  });
  return out.join('\n');
}
document.getElementById('hCopy').addEventListener('click',()=>{
  const txt=hExport(), note=document.getElementById('hCt');
  const done=()=>{ if(note) note.textContent=hist.length+'판 복사됨'; };
  if(typeof navigator!=='undefined'&&navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done,()=>hCopyFallback(txt,done));
  } else hCopyFallback(txt,done);
});
function hCopyFallback(txt,done){
  /* 검증 스텁 DOM 에는 select/execCommand/remove 가 없다 — 전부 안전하게 감싼다. */
  try{
    const ta=document.createElement('textarea');
    ta.value=txt; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta);
    if(ta.select) ta.select();
    if(document.execCommand) document.execCommand('copy');
    if(ta.remove) ta.remove();
    done();
  }catch(e){}
}
const hWipeBtn=document.getElementById('hWipeBtn'), hWipeAsk=document.getElementById('hWipeAsk');
function hWipeHide(){ hWipeAsk.hidden=true; hWipeBtn.hidden=false; clearTimeout(hWipeT); }
hWipeBtn.addEventListener('click',()=>{
  document.getElementById('hWipeN').textContent=hist.length;
  hWipeAsk.hidden=false; hWipeBtn.hidden=true;
  hWipeT=setTimeout(hWipeHide,8000);
});
document.getElementById('hWipeNo').addEventListener('click',hWipeHide);
document.getElementById('hWipeYes').addEventListener('click',()=>{
  hist=[]; hStore(); renderHList(); hWipeHide();
});
renderHCur(); renderHList();

