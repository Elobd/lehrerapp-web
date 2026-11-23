from lib import *
import csv
F=FONT_S
OUT=os.path.join(HERE,'..','out')
SC=[('Worin bestand Gutenbergs entscheidende Neuerung?',['Er erfand das Papier.','Er verband Lettern, Presse, Farbe und Papier zu einem System.','Er erfand den Holztafeldruck.','Er ließ Bücher schneller abschreiben.'],1),
 ('Warum verwendete Gutenberg eine ölhaltige Druckfarbe?',['Wasserlösliche Tinte haftet nicht auf Metall.','Sie war gesetzlich vorgeschrieben.','Sie trocknete auf Pergament schneller.','Sie war billiger als Ruß.'],0),
 ('Was versteht man unter Inkunabeln?',['Handschriften aus Klöstern','Drucke bis einschließlich 1500','Flugblätter der Reformation','Bücher mit Holzschnitten'],1),
 ('In welcher Stadt begann Gutenberg um 1450 zu drucken?',['Mainz','Venedig','Wittenberg','Paris'],0),
 ('Wer finanzierte Gutenbergs Werkstatt?',['Peter Schöffer','Aldus Manutius','Johannes Fust','Erasmus von Rotterdam'],2),
 ('Was war die 42-zeilige Bibel?',['Luthers deutsche Übersetzung','Eine Handschrift aus einem Kloster','Ein Holzschnitt-Bilderbuch','Ein um 1452–1455 gedrucktes Bibelwerk in etwa 180 Exemplaren'],3),
 ('Was bedeutet „ad fontes“ im Humanismus?',['Zur Kirche','Zu den Quellen','Zur Stadt','Zu den Fürsten'],1),
 ('Welches Werk gab Erasmus 1516 heraus?',['Das griechische Neue Testament mit lateinischer Übersetzung','Die 95 Thesen','„De revolutionibus“','Den Index der verbotenen Bücher'],0),
 ('Wogegen richteten sich Luthers Thesen von 1517?',['Gegen den Ablasshandel','Gegen den Buchdruck','Gegen das Papier','Gegen die Universitäten'],0),
 ('Welche Rolle spielten Flugschriften in der Reformation?',['Sie waren nur auf Latein erhältlich.','Sie wurden nur von der Kirche herausgegeben.','Sie verbreiteten Ideen schnell und billig, auch durch Vorlesen.','Sie waren so teuer wie Bibeln.'],2),
 ('Wann erschien Luthers deutsches Neues Testament?',['1455','1522','1648','1789'],1),
 ('Wer erließ 1486 ein Zensuredikt für den Buchdruck?',['Der Mainzer Erzbischof','Der englische König','Martin Luther','Aldus Manutius'],0),
 ('Was war ein Privileg im Druckwesen?',['Ein Verbot für bestimmte Bücher','Ein Ehrentitel für Gelehrte','Eine Steuer auf Papier','Ein zeitlich begrenztes Alleinrecht auf den Druck eines Werks'],3),
 ('Warum war der Buchdruck für die Wissenschaft wichtig?',['Er machte Universitäten überflüssig.','Identische Texte und Abbildungen ließen sich überprüfen und ausbauen.','Er ersetzte Beobachtung durch Überlieferung.','Er verbot Kritik an der Kirche.'],1),
 ('Welche Aussage über die Wirkung des Buchdrucks ist am besten begründet?',['Er allein verursachte die Reformation.','Er hatte kaum Folgen.','Er wirkte im Zusammenspiel mit Wirtschaft, Gesellschaft und Ideen.','Er machte Zensur unmöglich.'],2)]
