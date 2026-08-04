# 08. 스킬 기획 (Skill Design)

> 축: 스킬이 무엇인지 / 어디서 오나 / 전투에 어떻게 기여하나  
> 갱신: 2026-07-15  
> 상세 기술 스펙: `plan/SKILL_BALANCE_STRUCTURE.md`  
> 영상 목록: `plan/SKILL_LIST_FROM_VIDEO.md`  
> 빠뜨린 재작업: `12_SKIPPED_REWORK.md`

---

## 8.1 원칙 【확정·지시】

1. **스킬 학습 ≠ ATK/DEF 스탯 상승**  
2. **ATK 증가 버프**는 전투 중 걸릴 때만 (별 시스템)  
3. 스킬은 **런 레벨이 오를수록 조금씩 강해짐**  
4. ATK 감소는 **악마 계약 등 선택 대가**  
5. **강화(+)**: 같은 베이스 재선택 또는 `+` 카드 선택 시 원본→+ 교체 【구현】  
6. **skill_effect** 조건부 트리거 【구현】 — 상세 카탈로그: `14_SKILL_CATALOG.md`

---

## 8.2 티어

| 티어 | 용도 |
|------|------|
| 일반 | 레벨업·일반 풀 |
| 전설 | 레벨업·상자·이벤트 |
| 신화 | 미니보스 상자·고난이도 보상 |
| 미확인 | 데이터 미확정 |

UI 배지·색: `skill_tier_config`  
강화 카드 배지: `ui_skill_upgrade_badge` / CSS `tier-upgrade`

---

## 8.3 정체 vs 수치

| 레이어 | CSV | 상태 |
|--------|-----|------|
| 정체 (이름·아이콘·설명) | skill_config | ✅ |
| 지급 | effect_config SKILL_* / levelup / 미니게임 | ✅ |
| 업그레이드 규칙 | levelup_rule_config | ✅ |
| 레벨 배율 | skill_level_config (1=기본, 2=+) | ✅ |
| 개별 발동 수치 | skill_effect_config | ✅ `14_SKILL_CATALOG` SSoT |
| 전투 기여 | skill_level + 런레벨 + skill_effect | ✅ |

---

## 8.4 강화(+) 흐름

1. `pickSkillChoices` — 보유 베이스가 있으면 `+` 카드를 우선 노출 (`upgrade_offer_min`)  
2. `learnSkill` — 베이스 재선택 또는 `+` 선택 시 원본 제거 후 `+` 등록  
3. 상단 `stage-skills` — 보유 아이콘, `+`는 노란 배지  
4. 전투 — `skill_level.combat_power_scale` + ALWAYS `skill_effect` (피해 배율 / 피격 배율)

---

## 8.5 스킬이 아닌 것 (혼동 금지)

| 이름 | 분류 |
|------|------|
| 천사 고공격력 / HP 회복 | 일회 축복 |
| 레벨업 HP +5% | levelup_config |
| 이벤트 ATK +7% 칩 | effect 즉발 |

---

## 8.6 영상 기준 핵심 스킬 (발췌)

신화: 부활, 결사의 일전, 폭죽, 파괴 불가, 방어 끝판왕, 슈퍼 생명력, 유리 대포, 콤보 X2 …  
일반: 피부 경화(+), 번개 슈레더(+), 수리검, 연타, 보호막·화염파 계열 …

CSV 누락·이름 불일치: `SKILL_LIST_FROM_VIDEO.md` §3~4.

---

## 8.7 지급 UX

- 3택1: 버튼 → 패널 → 카드 선택 (강화 카드는 「강화+」 배지)  
- 자동학습: levelup AUTO (`grantSkillFromTier` → `learnSkill`)  
- 학습/강화 로그: `ui_skill_learned*` / `ui_skill_upgraded*`  
- 학습한 스킬 북 UI  
- 상단 비주얼 스테이지 스킬 아이콘 바

---

## 8.8 다음 스킬 작업

1. ~~skill_effect 조건부 트리거~~ → **`14_SKILL_CATALOG.md`**  
2. 원작 백로그 (단검·Sword Chi·Hits 계열) CSV 추가  
3. 전투 중 ATK 버프 상태 (연타 스택과 통합됨 — 확장 여지)  
4. EVO / fire_pattern — **제외** (`12_SKIPPED_REWORK`)
