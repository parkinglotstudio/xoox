# 데이터 테이블 안내

카피바라 고 실측(Day1~60) 기반 예시 데이터입니다. `weight` 컬럼의 숫자는 **실제 확률이 아니라 상대적 예시값**입니다.

> **게임 기획서:** `docs/gdd/00_INDEX.md`  
> **데이터 사전:** `docs/gdd/06_DATA_TABLES.md`

## 4마스터 허브 【확정】

| 허브 | 마스터 | 설명 |
|------|--------|------|
| **Entity** | `entity_config` | 플레이어·몬스터 유닛 (캐릭터≠아이템) |
| **Item** | `item_config` | 재화·패시브·재료·(후)장비 |
| **Skill** | `skill_config` | 스킬 정체 → tier/level/effect/**pool** |
| **Effect** | `effect_config` | 지급·즉발 → 풀/분기/미니게임 FK |

## 롤 파이프라인
1. `progression_phase_config` — combat vs content
2. `content_type_config` — 비전투 타입
3. `grade_config` — 등급 (`css_key` / `is_jackpot` — 한글명 매칭 금지)
4. pool / location / branch / minigame → `effect_config`

## 미니게임 진입 【분기점】
- 표: `docs/gdd/15_MINIGAME_ENTRY.md`
- CSV: `minigame_entry_config.csv` (고아 warn)
- 게이지: 대박→행운의보물 / 중박→행운의룰렛 / **신화≠게이지**(일일 `p_mythslot`)

## 신규·주의 (2026-07-15 1차)
- `entity_config`, `skill_pool_config`, `content_link_config` 신설
- `combat_tuning`: EDGE 배율·페이즈%·적 폴백·`revival_skill_id`
- `minigame_reward_pool.side`: angel|devil (천사/악마 라벨 includes 금지)
- **삭제:** `currency_config`, `passive_item_config` (item_config 파생)

## 테이블 목록 (요약)
- Entity: entity / combat_enemy / player_base / enemy_skill / enemy_pattern / combat_tuning
- Item: item_config
- Skill: skill_* / skill_pool / levelup*
- Effect: effect / grade / pools / location / branch / minigame* / content_link / scenario / milestone / event
- 진행: stage_map(1~4) / combat_day_schedule / phase / content_type / stage_mode / ui_text / keyword

## 상단 비주얼 스테이지
- 모드: `stage_mode_config`
- 전투: Entity 서브 + tuning ≤15턴

## 훈장 시스템 (미구현 · 참조)
- `item_adventurer_badge` — 시작 스킬 미리보기 (확률 롤 아님)