MC=[('Was gehörte zu Gutenbergs Gesamtsystem? (3 richtig)',['Bewegliche Metalllettern','Handgießinstrument','Presse nach dem Prinzip der Spindelpresse','Holztafeln für jede Seite'],[0,1,2]),
 ('Was erklärt den wirtschaftlichen Erfolg des Buchdrucks?',['Wiederverwendbare Lettern senken die Kosten pro Exemplar','Papier war billiger als Pergament','Die Kirche verbot Papier','Es gab keine Nachfrage nach Büchern'],[0,1]),
 ('Welche Aussagen zu Inkunabeln stimmen?',['Es sind Drucke bis einschließlich 1500','Man nennt sie auch Wiegendrucke','Es sind Handschriften','Sie entstanden erst nach 1600'],[0,1]),
 ('Was kennzeichnet den Humanismus?',['Rückbesinnung auf antike Quellen','Erasmus gab das griechische Neue Testament heraus','Ablehnung von Büchern','Verbot des Druckens'],[0,1]),
 ('Was trifft auf Flugschriften zu?',['Kurz und preiswert','Oft mit Holzschnitten bebildert','Nur auf Latein','Nur in Kirchen erhältlich'],[0,1]),
 ('Was wollte Luther mit seiner Bibelübersetzung erreichen?',['Verständlichkeit für die Menschen','Orientierung an der Alltagssprache','Beibehaltung des Lateinischen','Ein Verbot jeder Übersetzung'],[0,1]),
 ('Wie veränderte der Buchdruck die Wissenschaft?',['Abbildungen waren in allen Exemplaren identisch','Aussagen ließen sich besser überprüfen','Er hatte keinen Einfluss','Anatomie wurde verboten'],[0,1]),
 ('Welche Formen der Kontrolle gab es?',['Zensuredikt von 1486','Index der verbotenen Bücher (1559)','Garantierte Pressefreiheit für alle','Abschaffung des Druckens'],[0,1]),
 ('Was trifft auf Privilegien zu?',['Alleinrecht auf den Druck eines Werks','Zeitlich und räumlich begrenzt','Unbegrenzt und weltweit gültig','Verbot jeder Veröffentlichung'],[0,1]),
 ('Welche Zuordnungen stimmen?',['Fust – Geldgeber','Schöffer – Drucker und Mitarbeiter','Manutius – Kursivschrift','Kopernikus – Anatomie'],[0,1,2]),
 ('Welche langfristigen Folgen hatte der Buchdruck?',['Wachsende Lesefähigkeit','Erste wöchentliche Zeitung 1605','Alle konnten sofort lesen','Bücher wurden deutlich teurer'],[0,1]),
 ('Was kennzeichnet handgeschriebene Bücher?',['Abschreibfehler','Teures Pergament','Identische Exemplare','Hohe Auflagen'],[0,1]),
 ('Welche Werke erschienen 1543?',['Kopernikus: Weltbild','Vesalius: Anatomie','Luthers 95 Thesen','Gutenbergs Bibel'],[0,1]),
 ('Was gilt für die „Medienrevolution“?',['Technik wirkt im Zusammenspiel mit Gesellschaft','Wirkung entfaltet sich über Generationen','Technik allein verändert sofort alles','Zensur spielte keine Rolle'],[0,1]),
 ('Welche Parallelen zu heute gibt es?',['Neue Öffentlichkeit','Debatte über Regeln und Kontrolle','Keine Kontrolle gewünscht','Medien ohne Einfluss'],[0,1])]
SC+=[('Wer druckte 1457 mit Fust den „Mainzer Psalter“?',['Aldus Manutius','Peter Schöffer','Erasmus von Rotterdam','Martin Luther'],1),
 ('Welche Schrift entwickelte sich in der Werkstatt des Aldus Manutius?',['Die Kursive','Die Fraktur','Die Runenschrift','Die Keilschrift'],0),
 ('Wann erschien erstmals der „Index der verbotenen Bücher“?',['1455','1486','1559','1648'],2),
 ('Welches Werk von Vesalius erschien 1543?',['„De revolutionibus“','„De humani corporis fabrica“','„Lob der Torheit“','Das Neue Testament'],1),
 ('Was bezeichnet das heliozentrische Weltbild?',['Die Erde steht im Zentrum.','Der Mond steht im Zentrum.','Die Sonne steht im Zentrum.','Die Sterne stehen still.'],2)]
MC+=[('Welche Aussagen zu Gutenbergs Leben stimmen?',['Er wurde in Mainz geboren','1465 wurde er Hofmann des Erzbischofs','Der Buchdruck machte ihn sehr reich','Er starb in Venedig'],[0,1]),
 ('Wodurch verbreiteten sich Ideen der Reformation rasch?',['Durch Flugschriften','Durch bebilderte Holzschnitte','Durch das Fernsehen','Durch den Telegrafen'],[0,1]),
 ('Welche Berufe gehörten zu einer Druckerwerkstatt?',['Setzer','Drucker','Korrektor','Ritter'],[0,1,2]),
 ('Welche Merkmale hatte die 42-zeilige Bibel?',['Rund 1.280 Seiten','Etwa 180 Exemplare','Gedruckt in deutscher Sprache','Gedruckt mit einem Computer'],[0,1]),
 ('Welche Aussagen zum Humanismus stimmen?',['„Ad fontes“ = zu den Quellen','Der Buchdruck verbreitete humanistische Ausgaben','Er begann in China','Er richtete sich gegen Bücher'],[0,1])]
