"""Ruon original body: reference-pixel block model, front=-Y, Z up. Codex."""
import bpy, math, os, sys, json, random
from collections import defaultdict
from mathutils import Vector
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))

ROOT = Path(r'C:\xoox')
OUT = ROOT / 'data/tools/unit_lab/character/A'
ART = Path(r'C:\수스이미지 생성/2026-09-26-wanderer-A')
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
 'skin':'ffdfc2','skin_shadow':'e7ac85','hair':'26334f','cream':'fff0d5',
 'coat':'db8128','coat_shadow':'a75b29','shirt':'49342a','shorts':'4c352c',
 'boot':'704726','sole':'422c1c','cuff':'5e3c26','scarf':'3b9698','scarf_hi':'62babc',
 'strap':'856039','gold':'e4ae52','leaf':'558439','leaf_hi':'82ac4c','flower':'cb791d',
 'blush':'f3978d','mouth':'8e3329','tongue':'ed7862','ivory':'fff3df',
}.items()}

def mix(a,b,t):
    t=max(0,min(1,t)); return tuple(round(x+(y-x)*t) for x,y in zip(a,b))

def hair_col(x,d,y):
    # A's continuous mint horizontal stripe, never a cream-to-mint gradient.
    if 188<=y<=200 and (d<-28 or d>95 or abs(x-240)>113):
        return mix(rgb('429ba6'),rgb('65babc'),.5+.25*math.sin((x-240)/28))
    high=max(0,1-(y-114)/245)*.55
    return mix(rgb('2a3a5e'),rgb('455b83'),high)


def coord(k):
    i,j,l=k; return (240+(i+.5)*CELL,(j+.5)*CELL,650-(l+.5)*CELL)

def idxranges(lo,hi):
    return [range(math.floor(lo[i]/CELL),math.ceil(hi[i]/CELL)) for i in range(3)]

