# forest-play 전투 진행 계획 (2026-09-27)

## 전제

- Cursor 인수인계(`docs/handoff/20260927_자동사냥_Cursor/PROMPT.md`)의 전투 규칙은 **유지**.
- 작업 장소는 **`forest-play-tool`만** (`C:\xoox`). `forward-wave-tool`은 참조·규칙 소스. 숲맵 툴·캐릭/캣 Codex 영역은 건드리지 않음.
- 이유: 숲 GLB + `ForestNavigation`은 이미 forest-play에 붙었고, 지시자도 "전투가 지금 툴에서 진행"이라고 함. forward-wave의 아일랜드 맵 교체는 보류(인수인계: 계획 먼저 → 선택).

## 지금 상태 대비표

| 항목 | Cursor 인수인계 (forward-wave) | forest-play `PlayCombat` 지금 |
|------|--------------------------------|-------------------------------|
| 맵 | 아일랜드 블록맵 | 숲150 + ForestNavigation **완료** |
| PLAY/STOP | 제안만 (승인 전 금지였음) | 있음. STOP 시 tick 중단 |
| 직선 탄 | **다음 작업**(유도탄 거부) | 빔+볼 있으나 aimMob 종점형 → **직선·총구방향 재검증 필요** |
| 종대 스폰 | 10~15 / 2~3열 / 앞줄 8.2m | 전방 산개 6마리·랜덤 링 → **미구현** |
| 몹 표현 | 복셀구름 15풀 + 쌍권총/바주카 | mushnub GLB 1종 + idle/walk |
| HP / 피해 | HP2, volley=1 | HP2, 사격 있음 |
| 이동 AI | 6m 뒷걸음 / 9m 밖 질주 / shotBusy | 4.5m 밖 약전진만 |
| LOS | (forwardWave 쪽) | `segmentClear` 우선, 막히면 TODO |
| 죽음 FX | (복셀 붕괴 계열 기대) | 스케일 축소 |

## 목표 (플레이 모드에서 "사냥이 된다")

1. 총구(또는 캐릭 전방)에서 **직선 탄/빔**만 나가고, 그 선 위의 적만 피격.
2. 숲 마스크 위 **종대 스폰**(걸어갈 칸만, 앞줄 ~8.2m).
3. PLAY=무리 AI·사격 가동 / STOP=**그 자리 정지**(삭제·숨김 아님).
4. 자동사냥 ON이면 사거리까지 접근 후 연사, OFF면 수동(F)만.
5. (다음) 쌍권총/바주카 발사 규칙·몹 종류 확장.

## 단계 (추천 순서)

### P0 — 직선 탄 (최우선)
- 유도(aim 붙어서 날아가기) 제거.
- 발사 순간 캐릭 yaw(또는 총구 본) 방향으로 고정 레이/빔.
- `nav.segmentClear`로 나무 관통 금지. 선분 위 최근접 적만 히트.
- 참고 영상 95초대 느낌만(각성·관통·스킬빔 제외).
- 완료 기준: PLAY 중 F/자동사격이 옆 적 무시하고 전방 직선에만 맞음 + 스샷.

### P1 — 숲 종대 스폰
- 인수인계 수치: 10~15, 2~3열, 가로 1.7 / 세로 2, 앞줄 깊이 8.2m.
- 후보 칸은 `canStand` + clearance. 나무 칸 금지.
- 플레이어 전방 부채꼴에서 열 배치. 실패 시 열 수·마리 수 줄여 재시도.
- 인수인계의 "숲툴 12마리 흩뿌리기 승인 없음" → forest-play에서는 **종대만** 쓰고 산개는 디버그 버튼으로 유지.

### P2 — PLAY/STOP·자동사냥 다듬기
- STOP: `playing=false`일 때 몹 위치·애니 idle 유지(이미 tick early-return). 숨기지 않음 확인.
- PLAY: 같은 무리 재개. 전멸 시 딜레이 후 종대 리스폰(현재 regen 유지·수치만 맞춤).
- 자동 ON: 사거리 안이면 정지 사격, 밖이면 접근(현재 로직 정제: 6m/9m 규칙에 가깝게).
- UI: 플레이 모드에 "종대 스폰 / 직선샷 디버그 오버레이" 토글.

### P3 — 무기·피해 규칙 이식
- volley=1, HP2.
- 쌍권총 2발 비주얼 / 바주카 1발 (캐릭 무기가 아직이면 **플레이어 측만** 직선샷 먼저, 몹 반격은 후순위).
- `D_prop_gun` 류는 캐릭 유닛랩 경로 있을 때만 붙임. 없으면 총구 오프셋 임시.

### P4 — 몹·연출
- 몬스터 풀: `monsters_anim` 등 클립 있는 GLB 여러 종 로테이션(복셀구름은 forwardWave 전용으로 두고, 숲 플레이는 GLB 우선).
- 사망: 짧은 디졸브/픽셀(기존 스케일다운 대체 또는 병행).
- LOS 막힘: aim 유지 + 측면 우회 한 칸(TODO 해소).

### P5 — 문서·검증
- 본 문서 유지·갱신.
- 스샷: 종대 / 직선빔 히트 / STOP 정지 / 나무 뒤 미사.
- forward-wave는 **규칙 레퍼런스만**. 아일랜드→숲 이식은 별도 승인 후.

## 하지 않을 것

- `JourneyStage3D` / `journey3d_layout.json` / SectorPurifyLoop 연결
- forest-map-tool 수정
- BOARD 타 에이전트 행, git 커밋
- 참고 영상의 각성·관통 빔 그대로 복제

## 바로 착수 시

