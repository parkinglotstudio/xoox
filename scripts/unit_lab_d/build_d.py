"""D01 reference-led Blender model. Authored by Codex; all dimensions in reference pixels.
No dependency on A/B/C geometry. Front=-Y, Z up. First pass: static form review.
"""
import bpy, math, os, sys, json, random
from collections import defaultdict
from mathutils import Vector
from pathlib import Path

ROOT = Path(r'C:\xoox')
OUT = ROOT / 'data/tools/unit_lab/character/D'
ART = Path(r'C:\수스이미지 생성/2026-09-26-wanderer-D08')
OUT.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
S = 0.0032
CELL = 8.0
VOX = {}
random.seed(71)

def lin(v):
    v = v / 255
    return v/12.92 if v < .04045 else ((v+.055)/1.055)**2.4

def rgb(h):
    return tuple(int(h[i:i+2],16) for i in (0,2,4))

COL = {k:rgb(v) for k,v in {
 'skin':'f7d2ac','skin_shadow':'e7ac85','hair':'f4d89f','cream':'fff0d5',
 'coat':'d98330','coat_shadow':'b56228','shirt':'473025','shorts':'533a2c',
 'boot':'704726','sole':'422c1c','cuff':'5e3c26','scarf':'285f58','scarf_hi':'39796d',
 'strap':'856039','gold':'e4ae52','leaf':'558439','leaf_hi':'82ac4c','flower':'cb791d',
 'blush':'f3978d','mouth':'8e3329','tongue':'ed7862','ivory':'fff3df',
}.items()}

def mix(a,b,t):
    t=max(0,min(1,t)); return tuple(round(x+(y-x)*t) for x,y in zip(a,b))

def hair_col(x,d,y):
    y -= 36 * max(0,min(1,(d-15)/100)) * max(0,min(1,(490-y)/80))
    stops=[(110,rgb('f6d9a1')),(246,rgb('eed19b')),(292,rgb('c1cc9a')),(346,rgb('82b19b')),(428,rgb('508879')),(485,rgb('417362'))]
    for (a,ca),(b,cb) in zip(stops,stops[1:]):
        if y<=b:return mix(ca,cb,(y-a)/(b-a))
    return stops[-1][1]

def coord(k):
    i,j,l=k; return (248+(i+.5)*CELL,(j+.5)*CELL,650-(l+.5)*CELL)

def idxranges(lo,hi):
    return [range(math.floor(lo[i]/CELL),math.ceil(hi[i]/CELL)) for i in range(3)]

def fill(part, bounds, test, color):
    x0,x1,d0,d1,y0,y1=bounds
    ranges=idxranges((x0-248,d0,650-y1),(x1-248,d1,650-y0))
    for i in ranges[0]:
        x=248+(i+.5)*CELL
        for j in ranges[1]:
            d=(j+.5)*CELL
            for l in ranges[2]:
                y=650-(l+.5)*CELL
                if test(x,d,y):
                    c=color(x,d,y) if callable(color) else COL.get(color,color)
                    VOX[i,j,l]=(part,c)

def ell(part,center,radius,color,cut=None,power=2):
    x,d,y=center; rx,rd,ry=radius
    fill(part,(x-rx,x+rx,d-rd,d+rd,y-ry,y+ry),
         lambda X,D,Y: abs((X-x)/rx)**power+abs((D-d)/rd)**power+abs((Y-y)/ry)**power<=1 and (not cut or not cut(X,D,Y)),color)

def box(part,x0,x1,d0,d1,y0,y1,color):
    fill(part,(x0,x1,d0,d1,y0,y1),lambda *a:True,color)

def loft(part, sections, color, cut=None, power=2):
    # sections: reference y, center x, center depth, half width, half depth.
    for a,b in zip(sections,sections[1:]):
        ya,xa,da,wa,ra=a; yb,xb,db,wb,rb=b
        def inside(X,D,Y):
            if not ya<=Y<=yb:return False
            t=(Y-ya)/(yb-ya); xx=xa+(xb-xa)*t; dd=da+(db-da)*t
            w=wa+(wb-wa)*t; r=ra+(rb-ra)*t
            return abs((X-xx)/w)**power+abs((D-dd)/r)**power<=1 and (not cut or not cut(X,D,Y))
        fill(part,(min(xa-wa,xb-wb),max(xa+wa,xb+wb),min(da-ra,db-rb),max(da+ra,db+rb),ya,yb),inside,color)

def curve(points,steps=6):
    out=[]
    for i in range(len(points)-1):
        a=points[max(0,i-1)];b=points[i];c=points[i+1];d=points[min(len(points)-1,i+2)]
        n=max(steps,round(math.dist(b[:3],c[:3])/3))
        for j in range(n):
            t=j/n
            out.append(tuple(.5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t*t+(-a[k]+3*b[k]-3*c[k]+d[k])*t*t*t) for k in range(len(b))))
    out.append(points[-1]);return out

def strand(part, points, color=hair_col, depth_ratio=.65):
    # x, depth, y, radius. Elliptic sections keep front bangs broad and shallow.
    for x,d,y,r in curve(points):
        r=max(2,r);ell(part,(x,d,y),(r,r*depth_ratio,max(5,r*.40)),color)