def fill(part, bounds, test, color):
    x0,x1,d0,d1,y0,y1=bounds
    ranges=idxranges((x0-240,d0,650-y1),(x1-240,d1,650-y0))
    for i in ranges[0]:
        x=240+(i+.5)*CELL
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
    # Every coordinate follows the left portrait in the approved A reference.
    loft('torso',[(369,240,1,39,32),(402,240,2,55,36),(459,240,4,64,39),(482,240,6,65,40)],'shirt',power=3)
    def cape_color(x,d,y):
        if y>521:return COL['cream']
        return mix(COL['coat'],COL['coat_shadow'],.14+.12*math.cos((x-240)/22))
    def cut_cape(x,d,y):
        t=max(0,min(1,(y-373)/164));rx=52+60*t;rd=37+27*t
        return ((x-240)/max(1,rx-8))**2+((d-27)/max(1,rd-8))**2<1 or d<18 or y>532-8*abs(x-240)/112
    loft('cape_back',[(373,240,27,52,37),(437,240,27,84,48),(537,240,27,112,64)],cape_color,cut_cape)
    loft('cape_shoulder_back',[(374,240,20,52,39),(424,240,20,105,57),(445,240,20,114,60)],lambda x,d,y:COL['cream'] if y>435 else COL['coat'],lambda x,d,y:d<18 or ((x-240)/max(1,48+(y-374)*.87))**2+((d-20)/max(1,33+(y-374)*.27))**2<1)
    ell('hips',(240,5,489),(71,42,29),'shorts',power=3)
    for sign in (-1,1):
        sx=lambda u:240+sign*u;side='L' if sign<0 else 'R'
        loft('shorts_'+side,[(478,sx(43),4,34,38),(535,sx(43),3,35,37),(552,sx(43),3,34,36)],'shorts',power=4)
        box('shorts_'+side,sx(43)-35,sx(43)+35,-35,37,545,555,'cuff')
        box('leg_'+side,sx(43)-21,sx(43)+21,-23,24,553,581,rgb('263959'))
        box('sock_'+side,sx(43)-24,sx(43)+24,-27,29,578,594,'cream')
        box('boot_'+side,sx(43)-27,sx(43)+27,-30,32,594,607,'cuff')
        box('boot_'+side,sx(43)-22,sx(43)+22,-31,30,607,638,'boot')
        box('boot_'+side,sx(43)-25,sx(43)+25,-46,30,630,645,'boot')
        box('boot_'+side,sx(43)-28,sx(43)+28,-49,32,644,651,'sole')
        strand('arm_'+side,[(sx(69),3,405,23),(sx(81),0,451,22),(sx(93),-3,493,18)],'shirt',.95)
        strand('hand_'+side,[(sx(95),-5,501,12),(sx(101),-10,517,12)],'skin',.85)
        box('hand_'+side,sx(88)-4,sx(88)+4,-22,-12,508,521,'skin_shadow')
    ell('scarf',(240,-5,380),(43,34,16),'scarf',cut=lambda x,d,y:y<373 and abs(x-240)<22 and d<0,power=3)
    line('scarf',[(205,-32,379),(219,-39,388),(240,-42,393),(263,-39,388),(275,-32,379)],4,'scarf_hi')
    panel('scarf',[(223,394),(250,397),(264,423),(245,419),(230,435),(215,428)],-44,7,'scarf')
    panel('cape_front_bridge',[(201,428),(220,431),(240,425),(260,431),(279,428),(291,444),(267,449),(240,452),(213,449),(189,444)],-50,9,'coat')
    line('cape_front_bridge',[(193,-55,441),(207,-55,438),(223,-55,445),(240,-55,436),(257,-55,445),(273,-55,438),(287,-55,441)],2.6,'cream')
    line('cape_front_bridge',[(188,-54,446),(215,-54,451),(240,-54,454),(265,-54,451),(292,-54,446)],2.8,'cream')
    box('belt',172,308,-44,37,459,475,'cuff')
    box('buckle',235,253,-49,-44,461,474,rgb('b69365'))
    box('pouch',266,290,-47,-38,474,496,'strap')
    ell('ears',(147,-3,319),(13,19,20),'skin_shadow',power=3)
    ell('ears',(333,-3,319),(13,19,20),'skin_shadow',power=3)
    # Wide domed crown; a short layered back ends at the neck.
    ell('hair_cap',(240,32,240),(137,96,127),hair_col,cut=lambda x,d,y:d<16 and abs(x-240)<95 and y>220)
    for j in range(11):
        a=math.radians(-84+j*16.8);si,co=math.sin(a),math.cos(a);end=363+17*co+(j%3-1)*8
        strand(f'hair_back_{j:02d}',[(240+72*si,35+63*co,150,19),(240+121*si,33+92*co,219,25),(240+123*si,31+98*co,296,22),(240+113*si,28+100*co,end-16,18),(240+104*si,25+102*co,end,5)],depth_ratio=.65)
    for sign in (-1,1):
        sx=lambda u:240+sign*u
        strand('hair_side_'+str(sign),[(sx(101),-24,196,22),(sx(114),-56,246,21),(sx(113),-60,291,15),(sx(108),-53,329,11),(sx(108),-49,343,4)])
        strand('hair_wisp_'+str(sign),[(sx(137),9,230,15),(sx(150),8,252,12),(sx(164),11,267,5)],depth_ratio=.62)
        strand('hair_outer_'+str(sign),[(sx(128),23,282,19),(sx(139),10,300,13),(sx(151),6,307,5)])
        strand('hair_inner_'+str(sign),[(sx(114),18,318,17),(sx(124),5,348,13),(sx(113),-1,368,5)])
    build_reference_fringe()
    strand('hair_sprout',[(222,26,116,8),(218,25,97,8),(227,26,77,8),(244,27,62,7),(251,28,53,5)],depth_ratio=.88)
    from crown_a import refine_crown
    refine_crown(VOX,CELL,hair_col)


