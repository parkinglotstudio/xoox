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
# http://localhost:5173/wanderer-anim.html
# 새 클립 버튼: 아이들2 총쏘기2 달리기2 줍기2 던지기2 승리2 패배2
```

게임 복사본(폴백): `data/ui/actor/wanderer/`  
필드에 덮어쓰는 테스트 7클립: `data/ui/wanderer/test_clips/`  
들판 조작: 마우스 왼쪽 / **Z** 발사 · **Space** 던지기 · WASD 이동. 로비 액터는 이 뱅크를 쓰지 않는다.
