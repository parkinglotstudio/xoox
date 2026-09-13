#!/usr/bin/env python3
"""Pack user4 wanderer GIFs into a test-only 512×640 bank.

Keeps the already-normalized canvas. Does not re-fit, re-center, or
overwrite data/ui/actor/wanderer production sheets.
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
ATTACH_SRC = Path("/workspace/cursor-work/artifacts/user4/v4")

CELL_W = 512
CELL_H = 640
FOOT = {"x": 256, "y": 624}
CLIP_IDS = ("a", "b", "c", "d")

# Optional fallback if a GIF is missing. Confirm before treating as final.
SHEET_ROWS = {
    "a_sheet.png": ("a", "b"),
    "b_sheet.png": ("c", "d"),
}


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
    """Knock out a studio chroma (GIF green / sheet white) without moving pixels."""
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


def require_cell(im: Image.Image, label: str) -> Image.Image:
    if im.size != (CELL_W, CELL_H):
        raise SystemExit(
            f"{label}: frame is {im.size[0]}×{im.size[1]}, expected {CELL_W}×{CELL_H}. "
            "Refusing to re-anchor or scale."
        )
    return im


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
        "loop": True,
        "source": source,
        "frames": recs,
    }
    (dest / f"{clip_id}.json").write_text(json.dumps(man, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"packed {clip_id}: {len(frames)} frames ← {source}")
    return dest


def slice_sheet(path: Path, row_ids: tuple[str, ...]) -> dict[str, list[Image.Image]]:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if w % CELL_W or h % CELL_H:
        raise SystemExit(
            f"{path.name}: sheet is {w}×{h}, not a {CELL_W}×{CELL_H} grid. Refusing to guess cell size."
        )
    cols, rows = w // CELL_W, h // CELL_H
    if rows != len(row_ids):
        raise SystemExit(
            f"{path.name}: {rows} rows, expected {len(row_ids)} ({', '.join(row_ids)}). Refusing to guess mapping."
        )
    out: dict[str, list[Image.Image]] = {}
    for r, clip_id in enumerate(row_ids):
        cells = []
        for c in range(cols):
            cells.append(im.crop((c * CELL_W, r * CELL_H, (c + 1) * CELL_W, (r + 1) * CELL_H)))
        out[clip_id] = cells
    return out


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
    ap.add_argument("--key-white", action="store_true", help="also key white-background sheets")
    args = ap.parse_args()

    src_dirs = [args.src, ATTACH_SRC]
    src = collect_src(src_dirs)
    args.out.mkdir(parents=True, exist_ok=True)
    bank_src = args.out / "_src"
    bank_src.mkdir(parents=True, exist_ok=True)

    packed: dict[str, str] = {}
    key_green = not args.no_key_green

    for clip_id in CLIP_IDS:
        gif = None
        for d in (src, *src_dirs):
            cand = d / f"{clip_id}.gif"
            if cand.is_file():
                gif = cand
                break
        if not gif:
            continue
        if gif.resolve() != (bank_src / gif.name).resolve():
            shutil.copy2(gif, bank_src / gif.name)
        frames, durs = load_gif(bank_src / gif.name)
        cleaned = []
        for i, fr in enumerate(frames):
            fr = maybe_key(fr, key_green=key_green, key_white=False)
            cleaned.append(require_cell(fr, f"{clip_id}.gif[{i}]"))
        write_clip(args.out, clip_id, cleaned, durs, source=gif.name)
        packed[clip_id] = gif.name

    missing = [c for c in CLIP_IDS if c not in packed]
    if missing:
        for sheet_name, row_ids in SHEET_ROWS.items():
            sheet_path = None
            for d in (src, *src_dirs):
                cand = d / sheet_name
                if cand.is_file():
                    sheet_path = cand
                    break
            if not sheet_path:
                continue
            dest_sheet = bank_src / sheet_name
            if sheet_path.resolve() != dest_sheet.resolve():
                shutil.copy2(sheet_path, dest_sheet)
            rows = slice_sheet(dest_sheet, row_ids)
            for clip_id, frames in rows.items():
                if clip_id in packed:
                    continue
                if clip_id not in missing:
                    continue
                cleaned = [
                    require_cell(
                        maybe_key(fr, key_green=key_green, key_white=args.key_white or True),
                        f"{sheet_name}:{clip_id}[{i}]",
                    )
                    for i, fr in enumerate(frames)
                ]
                durs = [80] * len(cleaned)
                write_clip(args.out, clip_id, cleaned, durs, source=f"{sheet_name} row {row_ids.index(clip_id)}")
                packed[clip_id] = sheet_name

    still = [c for c in CLIP_IDS if c not in packed]
    if still:
        searched = ", ".join(str(d) for d in src_dirs)
        raise SystemExit(
            "missing clips: "
            + ", ".join(still)
            + f". Drop a.gif/b.gif/c.gif/d.gif into {DEFAULT_SRC} (searched {searched})."
        )

    index_path = args.out / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {}
    index.setdefault("id", "wanderer_test_clips")
    index["bank"] = "test"
    index["cell_w"] = CELL_W
    index["cell_h"] = CELL_H
    index["pivot"] = "bottom-center"
    index["foot_anchor"] = dict(FOOT)
    index["clips"] = [
        {
            "id": cid,
            "label": cid.upper(),
            "hint": "letter id only — production slot not assigned",
            "sheet": f"{cid}/{cid}_sheet.png",
            "manifest": f"{cid}/{cid}.json",
        }
        for cid in CLIP_IDS
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
