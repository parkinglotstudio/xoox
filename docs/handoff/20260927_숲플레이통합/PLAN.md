# 숲 플레이 통합 툴 — 계획 (2026-09-27)

## 목적
기존 **숲 맵 툴**(에디터·탑뷰 중심)과 분리된 **인게임 시점 플레이 통합 화면**을 새로 만든다.
세부 제작 툴은 그대로 두고, 플레이 화면에서 메뉴로 연결한다.

## 신규 파일만 (기존 수정 금지)
- `forest-play-tool.html`
- `src/tools/forestPlay/*` (`main.ts`, `PlayCamera.ts` …)
- 본 문서 `docs/handoff/20260927_숲플레이통합/PLAN.md`

**수정하지 않음:** `forest-map-tool.html`, `src/tools/forestMap/*`  
(읽기·패턴 복사·`ForestSky` 등 **import 재사용**만)

## 메인 뷰
- **인게임 TPS 카메라**가 기본 화면 (숲 맵 GamePreview와 동일 감각).
- 탑다운 에디터는 1차 범위 밖.

## 상단 메뉴 (same-origin, `/tools/` 접두사 없음)
- forest-map-tool.html
- forest-prop-tool.html
- unit-lab-tool.html
- character-compare-tool.html
- wanderer-a-tool.html / wanderer-d-tool.html
- block-cat-tool.html
- forward-wave-tool.html
- tools.html (허브)

## 패널 스캐폴드
| 패널 | 1차 | 이후 |
|------|-----|------|
| 맵/오브젝트 | forest150 로드 + 정화 숲 표시 | 오브젝트 배치 UI |
| 캐릭터 | 스텁 (person GLB만) | 방랑자/유닛 랩 연동 |
| 전투 | 스텁 | 웨이브·공격 |
| 건설 | 스텁 | 탑/유닛 배치 |
| 펫 | 스텁 | 펫 동반 |

## 로딩
- 매니페스트 `/maps/forest150/manifest.json`
- `MapView` (`BlockMapView`), `ForestNavigation`, `ForestSky` import 재사용
- 기본 상태: **purified**

## 단계
1. **Phase 1 (현재):** 인게임 뷰 + 메뉴 + 맵 로드 + 패널 스캐폴드
2. **Phase 2:** 건설·전투를 숲 맵 로직에서 플레이 화면으로 이전
3. **Phase 3:** 캐릭터/펫 세부 툴 딥링크·상태 공유

## 실행
```bash
npx vite --host 127.0.0.1 --port 5179 --strictPort
```
열기: http://127.0.0.1:5179/forest-play-tool.html


## UX — 스폰·배치 (2026-09-27 보강)

### 건설 (타워 슬롯)
1. 맵에 **타워 슬롯 패드**(녹색)가 항상 보인다. 유닛 시설 패드는 파란 계열·터렛 없음.
2. **타워 패드를 클릭**하면 건설 패널 + 플로팅 설치 UI가 열린다.
3. **유닛랩 터렛 5종** 중 하나를 고르면 그 슬롯에 GLB가 설치된다 (맵 `tower_purified` 등 카탈로그 메시 사용 금지).
4. 같은 슬롯을 다시 고르면 **교체**, 「철거」로 비운다.
5. 「데모: 5종을 5타워에 배치」는 1:1 미리보기용. 유닛 시설 슬롯은 건드리지 않는다.

| id | 라벨 | GLB |
|----|------|-----|
| tower_gun | 총 탑 | `/tools/unit_lab/units_free/tower_gun.glb` |
| tower_throw | 던지기 탑 | `/tools/unit_lab/units_free/tower_throw.glb` |
| tower_cannon | 대포 탑 | `/tools/unit_lab/units_free/tower_cannon.glb` |
| tower_ballista | 발리스타 탑 | `/tools/unit_lab/units_free/tower_ballista.glb` |
| tower_catapult | 투석기 탑 | `/tools/unit_lab/units_free/tower_catapult.glb` |

### 다른 패널 스폰
| 패널 | 동작 |
|------|------|
| 캐릭터 | 「스폰 / 교체」— 기존 |
| 전투 | 「웨이브 스폰」전방 무리 · 「적 1마리 근처 스폰」· 「적 전부 제거」 |
| 펫 | 「BCAT02 스폰」/ 「펫 해제」— 기존 |
| 맵/오브젝트 | 카탈로그 선택 후 「선택 오브젝트를 플레이어 위치에 배치」 |

### 수정 범위
- `forest-play-tool.html`, `src/tools/forestPlay/*`, 본 PLAN만.
- **금지:** `forest-map-tool.html`, `src/tools/forestMap/*`

- 「플레이어 앞 5종 미리보기」: 슬롯과 별도로 5 GLB를 플레이어 앞에 일렬 배치 (스크린샷·비교용).
