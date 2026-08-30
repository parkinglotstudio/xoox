"""Phase 1: fill land \\ walk with forest/rock (minimap rim) by 9-cell guide."""
from __future__ import annotations

import base64
import io
import json
from pathlib import Path

import numpy as np
from PIL import Image
import cv2

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "map_mask_tool" / "master" / "island_master.mask.json"
PREVIEW = ROOT / "data" / "map_mask_tool" / "master" / "island_master_phase1_preview.png"
SIZE = 1536
CELL = 512

# base rock probability per cell (row, col)
CELL_ROCK = np.array(
    [
        [0.55, 0.45, 0.25],  # i00 산밀림, i01 북산, i02 밀림
        [0.40, 0.15, 0.50],  # i10 서산숲, i11, i12 동바위
        [0.40, 0.35, 0.15],  # i20 숲바위, i21 해안, i22 숲
    ],
    dtype=np.float32,
)


def load_mask(layers: dict, key: str, size: int) -> np.ndarray:
    raw = layers.get(key)
    if not raw:
        return np.zeros((size, size), dtype=np.uint8)
    b64 = raw.split(",", 1)[1] if isinstance(raw, str) and raw.startswith("data:") else raw
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
    if im.size != (size, size):
        im = im.resize((size, size), Image.NEAREST)
    return (np.array(im)[:, :, 3] > 20).astype(np.uint8)


def to_data_url(mask: np.ndarray) -> str:
    rgba = np.zeros((*mask.shape, 4), dtype=np.uint8)
    rgba[mask > 0] = [255, 255, 255, 255]
    buf = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or SIZE)
    layers = doc.get("layers") or {}

    land = load_mask(layers, "land", size)
    walk = load_mask(layers, "walk", size)
    rim = (land > 0) & (walk == 0)
    print(f"land%={land.mean()*100:.1f} walk%={walk.mean()*100:.1f} rim%={rim.mean()*100:.1f}")

    # land pixels: distance to sea (non-land)
    dist_to_sea = cv2.distanceTransform((land > 0).astype(np.uint8), cv2.DIST_L2, 5)
    # rim: distance to nearest walk pixel (EDT on non-walk → dist to walk)
    dist_to_walk = cv2.distanceTransform((walk == 0).astype(np.uint8), cv2.DIST_L2, 5)

    yy, xx = np.mgrid[0:size, 0:size]
    row = np.clip(yy // CELL, 0, 2)
    col = np.clip(xx // CELL, 0, 2)
    base = CELL_ROCK[row, col].copy()

    # outer coast → rock
    base += np.where(dist_to_sea < 18, 0.35, 0.0)
    base += np.where((dist_to_sea >= 18) & (dist_to_sea < 40), 0.15, 0.0)

    # i01 north tip
    base += np.where((row == 0) & (col == 1) & (yy < CELL * 0.35), 0.35, 0.0)
    # i21 coastal belt
    base += np.where((row == 2) & (col == 1) & (dist_to_sea < 28), 0.40, 0.0)
    base -= np.where((row == 2) & (col == 1) & (dist_to_sea >= 28), 0.10, 0.0)
    # i12 east cliff
    base += np.where((row == 1) & (col == 2) & (xx > CELL * 2 + CELL * 0.55), 0.25, 0.0)
    # i10 west wall
    base += np.where((row == 1) & (col == 0) & (xx < CELL * 0.45), 0.20, 0.0)
    # i00 mountain
    base += np.where((row == 0) & (col == 0), 0.10, 0.0)
    # near work zone: forest transition
    base -= np.where(dist_to_walk < 12, 0.15, 0.0)

    base = np.clip(base, 0.05, 0.92)

    rng = np.random.default_rng(20260823)
    noise = rng.random((size, size))
    rock = ((noise < base) & rim).astype(np.uint8)
    forest = (rim & (rock == 0)).astype(np.uint8)

    print(f"forest rim px={int(forest.sum())} rock rim px={int(rock.sum())}")

    prev = np.zeros((size, size, 3), dtype=np.uint8)
    prev[land > 0] = [36, 52, 48]
    prev[walk > 0] = [45, 200, 190]
    prev[forest > 0] = [40, 160, 70]
    prev[rock > 0] = [110, 95, 125]
    for i in (1, 2):
        prev[:, i * CELL] = [70, 90, 110]
        prev[i * CELL, :] = [70, 90, 110]
    Image.fromarray(prev, "RGB").save(PREVIEW)
    print(f"preview {PREVIEW}")

    bak = PATH.with_name("island_master.mask.json.bak_pre_phase1")
    bak.write_text(PATH.read_text(encoding="utf-8"), encoding="utf-8")

    doc["layers"] = {
        "land": layers["land"],
        "walk": layers["walk"],
        "forest": to_data_url(forest),
        "rock": to_data_url(rock),
    }
    doc["note"] = (
        "Phase1: land면 + walk작업구역 + 외곽(미니맵) forest/rock. "
        "Phase2에서 작업구역 안 막힘."
    )
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"saved {PATH} backup {bak.name}")


if __name__ == "__main__":
    main()
