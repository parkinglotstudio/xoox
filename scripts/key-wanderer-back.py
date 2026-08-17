"""방랑자 뒷모습 스프라이트 — 마젠타 키잉 + 매니페스트 생성."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ASSETS = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets")
ROOT = Path(r"C:\xoox\data\ui\actor\wanderer")

MAGENTA = (255, 0, 255)
# 가장자리 안티앨리어스까지 걷어낼 거리. 옷·머리색과 겹치지 않게 넉넉히.
HARD = 55.0
SOFT = 95.0


def key_magenta(src: Image.Image) -> Image.Image:
    img = src.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            dist = ((r - MAGENTA[0]) ** 2 + (g - MAGENTA[1]) ** 2 + (b - MAGENTA[2]) ** 2) ** 0.5
            if dist <= HARD:
                px[x, y] = (r, g, b, 0)
            elif dist < SOFT:
                fade = (dist - HARD) / (SOFT - HARD)
                px[x, y] = (r, g, b, int(a * fade))
    return img


def crop_alpha(img: Image.Image, pad: int) -> Image.Image:
    box = img.getbbox()
    if not box:
        return img
    l, t, r, b = box
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    return img.crop((l, t, r, b))


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG")
    print(f"wrote {path} {img.size}")


def write_manifest(path: Path, sheet: str, cols: int, rows: int, count: int, ms: int) -> None:
    data = {
        "id": path.stem,
        "cols": cols,
        "rows": rows,
        "frame_count": count,
        "sheet": sheet,
        "loop": True,
        "frames": [{"index": i, "duration_ms": ms} for i in range(count)],
    }
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {path}")


def main() -> None:
    idle = crop_alpha(key_magenta(Image.open(ASSETS / "wanderer_back_idle.png")), 16)
    # 3인칭에서 너무 크면 화면을 덮으므로 긴 변 768로 줄인다
    scale = 768 / max(idle.size)
    if scale < 1:
        idle = idle.resize((round(idle.width * scale), round(idle.height * scale)), Image.Resampling.LANCZOS)
    idle_dir = ROOT / "ingame_idle"
    save_png(idle, idle_dir / "ingame_idle_sheet.png")
    write_manifest(idle_dir / "ingame_idle.json", "ingame_idle_sheet.png", 1, 1, 1, 1000)

    walk = key_magenta(Image.open(ASSETS / "wanderer_back_walk.png"))
    # 4칸 가로 시트 — 칸마다 잘라 여백을 맞춘 뒤 다시 붙인다
    cols = 4
    cell_w = walk.width // cols
    frames: list[Image.Image] = []
    for i in range(cols):
        cell = crop_alpha(walk.crop((i * cell_w, 0, (i + 1) * cell_w, walk.height)), 8)
        frames.append(cell)
    max_w = max(f.width for f in frames)
    max_h = max(f.height for f in frames)
    # 발 위치를 맞추려고 아래 정렬
    sheet = Image.new("RGBA", (max_w * cols, max_h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        x = i * max_w + (max_w - f.width) // 2
        y = max_h - f.height
        sheet.paste(f, (x, y), f)
    scale = 512 / max(sheet.height, 1)
    if scale < 1:
        sheet = sheet.resize((round(sheet.width * scale), round(sheet.height * scale)), Image.Resampling.LANCZOS)
    move_dir = ROOT / "move"
    save_png(sheet, move_dir / "move_sheet.png")
    write_manifest(move_dir / "move.json", "move_sheet.png", cols, 1, cols, 140)


if __name__ == "__main__":
    main()
