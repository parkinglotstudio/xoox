#!/usr/bin/env python3
"""
Sprite Engine — 스틸샷 → 배경제거 → 피봇/셀 정규화 → 시트 + 미리보기

애니메이터 없이 웹 프레임 애니용 에셋을 만드는 엔진형 툴.
단서가 이 툴로 제작하고, 사용자는 원본 그림·타이밍만 지시한다.

Examples:
  # 기본: 결과물은 캐릭터 engine 루트에 모임
  #   docs/art/sprites/hyanga/engine/{id}/

  python3 scripts/sprite_tool/sprite_engine.py build \\
    --char hyanga \\
    --frames-dir docs/art/sprites/hyanga/ingame/hop/frames_ai \\
    --id hop --cell 512 --pivot bottom-center \\
    --duration-ms 120 --preview

  # 한 장에 여러 포즈가 붙은 스트립 → 자동 분리 후 빌드
  python3 scripts/sprite_tool/sprite_engine.py build \\
    --char hyanga --id idle_blink --strip \\
    --frames "docs/.../ChatGPT Image ....png" --preview

  python3 scripts/sprite_tool/sprite_engine.py rebuild \\
    --manifest docs/art/sprites/hyanga/engine/hop/hop.json
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SPRITES = REPO_ROOT / "docs" / "art" / "sprites"


def engine_dir(char: str, anim_id: str) -> Path:
    """모든 애니 리소스 공통 루트: sprites/{char}/engine/{anim_id}/"""
    return DEFAULT_SPRITES / char / "engine" / anim_id

# ---------------------------------------------------------------------------
# BG remove
# ---------------------------------------------------------------------------


def _sample_corners(im: Image.Image, inset: int = 4) -> tuple[int, int, int]:
    rgb = im.convert("RGB")
    w, h = rgb.size
    pts = [
        (inset, inset),
        (w - 1 - inset, inset),
        (inset, h - 1 - inset),
        (w - 1 - inset, h - 1 - inset),
    ]
    acc = [0, 0, 0]
    for x, y in pts:
        p = rgb.getpixel((x, y))
        acc[0] += p[0]
        acc[1] += p[1]
        acc[2] += p[2]
    return (acc[0] // 4, acc[1] // 4, acc[2] // 4)


def remove_background_chroma(
    im: Image.Image,
    *,
    key: tuple[int, int, int] | None = None,
    tolerance: int = 42,
    soft: int = 18,
) -> Image.Image:
    """Solid/mint studio BG → RGBA. Corner-sampled chroma + soft edge (fast)."""
    rgba = im.convert("RGBA")
    key = key or _sample_corners(rgba)
    kr, kg, kb = key
    tol = max(0, tolerance)
    soft_r = max(0, soft)

    try:
        import numpy as np

        arr = np.asarray(rgba, dtype=np.int16)
        dist = (
            np.abs(arr[:, :, 0] - kr)
            + np.abs(arr[:, :, 1] - kg)
            + np.abs(arr[:, :, 2] - kb)
        )
        src_a = arr[:, :, 3]
        if soft_r:
            alpha = np.where(
                dist <= tol,
                0,
                np.where(
                    dist < tol + soft_r,
                    (255 * (dist - tol) / soft_r).astype(np.int16),
                    src_a,
                ),
            )
        else:
            alpha = np.where(dist <= tol, 0, src_a)
        alpha = np.minimum(src_a, alpha).astype(np.uint8)
        out = arr.astype(np.uint8).copy()
        out[:, :, 3] = alpha
        return Image.fromarray(out)
    except Exception:
        # Pillow fallback (no numpy): difference mask
        from PIL import ImageChops

        rgb = rgba.convert("RGB")
        solid = Image.new("RGB", rgb.size, key)
        diff = ImageChops.difference(rgb, solid)
        # approx L1 via convert L after boost
        mask = diff.convert("L")
        # hard/soft threshold via point
        def _map(v: int) -> int:
            if v * 3 <= tol:  # rough — single channel underestimates
                return 0
            if soft_r and v * 3 < tol + soft_r:
                return int(255 * (v * 3 - tol) / soft_r)
            return 255

        # Better: use max channel of diff
        dr, dg, db = diff.split()
        mx = ImageChops.lighter(ImageChops.lighter(dr, dg), db)
        # Scale: our dist is sum of abs; approximate with 3*max
        alpha = mx.point(lambda v: _map(v))
        # Combine with existing alpha
        r, g, b, a = rgba.split()
        a = ImageChops.multiply(a, alpha)
        return Image.merge("RGBA", (r, g, b, a))


def trim_transparent(im: Image.Image, pad: int = 2) -> tuple[Image.Image, tuple[int, int, int, int]]:
    """Crop to non-transparent bbox. Returns (cropped, bbox_on_original)."""
    rgba = im.convert("RGBA")
    bbox = rgba.getbbox()
    if not bbox:
        return rgba, (0, 0, rgba.width, rgba.height)
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(rgba.width, r + pad)
    b = min(rgba.height, b + pad)
    return rgba.crop((l, t, r, b)), (l, t, r, b)


# ---------------------------------------------------------------------------
# Strip split (한 장에 여러 포즈)
# ---------------------------------------------------------------------------


def split_strip_equal(im: Image.Image, cols: int) -> list[Image.Image]:
    w, h = im.size
    base = w // cols
    rem = w % cols
    frames: list[Image.Image] = []
    x = 0
    for i in range(cols):
        cw = base + (1 if i < rem else 0)
        frames.append(im.crop((x, 0, x + cw, h)))
        x += cw
    return frames


def split_strip_auto(
    im: Image.Image,
    *,
    key: tuple[int, int, int] | None = None,
    tolerance: int = 42,
    min_gap: int = 8,
    min_run: int = 24,
) -> list[Image.Image]:
    """Detect character blobs separated by background gutters (horizontal strip)."""
    try:
        import numpy as np
    except Exception as e:
        raise SystemExit(f"strip auto-split needs numpy: {e}") from e

    key = key or _sample_corners(im)
    kr, kg, kb = key
    rgb = np.asarray(im.convert("RGB"), dtype=np.int16)
    dist = (
        np.abs(rgb[:, :, 0] - kr)
        + np.abs(rgb[:, :, 1] - kg)
        + np.abs(rgb[:, :, 2] - kb)
    )
    content_col = (dist > tolerance).any(axis=0)
    ranges: list[tuple[int, int]] = []
    start: int | None = None
    gap = 0
    for x, on in enumerate(content_col.tolist()):
        if on:
            if start is None:
                start = x
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap >= min_gap:
                    end = x - gap + 1
                    if end - start >= min_run:
                        ranges.append((start, end))
                    start = None
                    gap = 0
    if start is not None:
        end = len(content_col)
        if end - start >= min_run:
            ranges.append((start, end))

    if len(ranges) < 2:
        raise SystemExit(
            f"auto-split found {len(ranges)} region(s). "
            "Use --strip-cols N for equal split, or check background."
        )

    pad = 4
    h = im.size[1]
    frames: list[Image.Image] = []
    for l, r in ranges:
        l2 = max(0, l - pad)
        r2 = min(im.size[0], r + pad)
        frames.append(im.crop((l2, 0, r2, h)))
    return frames


def materialize_strip_frames(
    strip_path: Path,
    *,
    strip_cols: int | None,
    key: tuple[int, int, int] | None,
    tolerance: int,
    work_dir: Path,
) -> list[Path]:
    im = Image.open(strip_path)
    if strip_cols and strip_cols > 1:
        parts = split_strip_equal(im, strip_cols)
        mode = f"equal-{strip_cols}"
    else:
        parts = split_strip_auto(im, key=key, tolerance=tolerance)
        mode = f"auto-{len(parts)}"
    work_dir.mkdir(parents=True, exist_ok=True)
    out: list[Path] = []
    for i, part in enumerate(parts):
        p = work_dir / f"strip_{i:02d}.png"
        part.save(p)
        out.append(p)
    print(f"strip split ({mode}): {strip_path.name} → {len(out)} frames")
    return out


# ---------------------------------------------------------------------------
# Normalize / pivot
# ---------------------------------------------------------------------------


@dataclass
class NormalizeOpts:
    cell: int = 512
    pivot: str = "bottom-center"  # bottom-center | center | top-center
    fill_ratio: float = 0.88  # character fills this fraction of cell
    pad_bottom: int = 8  # extra px above bottom for bottom-center


def place_on_cell(im: Image.Image, opts: NormalizeOpts) -> Image.Image:
    """Fit trimmed sprite into cell×cell with consistent pivot."""
    rgba = im.convert("RGBA")
    trimmed, _ = trim_transparent(rgba)
    tw, th = trimmed.size
    if tw < 1 or th < 1:
        return Image.new("RGBA", (opts.cell, opts.cell), (0, 0, 0, 0))

    max_w = int(opts.cell * opts.fill_ratio)
    max_h = int(opts.cell * opts.fill_ratio)
    scale = min(max_w / tw, max_h / th)
    nw = max(1, int(tw * scale))
    nh = max(1, int(th * scale))
    resized = trimmed.resize((nw, nh), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (opts.cell, opts.cell), (0, 0, 0, 0))
    x = (opts.cell - nw) // 2
    if opts.pivot == "center":
        y = (opts.cell - nh) // 2
    elif opts.pivot == "top-center":
        y = opts.pad_bottom
    else:  # bottom-center — 보드 토큰 / 인게임 기본
        y = opts.cell - nh - opts.pad_bottom
        y = max(0, y)

    canvas.paste(resized, (x, y), resized)
    return canvas


# ---------------------------------------------------------------------------
# Ordering
# ---------------------------------------------------------------------------

FRAME_NUM_RE = re.compile(r"(?:_f|_0*)(\d+)(?:\D|$)", re.I)
HOP_ORDER = ("jump", "tumble", "landing", "landed")
NATURAL_HINTS = (
    "center",
    "idle",
    "open",
    "blink",
    "closed",
    "up_a",
    "up_b",
    "run_a",
    "run_b",
    "fly",
    "hit",
    "win",
    "lose",
    "jump",
    "tumble",
    "landing",
    "landed",
)


def list_images(paths: Iterable[Path]) -> list[Path]:
    skip_dir_names = {"백업", "backup", "_wip", "_ref", ".git"}
    out: list[Path] = []
    for p in paths:
        if p.is_dir():
            out.extend(
                sorted(
                    [
                        f
                        for f in p.iterdir()
                        if f.is_file()
                        and f.suffix.lower() in {".png", ".webp", ".jpg", ".jpeg"}
                        and not f.name.startswith(".")
                    ],
                    key=_sort_key,
                )
            )
            # never recurse into backup folders
            _ = skip_dir_names
        elif p.is_file():
            out.append(p)
    # de-dupe preserve order
    seen: set[Path] = set()
    uniq: list[Path] = []
    for p in out:
        rp = p.resolve()
        if rp not in seen:
            seen.add(rp)
            uniq.append(p)
    return uniq


def _sort_key(p: Path) -> tuple:
    name = p.name.lower()
    for i, hint in enumerate(HOP_ORDER):
        if hint in name:
            return (0, i, name)
    for i, hint in enumerate(NATURAL_HINTS):
        if hint in name:
            return (1, i, name)
    m = FRAME_NUM_RE.search(name)
    if m:
        return (2, int(m.group(1)), name)
    return (3, 0, name)


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------


def process_frame(
    src: Path,
    *,
    bg_mode: str,
    tolerance: int,
    soft: int,
    key: tuple[int, int, int] | None,
    norm: NormalizeOpts,
) -> Image.Image:
    im = Image.open(src)
    if bg_mode == "none":
        rgba = im.convert("RGBA")
    else:
        rgba = remove_background_chroma(im, key=key, tolerance=tolerance, soft=soft)
    return place_on_cell(rgba, norm)


def pack_sheet(cells: list[Image.Image], cols: int | None = None) -> Image.Image:
    n = len(cells)
    if n == 0:
        raise ValueError("no cells")
    cell = cells[0].size[0]
    cols = cols or n
    rows = (n + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        r, col = divmod(i, cols)
        sheet.paste(c, (col * cell, r * cell), c)
    return sheet


def write_preview_html(
    out_html: Path,
    *,
    sheet_name: str,
    manifest_name: str,
    cell: int,
    frame_count: int,
) -> None:
    html = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>Sprite Engine Preview</title>
<style>
  :root {{ font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; }}
  body {{ margin: 24px; background: #e8ece6; }}
  h1 {{ font-size: 18px; margin: 0 0 12px; }}
  .row {{ display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }}
  .stage {{
    width: {cell}px; height: {cell}px;
    background:
      linear-gradient(45deg, #d5d9d3 25%, transparent 25%),
      linear-gradient(-45deg, #d5d9d3 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d5d9d3 75%),
      linear-gradient(-45deg, transparent 75%, #d5d9d3 75%);
    background-size: 24px 24px;
    background-position: 0 0, 0 12px, 12px -12px, -12px 0;
    background-color: #f2f4f0;
    border: 1px solid #b8beb4;
    image-rendering: auto;
    position: relative;
    overflow: hidden;
  }}
  .stage canvas {{ display: block; width: 100%; height: 100%; }}
  .panel {{ min-width: 280px; background: #fff; border: 1px solid #c5cbc0; padding: 14px; }}
  label {{ display: block; font-size: 12px; margin-top: 10px; }}
  input[type="number"], input[type="range"], select {{ width: 100%; }}
  button {{ margin: 4px 4px 0 0; padding: 6px 10px; cursor: pointer; }}
  .frames {{ margin-top: 10px; max-height: 240px; overflow: auto; font-size: 12px; }}
  .frames div {{ display: flex; gap: 8px; align-items: center; margin: 4px 0; }}
  .frames input {{ width: 72px; }}
  code {{ font-size: 11px; }}
</style>
</head>
<body>
  <h1>Sprite Engine Preview</h1>
  <p style="font-size:12px;opacity:.75">시트: <code>{sheet_name}</code> · 매니페스트: <code>{manifest_name}</code> · 셀 {cell}px · {frame_count}프레임</p>
  <div class="row">
    <div class="stage"><canvas id="cv" width="{cell}" height="{cell}"></canvas></div>
    <div class="panel">
      <button id="play">Play / Pause</button>
      <button id="step">Step</button>
      <button id="reset">Reset</button>
      <label>배속 <span id="spdLabel">1.0×</span>
        <input id="speed" type="range" min="0.1" max="3" step="0.1" value="1"/>
      </label>
      <label>기본 duration(ms) — 전체 일괄
        <input id="bulk" type="number" min="16" step="10" value="120"/>
      </label>
      <button id="applyBulk">일괄 적용</button>
      <button id="downloadManifest">매니페스트 JSON 다운로드</button>
      <div class="frames" id="frameList"></div>
      <p style="font-size:11px;margin-top:12px;opacity:.7">프레임 시간을 바꾼 뒤 JSON을 받아<br/>엔진에 <code>rebuild --manifest</code> 하면 반영됩니다.</p>
    </div>
  </div>
<script>
const CELL = {cell};
const SHEET_URL = "./{sheet_name}";
const MANIFEST_URL = "./{manifest_name}";

let manifest, sheet, idx = 0, playing = true, acc = 0, last = 0, speed = 1;
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");

async function boot() {{
  manifest = await (await fetch(MANIFEST_URL)).json();
  sheet = new Image();
  sheet.src = SHEET_URL;
  await sheet.decode();
  buildList();
  last = performance.now();
  requestAnimationFrame(loop);
}}

function buildList() {{
  const el = document.getElementById("frameList");
  el.innerHTML = "";
  manifest.frames.forEach((f, i) => {{
    const row = document.createElement("div");
    row.innerHTML = `<span>#${{i}}</span><code>${{f.name || f.src}}</code>`;
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = 16;
    inp.value = f.duration_ms;
    inp.addEventListener("change", () => {{ f.duration_ms = Number(inp.value) || 100; }});
    row.appendChild(inp);
    el.appendChild(row);
  }});
}}

function draw() {{
  const cols = manifest.cols || manifest.frames.length;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  ctx.clearRect(0, 0, CELL, CELL);
  ctx.drawImage(sheet, col * CELL, row * CELL, CELL, CELL, 0, 0, CELL, CELL);
}}

function loop(t) {{
  const dt = t - last;
  last = t;
  if (playing && manifest?.frames?.length) {{
    acc += dt * speed;
    const dur = manifest.frames[idx].duration_ms || 100;
    while (acc >= dur) {{
      acc -= dur;
      idx = (idx + 1) % manifest.frames.length;
    }}
  }}
  draw();
  requestAnimationFrame(loop);
}}

document.getElementById("play").onclick = () => playing = !playing;
document.getElementById("step").onclick = () => {{ playing = false; idx = (idx + 1) % manifest.frames.length; acc = 0; }};
document.getElementById("reset").onclick = () => {{ idx = 0; acc = 0; }};
document.getElementById("speed").oninput = (e) => {{
  speed = Number(e.target.value);
  document.getElementById("spdLabel").textContent = speed.toFixed(1) + "×";
}};
document.getElementById("applyBulk").onclick = () => {{
  const v = Number(document.getElementById("bulk").value) || 120;
  manifest.frames.forEach(f => f.duration_ms = v);
  buildList();
}};
document.getElementById("downloadManifest").onclick = () => {{
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {{type: "application/json"}});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "{manifest_name}";
  a.click();
}};

boot();
</script>
</body>
</html>
"""
    out_html.write_text(html, encoding="utf-8")


