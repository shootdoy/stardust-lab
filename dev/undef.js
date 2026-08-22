// 호출되지만 정의되지 않은 식별자 탐지
const fs=require('fs');
const s=fs.readFileSync('../docs/index.html','utf8');
let js=s.split('<script>')[1].split('</script>')[0];
js=js.replace(/const (TAGIMG|TYPEICON|GIMICON)=\{[\s\S]*?\};/g,'const $1={};');
const defined=new Set();
for(const m of js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
// class 선언과 그 안의 메서드도 «정의된 것» 으로 본다
for(const m of js.matchAll(/class\s+([A-Za-z_$][\w$]*)/g)) defined.add(m[1]);
for(const m of js.matchAll(/^\s{2}(?:get\s+|static\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/gm)) defined.add(m[1]);
// Map 상속 메서드 (직접 정의하지 않고 물려받는 것)
['has','get','set','delete','forEach','keys','values','entries'].forEach(n=>defined.add(n));
for(const m of js.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) defined.add(m[1]);
const builtins=new Set(['Math','JSON','Object','Array','String','Number','Set','Map','Boolean',
  'encodeURIComponent','decodeURIComponent',   // v3.51.0 아트 URL 을 만들 때 쓴다
 'parseInt','parseFloat','isNaN','setTimeout','clearTimeout','requestAnimationFrame','Promise',
 'console','document','window','localStorage','if','for','while','switch','catch','return',
 'typeof','function','await','async','new','Date','RegExp','Error','decodeURIComponent',
 'super','constructor','Uint8Array','Float32Array','fetch','FileReader','Image']);
const called=new Set();
/* 앞 글자를 «ASCII 아닌 문자» 까지 배제한다. `\w` 는 ASCII 만 보므로 한글 바로 뒤의
   대문자가 호출로 잡힌다 — «전투태그A(★5·★6)» 의 A 가 그랬다 (v3.5.0).
   코드에서 식별자 앞에 한글이 오는 일은 없으니 배제해도 놓치는 것이 없다. */
for(const m of js.matchAll(/(?:^|[^.\w$\u0080-\uFFFF])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(m[1]);
const missing=[...called].filter(n=>!defined.has(n)&&!builtins.has(n));
console.log('정의된 함수/상수: '+defined.size);
console.log('호출되나 정의 없음:', missing.length?missing.join(', '):'없음');
/* CSS 함수 오탐 셋만 정상이다 (CLAUDE.md «검증 도구»). 그 밖의 이름이 나오면 진짜 누락이므로
   종료 코드로 알린다 — 안 그러면 dev/check.js 와 훅이 통과로 본다. */
const CSSFN=new Set(['var','gradient','rgba']);
process.exit(missing.some(n=>!CSSFN.has(n))?1:0);
 