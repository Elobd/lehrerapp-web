from PIL import Image, ImageDraw, ImageFont
import math, os
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,'..','img','logos'); os.makedirs(OUT,exist_ok=True)
EP=[('Vor- und Frühgeschichte','783F04'),('Antike','F1C232'),('Mittelalter','38761D'),('Neuzeit','134F5C'),('Zeitgeschichte','B41617')]
def rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
W=(255,255,255,255)
def P(d,pts,cx,cy,s,fill): d.polygon([(cx+x*s,cy+y*s) for x,y in pts],fill=fill)
def L(d,pts,cx,cy,s,fill,w): d.line([(cx+x*s,cy+y*s) for x,y in pts],fill=fill,width=int(w*s))
def E(d,x0,y0,x1,y1,cx,cy,s,fill): d.ellipse((cx+x0*s,cy+y0*s,cx+x1*s,cy+y1*s),fill=fill)
def R(d,x0,y0,x1,y1,cx,cy,s,fill): d.rectangle((cx+x0*s,cy+y0*s,cx+x1*s,cy+y1*s),fill=fill)
# Motive in Koordinaten -100..100
def faustkeil(d,cx,cy,s,bg):
    P(d,[(0,-95),(45,-10),(55,40),(25,85),(-25,85),(-55,40),(-45,-10)],cx,cy,s,W)
    for pts in ([(0,-95),(0,85)],[(-45,-10),(0,10),(45,-10)],[(-55,40),(0,30),(55,40)],[(-30,-40),(0,-20),(30,-40)]): L(d,pts,cx,cy,s,bg,3.5)
def pfeil(d,cx,cy,s,bg):
    L(d,[(-75,75),(65,-65)],cx,cy,s,W,7); P(d,[(98,-98),(35,-72),(72,-35)],cx,cy,s,W)
    for o in (0,22,44):
        P(d,[(-75+o,75-o),(-100+o,62-o),(-62+o,50-o)],cx,cy,s,W); P(d,[(-75+o,75-o),(-62+o,100-o),(-50+o,62-o)],cx,cy,s,W)
def feuer(d,cx,cy,s,bg):
    P(d,[(0,-100),(45,-30),(60,20),(40,70),(0,85),(-40,70),(-60,20),(-35,-30),(-15,-10)],cx,cy,s,W)
    P(d,[(0,-20),(22,25),(14,62),(0,70),(-14,62),(-22,25)],cx,cy,s,bg)
    L(d,[(-80,95),(80,70)],cx,cy,s,W,13); L(d,[(-80,70),(80,95)],cx,cy,s,W,13)
def schwert(d,cx,cy,s,bg):
    P(d,[(0,-100),(14,-70),(14,45),(-14,45),(-14,-70)],cx,cy,s,W); L(d,[(0,-85),(0,40)],cx,cy,s,bg,3)
    R(d,-55,45,55,60,cx,cy,s,W); R(d,-8,60,8,90,cx,cy,s,W); E(d,-16,88,16,108,cx,cy,s,W)
def roemerhelm(d,cx,cy,s,bg):
    E(d,-62,-110,62,-52,cx,cy,s,W)
    for k in range(-5,6): L(d,[(k*10,-108),(k*10,-56)],cx,cy,s,bg,2.2)
    d.pieslice((cx-68*s,cy-68*s,cx+68*s,cy+68*s),180,360,fill=W)
    R(d,-72,-2,72,16,cx,cy,s,W)
    P(d,[(-72,16),(-62,90),(-34,90),(-30,16)],cx,cy,s,W); P(d,[(72,16),(62,90),(34,90),(30,16)],cx,cy,s,W)
    P(d,[(-72,16),(-86,58),(-66,66)],cx,cy,s,W); P(d,[(72,16),(86,58),(66,66)],cx,cy,s,W)
    R(d,-62,-30,62,-22,cx,cy,s,bg)
def saeule(d,cx,cy,s,bg):
    R(d,-60,-95,60,-75,cx,cy,s,W); R(d,-45,-75,45,-62,cx,cy,s,W); R(d,-30,-62,30,70,cx,cy,s,W); R(d,-55,70,55,85,cx,cy,s,W); R(d,-70,85,70,100,cx,cy,s,W)
    for x in (-15,0,15): L(d,[(x,-62),(x,70)],cx,cy,s,bg,3)
