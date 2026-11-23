from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,'..','img'); os.makedirs(OUT,exist_ok=True)
def rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def F(sz,b=False,i=False): return ImageFont.truetype('/usr/share/fonts/truetype/crosextra/Carlito-%s.ttf'%('BoldItalic' if b and i else 'Bold' if b else 'Italic' if i else 'Regular'),sz)
PERS={ # key: (Name, Lebensdaten, Rolle, Mütze, Bart, Hautton, Kleid)
 'gutenberg':('Johannes Gutenberg','um 1400 – 1468','Erfinder des Buchdrucks mit beweglichen Lettern','barett','voll','#E3C7A5','#3B2F2F'),
 'fust':('Johannes Fust','um 1400 – 1466','Mainzer Kaufmann und Geldgeber Gutenbergs','kappe','kurz','#E6CBAA','#5A2D2D'),
 'schoeffer':('Peter Schöffer','um 1425 – um 1503','Schreiber, Drucker und Mitarbeiter Gutenbergs','kappe','keiner','#E8CFB0','#2F3B4F'),
 'aldus':('Aldus Manutius','um 1449 – 1515','Venezianischer Drucker, Erfinder der Kursivschrift','kappe','kurz','#E3C7A5','#2E4A3A'),
 'erasmus':('Erasmus von Rotterdam','1466/69 – 1536','Humanist, Herausgeber des griechischen Neuen Testaments','gelehrt','keiner','#EACFB1','#3A3A3A'),
 'luther':('Martin Luther','1483 – 1546','Reformator, Bibelübersetzer','barett','keiner','#E6C8A6','#222222'),
 'kopernikus':('Nikolaus Kopernikus','1473 – 1543','Astronom, heliozentrisches Weltbild','barett','keiner','#E4C9A8','#4A3A2A'),
 'vesalius':('Andreas Vesalius','1514 – 1564','Arzt, Begründer der modernen Anatomie','kappe','voll','#E3C7A5','#2A2A2A')}
