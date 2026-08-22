/* ══ 평가 ══ */
// 기술 위력 (본가 기준 참고값)
const POWER={
 사이코브레이크:100,사이코키네시스:90,거수참:100,거수탄:100,스톤에지:100,코멧펀치:90,
 라이트닝드라이브:100,리프스톰:130,화염방사:90,하이드로펌프:110,악의파동:80,눈보라:110,
 폭풍:110,섀도볼:80,불대문자:110,지진:100,'10만볼트':90,드럼어택:80,화염볼:120,
 노려맞히기:80,지옥찌르기:80,성스러운칼:90,액셀브레이크:100,기가임팩트:150,기합구슬:120,
 크로스플레임:100,크로스썬더:100,리프블레이드:90,문포스:95,파동탄:80,인파이트:120,
 러스터캐논:80,드래곤다이브:100,사과산:80,매지컬샤인:80,양날박치기:150,섀도클로:70,
 // 다이맥스 기술
 다이록:130,다이스틸:130,다이썬더:130,다이어스:130,다이어택:130,다이너클:130,
 // Z기술
 다이내믹풀플레임:180,라이징랜드오버:180,스파킹기가볼트:175,전력무쌍격렬권:190,
 초월나선연격:190,레이징지오프리즈:190,무한암야로의유인:180
};
// 공격 찬스 보너스는 공격력에 가산 (조절 가능)
// 넷 다 매판 달라지는 값의 기대값이다. 일반·메가진화·다이맥스는 룰렛,
// Z기술은 룰렛이 아니라 플레이어의 기술 입력을 기계가 판정해 매번 다르게 준다.
const CHANCE_DEFAULTS={'일반':30,'메가진화':45,'다이맥스':30,'Z기술':70};
let chance={...CHANCE_DEFAULTS};
// 메가진화는 기술 자체에 tagx 가 붙지 않는다. 카드 기믹이라서 두 번째 인자로 받는다.
const bonusOf=(m,mega)=>chance[m.tagx] ?? (mega?chance['메가진화']:chance['일반']);

function offense(card,boss,banGim){
  if(card.measured){
    const canMega=card.g==='메가진화';
    let best=null;
    card.mv.forEach(m=>{
      if(m.tagx && banGim && banGim.has(m.tagx)) return;   // 기믹은 배틀당 1회
      const r=evalMove(card,boss,m,canMega&&!m.tagx);      // 다이맥스·메가 보정을 한 곳에서
      const v=r.s/(DW[r.d]??1);                            // 내구 가중 이전의 공격 점수
      if(!best||v>best.v) best={v,mult:r.mult,ratio:r.ratio,move:m,
        pw:r.pw,bonus:r.bonus,raw:r.raw,atk:r.atk,def:r.def,dmg:r.dmg,mega:r.mega,megaT:r.megaT};
    });
    return best;
  }
  const mult=Math.max(...card.t.map(x=>eff(x,boss.t)));
  return {v:mult*RARITY[card.r].bonus,mult,ratio:null,move:null,pw:null,bonus:null,raw:null,atk:null,def:null,dmg:null};
}
const incoming=(card,boss)=>Math.max(...boss.mv.map(m=>eff(m.t,card.t)));
const DW={0:1.5,.25:1.35,.5:1.2,1:1,2:.85,4:.7};

/* ── 생존 판정 ──
   보스 공격은 매 턴 필드의 3장 전부를 때린다. 기절한 태그는 배틀에서 완전히 빠진다.
   그래서 «자기 턴에 얼마나 아픈가» 가 아니라 «3대를 버티는가» 로 걸러야 한다.
   지표를 HP 비율로 바꾸려면 비례상수가 필요하다. KHP 는 실측 비급소 6건에서 얻은 0.191 이다
   (룰렛 미상 표본에 일반 기대값 30 을 넣고 적합 — 기대값을 바꾸면 재적합할 것).
   측정 오차가 ±4%p 라 SAFE 로 여유를 둬 경계선은 탈락시킨다. */
