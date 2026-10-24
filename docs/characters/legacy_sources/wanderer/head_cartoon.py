# body_front.py 안에서 exec. 카툰 머리·얼굴 (로비 lobby_actor_still.png 목표, KayKit 셸 방식 참고).
# 머리카락 = 두피를 감싸는 두툼한 셸 + 곡선을 따라 휘는 굵고 뾰족한 가닥(적게).
# 얼굴 = 볼살 있는 머리 + 큰 세로 타원 눈(홍채·하이라이트 2개·속눈썹) + 볼터치 + 곡선 미소, 코 없음.

COL.update({
    "hair": "#9a6440",
    "hair_shadow": "#7c4c2e",
    "hair_deep": "#5e3820",
    "skin": "#f4cdb0",
    "eye": "#2b1d1a",
    "eye_iris": "#8a5a3c",
    "eye_hi": "#ffffff",
    "lash": "#2a1a16",
    "blush": "#f39a8c",
    "mouth": "#8a3e33",
})


def sweep(name, pts, widths, thick, material, subsurf=1, seg=8):
    """경로를 따라 납작한 타원 단면을 끌어 만든 가닥. widths/thick = 점마다 폭·두께, 끝은 뾰족."""
    bm = bmesh.new()
    rings = []
    n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(n - 1, i + 1)] - pts[max(0, i - 1)]).normalized()
        # 단면 방향: 머리 중심에서 바깥(두께) · 그와 경로에 수직(폭)
        outward = (p - HEAD_C).normalized()
        nrm = (outward - t * outward.dot(t)).normalized()
        side = t.cross(nrm).normalized()
        ring = []
        for k in range(seg):
            a = k / seg * math.tau
            v = p + side * (math.cos(a) * widths[i]) + nrm * (math.sin(a) * thick[i])
            ring.append(bm.verts.new(v))
        rings.append(ring)
    for i in range(n - 1):
        for k in range(seg):
            k2 = (k + 1) % seg
            bm.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
    # 뿌리 막기 + 끝점
    bm.faces.new(list(reversed(rings[0])))
    tip = bm.verts.new(pts[-1] + (pts[-1] - pts[-2]).normalized() * 0.012)
    for k in range(seg):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % seg], tip))
    return finish(from_bm(name, bm), material, subsurf)


def bez(p0, p1, p2, steps=9):
    return [p0 * (1 - t) ** 2 + p1 * 2 * (1 - t) * t + p2 * t * t for t in (i / (steps - 1) for i in range(steps))]


def lock_curve(name, el0, az0, el1, az1, width, material, out0=0.035, out1=0.06, bulge=0.05, thick=0.035, flick=0.0):
    """머리 표면 (el0,az0)에서 (el1,az1)로 휘는 가닥. out = 표면에서 띄우는 거리, flick = 끝을 바깥으로."""
    a, na = on_head(el0, az0, out0)
    b, nb = on_head(el1, az1, out1)
    mid_el, mid_az = (el0 + el1) / 2, (az0 + az1) / 2
    m, nm = on_head(mid_el, mid_az, (out0 + out1) / 2 + bulge)
    pts = bez(a, m, b + nb * flick)
    N = len(pts)
    w = [width * (1.0 - (i / (N - 1)) ** 1.6) + 0.004 for i in range(N)]
    th = [thick * (1.0 - 0.7 * (i / (N - 1))) + 0.003 for i in range(N)]
    return sweep(name, pts, w, th, material)


