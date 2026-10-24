# 눈 모양 공용 정의 — paint_face.py(텍스처)와 eyes_3d.py(블렌더 입체)가 같은 윤곽을 쓴다.
# 단위: 얼굴 칸(FACE_CELL = 4.5cm). 눈 로컬 좌표 u(가로, +는 바깥 눈꼬리 쪽) · v(세로, +는 위).
# 오른쪽 눈(보는 사람 기준 오른쪽, +X) 기준으로 정의하고, 왼쪽 눈은 u를 뒤집어 쓴다.
import math

EYE_W = 1.72        # 반폭 (칸)
EYE_H = 2.12         # 반높이 (칸)
EYE_CX = 3.75       # 얼굴 가운데에서 눈 가운데까지 (칸)
EYE_CZ = 6.55       # 머리 밑(HZ0)에서 눈 가운데 높이 (칸)
N_OUTLINE = 72


def outline(n=N_OUTLINE):
    """눈 윤곽 (u, v) 점들. θ=0 바깥 눈꼬리, 90° 위, 180° 안쪽 눈꼬리, 270° 아래.
    위는 조금 납작하고 바깥 눈꼬리가 살짝 올라간다(귀엽고 또렷하게). 아래는 둥글다."""
    pts = []
    for i in range(n):
        th = 2 * math.pi * i / n
        c, s = math.cos(th), math.sin(th)
        u = EYE_W * c
        if s >= 0:
            v = EYE_H * 0.9 * s ** 0.85 + 0.2 * (u / EYE_W)
        else:
            v = EYE_H * s * (1.0 - 0.1 * max(0.0, -c)) + 0.2 * (u / EYE_W) * (1 + s)
        pts.append((u, v))
    return pts


def upper_arc(n=40):
    """윗속눈썹이 따라가는 윗선: 안쪽 눈꼬리(θ=180°) → 위 → 바깥 눈꼬리(θ=0)."""
    out = []
    for i in range(n + 1):
        th = math.pi * (1 - i / n)
        c, s = math.cos(th), math.sin(th)
        u = EYE_W * c
        v = EYE_H * 0.9 * s ** 0.85 + 0.2 * (u / EYE_W)
        out.append((u, v))
    return out


def top_bottom_at(u):
    """세로선 u에서 윤곽 위·아래 v (눈꺼풀 만들 때)."""
    pts = outline(360)
    ups = [p for p in pts if p[1] >= 0.2 * (p[0] / EYE_W) - 1e-9]
    dns = [p for p in pts if p[1] < 0.2 * (p[0] / EYE_W)]

    def interp(seq):
        seq = sorted(seq)
        if u <= seq[0][0]:
            return seq[0][1]
        if u >= seq[-1][0]:
            return seq[-1][1]
        for (u0, v0), (u1, v1) in zip(seq, seq[1:]):
            if u0 <= u <= u1:
                k = (u - u0) / max(1e-9, u1 - u0)
                return v0 + (v1 - v0) * k
        return seq[-1][1]
    return interp(ups), interp(dns)
