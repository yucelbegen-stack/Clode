import sys
from PIL import Image
files=sys.argv[2:]; cols=2
ims=[Image.open(f) for f in files]
w=max(i.width for i in ims)//2; h=max(i.height for i in ims)//2
sheet=Image.new('RGB',(w*cols,h*((len(ims)+cols-1)//cols)),(90,160,90))
for k,im in enumerate(ims):
    im=im.resize((im.width//2,im.height//2))
    sheet.paste(im,((k%cols)*w,(k//cols)*h),im)
sheet.save(sys.argv[1])
