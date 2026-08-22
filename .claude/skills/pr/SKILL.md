---
name: pr
description: 스타더스트 랩의 PR 을 만든다. 이 저장소는 GitHub Pages 가 main 에서 서비스하므로 «PR 병합 = 즉시 배포» 다 — 계정·검증·버전·용량·유출을 배포 전 관문으로 확인하고 본문 초안을 짜서 확인받은 뒤 생성한다. 사용 - '/pr' 슬래시 명령 또는 사용자가 'PR 올려줘'·'PR 만들어줘' 를 명시적으로 요청했을 때. 금지 - 병합(gh pr merge)은 절대 자동으로 하지 않는다. 사용자가 요청하지 않은 상태에서 PR 을 제안하지 않는다.
---

# PR 스킬 — 스타더스트 랩용

## ⚠⚠ 이 저장소에서 «PR 병합» 은 «배포» 다

| | |
|---|---|
| GitHub Pages | `main` 브랜치 **루트**에서 서비스 |
| 공개 주소 | https://shootdoy.github.io/stardust-lab/ |
| CI | **없다.** 검증은 로컬 `dev/check.js` 뿐 |
| 실사용자 | 있다 (GA4 로 확인 · 모바일 100%) |

`main` 에 머지되는 순간 **실사용자에게 바로 나간다.** 되돌리려면 되돌림 커밋을 또 배포해야 하고,
iOS 홈 화면 웹앱은 캐시가 강해 **잘못된 판이 며칠 남는다.**

그리고 이 저장소는 **혼자 쓴다.** 그래서 PR 은 «리뷰 요청» 이 아니라
**«배포 직전 마지막 관문» + «변경 기록»** 이다. 리뷰어를 붙이지 않고, 스스로 점검한다.

## 언제 트리거되나

- 사용자가 `/pr` 을 입력했을 때
- 사용자가 «PR 올려줘» · «PR 만들어줘» 를 **명시적으로** 요청했을 때

작업 중에 «PR 만들까요?» 를 먼저 제안하지 않는다. 커밋 스킬과 같은 원칙이다.

## 워크플로우

### 1. 계정 확인 — 이것을 가장 먼저 한다

⚠ 이 머신에는 GitHub 계정이 **둘** 붙어 있다. 개인 `shootdoy`(저장소 소유자)와
회사 `jack-a-kakaoent`(쓰기 권한 없음). **틀린 계정이면 403 이 나고, 더 나쁘게는
PR 작성자가 회사 계정으로 남는다.**

```bash
gh auth status 2>&1 | grep -B2 'Active account: true'
printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | grep '^username'
```

`shootdoy` 가 아니면 **멈추고** 바꾼다.

```bash
gh auth switch --user shootdoy
```

2026-08-22 에 이걸 빼먹어 푸시가 403 으로 두 번 막혔다.
(`gh auth setup-git` 이 걸려 있어 git 도 gh 의 활성 계정을 따른다.)

### 2. 상태 파악

```bash
git status
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
git rev-parse --abbrev-ref HEAD
```

- **`main` 에서 직접 PR 을 만들 수 없다.** 브랜치에 있어야 한다
- 올릴 커밋이 없으면 «PR 로 만들 변경이 없다» 로 끝낸다
- 푸시가 안 돼 있으면 먼저 푸시한다 (`git push -u origin <브랜치>`)
- 이미 열린 PR 이 있으면 **새로 만들지 않고** 그것을 알린다: `gh pr list --head <브랜치>`

### 3. 배포 전 점검 (`index.html` 이 바뀌었을 때만)

`git diff --stat origin/main..HEAD` 에 `docs/index.html` 이 있으면 **전부** 확인한다.

⚠ 생성물이므로 **`src/` 변경과 짝**이어야 한다. 한쪽만 있으면 멈추고 `node dev/build.js` 를 돌린다.
CI 가 없으므로 **여기가 유일한 관문이다.**

