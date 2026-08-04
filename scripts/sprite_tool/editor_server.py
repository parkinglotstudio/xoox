#!/usr/bin/env python3
"""
Sprite editor local server — static engine files + Save→apply API.

Usage:
  python3 scripts/sprite_tool/editor_server.py --char guanyu --port 8767
  → http://127.0.0.1:8767/editor.html

Save in editor POSTs /api/apply and rewrites frames/sheet/json in place.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import sys
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from apply_editor_pack import apply_editor_adjust  # noqa: E402


def resolve_engine(char: str | None, engine: Path | None) -> Path:
    if engine:
        return engine.resolve()
    if not char:
        raise SystemExit("need --char or --engine")
    # generals first, then hyanga-style root
    candidates = [
        ROOT / "docs/art/sprites/generals" / char / "engine",
        ROOT / "docs/art/sprites" / char / "engine",
    ]
    for p in candidates:
        if p.is_dir():
            return p.resolve()
    raise SystemExit(f"engine not found for char={char}: tried {candidates}")


class Handler(BaseHTTPRequestHandler):
    engine_root: Path = Path(".")

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, obj: dict) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.rstrip("/") != "/api/apply":
            self._json(404, {"ok": False, "error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception as e:
            self._json(400, {"ok": False, "error": f"bad json: {e}"})
            return

        anim_id = data.get("anim_id") or data.get("animId")
        if not anim_id:
            self._json(400, {"ok": False, "error": "anim_id required"})
            return

        anim_dir = self.engine_root / str(anim_id)
        if not anim_dir.is_dir():
            self._json(404, {"ok": False, "error": f"anim pack not found: {anim_id}"})
            return

        # accept nested or flat
        scales_doc = data.get("scales") or {}
        offsets_doc = data.get("offsets") or {}
        if isinstance(scales_doc, dict) and "scales" in scales_doc:
            pad = scales_doc.get("pad_bottom")
            scales = scales_doc.get("scales") or {}
        else:
            pad = data.get("pad_bottom")
            scales = scales_doc
        if isinstance(offsets_doc, dict) and "offsets" in offsets_doc:
            offsets = offsets_doc.get("offsets") or {}
        else:
            offsets = offsets_doc

        try:
            result = apply_editor_adjust(
                anim_dir,
                scales=scales,
                offsets=offsets,
                pad_bottom=int(pad) if pad is not None else None,
            )
            result["message"] = f"{anim_id} 엔진 팩에 저장됨 (시트·frames·JSON)"
            self._json(200, result)
        except Exception as e:
            traceback.print_exc()
            self._json(500, {"ok": False, "error": str(e)})

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path in ("", "/"):
            path = "/editor.html"
        if path.startswith("/api/"):
            if path.rstrip("/") == "/api/health":
                self._json(200, {"ok": True, "engine": str(self.engine_root)})
                return
            self._json(404, {"ok": False, "error": "not found"})
            return

        # prevent path escape
        rel = path.lstrip("/")
        target = (self.engine_root / rel).resolve()
        try:
            target.relative_to(self.engine_root)
        except ValueError:
            self.send_error(403)
            return
        if not target.is_file():
            self.send_error(404)
            return

        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        data = target.read_bytes()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        # bust stale sheets after apply
        if target.suffix.lower() in {".png", ".json"}:
            self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def main() -> None:
    ap = argparse.ArgumentParser(description="Sprite editor server (Save → apply pack)")
    ap.add_argument("--char", help="e.g. guanyu / liubei / hyanga")
    ap.add_argument("--engine", type=Path, help="engine root path")
    ap.add_argument("--port", type=int, default=8767)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    engine = resolve_engine(args.char, args.engine)
    Handler.engine_root = engine

    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/editor.html"
    print(f"engine: {engine}")
    print(f"open:   {url}")
    print("Save → POST /api/apply → frames + sheet + json")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
