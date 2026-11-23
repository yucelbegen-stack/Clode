"""Side-view sprites: clean cutout (no baked shadow), wheel holes, panel-accurate recolor, sedan conversion."""
import numpy as np, json
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi
import importlib.util,sys

OUT='../assets/sprites'
from prep_common import bg_mask, soft_alpha, PAINTS

a=np.asarray(Image.open('../assets/src/side_right.png').convert('RGB')).astype(np.float32)
H,W=a.shape[:2]; yy,xx=np.mgrid[0:H,0:W]
WHEELS=[(440.0,697.0),(1413.0,697.0)]; RT=114.0
inwheel=np.zeros((H,W),bool)
for cx,cy in WHEELS: inwheel|=((xx-cx)**2+(yy-cy)**2)<=RT**2

def cutout(img):
    bg=bg_mask(img)
    car=~bg
    car&=~((yy>728)&~inwheel)          # baked ground shadow removed
    lab,n=ndi.label(car); sz=ndi.sum(car,lab,range(1,n+1)); car=lab==(1+np.argmax(sz))
    return car

def paint_mask(img,car,excl):
    lum=img.mean(-1); mx=img.max(-1); mn=img.min(-1); s=(mx-mn)/np.maximum(mx,1)
    light=(lum>125)&(s<0.32)&car&(excl==0)
    lab,n=ndi.label(light); sz=ndi.sum(light,lab,range(1,n+1))
    objs=ndi.find_objects(lab)
    GLASS=[(195,270,560,440),(520,270,830,440),(855,270,1140,445)]
    def in_glass(sl):
        y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
        return any(x0>=gx0 and x1<=gx1 and y0>=gy0 and y1<=gy1 for gx0,gy0,gx1,gy1 in GLASS)
    big=np.isin(lab,[i+1 for i,z in enumerate(sz) if z>1200 and not in_glass(objs[i])])
    # soften into the dark outlines so edges blend
    w=ndi.gaussian_filter(big.astype(np.float32),0.7)
    w*=np.clip((lum-70)/60,0,1)
    return np.clip(w,0,1)

def recolor(img,m,col):
    if col is None: return img.copy()
    lum=img.mean(-1,keepdims=True)
    shade=np.clip(lum/238.0,0,1.1)
    c=np.array(col,np.float32)[None,None,:]
    dark=c.mean()<60
    base=c*(shade**(1.5 if dark else 1.2))
    if dark: base=base+ (shade>0.97)*0+ np.clip(shade-0.93,0,1)*600   # gloss on black
    else: base=base+np.clip(shade-0.99,0,1)*400
    return img*(1-m[...,None])+np.clip(base,0,255)*m[...,None]

def excl_mask():
    e=np.zeros((H,W),np.float32)
    e[:243,:]=1                    # roof rack
    e[520:600,1660:1712]=1         # headlight lenses
    return e

# ------------- sedan surgery -------------
SS=4
S_CURVE=[(612,246),(586,256),(556,276),(522,312),(490,352),(462,388),(438,414),(414,428),(300,434),(180,438),(112,442),(104,448)]
def poly_mask(pts):
    im=Image.new('L',(W*SS,H*SS),0); ImageDraw.Draw(im).polygon([(x*SS,y*SS) for x,y in pts],fill=255)
    return np.asarray(im.resize((W,H),Image.LANCZOS)).astype(np.float32)/255
def make_sedan(img,car):
    img=img.copy()
    remove=poly_mask([(0,0),(612,0)]+S_CURVE+[(104,448),(0,448)])
    rack=((yy<244)&(xx>200)&(xx<1000)).astype(np.float32)
    fillpoly=S_CURVE+[(104,452),(526,447),(526,435),(529,428),(588,280),(596,268),(606,258)]
    fill=poly_mask(fillpoly)
    # paint texture for the new C-pillar / trunk: per-column colour from body just below beltline
    patch=img[470:492,150:460].reshape(-1,3)
    base=np.median(patch,axis=0)
    tex=np.broadcast_to(base,(H,W,3)).copy()
    grad=(1.0+np.clip((447-yy)/180,0,1)*0.035-np.clip((xx-300)/300,0,1)*0.02)[...,None]
    rng=np.random.default_rng(3); noise=ndi.gaussian_filter(rng.normal(0,1.6,(H,W)),0.8)[...,None]
    tex=np.clip(tex*grad+noise,0,255)
    img=img*(1-fill[...,None])+tex*fill[...,None]
    alpha=car.astype(np.float32)
    alpha=np.maximum(alpha*(1-remove),fill)*(1-rack)
    # outlines
    lay=Image.new('RGBA',(W*SS,H*SS),(0,0,0,0)); d=ImageDraw.Draw(lay)
    P=lambda pts:[(x*SS,y*SS) for x,y in pts]
    ln=(36,32,28,255)
    d.line(P([(930,244),(612,245)]+S_CURVE[1:]+[(100,460)]),fill=ln,width=int(3.2*SS),joint='curve')
    # rear screen seen edge-on: dark glass sliver hugging the slope
    glass=[(600,252),(582,262),(552,282),(519,318),(488,357),(460,392),(442,410),(452,411),(470,395),(498,360),(530,322),(562,288),(592,268),(606,258)]
    d.polygon(P(glass),fill=(64,60,54,235))
    d.line(P([(438,415),(452,412)]),fill=ln,width=2*SS)
    # trunk shut-line + deck crease
    d.line(P([(430,430),(424,452)]),fill=(60,56,50,255),width=int(1.6*SS))
    d.line(P([(410,440),(100,450)]),fill=(90,86,80,140),width=int(1.0*SS))
    # rear-door window frame (rear edge) redrawn crisp
    d.line(P([(527,434),(589,276),(600,266)]),fill=ln,width=int(4*SS))
    lay=np.asarray(lay.resize((W,H),Image.LANCZOS)).astype(np.float32)
    la=lay[...,3:4]/255
    img=img*(1-la)+lay[...,:3]*la
    alpha=np.maximum(alpha,la[...,0]*(alpha>0.01))
    return img,alpha

car=cutout(a)
for cx,cy in WHEELS:                     # wheel holes (wheels are separate, spinning sprites)
    car&=~(((xx-cx)**2+(yy-cy)**2)<=(RT-2)**2)
excl=excl_mask()
pm=paint_mask(a,car,excl)
bbox=(60,200,1745,815)
def save(name,img,al):
    al=ndi.gaussian_filter(al.astype(np.float32),0.6)
    rgba=np.dstack([np.clip(img,0,255),np.clip(al*255,0,255)]).astype(np.uint8)
    Image.fromarray(rgba,'RGBA').crop(bbox).save(f'{OUT}/{name}.png')
st_alpha=car.astype(np.float32)
sed_img,sed_alpha=make_sedan(a,car)
pm_s=paint_mask(sed_img,sed_alpha>0.5,excl)
for nm,col in PAINTS.items():
    save(f'side_station_{nm}',recolor(a,pm,col),st_alpha)
    save(f'side_sedan_{nm}',recolor(sed_img,pm_s,col),sed_alpha)
meta=json.load(open(f'{OUT}/meta.json')) if False else {}
meta['side']={'crop':bbox,'wheels':[[x-bbox[0],y-bbox[1]] for x,y in WHEELS],'rTire':RT,
  'ground':WHEELS[0][1]+RT-bbox[1],'pxPerM':1665/4.40,'w':bbox[2]-bbox[0],'h':bbox[3]-bbox[1]}
json.dump(meta,open(f'{OUT}/side_meta.json','w'),indent=1)
print(meta)
