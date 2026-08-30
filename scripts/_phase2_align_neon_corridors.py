"""Carve field corridors along neon paths; refill forest into old straight-cross gaps."""
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


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or SIZE)
    L = doc["layers"]
    land = load_mask(L, "land", size)
    walk = load_mask(L, "walk", size)
    path = load_mask(L, "path", size)
    node = load_mask(L, "node", size)
    forest = load_mask(L, "forest", size)
    rock = load_mask(L, "rock", size)
    field = load_mask(L, "flower", size)
    lake = load_mask(L, "lake", size)
    pond = load_mask(L, "pond", size)
    wz = ((walk > 0) & (land > 0)).astype(np.uint8)

    # neon path meadow band (narrow — neon thin road feel)
    band = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    band = ((band > 0) & (wz > 0)).astype(np.uint8)

    # workzone forest should hug neon roads, not old cross
    # refill: anywhere in wz that is field and far from neon path → prefer forest in N/W lobes
    dist = cv2.distanceTransform((path == 0).astype(np.uint8), cv2.DIST_L2, 5)
    far_open = (wz > 0) & (path == 0) & (dist > 22) & (lake == 0) & (pond == 0) & (rock == 0) & (node == 0)

    # north & west cells: convert far field back to forest
    north = np.zeros_like(wz)
    north[:CELL, :] = 1
    west = np.zeros_like(wz)
    west[:, :CELL] = 1
    refill = far_open & ((north > 0) | (west > 0)) & (field > 0)
    # also refill a chunk of east woods
    east = np.zeros_like(wz)
    east[:, 2 * CELL :] = 1
    refill |= far_open & (east > 0) & (field > 0) & (np.arange(size)[:, None] < CELL * 1.7)

    forest[(refill > 0) & (walk > 0)] = 1
    field[refill > 0] = 0

    # corridor along neon path = field (open) inside workzone, not forest/rock
    forest[(band > 0) & (wz > 0)] = 0
    rock[(band > 0) & (wz > 0)] = 0
    field[(band > 0) & (wz > 0) & (lake == 0) & (pond == 0)] = 1
    field[path > 0] = 0
    forest[path > 0] = 0
    rock[path > 0] = 0
    lake[path > 0] = 0
    pond[path > 0] = 0

    # rim outside walk unchanged from forest/rock already stored
    # ensure rim not eaten: reassert walk==0 keeps previous rim by not touching — we only edited wz pixels mostly
    # but refill used field inside walk only. Good.

    prev = np.zeros((size, size, 3), dtype=np.uint8)
    prev[land > 0] = [18, 22, 26]
    prev[wz > 0] = [26, 34, 38]
    prev[forest > 0] = [28, 125, 52]
    prev[rock > 0] = [100, 85, 120]
    prev[field > 0] = [200, 175, 70]
    prev[lake > 0] = [35, 105, 205]
    prev[pond > 0] = [60, 145, 225]
    glow = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    prev[glow > 0] = [15, 70, 78]
    prev[path > 0] = [90, 255, 250]
    prev[node > 0] = [255, 70, 220]
    for i in (1, 2):
        prev[:, i * CELL] = [55, 65, 85]
        prev[i * CELL, :] = [55, 65, 85]
    Image.fromarray(prev, "RGB").save(PREVIEW)

    L["forest"] = to_data_url(forest)
    L["rock"] = to_data_url(rock)
    L["flower"] = to_data_url(field)
    L["lake"] = to_data_url(lake)
    L["pond"] = to_data_url(pond)
    L["path"] = to_data_url(path)
    L["node"] = to_data_url(node)
    doc["layers"] = L
    doc["note"] = "Phase2 neon path network + path-aligned forest/field. No straight cross corridor."
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"forest={forest.sum()} field={field.sum()} path={path.sum()}")
    print(f"preview {PREVIEW}")


if __name__ == "__main__":
    main()
