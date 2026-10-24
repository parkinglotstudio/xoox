from pathlib import Path
import os,json,hashlib,struct,collections,datetime,re
ROOT=Path(r'C:\xoox');PACK=Path(r'C:\Users\dmaxd\CodexPack_20260927')
OUT=ROOT/'docs/reports/assets/20260927_CodexPack_캐릭터복사검증_Codex';OUT.mkdir(parents=True,exist_ok=True)
inv=json.loads((ROOT/'docs/characters/inventory.json').read_text(encoding='utf8'))
entries=list(inv['files'])
for p in (ROOT/'docs/characters').glob('*'):
 if p.is_file():entries.append({'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
seen=set();entries=[x for x in entries if not (x['path'] in seen or seen.add(x['path']))]
allpack=[]
for base,dirs,files in os.walk(PACK,followlinks=False):
 dirs[:]=[d for d in dirs if d not in ('node_modules','.git','directives') and not (Path(base)/d).is_junction()]
 allpack.extend(Path(base)/f for f in files)
sizes=collections.defaultdict(list)
for p in allpack:sizes[p.stat().st_size].append(p)
hashes={}
def sha(p):
 k=str(p)
 if k not in hashes:hashes[k]=hashlib.sha256(p.read_bytes()).hexdigest()
 return hashes[k]
def category(rel):
 if '/character/' in rel:return 'character_assets'
 if '/pets/' in rel:return 'pet_assets'
 if rel.startswith('scripts/'):return 'current_build_scripts'
 if rel.startswith('docs/characters/legacy_sources'):return 'legacy_source_copies'
 if rel.startswith('docs/characters/'):return 'character_docs'
 if rel.startswith('docs/asset_backups/'):return 'backups'
 if rel.startswith('docs/reports/assets/'):return 'evidence'
 if rel.startswith('docs/reports/'):return 'reports'
 if rel.startswith('src/'):return 'viewer_source'
 if rel.endswith('.html'):return 'tool_html'
 if rel.startswith('data/ui/'):return 'sprite_references'
 return 'unit_assets'
audit=[]
for e in entries:
 rel=e['path'];candidates=[PACK/rel]
 if rel.startswith('data/tools/unit_lab/'):candidates.insert(0,PACK/'unit_lab'/rel[len('data/tools/unit_lab/'):])
 if rel.endswith('.html') and '/' not in rel:candidates.insert(0,PACK/'tools'/rel)
 existing=[p for p in candidates if p.is_file()]
 exact=next((p for p in existing if sha(p)==e['sha256']),None)
 renamed=None
 if exact is None:
  renamed=next((p for p in sizes[e['bytes']] if sha(p)==e['sha256']),None)
 match=exact or renamed
 status='identical' if exact else 'identical_elsewhere' if renamed else 'different' if existing else 'missing'
 row={'source':rel,'category':category(rel),'status':status,'pack':match.relative_to(PACK).as_posix() if match else None}
 if existing and not exact:row['existing_candidates']=[{'path':p.relative_to(PACK).as_posix(),'sha256':sha(p),'bytes':p.stat().st_size} for p in existing]
 if match:row['sha256']=sha(match)
 audit.append(row)
summary={}
for c in sorted(set(x['category'] for x in audit)):
 rows=[x for x in audit if x['category']==c]
 summary[c]={'total':len(rows),**dict(collections.Counter(x['status'] for x in rows))}
def glb(p):
 b=p.read_bytes();magic,version,length=struct.unpack_from('<III',b,0);assert magic==0x46546c67 and length==len(b)
 size,kind=struct.unpack_from('<II',b,12);g=json.loads(b[20:20+size])
 bones=set(j for skin in g.get('skins',[]) for j in skin['joints'])
 return {'bytes':len(b),'sha256':sha(p),'clips':[a.get('name') for a in g.get('animations',[])],'bones':len(bones),'hair_bones':sum(g['nodes'][i].get('name','').startswith('tip_hair_') for i in bones),'crown_revision':list(set(n.get('extras',{}).get('crownRevision') for n in g.get('nodes',[]) if n.get('extras',{}).get('crownRevision')))}
models={}
for name,path in [('RUON','character/A/wanderer_A.glb'),('RUON_35','character/Ruon_35/ruon_35.glb'),('RIA','character/D/wanderer_D.glb'),('RIA_35','character/D_35/wanderer_D_35.glb'),('BCAT','pets/block_cat/block_cat.glb')]:
 p=PACK/'unit_lab'/path;source=ROOT/'data/tools/unit_lab'/path
 models[name]=glb(p) if p.exists() else {'missing':True}
 models[name]['source_equal']=p.is_file() and sha(p)==sha(source)
links=[]
for p in (PACK/'docs/characters').glob('*.md'):
 for href in re.findall(r'\[[^\]]*\]\(([^)]+)\)',p.read_text(encoding='utf8')):
  h=href.strip('<>').split('#')[0]
  if not h or re.match(r'^(https?:|mailto:)',h):continue
  target=Path(h) if re.match(r'^[A-Za-z]:',h) else p.parent/h
  if not target.exists():links.append({'document':p.relative_to(PACK).as_posix(),'target':href})
result={'at':datetime.datetime.now().isoformat(timespec='seconds'),'source':str(ROOT),'pack':str(PACK),'baseline':str(ROOT/'docs/characters/inventory.json'),'expected_files':len(entries),'summary':summary,'models':models,'missing_document_links':links,'files':audit}
(OUT/'file_audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'expected_files':len(entries),'summary':summary,'models':models,'missing_document_links_count':len(links),'missing_examples':[x for x in audit if x['status']=='missing'][:24],'different':[x for x in audit if x['status']=='different']},ensure_ascii=False))
