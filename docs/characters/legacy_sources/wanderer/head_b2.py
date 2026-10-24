# body_front_ab.py 안에서 exec (VARIANT == "B2"). 샘플 시안(ref_b2/sample.png) 그대로의 B안.
#  - 머리 격자 24×22×19칸 (한 칸 3cm, 지금 머리와 같은 크기) → 얼굴 픽셀이 1.5배 촘촘
#  - 얼굴 = 픽셀 그림 (샘플의 눈: 짙은 윗속눈썹 + 바깥 꼬리 · 위 짙은 갈색/아래 호박 홍채 · 흰 십자 반짝임 · 바깥 흰자)
#    표정: default · smile(^^) · blink · determined · surprised  (판마다 24×22 → 8배 키운 192×176, 픽셀 그대로)
#  - 머리카락: 크림 → 민트 → 청록 그라데이션 (높이 띠 7단), 허리까지 오는 긴 뒷머리, 물결 옆머리, 꺾인 아호게, 잎·꽃 핀
# head_block.py의 도우미(hbox·cpt·spike·face_plane…)를 빌려 쓰고 상수만 바꾼다.
_V = VARIANT
VARIANT = "B"
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "head_block.py"), encoding="utf-8").read())
VARIANT = _V

FACE_CELL = 0.03
FW, FH, FD = 24, 22, 19
HEAD_BOT = NECK_TOP + 0.05
FACE_Y = -0.02 - FD * FACE_CELL / 2
HX = FW * FACE_CELL / 2
HZ0, HZ1 = HEAD_BOT, HEAD_BOT + FH * FACE_CELL
HCZ = (HZ0 + HZ1) / 2
FACE_UP = 8  # 픽셀 판을 8배로 키워 저장 (툴이 판째 붙이는 고해상도 경로를 타게)

COL.update({
    # 툴 조명(ACES·환경광)에서 하얗게 날아가지 않게 샘플보다 한 톤 진하게
    "skin": "#eab896",
    "skin_shade": "#9a6a4e",  # grok: chin AO
    "hair_c0": "#d6b36c", "hair_c1": "#cab574", "hair_c2": "#abb77c", "hair_c3": "#80ae86",
    "hair_c4": "#59a084", "hair_c5": "#3e8d7a", "hair_c6": "#2e786c",
    "clip_leaf": "#57a64a", "clip_leaf_hi": "#9bd57c", "clip_flower": "#e3953a", "clip_flower_c": "#b8702a",
})

# ── 얼굴 픽셀 (24 × 22, 위 줄부터). 위 9줄은 앞머리가 덮는다.
FACE_PAL = {
    "K": "#2b1510", "D": "#4b2515", "P": "#231009", "W": "#ffffff", "S": "#f3eeea",
    "O": "#e48a2c", "L": "#f6b24a", "B": "#c79d74", "C": "#f2a3a0", "M": "#b33440", "T": "#ff8f8f",
    "s": "#9a6a4e",
}
# 왼쪽 눈(보는 사람 기준, 바깥 = 왼쪽) 7×7. 오른쪽 눈은 좌우 뒤집음.
EYE_OPEN = [
    ".KKKKKKK",
    "KKDDDWDD",
    "KSDDWWWD",
    "KSDDDWDD",
    "KSOOPPOO",
    ".SOOOOOO",
    ".SOOOOOL",
    "..LLLLL.",
]
EYE_DETERMINED = [
    "........",
    "KKKKKKKK",
    "KSDDWWWD",
    "KSDDDWDD",
    "KSOOPPOO",
    ".SOOOOOO",
    ".SOOOOOL",
    "..LLLLL.",
]
EYE_SMILE = [
    "........",
    "........",
    "..KKKK..",
    ".K....K.",
    "K......K",
    "........",
    "........",
    "........",
]
EYE_BLINK = [
    "........",
    "........",
    "........",
    "........",
    "........",
    "KKKKKKK.",
    "K.......",
    "........",
]


def _mirror(rows):
    return [r[::-1] for r in rows]


