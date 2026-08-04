# 무대 아트 (지역 키트 · CONTENT prop)

> **이식됨:** 몬카피바라(`C:\Users\dmaxd\Downloads\monocapibara`)에서 2026-08-01 이식 — 전체 안내는 [`docs/gdd/21_ART_STAGE_TOOL_이식.md`](../../gdd/21_ART_STAGE_TOOL_이식.md)
> **▶ 만드는 법(누구나):** [21 §1-4 새 배경 추가](../../gdd/21_ART_STAGE_TOOL_이식.md#1-4-샘플-아트-몬카피바라-원본-그대로--xoox-전용-아님)
> **검수 툴:** 프로젝트 루트에서 `npm run dev:kit`
> **상태:** 샘플(몬카피바라 원본 지역명 그대로) — **XOOX 게임 화면엔 아직 연동 안 됨**

## 폴더

| 경로 | 용도 |
|------|------|
| `docs/art/stage/regions/{region_id}/` | 키트 원본 (far·near·obj) |
| `data/art/stage/regions/{region_id}/` | **런타임 복사본** (vite `publicDir=data`) |
| `docs/art/stage/props/` · `data/art/stage/props/` | 칸 조우 집(CONTENT) |
| `docs/art/stage/actor/` | 키트툴 미리보기용 선두 (샘플: 향아) |

**주의:** `docs/`만 넣고 `data/`를 안 넣으면 툴에 안 보입니다.

## 스펙 요약

| 레이어 | 크기 | 메모 |
|--------|------|------|
| FAR / NEAR | 2048×512 | 가로 루프 필수 |
| OBJ | 1024×512 | 알파 |
| CONTENT prop | 512×512 권장 | 알파 · 발 아래 |

## CSV

이식 안 함 — 이유·재설계 메모는 [21 §3](../../gdd/21_ART_STAGE_TOOL_이식.md#3-관련-csv-아직-채워-넣지-않음) 참조.
