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
- Bausteine stehen zentral in der Liste `BAUSTEINE` (server/auftrag.js); „Baustein ergänzen“ in der App zeigt sie automatisch an und baut über die Umgebungsvariable `NUR` nur deren Dateien neu (gen.py).
- Neuer Baustein = Eintrag in `BAUSTEINE` (KI-Schritt) in auftrag.js + Mock + neue Funktion in gen.py im Stil der bestehenden (lib.py nutzen) + Eintrag in `jobs`. Bestehende Funktionen/Design dabei nicht verändern. Test lokal mit `AI_MOCK=1` und server/gen/beispiel.json.

## Design
- Fachfarben: Geschichte #d99a26, Sport #3b5978, Text #1E293B.
- **Knopf-Form (verbindlich, überall):** rechteckig mit leicht abgerundeten Ecken (border-radius 8px) – wie die Klassen-Auswahl „5. Klasse / 6. Klasse …“ bei Material → Lehrmaterial erarbeiten. Nie Pillen-/Kreisform. Global umgesetzt in skins.js Block S62 (`.btn{border-radius:8px!important}`); neue Knöpfe immer mit Klasse `btn`.
- Grüne „erledigt“-Häkchen immer mit `UI.ck(größe)` (Pinsel-Haken, skins.js S63), nicht mit dem Zeichen ✓.
- Reiter-Menüs über UI.tabs + UI.carousel (Wischen) im Stil von Home („homewrap“).
- Alle Dropdowns öffnen ein App-eigenes Auswahlfenster (Bottom-Sheet).
- Kopfzeile: Zeile 1 Datum links, Icons rechts (Sprechblase = To-Do-Diktat, Klassentools, Suche, Einstellungen); Zeile 2 „Offene Stunden (n)“.
