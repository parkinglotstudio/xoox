# 13. 전투 기획·시스템 (원작 대칭 모델)

> 축: **플레이어 = 적** 같은 행동 문법으로 텍스트 턴제 전투  
> 근거: 카피바라 고 공식/위키(Skills·Stats) + 영상 RE(`plan/SKILL_LIST_FROM_VIDEO.md`, `RE_GAP_PLAN.md`)  
> 갱신: 2026-07-15  
> 상태: 【구현됨 — Entity 허브 연동】  
> 데이터: `entity_config` → `combat_enemy` / `enemy_pattern` / `enemy_skill` / `combat_tuning`

---

## 0. Q&A 확정 (이번 지시 반영)

| # | 질문 | 결론 | 근거 |
|---|------|------|------|
| 1 | 일반전 레벨업 스킬? | **없음 (정정)** | FULL 영상: 사냥 후 EXP/레벨업 HP만. 스킬은 **상자·이벤트(정령 등)**. 위키와 충돌 시 **영상·사용자 판독 우선** |
| 2 | 정예 방패+참격? | **OK** + **분노·연타·보호막**을 공통 키트로 정의 | 원작 코어 = Basic / Combo / Rage / Shield |
| 3 | 예고 강타? | **우선 안 씀** | 대신 원작처럼 **분노 게이지 풀 → 분노 스킬**. 일반·정예·보스 모두 연타·분노·보호막 등 **같은 슬롯** 사용 |

### 스킬 획득 (FULL 영상 확정)

| 경로 | 보상 |
|------|------|
| ~~레벨업~~ | ~~스킬 3택1~~ → **안 함** (HP% 회복만) |
| 정예 처치 | **신화** 황금상자 3택1 |
| 최종 보스 | 전설 상자 |
| 정령·악마 등 | 스킬 vs 대가 |
| 시작 미리보기 | 기존과 동일 |

전투 로그: **캐릭터와 동일하게** 몬스터도  
`일반공격 / 연타 / 분노기 / 보호막 생성·흡수 / 상태(분노 충전)` 를 한 줄씩 표기.

---

## 1. 원작 전투 코어 (다시 정리)

### 1.1 한 라운드에 일어나는 일 (위키·가이드 공통)

```
라운드 시작
 ├─ 양측 Basic Attack (평타)
 │    ├─ Combo 확률 → 추가 Basic
 │    ├─ Basic 연계 효과 (수리검·보호막·속성…)
 │    └─ Counter는 “피격 시” 슬롯
 ├─ Rage 게이지 축적 (피격·공격·스킬에 따라)
 └─ Rage Full → Rage Skill (분노기) 발동
      └─ Rage Shield 등 분노 연계
```

중요:

- **적도 Rage를 쌓고 Rage Attack을 쓴다** (후반일수록 위험 → Shock Discharge 같은 카운터 스킬 존재)
- Shield = HP 위 추가 층 (피해감소 적용 후 흡수)
- Combo / Counter / Rage / Basic Shield 는 **양측 대칭 개념**

### 1.2 스킬 획득 (FULL 영상)

| 경로 | 보상 |
|------|------|
| 레벨업 | **HP%만** (스킬 UI 없음) |
| 정예 처치 | **신화** 황금상자 3택1 |
| 악마 계약·정령 | 스킬 (대가) |
| 시작/이벤트 | 기존과 동일 |

→ 프로토: 전투 레벨업 스킬 **제거**. 상자·이벤트만.

### 1.2b 전투 전 VS (FULL t≈400s)

좌 **청 프레임** / 우 **적 프레임** + 중앙 VS + **등급 배지(일반/정예/최종)** + 몬스터 이름.  
타임라인: 검=일반, 보라해골=정예, 왕관=최종.

### 1.3 영상에서 읽힌 플레이어 스킬 → 슬롯 매핑

| 영상 스킬 | 슬롯 | 비고 |
|-----------|------|------|
| 수리검 | THROW (평타 전/연계) | 개별 피해 줄 |
| 연타 / 콤보 X2 | COMBO | 평타 후 추가 Basic |
| 분노 공격 화염파 / 보호막 / 수리검 | RAGE | 분노 풀 시 |
| 일반 공격 보호막 | AFTER_BASIC | 확률 실드 |
| 피부 경화·파괴불가 | PASSIVE | 피격 배율 |
| 반격 빛의 창 | COUNTER | 피격 시 |
| 부활 | DEATH | 1회 |

스킬 수치·상태 SSoT: **`docs/gdd/14_SKILL_CATALOG.md`**  
전투 인프라: dodge / combo / counter rate, FREEZE·STUN·BURN·POISON, Battle-Hardened 누적 DR.

---

## 2. 공통 액터 모델 (플레이어 = 몬스터)

전투 유닛은 전부 같은 구조:

