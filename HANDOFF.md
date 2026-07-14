# 카피바라고 채팅 로그 프로토타입 — 인수인계 문서

> 다음 작업 AI를 위한 핸드오프. 이 문서 + 아래 "시작 프롬프트"만 읽으면 이어서 작업할 수 있습니다.

## 0. 이 프로젝트가 뭔가
모바일 게임 **카피바라고(Capybara Go)**를 실제 플레이 영상 3편 + 기획 문서로 리버스 엔지니어링해서,
그중 **하단 채팅 로그 파트만** 재현한 데이터 기반 프로토타입입니다.
(상단 비주얼 액션 = 캐릭터 주행/턴제 전투/타격 이펙트는 의도적으로 범위 밖)

핵심 철학 — **모든 게임 밸런스/텍스트/연출값은 CSV에서 읽는다. 하드코딩 금지.**
코드는 "규칙 엔진"이고, 숫자·문구·아이콘·색은 전부 `data/*.csv`에 있습니다.

향후 이 자료는 **"수스"(기존)와 "시드라"(신규)** 두 프로젝트로 분리될 공용 수집 단계입니다.

## 1. 실행 방법
```bash
cd C:\chatsystem
npm install
npm run dev        # Vite dev server → http://localhost:5173
npx tsc --noEmit   # 타입체크 (커밋 전 필수)
```
- Vite + 바닐라 TypeScript, 프레임워크 없음.
- `vite.config.ts`의 `publicDir: "data"` 덕분에 CSV가 `/xxx.csv`로 서빙됨.

## 2. 아키텍처 (파일별 역할)
```
src/
  csv.ts      CSV 파서 + loadCsv(name) fetch
  data.ts     loadGameData() — 19개 CSV 병렬 로드 → GameData 객체
  types.ts    모든 인터페이스 (EffectDef, SkillDef, MinigameRewardRow, PlayerState ...)
  rng.ts      weightedPick, randInt, chance
  engine.ts   순수 로직: 롤 파이프라인, applyEffectId, checkLevelUp, checkMilestones ...
  effects.ts  DOM 애니메이션: scrambleReveal, rollBanner (⚠️ setInterval 사용, rAF 금지)
  main.ts     오케스트레이션 + 모든 UI 렌더 (~920줄, 가장 큰 파일)
  style.css   다크 폰프레임 UI
data/*.csv    19개 데이터 테이블 (아래 3번)
```

### "다음날" 롤 파이프라인 (engine.ts)
1. `rollIsCombat` — `progression_phase_config`의 combat_weight로 전투 여부
2. 비전투면 `rollContentType` — `content_type_config` (직접보상/지역/분기/무등급)
3. 직접보상/지역이면 `rollGrade` — `grade_config` (대박/중박/운빨망함/보너스)
4. `rollDailyEntry` 등 — 등급별 풀에서 구체 텍스트+효과 결정
- 모든 효과는 `effect_config`(SSoT)를 FK로 참조. `applyEffectId(data, state, effectId)` 하나가 전부 처리.

## 3. 데이터 테이블 (data/ — 19개)
| 파일 | 역할 | 주요 컬럼 |
|---|---|---|
| effect_config | **모든 효과의 SSoT** | effect_id, effect_type(STAT_PCT/STAT_ABS/CURRENCY/SKILL_GRANT/SKILL_UPGRADE), target, value, icon, description |
| grade_config | 대박/중박/운빨망함/보너스 | weight, banner_color, is_negative |
| content_type_config | 콘텐츠 타입 가중치 | weight |
| progression_phase_config | 일차 구간별 전투 빈도 | day_start/end, combat_weight |
| event_text_pool | 날짜무관 텍스트 풀 | text_id, category(DAILY/UNGRADED/LOCATION/COMBAT/BRANCH), grade_id, body |
| daily_roll_pool | 직접보상 콘텐츠 | pool_id, grade_id, text_id, effect_id, weight |
| daily_pool_bonus_effects | 대박 복합보상(효과 다중) | pool_id → effect_id (다대다) |
| location_config | 지역도착 | entry_path(DIRECT/BRANCH_ROUTE), grade_id, linked_effect_id, linked_minigame_id, milestone_id |
| branch_config | 분기선택 | subtype, option_a/b_label/effect/prob, cost_effect_id |
| minigame_config | 미니게임 4종 | type(CARD_MATCH/SLOT/SQUARE_ROULETTE/CIRCLE_ROULETTE), attempt_limit |
| minigame_reward_pool | 미니게임 보상 | effect_id, weight, **label, color, action(NORMAL/RESPIN)** |
| combat_trigger_config | 전투 보상 | tier(NORMAL/MINIBOSS/FINALBOSS), gold/exp min-max |
| levelup_config | 레벨별 스킬지급 | skill_grant_mode(CHOICE_3/AUTO), skill_pool_tier, hp_heal_pct, exp_to_next |
| skill_config | 스킬 정의 | tier(일반/전설/신화/미확인), is_upgrade, icon, effect_text |
| gauge_config | 대박/중박 누적게이지 | cap, icon, reward_minigame_id |
| milestone_config | 깃발수집 라이브이벤트 | currency, tier1/2_effect, tier1/2_at |
| currency_config | 재화바 표시목록 | state_key, icon, always_show |
| passive_item_config | 패시브 아이템 | effect_type, effect_value, owned_at_start |
| ui_text_config | **모든 UI 문구** | key → text (`{변수}` 템플릿) |

