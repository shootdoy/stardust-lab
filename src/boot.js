function renderDetail(){
  const v=document.getElementById('viewBattle'); if(!v)return;
  v.dataset.d=detail;
  document.querySelectorAll('.seg button').forEach(b=>{
    const lv=Number(b.dataset.lv);
    // 지역배틀 seg 에는 «태그»(0) 가 없다. 다른 모드에서 0 인 채로 오면 «상성» 을 눌린 것으로 본다.
    const on = lv===detail || (detail===0 && lv===1 && b.parentNode.id==='foeSeg');
    b.setAttribute('aria-pressed', on);
  });
}

function renderGuide(){
  const g=document.getElementById('guide'); if(g) g.hidden=guideHidden;
}

function renderDmax(){
  document.querySelectorAll('[data-dlv]').forEach(b=>
    b.setAttribute('aria-pressed', Number(b.dataset.dlv)===dmaxLv));
  const n=document.getElementById('dlvNote');
  if(!n) return;
  const ex=POOL.find(p=>p.n==='마기라스'&&p.s==='1');
  const k=DMAX_MUL[dmaxLv]??1;
  n.innerHTML = dmaxLv===0
    ? '다이맥스가 실패한 상태로 계산합니다. <b style="color:var(--ink)">다이맥스밴드</b>가 있으면 100% 성공하니 레벨을 골라 두세요.'
    : `에너지가 <b style="color:var(--ink)">×${k}</b> 오른 것으로 계산합니다.`
      + (ex?` 예: 마기라스 ${ex.e} → ${Math.round(ex.e*k)}`:'');
}

function renderMega(){
  document.querySelectorAll('[data-mg]').forEach(b=>
    b.setAttribute('aria-pressed', b.dataset.mg===megaTier));
  const n=document.getElementById('mgtNote'); if(!n) return;
  const known=Object.keys(MEGA).filter(k=>megaTier==='대성공'?MEGA[k].e:MEGA[k].e2).length;
  const total=POOL.filter(p=>p.g==='메가진화').length;
  n.innerHTML = `메가 태그 <b style="color:var(--ink)">${total}종</b> 중 `
    + `<b style="color:${known?'var(--ok)':'var(--bad)'}">${known}종</b>의 ${megaTier} 수치가 들어 있습니다.`
    + (known<total?' 나머지는 보정 없이 원본 스탯으로 계산합니다.':'');
}

function renderFoeSets(){
  const sw=document.getElementById('foeSetsSw'); if(!sw) return;
  sw.querySelectorAll('button').forEach(b=>
    b.setAttribute('aria-pressed', String(!!foeSets[b.dataset.fs])));
  const on=['1','2'].filter(k=>foeSets[k]);
  const n=FOEPOOL.filter(foeOn).length;
  document.getElementById('foeSetsNote').innerHTML =
    (on.length===2 ? '1·2탄이 함께 나옵니다' : on[0]+'탄만 나옵니다')
    + ` · 서브 후보 ${n}장 (레귤러는 탄과 무관하게 늘 포함)`
    + (on.length===1 ? ' · 마지막 하나는 끌 수 없습니다' : '')
    + '<br><b>상대 후보만 거릅니다 — 내가 가진 1탄 태그는 그대로 쓰고 추천에도 그대로 나옵니다.</b>';
}
function renderChance(){
  const rb=document.getElementById('chanceReset');
  if(rb) rb.textContent='기본값 ('+Object.values(CHANCE_DEFAULTS).join(' / ')+')';
  const host=document.getElementById('chanceRows'); if(!host)return;
  const meta={'일반':'기믹없음 - 공격룰렛+서포트룰렛 기대값',
    '메가진화':'메가진화 - 공격룰렛+서포트룰렛 기대값',
    '다이맥스':'다이맥스 - 공격룰렛+서포트룰렛 기대값',
    'Z기술':'Z기술 · 기술 입력 판정 · 평균값'};
  host.innerHTML='';
  Object.keys(CHANCE_DEFAULTS).forEach(k=>{
    const ic = GIMICON[k] ? `<i class="cgi ${GK[k]}"></i>` : `<span class="cgi cgi-n"></span>`;
    const row=el(`<div class="crow"><div class="cl">${ic}<span class="ct2">${k}<small>${meta[k]}</small></span></div>
      <div class="step"><button data-d="-5" aria-label="${k} 감소">−</button>
        <span class="val">+${chance[k]}</span>
        <button data-d="5" aria-label="${k} 증가">+</button></div></div>`);
    row.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('click',()=>{
      chance[k]=Math.max(0,Math.min(100,chance[k]+Number(b.dataset.d)));
      save(); renderAll();
    }));
    host.appendChild(row);
  });
  document.getElementById('vXct').textContent=
    `${chance['일반']}/${chance['메가진화']}/${chance['다이맥스']}/${chance['Z기술']}`;
}

