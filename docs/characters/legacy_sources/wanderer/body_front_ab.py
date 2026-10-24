# build_wanderer_ab.py 안에서 exec. body_front.py 복사본 — 머리만 head_block.py(블록 머리·픽셀 얼굴·A/B 머리카락)로 바꿈.
# 옷·몸·소품은 body_front.py와 같다 (지시: 옷 디자인 변경 금지).
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
_HEAD_K = 0.96 if VARIANT == "B2" else 1.08  # grok2: slightly smaller head vs body
_NECK_Z = 1.10


def _zmap(z):
    for (a, a2), (b, b2) in zip(_ZMAP, _ZMAP[1:]):
        if z <= b:
            t = (z - a) / (b - a)
            return a2 + (b2 - a2) * t
    return None


def _widen(z):
    """높이별 가로(x)·두께(y) 배율. B2(샘플 시안)는 몸이 훨씬 옹골차다(망토 폭 ≈ 얼굴 폭 1.2배)."""
    k = (1.02, 1.02) if VARIANT == "B2" else (1.0, 1.0)  # grok2: near non-B2 slimness
    if VARIANT == "B2" and z < 0.44:
        k = (1.05, 1.0)   # 지시 2: 부츠는 덜 뭉툭하게
    if z < 0.24:
        w = (1.5, 1.3)     # 부츠 (간격도 넓게)
    elif z < 0.44:
        w = (1.45, 1.1)    # 정강이
    elif z < 0.74:
        w = (1.2, 1.12)    # 반바지
    else:
        w = (1.18, 1.12)   # 몸통·어깨·배낭
    return w[0] * k[0], w[1] * k[1]


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


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "head_b2.py" if VARIANT == "B2" else "head_block.py"), encoding="utf-8").read())
if VARIANT == "B2":  # 샘플 시안 옷: 흰 양말 · 흰 십자 패치 · 짙은 갈색 윗옷
    COL.update({"sock": "#f1ece4", "shirt": "#4a2e22", "patch": "#f4efe6"})
if EYES3D:
    exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "eyes_3d.py"), encoding="utf-8").read())


exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "props_guns.py"), encoding="utf-8").read())


