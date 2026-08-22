/* ══ 내 QR ══
   사용자가 찍은 QR 사진을 캔버스로 가공해 이 기기에만 저장한다.
   원본 폰 사진은 1.5~5MB 라 그대로 넣으면 localStorage(약 5MB)가 한 장으로 찬다.
   가운데 정사각 크롭 → 512px 축소 → Otsu 이진화 → 흰 여백 → 무손실 압축 하면 3~4KB 다.
   실측: 트레이너 QR 사진 1.49MB → 3.6KB(WebP), 가공 후에도 판독 성공.
   적응형 이진화는 노이즈가 끼어 용량이 두 배가 되므로 쓰지 않는다.
   저장은 QKEY 로 분리한다 — 본 저장값에 섞으면 태그 하나 켤 때마다 이미지까지 다시 쓴다. */
const QR_SIZE=512, QR_QUIET=32;
function otsu(hist,total){                    // 클래스 간 분산이 최대인 임계값
  let sum=0; for(let i=0;i<256;i++) sum+=i*hist[i];
  let sumB=0,wB=0,best=0,thr=127;
  for(let t=0;t<256;t++){
    wB+=hist[t]; if(!wB) continue;
    const wF=total-wB; if(!wF) break;
    sumB+=t*hist[t];
    const mB=sumB/wB, mF=(sum-sumB)/wF, v=wB*wF*(mB-mF)*(mB-mF);
    if(v>best){best=v;thr=t}
  }
  return thr;
}
/* QR 자리 자동 탐색 — 흑백 전환이 촘촘한 8px 블록을 모아 가장 큰 덩어리를 고른다.
   멀리서 찍어 QR 이 작게 잡히면 가운데 정사각 크롭만으로는 모듈이 뭉개져 판독이 깨진다.
   실측: 주변을 3배 덧댄 사진에서 크롭 없이는 판독 실패, 이 방식을 쓰면 성공. */
