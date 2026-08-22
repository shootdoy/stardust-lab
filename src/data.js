/* 태그 장수를 세는 집합. 같은 태그를 여러 장 가질 수 있어 Set 으로는 부족하다.
   0 이 되면 키를 지우므로 has() 는 «한 장 이상 보유» 와 같다. */
class Bag extends Map{
  constructor(init){ super();
    if(Array.isArray(init)) init.forEach(x=>Array.isArray(x)?this.set(x[0],x[1]):this.add(x));
    else if(init) init.forEach&&init.forEach((v,k)=>this.set(k,v));
  }
  cnt(id){ return this.get(id)||0 }
  add(id,n=1){ const v=this.cnt(id)+n; v>0?this.set(id,v):this.delete(id); return this }
  setCnt(id,n){ n>0?this.set(id,n):this.delete(id); return this }
  cycle(id,max=3){ const v=this.cnt(id); this.setCnt(id, v>=max?0:v+1); return this.cnt(id) }
  get total(){ let t=0; for(const v of this.values()) t+=v; return t }
  ids(){ return [...this.keys()] }
  toJSON(){ return [...this.entries()] }
}
// 예전 저장값(문자열 배열)도 읽는다 — 전부 1장으로 본다
const toBag=v=>{
  const b=new Bag();
  if(!Array.isArray(v)) return b;
  v.forEach(x=>Array.isArray(x)?b.setCnt(x[0],x[1]):b.setCnt(x,1));
  return b;
};

/* ══ 타입 상성 (공격 → 방어) ══ */
const T=['노말','불꽃','물','전기','풀','얼음','격투','독','땅','비행','에스퍼','벌레','바위','고스트','드래곤','악','강철','페어리'];
const CHART={
 노말:{바위:.5,고스트:0,강철:.5},
 불꽃:{불꽃:.5,물:.5,풀:2,얼음:2,벌레:2,바위:.5,드래곤:.5,강철:2},
 물:{불꽃:2,물:.5,풀:.5,땅:2,바위:2,드래곤:.5},
 전기:{물:2,전기:.5,풀:.5,땅:0,비행:2,드래곤:.5},
 풀:{불꽃:.5,물:2,풀:.5,독:.5,땅:2,비행:.5,벌레:.5,바위:2,드래곤:.5,강철:.5},
 얼음:{불꽃:.5,물:.5,풀:2,얼음:.5,땅:2,비행:2,드래곤:2,강철:.5},
 격투:{노말:2,얼음:2,독:.5,비행:.5,에스퍼:.5,벌레:.5,바위:2,고스트:0,악:2,강철:2,페어리:.5},
 독:{풀:2,독:.5,땅:.5,바위:.5,고스트:.5,강철:0,페어리:2},
 땅:{불꽃:2,전기:2,풀:.5,독:2,비행:0,벌레:.5,바위:2,강철:2},
 비행:{전기:.5,풀:2,격투:2,벌레:2,바위:.5,강철:.5},
 에스퍼:{격투:2,독:2,에스퍼:.5,악:0,강철:.5},
 벌레:{불꽃:.5,풀:2,격투:.5,독:.5,비행:.5,에스퍼:2,고스트:.5,악:2,강철:.5,페어리:.5},
 바위:{불꽃:2,얼음:2,격투:.5,땅:.5,비행:2,벌레:2,강철:.5},
 고스트:{노말:0,에스퍼:2,고스트:2,악:.5},
 드래곤:{드래곤:2,강철:.5,페어리:0},
 악:{격투:.5,에스퍼:2,고스트:2,악:.5,페어리:.5},
 강철:{불꽃:.5,물:.5,전기:.5,얼음:2,바위:2,강철:.5,페어리:2},
 페어리:{불꽃:.5,격투:2,독:.5,드래곤:2,악:2,강철:.5}
};
const COLOR={노말:'#B9B7A8',불꽃:'#FF7A3D',물:'#59A6FF',전기:'#FFD534',풀:'#6FD34F',얼음:'#8FE5E5',
 격투:'#E8543F',독:'#C36FD8',땅:'#DFBF66',비행:'#A5B9F5',에스퍼:'#FF6FA0',벌레:'#A9C13B',
 바위:'#C6B679',고스트:'#8D6BC4',드래곤:'#7A62F0',악:'#8C7461',강철:'#B8C2D4',페어리:'#F5A0D0'};
const eff=(a,ds)=>ds.reduce((m,d)=>m*((CHART[a]||{})[d]??1),1);

const RARITY={
 '6':{label:'슈퍼스타태그 ★6',color:'var(--r6)',bonus:1.15},
 '5':{label:'스타태그 ★5',color:'var(--r5)',bonus:1.08},
 '4':{label:'태그 ★4',color:'var(--r4)',bonus:1.00},
 '3':{label:'태그 ★3',color:'var(--r3)',bonus:0.90},
 '2':{label:'태그 ★2',color:'var(--r2)',bonus:0.80},
 'R':{label:'레귤러태그',color:'var(--rR)',bonus:1.00},
 'S':{label:'스페셜태그',color:'#FFB4E6',bonus:1.00}
};

/* ══ 실측 데이터 ══
   [탄, 등급, 이름, 코드, 타입, 분류, 메너지, HP, 공격, 방어, 특공, 특방, 스피드, 기술[], 기믹] */
const MEASURED=[
 // ── 스타더스트 1탄 ★6
 ['1','6','뮤츠','1-1-001',['에스퍼'],'전설',158,172,119,98,165,98,140,[['사이코브레이크','에스퍼','특수']],null],
 ['1','6','뮤','1-1-002',['에스퍼'],'환상',142,166,109,109,109,109,109,[['사이코키네시스','에스퍼','특수']],null],
 ['1','6','자시안','1-1-003',['페어리','강철'],'전설',162,152,175,120,85,120,153,[['거수참','강철','물리']],null],
 ['1','6','자마젠타','1-1-004',['강철','격투'],'전설',162,152,135,150,85,150,133,[['거수탄','강철','물리']],null],
 ['1','6','마기라스','1-1-005',['바위','악'],'슈퍼스타',144,169,147,121,105,111,69,[['스톤에지','바위','물리'],['다이록','바위','물리','다이맥스']],'다이맥스'],
 ['1','6','메타그로스','1-1-006',['강철','에스퍼'],'슈퍼스타',144,147,148,142,105,100,79,[['코멧펀치','강철','물리'],['다이스틸','강철','물리','다이맥스']],'다이맥스'],
 ['1','6','미라이돈','1-1-007',['드래곤','전기'],'전설',162,172,96,113,150,129,150,[['라이트닝드라이브','전기','특수']],null],
 ['1','6','이상해꽃','1-1-008',['독','풀'],'슈퍼스타',122,140,87,88,105,105,85,[['리프스톰','풀','특수']],'메가진화'],
 ['1','6','리자몽','1-1-009',['불꽃','비행'],'슈퍼스타',124,138,89,83,114,90,105,[['화염방사','불꽃','특수']],'메가진화'],
 ['1','6','거북왕','1-1-010',['물'],'슈퍼스타',124,139,88,105,90,110,83,[['하이드로펌프','물','특수']],'메가진화'],
 // ── 스타더스트 1탄 ★5
 ['1','5','샤미드','1-1-011',['물'],'스타',108,168,62,57,101,88,62,[['하이드로펌프','물','특수']],null],
 ['1','5','부스터','1-1-012',['불꽃'],'스타',108,111,119,57,88,101,62,[['화염방사','불꽃','특수']],null],
 ['1','5','블래키','1-1-013',['악'],'스타',112,143,64,106,60,124,64,[['악의파동','악','특수']],null],
 ['1','5','글레이시아','1-1-014',['얼음'],'스타',114,118,61,108,127,94,66,[['눈보라','얼음','특수']],null],
 ['1','5','피죤투','1-1-015',['노말','비행'],'스타',100,127,75,71,66,66,93,[['폭풍','비행','특수']],'메가진화'],
 ['1','5','팬텀','1-1-016',['고스트','독'],'스타',108,111,64,60,124,74,106,[['섀도볼','고스트','특수']],'메가진화'],
 ['1','5','윈디','1-1-017',['불꽃'],'스타',114,133,101,75,93,75,88,[['불대문자','불꽃','특수'],['다이내믹풀플레임','불꽃','특수','Z기술']],'Z기술'],
 ['1','5','거대코뿌리','1-1-018',['땅','바위'],'스타',110,155,128,119,53,53,39,[['지진','땅','물리'],['라이징랜드오버','땅','물리','Z기술']],'Z기술'],
 ['1','5','피카츄','1-1-019',['전기'],'스타',96,113,72,53,66,66,114,[['10만볼트','전기','특수'],['다이썬더','전기','특수','다이맥스']],'다이맥스'],
 ['1','5','플라이곤','1-1-020',['드래곤','땅'],'스타',114,132,99,80,80,80,99,[['지진','땅','물리'],['다이어스','땅','물리','다이맥스']],'다이맥스'],
 ['1','5','고릴타','1-1-021',['풀'],'스타',108,142,115,84,57,66,79,[['드럼어택','풀','물리']],null],
 ['1','5','에이스번','1-1-022',['불꽃'],'스타',108,124,107,71,62,71,109,[['화염볼','불꽃','물리']],null],
 ['1','5','인텔리레온','1-1-023',['물'],'스타',108,115,79,62,115,62,110,[['노려맞히기','물','특수']],null],
 ['1','5','가로막구리','1-1-024',['노말','악'],'스타',112,141,87,97,60,79,92,[['지옥찌르기','악','물리']],null],
 ['1','5','케르디오','1-1-025',['격투','물'],'환상',122,139,71,87,123,87,104,[['성스러운칼','격투','물리']],null],
 // ── 스타더스트 2탄 ★6
 ['2','6','가이오가','1-2-001',['물'],'전설',152,160,105,95,155,145,95,[['하이드로펌프','물','특수']],null],
 ['2','6','그란돈','1-2-002',['땅'],'전설',152,160,155,145,105,95,95,[['지진','땅','물리']],null],
 ['2','6','코라이돈','1-2-003',['격투','드래곤'],'전설',162,172,150,129,96,113,150,[['액셀브레이크','격투','물리']],null],
 ['2','6','피카츄','1-2-004',['전기'],'슈퍼스타',102,118,75,56,69,69,120,[['10만볼트','전기','특수'],['스파킹기가볼트','전기','특수','Z기술']],'Z기술'],
 ['2','6','잠만보','1-2-005',['노말'],'슈퍼스타',144,253,132,80,80,132,39,[['기가임팩트','노말','물리'],['다이어택','노말','물리','다이맥스']],'다이맥스'],
 ['2','6','짜랑고우거','1-2-006',['드래곤','격투'],'슈퍼스타',158,155,132,150,121,126,103,[['기합구슬','격투','특수'],['다이너클','격투','특수','다이맥스']],'다이맥스'],
 ['2','6','가디안','1-2-007',['에스퍼','페어리'],'슈퍼스타',124,132,72,72,135,124,88,[['사이코키네시스','에스퍼','특수']],'메가진화'],
 ['2','6','레시라무','1-2-008',['드래곤','불꽃'],'전설',162,169,132,111,164,132,100,[['크로스플레임','불꽃','특수']],null],
 ['2','6','제크로무','1-2-009',['드래곤','전기'],'전설',162,169,164,132,132,111,100,[['크로스썬더','전기','물리']],null],
 ['2','6','큐레무','1-2-010',['드래곤','얼음'],'전설',156,195,142,100,142,100,105,[['눈보라','얼음','특수']],null],
 // ── 스타더스트 2탄 ★5
 ['2','5','쥬피썬더','1-2-011',['전기'],'스타',108,111,62,57,101,88,119,[['10만볼트','전기','특수']],null],
 ['2','5','에브이','1-2-012',['에스퍼'],'스타',112,115,64,60,124,92,106,[['사이코키네시스','에스퍼','특수']],null],
 ['2','5','리피아','1-2-013',['풀'],'스타',114,118,108,127,61,66,94,[['리프블레이드','풀','물리']],null],
 ['2','5','님피아','1-2-014',['페어리'],'스타',116,149,67,67,110,129,62,[['문포스','페어리','특수']],null],
 ['2','5','루카리오','1-2-015',['강철','격투'],'스타',118,125,110,72,115,72,91,[['파동탄','격투','특수']],'메가진화'],
 ['2','5','토대부기','1-2-016',['땅','풀'],'스타',112,143,105,101,74,83,56,[['지진','땅','물리'],['라이징랜드오버','땅','물리','Z기술']],'Z기술'],
 ['2','5','초염몽','1-2-017',['격투','불꽃'],'스타',114,125,100,70,100,70,104,[['인파이트','격투','물리'],['전력무쌍격렬권','격투','물리','Z기술']],'Z기술'],
 ['2','5','엠페르트','1-2-018',['강철','물'],'스타',114,133,84,85,107,97,60,[['러스터캐논','강철','특수'],['초월나선연격','강철','특수','Z기술']],'Z기술'],
 ['2','5','알로라 나인테일','1-2-019',['얼음','페어리'],'스타',122,137,74,83,89,109,118,[['눈보라','얼음','특수'],['레이징지오프리즈','얼음','특수','Z기술']],'Z기술'],
 ['2','5','마기라스','1-2-020',['바위','악'],'스타',132,154,133,110,96,101,63,[['스톤에지','바위','물리'],['다이록','바위','물리','다이맥스']],'다이맥스'],
 ['2','5','메타그로스','1-2-021',['강철','에스퍼'],'스타',132,134,134,129,96,91,72,[['코멧펀치','강철','물리'],['다이스틸','강철','물리','다이맥스']],'다이맥스'],
 ['2','5','애프룡','1-2-022',['드래곤','풀'],'스타',110,125,110,81,96,62,72,[['드래곤다이브','드래곤','물리']],null],
 ['2','5','단지래플','1-2-023',['드래곤','풀'],'스타',110,163,86,81,101,81,33,[['사과산','풀','특수']],null],
 ['2','5','마휘핑','1-2-024',['페어리'],'스타',112,120,62,77,110,121,66,[['매지컬샤인','페어리','특수']],null],
 ['2','5','갈가부기','1-2-025',['물','바위'],'스타',104,138,110,87,48,67,73,[['양날박치기','바위','물리']],null]
];

/* ══ 레귤러 · 스페셜 태그 (탄 공통) ══ */
const COMMON=[
 // 레귤러태그 R-1-1 ~ R-1-3
 ['R','피카츄','R-1-1',['전기'],'레귤러',96,112,71,53,65,65,113,
   [['10만볼트','전기','특수'],['다이썬더','전기','특수','다이맥스']],'다이맥스'],
 ['R','루카리오','R-1-2',['강철','격투'],'레귤러',102,110,97,63,101,63,80,
   [['기합구슬','격투','특수'],['다이너클','격투','특수','다이맥스']],'다이맥스'],
 ['R','잠만보','R-1-3',['노말'],'레귤러',104,182,95,58,58,95,29,
   [['기가임팩트','노말','물리'],['다이어택','노말','물리','다이맥스']],'다이맥스'],
 // 스페셜 배포 태그
 ['S','따라큐','현장이벤트',['고스트'],'스페셜',112,115,95,85,55,110,101,
   [['섀도클로','고스트','물리'],['무한암야로의유인','고스트','물리','Z기술']],'Z기술'],
 ['S','피카츄 (현장이벤트)','현장이벤트',['전기'],'스페셜',100,117,74,55,68,68,118,
   [['10만볼트','전기','특수'],['스파킹기가볼트','전기','특수','Z기술']],'Z기술'],
 ['S','피카츄 (밴드증정)','밴드증정',['전기'],'스페셜',100,117,74,55,68,68,118,
   [['10만볼트','전기','특수'],['다이썬더','전기','특수','다이맥스']],'다이맥스']
];

/* ══ 1탄 ★4 (상대 서브용) ══════════════════════════════════════════════
   지역배틀에서 상대 파티의 «서브» 로 나오는 태그들. 2026-08-12 팬페이지 화면에서 입력.
   **`POOL` 에 넣지 않는다** — 추천·BEST-A25 계산을 흔들지 않게 분리했다.
   기술 위력은 팬페이지에 안 나와 `POWER` 미등록 상태다 (평가 시 기본 100 이 쓰인다).
   물리/특수 구분은 화면에 없다. 처음엔 «공격 vs 특공 중 높은 쪽» 으로 판정했으나,
   ★2 야돈(물대포 · 공37 > 특공24 인데 물대포는 특수기)이 **기술 분류는 스탯이 아니라
   기술 자체로 정해진다**는 것을 보여줬다 → **본가 분류를 따른다**.
   그에 따라 인텔리레온 다이빙을 특수 → **물리**로 정정했다 (2026-08-12). */
