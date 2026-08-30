"""Convert 걷기.gif into a clean rear-run sprite sheet. No old AI frames."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(r"C:\xoox")
ENGINE_PY = ROOT / "scripts/sprite_tool/sprite_engine.py"
USER = Path(r"C:\수스이미지 생성") / "xoox_wanderer_20260822"
BACKUP = ROOT / "docs/art/sprites/wanderer/_gen_backup/2026-08-22"
CELL = 512

JOBS: dict[str, dict[str, Path | str]] = {
    "move": {
        "gif": Path(r"C:\Users\dmaxd\Downloads\걷기.gif"),
        "clean": ROOT / "docs/art/sprites/wanderer/ingame/move/gif_clean",
        "game": ROOT / "data/ui/actor/wanderer/move",
        "backup_name": "move_sheet_from_gif.png",
    },
    "ingame_idle": {
        "gif": Path(r"C:\Users\dmaxd\Downloads\아이들.gif"),
        "clean": ROOT / "docs/art/sprites/wanderer/ingame/ingame_idle/gif_clean",
        "game": ROOT / "data/ui/actor/wanderer/ingame_idle",
        "backup_name": "ingame_idle_sheet_from_gif.png",
    },
}


def load_gif(path: Path) -> tuple[list[Image.Image], list[int]]:
    """Load GIF frames with disposal compositing so later frames stay whole."""
    im = Image.open(path)
    w, h = im.size
    canvas = Image.new("RGBA", (w, h))
    frames: list[Image.Image] = []
    durs: list[int] = []
    for i in range(getattr(im, "n_frames", 1)):
        im.seek(i)
        durs.append(max(16, int(im.info.get("duration") or 80)))
        overlay = im.convert("RGBA")
        dispose = int(getattr(im, "disposal_method", 0) or 0)
        canvas = Image.alpha_composite(canvas, overlay)
        frames.append(canvas.copy())
        if dispose == 2:
            canvas = Image.new("RGBA", (w, h))
    return frames, durs


def _largest_component(mask: np.ndarray) -> np.ndarray:
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return mask
    best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return np.where(labels == best, 255, 0).astype(np.uint8)


def _keep_body_and_feet(mask: np.ndarray) -> np.ndarray:
    """Largest blob plus boots that chroma split off below the torso."""
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return mask
    best = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = (int(stats[best, k]) for k in (
        cv2.CC_STAT_LEFT, cv2.CC_STAT_TOP, cv2.CC_STAT_WIDTH, cv2.CC_STAT_HEIGHT,
    ))
    out = np.where(labels == best, 255, 0).astype(np.uint8)
    for i in range(1, n):
        if i == best:
            continue
        ai = int(stats[i, cv2.CC_STAT_AREA])
        if ai < 60:
            continue
        xi = int(stats[i, cv2.CC_STAT_LEFT])
        yi = int(stats[i, cv2.CC_STAT_TOP])
        wi = int(stats[i, cv2.CC_STAT_WIDTH])
        hi = int(stats[i, cv2.CC_STAT_HEIGHT])
        cx = xi + wi / 2
        if x - 24 <= cx <= x + w + 24 and (yi + hi) >= y + int(h * 0.55):
            out[labels == i] = 255
    return out


def _right_leg_score(im: Image.Image) -> int:
    bb = im.getbbox()
    if not bb:
        return 0
    x0, y0, x1, y1 = bb
    a = np.array(im)
    mx = (x0 + x1) // 2
    y_a = y0 + int((y1 - y0) * 0.56)
    y_b = y0 + int((y1 - y0) * 0.82)
    return int((a[y_a:y_b, mx:x1, 3] > 0).sum())


def repair_idle_legs(frames: list[Image.Image]) -> list[Image.Image]:
    """Idle feet barely move — copy a good frame's calf onto frames that lost it."""
    scores = [_right_leg_score(f) for f in frames]
    donor_i = int(max(range(len(scores)), key=lambda i: scores[i]))
    best = scores[donor_i]
    if best < 80:
        return frames
    donor = np.array(frames[donor_i])
    bb = frames[donor_i].getbbox()
    if not bb:
        return frames
    x0, y0, x1, y1 = bb
    mx = (x0 + x1) // 2
    y_a = y0 + int((y1 - y0) * 0.54)
    y_b = y0 + int((y1 - y0) * 0.88)
    r, g, b = donor[:, :, 0].astype(np.int16), donor[:, :, 1].astype(np.int16), donor[:, :, 2].astype(np.int16)
    olive = (g > r + 12) & (g > b + 10) & (g > 70)
    donor_leg = (donor[:, :, 3] > 0) & ~olive
    donor_leg[:y_a, :] = False
    donor_leg[y_b:, :] = False
    donor_leg[:, :mx] = False
    out: list[Image.Image] = []
    for i, im in enumerate(frames):
        if scores[i] >= best * 0.94:
            out.append(im)
            continue
        arr = np.array(im)
        missing = donor_leg & (arr[:, :, 3] == 0)
        arr[missing] = donor[missing]
        out.append(Image.fromarray(arr))
        print("idle calf repair", i, "score", scores[i], "<-", donor_i, best)
    return out


