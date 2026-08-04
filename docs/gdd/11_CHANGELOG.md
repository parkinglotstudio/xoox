# 11. 변경 이력 (Changelog)

> 축: 기획·구현이 언제 어떻게 바뀌었는지  
> 규칙: 큰 결정·수치·범위 변경 시 한 줄 이상 남긴다.

---

## 2026-07-15 — 1차 정리 (4허브 + 하드코딩 이관)

### 기획
- 마스터 허브: **Entity / Item / Skill / Effect** (캐릭터·몬스터 ≠ 아이템)
- GDD 06/04/00/10 갱신, deprecated currency/passive CSV 삭제

### 데이터
- 신설: `entity_config`, `skill_pool_config`, `content_link_config`
- 확장: `grade_config`(css_key/banner_ms/is_jackpot), `combat_tuning`(EDGE·페이즈·폴백), `minigame_reward_pool.side`

### 구현
- 등급·POOL_*·myth side·부활 스킬·EDGE 배율 → CSV 키로 이관
- UI 텍스트 폴백 축소 (ui_text_config SSoT)

---

## 2026-07-15 — 원작형 스킬 보상 카드

### 구현
- 「보상을 획득했습니다.」+ 세로「스킬」+ 원형 아이콘 + 「○○ 학습」칩
- 상자·시작·이벤트 effect 칩 경로 전부 동일 연출

---

## 2026-07-15 — VS·등급·스킬획득 정정 (FULL 영상)

### 기획/구현
- FULL 영상 재판독: **사냥 후 레벨업 스킬 없음** → `grantLevelSkill` 전투 경로 제거 (상자·이벤트만)
- 전투 전 **VS 연출**(좌청/우적 + 이름 + 일반/정예/최종)
- 타임라인: 정예=보라 ☠+라벨, 최종=👑 / 조우 로그에 등급 표기
- 25일 스케줄 정예로 맞춤 (영상 보라 해골)

---

## 2026-07-15 — 전투 대칭 구현 (정예→일반→보스)

### 구현
- 적 패턴 CSV: `enemy_skill_config`, `enemy_pattern_config` + `combat_enemy.pattern_id/rage_*`
- 엔진: 적 THROW→BASIC→COMBO→SHIELD→RAGE, 적 보호막, 보스 페이즈
- UI: 적 보유 스킬 **오른쪽 상단** 아이콘 + 툴팁, 적 실드 바, 대칭 로그

### 키트
- 정예 `E_KNIGHT`(암흑기사) / 일반 N_SWARM·BRUTE·CASTER·GUARD / 보스 `B_GUARDIAN` 페이즈

---

## 2026-07-15 — 전투 대칭 모델 기획

### 기획
- `13_COMBAT_DESIGN.md` 전면 재작성: **플레이어=적** Basic/Combo/Rage/Shield 공통 슬롯
- 일반→정예→보스 순서 키트, 예고강타 대신 **분노 풀→분노기**, 양측 로그 패리티
- 원작 확정: **레벨업 스킬 3택1 있음** → `grantLevelSkill` 재연결

### 다음
- 승인 후 Phase 1 (Actor·rage·적 BASIC/COMBO/RAGE/SHIELD + 대칭 로그)

---

### 버그 수정
- 정령 COST_CHOICE: 옵션별 대가 (`생명력 -7%` / `공격력 -7%`) — 양쪽 동일 표기·HP만 깎이던 오류 수정
- PREVIEW_DECLINE(악마·메두사): **거절 시 대가 없음**, 수락 버튼에만 대가 표시

### 구현
- 전투 보호막 게이지 + 피해 흡수 로그
- 스킬 효과 트리거 확장 + 상단 stage-log에 스킬/능력 텍스트
- 부활 1회 소모 (`revivalUsed`)

---

### 기획

- 스킬 **강화(+) 보류 해제** → 런 내 베이스→+ 구현 (`12_SKIPPED_REWORK.md`)  
- GDD 08/01/02/04/10 보류 문구 갱신

### 구현

- `learnSkill` / `pickSkillChoices` 업그레이드 노출·교체  
- `levelup_rule_config`, `skill_level_config`, `skill_effect_config`(ALWAYS)  
- 상단 `stage-skills` 아이콘·+ 배지  
- 모든 스킬 지급 경로 → `learnSkill` / `applyLearnedSkill`

### CSV

- `skill_config` +행 보강, `levelup_rule_config`, `skill_level_config`, `skill_effect_config`  
- UI: `ui_skill_upgrade_*`, `ui_skill_upgraded*`

---

## 2026-07-15

### 기획 문서

- `docs/gdd/` 축별 기획서 신설 (개요·콘텐츠·밸런스·시스템·연출 + 데이터·맵·스킬·UI·로드맵·이력)

### 확정 지시 반영

- 맵 = **30일** 단위. 맵1 여유 / 맵2부터 간당간당  
- 스킬 학습 ≠ ATK 상승. ATK는 장비(현: 풀장착 가정) + 전투 버프 + 선택 대가  
- 스킬은 **런 레벨**에 따라 강화  
- 상단 상황 뷰: 이동 / 전투 / 스킬 / 영지 발견·도착  
- 전투 **15턴 이내**

### 구현

- `stage_mode_config` + visual-stage UI  
- `stage_map_config` + 전투 배율·맵2 승패  
- `player_base_stat_config` 풀장착 스케일 (HP 18000 / ATK 3200 / DEF 900)  
- 스탯바에서 스킬 ATK 가산 제거, 런레벨 피해 배율로 전환  
- 적 스탯 재스케일, 악마 계약 MAX HP -6097 복구  
- ui_text 등 UTF-8 복구 스크립트

### 이전 세션 누적 (요약)

- 로그 프로토, 등급·분기·미니게임, 아이템화, 타임라인, 스킬 북, RE 스킬 리스트, 밸런스 구조 스펙(plan)


---

## 템플릿 (이후 추가)

```
## YYYY-MM-DD
### 기획
- …
### 구현
- …
### CSV
- …
```
