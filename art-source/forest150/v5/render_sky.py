import bpy,math
from pathlib import Path
from mathutils import Vector
p=Path(__file__).parent/'release'
for state in ['purified','polluted']:
    bpy.ops.wm.open_mainfile(filepath=str(p/f'forest_{state}.blend'))
    scene=bpy.context.scene;cam=scene.camera;cam.data.type='PERSP';cam.data.lens=24
    cam.location=(75,25,3.705);cam.rotation_euler=(Vector((75,36.5,3.6075))-cam.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=190,depth=100,end_fill_type='NOTHING',location=(75,25,15))
    ob=bpy.context.object;ob.name='Preview_Backdrop'
    uvdata=ob.data.uv_layers.active.data
    for poly in ob.data.polygons:
        us=[(math.atan2(ob.data.vertices[ob.data.loops[i].vertex_index].co.y,ob.data.vertices[ob.data.loops[i].vertex_index].co.x)/(2*math.pi))%1 for i in poly.loop_indices]
        for i,u in zip(poly.loop_indices,us):
            if max(us)-min(us)>.5 and u<.5:u+=1
            uvdata[i].uv=(u,(ob.data.vertices[ob.data.loops[i].vertex_index].co.z+50)/100)
    mat=bpy.data.materials.new('backdrop');mat.use_nodes=True;nodes=mat.node_tree.nodes;nodes.clear()
    out=nodes.new('ShaderNodeOutputMaterial');em=nodes.new('ShaderNodeEmission');tex=nodes.new('ShaderNodeTexImage');uv=nodes.new('ShaderNodeTexCoord');mul=nodes.new('ShaderNodeVectorMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=(6,1,1)
    tex.image=bpy.data.images.load(f'C:/xoox/data/art/sky/horizon_mountains_{state}.png');tex.extension='REPEAT'
    links=mat.node_tree.links;links.new(uv.outputs['UV'],mul.inputs[0])
    coords=nodes.new('ShaderNodeSeparateXYZ');mirror=nodes.new('ShaderNodeMath');mirror.operation='PINGPONG';mirror.inputs[1].default_value=1;combine=nodes.new('ShaderNodeCombineXYZ')
    links.new(mul.outputs[0],coords.inputs[0]);links.new(coords.outputs['X'],mirror.inputs[0]);links.new(mirror.outputs[0],combine.inputs['X']);links.new(coords.outputs['Y'],combine.inputs['Y']);links.new(combine.outputs[0],tex.inputs[0])
    rgb=('#80ADBE' if state=='purified' else '#303445');vals=[int(rgb[i:i+2],16)/255 for i in (1,3,5)];color=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in vals)+(1,)
    separate=nodes.new('ShaderNodeSeparateXYZ');fade=nodes.new('ShaderNodeMapRange');fade.interpolation_type='SMOOTHSTEP';fade.inputs['From Min'].default_value=.7;fade.inputs['From Max'].default_value=1
    mix=nodes.new('ShaderNodeMixRGB');mix.inputs[2].default_value=color;links.new(uv.outputs['UV'],separate.inputs[0]);links.new(separate.outputs['Y'],fade.inputs['Value']);links.new(fade.outputs[0],mix.inputs[0]);links.new(tex.outputs[0],mix.inputs[1]);links.new(mix.outputs[0],em.inputs[0]);links.new(em.outputs[0],out.inputs[0]);ob.data.materials.append(mat)
    # World is camera-only flat sky; retain existing world illumination for the terrain.
    wn=scene.world.node_tree.nodes;wl=scene.world.node_tree.links;wout=next(n for n in wn if n.type=='OUTPUT_WORLD');old=wout.inputs['Surface'].links[0].from_socket;bg=wn.new('ShaderNodeBackground');bg.inputs[0].default_value=color;bg.inputs[1].default_value=1;lp=wn.new('ShaderNodeLightPath');wm=wn.new('ShaderNodeMixShader');wl.new(lp.outputs['Is Camera Ray'],wm.inputs[0]);wl.new(old,wm.inputs[1]);wl.new(bg.outputs[0],wm.inputs[2]);wl.new(wm.outputs[0],wout.inputs[0])
    scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.cycles.samples=8
    scene.render.filepath=str(p/f'atmosphere_{state}.png');bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(p/f'atmosphere_{state}.blend'))
