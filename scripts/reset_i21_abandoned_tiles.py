"""i21 버려진 지역 — 타일만.

기준 실루엣: data/ui/journey/sector_i21_after.png
- 육지 윤곽 유지
- 집·부두·사람 거주 흔적 레이어 없음
- village / dock 빈 마스크

출력: data/map_mask_tool/masks/i21.mask.json
"""
from __future__ import annotations

import base64
import csv
import io
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
AFTER = ROOT / "data/ui/journey/sector_i21_after.png"
MASK_OUT = ROOT / "data/map_mask_tool/masks/i21.mask.json"
PROP_CSV = ROOT / "data/area_prop_config.csv"
PROP_SHELVE = ROOT / "data/map_mask_tool/refs/i21_props_shelved.csv"
SILH_OUT = ROOT / "data/map_mask_tool/refs/i21_land_silhouette.png"

SIZE = 512


def encode(im: Image.Image) -> str:
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def solid(l: Image.Image) -> Image.Image:
    return Image.merge("RGBA", (l, l, l, l))


def blank() -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def is_water(r: int, g: int, b: int) -> bool:
    # 밝은 바다 / 청록 얕은물
    if b > 95 and b >= g - 5 and b > r + 20:
        return True
    if b > 85 and g > 70 and r < 55 and b >= g - 15:
        return True
    return False


def extract_land(src: Image.Image) -> Image.Image:
    src = src.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    land = Image.new("L", (SIZE, SIZE), 0)
    px = src.load()
    lp = land.load()
    for y in range(SIZE):
        for x in range(SIZE):
            r, g, b = px[x, y]
            if not is_water(r, g, b):
                lp[x, y] = 255
    # 노이즈 정리
    land = land.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5))
    land = land.filter(ImageFilter.MaxFilter(3))
    return land


def erase_dock(land: Image.Image) -> Image.Image:
    """남쪽 부두·선착장 돌출을 바다로 되돌리고 해안을 자연스럽게."""
    out = land.copy()
    p = out.load()
    cx = SIZE // 2
    for y in range(int(SIZE * 0.78), SIZE):
        # 아래로 갈수록 중앙부터 넓게 깎아 부두 제거
        t = (y - SIZE * 0.78) / (SIZE * 0.22)
        half = int(40 + t * 120)
        for x in range(cx - half, cx + half):
            if 0 <= x < SIZE:
                p[x, y] = 0
        if y > int(SIZE * 0.90):
            for x in range(SIZE):
                p[x, y] = 0
    # 잔여 섬 조각 제거 + 해안 부드럽게
    out = out.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    out = out.filter(ImageFilter.MinFilter(3))
    return keep_largest(out)


def keep_largest(land: Image.Image) -> Image.Image:
    """가장 큰 육지 덩이만 남김 (부두 잔해 점들 제거)."""
    from collections import deque

    w, h = land.size
    px = land.load()
    seen = [[False] * w for _ in range(h)]
    best: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if px[x, y] < 128 or seen[y][x]:
                continue
            q = deque([(x, y)])
            seen[y][x] = True
            comp: list[tuple[int, int]] = []
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and px[nx, ny] >= 128:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    out = Image.new("L", (w, h), 0)
    op = out.load()
    for x, y in best:
        op[x, y] = 255
    return out


def erase_habitation(land: Image.Image, props: list[dict]) -> Image.Image:
    """집·망루 발자국을 육지에서 지우지 않고 — 마스크에 건물 레이어만 안 둠.
    실루엣은 유지하되, 건물 자리를 '빈 들'로 표시하기 위해 forest/path에서 제외할 구멍만 만든다.
    """
    return land  # 실루엣은 after 육지 유지 (부두만 이미 삭제)


def habitation_holes(props: list[dict]) -> Image.Image:
    """건물·부두 프롭 자리 — 숲/길에서 비울 마스크."""
    hole = Image.new("L", (SIZE, SIZE), 0)
    d = ImageDraw.Draw(hole)
    for row in props:
        kind = (row.get("kind") or "").strip()
        group = (row.get("group_id") or "").strip()
        if kind not in ("building", "tower") and group != "g_dock":
            continue
        try:
            x = float(row["x_pct"]) / 100.0 * SIZE
            y = float(row["y_pct"]) / 100.0 * SIZE
            hm = float(row.get("h_m") or 8)
        except (KeyError, ValueError):
            continue
        rad = max(14, min(48, hm * 2.2))
        d.ellipse((x - rad, y - rad * 0.85, x + rad, y + rad * 0.85), fill=255)
    # 남쪽 부두 대형 구멍
    d.ellipse((SIZE * 0.35, SIZE * 0.78, SIZE * 0.65, SIZE * 1.05), fill=255)
    return hole.filter(ImageFilter.MaxFilter(7))


