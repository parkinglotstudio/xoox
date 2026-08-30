"""
네온 기준작 → 맵 마스크 JSON (툴에서 다듬기용 초안)
기준: data/map_mask_tool/refs/soos_minimap_neon_black.png
출력: data/map_mask_tool/masks/i21.mask.json
"""
from __future__ import annotations

import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "data/map_mask_tool/refs/soos_minimap_neon_black.png"
OUT = ROOT / "data/map_mask_tool/masks/i21.mask.json"
SIZE = 512


def rgba_mask(size: int) -> Image.Image:
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def to_data_url(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def px(im: Image.Image, x: int, y: int):
    return im.getpixel((x, y))


def main() -> None:
    src = Image.open(REF).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    pxls = src.load()

    land = rgba_mask(SIZE)
    path = rgba_mask(SIZE)
    forest = rgba_mask(SIZE)
    village = rgba_mask(SIZE)
    dock = rgba_mask(SIZE)
    rock = rgba_mask(SIZE)
    node = rgba_mask(SIZE)
    poi = rgba_mask(SIZE)

    lp, pp, fp, vp, dp, rp, np_, op = (
        land.load(),
        path.load(),
        forest.load(),
        village.load(),
        dock.load(),
        rock.load(),
        node.load(),
        poi.load(),
    )

    for y in range(SIZE):
        for x in range(SIZE):
            r, g, b = pxls[x, y]
            # UI 영역(범례·좌표·스케일·나침반) 대략 제외
            if y < 70 and x < 160:
                continue
            if y < 40 and x > SIZE - 160:
                continue
            if y > SIZE - 55 and (x < 140 or x > SIZE - 90):
                continue

            bright = r + g + b
            if bright < 40:
                continue

            # 시안 길 / 부두
            cyan = g > 140 and b > 140 and r < 120 and g - r > 40 and b - r > 40
            # 라임/초록 숲·POI
            lime = g > 160 and g > r + 40 and g > b + 30
            # 호박 건물
            orange = r > 160 and g > 70 and g < 190 and b < 90 and r > b + 70
            # 마젠타/핑크 해안·바위·노드
            magenta = r > 120 and b > 120 and g < 120 and (r + b) > g * 2.2

            if cyan:
                # 남쪽 하단은 부두 후보
                if y > SIZE * 0.78 and abs(x - SIZE // 2) < SIZE * 0.22:
                    dp[x, y] = (255, 255, 255, 255)
                else:
                    pp[x, y] = (255, 255, 255, 255)
                lp[x, y] = (255, 255, 255, 180)
            elif orange:
                vp[x, y] = (255, 255, 255, 255)
                lp[x, y] = (255, 255, 255, 200)
            elif lime:
                # 아주 밝은 작은 점은 POI 쪽으로 (나중에 클러스터)
                if g > 220 and r > 100:
                    op[x, y] = (255, 255, 255, 255)
                else:
                    fp[x, y] = (255, 255, 255, 255)
                lp[x, y] = (255, 255, 255, 200)
            elif magenta:
                # 밝고 작은 교차 = 노드, 나머지는 바위/해안
                if r > 200 and b > 160 and g < 100:
                    np_[x, y] = (255, 255, 255, 255)
                else:
                    rp[x, y] = (255, 255, 255, 255)
                lp[x, y] = (255, 255, 255, 220)
            else:
                # 어두운 육지 채움(네온 맵 내부 어두운 녹흑)
                if 40 <= bright < 180 and (g >= r - 10 or b >= 30):
                    lp[x, y] = (255, 255, 255, 160)

    # 육지 구멍 메우기 + 살짝 블러 후 이진화
    land_l = land.split()[-1].filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    land_bin = ImageOps.autocontrast(land_l.point(lambda a: 255 if a > 40 else 0))
    land = Image.merge("RGBA", (land_bin, land_bin, land_bin, land_bin))

    # 레이어 살짝 두껍게 (브러시로 다듬기 쉽게)
    def thicken(im: Image.Image, k: int = 3) -> Image.Image:
        a = im.split()[-1].filter(ImageFilter.MaxFilter(k))
        return Image.merge("RGBA", (a, a, a, a))

    path = thicken(path, 3)
    forest = thicken(forest, 5)
    village = thicken(village, 5)
    dock = thicken(dock, 5)
    rock = thicken(rock, 3)

    # 노드/POI: 점 중심으로 디스크
    def blobs(im: Image.Image, radius: int) -> Image.Image:
        a = im.split()[-1]
        pts = []
        px_a = a.load()
        step = 4
        for y in range(0, SIZE, step):
            for x in range(0, SIZE, step):
                if px_a[x, y] > 80:
                    pts.append((x, y))
        out = rgba_mask(SIZE)
        dr = ImageDraw.Draw(out)
        # 클러스터 간소화
        kept = []
        for x, y in pts:
            if any((x - kx) ** 2 + (y - ky) ** 2 < (radius * 3) ** 2 for kx, ky in kept):
                continue
            kept.append((x, y))
            dr.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(255, 255, 255, 255))
        return out

    node = blobs(node, 5)
    poi = blobs(poi, 8)

    layers = {
        "land": to_data_url(land),
        "path": to_data_url(path),
        "forest": to_data_url(forest),
        "village": to_data_url(village),
        "dock": to_data_url(dock),
        "rock": to_data_url(rock),
        "node": to_data_url(node),
        "poi": to_data_url(poi),
    }

    doc = {
        "version": 1,
        "sector_id": "i21",
        "size": SIZE,
        "note": "네온 기준작에서 자동 추출한 초안. 툴에서 다듬기.",
        "layers": layers,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
