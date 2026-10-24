"""Build the local character inventory; no Grok directives are read."""
from pathlib import Path
import json,hashlib,shutil,re,datetime
ROOT=Path(r'C:\xoox');DOC=ROOT/'docs/characters';LEG=Path(r'C:\수스이미지 생성\2026-09-24-unit-lab')
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
snapshots=[]
for folder,pattern,dest in [(LEG,'*.py','unit_lab'),(LEG/'wanderer','*.py','wanderer')]:
 for src in sorted(folder.glob(pattern)):
  target=DOC/'legacy_sources'/dest/src.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,target)
  snapshots.append({'original':str(src),'copy':target.relative_to(ROOT).as_posix(),'sha256':digest(src)})
catalog=json.loads((ROOT/'data/tools/unit_lab/units_free.json').read_text(encoding='utf8'))
pat=re.compile(r'유닛|방랑자|캐릭터|고양이|루온|비율|설치건물|클로즈업|포탑|D안|A얼굴|D얼굴|총구|쌍권총|시안A|시안D|블록부하|건물공격|피격연출')
reports=[];related=[]
for p in sorted((ROOT/'docs/reports').glob('*.md')):
 if not pat.search(p.name):continue
 text=p.read_text(encoding='utf-8-sig');am=re.search(r'^작성(?:자)?\s*[:：]\s*(.+)',text,re.M)
 author=am.group(1).strip().replace('**','') if am else '본문 참조'
 one=re.search(r'^## 한 줄\s*\n([\s\S]*?)(?=\n## |\Z)',text,re.M)
 summary=re.sub(r'\s+',' ',one.group(1)).strip()[:360] if one else ''
 item={'path':p.relative_to(ROOT).as_posix(),'author':author,'summary':summary};reports.append(item)
 scope='연계 기록' if 'Cursor' in author or 'Grok' in author else '제작 기록'
 related.append(f"- [{p.name}](../reports/{p.name}) — {scope} / {author}\n  - {summary or '원문에 작업 내용과 근거가 있다.'}")
history=DOC/'02_전체작업이력.md';text=history.read_text(encoding='utf8').split('<!-- GENERATED_REPORT_INDEX -->')[0]
history.write_text(text+'<!-- GENERATED_REPORT_INDEX -->\n\n'+'\n'.join(related)+'\n',encoding='utf8')
paths=set()
dirs=['scripts/unit_lab_a','scripts/unit_lab_d','scripts/unit_lab_d_sprite','scripts/unit_lab_cat','scripts/unit_lab_characters','src/tools/unitLabTool','src/tools/unitLabA','src/tools/unitLabD','src/tools/unitLabDSprite','src/tools/unitLabPet','src/tools/characterCompare','data/tools/unit_lab/character','data/tools/unit_lab/pets','data/tools/unit_lab/units','data/tools/unit_lab/units_free','data/tools/unit_lab/kenney_parts','data/tools/unit_lab/monsters_anim','docs/characters/legacy_sources','docs/asset_backups/20260927_characters_Codex','docs/asset_backups/20260927_RuonCrown_Codex','data/ui/actor/wanderer','data/ui/wanderer/test_clips/shoot']
for d in dirs:
 for p in (ROOT/d).rglob('*'):
  if p.is_file() and '__pycache__' not in p.parts and p.suffix not in ('.log','.pid','.blend1'):paths.add(p)
for name in ['unit-lab-tool.html','character-compare-tool.html','wanderer-a-tool.html','wanderer-d-tool.html','wanderer-d-sprite-tool.html','block-cat-tool.html']:paths.add(ROOT/name)
for p in (ROOT/'data/tools/unit_lab').glob('*'):
 if p.is_file():paths.add(p)
for r in reports:paths.add(ROOT/r['path'])
for p in (ROOT/'docs/reports/assets/20260927_루온머리_제작문서_Codex').glob('*'):
 if p.is_file():paths.add(p)
inventory=[{'path':p.relative_to(ROOT).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(paths)]
doc={'generated_at':datetime.datetime.now().isoformat(timespec='seconds'),'scope':'Characters, unit resource experiments and preview tools in this conversation; historical instructions are not executed; Grok monitoring stopped.','files':inventory,'legacy_source_copies':snapshots,'reports':reports,'unit_count':len(catalog['units']),'units':[{k:u.get(k) for k in ('id','name','group','span','dense','dense_lo','dense_q')} for u in catalog['units']]}
(DOC/'inventory.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2),encoding='utf8')
md=['# 파일 목록','작성: Codex · 2026-09-27','','자동 목록은 scripts/unit_lab_characters/document_inventory.py로 생성했다. SHA256·용량·원본 사본 대응은 [inventory.json](inventory.json)에 있다. 생성 시점의 스냅샷이며 모델을 다시 만들면 목록도 갱신한다.','','## 현재 모델 수치','','| 모델 | 삼각형 | 본 | 클립 | GLB bytes |','|---|---:|---:|---:|---:|']
for label,folder,file in [('루온 기존형','A','wanderer_A.glb'),('루온 3.5','Ruon_35','ruon_35.glb'),('리아 기존형','D','wanderer_D.glb'),('리아 3.5','D_35','wanderer_D_35.glb')]:
 m=json.loads((ROOT/f'data/tools/unit_lab/character/{folder}/metrics.json').read_text(encoding='utf8'))
 md.append(f"| {label} | {m['triangles']:,} | {m['rig']['bones']} | {len(m['animations'])} | {(ROOT/f'data/tools/unit_lab/character/{folder}/{file}').stat().st_size:,} |")
md+=['','## 범위',f"- 파일 {len(inventory)}개: 소스·활성/보관 모델·참고 스프라이트·라이선스·백업·관련 보고서.",f"- 초기 외부 Python 소스 사본 {len(snapshots)}개. 실행 환경은 과거 절대 경로를 포함할 수 있다.",f"- 관련 보고서 {len(reports)}개. [작업 이력의 전체 색인](02_전체작업이력.md#관련-보고서-전체-색인).",f"- 무료 유닛 목록 {len(catalog['units'])}개. 개별 id/그룹/데이터 경로는 inventory.json의 units.",'- 과거 외부 원본 팩: C:/수스이미지 생성/2026-09-24-unit-lab/free/ (Kenney TD/Survival/Factory, Quaternius monsters, KayKit 참고 모델). 대용량 팩을 재다운로드하거나 중복 복사하지 않았다.','','## 제작·검수 코드']
for i in inventory:
 if i['path'].startswith(('scripts/','src/','docs/characters/legacy_sources/')) or i['path'].endswith('.html'):
  md.append(f"- [{i['path']}](../../{i['path']})")
md+=['','## 라이선스·출처 파일']
for i in inventory:
 if any(t in Path(i['path']).name.lower() for t in ('license','source')) and i['path'].startswith('data/'):md.append(f"- [{i['path']}](../../{i['path']})")
md+=['','## 초기 외부 소스 사본']
for i in snapshots:md.append(f"- {i['original']} → [{i['copy']}](../../{i['copy']})")
md+=['','## 모델·사진·백업 전체 위치','전체 파일 경로와 무결성 정보는 inventory.json의 files를 본다. 실제 파일을 순회해 작성했다.']
(DOC/'04_파일목록.md').write_text('\n'.join(md)+'\n',encoding='utf8')
print(json.dumps({'files':len(inventory),'reports':len(reports),'legacy_sources':len(snapshots),'units':len(catalog['units'])}))
