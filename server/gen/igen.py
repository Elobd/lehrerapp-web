"""Generische Platzhalter-Bilder (Cover, Porträts, Grafiken) – ohne feste Schriftdateien (läuft auch auf Alpine)."""
from PIL import Image, ImageDraw, ImageFont
import os, hashlib, math
def rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
_FONTS=['/usr/share/fonts/truetype/crosextra/Carlito-%s.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf','/usr/share/fonts/dejavu/DejaVuSans%s.ttf','/usr/share/fonts/TTF/DejaVuSans%s.ttf']
def F(sz,b=False):
    for p in _FONTS:
        try: return ImageFont.truetype(p%('Bold' if b else 'Regular') if 'Carlito' in p else p%('-Bold' if b else ''),sz)
        except Exception: pass
    try: return ImageFont.load_default(sz)
    except Exception: return ImageFont.load_default()
def _wrap(d,t,font,maxw):
    out=[];cur=''
    for w in str(t).split():
        x=(cur+' '+w).strip()
        if d.textlength(x,font=font)<=maxw or not cur: cur=x
        else: out.append(cur);cur=w
    if cur: out.append(cur)
    return out
def seed(s): return int(hashlib.md5(str(s).encode()).hexdigest()[:8],16)
def cover(path,title,sub='',color='134F5C',w=1800,h=1000,band=False):
    c=rgb(color); im=Image.new('RGB',(w,h)); d=ImageDraw.Draw(im)
    for y in range(h):
        t=y/h; col=tuple(int(a*(1-t)+b*t) for a,b in zip((14,26,32),tuple(int(v*0.8) for v in c))); d.line([(0,y),(w,y)],fill=col)
    r=seed(title)
    for i in range(9):
        x=(r>>(i*3))%w; y=(r>>(i*2+1))%h; rad=120+(r>>i)%240; d.ellipse((x-rad,y-rad,x+rad,y+rad),outline=tuple(min(255,v+60) for v in c),width=4)
    d.rectangle((0,h-300,w,h),fill=tuple(int(v*0.55) for v in c))
    f1=F(int(w/18),True); lines=_wrap(d,title,f1,w-200)[:3]
    for i,l in enumerate(lines): d.text((90,h-290+i*int(w/16)),l,font=f1,fill=(255,255,255))
    if sub: d.text((90,h-70),sub,font=F(int(w/40)),fill=(215,230,235))
    d.text((w-420,24),'Platzhalter-Titelbild',font=F(32),fill=(200,215,220))
    im.save(path,quality=92); return path
def person(path,name,dates='',role='',color='134F5C',w=640,h=800,band=True):
    r=seed(name); S=2; im=Image.new('RGB',(w*S,h*S)); d=ImageDraw.Draw(im)
    for y in range(h*S):
        t=y/(h*S); d.line([(0,y),(w*S,y)],fill=tuple(int(a*(1-t)+b*t) for a,b in zip((244,239,228),(216,205,184))))
    cx=w*S//2; cy=int(h*S*.42); skins=['#E3C7A5','#EACFB1','#E6C8A6','#D9B38C']; clothes=['#3B2F2F','#2F3B4F','#2E4A3A','#4A3A2A','#222222','#5A2D2D']
    sk=rgb(skins[r%4]); cl=rgb(clothes[(r>>3)%6]); hat=(r>>6)%3; beard=(r>>8)%3
    d.ellipse((cx-250*S,cy-300*S,cx+250*S,cy+330*S),fill=rgb('#CBBFA7'))
    d.polygon([(cx-230*S,cy+330*S),(cx-170*S,cy+170*S),(cx-70*S,cy+120*S),(cx+70*S,cy+120*S),(cx+170*S,cy+170*S),(cx+230*S,cy+330*S)],fill=cl)
    d.polygon([(cx-40*S,cy+120*S),(cx,cy+210*S),(cx+40*S,cy+120*S)],fill=rgb('#EEE7D6'))
    d.rectangle((cx-35*S,cy+60*S,cx+35*S,cy+135*S),fill=sk); d.ellipse((cx-100*S,cy-110*S,cx+100*S,cy+110*S),fill=sk)
    for ex in (-38,38): d.ellipse((cx+(ex-9)*S,cy-18*S,cx+(ex+9)*S,cy-2*S),fill=rgb('#2B2118'))
    d.line([(cx,cy-10*S),(cx-8*S,cy+30*S),(cx+8*S,cy+32*S)],fill=rgb('#B9946F'),width=4*S); d.arc((cx-28*S,cy+45*S,cx+28*S,cy+75*S),20,160,fill=rgb('#8A5A4A'),width=5*S)
    if beard==1: d.polygon([(cx-95*S,cy+10*S),(cx-70*S,cy+105*S),(cx,cy+170*S),(cx+70*S,cy+105*S),(cx+95*S,cy+10*S),(cx+55*S,cy+60*S),(cx,cy+50*S),(cx-55*S,cy+60*S)],fill=rgb('#6B5A48'))
    d.pieslice((cx-108*S,cy-118*S,cx+108*S,cy+40*S),180,360,fill=rgb('#8A7762'))
    hc=cl if cl!=rgb('#EEE7D6') else rgb('#222222')
    if hat==0: d.ellipse((cx-135*S,cy-170*S,cx+140*S,cy-60*S),fill=hc); d.rectangle((cx-98*S,cy-98*S,cx+98*S,cy-60*S),fill=hc)
    elif hat==1: d.pieslice((cx-105*S,cy-135*S,cx+105*S,cy+25*S),180,360,fill=hc); d.rectangle((cx-105*S,cy-60*S,cx+105*S,cy-45*S),fill=hc)
    else: d.polygon([(cx-110*S,cy-50*S),(cx-85*S,cy-150*S),(cx+85*S,cy-150*S),(cx+110*S,cy-50*S)],fill=hc); d.rectangle((cx-110*S,cy-60*S,cx+110*S,cy-42*S),fill=rgb('#222222'))
    if not band: im.resize((w,h),Image.LANCZOS).save(path); return path  # Bildunterschrift steht dann als eigenes Textfeld in der Folie
    ec=rgb(color); d.rectangle((0,(h-170)*S,w*S,h*S),fill=ec); tc=(30,30,30) if color.upper() in('F1C232','6FA8DC') else (255,255,255)
    d.text((30*S,(h-158)*S),name[:28],font=F(40*S,True),fill=tc); d.text((30*S,(h-100)*S),dates[:34],font=F(28*S),fill=tc); d.text((30*S,(h-56)*S),'Platzhalter-Porträt (Illustration)',font=F(22*S),fill=tc)
    im.resize((w,h),Image.LANCZOS).save(path); return path
