"""유닛 랩 「맵: i21 정화후」 시점 3개 캡처. python capture_map.py <out_dir>"""
import os, sys, time
from playwright.sync_api import sync_playwright
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as pw:
    br = pw.chromium.launch(args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"])
    page = br.new_page(viewport={"width": 1500, "height": 900})
    page.goto("http://localhost:5179/unit-lab-tool.html")
    page.wait_for_function("() => window.__unitLab")
    page.click("text=맵: i21 정화후")
    page.wait_for_function("() => document.getElementById('status').textContent.includes('사람 1.5m')", timeout=180000)
    canvas = page.locator("canvas").first
    for cam in ("field", "dock", "overview"):
        page.click(f"[data-mapcam='{cam}']")
        time.sleep(2.5)
        canvas.screenshot(path=os.path.join(OUT, f"unitlab_i21_{cam}.png"))
    br.close()
print("MAP_CAPTURE_DONE")
