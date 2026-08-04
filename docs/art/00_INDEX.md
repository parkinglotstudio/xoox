# art — 애니 작업장 (캐릭터 스프라이트 · 배경 무대)

> **【이식 안내】** 이 `docs/art/` 폴더 전체는 몬카피바라(`C:\Users\dmaxd\Downloads\monocapibara`)에서 2026-08-01 이식됨. 무엇을 가져왔고 무엇을 뺐는지, XOOX 게임과 연동됐는지는 [`00_PORTED_FROM_MONOCAPIBARA.md`](./00_PORTED_FROM_MONOCAPIBARA.md)와 [`docs/gdd/21_ART_STAGE_TOOL_이식.md`](../gdd/21_ART_STAGE_TOOL_이식.md)에 정리해 둠 — **다른 문서보다 이 두 개를 먼저 읽을 것.**

| 문서 | 역할 |
|------|------|
| [**00_PORTED_FROM_MONOCAPIBARA.md**](./00_PORTED_FROM_MONOCAPIBARA.md) | **이식 정보 (먼저 읽기)** — 뭘 가져왔고 뭘 뺐는지 |
| [**NEXT_AI_PROMPT_ART_TOOLS.md**](./NEXT_AI_PROMPT_ART_TOOLS.md) | **새 세션 시작 프롬프트** — 이 아트 툴로 작업 시킬 때 붙여넣기 |
| [**sprites/_guide/**](./sprites/_guide/README.md) | 다음 AI 입구 (원칙·파이프·툴·프롬프트·게임) |
| [00_ANIM_LIST.md](./00_ANIM_LIST.md) | 애니 목록 확정 (원본 예시, A1/A2) |
| [02_SPRITE_SPEC.md](./02_SPRITE_SPEC.md) | 캔버스·프레임·파츠·네이밍 |
| [03_WORK_ORDER.md](./03_WORK_ORDER.md) | 작업 순서·배치 큐 |
| [04_INGAME_RATIO.md](./04_INGAME_RATIO.md) | 인게임 고정 비율 (향아 기준) |
| [05_HEAD_MOTION_PLAN.md](./05_HEAD_MOTION_PLAN.md) | 머리 중심 애니 기획 |
| [06_SPRITE_PIPELINE.md](./06_SPRITE_PIPELINE.md) | AI 프레임 → Python 시트 |
| [07_HYANGA_VISUAL_CONCEPT.md](./07_HYANGA_VISUAL_CONCEPT.md) | 향아 비주얼 컨셉 (샘플 캐릭터 상세) |
| [08_SPRITE_ENGINE_METHOD.md](./08_SPRITE_ENGINE_METHOD.md) | 엔진 작업법 (상세) |
| [09_SPRITE_ANIM_HANDOFF.md](./09_SPRITE_ANIM_HANDOFF.md) | 게임 전달 (상세) — 원본 게임(몬카피바라) 기준, XOOX는 아직 미연동 |
| [sprites/](./sprites/README.md) | 스프라이트 이미지 루트 |
| [sprites/hyanga/engine/](./sprites/hyanga/engine/README.md) | 샘플 캐릭터(향아) 최종 애니 팩 + studio 툴 |
| [**stage/**](./stage/README.md) | **지역 무대 키트·CONTENT 집** · 기획 [gdd/21](../gdd/21_ART_STAGE_TOOL_이식.md) · `npm run dev:kit` |

읽는 순서: **[`00_PORTED_FROM_MONOCAPIBARA`](./00_PORTED_FROM_MONOCAPIBARA.md) → [`_guide/README`](./sprites/_guide/README.md) → 07 → 04 → engine/**
무대 배경: **[`stage/README`](./stage/README.md) → [gdd/21](../gdd/21_ART_STAGE_TOOL_이식.md)**
