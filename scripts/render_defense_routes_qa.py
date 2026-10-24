"""Deterministic path diagram from tested game routes; not a gameplay screenshot."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(r'C:\xoox');out=root/'docs/reports/assets/20261004_디펜스15분보정_Codex'
routes=json.loads((out/'entry_routes.json').read_text(encoding='utf8'))
traits=json.loads((root/'data/tools/unit_lab/defense_monsters.json').read_text(encoding='utf8'))['monsters']
mask=json.loads((root/'data/maps/forest150/releases/v3/navigation.json').read_text(encoding='utf8'))
layout=json.loads((root/'data/maps/forest150/releases/v3/construction.json').read_text(encoding='utf8'))
im=Image.new('RGB',(1260,1000),'#0b1420');d=ImageDraw.Draw(im)
def font(size):return ImageFont.truetype(r'C:\Windows\Fonts\malgun.ttf',size)
def txt(x,y,text,size=22,fill='#e1ecf2'):d.text((x,y),text,font=font(size),fill=fill)
def xy(p):return (65+(p['x']-35)*5.3,930-p['y']*2.75)
txt(45,25,'45종 개별 곡선 진입 · 2~3종 혼합 출현',32)
txt(45,77,'실제 숲 내비게이션으로 검증한 경로 도식 (게임 화면 캡처가 아님)',19,'#91a6b8')
for y in range(mask['height']):
 for x in range(mask['width']):
  px=(x+.5)*mask['cellMeters'];py=(y+.5)*mask['cellMeters']
  if px<35 or px>115 or py>295:continue
  a=xy({'x':x*mask['cellMeters'],'y':(y+1)*mask['cellMeters']});b=xy({'x':(x+1)*mask['cellMeters'],'y':y*mask['cellMeters']})
  d.rectangle([a,b],fill='#192c2c' if mask['walkable'][y*mask['width']+x] else '#263d31')
colors=['#639880','#b89567','#62849f']
for id,path in routes.items():d.line([xy(p) for p in path],fill=colors[traits[id]['sector']],width=1)
for id,color in [('q_green_blob','#75e5ae'),('q_pink_slime','#ffd17b'),('q_mushnub','#7ac6ff')]:d.line([xy(p) for p in routes[id]],fill=color,width=3)
for s in layout['slots']:
 if s['kind']!='tower':continue
 x,y=xy(s);d.rectangle([x-7,y-7,x+7,y+7],fill='#ffb86e');txt(x+13,y-12,s['id'],15)
x,y=xy(mask['spawn']);d.rectangle([x-10,y-10,x+10,y+10],fill='#83f0d9');txt(x+17,y-12,'남쪽 본진',16)
txt(540,150,'입구는 좌·중·우로 분산',26)
txt(540,200,'같은 방향 안에서도 45종의 굴곡이 각각 다릅니다.',20)
txt(540,250,'2종 → 3종 무리를 번갈아 생성',26)
txt(540,300,'빠른 적과 느린 적이 다른 경로로 동시에 접근합니다.',20)
txt(540,355,'종류별 설정 예시',25)
for i,(id,label) in enumerate([('q_pink_slime','슬라임'),('q_ninja_2','닌자 2'),('q_armabee_evolved','진화 비행형'),('q_goleling_evolved','진화 골렘'),('q_mushroom_king','버섯왕')]):
 t=traits[id];y=407+i*57;txt(540,y,label,22);txt(770,y,f"속도 ×{t['speedMultiplier']:.2f} · 방어 {t['armor']*100:.0f}%",20,'#bed5e4')
txt(540,735,'시설에는 독립 공격 자리·대기 자리',25)
txt(540,783,'목표 간격 3m · 이동 시 최소 2.6m 확보',21)
txt(540,831,'같은 점 집결·몸 통과·겹쳐 생성 방지',21)
txt(540,920,'Codex · DEF15-02 · 실제 경로 데이터 도식',18,'#8fa2b6')
im.save(out/'entry_paths.png')