/* ⚠⚠ `renderHCur()` 를 이 목록에서 빼지 말 것 (v3.48.4 · 잭 지적 «기록 탭이 또 안 나온다»).
   기록 탭(`#vH`)을 여닫는 코드는 `renderHCur()` 안에만 있고, 그 함수는 파스 시점에 한 번
   (`playRec` 이 아직 false 일 때) 그리고 사용자 조작 때만 불렸다. `load()` 가 playRec 을
   true 로 복원해도 **아무도 다시 그려 주지 않아** 탭이 감춰진 채로 남았다 —
   토글을 누르면 나타나고 새로고침하면 사라지는 증상이 이것이다.
   저장·복원은 처음부터 정상이었다 (저장값 playRec:true 를 잭이 콘솔로 확인). */
function renderAll(){
  renderTagClass();renderFoeSets();renderBosses();renderFoes();renderReadout();renderRotation();renderSupport();renderRank();renderRoster();renderDex();renderMyQR();renderTidSet();renderBackend();renderChance();renderDmax();renderMega();renderGuide();renderDetail();renderDock();renderHCur();
  document.getElementById('vCct').innerHTML=
    `<span>전투${tagClass} ${owned.size}/${classPool().length}</span><span>수집 ${dex.size}/${dexTotal()}</span>`;
  const bh=document.getElementById('b23ct');
  if(bh){                                  // BEST-25 는 25종 각 1장 — 중복 없음
    const BS=bestSet(), need=BS.size;
    const have=[...BS.keys()].filter(id=>owned.has(id)).length;
    bh.innerHTML=`<b>BEST-${tagClass}${need}</b> 핵심 태그 <b style="color:${have===need?'var(--ok)':'var(--star)'}">${have}/${need}</b>`
      +` · 53보스 전체 기준 · <b>${CLASSES[tagClass].label}(${CLASSES[tagClass].sub})</b> 용입니다`
      + (tagClass==='B' ? ' — 후보가 ★5 30장뿐이라 21위부터는 보탬이 없습니다'
       : tagClass==='C' ? ' — ★4 는 기술 위력이 대부분 미표기라 순위를 크게 믿지 마세요' : ''); }
}
const pickBoss=()=>{                       // 탄·등급을 바꾸면 그 그룹의 첫 보스로
  const f=bossRank==='R' ? BOSSES.find(b=>b.r==='R')
                         : BOSSES.find(b=>b.s===setView&&b.r===bossRank);
  if(f) setBoss(f.id);                     // 보스가 바뀌면 서브도 비운다
  save(); renderAll();
};
document.getElementById('sw1').addEventListener('click',()=>{setView='1'; pickBoss()});
document.getElementById('sw2').addEventListener('click',()=>{setView='2'; pickBoss()});
document.getElementById('sr6').addEventListener('click',()=>{bossRank='6'; pickBoss()});
document.getElementById('sr5').addEventListener('click',()=>{bossRank='5'; pickBoss()});
document.getElementById('srR').addEventListener('click',()=>{bossRank='R'; pickBoss()});
document.getElementById('dexFromOwn').addEventListener('click',()=>{
  // owned → dex 단방향 복사. dex 는 전투 계산에 영향을 주지 않는다.
  ['1','2'].forEach(s=>DEXRANK.forEach(r=>dexList(s,r).forEach(it=>{
    if(it.card && owned.has(it.card.id)) dex.setCnt(dexKey(s,r,it.no,it.n), owned.cnt(it.card.id)); })));
  POOL.filter(p=>p.s==='공통'&&(p.r==='R'||p.r==='S')&&owned.has(p.id))
    .forEach(c=>dex.setCnt('공통-'+c.r+'-@'+c.n, owned.cnt(c.id)));
  save(); renderDex();
});
document.getElementById('dexAll').addEventListener('click',()=>{
  const host=document.getElementById('dexHost');
  JSON.parse(host.dataset.keys||'[]').forEach(k=>{ if(!dex.has(k)) dex.setCnt(k,1) });
  save(); renderDex();
});
document.getElementById('dexClear').addEventListener('click',()=>{dex=new Bag();save();renderDex()});
document.getElementById('dexBestGo').addEventListener('click',()=>{
  if(dexCalcBusy) return;
  const n=dexBattleIds().length;
  if(!n){ renderDexBestMsg('수집 탭에서 가진 태그를 먼저 켜 주세요. ★4 이하는 스탯이 없어 제외됩니다.'); return; }
  renderDexBestMsg(`계산 중… 후보 ${n}장`);
  calcDexBest({
    step:(k,t)=>renderDexBestMsg(`계산 중… ${k} / ${t}`),
    done:(list,computed)=>{
      dexBest=new Bag(list);
      const nm=list.map(id=>POOL.find(p=>p.id===id).n).join(' · ');
      const head=computed
        ? `수집 ${dexBattleIds().length}장 중 <b>${list.length}장</b> 추천`
        : `수집한 ${list.length}장이 20장 이하라 전부 추천입니다`;
      renderDexBestMsg(`${head} · 1탄 ★5 보스를 뺀 35보스 기준<br>${nm}`);
      renderAll();
    }});
});
document.getElementById('dexBestOn').addEventListener('click',()=>{
  if(!dexBest||dexCalcBusy) return;
  owned=new Bag([...dexBest.entries?dexBest.entries():dexBest]); save(); renderAll();
});
document.getElementById('dexBestClr').addEventListener('click',()=>{
  if(dexCalcBusy) return;
  dexBest=null; renderDexBestMsg(''); renderAll();
});
/* 어디서 막히는지 알 수 있게 단계마다 문구를 남긴다.
   아티팩트 샌드박스에서는 파일 선택창 자체가 안 열릴 수 있다 (alert 이 막히는 것과 같은 이유).
   그 경우 «선택창이 열리지 않았습니다» 에서 멈춘다. */
