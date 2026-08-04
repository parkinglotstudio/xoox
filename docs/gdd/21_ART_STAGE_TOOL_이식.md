# 21. 배경(무대) 툴 · 스프라이트 애니 툴 — 몬카피바라 이식

> **작성:** 2026-08-01 · **이식 출처:** `C:\Users\dmaxd\Downloads\monocapibara` (별도 프로젝트, [[monocapibara-project-context]])
> **상태:** 【툴·문서·샘플 아트만 이식】 — **XOOX 게임 화면(engine.ts/main.ts)엔 아직 안 붙임.** 지금 실제 플레이 화면은 여전히 이모지 기반 그대로다.
> **왜 여기 있나:** 나중에 XOOX 구역(하수도 지구 등) 배경 아트나 펫/방랑자 스프라이트 애니를 실제로 만들 때, 매번 툴을 새로 짜지 말고 이미 검증된 이 파이프라인을 쓰기 위해 미리 가져다 둠.
> **새 세션 시작 프롬프트:** [`docs/art/NEXT_AI_PROMPT_ART_TOOLS.md`](../art/NEXT_AI_PROMPT_ART_TOOLS.md) — 이 툴로 작업 시킬 땐 이걸 붙여넣기

---

## 0. 세 줄 요약

1. **배경(무대) 툴** — 지역 배경을 FAR/NEAR/OBJ 3레이어 패럴랙스로 조립·검수하는 웹 툴(`region-kit-tool.html`, Three.js). `npm run dev:kit`로 실행.
2. **스프라이트 애니 툴** — 캐릭터 프레임을 스프라이트 시트로 굽고 위치·크기·타이밍을 맞추는 웹 툴 + 파이썬 스크립트 세트. `docs/art/sprites/_guide/`가 입구.
3. **지금은 둘 다 독립 실행되는 "제작 도구"일 뿐**, XOOX 게임 코드와는 연결 안 됨. 실제 아트가 준비되면 그때 `engine.ts`/`main.ts`에 붙이는 별도 작업이 필요하다(§5).

---

## 1. 배경(무대) 툴

### 1-1. 실행

```bash
npm run dev:kit
# → http://localhost:5173/region-kit-tool.html
```

### 1-2. 뭘 하는 툴인가

- 캐릭터가 걸어가는 동안 배경이 FAR(원경, 느림) / NEAR(근경, 빠름) / OBJ(지역 얼굴) 3겹으로 패럴랙스 스크롤되는 걸 미리보기·튜닝
- "이동 시뮬" 버튼 — 이동 중 CONTENT(조우 집 등)가 대각선으로 등장했다가 착지와 동시에 멈추는 연출까지 재현
- 슬라이더로 캐릭터/집의 위치·크기·속도를 맞추고, 값을 CSV에 그대로 옮겨 적을 수 있게 내보내기(복사) 지원

### 1-3. 코드 구조 (이식된 부분)

```
region-kit-tool.html                    ← 툴 진입점
src/tools/regionKitTool/main.ts         ← 툴 UI 로직
src/stage/region/RegionBackdrop.ts      ← 렌더러 (Three.js, three 외 의존성 없음)
src/stage/region/types.ts               ← 타입
```

**중요:** `RegionBackdrop.ts`는 `three`만 import하는 완전 독립 모듈이다. XOOX의 `engine.ts`/`main.ts`를 전혀 참조하지 않으므로, 지금 이 툴을 켜고 꺼도 본편 게임 동작에 영향이 없다.

**이식 안 한 것 (원본에 있던 것):** 원본 몬카피바라는 이 렌더러를 실제 게임(`ThreeStage.ts`)에도 꽂아 쓰고 있고, 그러기 위한 `bindMatch.ts`·`contentPropMap.ts`·`resolveLandingVisual.ts`·`moveTiming.ts`(보드 칸→배경 매칭 로직)가 있다. **이것들은 몬카피바라의 "64칸 모노폴리 보드" 구조 전용**이라 XOOX(요일 기반 CSV 로그 게임)엔 그대로 안 맞아서 가져오지 않았다. XOOX에서 실제로 배경을 붙이려면 이 매칭 로직을 XOOX의 `stage_map_config.csv`(요일 구간 기반) 구조에 맞게 **새로 설계**해야 한다 — 아직 안 함.

