# blender -b i21_purified.blend -P quick.py -- <cam name> <out.png> [samples] [pct]
import bpy, sys, os, math
from mathutils import Vector
argv = sys.argv[sys.argv.index("--") + 1:]
name, out = argv[0], argv[1]
samples = int(argv[2]) if len(argv) > 2 else 8
pct = int(argv[3]) if len(argv) > 3 else 50
CAMS = {
    "field": ((46.0, 24.0, 3.2), (66.0, 70.0, 1.0), 32),
    "dockv": ((47.0, 26.0, 2.6), (57.0, 14.0, 0.6), 30),
    "dock": ((49.0, 30.0, 2.4), (57.0, 16.0, 0.4), 45),
    "overview": ((55.0, -95.0, 110.0), (55.0, 50.0, 0.0), 38),
    "top": ((55.0, 20.0, 14.0), (55.0, 24.0, 0.0), 35),
}
scn = bpy.context.scene
try:
    scn.eevee.taa_render_samples = samples
except Exception:
    pass
scn.render.resolution_percentage = pct
cam = scn.camera
if cam is None:
    cd = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cd); scn.collection.objects.link(cam); scn.camera = cam
pos, tgt, lens = CAMS[name]
cam.location = pos
cam.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = lens
cam.data.clip_end = 2000
scn.render.filepath = out
bpy.ops.render.render(write_still=True)
print("QUICK_DONE", out)
