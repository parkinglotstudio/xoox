"""Punch black bg and save a bottom-centered square sprite."""
from pathlib import Path

from PIL import Image, ImageChops

SRC = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets\wanderer_idle_color_gun.png")
IDLE = Path(r"C:\xoox\data\ui\actor\wanderer\ingame_idle")


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


def main() -> None:
    cut = punch_black(Image.open(SRC).convert("RGBA"))
    bbox = cut.getbbox()
    if not bbox:
        raise SystemExit("no opaque pixels")
    char = cut.crop(bbox)
    cell = max(char.size) + 32
    sheet = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    sheet.paste(char, ((cell - char.size[0]) // 2, cell - char.size[1] - 10), char)
    IDLE.mkdir(parents=True, exist_ok=True)
    sheet.save(IDLE / "ingame_idle_gun.png")
    sheet.save(IDLE / "ingame_idle_sheet.png")
    print("saved", sheet.size)


if __name__ == "__main__":
    main()
