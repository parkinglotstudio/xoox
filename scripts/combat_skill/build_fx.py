"""Combat skill look, made in Blender.

Hits are cubes that pop up off the ground, same motion as the floor voxel grit.
The pistol bullet is a solid cartridge, nose along Blender +Z so it becomes +Y in the tool.

  blender -b -P scripts/combat_skill/build_fx.py
"""
import math
import random
from pathlib import Path

import bpy

OUT = Path(r"C:\xoox\data\tools\combat_skill\blender")
OUT.mkdir(parents=True, exist_ok=True)
FPS = 30


def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = 1
    return scene


def material(name, rgb):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    color = (rgb[0], rgb[1], rgb[2], 1)
    for key in ("Base Color", "Emission Color"):
        sock = bsdf.inputs.get(key)
        if sock is not None and not isinstance(sock.default_value, (float, int)):
            sock.default_value = color
    strength = bsdf.inputs.get("Emission Strength")
    if strength is not None:
        strength.default_value = 2.4
    return mat


def export(path):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_animations=True,
        export_animation_mode="SCENE",
        export_force_sampling=True,
        export_anim_slide_to_zero=True,
    )
    print("WROTE", path.name, path.stat().st_size, "actions", len(bpy.data.actions))


def build_bullet():
    fresh()
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.08, depth=0.72, location=(0, 0, 0.36))
    body = bpy.context.object
    body.name = "bullet_body"
    body.data.materials.append(material("brass", (0.86, 0.66, 0.28)))
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.085, depth=0.26, location=(0, 0, 0.85))
    tip = bpy.context.object
    tip.name = "bullet_tip"
    tip.data.materials.append(material("brass_tip", (0.98, 0.9, 0.62)))
    export(OUT / "bullet.glb")


def cube(name, rgb):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.2))
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material(name, rgb))
    return obj


def pose(obj, frame, loc, size):
    obj.location = loc
    obj.scale = (size, size, size)
    obj.keyframe_insert(data_path="location", frame=frame)
    obj.keyframe_insert(data_path="scale", frame=frame)


def bake_fire():
    scene = fresh()
    scene.frame_end = 48
    rng = random.Random(1)
    reds = [(1.0, 0.0, 0.0), (0.82, 0.0, 0.02), (1.0, 0.04, 0.04)]
    for i in range(14):
        obj = cube(f"cube_{i:02d}", reds[i % 3])
        size = rng.uniform(0.28, 0.46)
        ang = rng.random() * math.tau
        vx = math.cos(ang) * rng.uniform(0.15, 0.55)
        vy = math.sin(ang) * rng.uniform(0.15, 0.55)
        vz = rng.uniform(1.8, 3.2)
        x = y = 0.0
        z = 0.15
        for frame in range(1, 49):
            dt = 1 / FPS
            u = (frame - 1) / 47
            vx *= 1 - dt * 0.6
            vy *= 1 - dt * 0.6
            vz -= 0.8 * dt
            x += vx * dt
            y += vy * dt
            z += vz * dt
            fade = 1.0 if u < 0.62 else max(0.05, 1 - (u - 0.62) / 0.38)
            pose(obj, frame, (x, y, max(0.08, z)), size * fade)
    export(OUT / "hit-fire.glb")


def bake_ice():
    """Cubes fly onto the body, stay bound, then break away."""
    scene = fresh()
    scene.frame_end = 120
    rng = random.Random(2)
    blues = [(0.35, 0.72, 1.0), (0.55, 0.88, 1.0), (0.15, 0.45, 0.95)]
    for i in range(16):
        obj = cube(f"cube_{i:02d}", blues[i % 3])
        size = rng.uniform(0.26, 0.42)
        ang = (i / 16) * math.tau + rng.uniform(-0.15, 0.15)
        height = 0.35 + (i % 4) * 0.32
        ring = 0.58 + (0.08 if i % 2 else 0)
        hold = (math.cos(ang) * ring, math.sin(ang) * ring, height)
        start = (hold[0] * 2.6, hold[1] * 2.6, hold[2] + rng.uniform(0.2, 0.7))
        release = (hold[0] * 2.4, hold[1] * 2.4, hold[2] + rng.uniform(-0.15, 0.45))
        pose(obj, 1, start, size * 0.7)
        pose(obj, 16, hold, size)
        pose(obj, 96, hold, size)
        pose(obj, 120, release, size * 0.12)
    export(OUT / "hit-ice.glb")


