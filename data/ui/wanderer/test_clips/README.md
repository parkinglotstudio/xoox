# wanderer test clips (7 named)

Test-only preview bank for `npm run dev:wanderer-anim`.  
Does **not** replace `data/ui/actor/wanderer/` production sheets.

| Field | Value |
|-------|--------|
| canvas | 512×640 |
| pivot | bottom-center |
| foot anchor | (256, 624) |
| ids | `idle` `shoot` `run` `pickup` `throw` `victory` `fail` |
| loop | `idle` + `run` true; others false (hold last frame) |

480×480 gun-run frames are **not scaled**. Source bottom-center (240, 480) is pasted so it lands on (256, 624): offset **(16, 144)**.

## How to preview

```bash
npm run dev:wanderer-anim
```

Open http://localhost:5173/wanderer-anim.html?bank=test  
Click **아이들 / 총쏘기 / 달리기 / 줍기 / 던지기 / 승리 / 패배**. Red crosshair is the shared foot plant.

## How to pack

Drop GIFs here (the only path the packer reads on the VM):

```
data/ui/wanderer/test_clips/_src/idle.gif
data/ui/wanderer/test_clips/_src/shoot.gif
data/ui/wanderer/test_clips/_src/run.gif
data/ui/wanderer/test_clips/_src/pickup.gif
data/ui/wanderer/test_clips/_src/throw.gif
data/ui/wanderer/test_clips/_src/victory.gif
data/ui/wanderer/test_clips/_src/fail.gif
```

```bash
python3 scripts/pack_wanderer_test_clips.py
```

Optional `{id}_sheet.png` fallback in the same folder (512×640 or 480×480 cell grid).

## Local refs (not on the VM)

- `C:\Users\dmaxd\xoox-anim-refs\user4_normalized\`
- `C:\Users\dmaxd\xoox-anim-refs\gun-run\game_ready\`