def timeline(path,events,title='Zeitstrahl',color='134F5C',w=1800,h=600):
    ev=[e for e in events if e.get('jahr')]; im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im); c=rgb(color)
    d.text((20,12),title,font=F(38,True),fill=(34,34,34))
    if not ev: im.save(path); return path
    ys=[int(e['jahr']) for e in ev]; y0=min(ys)-5; y1=max(ys)+5; x0,x1,y=110,w-110,310
    d.rectangle((x0,y-14,x1,y+14),fill=c)
    for i,e in enumerate(sorted(ev,key=lambda e:int(e['jahr']))):
        x=x0+(int(e['jahr'])-y0)/max(1,(y1-y0))*(x1-x0); up=(i%2==0); d.ellipse((x-17,y-17,x+17,y+17),fill=c,outline='white',width=4)
        ty=y-170 if up else y+100; d.line([(x,y-17 if up else y+17),(x,ty+(100 if up else 0))],fill=(136,136,136),width=3)
        yr=str(e['jahr']); d.text((x-d.textlength(yr,font=F(34,True))/2,ty),yr,font=F(34,True),fill=c)
        for k,l in enumerate(_wrap(d,e.get('text',''),F(26),210)[:3]): d.text((x-d.textlength(l,font=F(26))/2,ty+42+k*30),l,font=F(26),fill=(34,34,34))
    d.text((20,h-40),'Grafik: eigene Darstellung für dieses Arbeitsmaterial',font=F(24),fill=(119,119,119)); im.save(path); return path
def steps(path,steps_,title='Überblick',color='134F5C',w=1800,h=640):
    n=max(1,min(6,len(steps_))); im=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(im); d.text((20,12),title,font=F(38,True),fill=(34,34,34))
    bw=(w-40-(n-1)*40)//n; x=20; base=rgb(color)
    for i,s in enumerate(steps_[:n]):
        col=tuple(int(v*(0.7+0.3*i/n)) for v in base); d.rounded_rectangle((x,110,x+bw,540),radius=26,fill=col)
        d.ellipse((x+20,80,x+100,160),fill='white'); d.text((x+60-d.textlength(str(i+1),font=F(50,True))/2,86),str(i+1),font=F(50,True),fill=col)
        for k,l in enumerate(_wrap(d,s.get('titel',''),F(40,True),bw-40)[:3]): d.text((x+20,190+k*48),l,font=F(40,True),fill='white')
        for k,l in enumerate(_wrap(d,s.get('text',''),F(28),bw-40)[:5]): d.text((x+20,350+k*36),l,font=F(28),fill=(235,244,246))
        x+=bw+40
    d.text((20,h-40),'Grafik: eigene Darstellung für dieses Arbeitsmaterial',font=F(24),fill=(119,119,119)); im.save(path); return path
def illus(path,title,color='134F5C',w=1400,h=900):
    c=rgb(color); r=seed(title); im=Image.new('RGB',(w,h),tuple(min(255,v+150) for v in c)); d=ImageDraw.Draw(im)
    for i in range(7): x=(r>>(i*2))%w; y=(r>>(i+3))%h; rad=100+(r>>i)%200; d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=tuple(min(255,v+90+i*8) for v in c))
    d.rectangle((0,h-120,w,h),fill=c); d.text((40,h-95),title[:48],font=F(46,True),fill=(255,255,255)); d.text((w-460,16),'Platzhalter-Illustration',font=F(28),fill=(60,60,60)); im.save(path); return path
