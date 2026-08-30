"""네온 기준작 실루엣 → 섬 마스터 (오염/외곽 톤 = soos_minimap_neon_black).

기준: data/map_mask_tool/refs/soos_minimap_neon_black.png
      (또는 C:\\수스이미지 생성\\soos_minimap_neon_black.png)

- 외곽 = 들쭉날쭉 네온 해안 (둥근사각·클로버 금지)
- 오염 상태 컨셉 = 검정 + 네온
- 9칸 통짜 육지. 코너 = 바위/숲으로 이동만 차단 (바다 구멍 아님)
- 집·부두 레이어 비움 (거주 아트는 후순위)

출력:
  data/map_mask_tool/master/island_master.mask.json
  data/map_mask_tool/master/island_master_preview.png  ← 네온 톤 미리보기
  data/map_mask_tool/masks/iXX.mask.json
"""
from __future__ import annotations

import base64
import io
import json
import math
import random
import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
REF_CANDIDATES = [
    ROOT / "data/map_mask_tool/refs/soos_minimap_neon_black.png",
    Path(r"C:\수스이미지 생성\soos_minimap_neon_black.png"),
]
MASTER_DIR = ROOT / "data/map_mask_tool/master"
MASK_DIR = ROOT / "data/map_mask_tool/masks"
REF_OUT = ROOT / "data/map_mask_tool/refs/soos_minimap_neon_black.png"

CELL = 512
MASTER = CELL * 3
RNG = random.Random(7)

GRID = {
    (0, 0): "i00",
    (1, 0): "i01",
    (2, 0): "i02",
    (0, 1): "i10",
    (1, 1): "i11",
    (2, 1): "i12",
    (0, 2): "i20",
    (1, 2): "i21",
    (2, 2): "i22",
}
WALK = {(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)}
CORNER = {(0, 0), (2, 0), (0, 2), (2, 2)}


def encode(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def solid(l: Image.Image) -> Image.Image:
    return Image.merge("RGBA", (l, l, l, l))


def blank(sz: int = MASTER) -> Image.Image:
    return Image.new("RGBA", (sz, sz), (0, 0, 0, 0))


def a255(im: Image.Image, thr: int = 40) -> Image.Image:
    return im.split()[-1].point(lambda v: 255 if v > thr else 0)


def find_ref() -> Path:
    for p in REF_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("soos_minimap_neon_black.png not found")


def extract_land_from_neon(src: Image.Image, size: int) -> Image.Image:
    """네온 맵에서 섬 실루엣 추출. UI 모서리 제외."""
    im = src.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)
    land = Image.new("L", (size, size), 0)
    px, lp = im.load(), land.load()
    for y in range(size):
        for x in range(size):
            # UI 대략 제외
            if y < int(size * 0.12) and x < int(size * 0.32):
                continue
            if y < int(size * 0.08) and x > int(size * 0.72):
                continue
            if y > int(size * 0.90) and (x < int(size * 0.28) or x > int(size * 0.78)):
                continue
            r, g, b = px[x, y]
            bright = r + g + b
            if bright < 45:
                continue
            # 네온 선/점 = 육지 위 요소 → 실루엣에 포함
            lp[x, y] = 255
    # 채우기: 윤곽만 있을 수 있어 팽창 후 구멍 메움
    land = land.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MaxFilter(7))
    land = land.filter(ImageFilter.MinFilter(5))
    # flood-fill exterior as sea, keep interior
    land = fill_interior(land)
    land = land.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    return land


def fill_interior(mask: Image.Image) -> Image.Image:
    """바깥에서 flood → 안쪽을 육지로."""
    from collections import deque

    w, h = mask.size
    sea = Image.new("L", (w, h), 0)
    sp = sea.load()
    mp = mask.load()
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    seen = [[False] * w for _ in range(h)]
    while q:
        x, y = q.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y][x]:
            continue
        seen[y][x] = True
        if mp[x, y] > 40:
            continue
        sp[x, y] = 255
        q.extend(((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)))
    out = Image.new("L", (w, h), 0)
    op = out.load()
    for y in range(h):
        for x in range(w):
            if sp[x, y] == 0:
                op[x, y] = 255
    return out


def ensure_corners_land(land: Image.Image) -> Image.Image:
    """코너도 육지로 이어지게 (바다 구멍→클로버 방지)."""
    d = ImageDraw.Draw(land)
    for col, row in CORNER:
        x0, y0 = col * CELL, row * CELL
        # 코너 칸 중심을 육지와 연결
        cx, cy = x0 + CELL // 2, y0 + CELL // 2
        d.ellipse((cx - 200, cy - 200, cx + 200, cy + 200), fill=255)
        # 중앙 쪽으로 다리
        mx, my = MASTER // 2, MASTER // 2
        d.line([(cx, cy), (mx, my)], fill=255, width=120)
    land = land.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.MinFilter(5))
    # 외곽 얇은 바다만 유지
    lp = land.load()
    m = 16
    for y in range(MASTER):
        for x in range(MASTER):
            if x < m or y < m or x >= MASTER - m or y >= MASTER - m:
                lp[x, y] = 0
    return land