def refresh_studio(engine_root: Path) -> Path:
    """Write engine/index.json + studio.html with anim dropdown."""
    engine_root.mkdir(parents=True, exist_ok=True)
    anims: list[dict] = []
    for d in sorted(engine_root.iterdir()):
        if not d.is_dir() or d.name.startswith("."):
            continue
        # find manifest: {id}.json matching folder or any *.json except index
        manifests = [
            p
            for p in d.glob("*.json")
            if p.name != "index.json" and not p.name.startswith(".")
        ]
        if not manifests:
            continue
        # prefer {dirname}.json
        preferred = d / f"{d.name}.json"
        man = preferred if preferred.is_file() else manifests[0]
        try:
            data = json.loads(man.read_text(encoding="utf-8"))
        except Exception:
            continue
        anims.append(
            {
                "id": data.get("id", d.name),
                "dir": d.name,
                "manifest": f"{d.name}/{man.name}",
                "sheet": f"{d.name}/{data.get('sheet', '')}",
                "cell": int(data.get("cell", 512)),
                "frame_count": int(data.get("frame_count", len(data.get("frames", [])))),
            }
        )

    index = {"engine_root": str(engine_root), "anims": anims}
    index_path = engine_root / "index.json"
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")

    studio = engine_root / "studio.html"
    # Keep hand-tuned studio (fit-viewport) if present
    if studio.is_file() and "stage-shell" in studio.read_text(encoding="utf-8"):
        print(f"studio keep custom → {studio} ({len(anims)} anims)")
    else:
        studio.write_text(_studio_html(), encoding="utf-8")
        print(f"studio → {studio} ({len(anims)} anims)")
    return studio