function qrLocate(img,side){
  const N=256, B=8, n=N/B;
  const c=document.createElement('canvas'); c.width=c.height=N;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingQuality='high';
  x.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,N,N);
  const p=x.getImageData(0,0,N,N).data, g=new Uint8Array(N*N), hist=new Array(256).fill(0);
  for(let i=0,k=0;i<p.length;i+=4,k++){
    const v=(p[i]*299+p[i+1]*587+p[i+2]*114)/1000|0; g[k]=v; hist[v]++;
  }
  const t=otsu(hist,N*N);
  const b=new Uint8Array(N*N);
  for(let i=0;i<g.length;i++) b[i]=g[i]>t?1:0;
  // 블록별 전환 수
  const act=new Float32Array(n*n); let mx=0;
  for(let by=0;by<n;by++) for(let bx=0;bx<n;bx++){
    let a=0;
    for(let y=by*B;y<(by+1)*B;y++) for(let X=bx*B;X<(bx+1)*B-1;X++)
      if(b[y*N+X]!==b[y*N+X+1]) a++;
    for(let X=bx*B;X<(bx+1)*B;X++) for(let y=by*B;y<(by+1)*B-1;y++)
      if(b[y*N+X]!==b[(y+1)*N+X]) a++;
    act[by*n+bx]=a; if(a>mx) mx=a;
  }
  if(!mx) return null;
  const on=new Uint8Array(n*n);
  for(let i=0;i<act.length;i++) on[i]=act[i]>=mx*0.35?1:0;
  // 가장 큰 연결 덩어리 (4방향 flood fill)
  const seen=new Uint8Array(n*n); let best=null;
  for(let i=0;i<n*n;i++){
    if(!on[i]||seen[i]) continue;
    const st=[i]; seen[i]=1; let x0=n,y0=n,x1=-1,y1=-1,cnt=0;
    while(st.length){
      const k=st.pop(), kx=k%n, ky=(k/n)|0; cnt++;
      if(kx<x0)x0=kx; if(kx>x1)x1=kx; if(ky<y0)y0=ky; if(ky>y1)y1=ky;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const nx=kx+dx, ny=ky+dy;
        if(nx<0||ny<0||nx>=n||ny>=n) return;
        const j=ny*n+nx; if(on[j]&&!seen[j]){seen[j]=1;st.push(j)}
      });
    }
    if(!best||cnt>best.cnt) best={cnt,x0,y0,x1,y1};
  }
  if(!best||best.cnt<4) return null;
  const cx=(best.x0+best.x1+1)/2*B, cy=(best.y0+best.y1+1)/2*B;
  const half=Math.max(best.x1-best.x0+1,best.y1-best.y0+1)/2*B*1.04;   // 여유 최소
  const sc=side/N;
  return {cx:cx*sc, cy:cy*sc, half:half*sc};
}
function qrProcess(img){
  const S=QR_SIZE, Q=QR_QUIET;
  let side=Math.min(img.width,img.height);
  let sx=(img.width-side)/2, sy=(img.height-side)/2;
  const loc=qrLocate(img,side);
  if(loc){                                   // QR 자리를 찾았으면 그쪽만 잘라 쓴다
    const h=Math.min(loc.half, side/2);
    sx += Math.max(0,Math.min(side-2*h, loc.cx-h));
    sy += Math.max(0,Math.min(side-2*h, loc.cy-h));
    side = 2*h;
  }
  const c=document.createElement('canvas'); c.width=c.height=S;
  const x=c.getContext('2d',{willReadFrequently:true});
  x.imageSmoothingQuality='high';
  x.drawImage(img,sx,sy,side,side,0,0,S,S);
  const d=x.getImageData(0,0,S,S), p=d.data, hist=new Array(256).fill(0);
  for(let i=0;i<p.length;i+=4){
    const g=(p[i]*299+p[i+1]*587+p[i+2]*114)/1000|0;
    p[i]=p[i+1]=p[i+2]=g; hist[g]++;
  }
  const t=otsu(hist,S*S);
  for(let i=0;i<p.length;i+=4){
    const v=p[i]>t?255:0; p[i]=p[i+1]=p[i+2]=v; p[i+3]=255;
  }
  x.putImageData(d,0,0);
  const o=document.createElement('canvas'); o.width=o.height=S+Q*2;
  const ox=o.getContext('2d');
  ox.fillStyle='#fff'; ox.fillRect(0,0,o.width,o.height);
  ox.drawImage(c,Q,Q);
  let url=o.toDataURL('image/webp');          // Safari 16 미만은 webp 인코딩을 못 한다
  if(url.slice(0,15)!=='data:image/webp') url=o.toDataURL('image/png');
  return url;
}
function tidSync(){ myqr = (tidBag[tidCur] && tidBag[tidCur].d) || null; }
async function qrSave(){
  try{
    const j=JSON.stringify({v:2,cur:tidCur,bag:tidBag});
    if(backend==='claude'){ const r=await window.storage.set(QKEY,j); return !!r; }
    if(backend==='local'){ localStorage.setItem(QKEY,j); return true; }
  }catch(e){ return false; }
  return backend==='memory';        // 저장 없이 이번 세션만 유지
}
async function qrLoad(){
  let raw=null;
  try{
    if(backend==='claude'){ const r=await window.storage.get(QKEY); raw=JSON.parse(r.value); }
    else if(backend==='local'){ const r=localStorage.getItem(QKEY); if(r) raw=JSON.parse(r); }
  }catch(e){ raw=null; }
  tidBag={}; tidCur='main';
  if(raw && raw.v===2){
    tidBag = (raw.bag&&typeof raw.bag==='object') ? raw.bag : {};
    if(raw.cur && TIDS.some(t=>t.k===raw.cur)) tidCur=raw.cur;
  } else if(raw){
    /* 예전 형식 이관 — 문자열 · 배열[{n,d}] · {d,id} 를 전부 «메인» 칸으로 옮긴다.
       **이관을 지우지 말 것** — 기존 사용자의 트레이너 ID 가 통째로 사라진다. */
    let d = Array.isArray(raw) ? (raw.length ? (raw[0].d||null) : null)
          : (typeof raw==='object' ? (raw.d||null) : raw);
    if(typeof d==='string' && d) tidBag.main={d,n:''};
  }
  tidSync();
}
function tidCard(){
  const inner = myqr
    ? `<span class="q"><img src="${myqr}" alt="트레이너 ID QR코드"></span>`
    : `<span class="ph">탭해서<br>QR 사진 등록</span>`;
  return `<button class="tidc" style="--tidbg:url(${TIDBG})"
    aria-label="트레이너 ID 카드">${inner}</button>`;
}
let qrTarget=null;    // 설정에서 «등록» 을 누른 칸 (한 번 쓰고 비운다)
const tidLab=k=>{
  const t=TIDS.find(x=>x.k===k)||{lab:k};
  const n=tidBag[k]&&tidBag[k].n;
  return n ? n : t.lab;
};
/* ── 트레이너 ID 별 «스타 포켓몬 리스트» (v3.42.0) ──
   기계 화면과 같은 구성: 슈퍼 스타(★6) · 스타(★5) 를 갈라 격자로 보여 준다.
   상태 3단계: 0 미출현(«?») → 1 출현(그림) → 2 포획(그림+몬스터볼). 탭할 때마다 돈다.
   ID 마다 따로 저장된다 (`tidBag[k].dex`) — «이 ID 가 무엇을 가졌나» 를 알아야
   교환 이벤트의 «미보유 우대» 가설을 잴 수 있다.
   ⚠ 앱의 «컬렉션 → 수집 도감»(`dex`) 과는 **다른 것**이다. 그쪽은 기기 하나의 소장 기록이고
   이쪽은 ID 별 출현/포획 이력이다. 합치지 말 것. */
