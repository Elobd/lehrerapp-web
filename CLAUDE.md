# Lehrer-App – Arbeitsregeln für Claude

Private Lehrer-App (Repo Elobd/lehrerapp-web, lokal /home/user/lehrerapp-web). Läuft als Docker-Container auf einer Synology NAS, Zugriff über Tailscale Serve.
Offene Themen und Entscheidungen: **docs/OFFENE-THEMEN.md** (zu Beginn lesen, nach jedem Thema aktualisieren). Funktionsübersicht: docs/FUNKTIONEN.md.

## Kommunikation
- Immer Deutsch, kurze Stichpunkte, ehrlich zum Teststand (was geprüft, was nicht).
- Ressourcen sparen: keine unnötigen Screenshots/Tests, gezielt lesen statt ganze Dateien.
- Jede Antwort endet mit „Versionskennung: <Commit-Hash>“.
- Anleitungen nur im Chat (keine HTML-Berichte). Dateien für das NAS per SendUserFile (Serverdateien als .zip und .txt).
- Lösungen bevorzugt in der App. Nie Container-Manager „Bearbeiten/Zurücksetzen/Bereinigen/Löschen“ empfehlen.

## NAS-Update (automatisch seit S59)
- **Server aktualisiert sich selbst:** server/server.js ist nur ein Aufpasser, der server/app.js (eigentlicher Server) als Unterprozess startet. server/aktualisierung.js prüft alle 15 Min (und per Knopf: Einstellungen → „App-Aktualisierung“) den Stand von `main` auf GitHub (öffentliches Repo, ohne API-Limit über info/refs + codeload-Tarball), lädt geänderte Dateien unter server/, prüft .js mit `node --check`, schreibt sie und beendet die App mit Code 75 → Aufpasser startet sie sofort neu. Nie während einer laufenden Material-Erstellung. Abschaltbar mit AUTO_UPDATE=0.
- Folge für die Arbeit: **Nach `git push origin HEAD:main` ist der Server spätestens nach ~15 Min aktiv – keine ZIP-Dateien und keine Anleitung mehr schicken.** Dem Nutzer nur sagen: „wird automatisch aktiv (oder Einstellungen → App-Aktualisierung → Jetzt prüfen)“.
- Nur noch nötig bei Änderungen außerhalb von server/ und web/ (z. B. tailscale/serve.json, Dockerfile): dann ZIP + TXT per SendUserFile mit konkreter Anleitung (Container Manager → Container → „Neu starten“; Tailscale-Container heißt nach Image tailscale/tailscale; nie „Bearbeiten/Zurücksetzen/Bereinigen/Löschen“).
- Fällt die Selbstaktualisierung aus (Status in Einstellungen → App-Aktualisierung), Notfall: geänderte server/-Dateien als ZIP schicken, Container „lehrerapp-app“ → „Neu starten“.
- Immer genau sagen, wo in der App etwas zu finden ist (Menü → Seite → Bereich → Knopfname).
- Fehlerdateien der KI: `ki-fehler-<schritt>.txt` im Datenordner (neben ki-schluessel.txt); erste Zeile `stop_reason` erfragen.

## Verbote
- Niemals committen: Schülerdaten, Passwörter, Schlüssel, docker-compose.yml, vorlage.pptx.
- Kein Scraping von digi4school. Keine persönlichen Daten (Schüler, Kollegen) an externe Dienste. Keine Schlüssel im Chat.

## Workflow
1. Ändern → `node --check` für jede geänderte .js-Datei (Inline-Skripte in index.html per `new Function` prüfen).
2. Lokaler Playwright-Test: `serviceWorkers:'block'`, Viewport 390×844, Testserver
   `PORT=8099 APP_PASSWORD=t AI_MOCK=1 DATA_DIR=<scratchpad>/data node server/server.js`.
   - Login: `POST /api/login {password:'t'}`; Testdaten: `PUT /api/c/settings/<id>` (Header `x-ts`).
   - Stundenplan: id `timetable` mit `{rows:[{wd:2,period:3,cls:'5CS',classes:['5CS'],subject:'GPB'}],times:{3:{von:'09:50',bis:'10:40'}}}`; Klasseninfo: id `cn_<slug>` (z. B. `cn_5cs-gpb`) mit `students`, `log`.
   - Klassenmappe öffnen: `setView('mappe-'+KM.classes()[0].key)`, Reiter über `U.kmTab[c.key]`.
