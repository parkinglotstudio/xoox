"""i21 마스크 구도 리셋 — UI/네온 목업 실루엣 완전 폐기.

네온 refs/soos_minimap_neon_black.png 는 톤·선 언어만 참고.
레이아웃은 여기서 새로 그린 깨끗한 섬만 사용.

출력: data/map_mask_tool/masks/i21.mask.json
"""
from __future__ import annotations

import base64
import io
import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/map_mask_tool/masks/i21.mask.json"
SIZE = 512
CX = CY = SIZE // 2
RNG = random.Random(20260822)


def encode(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def solid(l: Image.Image) -> Image.Image:
    return Image.merge("RGBA", (l, l, l, l))


def blank() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def alpha(im: Image.Image, thr: int = 40) -> Image.Image:
    return im.split()[-1].point(lambda v: 255 if v > thr else 0)


def make_land() -> Image.Image:
    """유기적 단일 섬 — UI·범례·장식 섬 없음."""
    land = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(land)
    # 본체 + 돌출부 (남쪽 부두용 반도)
    blobs = [
        (CX, CY - 8, 168, 148),
        (CX - 70, CY + 40, 90, 78),
        (CX + 85, CY - 50, 72, 88),
        (CX + 40, CY + 95, 70, 55),
        (CX - 100, CY - 70, 65, 70),
        (CX, CY + 130, 48, 42),  # 남쪽 반도
    ]
    for x, y, rx, ry in blobs:
        d.ellipse((x - rx, y - ry, x + rx, y + ry), fill=255)
    # 해안 들쭉날쭉
    for _ in range(28):
        ang = RNG.random() * math.tau
        dist = RNG.uniform(110, 175)
        x = int(CX + math.cos(ang) * dist)
        y = int(CY + math.sin(ang) * dist * 0.92)
        r = RNG.randint(18, 42)
        if RNG.random() < 0.55:
            d.ellipse((x - r, y - r, x + r, y + r), fill=255)
        else:
            d.ellipse((x - r, y - r, x + r, y + r), fill=0)
    land = land.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    land = land.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 100 else 0)
    # 가장자리 여백 확보 (UI가 들어갈 자리 자체를 안 씀)
    margin = 28
    m = land.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if x < margin or y < margin or x >= SIZE - margin or y >= SIZE - margin:
                m[x, y] = 0
    return land


def make_village(land: Image.Image) -> Image.Image:
    v = blank()
    d = ImageDraw.Draw(v)
    d.ellipse((CX - 32, CY - 32, CX + 32, CY + 32), fill=(255, 255, 255, 255))
    for _ in range(14):
        ox, oy = RNG.randint(-34, 34), RNG.randint(-34, 34)
        if ox * ox + oy * oy > 38 * 38:
            continue
        s = RNG.randint(5, 12)
        d.rectangle((CX + ox - s, CY + oy - s, CX + ox + s, CY + oy + s), fill=(255, 255, 255, 255))
    return clip(v, land)


def make_dock(land: Image.Image) -> Image.Image:
    """남쪽 반도에서 바다로 뻗는 부두."""
    dock = blank()
    d = ImageDraw.Draw(dock)
    # 육지 남단 찾기
    lp = land.load()
    south = None
    for y in range(SIZE - 1, 40, -1):
        for x in range(CX - 40, CX + 40):
            if lp[x, y]:
                south = (x, y)
                break
        if south:
            break
    if not south:
        south = (CX, CY + 150)
    sx, sy = south
    # 세로 부두 + 가로 끝
    d.rectangle((sx - 7, sy - 8, sx + 7, sy + 38), fill=(255, 255, 255, 255))
    d.rectangle((sx - 22, sy + 28, sx + 22, sy + 42), fill=(255, 255, 255, 255))
    return dock


def make_paths(land: Image.Image, village: Image.Image) -> tuple[Image.Image, list[tuple[int, int]]]:
    path = blank()
    d = ImageDraw.Draw(path)
    # POI 후보 (들판 쪽)
    pois = [
        (CX - 95, CY - 90),
        (CX + 110, CY - 70),
        (CX + 70, CY + 100),
        (CX - 80, CY + 85),
    ]
    lp = land.load()
    pois = [(x, y) for x, y in pois if 0 <= x < SIZE and 0 <= y < SIZE and lp[x, y]]
    # 중앙 → 각 POI
    for px, py in pois:
        d.line([(CX, CY), (px, py)], fill=(255, 255, 255, 255), width=5)
    # 링 길 (마을 바깥)
    d.ellipse((CX - 55, CY - 55, CX + 55, CY + 55), outline=(255, 255, 255, 255), width=4)
    # 남쪽 부두로
    d.line([(CX, CY + 30), (CX, CY + 145)], fill=(255, 255, 255, 255), width=5)
    path_l = alpha(path).filter(ImageFilter.MaxFilter(3))
    # 육지 안만
    out = Image.new("L", (SIZE, SIZE), 0)
    pp, op = path_l.load(), out.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if pp[x, y] and lp[x, y]:
                op[x, y] = 255
    return solid(out), pois


