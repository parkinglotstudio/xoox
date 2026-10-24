from pathlib import Path
import re
root=Path(r'C:\xoox');path=root/'unit-lab-tool.html';s=path.read_text(encoding='utf8')
s=re.sub(r'<div class="bar">.*?</div>\s*<div class="workspace">','''<div class="bar"><h1>유닛 랩</h1><nav><button data-section="characters" class="on">캐릭터</button><button data-section="units">유닛·전투</button></nav><a href="/character-compare-tool.html">캐릭터 비교 ↗</a><a href="/block-cat-tool.html">고양이 펫 ↗</a><a href="/tools.html">툴 허브</a><span id="status">불러오는 중…</span></div><div class="workspace">''',s,count=1,flags=re.S)
left='''<div class="side left"><div id="characterList"><h2>함께할 방랑자</h2><p class="note">캐릭터와 체형을 선택하세요.</p>'''
for key,name,gender,folder in [('RUON','루온','남자','A'),('RIA','리아','여자','D')]:
 left+=f'''<section class="character-card"><div class="character-heading"><img src="/tools/unit_lab/character/{folder}/reference_face.png" alt=""><div><strong>{name}</strong><small>{gender} 캐릭터</small></div></div><div class="preset-grid"><button class="fx-btn" data-cvar="{key}">기존 비율</button><button class="fx-btn" data-cvar="{key}_35">3.5등신</button></div></section>'''
left+='''<a class="compare-link" href="/character-compare-tool.html">네 가지 체형 비교 ↗</a></div><div id="assetBrowser"><h2>유닛 보관함</h2><select id="assetGroup"><option value="all">전체</option><option value="enemy">적</option><option value="building">건물</option><option value="other">소품·타일</option></select><div id="unitList"></div></div></div>'''
assert '<div class="side" id="unitList"></div>' in s;s=s.replace('<div class="side" id="unitList"></div>',left)
start=s.index('<div id="charPanel"');end=s.index('<p class="note" id="nativeBlockNote"',start)
char='''<div id="charPanel" style="display:none"><h2 id="characterTitle">방랑자</h2><div class="transport"><button id="charPause">일시정지</button><button data-face="front">정면</button><button data-face="back">후면</button></div><label>재생 속도 <input type="range" id="speedRng" min="10" max="200" value="100"><span id="speedVal">100%</span></label>'''
groups=[('이동',[('idle','대기'),('walk','걷기'),('run','뛰기')]),('전투',[('shoot','쌍권총 연사'),('shoot2','바주카 단발'),('throw','던지기'),('walk_shoot','쏘며 걷기'),('walk_throw','던지며 걷기'),('walk_gun','무기 들고 걷기')]),('무기 꺼내기·넣기',[('draw','쌍권총 꺼내기'),('holster','쌍권총 넣기'),('draw_launcher','바주카 꺼내기'),('holster_launcher','바주카 거치')]),('표정·인사',[('blink','눈 깜박임'),('squint','눈 찡그리기'),('bow','인사'),('wave','손 흔들기'),('victory','승리 · 두 번 폴짝')])]
for i,(name,buttons) in enumerate(groups):
 char+=f'<details class="control-group" {"open" if i==0 else ""}><summary>{name}</summary><div class="fx-grid">'
 char+=''.join(f'<button class="fx-btn" data-anim="{key}">{label}</button>' for key,label in buttons)+'</div></details>'
char+='''<details class="control-group"><summary>보기·조명</summary><label><input id="hairMotionChk" type="checkbox" checked>끝머리 움직임</label><label><input id="referenceChk" type="checkbox">원본 스프라이트 보기</label><label><input id="statsChk" type="checkbox">성능 수치 보기</label><label><input id="detailLightChk" type="checkbox" checked>머리 디테일 조명</label><label>빛 세기 <input id="detailLightRng" type="range" min="0" max="200" value="100"><span id="detailLightVal">100%</span></label></details><div id="exprRow" style="display:none"><button data-expr="default">기본</button><button data-expr="smile">웃음</button><button data-expr="determined">결의</button><button data-expr="surprised">놀람</button></div><p class="note">휠로 확대 · 드래그로 회전</p></div>'''
s=s[:start]+char+s[end:]
start=s.index('<p class="note" id="nativeBlockNote"');end=s.index('<h3>블록 크기',start)
s=s[:start]+'<p id="nativeBlockNote" hidden></p>'+s[end:]
# Keep all existing controls/IDs; put infrequent controls behind summaries.
sections=[('<h3>블록 크기 (상황별)</h3>','<h3>연출</h3>','블록 표현','asset-setting'),('<h3>연출</h3>','<h3>보기</h3>','연출',''),('<h3>보기</h3>','<h3>무리 부하 테스트</h3>','원본·블록 비교','asset-setting')]
for a,b,title,cls in sections:
 start=s.index(a);end=s.index(b,start);body=s[start+len(a):end];s=s[:start]+f'<details class="control-group {cls}"><summary>{title}</summary>'+body+'</details>'+s[end:]
