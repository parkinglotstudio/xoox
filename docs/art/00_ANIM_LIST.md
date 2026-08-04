# 캐릭터 애니메이션 목록 【확정】

> **갱신:** 2026-07-23  
> **머리 모션 기획:** [05_HEAD_MOTION_PLAN.md](./05_HEAD_MOTION_PLAN.md)  
> **슬롯 연출 SSoT (그리기 전 필독):** [sprites/_guide/](./sprites/_guide/README.md)  
>   — idle [05](./sprites/_guide/05_INGAME_IDLE_PLAYBACK.md) · move [06](./sprites/_guide/06_INGAME_MOVE.md) · attack [07](./sprites/_guide/07_INGAME_ATTACK.md)  
> **비율:** [04_INGAME_RATIO.md](./04_INGAME_RATIO.md)  
> **폴더:** [sprites/README.md](./sprites/README.md)

---

## 제작 슬롯 (캐릭터당 8)

| ID | 이름 | 뷰 | 프레임 | 머리 쓰임 (요약) |
|----|------|-----|--------|------------------|
| `lobby_idle` | 로비 대기 | 정면 | 6 | 미세 L/R 틸트 |
| `ingame_idle` | 인게임 대기 | 3/4 옆 | 6 | 미세 전후 끄덕 (+헤어) |
| `ingame_move` | 이동(달리기) | 3/4 옆 | 2고유→루프 | **몸고정 · 머리 끝만** · rare_blink → [06](./sprites/_guide/06_INGAME_MOVE.md) |
| `ingame_hop` | 보드 점프 | 3/4 옆 | **4** | Monopoly Go식 **점프·덤블·착지** |
| `ingame_attack_a` | 공격A 돌진 | 3/4 옆 | **4** | crouch→fly→hit→return · 헤어 시그니처(은은) → [07](./sprites/_guide/07_INGAME_ATTACK.md) |
| `ingame_attack_b` | 공격B 마법 | 3/4 옆 | 2→루프 | peak↔loop 헤어 떨림 → [07](./sprites/_guide/07_INGAME_ATTACK.md) |
| `ingame_hit` | 피격 | 3/4 옆 | 3 | 원샷 리코일 |
| `ingame_win` | 승리 | 3/4 옆 | 2→4 | **헤어 피어오름 바운스** (손 X) → [08](./sprites/_guide/08_INGAME_WIN.md) |
| `ingame_lose` | 패배 | 3/4 옆 | 4 | 루프 처짐 |

**원칙:** 몸 거의 고정 · **머리(+머리카락)** 가 주연.  
**예외:** `ingame_hop` 만 공중 덤블로 **몸 회전 허용** (토큰 이동).

**hop 컨셉:** [sprites/hyanga/ingame/hop/README.md](./sprites/hyanga/ingame/hop/README.md)  
**attack 컨셉:** [sprites/_guide/07_INGAME_ATTACK.md](./sprites/_guide/07_INGAME_ATTACK.md) · 향아 실례 [sprites/hyanga/ingame/attack/README.md](./sprites/hyanga/ingame/attack/README.md)  
**유비 진행:** idle·move 엔진 있음 · attack_a는 fly 합의, crouch/hit/return 남음

## A2 서사 (후순위)

talk / listen / joy / worry — 2차

## 캐릭터 큐

향아 → 하린 → 유비 → 초선 → 수경 → 순욱 → 강유 → 주유 → 황개 → 제갈량 → 관우
