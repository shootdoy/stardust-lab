/* 문서-코드 대조 검사.
 *
 *  CLAUDE.md 가 «이렇게 되어 있다» 고 적어둔 것이 실제 코드에 있는지 확인한다.
 *  치환 스크립트가 조용히 실패해 문서만 앞서가는 사고가 실제로 있었다 (v1.42~1.46 유실).
 *  검증 3종은 문법과 동작만 보므로 «변경이 안 들어간 것» 은 못 잡는다. 이 검사가 그걸 본다.
 */
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const doc =fs.readFileSync(__dirname+'/../CLAUDE.md','utf8');
const fix =fs.readFileSync(__dirname+'/fixture.js','utf8');
const fix2=fs.readFileSync(__dirname+'/interact.js','utf8');
const undf=fs.readFileSync(__dirname+'/undef.js','utf8');

const checks=[
  // [설명, 대상, 있어야 하는가, 찾을 문자열]
  ['버전 — meta/화면/상수 일치', html, true, null],

  ['2턴 격파 판정 koIn2',            html, true,  'const koIn2='],
  ['생존 판정 N턴 일반화',            html, true,  'const survivesN='],
  ['옛 inc3 제거',                   html, false, 'function inc3('],
  ['buildSeq 가 ko2 를 매긴다',       html, true,  'out.ko2=true'],
  ['모드 전환 제거 (setMode)',        html, false, 'function setMode'],
  ['모드 상태 제거',                  html, false, "mode==='flex'"],

  ['BEST-A25 상수',                  html, true,  'const BESTA25='],
  // 1탄 ★5 보스를 다시 넣었다 (v3.3.0 · 잭 지정)
  ['BEST-A25 는 53보스 전체 기준',   html, true,  'const BESTA25=new Bag([[\'1-5-거대코뿌리\',1],[\'1-5-윈디\',1]'],
  ['옛 이름 BEST25 안 남음',          html, false, 'const BEST25='],
  ['undef 는 한글 뒤 대문자를 안 센다', undf, true, 'ASCII 아닌 문자» 까지 배제한다'],
  ['BEST-B25 상수',                   html, true,  'const BESTB25=new Bag(['],

  ['B 후보가 좁다고 화면에 적음',      html, true,  '후보가 ★5 30장뿐이라 21위부터는 보탬이 없습니다'],
  ['수집 추천도 같은 50보스',        html, true,  'const dexBossSet=()=>BOSSES.slice();'],
  ['1탄 ★5 제외 필터 없음',          html, false, "BOSSES.filter(b=>!(b.s==='1'&&b.r==='5'))"],
  ['지표는 격파 수 우선',             html, true,  '**① 2턴 격파한 보스 수 ② 피해 합** 순이다'],
  ['14장에서 포화한다고 적음',        html, true,  '14장에서 2턴 격파 43/53 으로 포화한다'],
  ['옛 BEST30 제거',                 html, false, 'BEST30'],
  ['BEST 배지 중복 표시 제거',        html, false, 'BESTA25.cnt'],
  ['낡은 «겹쳐 담는» 문구 제거',      html, false, '겹쳐 담는'],

  ['장수 편집 상태 제거',             html, false, 'editQty'],
  ['장수 스테퍼 헬퍼 제거',           html, false, 'qtyHTML'],
  ['장수 편집 버튼 제거',             html, false, 'qtyEdit'],
  ['스테퍼 CSS 제거',                html, false, '.qty{'],

  ['Bag 자료구조',                   html, true,  'class Bag extends Map'],
  ['앱 초기값 0장',                  html, true,  'const DEFAULT_OWNED=()=>new Bag();'],
  ['검증용 26장 분리',               html, true,  'const FIXTURE_OWNED='],
  ['샌드박스 시드',                  html, true,  'function seedSandbox'],
  ['시드 알림 문구',                 html, true,  '시험용 26장'],

  ['상성 표 그리드 2열',             html, true,  'grid-template-columns:76px 1fr'],
  ['상성 칩 래퍼 .rv',               html, true,  'class="rv"'],

  ['트레이너 ID 섹션',               html, true,  'id="sTID"'],
  ['QR 자동 크롭',                   html, true,  'function qrLocate'],
  ['QR 크롭 여유 1.04',              html, true,  '*1.04'],

  ['fixture 가 FIXTURE_OWNED 사용',  fix,  true,  'FIXTURE_OWNED()'],
  ['fixture 가 2턴 격파 검사',       fix,  true,  '2턴격파'],
  ['fixture 가 survivesN 사용',      fix,  true,  'survivesN'],

  // v1.48 — 룰렛 일러스트를 실제 게임 링으로 재현
  ['룰렛 점 조명 밴드',              html, true,  'class="dots"'],
  ['룰렛 선택 창 톱니 배지',         html, true,  'class="star"'],
  ['옛 룰렛 빨간 20 사각형 제거',    html, false, '.chips rect{fill:#E4000F'],
  ['옛 룰렛 공 제거',                html, false, 'class="ball"'],

  // v1.49 — 메가진화 찬스 행 추가 · 기믹 4종
  ['찬스 기본값 4종',                html, true,  "'메가진화':45,'다이맥스':30"],
  ['bonusOf 가 메가를 받는다',       html, true,  'const bonusOf=(m,mega)=>'],
  ['evalMove 가 메가 여부를 넘긴다', html, true,  'bonusOf(m,!!M)'],
  ['찬스 탭 배지 4종',               html, true,  "chance['메가진화']}/${chance['다이맥스']}"],
  ['안내문 기본값 4종',              html, true,  '기본값 30 / 45 / 30 / 70'],

  // v1.50 — KHP 재적합 · BEST-25 재계산
  ['KHP 재적합값',                   html, true,  'const KHP=0.191'],
  ['옛 KHP 제거',                    html, false, 'KHP=0.206'],
  ['BEST-A25 에 리자몽 (재계산 결과)',html, true, "['1-6-리자몽',1]"],
  ['BEST-A25 에서 뮤츠 빠짐',        html, false, "['1-6-뮤츠',1]"],

  // v1.51 — 순위 카드 생존 배지
  ['3대 ✗ 배지 CSS',                 html, true,  '.rline .b3x{'],
  ['3대 ✗ 배지 렌더',                html, true,  '3대 ✗</span>'],
  ['순위 행 흐림 처리',              html, true,  '.rline.dead{'],

  // v1.52 — 다이맥스 레벨 1
  ['다이맥스 레벨1 배율',            html, true,  '1:1.0506'],
  ['다이맥스 레벨1 버튼',            html, true,  'data-dlv="1"'],

  // v1.53 — 초기화 버튼 이전 (배지 → 보정 탭 인라인 확인)
  ['초기화 버튼',                    html, true,  'id="wipeBtn"'],
  ['초기화 인라인 확인',             html, true,  'id="wipeAsk"'],
  ['wipe 가 dmaxLv 도 되돌린다',     html, true,  "dmaxLv=5; megaTier='대성공';"],
  ['배지 두 번 탭 제거',             html, false, '한 번 더 눌러 초기화'],
  ['배지 role 제거',                 html, false, 'id="ver" role="button"'],
  ['interact 가 초기화 요소를 안다', fix2, true,  "'wipeBtn'"],

  // v1.55 — 배틀 모드 탭
  ['모드 정의',                      html, true,  'const MODES={'],
  ['모드 선택 UI',                   html, true,  'class="modesw"'],
  ['스페셜 HP 배수 실측값',          html, true,  "hp:1.15"],
  ['koIn2 가 모드 배수를 쓴다',      html, true,  'koIn2=(dmg,boss)=>dmg*KHP >= modeHp(boss)'],
  ['모드가 저장된다',                html, true,  'megaTier,mode,foes,foeSets,tagClass,dex'],
  ['wipe 가 모드도 되돌린다',        html, true,  "mode='지역'; foes=[null,null]; foeSets={'1':true,'2':true};\n  tagClass='A'; dex=new Bag();"],

  // v1.56 — 1탄 ★4 (상대 서브용)
  ['★4 데이터',                     html, true,  'const LOW4=['],
  ['★4 카드뒷면 재검증 정정',        html, true,  "['가로막구리',  '1-1-059',['노말','악'],       90,115, 71,"],
  ['서브 목록 존재',                 html, true,  'const SUBS=['],
  ['서브가 추천 풀에 안 들어간다',    html, false, 'const POOL=[\n ...LOW'],

  // v1.57 — 1탄 ★2 추가 · 기술 분류 규칙 정정
  ['★2 데이터 14종 완비',           html, true,  "['누니머기',        '1-1-069'"],
  ['★3 데이터 14종 완비',           html, true,  "['누겔레온',      '1-1-039'"],
  ['도감 타입 순서 통일 (가로막구리)', html, false, '가로막구리,악·노말'],
  ['SUBS 가 저성급을 합친다',       html, true,  "LOW3.map(mkSub('3'))"],
  ['2탄 ★4 데이터',                  html, true,  'const LOW4_2=['],
  ['2탄 ★4 17종 완비',               html, true,  "['가디안',      '1-2-069'"],
  ['mkSub 가 탄을 받는다',           html, true,  "const mkSub=(r,s='1')"],
  ['SUBS 에 2탄 ★4 합류',            html, true,  "mkSub('4','2')"],
  ['2탄 ★3 데이터',                  html, true,  'const LOW3_2=['],
  ['2탄 ★3 14종 완비',               html, true,  "['롱스톤',      '1-2-070'"],
  ['SUBS 에 2탄 ★3 합류',            html, true,  "mkSub('3','2')"],
  ['2탄 ★2 데이터',                  html, true,  'const LOW2_2=['],
  ['2탄 ★2 14종 완비',               html, true,  "['랄토스',          '1-2-067'"],
  ['SUBS 에 2탄 ★2 합류',            html, true,  "mkSub('2','2')"],
  ['상대 파티 상태',                 html, true,  'let foes=[null,null]'],
  ['서브 후보에 ★6·★5·레귤러 포함',   html, true,  "FOEPOOL=[...POOL.filter(p=>p.r==='6'||p.r==='5'||p.r==='R')"],
  ['서브 성급 버튼에 ★5',             html, true,  '<button data-r="5"'],
  ['서브 성급 버튼에 ★6',             html, true,  '<button data-r="6"'],
  ['상대 파티가 로테이션 섹션 안',    html, true,  'id="foeBox"'],
  ['옛 상대 파티 섹션 제거',          html, false, 'id="sFoe"'],
  ['상대 파티 렌더',                 html, true,  'function renderFoes('],
  ['incN 이 상대 파티를 본다',        html, true,  'for(const f of foeAll(boss))'],
  ['상대별 대응 태그 계산',           html, true,  'function foeCands('],
  ['상대 파티 레인 UI',               html, true,  'id="foeLanes"'],
  ['옛 3칸 배치 제거',                html, false, 'id="foePlan"'],
  ['2단 매칭 그리드',                 html, true,  'class="fl-grid" id="foeLanes"'],
  ['레인 클래스가 fl- 로 격리됨',      html, true,  '.fl-grid{display:grid'],
  // 상대별 매치 = 로테이션과 같은 «가로 슬롯» (v1.97.0 · 잭 지정)
  ['가로 슬롯도 함께',                 html, true,  '<div class="mplans" id="foePlans">'],
  ['슬롯 목록 CSS',                    html, true,  '.mplans{display:flex;flex-direction:column'],
  ['로테이션 슬롯 클래스 재사용',       html, true,  '<div class="slot mslot${isB?\' mid\':\'\'} ${artCls(c)}">'],
  // 3칸 그룹과 가로 슬롯을 **둘 다** 낸다 (v1.98.0 · 잭 지정)
  ['세로 «낼 태그» 칸 유지',           html, true,  'const meCell=(at)=>{'],
  ['세로 칸 기술명·배율',              html, true,  '<span class="mx ${p.mult>=2?\'good\':\'bad\'}">공×${p.mult}</span>'],
  ['세로 칸 기믹 두 상태',             html, true,  '<i class="gi fl-gi ${GK[p.c.g]}${p.m.tagx?\' use\':\'\'}"'],
  ['세로 칸 능력치 .one',              html, true,  '<span class="fl-s one">${sp}${hit}</span>'],
  ['슬롯 목록에 제목',                 html, true,  '<span class="mplans-l">낼 태그 자세히</span>'],
  ['세 열을 한꺼번에 배정',            html, true,  'const assigned = assignPlans(cols, foeOf, boss);'],
  // 보스를 바꾸면 서브를 비운다 (v2.0.0 · 잭 지정)
  ['보스 바꾸면 서브 초기화',          html, true,  'bossId=id; foes=[null,null]; foePickAt=-1; foeChain=false;'],
  // 레귤러태그도 상대 서브로 나온다 (v2.1.0 · 잭 실측)
  ['레귤러도 서브 후보',               html, true,  "POOL.filter(p=>p.r==='6'||p.r==='5'||p.r==='R')"],
  // 실측 범위 밖에서는 격파 판정을 단정하지 않는다 (v2.2.0 · 잭 실측 반증)
  ['적합 범위 상수',                   html, true,  'const FIT_DEF=50, FIT_HP=110;'],
  // 저성급 아트는 «그림만» (v2.3.0 · 잭 지적). 카드 전체가 들어가면 위 줄만 크롭 안 된 것처럼 보인다
  ['범위 밖 판정 함수',                html, true,  'const outFit=(foe,m)=>'],
  ['판정 배지는 공용 함수',            html, true,  'function verdictTag(p,isB,f){'],
  ['범위 밖이면 «?» 를 단다',          html, true,  "const q = doubt ? '?' : '';"],
  // 폐기된 관측이 되살아나지 않게 (v3.10.0)
  ['폐기한 관측이 근거로 안 남음',     html, false, '짜랑고우거 기합구슬 → 팽도리'],
  // 방문자 집계 (v3.11.0 · 잭 요청)
  ['방문자 집계는 GA4',                html, true,  '방문자 집계 · GA4 · v3.12.0'],
  ['배포본에서만 센다',                html, true,  "if(!/(^|\\.)github\\.io$/.test(location.hostname)) return;"],
  ['측정 ID 들어감',                   html, true,  "var GA='G-XFK3680S0D';"],
  // 개인정보 안내 (v3.13.0 · 잭 지정)
  ['개인정보 안내 절',                 html, true,  '<section id="sPriv">'],
  ['서버 없음을 밝힌다',               html, true,  '<b>이 앱에는 서버가 없습니다.</b>'],
  ['GA4·애드센스 둘 다 적는다',        html, true,  '<b>Google 애널리틱스 4</b>'],
  ['거부 방법을 적는다',               html, true,  '브라우저 설정에서 쿠키를 차단하면'],
  ['집계를 바꾸면 글도 고치라고 남김',  html, true,  '측정 ID 를 바꾸거나 집계를 끄면 이 글도 함께 고칠 것'],
  ['ID 비면 아무것도 안 붙는다',        html, true,  'if(!GA) return;'],
  ['CFWA 는 걷어냈다',                 html, false, 'CFWA'],
  ['CF 를 고르지 않은 이유를 남김',     html, true,  '열 번 오면 열 명으로 잡는다'],
  ['폐기 사실을 문서에 적음',          doc,  true,  '그 관측은 폐기했다 — 되살리지 말 것'],
  ['배지를 두 곳에서 따로 만들지 않음', html, false, "p.tier===0 ? `<b class=\"fl-b ok\">무피해</b>`"],
  ['픽커에 레귤러 단추',               html, true,  '<button data-r="R" aria-pressed="false">레귤러</button>'],
  ['레귤러는 탄을 안 본다',            html, true,  "foeRank==='R'||s.s===foeSet"],
  ['레귤러면 탄 스위치 숨김',          html, true,  "searching || (foeRank==='R')"],
  ['등급 표기에 ★R 없음',              html, true,  "const rlab=r=> r==='R'?'레귤러'"],
  // 서브 선택 팝업 검색 (v2.6.0 · 잭 지정)
  ['팝업에 검색창',                    html, true,  '<input class="foesearch" id="foeQ"'],
  // iOS 자동 확대 방지 (v2.9.1 · 잭 지적) — 16px 미만이면 포커스 때 확대되고 안 돌아온다
  ['검색창 글자는 16px',               html, true,  'font-weight:600;font-size:16px;line-height:1.2;-webkit-appearance:none}'],
  ['그 이유를 코드에 남김',            html, true,  '16px 아래로 내리지 말 것'],
  // 셋째 탭은 «설정» (v2.7.0 · 잭 지정)
  ['셋째 탭 이름은 설정',              html, true,  '<button id="vX" aria-pressed="false">설정</button>'],
  // 상대로 나오는 탄을 설정에서 켜고 끈다 (v2.8.0 · 잭 지정)
  ['상대 탄 상태',                     html, true,  "let foeSets={'1':true,'2':true};"],
  // 전투 태그 입력을 ★4 까지 넓혔다 (v3.0.0 · 잭 지정)
  ['내 카드 후보에 ★4 합류',           html, true,  "const MYPOOL=[...POOL, ...SUBS.filter(c=>c.r==='4')];"],
  // 전투 태그 분류 A/B (v3.1.0 · 잭 지정)
  ['전투 태그 분류 정의',              html, true,  "A:{label:'전투태그A', sub:'★5·★6', ranks:['6','5','R','S']}"],
  ['분류는 규칙이 아니라 운용',        html, true,  '플레이어는 어떤 성급이든 낼 수 있다'],
  ['분류 늘릴 때 손댈 곳을 적음',      html, true,  '분류를 늘릴 때 손댈 곳'],
  ['B 는 ★5 전용',                     html, true,  "B:{label:'전투태그B', sub:'★5', ranks:['5']}"],
  // 전투태그C ★4 전용 (v3.22.0 · 잭 지정)
  ['C 는 ★4 전용',                     html, true,  "C:{label:'전투태그C', sub:'★4', ranks:['4']}"],
  // 안내문에 분류 이름을 박아 쓰지 않는다 (v3.23.0 · 잭 지적)
  ['안내는 분류를 훑어 만든다',        html, true,  "const others=Object.keys(CLASSES).filter(k=>k!==tagClass);"],
  // 푸터는 상수로 채운다 (v3.24.0 · 잭 지적 — 날짜가 어긋났다)
  ['푸터를 상수로 채운다',             html, true,  "if(v) v.textContent=VLABEL;"],
  ['푸터에 값을 베껴 적지 않음',       html, false, '<span class="ver" id="ver">\n'],
  ['겹치는 성급을 계산한다',           html, true,  'const dup=others.flatMap('],
  ['«A 와 B» 를 박아 쓰지 않음',       html, false, 'A 와 B 는 따로 저장됩니다'],
  ['겹침이 없으면 그렇게 적는다',      html, true,  '이 분류의 성급은 다른 분류와 겹치지 않습니다'],
  ['BEST-C 는 10장',                   html, true,  "const BESTC=new Bag([['1-4-만마드',1]"],
  ['세 분류를 다 쥔다',                html, true,  'let ownedSets={A:DEFAULT_OWNED(), B:new Bag(), C:new Bag()};'],
  ['C 도 따로 저장',                   html, true,  'ownedC:bagArr(ownedSets.C)'],
  ['bestSet 이 세 분류를 안다',        html, true,  '{A:BESTA25,B:BESTB25,C:BESTC}'],
  ['BEST-B 는 20장',                   html, true,  "const BESTB25=new Bag([['1-5-거대코뿌리',1],['2-5-마기라스',1]"],
  ['배지 장수를 박아 쓰지 않는다',      html, true,  '${tagClass}${bestSet().size}'],
  ['범위 축소 경고를 남긴다',          html, true,  '분류의 성급 범위를 좁히면 그 밖의 보유가 조용히 사라진다'],
  ['목록은 분류를 따른다',             html, true,  'classRanks().forEach(k=>{'],
  ['성급을 코드에 박아 두지 않음',      html, false, "['6','5','4','R','S'].forEach(k=>{"],
  ['분류 스위치',                      html, true,  '<div class="setsw" role="group" aria-label="전투 태그 분류" id="tagClassSw">'],
  ['두 스위치에 C 단추',               html, true,  '<button data-tc="C" aria-pressed="false">전투태그C <small>★4</small></button>'],
  // 매치 화면에도 같은 스위치 (v3.8.0 · 잭 지정)
  ['매치에도 전투태그 스위치',         html, true,  '<div class="setsw" role="group" aria-label="쓸 전투 태그" id="matchClassSw">'],
  ['두 스위치가 같은 상태를 쓴다',      html, true,  "['tagClassSw','matchClassSw'].forEach(id=>{"],
  ['두 스위치 모두 핸들러',            html, true,  "'#tagClassSw button,#matchClassSw button'"],
  ['매치에 계산 기준 안내',            html, true,  '로 계산합니다 · 보유 <b>${n}</b>장'],
  ['분류를 저장한다',                  html, true,  'mode,foes,foeSets,tagClass,dex'],
  // A·B 를 분리된 리스트로 (v3.2.0 · 잭 지정)
  ['owned 는 지금 분류의 별칭',        html, true,  'const useClass=()=>{ owned=ownedSets[tagClass]; };'],
  ['A·B 를 따로 저장',                 html, true,  'ownedA:bagArr(ownedSets.A),ownedB:bagArr(ownedSets.B)'],
  ['옛 저장 이관 코드 유지',           html, true,  "ownedSets={A:pick(arr,'A'), B:pick(arr,'B'), C:pick(arr,'C')};"],
  ['분류 밖 성급은 걸러낸다',          html, true,  'const trimClass=(bag,cl)=>'],
  ['Bag 순회는 ids()',                 html, true,  'bag.ids().forEach(id=>{ if(!ok.has(id)) bag.delete(id); })'],
  ['추천 후보도 분류를 따른다',        html, true,  'const classPool=()=>MYPOOL.filter('],
  ['로테이션도 classPool',             html, true,  'const ranked=(boss,banGim,skip)=>classPool().filter('],
  ['추천도 분류 후보 기준',            html, true,  'const mine=classPool().filter(p=>owned.has(p.id)'],
  
  ['보유 복원도 MYPOOL 기준',          html, false, 'return POOL.some(p=>p.id===id)'],
  ['★4 위력 미상 경고',                html, true,  '★4 는 <b>기술 위력이 미표기</b>라'],
  ['공통은 탄과 무관',                 html, true,  "const foeOn=c=> c.s==='공통' || foeSets[c.s]!==false;"],
  ['설정에 탄 스위치',                 html, true,  '<div class="setsw" role="group" aria-label="상대로 나오는 탄" id="foeSetsSw">'],
  ['마지막 하나는 못 끈다',            html, true,  'if(foeSets[k] && !foeSets[other]) return;'],
  // 보스 탄 스위치도 설정을 따른다 (v2.9.0 · 잭 지정)
  ['보스 탄 스위치에 id',              html, true,  'aria-label="탄 선택" id="bossSetSw"'],
  // 레귤러태그도 보스로 나온다 (v3.7.0 · 잭 실측)
  ['보스에 레귤러 합류',               html, true,  "POOL.filter(p=>p.r==='6'||p.r==='5'||p.r==='R')"],
  ['보스를 50으로 되돌리지 않음',      html, false, "POOL.filter(p=>p.r==='6'||p.r==='5');"],
  ['등급 스위치에 레귤러',             html, true,  '<button id="srR" aria-pressed="false">레귤러</button>'],
  ['레귤러 보스는 탄을 안 본다',       html, true,  "b.r==='R' : (b.s===setView&&b.r===bossRank)"],
  ['레귤러면 탄 스위치 감춤(보스)',    html, true,  'sw.hidden = isR || onSets.length<2;'],
  ['칩 별 표기에 레귤러',              html, true,  "/^\\d$/.test(b.r)?'★'.repeat(+b.r):rlab(b.r)"],
  ['보스 탄도 켠 쪽으로 고정',         html, true,  'if(!foeSets[setView]) setView=onSets[0];'],
  ['탄을 끄면 보스도 옮긴다',          html, true,  'if(f){ bossRank=f.r; setBoss(f.id); }'],
  ['후보 목록에 탄 스위치 반영',       html, true,  ").filter(foeOn);"],
  ['탄 스위치는 상대에만',              html, true,  '에 `foeOn` 을 끼워 넣지 말 것'],
  ['내 수집 태그와 무관하다고 적음',   html, true,  '내가 가진 1탄 태그는 그대로 쓰고 추천에도 그대로 나옵니다'],
  ['탄 스위치를 저장한다',             html, true,  'mode,foes,foeSets,tagClass,dex'],
  ['탭 이름에 룰렛 보정 없음',         html, false, '>룰렛 보정 <span class="ct"'],
  ['보정값은 섹션 안내줄에',           html, true,  '공격력에 가산 <b class="ct" id="vXct"></b>'],
  ['검색은 성급·탄을 무시',            html, true,  'FOEPOOL.filter(s=>foeMatch(s.n,foeQ))'],
  ['검색 중엔 성급·탄 스위치 감춤',    html, true,  "getElementById('foeRank').hidden = searching;"],
  ['초성 검색',                        html, true,  'const choOf=t=>'],
  ['검색 결과에 성급·탄 표기',         html, true,  '${rlab(s.r)} · ${s.s===\'공통\'?\'공통\':s.s+\'탄\'}'],
  ['검색어는 여닫을 때 비운다',        html, true,  'function clearFoeQ(){'],
  ['같은 보스면 그대로',               html, true,  'if(bossId===id) return false;'],
  ['보스 클릭이 setBoss 를 탄다',      html, true,  "n.addEventListener('click',()=>{setBoss(b.id);"],
  ['탄·등급 전환도 setBoss 를 탄다',   html, true,  'if(f) setBoss(f.id);'],
  ['bossId 직접 대입 없음',            html, false, 'bossId=b.id;'],
  // 같은 카드를 두 칸에 놓지 않는다 (v1.99.0 · 잭 지적)
  ['가진 장수까지만 쓴다',             html, true,  "if((used.get(id)||0) >= owned.cnt(id)) return;"],
  ['후보 목록을 따로 뽑는다',          html, true,  'function foeCands(foe,boss,isBoss,waiters){'],
  ['열마다 따로 풀던 옛 함수 제거',    html, false, 'function planFor(foe,boss,isBoss){'],
  ['배정 기준: 등급→화력→여파→피격', html, true,  'return [tier,-dmg,-sp,inc];'],
  // 무피해가 여럿이면 여파가 큰 쪽 (v3.14.0 · 잭 지정)
  // 여파 모델 교체 (v3.26.0 · 2026-08-17 실측 3판)
  ['여파는 비율식',                    html, true,  'const SPL_K=0.0212, SPL_P=0.758;'],
  ['메가피죤투 실측',                  html, true,  "'1-5-피죤투':{e:118,n:'메가피죤투'}"],
  ['메가거북왕 실측',                  html, true,  "'1-6-거북왕':{e:144,n:'메가거북왕'}"],
  ['메가가디안 실측',                  html, true,  "'2-6-가디안':{e:146,n:'메가가디안'}"],
  ['스페셜 1.15 는 내 몫 값',          html, true,  '보스의 진짜 HP» 가 아니다'],
  ['스페셜 배수를 2.0 으로 바꾸지 않음', html, true,  "'스페셜':{n:'스페셜태그배틀',  hp:1.15"],
  ['옛 절대 pt 곡선 제거',             html, false, 'const WAIT_K=5.17, WAIT_P=0.39;'],
  ['여파에 방어를 안 쓴다',            html, true,  'const splashRate=(pw,atk,mult)=>'],
  ['여파에 타입 배율',                 html, true,  "splashRate(r.pw, r.atk, eff(m.t,w.t))"],
  ['적합 범위 밖 표시',                html, true,  'const SPL_FIT_MAX=14000;'],
  ['화면에 비율로 적는다',             html, true,  "Math.round(x.rate*100)+'%'"],
  // 급소는 여파에도 ×2 (v3.25.0 · 2026-08-17 실측) — 표시로만 알린다
  ['급소 ×2 를 기록',                  html, true,  '**급소는 여파에도 ×2 로 실린다**'],
  ['여파를 2배로 계산하지 않는다',      html, true,  '그래도 여파를 2배로 계산하지 않는다'],
  ['화면에 급소 안내',                 html, true,  '· 급소면 ×2'],

  ['보스 열에도 여파를 센다',          html, false, 'sps: isBoss ? [] :'],
  ['보스는 화력 같으면 여파로 가른다', html, true,  '(b.dmg-a.dmg)||(b.splash-a.splash)'],
  ['여파 합에 보스 열도 넣는다',       html, true,  'sp+=r.splash||0;'],
  ['활성 피해를 복사하지 않는다',      html, false, 'sp1: isBoss ? 0 : splashPt(r.dmg)'],
  ['여파는 보스+다른 서브 합산',       html, true,  'row.splash = row.sps.reduce('],
  ['대기 카드를 넘긴다',               html, true,  'const waiters = cols.map(foeOf).filter(x=>x && x!==f);'],
  ['무피해끼리는 여파 큰 쪽',          html, true,  '(b.splash-a.splash)||(b.dmg-a.dmg)'],
  ['«센 카드 아끼기» 기준 제거',       html, false, 'const keepOf=c=>'],
  ['keep 이 순서에 안 쓰인다',         html, false, 'a.keep-b.keep'],
  ['아낄 자리가 없다는 근거 기록',      html, true,  '세 장이 전부 어딘가에 쓰이므로'],
  ['화면에 여파 칸',                   html, true,  '<span class="k">여파</span>'],
  // 피격은 무피해여도 적는다 (v3.19.0 · 잭 지적)
  ['세로 칸 피격 상시 표시',           html, true,  "const hit = `·피격 "],
  ['무피해라고 피격을 감추지 않음',    html, false, "const hit = p.tier===0 ? '' :"],
  ['슬롯 피격에 단서',                 html, true,  '격파 실패 · 후공 때만'],

  ['가운데 슬롯 배지는 보스',          html, true,  "const lab = isB?'보스':'서브 '"],
  ['▼ 연결선 유지',                    html, true,  'class="fl-link'],
  ['후보에 수치를 통째로 담는다',       html, true,  'const row={...r, c, m,'],
  ['슬롯에 위력·공격·방어',            html, true,  '<span class="k">위력</span>'],
  ['슬롯에 피격 (늘 표시)',            html, true,  '<span class="mult t2"><span class="k">피격</span>'],
  ['슬롯에 vs 상대 줄',                html, true,  '<span class="vsline">vs '],
  ['빈 슬롯 안내 문구',                html, true,  '상대를 입력하면 내야할 태그를 추천합니다'],
  ['안 쓰는 기믹은 흐린 아이콘',        html, true,  '<i class="gi mgi ${GK[c.g]}"'],
  ['세로 칸 CSS 유지',                 html, true,  '.fl-m .mx{flex:none'],
  ['전폭 구분선 안 씀',               html, false, 'fl-arrow'],
  ['가운데 칸은 «보스»',              html, true,  '<span class=\"fl-role\">보스</span>'],
  ['모드별 섹션 명칭',                html, true,  'function renderRotTitle('],
  ['지역배틀은 «상대별 매치»',         html, true,  "'상대별 매치' : '추천 로테이션'"],
  ['제목에 «대응» 안 씀 (글리프)',     html, false, "'상대별 대응'"],
  ['매치업 칸에 번호 안 붙임',         html, false, '로테이션 ${i+1}'],
  ["매칭 칸에 태그 아트",             html, true,  `class="fl-art\${pt}"`],
  ['지역배틀은 레인 배치 숨김',        html, true,  "uniq.length && mode!=='지역'"],
  ['지역배틀은 보스 정보박스 숨김',    html, true,  "ro.hidden = (mode==='지역')"],
  ['지역배틀은 턴별 카드 숨김',        html, true,  "box.hidden = (mode==='지역')"],
  ['지역배틀용 표시 단계 버튼',        html, true,  'id="foeSeg"'],
  ['지역배틀 seg 모드 연동',           html, true,  "sg.hidden = (mode!=='지역')"],
  ['그리드는 0·1 을 같게 봄',          html, true,  '[data-d="0"] .fl-s,[data-d="1"] .fl-s'],
  ['지역 seg 에 «태그» 없음',          html, false, '<button data-lv="0" aria-pressed="true">태그</button>\n      <button data-lv="1">상성</button>\n      <button data-lv="2">상세</button>\n    </div>\n    <div class="card" id="foeBox"'],
  ['타입 아이콘 사용',                html, true,  '.fl-tp .t .ti'],
  // 빈 서브 칸 (v1.81.0 · 잭 지정) — 기호를 지우고 상자를 누르게 했다
  ['빈 서브 칸 «＋» 제거',            html, false, '<span class="fl-n">+</span>'],
  ['빈 서브 칸은 세로 빈 박스',        html, true,  '<span class="fl-art p ph"><i></i></span>'],
  ['빈 박스 CSS',                    html, true,  '.fl-art.ph i{border:1px dashed'],
  ['빈 박스 누름 표시',               html, true,  '.fl-cell.foe.empty:active .fl-art.ph'],
  // 서브 선택 팝업 (v1.82.0 · 잭 지정) — 인라인 패널을 아래 시트로 옮겼다
  ['서브 선택은 팝업',                html, true,  '<div class="pickmodal" id="foeModal" hidden>'],
  ['인라인 서브 픽커 제거',            html, false, '<div class="foepick" id="foePick"'],
  ['팝업 바깥 클릭으로 닫기',          html, true,  "getElementById('foeModal').addEventListener('click',closeFoePick)"],
  ['시트 안쪽 클릭은 안 닫힌다',       html, true,  ".pickbox').addEventListener('click',e=>e.stopPropagation())"],
  ['Esc 로 닫기',                    html, true,  "if(e.key==='Escape') closeFoePick()"],
  ['시트 안 목록은 높이 상한 해제',    html, true,  '.pickbox .foegrid{flex:1'],
  // 이어 고르기 (v1.83.0 · 잭 지정) — 둘 다 비었을 때만 두 장을 연달아 고른다
  ['이어 고르기 상태',                html, true,  'let foeChain=false;'],
  ['둘 다 빌 때만 이어 고르기 켬',     html, true,  'foeChain = (foes[0]==null && foes[1]==null);'],
  ['한 장 고르면 남은 칸으로',         html, true,  'if(foeChain && foes[other]==null){ foePickAt=other; }'],
  ['닫으면 이어 고르기 해제',          html, true,  'foePickAt=-1; foeChain=false; clearFoeQ(); renderFoes();'],
  ['진행 표시 1/2·2/2',              html, true,  'class="pickstep"'],
  // 목록에서 이미 들어간 태그 표시 (v1.84.0 · 잭 지정)
  ['이 칸에 든 태그는 진하게',         html, true,  ".foegrid button.on{background:var(--cyan)"],
  ['다른 칸에 든 태그는 테두리만',      html, true,  '.foegrid button.used{border-color'],
  ['이 칸 태그에 on 부여',            html, true,  "if(foes[foePickAt]===s.id){ b.className='on'"],
  ['다른 칸 태그에 used 부여',         html, true,  "else if(foes[other]===s.id){ b.className='used'"],
  ['아트 키에 성급 포함',              html, true,  "TAGIMG[b.s+'-'+b.r+'-'+b.n]"],
  ['artCls 도 성급 포함',              html, true,  "AK[c.s+'-'+c.r+'-'+c.n]"],
  ['★4 이하는 세로 아트',              html, true,  "'432'.includes(c.r)"],
  ['세로 아트 비율 CSS',               html, true,  '.fl-art.p i{width:auto;height:100%;aspect-ratio:108/192}'],
  // 칸 줄맞춤 (v1.85.0 · 잭 지정)
  ['아트 틀 기본은 가로',              html, true,  'width:100%;aspect-ratio:192/108;margin-bottom:3px}'],
  ['세로가 낀 줄만 정사각',            html, true,  '.fl-cell.pf .fl-art{aspect-ratio:1/1}'],
  ['줄에 세로가 있는지 판정',          html, true,  'const rowP = [0,1].some(at=> foes[at]==null || isPort(SUBBY.get(foes[at])));'],
  ['판정 배지는 칸 바닥',              html, true,  'border-radius:6px;margin-top:auto}'],
  ['머리말은 이름보다 작게',           html, true,  '.fl-role{font-weight:800;font-size:8.5px'],
  // 아래 줄 머리말 삭제 (v1.87.0 · 잭 지정)
  // HP·속도 한 줄 유지 (v1.88.0 · 잭 지적)
  ['잔글씨는 한 줄 (.one)',           html, true,  '.fl-s.one{font-size:9.5px'],
  ['잔글씨 nowrap',                    html, true,  'white-space:nowrap;\n  max-width:100%;overflow:hidden;text-overflow:ellipsis}'],
  ['구분자 앞뒤 공백 없음',            html, false, '· 속도 ${'],
  ['피격 구분자도 공백 없음',          html, false, "` · 피격 "],
  // 기술명 줄도 한 줄 (v1.89.0 · 잭 지적)
  // 타입 아이콘을 이름 옆으로 (v1.90.0 · 잭 지정)
  ['상대 칸 타입 아이콘도 이름 옆',    html, true,  '<span class="fl-n wt fl-tp">${f.t.map(tp).join(\'\')}<span class="nm">${f.n}</span></span>'],
  ['★N 줄은 성급만',                   html, true,  '<span class="fl-meta">${rlab(f.r)}</span>'],
  ['★N 줄에도 크기 지정',              html, true,  '.fl-meta{font-weight:700;font-size:10.5px'],
  ['이름 줄 CSS',                      html, true,  '.fl-n.wt{display:flex;flex-wrap:nowrap'],
  ['기술 줄에 아이콘 없음',            html, false, '<span class="fl-m fl-tp">${tp('],
  ['.fl-m 는 .fl-tp 뒤에',             html, true,  '위로 옮기지 말 것'],
  // font 단축 + inherit 은 선언 통째가 무효 (v1.91.0 에서 11건 발견)
  ['font 단축에 inherit 없음',         html, false, 'px/1 inherit'],
  ['font 단축에 inherit 없음 2',       html, false, 'px/1.2 inherit'],
  ['font 단축에 inherit 없음 3',       html, false, 'px/1.25 inherit'],
  ['font 단축에 inherit 없음 4',       html, false, 'px/1.3 inherit'],
  ['font 단축에 inherit 없음 5',       html, false, 'px/1.4 inherit'],
  ['그 함정을 문서에 적어 둠',         html, true,  'font:` 단축 속성에 `inherit` 을 쓰지 말 것'],
  // 배율 표기 (v1.92.0 · 잭 지적) — 맨 «×2» 는 «두 번 쓴다» 로 읽힌다
  // 기믹 기술 아이콘 (v1.95.0 · 잭 지정)
  // 보스 칸도 상세를 보여 준다 (v1.93.0 · 잭 지적)
  // 매치 안내문에서 «무피해 보장 아님 · 최악 상정» 두 문장 삭제 (v1.94.0 · 잭 지정)
  ['안내문에서 확률 경고 삭제',        html, false, '«무피해»는 보장이 아닙니다'],
  ['안내문에서 최악 상정 문구 삭제',    html, false, '기준 최악 상정입니다'],
  ['삭제 사유를 코드에 남김',          html, true,  '내용 자체는 여전히 참이고 CLAUDE.md'],
  ['매칭 칸이 tp() 를 씀',            html, true,  't.map(tp).join'],
  ['기존 .lane 을 덮지 않는다',        html, false, '.lanes{display:flex'],
  ['서브에 기믹을 안 쓴다',           html, true,  'isBoss ? c.mv : c.mv.filter(m=>!m.tagx)'],
  ['선공+원턴킬 무피해 판정',         html, true,  'row.ko&&row.spd>0 ? 0'],
  ['도감 오타 정정 (캐이시) — 순서', html, true,  '"캐이시|2"'],
  ['도감 오타 정정 (캐이시) — 타입', html, true,  '캐이시,에스퍼'],
  ['저성급 검산 편차 기록',           html, true,  '저성급은 원래 편차가 크다'],
  ['도감 오타 정정 (옥우지)',        html, false, '옥우지'],
  ['다이빙 물리 정정',               html, true,  "[['다이빙','물','물리']]"],
  ['도감 오타 정정 (흥나숭)',        html, false, '흥나숭'],
  ['도감 오타 정정 (지그제구리)',    html, false, '지그제구리'],

  // 실측 기록 (v3.31.0) — «있어야 하는 것» 과 «넣으면 안 되는 것» 을 짝으로
  ['기록 뷰가 있다',                 html, true,  'id="viewHist"'],
  ['기록 저장 키',                   html, true,  "const HKEY=KEY+':hist'"],
  ['기록은 wipe 대상이 아니다',       html, false, 'localStorage.removeItem(HKEY)'],
  ['기록 문서화',                    doc,  true,  '## 실측 기록 (v3.31'],
  // v3.31.1 — 글리프 밖 제목 금지 + 픽커 탄 필터
  // (v3.31.2 에서 «배틀 입력» 검사는 «전투 입력» 으로 대체 — 아래 참조)
  ['옛 제목 «판 입력» 제거',          html, false, '<h2>판 입력</h2>'],
  ['옛 제목 «일괄 입력» 제거',        html, false, '<h2>일괄 입력</h2>'],
  ['픽커가 탄 설정을 따른다',         html, true,  'foeSets[s]===false'],
  // v3.31.2 — «틀» 자형 회피 + 판 종류 정식 명칭
  ['제목 «전투 입력»',                html, true,  '<h2>전투 입력</h2>'],
  ['«틀» 제목 제거',                  html, false, '<h2>배틀 입력</h2>'],
  ['판 종류 정식 명칭 (스페셜)',      html, true,  '>스페셜태그배틀</button>'],
  ['판 종류 정식 명칭 (다맥)',        html, true,  '>다이맥스포켓몬</button>'],
  ['내부 값은 그대로 (다맥)',         html, true,  'data-m="다맥"'],
  // v3.31.3 — 잭 지정 배치
  ['1행 = 위치+선물',                html, true,  'id="hRow1"'],
  ['LR 버튼 제거',                   html, false, 'data-p="LR"'],
  ['겟 라벨 (실패)',                 html, true,  '>겟-실패</button>'],
  ['겟 라벨 (성공)',                 html, true,  '>겟-성공</button>'],
  ['옛 «판 저장» 제거',              html, false, '>판 저장</button>'],
  ['픽커 부착이 .hslot 전체',        html, true,  "querySelectorAll('.hslot').forEach(el=>el.addEventListener('click'"],
  // v3.31.5 — 픽커 = foeModal 컴포넌트 문법
  ['픽커가 foegrid 를 쓴다',          html, true,  'id="hGrid"'],
  ['픽커 성급 거르개',                html, true,  'id="hRank"'],
  ['옛 자체 목록 제거',               html, false, 'hPickList'],
  ['그대로 쓰기 점선 유지',           html, true,  '.foegrid button.hnew{border-style:dashed}'],
  ['이어 고르기',                     html, true,  'const next=hOrder().find(k=>!hCur[k])'],
  // v3.31.6 — 탄 스위치 복원 (컴포넌트 동일성 · 잭 지적)
  ['픽커 탄 스위치',                  html, true,  'id="hSet"'],
  ['탄 스위치 표시 규칙',             html, true,  "hs.hidden = searching || hRank==='R' || onSets.length<2"],
  ['목록이 탄을 보존한다',            html, true,  'out.push({n:String(n), r:String(r), s:String(s)})'],
  // v3.32.0 — 동시 진행 드래프트 + 수정
  ['드래프트 3개',                    html, true,  'let hDrafts={L:hFresh('],
  ['드래프트 영속화',                 html, true,  "const HDKEY=HKEY+':draft'"],
  ['자동 교대 제거',                  html, false, "hCur.p = hCur.p==='L'?'R':'L'"],
  ['목록 줄 수정 진입',               html, true,  'function hEditStart('],
  ['수정 인덱스 보정',                html, true,  'else if(i<hEditIdx) hEditIdx--'],
  // v3.32.1 — 비움 저장 (관측 실패도 데이터)
  ['보스 필수 제거',                  html, false, '보스는 비울 수 없습니다'],
  ['빈 판 두 번 탭 확인',             html, true,  '그래도 남기려면 한 번 더 누르세요'],
  // v3.33.0 — 일괄 입력 제거 · 분석 패널
  ['분석 패널',                       html, true,  'function hAnalyze('],
  ['분석 제목이 글리프 안 (석 회피)', html, true,  '<h2>기록 통계</h2>'],
  ['목록 갱신 시 분석도 갱신',        html, true,  'renderHStat();'],
  ['일괄 입력 제거 (파서)',           html, false, 'function hParse('],
  ['일괄 입력 제거 (UI)',             html, false, 'id="hBulk"'],
  // v3.34.0 — 출처(플레이/관전) + 플레이 연동
  ['출처 토글',                       html, true,  'id="hSrc"'],
  ['출처 기본값은 관전',              html, true,  "src:'watch'"],
  ['플레이 화면에서 가져오기',        html, true,  'function hPullPlay('],
  ['연동이 스페셜=LR 을 지킨다',      html, true,  "if(mode==='스페셜' && hActiveP!=='LR')"],
  ['내보내기에 출처 표시',            html, true,  "e.src==='play'?' [플레이]':' [관전]'"],
  // v3.35.0 — 플레이 기록 토글 + 인라인 블록
  ['플레이 기록 토글',                html, true,  'id="playRecSw"'],
  ['기본 꺼짐',                       html, true,  'let playRec=false;'],
  ['save 에 playRec',                 html, true,  'dex:bagArr(dex),playRec'],
  ['wipe 에 playRec',                 html, true,  'dex=new Bag(); playRec=false;'],
  ['플레이 상단 블록 (선물)',         html, true,  'id="sPlayRecTop"'],
  ['플레이 하단 블록 (겟·저장)',      html, true,  'id="sPlayRecBot"'],
  ['위치 버튼 공용 클래스',           html, true,  "querySelectorAll('.hposg button')"],
  ['겟 버튼 공용 클래스',             html, true,  "querySelectorAll('.hgotg button')"],
  ['옛 id 선택자 안 남음 (hPos)',     html, false, "querySelectorAll('#hPos button')"],
  ['옛 id 선택자 안 남음 (hGot)',     html, false, "querySelectorAll('#hGot button')"],
  // v3.35.1 — 픽커는 뷰 밖 최상위 (플레이 화면에서도 보여야)
  ['픽커가 뷰 밖에 있다',             html, true,  '뷰 밖(최상위)에 둔다'],
  // v3.36.0 — 선물은 이어 고르기에서 분리 (선물↔상대 사이 텀)
  ['선물은 이어 고르기 밖',           html, true,  "(hSlot==='g'||hSlot==='g2') ? [hSlot] : (hCur.m==='지역'"],
  ['옛 4칸 연쇄 제거',                html, false, "['g','s1','b','s2']"],
  // v3.36.1 — 플레이 화면 L/R 은 값 전용 (한쪽에서만 플레이)
  ['플레이 위치는 값 전용 클래스',    html, true,  'hposg hposval'],
  ['값 전용 분기',                    html, true,  "hEditIdx!=null || b.closest('.hposval')"],
  // v3.36.2 — 겟 버튼 순서(성공 먼저) · 저장 가운데
  ['겟-성공이 먼저',                  html, true,  '>겟-성공</button>\n        <button data-g="0"'],
  ['옛 순서(실패 먼저) 없음',         html, false, '>겟-실패</button>\n        <button data-g="1"'],
  ['저장 줄 가운데 정렬',             html, true,  '.hact-center{flex-direction:column'],
  // v3.36.3 — v3.32.0 에서 없앤 자동 교대를 안내줄이 계속 광고하고 있었다
  ['낡은 «자동 교대» 안내 제거',      html, false, '자동으로 바뀝니다'],
  // v3.37.0 — 게임기 버전
  ['게임기 버전 기본값',              html, true,  "GVER_DEFAULT={maj:1,min:0,pat:4,build:'39608'}"],
  ['표준 용어 (미들 없음)',           html, false, '미들'],
  // v3.37.2 — 설정 섹션 순서 (기록 관련은 아래로)
  ['버전 문자열 조립',                html, true,  "+'.ko.'"],
  ['save 에 gver',                    html, true,  'playRec,gver});'],
  ['wipe 에 gver',                    html, true,  'gver={...GVER_DEFAULT};'],
  ['판마다 기계 버전 스탬프',         html, true,  'gver:hCur.gver||gverStr()'],
  // v3.38.0 — 시각·버전은 «바뀔 때만» 헤더로
  ['내보내기 헤더',                   html, true,  'function hExport('],
  ['헤더는 바뀔 때만',                html, true,  "if((d&&d!==day)||(v&&v!==ver))"],
  ['목록에 시각',                     html, true,  'class="hts"'],
  // v3.39.0 — 기록 기능 off 면 기록 탭도 감춤
  ['기록 탭이 playRec 을 따른다',     html, true,  'vh.hidden=!playRec'],
  ['보던 중 꺼지면 플레이로',         html, true,  "view==='hist') setView2('battle')"],
  // v3.40.0 — 방문 누락 보정
  ['복귀 시 page_view 재전송',        html, true,  "window.gtag('event','page_view')"],
  ['30분 기준',                       html, true,  'Date.now()-seen>30*60*1000'],
  ['판 저장 이벤트',                  html, true,  "track('rec_save')"],
  ['보스 선택 이벤트',                html, true,  "track('boss_pick')"],
  ['보스 이름은 안 보낸다',           html, false, "gtag('event','boss_pick',{"],
  // v3.41.0 — 트레이너 ID 5칸
  ['트레이너 ID 5칸',                 html, true,  "TIDS=[{k:'main'"],
  ['옛 QR 형식 이관 유지',            html, true,  '이관을 지우지 말 것'],
  ['설정 5칸 목록',                   html, true,  'function renderTidSet('],
  ['플레이 선택 줄',                  html, true,  'function renderTidPick('],
  ['판 기록에 tid',                   html, true,  'tid:hCur.tid||tidCur'],
  // v3.43.0 — 선물은 판 종류 무관
  ['비지역에서도 선물 칸',            html, true,  "k!=='b' && k!=='g'"],
  ['저장 시 선물 유지',               html, true,  "if(e.m!=='지역'){ e.s1=e.s2=null; }"],
  ['내보내기에 선물 자리',            html, true,  "' 스페셜태그배틀 '+hFmt(e.b)"],
  // v3.44.0 — 스페셜은 선물 두 장
  ['선물 R 칸',                       html, true,  'data-k="g2"'],
  ['스페셜에서만 노출',               html, true,  "el.hidden=!sp"],
  ['스페셜 아니면 g2 비움',           html, true,  "if(e.m!=='스페셜') e.g2=null;"],
  // v3.45.0 — 판 종류를 모든 줄에
  ['지역배틀도 판 종류 표기',         html, true,  "' 지역배틀 '+hFmt(e.s1)"],
  ['다맥은 정식 명칭',                html, true,  "' 다이맥스포켓몬 '+hFmt(e.b)"],
  ['내보내기 이름 공백 제거',         html, true,  "String(t.n).replace(/\\s+/g,'')"],
  // v3.47.0 — 스페셜은 L·R 두 줄
  ['스페셜 두 줄 저장',               html, true,  "hist.push(...rows)"],
  ['스페셜 저장 블록은 한 벌만',      html, 1,     '스페셜 2줄 저장됨'],
  ['LR 위치 값 제거',                 html, false, "hCur.p='LR'"],
  ['스페셜도 한쪽 선물만 내보냄',     html, true,  "e.p+' '+hFmt(e.g)+' 스페셜태그배틀 '"],
  // v3.48.0 — 저장 유실 방지
  ['flush 함수',                      html, true,  'function saveFlush('],
  /* v3.48.3 — 저장이 «조용히» 실패하던 구멍. savePayload 가 try 밖이라 예외가 나면
     saveWrite 가 거부되는데 아무도 잡지 않았고, backend 는 local 그대로여서 화면이
     «저장 켜짐» 이라 말하면서 아무것도 저장되지 않았다. 넷을 짝으로 감시한다. */
  ['저장 실패를 드러낸다',            html, true,  'function saveFail('],
  ['payload 를 try 로 감싼다',        html, true,  'try{ p=savePayload() }catch'],
  ['옛 무방비 payload 제거',          html, false, '\n  const p=savePayload();'],
  ['값 하나가 상해도 저장',           html, true,  'const bagArr='],
  ['거부를 호출 쪽에서 잡는다',       html, true,  'saveWrite().catch('],
  ['실패 이유를 화면에 적는다',       html, true,  'saveErr ?'],
  ['숨겨질 때 flush',                 html, true,  'if(document.hidden) saveFlush();'],
  ['pagehide 에서도 flush',           html, true,  "window.addEventListener('pagehide',saveFlush)"],
  // v3.42.0 — ID 별 스타 포켓몬 리스트 (3단계)
  ['ID 별 리스트 모달',               html, true,  'id="tdxModal"'],
  ['3단계 순환',                      html, true,  "const nx=((store[key]||0)+1)%3"],
  ['ID 별 저장 (dex 와 별개)',        html, true,  'bag.dex=Object.assign({},bag.dex)'],
  ['몬스터볼은 CSS',                  html, true,  '.tdxc .bl{position:absolute'],
  ['아트는 artCls 로',                html, true,  'ac=artCls(p)'],
  ['base64 직접 삽입 없음',           html, false, 'url(${art})'],

  ['문서 버전이 코드와 같은가',       doc,  true,  null],
];