### 1-4. 샘플 아트 (몬카피바라 원본 그대로 — XOOX 전용 아님)

```
docs/art/stage/regions/{region_default, region_ws_01~06}/   ← far.png · near.png · obj.png
docs/art/stage/props/prop_*.png                              ← 조우 집 8종
docs/art/stage/actor/hyanga_idle.png                         ← 툴 미리보기용 캐릭터(향아)
data/art/stage/...                                           ← 위와 동일 구성의 런타임 복사본(vite publicDir)
```

`region_ws_01`~`06`, `prop_territory_*` 같은 이름은 **몬카피바라의 예시 지역/영지 이름 그대로**다. XOOX 세계관(구역·거점, [[rescue-encounter-system]])에 맞는 진짜 배경을 만들 땐:

1. 새 `region_id`(영문 스네이크, 예: `region_sewer_01`) 폴더를 `docs/art/stage/regions/`와 `data/art/stage/regions/` 양쪽에 동일하게 생성
2. `region-kit-tool.html`의 `<select id="mapSelect">` 옵션에 한 줄 추가 (지금은 하드코딩 — CSV로 뺄지는 실제 아트 붙일 때 결정)
3. `npm run dev:kit`로 루프·속도 검수

### 1-5. 아트 스펙 (몬카피바라 원본 규칙 — 그대로 유효)

| 레이어 | 크기 | 형식 | 비고 |
|--------|------|------|------|
| FAR / NEAR | 2048×512 | PNG | 가로 루프 필수(끝↔끝 이어짐) |
| OBJ | 1024×512 | PNG 알파 | 지역 "얼굴" · 실루엣으로 식별 |
| CONTENT prop(조우 집 등) | 512×512 | PNG 알파 | 발 아래 기준점 |

패럴랙스 속도비 `far:near ≈ 1:2.5~3`, 지역 전환 시 0.3~0.5s 크로스페이드 — 몬카피바라 `71_REGION_STAGE_ART.md` §6 그대로.

---

## 2. 스프라이트 애니 툴

### 2-1. 실행

```bash
# 구버전 3종 웹툴(재생/위치/크기) — 캐릭터당 정적 서버 하나
python -m http.server 8765 --directory docs/art/sprites/hyanga/engine
# → http://127.0.0.1:8765/studio.html   (재생)
# → http://127.0.0.1:8765/align.html    (위치)
# → http://127.0.0.1:8765/scale.html    (크기)
```

Windows에서 `python3` 커맨드가 스토어 스텁으로 연결돼 안 먹힐 수 있음 — 그럴 땐 `python`으로.

신규 통합 에디터(`editor.html` + `editor_server.py`, 캐릭터별 포트 지정)는 [`docs/art/sprites/_guide/02_TOOLS.md`](../art/sprites/_guide/02_TOOLS.md) 참조 — 몬카피바라 경로 예시 그대로 있으니 XOOX에서 쓸 땐 `--char` 값과 대상 폴더만 XOOX 쪽으로 바꾸면 된다.

### 2-2. 뭘 하는 툴인가

- AI로 뽑은 키포즈 프레임들을 정해진 셀 크기로 정렬·스케일해서 스프라이트 시트(`{id}_sheet.png` + `{id}.json`)로 굽는다
- idle/move/attack/hit/win/lose/hop 등 상태별 애니를 웹에서 재생·타이밍 조절
- 크기 기준(idle 대비 캐릭터 실루엣 통일), 발 피벗 등 게임에 바로 꽂을 수 있는 정규화 규칙 포함

### 2-3. 이식된 파일

