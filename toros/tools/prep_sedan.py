"""Real Renault 12 sedan reference -> sprites (facing right), clean bg/shadow, tinted glass, spinning steel wheel."""
import numpy as np, json
from PIL import Image
from scipy import ndimage as ndi
from prep_common import PAINTS
OUT='../assets/sprites'
a=np.asarray(Image.open('../assets/src/sedan_right.png').convert('RGB')).astype(np.float32)
H,W=a.shape[:2]; yy,xx=np.mgrid[0:H,0:W]
r,g,b=a[...,0],a[...,1],a[...,2]; mx=a.max(-1); mn=a.min(-1); s=(mx-mn)/np.maximum(mx,1); lum=a.mean(-1)
paper=(s>0.12)&((r-b)>28)&(lum>150)
lab,n=ndi.label(paper)
border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
bg=np.isin(lab,list(border))
WHEELS=[(441.5,710.5),(1381.0,710.0)]; RT=121.5
inwheel=np.zeros((H,W),bool)
for cx,cy in WHEELS: inwheel|=((xx-cx)**2+(yy-cy)**2)<=RT**2
car=~bg
car&=~((yy>736)&~inwheel)
lab2,n2=ndi.label(car); sz=ndi.sum(car,lab2,range(1,n2+1)); car=lab2==(1+np.argmax(sz))
# glass = enclosed paper-coloured regions inside the car -> smoky glass like the Toros sprites
enc=paper&~bg&car
lg,ng=ndi.label(enc); szg=ndi.sum(enc,lg,range(1,ng+1)); cyg=ndi.center_of_mass(enc,lg,range(1,ng+1))
glass_ids=[i+1 for i in range(ng) if szg[i]>3000 and cyg[i][0]<480]
glass=np.isin(lg,glass_ids)
holes=enc&~glass                      # paper seen through gaps (under bumpers etc.) -> transparent
glass=ndi.binary_dilation(glass,iterations=1)&car&(lum>120)
gl=lum[...,None]
tint=np.array([78,74,68],np.float32)*(0.75+0.55*(gl/235.0)**3)
streak=np.clip((gl-205)/40,0,1)*55
a2=a.copy()
gw=ndi.gaussian_filter(glass.astype(np.float32),0.6)[...,None]
a2=a2*(1-gw)+(tint+streak)*gw
# paint mask: large grey panels, not chrome (very bright) nor dark trims
lum2=a2.mean(-1); s2=(a2.max(-1)-a2.min(-1))/np.maximum(a2.max(-1),1)
panel=(((lum2>80)&(lum2<205)&(s2<0.14))|ndi.binary_dilation(holes,iterations=2))&car&~glass&~inwheel
lab3,n3=ndi.label(panel); sz3=ndi.sum(panel,lab3,range(1,n3+1))
big=np.isin(lab3,[i+1 for i,z in enumerate(sz3) if z>1500])
pm=ndi.gaussian_filter(big.astype(np.float32),0.7)*np.clip((lum2-62)/26,0,1)*np.clip((222-lum2)/22,0,1)
REF=168.0
def recolor(img,col):
    if col is None: col=(236,232,222)    # 'white' sedan
    L=img.mean(-1,keepdims=True); shade=np.clip(L/REF,0,1.35)
    c=np.array(col,np.float32)[None,None,:]; dark=c.mean()<60
    base=c*(shade**(1.5 if dark else 1.15))
    base+=np.clip(shade-1.08,0,1)*(500 if dark else 260)
    return img*(1-pm[...,None])+np.clip(base,0,255)*pm[...,None]
# wheel holes + wheel sprite (rear wheel, made concentric around fitted centre)
alpha=car.astype(np.float32)
for cx,cy in WHEELS: alpha[((xx-cx)**2+(yy-cy)**2)<=(RT-2)**2]=0
cx,cy=WHEELS[0]; N=2*int(RT+4); c0=N/2
wy,wx=np.mgrid[0:N,0:N].astype(np.float32); X=cx+(wx-c0); Y=cy+(wy-c0); rr=np.hypot(wx-c0,wy-c0)
wimg=np.dstack([ndi.map_coordinates(a[...,k],[Y,X],order=1) for k in range(3)]+[np.clip(RT+0.5-rr,0,1)*255])
Image.fromarray(np.clip(wimg,0,255).astype(np.uint8),'RGBA').save(f'{OUT}/wheel_sedan.png')
ys,xs=np.nonzero(car); bbox=(int(xs.min())-4,int(ys.min())-4,int(xs.max())+5,int(ys.max())+5)
al=ndi.gaussian_filter(alpha,0.6)
for nm,col in PAINTS.items():
    if nm=='white': col=(236,232,222)
    if nm=='police': col=(236,232,222)
    rgba=np.dstack([np.clip(recolor(a2,col),0,255),np.clip(al*255,0,255)]).astype(np.uint8)
    Image.fromarray(rgba,'RGBA').crop(bbox).save(f'{OUT}/side_sedan_{nm}.png')
m=json.load(open(f'{OUT}/side_meta.json'))
m['sedan']={'crop':bbox,'wheels':[[x-bbox[0],y-bbox[1]] for x,y in WHEELS],'rTire':RT,'ground':WHEELS[0][1]+RT-bbox[1],
  'pxPerM':(bbox[2]-bbox[0])/4.35,'w':bbox[2]-bbox[0],'h':bbox[3]-bbox[1]}
json.dump(m,open(f'{OUT}/side_meta.json','w'),indent=1)
print(m['sedan'])
