# 04 — 게임 메뉴얼 (로더·연동)

> 게임 AI는 **이 문서 + `engine/`만** 보면 된다.  
> 주지 말 것: `frames_ai`, `_archive`, `_guide` 이미지, studio/align/scale HTML (사람 검수용).

## 루트

```
docs/art/sprites/{char}/engine/
```

향아: `docs/art/sprites/hyanga/engine/`

## 필수 파일

| 파일 | 역할 |
|------|------|
| `index.json` | 애니 목록 |
| `{id}/{id}_sheet.png` | 스프라이트 시트 |
| `{id}/{id}.json` | 재생 스펙 |

선택(사람/툴): `frames/`, `preview.html`, `_pre_*_backup/`

## JSON 스키마 (게임 필수 필드)

```json
{
  "id": "ingame_idle",
  "cell": 512,
  "cols": 10,
  "pivot": "bottom-center",
  "loop": true,
  "sheet": "ingame_idle_sheet.png",
  "frame_count": 10,
  "frames": [
    { "index": 0, "duration_ms": 180, "file": "frames/ingame_idle_00.png" }
  ]
}
```

| 필드 | 의미 |
|------|------|
| `sheet` | 텍스처 1장 |
| `cell` | 한 칸 px |
| `cols` | 가로 칸 수 |
| `frames[].duration_ms` | 표시 시간 |
| `pivot` | 앵커 (`bottom-center` = 콘 바닥) |
| `loop` | 루프 여부 |

재생: 시간으로 `frameIndex` 증가 →  
UV = `(index % cols) * cell`, `(index // cols) * cell` 크롭.

`applied_*` / `scales` / `idle_ref` 등은 **제작 메타**. 로더는 무시해도 됨.

## 향아 확정 목록

| id | 용도 | frames |
|----|------|--------|
| `lobby_idle_a` | 로비 대기 A | 10 |
| `lobby_idle_b` | 로비 대기 B | 10 |
| `ingame_idle` | 인게임 대기 | 10 |
| `move` | 이동 | 4 |
| `hop` | 보드 점프 | 6 |
| `attack_a` | 돌진 공격 | 4 |
| `attack_b` | 제자리 마법 | 4 |
| `hit` | 피격 | 3 |
| `win` | 승리 루프 | 4 |
| `lose` | 패배 루프 | 4 |

`idle_blink`은 제외(아카이브).

## 다음 장수

폴더만 `docs/art/sprites/{char}/engine/` 로 동일 레이아웃.  
게임은 `index.json`만 다시 읽으면 된다.

## 핸드오프 프롬프트 (복붙)

```
스프라이트는 engine 팩만 사용한다.
루트: docs/art/sprites/hyanga/engine/
목록: index.json
각 애니: {dir}/{id}.json + {dir}/{id}_sheet.png
스펙: docs/art/sprites/_guide/04_GAME_MANUAL.md
피봇: bottom-center, 셀 = json.cell
프레임 시간: frames[].duration_ms
frames_ai / _archive / studio HTML은 로드하지 말 것.
```

구버전 상세: [../../09_SPRITE_ANIM_HANDOFF.md](../../09_SPRITE_ANIM_HANDOFF.md)