const LOW4=[
 ['고릴타',      '1-1-034',['풀'],              90,118, 95, 69, 48, 55, 66,[['씨기관총','풀','물리']]],
 ['에이스번',    '1-1-037',['불꽃'],            90,103, 88, 59, 51, 59, 90,[['블레이즈킥','불꽃','물리']]],
 ['인텔리레온',  '1-1-040',['물'],              90, 96, 66, 51, 95, 51, 91,[['다이빙','물','물리']]],
 ['라이츄',      '1-1-043',['전기'],            84, 89, 69, 44, 69, 62, 84,[['번개','전기','특수']]],
 ['쥬피썬더',    '1-1-045',['전기'],            90, 92, 51, 48, 84, 73, 99,[['번개','전기','특수']]],
 ['에브이',      '1-1-046',['에스퍼'],          92, 95, 53, 49,101, 75, 86,[['환상빔','에스퍼','특수']]],
 ['리피아',      '1-1-047',['풀'],              94, 97, 88,103, 50, 54, 77,[['잎날가르기','풀','물리']]],
 ['님피아',      '1-1-048',['페어리'],          96,123, 55, 55, 90,106, 51,[['매지컬샤인','페어리','특수']]],
 ['포푸니라',    '1-1-050',['악','얼음'],       90, 98, 93, 53, 37, 67, 97,[['깜짝베기','악','물리']]],
 ['야도란',      '1-1-054',['물','에스퍼'],     84,114, 59, 84, 77, 62, 24,[['물의파동','물','특수']]],
 ['만마드',      '1-1-056',['땅'],              90,124,100, 81, 46, 69, 31,[['분함의발구르기','땅','물리']]],
 ['가로막구리',  '1-1-059',['노말','악'],       90,115, 71, 79, 49, 64, 75,[['승부굳히기','악','물리']]],
 ['투구뿌논',    '1-1-062',['벌레','전기'],     88,103, 56, 71,113, 60, 35,[['벌레의야단법석','벌레','특수']]],
 ['두트리오',    '1-1-064',['노말','비행'],     82, 89, 84, 55, 48, 48, 84,[['쪼아대기','비행','물리']]],
 ['백솜모카',    '1-1-066',['풀'],              80, 89, 41, 69, 62, 92, 48,[['그래스믹서','풀','특수']]],
 ['폭거북스',    '1-1-067',['드래곤','불꽃'],   84, 89, 61,102, 70, 66, 30,[['불태우기','불꽃','특수']]],
 ['모스노우',    '1-1-070',['벌레','얼음'],     86,101, 54, 50,100, 73, 54,[['오로라빔','얼음','특수']]]
];
/* 1탄 ★2 — 서브로 나오는 저성급. 2026-08-12 카드 뒷면 화면에서 입력.
   처음엔 스크롤 화면에서 앞뒷면이 어긋난 3건을 뺐다가, 재촬영본으로 채웠다 (전 14장 완비).
   ★4 는 2026-08-12 카드 뒷면 화면으로 재검증했다 — 17장 중 15장 완전 일치,
   **가로막구리 공격 77→71 · 에이스번 공격 83→88 정정** (카드 뒷면을 정본으로). */
/* ══ 1탄 ★3 · ★2 (상대 서브용) ──── */
const LOW3=[
 ['나로테',        '1-1-027',['풀'],           84,103, 72, 57, 55, 57, 74,[['매지컬리프','풀','특수']]],
 ['악뜨거',        '1-1-029',['불꽃'],         84,120, 51, 70, 80, 53, 46,[['불태우기','불꽃','특수']]],
 ['아꾸왁',        '1-1-031',['물'],           84,110, 76, 59, 59, 55, 59,[['물의파동','물','특수']]],
 ['채키몽',        '1-1-033',['풀'],           64, 82, 56, 47, 38, 41, 53,[['잎날가르기','풀','물리']]],
 ['누겔레온',      '1-1-039',['물'],           64, 79, 41, 38, 62, 38, 59,[['물의파동','물','특수']]],
 ['래비풋',        '1-1-036',['불꽃'],         64, 79, 56, 41, 38, 41, 61,[['니트로차지','불꽃','물리']]],
 ['피카츄',        '1-1-042',['전기'],         60, 71, 44, 33, 41, 41, 70,[['스파크','전기','물리']]],
 ['이브이',        '1-1-044',['노말'],         60, 85, 44, 41, 37, 51, 44,[['스피드스타','노말','특수']]],
 ['포푸니',        '1-1-049',['악','얼음'],    66, 75, 63, 39, 26, 51, 76,[['보복','악','물리']]],
 ['골루그',        '1-1-052',['땅','고스트'],  72, 96, 81, 54, 39, 54, 39,[['섀도펀치','고스트','물리']]],
 ['머드나기',      '1-1-055',['땅'],           62, 86, 69, 49, 33, 40, 33,[['땅고르기','땅','물리']]],
 ['가라르 직구리', '1-1-058',['악','노말'],    64, 89, 48, 42, 36, 42, 67,[['바크아웃','악','특수']]],
 ['전지충이',      '1-1-061',['벌레','전기'],  62, 76, 55, 63, 39, 51, 26,[['시저크로스','벌레','물리']]],
 ['욱우지',        '1-1-068',['비행','물'],    70, 82, 56, 38, 56, 62, 56,[['열탕','물','특수']]]
];
const LOW2=[
 ['나오하',          '1-1-026',['풀'],           48, 60, 39, 35, 30, 30, 41,[['나뭇잎','풀','물리']]],
 ['뜨아거',          '1-1-028',['불꽃'],         48, 75, 30, 38, 40, 27, 25,[['불꽃세례','불꽃','특수']]],
 ['홍나숭',          '1-1-032',['풀'],           42, 58, 36, 29, 24, 24, 36,[['가지찌르기','풀','물리']]],
 ['울머기',          '1-1-038',['물'],           42, 58, 24, 24, 39, 24, 39,[['물대포','물','특수']]],
 ['데덴네',          '1-1-041',['전기','페어리'],52, 66, 32, 32, 44, 38, 55,[['전기쇼크','전기','특수']]],
 ['골비람',          '1-1-051',['땅','고스트'],  42, 64, 42, 30, 22, 30, 22,[['놀래키기','고스트','물리']]],
 ['야돈',            '1-1-053',['물','에스퍼'],  42, 77, 37, 37, 24, 24,  9,[['물대포','물','특수']]],
 ['가라르 지그재구리','1-1-057',['악','노말'],    36, 54, 20, 25, 20, 25, 35,[['보복','악','물리']]],
 ['턱지충이',        '1-1-060',['벌레'],         42, 58, 36, 27, 32, 27, 28,[['벌레먹기','벌레','물리']]],
 ['두두',            '1-1-063',['노말','비행'],  40, 50, 46, 26, 21, 21, 41,[['쪼기','비행','물리']]],
 ['꼬모카',          '1-1-065',['풀'],           44, 64, 28, 41, 28, 41,  7,[['나뭇잎','풀','물리']]],
 ['꾸왁스',          '1-1-030',['물'],           48, 68, 41, 30, 33, 30, 33,[['물대포','물','특수']]],
 ['염버니',          '1-1-035',['불꽃'],         42, 58, 40, 24, 24, 24, 38,[['불꽃세례','불꽃','특수']]],
 ['누니머기',        '1-1-069',['얼음','벌레'],  30, 50, 17, 22, 29, 20, 14,[['눈싸라기','얼음','특수']]]
];
/* 2탄 ★4 — 17장 전 종. 2026-08-13 카드 뒷면 화면에서 입력.
   **도감 번호가 전부 일치했다** — 26·27·28·34·37·40·41·42·43·44·46·49·51·56·62·64·69 로
   `DEXORD['2']` 의 추론 자리와 어긋남이 없다. 추론이던 26·37·43·69 네 자리가 실측으로 확정됐다.
   기술 물리/특수는 1탄과 같은 규칙(본가 분류)을 따른다. 위력은 미상(기본 100). */
/* ══ 2탄 ★4 · ★3 · ★2 (상대 서브용) ──── */
const LOW4_2=[
 ['마스카나',    '1-2-026',['풀','악'],        92,103, 86, 56, 64, 56, 96,[['깜짝베기','악','물리']]],
 ['라우드본',    '1-2-027',['불꽃','고스트'],  92,123, 60, 79, 86, 60, 53,[['병상첨병','고스트','특수']]],
 ['웨이니발',    '1-2-028',['물','격투'],      92,109, 93, 64, 67, 60, 67,[['로킥','격투','물리']]],
 ['토대부기',    '1-2-034',['풀','땅'],        92,117, 85, 82, 60, 67, 46,[['분함의발구르기','땅','물리']]],
 ['초염몽',      '1-2-037',['불꽃','격투'],    92,103, 81, 57, 81, 57, 84,[['깨트리기','격투','물리']]],
 ['엠페르트',    '1-2-040',['물','강철'],      92,109, 68, 70, 87, 79, 49,[['강철날개','강철','물리']]],
 ['샤미드',      '1-2-041',['물'],             90,139, 51, 48, 84, 73, 51,[['탁류','물','특수']]],
 ['부스터',      '1-2-042',['불꽃'],           90, 92, 99, 48, 73, 84, 51,[['분연','불꽃','특수']]],
 ['블래키',      '1-2-043',['악'],             92,117, 53, 86, 49,101, 53,[['물기','악','물리']]],
 ['글레이시아',  '1-2-044',['얼음'],           94, 97, 50, 88,103, 77, 54,[['프리즈드라이','얼음','특수']]],
 ['펄스멍',      '1-2-046',['전기'],           84, 95, 69, 48, 69, 48, 93,[['스파크','전기','물리']]],
 ['피죤투',      '1-2-049',['노말','비행'],    82,105, 62, 59, 55, 55, 77,[['에어슬래시','비행','특수']]],
 ['알로라 고지', '1-2-051',['얼음','강철'],    78,100, 77, 92, 20, 51, 51,[['고드름떨구기','얼음','물리']]],
 ['플라이곤',    '1-2-056',['땅','드래곤'],    96,111, 83, 67, 67, 67, 83,[['드래곤클로','드래곤','물리']]],
 ['후딘',        '1-2-062',['에스퍼'],         88, 87, 41, 37,106, 75, 93,[['사이코키네시스','에스퍼','특수']]],
 ['둥실라이드',  '1-2-064',['고스트','비행'],  88,158, 64, 37, 71, 44, 64,[['병상첨병','고스트','특수']]],
 ['가디안',      '1-2-069',['에스퍼','페어리'],96,102, 55, 55,102, 94, 67,[['사이코쇼크','에스퍼','특수']]]
];
/* 2탄 ★3 — 14장 전 종. 2026-08-13 카드 뒷면 화면에서 입력.
   도감 번호 33·36·39·48·53·55·58·59·61·63·65·66·68·70 전부 일치.
   추론이던 35·47·52·63·66·67 중 **63(흔들풍손)·66(토게데마루)** 이 실측으로 확정됐다.
   ※ 수풀부기는 에너지 검산 편차 1.20 (표기 64 vs 314÷5=62.8) — 공격 60 은 잭이 확정했다.
      저성급은 원래 편차가 크다 (꼬모카 2.20 · 데덴네 1.40). 이탈이 아니다. */
const LOW3_2=[
 ['수풀부기',    '1-2-033',['풀'],             64, 87, 60, 57, 39, 45, 26,[['메가드레인','풀','특수']]],
 ['파이숭이',    '1-2-036',['불꽃','격투'],    64, 80, 53, 37, 53, 37, 55,[['마하펀치','격투','물리']]],
 ['팽태자',      '1-2-039',['물'],             64, 80, 45, 47, 55, 52, 36,[['거품광선','물','특수']]],
 ['피죤',        '1-2-048',['노말','비행'],    54, 77, 41, 38, 35, 35, 47,[['날개치기','비행','물리']]],
 ['동탁군',      '1-2-053',['강철','에스퍼'],  74, 82, 60, 76, 53, 76, 24,[['아이언헤드','강철','물리']]],
 ['비브라바',    '1-2-055',['땅','드래곤'],    58, 76, 51, 38, 38, 38, 51,[['드래곤테일','드래곤','물리']]],
 ['패리퍼',      '1-2-058',['물','비행'],      70, 80, 37, 69, 65, 49, 46,[['에어슬래시','비행','특수']]],
 ['루주라',      '1-2-059',['얼음','에스퍼'],  68, 79, 35, 24, 74, 62, 62,[['눈사태','얼음','물리']]],
 ['윤겔라',      '1-2-061',['에스퍼'],         62, 65, 26, 22, 79, 48, 70,[['환상빔','에스퍼','특수']]],
 ['흔들풍손',    '1-2-063',['고스트','비행'],  56, 96, 36, 25, 42, 32, 48,[['놀래키기','고스트','물리']]],
 ['시마사리',    '1-2-065',['독','물'],        54, 76, 39, 45, 33, 39, 34,[['베놈쇼크','독','특수']]],
 ['토게데마루',  '1-2-066',['전기','강철'],    68, 83, 67, 45, 30, 51, 66,[['스파크','전기','물리']]],
 ['킬리아',      '1-2-068',['에스퍼','페어리'],50, 68, 27, 27, 47, 41, 38,[['드레인키스','페어리','특수']]],
 ['롱스톤',      '1-2-070',['바위','땅'],      64, 66, 34,110, 22, 34, 51,[['땅고르기','땅','물리']]]
];
/* 2탄 ★2 — 14장 전 종. 2026-08-13 카드 뒷면 화면에서 입력. 이걸로 **저성급 데이터 완결**.
   도감 번호 29·30·31·32·35·38·45·47·50·52·54·57·60·67 전부 일치 —
   추론이던 마지막 네 자리 35·47·52·67 이 실측으로 확정됐다 (2탄 도감 70종 전부 실측).
   덤: **도감 «케이시» → 카드 표기 «캐이시»** 로 정정 (공식 한국명도 캐이시).
   ※ 갈모매는 에너지 검산 편차 1.20 — 수풀부기에 이은 두 번째 사례라 상한 1.20 이 굳는다. */
const LOW2_2=[
 ['카르본',          '1-2-029',['불꽃'],           40, 60, 33, 27, 33, 27, 24,[['불꽃세례','불꽃','특수']]],
 ['드니차',          '1-2-030',['드래곤','얼음'],  48, 74, 47, 30, 24, 30, 35,[['몸통박치기','노말','물리']]],
 ['빠모',            '1-2-031',['전기'],           40, 63, 33, 16, 27, 19, 38,[['할퀴기','노말','물리']]],
 ['모부기',          '1-2-032',['풀'],             44, 62, 39, 37, 27, 32, 20,[['흡수','풀','특수']]],
 ['불꽃숭이',        '1-2-035',['불꽃'],           42, 57, 34, 27, 34, 27, 35,[['불꽃세례','불꽃','특수']]],
 ['팽도리',          '1-2-038',['물'],             44, 61, 30, 31, 35, 33, 25,[['거품','물','특수']]],
 ['멍파치',          '1-2-045',['전기'],           38, 62, 26, 29, 24, 29, 16,[['볼부비부비','전기','물리']]],
 ['구구',            '1-2-047',['노말','비행'],    36, 53, 26, 24, 21, 21, 31,[['바람일으키기','비행','특수']]],
 ['알로라 모래두지', '1-2-050',['얼음','강철'],    40, 58, 41, 50,  6, 21, 24,[['고드름침','얼음','물리']]],
 ['동미러',          '1-2-052',['강철','에스퍼'],  42, 63, 17, 48, 17, 48, 16,[['염동력','에스퍼','특수']]],
 ['톱치',            '1-2-054',['땅'],             40, 57, 55, 27, 27, 27,  6,[['모래지옥','땅','물리']]],
 ['갈모매',          '1-2-057',['물','비행'],      38, 55, 19, 19, 34, 19, 50,[['바람일으키기','비행','특수']]],
 ['캐이시',          '1-2-060',['에스퍼'],         42, 47, 13,  9, 57, 32, 50,[['잠재파워','에스퍼','특수']]],
 ['랄토스',          '1-2-067',['에스퍼','페어리'],32, 49, 17, 17, 29, 22, 25,[['차밍보이스','페어리','특수']]]
];
// 상대 서브 선택용 목록 — POOL 과 같은 모양이라 eff()·evalMove 등을 그대로 쓸 수 있다.
/* ══ SUBS 합치기 · POOL · BOSSES ──── */
const mkSub=(r,s='1')=>([n,code,t,e,hp,a,d,sa,sd,sp,mv])=>({
  s,r,n,code,t,cls:'스타',e,hp,a,d,sa,sd,sp,
  mv:mv.map(([mn,mt,mk])=>({n:mn,t:mt,k:mk,tagx:undefined})),g:null,
  id:s+'-'+r+'-'+n,measured:true});
