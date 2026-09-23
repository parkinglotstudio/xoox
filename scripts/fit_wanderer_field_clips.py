#!/usr/bin/env python3
"""Fit wanderer field clips to ingame_idle 512 cell + foot.

Reads _src/{id}.gif so it is safe to run twice.
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
CLIP_ROOT = REPO / "data" / "ui" / "wanderer" / "test_clips"
IDLE_JSON = REPO / "data" / "ui" / "actor" / "wanderer" / "ingame_idle" / "ingame_idle.json"
IDLE_SHEET = REPO / "data" / "ui" / "actor" / "wanderer" / "ingame_idle" / "ingame_idle_sheet.png"

CELL = 512
MAX_SHEET_PX = 4096
ALPHA = 8

# shoot: drop run-in (0–19) and the second shot (26–end)
CLIPS = {
    "shoot": {"trim_start": 20, "trim_end": 26},
    "pickup": {"trim_start": 0, "trim_end": None},
    "victory": {"trim_start": 0, "trim_end": None},
    "fail": {"trim_start": 0, "trim_end": None},
}


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


def pack_clip(clip_id: str, idle_h: int, foot_y: int) -> None:
    cfg = CLIPS[clip_id]
    gif = CLIP_ROOT / "_src" / f"{clip_id}.gif"
    if not gif.is_file():
        raise SystemExit(f"missing {gif}")
    raw, durs = load_gif(gif)
    start = int(cfg["trim_start"])
    end = cfg["trim_end"]
    keep = raw[start:end]
    keep_durs = durs[start:end]
    if len(keep) < 1:
        raise SystemExit(f"{clip_id}: trim left 0 frames")

    heights = []
    for fr in keep:
        b = bbox(fr)
        if b:
            heights.append(b[3] - b[1] + 1)
    ref_h = sorted(heights)[len(heights) // 2] if heights else idle_h
    scale = idle_h / max(1, ref_h)
    print(
        f"{clip_id}: gif {len(raw)} keep {len(keep)} ({start}:{end if end is not None else ''}) "
        f"src_h {ref_h} scale {scale:.4f}"
    )

    fitted = [fit_frame(fr, scale, foot_y, CELL // 2) for fr in keep]
    cols, rows = grid_shape(len(fitted))
    out_sheet = Image.new("RGBA", (CELL * cols, CELL * rows), (0, 0, 0, 0))
    dest = CLIP_ROOT / clip_id
    dest.mkdir(parents=True, exist_ok=True)
    frames_dir = dest / "frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir()
    recs = []
    for i, (fr, dur) in enumerate(zip(fitted, keep_durs)):
        out_sheet.paste(fr, ((i % cols) * CELL, (i // cols) * CELL), fr)
        name = f"{clip_id}_{i:02d}.png"
        fr.save(frames_dir / name)
        recs.append({"index": i, "duration_ms": dur, "file": f"frames/{name}"})
        b = bbox(fr)
        if b and i in (0, len(fitted) // 2, len(fitted) - 1):
            print(f"  f{i:02d} h={b[3]-b[1]+1} gap_bottom={CELL-1-b[3]} footish={b[3]}")

    sheet_name = f"{clip_id}_sheet.png"
    out_sheet.save(dest / sheet_name)
    man = {
        "id": clip_id,
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
        "source": gif.name,
        "trim_start": start,
        "trim_end": end,
        "match_idle": True,
        "scale_to_idle": round(scale, 4),
        "frames": recs,
    }
    (dest / f"{clip_id}.json").write_text(
        json.dumps(man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("clips", nargs="*", default=list(CLIPS))
    args = ap.parse_args()
    unknown = [c for c in args.clips if c not in CLIPS]
    if unknown:
        raise SystemExit(f"unknown clips: {unknown}")
    _cell, idle_h, foot_y = idle_metrics()
    print(f"idle h {idle_h} foot_y {foot_y}")
    for clip_id in args.clips:
        pack_clip(clip_id, idle_h, foot_y)


if __name__ == "__main__":
    main()