def _studio_html() -> str:
    return """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<title>Sprite Studio · 플레이</title>
<style>
  :root { font-family: ui-sans-serif, system-ui, sans-serif; color: #1a1a1a; }
  body { margin: 24px; background: #e8ece6; }
  .nav { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
  .nav a {
    display: inline-block; padding: 8px 14px; background: #fff; border: 1px solid #c5cbc0;
    text-decoration: none; color: #1a1a1a; font-size: 13px; border-radius: 4px;
  }
  .nav a.active { background: #2d6a4f; color: #fff; border-color: #2d6a4f; }
  h1 { font-size: 20px; margin: 0 0 8px; }
  .sub { font-size: 12px; opacity: .7; margin-bottom: 16px; }
  .row { display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; }
  .stage {
    background:
      linear-gradient(45deg, #d5d9d3 25%, transparent 25%),
      linear-gradient(-45deg, #d5d9d3 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #d5d9d3 75%),
      linear-gradient(-45deg, transparent 75%, #d5d9d3 75%);
    background-size: 24px 24px;
    background-position: 0 0, 0 12px, 12px -12px, -12px 0;
    background-color: #f2f4f0;
    border: 1px solid #b8beb4;
    overflow: hidden;
    position: relative;
  }
  .stage canvas { display: block; width: 100%; height: 100%; image-rendering: auto; }
  .panel { min-width: 320px; max-width: 420px; background: #fff; border: 1px solid #c5cbc0; padding: 14px; }
  label { display: block; font-size: 12px; margin-top: 10px; }
  select, input[type="number"], input[type="range"] { width: 100%; box-sizing: border-box; }
  button { margin: 4px 4px 0 0; padding: 6px 10px; cursor: pointer; }
  .frames { margin-top: 10px; max-height: 320px; overflow: auto; font-size: 12px; }
  .frames div { display: flex; gap: 8px; align-items: center; margin: 4px 0; }
  .frames input { width: 72px; }
  code { font-size: 11px; }
  .meta { font-size: 11px; margin-top: 8px; line-height: 1.45; background: #f0f4ee; padding: 8px; }
</style>
</head>
<body>
  <nav class="nav">
    <a href="./editor.html">▦ 에디터</a>
    <a class="active" href="./studio.html">▶ 구 플레이</a>
    <a href="./scale.html">⤢ 구 크기·위치</a>
  </nav>
  <h1>플레이 (구버전)</h1>
  <p class="sub">새 작업은 <a href="./editor.html"><b>에디터</b></a> · idle|애니 나란히 · 동일 PX 그리드</p>
  <div class="row">
    <div class="stage" id="stage"><canvas id="cv"></canvas></div>
    <div class="panel">
      <label>애니 <span id="animCount" style="opacity:.6"></span>
        <select id="anim"></select>
      </label>
      <button id="play">Play / Pause</button>
      <button id="step">Step</button>
      <button id="reset">Reset</button>
      <label>뷰 크기 <span id="zoomLabel">2.0×</span> (셀은 그대로, 화면만 확대)
        <input id="zoom" type="range" min="1" max="3" step="0.1" value="2"/>
      </label>
      <label><input id="ghostIdle" type="checkbox" checked style="width:auto"/> idle 반투명 겹침 (크기 비교)</label>
      <label>배속 <span id="spdLabel">1.0×</span>
        <input id="speed" type="range" min="0.1" max="3" step="0.1" value="1"/>
      </label>
      <label>기본 duration(ms) 일괄
        <input id="bulk" type="number" min="16" step="10" value="120"/>
      </label>
      <button id="applyBulk">일괄 적용</button>
      <button id="downloadManifest">매니페스트 JSON 다운로드</button>
      <div class="meta" id="sizeMeta">—</div>
      <div class="frames" id="frameList"></div>
      <p style="font-size:11px;margin-top:12px;opacity:.7">시간 수정 후 JSON 저장 → 단서가 <code>rebuild --manifest</code></p>
    </div>
  </div>
<script>
let index, manifest, sheet, animMeta, idleSheet=null, idleManifest=null;
let idx = 0, playing = true, acc = 0, last = 0, speed = 1, cell = 512, zoom = 2;
const cv = document.getElementById("cv");
const ctx = cv.getContext("2d");
const stage = document.getElementById("stage");

function bust(url) {
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "t=" + Date.now();
}

function applyZoom() {
  const px = Math.round(cell * zoom);
  stage.style.width = px + "px";
  stage.style.height = px + "px";
  document.getElementById("zoomLabel").textContent = zoom.toFixed(1) + "×";
}

async function boot() {
  index = await (await fetch(bust("./index.json"), { cache: "no-store" })).json();
  const idleMeta = index.anims.find(a => a.id === "ingame_idle");
  if (idleMeta) {
    idleManifest = await (await fetch(bust("./" + idleMeta.manifest), { cache: "no-store" })).json();
    idleSheet = new Image();
    idleSheet.src = bust("./" + idleMeta.sheet);
    await idleSheet.decode();
  }
  const sel = document.getElementById("anim");
  sel.innerHTML = "";
  document.getElementById("animCount").textContent = `(${index.anims.length}개)`;
  index.anims.forEach((a, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${a.id} (${a.frame_count}f)`;
    sel.appendChild(opt);
  });
  sel.onchange = () => {
    const i = Number(sel.value);
    const id = index.anims[i]?.id;
    if (id) history.replaceState(null, "", "#"+id);
    loadAnim(i);
  };
  document.getElementById("zoom").oninput = (e) => {
    zoom = Number(e.target.value);
    applyZoom();
  };
  document.getElementById("ghostIdle").onchange = () => draw();
  const want = (location.hash || "").replace(/^#/, "") || new URLSearchParams(location.search).get("anim");
  let start = 0;
  if (want) {
    const found = index.anims.findIndex(a => a.id === want);
    if (found >= 0) start = found;
  }
  sel.value = String(start);
  if (index.anims.length) await loadAnim(start);
  last = performance.now();
  requestAnimationFrame(loop);
}

async function loadAnim(i) {
  animMeta = index.anims[i];
  manifest = await (await fetch(bust("./" + animMeta.manifest), { cache: "no-store" })).json();
  cell = manifest.cell || animMeta.cell || 512;
  cv.width = cell; cv.height = cell;
  applyZoom();
  sheet = new Image();
  sheet.src = bust("./" + animMeta.sheet);
  await sheet.decode();
  idx = 0; acc = 0;
  buildList();
  updateMeta();
  draw();
}

function updateMeta() {
  const f = manifest?.frames?.[idx];
  if (!f) return;
  const idleRef = manifest.idle_ref || [];
  document.getElementById("sizeMeta").textContent =
    `frame #${idx} ${f.role || ""} · char ${JSON.stringify(f.char_size || [])}` +
    (idleRef.length ? ` · idle_ref ${JSON.stringify(idleRef)}` : "") +
    ` · cell ${cell} · view ${Math.round(cell*zoom)}px`;
}

function buildList() {
  const el = document.getElementById("frameList");
  el.innerHTML = "";
  (manifest.frames || []).forEach((f, i) => {
    const row = document.createElement("div");
    row.innerHTML = `<span>#${i}</span><code>${f.role || f.name || ""}</code>`;
    const inp = document.createElement("input");
    inp.type = "number";
    inp.min = 16;
    inp.value = f.duration_ms;
    inp.addEventListener("change", () => { f.duration_ms = Number(inp.value) || 100; });
    row.appendChild(inp);
    el.appendChild(row);
  });
}

function draw() {
  if (!manifest?.frames?.length || !sheet?.complete) return;
  const cols = manifest.cols || manifest.frames.length;
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  ctx.clearRect(0, 0, cell, cell);
  const ghost = document.getElementById("ghostIdle").checked;
  if (ghost && idleSheet?.complete && idleManifest?.frames?.length && animMeta?.id !== "ingame_idle") {
    const ic = idleManifest.cell || cell;
    ctx.globalAlpha = 0.28;
    ctx.drawImage(idleSheet, 0, 0, ic, ic, 0, 0, cell, cell);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(sheet, col * cell, row * cell, cell, cell, 0, 0, cell, cell);
  updateMeta();
}

function loop(t) {
  const dt = t - last;
  last = t;
  if (playing && manifest?.frames?.length) {
    acc += dt * speed;
    const dur = manifest.frames[idx].duration_ms || 100;
    while (acc >= dur) {
      acc -= dur;
      idx = (idx + 1) % manifest.frames.length;
    }
  }
  draw();
  requestAnimationFrame(loop);
}

document.getElementById("play").onclick = () => playing = !playing;
document.getElementById("step").onclick = () => { playing = false; idx = (idx + 1) % manifest.frames.length; acc = 0; };
document.getElementById("reset").onclick = () => { idx = 0; acc = 0; };
document.getElementById("speed").oninput = (e) => {
  speed = Number(e.target.value);
  document.getElementById("spdLabel").textContent = speed.toFixed(1) + "×";
};
document.getElementById("applyBulk").onclick = () => {
  const v = Number(document.getElementById("bulk").value) || 120;
  manifest.frames.forEach(f => f.duration_ms = v);
  buildList();
};
document.getElementById("downloadManifest").onclick = () => {
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (manifest.id || "anim") + ".json";
  a.click();
};

boot().catch(err => {
  document.body.insertAdjacentHTML("beforeend", `<pre style="color:crimson">${err}</pre>`);
});
</script>
</body>
</html>
"""


