# 이식 정보 — 몬카피바라 → XOOX (2026-08-01)

> **한 줄:** `docs/art/`, `region-kit-tool.html`, `src/tools/`, `src/stage/`, `scripts/sprite_tool/`는 이 XOOX 프로젝트에서 만든 게 아니라 별도 프로젝트 **몬카피바라**(`C:\Users\dmaxd\Downloads\monocapibara`)에서 가져온 것이다. 헷갈리지 않게 여기 정리.

## 왜 여기 있나

몬카피바라 프로젝트를 검토하던 중, 그 프로젝트에 있던 **스프라이트 애니메이션 툴**과 **배경(무대) 툴**이 실제로 잘 동작하는 걸 확인했고(2026-08-01 실행 검증 완료), XOOX에서도 나중에 캐릭터 애니·구역 배경 아트를 만들 때 같은 도구를 쓰기 위해 미리 가져왔다.

## 가져온 것

| 위치 | 내용 |
|------|------|
| `region-kit-tool.html` (루트) | 배경 3레이어(FAR/NEAR/OBJ) 패럴랙스 검수 툴 |
| `src/tools/regionKitTool/main.ts` | 위 툴의 UI 로직 |
| `src/stage/region/RegionBackdrop.ts`, `types.ts` | 배경 렌더러 (Three.js, 독립 모듈) |
| `docs/art/stage/` + `data/art/stage/` | 배경 샘플 아트 (지역 6종 + 조우 집 8종 + 미리보기 캐릭터) |
| `scripts/sprite_tool/*.py` | 스프라이트 시트 제작 파이썬 스크립트 |
| `docs/art/sprites/_guide/` | 스프라이트 제작 가이드 문서 15종 |
| `docs/art/sprites/hyanga/` | 샘플 캐릭터(향아) 스프라이트 풀세트 |
| `docs/art/*.md` (00·02~09) | 스프라이트 파이프라인 기획/스펙 문서 |
| `package.json`(`dev:kit` 스크립트, `three`/`@types/three` 의존성), `vite.config.ts`(빌드 진입점) | 툴 실행을 위한 최소 설정 |

## 일부러 안 가져온 것

| 원본 위치 | 왜 뺐나 |
|-----------|---------|
| `docs/art/sprites/generals/` (장수 10종 로스터) | 삼국지 챕비 캐릭터 — XOOX 세계관과 무관, 용량도 큼 |
| `docs/art/sprites/_concept_final/` | 위 로스터의 컨셉아트 — 동일 이유 |
| `src/stage/ThreeStage.ts`, `NullStage.ts`, `Stage.ts` | 몬카피바라 실제 게임 화면에 배경을 꽂는 통합 코드 — XOOX 게임엔 안 붙임(아래 참조) |
| `src/stage/region/bindMatch.ts`, `contentPropMap.ts`, `resolveLandingVisual.ts`, `moveTiming.ts` | 몬카피바라의 "64칸 모노폴리 보드" 구조 전용 매칭 로직 — XOOX(요일 기반)엔 안 맞음 |
| `stage_region_kit.csv` 등 배경 CSV 4종 | 위와 같은 이유로 보드 칸 구조에 묶여 있어 이식 보류 |

## 지금 상태 — 중요

**툴과 문서만 이식했고, XOOX 게임 화면(`src/engine.ts`, `src/main.ts`)엔 전혀 연결하지 않았다.** 지금 XOOX를 플레이하면 여전히 이모지 기반 화면 그대로다. 이 툴들은 `npm run dev:kit`(배경) / `python -m http.server ... docs/art/sprites/hyanga/engine`(스프라이트)로 **별도로만** 켜지는 독립 작업 도구다.

실제 아트가 준비되고 게임에 연동하기로 결정하면, 그건 별도 작업이다 — 상세 메모: [`docs/gdd/21_ART_STAGE_TOOL_이식.md`](../gdd/21_ART_STAGE_TOOL_이식.md) §5.

## 실행 확인 (2026-08-01)

- 배경 툴: `npm install` 후 `npm run dev:kit` → `region_ws_01` 배경 위 캐릭터 이동 시뮬 정상 동작 확인
- 스프라이트 툴: `python -m http.server 8765 --directory docs/art/sprites/hyanga/engine` → `studio.html`에서 향아 애니 재생 확인

## 다음에 볼 사람에게

- 이 폴더의 "향아", "장수", "관우", "유비", "ws_01 풀빛골목" 같은 이름은 전부 **몬카피바라 원본 예시**다. XOOX 캐릭터·지역이 아니다.
- XOOX용 실제 아트(방랑자, 뭉치, 하늘이, 하수도 지구 등)를 만들 땐 이 폴더 구조를 그대로 복제해서 이름만 바꾸면 된다.
- 원본 프로젝트 자체(몬카피바라)는 계속 별도로 진행 중이니, 그쪽 최신 상태가 궁금하면 `C:\Users\dmaxd\Downloads\monocapibara\docs\00_DOCS_MAP.md`를 확인할 것 — 이 이식본은 2026-08-01 시점의 스냅샷이라 이후 몬카피바라 쪽 개선사항은 자동으로 안 따라온다.
