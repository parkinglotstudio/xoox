#!/usr/bin/env python3
"""Trim 총쏘기2 front frames and pack to the same 512 cell as ingame_idle.

Reads _src/shoot.gif so it is safe to run twice. Does not touch
pickup/victory/fail or production actor sheets.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SHOOT_DIR = REPO / "data" / "ui" / "wanderer" / "test_clips" / "shoot"
SHOOT_GIF = REPO / "data" / "ui" / "wanderer" / "test_clips" / "_src" / "shoot.gif"
IDLE_JSON = REPO / "data" / "ui" / "actor" / "wanderer" / "ingame_idle" / "ingame_idle.json"
IDLE_SHEET = REPO / "data" / "ui" / "actor" / "wanderer" / "ingame_idle" / "ingame_idle_sheet.png"

# 0–19 = run-in / long wait. 20 = first muzzle raise.
TRIM_START = 20
CELL = 512
MAX_SHEET_PX = 4096
ALPHA = 8


def bbox(im: Image.Image, a: int = ALPHA) -> tuple[int, int, int, int] | None:
    px = im.convert("RGBA")
    data = px.load()
    w, h = px.size
    minx, miny, maxx, maxy = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            if data[x, y][3] >= a:
                found = True
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    return (minx, miny, maxx, maxy) if found else None


def grid_shape(n: int, cell: int = CELL) -> tuple[int, int]:
    cols = min(max(1, n), MAX_SHEET_PX // cell)
    rows = max(1, (n + cols - 1) // cols)
    return cols, rows


def load_gif(path: Path) -> tuple[list[Image.Image], list[int]]:
    im = Image.open(path)
    w, h = im.size
    canvas = Image.new("RGBA", (w, h))
    frames: list[Image.Image] = []
    durs: list[int] = []
    for i in range(getattr(im, "n_frames", 1)):
        im.seek(i)
        durs.append(max(16, int(im.info.get("duration") or 80)))
        overlay = im.convert("RGBA")
        dispose = int(getattr(im, "disposal_method", 0) or 0)
        canvas = Image.alpha_composite(canvas, overlay)
        frames.append(canvas.copy())
        if dispose == 2:
            canvas = Image.new("RGBA", (w, h))
    return frames, durs


def idle_metrics() -> tuple[int, int, int]:
    man = json.loads(IDLE_JSON.read_text(encoding="utf-8"))
    cell = int(man.get("cell") or 512)
    sheet = Image.open(IDLE_SHEET).convert("RGBA")
    fr = sheet.crop((0, 0, cell, cell))
    b = bbox(fr)
    if not b:
        raise SystemExit("idle frame 0 is empty")
    pivot = (man.get("applied_body_offsets") or {}).get("pivot") or {}
    foot_y = int(pivot.get("y") or (cell - int(man.get("pad_bottom") or 12)))
    return cell, b[3] - b[1] + 1, foot_y


def fit_frame(src: Image.Image, scale: float, foot_y: int, cx: int) -> Image.Image:
    rgba = src.convert("RGBA")
    nw = max(1, round(rgba.size[0] * scale))
    nh = max(1, round(rgba.size[1] * scale))
    scaled = rgba.resize((nw, nh), Image.Resampling.LANCZOS)
    b = bbox(scaled)
    canvas = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    if not b:
        return canvas
    bx0, by0, bx1, by1 = b
    dest_x = cx - (bx0 + bx1) // 2
    dest_y = foot_y - by1
    canvas.paste(scaled, (dest_x, dest_y), scaled)
    return canvas


def main() -> None:
    raw, durs = load_gif(SHOOT_GIF)
    keep = raw[TRIM_START:]
    keep_durs = durs[TRIM_START:]
    if len(keep) < 2:
        raise SystemExit(f"trim {TRIM_START} left {len(keep)} frames")

    cell, idle_h, foot_y = idle_metrics()
    heights = []
    for fr in keep:
        b = bbox(fr)
        if b:
            heights.append(b[3] - b[1] + 1)
    ref_h = sorted(heights)[len(heights) // 2]
    scale = idle_h / max(1, ref_h)
    print(
        f"idle cell {cell} h {idle_h} foot_y {foot_y} | "
        f"gif {len(raw)} trim {TRIM_START} keep {len(keep)} | src_h {ref_h} scale {scale:.4f}"
    )

    fitted = [fit_frame(fr, scale, foot_y, cell // 2) for fr in keep]
    cols, rows = grid_shape(len(fitted))
    out_sheet = Image.new("RGBA", (CELL * cols, CELL * rows), (0, 0, 0, 0))
    frames_dir = SHOOT_DIR / "frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir()
    recs = []
    for i, (fr, dur) in enumerate(zip(fitted, keep_durs)):
        out_sheet.paste(fr, ((i % cols) * CELL, (i // cols) * CELL), fr)
        name = f"shoot_{i:02d}.png"
        fr.save(frames_dir / name)
        recs.append({"index": i, "duration_ms": dur, "file": f"frames/{name}"})
        b = bbox(fr)
        if b and i in (0, len(fitted) // 2, len(fitted) - 1):
            print(f"  out f{i:02d} bbox={b} h={b[3]-b[1]+1} gap_bottom={CELL-1-b[3]}")

    SHOOT_DIR.mkdir(parents=True, exist_ok=True)
    sheet_name = "shoot_sheet.png"
    out_sheet.save(SHOOT_DIR / sheet_name)
    out_man = {
        "id": "shoot",
        "bank": "test",
        "cell": CELL,
        "cell_w": CELL,
        "cell_h": CELL,
        "cols": cols,
        "rows": rows,
        "frame_count": len(fitted),
        "pivot": "bottom-center",
        "foot_anchor": {"x": CELL // 2, "y": foot_y},
        "sheet": sheet_name,
        "loop": False,
        "source": "shoot.gif",
        "trim_start": TRIM_START,
        "match_idle": True,
        "scale_to_idle": round(scale, 4),
        "frames": recs,
    }
    (SHOOT_DIR / "shoot.json").write_text(
        json.dumps(out_man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote {len(fitted)} frames {cols}x{rows} cell {CELL} foot ({CELL//2},{foot_y})")


if __name__ == "__main__":
    main()
