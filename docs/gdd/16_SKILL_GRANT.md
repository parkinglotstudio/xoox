# 16. 스킬 지급 경로 (Grant Map)

> 분기점 정리 · 2026-07-15  
> SSoT: `skill_config.grant_source` + `effect_config` + `levelup_config` + 미니게임/분기

---

## 16.1 경로 표

| 경로 | 티어 | 메커니즘 | CSV |
|------|------|----------|-----|
| 레벨업 3택/AUTO | 일반~신화(레벨표) | `levelup_config` → `pickSkillChoices` / `grantSkillFromTier` | `levelup_config`, `skill_pool` |
| 미니보스 상자 | 신화 3택 | 전투 승리 후 선택 | combat reward → POOL_MYTH |
| 악마 계약 | 전설 고정 | `b_devil` → `e_skill_renta_mastery` | branch + effect |
| 정령 제물 | 신화 풀 | `e_skill_myth` + 비용 | branch |
| 신화 슬롯 | 신화 풀 | `mg_slot` → `e_skill_myth` | minigame + daily |
| 행운의 룰렛 | 전설/신화/강화 | `mg_square` reward rows | minigame_reward_pool |
| 마왕 타워 | 전설/신화 | `mg_circle` | minigame |
| 메두사/돌정령 | 강화 | `e_skill_common_upgrade` | branch |
| 아레나 베팅 | 전설 | 확률 `e_skill_legend` | branch |
| 고블린 교체 | 보유↔신규 | `e_link_skill_swap` | CONTENT_LINK |

---

## 16.2 규칙

1. **스킬 학습 ≠ ATK 스탯바 상승** (`03_BALANCE`)
2. 지급은 항상 `effect_config` (`SKILL_GRANT` / `SKILL_UPGRADE`) 또는 레벨업 엔진
3. `grant_source` 컬럼은 출처 표기용 (LEVELUP / MINIGAME / CONTRACT / EVENT / UPGRADE)
4. 풀 가중치는 `skill_pool_config` + 레벨표 — **숫자 확정은 플레이 후**

---

## 16.3 의도적 미확정

- LV3 스킬 티어 비율 (영상 표본 부족)
- 상자 vs 레벨업 출현 빈도
