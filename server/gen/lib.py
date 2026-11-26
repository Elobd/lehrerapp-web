import os, copy
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_ORIENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
HERE=os.path.dirname(os.path.abspath(__file__)); IMG=os.path.join(HERE,'img')
AO='Der Buchdruck | Medienrevolution um 1450'   # Name des Arbeitsauftrags
EPOCHE='Neuzeit'; ZEIT='ca. 1500 – 1914'; COL='134F5C'; LIGHT='E3EEF0'; RED='7A4B00'; BAND='111111'; BANDTXT='FFD400'; OCHER='C0791B'
FONT_S='Source Sans Pro'; FONT_M='Maven Pro'; FONT_C='Calibri'
def rgb(h): return RGBColor.from_string(h.upper())
def setfont(run,name,size=None,bold=None,italic=None,color=None):
    run.font.name=name; rpr=run._element.get_or_add_rPr(); rf=rpr.find(qn('w:rFonts'))
    if rf is None: rf=OxmlElement('w:rFonts'); rpr.insert(0,rf)
    for a in ('w:ascii','w:hAnsi','w:cs','w:eastAsia'): rf.set(qn(a),name)
    if size: run.font.size=Pt(size)
    if bold is not None: run.font.bold=bold
    if italic is not None: run.font.italic=italic
    if color: run.font.color.rgb=rgb(color)
def shade_par(p,fill):
    ppr=p._p.get_or_add_pPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:val'),'clear'); sh.set(qn('w:color'),'auto'); sh.set(qn('w:fill'),fill); ppr.append(sh)
def shade_cell(c,fill):
    tcpr=c._tc.get_or_add_tcPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:val'),'clear'); sh.set(qn('w:color'),'auto'); sh.set(qn('w:fill'),fill); tcpr.append(sh)
def cell_borders(c,**kw):
    tcpr=c._tc.get_or_add_tcPr(); b=OxmlElement('w:tcBorders')
    for side in ('top','left','bottom','right'):
        v=kw.get(side); e=OxmlElement('w:'+side)
        if v: e.set(qn('w:val'),'single'); e.set(qn('w:sz'),str(v[0])); e.set(qn('w:color'),v[1]); e.set(qn('w:space'),'0')
        else: e.set(qn('w:val'),'nil')
        b.append(e)
    tcpr.append(b)
def cell_margins(c,top=80,bottom=80,left=140,right=140):
    tcpr=c._tc.get_or_add_tcPr(); m=OxmlElement('w:tcMar')
    for k,v in (('top',top),('left',left),('bottom',bottom),('right',right)):
        e=OxmlElement('w:'+k); e.set(qn('w:w'),str(v)); e.set(qn('w:type'),'dxa'); m.append(e)
    tcpr.append(m)
def par_border_bottom(p,color,sz=12):
    ppr=p._p.get_or_add_pPr(); b=OxmlElement('w:pBdr'); e=OxmlElement('w:bottom'); e.set(qn('w:val'),'single'); e.set(qn('w:sz'),str(sz)); e.set(qn('w:space'),'4'); e.set(qn('w:color'),color); b.append(e); ppr.append(b)
def field(par,code,font,size,color='555555'):
    r=par.add_run(); setfont(r,font,size,color=color)
    for t,txt in (('begin',None),('instr',code),('separate',None),('text','1'),('end',None)):
        if t=='instr': e=OxmlElement('w:instrText'); e.set(qn('xml:space'),'preserve'); e.text=' %s '%code; r._r.append(e)
        elif t=='text': e=OxmlElement('w:t'); e.text=txt; r._r.append(e)
        else: e=OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),t); r._r.append(e)
def no_space(p,before=0,after=0,line=None):
    pf=p.paragraph_format; pf.space_before=Pt(before); pf.space_after=Pt(after)
    if line: pf.line_spacing=line
def new_doc(landscape=False,font=FONT_S,size=11,margins=(2.0,2.2,2.0,2.2),first_diff=False):
    d=Document(); s=d.sections[0]
    if landscape: s.orientation=WD_ORIENT.LANDSCAPE; s.page_width=Cm(29.7); s.page_height=Cm(21.0)
    else: s.page_width=Cm(21.0); s.page_height=Cm(29.7)
    s.top_margin=Cm(margins[0]+1.6); s.bottom_margin=Cm(margins[2]); s.left_margin=Cm(margins[1]); s.right_margin=Cm(margins[3]); s.header_distance=Cm(0.8); s.footer_distance=Cm(0.9)
    st=d.styles['Normal']; st.font.name=font; st.font.size=Pt(size); st.element.rPr.rFonts.set(qn('w:eastAsia'),font)
    for a in ('w:ascii','w:hAnsi','w:cs'): st.element.rPr.rFonts.set(qn(a),font)
    st.paragraph_format.space_after=Pt(6); st.paragraph_format.line_spacing=1.2
    d._font=font; d._land=landscape; d.settings.element  # noqa
    return d
