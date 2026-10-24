# 정화 후 섬. 시안(가장자리 나무, 가운데 풀밭)을 블렌더 블록으로 만든다.
# 나무 모양은 정화 숲 빌더의 수종을 그대로 쓰고, 바위와 바다는 새로 쌓는다.
# 실행: blender -b -P scripts/island_coast/build_island.py
import math
import random
from pathlib import Path

import bpy
from mathutils import Vector

OUT = Path(r"C:\xoox\data\maps\island_coast")
OUT.mkdir(parents=True, exist_ok=True)

RX, RY = 46.0, 34.0
GRASS_Z = 5.6


def srgb(hex_color):
    h = hex_color.lstrip("#")
    rgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c ** 2.2 for c in rgb) + (1.0,)


def material(name, hex_color):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb(hex_color)
    bsdf.inputs["Roughness"].default_value = 0.86
    return mat


def cube(name, x, y, z, sx, sy, sz, mat):
    mesh = bpy.data.meshes.new(name)
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    verts = [
        (x - hx, y - hy, z - hz),
        (x + hx, y - hy, z - hz),
        (x + hx, y + hy, z - hz),
        (x - hx, y + hy, z - hz),
        (x - hx, y - hy, z + hz),
        (x + hx, y - hy, z + hz),
        (x + hx, y + hy, z + hz),
        (x - hx, y + hy, z + hz),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def join(name, objects):
    if not objects:
        return None
    base = objects[0]
    if len(objects) > 1:
        bpy.ops.object.select_all(action="DESELECT")
        for ob in objects:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = base
        bpy.ops.object.join()
    base.name = name
    return base


bpy.ops.wm.read_factory_settings(use_empty=True)
rng = random.Random(20261009)

mats = {
    "sea": material("sea", "#071726"),
    "grass": material("grass", "#7EA24A"),
    "grass_light": material("grass_light", "#A7BF61"),
    "shore": material("shore", "#0A7A84"),
    "creek": material("creek", "#0FBEC7"),
    "rock": material("rock", "#19314A"),
    "rock_dark": material("rock_dark", "#0D2336"),
    "trunk": material("trunk", "#786044"),
    "leaf0": material("leaf0", "#436B32"),
    "leaf1": material("leaf1", "#698F3C"),
    "leaf2": material("leaf2", "#92AC50"),
}

parts = []
parts.append(cube("sea", 0, 0, -0.4, 210, 168, 0.8, mats["sea"]))

grass_bits = []
for iy in range(-30, 31):
    for ix in range(-42, 43):
        x, y = ix * 1.15, iy * 1.15
        if (x / (RX * 0.84)) ** 2 + (y / (RY * 0.80)) ** 2 > 1:
            continue
        col = mats["grass_light"] if ((ix + iy) % 7 == 0) else mats["grass"]
        grass_bits.append(cube("g", x, y, GRASS_Z - 0.18, 1.15, 1.15, 0.36, col))
join("grass", grass_bits)

shore = []
for i in range(96):
    t = i / 96 * math.tau
    x, y = math.cos(t) * RX * 0.90, math.sin(t) * RY * 0.86
    shore.append(cube("shore", x, y, GRASS_Z - 0.55, 2.2, 1.6, 0.22, mats["shore"]))
join("shore_glint", shore)

# 가운데를 가로지르는 가는 시내. 생명색은 이 줄에만 쓴다.
creek = []
for i in range(18):
    x = -16 + i * 1.9
    y = math.sin(i * 0.45) * 2.2
    creek.append(cube("creek", x, y, GRASS_Z + 0.04, 2.1, 0.85, 0.08, mats["creek"]))
join("creek", creek)

rocks = []
for i in range(64):
    t = i / 64 * math.tau + rng.uniform(-0.02, 0.02)
    reach = rng.uniform(0.98, 1.08)
    x, y = math.cos(t) * RX * reach, math.sin(t) * RY * reach
    h = rng.uniform(4.8, 8.2)
    w = rng.uniform(3.4, 5.6)
    d = rng.uniform(2.8, 4.4)
    mat = mats["rock_dark"] if i % 3 == 0 else mats["rock"]
    rocks.append(cube("cliff", x, y, h * 0.5, w, d, h, mat))
    rocks.append(
        cube(
            "cliff_cap",
            x + rng.uniform(-0.6, 0.6),
            y + rng.uniform(-0.4, 0.4),
            h + 0.45,
            w * 0.62,
            d * 0.55,
            1.1,
            mats["rock"],
        )
    )
# 바다 쪽으로 나온 바위 더미 하나. 시안의 남서쪽 암초.
for k in range(7):
    rocks.append(
        cube(
            "stack",
            -RX * 0.72 - k * 1.1,
            -RY * 0.95 - rng.uniform(0, 2),
            rng.uniform(1.2, 3.4),
            rng.uniform(2.2, 3.6),
            rng.uniform(2.0, 3.2),
            rng.uniform(2.4, 5.5),
            mats["rock_dark"],
        )
    )
join("cliffs", rocks)

# 정화 숲 수종 실루엣. 줄기 + 층진 잎 블록.
SHAPES = [
    [(0, 0, 3.1, 2.8, 2.7, 1.1), (0, 0.2, 4.8, 2.2, 2.1, 0.9), (0, 0, 5.45, 1.3, 1.4, 0.5)],
    [(0, 0, 2.5, 3.2, 3.2, 0.65), (0, 0, 4.0, 2.1, 2.1, 0.7), (0, 0, 5.5, 1.05, 1.05, 0.7)],
    [(-1, 0, 2.9, 2.1, 2.3, 0.9), (1, 0.2, 3.1, 2.2, 2.1, 0.9), (0, 0, 4.45, 2.6, 2.3, 0.7)],
]


def make_tree(index, x, y, scale):
    bits = [cube(f"trunk{index}", x, y, GRASS_Z + 1.6 * scale, 0.62 * scale, 0.62 * scale, 3.2 * scale, mats["trunk"])]
    leaves = (mats["leaf0"], mats["leaf1"], mats["leaf2"])
    for j, (ox, oy, oz, w, d, h) in enumerate(SHAPES[index % 3]):
        bits.append(
            cube(
                f"leaf{index}_{j}",
                x + ox * scale,
                y + oy * scale,
                GRASS_Z + oz * scale,
                w * scale,
                d * scale,
                h * scale,
                leaves[j % 3],
            )
        )
    return bits


def on_rim(x, y):
    e = (x / RX) ** 2 + (y / RY) ** 2
    return 0.50 <= e <= 0.78


spots = []
tree_bits = []
for _try in range(400):
    t = rng.random() * math.tau
    reach = rng.uniform(0.70, 0.88)
    x, y = math.cos(t) * RX * reach, math.sin(t) * RY * reach
    if not on_rim(x, y):
        continue
    if any((x - px) ** 2 + (y - py) ** 2 < 5.2 ** 2 for px, py in spots):
        continue
    spots.append((x, y))
    tree_bits.extend(make_tree(len(spots), x, y, rng.uniform(0.85, 1.25)))
    if len(spots) >= 54:
        break

# 가운데 풀밭에 나무 몇 그루만.
for cx, cy, sc in ((-6, 8, 0.7), (10, -4, 0.62), (2, 14, 0.55)):
    spots.append((cx, cy))
    tree_bits.extend(make_tree(len(spots), cx, cy, sc))
join("trees", tree_bits)

scene = bpy.context.scene
scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs[0].default_value = srgb("#9BB8C4")
bg.inputs[1].default_value = 0.55

sun_data = bpy.data.lights.new("Sun", "SUN")
sun_data.energy = 3.2
sun_data.color = (1.0, 0.93, 0.82)
sun = bpy.data.objects.new("Sun", sun_data)
scene.collection.objects.link(sun)
sun.rotation_euler = (math.radians(48), math.radians(12), math.radians(-35))

hemi_data = bpy.data.lights.new("Sky", "SUN")
hemi_data.energy = 0.6
hemi_data.color = (0.75, 0.86, 0.9)
hemi = bpy.data.objects.new("SkyFill", hemi_data)
scene.collection.objects.link(hemi)
hemi.rotation_euler = (math.radians(70), 0, math.radians(140))

cam_data = bpy.data.cameras.new("Overview")
cam_data.lens = 38
cam = bpy.data.objects.new("Overview", cam_data)
scene.collection.objects.link(cam)
cam.location = (78, -62, 52)
target = Vector((0, 4, 4))
cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "island_purified.blend"))
bpy.ops.export_scene.gltf(filepath=str(OUT / "island_purified.glb"), export_format="GLB", export_apply=True)

try:
    scene.render.engine = "BLENDER_EEVEE_NEXT"
except Exception:
    scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.filepath = str(OUT / "overview.png")
bpy.ops.render.render(write_still=True)
print("ISLAND COMPLETE", "trees", len(spots), "out", OUT)
