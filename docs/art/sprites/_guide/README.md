# 스프라이트 가이드 — 다음 AI 입구

> **【이식 안내】** 이 `_guide/` 전체와 `hyanga/` 샘플은 `C:\Users\dmaxd\Downloads\monocapibara`(몬카피바라 프로젝트)에서 2026-08-01 이식됨. 원본은 "장수"(삼국지 챕비 캐릭터) 여러 명을 만드는 파이프라인이었고, XOOX엔 그 로스터(`generals/`, `_concept_final/`)는 가져오지 않았다 — **향아(hyanga) 하나만 작업 예시/템플릿으로 남김**. 아래 문서에서 "장수"·"관우"·"유비" 등은 원본 파이프라인의 예시일 뿐, XOOX 캐릭터가 아니다. 상세: [`../../00_PORTED_FROM_MONOCAPIBARA.md`](../../00_PORTED_FROM_MONOCAPIBARA.md)

> **읽는 순서 (캐릭터 제작 · 사용자 명령마다 필수)**
>
> 0. **★ [14_MISTAKE_LOCK_CHECKLIST.md](./14_MISTAKE_LOCK_CHECKLIST.md)** — 실수 잠금 · 생성 직전 체크 · **명령을 받으면 이것부터**  
> 1. [00_CHARACTER_PRINCIPLES.md](./00_CHARACTER_PRINCIPLES.md) — 아군 연출 원칙  
> 2. [13_PIPELINE_KNOWHOW.md](./13_PIPELINE_KNOWHOW.md) — 작업 순서·노하우 (유비까지)  
> 2b. [15_LOBBY_IDLE_METRICS.md](./15_LOBBY_IDLE_METRICS.md) — **로비 idle 수치·파이프·사고록 (기준=유비 · 2026-07-31 세션 반영)**  
> 3. [01_MAKE_ANIM.md](./01_MAKE_ANIM.md) — 제작 파이프  
> 4. [12_SIZE_POLICY.md](./12_SIZE_POLICY.md) — **크기 통일 (원통뿔=idle 295)**  
> 5. **슬롯 연출 기획 (해당 애니 시작 전)**  
>    - [05_INGAME_IDLE_PLAYBACK.md](./05_INGAME_IDLE_PLAYBACK.md) — idle  
>    - [06_INGAME_MOVE.md](./06_INGAME_MOVE.md) — move  
>    - [07_INGAME_ATTACK.md](./07_INGAME_ATTACK.md) — attack  
>    - [08_INGAME_WIN.md](./08_INGAME_WIN.md) — win (**즐거움 = 깜빡 + 헤어**)  
>    - [09_INGAME_HIT.md](./09_INGAME_HIT.md) — hit  
>    - [10_INGAME_LOSE.md](./10_INGAME_LOSE.md) — lose  
>    - [11_INGAME_HOP.md](./11_INGAME_HOP.md) — hop  
> 6. **실제 이미지** — 그 장수 idle + 원화 + 향아·유비 해당 슬롯 (문서만으로 판단 금지)  
> 7. [02_TOOLS.md](./02_TOOLS.md) · [03_PROMPTS.md](./03_PROMPTS.md) · [04_GAME_MANUAL.md](./04_GAME_MANUAL.md)

## 슬롯 연출 SSoT

| 슬롯 | 기획 문서 | 향아 기준 |
|------|-----------|-----------|
| idle | [05](./05_INGAME_IDLE_PLAYBACK.md) | `hyanga/engine/ingame_idle/` |
| move | [06](./06_INGAME_MOVE.md) | `hyanga/engine/move/` |
| attack | [07](./07_INGAME_ATTACK.md) | `hyanga/engine/attack_a/` · `attack_b/` |
| win | [08](./08_INGAME_WIN.md) | `hyanga/engine/win/` (연출 약함 · 헤어 강화) |
| hit | [09](./09_INGAME_HIT.md) | `hyanga/engine/hit/` (구조 채택 · 헤어 과장) |
| lose | [10](./10_INGAME_LOSE.md) | `hyanga/engine/lose/` (처짐↔한숨 · 헤어 주연) |
| hop | [11](./11_INGAME_HOP.md) | `hyanga/engine/hop/` (토큰 점프 · 공중 헤어볼) |

**규칙:** 연출이 바뀌면 **이 `_guide` 문서를 먼저 갱신**한 뒤 다음 장수에 적용한다.  
**3번째 장수 전:** [13_PIPELINE_KNOWHOW.md](./13_PIPELINE_KNOWHOW.md) 체크리스트 필수.

## 완성물 · 진행

| 경로 | 용도 |
|------|------|
| `../hyanga/engine/` | 향아 납품 (기준 샘플 — 이식본) |
| `../hyanga/_wip/` · `_archive/` | 실패·구버전 |

**(원본 기록)** 몬카피바라에는 `generals/{char}/` 로 여러 캐릭터를 이 파이프로 찍어냈다 — XOOX엔 로스터 자체를 이식하지 않았으므로 해당 경로 없음. XOOX용 새 캐릭터(예: 뭉치·하늘이·방랑자)를 만들 땐 이 폴더 구조(`{char}/engine/`, `{char}/ingame/*/frames_ai/`, `{char}/_wip/`)를 그대로 새 폴더명으로 재사용하면 된다.

상세: [../../07_HYANGA_VISUAL_CONCEPT.md](../../07_HYANGA_VISUAL_CONCEPT.md) · [../../08_SPRITE_ENGINE_METHOD.md](../../08_SPRITE_ENGINE_METHOD.md) · [../../09_SPRITE_ANIM_HANDOFF.md](../../09_SPRITE_ANIM_HANDOFF.md) · [../../00_ANIM_LIST.md](../../00_ANIM_LIST.md)