def _compose(eye, mouth):
    g = [["."] * FW for _ in range(FH)]

    def put(rows, x0, y0):
        for j, r in enumerate(rows):
            for i, ch in enumerate(r):
                if ch != ".":
                    g[y0 + j][x0 + i] = ch
    if eye is not None:
        put(eye, 1, 9)
        put(_mirror(eye), 15, 9)
    if eye is not EYE_SMILE and eye is not EYE_BLINK:
        put(["BBB"], 4, 7)
        put(["BBB"], 17, 7)
    put(["CCC", "CCC"], 1, 17)
    put(["CCC", "CCC"], 20, 17)
    put(mouth, 10, 17)
    # grok: U chin outline + under-chin shade (tip 5.2). CHIN_Z=2.5 not yet defined here.
    for r in range(FH - 8, FH):
        z = FH - 1 - r + 0.5
        if z < 1.5:
            continue
        k = max(0.0, (2.5 + 6.0 - z) / 6.0) if z < 2.5 + 6.0 else 0.0
        xm = 4.0 + 7.9 * math.sqrt(max(0.0, 1 - k * k)) if z < 8.5 else 11.9
        for cidx in range(FW):
            x = cidx - FW / 2 + 0.5
            if xm - 1.2 <= abs(x) <= xm + 0.15 or (z < 4.0 and abs(x) <= xm):
                if g[r][cidx] == ".":
                    g[r][cidx] = "s"
    return ["".join(r) for r in g]


MOUTH_OPEN = ["MMMM", ".TT."]
MOUTH_FLAT = ["MMMM"]
MOUTH_O = [".MM.", ".MM."]
# 눈은 입체(eyes_3d.py · eye_shape_b2.py · paint_face_b2.py): 판에는 눈썹·볼·입만. 깜빡임·웃는 눈은 눈꺼풀 모양 키
FACES = {
    "default": _compose(None, MOUTH_OPEN),
    "smile": _compose(EYE_SMILE, MOUTH_OPEN),
    "determined": _compose(None, MOUTH_FLAT),
    "surprised": _compose(None, MOUTH_O),
}
FACES["smile"] = _compose(None, MOUTH_OPEN)


def face_image(name, rows):
    assert len(rows) == FH and all(len(r) == FW for r in rows), name
    Wp, Hp = FW * FACE_UP, FH * FACE_UP
    img = bpy.data.images.new(f"face_c{FW}_{name}", Wp, Hp, alpha=True)
    px = [0.0] * (Wp * Hp * 4)
    for yy in range(FH):
        r = rows[FH - 1 - yy]  # Blender 이미지는 아래 줄부터
        for xx, ch in enumerate(r):
            if ch not in FACE_PAL:
                continue
            h = FACE_PAL[ch].lstrip("#")
            c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1.0]
            for dy in range(FACE_UP):
                row0 = ((yy * FACE_UP + dy) * Wp + xx * FACE_UP) * 4
                for dx in range(FACE_UP):
                    k = row0 + dx * 4
                    px[k:k + 4] = c
    img.pixels = px
    img.alpha_mode = "STRAIGHT"
    out_png = os.path.join(OUT, f"face_b2_{name}.png")
    img.filepath_raw = out_png
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


def face_material(name, img):
    m = bpy.data.materials.new(f"face_{name}")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.8
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    return m


# ── 머리카락 그라데이션: 면 가운데 높이(칸)로 띠를 나눠 재질 7단
BANDS_MAIN = [8, 4, 0, -4, -8, -11.5]        # 위 → 아래 경계 (크림 … 청록)
BANDS_BANG = [15.6, 14.6, 13.6, 12.6, 11.4, 10.0]  # 앞머리는 끝이 일찍 민트


def _apply_mods(ob):
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.convert(target="MESH")
    return bpy.context.view_layer.objects.active


def split_bands(ob, prefix, bounds=BANDS_MAIN, jitter=1.0):
    ob = _apply_mods(ob)
    edges = [99.0] + list(bounds) + [-99.0]
    out = []
    for k in range(len(edges) - 1):
        hi, lo = edges[k], edges[k + 1]
        me = ob.data.copy()
        bm = bmesh.new()
        bm.from_mesh(me)
        kill = []
        for f in bm.faces:
            m = f.calc_center_median()
            z = (m.z - HZ0) / FACE_CELL
            # 가닥마다 경계를 엇갈리게: 가로 위치로 흔들어 가로줄 띠가 아니라 머리결처럼
            x = m.x / FACE_CELL + 0.6 * (m.y - FACE_Y) / FACE_CELL
            z += jitter * (1.3 * math.sin(x * 0.95) + 0.8 * math.sin(x * 2.3 + 1.7))
            if not (lo <= z < hi):
                kill.append(f)
        bmesh.ops.delete(bm, geom=kill, context="FACES")
        if not bm.faces:
            bm.free()
            bpy.data.meshes.remove(me)
            continue
        bm.to_mesh(me)
        bm.free()
        me.materials.clear()
        me.materials.append(mat(f"hair_c{k}"))
        o2 = link(bpy.data.objects.new(f"{prefix}_{k}", me))
        o2.matrix_world = ob.matrix_world.copy()
        out.append(o2)
    bpy.data.objects.remove(ob)
    return out


