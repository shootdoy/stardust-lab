/* ══ 상태 ══ */
// 기본 모드는 밸런스. 최대 화력은 약점을 찔리는 태그도 서슴없이 넣어
// 한 대에 기절하는 일이 생긴다 (가이오가전 거대코뿌리 물 x4 실사례).
let bossId='2-6-가이오가', setView='2', bossRank='6', rosterSet='1';
/* 전투 태그 분류 (v3.1.0 · 잭 지정 · v3.9.0 에 근거 정정).
   ⚠ **게임이 성급을 막는 것이 아니다. 플레이어는 어떤 성급이든 낼 수 있다** (2026-08-14 잭 확인).
   태그를 다 들고 다닐 수 없어서 **덱을 성급대로 갈라 꾸리는 것**이고, 그 묶음이 이 분류다.
     A = 전투태그A ★5·★6
     B = 전투태그B ★5 전용
     C = 전투태그C ★4 전용
   ⚠ **분류를 늘릴 때 손댈 곳**: ① `CLASSES` ② 두 스위치 마크업(컬렉션·매치)
   ③ 핵심 목록 상수와 `bestSet()` ④ `dev/best-?25.js` ⑤ `sync.js`.
   `classPool()`·`ownedSets`·저장은 분류 키를 그대로 따라가므로 손댈 것이 없다.
   **A 와 B 는 완전히 분리된 리스트다** (v3.2.0 · 잭 지정). ★5 는 양쪽에 다 «뜨지만»
   보유는 따로다 — A 에서 켠 ★5 가 B 에서 켜지지 않는다. 기계가 둘이고 덱을 따로 꾸리기 때문.
   레귤러·스페셜은 성급이 아니라 «공통» 이라 양쪽에 다 보여 준다(보유는 역시 따로).

   앞으로 A = 최대화력 모드, B = 하이스코어 모드가 된다.
   **하이스코어는 «상대보다 낮은 등급으로 이기면 보너스»** 로 알려져 있다 (미확인) —
   B 의 추천 기준은 «화력» 이 아니라 «이길 수 있는 가장 낮은 등급» 이 되어야 한다.
   그 규칙을 넣기 전에 실측으로 보너스 폭을 확인할 것. */
let tagClass='A';
const CLASSES={
  A:{label:'전투태그A', sub:'★5·★6', ranks:['6','5','R','S']},
  B:{label:'전투태그B', sub:'★5', ranks:['5']},  // v3.21.0 · 잭 지정 — ★4·레귤러·스페셜을 뺐다
  C:{label:'전투태그C', sub:'★4', ranks:['4']}   // v3.22.0 · 잭 지정
};
const classRanks=()=>CLASSES[tagClass].ranks;
/* 앱 초기값은 «아무것도 안 켜짐» 이다. 임의의 태그를 미리 켜두면
   남의 보유를 기준으로 추천이 나와 오해를 부른다. */
const DEFAULT_OWNED=()=>new Bag();

/* 검증용 기준 컬렉션 — 잭의 실제 보유 26장. `dev/fixture.js` 와 샌드박스 시드가 쓴다. */
const FIXTURE_OWNED=()=>new Bag([
  ...POOL.filter(p=>p.s==='1'&&p.r==='6').map(p=>p.id),
  '1-5-글레이시아','1-5-윈디','1-5-거대코뿌리','1-5-플라이곤',
  '2-6-코라이돈','2-6-피카츄','2-6-잠만보','2-6-짜랑고우거','2-6-레시라무','2-6-제크로무',
  '2-5-님피아','2-5-초염몽','2-5-엠페르트','2-5-알로라 나인테일','2-5-갈가부기',
  '공통-S-따라큐'
]);
/* 분류마다 따로 쥔다. `owned` 는 **지금 보고 있는 분류의 가방**을 가리키는 별칭이라
   분류를 바꿀 때마다 다시 묶어 준다 (`useClass`). 모든 코드가 `owned` 를 그대로 쓰면 된다. */
let ownedSets={A:DEFAULT_OWNED(), B:new Bag(), C:new Bag()};
let owned=ownedSets.A;
const useClass=()=>{ owned=ownedSets[tagClass]; };
/* 그 분류가 받는 성급만 남긴다 — 잘못 실린 카드가 추천을 흔들지 않게.
   ⚠ **분류의 성급 범위를 좁히면 그 밖의 보유가 조용히 사라진다.**
   v3.21.0 에서 B 를 «★4·★5» → «★5» 로 좁히며 B 에 넣어 둔 ★4·레귤러·스페셜이 지워졌다.
   범위를 좁힐 때는 **잭에게 먼저 알릴 것** — 되돌릴 방법이 없다. */