```bash
node dev/check.js                                              # 다섯 검사 (2초 안팎)
grep -rn 'name="version"\|const VERSION=\|const BUILT=' src/   # meta→index.html · 상수→data.js
grep -n '^- 버전:' CLAUDE.md          # ← sync.js 가 문서와 코드를 대조한다
wc -c docs/index.html      # sync.js 예산 — index.html 480KB · 아트 포함 합계 900KB
```

| 볼 것 | 기준 |
|---|---|
| `check.js` | 다섯 검사 전부 통과 (exit 0) |
| `VERSION` **네 곳** | `<meta name="version">` · `const VERSION` · `const BUILT` · **`CLAUDE.md` 의 «- 버전:»** 이 같은 값 |
| `BUILT` | **오늘 날짜.** sync.js 는 «있는지» 만 보고 날짜는 못 본다 |
| 파일 크기 | 900KB 아래 (v3.48.2 실측 785KB · 803,706바이트) |

⚠ `grep` 에 네 번째로 잡히는 `t.match(/const VERSION='([^']+)'/)` 는 `checkUpdate` 의
감지 코드다. **버전 값이 아니다.**

버전이 안 올라가 있으면 **사용자에게 먼저 알린다** — 어떤 값으로 올릴지는 잭이 정한다.
버전을 안 올리고 배포하면 **앱의 새 버전 알림이 뜨지 않아** 사용자가 옛 화면에 갇힌다.

### 4. 공개 저장소다 — 유출 확인

이 저장소는 **PUBLIC** 이고, `CLAUDE.md` · `notes/` · `data/` 는 **일부러 빼 뒀다**
(2026-08-22 잭 지정). `git add -f` 로 우회하면 다시 들어갈 수 있으니 diff 로 확인한다.

```bash
git diff --name-only origin/main..HEAD | grep -E '^(CLAUDE\.md|notes/|data/)' \
  && echo '★ 멈춘다 — 제외 대상이 들어 있다' || echo '깨끗'
git diff origin/main..HEAD | grep -inE 'jack\.a|kakaoent\.com|api[_-]?key|secret|Bearer |ghp_' | head
```

⚠ **PR 본문도 공개된다.** 연구 노트·실측 원자료·기계 관찰을 본문에 붙여넣지 않는다 —
결론만 한 줄로 적는다. 트레이너 ID·QR 은 어떤 경우에도 넣지 않는다.

### 5. PR 본문 초안

제목은 커밋 규칙과 같다 — **Conventional Commits + 한국어, 60자 이내, 마침표 없음.**
커밋이 하나면 그 제목을 그대로 쓴다.

```markdown
## 무엇
- (불릿 2~4개. 파일 목록이 아니라 «바뀐 동작»)

## 왜
(한두 문장. 실측·잭 지정이 근거면 그것을 적는다)

## 검증
- `dev/check.js` 다섯 검사 통과
- VERSION 3.49.0 · BUILT 2026-08-22 (네 곳 일치)
- index.html 782KB (예산 900KB)

## 배포 영향
(사용자 화면이 어떻게 달라지는가. 없으면 «없음 — 도구·문서만»)
```

- **`index.html` 이 안 바뀐 PR 은 «검증»·«배포 영향» 을 «해당 없음» 으로 줄인다**
  (도구·스킬·설정만 바뀐 경우)
- 파일 목록을 나열하지 않는다 — PR 의 Files 탭에 이미 있다

### 6. 사용자 확인

제목과 본문을 보여주고 **명시적 승인**을 받는다. 승인 없이 만들지 않는다.

### 7. 생성

**반드시 HEREDOC** 로 본문을 넘긴다.

```bash
gh pr create --base main --title "feat: …" --body "$(cat <<'EOF'
## 무엇
…
EOF
)"
```

- `--base main` 을 **명시한다** (기본 브랜치가 바뀌어도 안전하게)
- 리뷰어·어사이니·라벨은 붙이지 않는다 — 혼자 쓰는 저장소다
- `--draft` 는 잭이 요청할 때만
- 만든 뒤 URL 을 보여준다

