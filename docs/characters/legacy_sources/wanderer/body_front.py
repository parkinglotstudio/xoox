# build_wanderer.py 안에서 exec로 불러와 build_body를 덮어쓴다.
# 비율·얼굴: 로비 앞모습(data/ui/lobby/lobby_actor_still.png) · 등: 여정 스프라이트.
# 머리(머리카락 포함)가 키의 약 1/3.

COL.update({
    "coat": "#e5803f",
    "shirt": "#2c5a5e",
    "scarf": "#5aa89a",
    "blush": "#f09a8a",
    "eye_hi": "#ffffff",
    "mouth": "#9a4a3a",
    "lantern": "#3f8f8a",
    "lantern_glow": "#ffb35a",
    "boot_cream": "#7a4a2c",
    "sock": "#27366a",
    "tag": "#6fc0b3",
})

HEAD_C = Vector((0, -0.005, 1.33))
HEAD_R = (0.255, 0.24, 0.26)

# ── 2.5등신으로 다시 빚기 ─────────────────────────────
# 처음엔 보통 비율로 빚고, 마지막에 구간별로 늘이고 줄인다.
# 다리 짧게 · 반바지·부츠 두툼하게 · 몸통 넓게 · 머리 크게 (로비 앞모습 · 스프라이트 기준)
# 스프라이트 실측(키 1.7m 환산): 부츠 위 0.2 · 무릎 0.4 · 반바지 위(벨트) 0.8 · 어깨 1.18 · 머리 약 1/4
_ZMAP = [(0.0, 0.0), (0.10, 0.14), (0.42, 0.40), (0.70, 0.78), (1.10, 1.2)]
_HEAD_K = 1.08
_NECK_Z = 1.10


def _zmap(z):
    for (a, a2), (b, b2) in zip(_ZMAP, _ZMAP[1:]):
        if z <= b:
            t = (z - a) / (b - a)
            return a2 + (b2 - a2) * t
    return None


def _widen(z):
    """높이별 가로(x)·두께(y) 배율."""
    if z < 0.24:
        return 1.5, 1.3    # 부츠 (간격도 넓게)
    if z < 0.44:
        return 1.45, 1.1   # 정강이
    if z < 0.74:
        return 1.2, 1.12   # 반바지
    return 1.18, 1.12      # 몸통·어깨·배낭


def reshape_point(v):
    v = Vector(v)
    if v.z > _NECK_Z:
        hc = Vector((HEAD_C.x, HEAD_C.y, HEAD_C.z))
        hc2 = Vector((0, HEAD_C.y, _zmap(_NECK_Z) + (HEAD_C.z - _NECK_Z) * _HEAD_K))
        return hc2 + (v - hc) * _HEAD_K
    wx, wy = _widen(v.z)
    return Vector((v.x * wx, v.y * wy, _zmap(max(0.0, v.z))))


def reshape_meshes(objs):
    for ob in objs:
        me = ob.data
        mw = ob.matrix_world.copy()
        inv = mw.inverted()
        for vt in me.vertices:
            vt.co = inv @ reshape_point(mw @ vt.co)
        me.update()


# 뼈 위치도 같은 규칙으로 (build_armature 전에 실행된다)
for _k, (_h, _t, _p) in list(BONES.items()):
    BONES[_k] = (tuple(reshape_point(_h)), tuple(reshape_point(_t)), _p)