let bad0=0;
/* 입력창 글자 크기 (v3.42.2) — iOS 는 16px 미만 입력창에서 화면을 확대하고 되돌리지 않는다.
   v2.9.1 에서 검색창만 고쳤다가 별명·빌드에서 같은 실수가 재발했다. **전수로 본다.** */
{
  /* ⚠ `<style>` 은 **두 군데**다 (앞부분·본문). 첫 구간만 보면 뒤쪽 규칙을 통째로 놓친다 —
     v3.42.2 에서 실제로 놓쳤다. 전부 이어 붙여서 본다. */
  const css=(html.match(/<style>([\s\S]*?)<\/style>/g)||[]).join('\n');
  const bad=[];
  css.replace(/([^{}]+)\{([^{}]*)\}/g,(_,sel,body)=>{
    const m=/font-size:(\d+(?:\.\d+)?)px/.exec(body);
    if(m && Number(m[1])<16 && /input|textarea|search|verbuild/i.test(sel)) bad.push(sel.trim()+' '+m[1]+'px');
    return '';
  });
  console.log((bad.length?'  ★   ':'  OK  ')+'입력창 16px 이상'+(bad.length?'  ('+bad.join(' · ')+')':''));
  if(bad.length) bad0++;
}

/* 설정 섹션 순서 (v3.37.2 · 잭 지정) — 문자열 유무가 아니라 «순서» 라 checks 로는 못 쓴다.
   기록 관련(플레이 기록·게임기 버전)은 아래쪽이어야 한다. */
{
  const a=html.indexOf('<div id="viewChance" hidden>'), b=html.indexOf('<div id="viewHist" hidden>');
  const seg=html.slice(a,b);
  const want=['상대 태그 탄','룰렛 보정','플레이 기록','트레이너 ID','게임기 버전','개인정보 안내'];
  const wipeLast = seg.lastIndexOf('id="sWipe"') > seg.lastIndexOf('id="sPriv"');
  console.log((wipeLast?'  OK  ':'  ★   ')+'초기화는 설정 맨 아래');
  if(!wipeLast) bad0++;
  const got=[...seg.matchAll(/<h2>([^<]*)<\/h2>/g)].map(m=>m[1]);
  const ok=JSON.stringify(got)===JSON.stringify(want);
  console.log((ok?'  OK  ':'  ★   ')+'설정 섹션 순서'+(ok?'':'  (기대 '+want.join('>')+' · 실제 '+got.join('>')+')'));
  if(!ok) bad0++;
}

