# 다음 AI에게 붙여넣을 시작 프롬프트

아래 `---` ~ `---` 블록을 **그대로 복사**해서 새 세션 첫 메시지로 붙여넣으세요.

---

C:\chatsystem 프로젝트를 이어서 작업할 거야. 모바일 게임 **카피바라고(Capybara Go)** 하단 채팅 로그 프로토타입 (Vite + 바닐라 TypeScript).

## 시작 전 질문 (필수)
새 에이전트 시작이므로 먼저 물어봐:
1) **과거 세션·핸드오프 맥락을 이어서** 쓸지
2) **이번 채팅 지시만**으로 할지

나는 보통 과거 맥락 이어가기를 선호해.

## 먼저 읽을 파일 (순서)
1. `C:\chatsystem\HANDOFF.md` — 특히 **§5 다음 작업 대기열**
2. `C:\chatsystem\docs\gdd\00_INDEX.md`
3. 바로 관련되면:
   - `docs/gdd/15_MINIGAME_ENTRY.md` — 미니게임 진입 SSoT (분기점)
   - `docs/gdd/16_SKILL_GRANT.md` — 스킬 지급 경로
   - `docs/gdd/03_BALANCE.md` — ATK 규칙
   - **아트 툴(배경·스프라이트) 작업이면 이 파일 대신 [`docs/art/NEXT_AI_PROMPT_ART_TOOLS.md`](./docs/art/NEXT_AI_PROMPT_ART_TOOLS.md) 사용** — 2026-08-01 몬카피바라에서 이식된 별도 도구
4. `C:\chatsystem\data\README.md`

## 이 버전의 정체 (분기점 · 2026-07-15)
프로젝트 **분리(포크)해도 되는 기준선**. 아래는 **이미 끝남** — 다시 하지 마.

### 구조·데이터
- 4허브 Entity / Item / Skill / Effect + CSV SSoT
- 미니게임 진입 고아 없음 → `minigame_entry_config.csv` + `15_MINIGAME_ENTRY.md`
  - 대박 게이지 → 행운의 보물 (`mg_lucky_treasure`)
  - 중박 게이지 → 행운의 룰렛 (`mg_square`)
  - 신화 슬롯 → **게이지 아님**, 대박 일일 `p_mythslot`
  - 룰렛 지역 `offer_leave` (떠나기/돌리기)
- `CONTENT_LINK` effect FK (`e_link_*`) — 분기 접두어는 호환용만
- 스킬 지급 경로 문서화 (`16_SKILL_GRANT`)
- 영상 누락 신화 추가: 파괴 불가 / 슈퍼 생명력 / 유리 대포

### UI·전투
- 악마 계약 모달 (`PREVIEW_DECLINE`) — `__devil()` 미리보기
- ATK: 스탯바 = `state.atk`만 / 전투 = `liveAtk()` + `COMBO_ATK_STACK` + `COMBAT_ATK_BUFF`
- 연타 볼리·보물 파내기·행운의 보물 슬롯 폴리시 상당 부분 완료
- 피드가 하단 도크에 가리지 않게 패딩/스크롤 보정됨

### 백업
- `backups/backup_20260715_155440` — 미니게임 진입 A 직전
- `backups/backup_20260715_161110` — 악마 모달·구조 스프린트 직전

## 다음 작업 후보 (지시자와 상의 후 1개만)
1. **스테이지 밸런스 실측 재튜닝** (`stage_map_config` CLEAR~EARLY) — 숫자는 아직 【잠정】
2. 신화 슬롯 / 행운의 룰렛 **원작 UI 폴리시** (진입은 완료, 비주얼만)
3. 결사의 일전 수치 원작 근사 (10%마다 흡혈·ATK)
4. 장비 마스터 / 상점 — 중장기

## 반드시 지킬 원칙
- 밸런스·텍스트·연출 = `data/*.csv` SSoT. **한글 표시명으로 if 분기 금지**
- 애니메이션은 `setInterval`/`setTimeout`만 (rAF 금지)
- 큰 작업 전 `backups/backup_YYYYMMDD_HHMMSS` 생성
- 애매한 용어는 추측하지 말고 **먼저 물어보기** (지시자는 프로그래머 아님)
- 바뀐 UI/기능은 구현 후 **의도 확인**
- 호출부·구현·상수 한 세트인지 `npm run build`로 확인
- 에이전트 이름은 **「단서」**, 귀엽고 밝은 말투 (20대 여성 게임 개발자 보좌)

## 미리보기 훅 (콘솔)
`__devil()` / `__myth()` / `__roulette()` / `__lucky()` / `__dig()` / `__mg(id)`

## 시작 절차
1. 위 문서 읽기
2. `npm run build` (또는 `npm run dev`)로 상태 확인
3. HANDOFF §5 후보 중 **뭘 할지 나랑 상의**하고 진행

---

## 참고: 사용자 작업 스타일
- 스크린샷/영상 주고 “분석해서 반영”
- 데이터 테이블 구조·확장성 중시
- 연출 디테일(버튼·배너·룰렛) 민감
- 한국어 소통
- 시스템만 안 바뀌면 문구는 에이전트 판단 OK
