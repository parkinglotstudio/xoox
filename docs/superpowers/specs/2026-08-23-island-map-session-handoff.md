# 섬 맵 파이프라인 — 세션 핸드오프 (2026-08-23)

> Architectural · 로컬 `C:\xoox` only · Cloud Agent 금지  
> 목적: 토큰 절약으로 세션을 끊은 뒤, **다음 세션이 이 문서만으로 이어갈 수 있게** 정리  
> 관련: `2026-08-23-island-map-pipeline-plan.md` · `2026-08-23-island-zone-placement.md` · `2026-08-22-map-mask-tool.md` · `2026-08-22-island-tile-pipeline.md` · GDD `41`·`42`·`44`·[`46` 원경](../../gdd/46_여정3D_원경_맵컨셉.md)

---

## 0. 한 줄 현황

> **마스크 구역 칠기 → 정화후(v4/v5 연속) 시안 → 정화전(물빛베일) → 9칸 프로젝트 반영 → 바닥 타일 확장 + 맵배치 “정화후(타일)” 스플랫**까지 진행.  
> 마지막 버그: 맵배치에서 보기 모드 바꿔도 타일 캐시가 안 바뀌던 문제 → `ensureFloorArts(force)`로 수정함(검증은 다음 세션).

---

## 1. 관련 툴 (실행)

| 명령 | URL | 용도 |
|---|---|---|
| `npm run dev:mapmask` | `/map-mask-tool.html` | 섬 마스크 칠하기 · Phase 0~4 · after/neon/veil 미리보기 |
| `npm run dev:map` / `dev:sector` | `/sector-editor.html` | NPC·원 배치 · **보기: 원본/정화전(타일)/정화후(타일)** |
| `npm run dev` | `http://localhost:5173` | 본편 인게임 (3D 바닥은 별 경로) |