let qrPicked=false;
const qrNote=t=>{ const n=document.getElementById('myqrNote'); if(n) n.textContent=t; };
function qrPick(){
  const inp=document.getElementById('qrFile'); if(!inp)return;
  qrPicked=false;
  qrNote('사진 선택창을 여는 중…');
  try{ inp.click(); }
  catch(e){ qrNote('이 환경에서는 사진을 열 수 없습니다. 배포된 주소에서 시도해 주세요.'); return; }
  setTimeout(()=>{ if(!qrPicked) qrNote(
    '선택창이 열리지 않았습니다. 미리보기(아티팩트)에서는 막혀 있을 수 있으니 배포된 주소에서 시도해 주세요.'); },2500);
}
document.getElementById('qrFileLab').addEventListener('click',qrPick);
document.getElementById('qrFile').addEventListener('change',ev=>{
  qrPicked=true;
  const f=ev.target.files&&ev.target.files[0];
  ev.target.value='';                                   // 같은 파일 다시 고를 수 있게
  if(!f){ qrNote('사진을 고르지 않았습니다.'); return; }
  const note=document.getElementById('myqrNote');
  qrNote(`사진을 읽는 중… ${Math.round(f.size/1024)}KB`);
  const fr=new FileReader();
  fr.onerror=()=>qrNote('사진을 읽지 못했습니다.');
  fr.onload=()=>{
    qrNote('이미지를 여는 중…');
    const img=new Image();
    img.onerror=()=>qrNote('이미지 형식을 읽지 못했습니다.');
    img.onload=async()=>{
      qrNote(`가공하는 중… ${img.width}x${img.height}`);
      let url;
      try{ url=qrProcess(img); }
      catch(e){ qrNote('사진을 처리하지 못했습니다: '+(e&&e.message||e)); return; }
      /* 어느 칸에 넣을지 — 설정에서 «등록» 을 누른 칸(qrTarget)이 있으면 거기,
         없으면 지금 플레이에서 고른 칸. 처음이면 tidCur 이 'main' 이라 **메인이 기본**이다. */
      const slot=qrTarget||tidCur; qrTarget=null;
      const prev=tidBag[slot]?{...tidBag[slot]}:null;
      tidBag[slot]={d:url, n:(prev&&prev.n)||''};
      qrNote(`저장하는 중… ${Math.round(url.length/1024)}KB`);
      const ok=await qrSave();
      if(!ok){
        if(prev) tidBag[slot]=prev; else delete tidBag[slot];
        tidSync(); renderMyQR(); renderTidSet();
        qrNote('저장하지 못했습니다. 저장 공간이 부족할 수 있습니다.'); return;
      }
      tidSync(); renderMyQR(); renderTidSet();
    };
    img.src=fr.result;
  };
  fr.readAsDataURL(f);
});
document.getElementById('ct1').addEventListener('click',()=>setColTab('battle'));
document.getElementById('ct2').addEventListener('click',()=>setColTab('dex'));
document.getElementById('rs1').addEventListener('click',()=>{rosterSet='1';renderRoster();renderDex()});
document.getElementById('rs2').addEventListener('click',()=>{rosterSet='2';renderRoster();renderDex()});
load().then(qrLoad).then(renderAll);

