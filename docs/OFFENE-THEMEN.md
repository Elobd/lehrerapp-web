# Offene Themen

Pro Thema: Ziel · Stand · offene Fragen · Vorschlag. Nach Abschluss nach „Erledigt“ verschieben (mit Versionskennung).
Neuen Chat so starten: „Thema <Name> aus docs/OFFENE-THEMEN.md. Antworten: …“

## ➜ Übergabe an den nächsten Chat (Stand S69, 27.11.2026)
- **Zuerst klären:** Ist auf der NAS die Selbstaktualisierung aktiv? (Einstellungen → „App-Aktualisierung“ muss „Server ist aktuell“ zeigen.) Zuletzt kam „Unbekannte API“ beim PDF-Knopf = alter Server. Nutzer hat den kompletten server-Ordner als ZIP bekommen (einmal von Hand einspielen, Container „lehrerapp-app“ → „Neu starten“).
- **Danach testen lassen:** PDFs (LibreOffice wird beim ersten Mal per apk im Container installiert – Meldung erfragen), Gesamt-PDF, Bild aus Webseite aufs Cover ziehen, File-Station-Link (Einstellungen → App-Aktualisierung → NAS-Ordner), PowerPoint „Bilder“.
- **Offen ohne Entscheidung:** Word/PowerPoint in der App bearbeiten (Vorschlag „Ersetzen“-Knopf), USB-Erkennung (Container sieht den Stick nicht – Synology „USB Copy“ mit NAS-Ordner files/Druckaufträge vorgeschlagen), Werkzeugleiste auch für eigene (nicht KI-)Arbeitsaufträge, Seitenkopf auch für Bibliothek/Druckablage, Video zum Thema.

---

## 1. Schülerfotos am Smartphone werden nicht angezeigt
- **Stand (S44, 1baf744):** Fotos werden jetzt im Service Worker zwischengespeichert (auch offline sichtbar), bei Fehler einmal neu geladen, Hinweis mit Ursache (Server nicht erreichbar / Anmeldung abgelaufen / Fehlercode).
- **Vermutete Ursache:** Handy erreicht den Server nicht (Tailscale aus), App zeigt Daten aus dem Speicher, Fotos fehlen. Nicht bestätigt.
- **Offen:** Welche Hinweismeldung erscheint am Handy? iPhone oder Android? Homescreen-App oder Browser?

## 2. WebUntis-Änderungen automatisch übernehmen
- **Ziel:** Supplierungen, Zusatzstunden, Entfall, Konferenzen erscheinen ohne manuelles Aktualisieren.
- **Stand:** Nur manuell („Stundenplan holen“ / Lesezeichen).
- **Vorschlag:** Offizielles WebUntis-Kalender-Abo (iCal-Link); NAS-Server holt es z. B. stündlich und übernimmt Änderungen. Kein Scraping, kein Passwort am NAS.
- **Offen:** Gibt es in WebUntis unter Profil → „Freigaben“/„Kalender abonnieren“ einen Link?

## 3. Wöchentliche Word-Datei (Schul-Microsoft-Konto) → Termine in der App
- **Ziel:** Termine aus der wöchentlichen Word-Mail automatisch gespeichert und einsehbar.
- **Vorschlag Stufe 1:** Knopf „Wochen-Info hochladen“ (Android zusätzlich „Teilen → Lehrer-App“), App liest Daten/Termine aus und speichert eine Terminliste.
- **Vorschlag Stufe 2:** Power Automate (Mail-Anhang → OneDrive), falls Schule erlaubt – Weg zum NAS braucht evtl. IT-Freigabe.
- **Offen:** Darf die KI die Datei lesen (enthält vermutlich Kollegennamen → sonst nur lokale Auswertung)? Gibt es Power Automate? Beispieldatei ohne Namen.

