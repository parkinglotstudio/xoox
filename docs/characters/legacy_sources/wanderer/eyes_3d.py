# body_front_ab.py 안에서 head_block.py 다음에 exec. 입체 눈 + 고해상도 얼굴 판.
#   eye3d_plate_<L|R>   눈알 판: paint_face.py가 그린 흰자·홍채·동공·반짝임 (얼굴 면 1.2mm 앞)
#   eye3d_cornea_<L|R>  각막: 투명하고 반짝이는 볼록 막 (가운데 7.5mm 솟음) → 실제 조명 반짝임
#   eye3d_lash_<L|R>    윗속눈썹 테: 입체 띠(9.5mm 두께) + 바깥 눈꼬리 날개. 모양 키 "blink" = 감은 눈 선(^)
#   eye3d_lid_<L|R>     눈꺼풀: 피부색 판. 기본 = 윗선에 접혀 안 보임, 모양 키 "blink" = 눈을 덮음
# 깜빡임·웃는 눈(^^)은 모양 키 값으로 툴이 조절한다 (glTF morph target 0 = blink).
# 얼굴 판(face_*)은 16×15 픽셀 대신 512×480 그림(볼터치·입)으로 바꾼다 — 눈은 입체라 판에 없다.
import sys as _sys
_HERE_E = os.path.dirname(os.path.abspath(__file__))
if _HERE_E not in _sys.path:
    _sys.path.insert(0, _HERE_E)
import importlib as _il
# B2(샘플 시안)는 둥근 네모 눈 + 갈고리 속눈썹 (eye_shape_b2.py)
_es = _il.reload(_il.import_module("eye_shape_b2" if VARIANT == "B2" else "eye_shape"))
FACE_HD_DIR = os.path.join(_HERE_E, "face_hd")

COL.update({"eye_lash": "#2a1822"})


if VARIANT != "B2":
    # ── 고해상도 얼굴 판 (head_block.py의 face_image/face_material을 덮어쓴다)
    def face_image(name, rows):
        path = os.path.join(FACE_HD_DIR, f"face_{VARIANT}_{name}.png")
        img = bpy.data.images.load(path, check_existing=False)
        img.name = f"face_{name}"
        img.alpha_mode = "STRAIGHT"
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
        tex.interpolation = "Linear"
        nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
        nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
        try:
            m.surface_render_method = "BLENDED"
        except Exception:
            pass
        return m



def _extra_depth():
    return 0.006 * max(1.0, (_es.EYE_W * FACE_CELL) / 0.0774) ** 1.5 - 0.006


def _eye_world(sx, u, v, d):
    """눈 로컬(u 바깥+, v 위+, 칸) + 깊이 d(m, 음수 = 앞) → 월드."""
    c = FACE_CELL
    return Vector((sx * (_es.EYE_CX + u) * c, FACE_Y + d, HZ0 + (_es.EYE_CZ + v) * c))


def _face_front(ob):
    """판 법선이 앞(-Y)을 보게."""
    me = ob.data
    me.update()
    if me.polygons and me.polygons[0].normal.y > 0:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()


def _plate_material(var, side):
    m = bpy.data.materials.new(f"eye3d_plate_{side}")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = 0.35
    img = bpy.data.images.load(os.path.join(FACE_HD_DIR, f"eye_{var}_{side}.png"), check_existing=False)
    img.alpha_mode = "STRAIGHT"
    img.pack()
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], b.inputs["Alpha"])
    # 살짝 스스로 빛나게: 어두운 조명에서도 눈이 또렷 (애니 눈 느낌)
    nt.links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 0.35
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    return m


def _cornea_material():
    m = bpy.data.materials.get("eye_cornea")
    if m:
        return m
    m = bpy.data.materials.new("eye_cornea")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.02, 0.02, 0.03, 1)
    b.inputs["Roughness"].default_value = 0.04
    b.inputs["Alpha"].default_value = 0.12
    try:
        b.inputs["Specular IOR Level"].default_value = 1.0
    except Exception:
        pass
    try:
        m.surface_render_method = "BLENDED"
    except Exception:
        pass
    return m


def _mesh(name, verts, faces):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    ob = link(bpy.data.objects.new(name, me))
    for p in me.polygons:
        p.use_smooth = True
    return ob