```
scripts/sprite_tool/*.py              ← 엔진 스크립트 (sprite_engine.py·editor_server.py 등)
docs/art/sprites/_guide/*.md          ← 원칙·파이프·툴·프롬프트·게임 매뉴얼 15종
docs/art/sprites/hyanga/              ← 샘플 캐릭터 1종 (향아) — engine/ingame/lobby 풀세트
```

**이식 안 한 것:** 원본의 `docs/art/sprites/generals/`(삼국지 챕비 캐릭터 10종 로스터)와 `_concept_final/`(그 컨셉아트) — XOOX 세계관과 무관해서 제외. `_guide/` 문서들 안에 "장수"·"관우"·"유비" 같은 표현이 남아있는데, 이건 원본 파이프라인 설명 예시일 뿐이니 참고만 하고 XOOX 캐릭터명으로 착각하지 말 것.

### 2-4. XOOX에서 쓸 때

새 캐릭터(예: 방랑자, 뭉치, 하늘이) 스프라이트를 만들 땐 `hyanga/` 폴더 구조(`engine/`, `ingame/`, `lobby/`, `_ref/`, `_archive/`)를 그대로 복제해서 이름만 바꾸면 된다. `docs/art/sprites/_guide/00_CHARACTER_PRINCIPLES.md`·`12_SIZE_POLICY.md`가 크기·톤 기준을 잡아준다.

---

## 3. 관련 CSV (아직 채워 넣지 않음)

몬카피바라 원본은 배경 키트를 CSV로 관리한다(`stage_asset_manifest.csv`, `stage_region_kit.csv`, `stage_region_bind.csv`, `stage_content_prop_map.csv`). **이번 이식엔 이 CSV들을 가져오지 않았다** — 몬카피바라의 보드 칸(`board_tile`) 구조에 묶여 있어서 XOOX엔 그대로 안 맞기 때문. XOOX에서 배경을 실제로 CSV 구동으로 만들려면, 위 4종 CSV를 XOOX의 `stage_map_config.csv`(요일 구간 기반) 스키마에 맞게 다시 설계해야 한다 — 지금은 필요 시로 미룸.

---

## 4. 지금 상태 체크리스트

- [x] 배경 툴 코드(`RegionBackdrop`+`main.ts`) 이식, `npm run dev:kit`로 실행 확인
- [x] 배경 샘플 아트(구역 6종 + 조우 집 8종 + 캐릭터 미리보기) 이식
- [x] 스프라이트 툴 스크립트 + 가이드 문서 이식
- [x] 향아 샘플 스프라이트 세트 이식 (studio.html 재생 확인)
- [x] `package.json`(`dev:kit`, `three` 의존성) · `vite.config.ts`(빌드 진입점) 반영
- [ ] XOOX 실제 구역/캐릭터 아트 제작 (미착수)
- [ ] XOOX 게임 화면(engine.ts/main.ts)에 실제 렌더링 연동 (미착수 — 별도 작업, 이번 범위 아님)
- [ ] 배경 CSV 4종을 XOOX `stage_map_config` 구조에 맞게 재설계 (미착수)

---

## 5. 다음에 실제로 연동하려면 (메모만, 지금 안 함)

1. XOOX `stage_map_config.csv`(요일 구간 4스테이지)를 몬카피바라의 `world_stage`처럼 취급해, 스테이지당 홈 배경 키트 하나씩 매칭하는 표를 새로 설계
2. `engine.ts`의 day 진행 이벤트(`applyDayEvent` 등)에서 스테이지 전환 시점에 `RegionBackdrop.swapKit()` 호출하는 연결 코드 작성 (지금은 없음)
3. 이모지 기반 현재 UI를 유지할지, 배경 레이어 위에 얹을지 먼저 결정 필요 — **지시자 확인 후 진행**

> 관련: [[docs-are-source-of-truth]] · 도구 원본: `C:\Users\dmaxd\Downloads\monocapibara\docs\design\71_REGION_STAGE_ART.md`(배경 툴 원문 기획, 보드게임 통합 부분 포함 — 참고용)