## 4. 지금까지 구현된 시스템 (전부 동작 + 타입체크 통과)
- ✅ 일일판정 4단계 롤 파이프라인
- ✅ 전투 3티어 (일반/정예=신화스킬상자/최종보스=고대계승) + "이동 중" 페이즈
- ✅ 분기 서브타입: AVOID_CHALLENGE, COST_CHOICE, PREVIEW_DECLINE, PARTIAL_REVEAL, BETTING(누가이길지 내러티브), SUCCESS_FAIL, STAT_CHOICE(천사), FINAL_CHALLENGE(도전자), SKILL_SWAP(고블린상인)
- ✅ 스킬 3택1 (탭→패널 오픈 방식), 레벨업 스킬, 부활(온사망) 조건부 발동
- ✅ 미니게임 4종 **데이터 구동 렌더러**: 원형룰렛(SVG휠)/슬롯(3릴)/보물파내기(3×4카드)/상자오픈인트로 + RESPIN(룰렛다시)
- ✅ 대박 복합보상(스탯%+골드), 게이지→보너스 미니게임
- ✅ 마일스톤(깃발수집 보상), 재화바(별조각/사료/깃발/계승), 지역 entry_path
- ✅ 챕터/최고기록 메타(localStorage) + "새 챕터 시작" 다회차
- ✅ 패시브아이템(모험가훈장 → 시작스킬 등급)
- ✅ 연출: 슬라이드업 버튼, 클릭 시 외곽 링 회전, 부정판정 카드 쉐이크, 등급배너 슬롯연출

## 5. 확률값에 대한 중요한 주의 ⚠️
`weight` 컬럼 숫자는 **실제 게임 확률이 아니라 잠정 추정치**입니다.
- 영상은 원리적으로 정확한 %를 못 줌 (표본 부족).
- 현재 등급 weight(대박20/중박42/운빨28/보너스10)와 전투빈도(초반28%)는 **영상 2·3편 재집계 상대빈도**로 맞춘 것.
- `data/README.md`에도 명시됨. 실제 밸런스 확정 시 이 숫자만 교체.

## 6. 남은 작업 / 미해결 (다음 AI가 판단)
1. **전투 고정일차 가능성** — 영상 2·3편 모두 6·8·9·11·15·19일차에 전투가 몰렸음. 확률이 아니라 **일차 고정 배치**일 강한 정황. 지금은 확률 방식. → 구조 변경이라 사용자 확인 필요.
2. **런 길이** — 60일 상한이지만 최종보스(25~30일)를 이기면 즉시 챕터 종료. 도전자 브랜치는 day≥24부터 등장하도록 되어있음.
3. **비-골드 재화의 소비처(sink) 없음** — 별조각/사료/계승은 모으기만 하고 쓸 데 없음. 카피바라 원작엔 상점/육성이 있을 것.
4. **미니게임 매핑 재확인** — 영상의 "행운의 보물"(골드3릴)과 데이터의 mg_slot(신화스킬룰렛) 명칭이 다소 엇갈림. 어느 지역/게이지가 어느 미니게임인지 재대조 여지.
5. **LV3 스킬 등급** — 영상2/3이 신화/일반로 엇갈려 확정 못함. 4번째 영상 있으면 도움.
6. **상단 비주얼 액션 모듈** — 아예 미착수(의도적 범위 밖). 나중에 "이동 중" 페이즈에 캐릭터 주행 연출 꽂으면 됨.
7. **개발용 훅** — main.ts 맨 끝 `window.__mg("mg_circle")` 콘솔로 미니게임 강제 실행 가능. 배포 시 제거.

## 7. 검증 상태
- 타입체크(`npx tsc --noEmit`): **통과**
- 19개 CSV 외래키 무결성: **통과** (누락 참조 0건)
- 원형룰렛 렌더링: 스크린샷 확인 완료
- 미니게임 3종 DOM 동작: 확인 완료
- ⚠️ 신규 A/B 시스템(마일스톤/스킬교체/재화바/챕터결산)의 라이브 클릭 검증: 브라우저 도구 일시 장애로 **미완** — 다음 세션에서 실플레이 확인 권장

## 8. 작업 팁 (이 코드베이스 특유)
- **애니메이션은 반드시 `setInterval`/`setTimeout`.** `requestAnimationFrame`은 이 브라우저 자동화 환경에서 안 돌아 UI가 멈춤 (과거에 크게 데임).
- 새 효과 추가: `effect_config.csv`에 행 추가 → 어디서든 effect_id로 참조. 코드 수정 불필요.
- 새 UI 문구: `ui_text_config.csv`에 key 추가 → 코드에서 `ui("key", {변수})`.
- 스킬 카드 등 선택 요소는 반드시 `<button>` (div onclick 금지 — 접근성/자동화 테스트).
- 커밋 전 항상 `npx tsc --noEmit`.

## 9. 외부 자료
- Notion 정리 문서 "카피바라 세부 정리": https://app.notion.com/p/39b4893f6eff8070afecfbc614283e9d
  (Day1-60 통합 정리 + 시스템 카탈로그 + CSV 스키마 설계)
- git origin: https://github.com/parkinglotstudio/xoox2.git (아직 push 안 됨, 로컬 커밋만)
