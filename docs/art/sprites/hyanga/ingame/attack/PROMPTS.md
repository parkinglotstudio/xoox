# 향아 attack — 생성 프롬프트

> 통합 가이드: [`../../_guide/03_PROMPTS.md`](../../_guide/03_PROMPTS.md)  
> idle / move / hop 와 **동일 캐릭터**. 손·발·팔 금지. 오뚜기 콘 몸. 두꺼운 검정 아웃라인.  
> 배경: flat light gray-green. **캐릭터 전체가 프레임 안에** (머리·헤어 잘림 금지, 좌우·위 여유 넉넉히).  
> 한 장에 포즈 **하나만**. 적·UI 그리지 말 것.

공통 캐릭터 블록 (모든 프롬프트 앞에 붙이기):

```
Same character as reference: chibi Hyanga, oversized bobble head, ottuki cone body (no arms, no legs, no hands, no feet), long voluminous light-lavender purple hair, large amber-gold eyes, soft blush, teal-and-white ornate headband with hanging ribbons and tassels, white robe with teal geometric patterns and flower motif, large round gold pendant. Thick clean black outlines, cel shading, game sprite, 3/4 side view facing RIGHT. Solid pale gray-green background. Full character visible with generous margin on all sides — do not crop hair.
```

---

## Attack A — 신규 2장

### A0 `crouch` → 저장명 `hyanga_ingame_attack_a_00_crouch.png`

```
[공통 캐릭터 블록]

Pose: wind-up before a rush attack. Body cone is crouched / compressed shorter and rounder, leaning forward toward the RIGHT, coiled like a spring. Head tucked slightly down-forward. Hair pulled back tightly behind the head (not a full hairball yet). Determined expression. No motion lines. Single still keypose.
```

### A3 `return` → `hyanga_ingame_attack_a_03_return.png`

```
[공통 캐릭터 블록]

Pose: recovering after a hairball smash. Hair is half-unfurling from a ball back into long flowing hair, body cone reappearing, settling upright but still slightly leaning from momentum. Soft relieved or dizzy-cute face. Facing RIGHT. No enemy. Single still keypose. Keep full hair silhouette inside frame.
```

### (참고) 이미 있음

- `hyanga_ingame_attack_hairball_fly_v2.png` → A1 fly  
- `hyanga_ingame_attack_hairball_hit_v2.png` → A2 hit  

잘린 가장자리 있으면 **여유 크게 재생성** 권장.

---

## Attack B — 신규 3장

### B0 `charge` → `hyanga_ingame_attack_b_00_charge.png`

```
[공통 캐릭터 블록]

Pose: standing in place casting magic. Body cone same as idle, feet-base fixed. Hair is lifting UPWARD, streaming vertically above the head (about halfway to full height), tips rising. Soft glowing focus in eyes, calm casting face. No arms/hands. No staff. Single still. Extra top margin for rising hair.
```

### B1 `peak` → `hyanga_ingame_attack_b_01_peak.png`

```
[공통 캐릭터 블록]

Pose: magic cast climax, still in place. Body cone identical to idle position. Hair shoots STRAIGHT UP to maximum height like a fountain / pillar of lavender hair above the head, dramatic silhouette. Eyes bright, casting peak. Tiny soft sparkles near hair tips OK (no big VFX plates). Huge top margin — do not crop hair tips.
```

### B2 `release` → `hyanga_ingame_attack_b_02_release.png`

```
[공통 캐릭터 블록]

Pose: after cast, still in place. Hair falling back down from above, mid-settle, draping around head/shoulders again toward idle shape. Soft afterglow expression. Body cone unchanged. Extra side margin for falling hair locks.
```

---

## 체크리스트 (생성 후)

- [ ] 손·발·팔 없음  
- [ ] 왼쪽/위 헤어 잘림 없음  
- [ ] A는 돌진감, B는 **제자리** (몸 위치 동일)  
- [ ] 파일을 `frames_ai/` 에 위 저장명으로 넣기  
- [ ] 단서에게 알려주면 엔진 팩 진행