def poly_inside(x,y,poly):
    inside=False
    for (ax,ay),(bx,by) in zip(poly,poly[1:]+poly[:1]):
        if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
    return inside

def panel(part,poly,depth,thickness,color):
    fill(part,(min(p[0] for p in poly),max(p[0] for p in poly),depth,depth+thickness,min(p[1] for p in poly),max(p[1] for p in poly)),lambda x,d,y:poly_inside(x,y,poly),color)

def line(part,points,r,color):
    strand(part,[(*p,r) for p in points],color,1)

def build_form():
    # Body, split at prospective joints. Reference feet y650; crotch y550.
    loft('torso',[(387,248,2,37,34),(427,248,2,55,36),(488,248,4,63,38),(512,248,6,66,40)],'shirt',power=3)
    # Rear cloak: curved flare; front opening below shoulder.
    def cape_color(x,d,y):
        hem=535 + 24*max(0,1-abs(x-248)/128)**.6
        if abs(y-hem)<5:return COL['cream']
        if y>hem:return COL['coat_shadow']
        return COL['coat']
    def cut_cape(x,d,y):
        t=(y-388)/(565-388);rx=43+84*t;rd=35+33*t
        inner=((x-248)/max(1,rx-9))**2+((d-31)/max(1,rd-9))**2 < 1
        return inner or (d<15 and abs(x-248)<93) or y>541+24*max(0,1-abs(x-248)/128)**.6
    loft('cape_back',[(388,248,31,43,35),(435,248,31,71,49),(520,248,31,111,62),(565,248,31,128,69)],cape_color,cut_cape)
    # Shorts, exposed knees, socks and chunky ankle boots.
    ell('hips',(248,6,511),(71,43,38),'shorts',power=3)
    for sign in (-1,1):
        sx=lambda u:248+sign*u
        side='L' if sign<0 else 'R'
        loft('shorts_'+side,[(510,sx(41),3,36,40),(544,sx(43),3,35,39),(558,sx(43),3,32,36)],'shorts',power=4)
        box('shorts_'+side,sx(43)-33,sx(43)+33,-33,36,546,558,'cuff')
        box('leg_'+side,sx(43)-21,sx(43)+21,-22,24,552,591,'skin')
        box('sock_'+side,sx(43)-23,sx(43)+23,-27,29,585,601,'cream')
        box('boot_'+side,sx(43)-26,sx(43)+26,-31,32,601,616,'cuff')
        box('boot_'+side,sx(43)-21,sx(43)+21,-31,31,616,641,'boot')
        box('boot_'+side,sx(43)-23,sx(43)+23,-49,30,633,645,'boot')
        box('boot_'+side,sx(43)-26,sx(43)+26,-52,32,645,650,'sole')
        # Brown sleeves visible below the short orange capelet.
        strand('arm_'+side,[(sx(64),3,424,25),(sx(79),0,471,25),(sx(91),-3,505,22)],'shirt',.95)
        strand('hand_'+side,[(sx(91),-3,503,15),(sx(99),-10,523,15)],'skin',.75)
        box('hand_'+side,sx(86)-5,sx(86)+5,-22,-10,514,532,'skin_shadow')
        # Raised white plus patches at the front of the shorts.
        # The white cross is rebuilt below with a finer contour.
        
    # Neck wrap and the vertical scarf visible between cape leaves.
    ell('scarf',(248,-8,397),(38,34,18),'scarf',cut=lambda x,d,y:y<389 and abs(x-248)<24 and d<4,power=3)
    line('scarf',[(217,-34,396),(248,-41,407),(278,-34,396)],5,'scarf_hi')
    panel('scarf',[(230,408),(262,408),(258,470),(240,476)],-43,10,'scarf')
    # A shoulder mantle, open at the front. No coat over the shorts.
    left=[(185,392),(219,410),(204,484),(140,464)]
    for side,poly in [('L',left),('R',[(496-x,y) for x,y in left])]:
        panel('capelet_'+side,poly,-49,20,'coat')
        # Cream binding along the lower, sloping edge.
        if side=='L':
            line('capelet_'+side,[(142,-54,462),(204,-54,481)],5,'cream')
            line('capelet_'+side,[(153,-54,452),(187,-54,464),(194,-54,449)],3,'cream')
        else:
            line('capelet_'+side,[(354,-54,462),(292,-54,481)],5,'cream')
            line('capelet_'+side,[(343,-54,452),(309,-54,464),(302,-54,449)],3,'cream')
    # Fur collar: broad white pieces with a stepped scallop edge.
    line('collar',[(183,-42,390),(196,-48,397),(208,-53,406),(220,-51,410)],10,'cream')
    line('collar',[(313,-42,390),(300,-48,397),(288,-53,406),(276,-51,410)],10,'cream')
    # Cross-body strap and belt, buckle and pouch.
    line('strap',[(214,-49,433),(244,-48,450),(285,-49,475)],4.5,'strap')
    box('belt',183,313,-45,39,479,495,'cuff')
    box('buckle',241,264,-52,-44,478,498,'gold')
    # Buckle inset is a finer raised face feature below.
    box('pouch',278,298,-50,-39,494,522,'strap')
    # Side ears and a gently rounded chin; flat eye center retained.
    loft('head',[(224,248,-8,70,44),(247,248,-8,87,56),(333,248,-8,89,56),(360,248,-8,85,55),(374,248,-8,75,52)],'skin',power=4)
    ell('ears',(159,-5,330),(13,20,21),'skin_shadow',power=3)
    ell('ears',(337,-5,330),(13,20,21),'skin_shadow',power=3)
    box('head',166,330,-72,-48,264,366,'skin')
    box('head',174,322,-72,-48,366,374,'skin')
    # Crown broadest near the temples. Face aperture is cut before adding bangs.
    ell('hair_cap',(248,37,252),(146,105,142),hair_col,
        cut=lambda x,d,y:d<13 and abs(x-248)<94 and y>228)
    # Back locks grow from the crown and remain visibly separate at their tips.
    for j in range(11):
        angle=math.radians(-83+j*16.6)
        si,co=math.sin(angle),math.cos(angle)
        end=438+25*co+(j%3-1)*7
        strand(f'hair_back_{j:02d}',[(248+72*si,38+69*co,142,19),
          (248+119*si,38+100*co,208,23),(248+126*si,38+102*co,310,24),
          (248+136*si,36+105*co,389,23),(248+135*si,33+112*co,end-20,18),
          (248+139*si,34+114*co,end,5)],depth_ratio=.85)
    # Side framing locks, flowing inward at the cheeks then curling at the ends.
    for sign in (-1,1):
        sx=lambda u:248+sign*u
        strand('hair_side_'+str(sign),[(sx(102),-20,198,25),(sx(114),-57,250,23),(sx(106),-61,309,21),
          (sx(101),-60,343,14),(sx(105),-45,382,12),(sx(100),-40,413,10),(sx(89),-42,431,5)])
        strand('hair_wisp_'+str(sign),[(sx(136),14,261,16),(sx(148),9,278,14),(sx(174),13,281,5)])
        strand('hair_curl_'+str(sign),[(sx(138),29,321,18),(sx(157),20,345,13),(sx(172),17,359,9),
          (sx(165),13,378,7),(sx(151),14,362,4)])
        strand('hair_outer_'+str(sign),[(sx(122),31,336,21),(sx(141),26,388,21),(sx(141),21,419,12),(sx(135),15,445,5)])
        strand('hair_inner_'+str(sign),[(sx(110),-1,356,16),(sx(110),-10,388,12),(sx(100),-16,414,8),(sx(112),-12,425,5)])
    # Three traced fringe masses; the gaps between them establish the reference parting.
    build_reference_fringe()
    # Crown sprout: square stepped hook from the reference.
    strand('hair_sprout',[(222,31,114,11),(219,30,94,11),(222,30,77,10),(232,31,64,9),(246,31,59,8),(259,31,61,5)],depth_ratio=.9)
    # Brooch uses the separate detailed mesh; no overlapping block placeholder.
    # One small white stitch on the rear cape (behind the front body).
    line('cape_back',[(239,96,518),(245,98,525),(251,98,525),(257,96,518)],3,'cream')

