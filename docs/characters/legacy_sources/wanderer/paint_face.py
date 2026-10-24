"""얼굴·눈 텍스처를 코드로 그린다 (벡터 도형 → 4배로 그려 줄여서 매끈한 선).
python paint_face.py            → face_hd/ 아래에 A·B 둘 다
  eye_<A|B>_<L|R>.png   256×320  눈알 판: 흰자 + 홍채 그라데이션 + 동공 + 반짝임 + 아래 속눈썹
  face_<A|B>_<표정>.png  512×480  얼굴 판(16×15칸): 볼터치·입·턱 그늘 (눈은 입체라 여기 없음)
눈 윤곽은 eye_shape.py (블렌더 입체 눈과 같은 모양).
"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from eye_shape import EYE_W, EYE_H, EYE_CX, EYE_CZ, outline  # noqa: E402

OUT = os.path.join(HERE, "face_hd")
SS = 4  # 슈퍼샘플

IRIS = {
    # A 남색 머리: 청록 눈 (머리 줄·스카프와 이어짐)
    "A": {"dark": "#162440", "mid": "#1b8795", "light": "#6ff5e2", "pupil": "#0b1224", "ring": "#0f1d36", "glow": "#b8fff4"},
    # B 크림·민트 머리: 호박 눈 (따뜻한 대비)
    "B": {"dark": "#3a1d12", "mid": "#b8642a", "light": "#ffd173", "pupil": "#230f08", "ring": "#2b130b", "glow": "#fff0b8"},
}
SKIN = "#ffddbb"


def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def ell(u, v, cu, cv, ru, rv, rot=0.0):
    """타원 부호 거리(근사, 칸 단위). 음수 = 안."""
    cr, sr = math.cos(rot), math.sin(rot)
    x, y = (u - cu) * cr + (v - cv) * sr, -(u - cu) * sr + (v - cv) * cr
    k = np.sqrt((x / ru) ** 2 + (y / rv) ** 2)
    return (k - 1) * min(ru, rv)


def over(dst, col, a):
    """스트레이트 알파 합성 (투명 바탕에 반투명을 올려도 검게 물들지 않게)."""
    a = np.clip(a, 0, 1)[..., None]
    da = dst[..., 3:]
    oa = a + da * (1 - a)
    rgbv = (col * a + dst[..., :3] * da * (1 - a)) / np.maximum(oa, 1e-6)
    dst[..., :3] = np.where(oa > 1e-6, rgbv, dst[..., :3])
    dst[..., 3:] = oa
    return dst


def fill(d, px):
    """거리 → 가장자리 부드러운 알파 (px = 한 픽셀의 칸 크기)."""
    return np.clip(0.5 - d / px, 0, 1)


def stroke_curve(u, v, pts, width, px):
    """꺾은선(pts)까지의 거리 → 붓선 알파. width = 칸 단위 두께(점마다 다를 수 있음)."""
    best = np.full(u.shape, 1e9, dtype=np.float32)
    wbest = np.zeros(u.shape, dtype=np.float32)
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        L2 = dx * dx + dy * dy + 1e-12
        t = np.clip(((u - x0) * dx + (v - y0) * dy) / L2, 0, 1)
        d = np.hypot(u - (x0 + t * dx), v - (y0 + t * dy))
        w = width[i] + (width[i + 1] - width[i]) * t if isinstance(width, (list, tuple)) else np.full(u.shape, width)
        m = d < best
        best = np.where(m, d, best)
        wbest = np.where(m, w, wbest)
    return fill(best - wbest / 2, px)


def eye_mask(W, H, mirror):
    """윤곽 다각형 마스크 (슈퍼샘플 해상도)."""
    img = Image.new("L", (W, H), 0)
    pts = []
    for u, v in outline(180):
        uu = -u if mirror else u
        x = (uu / (2 * EYE_W) + 0.5) * W
        y = (0.5 - v / (2 * EYE_H)) * H
        pts.append((x, y))
    ImageDraw.Draw(img).polygon(pts, fill=255)
    return np.asarray(img, dtype=np.float32) / 255


def paint_eye(var, side):
    W, H = 256 * SS, 320 * SS
    mirror = side == "L"          # 왼쪽 눈: 바깥 눈꼬리가 -u
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    u = ((xs + 0.5) / W - 0.5) * 2 * EYE_W
    v = (0.5 - (ys + 0.5) / H) * 2 * EYE_H
    px = 2 * EYE_W / W
    P = IRIS[var]
    img = np.zeros((H, W, 4), dtype=np.float32)
    mask = eye_mask(W, H, mirror)
    # 1) 흰자: 위쪽은 속눈썹 그늘로 푸르스름하게
    white = rgb("#fffaf4")
    shade = rgb("#cfc3dc")
    t = smooth(0.2, 1.6, v)[..., None]
    img[..., :3] = white * (1 - t) + shade * t
    img[..., 3] = 1
    # 2) 홍채: 크고 세로로 긴 타원, 위는 짙고 아래로 갈수록 밝게
    ic_v = -0.12
    di = ell(u, v, 0, ic_v, 1.08, 1.5)
    gy = np.clip((v - ic_v) / 1.5, -1, 1)          # -1 아래 · +1 위
    dark, mid, light = rgb(P["dark"]), rgb(P["mid"]), rgb(P["light"])
    a1 = smooth(-0.1, 0.8, gy)[..., None]           # 위 → 짙게
    a2 = smooth(-1.0, -0.25, gy)[..., None]         # 아래 → 밝게
    iris = mid * (1 - a1) + dark * a1
    iris = iris * a2 + light * (1 - a2)
    # 홍채 결 (방사선) · 테두리
    ang = np.arctan2(v - ic_v, u)
    rr = np.hypot(u / 1.08, (v - ic_v) / 1.5)
    fib = 1 + 0.06 * np.sin(ang * 26) * smooth(0.35, 0.8, rr)
    iris = iris * fib[..., None]
    ringa = smooth(0.78, 0.98, rr)[..., None]
    iris = iris * (1 - ringa) + rgb(P["ring"]) * ringa
    img = over(img, iris, fill(di, px))
    # 3) 동공
    dp = ell(u, v, 0, ic_v + 0.08, 0.42, 0.64)
    img = over(img, rgb(P["pupil"]), fill(dp, px) * 0.95)
    # 4) 아래쪽 반사광 (초승달)
    dg = ell(u, v, 0, ic_v - 0.72, 0.72, 0.42)
    img = over(img, rgb(P["glow"]), fill(dg, px) * fill(di + 0.1, px) * 0.55 * smooth(-0.2, -1.0, gy))
    # 5) 위 그늘: 속눈썹 아래로 눈 위 30%를 어둡게 (깊이감)
    sh = smooth(0.55, 1.65, v) * 0.55
    img[..., :3] *= (1 - sh[..., None])
    # 6) 반짝임: 빛은 늘 보는 사람 기준 왼쪽 위 (두 눈 같은 쪽)
    hs = -1 if True else 1
    img = over(img, rgb("#ffffff"), fill(ell(u, v, 0.42 * hs, 0.48, 0.34, 0.44, rot=-0.35), px))
    img = over(img, rgb("#ffffff"), fill(ell(u, v, -0.46 * hs, -0.72, 0.15, 0.15), px))
    img = over(img, rgb("#ffffff"), fill(ell(u, v, 0.1 * hs, 0.95, 0.07, 0.07), px) * 0.9)
    # 7) 아래 속눈썹: 바깥 아래쪽 짧은 선
    lo = []
    for i in range(12):
        th = math.radians(-8 - 40 * i / 11)
        c, s = math.cos(th), math.sin(th)
        uu = EYE_W * c * 0.98
        vv = EYE_H * s * (1.0 - 0.1 * max(0.0, -c)) + 0.2 * (uu / EYE_W) * (1 + s)
        lo.append((-uu if mirror else uu, vv * 0.97))
    wlist = [0.02 + 0.07 * math.sin(math.pi * i / 11) for i in range(12)]
    img = over(img, rgb("#3a2230"), stroke_curve(u, v, lo, wlist, px) * 0.85)
    # 윤곽 밖은 투명 (가장자리 부드럽게)
    img[..., 3] *= mask
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGBA")
    im = im.resize((W // SS, H // SS), Image.LANCZOS)
    return im


# ── 얼굴 판 (16×15칸, 512×480): 칸 좌표 x ∈ [-8, 8], z ∈ [0, 15] (z 위)
def paint_face(expr):
    W, H = 512 * SS, 480 * SS
    ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
    x = (xs + 0.5) / W * 16 - 8
    z = 15 - (ys + 0.5) / H * 15
    px = 16 / W
    img = np.zeros((H, W, 4), dtype=np.float32)
    # 턱 그늘 (맨 아래 살짝)
    img = over(img, rgb("#e8b896"), smooth(0.7, 0.0, z) * 0.22)
    # 볼터치: 부드러운 타원 + 짧은 사선 3개
    for sx in (-1, 1):
        cx, cz = 5.75 * sx, 3.95
        d = ell(x, z, cx, cz, 1.3, 0.62)
        soft = np.clip(1 - (d + 0.62) / 0.9, 0, 1) ** 1.6
        img = over(img, rgb("#ff8fa6"), soft * (0.75 if expr != "smile" else 0.9))
        for k in (-0.5, 0.0, 0.5):
            p0 = (cx + k - 0.18, cz - 0.22)
            p1 = (cx + k + 0.18, cz + 0.22)
            img = over(img, rgb("#f0708c"), stroke_curve(x, z, [p0, p1], 0.08, px) * 0.8)
    mouth = rgb("#8a3340")
    if expr == "default":
        pts = [(-0.55 + 1.1 * i / 12, 3.05 + 0.34 * ((-0.55 + 1.1 * i / 12) / 0.55) ** 2) for i in range(13)]
        img = over(img, mouth, stroke_curve(x, z, pts, 0.14, px))
    elif expr == "smile":
        # 크게 벌린 D자 입 + 혀
        dtop = z - 3.45
        dm = np.maximum(ell(x, z, 0, 3.45, 0.72, 0.78), dtop)
        img = over(img, rgb("#a23a48"), fill(dm, px))
        dt = np.maximum(ell(x, z, 0, 2.72, 0.46, 0.32), dm)
        img = over(img, rgb("#ff8e9b"), fill(dt, px))
        top = [(-0.74 + 1.48 * i / 12, 3.45 + 0.05 * math.sin(math.pi * i / 12)) for i in range(13)]
        img = over(img, mouth, stroke_curve(x, z, top, 0.12, px))
    elif expr == "determined":
        pts = [(-0.5, 3.12), (-0.2, 3.2), (0.2, 3.2), (0.5, 3.12)]
        img = over(img, mouth, stroke_curve(x, z, pts, 0.15, px))
    elif expr == "surprised":
        do = ell(x, z, 0, 3.0, 0.3, 0.4)
        img = over(img, rgb("#a23a48"), fill(do, px))
        img = over(img, mouth, fill(np.abs(do) - 0.06, px))
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGBA")
    return im.resize((W // SS, H // SS), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for var in ("A", "B"):
        for side in ("L", "R"):
            paint_eye(var, side).save(os.path.join(OUT, f"eye_{var}_{side}.png"))
    for expr in ("default", "smile", "determined", "surprised"):
        f = paint_face(expr)
        for var in ("A", "B"):
            f.save(os.path.join(OUT, f"face_{var}_{expr}.png"))
    # 미리보기: 얼굴 판 위에 눈 텍스처를 올린 평면 합성 (확인용)
    for var in ("A", "B"):
        base = Image.new("RGBA", (512, 480), SKIN)
        base.alpha_composite(Image.open(os.path.join(OUT, f"face_{var}_default.png")))
        for side, sx in (("L", -1), ("R", 1)):
            e = Image.open(os.path.join(OUT, f"eye_{var}_{side}.png"))
            w, h = int(2 * EYE_W * 32), int(2 * EYE_H * 32)
            e = e.resize((w, h), Image.LANCZOS)
            cx = (EYE_CX * sx + 8) * 32
            cz = (15 - EYE_CZ) * 32
            base.alpha_composite(e, (int(cx - w / 2), int(cz - h / 2)))
        base.save(os.path.join(OUT, f"preview_{var}.png"))
    print("PAINT_DONE", OUT)


if __name__ == "__main__":
    main()
