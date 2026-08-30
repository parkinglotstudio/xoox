"""Phase 2: work-zone paths, large forest, forest-lake vignette, fields, mountains."""
from __future__ import annotations

import base64
import io
import json
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


def disk(mask: np.ndarray, cy: float, cx: float, r: float) -> None:
    yy, xx = np.ogrid[: mask.shape[0], : mask.shape[1]]
    mask[((yy - cy) ** 2 + (xx - cx) ** 2) <= r * r] = 1


def soft_blob(
    mask: np.ndarray, cy: float, cx: float, r: float, rng: np.random.Generator, thresh: float = 0.5
) -> None:
    h, w = mask.shape
    y0, y1 = max(0, int(cy - r - 2)), min(h, int(cy + r + 3))
    x0, x1 = max(0, int(cx - r - 2)), min(w, int(cx + r + 3))
    if y0 >= y1 or x0 >= x1:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    dist = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
    noise = rng.random((y1 - y0, x1 - x0))
    fall = np.clip(1.0 - dist / max(r, 1.0), 0, 1)
    pick = (fall > 0.04) & (noise < thresh + 0.4 * fall)
    mask[y0:y1, x0:x1][pick] = 1


def line(mask: np.ndarray, y0: float, x0: float, y1: float, x1: float, thickness: int) -> None:
    cv2.line(
        mask,
        (int(round(x0)), int(round(y0))),
        (int(round(x1)), int(round(y1))),
        1,
        thickness=max(2, thickness),
    )


