import os, io, copy
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree
import images2
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'..','img'); OUT=os.path.join(HERE,'..','out')
FONT='Source Sans Pro'; AO='Der Buchdruck | Medienrevolution um 1450'; TEAL='0B6374'
prs=Presentation(os.path.join(HERE,'vorlage.pptx'))
def blob_of(slide_no,name):
    for sh in prs.slides[slide_no-1].shapes:
        if sh.name==name: return sh.image.blob
title_blob=blob_of(1,'Grafik 9'); bg_raw=blob_of(3,'Picture 4')
from PIL import Image, ImageEnhance
_im=Image.open(io.BytesIO(bg_raw)).convert('RGB'); _im=ImageEnhance.Brightness(_im).enhance(0.28); _b=io.BytesIO(); _im.save(_b,'JPEG',quality=88); bg_blob=_b.getvalue()
sl=prs.slides._sldIdLst
for sid in list(sl): prs.part.drop_rel(sid.rId); sl.remove(sid)
L={}
for m in prs.slide_masters:
    for l in m.slide_layouts: L[l.name]=l
for _n in ('Arbeitsauftrag','Video'):
    for _sh in list(L[_n].shapes):
        _x=etree.tostring(_sh._element).decode()
        if 'hlinkClick' in _x or (_sh.name=='Picture 16' and _sh.top<Inches(1.2) and _sh.left>Inches(8)):
            _sh._element.getparent().remove(_sh._element)
for _r in list(L['Video'].part.rels.values()):
    pass
def C(h): return RGBColor.from_string(h)
SCALE=1.32
def ph(slide,idx):
    for p in slide.placeholders:
        if p.placeholder_format.idx==idx: return p
def settext(p,text,size=None,bold=None,color=None):
    tf=p.text_frame; tf.clear(); r=tf.paragraphs[0].add_run(); r.text=text
    if size: r.font.size=Pt(size)
    if bold is not None: r.font.bold=bold
    if color: r.font.color.rgb=C(color)
def blocks(p,items,size=10):
    """items: [(lead, text)] – Fettzeile in Petrol, darunter Text"""
    tf=p.text_frame; tf.clear(); tf.word_wrap=True; first=True
    for lead,body in items:
        if lead:
            para=tf.paragraphs[0] if first else tf.add_paragraph(); first=False
            r=para.add_run(); r.text=lead; r.font.bold=True; r.font.size=Pt(size*SCALE); r.font.color.rgb=C(TEAL); para.space_after=Pt(1)
        for b in (body if isinstance(body,list) else [body]):
            para=tf.paragraphs[0] if first else tf.add_paragraph(); first=False
            r=para.add_run(); r.text=b; r.font.size=Pt(size*SCALE); para.line_spacing=1.5; para.space_after=Pt(8 if b is (body[-1] if isinstance(body,list) else body) else 3)
def rounded(pic,adj=9000):
    sp=pic._element.spPr; g=sp.find(qn('a:prstGeom'))
    if g is None: g=etree.SubElement(sp,qn('a:prstGeom'))
    g.set('prst','roundRect'); av=g.find(qn('a:avLst'))
    if av is None: av=etree.SubElement(g,qn('a:avLst'))
    for c in list(av): av.remove(c)
    gd=etree.SubElement(av,qn('a:gd')); gd.set('name','adj'); gd.set('fmla','val %d'%adj)
def addpic(s,name,x,y,w=None,h=None,round_=True):
    p=s.shapes.add_picture(os.path.join(IMG,name),Inches(x),Inches(y),Inches(w) if w else None,Inches(h) if h else None)
    if round_: rounded(p)
    return p
def newslide(layout): return prs.slides.add_slide(L[layout])
def textslide(title,sub,items,pic=None,notes='',size=10,tw=5.3,picx=6.1,pich=None,picw=3.4,extra=None):
    s=newslide('Neuzeit_Textfolie'); settext(ph(s,13),title); settext(ph(s,14),sub)
    b=ph(s,15); b.left,b.top,b.width,b.height=Inches(0.31),Inches(1.33),Inches(tw),Inches(3.9); blocks(b,items,size)
    if pic: addpic(s,pic,picx,1.45,w=picw,h=pich)
    if extra: extra(s)
    if notes: s.notes_slide.notes_text_frame.text=notes
    return s
