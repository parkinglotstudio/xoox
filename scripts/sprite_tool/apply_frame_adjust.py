#!/usr/bin/env python3
"""Apply frame_scales / body_offsets JSON from scale.html / align.html onto an anim pack."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def apply_scales(engine_anim: Path, scales_doc: dict, out_dir: Path | None = None) -> None:
    man_path = engine_anim / f"{engine_anim.name}.json"
    man = json.loads(man_path.read_text(encoding="utf-8"))
    cell = int(man.get("cell", 512))
    pad = int(scales_doc.get("pad_bottom", 12))
    pivot_x = cell / 2
    pivot_y = cell - pad
    scales = {str(k): float(v) for k, v in (scales_doc.get("scales") or {}).items()}

    frames_dir = engine_anim / "frames"
    out_dir = out_dir or frames_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    for f in man.get("frames") or []:
        key = f.get("source_key", f.get("pose_index", f.get("index")))
        s = scales.get(str(key), scales.get(key, 1.0))
        src = frames_dir / f["name"]
        im = Image.open(src).convert("RGBA")
        if abs(s - 1.0) < 1e-6:
            im.save(out_dir / f["name"])
            continue
        # scale around bottom-center pivot inside cell
        cell_im = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        # assume source is already a cell
        if im.size != (cell, cell):
            tmp = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
            tmp.paste(im, (0, 0), im)
            im = tmp
        nw = max(1, int(round(cell * s)))
        nh = max(1, int(round(cell * s)))
        scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
        # place so pivot maps to pivot
        x = int(round(pivot_x - pivot_x * s))
        y = int(round(pivot_y - pivot_y * s))
        cell_im.paste(scaled, (x, y), scaled)
        cell_im.save(out_dir / f["name"])
        f.setdefault("applied_scale", s)

    man["applied_frame_scales"] = scales_doc
    man_path.write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"applied scales → {engine_anim}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Apply scale/align JSON to engine anim frames")
    ap.add_argument("--anim-dir", type=Path, required=True, help="e.g. docs/art/sprites/hyanga/engine/lose")
    ap.add_argument("--scales", type=Path, help="*_frame_scales.json from scale.html")
    args = ap.parse_args()
    if args.scales:
        doc = json.loads(args.scales.read_text(encoding="utf-8"))
        apply_scales(args.anim_dir, doc)


if __name__ == "__main__":
    main()
