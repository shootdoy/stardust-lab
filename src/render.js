/* ══ 렌더 ══ */
const el=h=>{const d=document.createElement('div');d.innerHTML=h.trim();return d.firstElementChild};
/* 피해 공식이 **실측으로 확인된 범위** (표본 12건: 방어 53~126 · 대상 HP 118~253).
   저성급 서브는 방어 20~40 · HP 30~70 이라 **전부 이 범위 밖**이고, 곧 외삽이다.
   그래서 범위 밖에서는 격파 판정을 단정하지 않는다 (v2.2.0).
   ⚠ 이 장치를 «A 공식이 반증됐다» 는 근거로 넣었다가, 그 관측(짜랑고우거↔팽도리)이
   공격·대상 방향을 확인할 수 없어 **폐기됐다** (v3.10.0). **장치는 그대로 둔다** —
   반증과 무관하게 «측정한 적 없는 구간» 이라는 사실은 그대로이기 때문이다. */
const FIT_DEF=50, FIT_HP=110;
const outFit=(foe,m)=> !!foe && ((m?(m.k==='물리'?foe.d:foe.sd):Math.min(foe.d,foe.sd)) < FIT_DEF || foe.hp < FIT_HP);

/* 판정 배지 — 세로 칸과 가로 슬롯이 같은 것을 쓴다. 범위 밖이면 «?» 를 달고 이유를 남긴다. */
function verdictTag(p,isB,f){
  if(isB) return `<b class="fl-b boss">최대 화력</b>`;
  const doubt = outFit(f,p.move);
  const why = doubt ? ` title="실측 범위 밖(방어 ${FIT_DEF}+ · HP ${FIT_HP}+ 에서만 확인) — 격파 판정을 믿지 말 것"` : '';
  const q = doubt ? '?' : '';
  if(p.tier===0) return `<b class="fl-b ${doubt?'warn':'ok'}"${why}>무피해${q}</b>`;
  if(p.tier===1) return `<b class="fl-b warn"${why}>한 대 맞고 처치${q}</b>`;
  return `<b class="fl-b bad">버티기</b>`;
}

/* 등급 표시 — 레귤러·스페셜은 «★R» 이 아니라 이름으로 적는다 (v2.1.0) */
const rlab=r=> r==='R'?'레귤러' : r==='S'?'스페셜' : '★'+r;
const mc=v=>v>=2?'good':v===1?'mid':'bad';
const dc=v=>v<1?'good':v>1?'bad':'mid';
const tp=x=>`<span class="t"><i class="ti ${TK[x]}"></i><span>${x}</span></span>`;
const gm=x=>GIMICON[x]
  ? `<span class="badge b-gim"><i class="gi ${GK[x]}"></i>${x}</span>`
  : `<span class="badge b-gim">${x}</span>`;

const chip=(c,o={})=>{
  const art=tagArt(c);
  const c1=COLOR[c.t[0]], c2=COLOR[c.t[1]||c.t[0]];
  const bg = art
    ? `linear-gradient(to right,rgba(8,5,22,.90) 0%,rgba(8,5,22,.58) 46%,rgba(8,5,22,.18) 100%),var(--art) center/cover`
    : `linear-gradient(120deg,${c1}AA,${c2}77)`;
  return `<button class="ctag ${artCls(c)}" style="--c:${RARITY[c.r].color};background:${bg}"
    ${o.pressed==null?'':`aria-pressed="${o.pressed}"`} data-id="${c.id}">
    <span class="b23w">${
      (dexBest&&dexBest.has(c.id)?'<span class="b23 rec">추천</span>':'')
      +(bestSet().has(c.id)?`<span class="b23">${tagClass}${bestSet().size}</span>`:'')}</span>
    <span class="cn">${c.n}</span>
    <span class="cm"><span class="cr">★${c.r}</span>${c.t.map(x=>
      `<i class="ci ${TK[x]}" title="${x}"></i>`).join('')}
      ${c.g?`<i class="ci ${GK[c.g]}" title="${c.g}"></i>`:''}
    </span></button>`;
};

function bossTag(b,sel){
  const art=tagArt(b);
  const c1=COLOR[b.t[0]], c2=COLOR[b.t[1]||b.t[0]];
  const bg = art
    ? `linear-gradient(to top,rgba(8,5,22,.94) 0%,rgba(8,5,22,.72) 30%,rgba(8,5,22,.10) 62%,rgba(8,5,22,.30) 100%),var(--art) center/cover`
    : `linear-gradient(135deg,${c1}D9,${c2}A6 58%,rgba(12,7,34,.92))`;
  return `<button class="btag ${artCls(b)}" aria-pressed="${sel}" data-id="${b.id}">
    <span class="face" style="background:${bg}">
      <span class="row1"><span class="stars">${/^\d$/.test(b.r)?'★'.repeat(+b.r):rlab(b.r)}</span><span class="code">${b.code}</span></span>
      <span class="nm">${b.n}</span>
      <span class="row2">
        <span class="tps">${b.t.map(tp).join('')}</span>
        <span class="en">${b.e}<i>에너지</i></span>
      </span>
      ${b.g?`<span class="gim"><i class="gi ${GK[b.g]}"></i>${b.g}</span>`:''}
    </span></button>`;
}

/* 상태바·베젤이 콘텐츠 위에 겹치므로 그만큼 위를 비워 두고 멈춘다 */
/* ══ 스크롤 · 하단 dock ──── */
function topInset(){
  try{
    const bz=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bz'))||0;
    const sat=parseFloat(getComputedStyle(document.body).paddingTop)||0;
    return sat+bz+16;
  }catch(e){ return 24 }
}
function goSection(id){
  const t=document.getElementById(id); if(!t)return;
  const y=t.getBoundingClientRect().top+window.scrollY-topInset();
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({top:Math.max(0,y),behavior:reduce?'auto':'smooth'});
}
function renderDock(){
  const d=document.getElementById('dock'); if(d) d.hidden = view!=='battle';
}

/* ── 상대 한 장에 «대응하는 내 태그» 고르기 ─────────────────────────────
   서브가 활성일 때 **선공 + 원턴킬**이면 그 턴 피해를 아예 안 받는다 (잭 확인).
   기절한 서브는 배틀에서 빠져 다시 안 나온다.

   선공은 **스피드 우위 + 확률 요소**라 확정이 아니다 (잭 확인). 그래서 스피드 차이를
   그대로 보여주고, 우위일 때만 «무피해» 로 친다. 확률 모델은 표본이 없어 넣지 않았다.

   기믹(메가·Z·다이맥스)은 배틀당 1회뿐이라 **서브에는 쓰지 않는다** — 대상에 남겨야 한다.
   같은 값이면 **대상 화력이 낮은 태그**를 고른다. 센 카드를 서브에 소모하지 않기 위해서다. */
