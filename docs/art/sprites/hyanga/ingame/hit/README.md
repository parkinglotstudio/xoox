# 향아 — hit / win / lose 【연출 컨셉】

몸 거의 고정 · **머리(+표정)** 주연. 헤어만 흔들기 금지.

| 애니 | 엔진 | 성격 | 키포즈 |
|------|------|------|--------|
| **hit** | `engine/hit/` | 원샷 | snap → dizzy → recover → idle |
| **win** | `engine/win/` | 루프 | low ↔ high (기쁨 머리 까딱) |
| **lose** | `engine/lose/` | 루프 | down ↔ breath (울먹 한숨) |

## Hit
- `snap` — 머리 뒤+위 튕김, 헤어 앞으로
- `dizzy` — 튕긴 끝 홀드, 나선눈
- `recover` — idle 쪽으로 반쯤 복귀

## Win
- `low` — 기쁨 · 머리 살짝 아래
- `high` — 같은 몸 · 머리 톡 위로

## Lose
- `down` — 고개 최대 숙임 · 눈물
- `breath` — 고개 아주 조금 올라옴(한숨)

원본: 각 `frames_ai/` · 스튜디오 `#hit` `#win` `#lose`
