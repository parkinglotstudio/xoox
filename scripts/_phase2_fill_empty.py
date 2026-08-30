import base64
import io
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

p = Path(r"C:\xoox\data\map_mask_tool\master\island_master.mask.json")
doc = json.loads(p.read_text(encoding="utf-8"))
size = 1536


def load(k: str) -> np.ndarray:
    raw = doc["layers"].get(k)
    if not raw:
        return np.zeros((size, size), np.uint8)
    b64 = raw.split(",", 1)[1]
    im = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")
    return (np.asarray(im)[:, :, 3] > 20).astype(np.uint8)


def save(k: str, m: np.ndarray) -> None:
    rgba = np.zeros((size, size, 4), np.uint8)
    rgba[m > 0] = 255
    buf = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buf, format="PNG")
    doc["layers"][k] = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


land, walk, path, node = load("land"), load("walk"), load("path"), load("node")
forest, rock, field = load("forest"), load("rock"), load("flower")
lake, pond = load("lake"), load("pond")
wz = (walk > 0) & (land > 0)
covered = (path > 0) | (node > 0) | (forest > 0) | (rock > 0) | (field > 0) | (lake > 0) | (pond > 0)
empty = wz & ~covered
print("empty wz", int(empty.sum()))
field[empty] = 1
for m in (forest, rock, field, lake, pond):
    m[path > 0] = 0

prev = np.zeros((size, size, 3), np.uint8)
prev[land > 0] = [12, 14, 18]
prev[wz] = [22, 28, 32]
prev[forest > 0] = [28, 125, 52]
prev[rock > 0] = [100, 85, 120]
prev[field > 0] = [48, 42, 38]
prev[lake > 0] = [35, 105, 205]
prev[pond > 0] = [60, 145, 225]
glow = cv2.dilate(path, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
prev[glow > 0] = [10, 55, 60]
prev[path > 0] = [90, 255, 250]
prev[node > 0] = [255, 70, 220]
for i in (1, 2):
    prev[:, i * 512] = [50, 60, 80]
    prev[i * 512, :] = [50, 60, 80]
Image.fromarray(prev, "RGB").save(
    r"C:\xoox\data\map_mask_tool\master\island_master_phase2_preview.png"
)

save("flower", field)
save("forest", forest)
save("rock", rock)
save("lake", lake)
save("pond", pond)
doc["note"] = "Phase2 neon hub+curved paths+nodes; empty wz filled as field."
p.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("done field", int(field.sum()))