assert len(SC)==20 and len(MC)==20
def doc(qs,mode,loesung):
    d=new_doc(font=F,size=11); label='Check-up (%s)'%('Single Choice' if mode=='sc' else 'Multiple Choice'); build_header_footer(d,label,'Der Buchdruck',loesung=loesung,font=F)
    title(d,'Check-up: Der Buchdruck','15 Fragen | '+('genau eine Antwort ist richtig' if mode=='sc' else 'mehrere Antworten können richtig sein – kreuze alle richtigen an')+' (A–D)',font=F)
    if not loesung:
        name_row(d,F,10.5)
    for i,(q,opts,ok) in enumerate(qs,1):
        okl=[ok] if mode=='sc' else ok
        p=d.add_paragraph(); no_space(p,3,0); p.paragraph_format.keep_with_next=True; r=p.add_run('%d  '%i); setfont(r,F,10.5,True,color=COL); r=p.add_run(q); setfont(r,F,10.5,True)
        for j,o in enumerate(opts):
            p=d.add_paragraph(); no_space(p,0,0); p.paragraph_format.left_indent=Cm(1.2); p.paragraph_format.first_line_indent=Cm(-0.6); p.paragraph_format.keep_with_next=(j<3)
            good=loesung and j in okl; r=p.add_run(('☒' if good else '☐')+' '+'ABCD'[j]+')  '); setfont(r,F,10,True,color=RED if good else COL); r=p.add_run(o); setfont(r,F,9.5,bold=good,color=RED if good else None)
    if loesung:
        para(d,'Lösungsschlüssel: '+'   '.join('%d%s'%(i,''.join('ABCD'[k] for k in ([ok] if mode=='sc' else ok))) for i,(q,o,ok) in enumerate(qs,1)),font=F,size=10.5,bold=True,before=8)
    else: quellen(d,QUELLEN,font=F)
    tag='SingleChoice' if mode=='sc' else 'MultipleChoice'
    d.save(os.path.join(OUT,'Check-up_%s%s.docx'%(tag,'_LOESUNG' if loesung else '')))
