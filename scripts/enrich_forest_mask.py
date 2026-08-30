"""육지 위 숲 마스크를 넓게 보강. 길·마을·부두·노드는 피함."""
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
random.seed(42)


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


def main() -> None:
    doc = json.loads(MASK_PATH.read_text(encoding="utf-8"))
    layers = doc.setdefault("layers", {})
    land = a255(decode(layers.get("land")))
    path = a255(decode(layers.get("path")), 20).filter(ImageFilter.MaxFilter(5))
    village = a255(decode(layers.get("village")), 20).filter(ImageFilter.MaxFilter(7))
    dock = a255(decode(layers.get("dock")), 20).filter(ImageFilter.MaxFilter(7))
    forest = decode(layers.get("forest"))

    # 숲 가능 영역 = 육지 - (길|마을|부두) , 해안 안쪽으로 조금 안쪽만
    inland = land.filter(ImageFilter.MinFilter(7))
    lp, pp, vp, dp = inland.load(), path.load(), village.load(), dock.load()
    eligible = []
    for y in range(SIZE):
        for x in range(SIZE):
            if lp[x, y] == 0:
                continue
            if pp[x, y] or vp[x, y] or dp[x, y]:
                continue
            eligible.append((x, y))

    out = forest.copy()
    draw = ImageDraw.Draw(out)
    # 큰 덩어리 여러 개
    random.shuffle(eligible)
    kept: list[tuple[int, int, int]] = []
    for x, y in eligible:
        if len(kept) >= 28:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < (kr + 28) ** 2 for kx, ky, kr in kept):
            continue
        rad = random.randint(28, 55)
        # 불규칙 블롭 = 겹친 타원
        for _ in range(random.randint(3, 6)):
            ox = random.randint(-rad // 2, rad // 2)
            oy = random.randint(-rad // 2, rad // 2)
            rx = rad + random.randint(-8, 12)
            ry = int(rad * random.uniform(0.65, 1.1))
            draw.ellipse((x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry), fill=(255, 255, 255, 255))
        kept.append((x, y, rad))

    # 사이를 메우는 중형 패치
    random.shuffle(eligible)
    extra = 0
    for x, y in eligible:
        if extra >= 45:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < 22**2 for kx, ky, _ in kept):
            # 기존 숲 근처는 가산 패치 OK
            if random.random() > 0.35:
                continue
        if pp[x, y] or vp[x, y] or dp[x, y] or lp[x, y] == 0:
            continue
        rad = random.randint(14, 26)
        draw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))
        kept.append((x, y, rad))
        extra += 1

    # 길·마을에 침범한 부분 지우기
    fa = out.split()[-1]
    fpx = fa.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if fpx[x, y] == 0:
                continue
            if pp[x, y] or vp[x, y] or dp[x, y] or land.getpixel((x, y)) == 0:
                fpx[x, y] = 0
    out = Image.merge("RGBA", (fa, fa, fa, fa))

    layers["forest"] = encode(out)
    doc["note"] = (doc.get("note") or "") + " · 숲 광역 보강"
    MASK_PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"forest blobs~{len(kept)} → {MASK_PATH}")


if __name__ == "__main__":
    main()