const KHP=0.191, SAFE=1.15;
function bossHit(c,boss,m){
  const pw=POWER[m.n]??100;
  const def=(m.k==='물리')?c.d:c.sd;
  return pw*(boss.a+bonusOf(m))/def*eff(m.t,c.t)*KHP*SAFE/c.hp;
}
// N턴 동안 이 태그가 받는 HP 비율.
// 보스의 기믹 기술도 배틀당 한 번뿐이므로 «일반 N-1 대 + 기믹 1대» 로 본다.
//
// 지역배틀에서 상대 서브를 지정하면 **상대 3장 전부**를 때리는 쪽 후보로 본다.
// 어느 장이 몇 턴째에 나올지는 알 수 없으므로(순서 무의미 — 잭 확인)
// **가장 아픈 한 장이 계속 나온다**고 보는 최악 상정을 쓴다. 생존 판정은 보수적이어야
// 하기 때문이다 (문서 «bossHit 이 낙관적일 수 있다» 참고). 서브를 비우면 종전과 같다.
function incN(c,boss,N){
  let n=0,g=0,hasG=false;
  for(const f of foeAll(boss)){
    const norm=f.mv.filter(m=>!m.tagx), gim=f.mv.filter(m=>m.tagx);
    const fn=norm.length?Math.max(...norm.map(m=>bossHit(c,f,m))):0;
    n=Math.max(n,fn);
    if(gim.length){ hasG=true; g=Math.max(g,...gim.map(m=>bossHit(c,f,m))); }
    else g=Math.max(g,fn);
  }
  return hasG ? (N-1)*n+g : N*n;
}
const incPct=(c,boss)=>incN(c,boss,3)/3;     // 한 대 평균 (화면 표시용)
const survivesN=(c,boss,N)=>incN(c,boss,N)<1;
const survives3=(c,boss)=>survivesN(c,boss,3);
/* 배틀 모드 — 시작할 때 랜덤으로 정해진다 (잭 확인). 모드마다 상대 구성과 보스 배수가 다르다.
   hp: 대상 **실효** HP 배수. 나머지는 1(카드 스탯 그대로).

   ⚠ **스페셜의 1.15 는 «보스의 진짜 HP» 가 아니다** (2026-08-17 정정).
   2026-08-17 2인 플레이 2턴을 두 사람 피해를 **합쳐** 맞춰 보니 **진짜 HP 는 카드의 ×2.0**
   (1턴 ×2.08 · 2턴 ×1.98 — 서로 다른 공격 구성인데 같은 값)이었다.
   앱은 **내 화력만** 세므로 실효값은 그보다 작아야 하고, 1.15 는 그 «내 몫» 값이다 —
   161 ÷ 280 = 0.575, 곧 **파트너가 전체의 43% 를 맡는다고 본 셈**이다.
   그래서 1.15 를 2.0 으로 바꾸면 **이중으로 세어 과소평가**하게 된다. **바꾸지 말 것.**
   ⚠ 파트너가 세거나 약하면 이 가정이 흔들린다 — 이번 판만 해도 파트너 몫이 1턴 100% · 2턴 64% 였다.
   파트너 화력을 직접 넣게 되면 그때 hp 를 2.0 으로 올리고 파트너 피해를 빼야 한다. */
const MODES={
  '지역'  :{n:'지역배틀',        hp:1,    note:'상대 3장 중 <b>보스 1장</b>만 잡으면 승리. 아래 <b>상대 파티</b>에 서브 2장을 넣으면 생존 판정에 반영됩니다.'},
  '다맥'  :{n:'다이맥스 포켓몬', hp:1,    note:'보스 1마리만 나오는 모드. <b>실측 표본이 없어</b> 카드 스탯 그대로 계산합니다. 지역배틀 판이어도, 보스만 노린 계산을 보려면 이 모드로 두세요.'},
  '스페셜':{n:'스페셜태그배틀',  hp:1.15, note:'2인 협동. 보스 실제 HP는 카드의 <b>약 ×2</b>인데, 파트너가 절반쯤 맡는다고 보고 <b>내 몫 ×1.15</b>로 계산합니다. 파트너가 약하면 이보다 오래 걸립니다.'}
};
let mode='지역';
let playRec=false;      // 플레이 화면 인라인 기록 (v3.35.0 · 기본 꺼짐 · 잭 지정)
/* 게임기(기계) 버전 — 기계 화면에 적힌 값. 기본은 잭이 확인한 1.0.4.39608.ko. (v3.37.0).
   앱 자신의 VERSION 과 헷갈리지 말 것 — 이쪽은 «기계» 버전이고 기록에 함께 남는다. */