let bad=bad0;
/* 용량 예산 — **v1.80.0 에서 ★4 이하 90장만 재압축했다 (108x192 → 84x149 q40). 911→782KB.**
   ★6·★5·공통 56장과 아이콘은 **일부러 손대지 않았다** (잭 지정 2026-08-14) — 컬렉션 탭에서
   늘 보이는 그림이라 체감이 크기 때문이다.
   **미리보기(490 안정·576 경계·657 실패)는 복구를 포기했다.** ★4 이하를 64폭까지 낮춰도
   658KB 라 산술적으로 불가능하다 — ★6·★5 아트 172KB 를 지키기로 한 이상 임계값은 의미가 없다.
   그래서 한시 예산은 **900KB** 로 둔다 (부풀기 감시용이지 미리보기 기준이 아니다).
   원래 예산 480KB 는 **아트 56장 시절 숫자라 지금은 성립하지 않는다** — 되돌릴 값이 아니라
   다시 정해야 할 값이다. 재압축 도구는 `dev/recompress.py`. */
const KB=fs.statSync(__dirname+'/../index.html').size/1024;
console.log(`용량  ${KB.toFixed(0)}KB / 한시 예산 900KB (미리보기 복구는 포기 · 부풀기 감시용)`);
if(KB>900){ console.log('  ★ 예산 초과 — 아트 재압축 또는 감량 필요'); bad++; }
else console.log('  OK');

