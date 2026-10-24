from pathlib import Path
import json,struct,hashlib
p=Path(__file__).parent/'release';old=Path('C:/xoox/data/maps/forest150/releases/v6')
def read(path):
    raw=path.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    size=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+size]);blob=raw[28+size:];return j,blob
def accessor(j,b,index):
    a=j['accessors'][index];v=j['bufferViews'][a['bufferView']];return b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
checks={}
for state in ('purified','polluted'):
    j,b=read(p/f'forest_{state}.glb');o,ob=read(old/f'forest_{state}.glb')
    assert j['nodes']==o['nodes'] and len(j['meshes'])==len(o['meshes'])
    changed=False
    for m,om in zip(j['meshes'],o['meshes']):
        assert m==om
        for attr in ('POSITION','NORMAL'):
            index=m['primitives'][0]['attributes'][attr];assert accessor(j,b,index)==accessor(o,ob,index)
        index=m['primitives'][0]['attributes']['COLOR_0'];changed|=accessor(j,b,index)!=accessor(o,ob,index)
    for node in j['nodes']:
        for index in node.get('extensions',{}).get('EXT_mesh_gpu_instancing',{}).get('attributes',{}).values():assert accessor(j,b,index)==accessor(o,ob,index)
    assert changed;checks[state]='geometry, normals, instances and placements unchanged; colours changed'
catalog=json.loads((p/'catalog.json').read_text(encoding='utf-8'));assert len(catalog['items'])==43
for item in catalog['items']:
    assert set(item['variants'])=={'purified','polluted'}
    for state,url in item['variants'].items():
        j,b=read(p/'catalog'/url.rsplit('/',1)[-1]);assert len(j['nodes'])==1
        a=j['accessors'][j['meshes'][0]['primitives'][0]['attributes']['POSITION']];lo,hi=a['min'],a['max'];assert abs(lo[1])<.001
        assert abs(lo[0]+hi[0])<.001 and abs(lo[2]+hi[2])<.001
        if item['id'] in ('tower','unit'):
            limit=6 if item['id']=='tower' else 8
            assert hi[0]-lo[0]<=limit and hi[2]-lo[2]<=limit
for kind in ('tower','unit'):
    assert (p/'catalog'/f'{kind}_purified.glb').read_bytes()!=(p/'catalog'/f'{kind}_polluted.glb').read_bytes()
result={'passed':True,'mapChecks':checks,'catalogItems':43,'variantFiles':86,'allCatalogPivotsBottomCenter':True,'constructionFootprintsWithinExistingCollision':True}
(p/'verification.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
