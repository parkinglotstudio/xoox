"""Ruon upper crown: finer blocks with broad directional clumps, unchanged fringe and mint band."""
import math
FINE_CELL=4.0
JOIN_Y=186.0

def crown_surface(x,d):
    u=(x-240)/137;v=(d-32)/96;r2=u*u+v*v
    if r2>=1:return 999
    base=240-127*math.sqrt(1-r2)
    blend=max(0,min(1,(JOIN_Y-base)/65))
    flow=(x-228)-.42*(d-25)+6*math.sin((d-25)/65)
    return base+(1.5-3.0*math.cos(flow*math.tau/104))*blend

def refine_crown(vox,cell,color):
    for k,(part,col) in list(vox.items()):
        y=650-(k[2]+.5)*cell
        if part.startswith('hair') and part!='hair_sprout' and 108<=y<JOIN_Y:del vox[k]

def crown_mesh(make_mesh,scale,color):
    vox={};cell=FINE_CELL
    for i in range(-35,35):
        for j in range(-17,33):
            for l in range(116,136):
                x=240+(i+.5)*cell;d=(j+.5)*cell;y=650-(l+.5)*cell
                if y<crown_surface(x,d):continue
                flow=(x-228)-.42*(d-25)+6*math.sin((d-25)/65)
                tone=1+.025*math.cos(flow*math.tau/104)
                vox[i,j,l]=tuple(max(0,min(255,round(c*tone))) for c in color(x,d,y))
    facespec=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)])]
    vv=[];ff=[];cc=[]
    for (i,j,k),col in vox.items():
        for (dx,dy,dz),corners in facespec:
            if (i+dx,j+dy,k+dz) in vox:continue
            n=len(vv);vv.extend([((i+x)*cell*scale,(j+y)*cell*scale,(k+z)*cell*scale) for x,y,z in corners]);ff.append(tuple(range(n,n+4)))
            # Shallow local occlusion keeps the small blocks readable without dark rings.
            norm=(dx,dy,dz);axes=[a for a in range(3) if not norm[a]];cols=[]
            for corner in corners:
                a,b=axes;sa=1 if corner[a] else -1;sb=1 if corner[b] else -1
                p1=[i+dx,j+dy,k+dz];p2=p1.copy();p1[a]+=sa;p2[b]+=sb;p3=p1.copy();p3[b]+=sb
                o1,o2,o3=tuple(p1) in vox,tuple(p2) in vox,tuple(p3) in vox;ao=3 if o1 and o2 else int(o1)+int(o2)+int(o3)
                cols.append(tuple(round(c*(1-.013*ao)) for c in col))
            cc.append(cols)
    ob=make_mesh('A_hair_crown',vv,ff,cc);ob['crownCellM']=cell*scale
    return ob