def loft(name, sections, n=48, cut=None, front_clamp=None):
    """높이별 타원 단면 (z, cy, rx, ry, 물결폭, 물결수)을 이어 붙인 덩어리 (칸 좌표). 위·아래는 막는다."""
    bm = bmesh.new()
    rings = []
    for (z, cy, rx, ry, wa, wn) in sections:
        ring = []
        for i in range(n):
            a = 2 * math.pi * i / n
            k = 1 + wa * math.sin(a * wn)
            x = rx * k * math.sin(a)
            y = cy - ry * k * math.cos(a)
            if front_clamp is not None:
                y = max(y, front_clamp)   # 얼굴 앞으로 머리카락이 과하게 튀어나오지 않게 앞면을 평평하게
            ring.append(bm.verts.new(cpt(x, y, z)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((r0[i], r0[j], r1[j], r1[i]))
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[-1])))
    if cut:
        kill = []
        for f in bm.faces:
            m = f.calc_center_median()
            if cut(m.x / FACE_CELL, (m.y - FACE_Y) / FACE_CELL, (m.z - HZ0) / FACE_CELL):
                kill.append(f)
        bmesh.ops.delete(bm, geom=kill, context="FACES")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = from_bm(name, bm)
    so = ob.modifiers.new("th", "SOLIDIFY")
    so.thickness = 1.2 * FACE_CELL
    so.offset = -1
    return finish(ob, "hair_c0", 1)