def divider(title,notes=''):
    s=newslide('Neuzeit_Überschrift'); ph(s,13).insert_picture(io.BytesIO(bg_blob)); settext(ph(s,0),title,bold=True)
    if notes: s.notes_slide.notes_text_frame.text=notes
    return s
def personpic(s,keys,x=6.3,y=1.45,w=1.5):
    for i,k in enumerate(keys): addpic(s,'person_%s.png'%k,x+i*(w+0.15),y,w=w)
# 1 Titel
s=newslide('Neuzeit_Titel'); ph(s,11).insert_picture(os.path.join(IMG,'cover_title.png')); settext(ph(s,0),'Der Buchdruck',bold=True); settext(ph(s,10),'1450',bold=True)
s.notes_slide.notes_text_frame.text='Einstieg: Bild wirken lassen. „Was seht ihr? Welche Rolle spielte dieses Medium?“ Titelbild: Platzhalter bzw. Bild der Vorlage; im Echtbetrieb KI-generiert oder frei gewählt (zentral tauschbar).'
# 2 Epochenübersicht
EP=[('Vor- und Frühgeschichte','783F04','FFFFFF','bis ca. 750 v. Chr.',[('Urknall','vor ca. 13,8 Mrd. Jahren',1),('„Lucy“ (Frühmensch)','vor ca. 3,2 Mio. Jahren',-1),('Neolithische Revolution','ab ca. 10.000 v. Chr.',1)]),
 ('Antike','F1C232','222222','750 v. Chr. – 500 n. Chr.',[('Perikles in Athen','um 450 v. Chr.',1),('Caesar ermordet','44 v. Chr.',-1)]),
 ('Mittelalter','38761D','FFFFFF','500 – 1500',[('Karl der Große','800 Kaiser',1),('Ritter und Burgen','11.–13. Jh.',-1),('Rudolf I. Habsburg','1273',1)]),
 ('Neuzeit','134F5C','FFFFFF','1500 – 1914',[('Gutenberg: Buchdruck','um 1450',-1),('Kolumbus','1492',1),('Luthers Thesen','1517',-1),('Industrielle Revolution','ab ca. 1760',1)]),
 ('Zeitgeschichte','B41617','FFFFFF','1914 – heute',[('Weltkriege','1914–18, 1939–45',1),('Kalter Krieg','1947–1991',-1),('Europäische Union','1993',1)])]
s=newslide('Neuzeit_Textfolie'); settext(ph(s,13),'Epochenübersicht'); settext(ph(s,14),'Einordnung des Themas'); 
b=ph(s,15); b._element.getparent().remove(b._element)
bx,by,bw,bh=0.25,3.0,1.88,0.55
def tb(s,x,y,w,h,lines,size,bold=False,color='222222',align=PP_ALIGN.CENTER,anchor=MSO_ANCHOR.TOP):
    t=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h)); tf=t.text_frame; tf.word_wrap=True; tf.vertical_anchor=anchor; tf.margin_left=tf.margin_right=Inches(0.02); tf.margin_top=tf.margin_bottom=Inches(0)
    for i,l in enumerate(lines):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align; r=p.add_run(); r.text=l; r.font.name=FONT; r.font.size=Pt(size if i==0 else size-1.5); r.font.bold=bold if i==0 else False; r.font.color.rgb=C(color if i==0 else '666666')
    return t
