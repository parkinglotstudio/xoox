"""Analyze user-saved island_master land/walk masks."""
from __future__ import annotations

import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data/map_mask_tool/master/island_master.mask.json"
PREV = ROOT / "data/map_mask_tool/master/island_master_user_analysis.png"


def decode(du: str | None, size: int) -> Image.Image:
    if not du or "," not in du:
        return Image.new("L", (size, size), 0)
    raw = base64.b64decode(du.split(",", 1)[1])
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    a = im.split()[-1]
    if a.size != (size, size):
        a = a.resize((size, size), Image.Resampling.NEAREST)
    return a.point(lambda v: 255 if v > 40 else 0)


def bbox(im: Image.Image) -> tuple[int, int, int, int] | None:
    px = im.load()
    w, h = im.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            if px[x, y]:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def main() -> None:
    doc = json.loads(SRC.read_text(encoding="utf-8"))
    size = int(doc.get("size") or 1536)
    cell = size // 3
    layers = doc.get("layers", {})
    print("sector", doc.get("sector_id"), "size", size)
    print("layers", sorted(layers.keys()))
    print("note", doc.get("note"))

    land = decode(layers.get("land"), size)
    walk = decode(layers.get("walk"), size)
    lp, wp = land.load(), walk.load()

    land_n = walk_n = walk_in = walk_out = 0
    for y in range(size):
        for x in range(size):
            if lp[x, y]:
                land_n += 1
            if wp[x, y]:
                walk_n += 1
                if lp[x, y]:
                    walk_in += 1
                else:
                    walk_out += 1

    total = size * size
    print(f"land px={land_n} ({100 * land_n / total:.1f}%)")
    print(f"walk px={walk_n} ({100 * walk_n / total:.1f}%)")
    print(f"walk inside land={walk_in}")
    print(f"walk outside land={walk_out} ({100 * walk_out / max(1, walk_n):.1f}% of walk)")
    print(f"walk covers land={100 * walk_in / max(1, land_n):.1f}%")
    print("land bbox", bbox(land))
    print("walk bbox", bbox(walk))

    ids = [
        ["i00", "i01", "i02"],
        ["i10", "i11", "i12"],
        ["i20", "i21", "i22"],
    ]
    walk_expect = {"i01", "i10", "i11", "i12", "i21"}
    print("--- per cell ---")
    for row in range(3):
        for col in range(3):
            sid = ids[row][col]
            x0, y0 = col * cell, row * cell
            ln = wn = win = 0
            for y in range(y0, y0 + cell):
                for x in range(x0, x0 + cell):
                    if lp[x, y]:
                        ln += 1
                    if wp[x, y]:
                        wn += 1
                        if lp[x, y]:
                            win += 1
            area = cell * cell
            flag = "WALK" if sid in walk_expect else "BLOCK"
            print(
                f"{sid} [{flag}] land={100 * ln / area:5.1f}% "
                f"walk={100 * wn / area:5.1f}% "
                f"walk_of_land={100 * win / max(1, ln):5.1f}%"
            )

    # preview
    out = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    out.paste(Image.new("RGBA", (size, size), (40, 90, 55, 255)), (0, 0), land)
    out.paste(Image.new("RGBA", (size, size), (45, 224, 208, 170)), (0, 0), walk)
    warn = Image.new("L", (size, size), 0)
    wr = warn.load()
    for y in range(size):
        for x in range(size):
            if wp[x, y] and not lp[x, y]:
                wr[x, y] = 255
    if walk_out:
        out.paste(Image.new("RGBA", (size, size), (255, 70, 70, 200)), (0, 0), warn)

    d = ImageDraw.Draw(out)
    for i in range(1, 3):
        d.line([(i * cell, 0), (i * cell, size)], fill=(45, 224, 208, 140), width=2)
        d.line([(0, i * cell), (size, i * cell)], fill=(45, 224, 208, 140), width=2)
    for row in range(3):
        for col in range(3):
            d.text((col * cell + 8, row * cell + 8), ids[row][col], fill=(220, 255, 250, 255))
    out.convert("RGB").save(PREV)
    print("preview", PREV)


if __name__ == "__main__":
    main()
