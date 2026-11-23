"""Cut subjects off a flat light-grey background (GPT renders), split into components."""
import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
def cut(src, outs):
    a=np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    H,W=a.shape[:2]
    bgc=np.median(np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]),0)
    d=np.sqrt(((a-bgc)**2).sum(-1))
    near=d<16
    lab,n=ndi.label(near); border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    fg=~bg; fg=ndi.binary_opening(fg,iterations=1)
    # soft edge from colour distance
    al=np.clip((d-8)/14,0,1); al=np.where(fg,np.maximum(al,ndi.binary_erosion(fg,iterations=2)),0)
    al=ndi.gaussian_filter(al,0.6)
    # de-fringe: unmix grey bg from edge pixels
    A=np.clip(al,0.05,1)[...,None]; rgb=np.clip((a-bgc*(1-A))/A,0,255)
    lab2,n2=ndi.label(fg); sz=ndi.sum(fg,lab2,range(1,n2+1)); objs=ndi.find_objects(lab2)
    big=[i for i in np.argsort(-sz) if sz[i]>2000][:len(outs)]
    big=sorted(big,key=lambda i:objs[i][1].start)
    for o,i in zip(outs,big):
        sl=objs[i]; y0,y1,x0,x1=sl[0].start,sl[0].stop,sl[1].start,sl[1].stop
        m=(lab2==i+1); m=ndi.binary_dilation(m,iterations=3)
        rgba=np.dstack([rgb,al*m*255]).astype(np.uint8)[max(0,y0-6):y1+6,max(0,x0-6):x1+6]
        Image.fromarray(rgba,'RGBA').save(o); print(o,rgba.shape)
if __name__=='__main__': cut(sys.argv[1],sys.argv[2:])