def isolate(rgba: Image.Image) -> Image.Image:
    """Key border-connected chroma only. Fill interior holes that are not the screen."""
    arr = np.array(rgba)
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    key = np.array(
        [int(arr[8, 8, 0]), int(arr[8, 8, 1]), int(arr[8, 8, 2])],
        dtype=np.int16,
    )
    dist = np.abs(r - key[0]) + np.abs(g - key[1]) + np.abs(b - key[2])
    seeds = np.where(dist <= 80, 255, 0).astype(np.uint8)
    n, labels = cv2.connectedComponents(seeds, connectivity=8)
    border = set(labels[0].tolist()) | set(labels[-1].tolist()) | set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    bg = np.isin(labels, list(border - {0}))
    near = (dist <= 115) & (g > r + 10) & (g > b + 8)
    bg_u8 = (bg.astype(np.uint8) * 255)
    kernel = np.ones((3, 3), np.uint8)
    for _ in range(3):
        grow = (cv2.dilate(bg_u8, kernel) > 0) & near & ~bg
        if not np.any(grow):
            break
        bg = bg | grow
        bg_u8 = (bg.astype(np.uint8) * 255)
    keep = np.where(bg, 0, 255).astype(np.uint8)
    keep = _keep_body_and_feet(keep)
    void = np.where(keep > 0, 0, 255).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(void, connectivity=8)
    border_ids = set(labels[0].tolist()) | set(labels[-1].tolist()) | set(labels[:, 0].tolist()) | set(labels[:, -1].tolist())
    for i in range(1, n):
        if i in border_ids:
            continue
        pix = labels == i
        # crotch leftover is still screen-green; backpack/hair/leaf holes are not
        if float(dist[pix].mean()) > 42:
            keep[pix] = 255
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, kernel)
    keep = _keep_body_and_feet(keep)
    ys = np.where(keep > 0)[0]
    if len(ys):
        y0, y1 = int(ys.min()), int(ys.max())
        band = y0 + int((y1 - y0) * 0.90)
        shadow = (
            (keep > 0)
            & (np.arange(keep.shape[0])[:, None] >= band)
            & (g > r + 18)
            & (g > b + 12)
            & (r < 45)
        )
        keep[shadow] = 0
        keep = _keep_body_and_feet(keep)

    out = arr.copy()
    out[:, :, 3] = keep
    eroded = cv2.erode(keep, kernel, iterations=1)
    rim = (keep > 0) & (eroded == 0)
    spill = rim & (g > r + 8) & (g > b + 8)
    if np.any(spill):
        fixed = np.minimum(out[:, :, 1], np.maximum(out[:, :, 0], out[:, :, 2]))
        out[:, :, 1] = np.where(spill, fixed, out[:, :, 1])
    return Image.fromarray(out)


