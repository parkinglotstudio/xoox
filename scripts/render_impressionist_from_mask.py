"""i21 마스크 → 인상주의 미니맵 v2 (붓터치·해안 블렌드·바위 입체).

출력: data/map_mask_tool/exports/i21_after_impression.png
"""
from __future__ import annotations

import base64
import io
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
MASK_PATH = ROOT / "data/map_mask_tool/masks/i21.mask.json"
OUT_DIR = ROOT / "data/map_mask_tool/exports"
OUT_PATH = OUT_DIR / "i21_after_impression.png"
OUT_V2 = OUT_DIR / "i21_after_impression_v2.png"

MASK_SIZE = 512
OUT = 1536
SCALE = OUT / MASK_SIZE
RNG = random.Random(77)


def decode_layer(data_url: str | None) -> Image.Image:
    im = Image.new("L", (MASK_SIZE, MASK_SIZE), 0)
    if not data_url or "," not in data_url:
        return im
    raw = base64.b64decode(data_url.split(",", 1)[1])
    src = Image.open(io.BytesIO(raw)).convert("RGBA")
    return src.split()[-1].resize((MASK_SIZE, MASK_SIZE), Image.Resampling.BILINEAR)


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))  # type: ignore[return-value]


def soft_mask(m: Image.Image, blur: float) -> Image.Image:
    return m.filter(ImageFilter.GaussianBlur(blur))


def upsample_mask(m: Image.Image, blur: float = 1.5) -> Image.Image:
    return soft_mask(m.resize((OUT, OUT), Image.Resampling.BILINEAR), blur)


def stroke(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    length: float,
    thickness: float,
    color: tuple[int, int, int],
    alpha: int,
    angle: float,
) -> None:
    """짧은 붓터치 (선분)."""
    dx = math.cos(angle) * length * 0.5
    dy = math.sin(angle) * length * 0.5
    a = max(30, min(255, alpha + RNG.randint(-25, 25)))
    draw.line(
        (x - dx, y - dy, x + dx, y + dy),
        fill=(*color, a),
        width=max(1, int(thickness)),
    )


def dab(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    r: float,
    color: tuple[int, int, int],
    alpha: int = 200,
) -> None:
    rx = r * (0.65 + RNG.random() * 0.7)
    ry = r * (0.5 + RNG.random() * 0.75)
    if RNG.random() < 0.5:
        rx, ry = ry, rx
    a = max(40, min(255, alpha + RNG.randint(-35, 25)))
    draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=(*color, a))


def paint_wash(base: Image.Image, mask_hi: Image.Image, color: tuple[int, int, int], opacity: int) -> None:
    """넓은 밑칠."""
    layer = Image.new("RGBA", (OUT, OUT), (*color, 0))
    alpha = mask_hi.point(lambda v: int(v * opacity / 255))
    layer.putalpha(alpha)
    base.alpha_composite(layer)


def paint_strokes(
    base: Image.Image,
    mask_hi: Image.Image,
    palette: list[str],
    count: int,
    length: tuple[float, float],
    thick: tuple[float, float],
    angle_bias: float | None = None,
    angle_jitter: float = 0.9,
    prefer_edge: bool = False,
) -> None:
    px = mask_hi.load()
    # 후보 좌표
    pts: list[tuple[int, int, int]] = []
    step = 2
    for y in range(0, OUT, step):
        for x in range(0, OUT, step):
            a = px[x, y]
            if a > 35:
                pts.append((x, y, a))
    if not pts:
        return
    layer = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    colors = [hex_rgb(c) for c in palette]
    for _ in range(count):
        x, y, a = pts[RNG.randrange(len(pts))]
        # 가장자리 선호
        if prefer_edge and a > 180 and RNG.random() < 0.55:
            continue
        if prefer_edge and a < 80 and RNG.random() < 0.3:
            pass
        x += RNG.uniform(-1.5, 1.5)
        y += RNG.uniform(-1.5, 1.5)
        c = colors[RNG.randrange(len(colors))]
        # 빛
        if RNG.random() < 0.2:
            c = mix(c, (255, 245, 220), 0.25)
        elif RNG.random() < 0.15:
            c = mix(c, (20, 30, 40), 0.3)
        ang = (angle_bias if angle_bias is not None else RNG.random() * math.tau) + (
            RNG.uniform(-angle_jitter, angle_jitter)
        )
        ln = length[0] + RNG.random() * (length[1] - length[0])
        th = thick[0] + RNG.random() * (thick[1] - thick[0])
        edge = a / 255.0
        al = int(70 + 150 * edge)
        if RNG.random() < 0.35:
            dab(draw, x, y, th * 1.2, c, al)
        else:
            stroke(draw, x, y, ln, th, c, al, ang)
    base.alpha_composite(layer)