const classIds=cl=>new Set(MYPOOL.filter(p=>CLASSES[cl].ranks.includes(p.r)).map(p=>p.id));
const trimClass=(bag,cl)=>{ const ok=classIds(cl);
  /* Bag 은 Map 이라 그냥 펼치면 [id,장수] 쌍이 나온다. **`ids()` 를 쓸 것** —
     `[...bag]` 로 돌리면 id 가 배열이라 아무것도 안 걸러진다 (v3.2.0 에서 당했다). */
  bag.ids().forEach(id=>{ if(!ok.has(id)) bag.delete(id); }); return bag; };
let guideHidden=false;
let detail=0;
let rankSort='score';
// 다이맥스는 에너지(=스탯)에 배율을 곱한다. 덧셈이 아니다.
// 실측 — 마기라스 L5 144→159 · 메타그로스 L10 144→166
//        짜랑고우거 L10 158→182 · 플라이곤 L10 114→132  (4건 모두 일치)
const DMAX_MUL={0:1, 1:1.0506, 5:1.1042, 10:1.1536};  // lv1: 에너지 158→166 실측 (2026-08-12)
let dmaxLv=5;        // 룰렛에서 뜬 다이맥스 레벨 (꽝 0 · 1 · 5 · 10)
/* 상대로 나오는 탄. **기계에 걸린 탄이 바뀌면 여기서 끈다** (v2.8.0 · 잭 지정).
   지금은 1·2탄이 함께 돌지만 곧 2탄만 남는다 — 그때 1탄을 꺼야 옛 카드가 후보에 안 뜬다.
   레귤러·스페셜은 «공통» 이라 탄이 없으므로 이 스위치와 무관하게 늘 나온다.
   **둘 다 끄는 것은 막는다** — 후보가 0장이 되면 화면이 통째로 빈다.

   ⚠ **이 스위치는 «상대 후보(FOEPOOL)» 에만 건다. 내 쪽에는 절대 걸지 말 것** (잭 확인) —
   기계에서 1탄이 내려가도 **내가 가진 1탄 태그는 계속 쓸 수 있다.**
   `owned` · `POOL` · 컬렉션 · 로테이션 · BEST-A25 에 `foeOn` 을 끼워 넣지 말 것. */
let foeSets={'1':true,'2':true};
const foeOn=c=> c.s==='공통' || foeSets[c.s]!==false;
let colTab='battle';           // 컬렉션 서브탭: battle | dex
let dex=new Bag();             // 수집 장수 (추천 계산과 무관)
let dexBest=null;              // 수집 기준 추천-25 결과 (Bag|null)
/* 트레이너 ID 5칸 (v3.41.0 · 잭 지정) — 메인 1 + 서브 4.
   교환 이벤트가 «도감에 없는 태그» 를 줄 때 메시지가 다르다는 정보가 있어,
   도감이 얕은 서브 ID 를 따로 두고 비교하려는 것이다 (미보유 우대 가설 검증).
   ⚠ 여기 저장하는 것은 **QR 사진뿐**이고 도감 내용이 아니다 — 앱은 어느 ID 에
   무엇이 들어 있는지 알 수 없다. 판 기록의 `tid` 로 «어느 ID 로 했는지» 만 남긴다. */
const TIDS=[{k:'main',lab:'메인'},{k:'sub1',lab:'서브1'},{k:'sub2',lab:'서브2'},
            {k:'sub3',lab:'서브3'},{k:'sub4',lab:'서브4'}];
let tidBag={};                 // {main:{d,n}, sub1:{...}} — d 는 QR 이미지 · n 은 별명
let tidCur='main';             // 플레이 화면에서 고른 칸 (기본 메인)
let myqr=null;                 // 지금 고른 칸의 QR 이미지 (기존 코드가 쓰는 이름 · 파생값)
let dexCalcBusy=false;         // 계산 중에는 owned 를 임시로 쓴다. 클릭을 막을 것

const KEY='tagstar:owned';
// 사용자 QR 은 따로 저장한다. 본 저장값은 태그를 켤 때마다 다시 쓰이므로
// 여기에 이미지를 섞으면 매번 수십 KB 를 재기록하게 된다.
const QKEY='tagstar:myqr';
// 트레이너 ID 카드 틀. 원본에서 QR 과 ID 글자를 지운 빈 판이다.
// 개인 ID 를 이미지에 굽지 말 것 — 배포 파일에 그대로 실린다.
const TIDBG='data:image/webp;base64,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';
let backend='memory';
/* 아티팩트 미리보기(샌드박스)에서만 검증용 26장을 미리 켠다.
   저장이 안 남는 환경이라 열 때마다 0장이면 시험이 번거롭다.
   배포본(localStorage)은 손대지 않는다 — 초기값 0장 그대로. */
