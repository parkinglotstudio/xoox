#!/usr/bin/env python3
"""Build lobby bobble idle from a locked master (body fixed, head L/R).

Fixes vs v1:
- Chroma-key mint/solid BG → true alpha (master was fully opaque)
- Soft circular head mask (not a hard rectangle slice)
- Pivot at neck; body layer never rotates

Usage:
  python3 scripts/sprite_tool/bobble_idle_from_master.py \\
    --master docs/art/sprites/hyanga/_ref/hyanga_lobby_idle_master.png \\
    --out-dir docs/art/sprites/hyanga/lobby/idle/frames \\
    --prefix hyanga_lobby_idle
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def chroma_key(im: Image.Image, key_rgb: tuple[int, int, int], tol: int = 28) -> Image.Image:
    """Make near-key background transparent. Works on opaque mint masters."""
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    kr, kg, kb = key_rgb
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - kr) <= tol and abs(g - kg) <= tol and abs(b - kb) <= tol:
                px[x, y] = (r, g, b, 0)
    return im


def sample_corner_key(im: Image.Image) -> tuple[int, int, int]:
    im = im.convert("RGBA")
    samples = [
        im.getpixel((2, 2))[:3],
        im.getpixel((im.width - 3, 2))[:3],
        im.getpixel((2, im.height - 3))[:3],
        im.getpixel((im.width - 3, im.height - 3))[:3],
    ]
    # average
    r = sum(s[0] for s in samples) // 4
    g = sum(s[1] for s in samples) // 4
    b = sum(s[2] for s in samples) // 4
    return (r, g, b)


def alpha_bbox(im: Image.Image) -> tuple[int, int, int, int]:
    return im.split()[-1].getbbox() or (0, 0, im.width, im.height)


def make_head_mask(size: tuple[int, int], head_ratio: float) -> Image.Image:
    """Soft ellipse covering upper head region (not a hard rect)."""
    w, h = size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    head_h = int(h * head_ratio)
    # ellipse centered on upper body — covers head+hair, fades toward neck
    cx, cy = w // 2, int(head_h * 0.52)
    rx, ry = int(w * 0.48), int(head_h * 0.58)
    bbox = [cx - rx, cy - ry, cx + rx, cy + ry]
    draw.ellipse(bbox, fill=255)
    # soften edge so neck seam is less harsh
    mask = mask.filter(ImageFilter.GaussianBlur(radius=max(2, w // 80)))
    return mask


def build_frames(
    master: Image.Image,
    angles: list[float],
    head_ratio: float,
    pivot_y_ratio: float,
    key_tol: int,
) -> list[Image.Image]:
    key = sample_corner_key(master)
    cut = chroma_key(master, key, tol=key_tol)
    left, top, right, bottom = alpha_bbox(cut)
    char = cut.crop((left, top, right, bottom))
    cw, ch = char.size

    head_mask = make_head_mask((cw, ch), head_ratio)
    # body = everything outside head mask
    inv = Image.eval(head_mask, lambda v: 255 - v)
    body = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    body.paste(char, (0, 0), inv)
    head = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    head.paste(char, (0, 0), head_mask)

    pivot = (cw // 2, int(ch * head_ratio * pivot_y_ratio))

    frames: list[Image.Image] = []
    for ang in angles:
        canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
        canvas.paste(body, (0, 0), body)
        rotated = head.rotate(ang, resample=Image.Resampling.BICUBIC, center=pivot, expand=False)
        canvas.alpha_composite(rotated)

        # restore soft mint preview BG for lobby readability (optional bake)
        full = Image.new("RGBA", master.size, (0, 0, 0, 0))
        full.paste(canvas, (left, top), canvas)
        frames.append(full)
    return frames


def bake_mint_bg(im: Image.Image, rgb: tuple[int, int, int] = (230, 241, 224)) -> Image.Image:
    bg = Image.new("RGBA", im.size, (*rgb, 255))
    return Image.alpha_composite(bg, im.convert("RGBA"))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", type=Path, required=True)
    ap.add_argument("--out-dir", type=Path, required=True)
    ap.add_argument("--prefix", type=str, required=True)
    ap.add_argument("--angles", type=str, default="0,-4,-7,0,4,7")
    ap.add_argument("--head-ratio", type=float, default=0.72)
    ap.add_argument("--pivot-y-ratio", type=float, default=0.92)
    ap.add_argument("--key-tol", type=int, default=32)
    ap.add_argument("--bake-bg", action="store_true", default=True)
    ap.add_argument("--no-bake-bg", action="store_true")
    args = ap.parse_args()

    angles = [float(x.strip()) for x in args.angles.split(",") if x.strip()]
    master = Image.open(args.master)
    frames = build_frames(master, angles, args.head_ratio, args.pivot_y_ratio, args.key_tol)

    bake = args.bake_bg and not args.no_bake_bg
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for i, fr in enumerate(frames):
        out = bake_mint_bg(fr) if bake else fr
        path = args.out_dir / f"{args.prefix}_f{i}.png"
        out.save(path)
        print("wrote", path)
    print(f"done {len(frames)} frames | angles={angles} | body locked via soft head mask")


if __name__ == "__main__":
    main()
