"""Turn the reference illustrations into clean sprites:
 - remove orange paper background AND the baked ground shadows
 - split wheels out of the side views so they can spin
 - recolor body paint, derive sedan from station."""
import numpy as np, json, os
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
SRC='assets/src'; OUT='assets/sprites'; os.makedirs(OUT,exist_ok=True)

def load(n): return np.asarray(Image.open(f'{SRC}/{n}.png').convert('RGB')).astype(np.float32)

def bg_mask(a):
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); s=(mx-mn)/np.maximum(mx,1)
    orange=(s>0.28)&(r>=g-3)&((r-b)>40)
    lab,n=ndi.label(orange)
    sizes=ndi.sum(orange,lab,range(1,n+1))
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    keep=[i+1 for i,sz in enumerate(sizes) if sz>2500 or (i+1) in border]
    return np.isin(lab,keep)

def shadow_mask(a,bg):
    """baked ground shadow = dark, warm pixels connected to the background, below the body"""
    r,g,b=a[...,0],a[...,1],a[...,2]
    lum=a.mean(-1)
    warm=(r-b)>12
    return warm&(lum<200)

def soft_alpha(m,grow=0):
    m=m.astype(np.float32)
    im=Image.fromarray((m*255).astype(np.uint8))
    if grow<0: im=im.filter(ImageFilter.MinFilter(3))
    im=im.filter(ImageFilter.GaussianBlur(0.8))
    return np.asarray(im).astype(np.float32)/255

def save_rgba(a,alpha,path,crop=None):
    rgba=np.dstack([np.clip(a,0,255),np.clip(alpha*255,0,255)]).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA')
    if crop: im=im.crop(crop)
    im.save(path); return im

# ---------- paint recolor ----------
PAINTS={
 'white':None,
 'red':(176,32,30),
 'green':(36,104,64),
 'blue':(34,74,150),
 'black':(30,32,36),
 'taxi':(246,190,16),
 'police':None,   # white base, decals in renderer
}
def paint_mask(a,extra_exclude=None):
    lum=a.mean(-1); mx=a.max(-1); mn=a.min(-1); s=(mx-mn)/np.maximum(mx,1)
    m=np.clip((lum-150)/40,0,1)*np.clip((0.16-s)/0.06,0,1)
    if extra_exclude is not None: m=m*(1-extra_exclude)
    return m
def recolor(a,m,col):
    if col is None: return a.copy()
    lum=a.mean(-1,keepdims=True)
    shade=np.clip(lum/236.0,0,1.15)
    c=np.array(col,np.float32)[None,None,:]
    dark=c.mean()<60
    base=c*(shade**(1.6 if dark else 1.25))
    spec=np.clip(shade-0.985,0,1)*(900 if dark else 500)   # keep glossy highlights
    out=base+spec
    if dark: out=out+ (1-shade)*0  # deep shadow stays dark
    return a*(1-m[...,None])+out*m[...,None]

meta={}
# ================= SIDE VIEW (front on the right) =================
a=load('side_right'); H,W=a.shape[:2]
WHEELS=[(440.0,697.0),(1413.0,697.0)]; RT=114.0; RH=77.0
bg=bg_mask(a)
yy,xx=np.mgrid[0:H,0:W]
inwheel=np.zeros((H,W),bool)
for cx,cy in WHEELS: inwheel|=((xx-cx)**2+(yy-cy)**2)<=RT**2
# body bottom: below y=735 only wheels exist; shadow removed
car=(~bg)
car&=~((yy>728)&~inwheel)
# remove the ground shadow band hugging rear/front bumpers lower edges
lab,n=ndi.label(car); sz=ndi.sum(car,lab,range(1,n+1)); car=lab==(1+np.argmax(sz))
car=ndi.binary_fill_holes(car)&~(bg)
lab,n=ndi.label(car); sz=ndi.sum(car,lab,range(1,n+1)); car=lab==(1+np.argmax(sz))
alpha=soft_alpha(car)
# wheels -> separate sprite (rear wheel used for both; it is the cleaner one)
cx,cy=WHEELS[0]; R=int(RT)+2
wd=a[int(cy)-R:int(cy)+R+1,int(cx)-R:int(cx)+R+1].copy()
wy,wx=np.mgrid[-R:R+1,-R:R+1]; rr=np.sqrt(wx**2+wy**2)
walpha=np.clip(RT+0.5-rr,0,1)
# make the tire radially uniform-lit so rotation looks natural: blend tire ring toward its radial mean
tire=(rr>RH+6)&(rr<=RT)
rb=np.round(rr).astype(int); lum=wd.mean(-1)
for ch in range(3):
    s=ndi.mean(wd[...,ch],labels=rb,index=np.arange(rb.max()+1))
    radial=s[rb]
    k=np.where(tire,0.55,0.0)
    wd[...,ch]=wd[...,ch]*(1-k)+radial*k
# bottom of tire touched baked shadow: rebuild lowest 25deg sector from mirrored top-left? simpler: darken uniformly already handled
Image.fromarray(np.dstack([wd,walpha*255]).astype(np.uint8),'RGBA').save(f'{OUT}/wheel.png')
# body without wheels: cut wheel discs (a hair smaller so no seam)
for wcx,wcy in WHEELS:
    hole=((xx-wcx)**2+(yy-wcy)**2)<=(RT-1.5)**2
    alpha[hole]=0