def build_header_footer(d,blattart,thema,loesung=False,col=None,font=FONT_S,band=None):
    col=col or COL
    s=d.sections[0]; h=s.header; h.is_linked_to_previous=False
    for p in list(h.paragraphs)[1:]: p._p.getparent().remove(p._p)
    w=s.page_width-s.left_margin-s.right_margin
    t=h.add_table(1,3,w); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    ws=[Emu(int(w*0.34)),Emu(int(w*0.36)),Emu(int(w*0.30))]
    for c,wd in zip(t.rows[0].cells,ws): c.width=wd; cell_borders(c,bottom=(18,col)); cell_margins(c,0,60,0,0)
    c0,c1,c2=t.rows[0].cells
    p=c0.paragraphs[0]; no_space(p); r2=p.add_run('Geschichte und\nPolitische Bildung'); setfont(r2,font,9.5,True,color=col)
    p=c1.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(p); r=p.add_run(thema); setfont(r,font,10.5,True,color='222222')
    p=c2.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.RIGHT; no_space(p); r=p.add_run(EPOCHE); setfont(r,font,10.5,True,color=col); r=p.add_run('\n'+ZEIT); setfont(r,font,9,color='555555')
    h.paragraphs[0]._p.getparent().remove(h.paragraphs[0]._p) if len(h.paragraphs)>1 else None
    if loesung:
        p=h.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; shade_par(p,BAND); no_space(p,4,0); r=p.add_run(band or 'LÖSUNGSBLATT  |  nur für die Lehrkraft  |  nicht an Schüler/innen austeilen'); setfont(r,font,10.5,True,color=BANDTXT)
    f=s.footer; f.is_linked_to_previous=False; p=f.paragraphs[0]; p.text=''; par_border_bottom(p,'CCCCCC',4) if False else None
    p.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(p)
    r=p.add_run('Arbeitsauftrag: '); setfont(r,font,9,color='777777'); r=p.add_run(AO); setfont(r,font,9,True,color=col)
    r=p.add_run('   |   '+blattart+('  (LÖSUNG)' if loesung else '')+'   |   Seite '); setfont(r,font,9,color='777777'); field(p,'PAGE',font,9,'777777'); r=p.add_run(' von '); setfont(r,font,9,color='777777'); field(p,'NUMPAGES',font,9,'777777')
def title(d,text,sub=None,font=FONT_S,col=None,size=22):
    col=col or COL
    p=d.add_paragraph(); no_space(p,0,2); r=p.add_run(text); setfont(r,font,size,True,color=col); par_border_bottom(p,col,0) if False else None
    if sub: p=d.add_paragraph(); no_space(p,0,8); r=p.add_run(sub); setfont(r,font,11.5,color='555555')
def h1(d,text,font=FONT_S,col=None,size=15,before=14):
    col=col or COL
    p=d.add_paragraph(); no_space(p,before,4); p.paragraph_format.keep_with_next=True; r=p.add_run(text); setfont(r,font,size,True,color=col); par_border_bottom(p,col,8); return p
def h2(d,text,font=FONT_S,col=None,size=12):
    col=col or COL
    p=d.add_paragraph(); no_space(p,8,2); p.paragraph_format.keep_with_next=True; r=p.add_run(text); setfont(r,font,size,True,color=col); return p
def para(d,text,font=FONT_S,size=11.5,bold=False,italic=False,color=None,after=6,align=None,before=0):
    p=d.add_paragraph(); no_space(p,before,after)
    if align=='j': p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
    # **fett** Auszeichnung
    parts=text.split('**')
    for i,t in enumerate(parts):
        if not t: continue
        r=p.add_run(t); setfont(r,font,size,bold or (i%2==1),italic,color)
    return p
def bullets(d,items,font=FONT_S,size=11.5,mark='•',indent=0.6):
    for it in items:
        p=d.add_paragraph(); no_space(p,0,3); p.paragraph_format.left_indent=Cm(indent); p.paragraph_format.first_line_indent=Cm(-0.45)
        r=p.add_run(mark+' '); setfont(r,font,size,True,color=COL)
        for i,t in enumerate(it.split('**')):
            if t: r=p.add_run(t); setfont(r,font,size,i%2==1)