const SUBS=[...LOW4.map(mkSub('4')), ...LOW3.map(mkSub('3')), ...LOW2.map(mkSub('2')),
            ...LOW4_2.map(c=>mkSub('4','2')(c)), ...LOW3_2.map(c=>mkSub('3','2')(c)),
            ...LOW2_2.map(c=>mkSub('2','2')(c))];

const POOL=[
 ...MEASURED.map(([s,r,n,code,t,cls,e,hp,a,d,sa,sd,sp,mv,g])=>({
   s,r,n,code,t,cls,e,hp,a,d,sa,sd,sp,
   mv:mv.map(([mn,mt,mk,tagx])=>({n:mn,t:mt,k:mk,tagx})),g,
   id:s+'-'+r+'-'+n,measured:true})),
 ...COMMON.map(([r,n,code,t,cls,e,hp,a,d,sa,sd,sp,mv,g])=>({
   s:'공통',r,n,code,t,cls,e,hp,a,d,sa,sd,sp,
   mv:mv.map(([mn,mt,mk,tagx])=>({n:mn,t:mt,k:mk,tagx})),g,
   id:'공통-'+r+'-'+n,measured:true}))
];
/* 보스 후보. **레귤러태그도 보스로 나온다** (2026-08-14 잭 실측 · v3.7.0) —
   피카츄·루카리오·잠만보 3장이며 셋 다 다이맥스 기믹을 가졌다.
   레귤러는 «공통» 이라 탄이 없다 — 보스 화면에서 탄 거르개를 태우면 하나도 안 뜬다.
   스페셜(S)은 아직 보스로 본 적이 없어 넣지 않았다. */
const BOSSES=POOL.filter(p=>p.r==='6'||p.r==='5'||p.r==='R');

