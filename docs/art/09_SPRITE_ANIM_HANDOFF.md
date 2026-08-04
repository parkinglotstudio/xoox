# 스프라이트 애니 → 게임 개발 AI 전달 계획

> **최신 입구:** [`sprites/_guide/04_GAME_MANUAL.md`](./sprites/_guide/04_GAME_MANUAL.md) (이 문서는 상세/구버전)  
> **갱신:** 2026-07-21  
> **목적:** 원본 그림이 아니라 **완성된 스프라이트 애니 팩**만 전달한다.

---

## 1. 한 줄

> 게임 AI에게 줄 것 = `docs/art/sprites/{char}/engine/{anim_id}/`  
> (`{anim_id}_sheet.png` + `{anim_id}.json`)  
> 주지 말 것 = `frames_ai/`, ChatGPT 원본, 미정리 PNG 더미

---

## 2. 납품 단위 (Anim Pack)

```
docs/art/sprites/hyanga/engine/
  index.json                 ← 애니 목록
  studio.html                ← 사람 검수용 (게임 필수 아님)
  lobby_idle/
    lobby_idle_sheet.png     ← 가로(또는 그리드) 시트
    lobby_idle.json          ← 재생 스펙
    frames/                  ← (선택) 셀 단위 PNG
```

### JSON 최소 스키마 (게임 AI가 읽을 것)

```json
{
  "id": "lobby_idle",
  "cell": 512,
  "pivot": "bottom-center",
  "cols": 10,
  "frame_count": 10,
  "sheet": "lobby_idle_sheet.png",
  "loop": true,
  "frames": [
    { "index": 0, "duration_ms": 180, "file": "frames/lobby_idle_00.png" }
  ]
}
```

| 필드 | 게임에서 |
|------|----------|
| `sheet` | 텍스처 1장 로드 |
| `cell` | 한 프레임 UV 크기 (px) |
| `cols` | 시트 가로 칸 수 |
| `frames[].duration_ms` | 그 칸 표시 시간 |
| `pivot` | 앵커 (bottom-center = 발/콘 바닥) |
| `loop` | 루프 여부 |

재생: `frameIndex`를 시간에 따라 증가 →  
시트에서 `(index % cols) * cell`, `(index // cols) * cell` 크롭.

---

## 3. 전달 방식 (계획)

| 단계 | 담당 | 내용 |
|------|------|------|
| A. 제작 | 단서(아트 엔진) | 분리·배경제거·스케일·빌드 → `engine/{id}/` |
| B. 검수 | 사람 | `studio.html`에서 타이밍·루프 확인 |
| C. 확정 | 사람 | “이 애니 OK” → 납품 목록에 올림 |
| D. 핸드오프 | 문서+경로 | 게임 AI에게 **팩 경로 + 이 문서**만 전달 |
| E. 연동 | 게임 AI | loader가 `index.json` / `{id}.json` 읽고 재생 |

### 게임 AI에게 넣을 프롬프트 템플릿

```
스프라이트는 원본 PNG가 아니라 engine 팩만 사용한다.
루트: docs/art/sprites/hyanga/engine/
목록: index.json
각 애니: {dir}/{id}.json + {dir}/{id}_sheet.png
스펙: docs/art/09_SPRITE_ANIM_HANDOFF.md
피봇: bottom-center, 셀 크기 json.cell
프레임 시간은 frames[].duration_ms
먼저 lobby_idle 부터 로비 대기 애니로 연결할 것.
```

---

## 4. 슬롯 ↔ 애니 id 매핑 (향아)

| 게임 슬롯 | engine id | 상태 |
|-----------|-----------|------|
| 로비 idle (고개 갸우뚱) | `lobby_idle` | ✅ 10프레임 |
| 보드 점프 | `hop` | △ 있음 (재검수) |
| 인게임 idle / move / attack / hit / win / lose | (미확정) | 제작 후 동일 방식으로 추가 |

새 애니 추가 시: 같은 `engine/` 아래에 폴더만 늘리고 `index.json` 갱신.  
게임 AI는 **index만 다시 읽으면** 된다.

---

## 5. 하지 말 것

- frames_ai·ChatGPT 파일명을 게임 리소스로 직접 로드
- 프레임마다 다른 해상도/피봇으로 런타임 보정에 의존
- Spine 등 본 애니 전제 (현재는 **프레임 시트** 방식)

---

## 6. 다음 액션

1. `lobby_idle` 스튜디오 검수 → 타이밍 OK 시 **확정**
2. 확정 목록을 이 문서 §4에 체크
3. 게임 개발 세션 시작 시 위 **프롬프트 템플릿** + `engine/` 경로 전달
