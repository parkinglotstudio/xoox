"""Phase 0: fill land interior from outline; keep walk; clear other layers."""
from __future__ import annotations

import base64
import io
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "data" / "map_mask_tool" / "master" / "island_master.mask.json"
PREVIEW = ROOT / "data" / "map_mask_tool" / "master" / "island_master_phase0_preview.png"


def main() -> None:
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    size = int(doc.get("size") or 1536)
    layers = doc.get("layers") or {}

    def load_layer(key: str) -> np.ndarray:
        raw = layers.get(key)
        if not raw:
            return np.zeros((size, size), dtype=np.uint8)
        b64 = raw.split(",", 1)[1] if isinstance(raw, str) and raw.startswith("data:") else raw
        im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
        if im.size != (size, size):
            im = im.resize((size, size), Image.NEAREST)
        a = np.array(im)[:, :, 3]
        return (a > 20).astype(np.uint8)

    def to_data_url(mask_u8: np.ndarray) -> str:
        rgba = np.zeros((size, size, 4), dtype=np.uint8)
        rgba[mask_u8 > 0] = [255, 255, 255, 255]
        buf = io.BytesIO()
        Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    land = load_layer("land")
    walk = load_layer("walk")
    print(f"before land%={land.mean()*100:.2f} walk%={walk.mean()*100:.2f}")

    exterior = np.zeros_like(land)
    q: deque[tuple[int, int]] = deque()
    h, w = size, size
    for x in range(w):
        for y in (0, h - 1):
            if land[y, x] == 0 and exterior[y, x] == 0:
                exterior[y, x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if land[y, x] == 0 and exterior[y, x] == 0:
                exterior[y, x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and exterior[ny, nx] == 0 and land[ny, nx] == 0:
                exterior[ny, nx] = 1
                q.append((nx, ny))

    filled = (1 - exterior).astype(np.uint8)
    print(f"after land%={filled.mean()*100:.2f} filled_px={int(filled.sum())}")

    prev = np.zeros((size, size, 3), dtype=np.uint8)
    prev[filled > 0] = [42, 74, 64]
    prev[walk > 0] = [45, 224, 208]
    cell = size // 3
    for i in (1, 2):
        prev[:, i * cell] = [80, 120, 140]
        prev[i * cell, :] = [80, 120, 140]
    Image.fromarray(prev, "RGB").save(PREVIEW)
    print(f"preview {PREVIEW}")

    bak = PATH.with_suffix(".mask.json.bak_pre_fill")
    bak.write_text(PATH.read_text(encoding="utf-8"), encoding="utf-8")

    doc["layers"] = {"land": to_data_url(filled), "walk": to_data_url(walk)}
    doc["note"] = (
        "Phase0: land=면채움, walk=작업구역(타일). "
        "구역 레이어는 Phase1+에서. 밖=미니맵·숲/산."
    )
    PATH.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"saved {PATH}")
    print(f"backup {bak}")


if __name__ == "__main__":
    main()