def build_head_cartoon():
    P = []
    # ── 머리: 볼살(아래쪽 옆으로 불룩) · 작은 턱
    head = ellipsoid("head", HEAD_C, HEAD_R, "skin", seg=32)
    me = head.data
    for v in me.vertices:
        d = v.co - HEAD_C
        dz = d.z / HEAD_R[2]
        if dz < 0.1:
            k = 1.0 + 0.10 * math.sin(max(0.0, min(1.0, (0.1 - dz) / 0.7)) * math.pi)  # 볼살
            v.co.x = HEAD_C.x + d.x * k
            if d.y < 0:
                v.co.y = HEAD_C.y + d.y * (1.0 + 0.05 * (k - 1.0) * 10)
        if dz < -0.55:
            s = 1.0 - (-0.55 - dz) * 0.35  # 턱은 좁게
            v.co.x = HEAD_C.x + (v.co.x - HEAD_C.x) * s
    me.update()
    P.append((head, "head"))
    for sx in (1, -1):
        P.append((ellipsoid(f"ear{sx}", HEAD_C + Vector((0.262 * sx, 0.015, -0.035)), (0.028, 0.042, 0.055), "skin", seg=12), "head"))

    # ── 눈: 큰 세로 타원(짙은 갈색) + 아래쪽 밝은 홍채 + 하이라이트 둘 + 위 속눈썹
    for sx in (1, -1):
        ec, en = on_head(-15, 24 * sx, -0.008)
        rot = (0, 0, math.radians(-25 * sx))
        P.append((ellipsoid(f"eye{sx}", ec, (0.06, 0.024, 0.074), "eye", seg=16, rot=rot), "head"))
        ic, _ = on_head(-21, 24 * sx, 0.011)
        P.append((ellipsoid(f"iris{sx}", ic, (0.042, 0.008, 0.034), "eye_iris", seg=12, rot=rot, subsurf=0), "head"))
        h1, _ = on_head(-9, 20 * sx, 0.017)
        P.append((ellipsoid(f"eyehi{sx}", h1, (0.02, 0.006, 0.024), "eye_hi", seg=10, subsurf=0), "head"))
        h2, _ = on_head(-22, 29 * sx, 0.017)
        P.append((ellipsoid(f"eyehi2{sx}", h2, (0.008, 0.004, 0.009), "eye_hi", seg=8, subsurf=0), "head"))
        # 눈꼬리: 윗선 바깥쪽에 붙은 짧은 속눈썹
        lash = [on_head(-4 + 1.5 * t, (30 + 6 * t) * sx, 0.012)[0] for t in (0, 0.5, 1)]
        P.append((sweep(f"lash{sx}", lash, [0.006, 0.006, 0.004], [0.005] * 3, "lash", subsurf=0), "head"))
        bc, _ = on_head(-29, 40 * sx, -0.002)
        P.append((ellipsoid(f"blush{sx}", bc, (0.036, 0.008, 0.019), "blush", seg=12, rot=(0, 0, math.radians(-41 * sx)), subsurf=0), "head"))
    # ── 미소: 가운데가 내려간 짧은 곡선
    smile = [on_head(-38 - 2.2 * (1 - t * t), 6 * t, 0.002)[0] for t in (-1, -0.5, 0, 0.5, 1)]
    P.append((sweep("mouth", smile, [0.004, 0.006, 0.007, 0.006, 0.004], [0.004] * 5, "mouth", subsurf=0), "head"))

    # ── 머리카락 셸: 머리보다 한 겹 크게, 이마·귀 위에서 끊고 뒤는 목덜미까지
    shell = ellipsoid("hair_shell", HEAD_C + Vector((0, 0.012, 0.018)), (HEAD_R[0] * 1.1, HEAD_R[1] * 1.12, HEAD_R[2] * 1.08), "hair", seg=32, subsurf=0)
    bm = bmesh.new()
    bm.from_mesh(shell.data)
    kill = []
    for f in bm.faces:
        c = f.calc_center_median() - HEAD_C
        el = math.degrees(math.asin(max(-1, min(1, c.z / max(1e-6, c.length)))))
        az = math.degrees(math.atan2(c.x, -c.y))  # 0 = 앞
        front = abs(az) < 60
        side = 60 <= abs(az) < 110
        limit = 16 if front else (5 if side else -40)  # 앞은 이마 위, 옆은 귀 위, 뒤는 목덜미
        if el < limit:
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(shell.data)
    bm.free()
    so = shell.modifiers.new("th", "SOLIDIFY")
    so.thickness = 0.028
    so.offset = -1
    sub = shell.modifiers.new("sub", "SUBSURF")
    sub.levels = 2
    for p_ in shell.data.polygons:
        p_.use_smooth = True
    P.append((shell, "head"))

    # ── 가닥 (적게, 굵게)
    L = []
    # 앞머리 6: 정수리 앞에서 이마를 덮고 눈썹 위에서 끝남, 좌우로 번갈아 휨
    for i, (az, end) in enumerate(((-50, 10), (-30, 16), (-10, 8), (10, 14), (29, 7), (48, 12))):
        sway = 16 if i % 2 else -14
        L.append(("bang", 64, az * 0.55, end, az + sway, 0.095, 0.022, 0.055, 0.015))
    # 옆머리: 귀 앞으로 내려와 볼을 감쌈
    for sx in (1, -1):
        L.append(("side", 40, 66 * sx, -26, 74 * sx, 0.07, 0.03, 0.045, 0.02))
        L.append(("side2", 30, 88 * sx, -12, 100 * sx, 0.065, 0.03, 0.05, 0.04))
        # 관자놀이 삐침: 바깥 위로 튄다
        L.append(("tuft", 42, 92 * sx, 22, 112 * sx, 0.055, 0.04, 0.05, 0.05))
    # 정수리 소용돌이: 가운데에서 사방으로
    for az in (0, 60, 120, 180, 240, 300):
        L.append(("crown", 84, az, 50, az + 28, 0.1, 0.03, 0.06, 0.0))
    # 뒷머리: 층 두 줄, 끝이 바깥으로 뻗침
    for az in (130, 155, 180, 205, 230):
        L.append(("back", 35, az, -30, az + (8 if az < 180 else -8), 0.085, 0.03, 0.05, 0.05))
    for az in (145, 180, 215):
        L.append(("nape", 5, az, -52, az, 0.07, 0.03, 0.04, 0.07))
    for n, (kind, el0, az0, el1, az1, w, o0, bul, fl) in enumerate(L):
        mat = "hair" if n % 5 else "hair_shadow"
        P.append((lock_curve(f"hair_{kind}{n}", el0, az0, el1, az1, w, mat, out0=o0, out1=o0 + 0.02, bulge=bul, flick=fl), "head"))
    # 더듬이(아호게): 앞으로 휘었다 뒤로 말림
    a0, _ = on_head(80, 0, 0.02)
    ah = [a0 + Vector((0, -0.02 * t, 0.2 * t)) + Vector((0, -0.07 * math.sin(t * math.pi), 0)) for t in (i / 9 for i in range(10))]
    ah += [ah[-1] + Vector((0, 0.03, -0.02)), ah[-1] + Vector((0, 0.05, -0.06))]
    n_ = len(ah)
    P.append((sweep("ahoge", ah, [0.034 * (1 - i / n_) + 0.005 for i in range(n_)], [0.016] * n_, "hair"), "head"))
    return P