FACES=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),
       ((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),
       ((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),
       ((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),
       ((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),
       ((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)])]

def colored_mesh(name,verts,faces,colors):
    if name in ('A_head','A_head_clean','A_face_detail') or name.startswith('A_hair'):
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

def voxel_meshes(only_hair=False):
    groups=defaultdict(lambda:([],[],[]))
    for (i,j,k),(part,color) in VOX.items():
        if only_hair and not part.startswith('hair'):continue
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
                    strength=.020 if part=='hair_cap' and coord((i,j,k))[2]<188 else .075
                    corner_cols.append(mix(shade,rgb('0e172b'),ao*strength))
                c.append(corner_cols)
            else:c.append(shade)
    from crown_a import crown_mesh
    return [colored_mesh('A_'+part,*data) for part,data in groups.items()]+[crown_mesh(colored_mesh,S,hair_col)]

# Reference coordinates are measured in the 1280x720 image, left portrait.
# A flat upper lid, a stepped outer lash, and outward-facing sclera define the expression.
EYE_OUTER=[(170,277),(200,277),(200,282),(207,282),(207,320),(202,320),(202,328),(175,328),(175,322),(162,322),(162,310),(155,310),(155,288),(162,288),(162,282),(170,282)]
MOUTH_OUTER=[(227,331),(231,331),(231,335),(248,335),(248,331),(253,331),(253,337),(249,341),(232,341),(227,336)]


def lower_cheek(x,y):
    ax=abs(x-240)
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
            verts.extend([((x-240)*S,((face_surface(x,y)+depth if conform else depth)+back)*S,(650-y)*S) for x,y in poly])
        faces.append(tuple(n+j for j in range(N)));colors.append(color)
        faces.append(tuple(n+N+j for j in range(N-1,-1,-1)));colors.append(color)
        for j in range(N):
            k=(j+1)%N;faces.append((n+j,n+N+j,n+N+k,n+k));colors.append(color)
    def rect(x,y,w,h,depth,color,conform=False):shape([(x,y),(x+w,y),(x+w,y+h),(x,y+h)],depth,color,conform=conform)
    dark=rgb('1c1b22');pupil=rgb('122833');white=rgb('fff9ec')
    for mirror in (False,True):
        role='eye'
        def eye(poly,depth,color):
            start=len(verts);shape([(480-x if mirror else x,y) for x,y in poly],depth,color);eye_regions.append((start,len(verts),mirror,role))
        eye(EYE_OUTER,-57.35,dark)
        eye([(167,290),(174,284),(178,287),(177,303),(180,314),(180,324),(173,324),(173,317),(167,317)],-57.50,white)
        eye([(178,283),(201,283),(206,289),(206,319),(199,327),(180,327),(177,315)],-57.57,pupil)
        eye([(178,308),(188,308),(188,315),(195,315),(195,308),(206,308),(206,320),(200,327),(181,327),(178,320)],-57.67,rgb('226e77'))
        for j,(y0,y1,x0,x1,col) in enumerate([(309,316,180,187,'2b939a'),(312,319,196,205,'35979c'),(319,324,182,202,'44b6b3'),(324,328,185,198,'6cc9bb')]):
            eye([(x0,y0),(x1,y0),(x1,y1),(x0,y1)],-57.75-j*.01,rgb(col))
        eye([(194,286),(199,286),(199,290),(203,290),(203,295),(199,295),(199,299),(194,299),(194,295),(190,295),(190,290),(194,290)],-57.84,rgb('fffefd'))
        role='brow'
        eye([(178,267),(202,267),(202,271),(178,271)],-58.07,rgb('3c404e'))
        eye([(179,267),(202,267),(202,268.4),(179,268.4)],-58.15,rgb('676c79'))
        eye([(185,273),(203,273),(203,274),(185,274)],-58.12,rgb('bc997f'))
    shape(MOUTH_OUTER,-57.84,rgb('b55641'))
    for sign in (-1,1):
        for j in range(3):
            x=240+sign*(68+j*5)
            shape([(x,329),(x+1.2,329),(x+.1,334),(x-1.1,334)],-58.1,rgb('ffe9d7'))
        cx=240+sign*45
        shape([(cx-4,517),(cx+4,517),(cx+4,522),(cx+10,522),(cx+10,529),(cx+4,529),(cx+4,535),(cx-4,535),(cx-4,529),(cx-10,529),(cx-10,522),(cx-4,522)],-40.2,COL['cream'])
    shape([(137,429),(159,436),(178,439),(194,433),(210,441),(226,435),(240,427),(254,435),(270,441),(286,433),(302,439),(321,436),(343,429),(343,435),(321,442),(302,445),(286,439),(270,447),(254,441),(240,434),(226,441),(210,447),(194,439),(178,445),(159,442),(137,435)],-59,COL['cream'])
    shape([(184,445),(212,450),(240,451),(268,450),(296,445),(296,450),(268,455),(240,456),(212,455),(184,450)],-59,COL['cream'])
    shape([(208,394),(213,392),(268,426),(265,432)],-59,COL['strap'])
    rect(237,414,7,11,-60,rgb('d7e7d9'))
    rect(235,462,18,12,-51,rgb('b9976d'));rect(239,465,9,5,-52,COL['cuff'])
    ob=colored_mesh('A_face_detail',verts,faces,colors);ob['expressionRegions']=json.dumps(eye_regions);return ob


def build_reference_fringe():
    outlines=[
      [(204,183),(278,183),(279,227),(269,256),(252,279),(241,284),(236,294),(222,285),(216,263),(208,253),(202,223)],
      [(132,184),(203,182),(207,213),(198,237),(181,258),(161,276),(144,281),(132,272)],
      [(287,181),(323,190),(328,220),(328,254),(318,262),(304,249),(293,240),(286,224)]
    ]
    table=[(180,-68),(207,-85),(239,-88),(278,-91),(298,-91)]
    def front(x,y,mid):
        for (a,da),(b,db) in zip(table,table[1:]):
            if y<=b:return da+(db-da)*max(0,(y-a)/(b-a))+4*min(1,((x-mid)/36)**2)
        return -90
    for k,poly in enumerate(outlines):
        xmin,xmax=min(x for x,y in poly),max(x for x,y in poly);ymin,ymax=min(y for x,y in poly),max(y for x,y in poly);mid=(xmin+xmax)/2
        fill('hair_bang_'+str(k),(xmin,xmax,-104,0,ymin,ymax),lambda x,d,y:poly_inside(x,y,poly) and front(x,y,mid)<=d<=front(x,y,mid)+21,hair_col)


def cloth_panels():
    result=[]
    # Traced cape half: broad shoulder, ivory lower border and white angular inset.
    for side in (-1,1):
        vv=[];ff=[];cc=[]
        def at(u,v,back=0):
            outer=179-45*v;inner=211+9*v
            x=(1-u)*outer+u*inner-3*math.sin(math.pi*v)*(1-u)
            y=(1-u)*(374+58*v)+u*(379+69*v)
            dep=(1-u)*(-28-11*v)+u*(-46-8*v)-3*math.sin(math.pi*u)+back
            if side==1:x=480-x
            return ((x-240)*S,dep*S,(650-y)*S)
        nx,ny=12,16
        for j in range(ny):
            for i in range(nx):
                u0,u1=i/nx,(i+1)/nx;v0,v1=j/ny,(j+1)/ny;n=len(vv)
                vv.extend([at(u0,v0),at(u1,v0),at(u1,v1),at(u0,v1),at(u0,v0,13),at(u1,v0,13),at(u1,v1,13),at(u0,v1,13)])
                white=j>=ny-3 or j==ny-4 and (i in (2,3,8,9)) or j==ny-3 and i in (4,5,6,7)
                col=COL['cream'] if white else mix(COL['coat'],rgb('ed9c43'),.14+.15*math.sin(math.pi*i/nx))
                for f in [(0,1,2,3),(4,7,6,5)]:ff.append(tuple(n+k for k in (f if side==-1 else f[::-1])));cc.append(col)
                if i==0:ff.append((n,n+3,n+7,n+4));cc.append(col)
                if i==nx-1:ff.append((n+1,n+5,n+6,n+2));cc.append(col)
                if j==0:ff.append((n,n+4,n+5,n+1));cc.append(col)
                if j==ny-1:ff.append((n+3,n+2,n+6,n+7));cc.append(col)
        result.append(colored_mesh('A_mantle_'+str(side),vv,ff,cc))
    return result


def clean_head():
    # Face is inside the hair envelope. Eyes/mouth are set into shallow sockets,
    # never suspended ahead of a protruding face panel.
    verts=[];faces=[];colors=[]
    nx,ny=112,90;hw,hh,r=92,68,13
    def polygon_socket(x,y,poly,amount):
        if not poly_inside(x,y,poly):return 0
        dist=100
        for a,b in zip(poly,poly[1:]+poly[:1]):
            dx,dy=b[0]-a[0],b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
            dist=min(dist,math.hypot(x-a[0]-t*dx,y-a[1]-t*dy))
        t=max(0,min(1,dist/.8));return amount*t*t*(3-2*t)
    def recess(x,y):
        return max(polygon_socket(x,y,EYE_OUTER,1.7),polygon_socket(480-x,y,EYE_OUTER,1.7),polygon_socket(x,y,MOUTH_OUTER,.65))
    for j in range(ny+1):
        y=297-hh+2*hh*j/ny
        rr=r if y>297 else 13
        dy=max(0,abs(y-297)-(hh-rr));width=hw-rr+math.sqrt(max(0,rr*rr-dy*dy))
        for i in range(nx+1):
            x=240-width+2*width*i/nx;depth=face_surface(x,y)+recess(x,y)
            verts.append(((x-240)*S,depth*S,(650-y)*S))
    for j in range(ny):
        for i in range(nx):
            a=j*(nx+1)+i;faces.append((a,a+nx+1,a+nx+2,a+1))
            x=(verts[a][0]+verts[a+1][0])/(2*S)+240;y=650-(verts[a][2]+verts[a+nx+1][2])/(2*S)
            dep=lower_cheek(x,y);tone=0 if dep<.6 else .065 if dep<2.5 else .13 if dep<4.5 else .19
            color=mix(COL['skin'],COL['skin_shadow'],tone)
            if 325<=y<=340 and (155<=x<=180 or 300<=x<=325):
                color=mix(color,COL['blush'],.90)
            colors.append(color)
    boundary=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,ny+1)]+[ny*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(ny-1,0,-1)]
    previous=boundary;front=[verts[i] for i in boundary]
    for band,(depth,sx,sz) in enumerate([(-55.5,1.035,1.014),(-45,1.06,1.014),(32,.92,.92)]):
        ring=[]
        for x,d,z in front:
            py=650-z/S;lower=max(0,min(1,(py-354)/12))
            dd=max(depth,d/S+2.5) if depth<0 else depth
            xx=x*sx;zz=(650-297)*S+(z-(650-297)*S)*sz
            if band<2:
                # One visible chin bevel folds back into an under-jaw surface.
                dd=dd*(1-lower)+(-48 if band==0 else -20)*lower
                xx=x*(sx*(1-lower)+(.96 if band==0 else .80)*lower)
                zz-=lower*(1 if band==0 else 3)*S
            ring.append(len(verts));verts.append((xx,dd*S,zz))
        for k in range(len(ring)):
            q=(k+1)%len(ring);faces.append((previous[k],previous[q],ring[q],ring[k]))
            ymid=650-(front[k][2]+front[q][2])/(2*S)
            lower=max(0,min(1,(ymid-354)/12))
            colors.append(mix(COL['skin'],rgb('c08b65') if band==0 else rgb('ac7650'),lower*(.12 if band==0 else .28)))
        previous=ring
    faces.append(tuple(previous[::-1]));colors.append(COL['skin'])
    ob=colored_mesh('A_head_clean',verts,faces,colors);ob['frontVertexCount']=(nx+1)*(ny+1)
    import bmesh
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    for poly in ob.data.polygons:poly.use_smooth=len(poly.vertices)==4
    return ob



