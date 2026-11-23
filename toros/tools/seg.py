import numpy as np, sys
from PIL import Image
from scipy import ndimage as ndi
def seg(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    r,g,b=a[...,0],a[...,1],a[...,2]
    mx=a.max(-1); mn=a.min(-1); s=(mx-mn)/np.maximum(mx,1)
    orange=(s>0.30)&(r>=g)&(g>=b-5)&((r-b)>45)
    lab,n=ndi.label(orange)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    car=~bg
    car=ndi.binary_fill_holes(car)
    # keep biggest component
    lab2,n2=ndi.label(car); sizes=ndi.sum(car,lab2,range(1,n2+1)); car=lab2==(1+np.argmax(sizes))
    return a,car,s
if __name__=='__main__':
    a,car,s=seg(sys.argv[1])
    out=a.copy(); out[~car]=[0,255,0]
    Image.fromarray(out.astype(np.uint8)).save(sys.argv[2])