/* 아트 키 수·규격 — v1.76.0 사고(시험 삽입한 ★4 4장이 원복 뒤에도 남아 가로 144x81 인 채
   배포본에 섞였다) 재발 방지. 문서에 적은 장수와 실제 키 수가 어긋나면 잡는다.
   **아트를 넣을 때마다 이 두 숫자를 함께 올릴 것.** */
const TAGIMG_N=146, LOW_N=90;
/* `foeOn` 이 나오는 자리는 **다섯 곳뿐**이다 (v2.9.0 기준):
     ① 정의부 주석  ② 정의  ③ 서브 픽커 목록  ④ 설정 안내줄 장수 세기
     ⑤ renderBosses 주석 («여기서는 안 쓴다» 고 적어 둔 것)
   늘어났다면 내 쪽(컬렉션·로테이션·BEST-25)에 끼워 넣은 것이다 —
   **기계에서 1탄이 내려가도 내가 가진 1탄 태그는 계속 쓴다.**
   자리를 늘릴 때는 이 숫자와 위 목록을 함께 고칠 것. */
const FOEON_N=5;
/* 성급별 용량 — v1.80.0 재압축 결과를 고정한다. 위아래 양쪽을 본다:
   ★4 이하가 늘면 재압축이 풀린 것이고, **★6·★5 가 줄면 실수로 같이 압축한 것**이다
   (원본 크롭이 없어 한 번 줄이면 되돌릴 수 없다 — 이 검사가 그 사고를 막는다). */