/* ══ 여파(splash) 계산 ──── */
const foeHitOne=(c,f)=>Math.max(0,...f.mv.map(m=>bossHit(c,f,m)));   // 그 장에게 한 대 맞을 때 비율
/* **여파** — 활성인 상대를 때리면 **대기 중인 보스와 다른 서브도 맞는다** (2026-08-14 잭 관찰).

   ⚠⚠ **v3.26.0 에서 모델을 갈아엎었다** (2026-08-17 실측 3판 · `dev/damage.js` 참고).
   v3.25.0 까지는 «내 대기 태그가 보스에게 맞을 때» 로 적합한 곡선(절대 HP 포인트 ·
   피해pt ≈ 5.17·f^0.39)을 빌려 썼는데, **실측이 그것을 반증했다.**

     여파% = 기본% × 타입배율          (급소면 ×2 — 계산엔 안 넣고 화면에만 적는다)
     기본% ≈ SPL_K × (위력×(공격+보정))^SPL_P

   **대상의 최대 HP 에 대한 «비율» 이고, 대상 방어와는 무관하다.** 근거:
     · 나로테(HP103) 11% · 자마젠타(HP152) 12% — HP 1.48배 차이인데 비율이 같다
     · 라이츄(HP89) 15.5% · 가로막구리(HP141) 15% — HP 1.58배 차이인데 비율이 같다
     · 꾸왁스(×1) 31% · 가로막구리(×0.5) 12.4% — **배율이 갈리자 비율도 갈렸다**

   ⚠ **계수는 잠정이다.** 3판 모두 룰렛 20 이고 위력이 전부 미상(100 가정)이라
   사실상 «공격 스탯» 하나만 본 적합이다 (잔차 −0/+6/−5%).
   **위력이 다른 공격이나 룰렛이 다른 판이 오면 다시 적합할 것.** */
const SPL_K=0.0212, SPL_P=0.758;
/* 적합에 쓴 «위력×(공격+보정)» 범위는 **5700~11300** 뿐이다 (★3·★4 공격자 3판 · 룰렛 20).
   앱 기본 보정은 30 이라 같은 카드도 조금 커진다 — **적합 최대의 1.25배(≈14000)** 까지는
   그대로 두고, 그보다 크면 «?» 를 단다. ★6 이 치면 20000 을 넘어 한참 밖이다.
   외삽 구간에서 40~90% 가 나오는데 **그 값을 믿고 판단하면 안 된다.** */
const SPL_FIT_MAX=14000;
/* **급소는 여파에도 ×2 로 실린다** (2026-08-17 실측 · 31%÷15%=2.07배).
   ⚠ **그래도 여파를 2배로 계산하지 않는다.** 이 앱의 모든 피해는 «비급소» 기준이고
   `KHP` 도 비급소 6건에서 적합했다 — 여파만 급소를 실으면 다른 칸과 기준이 어긋난다.
   대신 화면에 «급소면 ×2» 라고 적어 둔다. 급소 확률을 다루게 되면 그때 한꺼번에 넣을 것. */
/* 대상 최대 HP 의 비율(0~1). `pw`·`atk` 는 방어를 나누기 «전» 값이고, 배율은 따로 곱한다. */
const splashRate=(pw,atk,mult)=>
  (pw>0&&atk>0) ? Math.min(1, SPL_K*Math.pow(pw*atk, SPL_P)/100*mult) : 0;
/* 한 상대에게 낼 만한 카드를 **카드마다 최선의 기술 하나씩** 골라 좋은 순으로 준다.
   v1.99.0 전까지는 최선 한 장만 돌려줬는데, 세 열이 서로 겹치는지 볼 수 없어
   **같은 카드가 두 열에 추천되는 일**이 있었다 (잭 지적). 이제 목록을 주고 배정은 밖에서 한다. */
/* `waiters` — 이 한 방을 칠 때 **대기 중인 상대 카드들** (보스 + 아직 남은 다른 서브).
   ⚠ **여파는 대기 중인 카드마다 따로 계산한다** (v3.18.0 · 잭 지적).
   v3.17.0 은 활성 상대에게 낸 피해를 대기 전원에게 그대로 복사했는데, 그러면
   **상성도 방어도 활성 상대 것**이라 틀린다 — 보스와 다른 서브가 같은 값을 받았다.
   `dev/damage.js` 의 대기 표본을 보면 `f` 는 «맞는 그 카드» 기준으로 구한다
   (그 카드의 방어·특방과 그 카드에 대한 상성). 그대로 따른다.
   ⚠ 다른 서브가 그 시점에 살아 있는지는 **순서를 알아야** 아는데 이 화면은 «순서 없음» 이다 —
   **가장 이른 턴(둘 다 살아 있음)을 가정한다.** 실제로는 이보다 작을 수 있다. */
/* ══ 상대별 매치 — 후보 뽑기 · 세 열 배정 ──── */
function foeCands(foe,boss,isBoss,waiters){
  const mine=classPool().filter(p=>owned.has(p.id)&&p.id!==boss.id);
  if(!mine.length||!foe) return [];
  const rows=[];
  mine.forEach(c=>{
    const list = isBoss ? c.mv : c.mv.filter(m=>!m.tagx);   // 서브에는 기믹 기술을 안 쓴다
    let best=null;
    list.forEach(m=>{
      const r=evalMove(c,foe,m,false);
      /* evalMove 결과를 통째로 넘긴다 — 가로 슬롯이 위력·공격·방어까지 쓴다 */
      const row={...r, c, m, ko:r.dmg*KHP>=foe.hp, spd:c.sp-foe.sp,
                 inc:foeHitOne(c,foe),
                 /* 대기 중인 카드마다 «그 카드 기준» 으로 다시 계산한다.
                    **보스를 칠 때도 대기 중인 서브가 맞는다** — 열을 가리지 않는다 (v3.20.0).
                    ⚠ 방어는 쓰지 않는다 (v3.26.0 실측) — 배율과 대상 HP 만 본다. */
                 sps: (waiters||[]).map(w=>{
                       /* `r.pw`·`r.atk` 는 이미 다이맥스·메가·룰렛 보정까지 반영된 값이다.
                          방어(`r.def`)만 쓰지 않고, 배율은 «그 대기 카드» 기준으로 다시 구한다. */
                       const rate=splashRate(r.pw, r.atk, eff(m.t,w.t));
                       return { n:w.n, rate, pt:rate*w.hp,
                                far: r.pw*r.atk > SPL_FIT_MAX }; })};
      row.splash = row.sps.reduce((a,x)=>a+x.pt,0);   // 합산 여파
      row.tier = isBoss ? 'boss' : (row.ko&&row.spd>0 ? 0 : row.ko ? 1 : 2);
      if(!best||cmpCand(row,best,isBoss)<0) best=row;
    });
    if(best) rows.push(best);
  });
  return rows.sort((a,b)=>cmpCand(a,b,isBoss));
}
/* 대상은 그냥 최대 화력. 서브는 «무피해 → 한 대 맞고 처치 → 버티기» 순이고,
   같은 등급 안에서는 **여파가 큰 쪽**(등급 0) · **덜 맞는 쪽**(등급 1·2) 이다.

   ⚠ **«센 카드를 아낀다» 는 규칙은 걷어냈다** (v3.15.0 · 잭 지적).
   지역배틀은 **내 세 장을 한꺼번에 올리고 상대 세 장에 하나씩 맞붙인다** —
   보스 대항 태그도 그때 같이 정해진다. 즉 **세 장이 전부 어딘가에 쓰이므로
   «아껴 둘» 자리가 없다.** v3.13.1 까지 쓰던 `keep`(그 카드의 대상 화력) 기준은
   턴이 순서대로 흐르는 로테이션의 사고를 잘못 옮겨 온 것이었다.
   **다시 넣지 말 것** — 넣으면 보스에 좋은 카드를 서브에서 빼는데,
   보스 칸은 이미 `assignPlans` 가 «대상 화력 최대» 로 함께 풀고 있어 이중으로 센다. */
function cmpCand(a,b,isBoss){
  if(isBoss) return (b.dmg-a.dmg)||(b.splash-a.splash);   // 화력이 같으면 여파로 가른다
  return (a.tier-b.tier)
      || (a.tier===0 ? (b.splash-a.splash)||(b.dmg-a.dmg)
                     : (a.inc-b.inc)||(b.splash-a.splash));
}