def neck_bridge():
    # Separate continuous mesh: the voxel head placeholder cannot erase this neck.
    vv=[];ff=[];cc=[];steps=16
    rings=[(358,18,25),(370,19,26),(381,18,25),(393,16,20)]
    for y,rx,rd in rings:
        for j in range(steps):
            a=2*math.pi*j/steps
            vv.append((rx*math.cos(a)*S,(-9+rd*math.sin(a))*S,(650-y)*S))
    for k in range(len(rings)-1):
        for j in range(steps):
            q=(j+1)%steps;ff.append((k*steps+j,k*steps+q,(k+1)*steps+q,(k+1)*steps+j))
            cc.append(rgb('bf906a') if k==0 else rgb('b9855f'))
    ff.extend([tuple(range(steps-1,-1,-1)),tuple((len(rings)-1)*steps+j for j in range(steps))]);cc.extend([rgb('b9855f')]*2)
    ob=colored_mesh('A_neck_bridge',vv,ff,cc)
    import bmesh
    bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free()
    for face in ob.data.polygons:face.use_smooth=len(face.vertices)==4
    return ob


def costume_details():
    vv=[];ff=[];cc=[]
    def box_detail(cx,d,cy,w,h,dep,color):
        n=len(vv)
        for xx,dd,yy in [(-1,0,-1),(1,0,-1),(1,0,1),(-1,0,1),(-1,1,-1),(1,1,-1),(1,1,1),(-1,1,1)]:vv.append(((cx+xx*w/2-240)*S,(d+dd*dep)*S,(650-cy-yy*h/2)*S))
        for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]:ff.append(tuple(n+i for i in f));cc.append(color)
    for sign in (-1,1):
        cx=240+sign*43
        for dx in range(-21,23,7):box_detail(cx+dx,-40,547,3.5,1,1,rgb('9d7954'))
        box_detail(cx,-33,602,46,4,2,rgb('8c5930'))
        for dx in (-16,-8,0,8,16):box_detail(cx+dx,-48,638,3,1,1,rgb('b17b4a'))
        box_detail(240+sign*33,-59,406,6,30,2,rgb('78502e'))
    box_detail(278,-51,476,26,9,4,rgb('9b6536'));box_detail(277,-56,481,3,3,2,rgb('c5985b'))
    return colored_mesh('A_costume_details',vv,ff,cc)


