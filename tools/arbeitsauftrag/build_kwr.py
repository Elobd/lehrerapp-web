from lib import *
from docx.enum.table import WD_ROW_HEIGHT_RULE
import random
F=FONT_C
OUT=os.path.join(HERE,'..','out')
WORDS=[('GUTENBERG','Nachname des Erfinders des Buchdrucks mit beweglichen Lettern'),('MAINZ','Stadt, in der Gutenberg seine Werkstatt hatte'),('LETTERN','Einzelne, wiederverwendbare Metallbuchstaben'),('PRESSE','Gerät, das das Papier auf den eingefärbten Satz drückt'),('INKUNABEL','Druck aus der Zeit bis einschließlich 1500 (Wiegendruck)'),('FUST','Kaufmann, der Gutenbergs Werkstatt finanzierte'),('HUMANISMUS','Bildungsbewegung, die „zu den Quellen“ zurückkehren wollte'),('LUTHER','Reformator, der die Bibel ins Deutsche übersetzte'),('FLUGSCHRIFT','Billiges, kurzes Heft zu aktuellen Streitfragen'),('ZENSUR','Kontrolle und Verbot von Schriften durch Kirche oder Staat'),('PRIVILEG','Zeitlich begrenztes Alleinrecht zum Druck eines Werks'),('PAPIER','Billiger Beschreibstoff, der das Pergament verdrängte'),('KOPERNIKUS','Veröffentlichte 1543 das heliozentrische Weltbild'),('SCHOEFFER','Drucker, der nach 1455 mit Fust weiterarbeitete (Ö = OE)'),('VENEDIG','Italienisches Druckzentrum von Aldus Manutius'),('ERASMUS','Humanist, der 1516 das griechische Neue Testament herausgab')]
def make(words,size=21,seed=3):
    best=None
    for att in range(400):
        rnd=random.Random(seed+att); ws=sorted(words,key=lambda x:-len(x[0])); first=ws[0]; rest=ws[1:]; rnd.shuffle(rest); ws=[first]+rest
        g={}; placed=[]
        def can(w,r,c,dr,dc):
            if (r-dr,c-dc) in g or (r+dr*len(w),c+dc*len(w)) in g: return False
            hit=0
            for i,ch in enumerate(w):
                rr,cc=r+dr*i,c+dc*i
                if abs(rr)>size or abs(cc)>size: return False
                if (rr,cc) in g:
                    if g[(rr,cc)]!=ch: return False
                    hit+=1
                else:
                    for pr,pc in ((rr+dc,cc+dr),(rr-dc,cc-dr)):   # Nachbarn quer zur Richtung
                        if (pr,pc) in g: return False
            return hit
        def put(w,r,c,dr,dc,cl):
            for i,ch in enumerate(w): g[(r+dr*i,c+dc*i)]=ch
            placed.append((w,r,c,dr,dc,cl))
        w0,c0=ws[0]; put(w0,0,0,0,1,c0)
        for w,cl in ws[1:]:
            opts=[]
            for (r,c),ch in list(g.items()):
                for i,x in enumerate(w):
                    if x!=ch: continue
                    for dr,dc in ((0,1),(1,0)):
                        rr,cc=r-dr*i,c-dc*i
                        if any(p[3]==dr and p[4]==dc and ((dr==0 and p[1]==rr) or (dc==0 and p[2]==cc)) for p in placed):
                            # gleiche Linie nur zulassen, wenn nicht überlappend
                            pass
                        h=can(w,rr,cc,dr,dc)
                        if h==1 or (h and h>1): opts.append((h,rr,cc,dr,dc))
            if opts:
                rnd.shuffle(opts); opts.sort(key=lambda x:-x[0]); h,rr,cc,dr,dc=opts[0]; put(w,rr,cc,dr,dc,cl)
        rs=[k[0] for k in g]; cs=[k[1] for k in g]; area=(max(rs)-min(rs)+1)*(max(cs)-min(cs)+1)
        score=(len(placed),-area)
        if best is None or score>best[0]: best=(score,dict(g),list(placed))
        if len(placed)==len(words) and att>40: break
    return best
