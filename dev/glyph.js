
/* glyph.js — 제목에 쓰는 서브셋 폰트에 없는 글자를 잡는다.
 *
 * `--display` 는 Black Han Sans **서브셋**(한글 373자)이라 아무 글자나 못 쓴다.
 * 없는 글자는 조용히 대체 글꼴로 떨어져 **한 낱말 안에서 글꼴이 갈린다** —
 * v1.70.0 «상대별 대응» 의 «응» 이 그랬다. 눈으로만 보면 놓치기 쉬워 스크립트로 잡는다.
 *
 * woff2 를 직접 파싱하지 않는다 (직접 짠 파서가 틀렸다). 대신 **글리프 목록을 박아 두고**
 * 폰트 해시가 바뀌면 «목록을 다시 뽑으라»고 알린다. 다시 뽑는 법은 아래 REGEN 참고.
 *
 * ⚠ v3.52.0 부터 폰트는 `docs/asset/blackhansans.woff2` **파일**이다 (그 전에는 HTML 안
 *   base64). 해시는 **파일 바이트** 기준이라 base64 시절 값과 다르다 — 같은 폰트인데도.
 *
 * 실행:  node glyph.js
 */
const fs=require('fs'), crypto=require('crypto');
const html=fs.readFileSync(__dirname+'/../docs/index.html','utf8');
 
/* REGEN — 폰트를 바꾸면 이 두 줄을 다시 만든다.
   pip install fonttools brotli --break-system-packages
   python3 -c "
import hashlib
from fontTools.ttLib import TTFont
f='docs/asset/blackhansans.woff2'
cm=TTFont(f).getBestCmap()
print(''.join(sorted(chr(c) for c in cm if 0xAC00<=c<=0xD7A3)))
print(hashlib.sha256(open(f,'rb').read()).hexdigest()[:16])" */
const FONT_HASH='a44b6d6f95076678';
const HANGUL='가각간갈감갑값강같개거걸것게격계고곤골곳공과관교구권귤그글금급기까깎꺼께꽃끄끝나날낫내너넣네노논눈눌느는능니님닙닝다단닫당대더덜데도독돈돌동되됩두드등디따땅때뜬라란랐랑래랙랜랩략량러런럼레렉렌렛려력렬로록룡루룰류르른를름릅리릴림립마막만말맞매맥메멧면명모목몬못몽무문물뮤미믹바박반받발방배밴밸버번벌법벤벨별보본볼봉부북분불뷰브블비빠뿌뿐사산상새색샤섀서선설성세셀셋션셜소수순술숫슈스슬습시식신실쌍써썬썼쓰씀씁아악안않알암애액야약양어얼업없에엠연염영예오옥온옵와왕요용우운울움월위윈유율으은을음의이인일임입있자작잠장재저적전절점정제젠져조종죤주준줍중쥬즈증지직진질짐집징짜찌찔차찬참창천철체초최추축츄츠측치침카칼캐캔커컬케켓켜코큐크클키킹타탄탈탐태택탯터턴텀테텔토톤톰통투트특틀티틸파팩팬퍼펀펌페평포폭표풀풍프플피핑하한함합해행향허현화환회효후휘히';
 
const FONT=__dirname+'/../docs/asset/blackhansans.woff2';
if(!fs.existsSync(FONT)){
  console.log('★ 제목 폰트 파일이 없다: docs/asset/blackhansans.woff2'); process.exit(1); }
/* 파일이 있어도 **화면이 그것을 쓰는지**는 별개다 — @font-face 가 딴 곳을 가리키면
   폰트는 멀쩡한데 제목만 대체 글꼴로 떨어진다. 참조까지 확인한다. */
if(!html.includes('asset/blackhansans.woff2')){
  console.log('★ @font-face 가 그 폰트 파일을 안 가리킨다'); process.exit(1); }
const hash=crypto.createHash('sha256').update(fs.readFileSync(FONT)).digest('hex').slice(0,16);
if(hash!==FONT_HASH){
  console.log('★ 제목 폰트가 바뀌었다 ('+FONT_HASH+' → '+hash+')');
  console.log('  파일 위쪽 REGEN 주석대로 HANGUL/FONT_HASH 를 다시 뽑을 것');
  process.exit(1);
}
const have=new Set(HANGUL);
 
// 검사 대상: 정적 <h1>/<h2> + renderRotTitle 이 h2 에 넣는 문자열
const texts=[];
const body=html.slice(html.indexOf('<body'));
for(const h of body.matchAll(/<h([12])[^>]*>([\s\S]*?)<\/h\1>/g))
  texts.push(['정적 제목', h[2].replace(/<[^>]+>/g,'').trim()]);
const rt=html.match(/h2\.textContent\s*=[^;]+;/);
if(rt) for(const q of rt[0].matchAll(/'([^']+)'/g)) texts.push(['renderRotTitle', q[1]]);
 
let bad=0;
for(const [where,t] of texts){
  const miss=[...t].filter(c=>/[가-힣]/.test(c) && !have.has(c));
  if(miss.length){ bad++; console.log('  ★ '+where+' «'+t+'» — 폰트에 없는 글자: '+miss.join(' ')); }
}
console.log('제목 문구 '+texts.length+'건 · 서브셋 한글 '+HANGUL.length+'자');
console.log(bad ? '★ 글리프 누락 '+bad+'건 — 다른 낱말로 바꿀 것' : '제목 글리프 이상 없음');
process.exit(bad?1:0);
 