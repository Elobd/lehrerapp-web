from lib import *
import random
F=FONT_C
OUT=os.path.join(HERE,'..','out')
TEXT=("**Vor dem Buchdruck.** Bis ins 15. Jahrhundert wurden Bücher in {Skriptorien} von Hand abgeschrieben, meist auf teurem {Pergament}. Ein einziges Buch konnte {Monate} an Arbeit kosten, und beim Kopieren schlichen sich immer wieder {Abschreibfehler} ein. Wissen blieb deshalb ein Vorrecht weniger Menschen, vor allem von Geistlichen und Gelehrten an den {Universitäten}. Einzelne Bilder und kurze Texte konnte man bereits mit dem {Holzschnitt} vervielfältigen, bei dem eine ganze Seite in eine Holzplatte geschnitten wurde; für ganze Bücher war das zu aufwendig. "
"**Gutenbergs Erfindung.** Um 1450 entwickelte {Gutenberg} in {Mainz} ein neues Verfahren. Statt ganze Seiten zu kopieren, setzte er einzelne bewegliche {Lettern} aus Metall zusammen, die er mit einem {Handgießinstrument} in großer Zahl herstellte. Gedruckt wurde mit einer {Presse}, die dem Prinzip der Weinpresse folgte. Weil wasserlösliche Tinte auf Metall nicht haftet, verwendete er eine ölhaltige {Druckerfarbe}. Als Beschreibstoff diente das billigere {Papier}. Die Lettern konnten nach dem Druck wieder auseinandergenommen und neu {gesetzt} werden. Dadurch sanken die Kosten pro Exemplar, auch wenn die Anfangsinvestition hoch war. "
"**Die 42-zeilige Bibel.** Das berühmteste Werk entstand zwischen etwa 1452 und {1455}. Die {Bibel} umfasst rund 1.280 Seiten und erschien in etwa {180} Exemplaren. Das nötige Geld lieh Gutenberg der Kaufmann {Fust}; als dieser sein Geld zurückforderte, verlor Gutenberg die Werkstatt. Gemeinsam mit {Schöffer}, einem ehemaligen Mitarbeiter, druckte Fust danach weiter. "
"**Der Buchdruck erobert Europa.** Schon bald entstanden in vielen Städten Druckereien, etwa in Straßburg, Köln, Basel, Nürnberg und {Venedig}. Dort entwickelte der Drucker {Manutius} handliche Taschenformate und die Kursivschrift. Alle Drucke bis zum Jahr 1500 nennt man {Inkunabeln}. Bis dahin gab es in Europa an rund {250} Orten Druckereien. "
"**Humanismus und Reformation.** Die {Humanisten} wollten antike Texte in ihrer ursprünglichen Form lesen („ad {fontes}“) und nutzten den Druck für verlässliche Ausgaben. Der Gelehrte {Erasmus} von Rotterdam gab 1516 das griechische Neue Testament heraus. In der Reformation veröffentlichten Martin {Luther} und seine Gegner tausende kurze {Flugschriften}, die oft mit Holzschnitten bebildert waren und auch vorgelesen wurden. Luthers {Bibelübersetzung} trug zur Entwicklung einer einheitlicheren deutschen Schriftsprache bei. "
"**Wissenschaft und Weltbild.** Im Jahr {1543} erschienen die Werke von Nikolaus {Kopernikus}, der die Sonne ins Zentrum stellte (heliozentrisches Weltbild), und des Arztes Andreas {Vesalius}, der den menschlichen Körper genau abbildete. Weil Texte und Abbildungen in allen Exemplaren {identisch} waren, ließen sich Aussagen überprüfen und weiterentwickeln. "
"**Kontrolle und Folgen.** Kirche und Obrigkeit antworteten mit {Zensur}: Schon 1486 erließ der Mainzer Erzbischof ein Zensuredikt, 1559 erschien der {Index} der verbotenen Bücher. Drucker erhielten dagegen {Privilegien}, die ihnen für eine bestimmte Zeit das Alleinrecht auf ein Werk sicherten. Langfristig entstand eine neue {Öffentlichkeit}, die Lesefähigkeit nahm zu, und 1605 erschien in Straßburg die erste wöchentliche {Zeitung}. Viele Historiker sprechen deshalb von einer {Medienrevolution}.")
import re
words=re.findall(r'\{([^}]+)\}',TEXT); extra=['Galiläi','Armbrust','Parlament','Kompass']
def build(loesung):
    d=new_doc(font=F,size=12); build_header_footer(d,'Lückentext','Der Buchdruck',loesung=loesung,font=F)
    p=d.add_paragraph(); no_space(p,0,2); r=p.add_run('Lückentext'); setfont(r,F,24,True,color=COL); r=p.add_run('  |  Der Buchdruck – Medienrevolution um 1450'); setfont(r,F,13,True,color='555555')
    para(d,'Setze die fehlenden Begriffe aus dem Wortspeicher ein. **Achtung:** Vier Begriffe passen nicht in den Text. Streiche sie am Ende durch und erkläre einen davon in einem Satz.' if not loesung else 'Lösung: Eingesetzte Begriffe sind farbig hervorgehoben; nicht verwendet werden die vier Zusatzbegriffe im Wortspeicher.',font=F,size=11,color='555555',after=4)
    if not loesung:
        name_row(d,F,10.5)
    p=d.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY; no_space(p,4,8); p.paragraph_format.line_spacing=1.8
    n=0
    for chunk in re.split(r'(\{[^}]+\}|\*\*[^*]+\*\*)',TEXT):
        if chunk.startswith('**'): r=p.add_run(chunk[2:-2]+' '); setfont(r,F,12,True,color=COL); continue
        if chunk.startswith('{'):
            n+=1; w=chunk[1:-1]
            if loesung: r=p.add_run(' %s '%w); setfont(r,F,12,True,color=COL); r.font.highlight_color=None; rpr=r._element.get_or_add_rPr(); sh=OxmlElement('w:shd'); sh.set(qn('w:val'),'clear'); sh.set(qn('w:fill'),'D8E8EB'); rpr.append(sh)
            else: r=p.add_run('(%d) '%n); setfont(r,F,8,color='888888'); r=p.add_run(' '+' '*(len(w)+2)+' '); setfont(r,F,12); r.font.underline=True
        else: r=p.add_run(chunk); setfont(r,F,12)
    pool=words+extra; random.Random(7).shuffle(pool)
    h2(d,'Wortspeicher',font=F,size=12)
    t=d.add_table((len(words)+len(extra)+3)//4,4); t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for i,w in enumerate(pool):
        c=t.rows[i//4].cells[i%4]; shade_cell(c,LIGHT if w not in extra else 'F6EBD9'); cell_borders(c,top=(4,'FFFFFF'),bottom=(4,'FFFFFF'),left=(4,'FFFFFF'),right=(4,'FFFFFF')); cell_margins(c,30,30,80,80)
        p=c.paragraphs[0]; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; no_space(p); r=p.add_run(w); setfont(r,F,10.5,True,color='222222' if w not in extra else (RED if loesung else '222222'))
    if loesung: para(d,'Zusatzbegriffe (passen nicht): **Galiläi, Armbrust, Parlament, Kompass** (orange hinterlegt).',font=F,size=11,before=6)
    else:
        para(d,'Erkläre einen der nicht verwendeten Begriffe in einem Satz:',font=F,size=11,before=8)
        for _ in range(1): p=d.add_paragraph(); no_space(p); p.paragraph_format.line_spacing=1.8; r=p.add_run('_'*90); setfont(r,F,10,color='999999')
    if loesung:
        h2(d,'Lösungsreihenfolge',font=F)
        para(d,'   '.join('(%d) %s'%(i+1,w) for i,w in enumerate(words)),font=F,size=11)
    if not loesung: quellen(d,QUELLEN,font=F)
    d.save(os.path.join(OUT,'Lueckentext%s.docx'%('_LOESUNG' if loesung else '')))
build(False); build(True); print('ok',len(words),len(TEXT.split()))
