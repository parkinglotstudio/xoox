#!/usr/bin/env python3
"""Lobby wanderer idle from one locked master.

AI frame-by-frame jitters the body. This keeps the master pose and only
breathes, blinks, pulses the flask glow, and nudges cream hair.

  python scripts/sprite_tool/lobby_idle_from_master.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(r"C:\xoox")
MASTER = ROOT / "data/ui/lobby/lobby_actor_front_mongchi.png"
WORK = Path(r"C:\수스이미지 생성") / "2026-08-29-lobby-idle"
COLS = 8
SHEET_NAME = "lobby_actor_front_mongchi_sheet.png"
JSON_NAME = "lobby_actor_front_mongchi.json"

# Locked on lobby_actor_front_mongchi.png (482x1020).
GLOWS = ((48, 528), (115, 803))
EYES = ((268, 247, 24, 18), (354, 245, 20, 16))
SKIN = (248, 214, 184, 255)
LASH = (48, 28, 16, 255)

DURATIONS = [480, 460, 500, 140, 280, 420, 480, 480]


def chroma_black(im: Image.Image, lum: int = 22) -> Image.Image:
    """Drop near-black studio fill; keep ink outlines inside the character."""
    arr = np.array(im.convert("RGBA"))
    r, g, b, a = [arr[:, :, i].astype(np.int16) for i in range(4)]
    fill = (a > 8) & ((r + g + b) <= lum * 3) & (np.maximum.reduce([r, g, b]) <= lum + 6)
    arr[fill, 3] = 0
    return Image.fromarray(arr)


def char_bbox(arr: np.ndarray) -> tuple[int, int, int, int]:
    a = arr[:, :, 3]
    lum = arr[:, :, 0].astype(np.int16) + arr[:, :, 1] + arr[:, :, 2]
    ys, xs = np.where((a > 20) & (lum > 40))
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def hair_mask(arr: np.ndarray, bbox: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = bbox
    r, g, b, a = [arr[:, :, i].astype(np.int16) for i in range(4)]
    cream = (a > 80) & (r > 175) & (g > 165) & (b > 130) & (np.abs(r - g) < 45)
    top = np.zeros(a.shape, dtype=bool)
    top[y0 : y0 + int((y1 - y0) * 0.26), x0:x1] = True
    return cream & top


def warp_hair(arr: np.ndarray, mask: np.ndarray, dx: float) -> np.ndarray:
    if abs(dx) < 0.05:
        return arr
    h, w = mask.shape
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return arr
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    out = arr.copy()
    src = arr.astype(np.float32)
    span = max(1, y1 - y0)
    for y in range(y0, y1):
        fall = 1.0 - (y - y0) / span
        shift = dx * fall * fall
        row_m = mask[y]
        if not row_m.any():
            continue
        x_from = np.arange(w, dtype=np.float32) - shift
        x0i = np.clip(np.floor(x_from).astype(np.int32), 0, w - 1)
        x1i = np.clip(x0i + 1, 0, w - 1)
        t = (x_from - x0i)[:, None]
        mixed = src[y, x0i] * (1 - t) + src[y, x1i] * t
        out[y, row_m] = np.clip(mixed[row_m], 0, 255).astype(np.uint8)
    return out


def add_glow(
    arr: np.ndarray,
    cx: int,
    cy: int,
    strength: float,
    body_rgb: tuple[float, float, float],
    leak_rgb: tuple[float, float, float],
    core_r: float,
    halo_r: float,
) -> np.ndarray:
    """Pulse on the prop, then spill into nearby air so it reads on the dock."""
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    d2 = (xx - cx) ** 2 + (yy - cy) ** 2
    core = np.clip(1.0 - d2 / (core_r ** 2), 0, 1) ** 1.25
    halo = np.clip(1.0 - d2 / (halo_r ** 2), 0, 1) ** 1.55
    a = arr[:, :, 3].astype(np.float32) / 255.0
    air = np.clip(1.0 - a, 0, 1)
    out = arr.astype(np.float32)
    pulse = strength * core * a
    body = strength * halo * a
    spill = strength * halo * air
    out[:, :, 0] = np.clip(out[:, :, 0] + pulse * body_rgb[0] + body * leak_rgb[0] * 0.45, 0, 255)
    out[:, :, 1] = np.clip(out[:, :, 1] + pulse * body_rgb[1] + body * leak_rgb[1] * 0.45, 0, 255)
    out[:, :, 2] = np.clip(out[:, :, 2] + pulse * body_rgb[2] + body * leak_rgb[2] * 0.45, 0, 255)
    out[:, :, 0] = np.clip(out[:, :, 0] + spill * leak_rgb[0], 0, 255)
    out[:, :, 1] = np.clip(out[:, :, 1] + spill * leak_rgb[1], 0, 255)
    out[:, :, 2] = np.clip(out[:, :, 2] + spill * leak_rgb[2], 0, 255)
    out[:, :, 3] = np.clip(out[:, :, 3] + spill * 165, 0, 255)
    hot = np.clip(1.0 - d2 / ((core_r * 0.38) ** 2), 0, 1) ** 1.1 * strength * a
    out[:, :, 0] = np.clip(out[:, :, 0] + hot * 48, 0, 255)
    out[:, :, 1] = np.clip(out[:, :, 1] + hot * 36, 0, 255)
    out[:, :, 2] = np.clip(out[:, :, 2] + hot * 16, 0, 255)
    return out.astype(np.uint8)


def draw_blink(im: Image.Image, amount: float) -> Image.Image:
    """amount 0..1 — 1 is fully closed lids."""
    out = im.copy()
    d = ImageDraw.Draw(out)
    for cx, cy, rx, ry in EYES:
        shut = max(3, int(round(ry * (0.35 + 0.65 * amount))))
        d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=SKIN)
        if amount < 0.55:
            d.ellipse((cx - rx + 3, cy - 2, cx + rx - 3, cy + ry - 2), fill=(62, 38, 24, 255))
        d.arc((cx - rx, cy - 8, cx + rx, cy + shut + 6), start=12, end=168, fill=LASH, width=4)
    return out


def breathe(im: Image.Image, bbox: tuple[int, int, int, int], scale: float) -> Image.Image:
    if abs(scale - 1.0) < 0.001:
        return im
    x0, y0, x1, y1 = bbox
    crop = im.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    nh = max(1, int(round(ch * scale)))
    scaled = crop.resize((cw, nh), Image.Resampling.BICUBIC)
    canvas = Image.new("RGBA", im.size, (0, 0, 0, 0))
    canvas.paste(im, (0, 0))
    # clear old char, keep feet pinned
    blank = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(blank, (x0, y0))
    canvas.alpha_composite(scaled, (x0, y1 - nh))
    return canvas


def build_frames(master: Image.Image) -> list[Image.Image]:
    keyed = chroma_black(master)
    base = np.array(keyed)
    bbox = char_bbox(base)
    hmask = hair_mask(base, bbox)
    frames: list[Image.Image] = []
    for i in range(COLS):
        t = i / COLS * np.pi * 2
        breath = 1.0 + 0.008 * np.sin(t)
        hair_dx = 5.0 * np.sin(t + 0.35)
        glow = 0.55 + 1.15 * (0.5 + 0.5 * np.sin(t * 1.2 + 0.15))
        arr = warp_hair(base.copy(), hmask, hair_dx)
        # teal gourd: cyan leak. handheld lantern: warm orange leak.
        arr = add_glow(arr, GLOWS[0][0], GLOWS[0][1], glow, (90, 220, 230), (15, 190, 199), 22, 78)
        arr = add_glow(arr, GLOWS[1][0], GLOWS[1][1], glow, (255, 170, 40), (255, 120, 24), 28, 86)
        im = Image.fromarray(arr)
        if i == 3:
            im = draw_blink(im, 0.45)
        elif i == 4:
            im = draw_blink(im, 1.0)
        im = breathe(im, bbox, float(breath))
        frames.append(im)
    return frames


def pack_sheet(frames: list[Image.Image]) -> Image.Image:
    fw, fh = frames[0].size
    sheet = Image.new("RGBA", (fw * COLS, fh), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (i * fw, 0), fr)
    return sheet


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    frames_dir = WORK / "frames"
    frames_dir.mkdir(exist_ok=True)
    master = Image.open(MASTER)
    frames = build_frames(master)
    for i, fr in enumerate(frames):
        p = frames_dir / f"lobby_actor_idle_{i:02d}.png"
        fr.save(p)
        print("wrote", p)
    sheet = pack_sheet(frames)
    sheet_path = WORK / SHEET_NAME
    sheet.save(sheet_path)
    spec = {
        "id": "lobby_actor_idle",
        "sheet": SHEET_NAME,
        "cell_w": frames[0].size[0],
        "cell_h": frames[0].size[1],
        "cols": COLS,
        "rows": 1,
        "frame_count": COLS,
        "loop": True,
        "pivot": "bottom-center",
        "frames": [{"index": i, "duration_ms": DURATIONS[i]} for i in range(COLS)],
    }
    (WORK / JSON_NAME).write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print("sheet", sheet_path, sheet.size)


if __name__ == "__main__":
    main()
