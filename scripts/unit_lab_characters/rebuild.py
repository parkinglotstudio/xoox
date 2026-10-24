"""Rebuild a named base character under C:/xoox, using the existing generators.
Blender -b -P scripts/unit_lab_characters/rebuild.py -- --character RUON
"""
import argparse,sys,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--character',choices=['RUON','RIA'],required=True);p.add_argument('--render',action='store_true')
args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
letter='a' if args.character=='RUON' else 'd'
script=ROOT/f'scripts/unit_lab_{letter}/build_{letter}.py'
out=ROOT/f'data/tools/unit_lab/character/{letter.upper()}';art=out/'source';art.mkdir(parents=True,exist_ok=True)
src=script.read_text(encoding='utf8')
src,n=re.subn(r'^ART = .*$',f'ART = Path({str(art.as_posix())!r})',src,count=1,flags=re.M);assert n==1
sys.path.insert(0,str(script.parent))
exec(compile(src,str(script),'exec'),{'__name__':'__main__','__file__':str(script)})
if letter=='d':
    refine=script.with_name('refine_d08.py');text=refine.read_text(encoding='utf8')
    text,n=re.subn(r"^art=Path\(.*?\);out=Path\(.*?\)$",f"art=Path({str(art.as_posix())!r});out=Path({str(out.as_posix())!r})",text,count=1,flags=re.M);assert n==1
    exec(compile(text,str(refine),'exec'),{'__name__':'__main__','__file__':str(refine)})