let tdxKey=null, tdxSet='1';
const tdxList=(set,r)=>POOL.filter(p=>p.s===set&&p.r===r);
const tdxCellKey=p=>p.s+'-'+p.r+'-'+p.n;
function tidDexCount(k){
  const d=(tidBag[k]&&tidBag[k].dex)||{};
  const v=Object.values(d);
  return {seen:v.filter(x=>x>=1).length, got:v.filter(x=>x===2).length};
}
function openTidDex(k){
  tdxKey=k; tdxSet=rosterSet||'1';
  document.getElementById('tdxModal').hidden=false;
  renderTidDex();
}
function closeTidDex(){
  const m=document.getElementById('tdxModal'); if(m) m.hidden=true;
  tdxKey=null; renderTidSet();
}
function renderTidDex(){
  const body=document.getElementById('tdxBody'); if(!body||!tdxKey)return;
  document.getElementById('tdxHead').textContent=tidLab(tdxKey)+' · 스타 포켓몬 리스트';
  document.querySelectorAll('#tdxSet button').forEach(b=>
    b.setAttribute('aria-pressed', b.dataset.s===tdxSet));
  const store=(tidBag[tdxKey]&&tidBag[tdxKey].dex)||{};
  body.innerHTML='';
  [['6','슈퍼 스타 포켓몬'],['5','스타 포켓몬']].forEach(([r,lab])=>{
    const list=tdxList(tdxSet,r);
    if(!list.length) return;
    const seen=list.filter(p=>(store[tdxCellKey(p)]||0)>=1).length;
    body.appendChild(el(`<div class="tdxh"><b>${lab}</b><span>${seen} / ${list.length}</span></div>`));
    const g=document.createElement('div'); g.className='tdxg';
    list.forEach(p=>{
      /* 아트는 **CSS 클래스(artCls)로 심어 둔 `var(--art)`** 를 쓴다 (v3.42.1 정정).
         TAGIMG 값은 base64 «원문» 이라 url() 에 그대로 넣으면 안 나온다 —
         DOM 에 base64 를 중복으로 박지 않으려는 기존 설계다. **직접 넣지 말 것.** */
      const key=tdxCellKey(p), st=store[key]||0, ac=artCls(p);
      const c=el(`<button class="tdxc" data-st="${st}" aria-label="${hEsc(p.n)}">`
        +(ac?`<span class="im ${ac}"></span>`:'')
        +(st===0?`<span class="qm">?</span>`:'')
        +(st===2?`<span class="bl"></span>`:'')
        +`<span class="nm">${hEsc(p.n)}</span></button>`);
      c.addEventListener('click',async()=>{
        const nx=((store[key]||0)+1)%3;
        const bag=Object.assign({d:null,n:''},tidBag[tdxKey]);
        bag.dex=Object.assign({},bag.dex);
        if(nx===0) delete bag.dex[key]; else bag.dex[key]=nx;
        tidBag[tdxKey]=bag;
        await qrSave(); renderTidDex();
      });
      g.appendChild(c);
    });
    body.appendChild(g);
  });
}
document.getElementById('tdxX').addEventListener('click',closeTidDex);
document.getElementById('tdxModal').addEventListener('click',ev=>{
  if(ev.target===document.getElementById('tdxModal')) closeTidDex();
});
document.querySelectorAll('#tdxSet button').forEach(b=>
  b.addEventListener('click',()=>{ tdxSet=b.dataset.s; renderTidDex(); }));

