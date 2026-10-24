import json,hashlib,zipfile
from pathlib import Path
root=Path(r'C:\xoox');out=root/'docs/asset_backups/20260927_characters_Codex';out.mkdir(parents=True,exist_ok=True)
paths=list((root/'data/tools/unit_lab/character').glob('*.glb'))
paths+=list((root/'data/tools/unit_lab/character/D_sprite').rglob('*'))
paths+=[root/p for p in ['unit-lab-tool.html','src/tools/unitLabTool/main.ts','wanderer-d-sprite-tool.html','src/tools/unitLabDSprite/main.ts','scripts/unit_lab_d_sprite/build_sprite.py','scripts/unit_lab_d_sprite/verify.mjs']]
paths=[p for p in paths if p.is_file()]
manifest=[]
zip_path=out/'unused_variants_and_previous_tool.zip'
if zip_path.exists():raise RuntimeError('Archive exists; preserve earlier snapshot')
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=3) as z:
 for p in paths:
  data=p.read_bytes();rel=p.relative_to(root).as_posix();z.writestr(rel,data);manifest.append({'path':rel,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
with zipfile.ZipFile(zip_path) as z:assert z.testzip() is None
(out/'manifest.json').write_text(json.dumps({'active':['Ruon original','Ruon 3.5','Ria original','Ria 3.5'],'policy':'Unused variants hidden from active tools; compatibility source files retained. Archive entries restore to original C:/xoox relative paths.','files':manifest},ensure_ascii=False,indent=2),encoding='utf8')
print('BACKUP_VERIFIED',len(manifest),zip_path.stat().st_size,flush=True)