def make_path(src: Image.Image, land: Image.Image, holes: Image.Image) -> Image.Image:
    src = src.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    path = Image.new("L", (SIZE, SIZE), 0)
    px, lp, pp, hp = src.load(), land.load(), path.load(), holes.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if not lp[x, y] or hp[x, y]:
                continue
            r, g, b = px[x, y]
            # 흙길: 갈색, 채도 중간
            if r > 100 and g > 60 and b < 100 and r > g and r - b > 40 and g - b > 10:
                if abs(r - g) < 90:
                    pp[x, y] = 255
    path = path.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    # 중앙 세로 길 보강 (관문 방향) — 건물 구멍 제외
    d = ImageDraw.Draw(path)
    for y in range(int(SIZE * 0.12), int(SIZE * 0.78)):
        x0 = SIZE // 2 - 6
        for x in range(x0, x0 + 12):
            if lp[x, y] and not hp[x, y]:
                pp[x, y] = 255
    return path


def make_forest(src: Image.Image, land: Image.Image, path: Image.Image, holes: Image.Image) -> Image.Image:
    src = src.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    forest = Image.new("L", (SIZE, SIZE), 0)
    px, lp, fo, pp, hp = src.load(), land.load(), forest.load(), path.load(), holes.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if not lp[x, y] or pp[x, y] or hp[x, y]:
                continue
            r, g, b = px[x, y]
            # 짙은 녹 / 나무
            if g > 55 and g >= r and g >= b - 10 and g > b:
                if g > r + 5 or (g > 70 and r < 100):
                    fo[x, y] = 255
    forest = forest.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))
    # 가장자리 숲 보강 (좌우) — 거주 구멍 제외
    d = ImageDraw.Draw(forest)
    for cx, cy, rad in [
        (70, 280, 55),
        (80, 180, 50),
        (430, 200, 55),
        (440, 300, 50),
        (120, 120, 40),
        (400, 120, 40),
    ]:
        d.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=255)
    fp = forest.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if fp[x, y] and (not lp[x, y] or pp[x, y] or hp[x, y]):
                fp[x, y] = 0
    return forest


