# 인수인계 프롬프트 — forest-play-tool (자동 사냥 Cursor용, 2026-09-27)

아래를 **그대로** Cursor 채팅에 붙여 넣는다.
작업 장소는 `C:\xoox` 본편만. **커밋·푸시 금지**. 다른 에이전트 BOARD 행은 고치지 않는다.
**Cloud / 원격 VM 금지** — 로컬 Agent만. UI 변경 후 지시자 피드백을 받는다.

---

## 역할

너는 예전에 `forward-wave-tool`에서 자동 사냥을 만든 Cursor다.
이제 작업 무대는 **숲 통합 플레이 툴**이다.

- URL: http://127.0.0.1:5179/forest-play-tool.html  
  (서버 꺼져 있으면 `C:\xoox`에서 `npm run dev` 후 포트 확인)
- 진입: `forest-play-tool.html` → `src/tools/forestPlay/main.ts`
- 전투 핵심: `src/tools/forestPlay/PlayCombat.ts`
- 규칙 레퍼런스(옛 툴, **수정하지 말 것**):  
  `docs/handoff/20260927_자동사냥_Cursor/PROMPT.md`  
  `forward-wave-tool.html` / `src/tools/forwardWave/*` (읽기만)
- 전투 진행 메모: `docs/handoff/20260927_숲플레이통합/COMBAT_PLAN.md`
- UX 메모: `docs/handoff/20260927_숲플레이통합/UX_REPLAN.md`

이 툴의 목적: **숲 맵 + 캐릭/유닛 + 자동 사냥**을 한 화면에서 미리보기한다.
본편 여정(`JourneyStage3D`, `journey3d_layout.json`, `SectorPurifyLoop`)에 **연결하지 마라**.
`forest-map-tool` / `src/tools/forestMap/*` 는 **임포트·재사용만**, **수정 금지**.
블록 고양이 툴·Codex 캐릭터 제작 스크립트를 사냥 때문에 건드리지 마라.

---

## 왜 forest-play인가

지시자가 “전투는 지금 이 툴에서 진행”이라고 했다.
이미 숲 GLB(`forest150`) + `ForestNavigation`이 붙어 있고,
건설 패드 동적 내비 차단, 2열 종대, 직선 탄, 쌍권총/바주카 분기까지 들어갔다.
`forward-wave`의 아일랜드 블록맵 전투를 **규칙만** 가져오고, 맵은 숲이다.

---

## 절대 하지 말 것

1. `src/tools/forestMap/*`, `forest-map-tool.html` 수정
2. Git 커밋·푸시, Cloud Agent / 원격 VM
3. BOARD에서 Cursor 이외 행 수정 (보고 시 Cursor 행만)
4. `JourneyStage3D` / `journey3d_layout.json` / SectorPurifyLoop 연결
5. Fooderduck 참고 영상의 **각성·관통·스킬 빔** 복제  
   영상: `C:\Users\dmaxd\Downloads\6170245215383724202.mp4` (느낌만, ~95초대 직선 에너지)
6. 유도탄(aimMob에 붙어서 날아가기) 부활 — **거부됨**. 직선만.
7. GLB·PNG를 툴마다 복사하지 말 것. 맵은 forest150 **manifest** 하나.

---

## 소스 맵 (forestPlay)

| 파일 | 역할 |
|------|------|
| `main.ts` | 모드·입력·배선·디버그 API·버섯 스케일 오버라이드 |
| `PlayCombat.ts` | 종대 스폰, chase, PLAY/STOP, 자동사냥, 직선샷, 무기, 적 scale |
| `PlayCharacter.ts` | RUON/RIA 스폰, idle↔walk 크로스페이드, 총구 본 |
| `PlayNavOverlay.ts` | 숲 walk 마스크 클론 + **건설 패드 footprint 이동금지** |
| `PlayBuild.ts` | 슬롯 설치/철거, `onNavDirty` → `syncPlayNav()` |
| `PlayUnitCatalog.ts` | 유닛 카탈로그 DnD |
| `PlaySpawnFx.ts` | 설치 시 시안 Orune류 스폰 FX |
| `PlayPet.ts` | BCAT02 펫 |
| `PlayCamera.ts` / `PlayPreview.ts` | 카메라·16:9 인게임 미리보기 |

