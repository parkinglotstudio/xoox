"""Punch black and save a bottom-centered square PNG, then copy to collection folders."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageChops

USER = Path(r"C:\수스이미지 생성") / "xoox_wanderer_20260822"
BACKUP = Path(r"C:\xoox\docs\art\sprites\wanderer") / "_gen_backup" / "2026-08-22"


def punch_black(im: Image.Image) -> Image.Image:
    try:
        import numpy as np

        arr = np.array(im)
        rgb = arr[:, :, :3].astype("int16")
        black = (rgb[:, :, 0] < 28) & (rgb[:, :, 1] < 28) & (rgb[:, :, 2] < 28)
        arr[black, 3] = 0
        return Image.fromarray(arr)
    except Exception:
        r, g, b, a = im.split()
        keep = Image.eval(r, lambda v: 255 if v >= 28 else 0)
        keep = ImageChops.multiply(keep, Image.eval(g, lambda v: 255 if v >= 28 else 0))
        keep = ImageChops.multiply(keep, Image.eval(b, lambda v: 255 if v >= 28 else 0))
        return Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, keep)))


def save_square(src: Path, dest: Path) -> Path:
    cut = punch_black(Image.open(src).convert("RGBA"))
    bbox = cut.getbbox()
    if not bbox:
        raise SystemExit(f"no opaque pixels: {src}")
    char = cut.crop(bbox)
    cell = max(char.size) + 32
    sheet = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    sheet.paste(char, ((cell - char.size[0]) // 2, cell - char.size[1] - 10), char)
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest)
    for root in (USER, BACKUP):
        root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(dest, root / dest.name)
        shutil.copy2(src, root / src.name)
    return dest


if __name__ == "__main__":
    import sys

    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    out = save_square(src, dest)
    print("saved", out)