def build_anim(
    *,
    sources: list[Path],
    out_dir: Path,
    anim_id: str,
    norm: NormalizeOpts,
    bg_mode: str,
    tolerance: int,
    soft: int,
    key: tuple[int, int, int] | None,
    durations: list[int] | None,
    default_duration_ms: int,
    cols: int | None,
    preview: bool,
    copy_sources: bool = True,
) -> Path:
    if not sources:
        raise SystemExit("No source frames")

    out_dir.mkdir(parents=True, exist_ok=True)
    frames_out = out_dir / "frames"
    frames_out.mkdir(exist_ok=True)
    if copy_sources:
        raw_dir = out_dir / "raw_sources"
        raw_dir.mkdir(exist_ok=True)

    cells: list[Image.Image] = []
    frame_meta: list[dict] = []

    for i, src in enumerate(sources):
        cell_im = process_frame(
            src,
            bg_mode=bg_mode,
            tolerance=tolerance,
            soft=soft,
            key=key,
            norm=norm,
        )
        cells.append(cell_im)
        name = f"{anim_id}_{i:02d}.png"
        cell_path = frames_out / name
        cell_im.save(cell_path)
        if copy_sources:
            dest = raw_dir / f"{i:02d}_{src.name}"
            if not dest.exists():
                shutil.copy2(src, dest)
        dur = (
            durations[i]
            if durations and i < len(durations)
            else default_duration_ms
        )
        frame_meta.append(
            {
                "index": i,
                "name": name,
                "src": src.name,
                "src_path": str(src),
                "duration_ms": int(dur),
                "file": f"frames/{name}",
            }
        )
        print(f"  [{i}] {src.name} → {name} ({dur}ms)")

    sheet_cols = cols or len(cells)
    sheet = pack_sheet(cells, cols=sheet_cols)
    sheet_name = f"{anim_id}_sheet.png"
    sheet_path = out_dir / sheet_name
    sheet.save(sheet_path)

    manifest = {
        "id": anim_id,
        "cell": norm.cell,
        "pivot": norm.pivot,
        "fill_ratio": norm.fill_ratio,
        "cols": sheet_cols,
        "rows": (len(cells) + sheet_cols - 1) // sheet_cols,
        "frame_count": len(cells),
        "sheet": sheet_name,
        "bg": {
            "mode": bg_mode,
            "tolerance": tolerance,
            "soft": soft,
            "key": list(key) if key else "auto-corners",
        },
        "frames": frame_meta,
        "loop": True,
    }
    manifest_name = f"{anim_id}.json"
    manifest_path = out_dir / manifest_name
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    if preview:
        write_preview_html(
            out_dir / "preview.html",
            sheet_name=sheet_name,
            manifest_name=manifest_name,
            cell=norm.cell,
            frame_count=len(cells),
        )

    print(f"sheet → {sheet_path}")
    print(f"manifest → {manifest_path}")
    if preview:
        print(f"preview → {out_dir / 'preview.html'}")

    # 캐릭터 engine 루트면 스튜디오 갱신
    if out_dir.parent.name == "engine":
        refresh_studio(out_dir.parent)

    return manifest_path