# behind-wheel dark well (drawn under the wheel so rim edge never shows paper)
excl=np.zeros((H,W),np.float32)
excl[:258,:]=1            # roof rack stays silver
excl[515:600,1650:1730]=1 # headlights
pm=paint_mask(a,excl)
bbox=(60,195,1740,815)
def stamp(name,img,al):
    save_rgba(img,al,f'{OUT}/{name}.png',crop=bbox)
for nm,col in PAINTS.items():
    stamp(f'side_station_{nm}',recolor(a,pm,col),alpha)
meta['side']={'crop':bbox,'wheels':[[x-bbox[0],y-bbox[1]] for x,y in WHEELS],'rTire':RT,'rHub':RH,
  'ground':WHEELS[0][1]+RT-bbox[1],'pxPerM':1665/4.40,'w':bbox[2]-bbox[0],'h':bbox[3]-bbox[1]}

# ---------- SEDAN (body surgery on the station) ----------
SS=3
def sedan_overlay():
    """returns (remove_mask, paint RGBA layer) at full res"""
    w,h=W*SS,H*SS
    rem=Image.new('L',(w,h),0); dr=ImageDraw.Draw(rem)
    # everything above the sedan silhouette behind the rear door window goes
    roof_end=(600,262); trunk_lip=(372,428); tail_top=(82,446)
    sil=[(0,0),(620,0),(620,246),roof_end,(540,300),(470,352),(420,395),trunk_lip,(220,434),tail_top,(60,452),(0,452)]
    dr.polygon([(x*SS,y*SS) for x,y in sil],fill=255)
    rem=np.asarray(rem.resize((W,H),Image.LANCZOS)).astype(np.float32)/255
    # paint layer: C-pillar + trunk + rear glass edge, drawn supersampled
    lay=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(lay)
    P=lambda pts:[(x*SS,y*SS) for x,y in pts]
    body=(240,236,228,255); line=(38,34,30,255)
    # C pillar & trunk deck panel
    cp=[(600,262),(540,300),(470,352),(420,395),(372,428),(220,434),(82,446),(80,470),(560,470),(560,268)]
    d.polygon(P(cp),fill=body)
    # rear screen seen edge-on: dark glass sliver along the slope
    gl=[(596,270),(540,306),(472,356),(428,394),(442,396),(486,360),(548,314),(600,282)]
    d.polygon(P(gl),fill=(70,66,60,255))
    # outline of new silhouette
    d.line(P([(640,258),(600,262),(540,300),(470,352),(420,395),(372,428),(220,434),(82,446)]),fill=line,width=4*SS,joint='curve')
    # trunk shut line
    d.line(P([(392,436),(388,470)]),fill=line,width=2*SS)
    d.line(P([(372,432),(100,446)]),fill=(170,165,158,255),width=1*SS)
    lay=lay.resize((W,H),Image.LANCZOS)
    return rem,np.asarray(lay).astype(np.float32)
rem,lay=sedan_overlay()
# keep only the region left of the rear door window frame for surgery
salpha=alpha*(1-rem)
la=lay[...,3:4]/255
def sedan_img(img):
    return img*(1-la)+lay[...,:3]*la
salpha=np.maximum(salpha,lay[...,3]/255*(yy<480))
# station rear window pillar between window 2 and old cargo window must be closed: cover old cargo area under rem already
pm_s=np.maximum(pm*(1-rem),(lay[...,3]/255)*(np.abs(lay[...,:3].mean(-1)-235)<8))
base_s=sedan_img(a)
for nm,col in PAINTS.items():
    stamp(f'side_sedan_{nm}',recolor(base_s,pm_s,col),salpha)

# ================= FRONT / REAR / 3-4 views (cutouts, shadows removed) =================
def cut_simple(name,ground_cut=None,paint_excl=None,colors=('white',)):
    a=load(name); H,W=a.shape[:2]
    bg=bg_mask(a)
    car=~bg
    yy,xx=np.mgrid[0:H,0:W]
    sh=shadow_mask(a,bg)
    if ground_cut is not None:
        car&=~(sh&(ground_cut(xx,yy)))
    lab,n=ndi.label(car); sz=ndi.sum(car,lab,range(1,n+1)); car=lab==(1+np.argmax(sz))
    car=ndi.binary_opening(car,iterations=1)
    al=soft_alpha(car)
    ys,xs=np.nonzero(car); bb=(xs.min()-4,ys.min()-4,xs.max()+5,ys.max()+5)
    ex=np.zeros((H,W),np.float32)
    if paint_excl:
        for x0,y0,x1,y1 in paint_excl: ex[y0:y1,x0:x1]=1
    pm=paint_mask(a,ex)
    for c in colors:
        save_rgba(recolor(a,pm,PAINTS[c]),al,f'{OUT}/{name}_{c}.png',crop=bb)
    meta[name]={'crop':bb,'w':bb[2]-bb[0],'h':bb[3]-bb[1]}
allc=tuple(PAINTS.keys())
# front: shadow lies below the bumper between/around tyres
cut_simple('front',lambda x,y:(y>900),[(280,520,500,650),(1020,520,1240,650),(0,0,1536,150)],('white',))
cut_simple('rear',lambda x,y:(y>810),[(420,450,520,620),(1270,450,1350,620),(560,0,1220,95)],('white',))
json.dump(meta,open(f'{OUT}/meta.json','w'),indent=1,default=float)
print(json.dumps(meta))
