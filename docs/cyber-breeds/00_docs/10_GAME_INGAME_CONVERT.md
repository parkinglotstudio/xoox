# 10. 로비(정면) → 인게임(측면) 스프라이트 변환 가이드

> **왜 필요한가:** `04_game_chibi2`(+ `09_GAME_CHIBI2_ROSTER.md`)는 **인트로·로비용 정면 응시 샷**이다. 인게임에서 실제로 움직이는 스프라이트는 **측면(3/4) 기준**이어야 한다 — 지시자 확정(2026-08-01): "당연히 옆모습을 기본으로 해야지".
> **상태(2026-08-02 갱신):** **breed_01 idle 기준 포즈 확정됨** — `04_game_chibi2/breed_01/breed_01_capybara_style_test.png`가 이미 인게임(3/4 측면) idle 기준이었음(지시자 확인, 새로 생성 불필요). 사본: `05_game_ingame_sprite/breed_01/breed_01_ingame_idle_base.png`. 다음은 이 포즈 기준 **동작별 프레임 제작**(단서는 그림을 그릴 수 없음 — 사람 또는 이미지 생성 세션이 이 문서 보고 작업).

---

## 0. 두 트랙 구분 (헷갈리지 말 것)

| 트랙 | 용도 | 각도 | 폴더 | 상태 |
|---|---|---|---|---|
| **로비/인트로** | 캐릭 소개, 도감 카드 | **정면 응시 앉기** | `04_game_chibi2/{id}/` | breed_01·breed_02 완료 |
| **인게임** | 실제 플레이 화면에서 움직임 | **측면(3/4), 눈 1개만 보이게** | `05_game_ingame_sprite/{id}/` | breed_01 idle 기준 확정, 동작별 프레임은 진행 중 |

두 트랙은 **같은 캐릭터의 다른 샷**이지 다른 캐릭터가 아니다 — 색·시그니처 파츠·발광은 항상 동일해야 함.

---

## 1. 인게임 각도·비율 스펙 (이미 확정된 것 재사용)

이 프로젝트(XOOX)에 이미 이식된 스프라이트 파이프라인(`docs/art/`, 몬카피바라에서 이식 — [`docs/art/00_PORTED_FROM_MONOCAPIBARA.md`](../../art/00_PORTED_FROM_MONOCAPIBARA.md))에 **인게임 비율이 이미 확정돼 있다.** 새로 정하지 않고 그대로 따른다.

출처: [`docs/art/04_INGAME_RATIO.md`](../../art/04_INGAME_RATIO.md)

| 항목 | 값 |
|---|---|
| 뷰 | **3/4 옆** (눈 1개만 보이게) |
| 머리(+귀) : 몸 비율 | 약 **65~70% : 30~35%** (머리·귀가 큼) |
| 기준 샘플(참고용, 캐릭 다름) | `docs/art/sprites/hyanga/ingame/idle/hyanga_ingame_idle_pose.png` |

**주의 — 향아(휴머노이드)와의 차이:** 향아 기준엔 "애니는 머리·머리카락만, 몸통은 거의 고정"이라는 규칙이 있는데(휴머노이드라 자연스러움), breed_01(사족보행 메카독)은 그대로 베끼지 않는다. 메카독의 "머리카락에 해당하는 것"은 **귀(웨이브 발광)·꼬리(분절 발광)** — 이 둘이 향아의 머리카락처럼 애니메이션의 주 연출부가 되고, 몸통(코어 패널)은 상대적으로 고정, 다리는 이동 애니에서만 움직인다.

---

## 2. 크기·엔진 스펙 (그대로 재사용)

출처: [`docs/art/sprites/_guide/12_SIZE_POLICY.md`](../../art/sprites/_guide/12_SIZE_POLICY.md) · [`04_GAME_MANUAL.md`](../../art/sprites/_guide/04_GAME_MANUAL.md)

| 항목 | 값 |
|---|---|
| 캔버스(cell) | 512 (머리 위로 크게 솟는 애니만 예외적으로 확대) |
| 몸통 기준폭(원통뿔 대응) | idle 기준 295px로 통일 — breed_01은 몸통이 사각형 코어 블록이므로 **코어 패널 폭**을 이 기준으로 삼는다 |
| pivot | bottom-center (발 바닥 중앙) |
| 필요 애니 id | `lobby_idle_a/b`, `ingame_idle`, `move`, `hop`, `attack_a`, `attack_b`, `hit`, `win`, `lose` — [`breed_01_ANIMATION_CONCEPT.md`](../04_game_chibi2/breed_01/breed_01_ANIMATION_CONCEPT.md)의 동작 컨셉과 매칭됨 |

