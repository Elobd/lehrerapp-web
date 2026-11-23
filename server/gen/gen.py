"""Erzeugt aus einer auftrag.json (KI-Inhalt) alle Unterrichtsmaterialien. Aufruf: python3 gen.py auftrag.json ausgabeordner [vorlage.pptx]"""
import os, sys, json, re, csv, random
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import lib as L
from lib import *
from docx.enum.table import WD_ROW_HEIGHT_RULE
import igen
SAFE=lambda s: re.sub(r'[^A-Za-z0-9ÄÖÜäöüß_-]+','-',str(s)).strip('-')[:60] or 'Arbeitsauftrag'
BOX={'merke':('FBF3E4',None,False),'begriff':(LIGHT,None,False),'quelle':('EEF3F4',None,True),'zahl':('F6EBD9',None,False),'nachdenken':('F2F2F2','888888',False)}
def box_typ(d,typ,titel,text,font):
    k=str(typ or 'begriff').lower(); k='nachdenken' if k.startswith('nach') or k.startswith('zum') else k; fill,bar,it=BOX.get(k,BOX['begriff'])
    bar=bar or (L.OCHER if k in('merke','zahl') else L.COL); label={'nachdenken':'Zum Nachdenken'}.get(k,k.capitalize())
    box(d,label,text if isinstance(text,list) else [text],font=font,fill=fill,bar=bar,italic=it,title_txt=titel or None)
def textblatt(data,out,im):
    F=FONT_M; tb=data.get('textblatt') or {}; d=new_doc(font=F,size=11); build_header_footer(d,'Textblatt',data.get('titel',''),font=F)
    p=d.add_paragraph(); no_space(p,10,4); r=p.add_run('TEXTBLATT  |  VORINFORMATION'); setfont(r,F,11,True,color=L.OCHER)
    p=d.add_paragraph(); no_space(p,0,2); r=p.add_run(data.get('titel','')); setfont(r,F,32,True,color=L.COL)
    p=d.add_paragraph(); no_space(p,0,12); r=p.add_run(data.get('untertitel','')); setfont(r,F,14,color='444444')
    image(d,im['cover'],16.4)
    t=d.add_table(1,3); t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for c,(a,b) in zip(t.rows[0].cells,[('Arbeitsauftrag',L.AO),('Klassenstufe',str(data.get('klasse','')).rstrip('.')+'. Klasse (Sekundarstufe 2)'),('Epoche',L.EPOCHE+' | '+L.ZEIT)]):
        shade_cell(c,LIGHT); cell_margins(c,100,100,160,100); p=c.paragraphs[0]; no_space(p); r=p.add_run(a.upper()); setfont(r,F,8.5,True,color=L.COL); p=c.add_paragraph(); no_space(p); r=p.add_run(b); setfont(r,F,10.5,True)
    para(d,'',after=4); box(d,'So arbeitest du mit diesem Text',['Lies den Text zuerst im Überblick (Überschriften, Bilder, Infoboxen). Lies ihn dann abschnittsweise und markiere Schlüsselbegriffe. Die Arbeitsaufträge beziehen sich auf diesen Text.'],font=F)
    pagebreak(d)
    h1(d,'Das Wichtigste in Kürze',font=F,before=0,size=17); bullets(d,tb.get('kurz') or [],font=F)
    chs=tb.get('kapitel') or []; h2(d,'Inhalt',font=F)
    for i,c in enumerate(chs,1): para(d,'**%d**   %s'%(i,c.get('titel','')),font=F,size=11,after=2)
    ev=data.get('zeitstrahl') or []
    if ev: box(d,'Zeitleiste',' | '.join('%s %s'%(e.get('jahr',''),e.get('text','')) for e in ev[:7]),font=F,fill='F6EBD9',bar=L.OCHER)
    for i,c in enumerate(chs,1):
        h1(d,'%d  %s'%(i,c.get('titel','')),font=F)
        for a in c.get('absaetze') or []: para(d,a,font=F,align='j')
        for b in c.get('boxen') or []: box_typ(d,b.get('typ'),b.get('titel'),b.get('text',''),F)
        for pr in c.get('personen') or []:
            ip=os.path.join(im['dir'],'p_%d.png'%(abs(hash(pr.get('name','')))%10**8)); igen.person(ip,pr.get('name',''),pr.get('lebensdaten',''),pr.get('rolle',''),L.COL)
            person_card(d,pr.get('name',''),pr.get('lebensdaten',''),pr.get('rolle',''),ip,pr.get('text',''),font=F)
        if i==2 and im.get('zeit'): image(d,im['zeit'],16.2,'Abb. 1: Wichtige Ereignisse im Zeitstrahl.',font=F)
        if i==4 and im.get('steps'): image(d,im['steps'],16.2,'Abb. 2: Überblick (eigene Darstellung).',font=F)
    if tb.get('glossar'):
        h2(d,'Glossar',font=F)
        for g in tb['glossar']: para(d,'**%s:** %s'%(g.get('begriff',''),g.get('text','')),font=F,size=10.5,after=2)
    quellen(d,L.QUELLEN,font=F); fn=os.path.join(out,'02_Textblatt_%s.docx'%SAFE(data.get('titel'))); d.save(fn); return fn