def make_forest(land: Image.Image, village: Image.Image, path: Image.Image, dock: Image.Image) -> Image.Image:
    forest = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(forest)
    # 외곽 숲 덩이
    patches = [
        (CX - 110, CY - 40, 70),
        (CX + 100, CY + 20, 75),
        (CX - 40, CY + 110, 55),
        (CX + 30, CY - 120, 60),
        (CX - 130, CY + 50, 50),
        (CX + 130, CY - 90, 48),
        (CX - 20, CY - 140, 45),
    ]
    for x, y, r in patches:
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
        for _ in range(5):
            ox, oy = RNG.randint(-r, r), RNG.randint(-r, r)
            sr = RNG.randint(r // 3, r // 2)
            d.ellipse((x + ox - sr, y + oy - sr, x + ox + sr, y + oy + sr), fill=255)
    forest = forest.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2))
    forest = forest.point(lambda v: 255 if v > 80 else 0)
    # 마을·길·부두·중앙 들판 비우기
    vp = alpha(village, 20).filter(ImageFilter.MaxFilter(25)).load()
    pp = alpha(path, 20).filter(ImageFilter.MaxFilter(9)).load()
    dp = alpha(dock, 20).filter(ImageFilter.MaxFilter(11)).load()
    lp = land.load()
    fp = forest.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if not lp[x, y] or vp[x, y] or pp[x, y] or dp[x, y]:
                fp[x, y] = 0
            # 중앙 들판 반경
            if (x - CX) ** 2 + (y - CY) ** 2 < 78**2:
                fp[x, y] = 0
    return solid(forest)


def make_flowers_farm_pond(
    land: Image.Image, forest: Image.Image, village: Image.Image, path: Image.Image, dock: Image.Image
) -> tuple[Image.Image, Image.Image, Image.Image]:
    lp, fo, vp, pp, dp = (
        land.load(),
        alpha(forest).load(),
        alpha(village, 20).filter(ImageFilter.MaxFilter(5)).load(),
        alpha(path, 20).filter(ImageFilter.MaxFilter(5)).load(),
        alpha(dock, 20).filter(ImageFilter.MaxFilter(5)).load(),
    )
    field_pts: list[tuple[int, int]] = []
    for y in range(SIZE):
        for x in range(SIZE):
            if lp[x, y] and not fo[x, y] and not vp[x, y] and not pp[x, y] and not dp[x, y]:
                field_pts.append((x, y))

    flower, farm, pond = blank(), blank(), blank()
    fd, ad, pd = ImageDraw.Draw(flower), ImageDraw.Draw(farm), ImageDraw.Draw(pond)

    # 마을 링 꽃밭
    for _ in range(16):
        ang = RNG.random() * math.tau
        dist = RNG.randint(48, 88)
        x = int(CX + math.cos(ang) * dist)
        y = int(CY + math.sin(ang) * dist)
        rad = RNG.randint(16, 30)
        fd.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))

    RNG.shuffle(field_pts)
    kept: list[tuple[int, int]] = []
    for x, y in field_pts:
        if len(kept) >= 36:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < 26**2 for kx, ky in kept):
            continue
        if RNG.random() > 0.04:
            continue
        rad = RNG.randint(14, 32)
        fd.ellipse((x - rad, y - int(rad * 0.85), x + rad, y + int(rad * 0.85)), fill=(255, 255, 255, 255))
        kept.append((x, y))

    for ox, oy, w, h in [
        (CX + 48, CY - 8, 52, 36),
        (CX - 88, CY + 16, 46, 30),
        (CX + 10, CY + 68, 56, 28),
    ]:
        ad.rectangle((ox, oy, ox + w, oy + h), fill=(255, 255, 255, 255))

    for x, y in field_pts[::80][:3]:
        rad = RNG.randint(12, 20)
        pd.ellipse((x - rad, y - int(rad * 0.7), x + rad, y + int(rad * 0.7)), fill=(255, 255, 255, 255))

    def clip_open(im: Image.Image, allow_village: bool) -> Image.Image:
        a = alpha(im)
        ap = a.load()
        for y in range(SIZE):
            for x in range(SIZE):
                if not ap[x, y]:
                    continue
                if not lp[x, y] or fo[x, y] or pp[x, y] or dp[x, y]:
                    ap[x, y] = 0
                elif vp[x, y] and not allow_village:
                    ap[x, y] = 0
        return solid(a)

    return clip_open(flower, True), clip_open(farm, False), clip_open(pond, False)


