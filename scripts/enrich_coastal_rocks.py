"""섬 해안 테두리(바다와 맞닿는 링)에만 바위를 배치. 내륙 바위는 제거."""
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
random.seed(31)


def decode_layer(data_url: str | None) -> Image.Image:
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    if not data_url or "," not in data_url:
        return im
    raw = base64.b64decode(data_url.split(",", 1)[1])
    return Image.open(io.BytesIO(raw)).convert("RGBA").resize((SIZE, SIZE), Image.Resampling.NEAREST)


def encode_layer(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def alpha_bin(im: Image.Image, thr: int = 40) -> Image.Image:
    return im.split()[-1].point(lambda v: 255 if v > thr else 0)


def main() -> None:
    doc = json.loads(MASK_PATH.read_text(encoding="utf-8"))
    layers = doc.setdefault("layers", {})
    land_a = alpha_bin(decode_layer(layers.get("land")))
    dock_a = alpha_bin(decode_layer(layers.get("dock")), 20).filter(ImageFilter.MaxFilter(7))

    # 해안 밴드: 육지 바깥 팽창 − 육지 안쪽 침식 = 테두리(+바다 쪽 한 겹)
    dil = land_a.filter(ImageFilter.MaxFilter(17))  # 바다 쪽 ~8px
    ero = land_a.filter(ImageFilter.MinFilter(9))  # 육지 안쪽 깎기
    band = Image.new("L", (SIZE, SIZE), 0)
    dp, ep, lp, bp = dil.load(), ero.load(), land_a.load(), band.load()
    for y in range(SIZE):
        for x in range(SIZE):
            # dil 안이면서 깊은 내륙(ero)이 아닌 곳 = 해안 링
            if dp[x, y] and not ep[x, y]:
                bp[x, y] = 255

    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(out)
    dock_p = dock_a.load()

    # 테두리를 각도 순회로 균등 배치 (듬성듬성 구멍 줄임)
    cx = cy = SIZE // 2
    rim_pts: list[tuple[int, int]] = []
    for i in range(220):
        ang = (i / 220) * math.tau
        # 중심에서 바깥으로 쏘아 해안 밴드와 만나는 점
        hit = None
        for dist in range(40, SIZE // 2 - 4):
            x = int(cx + math.cos(ang) * dist)
            y = int(cy + math.sin(ang) * dist)
            if not (2 <= x < SIZE - 2 and 2 <= y < SIZE - 2):
                break
            if bp[x, y]:
                hit = (x, y)
                # 바다 쪽으로 한 걸음 더 — 테두리에 앉히기
                x2 = int(cx + math.cos(ang) * (dist + 3))
                y2 = int(cy + math.sin(ang) * (dist + 3))
                if 2 <= x2 < SIZE - 2 and 2 <= y2 < SIZE - 2 and bp[x2, y2]:
                    hit = (x2, y2)
        if hit is None:
            continue
        x, y = hit
        if dock_p[x, y]:
            continue
        rim_pts.append((x, y))

    # 밴드 위 추가 샘플 (굴곡진 해안용)
    extra = [(x, y) for y in range(0, SIZE, 3) for x in range(0, SIZE, 3) if bp[x, y] and not dock_p[x, y]]
    random.shuffle(extra)
    rim_pts.extend(extra[:80])

    kept: list[tuple[int, int]] = []
    placed = 0
    for x, y in rim_pts:
        if any((x - kx) ** 2 + (y - ky) ** 2 < 11**2 for kx, ky in kept):
            continue
        # 너무 내륙이면 스킵 (육지 깊숙이)
        if ep[x, y]:
            continue
        rad = random.randint(5, 12)
        ox = random.randint(-1, 1)
        oy = random.randint(-1, 1)
        # 납작한 타원 — 해안 바위
        draw.ellipse(
            (x - rad + ox, y - rad // 2 + oy, x + rad + ox, y + rad // 2 + oy),
            fill=(255, 255, 255, 255),
        )
        if random.random() < 0.5:
            sx = x + random.randint(-rad - 4, rad + 4)
            sy = y + random.randint(-rad // 2 - 2, rad // 2 + 2)
            if 2 <= sx < SIZE - 2 and 2 <= sy < SIZE - 2 and bp[sx, sy] and not dock_p[sx, sy]:
                sr = random.randint(3, 6)
                draw.ellipse((sx - sr, sy - sr // 2, sx + sr, sy + sr // 2), fill=(255, 255, 255, 255))
        kept.append((x, y))
        placed += 1
        if placed >= 160:
            break

    layers["rock"] = encode_layer(out)
    doc["note"] = (doc.get("note") or "") + " · 바위=해안 테두리"
    MASK_PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"coastal rocks~{placed} → {MASK_PATH}")


if __name__ == "__main__":
    main()
