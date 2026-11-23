"""Zentrales Coverbild: erzeugt alle Varianten (Textblatt-Deckblatt, Titelfolie, JPEG) aus EINER Quelle.
Eigenes Bild: img/cover_custom.png|jpg ablegen (oder cover_tauschen.py <bild> aufrufen), dann pipeline.sh."""
import os, sys, shutil
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'..','img')
def fit(im,w,h):
    r=max(w/im.width,h/im.height); im=im.resize((int(im.width*r)+1,int(im.height*r)+1),Image.LANCZOS)
    x=(im.width-w)//2; y=(im.height-h)//2; return im.crop((x,y,x+w,y+h))
def make():
    cust=[os.path.join(IMG,n) for n in ('cover_custom.png','cover_custom.jpg','cover_custom.jpeg') if os.path.exists(os.path.join(IMG,n))]
    if cust:
        im=Image.open(cust[0]).convert('RGB'); fit(im,1800,1000).save(os.path.join(IMG,'cover.png')); fit(im,2000,900).save(os.path.join(IMG,'cover_title.png')); print('Cover: eigenes Bild',os.path.basename(cust[0]))
    else:
        import images; images.cover(); images.cover(w=2000,h=900,name='cover_title.png',band=False); print('Cover: Platzhalter')
    Image.open(os.path.join(IMG,'cover.png')).convert('RGB').save(os.path.join(HERE,'..','Cover_Der-Buchdruck.jpg'),quality=93,subsampling=0)
if __name__=='__main__': make()