맵 데이터: `data/maps/forest150/manifest.json`  
- revision 예: `forest150x300-v7` (하드코드하지 말고 manifest 읽기)  
- GLB: purified / polluted  
- nav: `navigation.json` + `walkability.png` (버전은 manifest가 가리키는 경로)  
- 크기 150×300m, 칸 0.5m. 좌표 x동 y북. three `(x, 0, -y)`.

---

## UX (모드)

사이드 상단 **모드 4개** (한 번에 하나만):

| 모드 | 목적 | 단축키/커서 |
|------|------|-------------|
| **플레이** | WASD 이동·F 사격·PLAY 사냥·캐릭/펫 | WASD, F |
| **배치** | 유닛 카탈로그 DnD | copy |
| **건설** | 패드 클릭 설치/철거 | cell |
| **살펴보기** | 정화/오염·메시 픽 (설치 없음) | help |

인게임 미리보기는 기본 **접힘**(좌하단 칩). 카메라 고급은 `<details>`.
상단 링크에 **애니확인** 등 다른 툴 바로가기 있음.

플레이 패널에서 확인할 UI:
- PLAY / STOP
- 자동 사냥 체크
- **weapon** 셀렉트: `dual pistol` | `bazooka`
- 웨이브 / 적1 / 사격(F) / 적 제거
- 캐릭: 루온·리아, 기존 비율 / 3.5등신
- 애니 퀵필: 대기·걷기·뛰기·쏘기…

---

## 이미 구현된 전투 (되돌리거나 깨지 말 것)

### 내비
- `PlayNavOverlay`: 숲 비보행 + **모든 건설 패드**(빈 칸·설치됨 모두) width×depth 차단.
- 플레이어 이동·몹 path·`segmentClear` 사선이 **같은** `navOverlay.nav` 사용.
- `PlayBuild.onNavDirty` → `syncPlayNav()`.

### 종대 / 리젠
- Cursor 규칙: 약 **10~15**, **2열**, 가로 **1.7m**, 세로 **2m**, 앞줄 **~8.2m**.
- `canStand`만 (마스크 + 패드 차단).
- 전멸 후 딜레이 → `spawnWave` 리젠.
- chase: `findPath` (~1s / stuck), speed ~3.
- **STOP** = 그 자리 **정지**(despawn·숨김 아님). PLAY는 같은 무리 재개.
- PLAY를 GLB 로딩 중에 눌러도, 풀 준비되면 첫 웨이브 시작하도록 맞춤.

### 사격 (P0)
- 캐릭 yaw(총구/가슴 전방) **직선** 레이/짧은 두꺼운 빔. **유도 없음**.
- `segmentClear`로 나무·패드 관통 금지. 선 위 첫 생존 몹만 히트.
- HP **2**, 착탄 1회 = 피해 1 (volley=1 감각).

### 무기 분기 (Cursor 맞춤)
| 무기 | 총구 | 탄 | 애니 | 간격 |
|------|------|----|------|------|
| dual pistol | `D_prop_gun` + `D_prop_gunL` | **2발** 비주얼 | `shoot` | ~0.55s |
| bazooka | `D_prop_rifle` | 1발 | `shoot2` | ~1.05s |

쌍권총 2발은 **비주얼 2개**, 맞힌 카운트/피해는 Cursor와 같이 **한 volley = 1** 유지.

### 애니
- 플레이어·몹: idle↔walk(run) 크로스페이드.
- WASD + 자동사냥 이동 모두 locomotion에 포함.
- 설치 유닛/프롭도 mixer idle 루프(가능하면).

### 스케일 (지시자 확정)
- **버섯**: forest-play 로드 후 렌더 scale **0.3** (70% 축소). forestMap 소스 수정 없음.
- **적(몹)**: scale **0.1** (10%). `PlayCombat` 스폰·사망 스케일 포함.

