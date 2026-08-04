# 15. 미니게임 진입 맵 (분기점 SSoT)

> **포크/분리 기준 문서.** 갱신: 2026-07-15  
> 데이터: `minigame_entry_config.csv` · `minigame_config.csv` · `gauge_config.csv`

---

## 15.1 확정 매핑

| 미니게임 | ID | 타입 | 진입 |
|----------|-----|------|------|
| 행운의 보물 | `mg_lucky_treasure` | GOLD_SLOT | ① 대박 일일 `p_luckybox` ② 대박 게이지 풀 `gz_jackpot`(7) |
| 신화 스킬 | `mg_slot` | MYTH_SLOT | 대박 일일 `p_mythslot` (슬라임 왕자 텍스트) |
| 행운의 룰렛 | `mg_square` | SQUARE_ROULETTE | ① 지역 `loc_luckyroulette`(+떠나기) ② 중박 게이지 `gz_mid`(12) |
| 보물 파내기 | `mg_card_match` | CARD_MATCH | 지역 `loc_treasuremap` |
| 마왕 타워 룰렛 | `mg_circle` | CIRCLE_ROULETTE | 분기 `b_darktower` → `MINIGAME:mg_circle` |

**고아 금지:** 로드 시 `minigame_entry_config`에 없는 `minigame_id`는 콘솔 warn.

---

## 15.2 게이지 (확정)

| 게이지 | 등급 | 캡 | 보상 |
|--------|------|-----|------|
| `gz_jackpot` | 대박 | 7 | `mg_lucky_treasure` |
| `gz_mid` | 중박 | 12 | `mg_square` |

신화 슬롯은 **게이지가 아님.** 대박 일일 이벤트로만 진입.

---

## 15.3 신화 스택

- `angel_stack_cap` / `devil_stack_cap` → `minigame_config` (기본 **4 / 3**, 원작 화면)
- `side` = angel|devil (`minigame_reward_pool`) — 한글 라벨 includes 금지
- 한쪽 스택 가득 → 신화 스킬 지급

---

## 15.4 행운의 룰렛 · 떠나기

- `location_config.offer_leave=TRUE` 인 지역만
- 발견 로그 후 **떠나기 / 돌리기** → 떠나기 시 `ui_mg_left`(떠났습니다)

---

## 15.5 라우팅 규칙

`launchLinkedMinigame(id)`:
- `GOLD_SLOT` → 오픈 버튼 → 골드 3릴
- 그 외 → `runMinigame`

일일 `linked_minigame_id`가 있어도 **무조건 오픈 플로우로 가지 않음** (과거 버그 수정).

---

## 15.6 미리보기 훅

| 콘솔 | 동작 |
|------|------|
| `__myth()` | 신화 슬롯 |
| `__roulette()` | 행운의 룰렛 |
| `__lucky()` | 행운의 보물(오픈 생략) |
| `__dig()` | 보물 파내기 |
| `__mg(id)` | 공통 런처 |