def bake_bolt():
    """Spread in every direction. No drop to the ground."""
    scene = fresh()
    scene.frame_end = 28
    rng = random.Random(3)
    yellows = [(1.0, 0.96, 0.45), (1.0, 1.0, 0.82), (0.98, 0.82, 0.15)]
    for i in range(16):
        obj = cube(f"cube_{i:02d}", yellows[i % 3])
        size = rng.uniform(0.12, 0.2)
        theta = rng.random() * math.tau
        phi = math.acos(rng.uniform(-1, 1))
        spd = rng.uniform(2.6, 4.2)
        vx = math.sin(phi) * math.cos(theta) * spd
        vy = math.sin(phi) * math.sin(theta) * spd
        vz = math.cos(phi) * spd
        x = y = z = 0.85
        for frame in range(1, 29):
            dt = 1 / FPS
            u = (frame - 1) / 27
            x += vx * dt
            y += vy * dt
            z += vz * dt
            fade = 1.0 if u < 0.45 else max(0.04, 1 - (u - 0.45) / 0.55)
            pose(obj, frame, (x, y, z), size * fade)
    export(OUT / "hit-bolt.glb")


def bake_brass():
    scene = fresh()
    scene.frame_end = 14
    rng = random.Random(4)
    brass = [(0.95, 0.78, 0.32), (1.0, 0.9, 0.55), (0.72, 0.5, 0.16)]
    for i in range(8):
        obj = cube(f"cube_{i:02d}", brass[i % 3])
        size = rng.uniform(0.08, 0.14)
        ang = rng.random() * math.tau
        spd = rng.uniform(0.8, 1.6)
        vx = math.cos(ang) * spd
        vy = math.sin(ang) * spd
        vz = rng.uniform(0.6, 1.4)
        x = y = 0.0
        z = 0.7
        for frame in range(1, 15):
            dt = 1 / FPS
            u = (frame - 1) / 13
            x += vx * dt
            y += vy * dt
            z += vz * dt
            vz -= 3.0 * dt
            fade = 1.0 if u < 0.5 else max(0.05, 1 - (u - 0.5) / 0.5)
            pose(obj, frame, (x, y, max(0.05, z)), size * fade)
    export(OUT / "hit-bullet.glb")


def bake_bomb():
    """A plain blast. Cubes pop out and up, then drop."""
    scene = fresh()
    scene.frame_end = 48
    rng = random.Random(8)
    colors = [(0.95, 0.28, 0.05), (0.72, 0.08, 0.02), (1.0, 0.45, 0.08)]
    for i in range(20):
        obj = cube(f"cube_{i:02d}", colors[i % 3])
        size = rng.uniform(0.32, 0.52)
        theta = rng.random() * math.tau
        phi = math.acos(rng.uniform(0.2, 1))
        spd = rng.uniform(3.2, 5.4)
        vx = math.sin(phi) * math.cos(theta) * spd
        vy = math.sin(phi) * math.sin(theta) * spd
        vz = abs(math.cos(phi)) * spd + 2.2
        x = y = 0.0
        z = 0.5
        for frame in range(1, 49):
            dt = 1 / FPS
            u = (frame - 1) / 47
            vx *= 1 - dt * 0.9
            vy *= 1 - dt * 0.9
            vz -= 8.5 * dt
            x += vx * dt
            y += vy * dt
            z += vz * dt
            fade = 1.0 if u < 0.5 else max(0.05, 1 - (u - 0.5) / 0.5)
            pose(obj, frame, (x, y, max(0.04, z)), size * fade)
    export(OUT / "hit-bomb.glb")


build_bullet()
bake_fire()
bake_ice()
bake_bolt()
bake_brass()
bake_bomb()
print("DONE")