/* 세 열에 **서로 다른 카드**를 배정한다 (v1.99.0 · 잭 지적).
   지역배틀은 내 카드 3장을 동시에 필드에 올리므로 **같은 카드를 두 칸에 못 놓는다** —
   다만 그 카드를 2장 가졌으면 두 번 쓸 수 있어 `owned.cnt` 까지 본다.
   로테이션 엔진은 진작 `owned.cnt(X.id)<2` 로 이걸 보고 있었고 여기만 빠져 있었다.

   고르는 기준(위에서부터): ① 서브 등급 합이 작을수록 ② 대상 피해가 클수록
   ③ 서브 피격 합이 작을수록. **서브의 «무피해» 를 대상 화력보다 앞에 둔다** —
   서브를 무피해로 넘기면 그 장이 배틀에서 빠져 남은 턴이 통째로 벌린다.
   열마다 상위 14장만 후보로 봐서 최악 2744 조합이면 끝난다. */
function assignPlans(cols, foeOf, boss){
  /* 내가 한 장을 칠 때 대기 중인 상대 = 채워진 칸의 나머지 (보스 포함) */
  const lists = cols.map(at=>{ const f=foeOf(at); if(!f) return null;
    const waiters = cols.map(foeOf).filter(x=>x && x!==f);
    return foeCands(f,boss,at==='B',waiters).slice(0,14); });
  const idx = cols.map((at,i)=> lists[i]&&lists[i].length ? 0 : -1);
  let bestSel=null, bestKey=null;
  const key=sel=>{
    let tier=0, inc=0, dmg=0, sp=0;
    cols.forEach((at,i)=>{ const r=sel[i]; if(!r) return;
      sp+=r.splash||0;                       // 여파는 보스 열도 센다 (v3.20.0)
      if(at==='B') dmg=r.dmg; else { tier+=r.tier; inc+=r.inc; } });
    /* 서브 등급 → 대상 화력 → **서브들이 보스에 남기는 여파** → 서브 피격 */
    return [tier,-dmg,-sp,inc];
  };
  const better=(a,b)=>{ for(let i=0;i<a.length;i++){ if(a[i]!==b[i]) return a[i]<b[i]; } return false; };
  const n=cols.length;
  const walk=(i,sel,used)=>{
    if(i===n){
      const k=key(sel);
      if(!bestKey||better(k,bestKey)){ bestKey=k; bestSel=sel.slice(); }
      return;
    }
    if(idx[i]<0){ sel[i]=null; walk(i+1,sel,used); return; }
    lists[i].forEach(r=>{
      const id=r.c.id;
      if((used.get(id)||0) >= owned.cnt(id)) return;   // 가진 장수를 넘겨 쓸 수 없다
      used.set(id,(used.get(id)||0)+1);
      sel[i]=r; walk(i+1,sel,used);
      used.set(id,used.get(id)-1);
    });
  };
  walk(0,new Array(n).fill(null),new Map());
  /* 후보가 모자라 아무 조합도 못 만들면 겹치더라도 각자 최선을 준다 — 빈 화면보다 낫다 */
  if(!bestSel) return cols.map((at,i)=> lists[i]&&lists[i][0] || null);
  return bestSel;
}

/* 상대 파티 3슬롯. 가운데는 보스 선택과 연동되고, 양옆만 여기서 고른다. */
/* ══ 서브 픽커 상태 · 초성 검색 ──── */
let foePickAt=-1, foeRank='5', foeSet='1';
/* foeChain — 둘 다 빈 상태에서 열었나. 켜져 있으면 한 장 고른 뒤 남은 칸으로 넘어간다 */
let foeChain=false;
/* 검색어. 비어 있지 않으면 **성급·탄 거르개를 무시하고 전체에서 찾는다** (v2.6.0 · 잭 지정) —
   어느 성급인지 몰라서 검색하는 것이므로 성급을 걸어 두면 못 찾는다. */
let foeQ='';
/* 한글 초성 검색 — 모바일에서 이름을 다 치는 건 일이라 «ㄴㅍㅇ → 님피아» 도 받는다.
   질의가 자모(ㄱ~ㅎ)로만 되어 있을 때만 초성 대조를 한다. */
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const choOf=t=>[...t].map(c=>{const u=c.charCodeAt(0)-0xAC00;
  return (u>=0&&u<11172)?CHO[Math.floor(u/588)]:c}).join('');
const isCho=t=>/^[\u3131-\u314E]+$/.test(t);
const foeMatch=(name,q)=>{
  const n=name.replace(/\s/g,''), t=q.replace(/\s/g,'');
  if(!t) return true;
  return isCho(t) ? choOf(n).includes(t) : n.includes(t);
};
/* 지역배틀 출력은 «턴 순서»가 아니라 «상대 한 장마다 무엇을 낼지»다 (잭 지적).
   순서가 없으므로 «로테이션 1·2·3» 처럼 번호를 매기면 턴으로 오해된다. 명칭을 모드별로 가른다. */
