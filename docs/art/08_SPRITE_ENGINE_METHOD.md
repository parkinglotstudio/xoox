# 스프라이트 엔진 작업법 【기록】

> **최신 입구:** [`sprites/_guide/01_MAKE_ANIM.md`](./sprites/_guide/01_MAKE_ANIM.md) · [`02_TOOLS.md`](./sprites/_guide/02_TOOLS.md) (이 문서는 상세/구버전)  
> **갱신:** 2026-07-21  
> **툴:** `scripts/sprite_tool/sprite_engine.py`  
> **납품 루트:** `docs/art/sprites/{char}/engine/`  
> **미리보기:** `engine/studio.html` (드롭다운)

이 문서는 **실제로 쓴 방법**을 기록한다. 그림 원본이 아니라 **완성된 스프라이트 애니 팩**을 게임 개발 AI에 넘긴다.

---

## 1. 원칙

| 구분 | 역할 |
|------|------|
| 원본 / frames_ai | 스케치·스트립·분리본 (작업용) |
| **engine/** | **게임·미리보기용 최종 리소스만** |
| 전달물 | `{id}_sheet.png` + `{id}.json` (+ `index.json`) |

**그림 파일 묶음을 주지 않는다.**  
`engine/{anim_id}/` 팩(시트+매니페스트)을 준다.

---

## 2. 작업 순서 (로비 idle 실례)

1. **원본** — ChatGPT 가로 스트립 2장 (`lobby/idle/frames_ai/`, 백업 폴더 제외)
2. **분리** — 스트립 → 단장 10장 (`frames_ai/splits/`)
3. **외곽 단색만 제거** — **모서리 flood** (안쪽 색 보존) → `frames_ai/splits_nobg/`
4. **스케일 맞춤** — 05~09 캐릭터 높이를 00~04 평균에 맞춤
5. **몸 고정 정렬 (중요)** — 통짜 bbox 중심 ❌ · **콘/몸 하단 중심**을 셀 피봇에 고정 · 고개만 움직임
6. **엔진 패킹** — 이미 512 셀이면 **재센터 금지** · 시트 + JSON

몸 흔들림이 보이면: 정렬 기준이 머리+몸 전체인 것. `splits_bodylock` + body-lock 패킹을 쓴다.

```bash
python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id lobby_idle \
  --frames-dir docs/art/sprites/hyanga/lobby/idle/frames_ai/splits_nobg \
  --bg none --cell 512 --pivot bottom-center --preview
```

미리보기 서버:

```bash
python3 -m http.server 8765 --directory docs/art/sprites/hyanga/engine
# http://127.0.0.1:8765/studio.html
```

---

## 3. 엔진이 하는 일

| 단계 | 내용 |
|------|------|
| strip | 한 장에 여러 포즈 → 자동/등분 분리 (`--strip`) |
| bg | `flood`(외곽만) / 구형 chroma는 안쪽 구멍 위험 → 외곽 전용 권장 |
| normalize | 동일 `cell`, `pivot`(기본 bottom-center) |
| pack | `{id}_sheet.png` |
| manifest | `{id}.json` — 프레임 순서·`duration_ms` |
| studio | `index.json` + `studio.html` 드롭다운 |

---

## 4. 현재 engine 애니

| id | 내용 | 프레임 |
|----|------|--------|
| `lobby_idle_a` | 로비 갸우뚱 (원본 00~04 → 핑퐁 10) | 10 |
| `lobby_idle_b` | 로비 갸우뚱+깜빡 계열 (05~09 → 핑퐁 10) | 10 |
| `hop` | 보드 점프 | 4 |
| `idle_blink` | (구) 깜빡 스트립 테스트 | 5 |

핑퐁 순서: `L→C→R→C→L→…` (스트립 원순서 금지 — 중간 끊김 원인)  
B는 깜빡 프레임을 틸트 루프에서 제외.

---

## 5. 관련 문서

- 게임 AI 전달: [09_SPRITE_ANIM_HANDOFF.md](./09_SPRITE_ANIM_HANDOFF.md)
- 툴 README: [`scripts/sprite_tool/README.md`](../../scripts/sprite_tool/README.md)
- 비주얼 컨셉: [07_HYANGA_VISUAL_CONCEPT.md](./07_HYANGA_VISUAL_CONCEPT.md)
