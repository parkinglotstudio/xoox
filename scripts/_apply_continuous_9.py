"""Build continuous after from mask + v5 art, crop to 9, apply to journey."""
from __future__ import annotations

import base64
import io
import json
import shutil
import time
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEN = Path(r"C:\수스이미지 생성\map_pipeline")
JOURNEY = ROOT / "data" / "ui" / "journey"
ASSETS = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets")
MASK = ROOT / "data" / "map_mask_tool" / "master" / "island_master.mask.json"
BAK = JOURNEY / "_bak_pre_v5_continuous"
BAK.mkdir(exist_ok=True)
OUT_SZ = 2048


def load_layer(layers: dict, key: str, size: int) -> np.ndarray:
    raw = layers.get(key)
    if not raw:
        return np.zeros((size, size), np.uint8)
    b64 = raw.split(",", 1)[1]
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
    if im.size != (size, size):
        im = im.resize((size, size), Image.NEAREST)
    return (np.asarray(im)[:, :, 3] > 20).astype(np.uint8)


def veil(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGB"), dtype=np.float32)
    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    gray = 0.3 * r + 0.59 * g + 0.11 * b
    nr = (gray * 0.55 + r * 0.45) * 0.72 + 40 * 0.28
    ng = (gray * 0.55 + g * 0.45) * 0.72 + 90 * 0.28
    nb = (gray * 0.55 + b * 0.45) * 0.72 + 110 * 0.28
    nr *= 0.82
    ng *= 0.85
    nb *= 0.9
    o = np.stack([nr, ng, nb], 2).clip(0, 255).astype(np.uint8)
    h, w = o.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.sqrt(((yy - h / 2) / (h * 0.55)) ** 2 + ((xx - w / 2) / (w * 0.55)) ** 2)
    fog = np.clip((dist - 0.35) / 0.9, 0, 1)[..., None]
    fog_col = np.array([12, 40, 55], np.float32)
    o = (o.astype(np.float32) * (1 - 0.4 * fog) + fog_col * (0.4 * fog)).clip(0, 255).astype(np.uint8)
    return Image.fromarray(o, "RGB")


def safe_save(im: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    im.save(tmp, "PNG")
    for _ in range(10):
        try:
            if path.exists():
                path.unlink()
            tmp.replace(path)
            return
        except OSError:
            time.sleep(0.5)
    alt = path.with_name(path.stem + "_new.png")
    tmp.replace(alt)
    print("locked ->", alt)


def main() -> None:
    doc = json.loads(MASK.read_text(encoding="utf-8"))
    size = int(doc.get("size") or 1536)
    cell = size // 3
    layers = doc["layers"]
    land = load_layer(layers, "land", size)
    forest = load_layer(layers, "forest", size)
    rock = load_layer(layers, "rock", size)
    flower = load_layer(layers, "flower", size)
    lake = load_layer(layers, "lake", size)
    pond = load_layer(layers, "pond", size)
    path = load_layer(layers, "path", size)

    base = np.zeros((size, size, 3), np.float32)
    base[:, :] = (18, 28, 55)
    base[land > 0] = (70, 100, 55)
    base[flower > 0] = (200, 170, 90)
    base[forest > 0] = (40, 120, 55)
    base[rock > 0] = (100, 95, 110)
    base[lake > 0] = (45, 120, 200)
    base[pond > 0] = (70, 150, 210)
    base[path > 0] = base[path > 0] * 0.7 + np.array([110, 130, 100], np.float32) * 0.3

    src = ASSETS / "after_island_master_v5_continuous.png"
    if not src.exists():
        src = GEN / "after_island_master_v5_continuous.png"
    art = np.asarray(Image.open(src).convert("RGB").resize((size, size), Image.LANCZOS), dtype=np.float32)
    b, g, r = art[:, :, 2], art[:, :, 1], art[:, :, 0]
    seaish = (b > r + 25) & (b > g + 15) & (b > 90)
    use = (land > 0) & (~seaish)
    out = base.copy()
    out[use] = art[use]
    out[land == 0] = (18, 28, 55)
    img = Image.fromarray(out.clip(0, 255).astype(np.uint8), "RGB")
    GEN.mkdir(parents=True, exist_ok=True)
    img.save(GEN / "after_island_master_v5_continuous.png")
    print("master continuous saved", GEN)

    for row in range(3):
        for col in range(3):
            sid = f"i{row}{col}"
            crop = img.crop((col * cell, row * cell, (col + 1) * cell, (row + 1) * cell))
            crop = crop.resize((OUT_SZ, OUT_SZ), Image.LANCZOS)
            before = veil(crop)
            crop.save(GEN / f"after_{sid}.png")
            before.save(GEN / f"before_{sid}.png")
            for name, im in (
                (f"sector_{sid}_after.png", crop),
                (f"sector_{sid}_before.png", before),
                (f"journey_tile_{sid}_after.png", crop),
                (f"journey_tile_{sid}_before.png", before),
            ):
                dst = JOURNEY / name
                if dst.exists() and not (BAK / name).exists():
                    try:
                        shutil.copy2(dst, BAK / name)
                    except OSError:
                        pass
                safe_save(im, dst)
            print("cell", sid)

    ov = img.resize((2048, 2048), Image.LANCZOS)
    safe_save(ov, JOURNEY / "island_overview_1km.png")
    safe_save(ov, JOURNEY / "journey_island_master_after.png")
    safe_save(veil(ov), JOURNEY / "journey_island_master_before_concept.png")
    ov.save(GEN / "after_island_overview_continuous.png")
    print("DONE")


if __name__ == "__main__":
    main()
