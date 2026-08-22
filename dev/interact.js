const fs=require('fs'),vm=require('vm');
const s=fs.readFileSync('../release/index.html','utf8');
const js=s.split('<script>')[1].split('</script>')[0];
const all=[];
const mk=(tag)=>{const n={tag,children:[],attrs:{},h:{},_html:'',
  set innerHTML(v){this._html=v;this.children=[]},get innerHTML(){return this._html},
  get firstElementChild(){const c=mk('div');all.push(c);return c},
  set textContent(v){this._t=v},get textContent(){return this._t||''},
  setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]},
  addEventListener(t,f){(this.h[t]=this.h[t]||[]).push(f)},
  appendChild(c){this.children.push(c);return c},
  querySelector(){const c=mk('div');all.push(c);return c},
  querySelectorAll(){return []},
  get dataset(){return this.attrs},classList:{add(){},remove(){}},
  hidden:true,src:'',getBoundingClientRect:()=>({top:120,height:56}),style:{},
  click(){(this.h.click||[]).forEach(f=>f())}};
  all.push(n); return n};
const nodes={}; const get=id=>nodes[id]||(nodes[id]=mk('div'));
['bossGrid','readout','rot','rotNote','rank','roster','backend','bossHint','sw1','sw2',
 'tabA','tabB','chanceRows','vCct','vXct','guide','guideX','brand','viewBattle','rankBox',
 'chanceReset','resetOwn','clearOwn','sortNote','rs1','rs2','ownHint','vB','vC','vX',
 'viewCollection','viewChance','qrModal','qrClose','qrThumb','qrName','qrSub','qrImg','sup','supNote','ver','ftg','fct','preset16','preset26','dock','upd','updV','updGo','sr6','sr5','ct1','ct2','colBattle','colDex','dexHost','dexHint','dexFromOwn','dexAll','dexClear','dexBestGo','dexBestOn','dexBestClr','dexBestMsg','myqr','qrFile','qrFileLab','myqrNote','qrHead','qrCard','qrNote','wipeBtn','wipeAsk','wipeYes','wipeNo','modeNote',
 // v1.82.0 서브 선택 팝업. **최상위에서 addEventListener 를 거는 id 는 반드시 여기 넣을 것** —
 // 스텁의 getElementById 는 목록에 없으면 null 을 주고, 그 자리에서 스크립트가 통째로 죽는다.
 'foeModal','foePickX','foePickH','foeLanes','foeQ','srR',
 // v3.31.0 실측 기록 — 최상위에서 getElementById 하는 id 전부
 'vH','vHct','viewHist','hSaveBtn','hNote',
 'hList','hCt','hStat','hCopy','hFromPlay','hSrc','hPlaySave','hPlayNote','sPlayRecTop','sPlayRecBot','hs2-g','playRecSw','hWipeBtn','hWipeAsk','hWipeN','hWipeYes','hWipeNo','hEditCancel',
 'hModal','hPickX','hPickH','hGrid','hPickHint','hRank','hSet','hQ','verNow','verMaj','verMin','verPat','verBuild','tidSet','tidPick','tdxModal','tdxX','tdxSet','tdxBody','tdxHead','hs-g','hs-g2','hs2-g2','hs-s1','hs-b','hs-s2'].forEach(get);
const store={};
const sb={console,JSON,Math,Array,Set,Map,String,Object,Number,setTimeout,clearTimeout,
  location:{protocol:'about:',pathname:'/',hash:''},
  window:{scrollY:40,scrollTo(){},confirm:()=>false,matchMedia:()=>({matches:false}),
          storage:{get:async()=>{throw 0},set:async(k,v)=>{store[k]=v}}},
  document:{getElementById:id=>nodes[id]||null,querySelector:()=>mk('div'),
            querySelectorAll:()=>[],createElement:tag=>mk(tag),addEventListener(){},head:mk(),body:mk()},
  localStorage:{setItem(k,v){store[k]=v},getItem:k=>store[k]??null,removeItem(k){delete store[k]}}};
sb.globalThis=sb; vm.createContext(sb);
vm.runInContext(js+`
globalThis.__load=load; globalThis.__all=renderAll;
globalThis.__fixture=()=>{                 // 테스트 기준 컬렉션: 1탄 ★6 10장
  owned=new Bag(POOL.filter(p=>p.s==='1'&&p.r==='6').map(p=>p.id));
  renderAll(); return owned.total;
};`,sb);
(async()=>{
  await sb.__load(); sb.__all();
  console.log('기준 컬렉션: 1탄 ★6 '+sb.__fixture()+'장');
  const fire=(node,label,errs)=>{ try{ node.click() }catch(e){ errs.push(label+' → '+e.message) } };
  const errs=[];
  // 보스 카드 전부 클릭
  let n=0;
  for(let pass=0;pass<2;pass++){
    for(const c of [...nodes.bossGrid.children]){ n++; fire(c,'보스카드#'+n,errs); }
    // 탄 전환
    fire(nodes.sw1,'1탄 전환',errs); sb.__all();
    for(const c of [...nodes.bossGrid.children]){ n++; fire(c,'보스카드#'+n,errs); }
    fire(nodes.sw2,'2탄 전환',errs); sb.__all();
  }
  // 모드/뷰/기타
  ['tabA','tabB','vB','vC','vX','guideX','brand','resetOwn','clearOwn','chanceReset',
   // v3.31.0 실측 기록 — 보스 없이 저장(막힘 경로) → 일괄(빈 입력) → 복사 → 전체 삭제 왕복
   'vH','hFromPlay','hSaveBtn','hEditCancel','hPlaySave','hCopy','hWipeBtn','hWipeYes','hWipeBtn','hWipeNo','hPickX']
    .forEach(id=>fire(nodes[id],id,errs));
  // 서포트 티켓 3장 클릭 → QR 팝업
  let k=0;
  for(const c of [...nodes.sup.children]){ k++; fire(c,'서포트#'+k,errs);
    if(!errs.length){
      console.log('   팝업 → '+nodes.qrName.textContent+' / '+nodes.qrSub.textContent
        +' / QR '+(String(nodes.qrImg.attrs.src||nodes.qrImg.src||'').startsWith('data:image/webp')?'있음':'★없음')
        +' / hidden='+nodes.qrModal.hidden);
    }
    fire(nodes.qrClose,'닫기',errs);
  }
  // 컬렉션 칩
  let m=0;
  for(const c of [...nodes.roster.children]) { m++; fire(c,'컬렉션#'+m,errs); }
  console.log('발화한 클릭: 보스 '+n+'회, 서포트 '+k+'회, 컬렉션 '+m+'회, 기타 10종');
  console.log('오류: '+(errs.length?errs.length+'건':'0건'));
  errs.slice(0,8).forEach(e=>console.log('   ★ '+e));
  process.exitCode = errs.length ? 1 : 0;          // 훅·check.js 가 이 값으로 가른다
})().catch(e=>{ console.log('치명적:',e.message); process.exitCode=1; });