notes=[]
for i,(n,col,tc,z,ev) in enumerate(EP):
    x=bx+i*bw; sh=s.shapes.add_shape(MSO_SHAPE.PENTAGON if i==0 else MSO_SHAPE.CHEVRON,Inches(x),Inches(by),Inches(bw+0.08),Inches(bh)); sh.fill.solid(); sh.fill.fore_color.rgb=C(col); sh.line.fill.background(); sh.shadow.inherit=False
    tf=sh.text_frame; tf.word_wrap=True; tf.vertical_anchor=MSO_ANCHOR.MIDDLE; tf.margin_left=Inches(0.22 if i else 0.06); tf.margin_right=Inches(0.2)
    p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER; r=p.add_run(); r.text=n; r.font.name=FONT; r.font.size=Pt(9.5 if len(n)>14 else 10.5); r.font.bold=True; r.font.color.rgb=C(tc)
    tb(s,x+0.1,by+bh+0.03,bw-0.1,0.2,[z],8.5,True,col if col!='F1C232' else 'B38600')
    k=len(ev); notes.append('%s (%s):'%(n,z))
    for j,(t,yr,side) in enumerate(ev):
        ex=x+0.3+(bw-0.6)*(j+0.5)/k; up=side>0; hi=('Buchdruck' in t)
        y0,y1=((by-0.04),(by-0.55-(0.18 if j%2 else 0))) if up else ((by+bh+0.3),(by+bh+0.62+(0.18 if j%2 else 0)))
        ln=s.shapes.add_connector(1,Inches(ex),Inches(min(y0,y1)),Inches(ex),Inches(max(y0,y1))); ln.line.color.rgb=C('9AA4A9'); ln.line.width=Pt(0.75)
        h=0.46
        tb(s,ex-0.5,(y1-h) if up else (y1+0.01),1.0,h,[t,yr],9.3 if not hi else 9.8,hi,'B4650F' if hi else '222222',anchor=MSO_ANCHOR.BOTTOM if up else MSO_ANCHOR.TOP)
        notes.append('  %s – %s'%(yr,t))