def build_body(arm):
    P = []  # (object, bone)


    # ── 목 · 스카프 · 후드
    P.append((taper("neck", (0, 0, 1.12), (0, 0, 1.04), 0.055, 0.06, "skin", seg=10), "chest"))
    P.append((torus("scarf", (0, -0.005, 1.08), 0.095, 0.04, "scarf", scale=(1, 0.95, 1)), "chest"))
    P.append((ellipsoid("scarf_front", (0, -0.1, 1.03), (0.07, 0.04, 0.06), "scarf", seg=12), "chest"))
    if VARIANT != "B2":
        P.append((ellipsoid("hood", (0, 0.13, 1.09), (0.16, 0.08, 0.075), "coat", seg=16), "chest"))

    # ── 안쪽 셔츠 · 망토 몸판(앞 열림) · 크림 띠 · 지그재그
    P.append((taper("shirt", (0, 0, 1.03), (0, 0, 0.76), 0.14, 0.16, "shirt", seg=16, squash=(1, 0.8)), "spine"))
    if VARIANT == "B2":
        # 지시 2: 어깨 밖으로 넓게 퍼지는 케이프렛 (팔 바깥까지) · 앞은 목 아래로 갈수록 벌어짐
        cape = taper("cape_body", (0, 0.0, 1.09), (0, 0.01, 0.62), 0.11, 0.18, "coat", seg=32, squash=(1, 0.80), cap=False)  # grok2
    else:
        cape = taper("cape_body", (0, 0.005, 1.08), (0, 0.01, 0.8), 0.15, 0.22, "coat", seg=24, squash=(1, 0.82), cap=False)
    bm = bmesh.new()
    bm.from_mesh(cape.data)
    if VARIANT == "B2":
        kill = [f for f in bm.faces if f.calc_center_median().y < -0.08
                and abs(f.calc_center_median().x) < 0.03 + (1.09 - f.calc_center_median().z) * 0.32]
    else:
        kill = [f for f in bm.faces if f.calc_center_median().y < -0.12 and abs(f.calc_center_median().x) < 0.07]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(cape.data)
    bm.free()
    th = cape.modifiers.new("th", "SOLIDIFY")
    th.thickness = 0.018
    bpy.context.view_layer.objects.active = cape
    bpy.ops.object.modifier_move_to_index(modifier="th", index=0)
    P.append((cape, "chest"))
    if VARIANT == "B2":
        # 흰 단 + 흰 무늬 줄 (앞 열림은 비움)
        for nm, zz, rr, rt in (("cape_trim", 0.625, 0.182, 0.015), ("cape_line", 0.67, 0.168, 0.007)):  # grok2
            tr = torus(nm, (0, 0.01, zz), rr, rt, "cream", scale=(1, 0.74, 1), seg=48)
            bm2 = bmesh.new()
            bm2.from_mesh(tr.data)
            kill2 = [f for f in bm2.faces if (tr.location + f.calc_center_median()).y < -0.08
                     and abs((tr.location + f.calc_center_median()).x) < 0.03 + (1.09 - zz) * 0.32]
            bmesh.ops.delete(bm2, geom=kill2, context="FACES")
            bm2.to_mesh(tr.data)
            bm2.free()
            P.append((tr, "chest"))
        # 도톰한 흰 털 목깃 (청록 목폴라 아래)
        P.append((torus("fur_collar", (0, 0.0, 1.05), 0.11, 0.045, "fur", scale=(1, 0.9, 1), seg=32), "chest"))  # grok: slightly smaller
    else:
        P.append((torus("cape_trim", (0, 0.01, 0.81), 0.222, 0.016, "cream", scale=(1, 0.82, 1)), "chest"))
        P.append((zigzag_band("cape_zigzag", 0.845, 0.214, 0.03, 12, "cream", squash=(1, 0.82)), "chest"))
    if VARIANT == "B2":
        # 샘플 뒷모습: 머리카락 아래로 무릎 위까지 내려오는 주황 망토 + 흰 단
        back = taper("cape_back", (0, 0.03, 1.06), (0, 0.05, 0.58), 0.14, 0.18, "coat", seg=28, squash=(1, 0.80), cap=False)  # grok2
        bm = bmesh.new()
        bm.from_mesh(back.data)
        kill = [f for f in bm.faces if f.calc_center_median().y < 0.02]
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(back.data)
        bm.free()
        th2 = back.modifiers.new("th", "SOLIDIFY")
        th2.thickness = 0.02
        bpy.context.view_layer.objects.active = back
        bpy.ops.object.modifier_move_to_index(modifier="th", index=0)
        P.append((back, "chest"))
        hem = torus("cape_back_hem", (0, 0.05, 0.60), 0.18, 0.014, "cream", scale=(1, 0.80, 1))  # grok2
        bm = bmesh.new()
        bm.from_mesh(hem.data)
        kill = [f for f in bm.faces if (hem.matrix_world @ f.calc_center_median()).y < 0.05]
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        bm.to_mesh(hem.data)
        bm.free()
        P.append((hem, "chest"))

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
        if VARIANT == "B2":
            # 흰 십자 (앞·뒤)
            for yy, sz, nm in ((-0.126, 0.075, "patchf"), (0.134, 0.085, "patch")):
                P.append((rbox(f"{nm}_{side}", (0.105 * sx, yy, 0.54), (sz, 0.014, sz * 0.32), "patch", bevel=0.2, subsurf=1), f"thigh.{side}"))
                P.append((rbox(f"{nm}v_{side}", (0.105 * sx, yy, 0.54), (sz * 0.32, 0.014, sz), "patch", bevel=0.2, subsurf=1), f"thigh.{side}"))
        else:
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

        wing = (0.09, 0.10, 0.11) if VARIANT == "B2" else (0.1, 0.11, 0.13)  # grok2
        P.append((ellipsoid(f"cape_wing_{side}", (0.21 * sx, 0, 0.97), wing, "coat", seg=16), f"upperarm.{side}"))
        P.append((torus(f"wing_trim_{side}", (0.225 * sx, 0, 0.87), 0.085, 0.014, "cream",
                        rot=(0, math.radians(18 * sx), 0), scale=(1, 1.1, 1)), f"upperarm.{side}"))
        P.append((taper(f"sleeve_{side}", (0.21 * sx, 0, 1.0), (0.25 * sx, 0, 0.86), 0.07, 0.08, "coat", seg=14), f"upperarm.{side}"))
        P.append((zigzag_band(f"sleeve_zz_{side}", 0.0, 0.081, 0.018, 7, "cream"), f"upperarm.{side}"))
        bpy.data.objects[f"sleeve_zz_{side}"].location = (0.25 * sx, 0, 0.885)
        P.append((torus(f"cuff_{side}", (0.248 * sx, 0, 0.85), 0.055, 0.025, "fur", rot=(0, math.radians(-12 * sx), 0)), f"forearm.{side}"))
        P.append((taper(f"forearm_{side}", (0.25 * sx, 0, 0.85), (0.28 * sx, -0.015, 0.62), 0.042, 0.038, "glove", seg=10), f"forearm.{side}"))
        P.append((ellipsoid(f"hand_{side}", (0.285 * sx, -0.02, 0.575), (0.044, 0.04, 0.05), "skin", seg=12), f"forearm.{side}"))
        P.append((ellipsoid(f"glove_back_{side}", (0.285 * sx, -0.005, 0.595), (0.045, 0.032, 0.036), "glove", seg=10), f"forearm.{side}"))

    # ── 배낭 · 침낭 · 랜턴 (B2는 샘플처럼 긴 머리가 등을 덮어 배낭 없음)
    _pack_start = len(P)
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
    if VARIANT == "B2":
        for ob, _ in P[_pack_start:]:
            bpy.data.objects.remove(ob)
        del P[_pack_start:]

    # ── 소품: 정화총(오른손, 손에서 팔 방향으로 뻗는다 → 팔을 들면 앞을 겨눈다) · 정화 폭탄

    reshape_meshes([o for o, _ in P])
    # 총·폭탄은 재조형 뒤 좌표로 (props_guns.py)
    P += build_props()
    # 블록 머리는 재조형 후 좌표로 바로 만든다 (얼굴 격자가 늘어나면 안 된다)
    P += build_head_block()
    for ob, bone in P:
        attach(ob, arm, bone)
    return [o for o, _ in P]
