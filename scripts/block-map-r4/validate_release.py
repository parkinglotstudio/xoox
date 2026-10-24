import json,struct,math
from pathlib import Path
p=Path(__file__).parent/'release'
def read(path):
    b=path.read_bytes(); magic,version,total=struct.unpack_from('<4sII',b)
    assert magic==b'glTF' and version==2 and total==len(b)
    n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binary=b[28+n:]
    for a in j['accessors']:
        v=j['bufferViews'][a['bufferView']]; start=v.get('byteOffset',0);end=start+v['byteLength']
        assert end<=len(binary)
        assert all(math.isfinite(x[0]) for x in struct.iter_unpack('<f',binary[start:end]))
    return j,binary
def terrain(d):
    j,b=d;result={}
    for mesh in j['meshes']:
        if mesh['name'].startswith('terrain'):
            a=j['accessors'][mesh['primitives'][0]['attributes']['POSITION']]
            v=j['bufferViews'][a['bufferView']];start=v.get('byteOffset',0)
            result[mesh['name']]=b[start:start+v['byteLength']]
    return result
for sector in ('i21','i11'):
    after=read(p/f'{sector}_purified_r4.glb');before=read(p/f'{sector}_polluted_r4.glb')
    assert terrain(after) and terrain(after)==terrain(before), 'Terrain differs between moods'
    for d in (after,before):
        assert d[0]['scenes'][0]['nodes']
        assert 'EXT_mesh_gpu_instancing' in d[0]['extensionsUsed']
    print(sector,'valid GLB buffers; same terrain before/after; GPU instances present')
