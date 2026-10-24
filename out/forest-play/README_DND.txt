forest-play catalog drag-and-drop + Orune spawn FX (2026-09-27)

DnD (Units catalog list → map canvas)
- Click item = preview (unchanged click-picker on pads also kept)
- Drag list item onto map:
  - tower_* → tower construction slot install
  - unit facility kinds (unit_map, k_tent, k_structure, k_machine, k_crane) → unit slots
  - other GLBs → free prop at drop point
- Ghost preview + pad highlight while dragging (nearest-slot snap ~18m)

Spawn FX (PlaySpawnFx.ts) — Orune-style
- Additive cyan pillar + white core
- Floating digital pixel rectangles rising
- Ground ring glow
- Fires on slot install (PlayBuild.attachPlaced) and free-prop place

Live on C:\xoox only (forest-map-tool NOT modified)
Dev: http://127.0.0.1:5179/forest-play-tool.html
Shots: 50_dnd_place.png … 54_dnd_html5.png
No git.
