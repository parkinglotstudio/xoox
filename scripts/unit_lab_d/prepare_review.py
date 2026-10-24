from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, shutil
ROOT=Path(r'C:\xoox')
ART=Path(r'C:\수스이미지 생성\2026-09-25-wanderer-D')
OUT=ROOT/'data/tools/unit_lab/character/D'
SRC=Path(r'C:\수스이미지 생성\2026-09-24-unit-lab/wanderer/ref_b2/sample.png')
im=Image.open(SRC).convert('RGB')
for name,box,cx in [('front',(38,0,441,720),248),('threequarter',(454,0,851,720),648),('back',(867,0,1250,720),1048)]:
    crop=im.crop(box);panel=Image.new('RGB',(480,720),(3,12,25));panel.paste(crop,(round(240-(cx-box[0])),0));panel.save(OUT/f'reference_{name}.png')
# Face review includes full head, same spatial reference scale as the D close-up.
face=im.crop((79,97,417,435)).resize((720,720),Image.Resampling.LANCZOS);face.save(OUT/'reference_face.png')
shutil.copy2(SRC,OUT/'reference_full.png')
print('D reference panels prepared')
