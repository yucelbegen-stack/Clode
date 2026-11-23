import numpy as np, sys
from PIL import Image
def fit_circle(pts):
    x,y=pts[:,0],pts[:,1]
    A=np.c_[2*x,2*y,np.ones(len(x))]; b=x*x+y*y
    c=np.linalg.lstsq(A,b,rcond=None)[0]; r=np.sqrt(c[2]+c[0]**2+c[1]**2)
    return c[0],c[1],r
def fit(path,cx,cy):
    a=np.asarray(Image.open(path).convert('RGB')).astype(float)
    lum=a.mean(-1); sat=(a.max(-1)-a.min(-1))
    hub=[];tire=[]
    for th in np.linspace(0,2*np.pi,360,endpoint=False):
        # hubcap: march outward from r=40, last light pixel before long dark run
        last=None
        for r in np.arange(30,130,0.5):
            x=cx+r*np.cos(th); y=cy+r*np.sin(th)
            if lum[int(y),int(x)]>140: last=r
            elif last and r-last>8: break
        if last: hub.append((cx+last*np.cos(th),cy+last*np.sin(th)))
        if np.sin(th)>0.2 or abs(np.cos(th))>0.8:  # lower half & sides: tire vs orange bg
            for r in np.arange(90,140,0.5):
                x=cx+r*np.cos(th); y=cy+r*np.sin(th)
                p=a[int(y),int(x)]
                if p[0]-p[2]>45 and p[0]>120: tire.append((x,y)); break
    h=fit_circle(np.array(hub)); t=fit_circle(np.array(tire)) if len(tire)>20 else None
    return h,t,len(tire)
if __name__=='__main__':
    p=sys.argv[1]
    for cx,cy in [(float(sys.argv[2]),float(sys.argv[3])),(float(sys.argv[4]),float(sys.argv[5]))]:
        print(fit(p,cx,cy))
