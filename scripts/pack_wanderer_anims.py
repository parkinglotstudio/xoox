"""Pack wanderer back-view anims into sprite engine + game actor folder."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets")
IDLE_GUN = ROOT / "data/ui/actor/wanderer/ingame_idle/ingame_idle_gun.png"
SPRITES = ROOT / "docs/art/sprites/wanderer"
ENGINE = SPRITES / "engine"
AI = SPRITES / "ingame"
GAME = ROOT / "data/ui/actor/wanderer"
USER = Path(r"C:\수스이미지 생성") / "xoox_wanderer_20260822"
BACKUP = SPRITES / "_gen_backup" / "2026-08-22"
PY = sys.executable
ENGINE_PY = ROOT / "scripts/sprite_tool/sprite_engine.py"


def punch_black(im: Image.Image) -> Image.Image:
    try:
        import numpy as np

        arr = np.array(im.convert("RGBA"))
        rgb = arr[:, :, :3].astype("int16")
        black = (rgb[:, :, 0] < 28) & (rgb[:, :, 1] < 28) & (rgb[:, :, 2] < 28)
        arr[black, 3] = 0
        return Image.fromarray(arr)
    except Exception:
        r, g, b, a = im.convert("RGBA").split()
        keep = Image.eval(r, lambda v: 255 if v >= 28 else 0)
        keep = ImageChops.multiply(keep, Image.eval(g, lambda v: 255 if v >= 28 else 0))
        keep = ImageChops.multiply(keep, Image.eval(b, lambda v: 255 if v >= 28 else 0))
        return Image.merge("RGBA", (r, g, b, ImageChops.multiply(a, keep)))


def square_cell(im: Image.Image, cell: int = 512) -> Image.Image:
    cut = punch_black(im)
    bbox = cut.getbbox()
    if not bbox:
        raise SystemExit("empty frame")
    char = cut.crop(bbox)
    canvas = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    scale = min((cell * 0.9) / char.size[0], (cell * 0.9) / char.size[1])
    nw, nh = max(1, int(char.size[0] * scale)), max(1, int(char.size[1] * scale))
    char = char.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (cell - nw) // 2
    y = cell - nh - 8
    canvas.paste(char, (x, y), char)
    return canvas


def collect(src: Path, name: str) -> None:
    for root in (USER, BACKUP):
        root.mkdir(parents=True, exist_ok=True)
        if src.exists():
            shutil.copy2(src, root / name)


def idle5(master_path: Path, dest: Path) -> list[Path]:
    dest.mkdir(parents=True, exist_ok=True)
    base = square_cell(Image.open(master_path))
    specs = [
        ("00_rest", 0, 0, 0.0),
        ("01_in", 0, -6, 0.0),
        ("02_out", 0, 5, 0.0),
        ("03_left", -3, -2, -1.1),
        ("04_right", 3, -2, 1.1),
    ]
    out: list[Path] = []
    for name, dx, dy, rot in specs:
        fr = base.copy()
        if rot:
            fr = fr.rotate(rot, resample=Image.Resampling.BICUBIC, center=(256, 420))
        if dx or dy:
            shifted = Image.new("RGBA", fr.size, (0, 0, 0, 0))
            shifted.paste(fr, (dx, dy), fr)
            fr = shifted
        p = dest / f"{name}.png"
        fr.save(p)
        out.append(p)
    return out


def copy_src(src: Path, dest_dir: Path, name: str) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    im = square_cell(Image.open(src))
    p = dest_dir / name
    im.save(p)
    collect(src, src.name)
    return p


def build(anim_id: str, frames: list[Path], duration_ms: int, durations: str | None = None) -> None:
    cmd = [
        PY,
        str(ENGINE_PY),
        "build",
        "--char",
        "wanderer",
        "--id",
        anim_id,
        "--cell",
        "512",
        "--pivot",
        "bottom-center",
        "--bg",
        "none",
        "--duration-ms",
        str(duration_ms),
        "--preview",
        "--frames",
        *[str(p) for p in frames],
    ]
    if durations:
        cmd.extend(["--durations", durations])
    print(" ".join(cmd))
    subprocess.run(cmd, check=True, cwd=ROOT)


def copy_engine_to_game() -> None:
    GAME.mkdir(parents=True, exist_ok=True)
    for d in ENGINE.iterdir():
        if not d.is_dir() or d.name.startswith("_"):
            continue
        man = d / f"{d.name}.json"
        sheet = d / f"{d.name}_sheet.png"
        if not man.is_file() or not sheet.is_file():
            continue
        out = GAME / d.name
        out.mkdir(parents=True, exist_ok=True)
        shutil.copy2(man, out / f"{d.name}.json")
        shutil.copy2(sheet, out / f"{d.name}_sheet.png")
        data = json.loads(man.read_text(encoding="utf-8"))
        data["sheet"] = f"{d.name}_sheet.png"
        (out / f"{d.name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    hyanga = ROOT / "docs/art/sprites/hyanga/engine"
    idle_ai = AI / "ingame_idle" / "frames_ai"
    move_ai = AI / "move" / "frames_ai"
    walk_ai = AI / "walk_gun" / "frames_ai"
    aim_ai = AI / "aim_fire" / "frames_ai"
    draw_ai = AI / "draw_holster" / "frames_ai"

    idle_frames = idle5(IDLE_GUN, idle_ai)
    run_a = ROOT / "data/ui/actor/wanderer/move/run_right_fwd.png"
    run_b = ROOT / "data/ui/actor/wanderer/move/run_left_fwd.png"
    a = copy_src(run_a, move_ai, "00_run_a.png")
    b = copy_src(run_b, move_ai, "01_run_b.png")
    wa = copy_src(ASSETS / "wanderer_walk_gun_a.png", walk_ai, "00_walk_a.png")
    wb = copy_src(ASSETS / "wanderer_walk_gun_b.png", walk_ai, "01_walk_b.png")
    aim = copy_src(ASSETS / "wanderer_aim_fire.png", aim_ai, "00_aim.png")
    draw = copy_src(ASSETS / "wanderer_draw_mid.png", draw_ai, "00_mid.png")

    build("ingame_idle", idle_frames, 180, "420,180,180,180,180")
    build("move", [a, b, a, b], 140)
    build("walk_gun", [wa, wb], 180)
    build("aim_fire", [aim], 220)
    build("draw_holster", [draw], 200)

    subprocess.run([PY, str(ENGINE_PY), "studio", "--char", "wanderer"], check=True, cwd=ROOT)
    for name in ("align.html", "scale.html"):
        src = hyanga / name
        if src.is_file():
            shutil.copy2(src, ENGINE / name)
    copy_engine_to_game()
    print("ok", ENGINE)


if __name__ == "__main__":
    main()
