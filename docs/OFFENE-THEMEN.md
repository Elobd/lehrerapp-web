# Offene Themen

Pro Thema: Ziel · Stand · offene Fragen · Vorschlag. Nach Abschluss nach „Erledigt“ verschieben (mit Versionskennung).
Neuen Chat so starten: „Thema <Name> aus docs/OFFENE-THEMEN.md. Antworten: …“

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

## Erledigt
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