def paint_sea(base: Image.Image, land_hi: Image.Image) -> None:
    # 전체 바다 밑
    sea_palette = ["#101c3a", "#14244a", "#1a2a6c", "#2d1b4e", "#0d3b66", "#243a6e", "#1e3a5f"]
    layer = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    colors = [hex_rgb(c) for c in sea_palette]
    for _ in range(90000):
        x = RNG.random() * OUT
        y = RNG.random() * OUT
        c = colors[RNG.randrange(len(colors))]
        ang = 0.15 + RNG.uniform(-0.4, 0.4)  # 거의 수평 물결
        stroke(draw, x, y, 4 + RNG.random() * 10, 1.2 + RNG.random() * 2.2, c, RNG.randint(100, 210), ang)
    # 빛기둥
    warm = [hex_rgb(c) for c in ("#ffcc80", "#ffe082", "#f8bbd0", "#fff59d", "#ffab91", "#b3e5fc")]
    for col_x in (OUT * 0.20, OUT * 0.55, OUT * 0.80):
        for y in range(0, OUT, 3):
            c = warm[(y // 3) % len(warm)]
            x = col_x + (RNG.random() - 0.5) * 55
            stroke(draw, x, y, 3 + RNG.random() * 6, 1.5, c, RNG.randint(25, 75), math.pi / 2 + RNG.uniform(-0.2, 0.2))
    base.alpha_composite(layer)

    # 해안 거품·청록 블렌드 (육지 가장자리 바깥)
    dil = land_hi.filter(ImageFilter.MaxFilter(21))
    coast = ImageChops.subtract(dil, land_hi).filter(ImageFilter.GaussianBlur(4))
    foam = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    fd = ImageDraw.Draw(foam, "RGBA")
    cp = coast.load()
    foam_pts = [(x, y, cp[x, y]) for y in range(0, OUT, 3) for x in range(0, OUT, 3) if cp[x, y] > 30]
    foam_cols = [hex_rgb(c) for c in ("#4fc3f7", "#81d4fa", "#b3e5fc", "#e0f7fa", "#26c6da", "#5c6bc0")]
    if foam_pts:
        for _ in range(min(22000, len(foam_pts) * 3)):
            x, y, a = foam_pts[RNG.randrange(len(foam_pts))]
            c = foam_cols[RNG.randrange(len(foam_cols))]
            stroke(
                fd,
                x + RNG.uniform(-2, 2),
                y + RNG.uniform(-2, 2),
                3 + RNG.random() * 7,
                1.2 + RNG.random() * 2,
                c,
                int(40 + a * 0.35),
                RNG.uniform(-0.5, 0.5),
            )
    base.alpha_composite(foam)


def paint_rocks(base: Image.Image, rock: Image.Image, land_hi: Image.Image) -> None:
    rock_hi = upsample_mask(rock, 0.8)
    # 해안 쪽만 강조: land 가장자리 근처
    edge = land_hi.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 20 else 0)
    edge = edge.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.GaussianBlur(3))
    px = rock_hi.load()
    ep = edge.load()
    pts: list[tuple[int, int, int, float]] = []
    for y in range(0, OUT, 1):
        for x in range(0, OUT, 1):
            a = px[x, y]
            if a < 40:
                continue
            coast_w = ep[x, y] / 255.0
            pts.append((x, y, a, coast_w))
    layer = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    shadow, mid, hi = hex_rgb("#2c241c"), hex_rgb("#5d4e37"), hex_rgb("#bcaaa4")
    for _ in range(min(28000, len(pts) * 3)):
        x, y, a, cw = pts[RNG.randrange(len(pts))]
        # 내륙 바위는 드물게
        if cw < 0.15 and RNG.random() < 0.85:
            continue
        r = 2.2 + RNG.random() * 4.5 * (0.6 + 0.4 * cw)
        # 덩어리: 그림자→중간→하이라이트
        dab(draw, x, y + r * 0.4, r * 1.15, shadow, int(180 + 40 * cw))
        dab(draw, x + RNG.uniform(-0.5, 0.5), y, r * 0.95, mid, 210)
        dab(draw, x - r * 0.3, y - r * 0.4, r * 0.55, hi, 200)
        if RNG.random() < 0.25:
            dab(draw, x + r * 0.5, y - r * 0.2, r * 0.35, mix(hi, (255, 255, 255), 0.2), 160)
    base.alpha_composite(layer)


