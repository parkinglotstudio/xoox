"""Render the authored run clips for offline motion QA, not browser screenshots."""
import bpy, sys, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ART=ROOT/'docs/reports/assets/20261004_펫4종_Codex/motion_frames'
ART.mkdir(parents=True,exist_ok=True)
selected=sys.argv[sys.argv.index('--pet')+1] if '--pet' in sys.argv else None
for pet in ('nofilter','flux','lumos','gizmo'):
    if selected and pet!=selected:continue
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/f'data/tools/unit_lab/pets/{pet}/source/{pet}.blend'))
    arm=bpy.data.objects['PetRig']
    for track in arm.animation_data.nla_tracks:track.mute=True
    arm.animation_data.action=bpy.data.actions['run']
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=8;sc.cycles.use_denoising=True
    sc.render.resolution_x=480;sc.render.resolution_y=480;sc.render.resolution_percentage=100
    for f in range(8):
        sample=1+f*18/8;sc.frame_set(math.floor(sample),subframe=sample-math.floor(sample));bpy.context.view_layer.update()
        sc.render.filepath=str(ART/f'{pet}_{f:02d}.png');bpy.ops.render.render(write_still=True)
    print('MOTION_COMPLETE',pet,flush=True)