/* ══ 기믹 · 타입 아이콘 (아직 base64) ──── */
const GIMICON={
"메가진화":"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",
"Z기술":"UklGRhAEAABXRUJQVlA4WAoAAAAQAAAALwAALwAAQUxQSFwBAAABgFtbe9vmY9YGzlWqlQfiYaUd8gIqtURaQqVj6Rk0AAUC5OdIQL9jGREM3DZS1OweM7TzBtQSA1f95oaaH9DcNPtXQAxH/Agn6Y5WdukJIh+OLG5ZGVPV6ONV3C7gghdj9kSqilYqRT7NEHu23sCQLAydMAU5RMPSQoxpSjpTGo4R1irAhJoHoTlBUL8H8+owVTlrdvACDB3O5nSyIYIPzY8mNBTAcPL5/bOkCCXxThQvlZTUMo6QYM6CQhScIwlvttpIyejtTYgB9xRjzwH8zCg5KZP5Pa0piNa9C8qKFxuWkiq5oThavv93KL/5jhWfhb9DzUvx77wn/h815f9TeR+Q9xl5HxP3SXEflvd5+RwRzynpHLTk7IQ8YLIiJwjtOZ7T9YMxmrk9x+H5SJakcviGlSKXCXzPtQ6h0fV1iDbk7QKuRDhKM1rJ0iNEzi0G0G3V11GtLmx1FABWUDggjgIAAJANAJ0BKjAAMAA+MRaGQqIhDHcygBABglqAJ0zXvoPw/JS+++nDm/kDeW+YDzuvQf5zPUAbw8v4prqA7+cf5zoIc3KoH5QAu0IdxUkU+91bdE2+hA04VgDdPBNBFk3PKeVcwalCbF1hPUzpslFn3JrAk8t1AAD+/Z5znOFrVgYCvKzzSu+jDwhHlN30GXx6nQPKjrTBn18xy7CJ/wDP+2PLMzvWPswledXQ+mEsJ03Y8OMI9tozr8GfJSrz8MBjSaeB1VK8P2K/4vwmL4fxn9TY5F6FP9HR7ddRweAOscIhzQy3zvGcuxBAgYi5ah/o/6Ag/fIfoNP/O3Dfz79f+OQPTWMGlQMLfKUrtuD42pI18WETWjX2RYJVqLNA1bCjvoOUbmiyIW/hU2ElnVmeFUbhObnRvDghkiwjuDx9bzfDIl3t99zBmBXRk/sU2+r0JxDprBYBOo016tMcBk08FS2XbNLYb/quuxwGbYu3z/PmpDKtQj5jyblhBNiJQvsZAnHof4kIkXdDVtGQrdy7biChtPukHDfWrHKGLfZnvFstmLufphhwzW3crf0Zhf5CFFnHVbUcLbfrFxfThvLL/OX/xhEzbz1c95qCk/bLqUkSkzLFzJAbFcmSJ8iCsPDIK0R4l7H8WJRY0q9WtKSA/P/VfCQiYiz567RvBUZ63f5j7VgslOxt9srIQojeKEw4YO+iSSUezeHvpjFfGICNUJHzE9cqMnXd+nyjv44C6HWf5KvYWNrYdFm6K53hi0okTOUY65bpZyUw9M7NgHOvdyMFfntkBJXdU49J174AX7+o82gP7GY4MMmkEiEiD5+3avYgHsFKJsxfsmiObz6a/f0miXC1s7V3fs7ZdQQAAA==",
"다이맥스":"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"
};
const TYPEICON={
"노말":"UklGRtQCAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDAAAAABUNw2kpL+m148xmdETABfXObcl4gAsiHSSVhA3oRU7onNyX64LZZgBmrHUT+Knw5WUDggfgIAADANAJ0BKiwALAA+PRaKQ6IhIRVdVqggA8SzgGXzvY/rXQWeWD2v8b+PGf83rK4DSMP87xg0xv+xefRnU+jvYF/U06bVwImpc2GMUF+Pl4rzNn6ud9S/IKb8iIXZscfpfc2HUdm6MGynM+kHT8vxg9VlgAD+//4YXhuydnRKG9w58H1kLkf+v7HXMuosDmQ2ruWj/2+KWZkxTV9CMmHWBZ8fHY8ojXN1Xh6mqu6mfGTxItgDz4C3LomtjesRh1sAB8Qj+aOL2nU2bnSYGjLtQD1A7cSWt6XLJ/4Wz9FaVDsqO/S9r62yV+CaBx+Q86DYjA+kNg2l8cDHcCH23oj3A+fzzY+pNo+KmZn/fhIN/JP+0Q85J9IH8C8ZZyqNoW41oVg/ETKcdkHgsPfn1gETaS/PPHjz5lgaL/+1a5nJv+ul+25SoquD6gm+S1V/ayyizgz02cOs6pYmqk0anmXvcnHIC+4JL/KVswEI5rzYfDsw3EyU6oE7su4FfwDBJiuSbmnBJG81wbOKIaxtU+ZIbni3RkzbZRZ3xGoewcxCAG0S1dn9MefEt0I/UqcACxB3k1//vLTZmsUoeyt3G145YRifTb9WmB8esjTfQ1Gt33JchpHWTrRW/Rv2JC5lDT9wH9duOZFg8zpKlFdG8pOGfW1V4n+z+TzNmzMzmf/I96j5WCthnP13/TIJLSb4bolcPtytzvomOOmbzB/Ez//iz91ybZ6yqM7iUYT8zkmbXvm7wgUhYy/MW+62SRK4vUkwsJDrj18w0LKpqVfw+vL/pdZ8+qPjbB9vcaemgkTLkVQfd4qO8e1goknrrw46fMwfDHaGR+z/N8QDEAIUAAAA",
"불꽃":"UklGRswEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEYBAAABkLJtm2or7zez5fjBnegkd40O2d3d4TdQqQ7pJLRZdXfrHrfOzPeGo+tDckRMAP4fxQ/bc52RGSprx1u68tjKzBO3Du/k/epqNWbFCrcDEGknlZmndBVADmc00CSAfO4mLUSeBzzmhUiDgZs6zaGRQ52WGAlbAYeXTAYiHznAuXdGPgBweGFkF+Bk+rekFtIkoIB9rNEC50Ok5aEmA1Hv9feCAaQaCDyHvGBQyYKyOkZEkC/bqLRAPNaERAulAZACOhhMcAAkV+zQaCDwbD4HzGKkwbpuRR6YbIQnOi0zofp1tAjw3ETiFzjAPTFyRRyAByYiJ8MDc78ltaALO51koAUu7rROLUS905YT4D6TgcCLyAOgyZCuSSc1kTgTDkA1GajxtngAOM1KZnWm+ch1GniHKStemQhBl63Ha9QMlL/3Ah7/6VZQOCBgAwAA0BEAnQEqLAAsAD49GopDoiGhFVVUIAPEtgBOnKCtDyB+1/hLxHvc/9juDRIF13zgPuA31PmA/YD9ZuxzvIvoV9LN9s1mAeEx1K7Z6wNMH/nv/L+0D5J8/T0p7A/6jf8TgIv12E5vo2/6f+g97t1/yP0isdlsE0rkyeGtlkTyLWYng+ft7tIOoscSWAqh/AJsFF7vMX99AAD++FX2R9eN7NhnC6vTCbrjbEDibSnnu+cbiTtrkqK6Atq2a1i8PRXz5/GwfVzHVs/C0uu9e/VG3xfFZXVwDE2/H5v4ftsj3kfHRt0aa4PuEufmVIAGJ0+2Ihv1HjmD8z0aonPVXLewd5qXG4jz43mKOQERxuvNRhqoUqfHp3o2/f+YIpmv+mwtXElu34ZgswFkKMU1GoTaowWxttiuv/ZIcfhEOXmIZuDGHR9VAB8OfJcby50KT5tt2fusC6L6109SPk2401/kwvL9gSZOMS7pmGxBno0otcYKB3aBAPd2X3Iqtb5dz/TNEVzF5LZlDOZwiOV1RbPsM/eH6pOH8L86xLGKenx2JyOFHOcTfzb8Uv2jpHHGOuFK0W7DkNNuQ2Z8LLl/BJYVC6YBuwYb9qxY95bKyrA7SSyDull23ztLNBkcJ+iK6f9qxnNmSs1zZUX6cqdYH3svPwDHfzYEUvidjlqAWOM4+I+9JgJ+p4+rmtDA357b0Nad/OSMSyft/6QxfwrBe8ACllRMnNUWkKKWSlO3CKoW9thbLRN6vWuN7ZYL+E29T2hH0Ng6kUnJzaHSx15bTUdw61vZZ2RFkUElrYEEu9aDrzL0V8tOCE4ykhu2WnT/ihAKySaYRcrZZRI5s56ZI1cOMHqMqqTsA9NeNhpHzA6ZY3fCYYhpFqXIKkCwL4Wff1/9tt+IzQktf8IRoJ4Xfb0W8yGX/+phH7lm8/HOw+CA/3aZ8NyxEVz/0EnGR/4jBKGxDC4Uvg/hrEuKTacy/hXgt2vkrDZTWrijlIy0OJm7zrR8+xvZPj1B/1vUOvpOc2ZXNgw7W/fKmG9NzDhIrjM4osvQUldFlGuBteevv/v9i/aN55c+RZvN914culV69SafSF+1Cyw4N1T3jVvMvo6+OEJCRlB1HCOZz554OpgRBMseDxXdYfArBYMptJy/UAAA",
"물":"UklGRhwFAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEMBAAABkCLbtmo765zzmb9nUswMjgMqDWBmbkAkM+qouHSAmdyrb4OKObnv7L1E8O6AjogJwH9krh9YO0/h71d+3Fz4vRxUvGX6mclvPEYuMNG0vvIWAO/GP1CYvhBAHk7yIy1GwPmqhyImBPBoodDmN5NiInIfEHCf0UKWS7+5aUTXfnPLCLcBIdw2IfKoEzlYlCQ0GHkJzuXfp9jIeIeSr1QTugcOua+NsBkeVe/VgsZ3bS7XnWNCgwlPIjcXh6wcR65reCRq4zxy0ctIgyofphDQIiao7ILHBE1EOTIaPG7ZSLgEOfC3jehSnwNcNcI1yEHXIxEDGp/3Oo/NzNJg5CUEYLsayfgARJqM3IsA0KawHt6OdhmK7LST8GJBDoCoBiR5MYAAgMympVnhCuQAwGYafDNbGdw3WLzpIzUF4fzaQfxXAgBWUDggsgMAAPASAJ0BKiwALAA+PRiJQ6IhoRccBZggA8S0AE6coL8A4zK1fVfxA9gSnf1zX/y0V+vUBti/MB+un7Ae9N6N/Nm6jLn4PZjrrz8B0VXoI/d/Qbjjkpqx3u75jvE7Fys8f0v7Bf6p76B+yoaGUoTC4LPsNSzhdrZvLA/4L8LSKTeFj7Im/y3EicYgGHuR5yeU9/k1DvXpIfpqkDVAOIw9ZoAA/vpgaRXRCjjIAOX4vvP9WLqorbIv/yYnRrpGoA9JVtTSuJryAPGzmddT45L8QvOu+F4wct/eIQ39fQjBuGjrwXbUuDHqdiQ0f7PLJb+KODjk3HBcV3kDHL/eI7rPlLDUSrHtRSK9H1nodbyXZD1HgiqWjMXd+6xb/8VeP/wM31V/9l3u2FAPHC/NnHZ9jBQjECzGwkTc8UibvdkGfSjal+h1Q4njXaBXeI6KMLQYot2gl1Ux8+5fOt/jtAnM/fZgNcDP0j3/A8nYVcRmmXl/iiNV+wf/k0qaWpqD5rqHXSgCE7HP7SYsgtxSqwW0/CLe3O7SR2uMS8nfqPHYN1gDnzlUzQvYUQmHS//3gdZOs+h05dUrtgYglCApsZ46KGvzf+++Y98Nhg3/KHx2Y0GhU+f13/ERU6vYNmE/jfQnoDA5tuuYV4e5T6sdr03Py5Kurm9QPN0XtKhz27YgxQ8ariz74LrvJIOOaECSrQoMyla8H5t60GURJn0gBVccwMY7yJKHjUO2EolW96mB3lcoK0yDC79dka+Np/NCWjXWEJ9cxamRtWY27FcWoOaJtp82qpbZZHJiYpKcY85Bn5eE8U5jLsvMoyKLvhIP/HXyBr+AzIxg++t/G0glQ58J4p0Xj8W778G/8vCoF8So+GRX74irjx04C0Ywtx8rrTF5Purdzhwo6K8zP9//90zefegQdgDk8xBp+UU/KjBs8yMUmEFeL9M/s0yX/0k/Z77lM6//sQ39PKuLAbBF2AluP0HrjOWzS1W9QMP7LFlQL6rtlwJvnp5PuRZkK7xnmZl9Vt1c/g52PjMWNIReRYQzm6MgZ8tXkaRa0e3CdzAFG5ZHy3/kE7eyYfqvGHVr6FGiUegur11GZOj5Ltgyr8EHhisCTRkgOBGAB6iOE8vbY5xdHE3b5mN5JEjbGSPf+9PuATRqpc7i+UCvAD8P80MqaCEhGPBHl7/GajPloj7TpG4okjZfFOk8Q9tpEwX3BUkJ2gWyimXdZ9n01ccXtFGAoLV4/4/XOUdyFQNBRjD5pmAPAAA=",
"전기":"UklGRoIEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDwBAAABkGttu2k771xzHsWo7aS0ndTsbNuXkdL2DTgpbVenS29nrTnnV4TrD+qImAD+K0ceTlG1Rm34jgtdzr5VVr055a3fBFYrRRkEvJv2ukyqP0egkT36KpPgim7PUzKRoGCIkmx+MziZyGr9ZoxMVHkR+OKGogltAc91Ezm+nYF3k17GbCDqGgRWq5SJGwWBudnIMwhuk4wsxtHurbKJ1A8Hb4xoBIGNVSWDMZ/r4BvcCZUWvuoAjQ3sthGrTS643i9SNpD1BhzDFGXibTscg7OJUptcgOmykecScPeMaDUBrpvI8eUk5+n0KFuIuoaHjapk4mbhYZGVx3hoVbaQNIcCZDPlft8kG1FDvpHJUhfbBOBLMlDp8zg8sEufa0pVpQ+T8ABdLyrVI+n+eALfbbP5o/Lvi7q6dgUU/KcDVlA4ICADAABQDwCdASosACwAPj0aikMiIaEXHAWYIAPEtQBTpqCrfyo+7fhLzPXkfRYz23Hu0feZa7o8GHtucWqwK545DOM30Lc/Tz7/yPcK/kH9K/1/ARfrGGpxfBSB0tIoWQp1ulTunV0TbmCCAS4fSrmM1d0nLljHcWdjsENi+fuitYasJq7fQAD+7oh+Cd96ixax5jicVJj8RIUNWIEe1NVFycYXBkSEvClZHgKW81NitTdrHcib1R26vq+2mRc/jqn7ScZTo+QUJPlgMaaishjFvyZ/BxfN/hKuVg396qy5HcDTzDzhlTKh3ZPfRpAEqqkUyQqVT5ZmQXH7lOi2QRPz3Tu86YWaGOcxHMjDutpKP72hgcDRZ9t14JEz2+uib7Cm2NHuUkkHeZpYhunZ/tC8rlHsTtR+6gyuIUmN+/mIUg9w3w0sGRdiTyhXfDr8f/0KuKfjrbnXwvScCLSu+UunhhN+4atk+ybrRg3rK5aRIaxoXn0x4Lp//mJHDJPo8gpSGe5Pw3GpmNKh/+oiZWapuj64wAY8M2q3Jv2YTT+f4beT35/5rxrL/rxQEN4ZrGorZOQrN9ZAda8vd/kM3Zw/Y0AmpQwj6YfU/pwP81Eq3uwGQZTBBr9jrtI+mrbyLTJ9g0dwyn/wCA2P4Gj0HWzBM1lBSAODn6XAb/oVfvm/r0ZL7SGCPz7FPiY607tNsF6BymE4r7ZBJne+pTVmNoZ30OBHst/7t0cNGm8SW9nE0LVgdCgankkF/4mP/dSP3lD/rstNuyacInak7j4sI6DUUmGINzMzoTYCWitPVv1Gd/Wu1Bgc2zSVS6kZFj+f/8XO8iJIt4gGU8Y9VYXZWMN7Q43R9HKxWuTPNrr3O3u/8v1pZWMEeXTpwYp5kpZcpHlTO//cpJwFTjvOihxs+D/lKDKprDJ5yd/lfxCzxQjFr6dHv7yp0vY/89t/pzvZJc+FcQMkSfnE5fgDggdDKR0g6C63O69YLC0LmGJ5aGuK2Nel7Nt+urUMNAb7Qq6CYjnJSv7q6qPDkB38eo3H7/lSeR/1hM/3vdkbAuDfE3UPMAAAAA==",
"풀":"UklGRpAEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDoBAAABkGvb1rE963nxq/rr2LZtlE6t1inT/ncQ27yHdLaddP8VxHjf5zm7CN8T1BExAfxXTj2WopqMdnlF+CYUbRfeytSsSUu/ybgoRTUd7Q6Qh8WqTM2bgBb221d5jBCy3k9TcmGQMUFJPr8ZkVxEdX0zQy5qbYCcq4o+Nn9zw0W0e52Qt9/1ocdQsMEquegKFKyRk4GE0H5ZycdEAlkl8zGejAnvzUOtsy1FySlVclhpL2UZ9ns5RFmy04XZmx6EMKA7mQelVgKTFeUw6lxLFhhsLipbSQHH5UMbKcgeuUipe3SWwSUXUZfJYdnbaC6uZzlsVy0Xj8lhrTnZ9c1rmYekAWQgn6ke901yUelkXgLRR9xBASg5qPUmCwG4ra9NWa33C/IMYOkLNX93Nhnf7dj2UdZA0usNkPGfDlZQOCAwAwAA8A8AnQEqLAAsAD49GIpEIiGLjQLMEAHiWoAnTPaiuejfjBw4UHNz42r6j9snzvOmo70dMptoH7nwsy0nLtEDuOeLDmN/270If9XzQ/TPsBfqR/teBg/U0hc1s9P96QLyxuFkv/L3evMtQYtBhAihQprmOAB8etV7I4zyxMY62E3f81Fep386uAD+93l5bx6SrcfDHpI+Zr5v+Tqr6v7R+DTJObeb7GA/iCMBcotBIUsN7+v3Cpu+OiGsNRohMwsEBUUFVmDi7SVrtWVu34Fah9lazgWagm/X/CL+vloR2I/egvBlXnPBGyLJT4vYIPziWI9Ls3MjbRbQSIqr+jReNHZPDuxhbprevk8KgwKJLfZ/4bt1da2sRRYh+zBZjGLwrLyorMrGfWzVC9mf5WalCkMYpEr2wYXJxS6mpQjNvl+9ddJmCufIwLx5PJwMTt009r/cWzMfn3aIG7sikN8GDXaVXDmYLif/JR0QKnSA2+9u7quU//0cIM5A6viWlfldNwbz5iwJVmPTYgRm12f5nZchnhPSDgVXJONFiverqG76aM3a1+k+d9TxCfJL7p8Hma2MwT9doEZe9DevdnJ48FiVKsoB5WNBbqKfpAG3PLz+rECNAle1lwVPNSZqOOT2c9xC4j+giA9/0TkttPByD6gDCEaX3nZPa8ukt/sXBrjbXGb4K6uo+HDXEzLLD3J0jcA1GWtxSFzH7PhAkvRPBWzt4PcRxAURxjm+grRaS1PuHks+PRP8H5uFLklmFUKypINBRslak+f6sIe98Q1pDdE4Uf/nv/+OBEDrU7QIUcfJVvnY1Wh7//lmYJOEe4DKth11q2ppmXwaz4Zvm9/0GBv0sWIWn9IQejrpAaPmJj0h2irVuJ6/jDvKrC/4VxY0h0bQcSyc/b3YvNMn0raeJSGD14jv14VuqTz2nsne7B26pLmHC//tB4Q2805jxWycfuK6g4rQsc/g0P0q7zam67qiJjfQE7ftz9kROfnimntmXX7omU99dpXt2nye8hHZ7hUI++o3ShJxmyaDeHWa4rQIC+sT805Wo0nJ5Dhl0BIwHPLY2f36X7vm6fnGMAAA",
"얼음":"UklGRkIFAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDcBAAABkLJtmyoo7zdzZH037rXVcHdtXGSv7g6NX0AkuTskkktzh+SNH+B+ZuZ7w0nnQ3JETAD+HwXl1q9UNhn19gKpSVZeorJhJefXHG7yFxuP+gSAx1wGGlQCToZ+RbXACDhMYKLJVBuuRgh4XGS0oHwHeHluI3AZ4HHbylaI632pyUDUFz3IsJ4VLfAukGGpGnki8H43g415EHQGqo2REMgHKxPhMPG7Wgg8W2S5nGFFgxX3Is+xx8oh5Fn3VQ0GVL/0QTCJkRb4uYBgXLLSDsE1mgi6RTK4pzZ+czUy4LaJlN6PdQ79bzUZiLwND+xgoIlHzgMb1MhdeGA5TSTOhAPeUW2MqtFmCmNqyUTFUz4HQJOh2oUMQFQDKf32EAA0GMlbhavt1KQNKT9faBFBfQtjMzEdm4b/dgBWUDgg5AMAABATAJ0BKiwALAA+PRyMRCIhoROcBSQgA8S0AFYcoKqfKj6fed2k4wG2t8wHnAabdvN9Zp8H/HF6I9ivQCZ9329qb++48P/LcYHca8VrGB/0PtA+Kn/L8vv0p/yfcF/mP88/3vA5/tGUZivQ0zBDG2pXoJALx2zojRGZmXo8AC5ewjK5naeExzVQLFjEQ9gyTfzT4R2IL2ToR0N8l0icXnEAAP7w3reWLf32lEtwGfjs7UKoHSSuseugeyLo4bwJTf/eTjLCrqs2QTZuY3xpFraii9Gj0ZNrfQeffIqqJI7nR0LDp0lgaZ1iY/QH+c0xx9yYIS/FF4W0F+JkmrR2KAZtIcUWdN84mtJn0Dc9Jz2TanrWujkp/zuv6h/B7D/HPzdoWw4/29xiSxkN61CD/b8NVlr+mrOHGhVuX0DVBUSatwfj7jX4aOrvuDcan/STDXwRpazZcKbzU3qE+Rr9hb+9V/9onUKY/TcvsvKSq90g//uzQpq44pUUEYBz4zUnKM538taAv59Py+k0+za0Z5glWczCousDR7/041PP+onZek8QVZ5hMG9q+Dskz9IyIySnEfN8iqlutL5A4s0XcnaMZ350Fqwn9SWWa/vQF/5/KdEDH7Wvev0viYerTfyQIcTp9cDM3KGGp3+4U1v1dnEIDIT5KwtOI4kWGKQ0/ntreh1H/TqroYPgTO5M/w05BhdIofiCQZe4E7IvfQ4aJ4Y0iOY59AtHAoyuPR5Vw46Ogi4hZFWJHDRWxxDrP/KDbGezxZLH3eYO79poGWtIG4R34+7cDihSs1H72oa7i98SOuZNcitK/nqT2KEYD7XQoOAycB3xfvcA0a6U3lXi5vyrggNYdCe0nEqLT/81I9Omu1o837jH7Zit5oHF+GvoWmlwjPu0vW59gX6GFAeeFMOxv9OI8rBtG50bvcP4lZHQkaboMRjN+RDEIRBdXf6p6QfyF+ERgn0yqhouf2T6kq3yZOsBugd7S0ejaD1wdQ3mt/j/5KOMUuI5ThiPTy89QpDhQwm3TQSdkQeXhKyjZxqQJxwYzTW6P3xjDe/Q9pJCJ8Iun0rnxSKuz42VIlo/KQ7Hf5g09KfOturw2iMVrqEHHUvvtxYR/V+QJaQk/49/5LNusq0NXE+A8j4Kf8Pv7MC9Tv/KRdYe+/cDSomoCI7//JpsfFD6kd5WFGSSbhkOGuHrugu8xTFLMqPpVb2CgMVsl7jAewJ9a/kdTOvIjcFQ6YpB1mjNllIYtiRPVA/YrroeMucAuccnWfjFu/yvjAHrwsQeBXGVg6T/87zR7xh4nQDyAk5Qhv/C7I7FnxGfwAAAAA==",
"격투":"UklGRjwEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDQBAAABkKNt2yE6z+hoCSe2bXUqnZqls4PswLaTJai0nSqda2Nmvu8tDucL6oiYAP4jW5n/zVwNun7sWNvSTc6RL+5q1vSc7vd/lalhrz6dArJksWSKCLRwuP6lgF5Bkg56bRZBDinTZYrZZbyFqH1Xl/kKUWkzZNxWHcDt44Iu90LUuglk7Y+D3E3J2eilQjyHnLUKcpokab8pC+GjSEhLeQjNImX6V4/g9nZ4UnBOpQKW2k1RcCjK+aQokmMxql9byQt2h3DVkKSdj80C1LrUmiZMUa2ApdaQw2ILsomc9JFi+DpyuBWi1uP2DJZ/rj3ELTLYqUohXnZZ50H2dXkjj2AaTgqKaT61iwXRtC51iMquduSAPICXWkQGPJQ1J90gBVjmlTfk+nylLU+6sFV1M27fFvDfDlZQOCDiAgAAcA4AnQEqLAAsAD45FohDIiEhGqquqCADhLQAVJOcgWfgN7jhLOLBmdtt4sHrDehjeUPQA6Y6fVsLZbWlxxh/8D1J9Caa5ugAaddtA7Y5Wp2raHEOtUDb3iKIkCzKcZS6qafKWc2GZTrbjJpojOUG1HBdWV7jIeVN4wZdAAD+/QJMiRMm/ldAHi9eqmpzZevxhAEYj8fpQT5V/egNGX6b7LPgzBivCYB4LDh1HWyV89papNcxYxRmZCmD14Ygyh+//4mOclM71VLJXk/oE/yvjIPZv9bfbqNz6S5d7N47spPp5rxdfuattjbfv5R0A/hHoOQCx7MOs4zvr40RnuFicdx8QKIRA+r01hsv88Bh2G5DoXABuMSl3AXG5u8MiV3Plg6PFsndUc+E1Ym2sBsx5cHsBZh/Qnus6wdVeWYlq95pee6OpfQZwmvg8Ou0EN/2i4ArNSa+Jfz/efM05P/r3GgR/sA+R7X/Yj/o5aZ3jMET8SzWMmzDezZUaRpKlCjsr93GME4ORD8InQ1soMin+lrKh5IUAbv/3L55fODOtSCHTC1Ginrb8saux/zYJeIhfzMztrlwLQfmYYrHhLl2n8ya2nsjDxXCz0q367rhbhC0/pDfMNDqWzps9DWTUL24dALEpSjq+IuQrFZ8AK37tYxQGlJX2igfLcU09OVadWSKQvyPWGATY7gR+SfkZTJWCgGO4xZrlK1gPqPr+JyZEb/M1HEYbdKmXbpCJfIxO/29DRhdfd9lv+m+nA9E69IwnRhxzv3vt5f4Xemm4N24fr2rXrEEonzwzc/qKSginuI1Wt/5sOoIN/y/MJxq4UIZ18EP3QTwb/0g5/WQY/+kS3iKEcHF4euG3up/4UcL+N++z+PHmNywQumQw5sn5Zx3ZcwyZtjzYi4t9DwaBDw7aQJG1Fjf4WrRny/68lwZVKfbnNNKN5kvkoYSsk6qH/xgc9v+5wH5nn+94s92C4OM0AAA",
"독":"UklGRowEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEQBAAABkFxb27E9535+I7Zt27ZKSAV2KkgNNmZpIW1kmgIy/PH6vQbvp+cOxhExAfxHWh8Plarnqc4S2lngrlJFTHUGa2XGbSWKmurMgLXoG7+laUVONIYBgT2aUOwyvzlgYDbjXppHq6ufM4HAfiWKngkMgu3L0ni51rRgiRIPSzHM5r0uSw9rhoYxNitV/EwGGOvyzEGl759/YKyXh+YtzLb4yCUw5rkodGXvoLHwV1HHy8vzgLFMueJnWk4fxtLaQapjfQGMBXKxjYZt9rGnwVyVil5nv7e2mFc5SLWTAGByccIa4YYqD0dpjKqWn5HURXGklTwkOt1itoei+LbSDMDDtPbSB/BeDhNdsxZykZ+nxaSHad1oJYdZ/mx2nzX2lXWsekI3GKClqjpOLT0b76dlWK+4hZ4vGKLD0R3Kepbrxegw//FWUDggIgMAAJAPAJ0BKiwALAA+PRqKQ6IhoRVarqggA8SzAE6ZtD/74C+PuEhvds1d0G871zX956PDy3JHIm/0M1G3XflScdPGj6H+hN6Y9gf9Td8lBoY3ToC/e0zy7EF6kn2tA6qzbx0IRSJswzhIuTq04Pgw9S+dti+l+AlKdqa/9zoN/9sVTj5w4AAA/v7i2/tj56BUnP88A2FG+Clg0N6Q6vXLMBw4aAFm3+86kPvu7fdnDQH61t8j1BBm5nNvEHXrxHrvRhLzCu+MCK0wLCZzNU4LutPrFdg4fhaFiZJ9zvgUvgzrDv3Hq4oIhXnl/t628z44Ov7HAcVIB3Oae/9PdnPHvquu2l3+JX42/ghxtMf+dI/Y6f5Mkih/AXI80Cm9gQkcf44SCVjImYFg8sBRnCjNxftdVWfj2t+USMJa/tMrQP+v97k9ZSUw1p0myIU1x0/cG/LPn7XQP5RtgxjsB1sCklaVn+hvwg+DvtvnYob78QLrZFJmG7e+EafMG79Ut4eA0YG8RmTjYJRXyxvw+sRyzaXXx6D/feVadZ1VopSkMuJKbLYU2eZroPIXm/p4ouQ7kpFPUlXPl1TfpfjOpqzuOaB3T15AmGMN9NdceNsviTP+4JEtDzUKBJtm8X4ilxb+6Vyiip/6I9+HKqvehzp++r0Bd/UI2THuZ6/2vzXoyM6/k5cxwTk8bS0LWdLc+YVit5Vo46kJPHx/Z3pf7tn03h7Kh0Wflpi81bKBU5Yro2N77zd+WFt4FJHm2W+1FFLcrf8X4M/X/8OXPej6zIGuG7eMcEsH7KSrdUMloT9AB+R3kdzzAeBC3v5vYnGUSTjgJuccVnxaGEpnJAz/3vybS46Hc8HhpHcZK3s+Avfj6WBH19dBoURc7eex4/T/r/9Ujsp8zmoML3BSQcwuF1lQB8XTShh1gdMFdQL4dfTMzD59y/VfsR8HLGWtMxzrfO0NYD+E7o1os6YBAzV2DwzCDnHQLFEAg8gDhYqglhtdte8UGnJzkQf43hNgtA09tGdKD8o6BfwqBsmXXK7HWUiTHwak+blMY9Ub/Ee/YvKU6FAAAAA=",
"땅":"UklGRsgEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEsBAAABkLNtm2k778ysY6N0x+6c2LZ/gG2jTZvWdjqjtu3aTionM/O9xeH6gjoiJgD/kQmGnY6BaUa5PqUti0mewnSFXNkqQb8YA9OOwlYu7yw905cAwCCPSgEkWO6DCgGQYU7Tq2Ar7FYRZANgbd2zKAo8lwAOgxmYvsS3fVv1FA2BtwA4M4Y6zlnA4j6jih6AMZXPRDTEFiADa/ibGtin1UzREOPDCoskYxO9As/tyDAoJ0XFQZNhkPVVyQFkWPT9JQqE32phMsxRempgIUwGtqkIPJHjjCs5J0HBb5mKDKA3AzVwfaseUYPEd83GAk3UEHkfFsARJU+tBcwTJQ9gAVxTETgKDpj8JYiK3q2W01OD79tqnmjwPJ1kALgoUYNsRAJgNX+nF8giYwAM/s5faf1mnOgcWg/7wdQPNKDtBAMXvqJ0nfDzQsC19f8NAFZQOCBWAwAAkBAAnQEqLAAsAD49HIpEIiGhFxoEACADxLIATpoCpK/XdmBxj5O4Se3N/ZXeAb0t6AHSxVmPo6fTP1y8AZcvy3zA+rvmU8QNHr6B+c/6X/6XuBfrJ/xx0HuuDNHQBoT/W1fTtKMAmcQNNBmRz/rls8C83G1L2x7neC2X9pd9IURTFoNf/dYCA+5U9RkAAP73d+IBte7m/PlGQmCJqTeIobvUo38wzrozZqr+P/A/BhBt7z727wu9eqvrrCuLwycozbBJ9ruNw0JPL1F5my+rF+KyZyxlSZldB1mRqcqlwTSldsb/H15Ow77n/iinz2WWa+fXf5Oa2Ls6X5LplfC9dDWHv7fAq5lHiCJUlaKKGi4Nrzecvfc+YVzjYOvB4roAA4uG/3vsgIikcgbUhBAxdf+fPLjqTv0Iwr6fYQ3FkvdxCSQTmP4xy+qT77NrEheu61aCJ2Efhp/ZcT3VXp2DlBipkTPR5Tnuovy+tO0WYDNB7kmdzKagsn91BLmuWPaLpatMyn/8b/H+Hgvnm/gs3eoSIeuiENdOXhN6edL/nMh73Micx0DCooMuh36cNxzOsXmKXgbxgNVPvfg5rOroRjmp8xaensAUqscH7AlRpXaMdEW+Ml/sZvekjMlixBlmSfEfPKRz00gH+CSSG6j4jygP/Pt8JeIxl/ro4ngimzFqw2A/Xr6vvTQDCeF1Br5yoz+O1BqYxjz0q58briiXxmnmnG3XTrNwl0s6brRgTX0dIo3k6BxbyFfV6lWvMTf1jZwJ5xzFhy0ucVVyJbB1CCZNXWYHssOYH5BuaEDg7McRmsJjPAQOdkDGzZoka89zPXKex4/4iPGxiVNvnbHEL5YJgta2C3fnimf8oG12/8lyf+FGotTAMZOBLz2s6SQ+dqf7t6MCngab0YKJ+URMtubPRFq9Zm9N5b93sBzPxRb+tHaLytKi3j1s/m332wrYBv2k3RkK1sgTn/v7IsBTq//k3HIC/iGlDILH9YwNTwbr5fmktJhzIHVDW4HicJ42GU6pNbKhUq717rL/VsuZ/ix3M9c/hvtwPcyv40jITTH3YPxTMNvpbfJO95D8GrauHah6G0/74LDQ6ZCF950lnr/AF6+XGKf/rsG38zMsA83VDZeMAAA=",
"비행":"UklGRqAEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEgBAAABkKttt2k7/xjrnBPbF5DOtl2ls22jS24h5S5z6hidW9u27WStMcdfhGsEdURMAP4jBehSSYklJj/W+Hui3Wtf0Vmq8XCjbwR4RhpLNp4HIFnDvZY7S0/8Bo0YMwGowsbCwlTLbhYh+A1qQziPASrdXiQPUPg0IEMPGiNwPZDJBo/g6ekgQHGHKYDxBCDa4KLHOKSoxjLmjOC9gGqsDMI+38wK4fa2k4jW30cLUHAzqgWtSI9T/SHIdlRXYYkZy3fPR0OrZTuLCPxUA6lGJUjREqLt7yWP4I+aQNCfxoA516Ia6OwR3N6OlQwYxwiJZ6EAzgY5rwroiSDXoQCOhDBORgaMfmkewXt+s4g5I3DYNxW3AJ6ed1AFPjNikTahGsC8VJRnZEsRAKv5OZXkOTlJMwBod5jlXxoPxXebLdtCK8H5cpkiw386VlA4IDIDAAAQEACdASosACwAPj0YiUMiIaEY6zYAIAPEtABWGcmg9J7czwznLzaGhP8gDIbt5vroLv6fM5mjfrZVd+t1AlU+OH/OfcB8kOfz6b/63uEfyj+k/7zgGv1VDTuJSikjLlRaxLPbz32xnZK0/Oh33Otim0f8QaJVeynnS+lAsTxlH+2XPyk2k+t8AAD+/KtId/dvWiT/yyT0DPkb50xel93vmjYRam/qV/6XPIP+jVU7ZvY2b+qHlxMpDlmx5PSqSwzpyRFvH+17OLsZA1sKsmMahCrNF1FXTlbfesLeSqa8eEuJt+Sm8m/dn/y9mzJxAKI12KEZOZJfeRGNqOc1lkRFG26PCKisZ6z5pPuvsoou+B7Zrx0TH00a8qsIWOmMb/mm57fATKNgbkb23lo4MnhiZ09nUXTnL0GZVON2qyPT6DhtADoJJqv+WPahWO5eS24Rf758al2aSbx/s4N/FgXfIGhrTIP0yIEGVW4maxDhfgMXcu0CKzv8bK+1eegVeU7sWioQIlwiJx7YTsQtIrI5/iUVXSuZysG3bslVpCzQm7XqR+OnUr/ZovKH4p5ViJ7vl0cgy+/zn4eT/HeP+CMDEkvqB785Qna3wdB1WTsrb8XqqGMd6gAeLFZgI0gA3xzvBdVorPQn38HRioEb+egisZh3fF/eWB05yWbM+DfiHRZ11WgACgEaxUy9PS3jifpQXSracIP2dtrG8ZwIPEZx9d7qn/sl+YJn9BTOhM5nw+0JP/Exfinabvcg/xr0Lpd35wpy95YP22TyvBUfluP/uUtxFQ86t4+CClDsPB79mUAP/nMc2H7qNjFoNxOGWb+jwMzN++NDL33+k2nrrsHqw586v76qG0MnVB2AfubBWzGW3RtX832O6RcMDdvw56xguD8XM7EQcsgTjBYHpovJbCdhwS4v/3ym7Nl0YfwE4WOtbsesa9+r/7Vymf+w559w8pwnAMO5/F1szMJj9sCUyr0sFwEsEjHzRHaHxQvvAe09/oRXbYSXntzUYj2FTxKde0RbbfsQiC0GsQXmjx2h8ZfGNLtvcpcJlDY7TY9TuOURXMVXrk6rNlcimP+usAAAAA==",
"에스퍼":"UklGRswEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEUBAAABkGttu2k735zzbFXHSFLbtm3btW3nBtKxSjonN5DWtm22WnPO/ysO1x/UETEB+I90KFpxkJEpRrk8sy6HWQ+YtpBbahVhKJmElCjCWi5/jgkVBgAZ7KenylrmdNARa+EIdRAwruqiBAXCK4DDSAYq9LKwVpeogxtr7aAGiZ8HAda+YVQQeB6AxXUlTyys6fU5ioq9QAabmFBDbFNrqejgICBj11BDlCs1zqDwnaLA8wAyFp296DhrMhkco2f6Islo2Iw5qoM/sjAZHFbiK2BsyzdRVHwsNgb9GagwkWXIAJ1FB9fXmkwNUV62sAbmtg7eggVwSclTY4HqhxIVBM6DA9bQU4P0rLVcdHBYrSXUIPFrB2uBOyIKfNyHDABSQSArjAEw7TclJUnIudah9rifUdIhH8yCRe0sxvsoKQi/r7Bw+E8HAFZQOCBgAwAA0A4AnQEqLAAsAD49HItEIiGhEcYAIAPEtABBJCyPVd7OiUuNoAPRzts0fc7Rz2vOX7y5j/vASz/Bv/sfS+zzPUvsD/yP+hf7vgKf1wKBjbO0OA/8YYQC+0eTrxnF8BqD4rwAyYk6BcS5mmeUCpdd1Q03/tUjBwGUh7cEtfBAwAD+/hZb85CsVdiVfVE8Y14HuzBCbAn67HXJfcdIEuo27CK7D+JJ6rPX8XHMfdeW+Ps76q0vZ408MxP+L/7tBYOlMPgOpFtPOZQcx/YLM0JRXO/aQqvkZVP7roDrwQGpzSK6OZ0085P/2VhFb0dfPFxScPRS7P1mHGLV6atS890xon46lGWTWg1mbc7H+dxEjHvIA9h8/H/2ufhvrlam70J/i3hFrOH3p/s2Aygnf12fWkeCt+S3N51ob+DiCOyskUynUTpcEhMxXx0jeegCu/3bC1341wBule/ggF2Hro/qv8g7tbekvOZG7bi/weWijJkqnPM58RB8W5Ncu2tt6Xz71enuf+JB6bv/6QXQkz5FpnmAGcaEcDYtlvQW5N1/xriLsaedv6alvHqEv5AP59War+QBKrGf2PflbhxXyegQTrs7thJI+TXYK2R4eb6rCpRPu+lpJUe4iq/cNC1mbEIwAUnkqfIw/sjiEnLKvgtVj6agEElXqPBgdSeqUf4/5K+zyC3smktdH2zqveaLx6qiuPizvcdnPdUWb6/CbSTFEPeF/i0tQ08+5ZhmVSlc2qIz+l7WdVY6hRm1yOheEHnAkpgcnb8Xm6wtPNuz2P8nZ5Pq0rqvbDbZk/w0SNLFXlebYyi8BK8z/nMe/94bQW/XQceXMrG9vzeCD8x37js0c7b4K0/TRTSZw3tasyNVuiCnsyGO7+Wa/+Kfn8RzjbN/x24a/fhomXnjx5WTjxy/7/mohYOagQWTFC6gfNGPrL3B2MLybXn5ivI4hbDeoOg9PAKiHP7vb7DBl6E3ltQvsVhV2X8g5UMrHK/+8QNdMVDxFPR9sJl+w6n0Vf7F9fZN+kWw8KR4EkcAOypRJAQIssniYIq3IHvtMOyW2biSd0OBWo93OTJsbpYoHmoIBXLO52EM0+WkQhHlDATIjQ74k0caTuPe0pP0SngN3HsrQ15L7ZAKOxKHEud1D4BkAAAA",
"벌레":"UklGRhQEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDwAAAABUNw2kpL+m95jWPxGxAQQoXy8kt9n8v9ENO7EHbEg/pAI0esWelirkpqwlDxhQGIjW3jFoS6+oXBHPgFWUDggsgMAALASAJ0BKiwALAA+PRyKQ6IhoROWSCADxLYATpmvfsfcPxy55rkMyGzAO1X+AMWZ9AG81+gB+mfpq+zJ5RlY15VfUB9b964Qde/ea+zeYHcZ/5LjU/CvOd5/X+j5hvp3/g+4L+q//O4GP9IDWYp5Y1Lcth/cEHger5PfxCnCbRuYiuVbSIwqyP9vSLcZm/mTInRNth+pmnNkmx++XpMAAP7/0b/e5vJ6uIaGWH7Tmr3i8mH9A+QPWu6kV/0f8T/2sO+WfnqEaYp3j/PxdWu9lB/P+JVoBtsyZEVzl550RpPt5oM5ulRjhvf/Si2c17HR4xwAJwnXQ6P/g1/3asP+v9E/95Adiv/axNkHrMRo5DUek2G+N7zZPuU+SxcDt6e1GR+fpvbtrL30TOAS81frUU9Q1Z5+B8HztpYh3bFM5/3x3t2h7KEtbew/g3fuHH8VW6KLUGtJnQc/rzDo8TLArl+YP/0xmmW6FxLt7Im7SokWCVDwYWLeOnkJ3ha2dqvMFixhD4DNX0uSD1Ha8Ef/3XWZVbhP3REgYZTJdlcV/nP67DsTTkbX/zweAFnw2NP0YzEmLkTRu9GbkQbUNhFWJqtbdpOSAus4A76YYQY4p3gK6Pxkn9BJ/c7g76MXIexXeIlK6CfHy5TnKjdxvkx09m6XcMAqspVYg6bDMpvvygleB1a//NTdmSpO0f5qpvFQwoTwO/zfzB8XbXDCqbJmS8W0nNkK6RXHmHoxrcn9G67/kCNrRhh6vcNUJhN7J6UPHLHfU5nrGkOzDIDmxYIDXnR9p1m1GedBG6rfqY2pnL4aEFRH2cdK9Ledy7Lw7RW/9cFjnrdPAbuOg05Ffe9m+ulnSfYCczY+WHlwaYpDCQ3C2hTwAPYWJXdY/3XxnhADo/bNx/y+W5IRPR+JdrIMhuXsBwY8GfpW2LBJUtz/ih9e6zw6tHG7Yzz3R8B8Hx+QMylFLcn/9KvW3bGpsRrZxwHh0fFLHM7sCHG/r+8W7ymvA3wl2wf37Wh3wEP9IOmCwtXnnt8xmN/O8CkHoQmSSGd2J+QH6SS8CfaIRJtqp2Xf49hD7RcX9g5ItDmnh1/9tnTDuxl35r6qTQuLVn933/5jOrj0KF5uMMYq7UYZLFTqCyQXuupft0XI4wU0EMYpW+eQC774QvEW0UlVlX+43+YCG8e0BNiKFfpA6qyWtfvQS2hgyvWTy4tNN18ByUtYW8x013MpsFrHNsZ50kzKNHG+AB/7Y7vJgBWNYtcH9kg+AAA=",
"바위":"UklGRo4EAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEEBAAABkKtt22E7zz8za61dxTkEdrZttalcOTkD2weg1mpzpbPROels5//ne4vN+YI6IiaA/8gaU86XSZUmrW8pY0GUqVqLmtEsz+eXZVLVpW4CIXSSTNWbgII9FuUxAbVwSj6sGUedCELR6YIlB8k2Qs4kJTmMWt1skHmw8uXoZkvlIekSkPFUpYuHGWTZAydbgYx7TvpBHuZ8SuZiBNRZqV9yMQyK2kGLDpIdaxSBHpI5iDpGPdD46qKMC8kzRv8yB6avBaHGcUV5UM9mh10knW7KCQO+JTn8peXUYZhcxF+LQgHDzEOpB2TARfm41yy75+RFM666SNpADr2eWumif7P1inIxvtkq8xFHNfssj1Hnixogc2G7KIAzitUlqXMIwNDvFiuy30rz85zmh37IqpHuLyCjecG4Y2WqwPRuBeT8pwMAVlA4ICYDAAAQEACdASosACwAPj0Yi0QiIaETnAW0IAPEsQBZ2dpD690pq+Bht2rtN3nquyu9n8BnId56yB9AHOb9Hv8RryUWP+q9PfQN9I/8P3Bf5J/UP9JwIH6qg1Nxp2Zt0Eba2dPW9LohTCMB/2SellXiIYo681DojEQH4ZMV8fb7Yul/Pdlsk1914+VuAAD+y13sb8ZQ86CSMfZzk8NBdzqmWZyWPGZL1FwORh/PNkGM/Uu4pnrxJBetTGQjNlGpeqdc/alK69zld0Y3catp1d1tHs425Gbfaccvs/l4gPofDAEnbd7DrgTNfLEpXgXb2i3M10HrTMrkoV9enTgbBli13z6dE6dcT9zBZQGoXHZ1od9XTP54S4Bp+DwgxN67r/euX2q0xymG79/O3GEJX+RtsxkXOFwKB+erqmEXQB6CyLWDShn+XJvuqq6+Cn5I20/HvwJk7lk8rYFI5gYuvOXmUtPwrlZLRC453YMf53OUu8ji5Dhvykmm6SKAMPJf0SCWhIQTXKh/iPnGW+//gUMAK0GI7OuQXte6CdEZt/mn50IHzf2ihGf8lvYtl9gNm5/LZOuHEueer36fpojr6mw56MTXRX/qaGU/Lg0lqGMtR2iUyjsgQZVkGoKHI9NfBLeoVvbX+VI4u1qh9Sr02gr9dB9pM1ypzmk+da+ezepFfy8JAr5RCrovsTcnkc/lsz4PPdJP38MHOiBT80KnsIN8EvYWsMyks8dp8VI6U/O9QwT6mefOEAqqmfpHTtf4Svc0w1tRoP6xP1vuIneS/cBvZ/yDsnU9Mv5al/btZmlr+r9L67qnWd9QzwN6QFCcrv/Vq14+QN75SrZYwPsyTXCw+JOOVGWujhZGYmZhHhSn8ViAWHCGCP1P0DVzseFQNbRf0NdTBK7afoyebvIKv3N//JzOoP1OskSKD9X/gqmwjnXfqqbVXk5Khitq+asqFee0CtkrJOaLWYUM4Vlvumf+W8okbF/XFHP/+ZUn2y1dPfSugfhY3nG6j1Qb8U1b+eYRKM70vfBbGAyEt1Ga9x4L3yR6b8cruPMo4LE780psHJK9NfI2wAAAAA==",
"고스트":"UklGRooEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSDMBAAABkGptu2or71xz4s4NaHJ39+4VoutNEInufgNOdHen0d1Za87/C+j6kRwRE8B/5dQPxdRmtvMLvxNS5+NvZWrXpM3fVJyTw2ICItNVW3uyDKSup0sjl1AxWkUuyzcjzIm+GSoXpuffTPHRaDlELir7WP/NFRfZ7vSG2O2mD12ExDKr5eJGIMYtanzMJ9CtkbmwIQS6v3aicQR448LKi4EhhQ1NlsNaW+nQkV366uNQ6BB7nrDsoWnWkxinLIemVxAYVZw0PQgMlYui851CqBb4qG0xCS470SoSg55ZcWD55awQ2aRGDrMuEGGVOblcRVghJ3eJ8FzmoZRFVCCfRYO/KS5KedivCiCXX7WNjkAuDkr9el6IgFRay0UrSQCbn8haMr093jeFb+h63nIrueydyH87AFZQOCAwAwAAEA8AnQEqLAAsAD49HIxEoiGhEcUAIAPEsQBjzOAVK/Aa2wHik5LXvM0yk/J8Nhj19xzjm8aY20iXDTxq+fLn/ekPYH/kv9D/4XAyDUY3Dkyp8BlPV2Kn6DNEUxgC4bqx3y3fUb9//MXMYupMzV5S20hP+Z/z4pmcEymjq3FxRucQAP7+oCNBCm8BCb3AqY0G9cT0v3VUWjC4AYmCfbLTE/s1aqMFYuHaLScB62v69gENVnyqlImFI3cJ/NxRz973kh+smf1lG6l2NRysOEzpyrtteb7648hd3aQy37u3/KhVqaJ89M8XrOdoYn/2U/0xt1h7z/VAQZF6Qirdg6+pQb2vObqyOXP/q/XP5rJDNAmSdtFTIB/tWllWsFhIyrkZ71Wc8YZM+YYIPbBIYcTip3z/ZsXuqP5uwLuSwXZ4vXiITTyUMl98J7JmSLtu2+Uh521DooakszSU/Bt/+PO9xoXooPKO2aDi9f/3zm4jyyageMolLb2i/oVu6pb/vnnhfCRH77JVi1jaJNQl/17/+qPVh9JHyDwb3qLpMN0a+zIx+cjkLsopalSkGwyXAfRl/0PX97/1erDQZCX9o12oE8IYQVBR/pS6ITSgjA2AqUd73nnsGr7XEy7/NBGRzDDFphQLCw47vJGHv+8j9EZEf9PlsCgs69vc7P40qMD7MPpn/ZrTd22h1xmkbBE/sTlrnax/sNDdjITloCU0tyLcR+cscjatZVgX5ZoOyFwxKQkH1Sqv+323//H/FNuqtbaiAwh6WBBcu+gf63GEBxfiEPdBr/SSlS8UT3tUiv/s7dsmhfJ6UIVvIeLTf/10B/a+nxMfGLQPCXBd/Yop28vzBkiHVwKm3LRMfVf+zL3vgnwTmzK5d9zXf46tL+i7Y3rdDhWJthXl1K02v887Hz7qCnIcdVoUXhVDmv/r4ay6UpHWu1l8/9Un/4LO7Rmj3BiCj7T7ncwBqxnAjMSCpFyaVs1a4tK/lhe0ARA4UG0O1v9t1QrsLE8Iu9oVV7hLx+VVty0z32oXAfYe8Twh5z/OxdzuOZOzueSyuvumoUvEL/DIBOP+P+Pqi6Pz0pywAAAA",
"드래곤":"UklGRvoEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSEgBAAABkCPbtmorc5/73vu4E2ru7t4DaAH8CHdtjLtDqPH/EU6mIWSuR1bwfCNxREwA/5EGO3fs2PFRRT0s+rBj5/Yd69pYZWfV9+83pjYZXNLPGGPPSowxZh1vqkZf1m/1vaSfgDFaWS6Byg7G5CIDDW7otwuB1cbdLclB0Suo2KQkh1HbmhYVJ/uaBuUhlRcTINgbZQ8aBgKPnbw0zKa9K8XFeahzSL/lYnbTnuJkRdOgPCTdGKiZjXmk7CDqJHVjilRcnGtqfPVQ9HMWVrMTOcnDj7FYg/P67WMSVk18WJKDWI6HGqxUksNfOkgDlmUPJb9fbAFmy0PWEwJw0cmzEMBeOnlLAIacnGra/CUVB0kLqOCgojzktU1bi4eoq7U68E7FQ75Dk7I8aAsVcEy/+vdLjywATH6g1K+sobHBmhg7XHK/Tkwm8H8OVlA4IIwDAAAQEgCdASosACwAPj0ci0SiIYjigBAB4loAKwzcgfXun4q4Xds+Nntrc9A63L0AOl3rvL67yzp9D+Q4V9qTeysd/6rjP+ofmS/4vWFv6N/oPVR0IfS3sBfyP+jf6T83+MR/VwGdb+IMV4HqaPwjKLi2WBHppLwD8Cp3sLiuLBfmPM7XhoyorllRCySiMApnoxziR+sUAPQ+okAA/vQsanm1WyXT4Cw31JbLhKlUpb0MFTLKU731sO3oG/AwhlbvH6ubSJ4ggpjOtaNeqKp6GMgdeW9/BdgWWUz+KdNcmzlnSTZEJgaChfAb3kYTeTX6bxLYL//zc2EqZhSNGvmc4Zn/YLD/D/0eLe/NzOzv3sA/pSU4eOf/a2Bf7L/n5yj7GmrY79Us+DOEeW2rVXR23Wah7+DALeXEueuBjoWxCi/O38FD20E3xgDv74pBHzmUfHERRCY858CHu8q01zFZ/vq3sm95Q0yELWPN2hX+auUPQuuAxUs8H8QZGGsqnjNajvf3CqxzlOGokVaMlJ8vW5KUPutxtjyliS9QAOpmpLTOd1t6T/R4x0d6Gs/+OzomYf118Hr+KtFqOn9uYRFlGesIX/0+ogx/xqylWa+9JF39IbpJ04XUp6V8+Il8GvlXFPSgn8ScUoRR0XHSC+NYKtxNE8nHF+EYjb6DeHM5/vDzgDCdasTyGEP/9/7IA6s/DdOw0FD/P8Uyx2FzHnJ2Dv0xyrw4TxHYe2lodcsZXIj6KWOquLROKqzrQFiq/U1410UfvdovUbXGWrMT13CqES96rWz6xfZx20wYx9uMBnFF8JEl8s8OjlYnAviVlxYrRShqqoflzza8PyD737+HoS9Yhmv0U7QX/+1Eb/EQzbd6ujKSr2WIvuy20GjQc/Mlk1830kWEFwgxgmO1P+LXPd1VdfJe/i1fIMRNNVt+TBjNOz8C5988nRIsyiEttZry/v/wjCYh+5l7itRVWgzZ2bFUofJl87lE4X9mPlVYewV62/I/E+/+2//zKs3XH5+ltXiU1Qf+ItB/i1hvXT3P+P9h/2f+t+njfhsCok83UD3feaLgnYJqdt4VLmW6NTXtWksNkJQrjcn/IhTGLHxtgl7kbyB3NvDveEwmAk2B+rl/hvEHciSx5mtDpNmcZUG2rqAT/SKcx7sPEtQREb/F4eplANSaW91IqgupnNEr5/5oKLY8k89hNNUIHMQAAA==",
"악":"UklGRowEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSGEBAAABkGttu2k771xz48QobRtVRmpVaW3buACjs6pzC3FS2mZn28mec80vxh/UETEB/EdmMH7qAUX96qSlk6cN/lZG3xP6/TfKX2W+30uFkP+WGD6mo4Bz2VMF/f4koMiMWJHFCC5rcj3lJhJkdFYum1/1z00k3QPPaUULIY0Dnx0zorngOWgiT1cakbk+92IyEHUQCkxRRSYuOgqMSkaGQIExMtIeR41bSgaCqssFR823JipaR9FR44WRaopFVuZBBkOYRaHIdlUMJL0AV2Sjkee1ca7Tq5hMxFo4einKYEhrvYeuycRHjaAIO2QhhZeDnMedMRF1CA8cNnLEeRj6PsrEJTzMUrCQazwZjDeSt/rqnpIJ9flKJmPaV987yE18zNdRAmSyoiUUgLe5gQ/aggdYoPchBKXwK5OUQh6CXnbJvtFwl37/yhY4vllj6pSp08PDqdOm/vxj6eKSA1PHQ8Z/JABWUDggBAMAANAOAJ0BKiwALAA+PRyJQyIhoRccBZggA8SygGGzusDS6uWYN6ArnH7B+M3Wyegj+OJMd2OArpnj34t/+d6hOgv6J9gf9XN9VDNyojlAMfRuXnh4HqH9ymS9d3LOHYSyrcLY/vDxdKasQ0BG58BNmP2Co2WejhWz9NebHBvEiAAA/v2cyGGo10Dai6g7Tg9CgW0U5wksuZFoAmtSWJSQQ8k/G2I8XjJ2nxXWYlDhC8L8bFtGBcirgkM0fSol1UzWjHhCBv4r/bmULHilclbMGYEUlYdMlOvAwnUr1rvM6JhxJu6fOievVC7wqQpfcj2AnjQXwO//kPp6o60QKRdYLuJKME7o2KS1SsVAZXsnJf00XzWI3FMfcGEMWygiGGedP+bL/l6ndJwz6kjlzRTAzaTpBWZeyA4mvtT+kOrFJUiy2zKevRip+52Mv/V339fGyoKyUfOSdB1MqAv79r8L12S3liMqBxL770A/BV9Cb/tOjOQ31Ks9xKz5FXzPE05eq+VuxbINpgBUnKIw0ruLv1NgoP3/4zZzGa36UVxuJdLum2+DMRFVBZfFHkbcMmLfBGVa/PVL/XT7BOQxYXPt2g/Fflvu3j97M6z0WTwojGy3ixs4i6x75WV0ZaN4B5UWKYQ9eJjmDGvicQS9azEckrb+oxcEhhpYfGEXVAkLaXAjfWwitp0m5+nA/xEMMVuPzcdK3Rd/mgrWq0GbCHlF5INvjGit8z0SYZ3S/DdjafelmIOg7WcRbsBASE/bfqnx0QzgyVTlRvquGDDLanuI7rBi9b1IoZR9B/aQJxzl9v/dHxKwW7gwXd/mL7zWfy4LU7DzurND5bhi2nXFE4EliV/UX1XMXlcg0BnX5qlx9jHHSND/FTy7Pabj85MZUvNTc28VcQ1CQd1YDskw0zvUb7PCxZs1EsPUYmu2/QHq/cqx9HrAMiF5Q7xYP4o2giDc/aB2hgGvd1v0WOAlmvewq/NZ/+CC0RYIj0l/FPISOOusYPjKyxUMUwNxFGdpq9PuZAlgAAA=",
"강철":"UklGRkAEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSFUBAAABkHNru2k777dWbFulbaNLZ9vq/A9UJZXNyuwyUtlJZbO09lrre4vL9QV1REwA/iM93IqtTKx05ftlKxq4UhzGPWD+iSjp/djIIubR4tfXfgBE6pGR2RMvAKgimzUwf9QtAKrhKAsDQecC4lvd0mSBKwGP0YzMr/Hr+BLDkoXI6ygxiDZuCOBwkcnEQwBOHtvQJSVwzwZ7AOI6vFTNp+l9Z0E1LONv5g/charwNU5oNLFfqgqakmriGKoKqnyzoPp7KJzHtJBogD+qQ6rKSQYTsQmkKraaSHxXX8S1eZCSgUKXoSownJEWuKZEx2RB9WVbEWA9LSTehQPcYyPPxQG4bCJyATww5GNSC9q3xDoGWuCoEjPVgsZPfcQDl5gMBD2IqgBoMvBkKYUFDW83SRUAVAM/uQ7VAOC2xmyRaYzzJWq+Y8zFB+PgUOr465qyRJ4FPP7TAQBWUDggxAIAAJAMAJ0BKiwALAA+PRqJQyIhoRcd/mQgA8SgCxHrf7vhYKeH+q/MV78sDCt+YT9G+wL/K/6X/xOBc/XITT8MTyhVmzFbd3lNC3s3Qyz1Q/UkGYq+jg9w5fdo4iEex947Uvznun/c78BLwZwl06AA/vxHbyIZS2rW4Ugwl597LePyvZ9f+ia2ReBUr+K7x29tFba+nJ7W/+CJg+zcPfQ0j4jfOGxUPTAP/3qRkpfEl4q9QLwZX3eATt4v8bZY1G1mUz9CLo8hpSQeL6pVs3mH2tkoSiVy8hLSi/3r721eDO5+94Cyk52Yl9+dsZ6xmrAzkAbRcpMXdpI+SrTwOYjX4EMI5v7DFi+IvJisCB0IfU3wKRqd9QS/tvx3Tx5BcA9f4yEpN0auadKZadSqmv+PKTQf/5cxLQgDKkwpeFsDdcL21WviUU3U8YhI902dYesS7hneJtUcho8wNss+8vkTwYPh9xBla7Glm78wDaOsgZEemGHTf121BCWPOHUquVYkcropSnsF+PFKp125B6v2IqehFvFvBh7a4fUz2azO5lG37Yj9P//oZ0igcm3jQNWXU6OlCVO95P8HZq1LRJVyANB2IVknJOu86f1m9WLju6m4jxzPFcG7OyIQysgL6xJH5D7N59YQ4VoGhWxycC1k0JXtAXzUGqidRLffw8+QXwlaNXTHd/mcj+oQKkOltrqjvn/TgP9z//hturh7P5Effo/KKXc6zPf5v+7hV5te+zCoi5XZ2nlGWmjLxO+7EQrstvbpDb1xbtS7Yrj8NQP87bZKBuzUtyG3qI2+G9/0dysgzatsV36yDBn/3pEdqRPcDIgv9ZbIKGoQAENqQHURI7ew/uJwX7ztmBh0gjpYlf4a7jIuWLm+ntFgzLwlvvHBH9Po8xC42ZR9i3J+St55/N1viNoSzGYDsj+Ww9h/8FsuELjAAA==",
"페어리":"UklGRtoEAABXRUJQVlA4WAoAAAAQAAAAKwAAKwAAQUxQSFYBAAABkENtmyFZb/X0tW0jvJnte1MjNiPbNqKb27Zt27aNrqo/WNZ/EUfEBPAfaaDZOmcl+63b0po4HUO+Dd/FS0gvyVLSjQofEe8krHU/G6bJEc2SH15CW9kJRKbkJ+slvBcgZqFYCW9lcRpzxCcKEumRhi2iYwikTMOP1iuwX7pBTHtJJLyTW6Rp43UsNGA4KU6BlVoA0QslTdJwT0lDiKj52vlwiWzJFZODSfJbNCwlBznMGK9jKzkMpb6KRusHkzKUFKX5MYaqTsfXMpgcLJNEwW8ZZ3KQg5U6/DByEOfarEOmkgMai5Xw3n1oRAS1VTi5R9qOSh5Haa6K0+BvAUQXVCTSnRg4o8Hbj/VNCtq9tz5cIluIgQHyWzQcMWmWeKvAuvmkgB+i0UtFIqCPS8L9dmeLpwwwRH64UIlIZ2KAMocltJN9tTGkW2zQZrEBvPwaXoCY/3RWUDggXgMAAHAPAJ0BKiwALAA+PRiJQ6IhoRccBZggA8S0AEGKNrerWOX6Z9gDeO/Ql6WaYi/lsgn/NzTPtM/RH6k+ZXxA0c3n0aCXo32B/5d/T/9zwKH6XhqK3oorf+J50brRBrUPWADBPSI9EvvMDq+E7fattdgt/gt5lHuPhMm9hlGAITEwnex8AAD+/QTIL+0SUqJ6/rDtvjZv2lOrc9D7Y/3pRziHmwne84LqT+1jqoJv/dEoWjg/+2hRB7a/l4M+fucANohGkvwckqgZPr0ZvONvUqrCwIPDab7ghhfEUW04MbDex3hCGcX/7U8iIQhAf/3Re8uv9PaSFmUHfuXd8HdcueIwh0OUkGLQ9H7wbETR+wEVe43+GRsCvCZLjwhTBo/baTzS47zhsAgP9CHBME4Z+fGSOp7nJ8ypOLkZxVm4j5unublGYrbL/c3c4gwXOsYvF++lMoMlygtI7h69SEakExv/aET0azKKjTvLGznUvzAErTXXk3gyY/xK5Vc/D236M5femkGrfhN+5ww+FrLUn4iQUH+SvA6d2Mdy9l/Lw95eu3/mHnskHx/rf7nZZ4PrrqHx8nmNTNUH8m2N8F/ZJ6fTzfOY1AdgvymVXHt/j3/fdORCSXaCjFrdzuKInOyBWRTyIvtDNcbykTOWLGaQ2Dq9GlhupBNdsCceOe+DxS5UlEHMA50Cj7FXFcDjwiu6hes3Yd1TftbLVwehFs/tMH2zjp6V8V7d4B3Uclbx81OiWkMFRTa5ZmF2JeqQg8YzwAtcdcbvYfW/6Dp/cz6342UzvUBwsbuiocQ61rKZ+DLJSCXe/pIswujv6dwV3BybAksr1L91zOSAdxC2Z05GB8eFqjs9G3veeaw8dMO+yx99n4rcv3ScPikU1L6qTeS5YAOLHd84q8Mi6eBbYEkgKf5qcjvi12NLIxv8YS5Petg7fcjoObdwcP75T7Zrc4W7XIV/JR+vlL+ge2n3rw1+Ar5ncqt5M0cbyZt0Ct/7bmm8ZVflzjhLz1f/2Xp9nad/Vp4Szj95vZYb/5pj/lOQEwyAh2p3DfARvOVWc/5d9rn++tTj8223BCMkgIOVXNaT6XwWJrDKDNm3+wz+6pqCqsZItr8rmurRAn08n0uWTr/ubBqfsbD3U/Yt1aPgDgA="
};