/* 보유 복원. **v3.2.0 부터 A·B 를 따로 저장한다** (`ownedA` · `ownedB`).
   옛 저장(`owned` 하나)은 **분류마다 받는 성급만 골라 양쪽에 나눠 넣는다** —
   ★6 은 A 로, ★4 는 B 로, ★5·레귤러·스페셜은 양쪽에. 지우는 것보다 덜 놀랍고
   틀렸으면 화면에서 끄면 된다. **이관 코드를 지우지 말 것** — 옛 저장이 남아 있다. */
function loadOwned(saved,arr){
  const pick=(list,cl)=>trimClass(toBag((list||[]).filter(x=>{
    const id=Array.isArray(x)?x[0]:x; return MYBY.has(id)})), cl);
  if(saved && (saved.ownedA||saved.ownedB||saved.ownedC)){
    ownedSets={A:pick(saved.ownedA,'A'), B:pick(saved.ownedB,'B'), C:pick(saved.ownedC,'C')};
  } else if(Array.isArray(arr)){
    ownedSets={A:pick(arr,'A'), B:pick(arr,'B'), C:pick(arr,'C')};   // 옛 형식 이관
  } else return false;
  useClass(); return true;
}
let loaded=false, seeded=false;
function seedSandbox(){
  if(loaded || backend!=='claude' || owned.total) return;
  ownedSets.A=FIXTURE_OWNED(); ownedSets.B=trimClass(FIXTURE_OWNED(),'B'); useClass(); seeded=true;
}
async function load(){
  try{
    const saved=JSON.parse((await window.storage.get(KEY)).value);
    const arr=Array.isArray(saved)?saved:saved.owned;
    if(saved&&saved.chance) chance={...CHANCE_DEFAULTS,...saved.chance};
    if(saved&&saved.guideHidden) guideHidden=true;
    if(saved&&saved.detail!=null) detail=saved.detail;
    if(saved&&saved.rankSort) rankSort=saved.rankSort;
    if(saved&&saved.bossRank) bossRank=saved.bossRank;
    if(saved&&saved.dmaxLv!=null) dmaxLv=saved.dmaxLv;
    if(saved&&saved.foeSets) foeSets={'1':saved.foeSets['1']!==false,'2':saved.foeSets['2']!==false};
    if(saved&&CLASSES[saved.tagClass]){ tagClass=saved.tagClass; useClass(); }
    if(saved&&saved.megaTier) megaTier=saved.megaTier;
    if(saved&&saved.mode&&MODES[saved.mode]) mode=saved.mode;
    if(saved&&Array.isArray(saved.foes)) foes=[0,1].map(i=>SUBBY.has(saved.foes[i])?saved.foes[i]:null);
    if(saved&&saved.playRec) playRec=true;
    if(saved&&saved.gver) gver={...GVER_DEFAULT,...saved.gver};
    if(saved&&Array.isArray(saved.dex)) dex=toBag(saved.dex);
    backend='claude';
    if(loadOwned(saved,arr)) loaded=true;
    seedSandbox();
    dexPrune();
    return;
  }catch(e){ if(window.storage&&typeof window.storage.set==='function'){
    backend='claude'; seedSandbox(); dexPrune(); return} }
  try{
    localStorage.setItem(KEY+':probe','1'); localStorage.removeItem(KEY+':probe');
    backend='local';
    const raw=localStorage.getItem(KEY);
    if(raw){const saved=JSON.parse(raw);
      const arr=Array.isArray(saved)?saved:saved.owned;
      if(saved&&saved.chance) chance={...CHANCE_DEFAULTS,...saved.chance};
      if(saved&&saved.guideHidden) guideHidden=true;
      if(saved&&saved.detail!=null) detail=saved.detail;
      if(saved&&saved.rankSort) rankSort=saved.rankSort;
      if(saved&&saved.bossRank) bossRank=saved.bossRank;
      if(saved&&saved.dmaxLv!=null) dmaxLv=saved.dmaxLv;
    if(saved&&saved.foeSets) foeSets={'1':saved.foeSets['1']!==false,'2':saved.foeSets['2']!==false};
    if(saved&&CLASSES[saved.tagClass]){ tagClass=saved.tagClass; useClass(); }
      if(saved&&saved.megaTier) megaTier=saved.megaTier;
      if(saved&&saved.mode&&MODES[saved.mode]) mode=saved.mode;
    if(saved&&Array.isArray(saved.foes)) foes=[0,1].map(i=>SUBBY.has(saved.foes[i])?saved.foes[i]:null);
      if(saved&&saved.playRec) playRec=true;
      if(saved&&saved.gver) gver={...GVER_DEFAULT,...saved.gver};
      if(saved&&Array.isArray(saved.dex)) dex=toBag(saved.dex);
        if(loadOwned(saved,arr)) loaded=true; }
  }catch(e){ backend='memory' }
  seedSandbox();
  dexPrune();
}
let sT;
/* ⚠⚠ 저장이 «조용히» 실패하던 구멍을 막는다 (v3.48.3 · 잭 지적 «플레이 기록이 안 남는다»).
   `savePayload()` 가 try 밖이라, 값 하나가 상해 예외가 나면 saveWrite 가 거부되는데
   그 거부를 아무도 잡지 않았다. `backend` 는 'local' 그대로여서 **화면은 계속 «저장 켜짐»
   이라고 말하면서 그 뒤로 아무것도 저장되지 않는다.** 예전에 저장된 값은 남아 있고
   기록(HKEY)은 다른 경로라 계속 저장되니, 증상이 «설정만 안 남는다» 로 보였다.
   세 겹으로 막는다 — ① 값 하나가 상해도 나머지는 저장한다 ② 실패를 화면과 콘솔에 드러낸다
   ③ 호출 쪽에서 거부를 잡는다. **이 방어를 걷어내지 말 것.** */