def paint_flowers_extra(base: Image.Image, flower: Image.Image, land: Image.Image, forest: Image.Image) -> None:
    """마스크 꽃 + 들판에 추가 꽃송이."""
    flower_hi = upsample_mask(flower, 1.0)
    land_hi = upsample_mask(land, 1.2)
    forest_hi = upsample_mask(forest, 1.0)
    # 들판 ≈ land where forest is weak
    field = ImageChops.subtract(land_hi, forest_hi.point(lambda v: min(255, int(v * 1.4))))

    paint_wash(base, flower_hi, hex_rgb("#f8bbd0"), 55)
    paint_strokes(
        base,
        flower_hi,
        ["#f48fb1", "#fce4ec", "#ffe082", "#ce93d8", "#ff8a65", "#f06292", "#fff59d", "#e1bee7", "#ffcdd2"],
        count=45000,
        length=(2.5, 7),
        thick=(1.5, 3.5),
        angle_jitter=1.2,
    )
    # 들판에 흩뿌린 추가 꽃
    paint_strokes(
        base,
        field,
        ["#f48fb1", "#ffe082", "#ff8a65", "#ce93d8", "#fff59d", "#fce4ec"],
        count=18000,
        length=(2, 5),
        thick=(1.2, 2.8),
        angle_jitter=1.5,
    )


