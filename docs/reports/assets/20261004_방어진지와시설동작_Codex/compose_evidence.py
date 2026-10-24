import json,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/malgun.ttf',n)
names={'tower_gun':'연사 포탑','tower_ballista':'관통 포탑','tower_throw':'폭탄 투척','tower_cannon':'범위 대포','tower_catapult':'곡사 투석기','slow':'감속 장판','bind':'속박 트랩','spikes':'가시 트랩','mine':'폭발 지뢰'}
frames=json.loads((HERE/'facility_pose_geometry.json').read_text(encoding='utf-8'))
for start,end,file,title in [(0,15,'turret_animation_renders.png','포탑 부품 동작 · Blender 오프라인 렌더'),(15,27,'trap_animation_renders.png','트랩 발동 동작 · Blender 오프라인 렌더')]:
    rows=(end-start)//3;sheet=Image.new('RGB',(960,rows*345+105),'#111c25');draw=ImageDraw.Draw(sheet);draw.text((20,10),title,font=font(23),fill='#eedcaa');draw.text((20,50),'실제 리그 형상·자세 데이터 / 게임 화면과 FPS는 미검증',font=font(17),fill='#a6c1c7')
    for j,i in enumerate(range(start,end)):
        x=(j%3)*320;y=(j//3)*345+105;sheet.paste(Image.open(HERE/'pose_renders'/f'{i:02}.png').convert('RGB'),(x,y));state=['대기','발사/발동','복귀'][j%3];draw.text((x+8,y+322),names[frames[i]['kind']]+' · '+state,font=font(16),fill='#f0deb4')
    sheet.save(HERE/file)
layout=json.loads(Path('C:/xoox/data/tools/unit_lab/defense_outpost.json').read_text(encoding='utf-8'));balance=json.loads(Path('C:/xoox/data/tools/unit_lab/defense_balance.json').read_text(encoding='utf-8'));traps=json.loads(Path('C:/xoox/data/tools/unit_lab/defense_traps.json').read_text(encoding='utf-8'));paths=json.loads((HERE/'entry_routes.json').read_text(encoding='utf-8'))
sheet=Image.new('RGB',(1000,1210),'#14231c');draw=ImageDraw.Draw(sheet);draw.text((25,15),'방어 진지 배치 · 실제 좌표와 경로 데이터',font=font(25),fill='#eedcaa');draw.text((25,56),'전방 트랩 → 중앙 통로와 방책 → 직격 포탑 → 후방 범위 화력',font=font(18),fill='#b4cbb4')
def xy(x,y):return(80+(x-40)*13,135+(290-y)*8)
for id,path in paths.items():
    pts=[xy(p['x'],p['y']) for p in path if 170<=p['y']<=290 and 40<=p['x']<=110]
    if len(pts)>1:draw.line(pts,fill='#385440',width=1)
for y in range(180,291,10):
    a,b=xy(40,y),xy(108,y);draw.line((a,b),fill='#2a4332');draw.text((22,a[1]-10),str(y),font=font(14),fill='#83a78c')
for t in layout['traps']:
    cx,cy=xy(t['x'],t['y']);r=traps[t['kind']]['radius'];draw.ellipse((cx-r*13,cy-r*8,cx+r*13,cy+r*8),outline='#6fae9b',width=2);draw.rectangle((cx-14,cy-10,cx+14,cy+10),fill='#66c8ac' if t['kind']!='mine' else '#eaa152');draw.text((cx-40,cy-30),names[t['kind']],font=font(16),fill='#e5e8d3')
for f in layout['facilities']:
    cx,cy=xy(f['x'],f['y']);w,d=f['width']*13,f['depth']*8;kind=f['kind'];color='#cca874' if 'fence' in kind else '#c79445' if balance['weapons'].get(kind,{}).get('attack')=='area' else '#71b8ce' if kind.startswith('tower_') else '#82997c';draw.rectangle((cx-w/2,cy-d/2,cx+w/2,cy+d/2),fill=color);draw.text((cx-52,cy+max(d/2,10)+4),f['name'],font=font(16),fill='#eae2ba')
draw.text((25,1115),'사각형: 실제 시설 충돌 범위 / 원: 트랩 작동 반경\n선: 45종 개별 진입 경로 / 본진은 아래쪽 남부에 위치',font=font(18),fill='#b6cbb4',spacing=10)
sheet.save(HERE/'outpost_layout.png')
print('Evidence sheets saved',flush=True)
