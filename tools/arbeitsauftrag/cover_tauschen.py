import sys, shutil, os
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'..','img')
src=sys.argv[1]; ext=os.path.splitext(src)[1].lower() or '.png'
for n in ('cover_custom.png','cover_custom.jpg','cover_custom.jpeg'):
    p=os.path.join(IMG,n)
    if os.path.exists(p): os.remove(p)
shutil.copy(src,os.path.join(IMG,'cover_custom'+ext)); print('Neues Cover gesetzt – jetzt pipeline.sh ausführen.')
