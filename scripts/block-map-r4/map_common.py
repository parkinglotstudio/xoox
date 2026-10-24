"""블록 맵 i21 (스폰 들판 + 남쪽 선착장) — 정화후. Blender 5.2
blender -b -P build_i21.py -- <out_dir> [render]

기준 (사용자 확정 2026-09-26):
  사람 키 1.5m · 섹터 110m(게임 렌더 크기, 시안의 333m는 지도 좌표) · 지형 블록 30cm · 소품 블록 6~30cm
  색은 v2 팔레트(docs/directives/assets/20260926_map_purified_blocks/v2/06_palette_rules.png)
좌표: x = 동(0~110), y = 북(0~110), z = 위. 남쪽 해안 + 동쪽 만 = 바다.
지형은 블록 칸(30cm) 격자로 높이·표면을 정하고, 같은 줄의 같은 칸끼리 한 면으로 합친다.
블록 한 칸 한 칸의 결(밝기 흔들림·모서리 음영)은 재질(월드 좌표 셰이더)이 그린다 — 게임에서도 같은 방식.
"""
import bpy, bmesh, math, os, random, sys
from mathutils import Vector, Matrix, noise

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
DO_RENDER = "render" in argv[1:]
HERE = os.path.dirname(os.path.abspath(__file__))
random.seed(21)

PERSON = 1.5          # 사람 키 (m)
B = 0.3               # 지형 블록
S = 110.0             # 섹터 한 변
N = int(round(S / B)) # 367

# ── v2 팔레트 (06_palette_rules) + 파생 톤
PAL = {
    "blight": "#1A1625", "purified": "#0FBEC7", "mint": "#98DCA5", "sand": "#E5D5B2",
    "shallow": "#A8E6E8", "deep": "#4D9DB3", "wood": "#A67C52", "roof": "#B2443A",
    # 파생: 들판 얼룩·풀잎·옆면
    "mint_lo": "#82CC91", "mint_hi": "#B2E8BA", "mint_side": "#8CCB9B", "soil": "#C9B596",
    "leaf1": "#75CA89", "leaf2": "#5FBA78", "leaf3": "#A7E2AE", "leaf4": "#4DA06F",
    "sand_side": "#D2BC95", "path": "#DDBF8D", "path_edge": "#E5D0A6", "path_worn": "#CFAF7E",
    "seabed1": "#E2DBC4", "seabed2": "#9ED3D1", "seabed3": "#6FB1C2",
    "rock1": "#C6CBCF", "rock2": "#AEB5BB", "rock3": "#98A0A8", "moss": "#A9D8C9",
    "wall": "#F3EFE6", "stone": "#CFC9BD", "window": "#7DB8D4", "wood_dk": "#8C6641", "wood_lt": "#BA9165",
    "fl_white": "#FFFFFF", "fl_pink": "#F4B6C6", "fl_yellow": "#F2D46A", "fl_lilac": "#CDB6E8",
    "cloud": "#FFF6F3", "hill1": "#B8E0D6", "hill2": "#E9DFC7", "hill3": "#CFE7DE",
}


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def mint_at(y):
    """Bridge the greener i21 meadow into i11's turquoise mint at the north edge."""
    a, b = lin(PAL["mint"]), lin("#B8E0D6")
    t = max(0.0, min(1.0, (y - 92.0) / 18.0))
    t = t * t * (3.0 - 2.0 * t)
    return tuple(a[k] * (1.0 - t) + b[k] * t for k in range(3))


def jit(c, k=0.06):
    f = 1 + random.uniform(-k, k)
    return tuple(min(1.0, v * f) for v in c)


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def link(ob, coll=None):
    (coll or bpy.context.scene.collection).objects.link(ob)
    return ob


