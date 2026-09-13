#!/usr/bin/env python3
"""Pack wanderer test GIFs into a test-only 512×640 bank.

Does not overwrite data/ui/actor/wanderer production sheets.
512×640 frames stay as-is. 480×480 frames are pasted (no scale) so
source bottom-center (240, 480) maps to the bank foot (256, 624).
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[1]
DEFAULT_OUT = REPO / "data" / "ui" / "wanderer" / "test_clips"
DEFAULT_SRC = DEFAULT_OUT / "_src"
ATTACH_DIRS = [
    Path("/workspace/cursor-work/artifacts/seven"),
    Path("/workspace/cursor-work/artifacts/user4/v4"),
]

CELL_W = 512
CELL_H = 640
FOOT = {"x": 256, "y": 624}
GUN_CELL = 480  # older gun-run square cells

CLIPS = (
    {"id": "idle", "label": "아이들", "loop": True},
    {"id": "shoot", "label": "총쏘기", "loop": False},
    {"id": "run", "label": "달리기", "loop": True},
    {"id": "pickup", "label": "줍기", "loop": False},
    {"id": "throw", "label": "던지기", "loop": False},
    {"id": "victory", "label": "승리", "loop": False},
    {"id": "fail", "label": "패배", "loop": False},
)
CLIP_IDS = tuple(c["id"] for c in CLIPS)
CLIP_META = {c["id"]: c for c in CLIPS}


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


def key_chroma(im: Image.Image, *, key: tuple[int, int, int], tol: int) -> Image.Image:
    rgba = im.convert("RGBA")
    pixels = list(rgba.getdata())
    out = []
    kr, kg, kb = key
    for r, g, b, a in pixels:
        if a == 0:
            out.append((r, g, b, 0))
            continue
        dist = abs(r - kr) + abs(g - kg) + abs(b - kb)
        out.append((r, g, b, 0) if dist <= tol else (r, g, b, a))
    rgba.putdata(out)
    return rgba


def looks_chroma(im: Image.Image, key: tuple[int, int, int], tol: int) -> bool:
    w, h = im.size
    samples = [
        im.getpixel((2, 2))[:3],
        im.getpixel((w - 3, 2))[:3],
        im.getpixel((2, h - 3))[:3],
        im.getpixel((w - 3, h - 3))[:3],
    ]
    return all(abs(p[0] - key[0]) + abs(p[1] - key[1]) + abs(p[2] - key[2]) <= tol for p in samples)


def maybe_key(im: Image.Image, *, key_green: bool, key_white: bool) -> Image.Image:
    rgba = im.convert("RGBA")
    if key_green and looks_chroma(rgba, (0, 255, 0), 40):
        rgba = key_chroma(rgba, key=(0, 255, 0), tol=48)
    elif key_white and looks_chroma(rgba, (255, 255, 255), 12):
        rgba = key_chroma(rgba, key=(255, 255, 255), tol=16)
    return rgba


def fit_to_bank(im: Image.Image, label: str) -> Image.Image:
    """Place a frame on the 512×640 bank so its foot matches (256, 624).

    - 512×640: keep pixels (already foot-normalized).
    - 480×480: no scale. Source bottom-center (240, 480) → (256, 624),
      i.e. paste at (16, 144).
    """
    rgba = im.convert("RGBA")
    w, h = rgba.size
    if (w, h) == (CELL_W, CELL_H):
        return rgba
    if (w, h) == (GUN_CELL, GUN_CELL):
        src_foot = (GUN_CELL // 2, GUN_CELL)
        dx = FOOT["x"] - src_foot[0]
        dy = FOOT["y"] - src_foot[1]
        canvas = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
        canvas.paste(rgba, (dx, dy), rgba)
        print(f"{label}: 480×480 → 512×640 foot map ({src_foot[0]},{src_foot[1]})→({FOOT['x']},{FOOT['y']}) paste ({dx},{dy})")
        return canvas
    raise SystemExit(
        f"{label}: frame is {w}×{h}. Only 512×640 (keep) or 480×480 (foot-map) are allowed."
    )


def pack_sheet(frames: list[Image.Image]) -> Image.Image:
    sheet = Image.new("RGBA", (CELL_W * len(frames), CELL_H), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * CELL_W, 0), fr)
    return sheet


def write_clip(
    out_root: Path,
    clip_id: str,
    frames: list[Image.Image],
    durs: list[int],
    *,
    source: str,
    loop: bool,
) -> Path:
    dest = out_root / clip_id
    dest.mkdir(parents=True, exist_ok=True)
    sheet_name = f"{clip_id}_sheet.png"
    pack_sheet(frames).save(dest / sheet_name)
    frames_dir = dest / "frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir()
    recs = []
    for i, (fr, dur) in enumerate(zip(frames, durs)):
        name = f"{clip_id}_{i:02d}.png"
        fr.save(frames_dir / name)
        recs.append(
            {
                "index": i,
                "duration_ms": int(dur),
                "file": f"frames/{name}",
            }
        )
    man = {
        "id": clip_id,
        "bank": "test",
        "cell": CELL_W,
        "cell_w": CELL_W,
        "cell_h": CELL_H,
        "cols": len(frames),
        "rows": 1,
        "frame_count": len(frames),
        "pivot": "bottom-center",
        "foot_anchor": dict(FOOT),
        "sheet": sheet_name,
        "loop": loop,
        "source": source,
        "frames": recs,
    }
    (dest / f"{clip_id}.json").write_text(json.dumps(man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"packed {clip_id}: {len(frames)} frames loop={loop} ← {source}")
    return dest


def find_src(name: str, src_dirs: list[Path]) -> Path | None:
    for d in src_dirs:
        cand = d / name
        if cand.is_file():
            return cand
    return None


def slice_clip_sheet(path: Path) -> list[Image.Image]:
    """One clip per file. Accept 512×640 or 480×480 cell grids."""
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if w % CELL_W == 0 and h % CELL_H == 0:
        cw, ch = CELL_W, CELL_H
    elif w % GUN_CELL == 0 and h % GUN_CELL == 0:
        cw, ch = GUN_CELL, GUN_CELL
    else:
        raise SystemExit(
            f"{path.name}: sheet is {w}×{h}, not a 512×640 or 480×480 grid."
        )
    cols, rows = w // cw, h // ch
    frames: list[Image.Image] = []
    for r in range(rows):
        for c in range(cols):
            cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            if cell.getbbox() is None:
                continue
            frames.append(cell)
    if not frames:
        raise SystemExit(f"{path.name}: no non-empty cells")
    return frames


def collect_src(src_dirs: list[Path]) -> Path:
    for d in src_dirs:
        if d.is_dir() and (any(d.glob("*.gif")) or any(d.glob("*_sheet.png"))):
            return d
    return src_dirs[0]


def main() -> None:
    ap = argparse.ArgumentParser(description="Pack wanderer test clips (512×640, foot 256,624)")
    ap.add_argument("--src", type=Path, default=DEFAULT_SRC)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--no-key-green", action="store_true")
    args = ap.parse_args()

    src_dirs = [args.src, *ATTACH_DIRS]
    src = collect_src(src_dirs)
    args.out.mkdir(parents=True, exist_ok=True)
    bank_src = args.out / "_src"
    bank_src.mkdir(parents=True, exist_ok=True)

    packed: dict[str, str] = {}
    key_green = not args.no_key_green
    search = [src, *src_dirs]

    for clip_id in CLIP_IDS:
        gif = find_src(f"{clip_id}.gif", search)
        if not gif:
            continue
        if gif.resolve() != (bank_src / gif.name).resolve():
            shutil.copy2(gif, bank_src / gif.name)
        frames, durs = load_gif(bank_src / gif.name)
        cleaned = [
            fit_to_bank(maybe_key(fr, key_green=key_green, key_white=False), f"{clip_id}.gif[{i}]")
            for i, fr in enumerate(frames)
        ]
        write_clip(
            args.out,
            clip_id,
            cleaned,
            durs,
            source=gif.name,
            loop=CLIP_META[clip_id]["loop"],
        )
        packed[clip_id] = gif.name

    for clip_id in CLIP_IDS:
        if clip_id in packed:
            continue
        sheet_name = f"{clip_id}_sheet.png"
        sheet_path = find_src(sheet_name, search)
        if not sheet_path:
            continue
        dest_sheet = bank_src / sheet_name
        if sheet_path.resolve() != dest_sheet.resolve():
            shutil.copy2(sheet_path, dest_sheet)
        frames = slice_clip_sheet(dest_sheet)
        cleaned = [
            fit_to_bank(maybe_key(fr, key_green=key_green, key_white=True), f"{sheet_name}[{i}]")
            for i, fr in enumerate(frames)
        ]
        durs = [80] * len(cleaned)
        write_clip(
            args.out,
            clip_id,
            cleaned,
            durs,
            source=sheet_name,
            loop=CLIP_META[clip_id]["loop"],
        )
        packed[clip_id] = sheet_name

    still = [c for c in CLIP_IDS if c not in packed]
    if still:
        names = " ".join(f"{c}.gif" for c in still)
        searched = ", ".join(str(d) for d in src_dirs)
        raise SystemExit(
            f"missing clips: {', '.join(still)}. Drop {names} into {DEFAULT_SRC} (searched {searched})."
        )

    index_path = args.out / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {}
    index["id"] = "wanderer_test_clips"
    index["bank"] = "test"
    index["note"] = (
        "Test-only seven clips. Does not replace data/ui/actor/wanderer. "
        "512×640 kept; 480×480 foot-mapped (240,480)→(256,624) paste (16,144)."
    )
    index["cell_w"] = CELL_W
    index["cell_h"] = CELL_H
    index["pivot"] = "bottom-center"
    index["foot_anchor"] = dict(FOOT)
    index["fit_480"] = {
        "src_cell": [GUN_CELL, GUN_CELL],
        "src_foot": [GUN_CELL // 2, GUN_CELL],
        "dst_cell": [CELL_W, CELL_H],
        "dst_foot": [FOOT["x"], FOOT["y"]],
        "paste": [FOOT["x"] - GUN_CELL // 2, FOOT["y"] - GUN_CELL],
        "scale": 1,
    }
    index["clips"] = [
        {
            "id": c["id"],
            "label": c["label"],
            "loop": c["loop"],
            "sheet": f"{c['id']}/{c['id']}_sheet.png",
            "manifest": f"{c['id']}/{c['id']}.json",
        }
        for c in CLIPS
    ]
    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"bank index → {index_path}")


if __name__ == "__main__":
    try:
        main()
    except ModuleNotFoundError as e:
        if e.name == "PIL":
            sys.stderr.write("Pillow required: pip install pillow\n")
            raise SystemExit(2) from e
        raise