/* ══ 상대별 매치 렌더 (renderFoes 가 240줄이다) ──── */
function renderRotTitle(){
  const local = mode==='지역';
  const h2=document.getElementById('rotH2'), hint=document.getElementById('rotHint'),
        nav=document.getElementById('navRot');
  // 제목은 서브셋 폰트(Black Han Sans 373자)를 쓴다. **«응» 글리프가 없어 «대응» 은 못 쓴다.**
  if(h2)   h2.textContent   = local ? '상대별 매치' : '추천 로테이션';
  if(hint) hint.textContent = local ? '상대 한 장마다 낼 태그 · 순서 없음' : '보유 태그 기준 · 탄 무관';
  if(nav)  nav.textContent  = local ? '매치' : '로테이션';
}
function renderFoes(){
  const sec=document.getElementById('foeBox'); if(!sec) return;
  renderRotTitle();
  sec.hidden = (mode!=='지역');
  const sg=document.getElementById('foeSeg'); if(sg) sg.hidden = (mode!=='지역');
  if(sec.hidden){ foePickAt=-1; foeChain=false; }
  const wrap=document.getElementById('foeLanes'); if(!wrap) return;
  const boss=BOSSES.find(b=>b.id===bossId);
  // 저장된 bossId 가 무효하거나(탄 개편 등) 아직 못 고른 상태 — 여기서 죽으면 안 된다.
  if(!boss){
    wrap.innerHTML='<p class="tab-note">보스를 먼저 고르세요.</p>';
    const pk=document.getElementById('foeModal'); if(pk) pk.hidden=true;
    const nt=document.getElementById('foeNote'); if(nt) nt.textContent='';
    return;
  }

  /* 위 줄 = 상대 3장(서브·대상·서브), 아래 줄 = 그에 매칭되는 내 태그 3장.
     한 그리드에 6칸을 넣어야 열이 정확히 맞는다. */
  /* ══ 매치 ① 세 열 정의 · 상대 칸 그리기 ──── */
  const cols=[0,'B',1];
  const foeOf=at=> at==='B' ? boss : (foes[at]&&SUBBY.get(foes[at]));

  /* 틀을 정사각으로 고정하면 줄은 맞지만 **가로 아트만 있는 줄은 위아래가 텅 빈다**
     (v1.85.0 에서 실제로 그랬다). 그래서 **그 줄에 세로짜리가 있을 때만** 정사각을 쓴다.
     빈 서브 칸의 «누를 자리» 상자도 세로라 여기 포함된다. 세로가 하나도 없으면
     틀이 곧 그림이라 남는 자리가 없다 (v1.86.0 · 잭 지정). */
  const isPort=c=> !!(c && tagArt(c) && '432'.includes(c.r));
  const rowP = [0,1].some(at=> foes[at]==null || isPort(SUBBY.get(foes[at])));

  /* 아트 썸네일. 저성급 서브는 아트가 없어 타입색 그라디언트로 떨어진다.
     ph=true 면 «누를 자리» 빈 상자다 (빈 서브 칸 전용 · v1.81.0 · 잭 지정). */
  const art=(c,ph)=>{
    if(!c && ph) return `<span class="fl-art p ph"><i></i></span>`;
    const has = c && tagArt(c);
    const bg = has ? 'var(--art) center/cover'
      : c ? `linear-gradient(135deg,${COLOR[c.t[0]]}CC,rgba(12,7,34,.9))`
          : 'repeating-linear-gradient(135deg,rgba(74,47,156,.45) 0 7px,rgba(30,19,73,.45) 7px 14px)';
    // ★4 이하는 실물이 **세로 카드**라 아트도 세로다. 아트가 있을 때만 비율을 바꾼다 —
    // 없으면 그라디언트만 길쭉해져 빈 칸이 커진다.
    const pt = has && '432'.includes(c.r) ? ' p' : '';
    return `<span class="fl-art${pt}"><i style="background:${bg}"></i></span>`;
  };
  const foeCell=(at)=>{
    const isB=at==='B', f=foeOf(at);
    if(isB) return `<div class="fl-cell foe mid set${rowP?' pf':''} ${artCls(boss)}">`
      +`<span class="fl-role">보스</span>${art(boss)}`
      +`<span class="fl-n wt fl-tp">${boss.t.map(tp).join('')}<span class="nm">${boss.n}</span></span>`
      +`<span class="fl-meta">★${boss.r}</span>`
      +`<span class="fl-s one">HP ${boss.hp}·속도 ${boss.sp}</span></div>`;
    return `<div class="fl-cell foe${f?' set':' empty'}${rowP?' pf':''} ${f?artCls(f):''}" data-at="${at}" role="button" tabindex="0"`
      +`${f?'':' aria-label="서브 '+(at===0?1:2)+' 선택"'}>`
      +`<span class="fl-role">서브 ${at===0?1:2}</span>${art(f,true)}`
      +(f?`<span class="fl-x" data-clr="${at}">✕</span><span class="fl-n wt fl-tp">${f.t.map(tp).join('')}<span class="nm">${f.n}</span></span>`
          +`<span class="fl-meta">${rlab(f.r)}</span>`
          +`<span class="fl-s one">HP ${f.hp}·속도 ${f.sp}</span>`
         :`<span class="fl-r">서브 선택</span>`)+`</div>`;
  };
  /* 세 열을 **한꺼번에** 푼다. 열마다 따로 풀면 같은 카드가 두 칸에 앉는다 (v1.99.0).
     세로 칸과 가로 슬롯이 같은 결과를 나눠 쓰므로 계산은 한 번뿐이다. */
  /* ══ 매치 ② 내 태그 칸 배정 (assignPlans) ──── */
  const assigned = assignPlans(cols, foeOf, boss);
  const plan=(at)=> assigned[cols.indexOf(at)] || null;

  /* 세로 «낼 태그» 칸 — 한눈에 보는 쪽. 아래 가로 슬롯이 같은 내용을 수치까지 펼친다. */
  const meCell=(at)=>{
    const isB=at==='B', f=foeOf(at);
    /* 아래 줄에는 머리말을 두지 않는다 (v1.87.0 · 잭 지정). 세 칸 모두 «낼 태그» 라
       읽을 것이 없는데 줄 높이만 먹었다. **되살리지 말 것.** */
    const head='';
    if(!f) return `<div class="fl-cell empty${isB?' mid':''}">${head}${art(null)}<span class="fl-r">—</span></div>`;
    const p=plan(at);
    if(!p) return `<div class="fl-cell empty${isB?' mid':''}">${head}${art(null)}<span class="fl-r">보유 태그 없음</span></div>`;
    const sp = p.spd>0?`선공 +${p.spd}`: p.spd===0?'동속':`후공 ${p.spd}`;
    const tag = verdictTag(p,isB,f);
    /* **피격은 늘 적는다** (v3.19.0 · 잭 지적). v1.93.0~3.18.0 은 «무피해» 면 감췄는데,
       무피해는 «선공 + 원턴킬» 이 둘 다 성립할 때의 이야기다 —
       **선공은 확률이 섞이고, 저성급 상대는 격파 판정 자체가 실측 범위 밖(«무피해?»)** 이다.
       빗나갔을 때 얼마나 맞는지가 바로 그때 필요한 숫자라 감추면 안 된다.
       `isB` 로 감추지 말 것도 그대로 유효하다 (v1.93.0). */
    const hit = `·피격 ${p.inc<0.005?'&lt;1':Math.round(p.inc*100)}%`;
    return `<div class="fl-cell${isB?' mid':''} ${artCls(p.c)}">${head}${art(p.c)}`
      +`<span class="fl-n wt fl-tp">${tp(p.m.t)}<span class="nm">${p.c.n}</span>`
      +`${p.c.g?`<i class="gi fl-gi ${GK[p.c.g]}${p.m.tagx?' use':''}" title="${p.c.g}${p.m.tagx?' 사용':' 보유 · 이 매치에서는 안 씀'}"></i>`:''}</span>`
      +`<span class="fl-m">`
      +`<span class="mv">${p.m.n}</span>`
      +`${p.mult!==1?`<span class="mx ${p.mult>=2?'good':'bad'}">공×${p.mult}</span>`:''}</span>`
      +`<span class="fl-s one">${sp}${hit}</span>`+tag+`</div>`;
  };

  /* 같은 내용을 **수치까지 펼친** 가로 슬롯. **로테이션 슬롯(.slot)과 같은 마크업**을 쓴다 —
     세로 3칸에는 위력·공격·방어까지 못 넣어 v1.97.0 에서 갈아탔다 (잭 지정).
     `.slot-body` 는 `[data-d]` 규칙이 이미 «상성/상세» 로 여닫아 준다. */
  const planSlot=(at)=>{
    const isB=at==='B', f=foeOf(at);
    /* 가운데 칸은 보스다 — «대상» 은 무엇의 대상인지 안 읽힌다 (v3.16.0 · 잭 지정) */
    const lab = isB?'보스':'서브 '+(at===0?1:2);
    const shell=(inner)=>`<div class="slot mslot${isB?' mid':''}">
      <div class="head"><span class="thumb rthumb"><span class="turn${isB?'':' sp'}">${lab}</span>
        <span class="qm">?</span></span>
      <span class="who"><span class="n">${inner}</span></span></div></div>`;
    if(!f) return shell('상대를 입력하면 내야할 태그를 추천합니다');
    const p=plan(at);
    if(!p) return shell('보유 태그 없음');
    const c=p.c, art=tagArt(c);
    const c1=COLOR[c.t[0]], c2=COLOR[c.t[1]||c.t[0]];
    const tb = art ? `linear-gradient(to top,rgba(8,5,22,.55),rgba(8,5,22,.05)),var(--art) center/cover`
                   : `linear-gradient(135deg,${c1},${c2})`;
    const sp = p.spd>0?'선공':p.spd===0?'동속':'후공';
    const tag = verdictTag(p,isB,f);
    /* 기믹은 **쓸 때만 배지**로, 가졌지만 안 쓰면 흐린 아이콘으로 (v1.96.0 규칙 유지) */
    const gimx = p.move&&p.move.tagx ? gm(p.move.tagx)
      : (c.g?`<i class="gi mgi ${GK[c.g]}" title="${c.g} 보유 · 이 매치에서는 안 씀"></i>`:'');
    const q=zseq(p.move);
    return `<div class="slot mslot${isB?' mid':''} ${artCls(c)}">
      <div class="head">
        <span class="thumb" style="background:${tb}">
          <span class="turn${isB?'':' sp'}">${lab}</span>
          <span class="spd ${p.spd>0?'first':'late'}">${sp}${p.spd?` ${p.spd>0?'+':''}${p.spd}`:''}</span></span>
        <span class="who">
          <span class="n">${c.n}
            <span class="t" style="background:${RARITY[c.r].color};color:#180F38">${rlab(c.r)}</span>
            <span class="badge b-set">${c.s==='공통'?'공통':c.s+'탄'}</span>${gimx}${tag}
          </span>
          <span class="mv">${p.move?`${p.move.n} · ${p.move.k}`:''} &nbsp;${c.t.join('·')}</span>
          <span class="vsline">vs ${f.t.map(tp).join('')}<b>${f.n}</b> ${rlab(f.r)} · HP ${f.hp}·속도 ${f.sp}</span>
        </span>
        <span class="dmg2"><b>${Math.round(p.dmg)}</b><i>예상 피해</i></span>
      </div>
      ${q?`<div class="zrow"><span class="zl">Z기술</span>
        <span class="zk">${[...q].map(x=>`<i class="${x==='우'?'r':'l'}">${x}</i>`).join('')}</span></div>`:''}
      <div class="slot-body"><div class="mults">
        <span class="mult"><span class="k">주는</span><b class="${mc(p.mult)}">×${p.mult}</b></span>
        <span class="mult"><span class="k">받는</span><b class="${dc(p.d)}">×${p.d}</b>${p.d===0?'<span style="color:var(--ok)">무효</span>':''}</span>
        ${p.move?`<span class="mult t2"><span class="k">위력</span><b>${p.pw}</b></span>`:''}
        <span class="mult t2"><span class="k">스피드</span><b>${c.sp}</b><span>${sp}</span></span>
        <span class="mult t2"><span class="k">피격</span>
          <b>${p.inc<0.005?'&lt;1':Math.round(p.inc*100)}%</b>
          ${p.tier===0?'<span>격파 실패 · 후공 때만</span>':''}</span>
        ${(p.sps||[]).length?`<span class="mult t2"><span class="k">여파</span><b>${Math.round(p.splash||0)}</b>
          <span>${p.sps.map(x=>x.n+' '+Math.round(x.rate*100)+'%'+(x.far?'?':'')).join(' · ')}
          · 급소면 ×2${p.sps.some(x=>x.far)?' · <b>?</b>는 실측 범위 밖':''}</span></span>`:''}
        ${p.move?`<span class="mult wide t2"><span class="k">공격</span><span class="v"><b>${p.raw}<span style="opacity:.6">+${p.bonus}</span>=${p.atk}</b> <span style="opacity:.6">/ ${p.move.k==='물리'?'방어':'특수방어'} ${p.def}</span></span></span>`:''}
      </div></div>
    </div>`;
  };

  wrap.className='fl-grid';
  /* ══ 매치 ③ 그리드 그리기 — 위 3칸 · 연결선 · 아래 3칸 ──── */
  wrap.innerHTML = cols.map(foeCell).join('')
    + cols.map(at=>`<div class="fl-link${at==='B'?' mid':''}">▼</div>`).join('')
    + cols.map(meCell).join('');
  /* 3칸 그룹은 그대로 두고 **그 아래에** 수치를 펼친 슬롯을 덧붙인다 (v1.98.0 · 잭 지정) */
  document.getElementById('foePlans').innerHTML =
    `<span class="mplans-l">낼 태그 자세히</span>` + cols.map(planSlot).join('');

  wrap.querySelectorAll('.fl-cell.foe[data-at]').forEach(n=>{
    const i=+n.dataset.at;
    n.addEventListener('click',e=>{
      if(e.target&&e.target.dataset.clr!=null){ foes[i]=null; foePickAt=-1; foeChain=false; save(); renderAll(); return; }
      if(foePickAt===i){ foePickAt=-1; foeChain=false; }
      else {
        /* 둘 다 비어 있으면 «이어 고르기». 처음 상대를 넣을 때 팝업을 두 번 여는 게
           제일 잦은 동선이라, 한 장 고르면 닫지 않고 남은 칸으로 넘어간다 (v1.83.0 · 잭 지정).
           한 칸이라도 차 있으면 종전대로 그 칸만 고치고 닫는다. */
        foePickAt=i; foeChain = (foes[0]==null && foes[1]==null); clearFoeQ();
      }
      renderFoes();
    });
  });
  /* ══ 매치 ④ 서브 픽커 모달 ──── */
  const pick=document.getElementById('foeModal');
  pick.hidden = foePickAt<0;
  if(foePickAt>=0){
    const step = foeChain ? (foes[foePickAt===0?1:0]==null ? ' <span class="pickstep">1 / 2</span>'
                                                          : ' <span class="pickstep">2 / 2</span>') : '';
    document.getElementById('foePickH').innerHTML=`서브 ${foePickAt===0?1:2} 선택${step}`;
    document.querySelectorAll('#foeRank button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.r===foeRank));
    /* 켜진 탄이 하나뿐이면 픽커의 탄 스위치는 고를 것이 없다 — 줄째 감춘다 */
    const onSets=['1','2'].filter(k=>foeSets[k]);
    if(!foeSets[foeSet]) foeSet=onSets[0];
    document.querySelectorAll('#foeSet button').forEach(b=>{
      b.hidden = !foeSets[b.dataset.s];
      b.setAttribute('aria-pressed',b.dataset.s===foeSet);
    });
    const searching = !!foeQ;
    /* 검색 중에는 성급·탄 거르개를 통째로 감춘다 — 안 감추면 «눌러도 목록이 안 바뀐다» 로 보인다 */
    document.getElementById('foeRank').hidden = searching;
    document.getElementById('foeSet').hidden = searching || (foeRank==='R') || onSets.length<2;
    const g=document.getElementById('foeGrid'); g.innerHTML='';
    /* 레귤러는 «공통» 이라 탄이 없다. 탄 거르개를 태우면 목록이 텅 빈다 (v2.1.0) */
    /* 설정에서 끈 탄은 후보에서 통째로 뺀다 (v2.8.0). 검색도 마찬가지 —
       «안 나오는 탄» 을 검색으로 우회해 넣을 수 있으면 끈 의미가 없다. */
    const list = (searching
      ? FOEPOOL.filter(s=>foeMatch(s.n,foeQ))
      : FOEPOOL.filter(s=>s.r===foeRank&&(foeRank==='R'||s.s===foeSet))).filter(foeOn);
    if(searching && !list.length)
      g.innerHTML='<p class="tab-note" style="grid-column:1/-1;margin:2px">찾는 이름이 없습니다</p>';
    /* 안내줄은 **목록을 만든 뒤** 채운다 — 개수를 쓰기 때문이다.
       위로 올리면 `searching`·`list` 가 아직 없어 TDZ 로 죽는다 (v2.6.0 에서 한 번 당했다). */
    const hint=document.getElementById('foePickHint');
    hint.hidden = !(foeChain||searching);
    hint.textContent = searching
      ? `«${foeQ}» 검색 — 성급·탄 상관없이 ${list.length}장`
        + (foeChain?' · 고르면 남은 칸으로 넘어갑니다':'')
      : '고르면 남은 칸으로 넘어갑니다 · 한 장만 넣으려면 바깥을 눌러 닫으세요';
    list.forEach(s=>{
      const b=document.createElement('button');
      /* 같은 이름이 성급마다 있다 (님피아 ★4·★5 · 고릴타 ★4·★5 …).
         검색 결과는 성급·탄이 섞이므로 **반드시 함께 적는다.** */
      b.innerHTML = searching
        ? `${s.n}<small>${rlab(s.r)} · ${s.s==='공통'?'공통':s.s+'탄'}</small>`
        : s.n;
      /* 지금 고치는 칸에 들어 있는 태그는 «진하게 채워» 한눈에 구분되게 한다 (v1.84.0 · 잭 지정).
         다른 칸에 든 태그는 테두리만 줘서 «이미 씀» 정도로만 표시한다 — 같은 세기로 칠하면
         어느 쪽이 이 칸 것인지 알 수 없다. */
      const other = foePickAt===0?1:0;
      if(foes[foePickAt]===s.id){ b.className='on'; b.setAttribute('aria-pressed','true'); }
      else if(foes[other]===s.id){ b.className='used'; b.title=`서브 ${other===0?1:2} 에 넣음`; }
      b.addEventListener('click',()=>{
        foes[foePickAt]=s.id;
        clearFoeQ();          // 이어 고르기로 넘어갈 때 검색어를 물고 가지 않는다
        const other = foePickAt===0?1:0;
        // 이어 고르기 중이고 남은 칸이 아직 비었으면 닫지 않고 그쪽으로 넘긴다
        if(foeChain && foes[other]==null){ foePickAt=other; }
        else { foePickAt=-1; foeChain=false; }
        save(); renderAll();
      });
      g.appendChild(b);
    });
  }
  const k=foeCount();
  document.getElementById('foeNote').innerHTML = k
    /* 뒤에 붙어 있던 «선공은 확률이라 무피해는 보장이 아니다 · 로테이션 생존은 최악 상정»
       두 문장은 **잭 지정으로 뺐다** (v1.94.0). 길어서 안 읽힌다.
       **내용 자체는 여전히 참이고 CLAUDE.md «판정 기준» 절에 남아 있다** —
       판정 로직을 낙관 쪽으로 바꾸는 근거로 삼지 말 것. 되살리지도 말 것. */
    ? `서브 ${k}장 반영. 아래 칸은 <b>바로 위 상대가 활성일 때 낼 태그</b>입니다 — 서브는 «선공 + 원턴킬»이면 `
      +`그 턴 피해가 0 이고 그 장은 배틀에서 빠집니다.`
    : '위 서브 칸을 눌러 상대를 넣으면 아래에 대응 태그가 나옵니다. 비워두면 <b>보스 한 장</b>만 때린다고 봅니다.';
}
/* 보스를 바꾸면 **서브를 비운다** (v2.0.0 · 잭 지정). 서브는 «그 보스와 같은 파티에
   나온 상대» 라 보스가 바뀌면 남아 있을 이유가 없고, 남겨 두면 지난 파티의 서브에
   맞춘 추천이 새 보스 화면에 그대로 떠서 **틀린 답을 맞는 답처럼 보여 준다.**
   **같은 보스를 다시 눌렀을 때는 건드리지 않는다** — 그건 바꾼 게 아니다.
   `foes` 는 저장되므로 비운 뒤 `save()` 를 꼭 부를 것. */
/* ══ 보스 선택 · 보스 그리드 ──── */
function setBoss(id){
  if(bossId===id) return false;
  bossId=id; foes=[null,null]; foePickAt=-1; foeChain=false;
  /* 쓰임새 신호 (v3.40.1) — 보스를 실제로 «바꿀» 때만 보낸다 (같은 보스 재탭은 위에서 걸러진다).
     ⚠ 보스 이름은 보내지 않는다 — 어떤 보스가 인기인지는 알고 싶지만, 개인정보 안내에
     «무엇을 보내는지» 를 늘려 적어야 할 만큼의 값은 아니다. 필요해지면 그때 안내부터 고칠 것. */
  track('boss_pick');
  save(); return true;
}
function renderBosses(){
  /* 설정에서 켠 탄이 하나뿐이면 **보스도 그 탄으로 고정하고 스위치를 감춘다** (v2.9.0 · 잭 지정).
     고를 것이 없는 스위치를 두면 눌러도 아무 일이 없어 고장처럼 보인다.
     여기서는 `foeOn` 을 쓰지 않는다 — 그 함수는 «상대 후보 목록» 전용이고,
     `sync.js` 가 등장 횟수로 번짐을 감시한다. 탄 여부는 `foeSets` 를 직접 본다. */
  const onSets=['1','2'].filter(k=>foeSets[k]);
  if(!foeSets[setView]) setView=onSets[0];
  /* 레귤러 보스는 «공통» 이라 탄이 없다 — 그때는 탄 스위치를 감춘다 (v3.7.0) */
  const isR = bossRank==='R';
  const sw=document.getElementById('bossSetSw'); if(sw) sw.hidden = isR || onSets.length<2;
  const g=document.getElementById('bossGrid');g.innerHTML='';
  const list=BOSSES.filter(b=>isR ? b.r==='R' : (b.s===setView&&b.r===bossRank));
  list.forEach(b=>{
    const n=el(bossTag(b,b.id===bossId));
    n.addEventListener('click',()=>{setBoss(b.id);renderAll();goSection('sSup')});
    g.appendChild(n);
  });
  document.getElementById('sw1').setAttribute('aria-pressed',setView==='1');
  document.getElementById('sw2').setAttribute('aria-pressed',setView==='2');
  document.querySelectorAll('.modesw button').forEach(b=>
    b.setAttribute('aria-pressed', b.dataset.mode===mode));
  const mn=document.getElementById('modeNote');
  if(mn) mn.innerHTML=MODES[mode].note;
  ['6','5','R'].forEach(r=>document.getElementById('sr'+r).setAttribute('aria-pressed',bossRank===r));
  const lab = isR ? '레귤러' : `${setView}탄 ★${bossRank}`;
  document.getElementById('bossHint').textContent = list.length
    ? `${lab} · ${list[0].code} ~ ${list[list.length-1].code}`
    : `${lab} 데이터 없음`;
}

/* ══ 보스 정보박스 ──── */
function renderReadout(){
  const ro=document.getElementById('readout');
  /* 지역배틀에서는 이 큰 보스 정보박스를 내지 않는다 (v1.67.0 · 잭 지정).
     바로 위 «상대 파티» 그리드가 대상을 이미 아트와 함께 보여 주므로 같은 카드가 두 번 나온다. */
  if(ro) ro.hidden = (mode==='지역');
  if(mode==='지역') return;
  const b=POOL.find(p=>p.id===bossId);
  const bk={x4:[],x2:[],res:[],nil:[]};
  T.forEach(x=>{const m=eff(x,b.t);
    if(m>=4)bk.x4.push(x);else if(m>1)bk.x2.push(x);else if(m===0)bk.nil.push(x);else if(m<1)bk.res.push(x)});
  const row=(c,l,ls)=>`<div class="row"><span class="lab ${c}">${l}</span>`
    +`<span class="rv">${ls.length?ls.map(tp).join(''):'<span class="none">없음</span>'}</span></div>`;
  const mx=Math.max(b.hp,b.a,b.d,b.sa,b.sd,b.sp,180);
  const bar=(k,v,col,hl)=>`<div class="st${hl?' hl':''}"><span class="k">${k}</span>
    <span class="bar"><i style="width:${Math.round(v/mx*100)}%;background:${col}"></i></span>
    <span class="v">${v}</span></div>`;
  const phys=b.sd>b.d, even=b.sd===b.d;
  const dir=even?'물리·특수 동일':(phys?'물리 공격 유리':'특수 공격 유리');
  const detail=even?`방어 ${b.d} = 특수방어 ${b.sd}`:(phys?`방어 ${b.d} < 특수방어 ${b.sd}`:`특수방어 ${b.sd} < 방어 ${b.d}`);

  const art=tagArt(b);
  const c1=COLOR[b.t[0]], c2=COLOR[b.t[1]||b.t[0]];
  const heroBg = art
    ? `linear-gradient(to top,rgba(24,15,58,.97) 4%,rgba(24,15,58,.66) 42%,rgba(24,15,58,.12) 78%,rgba(0,0,0,.38) 100%),var(--art) center/cover`
    : `linear-gradient(135deg,${c1}CC,${c2}99 60%,rgba(24,15,58,.95))`;

  document.getElementById('readout').innerHTML=`
  <div class="bhero ${artCls(b)}" style="background:${heroBg}">
    <div class="meta"><span class="st6">★★★★★★</span>
      <span class="cd">${b.code} · ${b.s}탄 · ${b.cls}</span></div>
    <div class="line">
      <h3>${b.n}</h3>
      <div class="en"><b>${b.e}</b><i>메너지</i></div>
    </div>
    <div class="tps">${b.t.map(tp).join('')}
      ${b.g?gm(b.g):''}</div>
  </div>
  <div class="binner">
  <div class="stats">
    ${bar('HP',b.hp,'#FFD534')}${bar('스피드',b.sp,'#6FD34F')}
    ${bar('공격',b.a,'#FF5A5A')}${bar('방어',b.d,'#FF8FA8',phys&&!even)}
    ${bar('특수공격',b.sa,'#59A6FF')}${bar('특수방어',b.sd,'#7DC6FF',!phys&&!even)}
  </div>
  <div class="verdict">
    <div class="vd"><span class="k">공격 방향</span>
      <span class="v" style="color:${even?'var(--star)':(phys?'#FF8FA8':'#7DC6FF')}">${dir}</span>
      <span class="k">${detail}</span></div>
    <div class="vd"><span class="k">보스 기술</span>
      <span class="v">${b.mv.map(m=>m.n).join(' · ')}</span>
      <span class="k">${b.mv.map(m=>`${m.t}/${m.k}${m.tagx?' '+m.tagx:''}`).join(' · ')}</span></div>
    <div class="vd"><span class="k">선공 기준</span>
      <span class="v">스피드 ${b.sp} 초과</span>
      <span class="k">${b.sp<=60?'매우 느림 — 대부분 선공':b.sp>=140?'매우 빠름 — 선공 어려움':'중간대'}</span></div>
  </div>
  <div class="matrix">
    ${row('x4','×4 약점',bk.x4)}${row('x2','×2 약점',bk.x2)}
    ${row('res','반감 이하',bk.res)}${row('nil','무효 ×0',bk.nil)}
  </div></div>`;
}

/* ══ 로테이션 슬롯 카드 ──── */
function slotHTML(r,i,reuse,boss,spare){
  if(r.rand) return `<div class="slot rand${spare?' spare':''}">
    <div class="head">
      <span class="thumb rthumb"><span class="turn${spare?' sp':''}">${spare?'예비':(i+1)+'<i>턴</i>'}</span><span class="qm">?</span></span>
      <span class="who"><span class="n">랜덤 태그</span>
        <span class="mv">${spare?'슬롯을 채울 태그가 없어 기기가 무작위로 줍니다':'가진 태그가 모자라 기기가 무작위로 넣어 줍니다'}</span></span>
      <span class="dmg2"><b>—</b><i>예측 불가</i></span>
    </div>
  </div>`;
  const c=r.c, art=tagArt(c);
  const c1=COLOR[c.t[0]], c2=COLOR[c.t[1]||c.t[0]];
  const tb = art
    ? `linear-gradient(to top,rgba(8,5,22,.55),rgba(8,5,22,.05)),var(--art) center/cover`
    : `linear-gradient(135deg,${c1},${c2})`;
  return `<div class="slot${spare?' spare':''} ${artCls(c)}">
    <div class="head">
      <span class="thumb" style="background:${tb}">
        <span class="turn${spare?' sp':''}">${spare?'예비':(i+1)+'<i>턴</i>'}</span>
        ${reuse?'<span class="reuse">재사용</span>':''}
        ${c.measured?`<span class="spd ${c.sp>boss.sp?'first':'late'}">${c.sp>boss.sp?'선공':'후공'}</span>`:''}</span>
      <span class="who">
        <span class="n">${c.n}
          <span class="t" style="background:${RARITY[c.r].color};color:#180F38">${rlab(c.r)}</span>
          <span class="badge b-set">${c.s==='공통'?'공통':c.s+'탄'}</span>
          ${r.move&&r.move.tagx?gm(r.move.tagx):(r.mega?gm('메가진화'):'')}
        </span>
        <span class="mv">${r.move?`${r.move.n} · ${r.move.k}`:''} &nbsp;${c.t.join('·')}</span>
      </span>
      <span class="dmg2"><b>${Math.round(r.dmg)}</b><i>예상 피해</i></span>
    </div>
    ${(()=>{const q=zseq(r.move); return q
      ? `<div class="zrow"><span class="zl">Z기술</span>
          <span class="zk">${[...q].map(c=>`<i class="${c==='우'?'r':'l'}">${c}</i>`).join('')}</span></div>`
      : ''})()}
    <div class="slot-body"><div class="mults">
      <span class="mult"><span class="k">주는</span><b class="${mc(r.mult)}">×${r.mult}</b></span>
      <span class="mult"><span class="k">받는</span><b class="${dc(r.d)}">×${r.d}</b>${r.d===0?'<span style="color:var(--ok)">무효</span>':''}</span>
      ${r.move?`<span class="mult t2"><span class="k">위력</span><b>${r.pw}</b></span>`:''}
      ${c.measured?`<span class="mult t2"><span class="k">스피드</span><b>${c.sp}</b><span>${c.sp>boss.sp?'선공':'후공'}</span></span>`:''}
      ${r.move?`<span class="mult wide t2"><span class="k">공격</span><span class="v"><b>${r.raw}<span style="opacity:.6">+${r.bonus}</span>=${r.atk}</b> <span style="opacity:.6">/ ${r.move.k==='물리'?'방어':'특수방어'} ${r.def}</span></span></span>`:''}
    </div></div>
  </div>`;
}

/* ══ 로테이션 렌더 ──── */
function renderRotation(){
  const box=document.getElementById('rotBox');
  /* 지역배틀에서는 턴별 카드 목록을 통째로 내지 않는다 (v1.72.0 · 잭 지정).
     매칭 그리드가 «상대 한 장 → 낼 태그» 를 이미 다 알려 주고,
     턴 번호(1턴·2턴·3턴)는 순서 없는 매치업에서 오히려 틀린 신호다. */
  if(box) box.hidden = (mode==='지역');
  if(mode==='지역') return;
  const boss=POOL.find(p=>p.id===bossId);
  const rot=document.getElementById('rot'), note=document.getElementById('rotNote');
  const base=ranked(boss);
  if(!base.length){
    rot.innerHTML=`<p class="empty">켜진 태그가 없습니다.<br>상단의 <b>컬렉션</b> 탭에서 가진 것을 켜 주세요.</p>`;
    note.textContent=''; return;
  }
  const seq=buildSeq(boss);

  const reuse=seq.length===3 && !seq[0].rand && seq[0].c.id===seq[2].c.id;
  const gims=[...new Set(seq.map(r=>(r.move&&r.move.tagx)||(r.mega?'메가진화':null)).filter(Boolean))];

  rot.innerHTML='';

  // ── 레인: 기기 슬롯 3칸에 무엇을 올릴지. 턴 순서와 별개다.
  const uniq=[...new Map(seq.filter(r=>!r.rand).map(r=>[r.c.id,r])).values()];
  // 예비도 필드에 올라가 매 턴 맞으므로 3대를 버티는 것만 고른다
  const pool0=ranked(boss).filter(r=>!uniq.some(u=>u.c.id===r.c.id));
  const poolSafe=pool0.filter(r=>survives3(r.c,boss));
  const pool=poolSafe.length?poolSafe:pool0;
  const fastPool=pool.filter(r=>r.c.sp>boss.sp);
  const spare=uniq.length&&uniq.length<3
    ? (fastPool.length?fastPool:pool).slice(0,3-uniq.length) : [];
  const spareSlow=spare.length&&!fastPool.length;
  const nRand=uniq.length?3-uniq.length-spare.length:0;

  // 지역배틀에서는 이 블록을 내지 않는다 (v1.66.0 · 잭 지정).
  // 지역배틀은 «상대 파티 매칭» 그리드가 무엇을 낼지 이미 알려 주므로
  // 기기 슬롯 3칸 안내가 겹치기만 하고 판단에 보태는 게 없다.
  if(uniq.length && mode!=='지역'){
    const cell=(r,kind)=>{
      const art=r?tagArt(r.c):null;
      const bg=r
        ? (art?`var(--art) center/cover`
              :`linear-gradient(135deg,${COLOR[r.c.t[0]]}CC,rgba(12,7,34,.9))`)
        : 'repeating-linear-gradient(135deg,rgba(74,47,156,.45) 0 7px,rgba(30,19,73,.45) 7px 14px)';
      const turns=r?seq.map((x,i)=>!x.rand&&x.c.id===r.c.id?i+1:0).filter(Boolean):[];
      const tag = kind==='spare' ? '<span class="lt sp">예비</span>'
                : kind==='rand'  ? '<span class="lt rd">랜덤</span>'
                : `<span class="lt">${turns.join('·')}턴</span>`;
      return `<div class="lane-c${kind==='use'?'':' dim'} ${r?artCls(r.c):''}">
        <span class="lane-f"><span class="lane-i" style="background:${bg}"></span></span>
        <span class="lane-t"><span class="ln">${r?r.c.n:'—'}</span>${tag}</span></div>`;
    };
    rot.appendChild(el(`<div class="lane">
      <span class="lane-h">레인 배치 <i>기기 슬롯 3칸</i></span>
      <div class="lane-g">
        ${uniq.map(r=>cell(r,'use')).join('')}
        ${spare.map(r=>cell(r,'spare')).join('')}
        ${Array.from({length:nRand},()=>cell(null,'rand')).join('')}
      </div>
      ${(spare.length||nRand)?`<p class="sparen">쓰는 건 ${uniq.length}장이지만 슬롯이 3칸이라 예비까지 올려 둡니다.
        ${spare.length?(spareSlow
          ? '<b style="color:var(--bad)">보스보다 빠른 태그가 없어 후공 예비입니다.</b>'
          : '3턴까지 끌리면 에너지가 바닥이라 <b style="color:var(--ink)">선공</b>이 되는 것으로 골랐습니다.'):''}
        ${nRand?`<b style="color:var(--ink)">${nRand}칸</b>은 켠 태그가 모자라 기기가 랜덤으로 채웁니다.`:''}</p>`:''}
    </div>`));
  }

  seq.forEach((r,i)=>rot.appendChild(el(slotHTML(r,i,i===2&&reuse,boss))));

  const real=l=>l.filter(r=>!r.rand);          // 랜덤 턴은 합계·배율에서 제외
  const sum=l=>Math.round(l.reduce((a,r)=>a+(r.dmg||0),0));
  const worst=l=>{const v=real(l).map(r=>r.d); return v.length?Math.max(...v):0};
  const field=[...uniq.map(r=>r.c), ...spare.map(r=>r.c)];
  const holdOut=c=>{ let n=0; while(n<9 && survivesN(c,boss,n+1)) n++; return n; };
  const minHit=field.length?Math.min(...field.map(holdOut)):0;
  const need=seq.ko2?2:3;
  const t2=Math.round((seq[0]?seq[0].dmg:0)+(seq[1]?seq[1].dmg:0));
  const holdTxt=minHit>=9?'끄떡없음':minHit+'대까지';
  rot.appendChild(el(`<div class="total">
    <div class="tsum on">
      <span class="tl">${seq.ko2?'2턴 격파':'3턴 필요'}</span><b>${seq.ko2?t2:sum(seq)}</b>
      <span class="tl2">${seq.ko2?'1·2턴 피해 합':'3턴 피해 합'} · 최대 받는 ×${worst(seq)}</span></div>
    <div class="tsum">
      <span class="tl">필드 내구</span><b>${holdTxt}</b>
      <span class="tl2">${seq.risky
        ? '버티는 태그가 모자랍니다'
        : `이번 계획에서 <b style="color:var(--ink)">${need}대</b>를 맞습니다`}</span></div>
  </div>`));

  const nr=seq.filter(r=>r.rand).length;
  const gtxt = (gims.length
    ? `이 조합이 쓰는 기믹은 <b style="color:var(--ink)">${gims.join(' · ')}</b>. 각각 배틀당 한 번뿐입니다.`
    : '기믹을 쓰지 않는 조합입니다.')
    + (nr ? ` 켠 태그가 모자라 <b style="color:var(--ink)">${nr}턴은 랜덤</b>으로 채웁니다.
        합계는 랜덤 턴을 뺀 값이라 실제로는 더 들어갑니다.` : '');
  const lead = nr
    ? `켠 태그로 채울 수 있는 만큼만 짰습니다.`
    : null;
  const surv = seq.risky
    ? `<b style="color:var(--star)">보스 공격을 버티는 태그가 3장이 안 됩니다.</b> 도중에 쓰러질 수 있습니다.`
    : seq.ko2
      ? `<b style="color:var(--ok)">1·2턴에 끝나는 조합입니다.</b> 3턴 태그는 빗나갔을 때를 위한 예비이고,
         2턴에 끝나면 보스 공격을 두 번만 맞습니다.`
      : `2턴에 잡기는 어려운 보스라 <b style="color:var(--ink)">3턴 합계</b>로 짰습니다.
         필드 3장 모두 보스 공격 3대를 버팁니다.`;
  note.innerHTML = lead ? `${lead} ${gtxt}` : `${surv} ${gtxt}`;
}

/* ══ 작은 헬퍼 (bat · jo) ──── */
const bat=w=>{const c=w.charCodeAt(w.length-1);
  return c>=0xAC00&&c<=0xD7A3&&(c-0xAC00)%28!==0};      // 끝 글자에 받침이 있나
const jo=(w,a,b)=>w+(bat(w)?a:b);                        // jo('거북왕','이','가') → 거북왕이

