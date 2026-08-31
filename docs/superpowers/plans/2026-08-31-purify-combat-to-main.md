# 정화 전투 루프 → 본게임 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로토(`purify-skill-proto-tool`)에서 검증한 **모은다→캐스팅→띠 멈춤→벌레→다시 모은다→원흉→최종 캐스팅** 루프를 본편 `PURIFY` / `SectorPurifyLoop`에 단계적으로 붙인다.

**Architecture:** 프로토 로직을 본편에 복붙하지 않는다. `purify_skill_balance.json`을 SSoT로 두고, `SectorPurifyLoop`(또는 새 `SectorCombatPurifyLoop`)가 같은 페이즈·탄약·게이지 계약을 따른다. 비주얼(BurnRim / SoftBlight / SandBug / CulpritCloud / RaidVfx.release)은 `src/stage/world3d/` 공용으로 승격. 기존 대화·조건·원흉 스펙은 **병행 가능**하게 게이트를 둔다(전투 클리어 ≠ 자동 틴트).

**Tech Stack:** Three.js · Vite · `Journey3DView.runSectorLoop` · `main.ts` PURIFY 트리거 · CSV/JSON 레이아웃 · `purifyAmmo` / throw mag

## Global Constraints

- 정화는 **항상 지점 캐스팅** — 원흉/벌레 처치로 다음 틴트 자동 금지
- **탄 모자람이 컨셉** — 서두른 2차 캐스팅은 막지 않고, 다음 전투에서 막히게
- 동·서·남·북 = 정화 4 · 벌레 퇴치 3 (초판은 동쪽만 가능)
- 실패(오염 100%) → 1차 캐스팅부터 (획득 탄·조건은 정책 명시 후)
- 프로토 툴은 튜너로 유지 (`/purify-skill-proto-tool.html`)
- 기존 `docs/superpowers/specs/2026-08-30-sector-culprit-clear.md` 대화형 원흉과 **충돌 시**: 전투형 루프를 i21 초판에 우선, 대화는 원흉 등장 전/후 필러로 축소할지 사용자 확인

---

## File map

| 파일 | 역할 |
|------|------|
| `data/ui/layout/purify_skill_balance.json` | HP·탄·시간·원흉 비주얼 SSoT |
| `docs/superpowers/specs/2026-08-31-purify-combat-ammo-scenario.md` | 시나리오 스펙 |
| `src/tools/purifySkillProto/*` | 튜너 (본편과 숫자 공유) |
| `src/stage/world3d/BurnRim.ts` 등 | 프로토 → 공용 승격 대상 |
| `src/stage/world3d/SectorPurifyLoop.ts` | 본편 루프 교체/확장 |
| `src/stage/world3d/Journey3DView.ts` | `runSectorLoop` 훅 |
| `src/main.ts` | PURIFY 진입·탄약 UI·필러 |
| `src/dev/purifyAmmo.ts` + `data/purify_ammo_cost.csv` | 메타/투척 탄과 전투 탄 매핑 |
| party HUD / `PurifyRaidHud` | 캐스팅·오염·멈춤·벌레·원흉·탄·긴박감 |

---

### Task 1: 공용 모듈로 승격 (프로토 의존 제거)

**Files:**
- Move/copy: `BurnRim.ts`, `SoftBlightOctet.ts`, `SandBug.ts` → `src/stage/world3d/fx/` 또는 `purify/`
- Update imports in `src/tools/purifySkillProto/*`
- Keep `RaidVfx.playReleaseBurst` / `playGroundBoom` / `playWaterDumpling` in `RaidVfx.ts`

- [x] 프로토 전용 모듈을 `src/stage/world3d/purify/` 로 승격
- [x] `purifySkillBalance` 로더
- [x] i21 `combat_loop: true` → `SectorCombatPurifyLoop`
- [x] 필러 CSV 연결 · Space 발사 · 띠/벌레/원흉 A+B · 해제 연출
- [ ] 본편 탄창(throwAdsorb)과 완전 동기 · 스킬 슬롯 UI
- [ ] 동서남북 확장 · urgency 게이지 오버레이 UI

**Done when:** 본편이 프로토 폴더를 import하지 않고도 같은 VFX를 쓸 수 있다.

---

### Task 2: 밸런스 로더

**Files:**
- Create: `src/stage/world3d/purifySkillBalance.ts` (`loadPurifySkillBalance()`)
- Modify: ProtoLoop이 JSON fetch/로드 (하드코드 `BAL` 제거 또는 fallback)

- [ ] `purify_skill_balance.json` 타입 + 로더
- [ ] ProtoLoop이 로더 사용
- [ ] 숫자 바꾸면 프로토·본편 동시에 반영되는 경로 확보

**Done when:** JSON만 고쳐도 멈춤/벌레/탄/축소시간이 바뀐다.

---

### Task 3: 본편 페이즈 상태머신 골격

**Files:**
- Modify: `SectorPurifyLoop.ts` (또는 새 `SectorCombatPurifyLoop.ts`를 Journey에서 선택)
- Modify: `Journey3DView.runSectorLoop`

페이즈: `gather | casting | purify | bugs | gather | … | culprit | need_cast | done`

- [ ] 기존 beat(`mission/tint1/invade/tint2/king`)와 매핑표 작성 (주석/스펙)
- [ ] i21만 새 루프 플래그 (`sector_loop_i21.json`: `"combat_loop": true`)
- [ ] 캐스팅 중 이동 제한·게이지 UI 콜백 `onHud`
- [ ] 틴트/색 단계는 **캐스팅 완료 시에만** `playTint`

