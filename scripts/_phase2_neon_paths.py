"""Replace path with neon-style hub + curved branching network (ref: soos_minimap_neon_black)."""
from __future__ import annotations

import base64
import io
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "map_mask_tool" / "master" / "island_master.mask.json"
PREVIEW = ROOT / "data" / "map_mask_tool" / "master" / "island_master_phase2_preview.png"
SIZE = 1536
CELL = 512


def load_mask(layers: dict, key: str, size: int) -> np.ndarray:
    raw = layers.get(key)
    if not raw:
        return np.zeros((size, size), dtype=np.uint8)
    b64 = raw.split(",", 1)[1] if isinstance(raw, str) and raw.startswith("data:") else raw
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
    if im.size != (size, size):
        im = im.resize((size, size), Image.NEAREST)
    return (np.asarray(im)[:, :, 3] > 20).astype(np.uint8)


def to_data_url(mask: np.ndarray) -> str:
    rgba = np.zeros((*mask.shape, 4), dtype=np.uint8)
    rgba[mask > 0] = [255, 255, 255, 255]
    buf = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def snap(wz: np.ndarray, y: float, x: float) -> tuple[float, float]:
    h, w = wz.shape
    yi, xi = int(y), int(x)
    if 0 <= yi < h and 0 <= xi < w and wz[yi, xi]:
        return float(yi), float(xi)
    for rad in range(1, 200):
        y0, y1 = max(0, yi - rad), min(h, yi + rad + 1)
        x0, x1 = max(0, xi - rad), min(w, xi + rad + 1)
        yy, xx = np.where(wz[y0:y1, x0:x1] > 0)
        if len(yy) == 0:
            continue
        d = (yy + y0 - yi) ** 2 + (xx + x0 - xi) ** 2
        i = int(np.argmin(d))
        return float(yy[i] + y0), float(xx[i] + x0)
    return float(yi), float(xi)


def cubic(p0, p1, p2, p3, n: int = 48) -> list[tuple[float, float]]:
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        y = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        x = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        pts.append((y, x))
    return pts


def stroke_poly(mask: np.ndarray, pts: list[tuple[float, float]], thickness: int) -> None:
    if len(pts) < 2:
        return
    arr = np.array([[int(round(x)), int(round(y))] for y, x in pts], dtype=np.int32)
    cv2.polylines(mask, [arr], False, 1, thickness=thickness, lineType=cv2.LINE_AA)
    mask[:] = (mask > 0).astype(np.uint8)


def diamond(mask: np.ndarray, y: float, x: float, r: int = 7) -> None:
    pts = np.array(
        [
            [int(x), int(y - r)],
            [int(x + r), int(y)],
            [int(x), int(y + r)],
            [int(x - r), int(y)],
        ],
        dtype=np.int32,
    )
    cv2.fillConvexPoly(mask, pts, 1)