def paint_forest(land: Image.Image) -> Image.Image:
    forest = Image.new("L", (MASTER, MASTER), 0)
    d = ImageDraw.Draw(forest)
    # 네온 점묘 느낌의 큰 덩이
    for _ in range(55):
        x = RNG.randint(80, MASTER - 80)
        y = RNG.randint(80, MASTER - 80)
        if land.getpixel((x, y)) < 128:
            continue
        r = RNG.randint(35, 95)
        d.ellipse((x - r, y - r, x + r, y + r), fill=255)
    # 코너는 거의 전부 숲(차단)
    lp = land.load()
    for col, row in CORNER:
        x0, y0 = col * CELL, row * CELL
        for y in range(y0 + 20, y0 + CELL - 20):
            for x in range(x0 + 20, x0 + CELL - 20):
                if lp[x, y]:
                    forest.putpixel((x, y), 255)
    forest = forest.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(3))
    fp = forest.load()
    for y in range(MASTER):
        for x in range(MASTER):
            if not lp[x, y]:
                fp[x, y] = 0
    return forest


def paint_path(land: Image.Image, forest: Image.Image) -> Image.Image:
    path = Image.new("L", (MASTER, MASTER), 0)
    d = ImageDraw.Draw(path)
    cx = cy = MASTER // 2
    # 웹처럼 — 네온 길
    hubs = [(cx, cy), (cx, CELL // 2), (CELL // 2, cy), (MASTER - CELL // 2, cy), (cx, MASTER - CELL // 2)]
    for i, (x0, y0) in enumerate(hubs):
        for x1, y1 in hubs[i + 1 :]:
            if RNG.random() < 0.35:
                continue
            d.line([(x0, y0), (x1, y1)], fill=255, width=6)
    for _ in range(20):
        a = hubs[RNG.randrange(len(hubs))]
        ang = RNG.random() * math.tau
        b = (int(a[0] + math.cos(ang) * RNG.randint(80, 200)), int(a[1] + math.sin(ang) * RNG.randint(80, 200)))
        d.line([a, b], fill=255, width=5)
    path = path.filter(ImageFilter.MaxFilter(3))
    lp, fo, pp = land.load(), forest.load(), path.load()
    for y in range(MASTER):
        for x in range(MASTER):
            if (x // CELL, y // CELL) in CORNER or not lp[x, y] or fo[x, y]:
                pp[x, y] = 0
    return path


def paint_rocks(land: Image.Image) -> Image.Image:
    """해안 보라 바위 링 + 코너 절벽."""
    dil = land.filter(ImageFilter.MaxFilter(11))
    ero = land.filter(ImageFilter.MinFilter(7))
    rock = Image.new("L", (MASTER, MASTER), 0)
    dp, ep, rp, lp = dil.load(), ero.load(), rock.load(), land.load()
    for y in range(MASTER):
        for x in range(MASTER):
            if dp[x, y] and not ep[x, y]:
                rp[x, y] = 255
    d = ImageDraw.Draw(rock)
    # 코너 절벽 장벽
    for col, row in CORNER:
        x0, y0 = col * CELL, row * CELL
        if (col, row) == (0, 0):
            d.rectangle((x0 + CELL - 80, y0 + 30, x0 + CELL - 4, y0 + CELL - 4), fill=255)
            d.rectangle((x0 + 30, y0 + CELL - 80, x0 + CELL - 4, y0 + CELL - 4), fill=255)
        elif (col, row) == (2, 0):
            d.rectangle((x0 + 4, y0 + 30, x0 + 80, y0 + CELL - 4), fill=255)
            d.rectangle((x0 + 4, y0 + CELL - 80, x0 + CELL - 30, y0 + CELL - 4), fill=255)
        elif (col, row) == (0, 2):
            d.rectangle((x0 + CELL - 80, y0 + 4, x0 + CELL - 4, y0 + CELL - 30), fill=255)
            d.rectangle((x0 + 30, y0 + 4, x0 + CELL - 4, y0 + 80), fill=255)
        else:
            d.rectangle((x0 + 4, y0 + 4, x0 + 80, y0 + CELL - 30), fill=255)
            d.rectangle((x0 + 4, y0 + 4, x0 + CELL - 30, y0 + 80), fill=255)
    # 해안 바위 덩이
    pts = [(x, y) for y in range(0, MASTER, 4) for x in range(0, MASTER, 4) if rp[x, y]]
    RNG.shuffle(pts)
    kept = []
    for x, y in pts[:400]:
        if any((x - kx) ** 2 + (y - ky) ** 2 < 12**2 for kx, ky in kept):
            continue
        rad = RNG.randint(4, 10)
        d.ellipse((x - rad, y - rad // 2, x + rad, y + rad // 2), fill=255)
        kept.append((x, y))
    for y in range(MASTER):
        for x in range(MASTER):
            if not lp[x, y] and rp[x, y] == 0:
                pass
            if not lp[x, y]:
                # 섬 밖 작은 바위섬은 네온 레프 느낌으로 일부만
                pass
    rock = rock.point(lambda v: 255 if v > 40 else 0)
    return rock


def paint_flower_pond_blight(land, forest, path):
    flower, pond, lake, debris, blight = blank(), blank(), blank(), blank(), blank()
    fd, pd, ld, dd, bd = map(ImageDraw.Draw, (flower, pond, lake, debris, blight))
    lp, fo, pp = land.load(), forest.load(), path.load()
    # 꽃 — 탐방 칸 들판
    for _ in range(50):
        x, y = RNG.randint(100, MASTER - 100), RNG.randint(100, MASTER - 100)
        if (x // CELL, y // CELL) in CORNER:
            continue
        if not lp[x, y] or fo[x, y] or pp[x, y]:
            continue
        r = RNG.randint(14, 32)
        fd.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 255))
    for x, y, r in [(750, 400, 40), (400, 780, 45), (1100, 780, 42)]:
        ld.ellipse((x - r, y - int(r * 0.7), x + r, y + int(r * 0.7)), fill=(255, 255, 255, 255))
    for x, y, r in [(600, 600, 18), (900, 650, 16), (700, 1100, 20), (950, 450, 15)]:
        pd.ellipse((x - r, y - int(r * 0.7), x + r, y + int(r * 0.7)), fill=(255, 255, 255, 255))
    for x, y, r in [
        (MASTER // 2, MASTER // 2, 32),
        (MASTER // 2, CELL // 2, 24),
        (CELL // 2, MASTER // 2, 24),
        (MASTER - CELL // 2, MASTER // 2, 24),
        (MASTER // 2, MASTER - CELL // 2, 26),
    ]:
        bd.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 255))
    for _ in range(30):
        x, y = RNG.randint(120, MASTER - 120), RNG.randint(120, MASTER - 120)
        if (x // CELL, y // CELL) in CORNER or not lp[x, y]:
            continue
        rad = RNG.randint(6, 14)
        dd.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))

    def clip(im):
        a = a255(im)
        ap = a.load()
        for y in range(MASTER):
            for x in range(MASTER):
                if not ap[x, y]:
                    continue
                if (x // CELL, y // CELL) in CORNER or not lp[x, y] or fo[x, y] or pp[x, y]:
                    ap[x, y] = 0
        return solid(a)

    return clip(flower), clip(pond), clip(lake), clip(debris), clip(blight)


def neon_preview(land, forest, path, rock, flower, pond, lake, debris, blight) -> Image.Image:
    """오염/정화전 톤 — 검정+네온 (기준작 언어)."""
    out = Image.new("RGB", (MASTER, MASTER), (0, 0, 0))
    d = ImageDraw.Draw(out)
    # 미세 그리드
    for i in range(0, MASTER, 48):
        d.line([(i, 0), (i, MASTER)], fill=(20, 40, 45))
        d.line([(0, i), (MASTER, i)], fill=(20, 40, 45))

    def stamp(mask_l: Image.Image, color: tuple[int, int, int], dots: bool = False):
        m = mask_l if mask_l.mode == "L" else a255(mask_l)
        mp = m.load()
        if dots:
            for y in range(0, MASTER, 3):
                for x in range(0, MASTER, 3):
                    if mp[x, y] > 80 and RNG.random() < 0.45:
                        out.putpixel((x, y), color)
                        if RNG.random() < 0.3 and x + 1 < MASTER:
                            out.putpixel((x + 1, y), color)
        else:
            layer = Image.new("RGB", (MASTER, MASTER), color)
            out.paste(layer, (0, 0), m.point(lambda v: min(255, int(v * 0.9))))

    # 육지 暗い 채움
    stamp(land, (8, 14, 12))
    stamp(forest, (40, 255, 90), dots=True)
    # 길 시안
    pl = path if path.mode == "L" else a255(path)
    pp = pl.load()
    for y in range(MASTER):
        for x in range(MASTER):
            if pp[x, y] > 80:
                out.putpixel((x, y), (45, 224, 208))
    # 꽃 핑크 점
    stamp(a255(flower), (255, 80, 200), dots=True)
    stamp(a255(pond), (60, 160, 255), dots=True)
    stamp(a255(lake), (40, 140, 255), dots=True)
    stamp(a255(debris), (140, 100, 80), dots=True)
    stamp(a255(blight), (180, 60, 220), dots=True)
    # 해안·바위 마젠타
    rl = rock if rock.mode == "L" else a255(rock)
    rp = rl.load()
    lp = land.load()
    # 해안선 스트로크
    edge = land.filter(ImageFilter.FIND_EDGES)
    ep = edge.load()
    for y in range(MASTER):
        for x in range(MASTER):
            if ep[x, y] > 20 and lp[x, y]:
                out.putpixel((x, y), (200, 80, 255))
            elif rp[x, y] > 80:
                out.putpixel((x, y), (160, 70, 220))

    # 3×3 가이드 (얇게)
    for i in range(1, 3):
        d.line([(i * CELL, 0), (i * CELL, MASTER)], fill=(45, 224, 208, 80))
        d.line([(0, i * CELL), (MASTER, i * CELL)], fill=(45, 224, 208, 80))
    for (col, row), sid in GRID.items():
        tag = sid if (col, row) in WALK else f"{sid}"
        d.text((col * CELL + 10, row * CELL + 10), tag, fill=(45, 224, 208))
    d.text((14, MASTER - 28), "POLLUTED · NEON REF EDGE", fill=(45, 224, 208))
    return out


def main() -> None:
    ref = find_ref()
    REF_OUT.parent.mkdir(parents=True, exist_ok=True)
    if ref.resolve() != REF_OUT.resolve():
        shutil.copy2(ref, REF_OUT)

    src = Image.open(ref)
    land = extract_land_from_neon(src, MASTER)
    land = ensure_corners_land(land)
    forest = paint_forest(land)
    path = paint_path(land, forest)
    rock = paint_rocks(land)
    flower, pond, lake, debris, blight = paint_flower_pond_blight(land, forest, path)

    empty = blank()
    layers = {
        "land": encode(solid(land)),
        "path": encode(solid(path)),
        "forest": encode(solid(forest)),
        "flower": encode(flower),
        "pond": encode(pond),
        "lake": encode(lake),
        "rock": encode(solid(rock)),
        "debris": encode(debris),
        "blight": encode(blight),
        "farm": encode(empty),
        "village": encode(empty),
        "dock": encode(empty),
        "node": encode(empty),
        "poi": encode(empty),
    }

    MASTER_DIR.mkdir(parents=True, exist_ok=True)
    MASK_DIR.mkdir(parents=True, exist_ok=True)
    doc = {
        "version": 1,
        "sector_id": "island_master",
        "size": MASTER,
        "note": "외곽·오염 컨셉 = soos_minimap_neon_black. 통짜 섬. 코너=숲·바위로 막힘. 집·부두 없음.",
        "ref": "data/map_mask_tool/refs/soos_minimap_neon_black.png",
        "grid": {
            "cell": CELL,
            "walk": ["i01", "i10", "i11", "i12", "i21"],
            "blocked": ["i00", "i02", "i20", "i22"],
        },
        "layers": layers,
    }
    (MASTER_DIR / "island_master.mask.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    neon_preview(land, forest, path, rock, flower, pond, lake, debris, blight).save(
        MASTER_DIR / "island_master_preview.png"
    )

    layer_imgs = {
        "land": solid(land),
        "path": solid(path),
        "forest": solid(forest),
        "flower": flower,
        "pond": pond,
        "lake": lake,
        "rock": solid(rock),
        "debris": debris,
        "blight": blight,
    }
    empty_c = blank(CELL)
    for (col, row), sid in GRID.items():
        x0, y0 = col * CELL, row * CELL
        out_layers = {
            k: encode(im.crop((x0, y0, x0 + CELL, y0 + CELL))) for k, im in layer_imgs.items()
        }
        for k in ("farm", "village", "dock", "node", "poi"):
            out_layers[k] = encode(empty_c)
        note = "탐방" if (col, row) in WALK else "막힘(산·숲·절벽)"
        sd = {
            "version": 1,
            "sector_id": sid,
            "size": CELL,
            "note": f"네온 기준 마스터 크롭 · {note}",
            "layers": out_layers,
        }
        (MASK_DIR / f"{sid}.mask.json").write_text(
            json.dumps(sd, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print("crop", sid)

    print("ref", ref)
    print("preview", MASTER_DIR / "island_master_preview.png")


if __name__ == "__main__":
    main()