def person(key,epcol='134F5C',w=640,h=800):
    n,d,r,mu,bart,hc,kl=PERS[key]; S=2; im=Image.new('RGB',(w*S,h*S),rgb('#EFE9DD')); dr=ImageDraw.Draw(im)
    for y in range(h*S): t=y/(h*S); c=tuple(int(a*(1-t)+b*t) for a,b in zip(rgb('#F4EFE4'),rgb('#D8CDB8'))); dr.line([(0,y),(w*S,y)],fill=c)
    cx=w*S//2; cy=int(h*S*0.42)
    # Oval-Rahmen
    dr.ellipse((cx-250*S,cy-300*S,cx+250*S,cy+330*S),fill=rgb('#CBBFA7'))
    # Schultern/Gewand
    dr.polygon([(cx-230*S,cy+330*S),(cx-170*S,cy+170*S),(cx-70*S,cy+120*S),(cx+70*S,cy+120*S),(cx+170*S,cy+170*S),(cx+230*S,cy+330*S)],fill=rgb(kl))
    dr.polygon([(cx-40*S,cy+120*S),(cx,cy+210*S),(cx+40*S,cy+120*S)],fill=rgb('#EEE7D6'))   # Hemdkragen
    # Hals, Kopf
    dr.rectangle((cx-35*S,cy+60*S,cx+35*S,cy+135*S),fill=rgb(hc))
    dr.ellipse((cx-100*S,cy-110*S,cx+100*S,cy+110*S),fill=rgb(hc))
    # Gesicht
    for ex in (-38,38): dr.ellipse((cx+(ex-9)*S,cy-18*S,cx+(ex+9)*S,cy-2*S),fill=rgb('#2B2118'))
    dr.line([(cx-55*S,cy-34*S),(cx-22*S,cy-38*S)],fill=rgb('#5B4631'),width=5*S); dr.line([(cx+22*S,cy-38*S),(cx+55*S,cy-34*S)],fill=rgb('#5B4631'),width=5*S)
    dr.line([(cx,cy-10*S),(cx-8*S,cy+30*S),(cx+8*S,cy+32*S)],fill=rgb('#B9946F'),width=4*S)
    dr.arc((cx-28*S,cy+45*S,cx+28*S,cy+75*S),20,160,fill=rgb('#8A5A4A'),width=5*S)
    # Bart
    bc=rgb('#6B5A48')
    if bart=='voll': dr.polygon([(cx-95*S,cy+10*S),(cx-70*S,cy+105*S),(cx,cy+170*S),(cx+70*S,cy+105*S),(cx+95*S,cy+10*S),(cx+55*S,cy+60*S),(cx,cy+50*S),(cx-55*S,cy+60*S)],fill=bc)
    if bart=='kurz': dr.polygon([(cx-80*S,cy+40*S),(cx-45*S,cy+98*S),(cx,cy+112*S),(cx+45*S,cy+98*S),(cx+80*S,cy+40*S),(cx+40*S,cy+62*S),(cx-40*S,cy+62*S)],fill=bc)
    # Haare
    dr.pieslice((cx-108*S,cy-118*S,cx+108*S,cy+40*S),180,360,fill=rgb('#8A7762') if bart!='voll' else rgb('#6B5A48'))
    dr.rectangle((cx-108*S,cy-40*S,cx-92*S,cy+20*S),fill=rgb('#8A7762')); dr.rectangle((cx+92*S,cy-40*S,cx+108*S,cy+20*S),fill=rgb('#8A7762'))
    # Kopfbedeckung
    hat=rgb(kl) if kl!='#222222' else rgb('#1c1c1c')
    if mu=='barett':
        dr.ellipse((cx-135*S,cy-170*S,cx+140*S,cy-60*S),fill=hat); dr.rectangle((cx-98*S,cy-98*S,cx+98*S,cy-60*S),fill=hat)
    elif mu=='kappe':
        dr.pieslice((cx-105*S,cy-135*S,cx+105*S,cy+25*S),180,360,fill=hat); dr.rectangle((cx-105*S,cy-60*S,cx+105*S,cy-45*S),fill=hat); dr.rectangle((cx-110*S,cy-50*S,cx-90*S,cy+30*S),fill=hat); dr.rectangle((cx+90*S,cy-50*S,cx+110*S,cy+30*S),fill=hat)
    else:
        dr.polygon([(cx-110*S,cy-50*S),(cx-85*S,cy-150*S),(cx+85*S,cy-150*S),(cx+110*S,cy-50*S)],fill=hat); dr.rectangle((cx-110*S,cy-60*S,cx+110*S,cy-42*S),fill=rgb('#222222'))
    # Namensband
    dr.rectangle((0,(h-170)*S,w*S,h*S),fill=rgb(epcol)); 
    tc=(255,255,255) if epcol.upper() not in ('F1C232','6FA8DC') else (30,30,30)
    f1=F(46*S,True); f2=F(30*S); f3=F(24*S,False,True)
    dr.text((30*S,(h-158)*S),n,font=f1,fill=tc); dr.text((30*S,(h-100)*S),d,font=f2,fill=tc); dr.text((30*S,(h-56)*S),'Platzhalter-Porträt (Illustration)',font=f3,fill=tc)
    out=im.resize((w,h),Image.LANCZOS); out.save(os.path.join(OUT,'person_%s.png'%key)); return out
