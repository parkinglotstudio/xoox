#!/usr/bin/env python3
"""Apply editor scales+offsets to an engine anim pack (absolute vs backups)."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

from sprite_engine import pack_sheet, write_preview_html


def _frame_key(f: dict) -> str:
    if f.get("source_key") is not None:
        return str(f["source_key"])
    if f.get("pose_index") is not None:
        return str(f["pose_index"])
    return str(f.get("index", 0))


def _bbox(im: Image.Image, th: int = 16):
    a = im.getchannel("A")
    bb = a.getbbox()
    if not bb:
        return None
    # getbbox is (l,t,r,b) exclusive-ish; PIL inclusive left/top exclusive right/bottom
    return bb


def _ensure_cell(im: Image.Image, cell: int) -> Image.Image:
    if im.size == (cell, cell):
        return im
    out = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    out.paste(im, (0, 0), im)
    return out


def scale_foot_anchor(im: Image.Image, cell: int, pad: int, s: float) -> Image.Image:
    im = _ensure_cell(im.convert("RGBA"), cell)
    if abs(s - 1.0) < 1e-9:
        return im.copy()
    piv_x, piv_y = cell / 2, cell - pad
    nw = max(1, int(round(cell * s)))
    nh = max(1, int(round(cell * s)))
    scaled = im.resize((nw, nh), Image.Resampling.LANCZOS)
    x = int(round(piv_x - piv_x * s))
    y = int(round(piv_y - piv_y * s))
    out = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    out.paste(scaled, (x, y), scaled)
    bb = _bbox(out)
    if bb is None:
        return out
    l, t, r, b = bb
    target_bottom = int(round(piv_y))
    if b - 1 < target_bottom - 2 or b > cell:
        dy = target_bottom - (b - 1)
        shifted = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
        shifted.paste(out, (0, dy), out)
        out = shifted
    return out


def apply_offset(im: Image.Image, cell: int, dx: int, dy: int) -> Image.Image:
    if dx == 0 and dy == 0:
        return im
    out = Image.new("RGBA", (cell, cell), (0, 0, 0, 0))
    out.paste(im, (dx, dy), im)
    return out


def apply_editor_adjust(
    anim_dir: Path,
    *,
    scales: dict,
    offsets: dict,
    pad_bottom: int | None = None,
    rebuild_sheet: bool = True,
) -> dict:
    """
    Absolute apply:
      _pre_scale_backup × scales → _pre_offset_backup
      + offsets → frames/ + sheet + manifest
    """
    anim_dir = Path(anim_dir)
    anim_id = anim_dir.name
    man_path = anim_dir / f"{anim_id}.json"
    if not man_path.exists():
        raise FileNotFoundError(f"missing manifest: {man_path}")

    man = json.loads(man_path.read_text(encoding="utf-8"))
    cell = int(man.get("cell", 512))
    pad = int(pad_bottom if pad_bottom is not None else man.get("pad_bottom", 12))
    frames_dir = anim_dir / "frames"
    scale_bak = anim_dir / "_pre_scale_backup"
    offset_bak = anim_dir / "_pre_offset_backup"

    if not scale_bak.exists():
        scale_bak.mkdir(parents=True)
        for f in man.get("frames") or []:
            src = frames_dir / f["name"]
            if src.exists():
                shutil.copy2(src, scale_bak / f["name"])

    scales_map = {str(k): float(v) for k, v in (scales or {}).items()}
    offsets_map = {}
    for k, v in (offsets or {}).items():
        if isinstance(v, dict):
            offsets_map[str(k)] = {"dx": int(v.get("dx", 0)), "dy": int(v.get("dy", 0))}
        else:
            offsets_map[str(k)] = {"dx": 0, "dy": 0}

    # unique scaled cells by key
    unique_scaled: dict[str, Image.Image] = {}
    for f in man.get("frames") or []:
        key = _frame_key(f)
        if key in unique_scaled:
            continue
        name = f["name"]
        src = scale_bak / name
        if not src.exists():
            src = frames_dir / name
        if not src.exists():
            raise FileNotFoundError(f"missing frame: {name}")
        s = scales_map.get(key, 1.0)
        unique_scaled[key] = scale_foot_anchor(Image.open(src).convert("RGBA"), cell, pad, s)

    if offset_bak.exists():
        shutil.rmtree(offset_bak)
    offset_bak.mkdir(parents=True)
    for key, im in unique_scaled.items():
        # write one file per unique using first matching frame name
        for f in man.get("frames") or []:
            if _frame_key(f) == key:
                im.save(offset_bak / f["name"])
                break

    cells: list[Image.Image] = []
    for f in man.get("frames") or []:
        key = _frame_key(f)
        o = offsets_map.get(key, {"dx": 0, "dy": 0})
        out = apply_offset(unique_scaled[key], cell, o["dx"], o["dy"])
        out.save(frames_dir / f["name"])
        bb = _bbox(out)
        if bb:
            f["char_size"] = [bb[2] - bb[0], bb[3] - bb[1]]
        f["applied_scale"] = scales_map.get(key, 1.0)
        cells.append(out)

    sheet_name = man.get("sheet") or f"{anim_id}_sheet.png"
    if rebuild_sheet and cells:
        pack_sheet(cells, cols=man.get("cols") or len(cells)).save(anim_dir / sheet_name)

    scales_doc = {
        "anim_id": anim_id,
        "cell": cell,
        "pivot": "bottom-center",
        "pad_bottom": pad,
        "type": "frame_scales",
        "baseline": "_pre_scale_backup",
        "note": "Applied from editor Save → engine pack (absolute).",
        "scales": scales_map,
    }
    offsets_doc = {
        "anim_id": anim_id,
        "cell": cell,
        "pivot": {"x": cell // 2, "y": cell - pad},
        "type": "body_offsets",
        "baseline": "_pre_offset_backup",
        "note": "Applied from editor Save → engine pack (absolute).",
        "offsets": offsets_map,
    }
    man["pad_bottom"] = pad
    man["applied_frame_scales"] = scales_doc
    man["applied_body_offsets"] = offsets_doc
    man_path.write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding="utf-8")
    (anim_dir / f"{anim_id}_frame_scales.json").write_text(
        json.dumps(scales_doc, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (anim_dir / f"{anim_id}_body_offsets.json").write_text(
        json.dumps(offsets_doc, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    try:
        write_preview_html(
            anim_dir / "preview.html",
            sheet_name=sheet_name,
            manifest_name=f"{anim_id}.json",
            cell=cell,
            frame_count=int(man.get("frame_count", len(cells))),
        )
    except Exception:
        pass

    return {
        "ok": True,
        "anim_id": anim_id,
        "cell": cell,
        "frame_count": len(cells),
        "scales": scales_map,
        "offsets": offsets_map,
        "sheet": sheet_name,
    }


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser(description="Apply editor scales+offsets to engine anim pack")
    ap.add_argument("--anim-dir", type=Path, required=True)
    ap.add_argument("--scales", type=Path, help="frame_scales.json (or combined)")
    ap.add_argument("--offsets", type=Path, help="body_offsets.json")
    args = ap.parse_args()

    scales, offsets, pad = {}, {}, None
    if args.scales:
        doc = json.loads(args.scales.read_text(encoding="utf-8"))
        if "scales" in doc and isinstance(doc["scales"], dict):
            scales = doc["scales"]
            pad = doc.get("pad_bottom")
            if "offsets" in doc and not args.offsets:
                offsets = doc["offsets"]
        else:
            scales = doc
    if args.offsets:
        doc = json.loads(args.offsets.read_text(encoding="utf-8"))
        offsets = doc.get("offsets", doc) if isinstance(doc, dict) else {}

    result = apply_editor_adjust(args.anim_dir, scales=scales, offsets=offsets, pad_bottom=pad)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
