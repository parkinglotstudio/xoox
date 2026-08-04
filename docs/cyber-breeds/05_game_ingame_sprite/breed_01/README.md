# breed_01 — 인게임(측면) 스프라이트 준비

## 상태
**Idle 기준 포즈 확정됨** (2026-08-02, 지시자 확인). 새로 그릴 필요 없음 — 아래 두 장이 이미 기준이다.

## 기준 이미지 (확정 — 이걸로 간다)

| 용도 | 파일 |
|---|---|
| **로비/인트로 idle** | `../../04_game_chibi2/breed_01/breed_01_game_chibi2_front.png` (정면 응시 앉기) |
| **인게임 idle (이 폴더 기준)** | `breed_01_ingame_idle_base.png` (= `04_game_chibi2/breed_01/breed_01_capybara_style_test.png`와 동일 — 3/4 측면, 옆으로 선 자세) |

`breed_01_ingame_idle_base.png`가 이 캐릭터의 **인게임 스탠스 원점**이다. 이후 만드는 move/attack/hit/win/lose/hop 등 모든 동작은 이 포즈의 각도·비율·선굵기·색을 기준으로 삼는다.

## `_ref/` (참고용, 기준 아님)

| 파일 | 역할 |
|---|---|
| `angle_ref_ingame_v2.png` | 초기 측면 시도작 — 각도 참고만(선·음영이 컨셉아트 수준이라 기준으로 안 씀) |
| `angle_ref_ingame_idle_v1.png` | 위와 동일 계열 |
| `identity_ref_front.png` | 로비 정면본 — 색·시그니처 아이덴티티 대조용 |
| `ratio_ref_hyanga_ingame_idle.png` | 다른 캐릭(향아)의 인게임 비율 샘플 — 비율 언어만 참고 |

## 아이덴티티 (변하면 안 됨)
- 종: 메카 독
- 색: 머스타드 / 올리브 / 크림
- 발광: 민트·시안 (눈·귀 안쪽·가슴 코어·꼬리 끝)
- 시그니처: 가슴 코어 + 웨이브 귀 + 분절 민트 꼬리

## 다음 단계
Idle 기준 포즈는 확정됐으므로, 다음은 **동작별 프레임 제작**:
1. `breed_01_ingame_idle_base.png` 각도 그대로 유지하며 idle 숨쉬기/귀·꼬리 미세 움직임 2~4프레임
2. 이후 move/attack/hit/win/lose/hop — 순서·컨셉은 [`../../04_game_chibi2/breed_01/breed_01_ANIMATION_CONCEPT.md`](../../04_game_chibi2/breed_01/breed_01_ANIMATION_CONCEPT.md)
3. 프레임 확정되면 스프라이트 시트화 — 이식된 스프라이트 툴 사용