3. Sichtbare Version in web/index.html (#appver, „Version TT.MM.JJJJ · Neue Oberfläche S<n>“) hochzählen.
4. Commit mit Trailer:
   `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` und die Claude-Session-Zeile laut System-Hinweis.
5. `git push origin HEAD:main` (zusätzlich den Session-Branch pushen, falls vorgegeben).

## Technik
- Reine Vanilla-JS-Single-Page-App. Frontend web/: index.html (dichte Einzeiler-Funktionen), kmap.js (Klassenmappen/Leistungen/Schüler/Sport/Tools), skins.js (Design + angehängte UI-Blöcke S9…S44 mit eigenen `<style>`-Blöcken), material.js, lehrmaterial.js inkl. fahrplan.js, sw.js, shim.js (Offline-Cache/Sync/Login).
- Server server/ (Node 22, SQLite): server.js (Aufpasser/Start), app.js (Server), auftrag.js, podcast.js, aktualisierung.js. `/api/ai` nimmt `{prompt, images}` und liefert JSON. Dateien über `/api/file?path=…`.
- Globale Objekte: U (UI-Zustand), S.settings (Dokumente per `put('settings',{id,…})`), render(), setView(v), Handlertabellen A (data-act, Klick) und C (data-ch, change), groups(), cinfo(slug) (= S.settings['cn_'+slug] mit students, log, kv, ueoff), saveLog(slug, fn), lessonDates(G,null,von,bis), lessonSlots(G,von,bis) (inkl. Ferien mit Namen), holFor(d), syStart(), studentsSorted(G), KM (Exporte kmap.js), UI (Exporte skins.js: UI.tabs/UI.carousel/UI.pane, homeShell, toolsPage, schoolPage …).
- Sport-Leistungen: je Messung (Datum) `it.pts[sid]` = bester Versuch, alle Versuche in `it.vers[sid] = [{v,t,pos}]` (kmap.js `spAttempt`/`spBestSet`/`spHand`); Status Seilklettern in `it.pos`.
- Ferienkalender: Liste `NOE` in index.html (NÖ). **Jedes Schuljahr ergänzen** (inkl. Sommerferien), sonst entstehen falsche Stunden.
- Fallen:
  - Klassenname `tdr` ist von den Tool-Kästchen belegt (To-Do nutzt `tdrow`).
  - id-Attribute an Inputs können beim render() Werte zurücksetzen → data-Attribute verwenden. Datei-Inputs nie mit id.
  - Konstante Funktionen in anderen IIFEs sind nicht sichtbar → über `UI._xyz` exportieren.
  - sticky/overflow:clip beachten. applyDiffs kann in skins.js neu zugewiesen werden.
  - Jedes `<select>` öffnet automatisch das App-Auswahlfenster (#selpick); Optionen mit `hidden` werden dort ausgeblendet.

## Lehrmaterial-Generator (Design ist abgestimmt – nicht ohne ausdrücklichen Wunsch ändern)
- Ablauf: web/lehrmaterial.js („Material erstellen“) → server/auftrag.js (KI-Schritte 1/9…9/9, je Baustein Prompt + JSON-Format + Mock für AI_MOCK) → server/gen/gen.py `build_all` (Word/Excel je Baustein, Liste `jobs`), lib.py (Farben/Schriften/Kopfzeilen), igen.py (Cover, Zeitstrahl, Prozessgrafik), gen_ppt.py (Präsentation).
- Kategorien: „Grundlagen & Methoden“ (epochenübergreifend) + 5 Epochen (lib.py `EPOCHEN`, Farben; Präsentation färbt eine Vorlage je Epoche um).
- Bausteine: Lehrer-Handout (optional, ca. 30 S.), Textblatt, Arbeitsblatt (+Lösung), Lückentext (+Lösung), Kreuzworträtsel (+Lösung), Check-ups Single/Multiple Choice, mündliche Wiederholungen, Präsentation, Cover.
- Kosten: auftrag.js zählt usage je KI-Aufruf (Preistabelle `PREIS`, Web-Suche `AI_SEARCH_USD`), speichert `kosten` in auftrag.json; `/api/auftrag/schaetzung` schätzt aus dem Verlauf. Auswahl `bausteine`/`exporte` kommt aus der App.
- Arbeitsauftrag-Dateien je Thema auf Stunden: `jahresplan.sub[slug].af = {Stundenindex: [{a, f, n}]}`, in Stunden als `log[].af` (lehrmaterial.js `jpAfHtml`/`afRow`).
- Anzahlen je Baustein: `p.anzahl` / `data.anzahl` (Helfer `anz(p,k,standard)`); frühere Ausarbeitungen gehen als `p.vorher` in jeden Prompt (`vorherText`). Prompts testen: `AI_DEBUG=1` schreibt sie ins Server-Log; `AI_MOCK_FAIL=<schritt>` simuliert einen Abbruch.
- Abbruch kostet nichts doppelt: fertige Teile bleiben in `_neu_<id>` (+ `_param.json`, `kosten_bisher`); „Fortsetzen“ (`/api/auftrag/fortsetzen`) überspringt Fertiges (Gliederung, Kapitel, Bausteine mit `has`).
- Podcast: server/podcast.js (Sprachdienst ElevenLabs/OpenAI/Azure, Konfig in DATA_DIR/sprachausgabe.json, Folgen in files/Podcast + folgen.json, öffentlicher Feed nur über geheimen Token-Link `/podcast/<token>/feed.xml`).
- Präsentationsvorlage liegt nur am NAS (Material/Vorlage/praesentation.pptx), nie committen.
- „Baustein ergänzen“ bei schon vorhandenem Baustein erzeugt eine **weitere Version** (auftrag.js `VFELD`, `data.versionen`, gen.py `TSAFE` → Dateiname `…_2`, Lösung `…_2_LOESUNG`); bisherige Dateien bleiben. Nur der Podcast wird ersetzt.
- Bausteine stehen zentral in der Liste `BAUSTEINE` (server/auftrag.js); „Baustein ergänzen“ in der App zeigt sie automatisch an und baut über die Umgebungsvariable `NUR` nur deren Dateien neu (gen.py).
- Neuer Baustein = Eintrag in `BAUSTEINE` (KI-Schritt) in auftrag.js + Mock + neue Funktion in gen.py im Stil der bestehenden (lib.py nutzen) + Eintrag in `jobs`. Bestehende Funktionen/Design dabei nicht verändern. Test lokal mit `AI_MOCK=1` und server/gen/beispiel.json.

## Design-System (verbindlich – neue Teile immer so bauen)
**Farben**
- Geschichte #d99a26 (heller Hintergrund #fdf6e9), Sport #3b5978 (hell #eef3f8), Text #1E293B.
- Grautöne: Nebentext #64748b, blass #94a3b8, Linien #e2e8f0 / #eef1f5, Flächen #f1f5f9 / #f8fafc, Rahmen von Eingaben/Knöpfen #d6dde6.
- Erfolg grün #1f7a3a auf #edf7ee (Rand #86c79a), Fehler rot #b3261e auf #fdecea, Epochenfarben siehe server/gen/lib.py `EPOCHEN` (Grundlagen #4A5A8C, Frühgeschichte #783F04, Antike #F1C232, Mittelalter #38761D, Neuzeit #134F5C, Zeitgeschichte #B41617).

**Knöpfe & Auswahl**
- Knopf = Klasse `btn` (+ `sm`, `good` = grün, `bad` = rot): rechteckig, **border-radius 8px**, nie Pillen-/Kreisform (global skins.js S62). Vorbild: Klassen-Auswahl „5. Klasse …“ (Material → Lehrmaterial erarbeiten).
- Kleine Wahlknöpfe/Chips: `erbsb` (weiß, Rand #d6dde6, 6–8px Radius, aktiv = orange #d99a26 mit weißer Schrift); Filterleisten wie Bibliothek: `matkm` + `matchip` mit Zähler `<small class="matcnt">(n)</small>`, leere = `zero` (blass).
- Umschalter Kacheln/Liste: `<span class="lsseg">` mit zwei `btn sm` (aktiv `good`).
- Kleine Symbolknöpfe (USB, Download ↓, Ordner): `usbbtn` 32×30, Rand #d6dde6, aktiv/erledigt grün `on`. Reihenfolge rechts: … USB, dann Download-Pfeil ganz rechts.
- Plus/Minus: zwei kleine Knöpfe nebeneinander rechts oben im Kästchen (`erbpm`, 21×19).
- Häkchen-Kästchen (Checkbox) 16–17px, `accent-color:#d99a26`.

**Schrift (Handy 390 px Breite ist Maßstab)**
- Seitentitel in Karten (h2) 14,5–16px; Fließtext 13–14px; Nebentext/Meta 11,5–12,5px; Kästchen „Was soll erstellt werden?“: Titel 11px, Unterzeile 9,5px; Chips 10,5–12,5px; Gruppenüberschriften 11,5px fett GROSS mit Trennlinie (`kigrp`).
- Kompakt bauen: wenig Höhe, Zusatzinfos in dieselbe Zeile (z. B. „Anwesenheit kontrolliert“ + „anwesend: 13 / 15“ nebeneinander).

**Bausteine der Oberfläche**
- Seitenkopf wie Klassenmappen: `<section class="dd fg pghd"><div class="ddh"><span class="ddic">SVG_HELM</span><span class="ddt"><b>Geschichte</b><small>Zusatz</small></span><span class="ddn">Anzahl</span></div></section>` (Sport: `fs` + SVG_RUN). Steht direkt unter der Reiterleiste (`setBar`), auf allen Material-Seiten gleiche Höhe.
- Karten: `section.card`; Kartenkopf `.hd` grau innerhalb der Box (kein seitenbreiter Balken; Achtung Kartenklasse `fb` erzeugt sonst einen box-shadow-Balken).
- Aufklappbereiche: `<details>` mit `summary` (Zustand in U.* merken).
- Popups/Fenster: `div.lspop > .lspopb > .lspoph (Titel + Schließen) + .lspopc`; Auswahlfenster `#selpick`/`#sppick` erscheinen automatisch an der Tippstelle (skins.js S48).
- Typ-Symbole vor Dateinamen: farbige Kürzel P (PowerPoint #c43e1c), PDF (#b91c1c), W (Word #2b579a), X (Excel #1d6f42), JPG (#0f766e), ♪ (Audio #7c3aed) – material.js `kiIc`.
- Erledigt-Häkchen nur mit `UI.ck(größe)` (Pinsel-Haken), USB-Symbol `UI.usbIc(größe)`.
- Reiter-Menüs über UI.tabs + UI.carousel (Wischen) im Stil von Home („homewrap“); Material-Unterseiten per Wischen wechseln; Reiter der Unterleiste per langem Drücken + Ziehen sortierbar (gespeichert in settings „setbar“).
- Alle `<select>` öffnen das App-eigene Auswahlfenster.
- Kopfzeile: Zeile 1 Datum links, Icons rechts (Sprechblase = To-Do-Diktat, USB grau/grün, Klassentools, Suche, Einstellungen); Zeile 2 „Offene Stunden (n)“.