def make_coastal_rocks(land: Image.Image, dock: Image.Image) -> Image.Image:
    land_a = land if land.mode == "L" else alpha(land)
    dil = land_a.filter(ImageFilter.MaxFilter(15))
    ero = land_a.filter(ImageFilter.MinFilter(9))
    band = Image.new("L", (SIZE, SIZE), 0)
    dp, ep, bp = dil.load(), ero.load(), band.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if dp[x, y] and not ep[x, y]:
                bp[x, y] = 255
    dock_a = alpha(dock, 20).filter(ImageFilter.MaxFilter(9))
    dk = dock_a.load()
    rock = blank()
    d = ImageDraw.Draw(rock)
    kept: list[tuple[int, int]] = []
    # 각도 균등
    for i in range(200):
        ang = (i / 200) * math.tau
        hit = None
        for dist in range(60, SIZE // 2 - 8):
            x = int(CX + math.cos(ang) * dist)
            y = int(CY + math.sin(ang) * dist * 0.95)
            if not (4 <= x < SIZE - 4 and 4 <= y < SIZE - 4):
                break
            if bp[x, y]:
                hit = (x, y)
        if not hit or dk[hit[0], hit[1]]:
            continue
        x, y = hit
        if any((x - kx) ** 2 + (y - ky) ** 2 < 12**2 for kx, ky in kept):
            continue
        rad = RNG.randint(5, 11)
        d.ellipse((x - rad, y - rad // 2, x + rad, y + rad // 2), fill=(255, 255, 255, 255))
        kept.append((x, y))
    return rock


def make_nodes_pois(path: Image.Image, pois: list[tuple[int, int]]) -> tuple[Image.Image, Image.Image]:
    node, poi = blank(), blank()
    nd, pd = ImageDraw.Draw(node), ImageDraw.Draw(poi)
    # POI
    for x, y in pois:
        pd.ellipse((x - 6, y - 6, x + 6, y + 6), fill=(255, 255, 255, 255))
    # 중앙도 POI
    pd.ellipse((CX - 7, CY - 7, CX + 7, CY + 7), fill=(255, 255, 255, 255))
    # 길에 노드
    pp = alpha(path).load()
    pts = [(x, y) for y in range(0, SIZE, 4) for x in range(0, SIZE, 4) if pp[x, y]]
    RNG.shuffle(pts)
    kept: list[tuple[int, int]] = []
    for x, y in pts:
        if len(kept) >= 18:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < 28**2 for kx, ky in kept):
            continue
        if (x - CX) ** 2 + (y - CY) ** 2 < 40**2:
            continue
        nd.polygon([(x, y - 5), (x + 5, y), (x, y + 5), (x - 5, y)], fill=(255, 255, 255, 255))
        kept.append((x, y))
    return node, poi


def clip(im: Image.Image, land: Image.Image) -> Image.Image:
    a = alpha(im)
    lp = land.load() if land.mode == "L" else alpha(land).load()
    ap = a.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if ap[x, y] and not lp[x, y]:
                ap[x, y] = 0
    return solid(a)


def main() -> None:
    land_l = make_land()
    land = solid(land_l)
    village = make_village(land_l)
    dock = make_dock(land_l)
    path, pois = make_paths(land_l, village)
    forest = make_forest(land_l, village, path, dock)
    flower, farm, pond = make_flowers_farm_pond(land_l, forest, village, path, dock)
    rock = make_coastal_rocks(land_l, dock)
    node, poi = make_nodes_pois(path, pois)

    doc = {
        "version": 1,
        "sector_id": "i21",
        "size": SIZE,
        "note": "구도 리셋 v1 — 네온 목업 실루엣/UI 폐기. 깨끗한 단일 섬. 네온 refs는 톤만.",
        "layers": {
            "land": encode(land),
            "path": encode(path),
            "forest": encode(forest),
            "flower": encode(flower),
            "farm": encode(farm),
            "pond": encode(pond),
            "village": encode(village),
            "dock": encode(dock),
            "rock": encode(rock),
            "node": encode(node),
            "poi": encode(poi),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"clean mask → {OUT}")


if __name__ == "__main__":
    main()