def lock(name, base, d, length, width, material, flick=False, twist=0.0):
    """두툼한 머리 다발: 두피에 붙어 아래로 흘러내리는 납작한 타원체."""
    n = d.normalized()
    down = Vector((0, 0.25, -1.0))
    t = (down - n * down.dot(n)).normalized()  # 표면을 따라 내려가는 방향
    t = (Matrix.Rotation(math.radians(twist), 3, n) @ t).normalized()  # 제멋대로 뻗치게
    s = n.cross(t).normalized()
    m = Matrix((s, t, n)).transposed()  # 열 = (옆, 길이, 두께)
    c = base + t * (length * 0.42) + n * 0.012
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=1.0)
    for vt in bm.verts:
        # 끝으로 갈수록 가늘게 (물방울)
        k = 1.0 - 0.55 * max(0.0, vt.co.y)
        z = vt.co.z * 0.045 * k
        if flick:  # 끝을 바깥으로 살짝 튕긴다
            z += max(0.0, vt.co.y) ** 2 * 0.075
        vt.co = Vector((vt.co.x * width * k, vt.co.y * length * 0.55, z))
    bmesh.ops.rotate(bm, matrix=m.to_3x3(), verts=bm.verts)
    bmesh.ops.translate(bm, vec=c, verts=bm.verts)
    return finish(from_bm(name, bm), material, 1)


def on_head(el_deg, az_deg, out=0.0):
    """머리 표면 점. az 0 = 앞(-Y), 90 = 왼쪽(+X)."""
    el, az = math.radians(el_deg), math.radians(az_deg)
    d = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    p = HEAD_C + Vector((d.x * (HEAD_R[0] + out), d.y * (HEAD_R[1] + out), d.z * (HEAD_R[2] + out)))
    return p, d


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "head_cartoon.py"), encoding="utf-8").read())


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "props_guns.py"), encoding="utf-8").read())


