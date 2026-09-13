# wanderer test clips (user4)

Test-only preview bank for `npm run dev:wanderer-anim`.  
Does **not** replace `data/ui/actor/wanderer/` production sheets.

| Field | Value |
|-------|--------|
| canvas | 512×640 |
| pivot | bottom-center |
| foot anchor | (256, 624) |
| ids | `a` `b` `c` `d` (letter ids — production slot mapping TBD) |

## How to preview

```bash
npm run dev:wanderer-anim
```

Open http://localhost:5173/wanderer-anim.html?bank=test  
Click **테스트** → **A / B / C / D**. Red crosshair is the shared foot plant. Switching clips should not slide the feet.

## How to pack

Drop source files here (this is the only path the packer reads on the VM):

```
data/ui/wanderer/test_clips/_src/a.gif
data/ui/wanderer/test_clips/_src/b.gif
data/ui/wanderer/test_clips/_src/c.gif
data/ui/wanderer/test_clips/_src/d.gif
# optional fallback if a GIF is missing:
data/ui/wanderer/test_clips/_src/a_sheet.png
data/ui/wanderer/test_clips/_src/b_sheet.png
data/ui/wanderer/test_clips/_src/c_sheet.png
data/ui/wanderer/test_clips/_src/d_sheet.png
```

```bash
python3 scripts/pack_wanderer_test_clips.py
```

The packer keeps the 512×640 canvas as-is (no re-fit / re-center). Green chroma (GIF) / white (sheet) is keyed to alpha.  
If a frame is not 512×640, the packer **stops** instead of guessing a new anchor.

`{id}_sheet.png` is that clip only (grid of 512×640 cells). Empty trailing cells are skipped. GIFs win when both exist.

## Local refs (not on the VM)

- `C:\Users\dmaxd\xoox-anim-refs\user4_normalized\`
- `C:\Users\dmaxd\xoox-anim-refs\gun-run\game_ready\` (`run_loop` — not imported here)