s.notes_slide.notes_text_frame.text='Eingezeichnete Ereignisse und Persönlichkeiten (Jahr – Ereignis):\n'+'\n'.join(notes)+'\n\nBei jeder neuen Präsentation werden andere Ereignisse/Personen gewählt.'
# 3
divider('Die Erfindung des Buchdrucks','Überschriftsfolie (Layout der Vorlage).')
# 4
textslide('Erfindung des Buchdrucks','Technik und Innovation',[('Johannes Gutenberg',['Die Erfindung des Buchdrucks mit beweglichen Lettern geht auf Johannes Gutenberg aus Mainz zurück.','Er kombinierte mehrere bestehende Technologien – Metallguss, Spindelpresse, Ölfarbe und Papier – zu einem neuen, bahnbrechenden System.'])],pic='person_gutenberg.png',picx=6.9,picw=2.4,size=10.5,tw=5.6,notes='Biografie knapp vorstellen. Frage: „Warum blieb Gutenberg wirtschaftlich erfolglos?“ (Platzhalterporträt)')
# 5
textslide('Erfindung des Buchdrucks','Technik und Innovation',[('Bewegliche Lettern','Anders als beim Blockdruck, bei dem ganze Seiten in Holz geschnitten wurden, ermöglichten metallene Einzelbuchstaben eine flexible Zusammensetzung und Wiederverwendung.'),('Druckpresse','Inspiriert von Weinpressen ermöglichte diese Maschine einen gleichmäßigen Druck auf Papier oder Pergament.'),('Spezielle Tinte','Eine ölbasierte Tinte sorgte für eine haltbare und scharfe Abbildung der Buchstaben.')],pic='presse_skizze.png',picx=5.9,picw=3.5,notes='Skizze der Druckerpresse; Verweis auf Arbeitsblatt Aufgabe 1.')
# 6
textslide('Gutenberg-Bibel','„B42“ – Das erste mit beweglichen Lettern gedruckte große Buch',[('',['Die „Gutenberg-Bibel“, wegen der 42 Zeilen pro Seite auch „B42“ genannt, ist das erste größere mit beweglichen Lettern gedruckte Buch des Westens.','Statt Jahre für eine einzige Abschrift zu benötigen, konnten nun etwa 180 Exemplare in kurzer Zeit hergestellt werden. Initialen und Verzierungen wurden danach von Hand ergänzt.'])],pic='szene_werkstatt.png',picx=5.9,picw=3.6,notes='Zahl: Schätzung (ca. 180 Exemplare). Szene: Platzhalterillustration.',size=10.5)
# 7 Zeitstrahl
s=newslide('Neuzeit_Textfolie'); settext(ph(s,13),'Zeitstrahl'); settext(ph(s,14),'Der Buchdruck 1450 – 1550'); b=ph(s,15); b._element.getparent().remove(b._element)
addpic(s,'zeitstrahl.png',0.55,1.4,w=8.9,round_=False); s.notes_slide.notes_text_frame.text='Zeitstrahl durchgehen: 1450, 1455, 1486, 1492, 1517, 1543.'
# 8
divider('Menschen hinter dem Buchdruck','Personen: Fust, Schöffer, Aldus Manutius, Erasmus, Luther, Kopernikus, Vesalius. Porträts sind Platzhalter.')
# 9
s=textslide('Johannes Fust und Peter Schöffer','Geldgeber und Drucker',[('Johannes Fust','Mainzer Kaufmann; lieh Gutenberg ab 1450 große Summen und übernahm 1455 Teile der Werkstatt.'),('Peter Schöffer','Schreiber und Drucker; druckte mit Fust 1457 den „Mainzer Psalter“ – das erste Druckwerk mit Datum und Druckernennung.')],notes='Frage: Wer trug das wirtschaftliche Risiko?',tw=4.9,size=10.5)
personpic(s,['fust','schoeffer'],x=5.65,w=1.85)
# 10
s=textslide('Aldus Manutius','Venedig als Druckzentrum',[('Handliche Formate','Der Humanist gründete in Venedig eine Druckerei (ab 1494/95) für antike Klassiker in preiswerten, handlichen Ausgaben.'),('Kursive','Die Kursivschrift (ab 1501) ist bis heute in Gebrauch.')],pic='person_aldus.png',picx=6.5,picw=2.6,size=10.5,tw=5.3,notes='Frage: Wie verändert ein handliches Format die Nutzung von Büchern?')
# 11
textslide('Erasmus von Rotterdam','Humanismus und Buchdruck',[('„Ad fontes“','Humanisten wollten Texte in ihrer ursprünglichen Form lesen und stellten den Menschen in den Mittelpunkt.'),('Neues Testament (1516)','Erasmus gab das griechische Neue Testament mit lateinischer Übersetzung heraus und arbeitete eng mit dem Drucker Johann Froben in Basel zusammen.')],pic='person_erasmus.png',picx=6.5,picw=2.6,size=10.5,tw=5.3,notes='Humanismus + Buchdruck: Idee und Technik.')
# 12
textslide('Martin Luther','Reformation und Buchdruck',[('Flugschriften','Luthers Thesen (1517) verbreiteten sich rasch; kurze, preiswerte Flugschriften mit Holzschnitten erreichten auch Menschen, die nur zuhörten.'),('Bibelübersetzung','1522 erschien das Neue Testament, 1534 die ganze Bibel auf Deutsch – ein Beitrag zu einer einheitlicheren Schriftsprache.')],pic='person_luther.png',picx=6.5,picw=2.6,size=10.5,tw=5.3,notes='Verweis auf Arbeitsblatt Aufgabe 3 (Quelle: Sendbrief vom Dolmetschen).')
# 13
s=textslide('Kopernikus und Vesalius','Wissenschaft und neues Weltbild (1543)',[('Nikolaus Kopernikus','„De revolutionibus“: Die Sonne steht im Zentrum (heliozentrisches Weltbild).'),('Andreas Vesalius','„De humani corporis fabrica“: genaue Abbildungen des Körpers nach eigener Beobachtung.'),('Warum der Druck wichtig war','Alle Exemplare sind gleich, Aussagen lassen sich überprüfen und weiterentwickeln.')],tw=4.9,size=10,notes='Frage: Warum ist ein gedrucktes Werk für Wissenschaft wichtiger als eine Handschrift?')
personpic(s,['kopernikus','vesalius'],x=5.65,w=1.85)
# 14
textslide('Der Buchdruck erobert Europa','Ausbreitung ab Mainz',[('Zahlen (Schätzungen)',['Bis 1500: Druckereien an etwa 250 Orten.','Etwa 20 Millionen Exemplare bis 1500 (Inkunabeln).','42-zeilige Bibel: etwa 180 Exemplare.']),('Zentren','Mainz, Straßburg, Köln, Basel, Nürnberg, Venedig, Paris.')],pic='karte_druckorte.png',picx=4.6,picw=5.0,size=10,tw=3.9,notes='Schemakarte: ungefähre Jahre der ersten Druckerei. Frage: Warum entstehen Druckzentren in Handelsstädten?')
# 15–17 Vorteile
divider('Vorteile des Buchdrucks')
textslide('Vorteile des Buchdrucks','',[('1. Bücher wurden günstiger','Eine handgeschriebene Bibel entsprach zuvor dem Wert eines Hauses; mit dem Druck sanken die Preise.'),('2. Bildung für Alle','Bildung war nicht länger dem Klerus und Adel vorbehalten; Schulen, Universitäten und Haushalte konnten Bücher kaufen.'),('3. Wissenschaftlicher Fortschritt','Erkenntnisse von Forschern wie Kopernikus verbreiteten sich schneller und führten zu Diskussionen.')],pic='szene_skriptorium.png',picx=6.4,picw=3.1,size=9.5,tw=5.7,notes='Vorteile 1–3.')
textslide('Vorteile des Buchdrucks','',[('4. Standardisierung von Sprache und Inhalten','Einheitliche Schreibweisen trugen zur Herausbildung nationaler Sprachen bei; Fehlerquellen durch Abschreiben wurden reduziert.'),('5. Politische und religiöse Umwälzungen','Die Reformation wäre ohne Buchdruck undenkbar gewesen. Flugblätter und Zeitungen ermöglichten erstmals eine breite öffentliche Meinungsbildung.')],pic='grafik_weltbild.png',picx=6.4,picw=3.1,size=9.5,tw=5.7,notes='Vorteile 4–5.')
# 18–20 Nachteile
divider('Nachteile des Buchdrucks')
textslide('Nachteile des Buchdrucks','',[('1. Qualität und Massenproduktion','Kritiker bemängelten den Verlust handwerklicher Buchkunst.'),('2. „Fake News“','Fehlinformationen verbreiteten sich schneller, da nicht alle Drucke sorgfältig geprüft wurden.'),('3. Zensur und Kontrolle','Obrigkeit (Adel und Kirche) reagierte mit Zensur: 1486 Zensuredikt in Mainz, 1559 erster „Index verbotener Bücher“.')],pic='szene_werkstatt.png',picx=6.0,picw=3.5,size=9.5,tw=5.4,notes='Nachteile 1–3.')
textslide('Nachteile des Buchdrucks','',[('4. Soziale Spannungen','Die Flut neuer Ideen destabilisierte bestehende Machtstrukturen und führte zu Konflikten. Gedruckte Flugschriften mobilisierten Menschen für Umbrüche und politische Ziele, zum Beispiel:'),('',['–  Reformation','–  Bauernkriege','–  Französische Revolution'])],pic='person_luther.png',picx=6.6,picw=2.5,size=9.5,tw=5.7,notes='Nachteile 4.')
# 24 Video
s=newslide('Video'); settext(ph(s,15),'[Titel des Videos – wird aus dem Link gelesen]'); settext(ph(s,23),'[mm:ss]'); settext(ph(s,24),'[Kanal / Quelle]'); settext(ph(s,25),'[https://…]'); 
if ph(s,21) is not None: settext(ph(s,21),'')
_vp=s.shapes.add_picture(os.path.join(IMG,'video_platzhalter.png'),Inches(0.35),Inches(1.45),Inches(5.27),Inches(2.96)); _vp.line.color.rgb=C('FFFFFF'); _vp.line.width=Pt(3)
s.notes_slide.notes_text_frame.text='Videofolie: Link einfügen – Titel, Länge, Quelle und URL füllen sich automatisch; die Videodatei wird lokal gespeichert (Material/Videos) und hier eingebettet. Hinweis: Download nur bei Erlaubnis oder freier Lizenz.'
# 25–29 Aufgaben
def shadow(pic):
    sp=pic._element.spPr; eff=etree.SubElement(sp,qn('a:effectLst'))
    sh=etree.SubElement(eff,qn('a:outerShdw')); sh.set('blurRad','228600'); sh.set('dist','0'); sh.set('dir','0'); sh.set('algn','ctr'); sh.set('rotWithShape','0')
    c=etree.SubElement(sh,qn('a:srgbClr')); c.set('val','000000'); al=etree.SubElement(c,qn('a:alpha')); al.set('val','70000')