/* 설정의 5칸 목록 — 별명 고치기 · 등록/교체 · 삭제 */
function renderTidSet(){
  const host=document.getElementById('tidSet'); if(!host)return;
  host.innerHTML='';
  TIDS.forEach(t=>{
    const has=!!(tidBag[t.k]&&tidBag[t.k].d);
    const row=document.createElement('div'); row.className='tidrow';
    const dcnt=tidDexCount(t.k);
    row.innerHTML=`<span class="tk">${hEsc(t.lab)}</span>`
      +`<button class="topen" data-a="dex" aria-label="${hEsc(t.lab)} 스타 포켓몬 리스트">`
      +`  <span class="tq${has?'':' none'}"${has?` style="background-image:url(${tidBag[t.k].d})"`:''}></span>`
      +`  <span><span class="tn">${hEsc(tidLab(t.k))}</span><br>`
      +`  <span class="tc">${dcnt.seen?`출현 ${dcnt.seen} · 포획 ${dcnt.got}`:'리스트 보기'}</span></span>`
      +`</button>`
      +`<input type="text" maxlength="12" placeholder="별명" aria-label="${hEsc(t.lab)} 별명"
         value="${hEsc((tidBag[t.k]&&tidBag[t.k].n)||'')}">`
      +`<button class="mini" data-a="reg">${has?'교체':'등록'}</button>`
      +(has?`<button class="mini hdanger" data-a="del">삭제</button>`:'');
    row.querySelector('input').addEventListener('input',async ev=>{
      const v=ev.target.value.slice(0,12);
      tidBag[t.k]=Object.assign({d:null,n:''},tidBag[t.k],{n:v});
      await qrSave(); renderTidPick();
    });
    row.querySelectorAll('button').forEach(b=>b.addEventListener('click',async()=>{
      if(b.dataset.a==='dex'){ openTidDex(t.k); return; }
      if(b.dataset.a==='reg'){ qrTarget=t.k; qrPick(); return; }
      delete tidBag[t.k];
      if(tidCur===t.k) tidCur='main';
      await qrSave(); tidSync(); renderTidSet(); renderTidPick(); renderMyQR();
    }));
    host.appendChild(row);
  });
}
/* 플레이 화면의 선택 줄 — 등록된 칸이 둘 이상일 때만 보인다 */
function renderTidPick(){
  const box=document.getElementById('tidPick'); if(!box)return;
  const keys=TIDS.map(t=>t.k).filter(k=>tidBag[k]&&tidBag[k].d);
  box.hidden = keys.length<2;
  if(box.hidden){ box.innerHTML=''; return; }
  box.innerHTML='';
  keys.forEach(k=>{
    const b=document.createElement('button');
    b.textContent=tidLab(k);
    b.setAttribute('aria-pressed', k===tidCur);
    b.addEventListener('click',async()=>{
      tidCur=k; tidSync(); await qrSave();
      renderTidPick(); renderMyQR();
    });
    box.appendChild(b);
  });
}
function renderMyQR(){
  renderTidPick();
  const host=document.getElementById('myqr'); if(!host)return;
  host.innerHTML='';
  const lab=document.getElementById('qrFileLab');
  if(lab) lab.textContent = myqr ? '다시 등록' : '사진에서 등록';
  const c=el(tidCard());
  c.addEventListener('click',()=>{
    myqr ? openMyQR() : qrPick();          // 등록 전에는 탭으로 바로 사진 선택
  });
  host.appendChild(c);
  const n=document.getElementById('myqrNote');
  if(n) n.textContent = myqr
    ? `${tidLab(tidCur)} · 약 ${Math.round(myqr.length/1024)}KB · 이 기기에만 저장됩니다`
    : 'QR 이 화면을 꽉 채우도록 찍으면 잘 읽힙니다 · 이 기기에만 저장됩니다';
}
function openMyQR(){
  const m=document.getElementById('qrModal'); if(!m||!myqr)return;
  document.getElementById('qrHead').hidden=false;
  document.getElementById('qrCard').hidden=true;
  const img=document.getElementById('qrImg');
  img.hidden=false; img.src=myqr; img.alt='트레이너 ID QR코드';
  const th=document.getElementById('qrThumb');
  th.className='qrth'; th.style.background=`#fff url(${myqr}) center/contain no-repeat`;
  document.getElementById('qrName').textContent='트레이너 ID';
  document.getElementById('qrSub').textContent='이 기기 저장';
  document.getElementById('qrNote').textContent='게임 시작 때 기기로 스캔하세요';
  m.hidden=false;
}