/* ══ Z기술 입력 시퀀스 (타입별) ══ */
const ZSEQ={
 '격투':'우좌우좌','물':'우우우좌','땅':'우좌좌우','풀':'우좌우우',
 '비행':'좌좌좌우','얼음':'좌우좌좌','바위':'우우좌우','드래곤':'좌우좌좌',
 '페어리':'좌우우우','에스퍼':'우좌좌우','고스트':'좌좌우좌','악':'좌우좌우',
 '강철':'좌우우좌','전기':'우좌우좌','불꽃':'좌좌우좌'
};
const ZSEQ_MOVE={'천만볼트':'우우좌좌'};      // 기술 전용 예외
const zseq=m=> m && m.tagx==='Z기술' ? (ZSEQ_MOVE[m.n]||ZSEQ[m.t]||null) : null;

/* ══ 서포트 티켓 (포스터 하단 동봉) ══ */
const QRIMG={
"따라큐":"UklGRsYCAABXRUJQVlA4TLkCAAAvj8FjAA8w//M///MfeKDbbHtku/kICiAU0Utuhg7VgAGWoBJUhAsgU0d2AVspZmhHtwTRe2RoZG0DmOAbkOfcmble5kSK6P8E8N7uRvMKdiVJqoDTPB/IPgB3fpjDNEZbQUOzk8Lod3E1adKtCrg6Cbv4ey2TeAvgEE5S9xVwygBRuCVIWm8vVpePYx6APbcao1ThYOZISe12w+gr2JWkTigD461E85rU3JLUbY0Zp/lxdOrpmn4hZewujfkrGhDVbKXzisMGSaoc2t8CHvenP/CIZ7/Cx40nekvQV0D8EZ7UbUxzBXVfwa4kdYIEhAyuHEznkJovaWYuZSDu0PiOqH4HaCVOXvEKvuM52yepEyWtQVILGawq2DXmreIQBj8p4P7H2cEcyw12qz+H1EmfqD2/C2qEwjt8hk/ZuAx0UlT/8kWc/TJ5t5XRGgW+JjW3JPVBq5fUXDmr2uGS1l2mUiOp4SWpRklLkBp7SusDWE4tzBWNy43j9R1cAaOa1JykTiiAr2DXmE+g0SyMXlycseelfJ3ZIUpaQr4iaiLdSkzzJan7miQtAKEAXsJs5wpb2XPui+4Kj3j66/DX4DPwbA9whe95QZJWRieAMLzcyEoZCJJWr2m+oLKd7qVTIwPxSLhyB5CGDBDVZ5VtTXMF8PW6KXaN+TbS/RXN6x5toyuTGl7qAxDE/udXP8qrS6OXvuZ5FJ/3ybttjOb1gnqQsGsQVvUgbXDLpPwfsw/A7dMYbYW/gaSVKOAArsLLyXIYX8FqAaN6jfK5Z+5ltnOSuq9JWhmDLq9se8OA1C41vKSV/eiX+nHmQWLSbi5JHZLUiFIjCLvGvFe7Zj31GH0FCJkJo5or7Ocz5lbgJmGS8sR0u4+tfMYfgFkAXpE6mK00r0ndLWCkAnYJwkp5r3aNG8wDsGfQ+2YDAA==",
"창파나이트":"UklGRj4DAABXRUJQVlA4TDIDAAAvj8FjAA8w//M///MfeKAbyXZd21ksVAkmQ4CpABTADkEpKBMwtB2IPvDkUpZg7NrLAMgDgPdznvUi+j8B/LlnXJ4ZqCQs4iB3XNqAfFU6uQEZl9DH7Z9C/AZ4xLGaBeg0YxuVDNAMQElGZXeV0pQp/po2OoVfFPsU/FZpyjzeOptzgQjAo2YYBUAVwKNmAGWK9VKTAOvpCtIIYPunEL9bzrQYyYiDjMofDYWbr8MdavGPg1woARaBpQTwB9j7JK3kPXmlDOtGzTCSDJWERWX37WCP2V8qD9Apl008CYva4HJeyRf7Ovqk+K0qDzhf2JeoTeltnq58wP1Q2Vv43bU1HstKobF4zspgLCQjlIwlA5WtKJkKNx+knYOMeiMd5K6ELSRfMH+APaLc4Roe9QXrKZkGkYwAyP1gqAIYBQCUMApmONPBrXGmTp5mlIOhMcr3LDXpRpqUDm5VAKc0JcMpgA/5jQL8+fsvICrJf0kSJ8lf//+PgzcTXDbBSG6VZEAZFeoLWyUZmg26SLgR3ibnMnajdMowKEnKQVIAizgYAMBIwqalDpaSd4s/wBbJADTDIwDUBAAqMAqck6wnTckwJnAlbeT4ouCjKQ84B/gUAVDlhZJhE6oAOAUwkgxVQJIZOCfV9AB5NxyDtpqadCPNQ5VGbshxA0MyUCkAKkmKMlRygwk68FEZwNmkowPUdGEzSiM3ZAV9QHnA+UUpTXolrSAHgzWWGgF8AMmIgzhJAGeG7UrYDnBms1VmACXDohIecUwLPb2w79y+WCF8JcL2k7AIjMsANMNiybCgZDAS/XNCaTTDY1OX0At7U5UMj+Vim3e3BzRGZtgOwOblnje+ljX2VvEH2KiMy3JhbFLJwJkm6YV3dm1kEXtM/Paled54rzQyytlGJUk5yKiEkRlGchDH+QPsXeKNr2WNjfMIwG+EKripHHlhN7Z7xyC+Eu7h/ZEeIA9gBqBkWIkAygP0B0CGRwDGrqDvk2yIveu88cZ76cLHdKOSjEqSgmvl0FdKk26UFbSRG/qeu9QMpygZAd8aI7n5JKMcHYbGScLWsrdSadLFNoVXZyMHueNgmPNTzQ==",
"거북왕":"UklGRt4EAABXRUJQVlA4TNEEAAAvj8FjAA8w//M///MfePDd/l9t27Vt/RCS8biSQB9CIwNnwAilhzAygHF/HCH0VBj3R4cwsJwA4441ML8HoNTCn1pb709WRP8ngN+RM5Aeyyaj+X6l7vgVTSGpSwCakF8ssgCL5cyI6hNbXoE5wJ6QDyiyMkmziJyqXYmkzQ/oTTaxk+bnIBmEuMwmJHOKTgZ0WkwgyQlwl3iDEWE/rcR3fWKAKOYnTRRJmwlUYYlKgAIy0Q3iEK/p5wVxiUpclueiPPsSXKSWBJK0iUqMBfoQBdECnQygluMO8B8h5YC8MmKMvG5FtaG5Iif6YmoAGld6HxXKAfk4I6KcV55TPqBcwgn9pnQFVMhMIQ8kA2UkfnWBO74YbCEVEEmdpZgLZt8U3eSVlZPkuQtajL1gxJgL9om5N4xGtrOlAINi+z6QDMgTdFMCupD3C5tFLBdFnjnAimovhk/PFKLbzD9w40O2UDWb+ZUMHxne/7gQQOZWfyGA/NlnEi77SIUzlChMIEyjBGnmiEx5heoFZEJcIpAy+b7To5siIVIh/4P8aRNTbORU1/t8ouokgTJUdyXc5RJVm+Sh+Ct8C6gjygH1BQA5PFBIFN56yaPrElZ5nxqaKfw9VXOJGplAu60wJJIe6CSpqouLelv+chJWZRNJBSAegEP8Bf/GC9L6pM0CSOpCEXVGdFJnqtv0FVQfqZADOl0UUlaNDnf5d0k1MqA53KDvcTMuqggAg5qVk/oBfFtUD+qhT4qE4kEztEne5IccFqj0AIoEooux2SWSpgRgQQD5Dr9w2Q42P5LuIKkGagwmUYS+ZBPVtSzAJeJaeRrqKSSeoDbpiXmoCLArBUQq5D11FodIojiAJg9piwEGSLGNQPaY0hQPNLurXuoCgGojFXKYUYY7wH8EZUnVZt5/V5FC0i6ALZ0+kuTEHeAPCC/Bf6z1iZ0lGW0VSYMx3dSGb0l6oHqQHOy+b0gGoEjwAKqPVECkEPdIFadQxGlx6ZB6QDkHi/InAXnRZ/VvmyI1EnUbgMYAVG5TiDSLSu7IPpIaALpJBMpQ7vOP2ES1bTSIpB2aS8QFJaIeB2n1DPX8iqw8ZEkKaUh73CyR39BG0mLMQr6lE+Bo8A6RqrlEkh4CusYPLwX0C0C5B+Mkzkh3IW/yEz5QRIRLCvWNUkTwgbynPPJBoSkg7dB1FhZ/1/tM85H/ovsCNEgkLcZb/CTNvqaDgKs+UtdPaz+U0q9lCVHR60Q1adzqm0ckXSTpElUXAtKlRdvgsawe6DLcqnigPSt/QHgLdbq4qFLaI5/tah6o9OAvBv7fAqTLAkIkJpylezgGVJIKmUQVQhSSelBiVFvpC12aE1Ae8gA36QPMLZ0uvgIvpbg4ZN9NoZDssNBZBqgwTaQEhRzQ9Szu0EAcAjDQHGV24C77XOIpPEG9fboG8KSavmAAdBHmADvYj4UuBJfai6k2ieCMExMlJOpmM0lTAgDEXWg20nRBHmgWkRSHCxQT3zopvCmwsILiwiUCjR/2BKA5krSINJWkarz1CoH2YQbqTVNTGND4/PiYrvvUQ6Z8MvH8ly4hyupfq+Jv6gvfVbOZ1JgBuK1dgJhl8UCz6YD4EtIB+SXEt4vJ/B23Xqge6DaRtvBLAZQ9RGHfkRQA"
};
const SUPIMG={
"따라큐":"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",
"거북왕":"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",
"창파나이트":"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"
};
const SUPPORT=[
  {n:'따라큐',   t:'고스트', mv:'섀도크루'},
  {n:'거북왕',   t:'물',    mv:'하이드로펌프'},
  {n:'창파나이트',t:'격투',  mv:'스타어설트'}
];