(sc,g,placed)=make(WORDS)
rs=[k[0] for k in g]; cs=[k[1] for k in g]; r0,c0=min(rs),min(cs); H,W=max(rs)-r0+1,max(cs)-c0+1
# Nummerierung nach Leserichtung
starts={}
for w,r,c,dr,dc,cl in placed: starts.setdefault((r-r0,c-c0),[]).append((w,dr,dc,cl))
nums={}; n=0
for key in sorted(starts): n+=1; nums[key]=n
across=sorted([(nums[(r-r0,c-c0)],w,cl) for w,r,c,dr,dc,cl in placed if dc==1]); down=sorted([(nums[(r-r0,c-c0)],w,cl) for w,r,c,dr,dc,cl in placed if dr==1])
print('platziert',len(placed),'von',len(WORDS),'Raster',H,'x',W)
def build(loesung):
    d=new_doc(landscape=True,font=F,size=11,margins=(1.4,1.6,1.4,1.6)); build_header_footer(d,'Kreuzworträtsel','Der Buchdruck',loesung=loesung,font=F)
    p=d.add_paragraph(); no_space(p,0,0); r=p.add_run('Kreuzworträtsel'); setfont(r,F,22,True,color=COL); r=p.add_run('  |  Der Buchdruck'); setfont(r,F,13,True,color='555555'); r=p.add_run('     Ä = AE   Ö = OE   Ü = UE   ß = SS'); setfont(r,F,10,color='777777')
    outer=d.add_table(1,2); outer.autofit=False; a,b=outer.rows[0].cells; outer.columns[0].width=Cm(14.9); outer.columns[1].width=Cm(11.5); a.width=Cm(14.9); b.width=Cm(11.5)
    cm=min(0.62,14.2/max(W,1)); gt=a.add_table(H,W); gt.autofit=False
    for j in range(W): gt.columns[j].width=Cm(cm)
    for i in range(H):
        gt.rows[i].height=Cm(cm); gt.rows[i].height_rule=WD_ROW_HEIGHT_RULE.EXACTLY
        for j in range(W):
            c=gt.rows[i].cells[j]; c.width=Cm(cm); cell_margins(c,0,0,20,20)
            ch=g.get((i+r0,j+c0))
            if ch is None:
                continue
            cell_borders(c,top=(6,'333333'),bottom=(6,'333333'),left=(6,'333333'),right=(6,'333333'))
            p=c.paragraphs[0]; no_space(p); p.alignment=WD_ALIGN_PARAGRAPH.LEFT; p.paragraph_format.line_spacing=1.0
            if (i,j) in nums: r=p.add_run(str(nums[(i,j)])); setfont(r,F,6,True,color=COL)
            if loesung:
                r=p.add_run(ch if (i,j) not in nums else ' '+ch); setfont(r,F,10,True,color=RED)
    for lab,lst in (('Waagrecht',across),('Senkrecht',down)):
        p=b.add_paragraph() if lab=='Senkrecht' else b.paragraphs[0]; no_space(p,4,2); r=p.add_run(lab); setfont(r,F,12,True,color=COL)
        for n_,w,cl in lst:
            p=b.add_paragraph(); no_space(p,0,1); p.paragraph_format.left_indent=Cm(0.7); p.paragraph_format.first_line_indent=Cm(-0.7); r=p.add_run('%d  '%n_); setfont(r,F,9,True,color=COL); r=p.add_run(cl+('  → '+w if loesung else '')+('  (%d)'%len(w))); setfont(r,F,9.5)
    if not loesung:
        p=a.add_paragraph(); no_space(p,12,0); r=p.add_run('Name: ______________________________   Datum: ______________   Klasse: ________'); setfont(r,F,11,True,color='555555')
    if not loesung: quellen(d,QUELLEN,font=F)
    d.save(os.path.join(OUT,'Kreuzwortraetsel%s.docx'%('_LOESUNG' if loesung else '')))
build(False); build(True)
