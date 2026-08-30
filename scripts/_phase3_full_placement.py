"""Phase 3 soft only — keep Phase2 terrain; add flower accents + debris + blight.

Does NOT rewrite forests/rocks/water/path. Clears flower off water/rock/path.
Exports path-free overview (mask-tool Phase 4 reference).
"""
from __future__ import annotations

import base64
import io
import json
import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "map_mask_tool" / "master" / "island_master.mask.json"
OVERVIEW = ROOT / "data" / "map_mask_tool" / "master" / "island_master_zone_overview.png"
PHASE4 = ROOT / "data" / "map_mask_tool" / "master" / "island_master_phase4_preview.png"
SIZE = 1536
CELL = 512


def load(layers: dict, key: str, size: int) -> np.ndarray:
    raw = layers.get(key)
    if not raw:
        return np.zeros((size, size), dtype=np.uint8)
    b64 = raw.split(",", 1)[1] if isinstance(raw, str) and raw.startswith("data:") else raw
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
    if im.size != (size, size):
        im = im.resize((size, size), Image.NEAREST)
    return (np.asarray(im)[:, :, 3] > 20).astype(np.uint8)


def dump(mask: np.ndarray) -> str:
    rgba = np.zeros((*mask.shape, 4), dtype=np.uint8)
    rgba[mask > 0] = [255, 255, 255, 255]
    buf = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def blob(mask: np.ndarray, cy: float, cx: float, r: float, rng: np.random.Generator, t: float = 0.55) -> None:
    h, w = mask.shape
    y0, y1 = max(0, int(cy - r - 2)), min(h, int(cy + r + 3))
    x0, x1 = max(0, int(cx - r - 2)), min(w, int(cx + r + 3))
    if y0 >= y1 or x0 >= x1:
        return
    yy, xx = np.mgrid[y0:y1, x0:x1]
    dist = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
    noise = rng.random((y1 - y0, x1 - x0))
    fall = np.clip(1.0 - dist / max(r, 1.0), 0, 1)
    pick = (fall > 0.08) & (noise < t + 0.3 * fall)
    mask[y0:y1, x0:x1][pick] = 1


def render_overview(
    land: np.ndarray,
    forest: np.ndarray,
    rock: np.ndarray,
    flower: np.ndarray,
    lake: np.ndarray,
    pond: np.ndarray,
    debris: np.ndarray,
    blight: np.ndarray,
    rng: np.random.Generator,
    out: Path,
) -> None:
    size = land.shape[0]
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :] = [18, 28, 55]
    img[land > 0] = [62, 88, 48]
    img[forest > 0] = [34, 110, 52]
    img[rock > 0] = [95, 88, 102]
    img[flower > 0] = [210, 175, 85]
    yy, xx = np.where(flower > 0)
    if len(yy):
        n = max(1, len(yy) // 5)
        pick = rng.choice(len(yy), size=min(len(yy), n), replace=False)
        img[yy[pick], xx[pick]] = [255, 140, 190]
        pick2 = rng.choice(len(yy), size=min(len(yy), max(1, len(yy) // 10)), replace=False)
        img[yy[pick2], xx[pick2]] = [255, 220, 120]
    img[lake > 0] = [40, 115, 200]
    img[pond > 0] = [70, 150, 220]
    img[debris > 0] = [120, 95, 70]
    img[blight > 0] = [120, 50, 160]
    land_u8 = (land > 0).astype(np.uint8)
    edge = cv2.dilate(land_u8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))) - land_u8
    img[edge > 0] = [40, 50, 70]
    Image.fromarray(img, "RGB").save(out)
    print(f"overview {out}")


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or SIZE)
    L = doc["layers"]
    rng = np.random.default_rng(20260823)

    land = load(L, "land", size)
    walk = load(L, "walk", size)
    path = load(L, "path", size)
    forest = load(L, "forest", size)
    rock = load(L, "rock", size)
    field = load(L, "flower", size)
    lake = load(L, "lake", size)
    pond = load(L, "pond", size)
    wz = ((walk > 0) & (land > 0)).astype(np.uint8)

    # --- keep Phase2 flower; only clean illegal overlaps (weird look fix) ---
    flower = field.copy()
    before_bad = int(((flower > 0) & ((lake > 0) | (pond > 0) | (rock > 0) | (path > 0))).sum())
    flower[(lake > 0) | (pond > 0) | (rock > 0) | (path > 0)] = 0

    # light accents on existing meadow only (do not flood hub)
    accents = np.zeros((size, size), dtype=np.uint8)
    for cy, cx, r in (
        (CELL * 2.45, CELL * 1.45, 48),  # spawn
        (CELL * 2.38, CELL * 1.62, 32),
        (CELL * 1.58, CELL * 1.28, 36),  # hub rim — small
        (CELL * 1.58, CELL * 0.90, 34),  # west
        (CELL * 1.62, CELL * 2.15, 34),  # east
        (CELL * 0.55, CELL * 1.52, 26),  # forest clearing
    ):
        blob(accents, cy, cx, r, rng, 0.58)
    accents &= flower > 0
    flower |= accents

    # thin shore wildflowers (not into water)
    water = ((lake > 0) | (pond > 0)).astype(np.uint8)
    shore = cv2.dilate(water, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    shore = ((shore > 0) & (water == 0) & (wz > 0) & (rock == 0) & (path == 0) & (flower > 0)).astype(np.uint8)
    flower |= shore & (rng.random((size, size)) < 0.22)

    # --- debris near spawn (i21) ---
    debris = np.zeros((size, size), dtype=np.uint8)
    for cy, cx, r in (
        (CELL * 2.55, CELL * 1.35, 26),
        (CELL * 2.48, CELL * 1.58, 20),
        (CELL * 2.36, CELL * 1.30, 16),
    ):
        blob(debris, cy, cx, r, rng, 0.48)
    debris &= wz & (rock == 0) & (lake == 0) & (pond == 0) & (path == 0) & (flower > 0)

    # --- one blight core near hub (i11), off path/water/rock ---
    blight = np.zeros((size, size), dtype=np.uint8)
    blob(blight, CELL * 1.48, CELL * 1.62, 32, rng, 0.68)
    blob(blight, CELL * 1.52, CELL * 1.58, 18, rng, 0.52)
    blight &= wz & (path == 0) & (lake == 0) & (pond == 0) & (rock == 0)
    # blight sits on meadow; punch flower/debris under it for readability
    flower[blight > 0] = 0
    debris[blight > 0] = 0

    print(
        f"cleaned_flower_off_blockers={before_bad} "
        f"flower={int(flower.sum())} debris={int(debris.sum())} blight={int(blight.sum())}"
    )

    bak = PATH.with_name("island_master.mask.json.bak_pre_phase3")
    shutil.copy2(PATH, bak)
    print(f"backup {bak}")

    L["flower"] = dump(flower)
    L["debris"] = dump(debris)
    L["blight"] = dump(blight)
    doc["layers"] = L
    doc["note"] = (
        "Phase0-3 soft on user Phase2. path=info. "
        "Overview: island_master_zone_overview.png / island_master_phase4_preview.png"
    )
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"saved {PATH}")

    render_overview(land, forest, rock, flower, lake, pond, debris, blight, rng, OVERVIEW)
    shutil.copy2(OVERVIEW, PHASE4)
    print(f"phase4 {PHASE4}")


if __name__ == "__main__":
    main()
