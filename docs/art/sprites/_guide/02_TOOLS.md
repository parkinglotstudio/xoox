# 02 — 툴

## 메인: editor.html (유비 이후 권장)

**저장이 엔진 팩에 바로 들어가려면** `editor_server`로 열어야 한다 (`http.server`만 쓰면 JSON 받기만 가능).

```bash
# 관우 예
python3 scripts/sprite_tool/editor_server.py --char guanyu --port 8767
# http://127.0.0.1:8767/editor.html#attack_b

# 유비 예
python3 scripts/sprite_tool/editor_server.py --char liubei --port 8766
```

| 기능 | 설명 |
|------|------|
| 위 ANI / 아래 IDLE | 같은 PX·그리드 · 머리 잘림 없이 **화면 맞춤** |
| 붉은 원통뿔 295 | 사이즈 기준 (양쪽) |
| 스케일·dx/dy·재생 | 한 화면에서 |
| **엔진에 저장** | `POST /api/apply` → frames·시트·JSON 즉시 반영 |
| JSON 받기 | 백업용 다운로드 (단서 수동 적용용) |

CLI로만 적용할 때:

```bash
python3 scripts/sprite_tool/apply_editor_pack.py \
  --anim-dir docs/art/sprites/generals/guanyu/engine/attack_b \
  --scales path/to_frame_scales.json \
  --offsets path/to_body_offsets.json
```

노하우: [13_PIPELINE_KNOWHOW.md](./13_PIPELINE_KNOWHOW.md) · 크기 정책: [12](./12_SIZE_POLICY.md) · 로비: [15](./15_LOBBY_IDLE_METRICS.md)

## 로비 idle 에디터 (ingame_idle 없어도 됨)

로비만 있는 장수는 `editor.html`을 로비용으로 두고(아래 패널=lobby C), **반드시 `editor_server`** 로 연다.

```bash
python3 scripts/sprite_tool/editor_server.py --char lubu --port 8786
# http://127.0.0.1:8786/editor.html#lobby_idle
```

| 캐릭 | port (2026-07-31) |
|------|-------------------|
| lubu | 8786 |
| sunquan | 8787 |
| yuanshao | 8788 |
| zhaoyun | 8789 |
| zhouyu | 8790 |
| zhugeliang | 8791 |

에이전트 셸에서 서버가 죽으면 double-fork(setsid)로 데몬화. 상세·사고록: [15](./15_LOBBY_IDLE_METRICS.md).

## 구 웹 3종 (참고)

```bash
python3 -m http.server 8765 --directory docs/art/sprites/hyanga/engine
```

| 툴 | URL | 역할 |
|----|-----|------|
| 플레이 | studio.html | 재생·타이밍 |
| 위치 | align.html | 오프셋 JSON |
| 크기 | scale.html | 스케일 JSON |

해시: `editor.html#lose` / `scale.html#lose`

## 절대값 규칙 【중요】

UI/JSON의 scale·offset은 **이미 구워진 시트 대비 상대값이 아니라**,  
원본 백업 대비 **절대값**이다.

| 백업 | 용도 |
|------|------|
| `_pre_scale_backup/` | 스케일 적용 전 프레임 |
| `_pre_offset_backup/` | 오프셋 적용 전(스케일까지 반영된) 프레임 |

적용 흐름: 에디터 **엔진에 저장** (또는 JSON) → `_pre_*_backup`에서 복원 → 절대값 적용 → 시트 재빌드.  
이미 스케일된 팩에 “1.0 상대”를 또 곱하면 **아무 변화가 없는 것처럼** 보이니 주의.

## CLI

```bash
# index + studio 갱신
python3 scripts/sprite_tool/sprite_engine.py studio --char hyanga

# 키포즈 → 팩
python3 scripts/sprite_tool/sprite_engine.py build \
  --char hyanga --id hop \
  --frames-dir docs/art/sprites/hyanga/ingame/hop/frames_ai \
  --cell 512 --pivot bottom-center --duration-ms 120 --preview

# 매니페스트만으로 시트 재구성
python3 scripts/sprite_tool/sprite_engine.py rebuild \
  --manifest docs/art/sprites/hyanga/engine/hop/hop.json

# scale.html JSON 반영 (헬퍼)
python3 scripts/sprite_tool/apply_frame_adjust.py \
  --anim-dir docs/art/sprites/hyanga/engine/lose \
  --scales path/to/frame_scales.json
```

스크립트 설명: [`../../../scripts/sprite_tool/README.md`](../../../../scripts/sprite_tool/README.md)  
작업법 상세(구버전 입구): [../../08_SPRITE_ENGINE_METHOD.md](../../08_SPRITE_ENGINE_METHOD.md)
