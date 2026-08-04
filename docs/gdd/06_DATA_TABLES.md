# 06. 데이터 사전 (Data Tables)

> 축: CSV가 곧 기획 DB  
> 갱신: 2026-07-15 (1차 정리: 4허브)  
> 운영 메모: `data/README.md`

---

## 6.1 SSoT 원칙

- 밸런스·카피·가중치·적 스탯·맵 배율 → **CSV만 수정**  
- 문서와 CSV 불일치 시 **CSV 우선**, 문서 수정  
- `weight` = 【잠정】 상대값 (확정 확률 아님)  
- **표시명(한글)으로 분기하지 않는다** — `grade_id` / `css_key` / `side` / `pool_id` 사용

---

## 6.2 4마스터 허브 【확정】

| 허브 | 마스터 CSV | 역할 |
|------|------------|------|
| **Entity** | `entity_config` | 플레이어·몬스터 유닛 정체 |
| **Item** | `item_config` | 재화·패시브·재료·(후)장비 |
| **Skill** | `skill_config` | 스킬 정체 (수치 없음) |
| **Effect** | `effect_config` | 지급·즉발 효과 SSoT |

```
Entity ──► combat_enemy / player_base / enemy_skill / enemy_pattern
Item   ──► (currencies·passives는 로더 파생)
Skill  ──► skill_tier / skill_level / skill_effect / skill_pool
Effect ──► daily_pool / branch / minigame / scenario / content_link
```

캐릭터·몬스터는 **Item이 아니라 Entity**. Item은 소지·재화·패시브 허브.

---

## 6.3 테이블 목록

### Entity 허브

| 파일 | 역할 |
|------|------|
| entity_config | 유닛 마스터 (`side=PLAYER\|ENEMY`, `combat_id`) |
| combat_enemy_config | 적 전투 스탯·pattern_id (Entity 서브) |
| player_base_stat_config | 플레이어 베이스 HP/ATK/DEF (풀장착 가정) |
| enemy_skill_config | 적 스킬 카탈로그 |
| enemy_pattern_config | 패턴→스킬 배치 |
| combat_tuning | 전투 공식·연출·EDGE/페이즈/폴백 키 |

### Item 허브

| 파일 | 역할 |
|------|------|
| item_config | 아이템/재화/패시브 마스터 |

### Skill 허브

| 파일 | 역할 |
|------|------|
| skill_config | 스킬 정체 |
| skill_tier_config | 일반/전설/신화 |
| skill_level_config | 레벨 배율 |
| skill_effect_config | 전투 모디파이어 |
| skill_pool_config | `POOL_*` → tier / want_upgrade |
| levelup_config / levelup_rule_config | 레벨업·3택1 |

### Effect 허브·콘텐츠

| 파일 | 역할 |
|------|------|
| effect_config | 효과 SSoT |
| content_link_config | LOCATION/MINIGAME/COMBAT_TRIGGER 접두 선언 |
| grade_config | 등급 (+ css_key, banner_ms, is_jackpot) |
| event_text_pool | 로그 문구 |
| daily_roll_pool / daily_pool_bonus_effects | 직접보상 |
| ungraded_pool | 무등급 |
| location_config / scenario_step_config | 지역·다단계 |
| branch_config | 분기 |
| minigame_config / minigame_reward_pool / **minigame_entry_config** | 미니게임 + 진입 SSoT (+ `side` angel/devil) |
| gauge_config | 대박/중박 게이지 |
| milestone_config / event_config | 마일스톤 (`tier*_effect` = effect_id FK) |

### 진행·맵·UI

| 파일 | 역할 |
|------|------|
| stage_map_config | 스테이지1~4 (15일) CLEAR/EDGE/MID/EARLY |
| combat_day_schedule | 고정 전투/마크 |
| progression_phase_config / content_type_config | 롤 가중치 |
| combat_trigger_config | 전투 보상 범위 |
| stage_mode_config | 상단 스테이지 모드 |
| ui_text_config | UI 카피 |
| keyword_highlight_config | 키워드 색 |

---

## 6.4 제거·보류

| 항목 | 상태 |
|------|------|
| currency_config / passive_item_config | **삭제** (item_config 파생) |
| 장비 마스터 | 【미구현·2차】 풀장착 가정 유지 |

---

## 6.5 확장성 체크

- **OK**: effect FK 롤, skill 정체/수치 분리, enemy pattern, 4허브
- **이번 1차 수정**: 등급 한글 매칭 제거, POOL_* 데이터화, EDGE/페이즈 CSV화, myth `side`
- **2차**: 장비 Entity 슬롯, content_link를 effect_id로 완전 치환