for mode,qs in (('sc',SC),('mc',MC)):
    doc(qs[:15],mode,False); doc(qs[:15],mode,True)
    tag='SingleChoice' if mode=='sc' else 'MultipleChoice'; txt=[]
    for i,(q,o,ok) in enumerate(qs[:15],1):
        txt.append('%d. %s'%(i,q)); txt+=['%s) %s'%('ABCD'[j],x) for j,x in enumerate(o)]; txt.append('Richtig: '+', '.join('ABCD'[k] for k in ([ok] if mode=='sc' else ok))); txt.append('')
    open(os.path.join(OUT,'Check-up_%s_Kopiertext.txt'%tag),'w',encoding='utf8').write('Check-up %s: Der Buchdruck (Arbeitsauftrag: %s)\n\n'%(tag,AO)+'\n'.join(txt))
    with open(os.path.join(OUT,'Check-up_%s_Fragen.csv'%tag),'w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f,delimiter=';'); w.writerow(['Frage','A','B','C','D','Richtig'])
        for q,o,ok in qs[:15]: w.writerow([q]+o+[','.join('ABCD'[k] for k in ([ok] if mode=='sc' else ok))])
# Kahoot (xlsx, Importformat: Kopfzeile in Zeile 8, Daten ab Zeile 9)
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
def kahoot(qs,mode,fn):
    wb=Workbook(); ws=wb.active; ws.title='Kahoot-Quiz'
    info=['Kahoot! Quiz-Vorlage zum Hochladen (Import: Quiz erstellen → Aus Tabelle importieren)','Arbeitsauftrag: '+AO,'Fragen: max. 120 Zeichen | Antworten: max. 75 Zeichen | Zeitlimit: 5, 10, 20, 30, 60, 90, 120 oder 240 Sekunden','Richtige Antwort(en): Nummern 1–4, bei mehreren durch Komma getrennt (z. B. 1,3)','Nicht verwendete Antwortfelder leer lassen','','']
    for i,t in enumerate(info,1): ws.cell(i,1,t)
    heads=['Question - max 120 characters','Answer 1 - max 75 characters','Answer 2 - max 75 characters','Answer 3 - max 75 characters','Answer 4 - max 75 characters','Time limit (sec) - 5, 10, 20, 30, 60, 90, 120, or 240 secs','Correct answer(s) - choose at least one']
    for j,h in enumerate(heads,1):
        c=ws.cell(8,j,h); c.font=Font(bold=True,color='FFFFFF'); c.fill=PatternFill('solid',fgColor='46178F'); c.alignment=Alignment(wrap_text=True,vertical='center')
    for i,(q,o,ok) in enumerate(qs):
        okl=[ok] if mode=='sc' else ok
        assert len(q)<=120 and all(len(x)<=75 for x in o),(q)
        ws.cell(9+i,1,q.replace(' (3 richtig)',''))
        for j,x in enumerate(o): ws.cell(9+i,2+j,x)
        ws.cell(9+i,6,30 if mode=='mc' else 20); ws.cell(9+i,7,','.join(str(k+1) for k in okl))
    for col,w in zip('ABCDEFG',[60,38,38,38,38,22,22]): ws.column_dimensions[col].width=w
    ws.row_dimensions[8].height=48; wb.save(os.path.join(OUT,fn))
kahoot(SC,'sc','Kahoot_SingleChoice.xlsx'); kahoot(MC,'mc','Kahoot_MultipleChoice.xlsx'); # Plickers (20 Fragen, Single Choice)
import csv
for q,o,ok in SC: assert len(q)<=120 and all(len(x)<=75 for x in o)
with open(os.path.join(OUT,'Plickers_Der-Buchdruck.csv'),'w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f,delimiter=';'); w.writerow(['Frage','A','B','C','D','Richtige Antwort'])
    for q,o,ok in SC: w.writerow([q]+o+['ABCD'[ok]])
d=new_doc(landscape=True,font=F,size=10.5,margins=(1.2,1.6,1.2,1.6)); build_header_footer(d,'Plickers-Eingabeblatt','Der Buchdruck',font=F)
title(d,'Plickers: 20 Fragen zum Übertragen','Plickers → Neue Frage → Frage und Antworten A–D eintippen oder kopieren → richtige Antwort markieren. Ein Import per Datei wird von Plickers nicht offiziell angeboten.',font=F)
t=d.add_table(len(SC)+1,6); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
widths=[Cm(0.9),Cm(8.4),Cm(4.6),Cm(4.6),Cm(4.6),Cm(3.2)]
for j,h in enumerate(['Nr.','Frage','A','B','C','D']):
    c=t.rows[0].cells[j]; shade_cell(c,COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(h); setfont(r,F,9.5,True,color='FFFFFF')
for i,(q,o,ok) in enumerate(SC,1):
    row=t.rows[i].cells; vals=[str(i),q]+o
    for j,v in enumerate(vals[:6]):
        p=row[j].paragraphs[0]; no_space(p,1,1); r=p.add_run(v); good=(j>=2 and j-2==ok); setfont(r,F,8.8,bold=good or j<2,color=RED if good else None)
        if good: shade_cell(row[j],'FFF4CC')
for r_ in t.rows:
    for j,c in enumerate(r_.cells): c.width=widths[j]
for j in range(6): t.columns[j].width=widths[j]
para(d,'Gelb hinterlegt = richtige Antwort.',font=F,size=9.5,before=6,color='666666')
d.save(os.path.join(OUT,'Plickers_Der-Buchdruck.docx'))
# MS Forms Schnellimport (Word, schlicht)
def forms(qs,mode,fn):
    d=Document(); st=d.styles['Normal']; st.font.name='Calibri'; st.font.size=Pt(11)
    d.add_paragraph('Quiz: Der Buchdruck ('+('Single Choice' if mode=='sc' else 'Multiple Choice')+')'); d.add_paragraph('Arbeitsauftrag: '+AO)
    for i,(q,o,ok) in enumerate(qs,1):
        d.add_paragraph('%d. %s'%(i,q))
        for j,x in enumerate(o): d.add_paragraph('%s) %s'%('ABCD'[j],x))
        if mode=='sc': d.add_paragraph('ANS: '+'ABCD'[ok]); d.add_paragraph('POINT: 1')
    if mode=='mc':
        d.add_page_break(); d.add_paragraph('Lösungen zum Nachmarkieren in Microsoft Forms (Mehrfachlösungen kann der Schnellimport nicht übernehmen):')
        for i,(q,o,ok) in enumerate(qs,1): d.add_paragraph('%d: %s'%(i,', '.join('ABCD'[k] for k in ok)))
    d.save(os.path.join(OUT,fn))
forms(SC,'sc','MS-Forms_SingleChoice_Der-Buchdruck.docx'); forms(MC,'mc','MS-Forms_MultipleChoice_Der-Buchdruck.docx')
print('ok')