FACES=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),
       ((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),
       ((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),
       ((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),
       ((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),
       ((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)])]

def colored_mesh(name,verts,faces,colors):
    if name in ('D_head','D_head_clean','D_face_detail') or name.startswith('D_hair'):
        verts=[(x,d,z+6*S*max(0,min(1,(-d/S-24)/42))) if z>.82 else (x,d,z) for x,d,z in verts]
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    attr=me.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='CORNER')
    data=[]
    for face,c in zip(faces,colors):
        if isinstance(c[0],(list,tuple)):
            for corner in c:data.extend([lin(v) for v in corner]+[1])
        else:
            lc=[lin(v) for v in c]+[1];data.extend(lc*len(face))
    attr.data.foreach_set('color',data)
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    ob.data.materials.append(MATERIAL);ob.parent=MODEL
    return ob

def voxel_meshes():
    groups=defaultdict(lambda:([],[],[]))
    for (i,j,k),(part,color) in VOX.items():
        if part.startswith('capelet_') or part in ('head','collar'):continue
        v,f,c=groups[part]
        variation=1+(((i*73+j*137+k*53)%13)-6)*.0015
        shade=tuple(max(0,min(255,round(x*variation))) for x in color)
        for (dx,dy,dz),corners in FACES:
            neighbor=VOX.get((i+dx,j+dy,k+dz))
            if neighbor and neighbor[0]==part:continue
            n=len(v)
            v.extend([((i+x)*CELL*S,(j+y)*CELL*S,(k+z)*CELL*S) for x,y,z in corners])
            f.append(tuple(range(n,n+4)))
            if part.startswith('hair'):
                # Local occlusion at each cube corner describes strand overlap.
                norm=(dx,dy,dz);axes=[a for a in range(3) if not norm[a]];corner_cols=[]
                for corner in corners:
                    npos=[i+dx,j+dy,k+dz];a,b=axes
                    sa=1 if corner[a] else -1;sb=1 if corner[b] else -1
                    p1=npos.copy();p1[a]+=sa;p2=npos.copy();p2[b]+=sb;p3=p1.copy();p3[b]+=sb
                    occ=lambda p:bool(VOX.get(tuple(p),('',))[0].startswith('hair'))
                    o1,o2,o3=occ(p1),occ(p2),occ(p3);ao=3 if o1 and o2 else int(o1)+int(o2)+int(o3)
                    corner_cols.append(mix(shade,rgb('536a56'),ao*.075))
                c.append(corner_cols)
            else:c.append(shade)
    return [colored_mesh('D_'+part,*data) for part,data in groups.items()]

# Reference coordinates are measured in the 1280x720 image, left portrait.
# A flat upper lid, a stepped outer lash, and outward-facing sclera define the expression.
EYE_OUTER=[(169,283),(204,283),(204,290),(211,290),(211,331),(208,331),(208,337),(204,337),(204,340),(168,340),(168,329),(160,329),(160,316),(151,316),(151,302),(160,302),(160,290),(169,290)]

MOUTH_OUTER=[(232,342),(257,342),(257,353),(253,359),(237,359),(232,354)]

def lower_cheek(x,y):
    ax=abs(x-248)
    weight=max(0,min(1,(y-338)/16))
    if ax<65:return 0
    if ax<73:depth=(ax-65)*.18
    elif ax<80:depth=1.44+(ax-73)*.48
    else:depth=4.80+(ax-80)*.70
    return depth*weight

def face_surface(x,y):return -58+lower_cheek(x,y)

def detailed_face():
    verts=[];faces=[];colors=[];eye_regions=[]
    def shape(poly,depth,color,thickness=1.6,conform=False):
        # Extruded stepped polygons, positioned within the shallow facial recess.
        area=sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(poly,poly[1:]+poly[:1]))
        if area>0:poly=poly[::-1]
        n=len(verts);N=len(poly)
        for back in (0,thickness):
            verts.extend([((x-248)*S,((face_surface(x,y)+depth if conform else depth)+back)*S,(650-y)*S) for x,y in poly])
        faces.append(tuple(n+j for j in range(N)));colors.append(color)
        faces.append(tuple(n+N+j for j in range(N-1,-1,-1)));colors.append(color)
        for j in range(N):
            k=(j+1)%N;faces.append((n+j,n+N+j,n+N+k,n+k));colors.append(color)
    def rect(x,y,w,h,depth,color,conform=False):shape([(x,y),(x+w,y),(x+w,y+h),(x,y+h)],depth,color,conform=conform)
    dark=rgb('2c140e');pupil=rgb('20120e');white=rgb('fff9ef')
    for mirror in (False,True):
        role='eye'
        def eye(poly,depth,color):
            start=len(verts);shape([(490-x if mirror else x,y) for x,y in poly],depth,color);eye_regions.append((start,len(verts),mirror,role))
        eye(EYE_OUTER,-57.35,dark)
        # Broad horizontal lid and squared outer corner: no oval eye boundary.
        eye([(169,283),(204,283),(204,290),(169,290)],-57.50,rgb('34190f'))
        eye([(178,296),(181,296),(181,325),(184,325),(184,332),(188,332),(188,337),(193,337),(193,340),(170,340),(170,335),(166,335),(166,305),(171,305),(171,301),(176,301),(176,297)],-57.55,white)
        eye([(181,297),(210,297),(210,329),(207,329),(207,335),(204,335),(204,339),(189,339),(189,335),(185,335),(185,329),(181,329)],-57.60,pupil)
        # Amber iris under a vertical pupil, with stepped yellow lower facets.
        eye([(182,315),(193,315),(193,325),(198,325),(198,315),(208,315),(208,330),(204,330),(204,338),(189,338),(189,333),(185,333),(185,327),(182,327)],-57.67,rgb('b96d22'))
        iris=[(185,317),(193,317),(193,325),(199,325),(199,317),(205,317),(205,330),(202,330),(202,336),(190,336),(190,331),(185,331)]
        def clip_y(poly,bound,lower):
            out=[]
            for a,b in zip(poly,poly[1:]+poly[:1]):
                inside_a=a[1]>=bound if lower else a[1]<=bound
                inside_b=b[1]>=bound if lower else b[1]<=bound
                if inside_a:out.append(a)
                if inside_a!=inside_b:
                    t=(bound-a[1])/(b[1]-a[1]);out.append((a[0]+t*(b[0]-a[0]),bound))
            return out
        for y in range(317,336):
            section=clip_y(clip_y(iris,y,True),y+1,False)
            if len(section)>2:
                t=(y-317)/19
                color=mix(rgb('b46c24'),rgb('ffd071'),t)
                eye(section,-57.75,color)
        # Plus-shaped catchlight, mirrored with the eye.
        eye([(193,297),(199,297),(199,301),(203,301),(203,307),(199,307),(199,311),(193,311),(193,307),(189,307),(189,301),(193,301)],-57.84,rgb('fffefd'))
        role='brow'
        # Thin upper-lid skin fold visible in the sample, distinct from green brows.
        eye([(190,277),(207,277),(207,278.4),(190,278.4)],-58.06,rgb('c79870'))
        # Reference's sage-green eyebrow strip above the eyelid.
        eye([(179,255),(207,255),(207,263),(179,263)],-58.08,rgb('819862'))
        eye([(180,255),(207,255),(207,258),(180,258)],-58.16,rgb('a6b585'))
        eye([(179,261.5),(207,261.5),(207,263),(179,263)],-58.17,rgb('6e8651'))
    # Blush is colored on the head surface, with no floating overlay.
    # Short open smile, tucked into the facial surface.
    shape(MOUTH_OUTER,-57.82,COL['mouth'])
    rect(235,348,19,8,-57.88,rgb('d85e51'))
    rect(238,354,14,5,-57.94,rgb('ee7d68'))
    for cx in (206,290):
        rect(cx-3.5,524,7,20,-45,COL['cream']);rect(cx-10,531,6.5,7,-45,COL['cream']);rect(cx+3.5,531,6.5,7,-45,COL['cream'])
    rect(241,478,23,21,-57,COL['gold']);rect(246,483,13,11,-59,COL['shorts'])
    ob=colored_mesh('D_face_detail',verts,faces,colors);ob['expressionRegions']=json.dumps(eye_regions);return ob