def box(d,label,text,fill=LIGHT,bar=None,font=FONT_S,size=10.5,title_txt=None,italic=False,width_cm=None):
    bar=bar or COL
    t=d.add_table(1,1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; c=t.rows[0].cells[0]; shade_cell(c,fill); cell_borders(c,left=(36,bar)); cell_margins(c,100,100,200,160)
    p=c.paragraphs[0]; no_space(p,0,2); r=p.add_run(label.upper()+(('  |  '+title_txt) if title_txt else '')); setfont(r,font,9.5,True,color=bar)
    for chunk in (text if isinstance(text,list) else [text]):
        p=c.add_paragraph(); no_space(p,0,2)
        for i,tx in enumerate(chunk.split('**')):
            if tx: r=p.add_run(tx); setfont(r,font,size,i%2==1,italic)
    sp=d.add_paragraph(); no_space(sp,0,4); sp.paragraph_format.line_spacing=0.6
    return t
def image(d,name,width_cm,caption=None,font=FONT_S):
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(p,4,2); p.paragraph_format.keep_with_next=bool(caption); r=p.add_run(); r.add_picture(os.path.join(IMG,name),width=Cm(width_cm))
    if caption: c=d.add_paragraph(); c.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(c,0,8); r=c.add_run(caption); setfont(r,font,9,italic=True,color='666666')
def pagebreak(d): d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
def quellen(d,items,font=FONT_S,bilder=None):
    hq=h1(d,'Quellen und Bildnachweis',font=font,before=0); hq.paragraph_format.page_break_before=True
    para(d,'Arbeitsauftrag: **'+AO+'**',font=font,size=10.5,color='555555')
    h2(d,'Literatur und Quellen',font=font)
    for i,it in enumerate(items,1): para(d,'[%d] %s'%(i,it),font=font,size=10,after=3)
    h2(d,'Bilder und Grafiken',font=font)
    for it in (bilder or ['Alle Grafiken: eigene Darstellung für dieses Arbeitsmaterial.','Titelbild: Probebild (Platzhalter) – im Echtbetrieb KI-generiert oder frei lizenziert; Quelle und Lizenz stehen dann hier.']): para(d,it,font=font,size=10,after=3)
    para(d,'Hinweis: Dieses Material wurde mit KI-Unterstützung auf Basis der genannten Quellen erstellt und von der Lehrkraft fachlich geprüft.',font=font,size=9.5,italic=True,color='666666',before=8)
EPOCHEN={'Grundlagen & Methoden':('4A5A8C','epochenübergreifend'),'Vor- und Frühgeschichte':('783F04','bis ca. 750 v. Chr.'),'Antike':('F1C232','750 v. Chr. – 500 n. Chr.'),'Mittelalter':('38761D','500 – 1500'),'Neuzeit':('134F5C','1500 – 1914'),'Zeitgeschichte':('B41617','1914 – heute')}
QUELLEN=[]
def configure(meta):
    """Setzt Titel, Epoche, Farbe und Quellen für alle Dokumente (Module-Variablen von lib)."""
    global AO,EPOCHE,ZEIT,COL,QUELLEN
    ep=meta.get('epoche') or 'Neuzeit'; col,zt=EPOCHEN.get(ep,EPOCHEN['Neuzeit'])
    AO=(meta.get('titel') or 'Arbeitsauftrag')+((' | '+meta['untertitel']) if meta.get('untertitel') else '')
    EPOCHE=ep; ZEIT=meta.get('zeitraum') or zt; COL=col; QUELLEN=list(meta.get('quellen') or [])

def person_card(d,name,dates,role,img,text,font=FONT_S,size=10.5):
    t=d.add_table(1,2); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False; a,b=t.rows[0].cells; t.columns[0].width=Cm(3.6); t.columns[1].width=Cm(12.9); a.width=Cm(3.6); b.width=Cm(12.9)
    for c in (a,b): shade_cell(c,'F6EFE2'); cell_margins(c,100,100,160,160)
    cell_borders(a,left=(36,COL)); cell_borders(b)
    p=a.paragraphs[0]; no_space(p); r=p.add_run(); r.add_picture(img,width=Cm(3.1))
    p=b.paragraphs[0]; no_space(p,0,1); r=p.add_run('PERSON'); setfont(r,font,9,True,color=COL)
    p=b.add_paragraph(); no_space(p,0,0); r=p.add_run(name); setfont(r,font,13,True)
    p=b.add_paragraph(); no_space(p,0,3); r=p.add_run((dates+' | ' if dates else '')+role); setfont(r,font,9.5,italic=True,color='666666')
    p=b.add_paragraph(); no_space(p,0,0); r=p.add_run(text); setfont(r,font,size)
    sp=d.add_paragraph(); no_space(sp,0,4); sp.paragraph_format.line_spacing=0.6

def name_row(d,font=FONT_S,size=11):
    from docx.enum.table import WD_ROW_HEIGHT_RULE, WD_CELL_VERTICAL_ALIGNMENT
    t=d.add_table(1,3); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    ws=[Cm(8.4),Cm(4.6),Cm(3.8)]
    t.rows[0].height=Cm(1.2); t.rows[0].height_rule=WD_ROW_HEIGHT_RULE.AT_LEAST
    for j,(c,l) in enumerate(zip(t.rows[0].cells,['Name:','Datum:','Klasse:'])):
        c.width=ws[j]; t.columns[j].width=ws[j]; c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.BOTTOM
        cell_borders(c,bottom=(10,'666666')); cell_margins(c,80,60,0,160)
        p=c.paragraphs[0]; no_space(p); r=p.add_run(l); setfont(r,font,size,True,color='555555')
    sp=d.add_paragraph(); no_space(sp,0,6)