def krone(d,cx,cy,s,bg):
    P(d,[(-90,60),(-90,-40),(-45,10),(0,-70),(45,10),(90,-40),(90,60)],cx,cy,s,W)
    R(d,-90,60,90,85,cx,cy,s,W)
    for x,y in ((-90,-48),(0,-80),(90,-48)): E(d,x-13,y-13,x+13,y+13,cx,cy,s,W)
    for x in (-50,0,50): E(d,x-9,28,x+9,46,cx,cy,s,bg)
def burg(d,cx,cy,s,bg):
    R(d,-95,-5,95,95,cx,cy,s,W)
    for x in range(-95,95,38): R(d,x,-30,x+22,-5,cx,cy,s,W)
    R(d,-75,-70,-35,-5,cx,cy,s,W); R(d,35,-70,75,-5,cx,cy,s,W)
    for x in (-75,-55,-35): pass
    for x in (-75,-55): R(d,x,-85,x+14,-70,cx,cy,s,W)
    for x in (35,55): R(d,x,-85,x+14,-70,cx,cy,s,W)
    P(d,[(-55,-75),(-55,-75),(-55,-75)],cx,cy,s,W)
    d.pieslice((cx-22*s,cy+8*s,cx+22*s,cy+52*s),180,360,fill=bg); R(d,-22,30,22,95,cx,cy,s,bg)
    R(d,-62,-50,-48,-30,cx,cy,s,bg); R(d,48,-50,62,-30,cx,cy,s,bg)
def schiff(d,cx,cy,s,bg):
    P(d,[(-95,35),(95,35),(65,85),(-65,85)],cx,cy,s,W); L(d,[(0,-95),(0,35)],cx,cy,s,W,6)
    P(d,[(-8,-85),(-8,10),(-75,10),(-60,-50)],cx,cy,s,W); P(d,[(8,-85),(8,10),(75,10),(60,-50)],cx,cy,s,W)
    P(d,[(0,-95),(35,-85),(0,-72)],cx,cy,s,W)
    for k in range(-3,4): L(d,[(k*30-15,95),(k*30,88),(k*30+15,95)],cx,cy,s,W,4)
def buch(d,cx,cy,s,bg):
    P(d,[(0,-30),(-92,-50),(-92,60),(0,80)],cx,cy,s,W); P(d,[(0,-30),(92,-50),(92,60),(0,80)],cx,cy,s,W)
    for k in range(4): y=-18+k*20; L(d,[(-80,y-10),(-12,y+8)],cx,cy,s,bg,4); L(d,[(12,y+8),(80,y-10)],cx,cy,s,bg,4)
def muskete(d,cx,cy,s,bg):
    L(d,[(-95,-40),(55,10)],cx,cy,s,W,11); P(d,[(30,-5),(95,30),(100,55),(60,60),(20,25)],cx,cy,s,W)
    E(d,10,-5,34,19,cx,cy,s,W); L(d,[(-10,18),(0,45)],cx,cy,s,W,7); L(d,[(-95,-50),(-95,-30)],cx,cy,s,W,6)
def presse(d,cx,cy,s,bg):
    R(d,-70,-85,-52,85,cx,cy,s,W); R(d,52,-85,70,85,cx,cy,s,W); R(d,-80,-95,80,-75,cx,cy,s,W); R(d,-12,-75,12,20,cx,cy,s,W)
    R(d,-45,20,45,38,cx,cy,s,W); R(d,-85,85,85,100,cx,cy,s,W); L(d,[(-55,-110),(55,-110)],cx,cy,s,W,7)
def rakete(d,cx,cy,s,bg):
    P(d,[(0,-100),(32,-45),(32,50),(-32,50),(-32,-45)],cx,cy,s,W); P(d,[(-32,10),(-70,70),(-32,50)],cx,cy,s,W); P(d,[(32,10),(70,70),(32,50)],cx,cy,s,W)
    E(d,-16,-35,16,-3,cx,cy,s,bg); P(d,[(-20,56),(20,56),(0,100)],cx,cy,s,W)
