"""Offline Blender asset renders from the actual Three rig geometry and transforms.
Not browser screenshots or a performance check.
"""
import bpy,json,os,math
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
frames=json.load(open(os.path.join(HERE,'facility_pose_geometry.json'),encoding='utf-8'))
texfile='C:/xoox/data/tools/unit_lab/kenney_parts/Textures/colormap.png'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=320;scene.render.resolution_y=320;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world.color=(.075,.09,.11);scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast';scene.view_settings.exposure=0;scene.view_settings.gamma=1
image=bpy.data.images.load(texfile)
materials={}
def mat(mesh):
    key='texture' if mesh.get('uv') else tuple(mesh['color'])
    if key in materials:return materials[key]
    m=bpy.data.materials.new(str(key));m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.85
    if mesh.get('uv'):
        t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=image;t.interpolation='Closest';m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
    else:p.inputs['Base Color'].default_value=(*mesh['color'],1)
    materials[key]=m;return m
bpy.ops.object.camera_add(location=(6,-10,7));cam=bpy.context.object;cam.data.type='ORTHO';scene.camera=cam
for pos,energy,size in [((4,-6,9),1100,7),((-5,-3,5),450,7),((2,5,6),600,5)]:
    bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.data.energy=energy;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,2))-l.location).to_track_quat('-Z','Y').to_euler()
floor_mat=bpy.data.materials.new('floor');floor_mat.diffuse_color=(.12,.16,.19,1)
bpy.ops.mesh.primitive_plane_add(size=200);floor=bpy.context.object;floor.data.materials.append(floor_mat)
objects=[];os.makedirs(os.path.join(HERE,'pose_renders'),exist_ok=True)
for i,frame in enumerate(frames):
    for o in objects:bpy.data.objects.remove(o,do_unlink=True)
    objects=[]
    for j,mesh in enumerate(frame['meshes']):
        p=mesh['positions'];vertices=[(p[n],-p[n+2],p[n+1]) for n in range(0,len(p),3)];indices=mesh['indices'];faces=[indices[n:n+3] for n in range(0,len(indices),3)]
        geo=bpy.data.meshes.new('geometry');geo.from_pydata(vertices,[],faces);geo.update();obj=bpy.data.objects.new('rigmesh',geo);scene.collection.objects.link(obj);geo.materials.append(mat(mesh));objects.append(obj)
        if mesh.get('uv'):
            uv=geo.uv_layers.new(name='UVMap');values=mesh['uv']
            for loop in geo.loops:uv.data[loop.index].uv=(values[loop.vertex_index*2],1-values[loop.vertex_index*2+1])
    tower=frame['kind'].startswith('tower_');target=Vector((0,0,1.9 if tower else .5));cam.location=(6,-10,7 if tower else 8);cam.data.ortho_scale=7.6 if tower else 6.5;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=os.path.join(HERE,'pose_renders',f'{i:02}.png');bpy.ops.render.render(write_still=True);print(f'FRAME {i+1}/{len(frames)}',flush=True)