```ts
CombatActor {
  side: "player" | "enemy"
  name, icon
  hp, maxHp
  atk, def
  shield, shieldMax
  rage, rageMax          // 원작 분노 게이지
  kit: ActionDef[]       // 이 유닛이 쓸 수 있는 행동
  status: { raging?: boolean, ... }
}
```

### 2.1 행동 슬롯 (Action Slot) — 양측 공통

| slot | 언제 | 로그 예 (플레이어) | 로그 예 (적) |
|------|------|-------------------|--------------|
| `BASIC` | 매 턴 기본 | `일반 공격! 적에게 752 피해` | `💀 해골의 일반 공격! 496 피해` |
| `COMBO` | BASIC 직후 `combo_rate` | `👊 연타!` | `👺 연타!` |
| `THROW` | BASIC 전/연계 | `🌀 수리검!` | (캐스터형) |
| `RAGE` | rage ≥ max | `🔥 분노 화염파!` / `💢 분노 일격!` | `♞ 암흑기사의 분노 참격!` |
| `SHIELD` | 조건 발동 | 평타 확률 / 분노 시전 / HP30% 최초 | `🛡️ 보호막` |
| `COUNTER` | 피격 후 `counter_rate` | `🔆 반격 빛의 창` | `반격!` (정예+) |
| `PASSIVE` | 상시 / 라운드 | DR·회피율·크라운 등 | 동일 |

### 2.2 라운드 처리 (한쪽 연계 → 상대 연계)

```
라운드 N
 ├─ — 모험가 공격 —
 │    THROW → BASIC → ACTIVE(연타…) → SHIELD
 └─ — 적 공격 —
      THROW → BASIC → COMBO → SHIELD → RAGE
      (반격은 적 연계 종료 후)
```

한 타 = 한 줄. 합산 표기 금지. 쪽 전환 시 `side_gap_ms` 여운.

---

## 3. 티어별 키트 (순서: 일반 → 정예 → 보스)

### 3.1 NORMAL — 일반 몬스터

**목표:** 맵1 여유 / 맵2는 방심하면 깎임.  
**키트 얇음.** 분노는 느리게, 연타는 가끔.

| pattern_id | 이름 | BASIC | COMBO | RAGE | SHIELD | rage/턴 | 예시 |
|------------|------|-------|-------|------|--------|---------|------|
| `N_SWARM` | 떼 | ○ | 22% | 약함(풀 시 소강타) | ✕ | +12 | 고블린·늑대 |
| `N_BRUTE` | 둔탁 | ○ | 12% | 중(풀 시 강타) | ✕ | +15 | 나무·예티 |
| `N_CASTER` | 주술 | ○(약) | ✕ | 중 + THROW형 스킬 | ✕ | +18 | 네크로·슬라임 |
| `N_GUARD` | 방패병 | ○ | 10% | 약 | START 소실드 | +10 | 팔라딘 |

로그 샘플 (일반):

```
— 턴 2 —
🌀 수리검! 400 피해
일반 공격! 고블린에게 720 피해
👊 연타! 500 피해
👺 고블린의 일반 공격! 380 피해
```

### 3.2 MINIBOSS — 정예

**목표:** “다르다”. 보호막 + 분노가 **눈에 보임**.  
**키트 두꺼움.** 처치 → 신화 상자.

| pattern_id | 이름 | 특징 | 핵심 스킬 |
|------------|------|------|-----------|
| `E_KNIGHT` | 암흑기사 | START 실드 / 재실드 확률 / 분노=참격 | `es_guard_up`, `es_slash_rage`, COMBO 18% |
| `E_BERSERK` | 광전사 | HP↓일수록 COMBO·rage 가속 | `es_frenzy` (분노 연타), COMBO 35% |
| `E_HEX` | 주술 정예 | 디버프(피증) + 흡혈타 | `es_curse`, `es_drain` |

정예 공통:

- `rageMax` 낮음 or `rage/턴` 높음 → **분노기가 자주**
- START `SHIELD` 2000~3500
- 로그에 `🛡️ 보호막 잔량` / `💢 분노!!` 표기

로그 샘플 (정예):

```
— 턴 5 —
🛡️ 암흑기사가 보호막을 올린다! +2200
일반 공격! 암흑기사에게 800 피해
보호막이 800 피해를 흡수!
💢 암흑기사 분노 참격! 1320 피해
보호막이 640 피해를 흡수!
❤️ HP 1200 피해
```

### 3.3 FINALBOSS — 최종

**목표:** 같은 슬롯이지만 **수치·빈도·페이즈**로 압박.  
예고 강타 대신 **페이즈별 rage/연타 가중**.

| 페이즈 | HP | 변화 |
|--------|-----|------|
| P1 | 100~60% | 정예급. 실드 유지 |
| P2 | 60~30% | rage 가속 + COMBO↑ |
| P3 | 30~0% | 분노기 강화(피해↑) / 실드 재생성 주기↑ |

보스 키트 예 (`B_GUARDIAN`):

- BASIC / COMBO 25% / RAGE(강참격) / SHIELD_WALL / (선택) COUNTER