/* ══ ★6 태그 아트 (공식 라인업 포스터) ══ */
/* ══ 태그 아트 — 파일은 `docs/art/<키>.webp` 다 (v3.51.0 에 HTML 밖으로 뺐다).
   base64 로 넣으면 1.33배로 부푸는데다 851KB 가 되어 예산(900KB)에 여유가 없었다.
   ⚠ 파일 이름은 **NFC** 다. CSS 가 encodeURIComponent(키) 로 요청하므로
     macOS 기본인 NFD 로 저장되면 404 가 난다.
   ⚠ 인덱스(a0…)를 파일 이름으로 쓰지 않는 이유 — 이 목록의 순서가 바뀌면
     모든 아트가 «조용히» 어긋난다. 404 는 보이지만 엉뚱한 그림은 안 보인다. ══ */
const TAGART=[
  "1-5-가로막구리","1-5-거대코뿌리","1-6-거북왕","1-5-고릴타","1-5-글레이시아","1-6-리자몽","1-6-마기라스","1-6-메타그로스","1-6-뮤","1-6-뮤츠",
  "1-6-미라이돈","1-5-부스터","1-5-블래키","1-5-샤미드","1-5-에이스번","1-5-윈디","1-6-이상해꽃","1-5-인텔리레온","1-6-자마젠타","1-6-자시안",
  "1-5-케르디오","1-5-팬텀","1-5-플라이곤","1-5-피죤투","1-5-피카츄","2-6-가디안","2-6-가이오가","2-5-갈가부기","2-6-그란돈","2-5-님피아",
  "2-5-단지래플","2-6-레시라무","2-5-루카리오","2-5-리피아","2-5-마기라스","2-5-마휘핑","2-5-메타그로스","2-5-알로라 나인테일","2-5-애프룡",
  "2-5-에브이","2-5-엠페르트","2-6-잠만보","2-6-제크로무","2-5-쥬피썬더","2-6-짜랑고우거","2-5-초염몽","2-6-코라이돈","2-6-큐레무",
  "2-5-토대부기","2-6-피카츄","공통-S-따라큐","공통-R-루카리오","공통-R-잠만보","공통-R-피카츄","공통-S-피카츄 (밴드증정)","공통-S-피카츄 (현장이벤트)",
  "1-4-고릴타","1-4-라이츄","1-4-에브이","1-4-에이스번","1-4-인텔리레온","1-4-쥬피썬더","1-4-가로막구리","1-4-님피아","1-4-리피아","1-4-만마드",
  "1-4-야도란","1-4-포푸니라","1-2-가라르 지그재구리","1-2-골비람","1-2-꼬모카","1-2-꾸왁스","1-2-나오하","1-2-누니머기","1-2-데덴네",
  "1-2-두두","1-2-뜨아거","1-2-야돈","1-2-염버니","1-2-울머기","1-2-턱지충이","1-2-홍나숭","1-3-가라르 직구리","1-3-골루그","1-3-나로테",
  "1-3-누겔레온","1-3-래비풋","1-3-머드나기","1-3-아꾸왁","1-3-악뜨거","1-3-욱우지","1-3-이브이","1-3-전지충이","1-3-채키몽","1-3-포푸니",
  "1-3-피카츄","1-4-두트리오","1-4-모스노우","1-4-백솜모카","1-4-투구뿌논","1-4-폭거북스","2-2-갈모매","2-2-구구","2-2-동미러","2-2-드니차",
  "2-2-랄토스","2-2-멍파치","2-2-모부기","2-2-불꽃숭이","2-2-빠모","2-2-알로라 모래두지","2-2-카르본","2-2-캐이시","2-2-톱치","2-2-팽도리",
  "2-3-동탁군","2-3-롱스톤","2-3-루주라","2-3-비브라바","2-3-수풀부기","2-3-시마사리","2-3-윤겔라","2-3-킬리아","2-3-토게데마루","2-3-파이숭이",
  "2-3-패리퍼","2-3-팽태자","2-3-피죤","2-3-흔들풍손","2-4-가디안","2-4-글레이시아","2-4-둥실라이드","2-4-라우드본","2-4-마스카나","2-4-부스터",
  "2-4-블래키","2-4-샤미드","2-4-알로라 고지","2-4-엠페르트","2-4-웨이니발","2-4-초염몽","2-4-토대부기","2-4-펄스멍","2-4-플라이곤",
  "2-4-피죤투","2-4-후딘"
];