start=s.index('<h3>무리 부하 테스트</h3>');end=s.index('</div>\n    </div>',start)
body=s[start+len('<h3>무리 부하 테스트</h3>'):end];s=s[:start]+'<details class="control-group asset-setting"><summary>부하 테스트</summary>'+body+'</details>'+s[end:]
s=s.replace('value="side" checked','value="side"').replace('name="view" value="block"','name="view" value="block" checked')
s=s.replace('<body>','<body data-mode="character">')
css='''
.bar nav{display:flex;gap:4px;margin-right:10px}.bar nav button,.transport button{border:1px solid #3a525c;border-radius:7px;background:#223039;color:#c5d7d8;padding:8px 13px;cursor:pointer}.bar nav button.on{background:#255346;border-color:#6bad99;color:white}.bar .hint{display:none}.workspace{grid-template-columns:220px minmax(0,1fr) 270px}.side{padding:16px}.side h2{font-size:16px;margin:5px 0 12px}.character-card{padding:14px 10px;margin:20px 0;border:1px solid #35434b;border-radius:12px;background:#202c35}.character-heading{display:flex;align-items:center;gap:10px;margin-bottom:12px}.character-heading img{width:60px;height:62px;object-fit:contain}.character-heading strong{display:block;font-size:20px;color:#f3e3c0}.character-heading small{display:block;color:#a6b8bd;margin-top:5px}.character-card .fx-btn{font-size:12px;padding:8px 4px}.compare-link{display:block;color:#87d4ba;text-decoration:none;font-size:12px;margin-top:18px}.control-group{margin:12px 0;padding:12px 0;border-top:1px solid #33454d}.control-group summary,.asset-group summary{cursor:pointer;list-style-position:inside;color:#c9d8d4;font-weight:700;font-size:13px}.control-group[open] summary{margin-bottom:12px}.control-group .fx-grid{gap:6px}.control-group .fx-btn{font-size:12px;min-height:35px}.transport{display:flex;gap:5px;margin:12px 0}.transport button{padding:7px 9px;font-size:12px}.left select{width:100%;padding:8px;margin-bottom:12px;background:#24343e;color:#d5e5e5;border:1px solid #3a505b;border-radius:6px}.asset-group{margin:10px 0}.asset-group .unit-btn{font-size:12px}body[data-mode="character"] #assetBrowser,body[data-mode="units"] #characterList{display:none}body[data-mode="character"] .asset-setting{display:none}body[data-mode="character"] #stats{display:none}body[data-mode="character"][data-stats="on"] #stats{display:block}#nativeBlockNote{display:none!important}#unitInfo{font-size:12px;color:#bfd1cc}#status{max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#spriteCanvas{width:125px;height:125px}@media(max-width:1050px){.workspace{grid-template-columns:170px minmax(0,1fr) 235px}.side{padding:10px}.character-heading img{width:42px;height:52px}.character-heading strong{font-size:17px}.bar a{font-size:11px}#status{display:none}}
'''
s=s.replace('</style>',css+'</style>');path.write_text(s,encoding='utf8')
path=root/'src/tools/unitLabTool/main.ts';s=path.read_text(encoding='utf8')
s=s.replace('import * as THREE from "three";','import * as THREE from "three";\nimport { CHARACTER_CATALOG, CHARACTER_ALIASES, characterLabel } from "./CharacterCatalog";',1)
a=s.index('/** A / D 보존');b=s.index('let hairMotion=',a)
s=s[:a]+'''const CHAR_FILES:Record<string,string>=Object.fromEntries(CHARACTER_CATALOG.map(c=>[c.key,c.file]));
const CHAR_VAR_LABEL:Record<string,string>=Object.fromEntries(CHARACTER_CATALOG.map(c=>[c.key,`${c.name} · ${c.body}`]));
const params=new URLSearchParams(location.search),requestedCharacter=params.get('character')??params.get('variant')??'RIA';
let charVariant=CHARACTER_ALIASES[requestedCharacter]??requestedCharacter;
if(!(charVariant in CHAR_FILES))charVariant='RIA';
let charPaused=false,charLoadRequest=0;
function setLabMode(character:boolean){document.body.dataset.mode=character?'character':'units';document.querySelectorAll<HTMLElement>('[data-section]').forEach(b=>b.classList.toggle('on',b.dataset.section===(character?'characters':'units')));}
''' + s[b:]
s=s.replace('let viewMode: ViewMode = "side"','let viewMode: ViewMode = "block"')
s=s.replace('current = CHAR_ID;','current = CHAR_ID;setLabMode(true);').replace('current = COMBAT_ID;','current = COMBAT_ID;setLabMode(false);').replace('current = MAP_ID;','current = MAP_ID;setLabMode(false);').replace('current = id;','current = id;setLabMode(false);')
s=s.replace('  charLoading ??= CharacterView.load(`${BASE}/character/${CHAR_FILES[charVariant]}`);\n  charView = await charLoading;', '''  const request=++charLoadRequest,selected=charVariant;
  charLoading ??= CharacterView.load(`${BASE}/character/${CHAR_FILES[selected]}`);
  const loaded=await charLoading;
  if(request!==charLoadRequest || selected!==charVariant){if(selected!==charVariant)loaded.dispose();return;}
  charView=loaded;''')