def snap(wz: np.ndarray, y: float, x: float) -> tuple[float, float]:
    size = wz.shape[0]
    yi, xi = int(y), int(x)
    if 0 <= yi < size and 0 <= xi < size and wz[yi, xi]:
        return float(yi), float(xi)
    for rad in range(1, 160):
        y0, y1 = max(0, yi - rad), min(size, yi + rad + 1)
        x0, x1 = max(0, xi - rad), min(size, xi + rad + 1)
        yy, xx = np.where(wz[y0:y1, x0:x1] > 0)
        if len(yy) == 0:
            continue
        dy = yy + y0 - yi
        dx = xx + x0 - xi
        i = int(np.argmin(dy * dy + dx * dx))
        return float(yy[i] + y0), float(xx[i] + x0)
    return float(yi), float(xi)


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or SIZE)
    layers = doc["layers"]
    land = load_mask(layers, "land", size)
    walk = load_mask(layers, "walk", size)
    rim_f = load_mask(layers, "forest", size) & (walk == 0) & (land > 0)
    rim_r = load_mask(layers, "rock", size) & (walk == 0) & (land > 0)
    # Prefer phase1 rim from bak if current forest already mixed — use walk==0 only
    bak = PATH.with_name("island_master.mask.json.bak_pre_phase2")
    if bak.exists():
        prev = json.loads(bak.read_text(encoding="utf-8"))["layers"]
        rim_f = load_mask(prev, "forest", size) & (walk == 0) & (land > 0)
        rim_r = load_mask(prev, "rock", size) & (walk == 0) & (land > 0)

    wz = ((walk > 0) & (land > 0)).astype(np.uint8)
    rng = np.random.default_rng(20260823)

    c21 = snap(wz, CELL * 2.55, CELL * 1.50)
    c11 = snap(wz, CELL * 1.50, CELL * 1.50)
    c01 = snap(wz, CELL * 0.55, CELL * 1.50)
    c10 = snap(wz, CELL * 1.50, CELL * 0.45)
    c12 = snap(wz, CELL * 1.50, CELL * 2.55)

    # --- path trunk ---
    path = np.zeros((size, size), dtype=np.uint8)
    for a, b in ((c21, c11), (c11, c01), (c10, c11), (c11, c12)):
        line(path, *a, *b, 14)
    path &= wz

    # --- large forest in workzone ---
    forest_in = np.zeros((size, size), dtype=np.uint8)
    # north mass (i01) — dominate north arm
    for cy, cx, r, t in (
        (CELL * 0.36, CELL * 1.50, CELL * 0.55, 0.72),
        (CELL * 0.50, CELL * 1.10, CELL * 0.40, 0.68),
        (CELL * 0.50, CELL * 1.90, CELL * 0.40, 0.68),
        (CELL * 0.72, CELL * 1.50, CELL * 0.36, 0.65),
        (CELL * 0.85, CELL * 1.30, CELL * 0.22, 0.55),
        (CELL * 0.85, CELL * 1.70, CELL * 0.22, 0.55),
    ):
        soft_blob(forest_in, cy, cx, r, rng, t)
    # west mass (i10)
    for cy, cx, r, t in (
        (CELL * 1.45, CELL * 0.34, CELL * 0.50, 0.70),
        (CELL * 1.70, CELL * 0.45, CELL * 0.36, 0.65),
        (CELL * 1.25, CELL * 0.50, CELL * 0.30, 0.60),
        (CELL * 1.55, CELL * 0.70, CELL * 0.22, 0.55),
    ):
        soft_blob(forest_in, cy, cx, r, rng, t)
    # east woods (i12)
    soft_blob(forest_in, CELL * 1.35, CELL * 2.60, CELL * 0.28, rng, 0.60)
    soft_blob(forest_in, CELL * 1.55, CELL * 2.45, CELL * 0.18, rng, 0.55)
    forest_in &= wz

    # carve a meadow corridor along path (fields along road) before lake vignette
    road_meadow = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 29)))
    forest_in[(road_meadow > 0) & (wz > 0)] = 0
    # re-apply north forest away from road for mass
    soft_blob(forest_in, CELL * 0.35, CELL * 1.15, CELL * 0.28, rng, 0.70)
    soft_blob(forest_in, CELL * 0.35, CELL * 1.85, CELL * 0.28, rng, 0.70)
    forest_in &= wz
    forest_in[path > 0] = 0

    # vignette lake deep in NW forest pocket (away from main N-S road)
    lake_pt = snap(wz, CELL * 0.36, CELL * 1.12)
    soft_blob(forest_in, lake_pt[0], lake_pt[1], 110, rng, 0.78)
    forest_in &= wz
    forest_in[path > 0] = 0

    lake = np.zeros((size, size), dtype=np.uint8)
    pond = np.zeros((size, size), dtype=np.uint8)
    disk(lake, lake_pt[0], lake_pt[1], 46)
    soft_blob(lake, lake_pt[0] + 5, lake_pt[1] + 4, 34, rng, 0.62)
    # hub open lake
    disk(lake, CELL * 1.62, CELL * 1.72, 40)
    soft_blob(lake, CELL * 1.66, CELL * 1.76, 32, rng, 0.55)
    disk(pond, CELL * 2.48, CELL * 1.70, 22)
    disk(pond, CELL * 1.72, CELL * 0.72, 18)
    disk(pond, CELL * 1.70, CELL * 2.32, 18)
    lake &= wz
    pond &= wz

    # forest ring around north vignette lake only
    vignette = lake.copy()
    vignette[CELL:, :] = 0
    ring = cv2.dilate(vignette, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
    ring = ((ring > 0) & (vignette == 0) & (wz > 0)).astype(np.uint8)
    forest_in[ring > 0] = 1

    # spur path to lake shore
    shore_pts = np.argwhere(ring > 0)
    if len(shore_pts):
        d = (shore_pts[:, 0] - c01[0]) ** 2 + (shore_pts[:, 1] - c01[1]) ** 2
        sy, sx = map(float, shore_pts[int(np.argmin(d))])
        line(path, *c01, sy, sx, 12)
        path &= wz

    lake[path > 0] = 0
    pond[path > 0] = 0

    shore = cv2.dilate(lake, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17)))
    shore = ((shore > 0) & (lake == 0) & (wz > 0)).astype(np.uint8)

    # mountains: pick workzone pixels far from path, stamp blobs there
    rock_in = np.zeros((size, size), dtype=np.uint8)
    dist_path = cv2.distanceTransform((path == 0).astype(np.uint8), cv2.DIST_L2, 5)
    far = (wz > 0) & (dist_path > 28) & (lake == 0) & (pond == 0)
    seeds = [
        (CELL * 0.25, CELL * 1.75),
        (CELL * 0.30, CELL * 1.90),
        (CELL * 1.25, CELL * 2.70),
        (CELL * 1.60, CELL * 2.65),
        (CELL * 2.65, CELL * 1.85),
        (CELL * 1.20, CELL * 0.30),
    ]
    for cy, cx in seeds:
        sy, sx = snap(wz, cy, cx)
        if dist_path[int(sy), int(sx)] < 22:
            # search nearby far pixel
            yy, xx = np.where(far)
            if len(yy) == 0:
                continue
            d = (yy - sy) ** 2 + (xx - sx) ** 2
            i = int(np.argmin(d))
            sy, sx = float(yy[i]), float(xx[i])
        soft_blob(rock_in, sy, sx, 52, rng, 0.65)
        soft_blob(rock_in, sy + 18, sx + 10, 36, rng, 0.55)
    rock_in &= far.astype(np.uint8)
    forest_in[rock_in > 0] = 0

    # clearings inside forest
    clear = np.zeros((size, size), dtype=np.uint8)
    soft_blob(clear, CELL * 0.58, CELL * 1.58, 40, rng, 0.58)
    soft_blob(clear, CELL * 0.50, CELL * 1.15, 32, rng, 0.55)
    soft_blob(clear, CELL * 1.52, CELL * 0.58, 34, rng, 0.55)
    clear = ((clear > 0) & (forest_in > 0) & (path == 0) & (lake == 0)).astype(np.uint8)
    forest_in[clear > 0] = 0

    # priority cleanup
    forest_in[(path > 0) | (lake > 0) | (pond > 0) | (rock_in > 0)] = 0

    blocked = (path > 0) | (lake > 0) | (pond > 0) | (rock_in > 0) | (forest_in > 0)
    field = (wz & ~blocked).astype(np.uint8)
    field = np.clip(field + clear + (shore & (path == 0) & (rock_in == 0)), 0, 1).astype(np.uint8)
    field[(path > 0) | (lake > 0) | (pond > 0) | (rock_in > 0)] = 0
    forest_in[field > 0] = 0

    forest = np.zeros((size, size), dtype=np.uint8)
    rock = np.zeros((size, size), dtype=np.uint8)
    forest[walk == 0] = rim_f[walk == 0]
    rock[walk == 0] = rim_r[walk == 0]
    forest[wz > 0] = forest_in[wz > 0]
    rock[wz > 0] = rock_in[wz > 0]

    print(
        f"path={path.sum()} forest_in={forest_in.sum()} forest={forest.sum()} "
        f"field={field.sum()} lake={lake.sum()} rock_in={rock_in.sum()}"
    )

    prev = np.zeros((size, size, 3), dtype=np.uint8)
    prev[land > 0] = [28, 36, 34]
    prev[wz > 0] = [45, 55, 50]
    prev[forest > 0] = [32, 145, 58]
    prev[rock > 0] = [105, 90, 125]
    prev[field > 0] = [210, 185, 75]
    prev[lake > 0] = [40, 115, 210]
    prev[pond > 0] = [70, 150, 230]
    prev[path > 0] = [245, 240, 220]
    for i in (1, 2):
        prev[:, i * CELL] = [80, 100, 120]
        prev[i * CELL, :] = [80, 100, 120]
    Image.fromarray(prev, "RGB").save(PREVIEW)

    out_bak = PATH.with_name("island_master.mask.json.bak_pre_phase2b")
    out_bak.write_text(PATH.read_text(encoding="utf-8"), encoding="utf-8")
    doc["layers"] = {
        "land": layers["land"],
        "walk": layers["walk"],
        "path": to_data_url(path),
        "forest": to_data_url(forest),
        "rock": to_data_url(rock),
        "flower": to_data_url(field),
        "lake": to_data_url(lake),
        "pond": to_data_url(pond),
    }
    doc["note"] = (
        "Phase2: 길 / 큰숲 / 숲속호수+연결길 / 들판 / 산. "
        "숲·산=기본막힘, path로 안쪽 열림."
    )
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"preview {PREVIEW}")
    print(f"saved {PATH}")


if __name__ == "__main__":
    main()