/* 아트 키는 «탄-성급-이름» 이다 (v1.76.0). 같은 포켓몬이라도 **성급마다 그림이 다르다** —
   키에 성급이 없던 시절엔 1탄 고릴타 ★5·★4 가 같은 그림을 썼다. 성급을 빼지 말 것. */
/* 고정 자산 — 폰트·로고·트레이너 카드. v3.52.0 에 HTML 밖으로 뺐다 (base64 53.8KB).
   `src/index.html` 이 `asset/<이름>?v=@V@` 로 **정적으로** 참조하고, 이 목록은
   서비스워커에 «미리 담아 둘 것» 을 알리는 데만 쓴다 (`src/boot.js` 의 warm).
   ⚠ 아트와 같은 위험이 있다 — 목록과 파일이 어긋나도 화면이 안 죽는다.
     `dev/sync.js` 가 1:1 로 대조하고, 마크업이 실제로 참조하는지까지 본다. */
const ASSETS=['blackhansans.woff2','logo.webp','tagcard.webp'];
/* 미디어 개정판 — 빌드가 `docs/art/`+`docs/asset/` **내용 해시**로 채운다.
   ⚠⚠ 아트 URL 을 VERSION 에 묶지 말 것 — 배포마다 373KB 를 다시 받는다 (v3.52.0 까지 그랬다).
     아트는 거의 안 바뀌므로 내용에 묶어야 «바뀔 때만» 받는다. */
