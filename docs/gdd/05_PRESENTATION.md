# 05. 연출 (Presentation)

> 축: 보이고 / 움직이고 / 타이밍  
> 갱신: 2026-07-15  
> 규칙: setInterval·setTimeout만 (rAF 금지)

---

## 5.1 화면 계층 (원작 맞춤)

```
[타임라인]     day-roadmap — 중앙 road-track
[상단 스테이지] visual-stage — 상황·전투 로그
[스탯바]       LV / HP / ATK / DEF / GOLD
[재화바]       별조각·사료·깃발 등
[로그 피드]    일차 헤더 + 양피지 카드
[조작]         controls-dock: 대박 | 메인버튼 | 중박
```

등급 연출 타이밍·CSS: `grade_config.banner_ms` / `css_key` / `is_jackpot`  
대박 슬롯 ms: `combat_tuning.jackpot_slot_ms`

---

## 5.2 상단 상황 모드 【확정·지시】

CSV: `stage_mode_config`

| mode | 표시 | 언제 |
|------|------|------|
| IDLE | 직전 장면 유지 + 계속 안내 | 입력 대기 (하단 로그와 맞춤) |
| MOVING | N일차 이동 중 | 다음날·전투 진입 전 |
| COMBAT | 전투 중 + 턴 로그 | 교전 |
| COMBAT_WAIT | 전투 대기 + 적 이름 | 조우 카드 후 · 전투 버튼 전 |
| SKILL | 스킬 선택 중 | 3택1 패널 |
| LOCATION_FIND | `{이름} 발견` | 지역 진입 시작 |
| LOCATION_ARRIVE | `{이름}에 도착했다` | 발견 직후 · 로그 본문 부제 |
| EVENT | 로그 헤드라인 동기 | 일반 보상·전투 결과 등 |
| BRANCH | 갈림길 | 분기 선택 |

원칙: **하단 피드에 보이는 이야기 = 상단 title/subtitle**.  
`appendCard` 시 캡션 갱신, `setIdle`은 직전 title을 지우지 않음.

---

## 5.3 전투 연출

- 주인공 vs 적 아이콘, HP 바  
- 턴 라인 스크롤 (delay: `turn_delay_ms`)  
- 최대 **15턴**  
- 하단 피드는 결과·보상 카드 위주

---

## 5.4 로그 카드 연출

| 요소 | 내용 |
|------|------|
| 등급 배너 | 대박/중박 등 오버레이 |
| 대박 슬롯 | body 문구 릴 회전 → body_line2 펼침 |
| 효과 칩 | 순차 타격감 출현 |
| 운빨 | 찢김·쉐이크 |
| 키워드 색 | `keyword_highlight_config` |

카드 등장 스케일 등: `style.css` / `main.ts` (작업 이력에 따라 조정됨).

---

## 5.5 버튼·패널

- 메인: 다음날 / 전투 / 이동 중 / 스킬 선택 / 줍기·돌리기  
- 전투 중: progress dots  
- 스킬 패널: 카드 3장 + 학습한 스킬 북 FAB  
- 보상 모달: 코인 xN 등  
- 미니게임: 타입별 스테이지 DOM

---

## 5.6 연출 백로그 (원작 대비)

상세 갭: `plan/RE_GAP_PLAN.md`  
예: 중박 게이지 아이콘, 신화 슬롯 스택 UI, K표기 등.