def build_reference_fringe():
    # Outlines of the broad center lock and the two outward-sweeping side locks.
    outlines=[
      [(210,146),(265,146),(270,182),(271,244),(263,272),(257,286),(257,303),(244,303),(238,289),(228,280),(222,270),(214,268),(210,254),(205,253),(205,235),(202,213),(204,183)],
      [(202,148),(204,166),(194,192),(193,223),(189,242),(180,252),(176,263),(165,272),(157,282),(148,280),(153,258),(153,235),(162,210),(173,184),(185,165)],
      [(276,148),(289,158),(305,176),(327,202),(331,221),(320,239),(319,263),(306,269),(296,257),(289,250),(285,234),(277,227),(273,205)]
    ]
    table=[(140,-30),(166,-49),(200,-73),(236,-87),(272,-91),(307,-91)]
    def front(x,y,mid):
        for (a,da),(b,db) in zip(table,table[1:]):
            if y<=b:return da+(db-da)*max(0,(y-a)/(b-a))+5*min(1,((x-mid)/33)**2)
        return -89
    for k,poly in enumerate(outlines):
        xmin,xmax=min(x for x,y in poly),max(x for x,y in poly);ymin,ymax=min(y for x,y in poly),max(y for x,y in poly)
        mid=(xmin+xmax)/2
        fill('hair_bang_'+str(k),(xmin,xmax,-102,12,ymin,ymax),lambda x,d,y:poly_inside(x,y,poly) and front(x,y,mid)<=d<=front(x,y,mid)+22,bang_col)