### 8. 병합은 하지 않는다

⚠⚠ **`gh pr merge` 를 자동으로 실행하지 않는다.** 병합이 곧 배포이고,
그 판단은 잭의 것이다. «PR 만들어줘» 는 «배포해줘» 가 아니다.

잭이 «머지해줘» · «배포해줘» 라고 **따로** 말했을 때만 병합한다. 그때도:

- 병합 방식은 잭에게 묻는다 (squash / merge / rebase). 기본값을 가정하지 않는다
- ⚠ **`--admin` 으로 보호 규칙을 우회하지 않는다**

## 병합 후 확인 (잭이 병합했다면)

배포 반영에 1~2분 걸린다. 그 뒤 **실제 배포본의 버전**을 확인한다.

```bash
curl -s --max-time 15 https://shootdoy.github.io/stardust-lab/ \
  | grep -o 'name="version" content="[^"]*"'
```

- **meta 태그로 확인한다** — `const VERSION` 으로 grep 하면 `checkUpdate` 의
  정규식까지 잡혀 두 줄이 나온다
- 옛 버전이 나오면 아직 반영 전이다. 잠시 뒤 다시 본다
- ⚠ **브라우저에서 옛 화면이 보이는 것은 정상이다** — iOS 홈 화면 웹앱은 HTML 을
  강하게 캐시한다. 앱이 스스로 감지해 «새 버전» 알림을 띄운다.
  GitHub Pages 는 커스텀 헤더를 못 걸어 이 감지가 유일한 수단이다.
  **캐시를 이유로 다른 원인을 찾지 말 것**

## 금지 사항

| 금지 | 이유 |
|---|---|
| 계정 확인 없이 진행 | 회사 계정으로 PR 이 만들어진다 (403 을 두 번 겪었다) |
| 사용자 확인 없는 PR 생성 | 항상 초안을 보여주고 승인 받는다 |
| `gh pr merge` 자동 실행 | 병합 = 실사용자에게 배포 |
| `gh pr merge --admin` | 보호 규칙 우회 |
| PR 본문에 연구 노트·실측 원자료 | 공개된다. 결론만 적는다 |
| `CLAUDE.md`·`notes/`·`data/` 가 든 PR | 일부러 뺀 것이다 (잭 지정) |
| `index.html` 이 바뀌었는데 버전 그대로 | 앱의 새 버전 알림이 안 뜬다 |
| 리뷰어 지정 | 혼자 쓰는 저장소다 |
| `main` 에서 PR 생성 시도 | 브랜치가 필요하다 |

## 예시

### `index.html` 이 바뀐 PR

```markdown
## 무엇
- 여파 계산을 대상마다 그 카드 기준으로 다시 낸다
- 매치 그리드에 대상별 내역을 적는다 («여파 86 · 가이오가 29 · 뜨아거 57»)

## 왜
v3.17.0 은 활성 피해를 대기 전원에게 복사했다 — 상성·방어가 활성 상대 것이라
보스와 다른 서브가 같은 값을 받았다. 실측 3판이 «최대 HP 의 비율» 을 가리킨다.

## 검증
- `dev/check.js` 다섯 검사 통과
- VERSION 3.49.0 · BUILT 2026-08-22 (네 곳 일치)
- index.html 783KB (예산 900KB)

## 배포 영향
매치 그리드의 여파 숫자가 달라진다. 추천 순위도 일부 바뀐다.
```

### 도구만 바뀐 PR

```markdown
## 무엇
- `/commit` · `/edit` · `/pr` 스킬 추가

## 왜
커밋·편집·배포 절차가 CLAUDE.md 산문에 흩어져 매번 기억에 의존했다.

## 검증
해당 없음 — `index.html` 무변경

## 배포 영향
없음 — 도구·설정만
```
