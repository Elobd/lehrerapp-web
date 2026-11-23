"""Präsentation auf Basis der eigenen Vorlagen-PPTX (Layouts: Neuzeit_Titel/-Textfolie/-Überschrift, Video, Arbeitsauftrag)."""
import os, io, re, shutil, subprocess
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree
from PIL import Image, ImageEnhance, ImageDraw
import igen, lib as L
FONT='Source Sans Pro'; SCALE=1.32
def C(h): return RGBColor.from_string(h)
def build(data,out,vorlage,im):
    prs=Presentation(vorlage); AO=L.AO; col=L.COL; T=re.sub(r'[^A-Za-z0-9ÄÖÜäöüß_-]+','-',data.get('titel','Arbeitsauftrag')).strip('-')[:60]
    def blob_of(n,name):
        try:
            for sh in prs.slides[n-1].shapes:
                if sh.name==name: return sh.image.blob
        except Exception: return None
    title_blob=blob_of(1,'Grafik 9'); bg_raw=blob_of(3,'Picture 4'); bg_blob=None
    if bg_raw:
        x=Image.open(io.BytesIO(bg_raw)).convert('RGB'); x=ImageEnhance.Brightness(x).enhance(0.28); b=io.BytesIO(); x.save(b,'JPEG',quality=88); bg_blob=b.getvalue()
    sl=prs.slides._sldIdLst
    for sid in list(sl): prs.part.drop_rel(sid.rId); sl.remove(sid)
    Ls={}
    for m in prs.slide_masters:
        for l in m.slide_layouts: Ls[l.name]=l
    for n in ('Arbeitsauftrag','Video'):
        if n not in Ls: continue
        for sh in list(Ls[n].shapes):
            x=etree.tostring(sh._element).decode()
            if 'hlinkClick' in x or (sh.name=='Picture 16' and sh.top is not None and sh.top<Inches(1.2) and sh.left>Inches(8)): sh._element.getparent().remove(sh._element)
    ep=L.EPOCHE
    for n,l in Ls.items():   # Epochenfarbe + Lasche in den Layouts
        if not n.startswith('Neuzeit') or ep=='Neuzeit': continue
        for sh in l.shapes:
            try:
                if sh.name in ('Rechteck 9','Rechteck 18') and sh.shape_type==1: sh.fill.solid(); sh.fill.fore_color.rgb=C(col)
                if sh.has_text_frame and sh.text_frame.text.strip()=='Die Neuzeit': sh.text_frame.paragraphs[0].runs[0].text='Die '+ep if ep!='Antike' else 'Die Antike'
                if sh.has_text_frame and 'ca. 1500' in sh.text_frame.text: sh.text_frame.paragraphs[0].runs[0].text='(%s)'%L.ZEIT
            except Exception: pass
    def ph(s,idx):
        for p in s.placeholders:
            if p.placeholder_format.idx==idx: return p
    def settext(p,text,size=None,bold=None):
        tf=p.text_frame; tf.clear(); r=tf.paragraphs[0].add_run(); r.text=text
        if size: r.font.size=Pt(size)
        if bold is not None: r.font.bold=bold
    def blocks(p,items,size=10):
        tf=p.text_frame; tf.clear(); tf.word_wrap=True; first=True
        for it in items:
            lead=it.get('lead'); body=it.get('text','')
            if lead:
                para=tf.paragraphs[0] if first else tf.add_paragraph(); first=False; r=para.add_run(); r.text=lead; r.font.bold=True; r.font.size=Pt(size*SCALE); r.font.color.rgb=C(col if col!='F1C232' else '8A6E00'); para.space_after=Pt(1)
            for b in (body if isinstance(body,list) else [body]):
                para=tf.paragraphs[0] if first else tf.add_paragraph(); first=False; r=para.add_run(); r.text=b; r.font.size=Pt(size*SCALE); para.line_spacing=1.5; para.space_after=Pt(8)
    def rounded(pic,adj=9000):
        sp=pic._element.spPr; g=sp.find(qn('a:prstGeom'))
        if g is None: g=etree.SubElement(sp,qn('a:prstGeom'))
        g.set('prst','roundRect'); av=g.find(qn('a:avLst'))
        if av is None: av=etree.SubElement(g,qn('a:avLst'))
        for c in list(av): av.remove(c)
        gd=etree.SubElement(av,qn('a:gd')); gd.set('name','adj'); gd.set('fmla','val %d'%adj)
    imgd=im['dir']
    def addpic(s,path,x,y,w=None,h=None,round_=True):
        p=s.shapes.add_picture(path,Inches(x),Inches(y),Inches(w) if w else None,Inches(h) if h else None)
        if round_: rounded(p)
        return p
    def new(layout): return prs.slides.add_slide(Ls[layout])
    def imgfor(spec):
        if not spec: return None
        if spec=='zeit': return im.get('zeit')
        if spec=='steps': return im.get('steps')
        if spec.startswith('person:'):
            nm=spec[7:]; p=os.path.join(imgd,'pp_%d.png'%(abs(hash(nm))%10**8)); igen.person(p,nm,'','',col); return p
        p=os.path.join(imgd,'il_%d.png'%(abs(hash(spec))%10**8)); igen.illus(p,spec if spec!='illus' else data.get('titel',''),col); return p
    def textslide(sp):
        s=new('Neuzeit_Textfolie'); settext(ph(s,13),sp.get('titel','')); settext(ph(s,14),sp.get('untertitel',''))
        b=ph(s,15); b.left,b.top,b.width,b.height=Inches(0.31),Inches(1.33),Inches(5.3),Inches(3.9); blocks(b,sp.get('bloecke') or [],10)
        if sp.get('notizen'): s.notes_slide.notes_text_frame.text=sp['notizen']
        pic=imgfor(sp.get('bild'))
        if pic:
            if sp.get('bild','').startswith('person:'): addpic(s,pic,6.6,1.4,w=2.6)
            else: addpic(s,pic,6.0,1.45,w=3.5)
        return s
    slides_data=(data.get('praesentation') or {}).get('folien') or []
    # 1 Titel
    s=new('Neuzeit_Titel')
    if title_blob and os.path.exists(os.path.join(os.path.dirname(vorlage),'use_vorlage_titelbild')): ph(s,11).insert_picture(io.BytesIO(title_blob))
    else:
        ct=os.path.join(imgd,'cover_title.png'); x=Image.open(im.get('cover_notext') or im['cover']).convert('RGB'); r=max(2000/x.width,900/x.height); x=x.resize((int(x.width*r)+1,int(x.height*r)+1)); l=(x.width-2000)//2; t=(x.height-900)//2; x.crop((l,t,l+2000,t+900)).save(ct); ph(s,11).insert_picture(ct)
    settext(ph(s,0),data.get('titel',''),bold=True); settext(ph(s,10),str((data.get('praesentation') or {}).get('titeljahr') or data.get('jahr') or ''),bold=True)
    s.notes_slide.notes_text_frame.text='Einstieg: Bild wirken lassen. Impuls: „Was seht ihr? Welche Rolle könnte das spielen?“'
    # 2 Epochenübersicht
    EPD=data.get('epochen') or []
    if EPD:
        s=new('Neuzeit_Textfolie'); settext(ph(s,13),'Epochenübersicht'); settext(ph(s,14),'Einordnung des Themas'); b=ph(s,15); b._element.getparent().remove(b._element)
        bx,by,bw,bh=0.25,3.0,1.88,0.55; notes=[]
        def tb(s,x,y,w,h,lines,size,bold=False,color='222222',anchor=MSO_ANCHOR.TOP):
            t=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)); tf=t.text_frame; tf.word_wrap=True; tf.vertical_anchor=anchor; tf.margin_left=tf.margin_right=Inches(0.02); tf.margin_top=tf.margin_bottom=0
            for i,l in enumerate(lines):
                p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=PP_ALIGN.CENTER; r=p.add_run(); r.text=l; r.font.name=FONT; r.font.size=Pt(size if i==0 else size-1.5); r.font.bold=bold if i==0 else False; r.font.color.rgb=C(color if i==0 else '666666')
        order=list(L.EPOCHEN.keys())
        byep={e.get('epoche'):e.get('ereignisse') or [] for e in EPD}
        for i,n in enumerate(order):
            colr,zt=L.EPOCHEN[n]; tc='222222' if colr=='F1C232' else 'FFFFFF'; x=bx+i*bw
            sh=s.shapes.add_shape(MSO_SHAPE.PENTAGON if i==0 else MSO_SHAPE.CHEVRON,Inches(x),Inches(by),Inches(bw+0.08),Inches(bh)); sh.fill.solid(); sh.fill.fore_color.rgb=C(colr); sh.line.fill.background(); sh.shadow.inherit=False
            tf=sh.text_frame; tf.word_wrap=True; tf.vertical_anchor=MSO_ANCHOR.MIDDLE; tf.margin_left=Inches(0.22 if i else 0.06); tf.margin_right=Inches(0.2); p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER; r=p.add_run(); r.text=n; r.font.name=FONT; r.font.size=Pt(9.5 if len(n)>14 else 10.5); r.font.bold=True; r.font.color.rgb=C(tc)
            tb(s,x+0.1,by+bh+0.03,bw-0.1,0.2,[zt],8.5,True,colr if colr!='F1C232' else 'B38600')
            ev=(byep.get(n) or [])[:4]; k=len(ev); notes.append('%s (%s):'%(n,zt))
            for j,e in enumerate(ev):
                ex=x+0.3+(bw-0.6)*(j+0.5)/k; up=(int(e.get('seite',1 if j%2==0 else -1))>0); hi=bool(e.get('hervorheben')) or (n==ep and j==0)
                y0,y1=((by-0.04),(by-0.55-(0.18 if j%2 else 0))) if up else ((by+bh+0.3),(by+bh+0.62+(0.18 if j%2 else 0)))
                ln=s.shapes.add_connector(1,Inches(ex),Inches(min(y0,y1)),Inches(ex),Inches(max(y0,y1))); ln.line.color.rgb=C('9AA4A9'); ln.line.width=Pt(0.75)
                tb(s,ex-0.5,(y1-0.46) if up else (y1+0.01),1.0,0.46,[e.get('text',''),str(e.get('jahr',''))],9.3 if not hi else 9.8,hi,'B4650F' if hi else '222222',MSO_ANCHOR.BOTTOM if up else MSO_ANCHOR.TOP); notes.append('  %s – %s'%(e.get('jahr',''),e.get('text','')))
        s.notes_slide.notes_text_frame.text='Eingezeichnete Ereignisse und Persönlichkeiten (Jahr – Ereignis):\n'+'\n'.join(notes)
    for sp in slides_data:
        t=sp.get('typ','text')
        if t=='divider':
            s=new('Neuzeit_Überschrift')
            if bg_blob: ph(s,13).insert_picture(io.BytesIO(bg_blob))
            settext(ph(s,0),sp.get('titel',''),bold=True)
        elif t=='zeitstrahl' and im.get('zeit'):
            s=new('Neuzeit_Textfolie'); settext(ph(s,13),sp.get('titel','Zeitstrahl')); settext(ph(s,14),sp.get('untertitel','')); b=ph(s,15); b._element.getparent().remove(b._element); addpic(s,im['zeit'],0.55,1.4,w=8.9,round_=False)
        elif t=='person':
            ps=(sp.get('personen') or [])[:2]; sp2=dict(sp); sp2['bild']=None; s=textslide(sp2)
            for i,pr in enumerate(ps):
                pth=os.path.join(imgd,'pq_%d.png'%(abs(hash(pr.get('name','')))%10**8)); igen.person(pth,pr.get('name',''),pr.get('lebensdaten',''),pr.get('rolle',''),col)
                if len(ps)==1: addpic(s,pth,6.5,1.4,w=2.7)
                else: addpic(s,pth,5.65+i*2.0,1.45,w=1.85)
        elif t=='video': pass
        else: textslide(sp)
    # Video-Platzhalterfolie
    if 'Video' in Ls and (data.get('praesentation') or {}).get('video',True):
        s=new('Video'); settext(ph(s,15),'[Titel des Videos – wird aus dem Link gelesen]'); settext(ph(s,23),'[mm:ss]'); settext(ph(s,24),'[Kanal / Quelle]'); settext(ph(s,25),'[https://…]')
        vp=os.path.join(imgd,'video.png'); x=Image.new('RGB',(1280,720),(20,26,32)); d=ImageDraw.Draw(x); d.ellipse((540,260,740,460),fill='white'); d.polygon([(600,300),(600,420),(700,360)],fill=(20,26,32)); d.text((300,520),'Video wird hier eingefügt und lokal gespeichert',font=igen.F(40,True),fill=(230,236,240)); x.save(vp)
        pic=s.shapes.add_picture(vp,Inches(0.35),Inches(1.45),Inches(5.27),Inches(2.96)); pic.line.color.rgb=C('FFFFFF'); pic.line.width=Pt(3)
    # Aufgabenfolien mit Vorschaubildern
    thumbs=thumbnails(data,out,imgd,col)
    def shadow(pic):
        sp=pic._element.spPr; eff=etree.SubElement(sp,qn('a:effectLst')); sh=etree.SubElement(eff,qn('a:outerShdw')); sh.set('blurRad','228600'); sh.set('dist','0'); sh.set('dir','0'); sh.set('algn','ctr'); sh.set('rotWithShape','0'); c=etree.SubElement(sh,qn('a:srgbClr')); c.set('val','000000'); al=etree.SubElement(c,qn('a:alpha')); al.set('val','70000')
    def task(sub,steps,key,landscape=False):
        if 'Arbeitsauftrag' not in Ls: return
        s=new('Arbeitsauftrag'); settext(ph(s,22),AO); settext(ph(s,21),sub)
        p20=ph(s,20)
        if p20 is not None: p20._element.getparent().remove(p20._element)
        cy=(1.57,2.25,2.96,3.67,4.37)
        for k,i in enumerate((15,16,17,18,19)):
            p=ph(s,i); settext(p,steps[k] if k<len(steps) else ''); p.left,p.top,p.width,p.height=Inches(6.73),Inches(cy[k]-0.32),Inches(3.2),Inches(0.64); p.text_frame.vertical_anchor=MSO_ANCHOR.MIDDLE; p.text_frame.word_wrap=True; p.text_frame.margin_top=p.text_frame.margin_bottom=0
            for para in p.text_frame.paragraphs: para.alignment=PP_ALIGN.LEFT
        back=thumbs.get('textblatt'); front=thumbs.get(key)
        if back and key=='textblatt': b_=s.shapes.add_picture(back,Inches(1.65),Inches(1.45),height=Inches(3.1)); f_=s.shapes.add_picture(front,Inches(2.95),Inches(2.15),height=Inches(3.1)); shadow(b_); shadow(f_)
        elif back and front:
            b_=s.shapes.add_picture(back,Inches(1.65),Inches(1.4),height=Inches(3.1))
            f_=s.shapes.add_picture(front,Inches(2.3 if landscape else 2.95),Inches(2.7 if landscape else 2.2),width=Inches(3.5)) if landscape else s.shapes.add_picture(front,Inches(2.95),Inches(2.2),height=Inches(3.1)); shadow(b_); shadow(f_)
    T1='Rufe den Arbeitsauftrag auf Microsoft Teams ab'
    task('Textblatt',[T1,'Lies das Textblatt durch','Markiere Schlüsselbegriffe','Notiere zwei Fragen an den Text','Bringe deine Fragen in die nächste Stunde mit'],'textblatt')
    task('Offene Fragen',[T1,'Lies das Textblatt','Bearbeite das Arbeitsblatt in ganzen Sätzen','Lade ein Foto deines Arbeitsblatts auf Microsoft Teams hoch','Vergleiche deine Antworten in der nächsten Stunde'],'arbeitsblatt')
    task('Lückentext',[T1,'Lies das Textblatt','Fülle den Lückentext mit dem Wortspeicher aus','Lade ein Foto deines Lückentextes auf Microsoft Teams hoch','Kontrolliere gemeinsam in der nächsten Stunde'],'lueckentext')
    task('Kreuzworträtsel',[T1,'Lies dir die pdf-Datei durch','Fülle das Kreuzworträtsel aus','Lade ein Foto deines Kreuzworträtsels auf Microsoft Teams hoch','Kontrolliere gemeinsam in der nächsten Stunde'],'kreuzwort',True)
    task('Check-up',['Öffne den Link zum Check-up (Kahoot, Plickers oder Forms)','Beantworte alle Fragen','Gib deine Antworten ab','Prüfe dein Ergebnis','Besprich die Auswertung in der nächsten Stunde'],'checkup')
    s=new('Neuzeit_Textfolie'); settext(ph(s,13),'Quellen und Bildnachweis'); settext(ph(s,14),'Nachweis'); b=ph(s,15); b.left,b.top,b.width,b.height=Inches(0.31),Inches(1.33),Inches(8.4),Inches(3.9)
    blocks(b,[{'lead':'Quellen','text':L.QUELLEN[:6] or ['siehe Quellenblatt im Textblatt']},{'lead':'Bilder','text':'Titelbild, Porträts und Illustrationen: Platzhalter bzw. Vorlagenbilder; Grafiken: eigene Darstellung.'},{'lead':'Hinweis','text':'Material mit KI-Unterstützung erstellt und fachlich zu prüfen.'}],10)
    fn=os.path.join(out,'01_Praesentation_%s.pptx'%T); prs.save(fn); return fn
