# 스프라이트 제작 파이프라인 【확정】

> **갱신:** 2026-07-21  
> **원칙:** AI = **프레임 PNG 개별 생성** → Python = **검증·정규화·시트 패킹**

---

## 1. 흐름

```
AI: 슬롯당 MASTER 포즈 1장 (몸·스케일 고정용)
        ↓
(로비 idle 등 보블) Python bobble_idle_from_master.py
  - 몸은 master 그대로 복제
  - 머리 영역만 L/R 각도 회전 → f0~f5
        ↓
(기타 슬롯) AI가 프레임을 따로 뽑되, 가능하면 master 합성
        ↓
Python pack_sprites.py → 시트
```

> **교훈:** AI에게 프레임 6장을 따로 시키면 몸이 프레임마다 흔들리고, 고개가 한쪽으로만 가는 경우가 많음.  
> **보블 idle은 master 1장 + 머리 회전 툴**이 정답.

## 2. 규칙

| 항목 | 내용 |
|------|------|
| AI 출력 | **프레임 단위** (한 장에 여러 포즈 금지 · 사이즈 흔들림 큼) |
| 최종 납품 | **슬롯당 시트 1장** (툴이 만듦) |
| 스케일 | 전 프레임 **동일 셀** · 툴이 패딩으로 강제 |
| 로비 | 흰 스티커 보더 · 정면 |
| 인게임 | 검정 라인 · 투명 BG · 3/4 옆 |

## 3. 로비 idle 키 (6)

| f | 머리 |
|---|------|
| 0 | 중앙 |
| 1 | 살짝 L (±4°) |
| 2 | 조금 L (±6°) |
| 3 | 중앙 |
| 4 | 살짝 R |
| 5 | 조금 R |

몸·발·캔버스 위치 고정. 과한 흔들림 금지.

## 4. Sprite Engine 【제작 본체】

결과물은 **한곳**에 모은다: `docs/art/sprites/{char}/engine/{id}/`

```bash
python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id hop \
  --frames-dir docs/art/sprites/hyanga/ingame/hop/frames_ai \
  --cell 512 --pivot bottom-center --duration-ms 120 --preview

# 한 장에 여러 포즈(스트립) → 자동 분리 후 빌드
python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id idle_blink --strip \
  --frames "docs/art/sprites/hyanga/ingame/idle/frames_ai/SomeStrip.png" \
  --preview
```

상세: [`scripts/sprite_tool/README.md`](../../scripts/sprite_tool/README.md)

### (구) 단순 패킹만

```bash
python3 scripts/sprite_tool/pack_sprites.py \
  --frames-dir docs/art/sprites/hyanga/lobby/idle/frames \
  --out docs/art/sprites/hyanga/lobby/idle/sheet/hyanga_lobby_idle_6frame_sheet.png \
  --cell 256 --cols 6
```