**Done when:** 들판 PURIFY 진입 시 캐스팅 없이 색이 안 바뀌고, 캐스팅 후에만 1차 원이 뜬다.

---

### Task 4: 탄약 경제를 본편 탄창에 연결

**Files:**
- `purifyAmmo.ts`, `main.ts` `onThrowSpend` / party HUD
- `purify_ammo_cost.csv` (필요 시 `THROW_COMBAT` 또는 기존 adsorb/inhibit 매핑)

결정(초판 제안):
- 전투 탄 = **흡착 정화제(throwAdsorb)** 소모 (기본/스킬 코스트는 balance JSON)
- 원흉 막타 구간만 **원흉 처치제(throwCulprit)** 또는 adsorb 폴백 (현 Sector 규칙 유지 가능)

- [ ] Proto `ammo` → player throw mag 동기
- [ ] 픽업 = 기존 FILL/노드/`grantThrowMag` 재사용
- [ ] 탄 0이면 발사 불가 + 필러 “모아와”
- [ ] 2차 캐스팅 전 탄 < hint → 경고만 (막지 않음)

**Done when:** 본편에서 탄을 안 모으고 2차 켜면 다음 벌레전에서 실제로 막힌다.

---

### Task 5: 띠·멈춤·벌레·해제 연출

**Files:** BurnRim, SoftBlight, SandBug, RaidVfx, Sector loop

- [ ] 1차 캐스팅 후 보라 띠 + 8 오염원
- [ ] 축소 타이머 + urgency HUD (50%/75%)
- [ ] 동쪽(초판) 멈춤 게이지
- [ ] 멈춘 **뒤** 벌레 스폰
- [ ] 벌레 전멸 / 원흉 처치 시 `playReleaseBurst` (팍 퍼짐)
- [ ] 필러 팝업(변화 알림) 기존 `onFiller` 연결

**Done when:** 프로토와 같은 “멈춤→벌레→해제 펑”이 들판에서 재현된다.

---

### Task 6: 원흉 비주얼·전투 (감 잡기 게이트)

**Open decision (사용자):** 원흉이 아직 “감”이 없다. 이식 전 프로토에서 하나 고른다.

| 옵션 | 느낌 |
|------|------|
| A | 큰 오염 구름(현 CulpritCloud blight) — 전투형 |
| B | 낮게 깔린 검은 안개+핵만 밝음 — 공포 |
| C | 대화 통과 후 물질만 걷음 (2026-08-30 스펙) — 비전투 |
| D | A + 등장 전 짧은 대사 필러 |
| **A+B (채택)** | 큰 오염 구름 + 낮은 안개·밝은 핵 (`CulpritPresence`) |

- [x] 프로토: `CulpritPresence` = A+B 합본
- [ ] HP·스케일·해제 연출 확정 후 본편 spawn
- [ ] 처치 → `need_cast` → 최종 캐스팅만 클리어

**Done when:** 원흉 처치 후에도 땅/하늘 최종 틴트는 캐스팅으로만 끝난다.

---

### Task 7: HUD·긴박감

**Files:** party HUD / journey overlay / CSS

- [ ] 탄 상시 표시 (low 경고색)
- [ ] 캐스팅 / 오염+남은시간 / 멈춤·벌레·원흉 게이지
- [ ] urgency 클래스 (프로토 `.gauge.urgent/.critical` 이식)

**Done when:** 오염 75%에서 화면만 봐도 “당장 막아야” 한다.

---

### Task 8: 동서남북 확장 (본편 2차)

- [ ] 방향별 멈춤 포인트 4개
- [ ] 정화 4 · 벌레 3 시퀀스 데이터화
- [ ] i11 난이도 숫자만 balance 프로필로 분리

**Done when:** i21에서 4방향 중 최소 2방향이 플레이 가능하다. (또는 동쪽 클리어 후 플래그)

---

### Task 9: 회귀·정리

- [ ] 기존 대화형 원흉/quest 경로 깨짐 없는지 (`combat_loop: false` 맵)
- [ ] `npm run build`
- [ ] 스펙/플랜 체크박스 갱신
- [ ] 프로토 툴 = 밸런스 튜너로 문서화

---

## 권장 순서 (한 줄)

**공용 VFX → JSON 로더 → i21 플래그 캐스팅만 → 탄 연결 → 띠/벌레 → 원흉 감 확정 → HUD → 방향 확장**

## 지금 상태

| 항목 | 상태 |
|------|------|
| 프로토 시나리오·탄 부족 | 있음 |
| 해제(퍼짐) 연출 | 프로토에 추가됨 (`playReleaseBurst`) |
| 원흉 “감” | **A+B 확정** (구름+낮은안개+큰핵) |
| 시나리오·발란스·필러 CSV | **구성 완료** (`purify_skill_balance.json` · `sector_loop_i21.json` · `dialogue_config.csv`) |
| 본편 루프 코드 | **아직** — Task 1부터 |

## 테스트 (매 Task)

1. `/purify-skill-proto-tool.html` — 벌레/원흉 처치 시 청록이 팍 퍼지는지
2. 본편 들판 PURIFY — 캐스팅 없이 틴트 안 됨
3. 탄 고갈 후 발사 불가, 줍기 후 재개
4. 원흉 처치 후 최종 캐스팅 전 `done` 아님
