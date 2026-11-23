from lib import *
F=FONT_S
OUT=os.path.join(HERE,'..','out'); os.makedirs(OUT,exist_ok=True)
def namezeile(d,font=F): name_row(d,font)
def aufgabe(d,nr,titel,pts,afb,font=F):
    p=d.add_paragraph(); no_space(p,10,3); p.paragraph_format.keep_with_next=True; par_border_bottom(p,COL,6)
    if nr in (3,5,7): p.paragraph_format.page_break_before=True
    r=p.add_run('%d   '%nr); setfont(r,font,15,True,color=COL); r=p.add_run(titel); setfont(r,font,12.5,True,color='222222')
    r=p.add_run('      '+afb.split(' | ')[-1]); setfont(r,font,9,italic=True,color='888888')
def lines(d,n,font=F):
    n=int(round(n*1.25))
    for _ in range(n): p=d.add_paragraph(); no_space(p,0,0); p.paragraph_format.line_spacing=1.9; r=p.add_run('_'*98); setfont(r,font,9.5,color='999999')
def teil(d,txt,pts,font=F,loesung=None):
    p=d.add_paragraph(); no_space(p,2,3); p.paragraph_format.left_indent=Cm(0.7); p.paragraph_format.first_line_indent=Cm(-0.7)
    parts=txt.split('**')
    for i,t in enumerate(parts):
        if t: r=p.add_run(t); setfont(r,font,10.5,i%2==1)
def loesung_box(d,lines_,font=F):
    box(d,'Erwartungshorizont',lines_,fill='FFF4CC',bar='111111',font=font,size=10)