def main() -> None:
    doc = json.loads(MASK_PATH.read_text(encoding="utf-8"))
    layers = doc.get("layers", {})

    land = decode_layer(layers.get("land"))
    forest = decode_layer(layers.get("forest"))
    flower = decode_layer(layers.get("flower"))
    farm = decode_layer(layers.get("farm"))
    pond = decode_layer(layers.get("pond"))
    path = decode_layer(layers.get("path"))
    village = decode_layer(layers.get("village"))
    dock = decode_layer(layers.get("dock"))
    rock = decode_layer(layers.get("rock"))
    node = decode_layer(layers.get("node"))
    poi = decode_layer(layers.get("poi"))

    land_hi = upsample_mask(land, 2.0)
    forest_hi = upsample_mask(forest, 1.4)
    farm_hi = upsample_mask(farm, 0.9)
    pond_hi = upsample_mask(pond, 1.5)
    path_hi = upsample_mask(path, 0.7)
    village_hi = upsample_mask(village, 1.0)
    dock_hi = upsample_mask(dock, 1.2)

    canvas = Image.new("RGBA", (OUT, OUT), (10, 14, 32, 255))
    paint_sea(canvas, land_hi)

    # 육지 밑칠 → 붓터치
    paint_wash(canvas, land_hi, hex_rgb("#3d6b35"), 200)
    paint_strokes(
        canvas,
        land_hi,
        ["#2e6b32", "#3a7a3a", "#5a9a40", "#7cb342", "#c9a227", "#8bc34a", "#558b2f", "#9ccc65", "#aed581"],
        count=70000,
        length=(3, 9),
        thick=(1.5, 3.5),
        angle_bias=0.6,
        angle_jitter=0.8,
    )

    paint_wash(canvas, forest_hi, hex_rgb("#1b4332"), 160)
    paint_strokes(
        canvas,
        forest_hi,
        ["#0d3b1a", "#1b5e20", "#33691e", "#004d40", "#1b4332", "#2d6a4f", "#081c15"],
        count=55000,
        length=(3, 8),
        thick=(1.8, 4.0),
        angle_bias=-0.4,
        angle_jitter=0.7,
    )

    paint_flowers_extra(canvas, flower, land, forest)

    paint_wash(canvas, farm_hi, hex_rgb("#c9a227"), 90)
    paint_strokes(
        canvas,
        farm_hi,
        ["#c9a227", "#d4b84a", "#a1887f", "#bfa06a", "#e6c35c", "#8d6e63", "#fff176"],
        count=12000,
        length=(4, 11),
        thick=(1.5, 3.0),
        angle_bias=0.0,
        angle_jitter=0.25,  # 밭고랑 방향성
    )

    paint_wash(canvas, pond_hi, hex_rgb("#0277bd"), 120)
    paint_strokes(
        canvas,
        pond_hi,
        ["#0d47a1", "#1565c0", "#0277bd", "#4fc3f7", "#81d4fa", "#29b6f6", "#b3e5fc"],
        count=10000,
        length=(3, 8),
        thick=(1.5, 3.2),
        angle_bias=0.1,
        angle_jitter=0.5,
    )

    paint_strokes(
        canvas,
        path_hi,
        ["#d4a574", "#c49a6c", "#e8c9a0", "#b8956a", "#a1887f", "#ffe0b2"],
        count=18000,
        length=(4, 10),
        thick=(1.8, 3.5),
        angle_jitter=0.9,
    )

    paint_wash(canvas, village_hi, hex_rgb("#ef6c00"), 70)
    paint_strokes(
        canvas,
        village_hi,
        ["#c62828", "#ef6c00", "#d84315", "#ff8a65", "#efebe9", "#d7ccc8", "#bf360c"],
        count=16000,
        length=(2.5, 6),
        thick=(1.8, 3.8),
        angle_jitter=1.0,
    )

    # 부두 — 블록 느낌 줄이고 점묘/가로 붓
    paint_strokes(
        canvas,
        dock_hi,
        ["#01579b", "#0277bd", "#0288d1", "#4fc3f7", "#b3e5fc", "#81d4fa"],
        count=8000,
        length=(3, 8),
        thick=(1.5, 3.0),
        angle_bias=0.0,
        angle_jitter=0.35,
    )

    paint_rocks(canvas, rock, land_hi)

    # 노드/POI
    layer = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    for m, col, rad in (
        (node, hex_rgb("#e91e8c"), 7),
        (poi, hex_rgb("#ffee58"), 9),
    ):
        mh = upsample_mask(m, 0.5)
        mp = mh.load()
        for y in range(0, OUT, 2):
            for x in range(0, OUT, 2):
                if mp[x, y] < 120:
                    continue
                dab(draw, x, y, rad * (0.7 + RNG.random() * 0.5), col, 210)
                dab(draw, x, y, rad * 0.35, mix(col, (255, 255, 255), 0.5), 180)
    canvas.alpha_composite(layer)

    # 비네트 + 색
    vig = Image.new("L", (OUT, OUT), 0)
    ImageDraw.Draw(vig).ellipse((OUT * 0.04, OUT * 0.04, OUT * 0.96, OUT * 0.96), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(OUT * 0.07))
    overlay = Image.new("RGBA", (OUT, OUT), (12, 16, 36, 0))
    overlay.putalpha(vig.point(lambda v: int((255 - v) * 0.4)))
    canvas.alpha_composite(overlay)

    # 아주 약한 캔버스 질감
    grain = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain, "RGBA")
    for _ in range(40000):
        x, y = RNG.randrange(OUT), RNG.randrange(OUT)
        g = RNG.randint(180, 255)
        gd.point((x, y), fill=(g, g, g, RNG.randint(8, 22)))
    canvas.alpha_composite(grain)

    rgb = canvas.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.18)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.1)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.03)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rgb.save(OUT_PATH, format="PNG", optimize=True)
    rgb.save(OUT_V2, format="PNG", optimize=True)
    print(f"wrote {OUT_PATH} and {OUT_V2} ({OUT}x{OUT})")


if __name__ == "__main__":
    main()
