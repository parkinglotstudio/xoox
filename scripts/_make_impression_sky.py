# -*- coding: utf-8 -*-
"""
인상주의 하늘 → 2:1 equirect + 좌우 seamless.
입력: Cursor 생성 PNG (16:9) 또는 기존 sky
출력: C:\\수스이미지 생성\\map_pipeline\\sky\\ 및 (옵션) data/art/sky/
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(r"C:\xoox")
GEN = Path(r"C:\수스이미지 생성\map_pipeline\sky")
ASSETS = Path(r"C:\Users\dmaxd\.cursor\projects\c-xoox\assets")
OUT_W, OUT_H = 4096, 2048  # equirect 2:1
BLEND = 320  # 좌우 크로스페이드 폭(px)


def to_equirect_2_1(img: Image.Image) -> Image.Image:
    """16:9 등을 2:1에 맞게 리샘플 (가로 맞춤 후 세로 레터박스/크롭)."""
    img = img.convert("RGBA")
    target_aspect = OUT_W / OUT_H
    w, h = img.size
    aspect = w / h
    if aspect > target_aspect:
        # too wide — crop sides
        nw = int(h * target_aspect)
        x0 = (w - nw) // 2
        img = img.crop((x0, 0, x0 + nw, h))
    else:
        # too tall — crop top/bottom a bit (keep lower sky for horizon glow)
        nh = int(w / target_aspect)
        y0 = max(0, (h - nh) // 3)  # bias keep lower third
        img = img.crop((0, y0, w, y0 + nh))
    return img.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)


def seamless_horizontal(img: Image.Image, blend: int = BLEND) -> Image.Image:
    """좌·우 가장자리를 크로스페이드해서 원통/equirect wrap 이음새 완화."""
    img = img.convert("RGBA")
    w, h = img.size
    blend = min(blend, w // 4)
    out = img.copy()
    px = out.load()
    left = img.crop((0, 0, blend, h))
    right = img.crop((w - blend, 0, w, h))
    # right edge blends toward left content; left edge toward right
    for x in range(blend):
        t = (x + 0.5) / blend  # 0 at right-edge start → 1 at end
        # at x from right: mix right[x] with left[x]
        for y in range(h):
            r1, g1, b1, a1 = right.getpixel((x, y))
            r2, g2, b2, a2 = left.getpixel((x, y))
            # stronger match near the seam (x→blend)
            u = t * t * (3 - 2 * t)
            r = int(r1 * (1 - u) + r2 * u)
            g = int(g1 * (1 - u) + g2 * u)
            b = int(b1 * (1 - u) + b2 * u)
            a = int(a1 * (1 - u) + a2 * u)
            px[w - blend + x, y] = (r, g, b, a)
        # mirror soften on left edge
        for y in range(h):
            r1, g1, b1, a1 = left.getpixel((x, y))
            r2, g2, b2, a2 = right.getpixel((x, y))
            u = (1 - t) * (1 - t) * (3 - 2 * (1 - t))
            u = min(0.55, u * 0.55)
            r = int(r1 * (1 - u) + r2 * u)
            g = int(g1 * (1 - u) + g2 * u)
            b = int(b1 * (1 - u) + b2 * u)
            a = int(a1 * (1 - u) + a2 * u)
            px[x, y] = (r, g, b, a)
    return out


def impressionist_pass(img: Image.Image) -> Image.Image:
    """붓터치 느낌: 약간 뭉개기 + 채도 + 언샤프."""
    base = img.convert("RGB")
    soft = base.filter(ImageFilter.MedianFilter(size=3))
    soft = soft.filter(ImageFilter.GaussianBlur(radius=0.8))
    paint = Image.blend(base, soft, 0.35)
    paint = ImageEnhance.Color(paint).enhance(1.18)
    paint = ImageEnhance.Contrast(paint).enhance(1.08)
    # light oil-paint-ish via rank-like blur
    oil = paint.filter(ImageFilter.ModeFilter(size=3))
    paint = Image.blend(paint, oil, 0.25)
    sharp = paint.filter(ImageFilter.UnsharpMask(radius=1.6, percent=120, threshold=2))
    return sharp.convert("RGBA")


def process_sky(src: Path, dst: Path) -> None:
    img = Image.open(src)
    img = to_equirect_2_1(img)
    img = impressionist_pass(img)
    img = seamless_horizontal(img)
    img = img.convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "PNG", optimize=True)
    print(f"sky  {dst.name}  {img.size[0]}x{img.size[1]}")


def process_horizon(src: Path, dst: Path, purified: bool) -> None:
    """산 실루엣용 — 하단은 산, 상단은 하늘. 좌우 seamless."""
    img = Image.open(src).convert("RGBA")
    img = to_equirect_2_1(img)
    # 상단 하늘은 남기고, 채도만 살짝
    rgb = impressionist_pass(img).convert("RGBA")
    # 밝은 하늘 쪽 알파를 약하게 — loadHorizonTex가 다시 걷지만, 미리 톤만 맞춤
    px = rgb.load()
    w, h = rgb.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            # 상단 30%는 하늘로 두고 알파 유지(전체 opaque — 로더가 자름)
            px[x, y] = (r, g, b, 255)
    rgb = seamless_horizontal(rgb)
    rgb = rgb.convert("RGB")
    dst.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(dst, "PNG", optimize=True)
    print(f"hz   {dst.name}  {rgb.size[0]}x{rgb.size[1]}")


def main() -> None:
    GEN.mkdir(parents=True, exist_ok=True)
    jobs = [
        (ASSETS / "sky_purified_impression_v1.png", GEN / "sky_purified.png", "sky"),
        (ASSETS / "sky_polluted_impression_v1.png", GEN / "sky_polluted.png", "sky"),
        (ASSETS / "horizon_purified_impression_v1.png", GEN / "horizon_mountains_purified.png", "hz"),
        (ASSETS / "horizon_polluted_impression_v1.png", GEN / "horizon_mountains_polluted.png", "hz"),
    ]
    for src, dst, kind in jobs:
        if not src.exists():
            raise SystemExit(f"missing {src}")
        if kind == "sky":
            process_sky(src, dst)
        else:
            process_horizon(src, dst, "purified" in dst.name)

    # 백업 후 프로젝트 반영
    art = ROOT / "data" / "art" / "sky"
    bak = art / "_bak_pre_impression_sky"
    bak.mkdir(parents=True, exist_ok=True)
    for name in [
        "sky_purified.png",
        "sky_polluted.png",
        "horizon_mountains_purified.png",
        "horizon_mountains_polluted.png",
    ]:
        src = art / name
        if src.exists():
            shutil.copy2(src, bak / name)
        shutil.copy2(GEN / name, art / name)
        print(f"apply {name}")

    note = GEN / "README_sky_v1.txt"
    note.write_text(
        "\n".join(
            [
                "인상주의 하늘 v1 (2026-08-23)",
                "- 생성: Cursor GenerateImage (16:9 impressionist)",
                "- 가공: 4096x2048 (2:1 equirect) + 좌우 seamless blend 320px + impressionist pass",
                "- 프로젝트: data/art/sky/ (백업: _bak_pre_impression_sky/)",
                "- 원본 시안: C:/Users/dmaxd/.cursor/projects/c-xoox/assets/*_impression_v1.png",
            ]
        ),
        encoding="utf-8",
    )
    print("done", GEN)


if __name__ == "__main__":
    main()
