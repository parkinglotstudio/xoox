# -*- coding: utf-8 -*-
"""
정화전 쿨톤 + 시안 림 / 산 높이 / 하늘 세로 원근 v2
→ 4096x2048 equirect + seamless → data/art/sky/
백업: data/art/sky/_bak_pre_cool_horizon_v2/
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(r"C:\xoox")
ASSETS = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets")
GEN = Path(r"C:\수스이미지 생성\map_pipeline\sky_v2")
ART = ROOT / "data" / "art" / "sky"
BAK = ART / "_bak_pre_cool_horizon_v2"
OUT_W, OUT_H = 4096, 2048
BLEND = 320


def to_equirect_2_1(img: Image.Image, keep_lower: bool = True) -> Image.Image:
    img = img.convert("RGBA")
    target_aspect = OUT_W / OUT_H
    w, h = img.size
    aspect = w / h
    if aspect > target_aspect:
        nw = int(h * target_aspect)
        x0 = (w - nw) // 2
        img = img.crop((x0, 0, x0 + nw, h))
    else:
        nh = int(w / target_aspect)
        if keep_lower:
            y0 = max(0, (h - nh) // 3)
        else:
            y0 = (h - nh) // 2
        img = img.crop((0, y0, w, y0 + nh))
    return img.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)


def seamless_horizontal(img: Image.Image, blend: int = BLEND) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    blend = min(blend, w // 4)
    out = img.copy()
    px = out.load()
    left = img.crop((0, 0, blend, h))
    right = img.crop((w - blend, 0, w, h))
    for x in range(blend):
        t = (x + 0.5) / blend
        u = t * t * (3 - 2 * t)
        for y in range(h):
            r1, g1, b1, a1 = right.getpixel((x, y))
            r2, g2, b2, a2 = left.getpixel((x, y))
            px[w - blend + x, y] = (
                int(r1 * (1 - u) + r2 * u),
                int(g1 * (1 - u) + g2 * u),
                int(b1 * (1 - u) + b2 * u),
                int(a1 * (1 - u) + a2 * u),
            )
        for y in range(h):
            r1, g1, b1, a1 = left.getpixel((x, y))
            r2, g2, b2, a2 = right.getpixel((x, y))
            u2 = min(0.55, (1 - t) * (1 - t) * (3 - 2 * (1 - t)) * 0.55)
            px[x, y] = (
                int(r1 * (1 - u2) + r2 * u2),
                int(g1 * (1 - u2) + g2 * u2),
                int(b1 * (1 - u2) + b2 * u2),
                int(a1 * (1 - u2) + a2 * u2),
            )
    return out


def impressionist_pass(img: Image.Image, color: float = 1.12, contrast: float = 1.1) -> Image.Image:
    base = img.convert("RGB")
    soft = base.filter(ImageFilter.MedianFilter(size=3))
    soft = soft.filter(ImageFilter.GaussianBlur(radius=0.8))
    paint = Image.blend(base, soft, 0.35)
    paint = ImageEnhance.Color(paint).enhance(color)
    paint = ImageEnhance.Contrast(paint).enhance(contrast)
    oil = paint.filter(ImageFilter.ModeFilter(size=3))
    paint = Image.blend(paint, oil, 0.25)
    paint = paint.filter(ImageFilter.UnsharpMask(radius=1.6, percent=110, threshold=2))
    return paint.convert("RGBA")


def deepen_sky_vertical(img: Image.Image, polluted: bool) -> Image.Image:
    """위는 무겁게·아래는 빛 — 세로 원근 보강."""
    img = img.convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ox = overlay.load()
    for y in range(h):
        t = y / max(1, h - 1)  # 0=top, 1=bottom
        if polluted:
            # top: dark teal veil; bottom: soft cyan light (very light)
            top_a = int(55 * (1 - t) ** 1.4)
            bot_a = int(28 * max(0, (t - 0.72) / 0.28) ** 0.8)
            for x in range(w):
                if top_a > 0:
                    ox[x, y] = (18, 36, 48, top_a)
                if bot_a > 0:
                    r, g, b, a = ox[x, y]
                    # mix cyan rim toward bottom
                    cr, cg, cb = 64, 210, 230
                    u = bot_a / 255
                    ox[x, y] = (
                        int(r * (1 - u) + cr * u),
                        int(g * (1 - u) + cg * u),
                        int(b * (1 - u) + cb * u),
                        max(a, bot_a),
                    )
        else:
            top_a = int(40 * (1 - t) ** 1.3)
            for x in range(w):
                if top_a > 0:
                    ox[x, y] = (40, 50, 90, top_a)
    return Image.alpha_composite(img, overlay)


def process_sky(src: Path, dst: Path, polluted: bool) -> None:
    img = to_equirect_2_1(Image.open(src), keep_lower=True)
    img = impressionist_pass(img, color=1.08 if polluted else 1.16, contrast=1.14)
    img = deepen_sky_vertical(img, polluted)
    img = seamless_horizontal(img)
    img = img.convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "PNG", optimize=True)
    print(f"sky  {dst.name}  {img.size}")


def process_horizon(src: Path, dst: Path) -> None:
    img = to_equirect_2_1(Image.open(src), keep_lower=True)
    # 산이 위로 더 차지하도록: 상단 하늘 살짝 크롭 후 재확장
    w, h = img.size
    crop_top = int(h * 0.08)
    img = img.crop((0, crop_top, w, h)).resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
    img = impressionist_pass(img, color=1.05, contrast=1.12)
    img = seamless_horizontal(img).convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "PNG", optimize=True)
    print(f"hz   {dst.name}  {img.size}")


def main() -> None:
    GEN.mkdir(parents=True, exist_ok=True)
    jobs = [
        (ASSETS / "sky_polluted_cool_v2.png", GEN / "sky_polluted.png", "sky", True),
        (ASSETS / "sky_purified_depth_v2.png", GEN / "sky_purified.png", "sky", False),
        (ASSETS / "horizon_polluted_tall_v3.png", GEN / "horizon_mountains_polluted.png", "hz", None),
        (ASSETS / "horizon_purified_tall_v3.png", GEN / "horizon_mountains_purified.png", "hz", None),
    ]
    for src, dst, kind, flag in jobs:
        if not src.exists():
            raise SystemExit(f"missing {src}")
        if kind == "sky":
            process_sky(src, dst, bool(flag))
        else:
            process_horizon(src, dst)

    BAK.mkdir(parents=True, exist_ok=True)
    ART.mkdir(parents=True, exist_ok=True)
    for name in [
        "sky_purified.png",
        "sky_polluted.png",
        "horizon_mountains_purified.png",
        "horizon_mountains_polluted.png",
    ]:
        cur = ART / name
        if cur.exists():
            shutil.copy2(cur, BAK / name)
        shutil.copy2(GEN / name, cur)
        print(f"apply {name}")

    (GEN / "README_sky_v2.txt").write_text(
        "\n".join(
            [
                "하늘·지평선 v2 (쿨톤 정화전 / 원근 / 산 높이)",
                "- 정화전: slate-teal + soft cyan rim",
                "- 정화후: warm sunset depth (darker zenith)",
                "- 산: tall silhouette ~55-70% frame",
                f"- bak: {BAK}",
            ]
        ),
        encoding="utf-8",
    )
    print("done", GEN)


if __name__ == "__main__":
    main()
