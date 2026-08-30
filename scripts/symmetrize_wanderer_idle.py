"""Force a perfectly centered rear idle by mirroring one half."""
from pathlib import Path

from PIL import Image, ImageChops

SRC = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets\wanderer_ingame_idle_ortho.png")
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
    # level the feet before mirroring
    w, h = char.size
    px = char.load()
    def foot_y(x0: int, x1: int) -> int:
        y_hit = 0
        for y in range(h - 1, -1, -1):
            for x in range(x0, x1):
                if px[x, y][3] > 40:
                    return y
        return h - 1
    yl = foot_y(int(w * 0.18), int(w * 0.40))
    yr = foot_y(int(w * 0.60), int(w * 0.82))
    dx = max(1, int(w * 0.42))
    angle = -__import__("math").degrees(__import__("math").atan2(yr - yl, dx))
    if abs(angle) > 0.15:
        char = char.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
        char = punch_black(char.convert("RGBA"))
        box = char.getbbox()
        if box:
            char = char.crop(box)
    cw, ch = char.size
    half = (cw + 1) // 2
    left = char.crop((0, 0, half, ch))
    right = left.transpose(Image.FLIP_LEFT_RIGHT)
    out = Image.new("RGBA", (left.size[0] * 2, ch), (0, 0, 0, 0))
    out.paste(left, (0, 0), left)
    out.paste(right, (left.size[0], 0), right)
    cell = max(out.size) + 32
    sheet = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    sheet.paste(out, ((cell - out.size[0]) // 2, cell - out.size[1] - 10), out)
    IDLE.mkdir(parents=True, exist_ok=True)
    sheet.save(IDLE / "ingame_idle_sheet.png")
    sheet.save(IDLE / "ingame_idle_back.png")
    print("saved", sheet.size, "deskew_deg", round(angle, 2))


if __name__ == "__main__":
    main()