### 캐릭 카탈로그 (활성)
- RUON(A), RUON_35, RIA(D), RIA_35
- 펫 BCAT02
- 건설: unit-lab 타워 5종 + 맵 유닛 슬롯(facility) 타입 설치

---

## forward-wave와의 차이 (알고 작업할 것)

| | forward-wave (옛) | forest-play (지금) |
|--|-------------------|---------------------|
| 맵 | 아일랜드 블록맵 | 숲150 + ForestNavigation |
| 몹 | 복셀 구름 15풀 | mushnub 등 **GLB** + idle/walk |
| FX | cloud/purify 계열 | 직선 빔/볼 GLB FX |
| 종대 | 블록 stand | 숲 `canStand` + 패드 차단 |
| PLAY/STOP | 예전에 제안만 | **이미 있음** |
| 직선탄 | 다음 작업이었음 | **이미 있음** (재검증만) |
| 무기 UI | (옛 규칙) | weapon 셀렉트 있음 |

복셀 구름을 숲에 억지로 이식하지 마라. GLB 몹을 우선하고, 종류 확장은 `monsters_anim` 등 클립 있는 GLB 로테이션으로.

---

## 지금 지시자가 넘기는 이유 / 기대

자동 공격·종대·쌍권총/바주카 감각을 **네가 제일 잘 안다**.
forest-play에 기본선은 깔렸지만, Cursor forward-wave 퀄리티에 비해 아직 어색할 수 있다.
다음 작업을 받으면 **먼저 코드를 읽고 짧은 계획**을 보여준 뒤 구현한다.

우선 검증 루프:
1. http://127.0.0.1:5179/forest-play-tool.html → 모드 **플레이**
2. 캐릭 스폰 → 자동 사냥 ON → weapon dual pistol → **PLAY**
3. 종대 등장·추적·전멸 리젠·STOP 시 제자리 정지 확인
4. 쌍권총 **총구 2발**, bazooka **1발·shoot2** 확인
5. WASD 시 Walk 클립, 나무/패드 뒤로는 샷 미스
6. 스샷은 `C:\xoox\out\forest-play\<작업명>\` 에 저장  
   (가능하면 `C:\Users\dmaxd\xoox-map-concepts\out\forest-play\` 에도 복사)

---

## 추천 다음 작업 (승인 후 · 우선순위는 지시자 말 따름)

지시자가 따로 지정하기 전 기본 후보:

1. **자동사냥 루프 퀄리티** — Cursor 6m 뒷걸음 / 9m 밖 질주 / `shotBusy` 착탄 유지가 forest-play에 얼마나 가까운지 대조·보완
2. **앞줄 쌍권총 / 뒷줄 바주카** 몹 측 무장(플레이어 weapon과 별개로, Cursor 종대 규칙)
3. **몹 종류·죽음 FX** — GLB 로테이션, 스케일다운 대신 짧은 디졸브
4. **LOS 막힘 우회** — aim 유지 + 한 칸 측면
5. UX 잔여 — 맵 프롭 DnD, 슬롯 피커 정리(요청 시만)

지시자가 “일단 보고만”이면 구현하지 말고 갭 표만 올린다.

---

## 보고

끝나면:
- `docs/reports/YYYYMMDD_작업보고서_짧은제목.md`
- `docs/status/BOARD.md` 의 **Cursor 행만** 갱신
- `docs/handoff/20260927_숲플레이통합/COMBAT_PLAN.md` 에 바뀐 점 짧게 추가
- 채팅에 URL + 스샷 경로 + 변경 파일 목록

그룩봇 지시 파일 `docs/directives/FROM_GROK.md` 가 있으면 작업 전 읽는다(실시간 채팅 주입 대신 파일 강제 읽기).

---

## 한 줄 요약

**숲 플레이 툴에서 Cursor 자동사냥 규칙을 이어받아, 직선 탄·2열 종대·쌍권총2발/바주카·PLAY 리젠 루프를 깨지 말고 퀄리티를 올린다. forestMap·본편여정·git·Cloud는 손대지 않는다.**