def build(loesung):
    d=new_doc(font=F,size=10.5); build_header_footer(d,'Arbeitsblatt – Offene Fragen','Der Buchdruck',loesung=loesung,font=F)
    title(d,'Arbeitsblatt: Offene Fragen','Der Buchdruck – Medienrevolution um 1450  |  Lies zuerst das Textblatt. Bearbeite die Aufgaben in vollständigen Sätzen.' ,font=F)
    if not loesung: namezeile(d)
    else: para(d,'Erwartungshorizont zur Selbst- und Fremdkontrolle | Anforderungsbereiche: I Wiedergeben, II Erklären und Anwenden, III Beurteilen',font=F,size=10,color='555555')
    # 1
    aufgabe(d,1,'Die Druckerpresse',4,'AFB I | Wiedergeben')
    image(d,'presse_skizze.png',7.6)
    teil(d,'a)  Beschrifte die Skizze: Trage die Nummern 1–5 mit den passenden Bezeichnungen ein (Spindel, Hebel, Presstiegel, Satz, Fundament).',4)
    if loesung: loesung_box(d,['1 Hebel | 2 Spindel | 3 Presstiegel | 4 Satz (Druckform mit Lettern) | 5 Fundament.'])
    else:
        for i in range(1,6): para(d,'%d: ______________________________'%i,font=F,size=10.5,after=1)
    # 2
    aufgabe(d,2,'Gutenbergs Gesamtsystem',3,'AFB I | Wiedergeben')
    teil(d,'a)  Nenne **drei** Bestandteile von Gutenbergs Verfahren und erkläre jeweils in einem Satz, warum sie notwendig waren.',3)
    if loesung: loesung_box(d,['Z. B.: bewegliche Metalllettern (wiederverwendbar, bei gleichmäßiger Höhe) | Handgießinstrument (viele gleiche Lettern) | Presse (gleichmäßiger Druck) | ölhaltige Farbe (haftet auf Metall) | Papier (billiger als Pergament).'])
    else: lines(d,5)
    # 3
    aufgabe(d,3,'Quellenarbeit: Luther über das Dolmetschen',5,'AFB II | Erklären')
    box(d,'Quelle',['„Man muss die Mutter im Hause, die Kinder auf den Gassen, den gemeinen Mann auf dem Markt darum fragen und denselben auf das Maul sehen, wie sie reden, und danach dolmetschen.“'],fill='EEF3F4',italic=True,font=F,title_txt='Martin Luther, Sendbrief vom Dolmetschen, 1530 (gekürzt)')
    teil(d,'a)  Fasse die Aussage Luthers in eigenen Worten zusammen.',2)
    if loesung: loesung_box(d,['Luther will, dass die Bibel in der Alltagssprache der Menschen verfasst wird; er orientiert sich am Sprachgebrauch von Mutter, Kindern und Marktleuten statt an gelehrtem Latein.'])
    else: lines(d,3)
    teil(d,'b)  Erkläre, warum diese Haltung zusammen mit dem Buchdruck die Verbreitung reformatorischer Ideen beschleunigte.',3)
    if loesung: loesung_box(d,['Verständliche deutsche Texte erreichen mehr Menschen; Drucker können sie in großer Zahl und billig vervielfältigen; Flugschriften und Bibelübersetzung werden schnell und weit verbreitet; auch Nichtleser erreicht der Inhalt durch Vorlesen.'])
    else: lines(d,4)
    # 4
    aufgabe(d,4,'Handschrift und Buchdruck im Vergleich',4,'AFB II | Vergleichen')
    t=d.add_table(5,3); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for j,hx in enumerate(['Kriterium','Handschrift','Buchdruck']): c=t.rows[0].cells[j]; shade_cell(c,COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(hx); setfont(r,F,10,True,color='FFFFFF')
    sol=[('Herstellungsdauer','Monate pro Buch','Viele Exemplare in kurzer Zeit'),('Kosten','hoch (Pergament, Arbeitszeit)','sinken mit steigender Auflage'),('Fehler/Textgleichheit','Abschreibfehler, Abweichungen','gleicher Wortlaut in allen Exemplaren'),('Verbreitung','wenige Exemplare, Klöster/Universitäten','weite Verbreitung in Europa')]
    for i,(a,b,c_) in enumerate(sol,1):
        row=t.rows[i].cells; p=row[0].paragraphs[0]; no_space(p); r=p.add_run(a); setfont(r,F,10,True)
        for j,x in ((1,b),(2,c_)):
            p=row[j].paragraphs[0]; no_space(p,3,3)
            if loesung: r=p.add_run(x); setfont(r,F,9.5,color=RED)
            else: p.add_run(' ')
    para(d,'a)  Ergänze die Tabelle in Stichworten.',font=F,size=10.5,before=4)
    if loesung: loesung_box(d,['Sinngemäß richtige Stichworte genügen; rot eingetragene Lösung als Beispiel.'])
    # 5
    aufgabe(d,5,'Buchdruck und Wissenschaft',4,'AFB II | Zusammenhänge herstellen')
    teil(d,'a)  Erkläre am Beispiel von Kopernikus oder Vesalius (1543), warum der Buchdruck die Wissenschaft veränderte. Gehe auf den Begriff „identische Exemplare“ ein.',4)
    if loesung: loesung_box(d,['Bücher mit identischem Text und gleichen Abbildungen erlauben Überprüfung, Vergleich und Kritik; Wissenschaft kann auf den Ergebnissen anderer aufbauen / wird kumulativ; konkretes Beispiel (Heliozentrik, Anatomie mit genauen Abbildungen).'])
    else: lines(d,5)
    # 6
    aufgabe(d,6,'Urteilen: Medienrevolution?',6,'AFB III | Beurteilen')
    box(d,'Impuls','„Der Buchdruck war eine Medienrevolution.“',font=F,fill='F6EBD9',bar=OCHER,italic=True)
    teil(d,'a)  Nimm begründet Stellung zu dieser Aussage. Nenne mindestens **zwei Argumente dafür** und **ein Argument dagegen oder eine Einschränkung** und komm zu einem eigenen Urteil.',5)
    if loesung: loesung_box(d,['Dafür: sinkende Preise/Verbreitung, Humanismus/Reformation/Wissenschaft, neue Berufe, Öffentlichkeit. Einschränkung: Lesefähigkeit gering, Wirkung über Generationen, Zensur, Technik wirkt nur im gesellschaftlichen Zusammenhang. Urteil mit Begründung.'])
    else: lines(d,6)
    teil(d,'b)  **Klassenbezug:** Notiere, welcher Standpunkt in unserer Unterrichtsdiskussion vom __________ (Datum) am stärksten war und warum du ihm (nicht) zustimmst.',1)
    if loesung: loesung_box(d,['Individuell; Bezug zur Klassendiskussion muss erkennbar sein. Dient zugleich als Echtheitsprüfung der Eigenleistung.'])
    else: lines(d,2)
    # 7
    aufgabe(d,7,'Transfer: gestern und heute',4,'AFB III | Übertragen')
    teil(d,'a)  Vergleiche die Wirkung des Buchdrucks mit der eines **digitalen Mediums**, das **du in den letzten 7 Tagen selbst genutzt hast**. Nenne Datum, Medium und eine konkrete Situation.',4)
    if loesung: loesung_box(d,['Individuell. Erwartet: Gemeinsamkeiten (schnelle Verbreitung, neue Öffentlichkeit, Kontrolle/Regeln) und Unterschiede (Geschwindigkeit, Rückkanal, Anonymität); konkrete eigene Situation mit Datum. Mündliche Rückfrage der Lehrkraft möglich.'])
    else: lines(d,5)
    aufgabe(d,8,'Eigene Skizze: Wirkungen des Buchdrucks',0,'AFB III | Gestalten')
    teil(d,'a)  Zeichne eine Mindmap oder einen Zeitstrahl: Wähle **eine Person** (z. B. Gutenberg, Luther, Erasmus, Kopernikus oder eine Bürgerin um 1500) und zeige, wie der Buchdruck ihr Leben verändert haben könnte. Beschrifte mindestens **fünf** Elemente.',0)
    if loesung: loesung_box(d,['Individuell. Erwartet: sinnvolle Auswahl einer Person, mindestens fünf beschriftete Elemente (z. B. Verbreitung ihrer Ideen, neue Lesepublikum, Kontrolle/Zensur, wirtschaftliche Folgen), erkennbarer Bezug zum Textblatt.'])
    else:
        t=d.add_table(1,1); t.alignment=WD_TABLE_ALIGNMENT.CENTER; c=t.rows[0].cells[0]; cell_borders(c,top=(6,'999999'),bottom=(6,'999999'),left=(6,'999999'),right=(6,'999999')); from docx.enum.table import WD_ROW_HEIGHT_RULE; t.rows[0].height=Cm(7.0); t.rows[0].height_rule=WD_ROW_HEIGHT_RULE.AT_LEAST; c.paragraphs[0].add_run(' ')
        para(d,'',after=2)
    box(d,'Hinweis','Halte zwei Sätze zu Aufgabe 6 oder 7 für ein kurzes Gespräch bereit. Deine Lehrkraft kann nachfragen. Handskizzen und eigene Beispiele sind ausdrücklich erwünscht.',font=F,fill='F2F2F2',bar='888888')
    if not loesung: quellen(d,QUELLEN,font=F)
    d.save(os.path.join(OUT,'Arbeitsblatt_Offene_Fragen%s.docx'%('_LOESUNG' if loesung else '')))
build(False); build(True); print('ok')