def eye_plate(var, side, sx):
    pts = _es.outline()
    verts = [_eye_world(sx, 0, 0, -0.0012)] + [_eye_world(sx, u, v, -0.0012) for u, v in pts]
    n = len(pts)
    faces = [(0, 1 + i, 1 + (i + 1) % n) for i in range(n)]
    ob = _mesh(f"eye3d_plate_{side}", verts, faces)
    _face_front(ob)
    # UV: 이미지 가로 = 월드 가로(보는 사람 기준 왼→오), 세로 = 위가 1
    uvl = ob.data.uv_layers.new(name="UVMap")
    W, H = _es.EYE_W, _es.EYE_H
    for poly in ob.data.polygons:
        for li in poly.loop_indices:
            vi = ob.data.loops[li].vertex_index
            co = ob.data.vertices[vi].co
            xr = co.x / FACE_CELL - sx * _es.EYE_CX
            vr = (co.z - HZ0) / FACE_CELL - _es.EYE_CZ
            uvl.data[li].uv = (xr / (2 * W) + 0.5, vr / (2 * H) + 0.5)
    ob.data.materials.append(_plate_material(var, side))
    return ob


def eye_cornea(side, sx):
    pts = _es.outline(48)
    rings = 8
    # 볼록 높이는 눈 크기에 비례 (큰 눈이 납작하면 반사가 눈 전체로 번진다)
    bulge = 0.006 * max(1.0, (_es.EYE_W * FACE_CELL) / 0.0774) ** 1.5
    verts = [_eye_world(sx, 0, 0, -(0.0015 + bulge))]
    for k in range(1, rings + 1):
        r = k / rings
        for u, v in pts:
            verts.append(_eye_world(sx, u * r, v * r, -(0.0015 + bulge * (1 - r * r))))
    n = len(pts)
    faces = [(0, 1 + i, 1 + (i + 1) % n) for i in range(n)]
    for k in range(rings - 1):
        a, b = 1 + k * n, 1 + (k + 1) * n
        faces += [(a + i, b + i, b + (i + 1) % n, a + (i + 1) % n) for i in range(n)]
    ob = _mesh(f"eye3d_cornea_{side}", verts, faces)
    _face_front(ob)
    ob.data.materials.append(_cornea_material())
    return ob


def _lash_sections():
    """윗선을 따라 (u, v, 바깥 폭, 안쪽 폭, 위 방향 법선) 목록 + 바깥 눈꼬리 날개."""
    arc = _es.upper_arc(40)
    out = []
    n = len(arc) - 1
    for i, (u, v) in enumerate(arc):
        a, b = arc[max(0, i - 1)], arc[min(n, i + 1)]
        tu, tv = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tu, tv) or 1
        nu, nv = -tv / L, tu / L          # 진행 방향 왼쪽 = 위(바깥)
        s = i / n
        out.append((u, v, 0.08 + 0.2 * s ** 1.3, 0.1 + 0.1 * s, nu, nv))
    # 날개: 바깥 눈꼬리에서 바깥·위로 뻗으며 가늘어짐
    u0, v0, wo, wi, nu, nv = out[-1]
    du, dv = 0.8, 0.55
    L = math.hypot(du, dv)
    du, dv = du / L, dv / L
    for k in range(1, 5):
        t = k / 4
        out.append((u0 + du * 0.55 * t, v0 + dv * 0.55 * t, (wo + wi) * 0.5 * (1 - t) + 0.012,
                    0.0, -dv, du))
    return out


def _lash_sections_b2():
    """샘플 눈: 윗선을 따라 굵은 띠(안쪽으로 두껍게) → 바깥 옆선을 따라 내려오며 가늘어지는 갈고리. 날개 없음."""
    arc = _es.upper_arc(48)
    n = len(arc) - 1
    out = []
    for i, (u, v) in enumerate(arc):
        a, b = arc[max(0, i - 1)], arc[min(n, i + 1)]
        tu, tv = b[0] - a[0], b[1] - a[1]
        L = math.hypot(tu, tv) or 1
        nu, nv = -tv / L, tu / L
        s = i / n
        k = 1.0 if s < 0.72 else max(0.25, 1 - (s - 0.72) / 0.28 * 0.75)  # 갈고리 끝으로 가늘게
        out.append((u, v, 0.28 * k, 0.72 * k, nu, nv))
    return out