function openQR(s){
  const m=document.getElementById('qrModal'); if(!m)return;
  document.getElementById('qrHead').hidden=false;
  document.getElementById('qrImg').hidden=false;
  document.getElementById('qrCard').hidden=true;
  document.getElementById('qrNote').textContent='배틀이 시작되기 전에 기기로 스캔하세요';
  const th=document.getElementById('qrThumb');
  th.className='qrth '+(SK[s.n]||'');
  th.style.background = SUPIMG[s.n]?`var(--art) center/cover`
       :`linear-gradient(135deg,${COLOR[s.t]}CC,rgba(12,7,34,.9))`;
  document.getElementById('qrName').textContent=s.n;
  document.getElementById('qrSub').textContent=`${s.mv} · ${s.t} · 서포트 티켓`;
  document.getElementById('qrImg').src='data:image/webp;base64,'+QRIMG[s.n];
  document.getElementById('qrImg').alt=s.n+' 서포트 티켓 QR코드';
  m.hidden=false;
}
function closeQR(){const m=document.getElementById('qrModal'); if(m) m.hidden=true}

function renderSupport(){
  const host=document.getElementById('sup'); if(!host)return;
  const boss=POOL.find(p=>p.id===bossId);
  const list=SUPPORT.map(s=>({...s,x:eff(s.t,boss.t)})).sort((a,b)=>b.x-a.x);
  const top=list[0].x, low=list[list.length-1].x;
  const flat=(top===low);                       // 셋 다 같을 때만 차이 없음
  const best=list.filter(s=>s.x===top);
  host.innerHTML='';
  list.forEach(s=>{
    const bg=SUPIMG[s.n]?`var(--art) center/cover`
                :`linear-gradient(135deg,${COLOR[s.t]}CC,rgba(12,7,34,.9))`;
    const n=el(`<div class="sline${!flat&&s.x===top?' best':''} ${SK[s.n]||''}" role="button" tabindex="0">
      <span class="sth" style="background:${bg}">
        <i class="si ${TK[s.t]}" title="${s.t}"></i>
      </span>
      <span class="sn"><b>${s.n}</b><span>${s.mv} · ${s.t}</span></span>
      <span class="sx ${mc(s.x)}">×${s.x}<small>주는 피해</small></span>
    </div>`);
    n.addEventListener('click',()=>openQR(s));
    n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openQR(s)}});
    host.appendChild(n);
  });
  const raw=best.map(s=>s.n).join(' · ');
  const wrap=t=>`<b style="color:var(--ink)">${raw}</b>${t}`;
  const n=document.getElementById('supNote');
  if(!n) return;
  n.innerHTML =
    flat ? `세 장 모두 ×${top}입니다. ${top>1?'어느 것을 써도 약점을 찌릅니다.':top===1?'아무거나 써도 차이가 없습니다.':'어느 것을 써도 반감됩니다.'}`
    : top>1  ? `${wrap(bat(raw)?'이':'가')} 약점을 찌릅니다. 티켓이 있으면 이걸 쓰세요.`
    : top===1? `약점을 찌르는 티켓은 없습니다. 그나마 반감되지 않는 ${wrap(bat(raw)?'을':'를')} 쓰세요.`
    :          `세 장 다 반감됩니다. 그중 덜 깎이는 ${wrap(bat(raw)?'이':'가')} 낫습니다.`;
}