const MEDIAV='@MEDIAV@';
const TAGSET=new Set(TAGART);
/* 반환값은 «아트가 있는가» 판정에만 쓴다. url() 에 넣지 말 것 —
   실제 그림은 artCls(c) 가 주는 클래스의 var(--art) 로 들어간다. */
const tagArt=b=>TAGSET.has(b.s+'-'+b.r+'-'+b.n)?b.s+'-'+b.r+'-'+b.n:null;

const RANK_N=10;          // 순위에 보여줄 개수
const VERSION='3.55.0';
const BUILT='2026-08-22';

/* ══ 자산을 CSS 로 한 번만 심는다 (DOM 에 base64 중복 방지) ══ */
const AK={}, TK={}, GK={}, SK={};
(function(){
  const out=[];
  const put=(map,src,pre,v)=>Object.keys(src).forEach((k,i)=>{
    map[k]=pre+i; out.push('.'+pre+i+'{--'+v+':url(data:image/webp;base64,'+src[k]+')}')});
  /* 아트는 파일이라 base64 가 아니다. ?v= 로 캐시를 무효화한다. */
  TAGART.forEach((k,i)=>{ AK[k]='a'+i;
    out.push('.a'+i+'{--art:url(art/'+encodeURIComponent(k)+'.webp?v='+MEDIAV+')}') });
  put(TK,TYPEICON,'t','ic');
  put(GK,GIMICON,'g','ic'); put(SK,SUPIMG,'s','art');
  const st=document.createElement('style'); st.textContent=out.join('\n');
  document.head.appendChild(st);
})();
const artCls=c=>AK[c.s+'-'+c.r+'-'+c.n]||'';

/* ══ BEST-A25 — **전투태그A(★5·★6)** 기준 핵심 태그. **53보스 전체** 기준
   (v3.7.0 에 레귤러 보스 3개가 더해져 재계산 — **목록은 그대로였다.** 2턴 격파 43/53).
   ★6 을 포함하므로 **전투태그A 전용이다.** 전투태그B(★4·★5) 용 목록은 아직 없다 —
   만들면 `BESTB25` 로 두고 후보를 B 쪽으로 좁힐 것.
   지표는 **① 2턴 격파한 보스 수 ② 피해 합** 순이다.
   v3.3.0 까지 쓰던 «피해 합» 하나는 단조롭지 않아 보존율이 100% 를 넘었다
   (엔진이 2턴 격파를 우선해 좋은 카드가 늘면 더 적은 피해로 끝내기도 한다).
   **지표를 바꿔도 25장 구성은 똑같았다** — 순서만 달라졌다.
   **14장에서 2턴 격파 43/53 으로 포화한다** (56장 전부여도 43/53).
   나머지 11장은 격파 수를 못 늘리고 피해만 더한다.
   메가·다이맥스 보정 반영본. 데이터나 규칙을 바꾸면 `dev/best25.js` 를 다시 돌릴 것. ══ */
const BESTA25=new Bag([['1-5-거대코뿌리',1],['1-5-윈디',1],['1-5-플라이곤',1],['1-6-리자몽',1],['1-6-마기라스',1],['1-6-메타그로스',1],['1-6-자시안',1],['2-5-갈가부기',1],['2-5-님피아',1],['2-5-리피아',1],['2-5-마휘핑',1],['2-5-알로라 나인테일',1],['2-5-엠페르트',1],['2-5-초염몽',1],['2-5-토대부기',1],['2-6-가이오가',1],['2-6-그란돈',1],['2-6-레시라무',1],['2-6-잠만보',1],['2-6-제크로무',1],['2-6-짜랑고우거',1],['2-6-코라이돈',1],['2-6-큐레무',1],['공통-S-따라큐',1],['공통-S-피카츄 (현장이벤트)',1]]);
/* ══ BEST-B — **전투태그B(★5 전용)** 용. 53보스 기준 (v3.21.0 에 ★5 전용으로 재계산).
   ⚠ **20장이다. 25장이 아니다.** 후보가 ★5 30장뿐이라 **21위부터 한계이득이 0** 이다 —
   더 담아도 격파 수도 피해도 안 는다. 화면 배지·안내는 `bestSet().size` 를 쓴다.
   **14장(루카리오)에서 2턴 격파 37/53 으로 포화**하고, 그 뒤 6장은 피해만 조금 보탠다.
   재계산은 `dev/best-b25.js`. ══ */
const BESTB25=new Bag([['1-5-거대코뿌리',1],['2-5-마기라스',1],['1-5-윈디',1],['2-5-초염몽',1],['1-5-글레이시아',1],['2-5-알로라 나인테일',1],['2-5-토대부기',1],['2-5-메타그로스',1],['2-5-갈가부기',1],['1-5-플라이곤',1],['2-5-님피아',1],['2-5-리피아',1],['2-5-엠페르트',1],['2-5-루카리오',1],['2-5-단지래플',1],['1-5-에이스번',1],['2-5-마휘핑',1],['1-5-피죤투',1],['1-5-피카츄',1],['2-5-에브이',1]]);
/* ══ BEST-C — **전투태그C(★4 전용)** 용. 후보 34장 · 보스 53개 (v3.22.0).
   ⚠ **10장이다.** 10장에서 2턴 격파 15/53 · 피해 44384(34장 전부의 86%) 에 이른다.
   16번째 격파는 **25장을 모아야** 얻어져 우선 확보 목록으로는 실익이 없다.
   ⚠⚠ **★4 는 기술 30종 중 28종이 위력 미상**이라 기본 100 으로 계산된 결과다 —
   A·B 판만큼 믿지 말 것. **위력이 실측되면 이 목록부터 다시 뽑는다.**
   재계산은 `dev/best-c25.js`. ══ */
const BESTC=new Bag([['1-4-만마드',1],['2-4-토대부기',1],['2-4-글레이시아',1],['1-4-모스노우',1],['1-4-리피아',1],['1-4-고릴타',1],['1-4-백솜모카',1],['1-4-인텔리레온',1],['1-4-포푸니라',1],['2-4-마스카나',1]]);

/* ══ 메가진화 — 에너지(=스탯)가 오르고, 폼에 따라 타입이 바뀌기도 한다.
   실측된 것만 채운다. 비어 있으면 보정 없이 원본 스탯으로 계산한다. ══ */
const MEGA={
  // e = 대성공 에너지, e2 = 성공 에너지(미측정이면 생략), t = 바뀌는 타입
  '1-6-리자몽':{e:144,t:['불꽃','드래곤'],n:'메가리자몽X'},  // 대성공 124 → 144, 비행 → 드래곤
  '1-5-피죤투':{e:118,n:'메가피죤투'},                       // 대성공 100 → 118 (2026-08-17 잭 실측)
  '1-6-거북왕':{e:144,n:'메가거북왕'},                       // 대성공 124 → 144 (2026-08-17 잭 실측)
  '2-6-가디안':{e:146,n:'메가가디안'}                        // 대성공 124 → 146 (2026-08-17 잭 실측)
  /* ⚠ 리자몽·거북왕 둘 다 원본 에너지가 124 라 헷갈리기 쉽다. **id 로 구분할 것.**
     타입 변화는 거북왕에서 관측되지 않아 비워 뒀다 (리자몽은 비행→드래곤). */
};
let megaTier='대성공';                     // 성공 / 대성공
const megaOf=c=>{
  const M=MEGA[c.id]; if(!M) return null;
  const e = megaTier==='대성공' ? M.e : M.e2;
  return {...M, e: e ?? null};             // 해당 등급 수치가 없으면 스탯 보정 없음
};

/* ══ 도감 — 공식 태그리스트 포스터 전사. 탄별 70종 + 레귤러 3종(탄 공통) = 73종.
   번호는 포스터 읽는 순서(좌상단 1 → 우하단 70)이고 등급 순으로 이어진다.
   ★6 1~10 · ★5 11~25 · ★4 26~42 · ★3 43~56 · ★2 57~70. 레귤러는 번호가 없다.
   ★4 이하는 스탯이 없어 수집 체크 전용이며 추천 계산에 들어가지 않는다. ══ */
const DEXLOW={
 '1-4':'고릴타,풀/에이스번,불꽃/인텔리레온,물/라이츄,전기/쥬피썬더,전기/에브이,에스퍼/리피아,풀/님피아,페어리/포푸니라,악·얼음/야도란,물·에스퍼/만마드,땅/가로막구리,노말·악/투구뿌논,벌레·전기/두트리오,노말·비행/백솜모카,풀/폭거북스,드래곤·불꽃/모스노우,벌레·얼음',
 '1-3':'나로테,풀/악뜨거,불꽃/아꾸왁,물/채키몽,풀/래비풋,불꽃/누겔레온,물/피카츄,전기/이브이,노말/포푸니,악·얼음/골루그,땅·고스트/머드나기,땅/가라르 직구리,악·노말/전지충이,벌레·전기/욱우지,비행·물',
 '1-2':'나오하,풀/뜨아거,불꽃/꾸왁스,물/홍나숭,풀/염버니,불꽃/울머기,물/데덴네,전기·페어리/골비람,땅·고스트/야돈,물·에스퍼/가라르 지그재구리,악·노말/턱지충이,벌레/두두,노말·비행/꼬모카,풀/누니머기,얼음·벌레',
 '2-4':'마스카나,풀·악/라우드본,불꽃·고스트/웨이니발,물·격투/토대부기,풀·땅/초염몽,불꽃·격투/엠페르트,물·강철/샤미드,물/부스터,불꽃/블래키,악/글레이시아,얼음/펄스멍,전기/피죤투,노말·비행/알로라 고지,얼음·강철/플라이곤,땅·드래곤/후딘,에스퍼/둥실라이드,고스트·비행/가디안,에스퍼·페어리',
 '2-3':'수풀부기,풀/파이숭이,불꽃·격투/팽태자,물/피죤,노말·비행/동탁군,강철·에스퍼/비브라바,땅·드래곤/패리퍼,물·비행/루주라,얼음·에스퍼/윤겔라,에스퍼/흔들풍손,고스트·비행/시마사리,독·물/토게데마루,전기·강철/킬리아,에스퍼·페어리/롱스톤,바위·땅',
 '2-2':'카르본,불꽃/드니차,드래곤·얼음/빠모,전기/모부기,풀/불꽃숭이,불꽃/팽도리,물/멍파치,전기/구구,노말·비행/알로라 모래두지,얼음·강철/동미러,강철·에스퍼/톱치,땅/갈모매,물·비행/캐이시,에스퍼/랄토스,에스퍼·페어리',
};
const DEXRANK=['6','5','4','3','2'];
const SETC={'1':'#FF5C86','2':'#5BB8FF'};   // 탄 테마 — 실물 라벨 숫자 색
/* 번호 순서 — 실물 태그 케이스 라벨 실측. 등급순이 아니라 진화 계열 순이다.
   1탄·2탄 모두 70번까지 채워져 있다. 빈칸이 생기면 번호 미확인으로 렌더된다. */
const DEXORD={
 '1':["뮤츠|6","뮤|6","자시안|6","자마젠타|6","마기라스|6","메타그로스|6","미라이돈|6","이상해꽃|6","리자몽|6","거북왕|6","샤미드|5","부스터|5","블래키|5","글레이시아|5","피죤투|5","팬텀|5","윈디|5","거대코뿌리|5","피카츄|5","플라이곤|5","고릴타|5","에이스번|5","인텔리레온|5","가로막구리|5","케르디오|5","나오하|2","나로테|3","뜨아거|2","악뜨거|3","꾸왁스|2","아꾸왁|3","홍나숭|2","채키몽|3","고릴타|4","염버니|2","래비풋|3","에이스번|4","울머기|2","누겔레온|3","인텔리레온|4","데덴네|2","피카츄|3","라이츄|4","이브이|3","쥬피썬더|4","에브이|4","리피아|4","님피아|4","포푸니|3","포푸니라|4","골비람|2","골루그|3","야돈|2","야도란|4","머드나기|3","만마드|4","가라르 지그재구리|2","가라르 직구리|3","가로막구리|4","턱지충이|2","전지충이|3","투구뿌논|4","두두|2","두트리오|4","꼬모카|2","백솜모카|4","폭거북스|4","욱우지|3","누니머기|2","모스노우|4"],
 '2':["가이오가|6","그란돈|6","코라이돈|6","피카츄|6","잠만보|6","짜랑고우거|6","가디안|6","레시라무|6","제크로무|6","큐레무|6","쥬피썬더|5","에브이|5","리피아|5","님피아|5","루카리오|5","토대부기|5","초염몽|5","엠페르트|5","알로라 나인테일|5","마기라스|5","메타그로스|5","애프룡|5","단지래플|5","마휘핑|5","갈가부기|5","마스카나|4","라우드본|4","웨이니발|4","카르본|2","드니차|2","빠모|2","모부기|2","수풀부기|3","토대부기|4","불꽃숭이|2","파이숭이|3","초염몽|4","팽도리|2","팽태자|3","엠페르트|4","샤미드|4","부스터|4","블래키|4","글레이시아|4","멍파치|2","펄스멍|4","구구|2","피죤|3","피죤투|4","알로라 모래두지|2","알로라 고지|4","동미러|2","동탁군|3","톱치|2","비브라바|3","플라이곤|4","갈모매|2","패리퍼|3","루주라|3","캐이시|2","윤겔라|3","후딘|4","흔들풍손|3","둥실라이드|4","시마사리|3","토게데마루|3","랄토스|2","킬리아|3","가디안|4","롱스톤|3"]
};
// 등급별 도감 항목 → [{no,n,t,card}] · no 가 null 이면 번호 미확인
const dexTypes=(s,r,n)=>{ const row=(DEXLOW[s+'-'+r]||'').split('/')
  .map(x=>x.split(',')).find(x=>x[0]===n); return row?row[1].split('·'):[]; };
const dexList=(s,r)=>{
  const out=[], seen=new Set();
  (DEXORD[s]||[]).forEach((slot,i)=>{ if(!slot) return;
    const [n,rr]=slot.split('|'); if(rr!==r) return;
    const card=(rr==='6'||rr==='5') ? POOL.find(p=>p.s===s&&p.r===rr&&p.n===n) : null;
    out.push({no:i+1,n,t:card?card.t:dexTypes(s,r,n),card}); seen.add(n); });
  if(r==='6'||r==='5') POOL.filter(p=>p.s===s&&p.r===r&&!seen.has(p.n))
    .forEach(p=>out.push({no:null,n:p.n,t:p.t,card:p}));
  else {
    (DEXLOW[s+'-'+r]||'').split('/').filter(Boolean).forEach(x=>{
      const [n,t]=x.split(','); if(seen.has(n)) return;
      out.push({no:null,n,t:t.split('·'),card:null}); });
  }
  return out;
};
const dexKey=(s,r,no,n)=> no ? s+'-'+r+'-'+no : s+'-'+r+'-@'+n;
// 지금 화면에 존재하는 수집 칸의 키 전부.
// 번호 체계나 키 형식을 바꾸면 예전 키가 dex 에 고아로 남아 «162/146» 처럼 분모를 넘는다.
// load 에서 이 집합으로 걸러낸다.
const dexValidKeys=()=>{
  const S=new Set();
  ['1','2'].forEach(st=>DEXRANK.forEach(r=>dexList(st,r)
    .forEach(it=>S.add(dexKey(st,r,it.no,it.n)))));
  POOL.filter(p=>p.s==='공통'&&(p.r==='R'||p.r==='S'))
    .forEach(c=>S.add('공통-'+c.r+'-@'+c.n));
  return S;
};
// 수집 전체 칸 수 — 1탄 70 + 2탄 70 + 공통(레귤러·스페셜) 6
const dexTotal=()=>dexValidKeys().size;
const dexPrune=()=>{ const V=dexValidKeys();
  const n=new Bag(); dex.forEach((v,k)=>{ if(V.has(k)) n.setCnt(k,v) }); dex=n; };

