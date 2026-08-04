# hyanga / engine

게임·미리보기용 **정규화 리소스 루트**.  
원본(`frames_ai`)과 분리. **게임 AI에는 여기만 전달.**

가이드(다음 AI 입구): [`../../_guide/README.md`](../../_guide/README.md) · 게임: [`../../_guide/04_GAME_MANUAL.md`](../../_guide/04_GAME_MANUAL.md)

| 폴더 | 애니 | 프레임 |
|------|------|--------|
| `lobby_idle_a/` | 로비 갸우뚱 A | 10 |
| `lobby_idle_b/` | 로비 갸우뚱+깜빡 B | 10 |
| `ingame_idle/` | 인게임 대기 | 10 |
| `hop/` | 보드 점프 | 6 |
| `move/` | 달리기 | 4 |
| `attack_a/` | 돌진 공격 | 4 |
| `attack_b/` | 제자리 마법 | 4 |
| `hit/` | 피격 | 3 |
| `win/` | 승리 루프 | 4 |
| `lose/` | 패배 루프 | 4 |

각 애니: `{id}_sheet.png` · `{id}.json` · `frames/`  
툴 기준본(삭제 금지): `_pre_scale_backup/` · `_pre_offset_backup/`

## 툴 3종 (크기 기준 = 항상 idle)

| 툴 | 파일 | 역할 |
|----|------|------|
| **플레이** | [studio.html](./studio.html) | 재생 · 타이밍 |
| **위치** | [align.html](./align.html) | 오프셋 JSON |
| **크기** | [scale.html](./scale.html) | 스케일 JSON |

상세: [`../../_guide/02_TOOLS.md`](../../_guide/02_TOOLS.md)

```bash
python3 -m http.server 8765 --directory docs/art/sprites/hyanga/engine
# http://127.0.0.1:8765/studio.html
python3 scripts/sprite_tool/sprite_engine.py studio --char hyanga
```