def namezeile(d,font): name_row(d,font)
def aufgabe_kopf(d,nr,titel,afb,font):
    p=d.add_paragraph(); no_space(p,10,3); p.paragraph_format.keep_with_next=True; par_border_bottom(p,L.COL,6)
    if nr in (3,5,7): p.paragraph_format.page_break_before=True
    r=p.add_run('%d   '%nr); setfont(r,font,15,True,color=L.COL); r=p.add_run(titel); setfont(r,font,12.5,True,color='222222'); r=p.add_run('      '+str(afb or '')); setfont(r,font,9,italic=True,color='888888')
def lines(d,n,font):
    for _ in range(int(round(n*1.25))): p=d.add_paragraph(); no_space(p,0,0); p.paragraph_format.line_spacing=1.9; r=p.add_run('_'*98); setfont(r,font,9.5,color='999999')
def arbeitsblatt(data,out,loesung):
    F=FONT_S; ab=data.get('arbeitsblatt') or {}; tasks=(ab.get('aufgaben') or [])[:8]
    d=new_doc(font=F,size=10.5); build_header_footer(d,'Arbeitsblatt – Offene Fragen',data.get('titel',''),loesung=loesung,font=F)
    title(d,'Arbeitsblatt: Offene Fragen',(data.get('titel','')+' | Lies zuerst das Textblatt. Bearbeite die Aufgaben in vollständigen Sätzen.'),font=F)
    if not loesung: name_row(d,F)
    else: para(d,'Erwartungshorizont zur Selbst- und Fremdkontrolle | Anforderungsbereiche: I Wiedergeben, II Erklären und Anwenden, III Beurteilen',font=F,size=10,color='555555')
    for n,a in enumerate(tasks,1):
        aufgabe_kopf(d,n,a.get('titel',''),a.get('afb',''),F)
        if a.get('einleitung'): para(d,a['einleitung'],font=F,size=10.5)
        q=a.get('quelle')
        if q: box(d,'Quelle',[q.get('text','')],fill='EEF3F4',italic=True,font=F,title_txt=q.get('label'))
        typ=a.get('typ','frei')
        if typ=='tabelle' and a.get('tabelle'):
            tb=a['tabelle']; cols=tb.get('spalten') or ['Kriterium','A','B']; rows=tb.get('zeilen') or []
            t=d.add_table(len(rows)+1,len(cols)); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER
            for j,h in enumerate(cols): c=t.rows[0].cells[j]; shade_cell(c,L.COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(h); setfont(r,F,10,True,color='FFFFFF')
            for i,row in enumerate(rows,1):
                vals=row if isinstance(row,list) else [row.get('kriterium','')]+[row.get('a',''),row.get('b','')]
                for j,v in enumerate(vals[:len(cols)]):
                    p=t.rows[i].cells[j].paragraphs[0]; no_space(p,3,3)
                    if j==0: r=p.add_run(str(v)); setfont(r,F,10,True)
                    elif loesung: r=p.add_run(str(v)); setfont(r,F,9.5,color=L.RED)
                    else: p.add_run(' ')
        for i,tl in enumerate(a.get('teile') or []):
            p=d.add_paragraph(); no_space(p,2,3); p.paragraph_format.left_indent=Cm(0.7); p.paragraph_format.first_line_indent=Cm(-0.7)
            for k,tx in enumerate(('%s)  %s'%('abcdef'[i],tl.get('text',''))).split('**')):
                if tx: r=p.add_run(tx); setfont(r,F,10.5,k%2==1)
            if loesung: box(d,'Erwartungshorizont',[tl.get('erwartung','Individuell.')],fill='FFF4CC',bar='111111',font=F,size=10)
            elif typ!='tabelle': lines(d,int(tl.get('zeilen') or 4),F)
        if typ=='skizze' and not loesung:
            t=d.add_table(1,1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; c=t.rows[0].cells[0]; cell_borders(c,top=(6,'999999'),bottom=(6,'999999'),left=(6,'999999'),right=(6,'999999')); t.rows[0].height=Cm(7.0); t.rows[0].height_rule=WD_ROW_HEIGHT_RULE.AT_LEAST; c.paragraphs[0].add_run(' '); para(d,'',after=2)
    if not loesung: box(d,'Hinweis','Halte zwei Sätze zu einer der letzten Aufgaben für ein kurzes Gespräch bereit. Deine Lehrkraft kann nachfragen. Handskizzen und eigene Beispiele sind erwünscht.',font=F,fill='F2F2F2',bar='888888'); quellen(d,L.QUELLEN,font=F)
    fn=os.path.join(out,'03_Arbeitsblatt_%s%s.docx'%(SAFE(data.get('titel')),'_LOESUNG' if loesung else '')); d.save(fn); return fn
def luecken(data,out,loesung):
    F=FONT_C; lt=data.get('luecken') or {}; TEXT=lt.get('text','') ; extra=lt.get('zusatz') or []
    words=re.findall(r'\{([^}]+)\}',TEXT); d=new_doc(font=F,size=12); build_header_footer(d,'Lückentext',data.get('titel',''),loesung=loesung,font=F)
    p=d.add_paragraph(); no_space(p,0,2); r=p.add_run('Lückentext'); setfont(r,F,24,True,color=L.COL); r=p.add_run('  |  '+data.get('titel','')); setfont(r,F,13,True,color='555555')
    para(d,('Setze die fehlenden Begriffe aus dem Wortspeicher ein. **Achtung:** %d Begriffe passen nicht in den Text. Streiche sie am Ende durch und erkläre einen davon in einem Satz.'%len(extra)) if not loesung else 'Lösung: Eingesetzte Begriffe sind farbig hervorgehoben; die Zusatzbegriffe im Wortspeicher werden nicht verwendet.',font=F,size=11,color='555555',after=4)
    if not loesung: name_row(d,F,10.5)
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY; no_space(p,4,8); p.paragraph_format.line_spacing=1.8; n=0
    for chunk in re.split(r'(\{[^}]+\}|\*\*[^*]+\*\*)',TEXT):
        if chunk.startswith('**'): r=p.add_run(chunk[2:-2]+' '); setfont(r,F,12,True,color=L.COL); continue
        if chunk.startswith('{'):
            n+=1; w=chunk[1:-1]
            if loesung:
                r=p.add_run(' %s '%w); setfont(r,F,12,True,color=L.COL); rpr=r._element.get_or_add_rPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:val'),'clear'); sh.set(qn('w:fill'),'D8E8EB'); rpr.append(sh)
            else: r=p.add_run('(%d) '%n); setfont(r,F,8,color='888888'); r=p.add_run(' '+' '*(len(w)+2)+' '); setfont(r,F,12); r.font.underline=True
        else: r=p.add_run(chunk); setfont(r,F,12)
    pool=words+extra; random.Random(7).shuffle(pool); h2(d,'Wortspeicher',font=F,size=12)
    t=d.add_table(max(1,(len(pool)+3)//4),4); t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,w in enumerate(pool):
        c=t.rows[i//4].cells[i%4]; shade_cell(c,LIGHT if w not in extra else 'F6EBD9'); cell_margins(c,30,30,80,80); p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(p); r=p.add_run(w); setfont(r,F,10.5,True,color='222222')
    if not loesung:
        para(d,'Erkläre einen der nicht verwendeten Begriffe in einem Satz:',font=F,size=11,before=8); p=d.add_paragraph(); no_space(p); p.paragraph_format.line_spacing=1.8; r=p.add_run('_'*90); setfont(r,F,10,color='999999'); quellen(d,L.QUELLEN,font=F)
    fn=os.path.join(out,'04_Lueckentext_%s%s.docx'%(SAFE(data.get('titel')),'_LOESUNG' if loesung else '')); d.save(fn); return fn
def kreuzwort(data,out,loesung,cache={}):
    F=FONT_C; W=[]
    for k in data.get('kreuzwort') or []:
        w=re.sub(r'[^A-Z]','',str(k.get('wort','')).upper().replace('Ä','AE').replace('Ö','OE').replace('Ü','UE').replace('ß','SS'))
        if len(w)>=3: W.append((w,k.get('hinweis','')))
    W=W[:18]
    if not W: return None
    key=tuple(W)
    if key not in cache: cache[key]=_cross(W)
    g,placed=cache[key]; rs=[k[0] for k in g]; cs=[k[1] for k in g]; r0,c0=min(rs),min(cs); H,Wd=max(rs)-r0+1,max(cs)-c0+1
    starts={}
    for w,r,c,dr,dc,cl in placed: starts.setdefault((r-r0,c-c0),[]).append(w)
    nums={}; n=0
    for kx in sorted(starts): n+=1; nums[kx]=n
    across=sorted([(nums[(r-r0,c-c0)],w,cl) for w,r,c,dr,dc,cl in placed if dc==1]); down=sorted([(nums[(r-r0,c-c0)],w,cl) for w,r,c,dr,dc,cl in placed if dr==1])
    d=new_doc(landscape=True,font=F,size=11,margins=(1.4,1.6,1.4,1.6)); build_header_footer(d,'Kreuzworträtsel',data.get('titel',''),loesung=loesung,font=F)
    p=d.add_paragraph(); no_space(p,0,0); r=p.add_run('Kreuzworträtsel'); setfont(r,F,22,True,color=L.COL); r=p.add_run('  |  '+data.get('titel','')); setfont(r,F,13,True,color='555555'); r=p.add_run('     Ä = AE   Ö = OE   Ü = UE   ß = SS'); setfont(r,F,10,color='777777')
    outer=d.add_table(1,2); outer.autofit=False; a,b=outer.rows[0].cells; outer.columns[0].width=Cm(14.9); outer.columns[1].width=Cm(11.5); a.width=Cm(14.9); b.width=Cm(11.5)
    cm=min(0.62,14.2/max(Wd,1),11.0/max(H,1)); gt=a.add_table(H,Wd); gt.autofit=False
    for j in range(Wd): gt.columns[j].width=Cm(cm)
    for i in range(H):
        gt.rows[i].height=Cm(cm); gt.rows[i].height_rule=WD_ROW_HEIGHT_RULE.EXACTLY
        for j in range(Wd):
            c=gt.rows[i].cells[j]; c.width=Cm(cm); cell_margins(c,0,0,20,20); ch=g.get((i+r0,j+c0))
            if ch is None: continue
            cell_borders(c,top=(6,'333333'),bottom=(6,'333333'),left=(6,'333333'),right=(6,'333333')); p=c.paragraphs[0]; no_space(p); p.paragraph_format.line_spacing=1.0
            if (i,j) in nums: r=p.add_run(str(nums[(i,j)])); setfont(r,F,6,True,color=L.COL)
            if loesung: r=p.add_run(ch if (i,j) not in nums else ' '+ch); setfont(r,F,10,True,color=L.RED)
    for lab,lst in (('Waagrecht',across),('Senkrecht',down)):
        p=b.add_paragraph() if lab=='Senkrecht' else b.paragraphs[0]; no_space(p,4,2); r=p.add_run(lab); setfont(r,F,12,True,color=L.COL)
        for n_,w,cl in lst:
            p=b.add_paragraph(); no_space(p,0,1); p.paragraph_format.left_indent=Cm(0.7); p.paragraph_format.first_line_indent=Cm(-0.7); r=p.add_run('%d  '%n_); setfont(r,F,9,True,color=L.COL); r=p.add_run(cl+('  → '+w if loesung else '')+'  (%d)'%len(w)); setfont(r,F,9)
    if not loesung:
        p=a.add_paragraph(); no_space(p,12,0); r=p.add_run('Name: ______________________________   Datum: ______________   Klasse: ________'); setfont(r,F,11,True,color='555555'); quellen(d,L.QUELLEN,font=F)
    fn=os.path.join(out,'05_Kreuzwortraetsel_%s%s.docx'%(SAFE(data.get('titel')),'_LOESUNG' if loesung else '')); d.save(fn); return fn
def _cross(words,size=21):
    best=None
    for att in range(300):
        rnd=random.Random(3+att); ws=sorted(words,key=lambda x:-len(x[0])); first=ws[0]; rest=ws[1:]; rnd.shuffle(rest); ws=[first]+rest; g={}; placed=[]
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
                    for pr,pc in ((rr+dc,cc+dr),(rr-dc,cc-dr)):
                        if (pr,pc) in g: return False
            return hit
        def put(w,r,c,dr,dc,cl):
            for i,ch in enumerate(w): g[(r+dr*i,c+dc*i)]=ch
            placed.append((w,r,c,dr,dc,cl))
        put(ws[0][0],0,0,0,1,ws[0][1])
        for w,cl in ws[1:]:
            opts=[]
            for (r,c),ch in list(g.items()):
                for i,x in enumerate(w):
                    if x!=ch: continue
                    for dr,dc in ((0,1),(1,0)):
                        h=can(w,r-dr*i,c-dc*i,dr,dc)
                        if h: opts.append((h,r-dr*i,c-dc*i,dr,dc))
            if opts: rnd.shuffle(opts); opts.sort(key=lambda x:-x[0]); h,rr,cc,dr,dc=opts[0]; put(w,rr,cc,dr,dc,cl)
        rs=[k[0] for k in g]; cs=[k[1] for k in g]; area=(max(rs)-min(rs)+1)*(max(cs)-min(cs)+1); sc=(len(placed),-area)
        if best is None or sc>best[0]: best=(sc,dict(g),list(placed))
        if len(placed)==len(words) and att>40: break
    return best[1],best[2]
def checkups(data,out):
    F=FONT_S; ck=data.get('checkup') or {}; SC=[(q['frage'],q['antworten'][:4],int(q['richtig'])) for q in ck.get('single') or [] if len(q.get('antworten',[]))>=4]; MC=[(q['frage'],q['antworten'][:4],[int(i) for i in q['richtig']]) for q in ck.get('multiple') or [] if len(q.get('antworten',[]))>=4 and q.get('richtig')]
    res=[]; T=SAFE(data.get('titel'))
    def doc(qs,mode,loes,num):
        d=new_doc(font=F,size=11); build_header_footer(d,'Check-up (%s)'%('Single Choice' if mode=='sc' else 'Multiple Choice'),data.get('titel',''),loesung=loes,font=F)
        title(d,'Check-up: '+data.get('titel',''),'%d Fragen | '%len(qs)+('genau eine Antwort ist richtig' if mode=='sc' else 'mehrere Antworten können richtig sein – kreuze alle richtigen an')+' (A–D)',font=F)
        if not loes: name_row(d,F,10.5)
        for i,(q,opts,ok) in enumerate(qs,1):
            okl=[ok] if mode=='sc' else ok
            p=d.add_paragraph(); no_space(p,3,0); p.paragraph_format.keep_with_next=True; r=p.add_run('%d  '%i); setfont(r,F,10.5,True,color=L.COL); r=p.add_run(q); setfont(r,F,10.5,True)
            for j,o in enumerate(opts):
                p=d.add_paragraph(); no_space(p,0,0); p.paragraph_format.left_indent=Cm(1.2); p.paragraph_format.first_line_indent=Cm(-0.6); p.paragraph_format.keep_with_next=(j<3); good=loes and j in okl
                r=p.add_run(('☒' if good else '☐')+' '+'ABCD'[j]+')  '); setfont(r,F,10,True,color=L.RED if good else L.COL); r=p.add_run(o); setfont(r,F,9.5,bold=good,color=L.RED if good else None)
        if loes: para(d,'Lösungsschlüssel: '+'   '.join('%d%s'%(i,''.join('ABCD'[k] for k in ([ok] if mode=='sc' else ok))) for i,(q,o,ok) in enumerate(qs,1)),font=F,size=10.5,bold=True,before=8)
        else: quellen(d,L.QUELLEN,font=F)
        fn=os.path.join(out,'%02d_Check-up_%s_%s%s.docx'%(num,'SingleChoice' if mode=='sc' else 'MultipleChoice',T,'_LOESUNG' if loes else '')); d.save(fn); res.append(fn)
    os.makedirs(os.path.join(out,'Import'),exist_ok=True)
    for mode,qs,num in (('sc',SC,6),('mc',MC,7)):
        if not qs: continue
        doc(qs[:15],mode,False,num); doc(qs[:15],mode,True,num); tag='SingleChoice' if mode=='sc' else 'MultipleChoice'
        txt=[]
        for i,(q,o,ok) in enumerate(qs[:15],1):
            txt.append('%d. %s'%(i,q)); txt+=['%s) %s'%('ABCD'[j],x) for j,x in enumerate(o)]; txt.append('Richtig: '+', '.join('ABCD'[k] for k in ([ok] if mode=='sc' else ok))); txt.append('')
        fn=os.path.join(out,'Import','Check-up_%s_%s_Kopiertext.txt'%(tag,T)); open(fn,'w',encoding='utf8').write('Check-up %s: %s\n\n'%(tag,L.AO)+'\n'.join(txt)); res.append(fn)
        # Kahoot
        from openpyxl import Workbook
        from openpyxl.styles import Font, PatternFill, Alignment
        wb=Workbook(); ws=wb.active; ws.title='Kahoot-Quiz'
        for i,t in enumerate(['Kahoot! Quiz-Vorlage zum Hochladen (Quiz erstellen → Aus Tabelle importieren)','Arbeitsauftrag: '+L.AO,'Fragen: max. 120 Zeichen | Antworten: max. 75 Zeichen','Richtige Antwort(en): Nummern 1–4, mehrere durch Komma getrennt','Nicht verwendete Antwortfelder leer lassen','',''],1): ws.cell(i,1,t)
        for j,h in enumerate(['Question - max 120 characters','Answer 1 - max 75 characters','Answer 2 - max 75 characters','Answer 3 - max 75 characters','Answer 4 - max 75 characters','Time limit (sec) - 5, 10, 20, 30, 60, 90, 120, or 240 secs','Correct answer(s) - choose at least one'],1):
            c=ws.cell(8,j,h); c.font=Font(bold=True,color='FFFFFF'); c.fill=PatternFill('solid',fgColor='46178F'); c.alignment=Alignment(wrap_text=True)
        for i,(q,o,ok) in enumerate(qs[:20]):
            ws.cell(9+i,1,q[:120])
            for j,x in enumerate(o): ws.cell(9+i,2+j,x[:75])
            ws.cell(9+i,6,30 if mode=='mc' else 20); ws.cell(9+i,7,','.join(str(k+1) for k in ([ok] if mode=='sc' else ok)))
        fn=os.path.join(out,'Kahoot_%s_%s.xlsx'%(tag,T)); wb.save(fn); res.append(fn)
    if SC:
        fn=os.path.join(out,'Plickers_%s.csv'%T)
        with open(fn,'w',encoding='utf-8-sig',newline='') as f:
            w=csv.writer(f,delimiter=';'); w.writerow(['Frage','A','B','C','D','Richtige Antwort'])
            for q,o,ok in SC[:20]: w.writerow([q]+o+['ABCD'[ok]])
        res.append(fn)
        d=new_doc(landscape=True,font=F,size=10.5,margins=(1.2,1.6,1.2,1.6)); build_header_footer(d,'Plickers-Eingabeblatt',data.get('titel',''),font=F)
        title(d,'Plickers: %d Fragen zum Übertragen'%len(SC[:20]),'Plickers → Neue Frage → Frage und Antworten A–D eintippen oder kopieren → richtige Antwort markieren.',font=F)
        t=d.add_table(len(SC[:20])+1,6); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False; ws_=[Cm(0.9),Cm(8.4),Cm(4.6),Cm(4.6),Cm(4.6),Cm(3.2)]
        for j,h in enumerate(['Nr.','Frage','A','B','C','D']): c=t.rows[0].cells[j]; shade_cell(c,L.COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(h); setfont(r,F,9.5,True,color='FFFFFF')
        for i,(q,o,ok) in enumerate(SC[:20],1):
            for j,v in enumerate([str(i),q]+o):
                p=t.rows[i].cells[j].paragraphs[0]; no_space(p,1,1); r=p.add_run(v); good=(j>=2 and j-2==ok); setfont(r,F,8.8,bold=good or j<2,color=L.RED if good else None)
                if good: shade_cell(t.rows[i].cells[j],'FFF4CC')
        for r_ in t.rows:
            for j,c in enumerate(r_.cells): c.width=ws_[j]
        fn=os.path.join(out,'Plickers_%s.docx'%T); d.save(fn); res.append(fn)
    from docx import Document as D0
    for mode,qs in (('sc',SC),('mc',MC)):
        if not qs: continue
        d=D0(); d.styles['Normal'].font.name='Calibri'; d.add_paragraph('Quiz: %s (%s)'%(data.get('titel',''),'Single Choice' if mode=='sc' else 'Multiple Choice'))
        for i,(q,o,ok) in enumerate(qs[:20],1):
            d.add_paragraph('%d. %s'%(i,q))
            for j,x in enumerate(o): d.add_paragraph('%s) %s'%('ABCD'[j],x))
            if mode=='sc': d.add_paragraph('ANS: '+'ABCD'[ok]); d.add_paragraph('POINT: 1')
        if mode=='mc':
            d.add_page_break(); d.add_paragraph('Lösungen zum Nachmarkieren in Microsoft Forms:')
            for i,(q,o,ok) in enumerate(qs[:20],1): d.add_paragraph('%d: %s'%(i,', '.join('ABCD'[k] for k in ok)))
        fn=os.path.join(out,'MS-Forms_%s_%s.docx'%('SingleChoice' if mode=='sc' else 'MultipleChoice',T)); d.save(fn); res.append(fn)
    return res
def wiederholung(data,out):
    F=FONT_S; W=data.get('wiederholung') or []
    if not W: return None
    d=new_doc(landscape=True,font=F,size=10.5,margins=(1.2,1.5,1.2,1.5)); build_header_footer(d,'Mündliche Wiederholung',data.get('titel',''),loesung=True,font=F,band='NUR FÜR DIE LEHRKRAFT  |  Wiederholungsfragen mit Musterantworten und Punkten')
    title(d,'Mündliche Stundenwiederholung: '+data.get('titel',''),'%d Wiederholungen zu je maximal 5 Minuten | Antworten in 1–2 Sätzen'%len(W),font=F)
    box(d,'So geht es',['**Ablauf (max. 5 Min.):** 4 Fragen à ca. 1 Minute (Antwort in 1–2 Sätzen), 1 Minute Rückmeldung.','**Korrektur:** Je erfülltem Kriterium **1 Punkt**. Kästchen ☐ ankreuzen, dann Punkte eintragen. Sinngemäß genügt.','**Wertung:** alle Kriterien = richtig (✓), mindestens eines = teilweise (~), keines = falsch (✗).'],font=F,size=10)
    for n,s in enumerate(W,1):
        qs=s.get('fragen') or []; total=sum(len(q.get('kriterien') or ['x']) for q in qs)
        p=d.add_paragraph(); no_space(p,10,2); p.paragraph_format.keep_with_next=True; par_border_bottom(p,L.COL,8)
        r=p.add_run('Wiederholung %02d   '%n); setfont(r,F,13,True,color=L.COL); r=p.add_run(s.get('titel','')); setfont(r,F,13,True); r=p.add_run('      ca. 5 Min.  |  max. %d Punkte  |  erreicht: ____ / %d'%(total,total)); setfont(r,F,9.5,color='777777')
        t=d.add_table(len(qs)+1,5); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False; wd=[Cm(0.8),Cm(6.6),Cm(7.0),Cm(7.6),Cm(4.5)]
        for j,h in enumerate(['Nr.','Frage','Musterantwort','Kriterien (je erfüllt = 1 P.)','Punkte / Wertung']): c=t.rows[0].cells[j]; shade_cell(c,L.COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(h); setfont(r,F,9,True,color='FFFFFF')
        for i,q in enumerate(qs,1):
            row=t.rows[i].cells; kr=q.get('kriterien') or ['sinngemäß richtig']
            for j,v in enumerate([str(i),q.get('frage',''),q.get('antwort','')]): p=row[j].paragraphs[0]; no_space(p,2,2); r=p.add_run(v); setfont(r,F,9.5,bold=(j<2))
            for k,x in enumerate(kr): p=row[3].paragraphs[0] if k==0 else row[3].add_paragraph(); no_space(p,0,1); r=p.add_run('☐ '+x); setfont(r,F,9.5)
            p=row[4].paragraphs[0]; no_space(p,2,2); r=p.add_run('____ / %d P.'%len(kr)); setfont(r,F,10,True,color=L.COL); p=row[4].add_paragraph(); no_space(p,2,0); r=p.add_run('✓ richtig   ~ teils   ✗ falsch'); setfont(r,F,8,color='666666')
        for ri,r_ in enumerate(t.rows):
            r_.cantSplit=True
            for c in r_.cells:
                if ri<len(qs):
                    for p in c.paragraphs: p.paragraph_format.keep_with_next=True
            for j,c in enumerate(r_.cells): c.width=wd[j]
        for j in range(5): t.columns[j].width=wd[j]
    quellen(d,L.QUELLEN,font=F); fn=os.path.join(out,'08_Wiederholung-muendlich_%s.docx'%SAFE(data.get('titel'))); d.save(fn); return fn
def build_all(data,out,vorlage=None,cover_custom=None):
    os.makedirs(out,exist_ok=True); L.configure({'titel':data.get('titel'),'untertitel':data.get('untertitel'),'epoche':data.get('epoche'),'zeitraum':data.get('zeitraum'),'quellen':data.get('quellenliste') or []})
    import lib as LL
    for k in ('AO','COL','EPOCHE','ZEIT','QUELLEN'): globals()[k]=getattr(LL,k)
    imgd=os.path.join(out,'_bilder'); os.makedirs(imgd,exist_ok=True); im={'dir':imgd,'cover':os.path.join(imgd,'cover.png')}
    if cover_custom and os.path.exists(cover_custom):
        from PIL import Image
        x=Image.open(cover_custom).convert('RGB'); r=max(1800/x.width,1000/x.height); x=x.resize((int(x.width*r)+1,int(x.height*r)+1)); l=(x.width-1800)//2; t=(x.height-1000)//2; x.crop((l,t,l+1800,t+1000)).save(im['cover'])
    else: igen.cover(im['cover'],data.get('titel',''),(data.get('epoche','')+' | '+(data.get('zeitraum') or '')),L.COL)
    im['cover_notext']=os.path.join(imgd,'cover_notext.png')
    if cover_custom and os.path.exists(cover_custom): import shutil; shutil.copy(im['cover'],im['cover_notext'])
    else: igen.cover(im['cover_notext'],'','',L.COL)
    if data.get('zeitstrahl'): im['zeit']=igen.timeline(os.path.join(imgd,'zeit.png'),data['zeitstrahl'],'Zeitstrahl: '+data.get('titel',''),L.COL)
    if data.get('prozess'): im['steps']=igen.steps(os.path.join(imgd,'steps.png'),data['prozess'],data.get('prozess_titel','Überblick'),L.COL)
    res=[]
    from PIL import Image
    Image.open(im['cover']).convert('RGB').save(os.path.join(out,'Cover_%s.jpg'%SAFE(data.get('titel'))),quality=93,subsampling=0); res.append('Cover_%s.jpg'%SAFE(data.get('titel')))
    jobs=[lambda:textblatt(data,out,im),lambda:arbeitsblatt(data,out,False),lambda:arbeitsblatt(data,out,True),lambda:luecken(data,out,False),lambda:luecken(data,out,True),lambda:kreuzwort(data,out,False),lambda:kreuzwort(data,out,True),lambda:checkups(data,out),lambda:wiederholung(data,out)]
    for j in jobs:
        try:
            r=j()
            if isinstance(r,list): res+= [os.path.relpath(x,out) for x in r]
            elif r: res.append(os.path.relpath(r,out))
        except Exception as e: print('FEHLER bei',j,e,file=sys.stderr)
    if vorlage and os.path.exists(vorlage):
        try:
            import gen_ppt; r=gen_ppt.build(data,out,vorlage,im); 
            if r: res.append(os.path.relpath(r,out))
        except Exception as e: print('FEHLER Präsentation',e,file=sys.stderr)
    return res
if __name__=='__main__':
    data=json.load(open(sys.argv[1],encoding='utf8')); out=sys.argv[2]; vor=sys.argv[3] if len(sys.argv)>3 else None
    cc=os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])),'cover_custom.png')
    print(json.dumps(build_all(data,out,vor,cc if os.path.exists(cc) else None),ensure_ascii=False))
