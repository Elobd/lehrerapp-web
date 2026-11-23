from lib import *
from docx.enum.table import WD_ROW_HEIGHT_RULE
F=FONT_S
OUT=os.path.join(HERE,'..','out')
W=[('Handschrift und Druck: Ausgangslage',[
 ('Wie wurden Bücher vor Gutenberg hergestellt?','Von Hand abgeschrieben, meist in Klöstern (Skriptorien) auf Pergament.',['von Hand abgeschrieben','Kloster/Skriptorium oder Pergament genannt']),
 ('Nenne zwei Nachteile handgeschriebener Bücher.','Zum Beispiel: sehr teuer und langsam in der Herstellung; Abschreibfehler.',['erster Nachteil','zweiter Nachteil']),
 ('Warum waren Abschreibfehler für die Wissenschaft ein Problem?','Jede Abschrift konnte vom Original abweichen; es gab keinen sicheren, gleichen Wortlaut.',['Abweichungen zwischen Abschriften','kein gesicherter gleicher Text']),
 ('Wer hatte vor 1450 vor allem Zugang zu Büchern?','Klöster, Adel und Universitäten bzw. Gelehrte.',['mindestens eine Gruppe richtig genannt'])]),
('Skriptorium, Pergament, Universitäten',[
 ('Was ist ein Skriptorium?','Die Schreibstube eines Klosters, in der Handschriften kopiert wurden.',['Schreibstube/Kloster']),
 ('Was ist Pergament?','Ein aus Tierhaut hergestellter, haltbarer, aber teurer Beschreibstoff.',['Tierhaut']),
 ('Warum stieg mit den Universitäten der Bedarf an Büchern?','Studenten und Gelehrte brauchten Lehrtexte; es gab mehr Leser.',['mehr Studenten/Gelehrte','Bedarf an Texten']),
 ('Wie lange konnte ein Schreiber an einer Bibel arbeiten?','Monate oder länger.',['Monate (oder länger)'])]),
('Blockdruck und Holzschnitt',[
 ('Was versteht man unter Blockdruck?','Eine ganze Seite wird in eine Holzplatte geschnitten und gedruckt.',['ganze Seite','Holzplatte/Holzschnitt']),
 ('Wofür nutzte man den Blockdruck in Europa vor Gutenberg?','Für Einzelbilder (z. B. Heiligenbilder), Spielkarten und kurze Texte.',['ein Beispiel richtig']),
 ('Warum war der Blockdruck für ganze Bücher unpraktisch?','Die Platte ist nur für diese eine Seite nutzbar und das Schneiden ist sehr aufwendig.',['Platte nur für eine Seite','aufwendig']),
 ('Was war bei Gutenbergs Verfahren grundlegend anders?','Es wurden einzelne, wiederverwendbare Buchstaben verwendet.',['einzelne/bewegliche Buchstaben'])]),
('Gutenberg: Person und Leben',[
 ('Wo und wann arbeitete Gutenberg an seiner Erfindung?','In Mainz, um 1450.',['Mainz']),
 ('Welches Vorwissen half Gutenberg bei der Erfindung?','Kenntnisse in Metallverarbeitung/Münzprägung aus seinem Umfeld.',['Metallverarbeitung/Münzprägung']),
 ('Warum wurde Gutenberg wirtschaftlich nicht reich?','Er hatte Schulden und verlor 1455 seine Werkstatt an Fust.',['Schulden/Geldgeber','Werkstatt verloren']),
 ('Was geschah 1465 mit Gutenberg?','Er wurde Hofmann des Mainzer Erzbischofs und war damit versorgt.',['Hofmann/Erzbischof'])]),
('Bewegliche Lettern und Satz',[
 ('Was sind bewegliche Lettern?','Einzeln gegossene Metallbuchstaben, die immer wieder neu zusammengesetzt werden.',['einzelne Metallbuchstaben','wiederverwendbar']),
 ('Warum sind Lettern wirtschaftlich vorteilhaft?','Sie sind wiederverwendbar, dadurch sinken die Kosten pro Exemplar.',['wiederverwendbar','Kosten pro Exemplar sinken']),
 ('Was versteht man unter einem Satz?','Die zu Zeilen und Seiten zusammengestellten Lettern (Druckform).',['zusammengestellte Lettern/Druckform']),
 ('Womit werden die Lettern zu Zeilen zusammengestellt?','Mit dem Winkelhaken.',['Winkelhaken'])]),
('Handgießinstrument und Letternmetall',[
 ('Wozu diente das Handgießinstrument?','Man goss damit viele gleich hohe und gleich breite Lettern.',['Lettern gießen','gleichmäßig/viele']),
 ('Woraus bestand das Letternmetall?','Aus einer Legierung, vor allem Blei, Zinn und Antimon.',['mindestens zwei Metalle richtig']),
 ('Warum mussten alle Lettern gleich hoch sein?','Damit der Druck gleichmäßig wird.',['gleichmäßiger Druck']),
 ('Was ist eine Matrize?','Die Gussform, mit der ein Buchstabe gegossen wird.',['Gussform'])]),
('Druckerpresse und Druckerfarbe',[
 ('Woran erinnerte die Druckerpresse in ihrer Bauweise?','An eine Wein- oder Ölpresse (Spindelpresse).',['Wein-/Ölpresse']),
 ('Warum brauchte Gutenberg eine ölhaltige Farbe?','Wasserlösliche Tinte haftet nicht auf Metall.',['Tinte haftet nicht','auf Metall/Lettern']),
 ('Wofür sorgt die Presse beim Druck?','Für einen gleichmäßigen, kräftigen Druck auf das Papier.',['gleichmäßiger/kräftiger Druck']),
 ('Woraus bestand die Druckerfarbe?','Aus Firnis (Öl) und Ruß.',['Öl/Firnis oder Ruß'])]),
('Papier statt Pergament',[
 ('Warum verwendete man meist Papier?','Es war billiger und leichter zu beschaffen.',['billiger oder leichter']),
 ('Wann verwendete man weiterhin Pergament?','Für besondere Prachtexemplare.',['Prachtexemplare/besondere Bücher']),
 ('Wie wirkte billigeres Material auf die Verbreitung von Büchern?','Mehr Bücher wurden bezahlbar, die Auflagen konnten größer werden.',['bezahlbarer','größere Verbreitung']),
 ('Nenne zwei Bestandteile von Gutenbergs Gesamtsystem.','Zum Beispiel: Lettern, Presse, Farbe, Papier, Gießinstrument.',['erster Bestandteil','zweiter Bestandteil'])]),
('Die 42-zeilige Bibel',[
 ('Warum heißt sie „42-zeilige Bibel“?','Weil eine Seite 42 Zeilen hat.',['42 Zeilen pro Seite']),
 ('Wie viele Exemplare wurden ungefähr gedruckt?','Etwa 180.',['ca. 180']),
 ('Warum ahmte Gutenberg Handschriften nach?','Das Buch sollte so schön aussehen wie die besten Handschriften, die die Käufer kannten.',['Aussehen wie Handschrift','Käufer gewohnt']),
 ('Was wurde nach dem Druck von Hand ergänzt?','Initialen und Verzierungen.',['Initialen/Verzierungen'])]),
('Fust und Schöffer',[
 ('Wer war Johannes Fust?','Ein Mainzer Kaufmann, der Gutenbergs Werkstatt finanzierte.',['Kaufmann/Geldgeber']),
 ('Was geschah 1455 zwischen Gutenberg und Fust?','Fust forderte sein Geld zurück; Gutenberg verlor die Werkstatt.',['Rückforderung','Werkstatt verloren']),
 ('Wer war Peter Schöffer?','Ein Schreiber und Drucker, der mit Fust weiterarbeitete.',['Schreiber/Drucker']),
 ('Was ist der „Mainzer Psalter“ (1457)?','Das erste Druckwerk mit Datum und Druckernennung.',['erstes datiertes Druckwerk','Druckernennung'])]),
('Ausbreitung in Europa',[
 ('Nenne drei frühe Druckorte.','Zum Beispiel: Mainz, Straßburg, Köln, Basel, Venedig, Paris, Nürnberg.',['erster Ort','zweiter Ort']),
 ('Wie viele Orte hatten bis 1500 Druckereien?','Etwa 250.',['ca. 250']),
 ('Warum war Venedig ein wichtiges Druckzentrum?','Handelsstadt mit Kapital, Gelehrten und Absatzmärkten.',['Handel/Kapital','Gelehrte/Absatz']),
 ('Was entwickelte der Drucker Aldus Manutius?','Handliche Buchformate und die Kursivschrift.',['Taschenformat oder Kursive'])]),
('Inkunabeln und Zahlen',[
 ('Was ist eine Inkunabel?','Ein Druck bis einschließlich 1500 (Wiegendruck).',['Druck bis 1500']),
 ('Was bedeutet das Wort „Inkunabel“ wörtlich?','Wiege bzw. Windeln (lateinisch incunabula).',['Wiege/Windeln']),
 ('Wie viele Exemplare wurden bis 1500 ungefähr gedruckt?','Schätzungen: etwa 20 Millionen.',['ca. 20 Mio.']),
 ('Warum sind solche Zahlen nur Schätzungen?','Viele Drucke sind verloren gegangen, die Überlieferung ist unvollständig.',['Verlust von Drucken','unvollständige Überlieferung'])]),
('Die Druckerwerkstatt',[
 ('Was ist die Aufgabe des Setzers?','Er stellt den Text spiegelverkehrt aus Lettern zusammen.',['Text aus Lettern setzen']),
 ('Was macht der Drucker?','Er färbt den Satz ein, legt das Papier auf und bedient die Presse.',['einfärben/Presse']),
 ('Warum braucht man einen Korrektor?','Ein Fehler im Satz kehrt in jedem Exemplar wieder.',['Fehler im Satz','erscheint in allen Exemplaren']),
 ('Nenne einen neuen Beruf, der durch den Buchdruck wichtig wurde.','Setzer, Drucker, Korrektor, Verleger oder Buchführer.',['ein Beruf richtig'])]),
('Humanismus',[
 ('Was bedeutet „ad fontes“?','Zu den Quellen.',['zu den Quellen']),
 ('Wofür interessierten sich die Humanisten besonders?','Für antike Texte, Bildung und den Menschen.',['Antike/Texte oder Mensch/Bildung']),
 ('Wie half der Buchdruck den Humanisten?','Antike Texte erschienen in verlässlichen Ausgaben in vielen gleichen Exemplaren.',['verlässliche Ausgaben','viele gleiche Exemplare']),
 ('Wer gilt als Wegbereiter des Humanismus?','Francesco Petrarca.',['Petrarca'])]),
('Erasmus von Rotterdam',[
 ('Wer war Erasmus von Rotterdam?','Ein niederländischer Humanist und gefragter Autor.',['Humanist']),
 ('Welches Werk gab er 1516 heraus?','Das griechische Neue Testament mit lateinischer Übersetzung.',['griechisches Neues Testament','mit lateinischer Übersetzung']),
 ('Warum war dieses Werk wichtig?','Es machte den Urtext für Gelehrte zugänglich und beeinflusste spätere Übersetzungen.',['Urtext zugänglich','beeinflusste Übersetzungen']),
 ('Mit welchem Drucker arbeitete Erasmus in Basel zusammen?','Mit Johann Froben.',['Froben'])]),
('Flugschriften',[
 ('Was ist eine Flugschrift?','Ein kurzes, billiges Heft zu aktuellen Streitfragen.',['kurz/billig/aktuell']),
 ('Warum erreichten Flugschriften auch Menschen, die kaum lesen konnten?','Durch Holzschnitte und weil sie vorgelesen wurden.',['Bilder/Holzschnitte','Vorlesen']),
 ('Welche neue Entwicklung förderten Flugschriften?','Eine öffentliche Debatte.',['Öffentlichkeit/Debatte']),
 ('Zu welchem Thema erschienen besonders viele Flugschriften?','Zu Ablass, Kirche und Reformation.',['Reformation/Kirche'])]),
('Martin Luther',[
 ('Wogegen richteten sich Luthers Thesen 1517?','Gegen den Ablasshandel.',['Ablasshandel']),
 ('Wann erschien sein deutsches Neues Testament?','1522 (die ganze Bibel 1534).',['1522']),
 ('Wie wollte Luther übersetzen?','So, dass es die Menschen im Alltag verstehen (dem Volk „aufs Maul schauen“).',['verständlich','Alltagssprache']),
 ('Welche Wirkung hatte seine Bibel auf die Sprache?','Sie förderte eine einheitlichere deutsche Schriftsprache.',['einheitliche Schriftsprache'])]),
('Wissenschaft und Weltbild',[
 ('Welche beiden Werke erschienen 1543?','Kopernikus (Weltbild) und Vesalius (Anatomie).',['Kopernikus','Vesalius']),
 ('Was bedeutet heliozentrisches Weltbild?','Die Sonne steht im Zentrum.',['Sonne im Zentrum']),
 ('Warum war der Druck für die Wissenschaft wichtig?','Alle Exemplare sind gleich, deshalb lassen sich Aussagen überprüfen und weiterentwickeln.',['identische Exemplare','überprüfbar/weiterentwickeln']),
 ('Was zeigte Vesalius in seinem Werk?','Genaue Abbildungen des Körpers nach eigener Beobachtung.',['genaue Anatomie/Abbildungen'])]),
('Zensur und Privilegien',[
 ('Was erließ der Mainzer Erzbischof 1486?','Ein Zensuredikt.',['Zensuredikt']),
 ('Was war der „Index“?','Eine Liste verbotener Bücher der Kirche (erstmals 1559).',['Liste verbotener Bücher']),
 ('Was ist ein Privileg im Druckwesen?','Ein zeitlich begrenztes Alleinrecht auf den Druck eines Werks.',['Alleinrecht','zeitlich begrenzt']),
 ('Warum wollten Kirche und Obrigkeit Druckwerke kontrollieren?','Sie fürchteten Machtverlust und Kritik.',['Machtverlust/Kritik'])]),
('Folgen und Urteil',[
 ('Nenne zwei langfristige Folgen des Buchdrucks.','Zum Beispiel: mehr Lesefähigkeit, Öffentlichkeit, Schulen, Zeitungen.',['erste Folge','zweite Folge']),
 ('Wann erschien die erste wöchentliche Zeitung?','1605 in Straßburg.',['1605']),
 ('Was meint man mit „Medienrevolution“?','Eine Technik verändert gemeinsam mit der Gesellschaft grundlegend die Kommunikation.',['Technik','Wirkung auf Gesellschaft/Kommunikation']),
 ('Nenne eine Parallele zu heute.','Zum Beispiel: Internet/soziale Medien – neue Öffentlichkeit und Debatte über Kontrolle.',['sinnvolle Parallele'])])]