const LOW_KB_MAX=230, HI_KB_MIN=165;   // v2.3.0 그림만 312→232KB · v2.4.0 재조정 →210KB
{
  const i=html.indexOf('const TAGIMG={'), j=html.indexOf('\n};',i);
  const keys=(html.slice(i,j).match(/"[^"]+":"/g)||[]).map(x=>x.slice(1,-2));
  const low=keys.filter(k=>/^\d-[1-4]-/.test(k));
  const fo=(html.match(/foeOn/g)||[]).length;
  console.log(`foeOn ${fo}회 (기대 ${FOEON_N}) — 상대 후보에만 걸어야 한다`);
  if(fo!==FOEON_N){ console.log('  ★ foeOn 이 다른 데로 번졌다. 내 수집 태그는 탄과 무관해야 한다'); bad++; }
  else console.log('  OK');
  console.log(`아트  TAGIMG ${keys.length}키 (기대 ${TAGIMG_N}) · ★4 이하 ${low.length}장 (기대 ${LOW_N})`);
  if(keys.length!==TAGIMG_N||low.length!==LOW_N){
    console.log('  ★ 문서에 적힌 장수와 다르다 — 시험 삽입이 남았거나 문서를 안 고쳤다'); bad++;
  }
  else console.log('  OK');

  const ent=[...html.slice(i,j).matchAll(/"([^"]+)":"([^"]+)"/g)];
  const kb=f=>ent.filter(m=>f(m[1])).reduce((s,m)=>s+m[1].length+m[2].length+6,0)/1024;
  const lowKB=kb(k=>/^\d-[1-4]-/.test(k)), hiKB=kb(k=>!/^\d-[1-4]-/.test(k));
  console.log(`      ★4 이하 ${lowKB.toFixed(0)}KB (상한 ${LOW_KB_MAX}) · ★6·★5·공통 ${hiKB.toFixed(0)}KB (하한 ${HI_KB_MIN})`);
  if(lowKB>LOW_KB_MAX){ console.log('  ★ ★4 이하 아트가 부풀었다 — 재압축이 풀렸는지 볼 것'); bad++; }
  else if(hiKB<HI_KB_MIN){ console.log('  ★ ★6·★5 아트가 줄었다 — 실수로 같이 압축했다. 원본이 없으니 백업에서 되돌릴 것'); bad++; }
  else console.log('  OK');
}