def build_body(arm):
    P = []  # (object, bone)

    # ── 머리 · 얼굴: 카툰 버전 (head_cartoon.py)
    P += build_head_cartoon()

    # ── 목 · 스카프 · 후드
    P.append((taper("neck", (0, 0, 1.12), (0, 0, 1.04), 0.055, 0.06, "skin", seg=10), "chest"))
    P.append((torus("scarf", (0, -0.005, 1.08), 0.095, 0.04, "scarf", scale=(1, 0.95, 1)), "chest"))
    P.append((ellipsoid("scarf_front", (0, -0.1, 1.03), (0.07, 0.04, 0.06), "scarf", seg=12), "chest"))
    P.append((ellipsoid("hood", (0, 0.13, 1.09), (0.16, 0.08, 0.075), "coat", seg=16), "chest"))

    # ── 안쪽 셔츠 · 망토 몸판(앞 열림) · 크림 띠 · 지그재그
    P.append((taper("shirt", (0, 0, 1.03), (0, 0, 0.76), 0.14, 0.16, "shirt", seg=16, squash=(1, 0.8)), "spine"))
    cape = taper("cape_body", (0, 0.005, 1.08), (0, 0.01, 0.8), 0.15, 0.22, "coat", seg=24, squash=(1, 0.82), cap=False)
    bm = bmesh.new()
    bm.from_mesh(cape.data)
    kill = [f for f in bm.faces if f.calc_center_median().y < -0.12 and abs(f.calc_center_median().x) < 0.07]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(cape.data)
    bm.free()
    th = cape.modifiers.new("th", "SOLIDIFY")
    th.thickness = 0.018
    bpy.context.view_layer.objects.active = cape
    bpy.ops.object.modifier_move_to_index(modifier="th", index=0)
    P.append((cape, "chest"))
    P.append((torus("cape_trim", (0, 0.01, 0.81), 0.222, 0.016, "cream", scale=(1, 0.82, 1)), "chest"))
    P.append((zigzag_band("cape_zigzag", 0.845, 0.214, 0.03, 12, "cream", squash=(1, 0.82)), "chest"))

    # ── 벨트 · 버클 · 파우치 · 가로 끈 · 태그
    P.append((torus("belt", (0, 0, 0.74), 0.172, 0.022, "belt", scale=(1, 0.8, 1)), "hips"))
    P.append((rbox("buckle", (0.03, -0.142, 0.74), (0.05, 0.015, 0.045), "roll_band", bevel=0.3, subsurf=1), "hips"))
    P.append((rbox("pouch_front", (0.1, -0.125, 0.69), (0.1, 0.05, 0.085), "pouch", bevel=0.45), "hips"))
    P.append((rbox("pouch_side", (-0.19, 0.02, 0.7), (0.05, 0.09, 0.08), "pouch", bevel=0.45), "hips"))
    P.append((taper("cross_strap", (-0.13, -0.12, 1.02), (0.16, -0.13, 0.78), 0.018, 0.018, "strap", seg=6, squash=(1, 0.4)), "chest"))
    P.append((rbox("tag", (0.02, -0.15, 0.93), (0.035, 0.012, 0.05), "tag", bevel=0.3, subsurf=1), "chest"))

    # ── 반바지(풍성) · 패치 · 다리 · 부츠 · 팔
    P.append((ellipsoid("shorts_seat", (0, 0.01, 0.66), (0.18, 0.15, 0.1), "shorts", seg=18), "hips"))
    for sx, side in ((1, "L"), (-1, "R")):
        P.append((ellipsoid(f"shorts_{side}", (0.1 * sx, 0.005, 0.55), (0.12, 0.13, 0.15), "shorts", seg=18), f"thigh.{side}"))
        P.append((torus(f"shorts_hem_{side}", (0.105 * sx, 0.005, 0.43), 0.075, 0.022, "shorts"), f"thigh.{side}"))
        P.append((rbox(f"patch_{side}", (0.105 * sx, 0.132, 0.55), (0.1, 0.014, 0.1), "patch",
                       rot=(math.radians(-10), math.radians(45), 0), bevel=0.2, subsurf=1), f"thigh.{side}"))
        P.append((ellipsoid(f"leaf_{side}", (0.105 * sx, 0.142, 0.55), (0.018, 0.005, 0.032), "leaf", seg=8, subsurf=0), f"thigh.{side}"))
        P.append((rbox(f"patchf_{side}", (0.11 * sx, -0.124, 0.53), (0.06, 0.012, 0.06), "patch",
                       rot=(math.radians(10), math.radians(45), 0), bevel=0.2, subsurf=1), f"thigh.{side}"))
        P.append((taper(f"shin_{side}", (0.105 * sx, 0.005, 0.44), (0.11 * sx, 0.01, 0.2), 0.05, 0.044, "sock", seg=12), f"shin.{side}"))
        P.append((torus(f"boot_fur_{side}", (0.11 * sx, 0.01, 0.235), 0.06, 0.03, "fur"), f"shin.{side}"))
        P.append((taper(f"boot_{side}", (0.11 * sx, 0.01, 0.225), (0.11 * sx, 0.01, 0.06), 0.062, 0.07, "boot_cream", seg=14), f"shin.{side}"))
        P.append((torus(f"boot_strap_{side}", (0.11 * sx, 0.01, 0.13), 0.068, 0.012, "boot"), f"shin.{side}"))
        P.append((ellipsoid(f"toe_{side}", (0.11 * sx, -0.07, 0.055), (0.066, 0.1, 0.055), "boot_cream", seg=14), f"foot.{side}"))
        P.append((rbox(f"sole_{side}", (0.11 * sx, -0.035, 0.016), (0.135, 0.245, 0.032), "boot", bevel=0.5), f"foot.{side}"))

        P.append((ellipsoid(f"cape_wing_{side}", (0.2 * sx, 0, 0.98), (0.1, 0.11, 0.13), "coat", seg=16), f"upperarm.{side}"))
        P.append((torus(f"wing_trim_{side}", (0.225 * sx, 0, 0.87), 0.085, 0.014, "cream",
                        rot=(0, math.radians(18 * sx), 0), scale=(1, 1.1, 1)), f"upperarm.{side}"))
        P.append((taper(f"sleeve_{side}", (0.21 * sx, 0, 1.0), (0.25 * sx, 0, 0.86), 0.07, 0.08, "coat", seg=14), f"upperarm.{side}"))
        P.append((zigzag_band(f"sleeve_zz_{side}", 0.0, 0.081, 0.018, 7, "cream"), f"upperarm.{side}"))
        bpy.data.objects[f"sleeve_zz_{side}"].location = (0.25 * sx, 0, 0.885)
        P.append((torus(f"cuff_{side}", (0.248 * sx, 0, 0.85), 0.055, 0.025, "fur", rot=(0, math.radians(-12 * sx), 0)), f"forearm.{side}"))
        P.append((taper(f"forearm_{side}", (0.25 * sx, 0, 0.85), (0.28 * sx, -0.015, 0.62), 0.042, 0.038, "glove", seg=10), f"forearm.{side}"))
        P.append((ellipsoid(f"hand_{side}", (0.285 * sx, -0.02, 0.575), (0.044, 0.04, 0.05), "skin", seg=12), f"forearm.{side}"))
        P.append((ellipsoid(f"glove_back_{side}", (0.285 * sx, -0.005, 0.595), (0.045, 0.032, 0.036), "glove", seg=10), f"forearm.{side}"))

    # ── 배낭 · 침낭 · 랜턴
    P.append((rbox("pack_body", (0, 0.21, 0.95), (0.34, 0.17, 0.36), "pack", bevel=0.35), "pack"))
    P.append((rbox("pack_lid", (0, 0.225, 1.11), (0.35, 0.18, 0.08), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("pack_pocket_top", (0, 0.3, 1.0), (0.2, 0.05, 0.1), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("pack_pocket_bot", (0, 0.3, 0.86), (0.24, 0.06, 0.12), "pack_dark", bevel=0.4), "pack"))
    P.append((rbox("clasp_top", (0, 0.328, 1.02), (0.035, 0.012, 0.045), "clasp", bevel=0.3, subsurf=1), "pack"))
    P.append((rbox("clasp_bot", (0, 0.332, 0.89), (0.035, 0.012, 0.045), "clasp", bevel=0.3, subsurf=1), "pack"))
    for sx in (1, -1):
        P.append((rbox(f"pack_side{sx}", (0.18 * sx, 0.21, 0.9), (0.04, 0.12, 0.16), "pack_dark", bevel=0.4), "pack"))
        P.append((rbox(f"strap{sx}", (0.1 * sx, -0.1, 0.99), (0.04, 0.02, 0.2), "strap", rot=(math.radians(-8), 0, 0), bevel=0.3, subsurf=1), "chest"))
        P.append((rbox(f"strap_top{sx}", (0.1 * sx, 0.03, 1.1), (0.045, 0.2, 0.025), "strap", bevel=0.3, subsurf=1), "chest"))
    P.append((taper("bedroll", (0.21, 0.21, 1.2), (-0.21, 0.21, 1.2), 0.065, 0.065, "roll", seg=20, subsurf=1), "pack"))
    for sx in (1, -1):
        P.append((torus(f"roll_band{sx}", (0.1 * sx, 0.21, 1.2), 0.067, 0.01, "roll_band", rot=(0, math.radians(90), 0)), "pack"))
        P.append((ellipsoid(f"roll_end{sx}", (0.213 * sx, 0.21, 1.2), (0.006, 0.03, 0.03), "clasp", seg=10, subsurf=0), "pack"))
    P.append((taper("lantern_hook", (-0.2, 0.2, 0.98), (-0.21, 0.2, 0.9), 0.006, 0.006, "roll_band", seg=6), "pack"))
    P.append((taper("lantern_body", (-0.215, 0.2, 0.9), (-0.215, 0.2, 0.8), 0.04, 0.045, "lantern", seg=12), "pack"))
    P.append((ellipsoid("lantern_glow", (-0.215, 0.2, 0.85), (0.028, 0.028, 0.03), "lantern_glow", seg=10), "pack"))

    # ── 소품: 정화총(오른손, 손에서 팔 방향으로 뻗는다 → 팔을 들면 앞을 겨눈다) · 정화 폭탄

    reshape_meshes([o for o, _ in P])
    # 총·폭탄은 재조형 뒤 좌표로 (props_guns.py)
    P += build_props()
    for ob, bone in P:
        attach(ob, arm, bone)
    return [o for o, _ in P]