def task(name,sub,steps,thumb,back='thumb_textblatt.png',landscape=False,notes=''):
    s=newslide('Arbeitsauftrag'); settext(ph(s,22),AO); settext(ph(s,21),sub)
    p20=ph(s,20)
    if p20 is not None: p20._element.getparent().remove(p20._element)
    cy=(1.57,2.25,2.96,3.67,4.37)
    for k,i in enumerate((15,16,17,18,19)):
        p=ph(s,i); settext(p,steps[k] if k<len(steps) else '')
        p.left,p.top,p.width,p.height=Inches(6.73),Inches(cy[k]-0.32),Inches(3.2),Inches(0.64); p.text_frame.vertical_anchor=MSO_ANCHOR.MIDDLE; p.text_frame.word_wrap=True
        p.text_frame.margin_top=p.text_frame.margin_bottom=0
        for para in p.text_frame.paragraphs: para.alignment=PP_ALIGN.LEFT
    # Vorschau: Textblatt hinten, jeweiliges Blatt vorn – zentriert im schwarzen Bereich (Mitte ca. x = 3,45 in)
    P=lambda n,x,y,w=None,h=None: s.shapes.add_picture(os.path.join(IMG,n),Inches(x),Inches(y),Inches(w) if w else None,Inches(h) if h else None)
    if thumb==back:    # Textblatt-Folie: zwei Seiten
        b_=P('thumb_textblatt3.png',1.65,1.45,h=3.1); f_=P(thumb,2.95,2.15,h=3.1)
    elif landscape:
        b_=P(back,1.65,1.4,h=3.1); f_=P(thumb,2.3,2.7,w=3.5)
    else:
        b_=P(back,1.65,1.4,h=3.1); f_=P(thumb,2.95,2.2,h=3.1)
    shadow(b_); shadow(f_)
    s.notes_slide.notes_text_frame.text=notes or ('Aufgabenfolie: '+name+' (hinten: Textblatt, vorn: das jeweilige Arbeitsblatt – beides erste Seite, automatisch aus den Dokumenten erzeugt).')
    return s
