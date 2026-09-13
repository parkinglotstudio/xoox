# wanderer test clips (4)

남긴 클립: **총쏘기 · 줍기 · 승리 · 패배**  
지운 클립: 아이들 / 달리기 / 던지기 (생산 `data/ui/actor/wanderer` 시트를 씀)

| Test clip | 툴 버튼 | 필드 |
|-----------|---------|------|
| `shoot` | 총쏘기2 | 마우스 왼쪽 / Z |
| `pickup` | 줍기2 | 줍기 버스트 |
| `victory` | 승리2 | 습격/루프 승리 |
| `fail` | 패배2 | 습격/루프 패배 |

원본 GIF:

```
data/ui/wanderer/test_clips/_src/shoot.gif
data/ui/wanderer/test_clips/_src/pickup.gif
data/ui/wanderer/test_clips/_src/victory.gif
data/ui/wanderer/test_clips/_src/fail.gif
```

```bash
python3 scripts/pack_wanderer_test_clips.py
npm run dev:wanderer-anim
```