def vertrag(d,cx,cy,s,bg):
    R(d,-65,-95,65,85,cx,cy,s,W)
    for k in range(5): R(d,-45,-70+k*22,45,-62+k*22,cx,cy,s,bg)
    E(d,20,40,60,80,cx,cy,s,bg); E(d,28,48,52,72,cx,cy,s,W); L(d,[(-45,60),(-10,48),(-5,65)],cx,cy,s,bg,4)
def star(d,x,y,r,fill):
    pts=[]
    for i in range(10):
        a=-math.pi/2+i*math.pi/5; rr=r if i%2==0 else r*0.42; pts.append((x+rr*math.cos(a),y+rr*math.sin(a)))
    d.polygon(pts,fill=fill)
def eufahne(d,cx,cy,s,bg):
    R(d,-95,-60,80,60,cx,cy,s,W); R(d,-95,-100,-82,100,cx,cy,s,W)
    for i in range(12):
        a=i*math.pi/6; star(d,cx+(-8+30*math.sin(a))*s,cy+(0-30*math.cos(a))*s,7*s,bg)
MOT={'faustkeil':faustkeil,'pfeil':pfeil,'feuer':feuer,'schwert':schwert,'roemerhelm':roemerhelm,'saeule':saeule,'krone':krone,'burg':burg,'schiff':schiff,'buch':buch,'muskete':muskete,'presse':presse,'rakete':rakete,'vertrag':vertrag,'eufahne':eufahne}
SET={'Vor- und Frühgeschichte':[['faustkeil'],['pfeil','feuer'],['faustkeil','pfeil','feuer']],
 'Antike':[['roemerhelm'],['schwert','saeule'],['schwert','roemerhelm','saeule']],
 'Mittelalter':[['burg'],['schwert','krone'],['schwert','krone','burg']],
 'Neuzeit':[['schiff'],['buch','muskete'],['schiff','buch','muskete']],
 'Zeitgeschichte':[['rakete'],['vertrag','eufahne'],['rakete','vertrag','eufahne']]}
def emblem(colorhex,motifs,size=400,fg=W):
    S=1200; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im); c=rgb(colorhex)+(255,)
    d.ellipse((30,30,S-30,S-30),fill=c); ring=(255,255,255,255); d.ellipse((75,75,S-75,S-75),outline=ring,width=14)
    n=len(motifs); fgc=(255,255,255,255)
    if n==1: pos=[(600,600,4.0)]
    elif n==2: pos=[(410,600,2.2),(790,600,2.2)]
    else: pos=[(600,415,1.9),(405,790,1.9),(795,790,1.9)]
    for m,(x,y,s) in zip(motifs,pos): MOT[m](d,x,y,s,c)
    return im.resize((size,size),Image.LANCZOS)
def sheet():
    cw=330; ch=330; label=ImageFont.truetype('/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf',26)
    s=Image.new('RGB',(cw*3+170,ch*5+60),'white'); d=ImageDraw.Draw(s)
    d.text((10,10),'Logo-Entwürfe je Epoche  (Entwurf A · B · C)',font=ImageFont.truetype('/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf',34),fill=(30,30,30))
    for r,(name,col) in enumerate(EP):
        d.text((10,60+r*ch+ch//2-30),name.replace('Vor- und Frühgeschichte','Vor- und\nFrühgeschichte'),font=label,fill=rgb(col) if name!='Antike' else rgb('B38600'))
        for k,m in enumerate(SET[name]):
            im=emblem(col,m,size=300); im.save(os.path.join(OUT,'%s_%s.png'%(name.split()[0].replace('ß','ss'),'ABC'[k])))
            s.paste(im,(170+k*cw+15,60+r*ch+15),im); d.text((170+k*cw+cw//2-8,60+r*ch+ch-22),'ABC'[k],font=label,fill=(90,90,90))
    s.save(os.path.join(HERE,'..','Logo_Entwuerfe.png')); return s
if __name__=='__main__': sheet(); print(sorted(os.listdir(OUT)))