def setup():
    global MODEL,MATERIAL
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    MODEL=bpy.data.objects.new('A_reference_form',None);bpy.context.collection.objects.link(MODEL)
    MODEL['stage']='A01 reference-matched navy male, no hat';MODEL['nativeBlocks']=True;MODEL['nativeBlockCell']=CELL*S
    MODEL['reference']='wanderer_A_male_no_hat.png; 1280x720; front/threequarter/back';MODEL['variant']='A'
    MATERIAL=bpy.data.materials.new('A_vertex_palette');MATERIAL.use_nodes=True
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
    cd=bpy.data.cameras.new('A_review_camera');cam=bpy.data.objects.new('A_review_camera',cd);bpy.context.collection.objects.link(cam)
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
        sc.render.filepath=str(ART / ('A_'+name+'.png'));bpy.ops.render.render(write_still=True)
        print('A_RENDER',name,flush=True)
    for nm,pos in light_positions.items():
        ob=bpy.data.objects[nm];ob.location=pos;ob.rotation_euler=(Vector((0,0,1))-pos).to_track_quat('-Z','Y').to_euler()
    # Front face close-up, no perspective enlargement.
    target=Vector((0,.07,1.23));cam.location=target+Vector((0,-6,.42));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.ortho_scale=1.08;sc.render.resolution_x=720;sc.render.resolution_y=720
    sc.render.filepath=str(ART/'A_face.png');bpy.ops.render.render(write_still=True)


