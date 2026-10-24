# 11. 변경 이력 (Changelog)

> 축: 기획·구현이 언제 어떻게 바뀌었는지  
> 규칙: 큰 결정·수치·범위 변경 시 한 줄 이상 남긴다.

---

---

## 2026-10-09 — 외출을 예전 맵·필러로

- 숲 외출 코드는 `_backups/20261009_outing_before_restore/`에 복사해 둠.
- `enterJourney`는 숲 싸움 대신 들판 맵과 필러로 연다. 서는 모델은 루온 3.5등신. 리아와 펫은 화면에 안 세운다.

## 2026-10-09 — 외출 싸움 시작 띠

- `src/main.ts` 싸움 시작에서 「싸운다.」 카드를 뺐다.
- 숲 가운데에 「오염이 밀려온다」가 남고, 그동안 앞으로 걷는다. 그다음 성장 버튼.
- 확인: 로비 외출 → 권총 → 정화 진지 → 가운데 → 투석 뒤 그 글이 숲 위에 보였다.

## 2026-10-09 — 외출 연출 장면 계획

- 신설: `docs/gdd/59_외출연출_장면계획.md`
- 고민은 기능 부족이 아니라, 외출의 중요한 일이 아래 글 버튼으로만 끝나는 것. 영상 박자를 지금 루온·리아 외출 장면 12개로 적음. 코드는 승인 전.

## 2026-10-09 — 외출 싸움, 스스로 한 걸음

- `src/main.ts` `playTenMinutePillars`의 싸움에서 「전진」「후퇴」 버튼을 뺐다.
- 무리가 시작되면 `partyStep(1)`로 앞으로 4m를 스스로 걷고, 토스트 「오염이 밀려온다」가 잠깐 뜬다. 손은 성장 카드만 고른다.
- 기획 메모: `docs/gdd/58_층연출_챕터와시스템.md` 0-1.

## 2026-10-09 — 층 연출 챕터 기획

- 신설: `docs/gdd/58_층연출_챕터와시스템.md`
- 후더덕 챕터 1 영상 3분 24초를 층 박자 S1~S9로 옮김. 검토 4개. 코드는 아직 없음.

## 2026-10-09 — 무료 3D 장판·미사일 조사

- 신설: `docs/gdd/57_무료3D_장판과미사일.md`
- Kenney, Quaternius, OpenGameArt CC0, Poly Pizza, Binbun, CGHEVEN을 봤다. 파일은 받지 않음.

## 2026-10-09 — 전투 스킬 종류 테스트

- 신설: `docs/gdd/56_전투스킬_종류.md`, `data/tools/combat_skill/skills.json`, `combat-skill-tool.html`
- 장판·로켓·유도·속사·산탄·드론은 한 스킬에 한 종류. 로켓과 장판을 같은 탄의 옵션으로 두지 않음.
- 본편 전투에는 연결하지 않음.

## 2026-09-25 — 자동 사냥 카메라 45도

- 신설: `docs/gdd/53_자동사냥_카메라_45도.md`
- 45도 안은 몸만 회전. 그 밖은 카메라가 넘친 각도만 회전하고 화면의 등은 고정.
- 반복: 45도 한 발 → 바깥 랜덤 한 발 → 그 방향에 45도 재생성 → 그 안 한 발.

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

## 2026-08-09 — 섹터 스케일·배경 아트 정리

### 기획
- **42** 재작성: 섬1km · 칸333m · 에디터(오버레이·리사이즈) SSoT
- **44** 신설: 육지5칸 after/before 파이프라인 (옛 산재 `43_섹터배경_*` 삭제·번호 충돌 해소)
- **40** §11 해결 반영 · INDEX·읽는 순서·`NEXT_AI_PROMPT` 갱신
- **필러/옛루프(`43_옛루프_*`)는 미수정**

### 구현·에셋 (동일 세션)
- `sector_i{21,11,10,12,01}_{after|before}.png` · `sector_scale.json` · `area_config` 육지 연결
- `sector-editor` 패널 리사이즈 · after/before 전환

---

## 2026-08-28 — 여정 3D 원경 컨셉 고정

### 기획
- **46** 신설: 인게임에서 확정된 지평선 원통 구도를 맵 제작 SSoT로 기록
- 작화는 **산+대기+구름 한 장**. `sky_*.png`는 상단 샘플일 뿐(FOV 72에서 스카이박스는 거의 안 보임)
- 원통 높이 `charH*18` · 보카시가 지면 y=0 · 2:1은 keep-bottom · 한 장 원경은 하늘 키잉 금지
- 정화전 = v16(먹구름 아포칼립스·층층 능선). 정화후 하늘 v1 · 타일 아트는 후속
- INDEX·40·42·44·45·`art/11`·섬 맵 파이프에 링크

### 구현
- 정화후 원경 `horizon_purified_skyopen_v1` · 바닥/원경 같은 파도 + 시안 레이저 링
- `playPurifyRevealWave` 하늘 스냅 교체 제거

---

## 2026-08-09 — 탐방 안개

### 기획
- **45** 신설: 시야≈10m 원 · 지나온 길 · 미탐방 노드 숨김 · `fog_vision_m` SSoT
- INDEX·40·42 링크 갱신

### 구현
- `explore.ts` trail/lit 마스크 · `sector_scale.json` fog_* · `.fog-hidden`

---

## 2026-09-24 — 전진 자동 웨이브 합의 문서

### 기획
- **52** 신설. 대화 합의 SSoT. 툴만 구현.
- 캐릭터 조종 없음. 전진만. 후더덕 기능만 사용하고 게임성은 복제하지 않음.
- 적=작은 원형 점구름(색만). 건물=네모 블록 기본탄만. 미사일=던지기/총. 시나리오 20박자는 신규.
- 배경 효과·본편 루프 연결·기존 들판 시나리오 계승은 범위 밖.

### 구현
- 툴 `/forward-wave-tool.html`. 임시 네모·원. 본편 루프와 분리.
- 툴 시험은 진지 하나, 웨이브 10×12초, 스킬 10번. 칸은 같은 길에 추가. 동반자는 처음부터 동행. 전진은 입장·퇴장만.

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