def cloth_panels():
    result=[]
    # Cells follow the garment rather than the world XYZ grid.
    for side in (-1,1):
        vv=[];ff=[];cc=[]
        corners=[(185,-36,392),(219,-50,410),(204,-58,482),(140,-39,462)]
        if side==1:corners=[(496-x,d,y) for x,d,y in corners]
        def at(u,v,back=0):
            a,b,c,d=corners
            x=(1-v)*((1-u)*a[0]+u*b[0])+v*((1-u)*d[0]+u*c[0])
            dep=(1-v)*((1-u)*a[1]+u*b[1])+v*((1-u)*d[1]+u*c[1])-5*math.sin(math.pi*u)*math.sin(math.pi*v)+back
            y=(1-v)*((1-u)*a[2]+u*b[2])+v*((1-u)*d[2]+u*c[2])
            return ((x-248)*S,dep*S,(650-y)*S)
        nx,ny=8,14
        for j in range(ny):
            for i in range(nx):
                u0,u1=i/nx,(i+1)/nx;v0,v1=j/ny,(j+1)/ny
                n=len(vv);vv.extend([at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1),at(u0,v0,12),at(u1,v0,12),at(u1,v1,12),at(u0,v1,12)])
                col=COL['cream'] if j==ny-1 else mix(COL['coat'],rgb('ed9b47'),.22+.10*((i*7+j*3)%5)/4)
                if (j==10 and i in (1,5)) or (j==11 and i in (2,4)) or (j==12 and i==3):col=COL['cream']
                for face in [(0,1,2,3),(4,7,6,5)]:ff.append(tuple(n+k for k in (face if side==-1 else face[::-1])));cc.append(col)
                if i==0:ff.append((n,n+3,n+7,n+4));cc.append(col)
                if i==nx-1:ff.append((n+1,n+5,n+6,n+2));cc.append(col)
                if j==0:ff.append((n,n+4,n+5,n+1));cc.append(col)
                if j==ny-1:ff.append((n+3,n+2,n+6,n+7));cc.append(col)
        result.append(colored_mesh('D_mantle_'+str(side),vv,ff,cc))
    return result



def bang_col(x,d,y):
    stops=[(110,rgb('f6d9a1')),(226,rgb('efd5a2')),(251,rgb('d0cfa6')),(273,rgb('99b79c')),(311,rgb('74a58c'))]
    for (a,ca),(b,cb) in zip(stops,stops[1:]):
        if y<=b:return mix(ca,cb,(y-a)/(b-a))
    return stops[-1][1]

