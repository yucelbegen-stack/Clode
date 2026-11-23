"""Remove leftover paper (yellow/orange) pixels from sprites: roof-rack gaps and tyre-bottom shadow bits."""
import numpy as np, glob
from PIL import Image
from scipy import ndimage as ndi
def paper(rgb):
    s=(rgb.max(-1)-rgb.min(-1))/np.maximum(rgb.max(-1),1)
    return (s>0.22)&((rgb[...,0]-rgb[...,2])>38)&(rgb.mean(-1)>140)
for f in sorted(glob.glob('assets/sprites/side_station_*.png')):
    a=np.asarray(Image.open(f)).astype(np.float32); rgb=a[...,:3]
    m=paper(rgb); m[60:]=False                                # only the roof-rack zone
    m=ndi.binary_dilation(m,iterations=2)&(rgb.mean(-1)>120)  # include anti-aliased fringe
    a[...,3][m]=0
    Image.fromarray(a.astype(np.uint8),'RGBA').save(f)
for f in sorted(glob.glob('assets/sprites/rear_*.png')):
    a=np.asarray(Image.open(f)).astype(np.float32); rgb=a[...,:3]; H,W=a.shape[:2]
    m=paper(rgb); m[45:]=False
    m=ndi.binary_dilation(m,iterations=2)&(rgb.mean(-1)>120); a[...,3][m]=0
    yy,xx=np.mgrid[0:H,0:W]
    tyre=((xx>38)&(xx<190))|((xx>788)&(xx<946))
    a[...,3][(yy>H-70)&~tyre]=0                              # shadow bits beside the tyres
    Image.fromarray(a.astype(np.uint8),'RGBA').save(f)
print('cleaned')