def main():
    setup();build_form();objs=voxel_meshes();objs.append(detailed_face());objs.extend(cloth_panels());objs.append(clean_head());objs.append(neck_bridge());objs.append(costume_details())
    import importlib.util
    spec=importlib.util.spec_from_file_location('rig_a',str(Path(__file__).with_name('rig_a.py')));rigmod=importlib.util.module_from_spec(spec);spec.loader.exec_module(rigmod)
    expression_spec=importlib.util.spec_from_file_location('expressions_a',str(Path(__file__).with_name('expressions_a.py')));expressions=importlib.util.module_from_spec(expression_spec);expression_spec.loader.exec_module(expressions)
    faces=expressions.expression_meshes(objs,colored_mesh,face_surface,poly_inside,EYE_OUTER)
    for ob in faces:
        for key in ob.data.shape_keys.key_blocks:key.value=0
    if '--form' in sys.argv:
        arm=None;clips=[];rig_metrics={'stage':'static form review'}
    else:arm,clips,rig_metrics=rigmod.build_rig(objs,MODEL,colored_mesh,expressions,faces)
    objs=rigmod.merge_draw_groups(objs)
    bpy.ops.object.select_all(action='DESELECT')
    MODEL.select_set(True)
    if arm:arm.select_set(True)
    for ob in objs:ob.select_set(True)
    bpy.context.view_layer.objects.active=MODEL
    glb=ART/'wanderer_A.glb'
    bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_anim_slide_to_zero=True,export_force_sampling=True,export_extras=True,export_apply=False)
    metrics={'stage':'A01 original navy male, mint stripe, short hair, dedicated cape and face','voxel_cell_m':CELL*S,'occupied_cells':len(VOX),'objects':len(objs),
      'triangles':sum(len(p.vertices)-2 for o in objs for p in o.data.polygons),'file_bytes':glb.stat().st_size,
      'animations':clips,'rig':rig_metrics, 'face_depth_px':-58,'eye_surface_depth_px':[-57.35,-57.84],'eye_socket_floor_px':-56.3,'cheek_recede_px':[0,1.44,4.8,7.6], 'reference_landmarks':{'crown_y':113,'chin_y':365,'feet_y':651,'head_width_px':274,'face_width_px':184}}
    import shutil
    shutil.copy2(glb,OUT/'wanderer_A.glb')
    (OUT/'metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf8')
    if arm:rigmod.rest_pose(arm)
    cam=setup_render();bpy.ops.wm.save_as_mainfile(filepath=str(ART/'wanderer_A.blend'))
    print('A_METRICS',json.dumps(metrics),flush=True)
    if '--render' in sys.argv:render_views(cam)
    print('A_COMPLETE',flush=True)

if __name__=='__main__':main()
