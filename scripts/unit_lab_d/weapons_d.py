"""D07: exposed-face voxel weapons, cream / teal / orange only."""
from mathutils import Vector
import math

CREAM='f4e5c7';MINT='338f89';TEAL='216a66';ORANGE='d77e2d';DARK='34372d'

def make_weapon(name,M,make_mesh):
    pistol=name in ('gun','gunL')
    step=.016 if pistol else .024
    cells={}
    def box(x0,x1,y0,y1,z0,z1,color):
        for i in range(round(x0/step),round(x1/step)):
            for j in range(round(y0/step),round(y1/step)):
                for k in range(round(z0/step),round(z1/step)):cells[i,j,k]=color
    def ring(y0,y1,outer,inner,z,color):
        box(-outer,-inner,y0,y1,z-outer,z+outer,color);box(inner,outer,y0,y1,z-outer,z+outer,color)
        box(-inner,inner,y0,y1,z-outer,z-inner,color);box(-inner,inner,y0,y1,z+inner,z+outer,color)
    if pistol:
        # Short L silhouette, hollow square muzzle, ivory grip and mint trigger guard.
        ring(-.048,.176,.064,.032,.096,CREAM)
        box(-.064,.064,-.064,-.032,.032,.160,MINT)
        box(-.064,.064,-.080,-.064,.048,.144,ORANGE)
        ring(.144,.160,.064,.032,.096,ORANGE)
        ring(.160,.192,.064,.032,.096,CREAM)
        box(-.032,.032,-.048,.016,-.112,.048,CREAM)
        box(-.048,.048,-.064,.032,-.112,-.080,MINT)
        box(-.048,.048,-.064,.032,-.128,-.112,ORANGE)
        box(-.032,.032,.016,.080,-.048,-.032,TEAL)
        box(-.032,.032,.064,.080,-.032,.064,TEAL)
        box(-.016,.016,.016,.032,-.016,.048,ORANGE)
        box(-.032,.032,-.064,-.016,.160,.176,MINT)
        box(-.016,.016,.128,.144,.160,.192,ORANGE)
        # Far barrel wall closes the handgun breech; muzzle still visibly recessed.
        box(-.032,.032,-.048,-.032,.064,.128,DARK)
        kind='cube_pistol';front=(0,.192,.096);back=None;support=None
    elif name=='rifle':
        # 22 -> 29 longitudinal cells: +31.8%, with unchanged cubic cells and grip.
        # Keep the square tunnel open at both ends.
        ring(-.168,.480,.120,.072,.144,CREAM)
        for a,b in [(-.168,-.120),(.336,.384)]:ring(a,b,.144,.072,.144,MINT)
        ring(.432,.456,.144,.072,.144,ORANGE)
        ring(.456,.504,.144,.072,.144,CREAM)
        ring(-.192,-.168,.144,.072,.144,CREAM)
        # Orange side brackets and square sight, offset support handle toward second hand.
        box(-.144,-.120,.024,.096,.048,.240,ORANGE);box(.120,.144,.024,.096,.048,.240,ORANGE)
        box(-.048,.048,-.024,.072,-.120,.048,CREAM)
        box(-.048,.048,-.024,.072,-.120,-.096,ORANGE)
        box(-.072,.072,-.048,.096,-.096,-.072,TEAL)
        box(-.024,.024,.096,.192,-.024,0,MINT);box(-.024,.024,.168,.192,0,.048,MINT)
        box(.096,.144,0,.048,-.024,.048,TEAL)
        box(-.048,.048,.192,.264,.264,.288,ORANGE)
        kind='short_square_tunnel_bazooka';front=(0,.504,.144);back=(0,-.192,.144);support=(.12,.024,.012)
    else:
        box(-.048,.048,-.048,.048,-.012,.084,MINT);box(-.048,.048,-.012,.012,-.012,.084,CREAM);box(-.024,.024,-.024,.024,.084,.108,ORANGE)
        kind='purifier';front=None;back=None;support=None
    verts=[];faces=[];colors=[]
    fs=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)]),((-1,0,0),[(0,0,0),(0,0,1),(0,1,1),(0,1,0)]),((0,1,0),[(0,1,0),(0,1,1),(1,1,1),(1,1,0)]),((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)]),((0,0,1),[(0,0,1),(1,0,1),(1,1,1),(0,1,1)]),((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)])]
    for (i,j,k),color in cells.items():
        for (dx,dy,dz),corners in fs:
            if (i+dx,j+dy,k+dz) in cells:continue
            n=len(verts);verts.extend([tuple(M@Vector(((i+x)*step,(j+y)*step,(k+z)*step))) for x,y,z in corners]);faces.append(tuple(range(n,n+4)))
            factor=1+(((i*73+j*17+k*43)%5)-2)*.004
            colors.append(tuple(round(int(color[a:a+2],16)*factor) for a in (0,2,4)))
    ob=make_mesh('D_prop_'+name,verts,faces,colors)
    ob['weaponStyle']=kind;ob['blockCell']=step;ob['gripLocal']=[0,0,0]
    if front:ob['muzzleLocal']=list(front)
    if back:ob['rearOpeningLocal']=list(back)
    if support:ob['supportLocal']=list(support)
    ob['cells']=len(cells)
    if name=='rifle':ob['barrelLengthM']=.696;ob['lengthRatioD06']=29/22
    return ob