s=s.replace('`방랑자 ${charVariant} · ${CHAR_ANIM_LABEL[charView.current]} · 원본 블록 형태 유지 · ${charView.clips.length}개 동작`','`${characterLabel(charVariant)} · ${CHAR_ANIM_LABEL[charView.current]}`')
s=s.replace('`${charVariant} 원본`','characterLabel(charVariant)')
s=s.replace('$("status").textContent = `방랑자 · 애니 ${charView.clips.map((c) => c.name).join(" · ")}`;','$("status").textContent = `${characterLabel(charVariant)} · ${charView.clips.length}개 동작`;')
s=s.replace('function syncCharVariantUi() {','function syncCharVariantUi() {\n  $("characterTitle").textContent=characterLabel(charVariant);')
s=s.replace('  charVariant = v;','''  if(!(v in CHAR_FILES))return;
  charVariant = v;
  const url=new URL(location.href);url.searchParams.delete('variant');url.searchParams.set('character',v);history.replaceState(null,'',url);''')
s=s.replace('  const request=++animRequest;const view=charView;','  charPaused=false;$("charPause").textContent="일시정지";\n  const request=++animRequest;const view=charView;')
s=s.replace('$("spriteBox").style.display=standalone?"none":"";','$("spriteBox").style.display=standalone||!$<HTMLInputElement>("referenceChk").checked?"none":"";')
s=s.replace('if(!standalone)await sprite.load','if(!standalone && $<HTMLInputElement>("referenceChk").checked)await sprite.load')
s=s.replace('$("spriteBox").style.display = "";','$("spriteBox").style.display = $<HTMLInputElement>("referenceChk").checked?"":"none";')
s=s.replace('charView?.tick(dt, time);','charView?.tick(charPaused?0:dt, time);').replace('sprite.tick(dt, charView?.speed ?? 1);','sprite.tick(charPaused?0:dt, charView?.speed ?? 1);')
s=s.replace('function buildUi() {','''function buildUi() {
  document.querySelectorAll<HTMLButtonElement>('[data-section]').forEach(b=>b.onclick=()=>{if(b.dataset.section==='characters')void showCharacter();else void showUnit(manifest.find(m=>m.group==='enemy_monster')?.id??manifest[0]!.id);});
  $('charPause').onclick=()=>{charPaused=!charPaused;$('charPause').textContent=charPaused?'재생':'일시정지';};
  $<HTMLInputElement>('referenceChk').onchange=()=>{void playAnim(charView?.current??'idle');};
  $<HTMLInputElement>('statsChk').onchange=e=>{document.body.dataset.stats=(e.target as HTMLInputElement).checked?'on':'off';};
''')
a=s.index('  search.oninput = () => {',s.index('function buildUi()'));b=s.index('  list.appendChild(search);',a)
s=s[:a]+'''  const filterAssets=()=>{
    const q=search.value.trim().toLowerCase(),group=$<HTMLSelectElement>('assetGroup').value;
    list.querySelectorAll<HTMLButtonElement>('.unit-btn').forEach(b=>{const g=b.dataset.group??'navigation';const matchGroup=g==='navigation'||group==='all'||(group==='other'?!g.startsWith('building')&&!g.startsWith('enemy'):g.startsWith(group));const matchText=!q||b.textContent!.toLowerCase().includes(q)||(b.dataset.id??'').includes(q);b.style.display=matchGroup&&matchText?'':'none';});
    list.querySelectorAll<HTMLDetailsElement>('.asset-group').forEach(d=>{const visible=[...d.querySelectorAll<HTMLElement>('.unit-btn')].some(b=>b.style.display!=='none');d.hidden=!visible;if(q||group!=='all')d.open=visible;});
  };
  search.oninput=filterAssets;$<HTMLSelectElement>('assetGroup').onchange=filterAssets;
''' +s[b:]
s=s.replace('b.textContent = "방랑자 · A / D";','b.textContent = "루온 · 리아";')
# Replace only the manifest group rendering; map and combat controls are preserved.
a=s.index('  for (const g of Object.keys(GROUP_LABEL))');b=s.index('  document.querySelectorAll<HTMLButtonElement>("[data-fx]")',a)
s=s[:a]+'''  for(const g of Object.keys(GROUP_LABEL)){
    const items=manifest.filter(x=>x.group===g);if(!items.length)continue;
    const section=document.createElement('details');section.className='asset-group';
    const summary=document.createElement('summary');summary.textContent=`${GROUP_LABEL[g]} (${items.length})`;section.appendChild(summary);
    for(const m of items){const b=document.createElement('button');b.className='unit-btn';b.dataset.id=m.id;b.dataset.group=g;b.textContent=m.name;b.onclick=()=>void showUnit(m.id);section.appendChild(b);}list.appendChild(section);
  }
''' +s[b:]
s=s.replace('$("status").textContent = `유닛 ${manifest.length}개 · 무료 CC0 (Kenney · Quaternius)`;','$("status").textContent = `${characterLabel(charVariant)} · 18개 동작`;')
path.write_text(s,encoding='utf8')
print('TOOL_CLEANUP_WRITTEN')