const bagArr=b=>{ try{ return [...b] }catch(e){ return [] } };
let saveErr='';
function saveFail(where,e){
  saveErr = where+' — '+String((e&&e.message)||e).split('\n')[0].slice(0,80);   // 상태줄은 한 줄이다
  backend='memory'; renderBackend();
  try{ console.error('[스타더스트] 저장 실패:',where,e) }catch(_){}
}
const savePayload=()=>JSON.stringify({ownedA:bagArr(ownedSets.A),ownedB:bagArr(ownedSets.B),ownedC:bagArr(ownedSets.C),chance,guideHidden,detail,rankSort,bossRank,dmaxLv,megaTier,mode,foes,foeSets,tagClass,dex:bagArr(dex),playRec,gver});
async function saveWrite(){
  let p;
  try{ p=savePayload() }catch(e){ saveFail('값 만들기',e); return }
  if(backend==='claude'){try{await window.storage.set(KEY,p);return}catch(e){}}
  if(backend==='claude'||backend==='local'){try{localStorage.setItem(KEY,p);backend='local';return}catch(e){}}
  backend='memory'; renderBackend();
}
function save(){clearTimeout(sT);sT=setTimeout(()=>{saveWrite().catch(e=>saveFail('쓰기',e))},400)}
/* 저장은 400ms 미뤄 모아 쓴다 — 연타로 켜고 끌 때 쓰기를 아끼려는 것이다.
   그런데 **설정을 바꾸고 바로 앱을 닫거나 새로고침하면 그 400ms 를 못 채우고 유실**된다
   (v3.48.0 · 잭 지적 «플레이 기록 설정이 안 남는다»). 화면이 숨겨질 때 즉시 밀어 쓴다.
   ⚠ 이 flush 를 지우지 말 것 — 모바일에서는 앱을 바로 내리는 일이 흔하다. */
function saveFlush(){ if(sT){ clearTimeout(sT); sT=null; saveWrite().catch(e=>saveFail('쓰기',e)); } }
const BT={claude:['저장 켜짐','Claude 계정에 저장 — 다른 기기에서도 유지'],
 local:['저장 켜짐','이 브라우저에 저장 — 방문 기록을 지우면 초기화'],
 memory:['저장 꺼짐','새로고침하면 초기화됩니다']};
function renderBackend(){
  const n=document.getElementById('backend'); if(!n)return;
  const [a,b]=BT[backend]; n.className='backend '+backend;
  const note = seeded ? ' · 시험용 26장을 미리 켜 뒀습니다' : '';   // 내가 켠 게 아님을 알린다
  /* 저장이 실패했으면 이유를 그대로 적는다 — 모바일에는 콘솔이 없어
     «왜 안 남는가» 를 물어볼 근거가 화면에 있어야 한다 (v3.48.3). */
  const err = saveErr ? ' · 저장 실패 — ' + saveErr : '';
  n.innerHTML=`<b>${a}</b><span>${b}${note}${err}</span>`;
}