def skriptorium(w=1400,h=900,name='szene_skriptorium.png'):
    S=1; im=Image.new('RGB',(w,h),rgb('#E8DCC4')); d=ImageDraw.Draw(im)
    d.rectangle((0,0,w,int(h*0.62)),fill=rgb('#D9C9A8')); d.rectangle((0,int(h*0.62),w,h),fill=rgb('#8A6A44'))
    for k in range(3): x=140+k*430; d.rounded_rectangle((x,70,x+200,380),radius=100,fill=rgb('#F4E7B5')); d.rectangle((x+90,70,x+110,380),fill=rgb('#7A6A4A'))
    d.rectangle((250,470,1150,520),fill=rgb('#5E4128')); d.polygon([(300,520),(1100,520),(1060,600),(340,600)],fill=rgb('#4D3420'))   # Pult
    d.polygon([(420,470),(980,470),(1040,395),(480,395)],fill=rgb('#F2E8CF')); d.line([(700,470),(740,395)],fill=rgb('#8A7A5A'),width=4)
    for k in range(7): d.line([(490+k*5,410+k*9),(690+k*4,422+k*9)],fill=rgb('#5E4A32'),width=3); d.line([(760+k*4,420+k*9),(940+k*5,408+k*9)],fill=rgb('#5E4A32'),width=3)
    d.ellipse((610,215,790,395),fill=rgb('#E6CBAA')); d.polygon([(560,520),(840,520),(790,350),(610,350)],fill=rgb('#4A3A2A')); d.pieslice((595,200,805,380),180,360,fill=rgb('#4A3A2A'))
    d.ellipse((650,265,670,285),fill=rgb('#2B2118')); d.ellipse((730,265,750,285),fill=rgb('#2B2118'))
    d.line([(800,430),(900,370)],fill=rgb('#2B2118'),width=6); d.ellipse((890,350,920,380),fill=rgb('#2B2118'))
    d.text((40,h-80),'Szene: Schreiber im Skriptorium (Illustration, Platzhalter)',font=F(30,False,True),fill=(240,230,210)); im.save(os.path.join(OUT,name)); return im
def werkstatt(w=1400,h=900,name='szene_werkstatt.png'):
    im=Image.new('RGB',(w,h),rgb('#E4D8C0')); d=ImageDraw.Draw(im)
    d.rectangle((0,int(h*0.7),w,h),fill=rgb('#7B5C3A')); d.rectangle((0,0,w,int(h*0.7)),fill=rgb('#CDBE9E'))
    d.rectangle((90,90,390,330),fill=rgb('#93C0CC')); d.line([(240,90),(240,330)],fill=rgb('#5A4630'),width=8); d.line([(90,210),(390,210)],fill=rgb('#5A4630'),width=8); d.rectangle((90,90,390,330),outline=rgb('#5A4630'),width=10)
    # Presse
    px=720; d.rectangle((px,200,px+30,700),fill=rgb('#6B4A28')); d.rectangle((px+330,200,px+360,700),fill=rgb('#6B4A28')); d.rectangle((px-20,170,px+380,225),fill=rgb('#5A3A1E'))
    d.rectangle((px+160,225,px+200,460),fill=rgb('#B58A4E')); d.rectangle((px+60,460,px+300,500),fill=rgb('#4A3018')); d.rectangle((px+40,560,px+320,610),fill=rgb('#3A2410'))
    d.line([(px+10,120),(px+370,120)],fill=rgb('#B58A4E'),width=16); d.line([(px+180,120),(px+180,170)],fill=rgb('#B58A4E'),width=12)
    # Drucker + Setzer
    d.polygon([(px-210,700),(px-120,350),(px-50,350),(px+20,700)],fill=rgb('#3A4F6A')); d.ellipse((px-170,260,px-70,360),fill=rgb('#E6CBAA')); d.pieslice((px-178,250,px-62,350),180,360,fill=rgb('#2E2E2E'))
    d.line([(px-70,420),(px+60,150)],fill=rgb('#3A4F6A'),width=24)
    sx=190; d.rectangle((sx,520,sx+320,570),fill=rgb('#5A3A1E')); d.polygon([(sx+20,570),(sx+300,570),(sx+330,700),(sx-10,700)],fill=rgb('#4A3018'))
    for k in range(12): d.rectangle((sx+20+k*24,480,sx+36+k*24,520),fill=rgb('#6D6D6D'))
    d.polygon([(sx+80,520),(sx+190,520),(sx+170,330),(sx+100,330)],fill=rgb('#6A3F3A')); d.ellipse((sx+85,250,sx+185,350),fill=rgb('#E6CBAA')); d.pieslice((sx+80,240,sx+190,340),180,360,fill=rgb('#7A5A3A'))
    d.text((40,h-80),'Szene: Werkstatt eines Druckers um 1470 (Illustration, Platzhalter)',font=F(30,False,True),fill=(250,240,220)); im.save(os.path.join(OUT,name)); return im