---

## 3. 기존 참고 이미지 재활용 여부 (2026-08-02 결론)

`04_game_chibi2/breed_01/breed_01_capybara_style_test.png`가 **이미 인게임 idle 기준으로 확정**됐다(지시자 확인) — 3/4 측면, 옆으로 선 스탠스, 게임 SD 수준의 두꺼운 아웃라인+플랫컬러로 이미 완성돼 있어 새로 그릴 필요가 없었다. 사본: `05_game_ingame_sprite/breed_01/breed_01_ingame_idle_base.png`.

| 파일 | 각도 | 용도 |
|---|---|---|
| **`breed_01_capybara_style_test.png`** | 3/4 측면 | **인게임 idle 기준(확정)** — 이후 모든 동작 프레임의 각도·선굵기·색 기준점 |
| `breed_01_chibi2_ingame_v2.png` | 3/4 측면, 흑배경 | 참고만 — 선·디테일이 컨셉아트 수준(음영·점묘 텍스처), 기준으로 안 씀 |
| `breed_01_chibi2_ingame_idle_v1.png` | 3/4 측면, 흑배경 | 위와 동일 |

→ 이후 동작(move/attack/hit/win/lose/hop) 프레임을 새로 만들 때는 **`breed_01_capybara_style_test.png`를 기준 포즈로 열고**, 그 각도·비율·선굵기를 유지한 채 동작만 바꾼다. 컨셉아트 수준 시도작 2장은 참고만 하고 기준으로 삼지 않는다.

---

## 4. 생성 프롬프트 템플릿 (복붙용)

```
Game unit SD sprite, IN-GAME pose (not the front lobby portrait).
3/4 side view facing right, only one eye visible.
Head+ears ≈ 65-70% of total height, body ≈ 30-35% — big head, small compact body.
Thick clean black outlines, FLAT colors, minimal shading — same simplified
language as breed_01_game_chibi2_front.png, NOT the detailed concept-art
rendering of breed_01_chibi2_ingame_v2.png.
Keep identity: mecha dog, mustard/olive/cream body, mint/cyan glow
(eyes, wave-pattern ear insides, chest core, segmented tail tip).
Neutral standing/sitting idle pose, feet grounded, canvas 512x512,
character bottom-center, soft olive-green blurry field background.
No text, no UI, no extra props.
```

---

## 5. 폴더 (신규)

```
05_game_ingame_sprite/
  README.md
  breed_01/
    README.md
    breed_01_ingame_idle_base.png   ← idle 기준 포즈 (확정)
    _ref/            ← 기존 3/4 시도작 복사본 + hyanga 비율 참고 이미지 (참고용, 기준 아님)
    (이후) engine/, ingame/ ...      ← 동작별 프레임 제작 후 채움
```

`engine/` 이하 실제 스프라이트 시트·JSON 제작 단계에 들어가면 이식된 스프라이트 툴([`docs/art/sprites/_guide/README.md`](../../art/sprites/_guide/README.md))을 그대로 쓴다 — 새 캐릭터는 `hyanga/` 폴더 구조를 복제하면 된다([`docs/art/00_PORTED_FROM_MONOCAPIBARA.md`](../../art/00_PORTED_FROM_MONOCAPIBARA.md) 참고).

---

## 6. 체크리스트

- [x] 3/4 측면, 눈 1개만 보이는가 — `breed_01_ingame_idle_base.png` 확정
- [x] `breed_01_game_chibi2_front.png`와 같은 선·색 단순화 수준인가 — 확인됨(같은 파이프라인 산출물)
- [x] `05_game_ingame_sprite/breed_01/`에 저장했는가
- [ ] (동작 프레임 제작 시마다 재확인) 머리(+귀) : 몸 = 약 65~70% : 30~35%인가
- [ ] (동작 프레임 제작 시마다 재확인) 아이덴티티(머스타드/올리브/크림 · 민트 발광 · 웨이브 귀 · 분절 꼬리) 유지되는가
