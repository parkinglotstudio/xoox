"""B2(샘플 시안) 입체 눈 텍스처. python paint_face_b2.py → face_hd/eye_B2_<L|R>.png (320×320)
샘플 눈을 그대로: 바깥쪽 흰자 띠 · 위 짙은 갈색(가운데 더 짙은 동공, 아래로 내려온 홈) · 아래 호박색 · 맨 아래 밝은 띠 · 흰 십자 반짝임.
윗속눈썹(짙은 테 + 바깥 갈고리)은 입체라 여기 없다 — 위 가장자리만 어둡게 받쳐 준다.
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import eye_shape_b2 as es  # noqa: E402
from paint_face import rgb, over, fill, smooth, SS  # noqa: E402

OUT = os.path.join(HERE, "face_hd")
PAL = {"D": "#4b2515", "P": "#231009", "O": "#e48a2c", "L": "#f6b24a", "S": "#f7f3f0", "K": "#2b1510"}


def rrect(u, v, u0, u1, v0, v1, r):
    """둥근 네모 부호 거리 (칸)."""
    cu, cv = (u0 + u1) / 2, (v0 + v1) / 2
    hu, hv = (u1 - u0) / 2 - r, (v1 - v0) / 2 - r
    qx, qy = np.abs(u - cu) - hu, np.abs(v - cv) - hv
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


def mask(Wp, Hp, mirror):
    img = Image.new("L", (Wp, Hp), 0)
    pts = []
    for u, v in es.outline(240):
        uu = -u if mirror else u
        pts.append(((uu / (2 * es.EYE_W) + 0.5) * Wp, (0.5 - v / (2 * es.EYE_H)) * Hp))
    ImageDraw.Draw(img).polygon(pts, fill=255)
    return np.asarray(img, dtype=np.float32) / 255


def paint(side):
    Wp = Hp = 320 * SS
    mirror = side == "L"  # 왼쪽 눈(보는 사람 기준): 바깥 = 이미지 왼쪽
    ys, xs = np.mgrid[0:Hp, 0:Wp].astype(np.float32)
    x = ((xs + 0.5) / Wp - 0.5) * 2 * es.EYE_W
    v = (0.5 - (ys + 0.5) / Hp) * 2 * es.EYE_H
    u = -x if mirror else x      # 눈 로컬: +u = 바깥
    px = 2 * es.EYE_W / Wp
    W, H = es.EYE_W, es.EYE_H
    img = np.zeros((Hp, Wp, 4), dtype=np.float32)
    img[..., :3] = rgb(PAL["S"])
    img[..., 3] = 1
    # 홍채: 바깥 흰자 띠(1칸)만 남기고 전부. 아래는 윤곽을 따라 둥글게
    di = rrect(u, v, -W - 1, W - 1.05, -H - 1, H + 1, 0.4)
    # 바깥 띠는 위·아래 끝에서 홍채가 덮는다 (샘플: 흰자가 가운데 높이에만)
    di = np.minimum(di, np.maximum(v - (-2.5), -v - 5))       # 맨 아래는 홍채
    iris_a = fill(di, px)
    col = np.zeros((Hp, Wp, 3), dtype=np.float32)
    # 위 짙은 갈색(샘플: 한 덩어리, 위로 갈수록 더 짙게) / 경계 아래 호박 / 맨 아래 밝은 띠
    dark = rgb("#2e150d") * smooth(-0.4, 3.2, v)[..., None] + rgb("#5a2c17") * (1 - smooth(-0.4, 3.2, v))[..., None]
    up = smooth(-0.62, -0.38, v)[..., None]
    orange = rgb(PAL["O"]) * (1 - smooth(-0.5, -2.0, v))[..., None] + rgb("#ef9d36") * smooth(-0.5, -2.0, v)[..., None]
    col[:] = orange * (1 - up) + dark * up
    lo = smooth(-2.25, -2.6, v)[..., None]
    col = col * (1 - lo) + rgb(PAL["L"]) * lo
    img = over(img, col, iris_a)
    # 동공 홈: 짙은 갈색이 가운데에서 한 칸 아래로 (T자)
    img = over(img, rgb("#4a2313"), fill(rrect(u, v, -1.25, 0.35, -1.55, -0.2, 0.25), px) * iris_a)
    # 속눈썹 그늘 (위 가장자리)
    img[..., :3] *= (1 - 0.35 * smooth(2.4, 3.6, v))[..., None]
    # 흰 십자 반짝임 (안쪽으로 치우침)
    cu, cv = -0.55, 1.15
    # 지시 2: 십자가 눈 전체를 잡아먹지 않게 작게
    cross = np.minimum(rrect(u, v, cu - 0.88, cu + 0.88, cv - 0.25, cv + 0.25, 0.08),
                       rrect(u, v, cu - 0.25, cu + 0.25, cv - 0.88, cv + 0.88, 0.08))
    img = over(img, rgb("#ffffff"), fill(cross, px))
    # 작은 반짝임 (바깥 아래)
    img = over(img, rgb("#ffe6b0"), fill(rrect(u, v, 1.0, 1.45, -2.05, -1.6, 0.18), px) * 0.75)
    img[..., 3] *= mask(Wp, Hp, mirror)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGBA")
    return im.resize((Wp // SS, Hp // SS), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for side in ("L", "R"):
        paint(side).save(os.path.join(OUT, f"eye_B2_{side}.png"))
    a, b = Image.open(os.path.join(OUT, "eye_B2_L.png")), Image.open(os.path.join(OUT, "eye_B2_R.png"))
    pv = Image.new("RGBA", (a.width * 2 + 60, a.height), (232, 184, 150, 255))
    pv.alpha_composite(a, (0, 0))
    pv.alpha_composite(b, (a.width + 60, 0))
    pv.save(os.path.join(OUT, "_preview_B2_eyes.png"))
    print("PAINT_B2_DONE")


if __name__ == "__main__":
    main()
