"""Copy only missing character handoff files. Never replace an existing different file."""
from pathlib import Path
import json,hashlib,shutil,re,datetime
ROOT=Path(r'C:\xoox');PACK=Path(r'C:\Users\dmaxd\CodexPack_20260927')
OUT=ROOT/'docs/reports/assets/20260927_CodexPack_누락보완_Codex'
audit=json.loads((ROOT/'docs/reports/assets/20260927_CodexPack_캐릭터복사검증_Codex/file_audit.json').read_text(encoding='utf8'))
plan={}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def add(rel,reason):
 src=ROOT/rel;dst=PACK/rel
 assert src.is_file(),str(src)
 assert src.resolve().is_relative_to(ROOT.resolve()),str(src)
 assert dst.resolve().is_relative_to(PACK.resolve()),str(dst)
 if rel not in plan:plan[rel]={'source':rel,'destination':rel,'reason':reason,'bytes':src.stat().st_size,'sha256':digest(src)}
for row in audit['files']:
 if row['status'] in ('missing','identical_elsewhere'):add(row['source'],row['category'])
evidence=set()
for row in audit['files']:
 if row['status']=='missing' and row['category']=='reports':
  t=(ROOT/row['source']).read_text(encoding='utf8')
  for m in re.findall(r'(?:docs/reports/)?assets/([^\s\)\]>\x60"\r\n]+)',t):
   q=ROOT/'docs/reports/assets'/m.split('/')[0]
   if q.is_dir() and q.resolve().is_relative_to((ROOT/'docs/reports/assets').resolve()):evidence.add(q)
for q in sorted(evidence):
 for src in sorted(q.rglob('*')):
  if src.is_file():add(src.relative_to(ROOT).as_posix(),'referenced_report_evidence')
conflicts=[]
for rel,item in plan.items():
 dst=PACK/rel
 if dst.exists() and digest(dst)!=item['sha256']:conflicts.append(rel)
assert not conflicts,'Existing different files: '+json.dumps(conflicts,ensure_ascii=False)
OUT.mkdir(parents=True,exist_ok=True)
receipt={'at':datetime.datetime.now().isoformat(timespec='seconds'),'source':str(ROOT),'destination':str(PACK),'policy':'copy missing only, preserve existing files, source retained','files':[]}
for rel,item in plan.items():
 src=ROOT/rel;dst=PACK/rel
 if not dst.exists():
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);state='copied'
 else:state='already_identical'
 assert digest(dst)==item['sha256'],rel
 receipt['files'].append({**item,'state':state})
receipt['copied_files']=sum(x['state']=='copied' for x in receipt['files'])
receipt['copied_bytes']=sum(x['bytes'] for x in receipt['files'] if x['state']=='copied')
receipt['hash_mismatches']=0
(OUT/'copy_receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'},ensure_ascii=False))
