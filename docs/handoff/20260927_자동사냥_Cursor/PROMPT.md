# 인수인계 프롬프트 — 자동 사냥 툴 (Cursor, 2026-09-27)

아래를 그대로 붙여 넣는다. 작업 장소는 `C:\xoox` 본편만. 커밋·푸시 금지. 다른 에이전트 BOARD 행은 고치지 않는다.

## 역할

XOOX 자동 사냥 준비 툴을 이어받는다. 툴 주소는 http://localhost:5179/forward-wave-tool.html (서버가 꺼져 있으면 `npm run dev`가 연 포트를 확인). 진입은 `forward-wave-tool.html` → `src/tools/forwardWave/main.ts` → `src/tools/forwardWave/view3d.ts`.

이 툴은 전진 웨이브 자동 사냥 테스트다. `SectorPurifyLoop`에 연결하지 말고, `data/ui/layout/journey3d_layout.json`을 덮어쓰지 마라. 턴제 VS로 되돌리지 마라. 블록 고양이 툴(`block-cat-tool.html`)과 합치지 마라. 본편 여정 하늘(`JourneyStage3D` 기본 원경)은 바꾸지 마라.

## 지금 화면

- 캐릭터는 시안 D. 보이는 크기는 `CHAR_H * 0.65 / height` (CHAR_H = 1.95). 카메라 거리는 이 스케일을 쓰지 않고 CHAR_H 기준이다.
- 타입 2(키 `2`, 시작 시 이 모드) 카메라는 후면 고정이 아니다. `camYaw`는 0에 머물고 몸만 적을 향해 돈다. 높이는 `CHAR_H * ((tps_height_mul ?? 1.9) + 4.8)`.
- 타입 1(키 `1`)은 예전 45° 카메라다. `easeFront` / `snapFront`는 타입 2에서 호출하지 않는다. `AIM_LIMIT` 22.5°는 타입 1용으로 남아 있다.
- 바닥은 아일랜드 블록 맵이다. `loadBlockMap({ person: false })`로 `data/maps/block/manifest.json`을 읽는다. 맵 사람 모델은 넣지 않는다. 서는 자리(`stand`)가 원점 아래에 오도록 맵 루트를 민다. 상단 「맵 다시 불러오기」가 같은 목록을 다시 읽는다.
- 확인했던 블록 맵 개정은 `20260927-r5`였다. 잇기 전에 manifest의 `revision`을 다시 읽어라. 이전 개정은 `data/maps/block/releases/`에 있다.

## 전투 (되돌리지 말 것)

- 몬스터는 복셀 구름 15마리 풀. 한 무리는 2열 또는 3열, 10~15마리. 가로 간격 1.7m, 세로 간격 2m. 앞줄은 사거리+8m 근처에서 시작하고, 살아있는 맨 앞 줄이 8.2m에서 선다. 깊이 = `8.2 + (rank - minRank) * 2`. 혼자 남으면 중앙 8.2m.
- 앞줄의 절반은 쌍권총, 뒤는 바주카. 한 줄이 끝난 뒤 다음 줄.
- HP 2. 한 발사(volley) = 피해 1. 쌍권총은 `D_prop_gun`과 `D_prop_gunL`에서 탄이 두 개 나가지만 맞힌 횟수는 한 번이다. 바주카는 한 발.
- 발사가 시작되면(`shotBusy`) 사거리 밖으로 물러나도 그 발은 착탄한다. 6m 안이면 뒷걸음, 9m 밖이고 쏘는 중이 아니면 달린다.
- 타입 2 무리는 360° 랜덤 방향에서 나온다. 마커는 숨겨져 있다.
- 탄은 아직 조준한 적에게 붙어서 날아간다. 지시자는 이것을 거부했다. 다음 작업: 총구에서 총이 향한 직선으로만 나가고, 그 선 위의 적만 맞는다. 영상 참고 `c:\Users\dmaxd\Downloads\6170245215383724202.mp4` 중간(약 95초 이후). 그 영상의 각성·관통·스킬 빔은 가져오지 마라.

## 지시자가 고른 다음 맵

아일랜드 맵이 아니라 정화 숲을 쓸 것이다. 툴은 http://localhost:5179/forest-map-tool.html . 코드는 `src/tools/forestMap/main.ts`, 이동은 `src/maps/forest150/ForestNavigation.ts`.

2026-09-27 저녁 기준 `data/maps/forest150/manifest.json`:

- `revision`: `forest150x300-v7`
- 맵 GLB: `releases/v7/forest_purified.glb`, `forest_polluted.glb`
- 네비게이션·마스크: `releases/v3/navigation.json`, `walkability.png` (그림은 v7, 마스크 파일은 v3를 가리킨다. 하드코드하지 말고 manifest만 읽어라)
- 크기 150×300m, 칸 0.5m. 좌표는 x 동, y 북. three는 `(x, 0, -y)`.

마스크는 있다. `walkable[]`과 `clearanceMeters[]`. 숲 칸은 `canStand`가 거짓이고 `findPath`가 빈 배열이다. 플레이어 반경 0.6m, 이동은 `nav.move`. 몬스터 리젠은 「몬스터 12마리 리젠」이고 `spawnPoints(12, { radius: 0.65, awayFrom: player, minDistance: 14, spacing: 4 })`다. 이동 가능 칸만, 플레이어에서 14m 이상, 서로 4m 이상. 「추적 시작」은 약 1초마다 `findPath`로 플레이어를 쫓고 속도 3. 시작점은 마스크의 `spawn`.

아침 확인(v2)에서는 이동 가능 39,657칸, 시작 (75, 26), 구역 4개였다. v3 마스크로 바뀌었으니 숫자를 다시 세고 써라.

사냥 툴의 종대(10~15, 2~3열, 8.2m 정지)는 아직 숲 마스크를 안 본다. 무작정 옮기면 나무가 있는 칸에 선다. 교체할 때는 숲 GLB + `ForestNavigation`을 쓰고, 소환·이동·추적만 마스크 위로 제한한다. 숲 툴의 12마리 흩뿌리기를 종대 규칙과 바꾸라는 승인은 없다. 계획을 먼저 보여주고 지시자가 고르게 한다.

플레이·스톱은 없다. `stopped` 플래그만 있고, 켜면 몬스터를 숨긴다. 제안만 해 둔 상태다. 스톱은 그 자리 정지(몬스터를 지우지 않음), 플레이는 같은 무리 재개. 승인 전엔 넣지 마라. 키 1·2는 모드 전환이다.

## 하지 말 것

- GLB·PNG를 툴마다 복사하지 말 것. 맵은 manifest 하나.
- `docs/gdd/52`, `53`을 임의로 고치지 말 것. 타입 2 카메라가 53의 후면 고정과 다르다는 것은 지시자가 채팅으로 바꾼 것이다.
- 창에 `window.__hunt` 같은 디버그 훅을 남기지 말 것.
- Codex·Claude 파일(고양이, 루온·리아, 숲 제작 스크립트)을 사냥 작업 때문에 고치지 말 것.

## 보고

끝나면 `docs/reports/YYYYMMDD_작업보고서_짧은제목.md`를 쓰고, `docs/status/BOARD.md`의 Cursor 행만 고친다.
