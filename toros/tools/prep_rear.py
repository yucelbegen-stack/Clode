"""Rear-view Toros (station) cutout in several paints, shadows removed."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from prep_common import bg_mask
a=np.asarray(Image.open('../assets/src/rear.png').convert('RGB')).astype(np.float32)
H,W=a.shape[:2]; yy,xx=np.mgrid[0:H,0:W]
r_,g_,b_=a[...,0],a[...,1],a[...,2]; s0=(a.max(-1)-a.min(-1))/np.maximum(a.max(-1),1)
orange=(s0>0.28)&(r_>=g_-3)&((r_-b_)>40)
lb,nb=ndi.label(orange); border=set(np.unique(np.concatenate([lb[0],lb[-1],lb[:,0],lb[:,-1]])))-{0}
szb=ndi.sum(orange,lb,range(1,nb+1)); cob=ndi.center_of_mass(orange,lb,range(1,nb+1))
def is_lamp(c): return 440<=c[0]<=640 and (c[1]<540 or c[1]>1240)
bgids=[i+1 for i in range(nb) if (i+1) in border or (szb[i]>2500 and not is_lamp(cob[i]))]
bg=np.isin(lb,bgids); car=~bg
lum=a.mean(-1); mx=a.max(-1); mn=a.min(-1); s=(mx-mn)/np.maximum(mx,1)
warm=(a[...,0]-a[...,2])>12
# baked shadow under the car: warm & darker band below bumper, outside the two tyres
tyre=((xx>440)&(xx<585))|((xx>1190)&(xx<1342))
car&=~((yy>812)&~tyre)
car&=~((yy>866))
lab,n=ndi.label(car); sz=ndi.sum(car,lab,range(1,n+1)); car=lab==(1+np.argmax(sz))
light=(lum>125)&(s<0.30)&car
lab,n=ndi.label(light); sz=ndi.sum(light,lab,range(1,n+1)); objs=ndi.find_objects(lab)
keep=[]
for i,z in enumerate(sz):
    sl=objs[i]; y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
    inglass = x0>=545 and x1<=1235 and y0>=135 and y1<=385      # rear screen reflections
    plate = x0>=700 and x1<=1070 and y0>=480 and y1<=590
    lamps = (y0>=440 and y1<=630 and (x1<=520 or x0>=1255))
    if z>1500 and not (inglass or plate or lamps): keep.append(i+1)
pm=ndi.gaussian_filter(np.isin(lab,keep).astype(np.float32),0.7)*np.clip((lum-70)/60,0,1)
def recolor(col):
    if col is None: return a
    L=a.mean(-1,keepdims=True); shade=np.clip(L/236,0,1.1); c=np.array(col,np.float32)
    base=c*shade**1.2+np.clip(shade-0.99,0,1)*400
    return a*(1-pm[...,None])+np.clip(base,0,255)*pm[...,None]
al=ndi.gaussian_filter(car.astype(np.float32),0.6)
ys,xs=np.nonzero(car); bb=(int(xs.min())-4,int(ys.min())-4,int(xs.max())+5,int(ys.max())+5)
for nm,col in [('white',None),('blue',(34,74,150)),('red',(176,32,30)),('green',(36,104,64))]:
    Image.fromarray(np.dstack([np.clip(recolor(col),0,255),al*255]).astype(np.uint8),'RGBA').crop(bb).save(f'../assets/sprites/rear_{nm}.png')
print(bb)