const GVER_DEFAULT={maj:1,min:0,pat:4,build:'39608'};
let gver={...GVER_DEFAULT};
const gverStr=()=>gver.maj+'.'+gver.min+'.'+gver.pat+'.'+(gver.build||'0')+'.ko.';
/* 지역배틀 상대 파티 — [왼쪽 서브, 오른쪽 서브]. 가운데(대상)는 `bossId` 가 맡는다.
   순서는 계산에 쓰지 않는다 (잭 확인 — 파티 구성일 뿐 턴 순서가 아니다).
   지역배틀에서만 쓰며 비워둘 수 있다. */
let foes=[null,null];
/* 상대 서브로 고를 수 있는 후보. **★6 까지 전 성급이 서브로 나온다** (2026-08-13 잭 실측 —
   ★5 는 흔하고 ★6 은 드물다). ★5·★6 은 `SUBS` 가 아니라 `POOL` 에 있으므로 합쳐 둔다.
   카드 모양이 같아 그대로 섞인다. 성급으로 후보를 좁히지 말 것.
   **레귤러태그도 서브로 나온다** (2026-08-14 잭 실측 · v2.1.0). 레귤러는 탄이 없는
   «공통» 이라 탄 거르개를 태우면 하나도 안 뜬다 — 픽커에서 예외로 둔다.
   스페셜(S)은 아직 서브로 본 적이 없어 넣지 않았다. 보이면 여기 한 줄만 더하면 된다. */
const FOEPOOL=[...POOL.filter(p=>p.r==='6'||p.r==='5'||p.r==='R'), ...SUBS];
const SUBBY=new Map(FOEPOOL.map(s=>[s.id,s]));
/* **내가 가질 수 있는 전투 태그** = `POOL`(★6·★5·레귤러·스페셜) + **★4 서브 34장** (v3.0.0 · 잭 지정).
   ★4 는 원래 상대 전용(`SUBS`)이라 `POOL` 밖에 뒀는데, 실제로는 내가 뽑아서 쓸 수 있다.
   `SUBS` 항목은 `POOL` 과 **모양이 같고 id 도 안 겹친다** (`탄-성급-이름`) — 그대로 섞인다.

   ⚠ **★3 이하로 더 넓히기 전에 생각할 것.** 성급이 낮을수록 «위력 미상» 문제가 커진다.
   ⚠ **BEST-A25·순위는 여전히 `POOL` 기준이다** (`ranked` 는 보유분만 보므로 자동 반영).
      «가질 만한 태그» 추천에 위력이 추정치인 카드를 끼우지 않으려는 것이다. */
const MYPOOL=[...POOL, ...SUBS.filter(c=>c.r==='4')];
/* 지금 분류가 받는 카드만. **기계에 못 넣는 카드를 추천하지 않으려는 것** (v3.2.0). */
const classPool=()=>MYPOOL.filter(p=>CLASSES[tagClass].ranks.includes(p.r));
/* 분류에 맞는 핵심 목록. **배지·안내가 둘 다 이걸 쓴다** — 한쪽만 바꾸면 어긋난다. */
const bestSet=()=>({A:BESTA25,B:BESTB25,C:BESTC})[tagClass]||BESTA25;
const MYBY=new Map(MYPOOL.map(c=>[c.id,c]));
// 이 배틀에서 나를 때릴 수 있는 상대 전부. 지역배틀 + 서브 지정일 때만 3장이 된다.
const foeAll=boss=>{
  if(mode!=='지역') return [boss];
  const out=[boss];
  foes.forEach(id=>{ const f=id&&SUBBY.get(id); if(f) out.push(f); });
  return out;
};
const foeCount=()=>foes.filter(id=>id&&SUBBY.has(id)).length;
const modeHp=boss=>boss.hp*(MODES[mode]?.hp??1);

