# B2(샘플 시안) 눈 모양 — eye_shape.py와 같은 함수들(outline · upper_arc · top_bottom_at)을 제공한다.
# 단위: B2 얼굴 칸(3cm). 샘플 눈: 위는 거의 평평(짙은 속눈썹 가로줄), 옆은 거의 수직, 아래는 둥근 네모.
# 속눈썹은 윗선을 따라가다 바깥 눈꼬리에서 아래로 꺾여 내려온다(갈고리).
import math

EYE_W = 3.9         # 반폭 (칸) — 픽셀 눈 8칸 폭
EYE_H = 3.9         # 반높이
EYE_CX = 7.0        # 얼굴 가운데 → 눈 가운데
EYE_CZ = 9.0        # 머리 밑 → 눈 가운데
N_OUTLINE = 96
LASH_HOOK = 0.45    # 바깥 옆선을 따라 내려오는 속눈썹 길이 (반높이 비율)


def _r(th):
    """둥근 네모 반지름: 위는 모서리가 더 각지고(지수 4.5) 아래는 둥글게(2.6)."""
    c, s = math.cos(th), math.sin(th)
    p = 4.5 if s >= 0 else 2.6
    k = (abs(c / EYE_W) ** p + abs(s / EYE_H) ** p) ** (-1.0 / p)
    return k


def outline(n=N_OUTLINE):
    pts = []
    for i in range(n):
        th = 2 * math.pi * i / n
        r = _r(th)
        u, v = r * math.cos(th), r * math.sin(th)
        v -= 0.12 * (u / EYE_W) * max(0.0, math.sin(th))  # 바깥 눈꼬리(+u) 윗선이 살짝 처짐
        pts.append((u, v))
    return pts


def _pt(th):
    r = _r(th)
    u, v = r * math.cos(th), r * math.sin(th)
    v -= 0.12 * (u / EYE_W) * max(0.0, math.sin(th))
    return u, v


def upper_arc(n=40):
    """속눈썹 길: 안쪽 눈꼬리 위 → 윗선 → 바깥 모서리 → 바깥 옆선을 따라 LASH_HOOK만큼 아래로."""
    out = []
    th0 = math.pi * 0.93
    th_hook = -math.asin(min(0.95, LASH_HOOK))
    for i in range(n + 1):
        t = i / n
        th = th0 + (th_hook - th0) * t
        out.append(_pt(th))
    return out


def top_bottom_at(u):
    pts = outline(720)
    ups = [p for p in pts if p[1] >= 0]
    dns = [p for p in pts if p[1] < 0]

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