T='Rufe den Arbeitsauftrag auf Microsoft Teams ab'
task('Textblatt','Textblatt',[T,'Lies das Textblatt durch','Markiere Schlüsselbegriffe','Notiere zwei Fragen an den Text','Bringe deine Fragen in die nächste Stunde mit'],'thumb_textblatt.png')
task('Arbeitsblatt','Offene Fragen',[T,'Lies das Textblatt','Bearbeite das Arbeitsblatt in ganzen Sätzen','Lade ein Foto deines Arbeitsblatts auf Microsoft Teams hoch','Vergleiche deine Antworten in der nächsten Stunde'],'thumb_arbeitsblatt.png')
task('Lückentext','Lückentext',[T,'Lies das Textblatt','Fülle den Lückentext mit dem Wortspeicher aus','Lade ein Foto deines Lückentextes auf Microsoft Teams hoch','Kontrolliere gemeinsam in der nächsten Stunde'],'thumb_lueckentext.png')
task('Kreuzworträtsel','Kreuzworträtsel',[T,'Lies dir die pdf-Datei durch','Fülle das Kreuzworträtsel aus','Lade ein Foto deines Kreuzworträtsels auf Microsoft Teams hoch','Kontrolliere gemeinsam in der nächsten Stunde'],'thumb_kreuzwort.png',landscape=True)
task('Check-up','Check-up',['Öffne den Link zum Check-up (Kahoot, Plickers oder Forms)','Beantworte alle Fragen','Gib deine Antworten ab','Prüfe dein Ergebnis','Besprich die Auswertung in der nächsten Stunde'],'thumb_checkup.png')
# 30 Quellen
textslide('Quellen und Bildnachweis','Nachweis',[('Literatur','Siehe Quellenblatt im Textblatt (Gutenberg-Museum Mainz u. a.). Piccolomini 1455 (sinngemäß); Luther, Sendbrief vom Dolmetschen 1530.'),('Lehrplan','Geschichte und Politische Bildung, Sekundarstufe 2 (AHS).'),('Bilder','Titelbild und Überschriftsbilder: Vorlage bzw. Platzhalter. Porträts und Szenen: Platzhalter-Illustrationen; Grafiken: eigene Darstellung.'),('Hinweis','Material mit KI-Unterstützung erstellt und fachlich geprüft.')],size=10,tw=8.4,notes='Quellenfolie.')
prs.save(os.path.join(OUT,'Praesentation_Buchdruck.pptx')); print('slides',len(prs.slides))