def curved_arm(
    mask: np.ndarray,
    hub: tuple[float, float],
    end: tuple[float, float],
    bend: float,
    thickness: int,
    side: int = 1,
) -> None:
    """Quadratic-ish cubic: control points offset perpendicular for neon curve."""
    hy, hx = hub
    ey, ex = end
    my, mx = (hy + ey) / 2, (hx + ex) / 2
    dy, dx = ey - hy, ex - hx
    length = math.hypot(dy, dx) or 1.0
    # perpendicular
    py, px = -dx / length, dy / length
    c1 = (hy + dy * 0.28 + py * bend * side, hx + dx * 0.28 + px * bend * side)
    c2 = (hy + dy * 0.72 + py * bend * 0.6 * side, hx + dx * 0.72 + px * bend * 0.6 * side)
    stroke_poly(mask, cubic(hub, c1, c2, end, n=56), thickness)


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or SIZE)
    layers = doc["layers"]
    land = load_mask(layers, "land", size)
    walk = load_mask(layers, "walk", size)
    wz = ((walk > 0) & (land > 0)).astype(np.uint8)

    hub = snap(wz, CELL * 1.50, CELL * 1.50)
    n = snap(wz, CELL * 0.48, CELL * 1.50)
    s = snap(wz, CELL * 2.58, CELL * 1.50)
    w = snap(wz, CELL * 1.50, CELL * 0.42)
    e = snap(wz, CELL * 1.50, CELL * 2.58)
    # forest lake spur target (NW)
    lake = snap(wz, CELL * 0.38, CELL * 1.15)
    # side POI-ish ends
    nw = snap(wz, CELL * 0.70, CELL * 0.85)
    ne = snap(wz, CELL * 0.70, CELL * 2.15)
    sw = snap(wz, CELL * 2.15, CELL * 0.90)
    se = snap(wz, CELL * 2.15, CELL * 2.10)

    path = np.zeros((size, size), dtype=np.uint8)
    node = np.zeros((size, size), dtype=np.uint8)

    # central neon hub ring
    hy, hx = int(hub[0]), int(hub[1])
    cv2.circle(path, (hx, hy), 38, 1, 5, lineType=cv2.LINE_AA)
    cv2.circle(path, (hx, hy), 18, 1, 3, lineType=cv2.LINE_AA)
    path[:] = (path > 0).astype(np.uint8)

    thin = 5
    mid = 6
    # primary curved arms (alternating bend like neon map)
    curved_arm(path, hub, n, bend=70, thickness=mid, side=1)
    curved_arm(path, hub, s, bend=55, thickness=mid, side=-1)
    curved_arm(path, hub, w, bend=65, thickness=mid, side=1)
    curved_arm(path, hub, e, bend=60, thickness=mid, side=-1)

    # secondary neon branches
    curved_arm(path, n, lake, bend=45, thickness=thin, side=-1)  # into forest lake
    curved_arm(path, hub, nw, bend=90, thickness=thin, side=1)
    curved_arm(path, hub, ne, bend=85, thickness=thin, side=-1)
    curved_arm(path, s, sw, bend=50, thickness=thin, side=1)
    curved_arm(path, s, se, bend=50, thickness=thin, side=-1)
    curved_arm(path, w, nw, bend=40, thickness=thin, side=-1)
    curved_arm(path, e, ne, bend=40, thickness=thin, side=1)
    # small spur loops near hub (neon web feel)
    a = snap(wz, hub[0] - 90, hub[1] + 110)
    b = snap(wz, hub[0] + 100, hub[1] + 95)
    curved_arm(path, hub, a, bend=35, thickness=4, side=1)
    curved_arm(path, hub, b, bend=35, thickness=4, side=-1)

    path &= wz

    # nodes at hub + junctions (neon pink diamonds in preview)
    for p in (hub, n, s, w, e, lake, nw, ne, sw, se, a, b):
        diamond(node, *p, r=8)
    node &= wz
    # keep nodes on/near path
    path_d = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    node &= path_d

    # rebuild preview from existing layers + new path
    forest = load_mask(layers, "forest", size)
    rock = load_mask(layers, "rock", size)
    field = load_mask(layers, "flower", size)
    lake_m = load_mask(layers, "lake", size)
    pond = load_mask(layers, "pond", size)

    # path clears blocking layers under road
    for m in (forest, rock, field, lake_m, pond):
        m[path > 0] = 0

    prev = np.zeros((size, size, 3), dtype=np.uint8)
    prev[land > 0] = [20, 24, 28]
    prev[wz > 0] = [28, 36, 40]
    prev[forest > 0] = [30, 130, 55]
    prev[rock > 0] = [95, 80, 115]
    prev[field > 0] = [190, 165, 70]
    prev[lake_m > 0] = [35, 100, 200]
    prev[pond > 0] = [55, 140, 220]
    # neon path look in preview: cyan core + glow halo
    glow = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    prev[glow > 0] = [20, 90, 95]
    prev[path > 0] = [80, 255, 245]
    prev[node > 0] = [255, 80, 220]
    for i in (1, 2):
        prev[:, i * CELL] = [60, 70, 90]
        prev[i * CELL, :] = [60, 70, 90]
    Image.fromarray(prev, "RGB").save(PREVIEW)

    bak = PATH.with_name("island_master.mask.json.bak_pre_neon_path")
    bak.write_text(PATH.read_text(encoding="utf-8"), encoding="utf-8")

    layers = dict(layers)
    layers["path"] = to_data_url(path)
    layers["node"] = to_data_url(node)
    layers["forest"] = to_data_url(forest)
    layers["rock"] = to_data_url(rock)
    layers["flower"] = to_data_url(field)
    layers["lake"] = to_data_url(lake_m)
    layers["pond"] = to_data_url(pond)
    doc["layers"] = layers
    doc["note"] = (
        "Phase2+: path=네온톤 허브링+곡선분기. node=교차점. "
        "숲/산 막힘·path로 안쪽 연결."
    )
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"path={int(path.sum())} nodes={int(node.sum())}")
    print(f"preview {PREVIEW}")
    print(f"saved {PATH}")


if __name__ == "__main__":
    main()