assert len(W)==20 and all(len(x[1])==4 for x in W)
d=new_doc(landscape=True,font=F,size=10.5,margins=(1.2,1.5,1.2,1.5)); build_header_footer(d,'Mündliche Wiederholung','Der Buchdruck',loesung=True,font=F,band='NUR FÜR DIE LEHRKRAFT  |  Wiederholungsfragen mit Musterantworten und Punkten')
title(d,'Mündliche Stundenwiederholung: Der Buchdruck','20 Wiederholungen zu je maximal 5 Minuten | je Wiederholung 4 Fragen | Antworten in 1–2 Sätzen',font=F)
box(d,'So geht es',['**Ablauf (max. 5 Min.):** 4 Fragen à ca. 1 Minute (Schüler/in antwortet in 1–2 Sätzen), 1 Minute Rückmeldung.','**Korrektur:** Pro Frage gibt es je erfülltem Kriterium **1 Punkt**. Kästchen ☐ ankreuzen, dann Punkte eintragen. Ein Kriterium ist erfüllt, wenn der Gedanke sinngemäß genannt wird (wörtlich muss es nicht sein).','**Richtig / teilweise / falsch:** alle Kriterien = richtig (✓), mindestens eins = teilweise (~), keins = falsch (✗).'],font=F,size=10)
for n,(titel,qs) in enumerate(W,1):
    total=sum(len(q[2]) for q in qs)
    p=d.add_paragraph(); no_space(p,10,2); p.paragraph_format.keep_with_next=True; par_border_bottom(p,COL,8)
    r=p.add_run('Wiederholung %02d   '%n); setfont(r,F,13,True,color=COL); r=p.add_run(titel); setfont(r,F,13,True); r=p.add_run('      ca. 5 Min.  |  max. %d Punkte  |  erreicht: ____ / %d'%(total,total)); setfont(r,F,9.5,color='777777')
    t=d.add_table(5,5); t.style='Table Grid'; t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    wd=[Cm(0.8),Cm(6.6),Cm(7.0),Cm(7.6),Cm(4.5)]
    for j,h in enumerate(['Nr.','Frage','Musterantwort','Kriterien (je erfüllt = 1 P.)','Punkte / Wertung']):
        c=t.rows[0].cells[j]; shade_cell(c,COL); p=c.paragraphs[0]; no_space(p); r=p.add_run(h); setfont(r,F,9,True,color='FFFFFF')
    for i,(q,a,kr) in enumerate(qs,1):
        row=t.rows[i].cells
        for j,v in enumerate([str(i),q,a]):
            p=row[j].paragraphs[0]; no_space(p,2,2); r=p.add_run(v); setfont(r,F,9.5,bold=(j<2))
        p=row[3].paragraphs[0]; no_space(p,2,0)
        for k,x in enumerate(kr):
            p=row[3].paragraphs[0] if k==0 else row[3].add_paragraph(); no_space(p,0,1); r=p.add_run('☐ '+x); setfont(r,F,9.5)
        p=row[4].paragraphs[0]; no_space(p,2,2); r=p.add_run('____ / %d P.'%len(kr)); setfont(r,F,10,True,color=COL)
        p=row[4].add_paragraph(); no_space(p,2,0); r=p.add_run('✓ richtig   ~ teils   ✗ falsch'); setfont(r,F,8,color='666666')
    for ri,r_ in enumerate(t.rows):
        r_.cantSplit=True
        if ri<4:
            for c in r_.cells:
                for p in c.paragraphs: p.paragraph_format.keep_with_next=True
        for j,c in enumerate(r_.cells): c.width=wd[j]
    for j in range(5): t.columns[j].width=wd[j]
quellen(d,QUELLEN,font=F)
d.save(os.path.join(OUT,'Wiederholung-muendlich_Der-Buchdruck.docx')); print('ok',sum(len(q[2]) for x in W for q in x[1]),'Kriterien')
