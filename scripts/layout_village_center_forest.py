"""마을=중앙 1곳, 나머지 육지는 숲+들판(열린 육지)."""
from __future__ import annotations

import base64
import io
import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MASK_PATH = ROOT / "data/map_mask_tool/masks/i21.mask.json"
SIZE = 512
random.seed(7)


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


def solid_from_l(l: Image.Image) -> Image.Image:
    return Image.merge("RGBA", (l, l, l, l))


def main() -> None:
    doc = json.loads(MASK_PATH.read_text(encoding="utf-8"))
    layers = doc.setdefault("layers", {})
    land = a255(decode(layers.get("land")))
    path = a255(decode(layers.get("path")), 20).filter(ImageFilter.MaxFilter(5))
    dock = a255(decode(layers.get("dock")), 20).filter(ImageFilter.MaxFilter(7))
    inland = land.filter(ImageFilter.MinFilter(5))

    # --- 마을: 중앙 한 곳만 ---
    village = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    vd = ImageDraw.Draw(village)
    cx = cy = SIZE // 2
    # 중앙 클러스터 (네온 맵의 원형 광장 느낌)
    vd.ellipse((cx - 36, cy - 36, cx + 36, cy + 36), fill=(255, 255, 255, 255))
    for _ in range(12):
        ox = random.randint(-40, 40)
        oy = random.randint(-40, 40)
        if ox * ox + oy * oy > 42 * 42:
            continue
        s = random.randint(6, 14)
        vd.rectangle((cx + ox - s, cy + oy - s, cx + ox + s, cy + oy + s), fill=(255, 255, 255, 255))
    village_a = a255(village).filter(ImageFilter.MaxFilter(3))
    village = solid_from_l(village_a)

    # --- 숲: 육지 대부분, 들판 구멍 + 마을/길/부두 제외 ---
    forest = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    fd = ImageDraw.Draw(forest)
    lp, pp, dp, vp = inland.load(), path.load(), dock.load(), village_a.load()

    # 먼저 육지 전체에 큰 숲 베이스
    eligible = [(x, y) for y in range(SIZE) for x in range(SIZE) if lp[x, y] and not pp[x, y] and not dp[x, y] and not vp[x, y]]
    random.shuffle(eligible)
    kept: list[tuple[int, int, int]] = []
    for x, y in eligible:
        if len(kept) >= 40:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < (kr + 20) ** 2 for kx, ky, kr in kept):
            continue
        rad = random.randint(32, 70)
        for _ in range(random.randint(4, 7)):
            ox = random.randint(-rad // 2, rad // 2)
            oy = random.randint(-rad // 2, rad // 2)
            rx = rad + random.randint(-10, 14)
            ry = int(rad * random.uniform(0.7, 1.15))
            fd.ellipse((x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry), fill=(255, 255, 255, 255))
        kept.append((x, y, rad))

    # 메움 패치
    random.shuffle(eligible)
    for x, y in eligible[:8000]:
        if random.random() > 0.04:
            continue
        if pp[x, y] or dp[x, y] or vp[x, y] or lp[x, y] == 0:
            continue
        rad = random.randint(10, 24)
        fd.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))

    fa = a255(forest)
    fpx = fa.load()
    # 들판: 마을 주변 링 + 랜덤 클리어링
    clearings: list[tuple[int, int, int]] = [(cx, cy, 55)]
    for _ in range(10):
        x, y = random.choice(eligible)
        clearings.append((x, y, random.randint(22, 40)))

    for y in range(SIZE):
        for x in range(SIZE):
            if fpx[x, y] == 0:
                continue
            if pp[x, y] or dp[x, y] or vp[x, y] or land.getpixel((x, y)) == 0:
                fpx[x, y] = 0
                continue
            for kx, ky, kr in clearings:
                if (x - kx) ** 2 + (y - ky) ** 2 < kr * kr:
                    fpx[x, y] = 0
                    break

    forest = solid_from_l(fa)
    layers["village"] = encode(village)
    layers["forest"] = encode(forest)
    doc["note"] = "마을 중앙 1곳 · 나머지 숲+들판(클리어링)"
    MASK_PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"updated village+forest → {MASK_PATH}")


if __name__ == "__main__":
    main()
