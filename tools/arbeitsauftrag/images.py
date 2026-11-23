from PIL import Image, ImageDraw, ImageFont
import os
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,'..','img'); os.makedirs(OUT,exist_ok=True)
EP={'Vor- und Frühgeschichte':'#783F04','Antike':'#F1C232','Mittelalter':'#38761D','Neuzeit':'#134F5C','Zeitgeschichte':'#6FA8DC'}
TEAL='#134F5C'; OCHER='#C0791B'
def F(sz,b=False): return ImageFont.truetype('/usr/share/fonts/truetype/crosextra/Carlito-%s.ttf'%('Bold' if b else 'Regular'),sz)
def rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def logo(color=TEAL,name='logo.png'):
    S=1200; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im); c=rgb(color)
    d.ellipse((40,40,S-40,S-40),fill=c)
    # offenes Buch + Sanduhr-Dreieck: neutrales Zeichen für Geschichte
    w=(255,255,255,255)
    d.polygon([(600,420),(250,360),(250,820),(600,880)],fill=w)
    d.polygon([(600,420),(950,360),(950,820),(600,880)],fill=w)
    for k in range(4): 
        y=470+k*80; d.line([(310,y-10+k*8*0),(560,y+25)],fill=c,width=14); d.line([(640,y+25),(890,y-10)],fill=c,width=14)
    d.polygon([(600,230),(520,330),(680,330)],fill=w)   # Spitze: "Zeitpfeil" über dem Buch
    d.ellipse((560,170,640,250),fill=w)
    im=im.resize((300,300),Image.LANCZOS); im.save(os.path.join(OUT,name)); return im
def cover(w=1800,h=1000,color=TEAL,name='cover.png',band=True):
    im=Image.new('RGB',(w,h),rgb('#10343C')); d=ImageDraw.Draw(im)
    for y in range(h):  # Verlauf
        t=y/h; c=tuple(int(a*(1-t)+b*t) for a,b in zip(rgb('#0E2C33'),rgb('#1B6676'))); d.line([(0,y),(w,y)],fill=c)
    # Regal im Hintergrund
    for i in range(7):
        x=60+i*260; d.rectangle((x,80,x+200,h-340),outline=rgb('#2A7B8C'),width=3)
        for j in range(5): d.rectangle((x+16,110+j*95,x+184,170+j*95),fill=rgb('#17505E'))
    # Letternblöcke
    letters='GUTENBERG'; fx=F(110,True)
    for i,ch in enumerate(letters):
        x=90+i*138; y=h-470+(i%3)*14; d.rectangle((x,y,x+115,y+175),fill=rgb('#CFA24A'),outline=rgb('#7a5a1a'),width=4)
        d.rectangle((x+10,y+10,x+105,y+165),outline=rgb('#7a5a1a'),width=2)
        tw=d.textlength(ch,font=fx); d.text((x+57-tw/2,y+22),ch,font=fx,fill=rgb('#2b1b05'))
    # Spindelpresse (Prinzip)
    px=w-520; d.rectangle((px,260,px+30,h-260),fill=rgb('#A67B3D')); d.rectangle((px+320,260,px+350,h-260),fill=rgb('#A67B3D'))
    d.rectangle((px-20,230,px+370,290),fill=rgb('#8A6430')); d.rectangle((px+150,290,px+200,560),fill=rgb('#C9A15B'))
    d.rectangle((px+60,560,px+290,610),fill=rgb('#6d4a1f')); d.rectangle((px-20,h-300,px+370,h-250),fill=rgb('#6d4a1f'))
    d.line([(px+10,200),(px+340,200)],fill=rgb('#d9c28a'),width=18); d.line([(px+175,200),(px+175,290)],fill=rgb('#d9c28a'),width=14)
    if band:
        d.rectangle((0,h-120,w,h),fill=rgb(color)); d.text((70,h-100),'Der Buchdruck  |  um 1450',font=F(64,True),fill=(255,255,255))
        d.text((w-560,h-92),'Probebild (KI-/Platzhalter)',font=F(40),fill=rgb('#BFD7DB'))
    im.save(os.path.join(OUT,name),quality=92); return im
def prozess(name='prozess.png'):
    w,h=1800,640; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    steps=[('1','Schriftzeichen\nschneiden','Stempel (Patrize)\naus hartem Metall'),('2','Lettern\ngießen','Handgießinstrument,\nBlei-Zinn-Legierung'),('3','Text\nsetzen','Lettern im Winkelhaken\nzu Zeilen und Seiten'),('4','Einfärben\nund pressen','Ölhaltige Farbe,\nSpindelpresse'),('5','Trocknen\nund binden','Bögen falten,\nBuchblock binden')]
    bw=318; gap=40; x=20
    cols=['#134F5C','#1B6676','#2A7B8C','#C0791B','#8A6430']
    for i,(n,t,s) in enumerate(steps):
        d.rounded_rectangle((x,110,x+bw,540),radius=26,fill=rgb(cols[i]))
        d.ellipse((x+20,80,x+100,160),fill='white'); d.text((x+60-d.textlength(n,font=F(54,True))/2,86),n,font=F(54,True),fill=rgb(cols[i]))
        for k,l in enumerate(t.split('\n')): d.text((x+24,190+k*54),l,font=F(46,True),fill='white')
        for k,l in enumerate(s.split('\n')): d.text((x+24,340+k*40),l,font=F(31),fill=(235,244,246))
        if i<4: d.polygon([(x+bw+4,320),(x+bw+gap-4,350),(x+bw+4,380)],fill=rgb('#999999'))
        x+=bw+gap
    d.text((20,12),'Vom Metallstempel zum fertigen Buch – Arbeitsschritte im Druckerhaus (vereinfacht)',font=F(38,True),fill=rgb('#222222'))
    d.text((20,580),'Grafik: eigene Darstellung für dieses Arbeitsmaterial',font=F(26),fill=rgb('#777777')); im.save(os.path.join(OUT,name)); return im
