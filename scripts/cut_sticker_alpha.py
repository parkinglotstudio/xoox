"""Punch sticker backgrounds to alpha and crop to opaque bounds."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\xoox\data\art\props\sticker")


def dist(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def punch(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    samples = [
        px[2, 2][:3],
        px[w - 3, 2][:3],
        px[2, h - 3][:3],
        px[w - 3, h - 3][:3],
        px[w // 2, 2][:3],
    ]
    sky = tuple(sum(c[i] for c in samples) // len(samples) for i in range(3))
    thresh = 38
    stack = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    seen = set(stack)
    while stack:
        x, y = stack.pop()
        r, g, b, a = px[x, y]
        if dist((r, g, b), sky) > thresh:
            continue
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                seen.add((nx, ny))
                stack.append((nx, ny))
    bbox = im.getbbox()
    if bbox:
        pad = 8
        x0 = max(0, bbox[0] - pad)
        y0 = max(0, bbox[1] - pad)
        x1 = min(w, bbox[2] + pad)
        y1 = min(h, bbox[3] + pad)
        im = im.crop((x0, y0, x1, y1))
    im.save(path)
    print(f"{path.name} {im.size}")


def main() -> None:
    for p in sorted(ROOT.glob("prop_sticker_*.png")):
        punch(p)


if __name__ == "__main__":
    main()
