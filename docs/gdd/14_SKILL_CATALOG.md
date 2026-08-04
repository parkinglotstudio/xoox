# 14. 스킬 카탈로그 (Skill Catalog SSoT)

> 갱신: 2026-07-15  
> 원작: [Capybara Go Skills](https://capybara-go.game-vault.net/wiki/Skills) / [Stats and Effects](https://capybara-go.game-vault.net/wiki/Stats_and_Effects)  
> 수치 공백: 평타 프로크 35%/50%, 원소 ATK 30%, 동결 8%/12%, DoT ATK 20%/턴·3스택

CSV: `skill_config` (정체) · `skill_effect_config` (발동) · `skill_level_config` (강화 배율)

---

## 1. 발동·페이로드 원칙

| 단위 | 규칙 |
|------|------|
| 피해 | `ATK_RATIO` |
| 실드·회복 | `MAX_HP_PCT` |
| 확률 | `trigger_value` % |
| 슬롯 | PASSIVE / THROW / ACTIVE / AFTER_ATTACK / RAGE / SHIELD / ON_HIT / COUNTER / START / COMBO |
| **볼리** | `VOLLEY_COUNT`+`VOLLEY_RATIO` · 슬롯 `BOLT`/`DAGGER`/`FIREWAVE`/`SPEAR` · **발수 누적 후 한 발씩** 피해·로그 (합산 금지) |

### 엔진 인프라 (필수)

| 개념 | 설명 |
|------|------|
| dodge_rate | 피격 시 회피 → 피해 0 |
| combo_rate | BASIC 직후 추가 BASIC |
| counter_rate | 피격 후 반격 판정 |
| crit_rate | 평타 치명 (1차: 배율만, 로그 optional) |
| FREEZE / STUN | 해당 액터 1턴 스킵 |
| BURN / POISON | 턴 시작 DoT, 스택 캡 3 |
| light_spear_mult | 빛의 창 피해 배율 |
| heal_bonus | 회복량 가산 (%p MaxHP) |
| round_dr_stack | Battle-Hardened: 라운드당 DR +8%, 캡 75% |

---

## 2. 보유 스킬 전수 (구현 상태)

범례: `done` = CSV+엔진 연결 예정/완료 · `infra` = 인프라 의존

### A. PASSIVE

| skill_id | 원작 | 트리거 | 수치 | 상태 |
|----------|------|--------|------|------|
| sk_skinharden | Hardened | ALWAYS | DR 10% (×0.90) | done |
| sk_skinharden_plus | Hardened+ | ALWAYS | DR 15% (×0.85) | done |
| sk_tough | Hardened 약화 | ALWAYS | DR 5% (×0.95) | done |
| sk_dodge_boost | Dodge | ALWAYS | dodge_rate +10 | done |
| sk_dodge | Critical Dodge | ALWAYS + HP&lt;30% | dodge_rate +20 (저HP) | done |
| sk_lightning_mastery | Bolt Mastery 근사 | ALWAYS | SKILL_DMG +0.08 | done |
| sk_lightning_mastery_plus | | ALWAYS | SKILL_DMG +0.14 | done |
| sk_crown | Royal Crown | ALWAYS | ATK/DEF/MaxHP +15% | done |
| sk_heal_boost | Enhanced Recovery | ALWAYS | heal_bonus +2%p | done |
| sk_lightspear | Light Spear Mastery | ALWAYS | light_spear_mult +0.60 | done |
| sk_defense_max | Battle-Hardened | ROUND | DR +8%/라운드, 캡 75% | done |
| sk_lifedeath | Glass Cannon | HP≤30% | DMG×1.5, 피격×1.3, 킬시 MaxHP 10% 회복 | done |
| sk_combo2 | Combo Spirit | ALWAYS | combo_rate +15, combo max 2, skill_dmg -10% | done |
| sk_comborush3 | 연타 추가타 | ON_COMBO | ATK 0.5 추가타 | done |
| sk_renta_mastery | Combo Mastery | ALWAYS | combo_rate +15, 연타당 ATK 스택 +10% | done |

### B. 평타 연계

| skill_id | 원작 | 트리거 | 수치 | 상태 |
|----------|------|--------|------|------|
| sk_shuriken | Dagger 근사 | DAGGER 볼리 | 1발 · ATK 45% | done |
| sk_shuriken_plus | | DAGGER 볼리 | 2발 · ATK 45% | done |
| sk_renta | Combo | ALWAYS | combo_rate +10 | done |
| sk_renta_plus | Combo+ | ALWAYS | combo_rate +15 | done |
| sk_normal_shield | Basic Attack Shield | AFTER 40% | MaxHP 5% | done |
| sk_normal_shield_plus | | AFTER 50% | MaxHP 8% | done |
| sk_ice_shard_normal | Basic Attack Icy Spikes | AFTER 35% | ATK 30% + FREEZE 8% | done |
| sk_ice_shard_plus | Icy Spikes+ | AFTER 50% | ATK 30% + FREEZE 12% | done |
| sk_bleed | Poisoned Weapon | AFTER 40% | POISON (DoT ATK 20%, 캡3) | done |
| sk_lightning | Round/Basic Bolt | BOLT 볼리 | 1발 · ATK 30% | done |
| sk_lightning_plus | | BOLT 볼리 | 2발 · ATK 30% | done |

### C. 분노

| skill_id | 원작 | 트리거 | 수치 | 상태 |
|----------|------|--------|------|------|
| sk_rage_firewave | Rage Fire Strike | FIREWAVE 볼리 | 2발 · ATK 40% + BURN 25% | done |
| sk_rage_firewave_plus | | FIREWAVE 볼리 | 2발 · ATK 55% + BURN 35% | done |
| sk_rage_shield | Rage Shield | ON_RAGE | MaxHP 10% | done |
| sk_rage_shield_plus | | ON_RAGE | MaxHP 15% | done |
| sk_rage_shuriken | Rage Dagger 근사 | DAGGER 볼리 | 1발 · ATK 45% | done |

### D. 피격·빈사·반격

| skill_id | 원작 | 트리거 | 수치 | 상태 |
|----------|------|--------|------|------|
| sk_flame_shield | Fire Guard | ON_HIT_CHANCE 30% | 화염파 ATK 40% + BURN 25% | done |
| sk_critical_shield | Critical Shield | ON_HP_FIRST_BELOW 30 | MaxHP 25% | done |
| sk_critical_shield_plus | | same | MaxHP 35% | done |
| sk_neartodeath_recover | Critical Recovery | ON_HP_FIRST_BELOW 30 | 3라운드 매턴 MaxHP 10% | done |
| sk_counter_light | Counter Light Spear | SPEAR 볼리 | 1발 · ATK 30% | done |
| sk_counter_light_plus | | SPEAR 볼리 | 2발 · ATK 30% | done |
| sk_revival | Revive | DEATH | MaxHP 30% 1회 | done |

### E. 신화·특수

| skill_id | 원작 | 트리거 | 수치 | 상태 |
|----------|------|--------|------|------|
| sk_firecracker | Firecracker | COMBAT_START R1 | STUN 1턴 | done |
| sk_ice_touch | Frozen Touch | EVERY 2 ROUND | Icy Spike + 일반적 즉사 8% | done |
| sk_orc | Orc! | ALWAYS | crit_rate +50, rage_gain = 0 | done |

---

## 3. skill_effect target 목록 (확장)

| target | 의미 |
|--------|------|
| DMG_TAKEN_MULT | 피격 배율 MUL |
| SKILL_DMG_MULT | 스킬 피해 가산 |
| ATK_MULT / DEF_MULT / MAX_HP_MULT | 런 스탯 배율 (크라운) |
| COMBO_RATE / COUNTER_RATE / DODGE_RATE / CRIT_RATE | 확률 가산 |
| HEAL_BONUS_PCT | 회복 %p |
| LIGHT_SPEAR_MULT | 빛의 창 배율 |
| ROUND_DR_ADD | 라운드당 DR 가산 (캡은 엔진) |
| BONUS_DMG_FLAT | 추가 피해 (value_type ATK_RATIO/FLAT) |
| SHIELD_FLAT | 보호막 |
| HEAL_FLAT / HEAL_MAX_HP_PCT | 회복 |
| STATUS_BURN / STATUS_POISON / STATUS_FREEZE / STATUS_STUN | 상태 |
| COMBO_EXTRA_HIT | 연타 성공 시 추가타 ATK_RATIO |
| COMBO_ATK_STACK | 연타당 ATK 버프 스택 |
| RAGE_GAIN_LOCK | 분노 충전 0 |
| GLASS_CANNON | 저HP 폭증 플래그 |
| KILL_HEAL_PCT | 킬 시 MaxHP% 회복 |
| EXECUTE_PCT | 즉사 확률 (일반 적만) |
| REVIVE_HP_PCT | 부활 HP% (코드 연동) |

---

## 4. 백로그 (이번 미구현 · 원작 목록)

단검군(Dagger/+ / Healing / Rage / Bolt / Poison), Sword Chi, Round Light Spear, Hits Recovery/Bolt/Icy, Thunderbolt, Shock Discharge, Rage Heal, Battle Cry, Deadly Spikes, Indestructible, Trinity Force, War Veteran 등 — 위키 Common/Legendary 잔여.

---

## 5. 로그 키 (ui_text)

`ui_stage_dodge`, `ui_stage_combo`, `ui_stage_freeze`, `ui_stage_stun`, `ui_stage_burn_tick`, `ui_stage_poison_tick`, `ui_stage_status_apply`, `ui_stage_crit_recover`, `ui_stage_execute`