def zeitstrahl(name='zeitstrahl.png'):
    w,h=1800,600; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im)
    ev=[(1450,'Gutenberg beginnt\nin Mainz zu drucken'),(1455,'42-zeilige Bibel\nfertig'),(1486,'Zensuredikt des\nMainzer Erzbischofs'),(1492,'Kolumbus\nin Amerika'),(1517,'Luthers 95 Thesen,\nWittenberg'),(1543,'Kopernikus und\nVesalius gedruckt')]
    x0,x1,y=110,w-110,300; yr0,yr1=1440,1550
    d.rectangle((x0,y-14,x1,y+14),fill=rgb('#134F5C'))
    for yr in range(1450,1551,10):
        x=x0+(yr-yr0)/(yr1-yr0)*(x1-x0); d.line([(x,y+14),(x,y+34)],fill=rgb('#134F5C'),width=4); t=str(yr); d.text((x-d.textlength(t,font=F(28))/2,y+40),t,font=F(28),fill=rgb('#444444'))
    for i,(yr,t) in enumerate(ev):
        x=x0+(yr-yr0)/(yr1-yr0)*(x1-x0); up=(i%2==0); col='#C0791B' if yr in(1450,1455) else '#134F5C'
        d.ellipse((x-17,y-17,x+17,y+17),fill=rgb(col),outline='white',width=4)
        ty=y-170 if up else y+100; d.line([(x,y-17 if up else y+17),(x,ty+(100 if up else 0))],fill=rgb('#888888'),width=3)
        d.text((x-d.textlength(str(yr),font=F(36,True))/2,ty-(0 if up else 0)),str(yr),font=F(36,True),fill=rgb(col))
        for k,l in enumerate(t.split('\n')): d.text((x-d.textlength(l,font=F(28))/2,ty+42+k*32),l,font=F(28),fill=rgb('#222222'))
    d.text((20,12),'Der Buchdruck im Zeitstrahl (Neuzeit, 1450–1550)',font=F(38,True),fill=rgb('#222222')); d.text((20,555),'Grafik: eigene Darstellung für dieses Arbeitsmaterial',font=F(26),fill=rgb('#777777')); im.save(os.path.join(OUT,name)); return im
if __name__=='__main__':
    logo(); logo('#FFFFFF','logo_weiss.png'); cover(); prozess(); zeitstrahl(); print(os.listdir(OUT))

def presse_skizze(name='presse_skizze.png'):
    w,h=1000,820; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im); k=rgb('#333333')
    d.rectangle((150,730,850,780),outline=k,width=6)                       # Fundament
    d.rectangle((210,150,260,730),outline=k,width=6); d.rectangle((740,150,790,730),outline=k,width=6)  # Ständer
    d.rectangle((170,110,830,170),outline=k,width=6)                       # Querbalken
    d.rectangle((470,170,530,520),outline=k,width=6)                       # Spindel
    for y in range(190,500,28): d.line([(470,y),(530,y+14)],fill=k,width=3)
    d.line([(330,70),(670,70)],fill=k,width=10); d.line([(500,70),(500,110)],fill=k,width=8)  # Hebel
    d.rectangle((330,520,670,570),outline=k,width=6)                       # Presstiegel
    d.rectangle((300,640,700,700),outline=k,width=6)                       # Satz
    for x in range(310,700,38): d.rectangle((x,650,x+28,690),outline=k,width=2)
    pts=[(1,(330,70),(150,40)),(2,(500,340),(880,300)),(3,(500,545),(880,520)),(4,(500,670),(880,660)),(5,(500,755),(880,760))]
    for n,a,b in pts:
        d.line([a,b],fill=rgb('#C0791B'),width=4); d.ellipse((b[0]-26,b[1]-26,b[0]+26,b[1]+26),fill=rgb('#C0791B')); d.text((b[0]-(10 if n else 0),b[1]-22),str(n),font=F(40,True),fill='white')
    d.text((20,780),'Skizze: Druckerpresse (vereinfacht, eigene Darstellung)',font=F(26),fill=rgb('#777777')); im.save(os.path.join(OUT,name)); return im
if __name__=='__main__': presse_skizze()