def shared_foot_box(images: list[Image.Image]) -> tuple[int, int, int, int]:
    boxes = [im.getbbox() for im in images if im.getbbox()]
    if not boxes:
        return (0, 0, 1, 1)
    widths = sorted(b[2] - b[0] for b in boxes)
    med_w = widths[len(widths) // 2]
    boxes = [b for b in boxes if (b[2] - b[0]) <= med_w * 1.35] or boxes
    x0 = min(b[0] for b in boxes)
    y0 = min(b[1] for b in boxes)
    x1 = max(b[2] for b in boxes)
    y1 = max(b[3] for b in boxes)
    pad = 8
    return max(0, x0 - pad), max(0, y0 - pad), x1 + pad, y1 + pad


def to_cell(im: Image.Image, box: tuple[int, int, int, int], cell: int = CELL) -> Image.Image:
    crop = im.crop(box)
    cw, ch = crop.size
    scale = min((cell * 0.92) / max(1, cw), (cell * 0.92) / max(1, ch))
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    crop = crop.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    x = (cell - nw) // 2
    y = cell - nh - 6
    canvas.paste(crop, (x, y), crop)
    return canvas


def pack_job(
    anim_id: str,
    cleaned: list[Image.Image],
    durs: list[int],
    box: tuple[int, int, int, int],
) -> None:
    job = JOBS[anim_id]
    clean = Path(job["clean"])
    game = Path(job["game"])
    clean.mkdir(parents=True, exist_ok=True)
    cells: list[Path] = []
    for i, im in enumerate(cleaned):
        cell = to_cell(im, box)
        p = clean / f"{i:02d}.png"
        cell.save(p)
        cells.append(p)
        print(anim_id, "frame", i, "bbox", im.getbbox(), "dur", durs[i])
    cmd = [
        sys.executable,
        str(ENGINE_PY),
        "build",
        "--char",
        "wanderer",
        "--id",
        anim_id,
        "--cell",
        str(CELL),
        "--pivot",
        "bottom-center",
        "--bg",
        "none",
        "--duration-ms",
        str(durs[0]),
        "--durations",
        ",".join(str(d) for d in durs),
        "--preview",
        "--frames",
        *[str(p) for p in cells],
    ]
    subprocess.run(cmd, check=True, cwd=ROOT)
    src_sheet = ROOT / f"docs/art/sprites/wanderer/engine/{anim_id}/{anim_id}_sheet.png"
    src_json = ROOT / f"docs/art/sprites/wanderer/engine/{anim_id}/{anim_id}.json"
    game.mkdir(parents=True, exist_ok=True)
    data = json.loads(src_json.read_text(encoding="utf-8"))
    sheet_name = f"{anim_id}_sheet.png"
    dest = game / sheet_name
    payload = src_sheet.read_bytes()
    try:
        dest.write_bytes(payload)
    except OSError:
        sheet_name = f"{anim_id}_sheet_gif.png"
        dest = game / sheet_name
        dest.write_bytes(payload)
    data["sheet"] = sheet_name
    (game / f"{anim_id}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    for root in (USER, BACKUP):
        root.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_sheet, root / str(job["backup_name"]))
    print("game", game / f"{anim_id}_sheet.png")


def isolate_gif(gif: Path) -> tuple[list[Image.Image], list[int]]:
    raw, durs = load_gif(gif)
    return [isolate(f) for f in raw], durs


def main() -> None:
    ids = ["move", "ingame_idle"]
    prepared: dict[str, tuple[list[Image.Image], list[int]]] = {}
    for anim_id in ids:
        gif = Path(JOBS[anim_id]["gif"])
        if not gif.exists():
            raise SystemExit(f"missing gif: {gif}")
        cleaned, durs = isolate_gif(gif)
        if anim_id == "ingame_idle":
            cleaned = repair_idle_legs(cleaned)
        box = shared_foot_box(cleaned)
        prepared[anim_id] = (cleaned, durs)
        print(anim_id, "frames", len(cleaned), "box", box)
        pack_job(anim_id, cleaned, durs, box)
    subprocess.run([sys.executable, str(ENGINE_PY), "studio", "--char", "wanderer"], check=True, cwd=ROOT)


if __name__ == "__main__":
    main()