승인되면 **P0 → P1 → P2** 순으로 forest-play만 구현. 한 단계마다 URL + 스샷으로 보고.

## Nav blockers (play-only) — 2026-09-27

- `PlayNavOverlay` (`src/tools/forestPlay/PlayNavOverlay.ts`) clones the forest walk mask and paints **all construction pad footprints** (slot width×depth) as non-walkable, plus optional `blockDisk`.
- Pads block whether empty or installed (combat lanes stay clear of install regions).
- Installed towers/units live on those pads; rebuild runs on load / install / clear / demo via `PlayBuild.onNavDirty` → `syncPlayNav()`.
- Player move + `PlayCombat` (spawn / chase / `segmentClear` shots) all use `navOverlay.nav` — forest-map / `ForestNavigation` source unchanged.
- Static tree/non-walkable cells from the forest tool stay blocked.

## Monster pack / regen (Cursor forward-wave rules)

- **2열 종대** preferred: pack ~10–15, ranks=2, lateral 1.7m, depth 2m, front rank ~8.2m ahead of player facing.
- Spawn only where `nav.canStand` (forest walkable **and** dynamic pad blockers clear). Nudge if ideal cell blocked.
- After wave clear: delay then `spawnWave` regen (not forest-map scatter-12).
- Mobs chase with `findPath` (~1s refresh / stuck), speed ~3, STOP freezes in place (no despawn).

## P0 Straight shots

- Fire along character yaw (muzzle/chest forward); thick short beam visual — **no** aimMob-homing trail.
- Hit first living mob on the clear ray segment; `segmentClear` respects trees + pad blockers.
- Fooderduck feel reference: straight energy into an advancing pack; no awakening penetrate / skill beams.

## Verify checklist

- Install tower on pad → player/mob path cannot cross pad footprint.
- 2-rank pack spawns ahead on walkable cells only; STOP freezes.
- Straight shot miss behind tree / hit on line.


## forest-play follow-up implementation (2026-09-27)

- Matched Cursor hunt loop: PLAY remains active while a 2-rank pack chases, dead waves regenerate after a short delay, and STOP freezes the current wave. PLAY pressed during GLB loading now starts the first wave after the pool is ready.
- Matched weapon split: `dual pistol` uses `shoot`, two muzzle points (`D_prop_gun` + `D_prop_gunL`), two independent projectile/beam FX, and 0.55s cadence; `bazooka` uses `shoot2`, one `D_prop_rifle` muzzle, one projectile, and 1.05s cadence. Both use Cursor HP2 / one damage per landed shot.
- Added the forest-play weapon selector; auto-hunt defaults to dual pistol and can be switched to bazooka.
- Player and mob locomotion now cross-fade walk/run and idle clips; auto-hunt player movement is included in the locomotion decision.
- Remaining limitation: forest-play uses GLB mesh FX rather than Cursor's cloud/purify FX, and shots still use the forest-play straight-ray hit test.

## 자동사냥 거리·착탄 (2026-09-27 밤)

- 몹은 플레이어에게 4.2m까지 붙지 않는다. 살아있는 맨 앞 줄 슬롯은 8.2m, 뒷줄은 +2m. 그 칸까지 `findPath` + `nav.move`만 쓴다.
- 가장 가까운 적이 6m 안이면 뒤로 물러나고, 9m 밖이고 탄이 날아가는 중이 아니면 다가간다. 둘 다 네비 이동이다. 선이 나무·패드에 막히면 한 걸음 옆으로 비킨다.
- 직선 탄은 나간 뒤 0.2초 뒤에 그 선 위를 다시 봐서 맞춘다. 그 사이에는 달려서 발사를 취소하지 않는다.
- 자동 사냥 중 앞줄이 살아 있으면 쌍권총, 앞줄이 없으면 바주카. 무기 셀렉트도 같이 바뀐다.
- 사망은 작아지면서 투명해진다. 쏘기 클립은 걷기 전환이 바로 자르지 않는다.

## 리젠 방향 (2026-09-27 밤)

- 기본 캐릭터 yaw 0은 남쪽(카메라 쪽)을 본다. 그래서 종대가 카메라 뒤 8~10m에 나오고, 사격도 화면 밖에서 끝났다.
- `spawnWave`는 카메라가 보는 지도 방향으로 몸을 돌린 뒤 그 앞에 종대를 깐다. 전멸 리젠도 같은 경로다.
- 확인: 스폰 (75, 26)에서 11마리 전부 북쪽, 착탄으로 줄어든 뒤 다음 웨이브도 북쪽 11마리.

## 캐릭 애니·납도·미사일 (2026-09-29)

- 기본 이동 클립은 `run`. 공격 중 이동은 걷기 속도(2.6m/s)이고, 움직이며 쏘면 `walk_shoot`(바주카는 발사 `shoot2` 뒤 `walk_gun`).
- 무기 전환은 `draw`/`holster`, 바주카는 `draw_launcher`/`holster_launcher`. 이 클립이 끝나기 전에 걷기·달리기가 자르지 않는다.
- 탄은 총구 `muzzleLocal` 구멍에서 직선으로 날아가는 미사일이다. 쌍권총 2발, 바주카 1발. 맞힌 횟수는 한 volley = 1. 툴의 missile 셀렉트로 쌍권총 직선 / 바주카 직선 / 투척 포물선을 고른다.
- 애니 버튼·목록에서 고른 클립은 WASD 중에도 유지된다. 다시 자동 달리기는 「이동 시 달리기」를 켰을 때.
- 키 1 = 쌍권총, 키 2 = 바주카. 누르는 동안 자동 종대 무기 전환은 멈춘다. 정화 단계 키는 3과 `[` `]`.

