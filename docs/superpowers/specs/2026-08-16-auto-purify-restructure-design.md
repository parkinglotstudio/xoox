# 자동 정화 재구조 (2026-08-16)

승인된 계획의 구현 계약. PRISM 소스는 복사하지 않는다. 겨루기·구조·기억 전투는 범위 밖.

## 승리

거점 지키기. 청록 임계 또는 웨이브 소진(+보스 정화) = 승. 거점 게이지 100% = 패.

한 판 20~40초. 습격 중 WASD 잠금, 이동은 AutoPilot.

## 모듈

| 모듈 | 역할 |
|---|---|
| AutoPilot | 거점 청록 위 체류, 위협 선회, 사거리 안 발사 |
| RaidSkillRuntime | 보유 `sk_*`의 action_slot → fire_pattern |
| BlightDirector | CSV 웨이브·종류 비율·alive cap·고리 스폰 |
| RaidBossRuntime | MINIBOSS 돌진 / BOSS 제자리 포격 |
| RaidVfx | `play(id, x, z)` 절차적 파티클 |

오케스트레이터는 `PurifyRaid`. 툴은 `auto: false` 유지(수동 발사).

## 데이터

- `data/raid_blight_type.csv`
- `data/raid_wave_config.csv`
- `data/raid_skill_pattern.csv`
- `data/raid_boss_pattern.csv`
- `data/raid_vfx_config.csv`
- `data/ui/layout/purify_raid_layout.json` (총·거점 수치 유지)

## 스킬

여정 `learnedSkills`만. 없는 슬롯은 no-op.

- 기본 = 유탄
- BOLT = 연쇄, DAGGER = 기본 추가 유도, FIREWAVE = 거점 위기 부채, SPEAR = 거점 뜯는 적 반격
- COMBO = 연속 발사 추가타, START = 첫 웨이브 짧은 정지
- PASSIVE DR/HP/ATK = 거점 깎임↓ · 탄약/재생↑