def make_rock(land: Image.Image) -> Image.Image:
    dil = land.filter(ImageFilter.MaxFilter(13))
    ero = land.filter(ImageFilter.MinFilter(7))
    band = Image.new("L", (SIZE, SIZE), 0)
    dp, ep, bp, lp = dil.load(), ero.load(), band.load(), land.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if dp[x, y] and not ep[x, y]:
                bp[x, y] = 255
    rock = blank()
    d = ImageDraw.Draw(rock)
    import random

    rng = random.Random(9)
    kept: list[tuple[int, int]] = []
    pts = [(x, y) for y in range(0, SIZE, 2) for x in range(0, SIZE, 2) if bp[x, y]]
    rng.shuffle(pts)
    for x, y in pts:
        if len(kept) >= 140:
            break
        if any((x - kx) ** 2 + (y - ky) ** 2 < 11**2 for kx, ky in kept):
            continue
        rad = rng.randint(4, 10)
        d.ellipse((x - rad, y - rad // 2, x + rad, y + rad // 2), fill=(255, 255, 255, 255))
        kept.append((x, y))
    return rock


def make_wild_flower(land: Image.Image, forest: Image.Image, path: Image.Image, holes: Image.Image) -> Image.Image:
    """야생 꽃 — 밭/마을 아님. 들판에만 얇게."""
    flower = blank()
    d = ImageDraw.Draw(flower)
    lp, fo, pp, hp = land.load(), forest.load(), path.load(), holes.load()
    import random

    rng = random.Random(3)
    field = [(x, y) for y in range(SIZE) for x in range(SIZE) if lp[x, y] and not fo[x, y] and not pp[x, y] and not hp[x, y]]
    rng.shuffle(field)
    n = 0
    for x, y in field:
        if n >= 20:
            break
        if rng.random() > 0.002:
            continue
        rad = rng.randint(10, 22)
        d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(255, 255, 255, 255))
        n += 1
    # 구멍·숲·길 클립
    a = flower.split()[-1]
    ap = a.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if ap[x, y] and (not lp[x, y] or fo[x, y] or pp[x, y] or hp[x, y]):
                ap[x, y] = 0
    return solid(a)


def shelve_habitation_props() -> int:
    """building / tower / g_dock / fence 프롭을 area_i21에서 분리 보관(누적)."""
    rows: list[dict] = []
    with PROP_CSV.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        for row in reader:
            rows.append(row)

    already: dict[str, dict] = {}
    if PROP_SHELVE.exists():
        with PROP_SHELVE.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                already[row["prop_id"]] = row

    keep: list[dict] = []
    newly = 0
    for row in rows:
        if row.get("area_id") not in ("area_i21", "area_i21_shelved"):
            keep.append(row)
            continue
        # 이미 보관된 건 CSV에 다시 넣지 않음
        if row["prop_id"] in already and row.get("area_id") == "area_i21_shelved":
            continue
        kind = (row.get("kind") or "").strip()
        group = (row.get("group_id") or "").strip()
        y = float(row.get("y_pct") or 0)
        should = (
            kind in ("building", "tower", "fence", "sign")
            or group == "g_dock"
            or (kind in ("crate", "pole", "barrel") and (group == "g_dock" or y > 80))
        )
        if should and row.get("area_id") == "area_i21":
            row = dict(row)
            row["area_id"] = "area_i21_shelved"
            note = row.get("note") or ""
            if "타일우선" not in note:
                row["note"] = (note + " · 타일우선으로 보관").strip(" ·")
            already[row["prop_id"]] = row
            newly += 1
        elif row.get("area_id") == "area_i21":
            keep.append(row)

    PROP_SHELVE.parent.mkdir(parents=True, exist_ok=True)
    with PROP_SHELVE.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(already.values())

    with PROP_CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(keep)

    return newly


def load_i21_props() -> list[dict]:
    out: list[dict] = []
    with PROP_CSV.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("area_id") == "area_i21":
                out.append(row)
    if PROP_SHELVE.exists():
        with PROP_SHELVE.open(encoding="utf-8", newline="") as f:
            out.extend(csv.DictReader(f))
    else:
        # shelve 전에 읽기용 — 원본에서 building 좌표
        with PROP_CSV.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                if row.get("area_id") == "area_i21":
                    out.append(row)
    return out


def main() -> None:
    src = Image.open(AFTER)
    # 프롭 좌표는 shelve 전에 확보
    props_for_holes: list[dict] = []
    with PROP_CSV.open(encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("area_id") in ("area_i21", "area_i21_shelved"):
                props_for_holes.append(row)

    n_shelved = shelve_habitation_props()

    land = extract_land(src)
    land = erase_dock(land)
    # 해안 여백
    m = land.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if x < 6 or y < 6 or x >= SIZE - 6 or y >= SIZE - 6:
                m[x, y] = 0

    holes = habitation_holes(props_for_holes)
    path = make_path(src, land, holes)
    forest = make_forest(src, land, path, holes)
    rock = make_rock(land)
    flower = make_wild_flower(land, forest, path, holes)

    # 실루엣 미리보기 PNG
    preview = Image.new("RGBA", (SIZE, SIZE), (20, 40, 70, 255))
    green = Image.new("RGBA", (SIZE, SIZE), (60, 110, 55, 255))
    preview.paste(green, (0, 0), solid(land))
    SILH_OUT.parent.mkdir(parents=True, exist_ok=True)
    preview.save(SILH_OUT)

    empty = blank()
    doc = {
        "version": 1,
        "sector_id": "i21",
        "size": SIZE,
        "note": "버려진 지역·타일만. 기준=sector_i21_after 실루엣. 집·부두·village/dock 없음.",
        "layers": {
            "land": encode(solid(land)),
            "path": encode(solid(path)),
            "forest": encode(solid(forest)),
            "flower": encode(flower),
            "farm": encode(empty),
            "pond": encode(empty),
            "village": encode(empty),
            "dock": encode(empty),
            "rock": encode(rock),
            "node": encode(empty),
            "poi": encode(empty),
        },
    }
    MASK_OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"mask → {MASK_OUT}")
    print(f"silhouette → {SILH_OUT}")
    print(f"shelved props → {n_shelved} ({PROP_SHELVE.name})")


if __name__ == "__main__":
    main()
