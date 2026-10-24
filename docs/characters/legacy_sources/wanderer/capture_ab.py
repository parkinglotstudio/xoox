"""유닛 랩에서 현재·A·B 방랑자를 찍어 비교 이미지 두 장을 만든다 (그룩봇 지시 1).
python capture_ab.py [url] [out_dir]
  compare_redesign.png  — 줄 = 현재·A·B, 칸 = 앞·3/4·뒤 (각 칸: 왼쪽 원본 · 오른쪽 블록, 디테일 70칸)
  compare_faces.png     — A·B 표정 4종 머리 클로즈업 (블록)
"""
import os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5179/unit-lab-tool.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "out_ab")
TMP = os.path.join(OUT, "_cap")
os.makedirs(TMP, exist_ok=True)
VARS = [("cur", "현재"), ("A", "A안 남색"), ("B", "B안 크림·민트")]
VIEWS = [(0, "앞"), (35, "3/4"), (180, "뒤")]
FACES = [("default", "기본"), ("smile", "웃음"), ("determined", "결의"), ("surprised", "놀람")]
try:
    FONT = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 22)
except Exception:
    FONT = ImageFont.load_default()

POSE = """([deg, closeup]) => {
  const L = window.__unitLab, cv = L.charView;
  // 대기 동작을 조금 돌린 뒤 멈춘다 (t=0에서 멈추면 페이드 전이라 소품이 보인다)
  if (!cv.__settled) { cv.speed = 1; cv.tick(0.6, 0); cv.__settled = true; }
  cv.speed = 0;
  const a = deg * Math.PI / 180;
  cv.smooth.rotation.y = -a; cv.blocks.rotation.y = -a;
  const H = cv.height, cam = L.camera, c = L.controls;
  if (closeup) {
    // 블록 머리만 크게
    const hx = cv.blocks.position.x, hy = H * 0.74;
    c.target.set(hx, hy, 0);
    cam.position.set(hx, hy + 0.05, H * 1.35);
  } else {
    c.target.set(0, H * 0.5, 0);
    cam.position.set(0, H * 0.62, H * 2.35);
  }
  c.update();
  return true;
}"""


def wait_frames(page, n=6):
    page.evaluate("(n) => new Promise(r => { let k = 0; const f = () => (++k >= n ? r(0) : requestAnimationFrame(f)); requestAnimationFrame(f); })", n)


def main():
    with sync_playwright() as pw:
        br = pw.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = br.new_page(viewport={"width": 1500, "height": 950})
        page.goto(URL)
        page.wait_for_function("() => window.__unitLab")
        page.click("text=방랑자 · 동작")
        page.wait_for_function("() => window.__unitLab.charView")
        canvas = page.locator("canvas").first
        cells = {}
        faces = {}
        for v, _ in VARS:
            page.click(f"[data-cvar='{v}']")
            page.wait_for_function("(v) => document.querySelector(`[data-cvar='${v}']`).classList.contains('on') && window.__unitLab.charView", arg=v)
            page.click("text=디테일 (캐릭터)")
            time.sleep(1.0)
            for deg, _ in VIEWS:
                page.evaluate(POSE, [deg, False])
                wait_frames(page)
                p = os.path.join(TMP, f"{v}_{deg}.png")
                canvas.screenshot(path=p)
                cells[(v, deg)] = p
            if v != "cur":
                for fk, _ in FACES:
                    page.click(f"[data-expr='{fk}']")
                    time.sleep(0.4)
                    page.evaluate(POSE, [0, True])
                    wait_frames(page)
                    p = os.path.join(TMP, f"{v}_face_{fk}.png")
                    canvas.screenshot(path=p)
                    faces[(v, fk)] = p
                page.click("[data-expr='default']")
        br.close()

    # ── 한 장으로
    def crop_c(p, w, h, k=1.0):
        im = Image.open(p).convert("RGB")
        W, H = im.size
        im = im.crop(((W - w) // 2, (H - h) // 2, (W + w) // 2, (H + h) // 2))
        return im.resize((round(w * k), round(h * k))) if k != 1.0 else im

    K = 0.7
    cw, ch, lab = round(780 * K), round(660 * K), 40
    sheet = Image.new("RGB", (160 + cw * 3, lab + ch * 3), (18, 24, 34))
    d = ImageDraw.Draw(sheet)
    for j, (_, vn) in enumerate(VIEWS):
        d.text((160 + j * cw + 10, 8), f"{vn}  (왼쪽 원본 · 오른쪽 블록)", fill=(255, 210, 120), font=FONT)
    for i, (v, name) in enumerate(VARS):
        d.text((10, lab + i * ch + ch // 2), name, fill=(255, 255, 255), font=FONT)
        for j, (deg, _) in enumerate(VIEWS):
            sheet.paste(crop_c(cells[(v, deg)], 780, 660, K), (160 + j * cw, lab + i * ch))
    sheet.save(os.path.join(OUT, "compare_redesign.png"))

    fw, fh = 440, 400
    sheet = Image.new("RGB", (160 + fw * 4, lab + fh * 2), (18, 24, 34))
    d = ImageDraw.Draw(sheet)
    for j, (_, fn) in enumerate(FACES):
        d.text((160 + j * fw + 10, 8), fn, fill=(255, 210, 120), font=FONT)
    for i, (v, name) in enumerate(VARS[1:]):
        d.text((10, lab + i * fh + fh // 2), name, fill=(255, 255, 255), font=FONT)
        for j, (fk, _) in enumerate(FACES):
            sheet.paste(crop_c(faces[(v, fk)], fw, fh), (160 + j * fw, lab + i * fh))
    sheet.save(os.path.join(OUT, "compare_faces.png"))
    print("CAPTURE_DONE", OUT)


main()