## 4. Turnierplaner für Schülerliga
- **Ziel:** Ausbau des vorhandenen Turnier-Rechners (Sport-Tools).
- **Vorschlag:** Gruppen (jeder gegen jeden), Spielplan nach Feldern/Zeiten, Ergebnis-Eingabe, Tabelle (Punkte, Tordifferenz, direkter Vergleich), K.-o.-Runde, Druck.
- **Offen:** Sportart(en), Anzahl Teams/Felder, Spieldauer, Wertungsregeln.

## 5. Material-Workflow (Jahresplanung → Material → Stunde)
- **Ist:** „Lehrmaterial erarbeiten“ → „Material erstellen“ legt pro Klick einen neuen Arbeitsauftrag an („Fertige Arbeitsaufträge“); mehrere Varianten pro Thema möglich. Nicht geprüft, ob sie in der Bibliothek erscheinen. Jahresplanung verteilt Themen auf Unterrichtstage (Ferien ausgenommen); als „Entfallen“ markierte Stunden (ueoff) noch nicht berücksichtigt.
- **Vorschlag:** Material automatisch dem Jahresplan-Thema zuordnen → beim Thema alle Varianten sehen → „In Stunde übernehmen“ füllt Stundenablauf mit Seiten und verlinkt Material → bei Entfall (Ferien, Krankheit, Exkursion) rutschen Thema und Planung in die nächste Stunde.
- **Offen:** Hängt mit Thema 6 zusammen; Spezifikation erstellen (Planungsmodus).

## 6. Schülerprobe ↔ Arbeitsaufträge/Tests/Folien, Neuaufbau Tests-Seite
- **Offen:** Spezifikation fehlt.

## 7. Schuljahreswechsel
- **Stand:** Kein Archiv; Import ergänzt nur, löscht nie; Wiederholer als neue Person.
- **Vorschlag:** „Schuljahr abschließen“ mit Archiv und „Klassen weiterführen“. Entscheidung steht aus.
- Dabei Ferienkalender `NOE` (index.html) für das neue Schuljahr ergänzen.

## 8. Kleinere offene Punkte
- Name „Jahresplanung“ (Umbenennung unklar).
- Echte Geräte-Tests: Gesten, Ton (Spülsound), Spotify-Playlist-Rechte, KI-Qualität, App-Icon (icon-*.png beim NAS-Update mitkopieren).
- Pull-to-Refresh-Flackern nur durch Verdecken bis zum Laden entschärft.
- Krankheit ganzer Tag: Entfall derzeit pro Stunde/Klasse; evtl. „ganzer Tag entfällt“ für alle Klassen.

---

## 9. Video zum Thema (offen)
- Vertonte Folien aus Präsentation/Grafiken mit ffmpeg – nach den ersten Erfahrungen mit dem Podcast.

## 10. Bearbeiten von Word/PowerPoint (offen)
- Im Browser mit Design-Erhalt nicht machbar; Vorschlag: „Ersetzen“-Knopf (geänderte Datei hochladen → PDF neu).
- USB-Erkennung braucht die Einbindung des Sticks in den Container (USB_PATH); bis dahin NAS-Ordner files/Druckaufträge/<Datum> (Synology „USB Copy“ kann ihn beim Anstecken exportieren).

