# 04. 시스템 구조 (System)

> 축: 코드·데이터·상태가 어떻게 연결되는가  
> 갱신: 2026-07-15 (1차 정리: 4허브)
> ⚠️ **【진행 중, 2026-07-17】** XOOX 전환으로 roster_scope(임시동료/영구소장)·정화 판정(corruption_gauge)·Memory Battle 등 신규 개념이 4허브 어디에 들어갈지 아직 미확정. 상세: [`17_XOOX_전환.md §4`](17_XOOX_전환.md#4-데이터-허브-반영-방향-검토-필요-아직-미확정)

---

## 4.0 4마스터 허브 【확정】

| 허브 | 마스터 | 서브 |
|------|--------|------|
| Entity | entity_config | combat_enemy, player_base, enemy_skill/pattern |
| Item | item_config | (로더가 currencies/passives 파생) |
| Skill | skill_config | tier, level, effect, **skill_pool** |
| Effect | effect_config | pools, branch, minigame, content_link |

코드는 **표시명(한글)으로 분기하지 않음**. `grade_id` / `css_key` / `is_jackpot` / `side` / `pool_id` / `combat_tuning` 키 사용.

---

## 4.1 레이어

```
CSV (data/) 
  → data.ts 로드/파싱 
  → engine.ts 순수 로직 (롤·효과·전투 시뮬·맵 배율)
  → main.ts UI 오케스트레이션
  → effects.ts / style.css 연출
```

| 파일 | 역할 |
|------|------|
| `csv.ts` | fetch + 파서 |
| `data.ts` | GameData 조립 |
| `types.ts` | 인터페이스 |
| `engine.ts` | 규칙 (사이드이펙트 최소화) |
| `main.ts` | 턴 루프, DOM, 패널 |
| `effects.ts` | 배너·스크램블 등 (setInterval) |
| `rng.ts` | weightedPick 등 |

---

## 4.2 핵심 파이프라인 — 「다음날」

1. (이동 연출 MOVING)  
2. `rollIsCombat` / `combat_day_schedule` 우선  
3. 비전투 → `rollContentType`  
4. 등급 필요 시 `rollGrade`  
5. 풀/지역/분기 픽 → `applyEffectId`  
6. 게이지·마일스톤·레벨업 후처리  
7. `finishTurn` → 버튼 IDLE / 전투 대기

전투 대기 시: 조우 카드 → 「전투」 → MOVING → 상단 시뮬 → 보상.

---

## 4.3 효과 단일 경로

`applyEffectId(data, state, effectId)`

| effect_type | 역할 |
|-------------|------|
| STAT_PCT / STAT_ABS | HP/ATK/DEF 등 |
| CURRENCY | 골드·EXP·깃발… (`item_config` 매핑) |
| SKILL_GRANT | 스킬 ID 또는 `skill_pool_config`의 POOL_* → `learnSkill` |
| SKILL_UPGRADE | +강화 (`want_upgrade` 또는 effect_type) |

스킬 학습 단일 경로: `learnSkill` / UI는 `applyLearnedSkill`  
선택 풀: `pickSkillChoices` (`levelup_rule_config`로 +카드 노출)

---

## 4.4 전투 시스템

```
pickCombat → simulateCombat(맵배율 + ATK/DEF 베이스 + skill_level/effect 배율)
  → 상단 stage-log 재생 (≤15턴)
  → resolveCombat (승패·보상·상자)
```

- `getStageMapForDay(day)` → `stage_map_config`  
- `getEffectiveCombatStats` → **표시 ATK/DEF = state만** (스킬 미가산)  
- `resolveSkillCombatMods` → `skillDmgMult` / `dmgTakenMult` (level + ALWAYS effect)

---

## 4.5 상태 (PlayerState 요약)

day, level, exp, hp/maxHp, atk, def,  
재화·inventory, gaugeCounts, learnedSkills,  
seenLocations, finalBossDefeated, milestones, passives

메타: localStorage 챕터·최고 일차.

---

## 4.6 아이템 중심화

- 마스터: `item_config`  
- 구 `currency_config` / `passive_item_config` = 호환 미러  
- 이벤트 재화: category + event_id

---

## 4.7 프리즘 참조에서 가져온 것 / 안 가져온 것

| 가져옴 | 안 가져옴 |
|--------|-----------|
| CSV SSoT, 테이블 분리, Resolve 한 경로 철학 | fire_pattern, 투사체, 스킬 Lv1~5, EVO 조합 |

상세 스펙: `plan/SKILL_BALANCE_STRUCTURE.md`

---

## 4.8 빌드·검증

```bash
npm run dev
npx tsc --noEmit
```

한글 CSV 깨짐 → `scripts/fix-ui-text.mjs`, `scripts/fix-stage-csv.mjs` 등.
