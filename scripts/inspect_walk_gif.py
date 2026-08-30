"""Inspect 걷기.gif frame count and save raw frames."""
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")
src = Path(r"C:\Users\dmaxd\Downloads\걷기.gif")
out = Path(r"C:\xoox\docs\art\sprites\wanderer\ingame\move\gif_raw")
out.mkdir(parents=True, exist_ok=True)
im = Image.open(src)
print("size", im.size, "n_frames", getattr(im, "n_frames", 1), "duration", im.info.get("duration"))
n = getattr(im, "n_frames", 1)
for i in range(n):
    im.seek(i)
    frame = im.convert("RGBA")
    frame.save(out / f"raw_{i:03d}.png")
print("wrote", n, "to", out)
