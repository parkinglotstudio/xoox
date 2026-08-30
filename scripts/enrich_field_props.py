"""들판에 꽃밭·밭·연못 레이어 초안 (꽃밭 비중 ↑)."""
from __future__ import annotations

import base64
import io
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MASK_PATH = ROOT / "data/map_mask_tool/masks/i21.mask.json"
SIZE = 512
random.seed(17)


def decode(data_url: str | None) -> Image.Image:
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    if not data_url or "," not in data_url:
        return im
    raw = base64.b64decode(data_url.split(",", 1)[1])
    return Image.open(io.BytesIO(raw)).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.NEAREST)


def encode(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def a255(im: Image.Image, thr: int = 40) -> Image.Image:
    return im.split()[-1].point(lambda v: 255 if v > thr else 0)


def solid(l: Image.Image) -> Image.Image:
    return Image.merge("RGBA", (l, l, l, l))


def main() -> None:
    doc = json.loads(MASK_PATH.read_text(encoding="utf-8"))
    layers = doc.setdefault("layers", {})
    land = a255(decode(layers.get("land")))
    forest = a255(decode(layers.get("forest")), 30)
    village = a255(decode(layers.get("village")), 30).filter(ImageFilter.MaxFilter(5))
    path = a255(decode(layers.get("path")), 20).filter(ImageFilter.MaxFilter(5))
    dock = a255(decode(layers.get("dock")), 20).filter(ImageFilter.MaxFilter(5))

    field = Image.new("L", (SIZE, SIZE), 0)
    fp = field.load()
    lp, fo, vp, pp, dp = land.load(), forest.load(), village.load(), path.load(), dock.load()
    field_pts: list[tuple[int, int]] = []
    for y in range(SIZE):
        for x in range(SIZE):
            if lp[x, y] and not fo[x, y] and not vp[x, y] and not pp[x, y] and not dp[x, y]:
                fp[x, y] = 255
                field_pts.append((x, y))

    flower = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    farm = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    pond = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    fd, ad, pd = ImageDraw.Draw(flower), ImageDraw.Draw(farm), ImageDraw.Draw(pond)

    cx = cy = SIZE // 2

    # 마을 주변 꽃밭 링 (두껍게)
    for _ in range(18):
        ang = random.random() * math.tau
        dist = random.randint(42, 95)
        x = int(cx + dist * math.cos(ang))
        y = int(cy + dist * math.sin(ang))
        rad = random.randint(18, 34)
        fd.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))

    # 들판 꽃밭 — 다수·큰 패치
    random.shuffle(field_pts)
    placed_f = 0
    kept: list[tuple[int, int]] = []
    for x, y in field_pts:
        if placed_f >= 42:
            break
        if abs(x - cx) + abs(y - cy) < 36:
            continue
        if any((x - kx) ** 2 + (y - ky) ** 2 < 28**2 for kx, ky in kept):
            continue
        if random.random() > 0.012:
            continue
        rad = random.randint(16, 36)
        fd.ellipse((x - rad, y - int(rad * 0.85), x + rad, y + int(rad * 0.85)), fill=(255, 255, 255, 255))
        # 옆에 작은 덩이 하나 더
        if random.random() < 0.55:
            ox = x + random.randint(-rad, rad)
            oy = y + random.randint(-rad, rad)
            sr = random.randint(10, 20)
            fd.ellipse((ox - sr, oy - sr, ox + sr, oy + sr), fill=(255, 255, 255, 255))
        kept.append((x, y))
        placed_f += 1

    # 밭 — 마을 옆 + 들판 (꽃보다 적게)
    for ox, oy, w, h in [
        (cx + 52, cy - 12, 58, 40),
        (cx - 95, cy + 18, 50, 34),
        (cx + 18, cy + 72, 62, 30),
        (cx - 40, cy - 88, 44, 28),
    ]:
        ad.rectangle((ox, oy, ox + w, oy + h), fill=(255, 255, 255, 255))
    random.shuffle(field_pts)
    placed_a = 0
    for x, y in field_pts:
        if placed_a >= 5:
            break
        if random.random() > 0.0012:
            continue
        w, h = random.randint(28, 48), random.randint(18, 30)
        ad.rectangle((x - w // 2, y - h // 2, x + w // 2, y + h // 2), fill=(255, 255, 255, 255))
        placed_a += 1

    # 연못 소수
    random.shuffle(field_pts)
    placed_p = 0
    for x, y in field_pts:
        if placed_p >= 3:
            break
        if random.random() > 0.0009:
            continue
        rad = random.randint(14, 24)
        pd.ellipse((x - rad, y - int(rad * 0.7), x + rad, y + int(rad * 0.7)), fill=(255, 255, 255, 255))
        placed_p += 1

    def clip_land_open(im: Image.Image, allow_near_village: bool) -> Image.Image:
        a = a255(im)
        ap = a.load()
        for y in range(SIZE):
            for x in range(SIZE):
                if not ap[x, y]:
                    continue
                if lp[x, y] == 0 or fo[x, y] or pp[x, y] or dp[x, y]:
                    ap[x, y] = 0
                elif vp[x, y] and not allow_near_village:
                    ap[x, y] = 0
        return solid(a)

    flower = clip_land_open(flower, allow_near_village=True)
    farm = clip_land_open(farm, allow_near_village=False)
    pond = clip_land_open(pond, allow_near_village=False)

    layers["flower"] = encode(flower)
    layers["farm"] = encode(farm)
    layers["pond"] = encode(pond)
    doc["note"] = "중앙 마을 + 숲/들판 + 꽃밭(넓게)·밭·연못"
    MASK_PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"flower patches~{placed_f} farm~{placed_a + 4} pond~{placed_p} → {MASK_PATH}")


if __name__ == "__main__":
    main()
