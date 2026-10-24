import glob, json, os, sys
from PIL import Image, ImageDraw

W = "C:/xoox/data/ui/actor/wanderer"
O = sys.argv[1]
PAIRS = (("idle", "ingame_idle"), ("walk", "walk_l"), ("run", "move"), ("shoot", "aim_fire"), ("shoot2", "C:/xoox/data/ui/wanderer/test_clips/shoot"), ("throw", "throw"),
         ("walk_shoot", "aim_walk_f"), ("walk_throw", "throw"), ("walk_gun", "walk_gun"))


def frames(d):
    base = d if "/" in d else f"{W}/{d}"
    nm = os.path.basename(base)
    m = json.load(open(f"{base}/{nm}.json", encoding="utf-8"))
    sh = Image.open(f"{base}/{m['sheet']}").convert("RGBA")
    c = m.get("cell") or m["cell_w"]
    cols = m["cols"]
    return [sh.crop(((i % cols) * c, (i // cols) * c, (i % cols + 1) * c, (i // cols + 1) * c)).crop((96, 40, 416, 512)).resize((200, 295))
            for i in range(m["frame_count"])]


def pick(seq, n):
    if len(seq) <= n:
        return seq
    return [seq[round(i * (len(seq) - 1) / (n - 1))] for i in range(n)]


for anim, d in PAIRS:
    rs_paths = sorted(glob.glob(f"{O}/_r_{anim}_*.png"))
    if not rs_paths:
        continue
    sp = pick(frames(d), 7)
    rs = pick([Image.open(p).convert("RGBA").resize((200, 234)) for p in rs_paths], 7)
    n = max(len(sp), len(rs))
    out = Image.new("RGBA", (200 * n, 295 + 234 + 24), (20, 28, 40, 255))
    for k, f in enumerate(sp):
        out.alpha_composite(f, (k * 200, 0))
    for k, f in enumerate(rs):
        out.alpha_composite(f, (k * 200, 295 + 24))
    ImageDraw.Draw(out).text((6, 297), f"{anim} (sprite {d}): top = sprite / bottom = Blender 3D", fill=(255, 210, 120))
    out.save(f"{O}/compare_{anim}.png")
print("ok")