// 2턴에 끝낼 수 있다고 볼 기준. 빗나가면 3턴째를 맞으므로 여유를 둔다.
const KO_SAFE=1.15;
const koIn2=(dmg,boss)=>dmg*KHP >= modeHp(boss)*KO_SAFE;
function evalCard(card,boss,banGim){
  const o=offense(card,boss,banGim);
  if(!o) return null;
  const types=(o.megaT)||card.t;                 // 메가 폼이면 바뀐 타입으로 피해 계산
  const d=Math.max(...boss.mv.map(m=>eff(m.t,types)));
  return {c:card,mult:o.mult,move:o.move,ratio:o.ratio,pw:o.pw,bonus:o.bonus,raw:o.raw,atk:o.atk,def:o.def,dmg:o.dmg,d,s:o.v*(DW[d]??1)};
}
const ranked=(boss,banGim,skip)=>classPool().filter(p=>owned.has(p.id)&&p.id!==boss.id&&!(skip&&skip.has(p.id)))
  .map(c=>evalCard(c,boss,banGim)).filter(Boolean).sort((a,b)=>b.s-a.s||b.mult-a.mult);

// 한 장을 특정 기술로 썼을 때의 평가
function evalMove(card,boss,m,megaOn){
  const M=megaOn?megaOf(card):null;
  const mult=eff(m.t,boss.t);
  const bonus=bonusOf(m,!!M);
  // 다이맥스는 태그의 에너지(=스탯)를 올린다. 레벨당 +3 (마기라스 144→159 실측)
  const base=(m.k==='물리'? card.a : card.sa);
  const dmax=(m.tagx==='다이맥스') ? (DMAX_MUL[dmaxLv]??1) : 1;
  const mgx=(M&&M.e&&card.e) ? M.e/card.e : 1;      // 메가진화 스탯 상승
  const raw=Math.round(base*dmax*mgx);
  const atk=raw+bonus;
  const def=(m.k==='물리'? boss.d : boss.sd);
  const pw=POWER[m.n]??100;
  const dTypes=(M&&M.t)?M.t:card.t;                 // 메가 폼은 타입이 바뀔 수 있다
  const d=boss.mv.reduce((w,bm)=>Math.max(w,eff(bm.t,dTypes)),0);
  const v=mult*Math.min(2.2,Math.max(.5,atk/def))*(pw/100);
  return {c:card,mult,move:m,ratio:atk/def,pw,bonus,raw,atk,def,mega:!!M,megaT:M?M.t:null,
          dmg:pw*(atk/def)*mult,d,s:v*(DW[d]??1)};
}

/* 3턴 조합 전체 탐색.
   제약 — 탈진: 직전 턴 태그는 못 씀 / 기믹: 메가진화·Z기술·다이맥스 각 배틀당 1회
   목표 — 최대 화력: 예상 피해 합. 재사용도 허용.
          밸런스: 서로 다른 3장 + 받는 피해로 깎은 값(피해 x 내구 가중). */
const RANDOM={c:{id:'__rand',n:'랜덤 태그',s:'랜덤',r:'?',t:[],mv:[],g:null},
  move:null,mult:1,d:1,dmg:0,pw:0,bonus:0,raw:0,atk:0,def:0,s:0,rand:true};

/* 로테이션 탐색 — 완전탐색.

   ── 목표는 «되도록 2턴에 끝내기» 다.
   2턴에 잡으면 보스 공격을 두 번만 맞는다. 먼저 2턴 격파가 되는지 보고,
   되면 1·2턴 화력을 최대화한다. 안 되면 3턴 합계를 최대화한다.

   ── 탈진은 «카드 단위» 다 (잭 확인).
   직전 턴에 쓴 카드만 막히므로 같은 태그를 2장 가지면 1·2턴 연속 사용이 가능하다.
   1장뿐이면 1·3턴에만 쓸 수 있다. 3턴 순서는 항상 `X → Y → X` 꼴이므로
   **공격하는 칸은 두 개뿐이고 세 번째 칸은 화력에 기여하지 않는다.**

   ── 생존
   보스 공격은 매 턴 필드 3칸 전부를 때리고, 기절한 태그는 배틀에서 빠진다.
   2턴에 끝내면 2대, 3턴까지 가면 3대를 버텨야 한다.

   되돌리지 말 것 — v1.39 까지 «자기 턴에만 맞는다», v1.41 까지 «세 칸이 한 번씩 공격»
   으로 봤는데 둘 다 틀렸다. */