def rebuild_from_manifest(manifest_path: Path, preview: bool = True) -> Path:
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    out_dir = manifest_path.parent
    sources: list[Path] = []
    durations: list[int] = []
    for f in data["frames"]:
        # prefer original path if still exists, else processed frame (bg already gone)
        src = Path(f.get("src_path", ""))
        if not src.is_file():
            src = out_dir / f["file"]
        if not src.is_file():
            raise SystemExit(f"Missing frame source: {f}")
        sources.append(src)
        durations.append(int(f.get("duration_ms", 120)))

    bg = data.get("bg", {})
    key = bg.get("key")
    key_t = tuple(key) if isinstance(key, list) and len(key) == 3 else None
    # If rebuilding from already-processed transparent frames, skip chroma
    bg_mode = "none" if all((out_dir / f["file"]).resolve() == sources[i].resolve() for i, f in enumerate(data["frames"])) else bg.get("mode", "chroma")

    # Safer: if source is under frames/ already processed, no bg
    if all("frames/" in str(s) or s.parent.name == "frames" for s in sources):
        bg_mode = "none"

    return build_anim(
        sources=sources,
        out_dir=out_dir,
        anim_id=data["id"],
        norm=NormalizeOpts(
            cell=int(data.get("cell", 512)),
            pivot=str(data.get("pivot", "bottom-center")),
            fill_ratio=float(data.get("fill_ratio", 0.88)),
        ),
        bg_mode=bg_mode,
        tolerance=int(bg.get("tolerance", 42)),
        soft=int(bg.get("soft", 18)),
        key=key_t,
        durations=durations,
        default_duration_ms=120,
        cols=data.get("cols"),
        preview=preview,
        copy_sources=False,
    )


