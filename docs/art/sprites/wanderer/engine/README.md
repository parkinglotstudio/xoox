# wanderer / engine

3인칭 **뒷모습** 방랑자. 향아 3/4 슬롯과 섞지 않는다.

| 폴더 | 애니 | 프레임 |
|------|------|--------|
| `ingame_idle/` | 칼라총 장착 대기 | 5 |
| `move/` | 총 넣고 뛰기 | 2 |
| `walk_gun/` | 총 들고 걷기 | 2 |
| `aim_fire/` | (예전 총쏘기 · 필드에서 뺌) | 2 |
| `draw_holster/` | 총 빼기 중간 | 1 |

```bash
python scripts/sprite_tool/editor_server.py --char wanderer --port 8768
# http://127.0.0.1:8768/studio.html
npm run dev:wanderer-anim
# http://localhost:5173/wanderer-anim.html
# 발사: 총쏘기2 · 미리보기: 줍기2 승리2 패배2
```

인게임: `data/ui/actor/wanderer/` + 필드 클립 `data/ui/wanderer/test_clips/` (총쏘기2·줍기2·승리·패배).  
들판: 마우스 왼쪽 / **Z** = 총쏘기2(직선) · 얼룩 1차 = 정화제 던지기(곡선) · 벌레 이후 = 총 · **Space** 던지기 · WASD 이동.  
승리는 1차 정화 파동이 퍼질 때 1회. 미리보기 `1`–`8`.