function buildSeq(boss){
  const all=classPool().filter(p=>owned.has(p.id)&&p.id!==boss.id);
  if(!all.length) return [];

  const movesOf=(c)=>{
    const l=[];
    c.mv.forEach(m=>l.push({c,m,gk:m.tagx||null,r:evalMove(c,boss,m,false)}));
    if(c.g==='메가진화') c.mv.filter(m=>!m.tagx)
      .forEach(m=>l.push({c,m,gk:'메가진화',r:{...evalMove(c,boss,m,true),mega:true}}));
    return l;
  };
  const clash=(...o)=>{                        // 기믹 종류가 겹치는가
    const u=new Set();
    for(const x of o){ if(!x||!x.gk) continue; if(u.has(x.gk)) return true; u.add(x.gk); }
    return false;
  };

  // ── 1단계: 2턴 격파를 노린다 (2대만 버티면 되므로 후보가 넓다)
  const safe2=all.filter(c=>survivesN(c,boss,2));
  let two=null;
  if(safe2.length){
    const M2=new Map(safe2.map(c=>[c.id,movesOf(c)]));
    for(const X of safe2) for(const Y of safe2){
      if(X.id===Y.id && owned.cnt(X.id)<2) continue;   // 연속 사용은 2장 필요
      for(const a of M2.get(X.id)) for(const b of M2.get(Y.id)){
        if(clash(a,b)) continue;
        const v=a.r.dmg+b.r.dmg;
        if(!two||v>two.v) two={v,rows:[a.r,b.r]};
      }
    }
  }
  if(two && koIn2(two.v,boss)){
    /* 3턴째는 안 올 예정이지만 슬롯은 채워야 하고, 빗나가면 실제로 쓰인다.
       그러니 3턴까지 갈 때의 규칙을 그대로 지켜야 한다 —
       2턴 태그와 겹치면 안 되고(탈진), 이미 쓴 기믹도 못 쓰고, 3대를 버텨야 한다. */
    const a0=two.rows[0], b0=two.rows[1];
    const usedG=new Set([a0.move&&a0.move.tagx, a0.mega&&'메가진화',
                         b0.move&&b0.move.tagx, b0.mega&&'메가진화'].filter(Boolean));
    let third=null;
    all.filter(c=>c.id!==b0.c.id && survivesN(c,boss,3)).forEach(c=>{
      movesOf(c).forEach(o=>{
        if(o.gk && usedG.has(o.gk)) return;
        if(!third || o.r.dmg>third.dmg) third=o.r;
      });
    });
    if(!third) third=RANDOM;
    const out=[a0,b0,third];
    out.ko2=true; out.risky=safe2.length<3;
    return out;
  }

  // ── 2단계: 3턴 합계 최대화 (3대 생존)
  const safe3=all.filter(c=>survivesN(c,boss,3));
  const cards=safe3.length?safe3:all;
  const M3=new Map(cards.map(c=>[c.id,movesOf(c)]));
  let best=null, bestVal=-1, bestTie=-1;
  for(const X of cards) for(const Y of cards){
    if(X.id===Y.id && owned.cnt(X.id)<2) continue;
    for(const a of M3.get(X.id)) for(const b of M3.get(Y.id)) for(const c2 of M3.get(X.id)){
      if(clash(a,b,c2)) continue;
      const v=a.r.dmg+b.r.dmg+c2.r.dmg;
      const tie=a.r.dmg*2+b.r.dmg;             // 같은 합이면 앞턴에 큰 피해
      if(v>bestVal+1e-9 || (Math.abs(v-bestVal)<=1e-9 && tie>bestTie)){
        bestVal=v; bestTie=tie; best=[a.r,b.r,c2.r];
      }
    }
  }
  if(!best){
    const one=cards[0] && movesOf(cards[0]);
    best = one && one.length
      ? [one.reduce((p,q)=>q.r.dmg>p.r.dmg?q:p).r, RANDOM, RANDOM]
      : [RANDOM,RANDOM,RANDOM];
  }
  const out=best.slice();
  out.ko2=false; out.risky=safe3.length<3;
  return out;
}