def schemakarte(w=1600,h=960,name='karte_druckorte.png'):
    im=Image.new('RGB',(w,h),rgb('#F6F2E8')); d=ImageDraw.Draw(im)
    lon0,lon1,lat0,lat1=-4,24,40,54
    def pos(lo,la): return ((lo-lon0)/(lon1-lon0)*(w-200)+100,(lat1-la)/(lat1-lat0)*(h-200)+100)
    for lo in range(0,25,5): x=pos(lo,0)[0]; d.line([(x,80),(x,h-80)],fill=rgb('#E3DCCB'),width=2)
    for la in range(40,55,5): y=pos(0,la)[1]; d.line([(80,y),(w-80,y)],fill=rgb('#E3DCCB'),width=2)
    C=[('Mainz',8.27,50.0,1450),('Straßburg',7.75,48.58,1458),('Subiaco/Rom',12.9,41.9,1465),('Köln',6.96,50.94,1465),('Basel',7.59,47.56,1466),('Venedig',12.33,45.44,1469),('Paris',2.35,48.86,1470),('Nürnberg',11.08,49.45,1470),('Lyon',4.83,45.76,1473),('Krakau',19.94,50.06,1473),('London',-0.12,51.51,1476)]
    mx=pos(8.27,50.0)
    for n,lo,la,y in C:
        x,yy=pos(lo,la)
        if n!='Mainz': d.line([(mx[0],mx[1]),(x,yy)],fill=rgb('#C9BFA6'),width=3)
    for n,lo,la,y in C:
        x,yy=pos(lo,la); r=30 if n=='Mainz' else 16+max(0,(1480-y))*0.35; col=rgb('#C0791B') if n=='Mainz' else rgb('#134F5C')
        d.ellipse((x-r,yy-r,x+r,yy+r),fill=col,outline=(255,255,255),width=4); t=n+' | '+('um ' if y in (1458,1465,1466,1469,1470,1473) and False else '')+str(y)
        d.text((x+r+8,yy-22),n,font=F(34,True),fill=rgb('#222222')); d.text((x+r+8,yy+12),'ab '+str(y)+('' if n!='Mainz' else ' (Gutenberg)'),font=F(28),fill=rgb('#555555'))
    d.text((60,24),'Schemakarte: Wie sich der Buchdruck von Mainz aus verbreitete (ungefähre Jahre der ersten Druckerei)',font=F(38,True),fill=rgb('#222222'))
    d.text((60,h-60),'Schematische Darstellung ohne Küstenlinien, Entfernungen nur ungefähr | eigene Darstellung',font=F(26,False,True),fill=rgb('#777777')); im.save(os.path.join(OUT,name)); return im
def kopernikus(w=1200,h=900,name='grafik_weltbild.png'):
    im=Image.new('RGB',(w,h),rgb('#14202B')); d=ImageDraw.Draw(im)
    import random; r=random.Random(5)
    for _ in range(160): x,y=r.randint(0,w),r.randint(0,h); d.ellipse((x,y,x+3,y+3),fill=(255,255,255))
    cx,cy=w//2,h//2+20
    d.ellipse((cx-60,cy-60,cx+60,cy+60),fill=rgb('#F4C542'))
    cols=['#B7B7B7','#E8C170','#4C8DDB','#C9553B','#D9A25B','#E3CE92']; names=['Merkur','Venus','Erde','Mars','Jupiter','Saturn']
    for i,(c,n) in enumerate(zip(cols,names)):
        R=110+i*62; d.ellipse((cx-R,cy-R,cx+R,cy+R),outline=rgb('#4A5A6A'),width=2); a=math.radians(30+i*57); x,y=cx+R*math.cos(a),cy+R*math.sin(a); rr=10+(i in(4,5))*10
        d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=rgb(c)); d.text((x+rr+6,y-14),n,font=F(26),fill=(235,235,235))
    d.text((40,26),'Heliozentrisches Weltbild (Kopernikus, 1543) – schematisch',font=F(40,True),fill=(255,255,255)); d.text((40,h-56),'Die Sonne steht im Zentrum, die Planeten kreisen um sie | eigene Darstellung',font=F(26,False,True),fill=(190,200,210)); im.save(os.path.join(OUT,name)); return im
def build_all():
    for k in PERS: person(k)
    skriptorium(); werkstatt(); schemakarte(); kopernikus()
if __name__=='__main__': build_all(); print(sorted(os.listdir(OUT)))