def eye_lash(side, sx):
    sec = _lash_sections_b2() if hasattr(_es, "LASH_HOOK") else _lash_sections()
    front, back = -0.0095 - _extra_depth(), -0.001
    verts, blink = [], []
    for u, v, wo, wi, nu, nv in sec:
        for (du, dv) in ((-nu * wi, -nv * wi), (nu * wo, nv * wo)):
            for d in (front, back):
                verts.append(_eye_world(sx, u + du, v + dv, d))
                # 감은 눈: 가운데 선만 눌러 아래로 (두께는 그대로 → 또렷한 ^ 선)
                if hasattr(_es, "LASH_HOOK"):
                    blink.append(_eye_world(sx, u + du, v * 0.28 - _es.EYE_H * 0.92 + dv, d))
                else:
                    blink.append(_eye_world(sx, u + du, v * 0.4 - _es.EYE_H * 1.18 + dv, d))
    # 단면당 4점: 0 안-앞, 1 안-뒤, 2 바깥-앞, 3 바깥-뒤
    faces = []
    for i in range(len(sec) - 1):
        a, b = 4 * i, 4 * (i + 1)
        faces += [(a + 0, a + 2, b + 2, b + 0),   # 앞
                  (a + 1, b + 1, b + 3, a + 3),   # 뒤
                  (a + 2, a + 3, b + 3, b + 2),   # 위(바깥)
                  (a + 0, b + 0, b + 1, a + 1)]   # 아래(안쪽)
    e = 4 * (len(sec) - 1)
    faces += [(0, 1, 3, 2), (e + 0, e + 2, e + 3, e + 1)]
    ob = _mesh(f"eye3d_lash_{side}", verts, faces)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data)
    bm.free()
    ob.shape_key_add(name="Basis")
    k = ob.shape_key_add(name="blink")
    for i, p in enumerate(blink):
        k.data[i].co = p
    ob.data.materials.append(mat("eye_lash"))
    return ob


def eye_lid(side, sx):
    cols, rows = 25, 8
    W = _es.EYE_W
    d = -0.0085 - _extra_depth()
    verts, blink = [], []
    for ci in range(cols):
        u = -W * 1.1 + 2 * W * 1.1 * ci / (cols - 1)
        top, bot = _es.top_bottom_at(max(-W, min(W, u)))
        for r in range(rows + 1):
            vf = top + 0.14 - (top - bot + 0.28) * r / rows
            verts.append(_eye_world(sx, u, top + 0.14, d))      # 기본: 윗선에 접힘
            blink.append(_eye_world(sx, u, vf, d))              # 감음: 눈 전체를 덮음
    faces = []
    for ci in range(cols - 1):
        for r in range(rows):
            a = ci * (rows + 1) + r
            b = (ci + 1) * (rows + 1) + r
            faces.append((a, b, b + 1, a + 1))
    ob = _mesh(f"eye3d_lid_{side}", verts, faces)
    # 법선: 감은 모양 기준으로 앞(-Y)
    me = ob.data
    for i, p in enumerate(blink):
        me.vertices[i].co = p
    _face_front(ob)
    me = ob.data
    ob.shape_key_add(name="Basis")
    k = ob.shape_key_add(name="blink")
    for i, p in enumerate(blink):
        k.data[i].co = p
    for i in range(len(verts)):
        ob.data.shape_keys.key_blocks["Basis"].data[i].co = verts[i]
        ob.data.vertices[i].co = verts[i]
    ob.data.materials.append(mat("skin"))
    return ob


def build_eyes_3d():
    P = []
    for side, sx in (("L", -1), ("R", 1)):
        P.append((eye_plate(VARIANT, side, sx), "head"))
        P.append((eye_cornea(side, sx), "head"))
        P.append((eye_lid(side, sx), "head"))
        P.append((eye_lash(side, sx), "head"))
    return P


_build_head_block_old = build_head_block


def build_head_block():
    return _build_head_block_old() + build_eyes_3d()