def clean_head():
    # Face is inside the hair envelope. Eyes/mouth are set into shallow sockets,
    # never suspended ahead of a protruding face panel.
    verts=[];faces=[];colors=[]
    nx,ny=112,98;hw,hh,r=84,73,22
    def polygon_socket(x,y,poly,amount):
        if not poly_inside(x,y,poly):return 0
        dist=100
        for a,b in zip(poly,poly[1:]+poly[:1]):
            dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
            dist=min(dist,math.hypot(x-a[0]-t*dx,y-a[1]-t*dy))
        t=max(0,min(1,dist/.8));return amount*t*t*(3-2*t)
    def recess(x,y):
        return max(polygon_socket(x,y,EYE_OUTER,1.7),polygon_socket(490-x,y,EYE_OUTER,1.7),polygon_socket(x,y,MOUTH_OUTER,.65))
    for j in range(ny+1):
        y=301-hh+2*hh*j/ny
        rr=r if y>301 else 13
        dy=max(0,abs(y-301)-(hh-rr));width=hw-rr+math.sqrt(max(0,rr*rr-dy*dy))
        for i in range(nx+1):
            x=248-width+2*width*i/nx;depth=face_surface(x,y)+recess(x,y)
            verts.append(((x-248)*S,depth*S,(650-y)*S))
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i;faces.append((a,a+nx+1,a+nx+2,a+1))
            x=(verts[a][0]+verts[a+1][0])/(2*S)+248;y=650-(verts[a][2]+verts[a+nx+1][2])/(2*S)
            dep=lower_cheek(x,y);tone=0 if dep<.6 else .065 if dep<2.5 else .13 if dep<4.5 else .19
            color=mix(COL['skin'],COL['skin_shadow'],tone)
            if 339<=y<=351 and (163<=x<=185 or 306<=x<=328):
                color=mix(color,COL['blush'],.90)
            colors.append(color)
    boundary=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,ny+1)]+[ny*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(ny-1,0,-1)]
    previous=boundary;front=[verts[i] for i in boundary]
    for band,(depth,sx,sz) in enumerate([(-55.5,1.035,1.014),(-45,1.06,1.014),(32,.92,.92)]):
        ring=[]
        for x,d,z in front:
            py=650-z/S;lower=max(0,min(1,(py-362)/12))
            dd=max(depth,d/S+2.5) if depth<0 else depth
            xx=x*sx;zz=(650-301)*S+(z-(650-301)*S)*sz
            if band<2:
                # One visible chin bevel folds back into an under-jaw surface.
                dd=dd*(1-lower)+(-48 if band==0 else -20)*lower
                xx=x*(sx*(1-lower)+(.96 if band==0 else .80)*lower)
                zz-=lower*(1 if band==0 else 3)*S
            ring.append(len(verts));verts.append((xx,dd*S,zz))
        for k in range(len(ring)):
            q=(k+1)%len(ring);faces.append((previous[k],previous[q],ring[q],ring[k]))
            ymid=650-(front[k][2]+front[q][2])/(2*S)
            lower=max(0,min(1,(ymid-362)/12))
            colors.append(mix(COL['skin'],rgb('c08b65') if band==0 else rgb('ac7650'),lower*(.12 if band==0 else .28)))
        previous=ring
    faces.append(tuple(previous[::-1]));colors.append(COL['skin'])
    ob=colored_mesh('D_head_clean',verts,faces,colors);ob['frontVertexCount']=(nx+1)*(ny+1)
    import bmesh
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    for poly in ob.data.polygons:poly.use_smooth=len(poly.vertices)==4
    return ob



def neck_bridge():
    # Separate continuous mesh: the voxel head placeholder cannot erase this neck.
    vv=[];ff=[];cc=[];steps=16
    rings=[(367,18,25),(380,19,27),(389,18,25),(399,16,20)]
    for y,rx,rd in rings:
        for j in range(steps):
            a=2*math.pi*j/steps
            vv.append((rx*math.cos(a)*S,(-9+rd*math.sin(a))*S,(650-y)*S))
    for k in range(len(rings)-1):
        for j in range(steps):
            q=(j+1)%steps;ff.append((k*steps+j,k*steps+q,(k+1)*steps+q,(k+1)*steps+j))
            cc.append(rgb('bf906a') if k==0 else rgb('b9855f'))
    ff.extend([tuple(range(steps-1,-1,-1)),tuple((len(rings)-1)*steps+j for j in range(steps))]);cc.extend([rgb('b9855f')]*2)
    ob=colored_mesh('D_neck_bridge',vv,ff,cc)
    import bmesh
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    for face in ob.data.polygons:face.use_smooth=len(face.vertices)==4
    return ob