def thumbnails(data,out,imgd,col):
    """Erste Seite je Dokument als Bild: echt (LibreOffice+pdftoppm), sonst gezeichnete Platzhalter-Seite."""
    T=re.sub(r'[^A-Za-z0-9ÄÖÜäöüß_-]+','-',data.get('titel','Arbeitsauftrag')).strip('-')[:60]; res={}
    names={'textblatt':'02_Textblatt_%s.docx'%T,'arbeitsblatt':'03_Arbeitsblatt_%s.docx'%T,'lueckentext':'04_Lueckentext_%s.docx'%T,'kreuzwort':'05_Kreuzwortraetsel_%s.docx'%T,'checkup':'06_Check-up_SingleChoice_%s.docx'%T}
    so=shutil.which('soffice') or shutil.which('libreoffice'); pp=shutil.which('pdftoppm')
    for k,fn in names.items():
        f=os.path.join(out,fn); png=os.path.join(imgd,'thumb_%s.png'%k)
        if so and pp and os.path.exists(f):
            try:
                subprocess.run([so,'--headless','--convert-to','pdf','--outdir',imgd,f],capture_output=True,timeout=120); pdf=os.path.join(imgd,os.path.splitext(fn)[0]+'.pdf')
                subprocess.run([pp,'-r','110','-png','-f','1','-l','1','-singlefile',pdf,png[:-4]],capture_output=True,timeout=60)
            except Exception: pass
        if not os.path.exists(png):
            land=(k=='kreuzwort'); w,h=(1286,910) if land else (910,1286); x=Image.new('RGB',(w,h),'white'); d=ImageDraw.Draw(x); d.rectangle((0,0,w,70),fill=igen.rgb(col)); d.text((40,90),k.capitalize(),font=igen.F(54,True),fill=(30,30,30))
            for i in range(14): d.line([(40,220+i*(h-300)//14),(w-40,220+i*(h-300)//14)],fill=(210,210,210),width=3)
            x.save(png)
        res[k]=png
    return res
