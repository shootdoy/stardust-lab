/* hist.js — 앱 «전체 복사» 로 뽑은 기록 텍스트를 읽어 분석용 배열로 만든다.
 *
 * 형식 (v3.38.0):
 *   «# 8/20 · 1.0.4.39608.ko.»  날짜·기기 버전 헤더 (바뀔 때만 나온다 — 뒤 줄에 이어서 적용)
 *   «L 선물 서브1 보스 서브2 [겟] [플레이|관전]»   못 본 칸은 ?
 *   «LR 스페셜태그배틀 제크로무6 겟 [플레이]»
 *
 * 실행:  node hist.js [파일]   (기본 ../data/hist.txt)
 */
const fs=require('fs'), path=require('path');
const FILE=process.argv[2]||path.join(__dirname,'..','data','hist.txt');

function parse(text){
  const out=[]; let day=null, gver=null;
  text.split('\n').forEach((raw,ln)=>{
    const line=raw.trim();
    if(!line) return;
    if(line.startsWith('#')){                       // 헤더 — 이후 줄에 적용된다
      line.slice(1).split('·').map(x=>x.trim()).filter(Boolean).forEach(x=>{
        if(/^\d+\/\d+$/.test(x)) day=x; else gver=x;
      });
      return;
    }
    /* 이름에 공백이 들어가는 태그가 있다 («알로라 고지»·«알로라 나인테일»·
       «가라르 지그재구리»·«피카츄 (현장이벤트)»). 성급 숫자가 붙은 낱말을 경계로 삼아
       앞의 조각들을 도로 붙인다 — 안 그러면 «알로라» 로 잘려 성급을 잃는다. */
    let t=line.split(/\s+/).reduce((acc,w)=>{
      const prev=acc[acc.length-1];
      const isTail=/[2-6R]$/.test(w)||w==='?'||w==='겟';
      if(prev && !/[2-6R]$/.test(prev) && prev!=='?' && prev!=='겟'
         && !/^(L|R|LR)$/.test(prev) && !/^\[/.test(prev) && isTail
         && !/^(스페셜태그배틀|다이맥스포켓몬|다이맥스|지역배틀)$/.test(prev)){
        acc[acc.length-1]=prev+' '+w; return acc;
      }
      acc.push(w); return acc;
    },[]);
    let src=null;
    t=t.filter(w=>{
      if(w==='[플레이]'){src='play';return false}
      if(w==='[관전]'){src='watch';return false}
      return true;
    });
    let got=false;
    t=t.filter(w=>{ if(w==='겟'){got=true;return false} return true });
    let p='?';
    if(/^(L|R|LR)$/.test(t[0])) p=t.shift();
    /* 선물은 판 종류와 무관하게 «위치 바로 뒤» 에 온다 (v3.43.0) —
       예: «LR 빠모2 스페셜태그배틀 제크로무6 겟». 모드 낱말을 찾아 그 앞을 선물로 본다. */
    /* 판 종류 낱말은 v3.45.0 부터 **모든 줄**에 있다 (지역배틀 포함).
       그 전 줄에는 지역배틀 표기가 없으므로, 낱말이 없으면 지역으로 보고 옛 자리대로 읽는다. */
    let m='지역', gift=null, gift2=null, hasMode=false;
    const mi=t.findIndex(w=>/^(스페셜태그배틀|다이맥스포켓몬|다이맥스|지역배틀)$/.test(w));
    if(mi>=0){
      hasMode=true;
      m = t[mi]==='스페셜태그배틀' ? '스페셜' : (t[mi]==='지역배틀' ? '지역' : '다맥');
      /* 모드 낱말 앞에 남은 것은 선물뿐이다. 스페셜은 **양쪽이 각각 받으므로 둘**이 온다
         (v3.44.0): «LR 빠모2 킬리아3 스페셜태그배틀 제크로무6 겟» */
      /* v3.47.0 부터 스페셜도 **L·R 각각 한 줄**이라 선물이 하나다.
         그 전 줄에는 «LR 선물L 선물R 스페셜태그배틀 …» 처럼 둘이 있었다 — 그대로 읽는다. */
      if(mi>0) gift=t[0];
      if(mi>1 && m==='스페셜') gift2=t[1];
      t=t.slice(mi+1);
    }
    /* 이름 대조는 **공백을 지우고** 한다 (v3.46.0) — 내보내기가 «가라르직구리3» 로 나가고,
       옛 줄에는 «가라르 직구리3» 처럼 공백이 있다. 둘을 같은 것으로 봐야 한다.
       `nk` 가 대조용 열쇠다 — 분석 스크립트는 이 값을 쓸 것. */
    const tag=w=>{
      if(!w||w==='?') return null;
      const mm=w.match(/^(.+?)([2-6R])$/);
      const o = mm?{n:mm[1],r:mm[2]}:{n:w,r:''};
      o.nk=o.n.replace(/\s+/g,'');
      return o;
    };
    const e={ln:ln+1,day,gver,p,m,src,got};
    if(m==='지역'){
      if(hasMode){ e.g=tag(gift); [e.s1,e.b,e.s2]=[tag(t[0]),tag(t[1]),tag(t[2])]; }
      else       { [e.g,e.s1,e.b,e.s2]=[tag(t[0]),tag(t[1]),tag(t[2]),tag(t[3])]; }  // 옛 형식
      e.g2=null;
    } else { e.g=tag(gift); e.g2=tag(gift2); e.s1=e.s2=null; e.b=tag(t[0]); }
    out.push(e);
  });
  return out;
}

if(require.main===module){
  const rows=parse(fs.readFileSync(FILE,'utf8'));
  console.log('읽은 판: '+rows.length);
  const f=t=>t?t.n+'★'+(t.r||'?'):'—';
  rows.forEach((e,i)=>{
    console.log(`  ${String(i+1).padStart(3)} ${e.day||'?'} ${e.p.padEnd(2)} ${e.m.padEnd(4)} `
      +(e.m==='지역'
        ? `선물 ${f(e.g).padEnd(12)} 서브1 ${f(e.s1).padEnd(12)} 보스 ${f(e.b).padEnd(12)} 서브2 ${f(e.s2)}`
        : `보스 ${f(e.b)}`)
      +` · ${e.got?'겟':'노겟'} · ${e.src==='play'?'플레이':'관전'}`);
  });
  const empty=rows.filter(e=>!e.g&&!e.s1&&!e.b&&!e.s2).length;
  const vers=[...new Set(rows.map(e=>e.gver).filter(Boolean))];
  console.log(`\n비어 있는 판 ${empty} · 기기 버전 ${vers.join(', ')||'없음'}`);
}
module.exports={parse};
