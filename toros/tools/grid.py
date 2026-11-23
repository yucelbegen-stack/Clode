import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]; n=len(fs); cols=min(4,n); rows=(n+cols-1)//cols
w,h=360,640
g=Image.new('RGB',(w*cols,h*rows))
for i,f in enumerate(fs): g.paste(Image.open(f).convert('RGB').resize((w,h)),((i%cols)*w,(i//cols)*h))
g.save(out)
