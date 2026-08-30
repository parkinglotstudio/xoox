# wanderer / engine

3인칭 **뒷모습** 방랑자. 향아 3/4 슬롯과 섞지 않는다.

| 폴더 | 애니 | 프레임 |
|------|------|--------|
| `ingame_idle/` | 칼라총 장착 대기 | 5 |
| `move/` | 총 넣고 뛰기 | 2 |
| `walk_gun/` | 총 들고 걷기 | 2 |
| `aim_fire/` | 구부려 조준 | 1 |
| `draw_holster/` | 총 빼기 중간 | 1 |

```bash
python scripts/sprite_tool/editor_server.py --char wanderer --port 8768
# http://127.0.0.1:8768/studio.html
npm run dev:wanderer-anim
```

게임 복사본: `data/ui/actor/wanderer/`
