import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
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
 'orange':(214,104,32),
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

