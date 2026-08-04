# 02. 콘텐츠 설명 (Content)

> 축: 플레이어가 **무엇을 만나고 / 고르고 / 받는가**  
> 갱신: 2026-07-15
> ⚠️ **【진행 중, 2026-07-17】** 이 문서의 세계관(용병·해적·마법타워 등)은 XOOX 원본 세계관(반려동물 구조, "오염된 OOO")으로 전환 예정 — 진행 상황·갭은 [`17_XOOX_전환.md`](17_XOOX_전환.md) 참조. 아래 §2.4·2.9는 전환 전 구버전 그대로 남아있음.

---

## 2.1 콘텐츠 대분류

| 타입 | 설명 | 주요 CSV |
|------|------|----------|
| 직접보상 | 등급 붙은 일상 이벤트 + 효과 | `daily_roll_pool`, `grade_config` |
| 지역/영지 | 장소 도착, 휴식·보물·이벤트 영지 | `location_config`, `scenario_step_config` |
| 분기 | 2지선다·확률·비용·스킬 스왑 등 | `branch_config` |
| 무등급 | 가벼운 로그 | `ungraded_pool` |
| 전투 | 일반 / 정예(미니보스) / 최종 | `combat_*`, `combat_day_schedule` |
| 미니게임 | 게이지·지역·대박 연동 | `minigame_*`, `gauge_config` |
| 레벨업·스킬 | 런 레벨, 3택1/자동, 상자 | `levelup_config`, `skill_config` |

텍스트 본문: `event_text_pool` (`body`, `body_line2`).

---

## 2.2 등급 (로그 카드)

| 등급 | 역할 | 연출 톤 |
|------|------|---------|
| 대박 | 강한 보상 / 행운의 보물 등 | 핑크·슬롯 연출 |
| 중박 | 중상위 보상 | 청록 |
| 운빨망함 | 부정·페널티 계열 | 찢김·쉐이크 |
| 보너스 | 이벤트성 (용병 영지 등) | 보라 |

가중치(`weight`)는 **【잠정】** — 영상 표본으로 % 확정 금지 (`data/README`).

---

## 2.3 게이지 → 미니게임 【분기점 확정】

| 게이지 | 연결 | 비고 |
|--------|------|------|
| 대박 | 행운의 보물 (골드 3릴) | `GOLD_SLOT` / `mg_lucky_treasure` |
| 중박 | 행운의 룰렛 | `SQUARE_ROULETTE` / `mg_square` |

신화 스킬 슬롯(`mg_slot`)은 **게이지가 아님** — 대박 일일 `p_mythslot`로 진입.  
전체 진입표: [`15_MINIGAME_ENTRY.md`](15_MINIGAME_ENTRY.md).

---

## 2.4 분기 서브타입 (구현됨)

AVOID_CHALLENGE, COST_CHOICE, PREVIEW_DECLINE, PARTIAL_REVEAL, BETTING,  
SUCCESS_FAIL, STAT_CHOICE(천사), FINAL_CHALLENGE(도전자), SKILL_SWAP(고블린)

### 기획 포인트 【확정·지시】

- **천사:** 고공격력 vs HP 회복 → **일회 축복(스탯)** 이지, 영구 스킬 북 행이 아님.  
- **악마 계약:** 스킬을 배우고 싶으면 **대가(예: MAX HP 감소)** 를 치르는 **선택 기로**.  
  → ATK를 “스킬 배워서” 올리는 게 아니라, **선택으로 깎을 수 있는** 쪽.

---

## 2.5 지역 · 시나리오

- `entry_path`: DIRECT / BRANCH_ROUTE  
- `scenario_id` 있으면 다단계 로그 (발견→관측→보상 등)  
- 상단 UI: **영지 발견 → 영지 도착** 순 표시

---

## 2.6 전투 콘텐츠

| 티어 | 보상 성격 |
|------|-----------|
| NORMAL | 골드·EXP |
| MINIBOSS | + 신화 스킬 상자(3택) |
| FINALBOSS | 고대 계승 + 전설 상자, 챕터 클리어 |

조우 텍스트 → 「전투」 버튼 → 이동 → 상단 전투 로그 → 결과 카드.

---

## 2.7 스킬 콘텐츠 (요약)

상세: `08_SKILL_DESIGN.md`.

- 티어: 일반 / 전설 / 신화  
- 획득: 레벨업, 상자, 미니게임, 분기, 계약  
- **강화(+)**: 같은 계열 재선택 / `+` 카드 → 원본 교체 【구현】  
- 영상 확정 목록·CSV 갭: `plan/SKILL_LIST_FROM_VIDEO.md`

---

## 2.8 라이브·수집

- 깃발 등 이벤트 재화 → 마일스톤 보상  
- `item_config` + `event_config` + `milestone_config`

---

## 2.9 시작 콘텐츠

- 고향 습격 인트로  
- 모험가 훈장: 원작은 진행 후 획득. 프로토는 **미리보기**로 시작 스킬 선택 가능 (`owned_at_start` 정책 문서화됨)