function renderRank(){
  const ct=document.getElementById('rankCt');
  if(ct) ct.textContent='상위 '+RANK_N;
  const boss=POOL.find(p=>p.id===bossId);
  let L=ranked(boss);
  if(rankSort==='dmg') L=[...L].sort((a,b)=>b.dmg-a.dmg);
  const R=L.slice(0,RANK_N), n=document.getElementById('rank');
  document.querySelectorAll('.ranksort button').forEach(x=>
    x.setAttribute('aria-pressed', x.dataset.sort===rankSort));
  const note=document.getElementById('sortNote');
  if(note) note.innerHTML = (rankSort==='score'
    ? '화력에 받는 피해까지 반영한 순위. 약점을 찔리는 태그는 순위가 내려갑니다.'
    : '예상 피해만으로 정렬. 내구는 보지 않으니 한 방 넣고 쓰러져도 상위에 옵니다.')
    + ' 이 순위는 <b style="color:var(--ink)">한 장씩 따로</b> 잰 값입니다.'
    + ' 기믹은 배틀당 한 번뿐이라, 로테이션에서는 <b style="color:var(--ink)">일반</b> 화력으로 밀릴 수 있고,'
    + ' <b style="color:var(--bad)">3대 ✗</b> 표식이 붙은 태그는 이 보스의 공격 3대를 못 버텨'
    + ' 순위가 높아도 로테이션에서 빠집니다.';
  if(!R.length){n.innerHTML=`<p class="empty">상단의 <b>컬렉션</b> 탭에서 태그를 켜면 순위가 나옵니다.</p>`;return}
  n.innerHTML=R.map((r,i)=>{const dead=!survives3(r.c,boss);
    return `<div class="rline${dead?' dead':''}">
    <span class="ix">${i+1}</span>
    <span class="who">
      <span class="wtop">
        <span class="st6" style="color:${RARITY[r.c.r].color}">★${r.c.r}</span>
        <span class="n">${r.c.n}</span>
        <span class="badge b-set">${r.c.s==='공통'?'공통':r.c.s+'탄'}</span>
        ${dead?'<span class="b3x">3대 ✗</span>':''}
      </span>
      <span class="wbot">${r.c.t.map(tp).join('')}${r.move&&r.move.tagx?gm(r.move.tagx):''}</span>
    </span>
    <span class="rside">
      <b class="rd">${Math.round(r.dmg)}</b>
      ${(()=>{ if(!(r.move&&r.move.tagx)) return '';
        const alt=r.c.mv.filter(m=>!m.tagx).map(m=>evalMove(r.c,boss,m)).sort((x,y)=>y.dmg-x.dmg)[0];
        return `<span class="rdn">일반 ${alt?Math.round(alt.dmg):'—'}</span>`;
      })()}
      <span class="nums">
        <span style="color:${r.mult>=2?'var(--ok)':r.mult===1?'var(--star)':'var(--bad)'}">공×${r.mult}</span>
        <span style="color:${r.d<1?'var(--ok)':r.d>1?'var(--bad)':'var(--ink-dim)'}">피×${r.d}</span>
      </span>
    </span></div>`;}).join('');
}

/* ══ 수집 기준 추천-25 (BEST-A25 의 «내가 가진 것만» 판) ══
   수집(dex) 체크한 태그 중에서 다시 뽑는다. `buildSeq` 가 보유 장수의 세제곱이라
   정확 탐욕은 후보 56장에서 Node 14초 · 폰은 그 몇 배다. 그래서 2단계로 나눈다.
     1) 단독 기여도(보스별 한 장만 놓고 최고 피해)로 후보를 26장까지 좁힌다 — 20ms
     2) 좁힌 후보로 정확 탐욕을 돌리되 한 단계마다 화면에 양보한다
   후보가 20장 이하면 계산 없이 전부가 답이다.
   지연 탐욕(lazy greedy)은 쓰지 말 것 — 탈진·기믹 제약 탓에 한계이득 감소가
   성립하지 않아 결과가 7% 나빠진다. 실제로 재봤다. */
