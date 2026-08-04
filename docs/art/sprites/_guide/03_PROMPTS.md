# 03 — 생성 프롬프트

공통: 오뚝이 몸 · 머리/헤어/눈으로 감정 · 팔 최소 · 다리 없음 · 두꺼운 검정 아웃라인 · 프레임 안 전체 실루엣.

원본(attack): [`../hyanga/ingame/attack/PROMPTS.md`](../hyanga/ingame/attack/PROMPTS.md)

---

## 공통 캐릭터 블록 (향아)

```
Same character as reference: chibi Hyanga, oversized bobble head, ottuki cone body (no arms, no legs, no hands, no feet), long voluminous light-lavender purple hair, large amber-gold eyes, soft blush, teal-and-white ornate headband with hanging ribbons and tassels, white robe with teal geometric patterns and flower motif, large round gold pendant. Thick clean black outlines, cel shading, game sprite, 3/4 side view facing RIGHT. Solid pale gray-green background. Full character visible with generous margin on all sides — do not crop hair.
```

> win 예외: 손 미세 움직임만 허용할 때는 “tiny hands briefly visible”을 포즈에만 추가. 기본 블록은 팔·손 금지 유지.

---

## Attack A / B

상세 전문은 attack `PROMPTS.md`와 동일. 요약:

| id | 포즈 요지 |
|----|-----------|
| A0 crouch | 돌진 전 웅크림 · 헤어 뒤로 |
| A1 fly | 헤어볼 돌진 (기존 에셋) |
| A2 hit | 헤어볼 타격 (기존 에셋) |
| A3 return | 헤어 풀리며 복귀 |
| B0 charge | 제자리 · 헤어 위로 상승 |
| B1 peak | 제자리 · 헤어 분수처럼 최대 |
| B2 release | 제자리 · 헤어 낙하 중 |

---

## Win (2키 · 루프)

| role | 요지 |
|------|------|
| `open` | 기쁨 · 눈 열림 · (허용) 손 살짝 올린 미세 포즈 |
| `blink_hands_down` | 같은 팔 길이 · 손만 살짝 내림 · 깜빡 |

전체 프레임 재생성. 얼굴만 합성하지 말 것.

---

## Lose (2키 · 루프)

| role | 요지 |
|------|------|
| `hair_down` | 슬픔은 **처진 헤어** · 아주 약한 눈물 |
| `hair_breath` | 헤어 미세 숨쉬기 · idle 크기 유지 |

몸·팔 과장 금지. idle contain 후 스케일.

---

## Hit / Move / Hop / Idle

기존 `frames_ai` 키포즈 + `engine/` 완성팩을 기준으로 재작업.  
새 장수는 위 공통 블록만 캐릭터명·머리색·복장으로 치환하고 **동일한 머리/헤어 원칙**을 쓴다.