def lock(name, pts, widths, depth, material="hair_c0"):
    """물결 옆머리 한 가닥: 경로(칸)를 따라 납작한 타원 단면. 폭은 x, 두께는 y."""
    bm = bmesh.new()
    seg = 10
    P_ = [cpt(*p) for p in pts]
    rings = []
    for i, p in enumerate(P_):
        t = (P_[min(len(P_) - 1, i + 1)] - P_[max(0, i - 1)]).normalized()
        a = Vector((0, 1, 0))
        a = (a - t * a.dot(t)).normalized()
        b = t.cross(a).normalized()
        w = widths[i] * FACE_CELL / 2
        d = depth * FACE_CELL / 2 * (0.4 + 0.6 * widths[i] / max(widths))
        rings.append([bm.verts.new(p + b * (math.cos(2 * math.pi * k / seg) * w) + a * (math.sin(2 * math.pi * k / seg) * d))
                      for k in range(seg)])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(seg):
            bm.faces.new((r0[k], r0[(k + 1) % seg], r1[(k + 1) % seg], r1[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(from_bm(name, bm), material, 1)


# ── 지시 3: 샘플 정면 머리 아웃라인 실측 (sample.png 앞 패널, 픽셀) → 비율 (W = 머리 최대 폭 316px)
#   정수리(위에서 25%) 0.72W · 최대(눈 높이) 1.00W · 가닥 붙는 곳(턱 아래) 0.99W · 가닥 최대(어깨) 1.13W
#   가닥 끝 1.08W · 끝단 0.94W · 머리 꼭대기→턱 0.69W · 꼭대기→가닥 끝 1.08W · 얼굴 폭 0.47W
#   B2 얼굴이 24칸이고 옆머리가 양쪽 2칸을 덮어 보이는 얼굴 20칸 → W = 20 / 0.47 ≈ 42.6칸 (반폭 21.3)
SAMPLE_RATIO = {"crown25": 0.72, "max": 1.00, "attach": 0.99, "legs_max": 1.13, "tips": 1.08, "end": 0.94,
                "top_chin": 0.69, "top_end": 1.08, "face": 0.47}
# 세로 비율 (머리 꼭대기→턱 = 1): 꼭대기→눈 가운데 0.80 · 눈 가운데→턱 0.20 · 턱→가닥 끝 0.58 (샘플 실측)
#  B2 눈 가운데 z 9 · 입 z 3~4 → 턱을 z 2.5로 올리고(입 바로 아래), 꼭대기를 올려 머리 덩어리를 키운다.
CHIN_Z = 2.5
HEAD_HW = 18.5  # grok2: further narrow vs sample oval
HEAD_TOP = 34.8  # grok: taller crown                                 # 꼭대기 z: 꼭대기→턱 31칸 (눈 가운데→턱 6.5 = 0.21)
LEG_END = CHIN_Z - 0.58 * (HEAD_TOP - CHIN_Z)   # 가닥 끝 z ≈ -15.5
DOME_CY, DOME_RY = 13.0, 14.0  # grok: less fat dome
_DOME_F = ((-0.16, 0.8, 0.84), (-0.08, 0.84, 0.92), (0.05, 0.87, 0.98), (0.2, 0.95, 1.0),
           (0.33, 1.0, 0.985), (0.46, 0.96, 0.95), (0.59, 0.88, 0.88), (0.69, 0.78, 0.78),
           (0.78, 0.65, 0.64), (0.86, 0.5, 0.5), (0.93, 0.33, 0.33), (1.0, 0.1, 0.1))
# 높이 비율 f: 0 = 턱, 1 = 꼭대기
DOME = tuple((CHIN_Z + f * (HEAD_TOP - CHIN_Z), kx, ky) for f, kx, ky in _DOME_F)


def leg_z(f, tip=None):
    """가닥 높이: f = 0 → 턱 위 1칸(붙는 곳), 1 → 끝."""
    z1 = CHIN_Z + 1.0
    return z1 - (z1 - (LEG_END if tip is None else tip)) * f


def dome_front(z):
    """높이 z(칸)에서 머리 덩어리 앞면의 y (가운데)."""
    for (za, _, ka), (zb, _, kb) in zip(DOME, DOME[1:]):
        if za <= z <= zb:
            k = ka + (kb - ka) * (z - za) / (zb - za)
            return DOME_CY - DOME_RY * k
    return DOME_CY


def face_mass(name):
    """얼굴 덩어리 (지시 3): 앞 가운데는 평평(눈·입 자리, 픽셀이 깨지지 않게), 눈 아래 볼은 뒤로 둥글게,
    z < 6 에서 U자로 좁아지는 턱 (턱 끝 반폭 7칸). 블렌더 큐브를 잘게 나눠 꼭짓점을 윤곽에 맞춘다."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=14, use_grid_fill=True)
    x0, x1, y0, y1, z0, z1 = -11.9, 11.9, 0.07, 11.0, CHIN_Z, 19.6
    for v in bm.verts:
        u, w, h = v.co.x + 0.5, v.co.y + 0.5, v.co.z + 0.5
        x = x0 + (x1 - x0) * u
        y = y0 + (y1 - y0) * w
        z = z0 + (z1 - z0) * h
        if z < CHIN_Z + 6.0:                          # U자 턱 (입 바로 아래에서 좁아짐)
            k = (CHIN_Z + 6.0 - z) / 6.0
            xm = 4.0 + 7.9 * math.sqrt(max(0.0, 1 - k * k))
            x *= xm / 11.9
        if z < 9.0 and y < 3.0:                       # 눈 아래 볼: 바깥이 뒤로 물러나 둥글게
            y += max(0.0, abs(x) - 8.8) ** 2 * 0.65 * max(0.0, 1 - (z - CHIN_Z) / (9.0 - CHIN_Z)) ** 0.5
        if z < CHIN_Z + 1.6:  # grok: curl under chin for shade
            y += (CHIN_Z + 1.6 - z) * 2.2
        v.co = cpt(x, y, z)
    bm.to_mesh(ob.data)
    bm.free()
    return finish(ob, "skin", 1)


def head_ball(name, center, rad, cut):
    """머리통: 블렌더 UV 구 (칸 좌표 중심·반지름). cut(x,y,z)=True 면 지운다. 두께·서브디비전은 블렌더 모디파이어."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=56, ring_count=36, radius=1.0, location=(0, 0, 0))
    ob = bpy.context.active_object
    ob.name = name
    me = ob.data
    C = cpt(*center)
    for v in me.vertices:
        v.co = Vector((C.x + v.co.x * rad[0] * FACE_CELL, C.y + v.co.y * rad[1] * FACE_CELL, C.z + v.co.z * rad[2] * FACE_CELL))
    bm = bmesh.new()
    bm.from_mesh(me)
    kill = []
    for f in bm.faces:
        m = f.calc_center_median()
        if cut(m.x / FACE_CELL, (m.y - FACE_Y) / FACE_CELL, (m.z - HZ0) / FACE_CELL):
            kill.append(f)
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(me)
    bm.free()
    so = ob.modifiers.new("th", "SOLIDIFY")
    so.thickness = 1.6 * FACE_CELL
    so.offset = -1
    return finish(ob, "hair_c0", 1)


def tentacle(name, pts, radii):
    """문어 다리 가닥: 블렌더 NURBS 곡선 + 둥근 단면(bevel). 점마다 굵기(칸), 끝은 뾰족."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.resolution_u = 10
    cu.bevel_depth = FACE_CELL
    cu.bevel_resolution = 3
    cu.use_fill_caps = True
    sp = cu.splines.new("NURBS")
    sp.points.add(len(pts) - 1)
    for i, (p, r) in enumerate(zip(pts, radii)):
        w = cpt(*p)
        sp.points[i].co = (w.x, w.y, w.z, 1.0)
        sp.points[i].radius = r
    sp.use_endpoint_u = True
    sp.order_u = min(4, len(pts))
    ob = link(bpy.data.objects.new(name, cu))
    ob.data.materials.append(mat("hair_c0"))
    return ob


def build_head_block():
    P = []
    c = FACE_CELL
    # 머리 상자 (얼굴 앞면 = 판 바로 뒤). 턱 모서리는 둥글게(베벨 크게)
    P.append((face_mass("head"), "head"))
    # grok: under-chin AO (sample chin shadow)
    P.append((ellipsoid("chin_shade", tuple(cpt(0, 1.2, CHIN_Z - 0.7)),
                        (5.5 * FACE_CELL, 2.4 * FACE_CELL, 1.6 * FACE_CELL), "skin_shade", seg=16, subsurf=0), "head"))
    P.append((ellipsoid("chin_shade2", tuple(cpt(0, 0.4, CHIN_Z - 0.2)),
                        (4.2 * FACE_CELL, 1.8 * FACE_CELL, 1.1 * FACE_CELL), "skin_shade", seg=12, subsurf=0), "head"))
    # front under-chin bar (visible from camera)
    P.append((hbox("chin_shade_bar", -4.5, 4.5, -0.2, 1.6, CHIN_Z - 1.2, CHIN_Z + 0.2, "skin_shade", bevel=0.4, subsurf=0), "head"))
    P.append((taper("neck_ab", (0, 0, 1.14), (0, 0, HZ0 + 0.06), 0.07, 0.07, "skin", seg=10), "head"))
    for nm in FACES:
        P.append((face_plane(nm), "head"))

    hair = []
    # ── 머리통(문어 몸통): 블렌더 UV 구를 가로·깊이로 넓게 — 위아래로 긴 캡슐이 아니라 둥근 공.
    #    얼굴 앞은 뚫는다 (얼굴 옆은 남아 볼을 감싼다)
    def face_hole(x, y, z):
        return y < 6.0 and abs(x) < 12.4 and z < 21.5
    # 샘플 비율 윤곽: 정수리 둥글고 넓게 → 눈 높이~턱 아래까지 최대 폭 유지 (공이 아니라 넓은 돔 + 짧은 기둥)
    secs = []
    for z, kx, ky in DOME:
        secs.append((z, DOME_CY, HEAD_HW * kx, DOME_RY * ky, 0.012, 23))
    hair.append(loft("hair_mass", secs, n=64, cut=face_hole))
    # ── 앞머리 판 + 10가닥 (눈 윗선 위에서 끝나고, 눈 사이 두 가닥만 더 내려온다)
    bangs = [hbox("hair_bangs", -14.4, 14.4, -2.4, 4.6, 17.2, 25.2, "hair_c0", bevel=0.9, subsurf=2)]
    for i, (x, tip, w) in enumerate(((-15.4, 7.0, 3.4), (-12.4, 9.2, 3.4), (-9.2, 13.6, 3.6), (-6.4, 14.2, 3.8),
                                     (-3.7, 13.8, 3.6), (-1.0, 11.4, 3.4), (1.5, 10.8, 3.2), (4.1, 13.9, 3.8),
                                     (6.8, 14.3, 3.6), (9.5, 13.5, 3.6), (12.5, 9.4, 3.4), (15.4, 7.2, 3.4))):
        bx = x + (0.6 if x < 0 else -0.6)
        tz = 28.0 - 0.014 * x * x
        top = (x * 0.6 + (0.8 if x > 0 else -0.8), dome_front(tz) + 0.6, tz)
        bangs.append(spike(f"hair_bang{i}", top, (bx, -2.9, tip), w * 1.2, "hair_c0", flat=0.8))
    # ── 문어 다리 (지시 3): 머리통 폭 안쪽(0.97W)에서 붙어 내려오다 어깨 높이에서 1.1W까지만 살짝 부풀고,
    #    끝에서 바깥·위로 둥글게 말린다. 위치를 바깥으로 뻗지 않는다.
    locks = []
    hw = HEAD_HW

    def side_prof(z):
        # 반폭 비율: 0.97(붙는 곳) → 1.1(어깨 z≈-6) → 1.03 → 0.97(끝) — 샘플 1.13W·1.08W·0.94W를 가닥 굵기 포함해 맞춤
        # 측정 보정(지시 3 비율표): 55% 높이·85% 높이가 샘플보다 넓어 안쪽으로
        pts = [(leg_z(0.0), 0.84), (leg_z(0.27), 0.94), (leg_z(0.5), 1.0), (leg_z(0.72), 0.9), (leg_z(0.9), 0.84), (leg_z(1.12), 0.78)]
        for (za, ka), (zb, kb) in zip(pts, pts[1:]):
            if zb <= z <= za:
                return ka + (kb - ka) * (za - z) / (za - zb)
        return pts[-1][1] if z < pts[-1][0] else pts[0][1]

    def leg(name, y, tip_z, r0, sx, curl=2.0):
        zs = [leg_z(f, tip_z) for f in (0.0, 0.3, 0.55, 0.8)]
        pts = [(sx * hw * side_prof(z), y, z) for z in zs] + [(sx * hw * side_prof(tip_z), y, tip_z),
               (sx * (hw * side_prof(tip_z) + curl), y, tip_z - 0.4), (sx * (hw * side_prof(tip_z) + curl * 1.35), y, tip_z + curl * 0.8)]
        return tentacle(name, pts, [r0, r0, r0 * 0.95, r0 * 0.85, r0 * 0.65, r0 * 0.4, r0 * 0.15])

    for sx, side in ((-1, "L"), (1, "R")):
        # 볼 옆 앞머리 가닥: 얼굴 가장자리 2칸을 덮고 턱 옆으로 내려와 말림
        locks.append(tentacle(f"hair_cheek_{side}", [
            (12.9 * sx, -1.8, 16.0), (13.4 * sx, -2.0, 9.0), (13.9 * sx, -1.8, CHIN_Z + 1.5), (15.4 * sx, -1.2, CHIN_Z - 2.5),
            (17.4 * sx, -1.0, CHIN_Z - 3.4), (18.2 * sx, -1.0, CHIN_Z - 1.6)], [2.4, 2.4, 2.2, 1.6, 0.9, 0.4]))
        locks.append(leg(f"hair_leg_front_{side}", 2.6, LEG_END + 3.5, 2.7, sx))
        locks.append(leg(f"hair_leg_side_{side}", 8.0, LEG_END + 1.5, 2.9, sx, curl=2.2))
    # 뒤 다리: 뒤 반원(머리통 테두리 안쪽 0.93)에서 곧게 내려와 끝만 말림. 긴 층 9 · 짧은 층 8
    cyb, ryb = DOME_CY, DOME_RY * 0.92
    long_tips = [2.0, -1.0, 1.0, -1.5, 0.0, -1.5, 1.0, -1.0, 2.0]
    for i in range(9):
        ph = math.radians(-100 + 25 * i)   # 옆으로 삐져나와 정면 폭을 넓히지 않게 ±100°
        dx, dy = math.sin(ph), math.cos(ph)
        bx, by = hw * 0.9 * dx, cyb + ryb * 0.93 * dy
        t = LEG_END + long_tips[i]
        pts = [(bx, by, leg_z(-0.08, t)), (bx * 1.03, by + dy * 0.6, leg_z(0.3, t)), (bx * 1.08, by + dy * 1.2, leg_z(0.55, t)),
               (bx * 1.06, by + dy * 1.2, leg_z(0.78, t)), (bx * 1.03, by + dy * 1.0, t),
               (bx * 1.03 + dx * 2.6, by + dy * 3.2, t - 0.4), (bx * 1.03 + dx * 3.4, by + dy * 4.2, t + 2.0)]
        locks.append(tentacle(f"hair_leg_back{i}", pts, [3.0, 3.0, 2.8, 2.4, 1.8, 1.0, 0.4]))
    for i in range(8):
        ph = math.radians(-87.5 + 25 * i)
        dx, dy = math.sin(ph), math.cos(ph)
        bx, by = hw * 0.9 * dx, cyb + ryb * 0.95 * dy
        t = leg_z(0.55) + (1.2 if i % 2 else 0.0)
        pts = [(bx, by, CHIN_Z + 2.5), (bx * 1.04, by + dy * 0.8, leg_z(0.25)), (bx * 1.07, by + dy * 1.2, t),
               (bx * 1.07 + dx * 2.2, by + dy * 2.8, t - 0.3), (bx * 1.07 + dx * 2.9, by + dy * 3.6, t + 1.8)]
        locks.append(tentacle(f"hair_leg_back_s{i}", pts, [2.6, 2.5, 1.8, 1.0, 0.4]))

    # ── 아호게: 위로 솟았다가 오른쪽(보는 사람 기준)으로 꺾임
    a0, a1, a2, a3 = cpt(0.4, 13.0, HEAD_TOP - 0.8), cpt(0.8, 12.6, HEAD_TOP + 3.8), cpt(4.4, 12.3, HEAD_TOP + 4.4), cpt(5.2, 12.3, HEAD_TOP + 3.2)
    aho = [taper("hair_ahoge0", tuple(a1), tuple(a0), 1.6 * c, 1.9 * c, "hair_c0", seg=10, squash=(1, 0.8)),
           taper("hair_ahoge1", tuple(a1 + (a1 - a2).normalized() * 0.7 * c), tuple(a2), 1.5 * c, 1.1 * c, "hair_c0", seg=10, squash=(1, 0.8)),
           taper("hair_ahoge2", tuple(a2), tuple(a3), 1.1 * c, 0.5 * c, "hair_c0", seg=8, squash=(1, 0.8))]

    for ob in hair + locks:
        for o2 in split_bands(ob, ob.name):
            P.append((o2, "head"))
    for ob in bangs:
        for o2 in split_bands(ob, ob.name, BANDS_BANG, jitter=0.35):
            P.append((o2, "head"))
    for ob in aho:
        P.append((ob, "head"))

    # ── 머리핀: 보는 사람 기준 오른쪽 위 — 초록 잎 + 작은 주황 꽃
    P.append((ellipsoid("clip_leaf", tuple(cpt(8.8, -2.5, 19.2)), (1.9 * c, 0.5 * c, 1.5 * c), "clip_leaf",
                        seg=14, rot=(0, math.radians(-30), 0), subsurf=0), "head"))
    P.append((ellipsoid("clip_leaf_hi", tuple(cpt(9.1, -2.9, 19.6)), (0.6 * c, 0.3 * c, 0.5 * c), "clip_leaf_hi", seg=8, subsurf=0), "head"))
    for i, (dx, dz) in enumerate(((0, 0.7), (-0.7, 0), (0.7, 0), (0, -0.7))):
        P.append((ellipsoid(f"clip_petal{i}", tuple(cpt(6.3 + dx, -2.4, 17.9 + dz)), (0.65 * c, 0.4 * c, 0.65 * c), "clip_flower", seg=8, subsurf=0), "head"))
    P.append((ellipsoid("clip_flower_c", tuple(cpt(6.3, -2.7, 17.9)), (0.4 * c, 0.3 * c, 0.4 * c), "clip_flower_c", seg=8, subsurf=0), "head"))
    return P


# ── 입체 눈 (eyes_3d.py가 build_head_block을 감싸 눈을 붙인다)
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)) if "__file__" in dir() else HERE_W, "eyes_3d.py"), encoding="utf-8").read())