// 버전 일관성
const vs=[
  (html.match(/<meta name="version" content="([^"]+)"/)||[])[1],
  /* v3.24.0 부터 푸터는 비워 두고 VLABEL 로 채운다 — 거기서 버전을 읽지 않는다.
     대신 **BUILT 가 있는지**만 본다 (날짜 자체는 사람이 맞춰야 한다). */
  (html.match(/const BUILT='(\d{4}-\d{2}-\d{2})'/) ? (html.match(/const VERSION='([^']+)'/)||[])[1] : undefined),
  (html.match(/const VERSION='([^']+)'/)||[])[1],
];
const docV=(doc.match(/- 버전: \*\*v([\d.]+)\*\*/)||[])[1];
const same = vs[0]&&vs.every(v=>v===vs[0]);
const built=(html.match(/const BUILT='([^']+)'/)||[])[1];
console.log(`버전  meta=${vs[0]} 상수=${vs[2]} 문서=${docV} · BUILT ${built}`);
if(!same){ console.log('  ★ 코드 안에서 버전이 어긋난다'); bad++; }
else if(docV!==vs[0]){ console.log('  ★ 문서 버전이 코드와 다르다'); bad++; }
else console.log('  OK');

console.log('');
/* want 가 true/false 면 «있다/없다», **숫자면 «정확히 그 개수»** 를 본다 (v3.48.1).
   중복 치환으로 같은 블록이 여러 벌 붙는 사고를 잡기 위한 것이다 —
   그때 각 벌이 문법상 멀쩡해 보여서 다른 검사로는 안 걸렸다. */
const count=(hay,needle)=>hay.split(needle).length-1;
for(const [label,target,want,needle] of checks){
  if(!needle) continue;
  let ok, detail;
  if(typeof want==='number'){
    const n=count(target,needle);
    ok = n===want;
    detail = `${want}벌이어야 하는데 ${n}벌: ${needle}`;
  } else {
    ok = target.includes(needle)===want;
    detail = `${want?'있어야 하는데 없음':'없어야 하는데 있음'}: ${needle}`;
  }
  if(!ok) bad++;
  console.log(`  ${ok?'OK  ':'★   '}${label}${ok?'':`  (${detail})`}`);
}
console.log('');
console.log(bad ? `★ 어긋남 ${bad}건` : '문서와 코드가 일치한다');
process.exit(bad?1:0);
