"""Blender offline QA render of the exact 45 runtime greedy geometries (not a browser screenshot)."""
import bpy, json, math, struct
from pathlib import Path
from mathutils import Vector

ROOT = Path(r'C:\xoox\docs\reports\assets\20261004_디펜스15분보정_Codex')
data = json.loads((ROOT/'voxel_qa/manifest.json').read_text(encoding='utf8'))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
mat = bpy.data.materials.new('runtime_voxel_colors'); mat.use_nodes = True
nodes = mat.node_tree.nodes; color = nodes.new('ShaderNodeVertexColor'); color.layer_name = 'VoxelColor'
mat.node_tree.links.new(color.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])
nodes.get('Principled BSDF').inputs['Roughness'].default_value=.65
label_mat=bpy.data.materials.new('labels');label_mat.diffuse_color=(.8,.88,.96,1)
label_mat.use_nodes=True;label_mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.8,.88,.96,1)
label_mat.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.5,.6,.7,1)
label_mat.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.5
def text(name,body,pos,size):
    curve=bpy.data.curves.new(name,'FONT');curve.body=body;curve.align_x='CENTER';curve.size=size
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(math.pi/2,0,0);obj.data.materials.append(label_mat)
for i,entry in enumerate(data['models']):
    count=entry['vertices'];indices=entry['indices'];buf=(ROOT/'voxel_qa'/f"{entry['id']}.bin").read_bytes()
    p=struct.unpack_from('<'+'f'*(count*3),buf,0);c=struct.unpack_from('<'+'f'*(count*3),buf,count*12);idx=struct.unpack_from('<'+'I'*indices,buf,count*24)
    mesh=bpy.data.meshes.new(entry['id']);mesh.from_pydata([(p[j],-p[j+2],p[j+1]) for j in range(0,len(p),3)],[],[idx[j:j+3] for j in range(0,indices,3)]);mesh.update()
    attribute=mesh.color_attributes.new(name='VoxelColor',type='FLOAT_COLOR',domain='POINT')
    for j in range(count):attribute.data[j].color=(c[j*3],c[j*3+1],c[j*3+2],1)
    obj=bpy.data.objects.new(entry['id'],mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    x=(i%9-4)*3.15;z=(4-i//9)*3.55;obj.location=(x,0,z)
    text(entry['id']+'_label',entry['name'],(x,-.3,z-.42),.25)
for row,label in enumerate(['1 SMALL / TOWER ADVANTAGE','2 SPIKES + GHOSTS','3 ARMORED + WARRIORS','4 LARGE CREATURES','5 FINAL EVOLUTIONS']):
    text('stage'+str(row),label,(0,.2,(4-row)*3.55+2.65),.34)
text('title','EXISTING 45 MONSTERS / GAME VOXEL GEOMETRY',(0,0,19.15),.56)
text('footer','Offline Blender geometry QA | not a browser screenshot',(0,0,-1.15),.3)
world=bpy.data.worlds.new('dark navy');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.015,.025,.04,1);world.node_tree.nodes['Background'].inputs[1].default_value=.55
def light(name,typ,pos,energy,size=8):
    d=bpy.data.lights.new(name,typ);d.energy=energy
    if typ=='AREA':d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,9))-o.location).to_track_quat('-Z','Y').to_euler();return o
light('key','AREA',(-12,-13,25),4500,14);light('fill','AREA',(12,-10,12),2600,15);light('rim','AREA',(0,5,25),3000,12)
sun=light('sun','SUN',(-10,-20,25),1.3);sun.data.angle=.25
bpy.ops.object.camera_add(location=(0,-48,9.3));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,9.3))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=31.0
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1800;scene.render.resolution_y=1250;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'existing45_voxel_models.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'voxel_qa/preview.blend'));bpy.ops.render.render(write_still=True)
