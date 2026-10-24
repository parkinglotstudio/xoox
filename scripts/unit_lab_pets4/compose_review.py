"""Reference/model plates and motion montage. Run after Blender renders."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
ROOT=Path(__file__).resolve().parents[2];ART=ROOT/'docs/reports/assets/20261004_펫4종_Codex'
ids=('nofilter','flux','lumos','gizmo')
font_path='C:/Windows/Fonts/malgun.ttf'
font=ImageFont.truetype(font_path,25);small=ImageFont.truetype(font_path,17)
def fit(image,size):
    image=image.convert('RGB');image.thumbnail(size,Image.Resampling.LANCZOS);canvas=Image.new('RGB',size,'#10202b');canvas.paste(image,((size[0]-image.width)//2,(size[1]-image.height)//2));return canvas
def draw_text(draw,pos,text,body=False):draw.text(pos,text,font=small if body else font,fill='#dce9ef')
plate=Image.new('RGB',(1600,1000),'#0c1721');d=ImageDraw.Draw(plate)
draw_text(d,(25,20),'수스 · 복셀 펫 4종 / Blender 모델 렌더')
for i,pet in enumerate(ids):
    x=(i%2)*800;y=70+(i//2)*450
    m=json.loads((ROOT/f'data/tools/unit_lab/pets/{pet}/manifest.json').read_text('utf-8'))
    draw_text(d,(x+20,y),m['name']);draw_text(d,(x+20,y+34),f"{m['triangles']:,} tris · {m['bones']} bones · 8 clips · run 0.6s",True)
    plate.paste(fit(Image.open(ART/f'{pet}_threequarter.png'),(780,360)),(x+10,y+72))
plate.save(ART/'pets4_overview.png')
comparison=Image.new('RGB',(1600,1780),'#0c1721');d=ImageDraw.Draw(comparison)
draw_text(d,(25,16),'사용자 원본 → 복셀 모델 / Blender 렌더 · 브라우저 화면 아님')
for i,pet in enumerate(ids):
    y=64+i*425;m=json.loads((ROOT/f'data/tools/unit_lab/pets/{pet}/manifest.json').read_text('utf-8'))
    draw_text(d,(22,y),m['name']);draw_text(d,(20,y+32),'사용자 제공 원본',True);draw_text(d,(424,y+32),'사선',True);draw_text(d,(824,y+32),'정면',True);draw_text(d,(1224,y+32),'후면',True)
    paths=[ROOT/f'data/tools/unit_lab/pets/{pet}/reference.png',*[ART/f'{pet}_{view}.png' for view in ('threequarter','front','back')]]
    for j,p in enumerate(paths):comparison.paste(fit(Image.open(p),(380,348)),(j*400+10,y+65))
comparison.save(ART/'reference_comparison.png')
poses=Image.new('RGB',(1600,1370),'#0c1721');d=ImageDraw.Draw(poses)
draw_text(d,(25,16),'서기 → 앉는 중간 → 앉기 → 달리기 / Blender 동작 검토')
for i,pet in enumerate(ids):
    y=60+i*323;draw_text(d,(20,y),pet.upper())
    for j,(view,label) in enumerate([('threequarter','서기'),('transition','앉기 중간'),('sit','앉기'),('run','달리기')]):
        draw_text(d,(400*j+25,y+35),label,True);poses.paste(fit(Image.open(ART/f'{pet}_{view}.png'),(380,267)),(400*j+10,y+55))
poses.save(ART/'pose_comparison.png')
motion=ART/'motion_frames'
if all((motion/f'{p}_07.png').exists() for p in ids):
    frames=[]
    for index in range(8):
        frame=Image.new('RGB',(960,1012),'#0c1721');d=ImageDraw.Draw(frame)
        draw_text(d,(20,8),'달리기 루프 / Blender 렌더')
        for i,pet in enumerate(ids):
            x=(i%2)*480;y=52+(i//2)*480
            frame.paste(Image.open(motion/f'{pet}_{index:02d}.png').convert('RGB'),(x,y));draw_text(d,(x+14,y+12),pet.upper())
        frames.append(frame)
    frames[0].save(ART/'run_loop.gif',save_all=True,append_images=frames[1:],duration=[70,80]*4,loop=0,optimize=False)
print('REVIEW_PLATES_COMPLETE')