def mesh_from(name, verts, faces, face_cols, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    attr = me.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    cols = []
    for fi, poly in enumerate(me.polygons):
        c = face_cols[fi]
        for _ in poly.loop_indices:
            cols += [c[0], c[1], c[2], 1.0]
    attr.data.foreach_set("color", cols)
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    return ob


# ── 재질 ─────────────────────────────────────────────
def block_material(name, block, rough=0.92, edge=0.035, jitter=0.035, big=0.14):
    """월드 좌표 블록 셰이더: 칸마다 밝기 흔들림 · 넓은 얼룩 · 칸 모서리 음영. 기본색 = 색 속성 Col."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nd, ln = nt.nodes, nt.links
    bsdf = nd["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    try:
        bsdf.inputs["Specular IOR Level"].default_value = 0.05   # 하늘 반사로 민트가 청록으로 뜨지 않게
    except Exception:
        pass
    col = nd.new("ShaderNodeVertexColor"); col.layer_name = "Col"
    geo = nd.new("ShaderNodeNewGeometry")
    # p' = pos - normal * B/2 (면 위 칸 가운데로) → /B
    nsc = nd.new("ShaderNodeVectorMath"); nsc.operation = "SCALE"; nsc.inputs[3].default_value = block * 0.5
    ln.new(geo.outputs["Normal"], nsc.inputs[0])
    sub = nd.new("ShaderNodeVectorMath"); sub.operation = "SUBTRACT"
    ln.new(geo.outputs["Position"], sub.inputs[0]); ln.new(nsc.outputs[0], sub.inputs[1])
    div = nd.new("ShaderNodeVectorMath"); div.operation = "DIVIDE"; div.inputs[1].default_value = (block, block, block)
    ln.new(sub.outputs[0], div.inputs[0])
    # 칸 번호 → 무작위
    flo = nd.new("ShaderNodeVectorMath"); flo.operation = "FLOOR"; ln.new(div.outputs[0], flo.inputs[0])
    wn = nd.new("ShaderNodeTexWhiteNoise"); wn.noise_dimensions = "3D"; ln.new(flo.outputs[0], wn.inputs["Vector"])
    mr = nd.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 1 - jitter; mr.inputs["To Max"].default_value = 1 + jitter
    ln.new(wn.outputs["Value"], mr.inputs["Value"])
    # 넓은 얼룩 (들판이 한 색 판처럼 보이지 않게)
    nz = nd.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.035; nz.inputs["Detail"].default_value = 2.0
    ln.new(geo.outputs["Position"], nz.inputs["Vector"])
    mr2 = nd.new("ShaderNodeMapRange"); mr2.inputs["From Min"].default_value = 0.35; mr2.inputs["From Max"].default_value = 0.65
    mr2.inputs["To Min"].default_value = 1 - big; mr2.inputs["To Max"].default_value = 1 + big
    ln.new(nz.outputs["Fac"], mr2.inputs["Value"])
    # 모서리: |frac(p)-0.5|*2 의 최댓값
    fr = nd.new("ShaderNodeVectorMath"); fr.operation = "FRACTION"; ln.new(div.outputs[0], fr.inputs[0])
    s5 = nd.new("ShaderNodeVectorMath"); s5.operation = "SUBTRACT"; s5.inputs[1].default_value = (0.5, 0.5, 0.5); ln.new(fr.outputs[0], s5.inputs[0])
    ab = nd.new("ShaderNodeVectorMath"); ab.operation = "ABSOLUTE"; ln.new(s5.outputs[0], ab.inputs[0])
    sp = nd.new("ShaderNodeSeparateXYZ"); ln.new(ab.outputs[0], sp.inputs[0])
    mx1 = nd.new("ShaderNodeMath"); mx1.operation = "MAXIMUM"; ln.new(sp.outputs[0], mx1.inputs[0]); ln.new(sp.outputs[1], mx1.inputs[1])
    mx2 = nd.new("ShaderNodeMath"); mx2.operation = "MAXIMUM"; ln.new(mx1.outputs[0], mx2.inputs[0]); ln.new(sp.outputs[2], mx2.inputs[1])
    me_ = nd.new("ShaderNodeMapRange"); me_.inputs["From Min"].default_value = 0.42; me_.inputs["From Max"].default_value = 0.49
    me_.inputs["To Min"].default_value = 1.0; me_.inputs["To Max"].default_value = 1 - edge
    ln.new(mx2.outputs[0], me_.inputs["Value"])
    # 곱하기
    m1 = nd.new("ShaderNodeMix"); m1.data_type = "RGBA"; m1.blend_type = "MULTIPLY"; m1.inputs["Factor"].default_value = 1.0
    ln.new(col.outputs["Color"], m1.inputs[6])
    cmb = nd.new("ShaderNodeCombineXYZ")
    k = nd.new("ShaderNodeMath"); k.operation = "MULTIPLY"; ln.new(mr.outputs["Result"], k.inputs[0]); ln.new(mr2.outputs["Result"], k.inputs[1])
    k2 = nd.new("ShaderNodeMath"); k2.operation = "MULTIPLY"; ln.new(k.outputs[0], k2.inputs[0]); ln.new(me_.outputs["Result"], k2.inputs[1])
    for i in range(3):
        ln.new(k2.outputs[0], cmb.inputs[i])
    ln.new(cmb.outputs[0], m1.inputs[7])
    ln.new(m1.outputs[2], bsdf.inputs["Base Color"])
    return m


def flat_material(name, rough=0.8, emission=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    try:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    except Exception:
        pass
    col = nt.nodes.new("ShaderNodeVertexColor"); col.layer_name = "Col"
    nt.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    if emission > 0:
        nt.links.new(col.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = emission
    return m


def water_material():
    m = bpy.data.materials.new("water")
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    col = nt.nodes.new("ShaderNodeVertexColor"); col.layer_name = "Col"
    nt.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(col.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 0.35   # 멀리서도 팔레트 물빛이 어둡게 죽지 않게
    bsdf.inputs["Roughness"].default_value = 0.12
    try:
        bsdf.inputs["Specular IOR Level"].default_value = 0.25
    except Exception:
        pass
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.5
    nt.links.new(geo.outputs["Position"], nz.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.06
    nt.links.new(nz.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


# ── 지형 배치 ────────────────────────────────────────
def shore(x):
    """남쪽 해안선 y (x 따라 굽이침) · 동쪽 만 (x > 82 에서 북쪽으로 파고듦)."""
    y = 15 + 4.5 * math.sin(x / 16.0) + 2.2 * math.sin(x / 6.8 + 1.3)
    if x > 82:
        t = (x - 82) / 28.0
        y += 30 * t * t
    return y


def path_x(y):
    return 55 + 4.2 * math.sin(y / 15.0) + 1.8 * math.sin(y / 5.5 + 0.7)


DOCK_X = 55.0
POND_C, POND_R = (24.0, 60.0), (4.2, 2.8)


def level_at(x, y):
    """Open meadow with localized western terraces, not long cliffs across play."""
    lv = 0
    if x < 22 + 4 * math.sin(y / 13.0) and y > 43 + 5 * math.sin(x / 9.0):
        lv = 1
    if x < 14 + 3 * math.sin(y / 11.0) and y > 74 + 4 * math.sin(x / 8.0):
        lv = 2
    return lv


def build_grid():
    lev = [[0] * N for _ in range(N)]
    srf = [[""] * N for _ in range(N)]
    for i in range(N):
        x = (i + 0.5) * B
        ys = shore(x)
        for j in range(N):
            y = (j + 0.5) * B
            d = y - ys
            if d < 0:
                if d > -3.5:
                    lev[i][j], srf[i][j] = -1, "seabed1"
                elif d > -11:
                    lev[i][j], srf[i][j] = -2, "seabed2"
                else:
                    lev[i][j], srf[i][j] = -5, "seabed3"
                continue
            lv = level_at(x, y)
            s = "mint"
            if d < 2.1 + 0.8 * math.sin(x / 3.0):
                s, lv = "sand", 0
            px = path_x(y)
            if abs(x - px) < 1.2:
                s = "path_worn" if abs(x - px) < 0.45 and random.random() < 0.55 else "path"
            elif abs(x - px) < 1.5:
                s = "path_edge"
            dx, dy = (x - POND_C[0]) / POND_R[0], (y - POND_C[1]) / POND_R[1]
            r = dx * dx + dy * dy
            if r < 1.0:
                s, lv = "seabed1", lv - 1
            elif r < 1.45:
                s = "sand"
            lev[i][j], srf[i][j] = lv, s
    return lev, srf


SIDE = {"mint": "mint_side", "sand": "sand_side", "path": "sand_side", "path_edge": "sand_side",
        "path_worn": "sand_side", "seabed1": "seabed1", "seabed2": "seabed2", "seabed3": "seabed3"}


def build_terrain(lev, srf, mat):
    verts, faces, cols = [], [], []
    grass_faces = []

    def quad(a, b, c, d, col, grass=False):
        k = len(verts)
        verts.extend([a, b, c, d])
        faces.append((k, k + 1, k + 2, k + 3))
        cols.append(col)
        if grass:
            grass_faces.append((a, b, c, d))

    cmap = {k: lin(v) for k, v in PAL.items()}
    # 윗면: 같은 줄(x 방향)에서 같은 (높이, 표면)을 한 면으로
    for j in range(N):
        i = 0
        while i < N:
            l0, s0 = lev[i][j], srf[i][j]
            i1 = i
            while i1 + 1 < N and lev[i1 + 1][j] == l0 and srf[i1 + 1][j] == s0:
                i1 += 1
            z = l0 * B
            x0, x1, y0, y1 = i * B, (i1 + 1) * B, j * B, (j + 1) * B
            top_color = mint_at((y0 + y1) * .5) if s0 == "mint" else cmap[s0]
            quad((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z), top_color, grass=(s0 == "mint"))
            i = i1 + 1
    # 옆면: 이웃 칸과 높이가 다르면 벽 (높은 쪽 표면 색의 옆면)
    for i in range(N):
        for j in range(N):
            l0 = lev[i][j]
            for di, dj in ((1, 0), (0, 1)):
                ii, jj = i + di, j + dj
                if ii >= N or jj >= N:
                    continue
                l1 = lev[ii][jj]
                if l1 == l0:
                    continue
                hi_s = srf[i][j] if l0 > l1 else srf[ii][jj]
                zlo, zhi = min(l0, l1) * B, max(l0, l1) * B
                c = cmap[SIDE.get(hi_s, "mint_side")]
                if di == 1:
                    x = ii * B
                    y0, y1 = j * B, (j + 1) * B
                    if l0 > l1:
                        quad((x, y0, zlo), (x, y1, zlo), (x, y1, zhi), (x, y0, zhi), c)
                    else:
                        quad((x, y1, zlo), (x, y0, zlo), (x, y0, zhi), (x, y1, zhi), c)
                else:
                    y = jj * B
                    x0, x1 = i * B, (i + 1) * B
                    if l0 > l1:
                        quad((x1, y, zlo), (x0, y, zlo), (x0, y, zhi), (x1, y, zhi), c)
                    else:
                        quad((x0, y, zlo), (x1, y, zlo), (x1, y, zhi), (x0, y, zhi), c)
    ob = mesh_from("terrain_i21", verts, faces, cols, mat)
    link(ob)
    # 풀·꽃 뿌릴 면 (렌더 안 함): 1.5m 칸마다 한 장 · 민트 칸만 · 덤불 밀도(노이즈) 가중치 → 뭉쳐 자란다
    # (줄 단위 긴 면에 가중치를 주면 꼭짓점이 적어 뭉침이 안 생기고 줄무늬로 깔렸다 — 실측)
    # 방출 면 자체는 파티클 설정의 '방출체 보이기'를 꺼서 숨긴다 (hide_render 하면 파티클도 같이 사라진다 — 실측)
    gv, gf, gw = [], [], []
    G = 1.5
    ng = int(S / G)
    for a_ in range(ng):
        for b_ in range(ng):
            cx, cy = (a_ + 0.5) * G, (b_ + 0.5) * G
            i, j = int(cx / B), int(cy / B)
            if srf[i][j] != "mint":
                continue
            broad = noise.noise(Vector((cx * 0.09, cy * 0.09, 4.2)))
            fine = noise.noise(Vector((cx * 0.35, cy * 0.35, 9.1)))
            spawn_meadow = math.exp(-(((cx - 45) / 30) ** 2 + ((cy - 34) / 20) ** 2))
            route_meadow = math.exp(-((cx - path_x(cy)) / 18) ** 2)
            w = max(0.08, min(1.0, 0.15 + 0.65 * spawn_meadow +
                             0.35 * route_meadow + broad * 0.12 + fine * 0.06))
            z = lev[i][j] * B + 0.001
            k = len(gv)
            gv.extend([(cx - G / 2, cy - G / 2, z), (cx + G / 2, cy - G / 2, z), (cx + G / 2, cy + G / 2, z), (cx - G / 2, cy + G / 2, z)])
            gf.append((k, k + 1, k + 2, k + 3))
            gw.extend([w] * 4)
    gm = bpy.data.meshes.new("grass_emit")
    gm.from_pydata(gv, [], gf)
    gm.update()
    ge = link(bpy.data.objects.new("grass_emit", gm))
    vg = ge.vertex_groups.new(name="density")
    for vi, w in enumerate(gw):
        vg.add([vi], w, "REPLACE")
    print("TERRAIN faces", len(faces), "grass faces", len(gf))
    return ob, ge


def build_groundcover(lev, srf, mat):
    """Cheap top-face fragments to keep far meadow textured when grass is culled.

    One merged mesh, roughly 20k triangles, with no individual scene nodes.
    Near the camera, the tapered grass instances provide the silhouette.
    """
    verts, faces, cols = [], [], []
    tones = ("mint_lo", "mint_hi", "leaf1")
    for _ in range(5000):
        x, y = random.uniform(0.8, S - 0.8), random.uniform(0.8, S - 0.8)
        i, j = int(x / B), int(y / B)
        if srf[i][j] != "mint":
            continue
        size = random.uniform(.10, .27)
        z = lev[i][j] * B + 0.008
        k = len(verts)
        verts.extend(((x, y, z), (x + size, y, z),
                      (x + size, y + size, z), (x, y + size, z)))
        faces.append((k, k + 1, k + 2, k + 3))
        base, tone = mint_at(y), lin(PAL[random.choice(tones)])
        cols.append(tuple(base[k] * .72 + tone[k] * .28 for k in range(3)))
    link(mesh_from("groundcover", verts, faces, cols, mat))


# ── 블록 소품 ────────────────────────────────────────
def cubes_mesh(name, cubes, mat):
    """cubes = [((cx,cy,cz), (sx,sy,sz), 선형색)] → 한 메시."""
    verts, faces, cols = [], [], []
    for (cx, cy, cz), (sx, sy, sz), c in cubes:
        hx, hy, hz = sx / 2, sy / 2, sz / 2
        k = len(verts)
        for dz in (-hz, hz):
            for dy in (-hy, hy):
                for dx in (-hx, hx):
                    verts.append((cx + dx, cy + dy, cz + dz))
        for f in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)):
            faces.append(tuple(k + v for v in f))
            cols.append(c)
    return mesh_from(name, verts, faces, cols, mat)


def c(name, k=0.06):
    return jit(lin(PAL[name]), k)


def make_tree(scale=1.0, variant=0):
    """블록 나무 약 3.4m (사람 1.5m 기준): 줄기 + 둥근 수관(겉면 블록만)."""
    cubes = []
    t = 0.3 * scale
    th = 1.3 * scale
    for dx in (-0.5, 0.5):
        for dy in (-0.5, 0.5):
            for k in range(int(th / (t * 0.75))):
                cubes.append(((dx * t * 0.75, dy * t * 0.75, (k + 0.5) * t * 0.75), (t * 0.75,) * 3, c("wood" if (k + dx > 0) else "wood_dk")))
    R = (1.25 * scale, 1.25 * scale, 1.05 * scale)
    cz = th + R[2] * 0.75
    cell = 0.3 * scale
    rng = int(R[0] / cell) + 1
    rz = int(R[2] / cell) + 1
    inside = set()
    for a in range(-rng, rng + 1):
        for b in range(-rng, rng + 1):
            for h in range(-rz, rz + 1):
                x, y, z = a * cell, b * cell, h * cell
                q = (x / R[0]) ** 2 + (y / R[1]) ** 2 + (z / R[2]) ** 2
                q += 0.18 * noise.noise(Vector((x * 2 + variant, y * 2, z * 2)))
                if q < 1.0:
                    inside.add((a, b, h))
    for (a, b, h) in inside:
        if all((a + da, b + db, h + dh) in inside for da, db, dh in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))):
            continue
        f = (h + rz) / (2 * rz)
        name = "leaf3" if f > 0.7 else ("leaf1" if f > 0.35 else "leaf2")
        if random.random() < 0.12:
            name = "leaf4"
        cubes.append(((a * cell, b * cell, cz + h * cell), (cell,) * 3, c(name, 0.05)))
    return cubes


def make_rock(n=None):
    cubes = []
    n = n or random.randint(3, 6)
    for k in range(n):
        s = random.choice((0.15, 0.3, 0.3, 0.45, 0.6))
        x, y = random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6)
        z = s / 2 + (0.3 if (k > 2 and random.random() < 0.5) else 0.0)
        cubes.append(((x, y, z), (s, s * random.uniform(0.8, 1.1), s * random.uniform(0.7, 1.0)), c(random.choice(("rock1", "rock2", "rock3")), 0.04)))
        if random.random() < 0.35:
            cubes.append(((x, y, z + s * 0.45), (s * 0.9, s * 0.9, 0.06), c("moss", 0.05)))
    return cubes


def make_tuft(variant):
    """풀 덤불 (시안 03·05 'Grass Block Variants'): 낮은 밑둥 블록 + 넓적한 잎 블록 8~12개."""
    rnd = random.Random(100 + variant)
    cubes = [((0, 0, 0.03), (0.3, 0.3, 0.06), lin(PAL["leaf2"]))]
    for _ in range(rnd.randint(8, 12)):
        h = rnd.uniform(0.12, 0.34)
        x, y = rnd.uniform(-0.13, 0.13), rnd.uniform(-0.13, 0.13)
        col = lin(PAL[rnd.choice(("leaf1", "leaf2", "leaf3", "leaf1", "mint_hi"))])
        cubes.append(((x, y, 0.06 + h / 2), (0.06, 0.06, h), col))
    return cubes


def tuft_mesh(name, variant, mat):
    """Five bent, tapered voxel leaves. No square plinth or repeated vertical posts.

    The prototype is laid on its side to compensate for Blender hair instances'
    +90 degree X rotation, as the original cube prototype was.
    """
    rnd = random.Random(100 + variant)
    verts, faces, cols = [], [], []
    for blade in range(7):
        angle = blade * math.tau / 7 + rnd.uniform(-0.3, 0.3)
        reach = rnd.uniform(0.055, 0.15) if blade else 0.02
        height = rnd.uniform(0.13, 0.30)
        bx, by = rnd.uniform(-0.045, 0.045), rnd.uniform(-0.045, 0.045)
        dx, dy = math.cos(angle) * reach, math.sin(angle) * reach
        width = rnd.uniform(0.038, 0.062)
        color = lin(PAL[rnd.choice(("leaf1", "leaf2", "leaf3", "mint_hi"))])
        rings = ((0.01, 0.0, width),
                 (height * 0.60, 0.42, width * 0.72),
                 (height, 1.0, width * 0.12))
        start = len(verts)
        for z, offset, half in rings:
            cx, cy = bx + dx * offset, by + dy * offset
            for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
                x, y = cx + sx * half, cy + sy * half
                verts.append((x, z, -y))
        for level in range(2):
            a = start + level * 4
            b = a + 4
            for side in range(4):
                faces.append((a + side, a + (side + 1) % 4,
                              b + (side + 1) % 4, b + side))
                cols.append(color)
        faces.append(tuple(start + 8 + q for q in range(4)))
        cols.append(color)
    return mesh_from(name, verts, faces, cols, mat)


def make_flower(variant):
    rnd = random.Random(200 + variant)
    petal = ("fl_white", "fl_pink", "fl_yellow", "fl_lilac")[variant % 4]
    cubes = []
    for _ in range(rnd.randint(2, 4)):
        h = rnd.uniform(0.18, 0.3)
        x, y = rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12)
        cubes.append(((x, y, h / 2), (0.035, 0.035, h), lin(PAL["leaf2"])))
        pc = lin(PAL[petal])
        for dx, dy in ((0.05, 0), (-0.05, 0), (0, 0.05), (0, -0.05)):
            cubes.append(((x + dx, y + dy, h), (0.05, 0.05, 0.035), pc))
        cubes.append(((x, y, h + 0.01), (0.045, 0.045, 0.04), lin(PAL["fl_yellow"] if petal != "fl_yellow" else PAL["fl_white"])))
    return cubes


def make_dock(length=12.0, width=2.0):
    cubes = []
    y = 0.0
    k = 0
    while y < length:
        col = c(("wood", "wood_lt", "wood_dk")[k % 3], 0.04)
        cubes.append(((0, -y - 0.15, 0.3), (width, 0.27, 0.08), col))
        y += 0.3
        k += 1
    for sx in (-1, 1):
        cubes.append(((sx * (width / 2 - 0.1), -length / 2, 0.22), (0.14, length, 0.1), c("wood_dk", 0.03)))
        for p in range(0, int(length / 2) + 1):
            py = -min(length - 0.1, p * 2.0)
            cubes.append(((sx * (width / 2 + 0.05), py, -0.55), (0.2, 0.2, 1.9), c("wood_dk", 0.04)))
            cubes.append(((sx * (width / 2 + 0.05), py, 0.52), (0.26, 0.26, 0.08), lin(PAL["purified"])))  # 시안 밧줄 띠
    return cubes


def make_cottage():
    """작은 집: 바닥 3.6×3.0m, 벽 2.1m, 빨간 지붕 계단 (사람 1.5m 기준 '작게')."""
    cubes = []
    W, D, H, s = 3.6, 3.0, 2.1, 0.3
    nx, ny, nz = int(W / s), int(D / s), int(H / s)
    for a in range(nx):
        for b in range(ny):
            if 0 < a < nx - 1 and 0 < b < ny - 1:
                continue
            for h in range(nz):
                x, y, z = (a - nx / 2 + 0.5) * s, (b - ny / 2 + 0.5) * s, (h + 0.5) * s
                name = "stone" if h == 0 else "wall"
                if b == 0 and a in (nx // 2 - 1, nx // 2) and h < 5:
                    name = "wood_dk"  # 문
                if b == 0 and a in (2, nx - 3) and h in (3, 4):
                    name = "window"
                cubes.append(((x, y, z), (s, s, s), c(name, 0.03)))
    # 지붕: 앞뒤로 계단식 (용마루 x 방향)
    for step in range(ny // 2 + 2):
        yy = D / 2 + 0.3 - step * s
        z = H + (step + 0.5) * s * 0.9
        for a in range(-1, nx + 1):
            x = (a - nx / 2 + 0.5) * s
            for sgn in (1, -1):
                cubes.append(((x, sgn * yy, z), (s, s, s * 0.9), c("roof", 0.05)))
    cubes.append(((W / 2 - 0.6, 0.3, H + 1.6), (0.36, 0.36, 0.9), c("stone", 0.03)))
    return cubes


def make_sparkle(kind):
    col = lin(PAL["purified"] if kind % 2 == 0 else "#7FE0D8")
    if kind < 2:
        return [((0, 0, 0), (0.16, 0.16, 0.16), col)]
    arm = [((0, 0, 0), (0.08, 0.08, 0.08), col)]
    for d in ((0.08, 0, 0), (-0.08, 0, 0), (0, 0, 0.08), (0, 0, -0.08)):
        arm.append((d, (0.08, 0.08, 0.08), col))
    return arm


# ── 배치 ─────────────────────────────────────────────
def top_z(lev, x, y):
    i, j = int(x / B), int(y / B)
    if 0 <= i < N and 0 <= j < N:
        return lev[i][j] * B
    return 0.0


def free_spot(lev, srf, x, y, clear_path=2.2):
    i, j = int(x / B), int(y / B)
    if not (0 <= i < N and 0 <= j < N):
        return False
    if srf[i][j] != "mint" or lev[i][j] < 0:
        return False
    if abs(x - path_x(y)) < clear_path:
        return False
    return True


def place(proto, x, y, z, rot=0.0, scale=1.0, coll=None):
    ob = bpy.data.objects.new(proto.name + "_i", proto.data)
    ob.location = (x, y, z)
    ob.rotation_euler = (0, 0, rot)
    ob.scale = (scale, scale, scale)
    link(ob, coll)
    return ob


def scatter_particles(emitter, name, protos, count, size=1.0, size_rand=0.3):
    coll = bpy.data.collections.new(name + "_set")
    bpy.context.scene.collection.children.link(coll)
    for p in protos:
        coll.objects.link(p)
    coll.hide_render = False
    ps_mod = emitter.modifiers.new(name, "PARTICLE_SYSTEM")
    ps = ps_mod.particle_system
    st = ps.settings
    st.type = "HAIR"
    st.count = count
    st.hair_length = 1.0
    st.render_type = "COLLECTION"
    st.instance_collection = coll
    st.use_collection_pick_random = True
    st.particle_size = size
    st.size_random = size_rand
    st.use_rotations = True
    st.rotation_mode = "GLOB_Z"          # 인스턴스 z축이 위를 보게 (NONE이면 머리카락 방향으로 눕는다)
    st.phase_factor_random = 2.0
    st.use_scale_instance = True
    st.use_emit_random = True
    st.emit_from = "FACE"
    st.use_even_distribution = True
    st.render_type = "COLLECTION"
    emitter.show_instancer_for_render = False
    emitter.show_instancer_for_viewport = False
    ps.seed = random.randint(0, 9999)
    ps.vertex_group_density = "density"
    return coll


def build_scene():
    clear()
    scn = bpy.context.scene
    m_ter = block_material("terrain_block", B)
    m_prop = flat_material("prop_block")
    m_glow = flat_material("glow_block", 0.3, emission=2.5)
    m_water = water_material()

    lev, srf = build_grid()
    ter, emit = build_terrain(lev, srf, m_ter)
    build_groundcover(lev, srf, m_prop)

    # 바다: 해안 거리로 얕은 청록(#A8E6E8) → 깊은 바다(#4D9DB3) 색을 물 면 꼭짓점에 칠한다 (투명 물 + 흰 바닥은 하얗게 떴다 — 실측)
    wv, wf, wc = [], [], []
    G = 2.0
    for a_ in range(-60, 116):
        for b_ in range(-60, 60):
            x0, y0 = a_ * G, b_ * G
            k = len(wv)
            wv.extend([(x0, y0, -0.1), (x0 + G, y0, -0.1), (x0 + G, y0 + G, -0.1), (x0, y0 + G, -0.1)])
            wf.append((k, k + 1, k + 2, k + 3))
            cx, cy = x0 + G / 2, y0 + G / 2
            d = (shore(min(max(cx, 0), S)) - cy) if 0 <= cx <= S else 40 + abs(cx - S / 2) * 0.3
            t = max(0.0, min(1.0, (d - 1.0) / 22.0))
            sh, dp = lin(PAL["shallow"]), lin(PAL["deep"])
            wc.append(tuple(sh[q] * (1 - t) + dp[q] * t for q in range(3)))
    sea = mesh_from("sea", wv, wf, wc, m_water)
    link(sea)
    # 해안 바로 앞 거품 큐브
    foam = []
    for k in range(260):
        x = random.uniform(0, S)
        y = shore(x) - random.uniform(0.2, 2.2)
        foam.append(((x, y, -0.02), (random.choice((0.3, 0.45)), random.choice((0.3, 0.45)), 0.08), jit(lin("#F4FBFA"), 0.03)))
    link(cubes_mesh("foam", foam, m_prop))

    # 원형(proto) 소품은 숨긴 모음에
    lib = bpy.data.collections.new("protos")
    scn.collection.children.link(lib)

    def proto(name, cubes, mat=m_prop):
        ob = cubes_mesh(name, cubes, mat)
        lib.objects.link(ob)
        return ob

    trees = [proto(f"tree{v}", make_tree(1.0, v)) for v in range(4)]
    rocks = [proto(f"rock{v}", make_rock()) for v in range(5)]
    # 파티클 인스턴스는 X축 +90°로 세워진다(실측) → 원본을 미리 -90° 눕혀 둔다
    def lay(cubes):
        return [((x, z, -y), (sx, sz, sy), col) for (x, y, z), (sx, sy, sz), col in cubes]
    tufts = []
    for v in range(8):
        tuft = tuft_mesh(f"tuft{v}", v, m_prop)
        lib.objects.link(tuft)
        tufts.append(tuft)
    flowers = [proto(f"flower{v}", lay(make_flower(v))) for v in range(8)]
    sparks = [proto(f"spark{v}", make_sparkle(v), m_glow) for v in range(4)]
    dock = proto("dock", make_dock())
    cottage = proto("cottage", make_cottage())

    props = bpy.data.collections.new("props")
    scn.collection.children.link(props)

    # 선착장: 해안에서 남쪽으로
    ys = shore(DOCK_X)
    place(dock, DOCK_X, ys + 0.6, 0.0, coll=props)
    # 작은 집: 북동쪽 멀리 (들판에 비해 아주 작게)
    hx, hy = 83.0, 88.0
    place(cottage, hx, hy, top_z(lev, hx, hy), rot=math.radians(-12), coll=props)
    # 나무 숲: 서쪽·북쪽 가장자리 무리 + 몇 그루 홀로
    groves = [(10, 80, 7), (18, 96, 6), (40, 104, 5), (70, 102, 6), (98, 70, 4), (8, 40, 4), (100, 96, 5)]
    for gx, gy, n in groves:
        for _ in range(n):
            x, y = gx + random.gauss(0, 4.5), gy + random.gauss(0, 3.5)
            if free_spot(lev, srf, x, y, 4.0):
                place(random.choice(trees), x, y, top_z(lev, x, y), random.uniform(0, 6.28), random.uniform(0.8, 1.2), props)
    for _ in range(9):
        x, y = random.uniform(15, 100), random.uniform(38, 100)
        if free_spot(lev, srf, x, y, 5.0):
            place(random.choice(trees), x, y, top_z(lev, x, y), random.uniform(0, 6.28), random.uniform(0.85, 1.1), props)
    # 바위: 해안선 따라 + 동쪽 만 바위 무더기 + 들판 드문드문
    for k in range(26):
        x = random.uniform(4, 108)
        y = shore(x) + random.uniform(-1.2, 1.5)
        if abs(x - DOCK_X) < 3:
            continue
        place(random.choice(rocks), x, y, max(-0.3, top_z(lev, x, y)), random.uniform(0, 6.28), random.uniform(0.6, 1.2), props)
    for _ in range(14):
        x, y = random.uniform(8, 105), random.uniform(25, 105)
        if free_spot(lev, srf, x, y, 3.0):
            place(random.choice(rocks), x, y, top_z(lev, x, y), random.uniform(0, 6.28), random.uniform(0.6, 1.0), props)
    # 떠다니는 시안 반짝이 (정화후)
    for _ in range(70):
        x, y = random.uniform(5, 105), random.uniform(18, 108)
        z = top_z(lev, x, y) + random.uniform(0.9, 3.2)
        place(random.choice(sparks), x, y, z, random.uniform(0, 6.28), random.uniform(0.8, 1.4), props)

    # 풀·꽃 (파티클 인스턴스)
    sets = [scatter_particles(emit, "grass", tufts, 5000, 1.0, 0.45),
            scatter_particles(emit, "flowers", flowers, 850, 1.0, 0.3)]
    for ps in emit.particle_systems:
        ps.settings.use_even_distribution = False
    # 원본 모음은 뷰 레이어에서 제외 (원점에 원본이 렌더되지 않게, 인스턴스는 그대로 그려진다)
    for cl in [lib] + sets:
        bpy.context.view_layer.layer_collection.children[cl.name].exclude = True
    # 연못 물 (연못 바닥 한 단 위)
    pz = (level_at(*POND_C) - 1) * B + B * 0.65
    rx, ry = POND_R[0] * 1.05, POND_R[1] * 1.05
    link(mesh_from("pond", [(POND_C[0] - rx, POND_C[1] - ry, pz), (POND_C[0] + rx, POND_C[1] - ry, pz),
                            (POND_C[0] + rx, POND_C[1] + ry, pz), (POND_C[0] - rx, POND_C[1] + ry, pz)],
                   [(0, 1, 2, 3)], [lin(PAL["shallow"])], m_water))

    # 사람 크기 기준: B2 방랑자를 1.5m로
    b2 = "C:/xoox/data/tools/unit_lab/character/D/wanderer_D.glb"
    if os.path.exists(b2):
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=b2)
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            o["map_preview_only"] = True
        pts = [o.matrix_world @ Vector(cc) for o in new if o.type == "MESH" for cc in o.bound_box]
        if pts:
            h = max(p.z for p in pts) - min(p.z for p in pts)
            root = [o for o in new if o.parent is None]
            k = PERSON / max(0.1, h)
            px, py = path_x(ys + 7) + 1.6, ys + 7
            for r in root:
                r.scale = (k, k, k)
                r.location = (px, py, top_z(lev, px, py))
                r.rotation_euler = (0, 0, math.radians(200))
            print("PERSON height", round(h * k, 2))
        for o in new:
            if o.type == "MESH" and (any(t in o.name for t in ("mg_", "rf_", "bomb"))
                                     or (o.name.startswith("face_") and not o.name.startswith("face_default"))):
                o.hide_render = True
    return lev


def distant(scn, mat):
    """북쪽 멀리 계단식 파스텔 언덕 (i11 쪽) + 파스텔 구름."""
    rnd = random.Random(7)
    for k, (hx, hy, r, lv) in enumerate(((-30, 190, 34, 7), (40, 230, 46, 9), (120, 200, 38, 8), (175, 150, 30, 6), (-80, 130, 26, 5))):
        cubes = []
        for L in range(lv):
            rr = r * (1 - L / (lv + 0.5))
            col = lin(PAL[("hill1", "hill3", "hill2")[L % 3]])
            for a in range(-int(rr / 3), int(rr / 3) + 1):
                for b in range(-int(rr / 3), int(rr / 3) + 1):
                    if a * a + b * b <= (rr / 3) ** 2:
                        cubes.append(((hx + a * 3, hy + b * 3, L * 1.5 + 0.75), (3, 3, 1.5), jit(col, 0.05)))
        link(cubes_mesh(f"hill{k}", cubes, mat))
    # Small stepped cloud banks, far outside the playable sectors. Each bank is
    # one mesh rather than a group of bright UV spheres.
    for k in range(7):
        cx = -115 + k * 60 + rnd.uniform(-15, 15)
        cy = -230 - rnd.uniform(0, 160)
        cz = rnd.uniform(58, 83)
        cubes = []
        for q in range(rnd.randint(17, 26)):
            dx, dz = rnd.gauss(0, 12), rnd.gauss(0, 3.7)
            size = rnd.uniform(3.0, 6.0)
            if (dx / 27) ** 2 + (dz / 10) ** 2 > 1.0:
                continue
            tint = rnd.choice(("#FFF4F0", "#FBE9E8", "#F5F1EF"))
            cubes.append(((cx + dx, cy + rnd.uniform(-3, 3), cz + dz),
                          (size * 1.7, size, size * 0.85), lin(tint)))
        if cubes:
            link(cubes_mesh(f"cloud{k}", cubes, mat))


def setup_render(scn):
    scn.render.engine = "BLENDER_EEVEE"
    try:
        scn.eevee.taa_render_samples = 24
    except Exception:
        pass
    # 팔레트 색을 그대로 보이려면 Standard (AgX는 파스텔을 회청색으로 바랬다 — 실측)
    scn.view_settings.view_transform = "Standard"
    scn.view_settings.look = "None"
    scn.view_settings.exposure = -0.1
    scn.render.resolution_x, scn.render.resolution_y = 1280, 720
    w = bpy.data.worlds.new("sky")
    scn.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes["Background"]
    sky = nt.nodes.new("ShaderNodeTexSky")
    try:
        sky.sky_type = "NISHITA"
        sky.sun_elevation = math.radians(38)
        sky.sun_rotation = math.radians(150)
    except Exception:
        pass
    mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs["Factor"].default_value = 0.25
    mix.inputs[7].default_value = (*lin("#CFE8F2"), 1)
    nt.links.new(sky.outputs["Color"], mix.inputs[6])
    # 배경(카메라에 보이는 하늘)과 조명(물체를 비추는 빛)을 나눈다: 조명은 중립 따뜻한 회색
    lp = nt.nodes.new("ShaderNodeLightPath")
    amb = nt.nodes.new("ShaderNodeBackground")
    amb.inputs["Color"].default_value = (*lin("#F4F0EA"), 1)
    amb.inputs["Strength"].default_value = 0.65
    # 카메라 하늘: 시안 03 하늘 그라데이션 (위 연파랑 → 지평선 크림) — Nishita는 너무 밝아 하얗게 떴다(실측)
    geo = nt.nodes.new("ShaderNodeNewGeometry")   # 월드에서 Incoming = 보는 방향 반대
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Incoming"], sep.inputs[0])
    neg = nt.nodes.new("ShaderNodeMath"); neg.operation = "MULTIPLY"; neg.inputs[1].default_value = -1.0
    nt.links.new(sep.outputs["Z"], neg.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (*lin("#F7F4EC"), 1)
    e = ramp.color_ramp.elements.new(0.02); e.color = (*lin("#E4F1F4"), 1)
    ramp.color_ramp.elements[1].position = 0.22
    ramp.color_ramp.elements[1].color = (*lin("#86C3E6"), 1)
    nt.links.new(neg.outputs[0], ramp.inputs["Fac"])
    sky_bg = nt.nodes.new("ShaderNodeBackground")
    nt.links.new(ramp.outputs["Color"], sky_bg.inputs["Color"])
    sky_bg.inputs["Strength"].default_value = 1.0
    ms = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Camera Ray"], ms.inputs[0])
    nt.links.new(amb.outputs[0], ms.inputs[1])
    nt.links.new(sky_bg.outputs[0], ms.inputs[2])
    nt.links.new(ms.outputs[0], nt.nodes["World Output"].inputs["Surface"])
    bg.inputs["Strength"].default_value = 0.0
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy = 2.6
    sun.color = lin("#FFF4E6")
    sun.angle = math.radians(3)
    so = link(bpy.data.objects.new("sun", sun))
    so.rotation_euler = (math.radians(45), 0, math.radians(-150))   # 남서쪽 해 → 북쪽을 보는 카메라에서 턱 벽이 밝다
    fill = bpy.data.lights.new("fill", "SUN")
    fill.energy = 0.8
    fill.color = lin("#FFE8D0")
    fo = link(bpy.data.objects.new("fill", fill))
    fo.rotation_euler = (math.radians(60), 0, math.radians(-40))
    # 대기 원근감은 하늘 밝은 파스텔 + 먼 언덕 색으로만 (월드 볼륨은 이 스케일에서 빛을 전부 먹었다 — 실측)


CAMS = {
    # 시안 03 구도: 들판 너머로 선착장·오른쪽 바다
    "field": ((35.0, 27.0, 3.2), (59.0, 13.0, 1.0), 36),
    # 선착장 옆 사람 눈높이 (1.5m 캐릭터와 비교)
    "dock": ((47.0, 26.0, 2.6), (57.0, 14.0, 0.6), 30),
    # 섹터 전경 (위에서 비스듬히)
    "overview": ((55.0, -95.0, 110.0), (55.0, 50.0, 0.0), 38),
}


def render_all(scn):
    cam_d = bpy.data.cameras.new("cam")
    cam = link(bpy.data.objects.new("cam", cam_d))
    scn.camera = cam
    for name, (pos, tgt, lens) in CAMS.items():
        cam.location = pos
        d = Vector(tgt) - Vector(pos)
        cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        cam_d.lens = lens
        cam_d.clip_end = 2000
        scn.render.filepath = os.path.join(OUT, "renders", f"i21_{name}.png")
        bpy.ops.render.render(write_still=True)
        print("RENDERED", name)


def main():
    os.makedirs(os.path.join(OUT, "renders"), exist_ok=True)
    build_scene()
    scn = bpy.context.scene
    setup_render(scn)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "i21_purified.blend"))
    if DO_RENDER:
        render_all(scn)
    print("I21_DONE")

