#!/usr/bin/env python3
"""Pack individual sprite frames into a horizontal strip sheet.

Usage:
  python3 scripts/sprite_tool/pack_sprites.py \\
    --frames-dir docs/art/sprites/hyanga/lobby/idle/frames \\
    --out docs/art/sprites/hyanga/lobby/idle/sheet/hyanga_lobby_idle_6frame_sheet.png \\
    --cell 256 --cols 6
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from PIL import Image


FRAME_RE = re.compile(r"_f(\d+)\.(png|webp)$", re.I)


def list_frames(frames_dir: Path) -> list[Path]:
    files = [p for p in frames_dir.iterdir() if p.suffix.lower() in {".png", ".webp"}]
    scored: list[tuple[int, Path]] = []
    for p in files:
        m = FRAME_RE.search(p.name)
        if m:
            scored.append((int(m.group(1)), p))
        else:
            scored.append((10_000 + len(scored), p))
    scored.sort(key=lambda x: (x[0], x[1].name))
    return [p for _, p in scored]


def fit_cell(im: Image.Image, cell: int) -> Image.Image:
    """Fit image into cell×cell RGBA canvas, keep aspect, center."""
    im = im.convert("RGBA")
    w, h = im.size
    scale = min(cell / w, cell / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    canvas.paste(resized, ((cell - nw) // 2, (cell - nh) // 2), resized)
    return canvas


def pack(frames: list[Path], out: Path, cell: int, cols: int | None) -> None:
    if not frames:
        raise SystemExit(f"No frames in {frames[0].parent if False else 'frames_dir'}")
    cells = [fit_cell(Image.open(p), cell) for p in frames]
    n = len(cells)
    cols = cols or n
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        r, col = divmod(i, cols)
        # row-major: actually we want horizontal strip first → use i // cols as row if multi
        sheet.paste(c, (col * cell, r * cell), c)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"packed {n} frames → {out} ({cols}x{rows} cells @ {cell}px)")


def main() -> None:
    ap = argparse.ArgumentParser(description="Pack sprite frames into a sheet")
    ap.add_argument("--frames-dir", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    ap.add_argument("--cell", type=int, default=256)
    ap.add_argument("--cols", type=int, default=None, help="columns (default=all in one row)")
    args = ap.parse_args()
    frames = list_frames(args.frames_dir)
    if not frames:
        raise SystemExit(f"No frame images in {args.frames_dir}")
    pack(frames, args.out, args.cell, args.cols)


if __name__ == "__main__":
    main()