/* ══ 서비스워커 — 아트 캐싱·오프라인 (v3.51.0) ══
   v3.51.0 에서 아트를 파일로 뺀 뒤 «받으면 곧 오프라인» 이라는 성질이 깨졌다. 이걸로 되돌린다.
   ⚠ `https:` 에서만 등록한다 — file:// 로 열면 실패해 콘솔에 오류만 남는다.
   ⚠ 등록 URL 에 버전을 실어 보낸다. 버전이 바뀌면 브라우저가 새 워커로 보고 교체하고,
     워커는 그 값으로 캐시 이름을 만든다 — 버전을 두 곳에 적지 않으려는 것이다.
   ⚠ 아트 목록은 `TAGART` 하나만 정본이다. 워커에 목록을 복사해 두면 반드시 갈라진다.
   ⚠⚠ 워커는 `no-store` 요청을 가로채지 않는다 — 그게 «새 버전» 알림의 근거이기 때문이다.
       `docs/sw.js` 머리말 참고. 그 규칙을 풀면 사용자가 옛 판에 갇힌다. */
if(location.protocol==='https:' && 'serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js?v='+VERSION+'&m='+MEDIAV)
      .then(()=>navigator.serviceWorker.ready)
      .then(reg=>{ if(reg && reg.active) reg.active.postMessage({type:'warm',
          /* 아트 146장 + 고정 자산 3개. **목록의 정본은 여기 하나다** —
             워커에 베껴 적으면 갈라진다 (`docs/sw.js` 머리말 참고). */
          urls:TAGART.map(k=>'art/'+encodeURIComponent(k)+'.webp?v='+MEDIAV)
               .concat(ASSETS.map(f=>'asset/'+f+'?v='+MEDIAV))}); })
      .catch(()=>{});          // 등록 실패는 조용히 넘긴다 — 앱은 워커 없이도 다 동작한다
  });
}