def _parse_rgb(s: str | None) -> tuple[int, int, int] | None:
    if not s:
        return None
    parts = [int(x.strip()) for x in s.split(",")]
    if len(parts) != 3:
        raise SystemExit("--key must be R,G,B")
    return (parts[0], parts[1], parts[2])


def _parse_durations(s: str | None) -> list[int] | None:
    if not s:
        return None
    return [int(x.strip()) for x in s.split(",") if x.strip()]


def main() -> None:
    ap = argparse.ArgumentParser(description="Sprite Engine — stills to timed web sprites")
    sub = ap.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build", help="Build anim from still frames")
    b.add_argument("--frames", nargs="*", type=Path, default=[], help="frame files")
    b.add_argument("--frames-dir", type=Path, default=None, help="directory of frames")
    b.add_argument("--char", type=str, default="hyanga", help="character id (default hyanga)")
    b.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="default: docs/art/sprites/{char}/engine/{id}/",
    )
    b.add_argument("--id", required=True, help="anim id")
    b.add_argument("--cell", type=int, default=512)
    b.add_argument("--pivot", choices=["bottom-center", "center", "top-center"], default="bottom-center")
    b.add_argument("--fill-ratio", type=float, default=0.88)
    b.add_argument("--bg", choices=["chroma", "none"], default="chroma")
    b.add_argument("--tolerance", type=int, default=42)
    b.add_argument("--soft", type=int, default=18)
    b.add_argument("--key", type=str, default=None, help="R,G,B chroma key (default=auto corners)")
    b.add_argument("--duration-ms", type=int, default=120, help="default frame duration")
    b.add_argument("--durations", type=str, default=None, help="per-frame ms, comma-separated")
    b.add_argument("--cols", type=int, default=None)
    b.add_argument(
        "--strip",
        action="store_true",
        help="input is a multi-pose strip; split into frames first",
    )
    b.add_argument(
        "--strip-cols",
        type=int,
        default=None,
        help="equal-width split into N columns (else auto-detect gaps)",
    )
    b.add_argument("--preview", action="store_true", help="write preview.html")

    r = sub.add_parser("rebuild", help="Rebuild from anim.json (after timing edits)")
    r.add_argument("--manifest", type=Path, required=True)
    r.add_argument("--preview", action="store_true", default=True)

    p = sub.add_parser("preview-only", help="Write preview.html next to existing sheet+json")
    p.add_argument("--manifest", type=Path, required=True)

    s = sub.add_parser("studio", help="Refresh engine studio.html + index.json")
    s.add_argument("--char", type=str, default="hyanga")

    args = ap.parse_args()

    if args.cmd == "build":
        sources: list[Path] = []
        if args.frames_dir:
            sources.extend(list_images([args.frames_dir]))
        if args.frames:
            sources.extend(list_images(args.frames))
        if not sources:
            raise SystemExit("Provide --frames and/or --frames-dir")

        out_dir = args.out_dir or engine_dir(args.char, args.id)
        key = _parse_rgb(args.key)

        if args.strip or args.strip_cols:
            if len(sources) != 1:
                raise SystemExit("--strip expects exactly one strip image")
            sources = materialize_strip_frames(
                sources[0],
                strip_cols=args.strip_cols,
                key=key,
                tolerance=args.tolerance,
                work_dir=out_dir / "strip_splits",
            )

        build_anim(
            sources=sources,
            out_dir=out_dir,
            anim_id=args.id,
            norm=NormalizeOpts(
                cell=args.cell,
                pivot=args.pivot,
                fill_ratio=args.fill_ratio,
            ),
            bg_mode=args.bg,
            tolerance=args.tolerance,
            soft=args.soft,
            key=key,
            durations=_parse_durations(args.durations),
            default_duration_ms=args.duration_ms,
            cols=args.cols,
            preview=args.preview,
        )
    elif args.cmd == "rebuild":
        rebuild_from_manifest(args.manifest, preview=True)
    elif args.cmd == "preview-only":
        data = json.loads(args.manifest.read_text(encoding="utf-8"))
        write_preview_html(
            args.manifest.parent / "preview.html",
            sheet_name=data["sheet"],
            manifest_name=args.manifest.name,
            cell=int(data["cell"]),
            frame_count=int(data["frame_count"]),
        )
        print(f"preview → {args.manifest.parent / 'preview.html'}")
    elif args.cmd == "studio":
        refresh_studio(DEFAULT_SPRITES / args.char / "engine")


if __name__ == "__main__":
    main()
