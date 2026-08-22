/* histmode.js — 기록 탭의 «판 종류를 바꿔도 값이 살아 있는가» 를 본다.
 *
 * 왜 따로 있나 — 이 버그가 v3.47 부터 v3.55 까지 **8판을 살아남았다.**
 * 실전에서 이렇게 걸렸다 (잭): L 자리에 선물·상대를 넣고 게임 중, R 에서 스페셜이 떠서
 * L 이 수락 → 판 종류만 지역배틀에서 스페셜태그배틀로 바꿨는데 **넣어 둔 선물이 사라지고
 * 지난번 값이 떠 있었다.** 원인은 스페셜 전용 드래프트(LR)로 갈아치우는 구조였다.
 *
 * `dev/sync.js` 는 코드 «모양» 을 지키지만 **동작** 은 못 본다. `dev/interact.js` 는
 * 스텁의 querySelectorAll 이 빈 배열이라 판 종류 핸들러가 아예 등록되지 않는다.
 * 그래서 이 시험이 필요하다 — 버튼을 실제로 만들어 핸들러를 붙이고 눌러 본다.
 *
 * ⚠ 고친 뒤 v3.55.0 판(`git show <옛커밋>:docs/index.html`)으로 돌려 **실패하는지** 확인했다.
 *   통과만 하는 시험은 시험이 아니다 — 실제로 «선물이 유지된다 → null» 로 잡혔다.
 *
 * 실행:  node histmode.js
 */
const fs=require('fs'),vm=require('vm');
const s=fs.readFileSync(__dirname+'/../docs/index.html','utf8');
const js=s.split('<script>')[1].split('</script>')[0];
const all=[];
const mk=(tag,attrs={})=>{const n={tag,children:[],attrs,h:{},_html:'',
  set innerHTML(v){this._html=v;this.children=[]},get innerHTML(){return this._html},
  get firstElementChild(){const c=mk('div');all.push(c);return c},
  set textContent(v){this._t=v},get textContent(){return this._t||''},
  setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},
  addEventListener(t,f){(this.h[t]=this.h[t]||[]).push(f)},
  appendChild(c){this.children.push(c);return c},
  querySelector(){const c=mk('div');all.push(c);return c},
  querySelectorAll(){return []},
  closest(){return null},
  get dataset(){return this.attrs},classList:{add(){},remove(){},toggle(){}},
  hidden:true,src:'',getBoundingClientRect:()=>({top:120,height:56}),style:{},
  click(){(this.h.click||[]).forEach(f=>f())}};
  all.push(n); return n};
const nodes={};
/* 이 시험은 «id 누락» 을 보는 게 아니라 동작을 본다 — 없는 id 는 그때그때 만들어 준다.
   (id 누락은 dev/interact.js 가 엄격하게 잡는다) */
/* ★ 여기가 핵심 — 판 종류 버튼을 실제로 만들어 핸들러가 붙게 한다 */
const hModeBtns=['지역','다맥','스페셜'].map(m=>mk('button',{m}));
const store={};
const sb={console,JSON,Math,Array,Set,Map,String,Object,Number,Date,setTimeout,clearTimeout,
  location:{protocol:'about:',pathname:'/',hash:''},
  window:{scrollY:40,scrollTo(){},confirm:()=>false,matchMedia:()=>({matches:false}),
          addEventListener(){},storage:{get:async()=>{throw 0},set:async(k,v)=>{store[k]=v}}},
  document:{getElementById:id=>nodes[id]||(nodes[id]=mk('div')),querySelector:()=>mk('div'),
    querySelectorAll:sel=> sel==='#hMode button' ? hModeBtns : [],
    createElement:tag=>mk(tag),addEventListener(){},head:mk(),body:mk()},
  localStorage:{setItem(k,v){store[k]=v},getItem:k=>store[k]??null,removeItem(k){delete store[k]}}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(js+`
globalThis.__load=load;
globalThis.__peek=()=>({cur:hCur, active:hActiveP, drafts:Object.keys(hDrafts)});
globalThis.__set=(k,v)=>{ hCur[k]=v; };
`,sb);
(async()=>{
  await sb.__load();
  const ok=[], bad=[];
  const t=(name,cond,got)=>{ (cond?ok:bad).push(name+(cond?'':'  → '+JSON.stringify(got))); };

  t('드래프트는 L·R 둘뿐', JSON.stringify(sb.__peek().drafts)==='["L","R"]', sb.__peek().drafts);

  // ── L 자리에 선물과 상대를 넣는다 (게임 중)
  sb.__set('g',{n:'따라큐',r:'S'});
  sb.__set('s1',{n:'피카츄',r:'5'});
  sb.__set('b',{n:'뮤츠',r:'6'});
  sb.__set('s2',{n:'윈디',r:'5'});
  const before=JSON.parse(JSON.stringify(sb.__peek().cur));
  t('넣은 값이 들어갔다', before.g && before.g.n==='따라큐' && before.m==='지역', before);

  // ── 스페셜을 수락 → 판 종류만 바꾼다
  hModeBtns.find(b=>b.attrs.m==='스페셜').click();
  const after=sb.__peek().cur;

  t('판 종류가 스페셜로 바뀐다', after.m==='스페셜', after.m);
  t('★ 선물이 유지된다', after.g && after.g.n==='따라큐', after.g);
  t('보스가 유지된다', after.b && after.b.n==='뮤츠', after.b);
  t('서브1 이 유지된다', after.s1 && after.s1.n==='피카츄', after.s1);
  t('서브2 가 유지된다', after.s2 && after.s2.n==='윈디', after.s2);
  t('자리(L)가 그대로', after.p==='L', after.p);
  t('드래프트가 안 갈렸다', sb.__peek().active==='L', sb.__peek().active);

  // ── 되돌려도 유지되는가
  hModeBtns.find(b=>b.attrs.m==='지역').click();
  const back=sb.__peek().cur;
  t('되돌려도 선물 유지', back.m==='지역' && back.g && back.g.n==='따라큐', back);

  ok.forEach(n=>console.log('  통과  '+n));
  bad.forEach(n=>console.log('  ★ 실패 '+n));
  console.log('\n  '+ok.length+'통과 · '+bad.length+'실패');
  process.exit(bad.length?1:0);
})();