생성 시안 작업 폴더(승인 전): `C:\수스이미지 생성\map_pipeline\`  
프로젝트 반영은 지시자 승인 후에만 (이미 v4/v5 일부 반영됨).

---

## 2. 핵심 코드 · 데이터

### 마스크 툴
| 경로 | 역할 |
|---|---|
| `src/mapMaskTool/main.ts` | 브러시·Phase·저장·미리보기 |
| `src/mapMaskTool/types.ts` | 레이어·Phase 정의 |
| `src/mapMaskTool/impressionPreview.ts` | 정화후(인상) 미리보기 |
| `src/mapMaskTool/neonPreview.ts` | 정화전 네온 미리보기 |
| `src/mapMaskTool/memoryVeil.ts` | 정화전 **물빛 베일** (after 위 필터) |
| `data/map_mask_tool/master/island_master.mask.json` | **마스터 마스크 SSoT** (사용자가 칠·저장한 것) |
| `data/map_mask_tool/masks/iXX.mask.json` | 섹터별 마스크 |
| `data/map_mask_tool/refs/` | 네온 레퍼런스·컨셉 비교 PNG |

### 맵 배치(섹터 에디터)
| 경로 | 역할 |
|---|---|
| `src/sectorEditor.ts` | 배치 UI · `artMode` · `ensureFloorArts(force)` |
| `src/stage/world3d/islandFloorSplat.ts` | 컨셉 PNG → **타일 스플랫** (`paintSectorFloorUrl`) |
| `data/ui/layout/sector_scale.json` | 9칸 `map` / `map_before` SSoT |
| `data/area_config.csv` | 영역·배경(현재 before 경로) |
| `data/ui/journey/sector_iXX_after.png` | 정화후 컨셉(연속 크롭 반영본) |
| `data/ui/journey/sector_iXX_before.png` | 정화전(물빛 베일) |
| `data/ui/journey/island_overview_1km.png` | 1km 개요 |
| `data/ui/journey/_bak_pre_v4_apply/` · `_bak_pre_v5_continuous/` | 반영 전 백업 |

### 바닥 타일
| 경로 | 역할 |
|---|---|
| `data/art/tiles/floor/*.png` | grass / meadow / forest / dirt / mud / pebble / rock_wet / water / blends… |
| `data/art/tiles/floor/_bak_pre_tile_expand/` · `_bak_pre_v4_apply/` | 타일 백업 |

### 스크립트(생성·반영)
| 경로 | 역할 |
|---|---|
| `scripts/_apply_continuous_9.py` | 통짜 섬 → land 마스크 제약 → 9칸 크롭 반영 |
| `scripts/generate_island_master.py` · `analyze_island_master.py` | 마스터 분석/생성 보조 |
| `scripts/gen-island-overview.ps1` | 개요 생성 |

### 인게임 3D (아직 에디터와 완전 동일하지 않음)
| 경로 | 메모 |
|---|---|
| `src/stage/world3d/IslandTerrain.ts` | 자체 스플랫/인페인트 — **에디터 `islandFloorSplat`과 중복·미정렬** |
| `src/stage/world3d/JourneyStage3D.ts` | 인게임 3D. **원경 원통** 규칙 = GDD [`46`](../../gdd/46_여정3D_원경_맵컨셉.md) |
| `Journey3DTuner.ts` / purifyRaidTool | `map` / `map_before` 토글 |

---

## 3. 이번 기간에 한 일 (요약)

1. **마스크 툴**  
   - Phase 0~4(레이아웃→외곽→작업구역→소프트→미리보기)  
   - 브러시 성능 개선  
   - forest가 flower를 안 지우고 Soft에만 보이던 버그 → 우선순위 clear  
   - path는 정보/보정용(아트에 강제 표시 X)  
   - 미리보기: after / before_neon / before_veil + refs 패널  
   - **마스크 SSoT = 사용자가 칠하고 저장한 JSON** (에이전트 자동 스크립트로 덮어쓰지 말 것)

2. **시안 톤**  
   - 정화후: **v4** 톤 채택 후 **v5 연속 통짜**로 이음새·i11 중앙 문제 완화  
   - 정화전: **네온(후보1)** + **물빛 베일(후보3, after 필터)** — **최종 미선택**  
   - 생성물: `C:\수스이미지 생성\map_pipeline\`  
   - 프로젝트 반영: journey `sector_*_after/before`, overview, `sector_scale.json`, `area_config.csv`

3. **실패에서 배운 것**  
   - 섹터 9장을 **각자** 그리면 이음새·중앙이 깨짐 → **1장 연속 + land 마스크 + 크롭**  
   - 9장 연속 PNG = **컨셉**이지, 인게임 최종 1km 페인트가 아님  
   - 인게임 바닥 목표는 **타일 스플랫**

4. **타일 · 맵배치**  
   - floor 타일 세트 확장  
   - `islandFloorSplat` 가중치·물·OUT=1024 개선  
   - 맵배치 **정화후(타일)** = splat (원본 컨셉 PNG 아님)  
   - **버그 수정(미검증):** `artMode` 변경 시 `clearFloorUrls` + `ensureFloorArts(true)` — 예전엔 정화전 캐시가 정화후에도 남음

---

## 4. 확정 규칙 (다음 세션도 유지)

- 루트: `C:\xoox` only. Cloud Agent 금지. 커밋은 지시할 때만.  
- Superpowers: Spike / Bounded / Architectural → 채팅 설계 → **승인 후** 구현.  
- 생성 시안: `C:\수스이미지 생성\` · 프로젝트 카피는 승인 후.  
- 마스크 덮어쓰기 금지(사용자 저장본 존중).  
- 수치·로스터·문구 CSV/JSON SSoT. 3D 전투는 자동 정화 연출 유지.  
- 마을·부두 거주 아트 재도입은 별도 결정 전 보류.  
- 코너 4칸 = 바다 구멍 아님 · 미니맵용 육지(숲/산).

---

## 5. 미완 · 다음 할 일 (우선순위)

| # | 항목 | 분류 힌트 | 비고 |
|---|---|---|---|
| 1 | 맵배치에서 **정화후(타일)** 캐시 수정 검증 | Bounded | Ctrl+F5 → 보기 전환 → “타일 바닥 생성 중…” 후 들판/숲/물로 보여야 함 |
| 2 | 타일 스플랫 퀄(다양성·이음) 다듬기 | Bounded | 여전히 칙/어두운 느낌이면 splat 매핑 재조정 |
| 3 | **정화전 톤 최종 선택** (네온 vs 물빛 베일) | 기획 결정 | 선택 후 before 자산·area_config 정리 |
| 4 | 인게임 `IslandTerrain` ↔ `islandFloorSplat` 정렬 | Architectural | 에디터와 본편이 다른 바닥을 쓰지 않게 |
| 5 | 마스크 마스터 추가 다듬기(필요 시) | Bounded | 사용자 페인팅이 SSoT |
| 6 | 프롭/나무 등 타일 위 디테일 | Bounded~Arch | Phase 4 후반 |
| 7 | 커밋 | — | 지시자 요청 시에만. 아트·마스크·코드 범위 합의 후 |

---

## 6. 맵배치 보기 모드 (현재 의도)

| UI | 의미 |
|---|---|
| 원본 (컨셉) | `sector_*_after` PNG 그대로 |
| 정화전 (타일) | `map_before` 기준 splat + UI `is-polluted`(하얗게) |
| 정화후 (타일) | `map` 기준 splat (강제 재생성) |

기본 `artMode` = `polluted`. 첫 로드는 before splat을 만듦 → **정화후로 바꿀 때 force 재생성이 필수**(이미 코드 반영).

---

## 7. 검증 체크리스트 (다음 세션 시작용)

1. `cd C:\xoox` → `npm run dev:map`  
2. `/sector-editor.html` Ctrl+F5 → **다시 불러오기**  
3. 보기: **정화후 (타일)** → 상태 “타일 바닥 생성 중…” → 초지/숲 텍스처  
4. 보기: **정화전 (타일)** → 다시 생성 + 하얗게  
5. 보기: **원본** → 컨셉 PNG  
6. (선택) `npm run dev:mapmask` → 마스터 마스크 로드·저장 확인  
7. (선택) `npm run dev` → 인게임 바닥이 에디터와 얼마나 다른지 스냅샷

---

## 8. 다음 세션용 복붙 프롬프트

아래 블록을 **새 채팅 첫 메시지**로 붙여 넣으면 된다.

```
[핸드오프] 섬 맵 파이프라인 이어가기

워크스페이스: C:\xoox (로컬만 · Cloud Agent 금지)
커밋: 내가 말할 때만
Superpowers: Spike/Bounded/Architectural → 설계 → 승인 후 구현

필수 문서부터 읽어:
1) docs/superpowers/specs/2026-08-23-island-map-session-handoff.md
2) docs/superpowers/specs/2026-08-23-island-map-pipeline-plan.md
3) docs/superpowers/specs/2026-08-23-island-zone-placement.md

직전 상태:
- 정화후 컨셉 v4/v5 연속 9칸 + 물빛베일 before가 data/ui/journey + sector_scale.json에 반영됨
- floor 타일 확장 + islandFloorSplat으로 맵배치 “정화후(타일)” 미리보기
- sectorEditor: artMode 변경 시 ensureFloorArts(true)로 캐시 강제 갱신 코드는 넣었음 → 아직 사람 검증 안 함
- 정화전 톤(네온 vs 베일) 미선택
- 인게임 IslandTerrain과 에디터 splat은 아직 미정렬
- 마스크 SSoT = data/map_mask_tool/master/island_master.mask.json (사용자 저장본 덮어쓰지 말 것)
- 미승인 시안은 C:\수스이미지 생성\map_pipeline\ 에만

이번 세션 우선:
1. npm run dev:map 으로 정화후(타일) 캐시 수정이 실제로 보이는지 검증
2. 안 보이거나 퀄이 부족하면 splat/타일만 Bounded로 다듬기 (설계→승인)
3. 내가 정화전 톤을 고르면 before 자산·area_config 정리
4. 여유 있으면 IslandTerrain ↔ islandFloorSplat 정렬 설계안만 (구현은 승인 후)

시작: 핸드오프 문서 읽고, 검증 결과부터 짧게 보고한 뒤 다음 설계를 제안해.
```

---

## 9. 문서 인덱스

| 문서 | 역할 |
|---|---|
| **이 파일** | 세션 핸드오프 · 툴 목록 · 다음 프롬프트 |
| `2026-08-23-island-map-pipeline-plan.md` | 전체 Phase 계획(상태 갱신됨) |
| `2026-08-23-island-zone-placement.md` | 마스크 레이어·지형 규칙 SSoT |
| `2026-08-22-map-mask-tool.md` | 마스크 툴 초기 스펙 |
| `2026-08-22-island-tile-pipeline.md` | 타일/9칸 공간 이해 |
| GDD `41` `42` `44` | 여정·스케일·정화전후 |