def costume_details():
    vv=[];ff=[];cc=[]
    def cuboid(cx,d,cy,w,h,depth,color,angle=0):
        n=len(vv);a=math.radians(angle)
        for x,y,z in [(-1,0,-1),(1,0,-1),(1,0,1),(-1,0,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]:
            xx=x*w/2;zz=z*h/2
            px=cx+xx*math.cos(a)-zz*math.sin(a);py=cy+xx*math.sin(a)+zz*math.cos(a)
            vv.append(((px-248)*S,(d+y*depth)*S,(650-py)*S))
        for face in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:ff.append(tuple(n+i for i in face));cc.append(color)
    # Fur: small overlapping ivory tufts, two rows, following the diagonal collar.
    for side in (-1,1):
        for j in range(7):
            t=j/6;cx=248+side*(65-35*t);cy=384+24*t;dep=-48-9*t
            for row in range(2):
                c=mix(COL['cream'],rgb('e3d2b4'),.13*((j+row)%3))
                cuboid(cx+side*row*1.5,dep-row*1.4,cy+row*5.5,10.5,12.5+(j%3)*1.2,9,c,-side*34)
        # Shorts: hem stitches, pocket seam and boot toe-cap stitching.
        cx=248+side*43
        for dx in range(-22,24,8):
            cuboid(cx+dx,-42.5,547,4,.9,1,rgb('ad8255'))
            cuboid(cx+dx,-53,637,4,.8,1,rgb('ad7948'))
        for yy in range(514,539,7):cuboid(cx+side*25,-40,yy,.9,4,1,rgb('ad8255'))
        # Ankle strap, inset buckle and metal rivet.
        cuboid(cx,-34,610,45,3,2,rgb('936337'))
        cuboid(cx+side*14,-35,610,6,6,2,COL['gold'])
        cuboid(cx+side*14,-37,610,3,3,1,COL['cuff'])
    # Fine leather shoulder strap lies on the shirt without the grid's stair-steps.
    for i in range(16):
        t=i/15;cuboid(214+72*t,-54,433+42*t,6.5,9,4,COL['strap'],-59)
    cuboid(255,-58,457,8,12,2,COL['gold'],-59)
    cuboid(255,-60,457,4,7,1,COL['strap'],-59)
    # Pouch flap with visible seam and a single brass stud.
    cuboid(289,-54,498,21,9,5,rgb('956238'))
    cuboid(289,-60,501,3,3,2,COL['gold'])
    for xx in (281,297):
        for yy in (507,513,519):cuboid(xx,-53,yy,1,3,1,rgb('bd9661'))
    return colored_mesh('D_costume_details',vv,ff,cc)



def brooch_details():
    vv=[];ff=[];cc=[]
    def plate(poly,depth,color,thick=1.5):
        n=len(vv);N=len(poly)
        for d in (depth,depth+thick):
            vv.extend([((x-248)*S,d*S,(650-y)*S) for x,y in poly])
        ff.append(tuple(n+j for j in range(N-1,-1,-1)));cc.append(rgb(color))
        ff.append(tuple(n+N+j for j in range(N)));cc.append(rgb(color))
        for j in range(N):ff.append((n+j,n+(j+1)%N,n+N+(j+1)%N,n+N+j));cc.append(mix(rgb(color),rgb('344b28'),.24))
    plate([(332,208),(355,203),(355,218),(346,234),(332,235),(329,222)],-78,'729947')
    plate([(333,211),(355,205),(352,215),(340,225),(331,227)],-79,'87ad50')
    plate([(331,231),(353,210),(355,211),(334,233)],-80,'c3d487',.7)
    for x,y in [(334,224),(341,218),(347,213)]:
        plate([(x,y),(x-4,y-5),(x-3,y-6),(x+1,y-1)],-80.5,'a8c46f',.6)
    for x,y,w,h,c in [(312,228,10,9,'c97721'),(319,220,8,11,'eba33f'),(326,228,9,9,'e8a03b'),(319,234,8,10,'d98a26')]:
        plate([(x,y),(x+w,y),(x+w,y+h),(x,y+h)],-84,c,3)
    plate([(319,228),(326,228),(326,235),(319,235)],-86,'ffd181',2)
    plate([(320,228),(323,228),(323,231),(320,231)],-87,'fff0bc',.6)
    return colored_mesh('D_brooch_detail',vv,ff,cc)


def setup():
    global MODEL,MATERIAL
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    MODEL=bpy.data.objects.new('D_reference_form',None);bpy.context.collection.objects.link(MODEL)
    MODEL['stage']='D08 expressions, greeting, wave and two-hop victory';MODEL['nativeBlocks']=True;MODEL['nativeBlockCell']=CELL*S
    MODEL['reference']='sample.png; 1280x720; front landmark coordinates'
    MATERIAL=bpy.data.materials.new('D_vertex_palette');MATERIAL.use_nodes=True
    nt=MATERIAL.node_tree;p=nt.nodes.get('Principled BSDF');vc=nt.nodes.new('ShaderNodeVertexColor');vc.layer_name='Color'
    nt.links.new(vc.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.82
    p.inputs['Specular IOR Level'].default_value=.22


def setup_render():
    sc=bpy.context.scene;sc.render.engine='CYCLES'
    sc.cycles.samples=40;sc.cycles.use_denoising=True;sc.cycles.max_bounces=4
    sc.cycles.use_adaptive_sampling=True;sc.cycles.adaptive_threshold=.035
    sc.render.resolution_x=480;sc.render.resolution_y=720;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG'
    sc.render.film_transparent=False
    sc.world.color=(.05,.05,.05);sc.world.use_nodes=True
    sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.055,.07,.09,1)
    sc.world.node_tree.nodes['Background'].inputs[1].default_value=.60
    sc.view_settings.view_transform='Standard';sc.view_settings.look='None'
    sc.view_settings.exposure=0;sc.view_settings.gamma=1
    for name,pos,energy,size in [('key',(-3,-4,6),470,6),('fill',(3,-3,3),240,5),('rim',(1,4,5),220,3)]:
        ld=bpy.data.lights.new(name,'AREA');ld.energy=energy;ld.shape='DISK';ld.size=size
        ob=bpy.data.objects.new(name,ld);bpy.context.collection.objects.link(ob);ob.location=pos
        ob.rotation_euler=(Vector((0,0,1))-ob.location).to_track_quat('-Z','Y').to_euler()
    cd=bpy.data.cameras.new('D_review_camera');cam=bpy.data.objects.new('D_review_camera',cd);bpy.context.collection.objects.link(cam)
    cd.type='ORTHO';cd.ortho_scale=2.304;sc.camera=cam
    sc.render.image_settings.color_mode='RGBA'
    sc.render.film_transparent=True
    return cam


def render_views(cam):
    sc=bpy.context.scene
    light_positions={o.name:o.location.copy() for o in bpy.context.scene.objects if o.type=='LIGHT'}
    for name,angle in [('front',0),('threequarter',28),('back',180),('side',-90)]:
        a=math.radians(angle)
        for nm,pos in light_positions.items():
            ob=bpy.data.objects[nm];ob.location=(pos.x*math.cos(a)-pos.y*math.sin(a),pos.x*math.sin(a)+pos.y*math.cos(a),pos.z)
            ob.rotation_euler=(Vector((0,0,1))-ob.location).to_track_quat('-Z','Y').to_euler()
        target=Vector((0,.07,.928))
        cam.location=target+Vector((math.sin(a)*6,-math.cos(a)*6,.42))
        cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
        sc.render.filepath=str(ART / ('D_'+name+'.png'));bpy.ops.render.render(write_still=True)
        print('D_RENDER',name,flush=True)
    for nm,pos in light_positions.items():
        ob=bpy.data.objects[nm];ob.location=pos;ob.rotation_euler=(Vector((0,0,1))-pos).to_track_quat('-Z','Y').to_euler()
    # Front face close-up, no perspective enlargement.
    target=Vector((0,.07,1.23));cam.location=target+Vector((0,-6,.42));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=1.08;sc.render.resolution_x=720;sc.render.resolution_y=720
    sc.render.filepath=str(ART/'D_face.png');bpy.ops.render.render(write_still=True)


def main():
    setup();build_form();objs=voxel_meshes();objs.append(detailed_face());objs.extend(cloth_panels());objs.append(clean_head());objs.append(neck_bridge());objs.append(costume_details());objs.append(brooch_details())
    import importlib.util
    spec=importlib.util.spec_from_file_location('rig_d',str(Path(__file__).with_name('rig_d.py')));rigmod=importlib.util.module_from_spec(spec);spec.loader.exec_module(rigmod)
    expression_spec=importlib.util.spec_from_file_location('expressions_d',str(Path(__file__).with_name('expressions_d.py')));expressions=importlib.util.module_from_spec(expression_spec);expression_spec.loader.exec_module(expressions)
    faces=expressions.expression_meshes(objs,colored_mesh,face_surface,poly_inside,EYE_OUTER)
    arm,clips,rig_metrics=rigmod.build_rig(objs,MODEL,colored_mesh,expressions,faces)
    objs=rigmod.merge_draw_groups(objs)
    bpy.ops.object.select_all(action='DESELECT')
    MODEL.select_set(True);arm.select_set(True)
    for ob in objs:ob.select_set(True)
    bpy.context.view_layer.objects.active=MODEL
    glb=ART/'wanderer_D.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_apply=False)
    metrics={'stage':'D08 +31.8% bazooka, back rack, six-second idle, blink/squint/bow/wave/victory','voxel_cell_m':CELL*S,'occupied_cells':len(VOX),'objects':len(objs),
      'triangles':sum(len(p.vertices)-2 for o in objs for p in o.data.polygons),'file_bytes':glb.stat().st_size,
      'animations':clips,'rig':rig_metrics, 'face_depth_px':-58,'eye_surface_depth_px':[-57.35,-57.84],'eye_socket_floor_px':-56.3,'cheek_recede_px':[0,1.44,4.8,7.6], 'reference_landmarks':{'crown_y':110,'chin_y':374,'feet_y':650,'head_width_px':292,'face_width_px':168}}
    import shutil
    shutil.copy2(glb,OUT/'wanderer_D.glb')
    (OUT/'metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')
    rigmod.rest_pose(arm)
    cam=setup_render();bpy.ops.wm.save_as_mainfile(filepath=str(ART/'wanderer_D.blend'))
    print('D_METRICS',json.dumps(metrics),flush=True)
    if '--render' in sys.argv:render_views(cam)
    print('D_COMPLETE',flush=True)

main()
