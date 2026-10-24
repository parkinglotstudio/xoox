"""Central crossroads sector i11, sharing the i21 block/prop pipeline."""
import importlib.util
import math
import os
import random
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(HERE, "map_common.py")
spec = importlib.util.spec_from_file_location("map_common", BASE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
random.seed(11)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else HERE


def path_x(y):
    # The first 3 m are identical to i21's northern edge.
    blend = min(1.0, max(0.0, (y - 1.0) / 17.0))
    north = 55.0 + 2.0 * math.sin(y / 17.0 + 0.3)
    return (1.0 - blend) * m.i21_path_x(109.95) + blend * north


def path_y(x):
    return 55.0 + 1.8 * math.sin((x - 50.0) / 19.0)


def level_at(x, y):
    # Match i21's western stepped plateau at the shared edge.
    if y < 2.0:
        return m.i21_level_at(x, 109.95)
    west = x < 23 + 3 * math.sin(y / 16.0)
    if y < 15:
        return m.i21_level_at(x, 109.95) if west else 0
    if west and y < 39 + 4 * math.sin(x / 9.0):
        return 1
    if x < 13 and y < 25:
        return 2
    return 0


def build_grid():
    lev = [[0] * m.N for _ in range(m.N)]
    srf = [[""] * m.N for _ in range(m.N)]
    for i in range(m.N):
        x = (i + .5) * m.B
        for j in range(m.N):
            y = (j + .5) * m.B
            lv = level_at(x, y)
            px = path_x(y)
            py = path_y(x)
            d = min(abs(x - px), abs(y - py))
            if d < 1.15:
                surface = "path_worn" if d < .4 and random.random() < .48 else "path"
                lv = 0
            elif d < 1.5:
                surface, lv = "path_edge", 0
            else:
                surface = "mint"
            lev[i][j], srf[i][j] = lv, surface
    return lev, srf


m.i21_path_x = m.path_x
m.i21_level_at = m.level_at
m.path_x = path_x
m.level_at = level_at
m.build_grid = build_grid


def groundcover(lev, srf, mat):
    """Small, subtle color flecks in one mesh; no large painted squares."""
    verts, faces, colors = [], [], []
    base = m.lin(m.PAL["mint"])
    tones = [m.lin(m.PAL[t]) for t in ("mint_lo", "mint_hi", "leaf1")]
    for _ in range(5000):
        x, y = random.uniform(.6, 109.4), random.uniform(.6, 109.4)
        i, j = int(x / m.B), int(y / m.B)
        if srf[i][j] != "mint":
            continue
        size = random.uniform(.10, .27)
        z = lev[i][j] * m.B + .008
        k = len(verts)
        verts.extend(((x, y, z), (x + size, y, z),
                      (x + size, y + size, z), (x, y + size, z)))
        faces.append((k, k + 1, k + 2, k + 3))
        tone = random.choice(tones)
        colors.append(tuple(base[c] * .72 + tone[c] * .28 for c in range(3)))
    m.link(m.mesh_from("groundcover", verts, faces, colors, mat))


def build_scene():
    m.clear()
    scene = bpy.context.scene
    terrain_mat = m.block_material("terrain_block", m.B)
    prop_mat = m.flat_material("prop_block")
    glow_mat = m.flat_material("glow_block", .3, emission=2.5)
    lev, srf = build_grid()
    terrain, emitter = m.build_terrain(lev, srf, terrain_mat)
    terrain.name = "terrain_i11"
    groundcover(lev, srf, prop_mat)
    lib = bpy.data.collections.new("protos")
    scene.collection.children.link(lib)

    def proto(name, cubes, material=prop_mat):
        obj = m.cubes_mesh(name, cubes, material)
        lib.objects.link(obj)
        return obj

    trees = [proto(f"tree{v}", m.make_tree(1.0, v)) for v in range(4)]
    rocks = [proto(f"rock{v}", m.make_rock()) for v in range(5)]
    tufts = []
    for v in range(8):
        obj = m.tuft_mesh(f"tuft{v}", v, prop_mat)
        lib.objects.link(obj)
        tufts.append(obj)

    def lay(cubes):
        return [((x, z, -y), (sx, sz, sy), col)
                for (x, y, z), (sx, sy, sz), col in cubes]

    flowers = [proto(f"flower{v}", lay(m.make_flower(v))) for v in range(8)]
    sparks = [proto(f"spark{v}", m.make_sparkle(v), glow_mat) for v in range(4)]
    cottage = proto("cottage_red", m.make_cottage())
    # Distinct pastel roofs from the i11 concept, same small cottage silhouette.
    pink = m.make_cottage()
    blue = m.make_cottage()
    red = m.lin(m.PAL["roof"])
    for cubes, color in ((pink, m.lin("#DA97AC")), (blue, m.lin("#92BFD2"))):
        for idx, (pos, size, col) in enumerate(cubes):
            if col[0] > red[0] * .8 and col[1] < red[1] * 1.5 and col[2] < red[2] * 1.5 and pos[2] > 2:
                cubes[idx] = (pos, size, color)
    cottages = [cottage, proto("cottage_pink", pink), proto("cottage_blue", blue)]
    props = bpy.data.collections.new("props")
    scene.collection.children.link(props)
    for (x, y, rot, k) in ((78, 67, -15, 1), (32, 68, 22, 2), (85, 31, 165, 0)):
        m.place(cottages[k], x, y, m.top_z(lev, x, y), math.radians(rot), 1.0, props)
    groves = [(13, 57, 6), (15, 91, 8), (44, 92, 5), (75, 100, 7),
              (97, 77, 5), (96, 17, 5), (13, 16, 4)]
    for gx, gy, count in groves:
        for _ in range(count):
            x, y = gx + random.gauss(0, 5.0), gy + random.gauss(0, 4.5)
            if 2 < x < 108 and 2 < y < 108 and m.free_spot(lev, srf, x, y, 4.5) and abs(y-path_y(x)) > 4.5:
                m.place(random.choice(trees), x, y, m.top_z(lev, x, y), random.uniform(0, 6.28), random.uniform(.8, 1.2), props)
    for x, y, scale in ((28, 39, 1.05), (84, 43, 1.1), (24, 64, .9), (90, 67, 1.0)):
        m.place(random.choice(trees), x, y, m.top_z(lev, x, y), random.uniform(0, 6.28), scale, props)
    for _ in range(24):
        x, y = random.uniform(4, 106), random.uniform(4, 106)
        if m.free_spot(lev, srf, x, y, 3) and abs(y-path_y(x)) > 3:
            m.place(random.choice(rocks), x, y, m.top_z(lev, x, y), random.uniform(0, 6.28), random.uniform(.6, 1), props)
    for _ in range(45):
        x, y = random.uniform(5, 105), random.uniform(5, 105)
        m.place(random.choice(sparks), x, y, m.top_z(lev, x, y) + random.uniform(1.1, 2.8),
                random.uniform(0, 6.28), random.uniform(.8, 1.2), props)
    sets = [m.scatter_particles(emitter, "grass", tufts, 1900, .88, .45),
            m.scatter_particles(emitter, "flowers", flowers, 400, 1.0, .3)]
    for ps in emitter.particle_systems:
        ps.settings.use_even_distribution = False
    for collection in [lib] + sets:
        bpy.context.view_layer.layer_collection.children[collection.name].exclude = True
    return lev, srf


def main():
    os.makedirs(os.path.join(OUT, "renders"), exist_ok=True)
    lev, srf = build_scene()
    m.setup_render(bpy.context.scene)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "i11_purified.blend"))
    print("I11_DONE", len(bpy.data.objects), "south-boundary", [(x, level_at(x, .15), round(path_x(.15), 3)) for x in (5, 15, 25, 55)])


if __name__ == "__main__":
    main()