## Erledigt
- S80: Einzel-Stoppuhr auch unter Klassentools → Sport → „Stoppuhr Einzeln (Seilklettern)“ mit Klassen- und Disziplinwahl.
- S79: Einzel-Stoppuhr für Sekunden-Disziplinen (Seilklettern, Klimmhang, Pendellauf): Leistungen → Disziplin → Klassentools → Schüler antippen → Start/Stopp → Zeit mit heutigem Datum eingetragen.
- **S78:** „verspätet“: Uhrzeit wird beim Antippen immer automatisch auf die aktuelle Uhrzeit gesetzt; Zeit antippen → Fenster mit zwei Scroll-Rädern (Stunden/Minuten, Übernehmen/Abbrechen). WebUntis-Upload der Verspätungen weiter offen (wartet auf Mitschnitt/Screenshot).
- **S77:** Knopf „Anwesenheit kontrolliert“ wieder über die ganze Breite (mit „anwesend: x / y“ darin).
- **S76:** Anwesenheit (Home → Anwesenheit): neuer Status „verspätet“ mit Uhrzeit (Reihenfolge der Knopf-Taps: anwesend → abwesend → verspätet → passiv → anwesend; Zeit = Uhrzeit des Tippens bei heutiger Stunde, sonst „Zeit?“; Zeit antippen = ändern; gespeichert in log[].late = {schülerId: 'HH:MM'}, zählt als anwesend). **WebUntis-Upload der Verspätungen noch offen** (wu-sync kennt nur Fehlzeiten; es fehlt ein Mitschnitt, wie WebUntis Verspätungen einträgt). „Baustein ergänzen“: Hinweistext klarer (leer = ganzer Text).
- **S75:** Bibliothek mit gelbem Seitenkopf („Geschichte · Bibliothek“ + Anzahl); Seitenposition bleibt beim Wechsel Bibliothek/Lehrmaterial/Jahresplanung/Podcasts/Druckablage und Geschichte ↔ Sport im Jahresplan; Anwesenheit: „anwesend: x / y“ steht im Knopf „Anwesenheit kontrolliert“, Knopf rechtsbündig.
- **S74:** Wischen in Leistungen repariert (Ursache: spnav verlor den Klassenbezug; Wischen innerhalb der Disziplin-Karten scrollt die Karten, am Anfang/Ende der Karten wechselt die Seite); Kopfzeile als Raster: „Offene Stunden“ direkt unter den 4 Icons, größerer Abstand Datum ↔ Wetter; Selbstaktualisierung bei schreibgeschütztem App-Ordner (EROFS): Zusatzordner DATA_DIR/server-overlay, Aufpasser startet von dort (server/aktualisierung.js, server.js) – am NAS noch nicht erprobt; Temp-Ordner jetzt in DATA_DIR/_akt-tmp; Quiz-Exporte (Kahoot/Plickers/MS Forms) einzeln abgesichert (Fehler → Quiz-Export-Fehler.txt), Steuerzeichen werden entfernt; Bibliothek zeigt auch Import/-Textdateien; ein gemeinsames Feld „Geänderte Dateien aktualisieren“ statt Hochladen-Knöpfen je Datei (Zuordnung über Dateiname, alte Fassungen bleiben, Uhr-Symbol je Datei).
- **S73:** Einstellungen → System → „Startbildschirm“: Titelbilder (mehrere, hineinziehen, täglich wechseln/ein Bild/keins) im dunklen Kopf + Wetter (Grad, Symbol, Text, Ort; Standort des Geräts oder fester Ort; Open-Meteo, nur gerundete Koordinaten); Datum/KW größer, Desktop-Hauptmenü größer; Bibliothek: Dateien (Word/PowerPoint/Excel) per Hochladen-Symbol oder Hineinziehen auf die Zeile ersetzen, alte Fassung bleibt in _versionen, Uhr-Symbol → Frühere Fassungen + Wiederherstellen (Server: /api/auftrag/ersetzen|versionen); Leistungen-Übersicht: Punktetabelle in der Titelzeile (Tabelle rechtsbündig), kleinere Schrift, „Restliche Klasse“ zeigt alle Schüler, neues Turnen-Icon. Offen: USB am PC (Vorschlag: Ordner einmal wählen, Chrome File System Access), „Wecker“-Einblendung unklar, Ideen für den Kopfbereich.
- **S72:** Leistungen-Übersicht merkt sich je Bereich die gewählte Disziplin-Karte (bleibt nach Profil/Zurück und bei Neuzeichnen erhalten), Dropdown „Punktetabelle“ je Disziplin, Turnen-Icon (Ringe), nur der linke Teil des blauen Kopfs führt zur Eingabe (rechts ‹ › + Zähler); Desktop: Hauptmenü im dunklen Kopfbereich direkt über dem Untermenü; USB-Symbol in der Kopfzeile ausgeblendet.
- **S71:** Leistungen (Sport): Seiten als Wisch-Karussell wie Home, immer Start auf „Übersicht“, „Zuletzt erfasst“ entfernt, Kopf der Disziplin-Box antippen → Eingabeseite genau dieser Disziplin, Pfeile ‹ › im Kopf, Ball-Icon = Volleyball, neuer Hürdenläufer; Turnbefreiungen: Name / „Turnbefreiung“ / Datum in eigenen Zeilen, Archiv als Symbolknopf; Klassentools-Box zurückgenommen (nur farbiger Streifen); Hauptmenü am Desktop oben; PowerPoint-Bilder: „Bild einsetzen“ oben neben Abbrechen, „↩ Rückgängig“ (Original wird beim ersten Tausch gesichert) und „Entfernen“; Personenkarten in Präsentationen: Name als eigenes Textfeld unter dem Porträt (nur das Bild wird getauscht; gilt für neu erstellte Präsentationen); PDF-Knopf weg, PDFs entstehen automatisch (auch beim Öffnen eines Auftrags ohne PDFs); Kahoot/Plickers/MS-Forms stehen unter „Weitere Dateien“. Offen: Anwesenheits-Upload ins WebUntis (wu-sync) – Fehlermeldung erfragen; „Gerätturnen eigenes“ unklar; Columbus-Originalbild nur durch Neu-Erstellen der Präsentation.
- **S70:** Leistungen → Übersicht: je Bereich (Basis, Schwimmen, Leichtathletik, Turnen, Ball, Sonstige) eine Box mit blauem Kopf (Icon, Bereich, Disziplin), Disziplinen per Wischen in der Box, Platz 1 mit Foto/Name/Datum/Zeit, Plätze 2–5, „Restliche Klasse“ aufklappbar, Namen → Profil, Zeitwert antippen → Punktetabelle (Farbe nach Punkten); Einstellungsmenü in Gruppen mit Symbolen; Klassentools mit Farbakzent (grau/gold/blau); Stoppuhr-Dropdown beim Betreten zu; Bibliothek: Gruppe „Quiz-Exporte (Kahoot · Plickers · MS Forms)“ + Knopf „Alle PDFs“. Offen: „USB-Stick im Menü Material“ (Anweisung unklar, Rückfrage).
- **S67:** Anwesenheit: Knopf „Anwesenheit kontrolliert“ volle Breite über der Trennlinie, darunter „anwesend: 13 / 15“; NAS-Ordner-Link einstellbar (Einstellungen → App-Aktualisierung → „NAS-Ordner öffnen“, mit Test); PDFs melden Fortschritt/Fehler direkt in der Bibliothek; PowerPoint: Knopf „Bilder“ → Bildrahmen der Folien, Bild hineinziehen/antippen, im Seitenverhältnis zuschneiden, einsetzen (server/gen/pptbilder.py, /api/auftrag/pptbilder|pptbild), PDF wird aktualisiert.
- **S66:** Größere Häkchen-Kästchen bei „Was soll erstellt werden?“; Kopf „Alle Arbeitsaufträge“ grau innerhalb der Box (kein seitenbreiter Balken mehr, Ursache: Kartenklasse „fb“ mit box-shadow); Jahresplan-Kopf sitzt auf gleicher Höhe wie bei Lehrmaterial/Podcasts.
- **S65:** Bibliothek startet mit „Arbeitsaufträge“ (erster Reiter); Cover per Ziehen (Datei oder Bild aus Webseite über /api/bildholen) mit Zuschnitt (verschieben/zoomen, 1800×1000) → alle Dateien neu; Download als ↓ rechts, USB links; Ordner-Knopf öffnet die File Station (DSM-Adresse/Pfad einmal eingeben, settings „nas“); PDFs: LibreOffice wird im Container bei Bedarf per apk nachinstalliert, PDFs je Word/PowerPoint + 00_Gesamt_….pdf (ohne MS-Forms/Plickers), automatisch nach Erstellung/Ergänzen/Cover, Knopf „PDFs“.
- **S64:** Bibliothek → Arbeitsaufträge → KI-Auftrag aufklappen: Werkzeugleiste (Coverbild bearbeiten, USB ganzer Auftrag, Ordner-Pfad), Dateien gruppiert (PowerPoint, PDF, Word, Weitere, Bilder) mit Typ-Symbolen, Download + USB je Datei, Klick = Vorschau im Fenster; USB-Symbol oben in der Kopfzeile (grau/grün); Kopien nach „Druckaufträge/JJJJ-MM-TT“ (USB oder NAS-Ordner).
- **S63:** Anwesenheitsliste: „anwesend: x/y“ rechts oben über „Anwesenheit kontrolliert“, Prozente bei „Mitmachende Schüler“ entfernt; kleinere Schrift in Bausteinen/Chips; neuer Pinsel-Haken `UI.ck(n)` für grüne Häkchen; Turnbefreiungen: „von … bis …“, ohne 🚫, Archiv (Knopf/Ziehen, bleibt gespeichert); Klassenmappe: Reiter „Schüler (w / m)“, Kamera-Symbol in Übersicht weg, KV nicht mehr anklickbar; Einstellungen „Klassen verwalten“ mit Reitern Klassenfotos (Dropdown je Klasse, Haken erst wenn alle Teilklassen) und Klassenvorstände (Eingabe je Klasse).
- **S62:** Knöpfe überall rechteckig mit 8px-Rundung (skins.js S62, Regel in CLAUDE.md); Bausteinkästchen kleiner; KI-Arbeitsaufträge in Bibliothek → Arbeitsaufträge sichtbar; Podcasts: Epochen-Reiter immer (mit Zählern) wie Bibliothek, Kachel/Liste, „Bearbeiten“ mit „gehört“, Archiv (Ziehen auf „🗄 Archiv“ oder Knopf; Server: POST /api/podcast/folge).
- **S61:** Wischen links/rechts zwischen Material-Unterseiten (bei Jahresplan erst am Rand der Reiter Geschichte/Sport); Jahresplan-Thema: „KI-Material aus Arbeitsaufträgen“ je Auftrag aufklappbar (Kachel/Liste, × entfernen), Popup „Dateien auswählen“ mit Haken und „Angehakte hinzufügen“ (gespeichert in jahresplan.sub[slug].afm).
- **S60:** Kein Seiten-Einschub mehr beim Wechsel Material ↔ Podcasts; Reiter der Unterleiste per langem Drücken + Ziehen umsortierbar (gespeichert in settings „setbar“); Seitenköpfe von Lehrmaterial, Jahresplan und Podcasts wie Klassenmappen („Geschichte“ + Zusatz, Anzahl); Jahresplan zeigt „noch X von Y Std. offen“.
- **S59:** Server-Selbstaktualisierung von GitHub (Aufpasser server.js + app.js, aktualisierung.js, Einstellungen → App-Aktualisierung); Reiterleisten springen nicht mehr; Lehrmaterial/Podcasts mit Seitenkopf wie Jahresplanung; alte Wochenübersicht („uebersicht“) führt auf Home.
- **S58:** Abgebrochene Aufträge bleiben gespeichert (fertige Kapitel/Bausteine, bisherige Kosten); „Fortsetzen“ erstellt nur den Rest, „Verwerfen“ löscht.
- **S57:** „KI-Antwort nicht lesbar – abgeschnitten“ (stop_reason max_tokens): Textblatt und Handout jetzt in Zweiergruppen von Kapiteln, bei Fehler kapitelweise; Denkaufwand der KI auf „medium“ begrenzt (zählt sonst zum Antwortplatz).
- **S56:** Laufende Material-Erstellung wird beim Wiederöffnen angezeigt (Seite darf geschlossen werden); Podcasts: Sortierung „Nach Epochen“, Suche (Titel, Personen, Begriffe, Kapitel), Kurzinhalt je Folge; Shownotes im Feed (content:encoded); Kanalbild hochladen; Folgenbild wahlweise Cover oder Vorlage mit Nummer/Titel (server/gen/podbild.py).
- **S52:** Pocket Casts über Tailscale Funnel: nur /podcast/ auf Port 8443 öffentlich (tailscale/serve.json mit AllowFunnel), Feed-Parameter `basis` für öffentliche Adressen, Logo über /podcast/<token>/logo.png; in der App „Öffentlichen Link kopieren“/„Funnel testen“. Am NAS noch nicht erprobt.
- **S50/S51:** Podcast-Seite verständlicher (ein Kanal, „In AntennaPod abonnieren“, Teil-Kanäle optional); Sprachdienst ElevenLabs (Gratis-Tarif ohne Kreditkarte, eigene Voice-ID möglich) zusätzlich zu OpenAI und Azure.
- **S49:** Bausteinkästchen kompakt (−/+ rechts oben, Anzahl darunter, Seiten im Textblatt-Kästchen); Podcast: Cover des Arbeitsauftrags je Folge, Titel „Klasse.Nummer …“ (sortierbar), Datum in der Beschreibung, eigene Feeds je Epoche/Klasse (?epoche= / ?klasse=); Seite Material → Podcasts mit Filter und Player (spielt beim Seitenwechsel weiter, merkt Position, Tempo).
- **S48:** Auswahlfenster erscheinen an der Tippstelle, kleinere Schrift; Themenfenster zeigt „✓ n× ausgearbeitet“ mit Bausteinen; Anzahl je Baustein mit −/+; Textblatt-Seiten frei (3–40); Lückentext und Kreuzworträtsel getrennt; KI bekommt frühere Ausarbeitungen (Thema + Epoche) und soll Überschneidungen vermeiden; Baustein „Podcast zum Anhören“ (Skript + Sprachausgabe Azure/OpenAI) mit privatem Feed (/podcast/<token>/feed.xml, Einstellungen → Podcast & Sprachausgabe). Server-Update nötig (neu: server/podcast.js).
- **S47:** Themenauswahl als eigenes Fenster mit Nummern und abgehobenen Abschnitten; Baustein „Lehrer-Handout“ (ca. 30 Seiten, 01_Lehrer-Handout_….docx); Kategorie „Grundlagen & Methoden“ (Farbe 4A5A8C, nicht in der Epochenübersicht); Kosten in Euro (EZB-Kurs); Ordnernummern = Themennummern der Jahresplanung. Server-Update nötig.
- **S46:** Lehrmaterial-Seite neu (Klasse → Thema aus Jahresplan oder frei, Quellen „Internet + meine Quellen“ als Standard, Bausteine und Kahoot/Plickers/Forms anhakbar, Kostenschätzung und tatsächliche Kosten, „schon vorhanden“ mit ✓/+ je Baustein); KI-Schlüssel unter Einstellungen → „KI-Schlüssel (Lehrmaterial)“ mit Erklärung; Jahresplan: Titel „Jahresplan · n. Klasse“, Abschnitte hervorgehoben, Arbeitsauftrag-Dateien automatisch/von Hand/per Ziehen auf die Stunden des Themas verteilen, in der Stunde aufrufbar. Server-Update nötig.
- **S45 (a6f1e72):** „Baustein ergänzen ▾“ bei fertigen Arbeitsaufträgen: fehlenden Baustein ergänzen oder einzelnen neu erstellen (optional mit Wunsch an die KI); Grundlage ist das vorhandene Textblatt, nur die Dateien dieses Bausteins werden neu gebaut. Bausteine zentral in `BAUSTEINE` (server/auftrag.js). Server-Update nötig.
- **S44 (1baf744):** UE-Überblick beginnt ab Schulbeginn (Sommerferien 2026 im Kalender – Ursache der Phantom-Termine 21.07.–01.09.), Ferien/Feiertage als graue Zeilen, „⋯“-Menü: Entfallen (Krankheit/Exkursion/Konferenz/…) oder Termin löschen; Foto-Zwischenspeicher und Fehlerhinweis.