로그 샘플 (보스 P2 진입):

```
— 페이즈 2 —
수호자의 분노가 치솟는다!
💢 수호자 분노 강타! 1800 피해
```

---

## 4. 시스템 구조 (CSV + 엔진)

### 4.1 데이터 테이블

| CSV | 역할 |
|-----|------|
| `combat_enemy_config` | 스탯 + `pattern_id` + `rage_max` + `rage_per_turn` |
| `enemy_pattern_config` | pattern → slot 가중·조건 (hp_below 등) |
| `enemy_skill_config` | 적 스킬 정체·effect·로그 템플릿 |
| `skill_effect_config` | 플레이어 (기존) — slot 정렬 유지 |
| `combat_tuning` | 양측 dmg scale, rage 기본값, 턴 딜레이 |
| `ui_text_config` / `combat_log_text` | 양측 공통 로그 키 |

### 4.2 엔진 파이프라인

```
pickCombat(tier)
  → buildActor(player) + buildActor(enemy from pattern)
  → for turn 1..15:
       resolveSide(player)
       resolveSide(enemy)
       applyCounters / shield absorb (이벤트마다 로그)
  → CombatSimResult.logs[]  // kind + side + text + hp/shield/rage 스냅샷
  → playCombatOnStage (양측 동일 연출 규칙)
```

`resolveSide(actor)`:

1. THROW  
2. BASIC + rage += hitGain  
3. roll COMBO  
4. roll SHIELD (kit)  
5. if rage >= max → RAGE skill + rage=0 + optional Rage Shield  

### 4.3 로그 레코드 (통일)

```ts
CombatTurnLog {
  turn, side: "player"|"enemy"|"system"
  kind: "basic"|"combo"|"throw"|"rage"|"shield"|"counter"|"buff"|"phase"|"win"|"timeout"
  text, dmg?
  playerHp, enemyHp, playerShield?, enemyShield?
  playerRage?, enemyRage?
}
```

UI: 기존 stage-log 색 클래스에 `hit-enemy-skill`, `hit-rage`, `hit-shield` 추가.

### 4.4 밸런스 골격 (잠정)

| | 맵1 NORMAL | 맵1 정예 | 맵2 NORMAL | 맵2 정예 | 맵2 보스 |
|--|------------|----------|------------|----------|----------|
| 목표 턴 | 4~7 | 7~11 | 6~10 | 9~14 | 12~15 |
| 적 rage/턴 | 8~12 | 18~22 | 12~16 | 22~28 | 페이즈↑ |
| START 실드 | 0~800 | 2.2k~3.5k | 0~1k | 3k~4.5k | 4k~6k |
| COMBO율 | 10~22% | 18~35% | 동상한도↑ | 동상 | 25%+ |

맵 태그:

- CLEAR: 적 피해 완화만. 실승패 (HP1 버팀·강제 승리 없음)
- EDGE / MID / EARLY: 실승패. 턴 초과 = 패배. EDGE 보스는 추가 배율
- 구 FORGIVING soft-clear / HP비율 승리는 제거 (2026-07-15)

---

## 5. 구현 Phase (승인 후)

### Phase 1 — 대칭 골격
- Actor + rage + 양측 로그 kind  
- 적 BASIC/COMBO/RAGE/SHIELD 최소 세트  
- 플레이어 기존 스킬을 slot 명칭과 정렬

### Phase 2 — 티어 키트
- NORMAL 4패턴 배치  
- MINIBOSS `E_KNIGHT` 완성 (실드+분노참격+연타)  
- FINALBOSS 페이즈 + 분노 가속

### Phase 3 — 밸런스 패스
- 목표 턴수 맞춤 (`combat_tuning` / enemy value만)  
- 맵2 “분노가 무섭다” 체감 검증

### Phase 4 — 연출
- 분노 강조 줄, 실드 게이지(적), 티어 자막

---

## 6. 비범위

- 예고 1턴 후 확정 필살기 (원작 분노로 대체)  
- 프리즘 투사체 / 수동 커맨드 입력  
- 장비 UI

---

## 7. 관련 문서

- `08_SKILL_DESIGN.md` — 플레이어 스킬  
- `03_BALANCE.md` — 맵·ATK 규칙  
- `04_SYSTEM.md` — 엔진 레이어 (본 문서 §4로 전투부 확장)  
- `plan/SKILL_LIST_FROM_VIDEO.md` — 영상 스킬명  
- Wiki: [Skills](https://capybara-go.game-vault.net/wiki/Skills), [Stats and Effects](https://capybara-go.game-vault.net/wiki/Stats_and_Effects)

---

## 8. 다음 승인

1. 이 **대칭 모델(Basic/Combo/Rage/Shield)** 로 Phase 1 개발 들어갈까?  
2. 정예 1호는 **암흑기사(E_KNIGHT)** 부터?  
3. 적 분노 게이지를 상단에 **숫자로** 보여줄까, 로그만?  
