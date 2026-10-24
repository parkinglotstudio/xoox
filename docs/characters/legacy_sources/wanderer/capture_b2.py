"""유닛 랩에서 B2(샘플 시안 B)를 블록만으로 앞·3/4·뒤 찍어 샘플과 나란히 붙인다.
python capture_b2.py [out.png]
  윗줄 = 샘플(ref_b2/sample.png) · 아랫줄 = 유닛 랩 블록(디테일)
  + 얼굴 클로즈업 한 장 (_face.png)
"""
import os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "http://localhost:5179/unit-lab-tool.html"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "ref_b2", "compare_b2.png")
TMP = os.path.join(HERE, "ref_b2", "_cap")
os.makedirs(TMP, exist_ok=True)
try:
    FONT = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 22)
except Exception:
    FONT = ImageFont.load_default()

# 샘플과 같은 구도: 앞(정면) · 3/4(왼쪽으로 30°) · 뒤
VIEWS = [(0, "앞"), (-30, "3/4"), (180, "뒤"), (-90, "옆 90°")]  # 샘플에는 옆모습이 없다
POSE = """([deg, closeup]) => {
  const L = window.__unitLab, cv = L.charView;
  if (!cv.__settled) { cv.speed = 1; cv.tick(0.6, 0); cv.__settled = true; }
  cv.speed = 0; cv.autoBlink = false;
  const a = deg * Math.PI / 180;
  cv.smooth.rotation.y = -a; cv.blocks.rotation.y = -a;
  const H = cv.height, cam = L.camera, c = L.controls;
  const hx = cv.blocks.position.x;
  if (closeup) { c.target.set(hx, H * 0.74, 0); cam.position.set(hx, H * 0.76, H * 1.25); }
  else { c.target.set(hx, H * 0.47, 0); cam.position.set(hx, H * 0.52, H * 1.45); }
  c.update();
  return true;
}"""


def frames(page, n=8):
    page.evaluate("(n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r(0) : requestAnimationFrame(f)); requestAnimationFrame(f); })", n)


def main():
    with sync_playwright() as pw:
        # 실제 GPU(ANGLE d3d11)로 찍는다 — 소프트웨어 렌더러(swiftshader)는 입체 눈 각막 반사를 하얗게 뭉갠다(실측)
        br = pw.chromium.launch(args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"])
        page = br.new_page(viewport={"width": 1500, "height": 950})
        page.goto(URL)
        page.wait_for_function("() => window.__unitLab")
        page.click("text=방랑자 · 동작")
        page.wait_for_function("() => window.__unitLab.charView")
        page.click("[data-cvar='B2']")
        page.wait_for_function("() => document.querySelector(`[data-cvar='B2']`).classList.contains('on') && window.__unitLab.charView")
        page.click("text=디테일 (캐릭터)")
        page.check("input[name='view'][value='block']")
        time.sleep(1.5)
        canvas = page.locator("canvas").first
        shots = []
        for deg, _ in VIEWS:
            page.evaluate(POSE, [deg, False])
            frames(page)
            p = os.path.join(TMP, f"b2_{deg}.png")
            canvas.screenshot(path=p)
            shots.append(p)
        page.evaluate(POSE, [0, True])
        frames(page)
        face = os.path.join(TMP, "b2_face.png")
        canvas.screenshot(path=face)
        br.close()

    samp = Image.open(os.path.join(HERE, "ref_b2", "sample.png")).convert("RGB")
    sw = samp.width // 3
    cellw, cellh = 420, 560
    sheet = Image.new("RGB", (cellw * len(VIEWS), cellh * 2 + 40), (14, 18, 28))
    d = ImageDraw.Draw(sheet)
    for j, (deg, name) in enumerate(VIEWS):
        if j < 3:
            s = samp.crop((j * sw, 0, (j + 1) * sw, samp.height))
            s.thumbnail((cellw, cellh))
            sheet.paste(s, (j * cellw + (cellw - s.width) // 2, 40))
        else:
            d.text((j * cellw + 30, 40 + cellh // 2), "샘플 옆모습 없음", fill=(150, 160, 180), font=FONT)
        im = Image.open(shots[j]).convert("RGB")
        W, H = im.size
        cw = min(W, int(H * cellw / cellh))
        im = im.crop(((W - cw) // 2, 0, (W + cw) // 2, H)).resize((cellw, cellh))
        sheet.paste(im, (j * cellw, 40 + cellh))
        d.text((j * cellw + 10, 8), f"{name} — 위 샘플 · 아래 B2 블록", fill=(255, 210, 120), font=FONT)
    sheet.save(OUT)
    fi = Image.open(face).convert("RGB")
    W, H = fi.size
    fi.crop(((W - H) // 2, 0, (W + H) // 2, H)).save(OUT.replace(".png", "_face.png"))
    print("CAPTURE_DONE", OUT)


main()
