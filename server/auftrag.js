// Lehrmaterial erarbeiten: KI erzeugt den Inhalt (JSON), Python-Generatoren (server/gen) bauen daraus Word, PowerPoint, Excel usw.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.join(__dir, 'gen');
const EPOCHEN = ['Grundlagen & Methoden', 'Vor- und Frühgeschichte', 'Antike', 'Mittelalter', 'Neuzeit', 'Zeitgeschichte']; // „Grundlagen & Methoden“ = epochenübergreifend (Was ist Geschichte, Quellen, Zeitrechnung …)
const jobs = new Map();
const slug = (s) => String(s || 'Arbeitsauftrag').normalize('NFC').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Arbeitsauftrag';
const yearOf = (m) => { const x = /-?\d{3,4}/.exec(String(m.jahr || m.zeitraum || '')); return x ? +x[0] : 9999; };

export function createAuftrag(ctx) {
  const { FILES_DIR, DATA_DIR, aiKey, AI_MODEL, json, body, bodyBuf, podcast } = ctx;
  const AUF = path.join(FILES_DIR, 'Material', 'Arbeitsauftraege');
  const VORLAGE = path.join(FILES_DIR, 'Material', 'Vorlage', 'praesentation.pptx');
  const PYLIBS = path.join(DATA_DIR, 'pylibs');
  const pyEnv = () => ({ ...process.env, PYTHONPATH: PYLIBS + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : ''), PYTHONDONTWRITEBYTECODE: '1' });

  const py = (args, opt = {}) => new Promise((ok) => {
    const p = spawn('python3', args, { env: pyEnv(), cwd: GEN, ...opt }); let o = '', e = '';
    p.stdout.on('data', (c) => (o += c)); p.stderr.on('data', (c) => (e += c)); p.on('error', (x) => ok({ code: -1, o, e: String(x) })); p.on('close', (code) => ok({ code, o, e }));
  });
  async function ensureLibs(say) {
    const t = await py(['-c', 'import docx,pptx,openpyxl,PIL,lxml']); if (t.code === 0) return;
    say('Einmalige Einrichtung: Bibliotheken werden installiert (dauert 1–3 Minuten) …'); fs.mkdirSync(PYLIBS, { recursive: true });
    const r = await py(['-m', 'pip', 'install', '--break-system-packages', '--no-cache-dir', '--disable-pip-version-check', '--target', PYLIBS, 'python-docx', 'python-pptx', 'openpyxl', 'pillow', 'lxml']);
    if (r.code !== 0) throw new Error('Bibliotheken konnten nicht installiert werden: ' + (r.e || r.o).slice(-300));
  }

  // ---------- Kosten (Anthropic-Listenpreise in US-Dollar pro 1 Mio. Tokens; Web-Suche pro Suchanfrage) ----------
  const PREIS = { 'claude-sonnet-5-5': [2, 10], 'claude-sonnet-5': [2, 10], 'claude-opus-5-5': [4, 20], 'claude-opus-5': [5, 25], 'claude-haiku-5-5': [0.1, 0.5], 'claude-sonnet-4-6': [3, 15], 'claude-opus-4-8': [5, 25] };
  const SUCHE_USD = +process.env.AI_SEARCH_USD || 0.01; // 10 $ pro 1000 Suchen
  const preis = () => PREIS[String(AI_MODEL).replace(/\[.*$/, '')] || [2, 10];
  let acc = null; // Kostenzähler des laufenden Auftrags (es läuft immer nur einer)
  const neuerZaehler = () => ({ usd: 0, ein: 0, aus: 0, suchen: 0, aufrufe: 0, teile: {} });
  function zaehle(section, u) {
    if (!acc || !u) return; const [pi, po] = preis(), ein = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) * 1.25 + (u.cache_read_input_tokens || 0) * 0.1, aus = u.output_tokens || 0, su = (u.server_tool_use && u.server_tool_use.web_search_requests) || 0;
    const usd = (ein * pi + aus * po) / 1e6 + su * SUCHE_USD; acc.usd += usd; acc.ein += Math.round(ein); acc.aus += aus; acc.suchen += su; acc.aufrufe++; acc.teile[section] = (acc.teile[section] || 0) + usd;
  }
  let kurs = { eur: +process.env.EUR_PRO_USD || 0.92, am: 0, quelle: 'Annahme' };
  async function eurKurs() { if (Date.now() - kurs.am < 12 * 3600e3) return kurs.eur; kurs.am = Date.now();
    try { const t = await (await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', { signal: AbortSignal.timeout(8000) })).text(), m = /currency='USD' rate='([\d.]+)'/.exec(t); if (m && +m[1] > 0) kurs = { eur: 1 / +m[1], am: Date.now(), quelle: 'EZB-Referenzkurs' }; } catch { /* Annahme behalten */ }
    return kurs.eur; }
  const rund = (k) => k && Object.assign({}, k, { usd: Math.round(k.usd * 10000) / 10000, teile: Object.fromEntries(Object.entries(k.teile || {}).map(([a, b]) => [a, Math.round(b * 10000) / 10000])) });
  // ---------- KI ----------
  async function aiJson(section, prompt, maxTok, mockArg, web) {
    if (process.env.AI_DEBUG) console.error('--- KI ' + section + ' ---\n' + prompt.slice(0, 6000));
    if (process.env.AI_MOCK && process.env.AI_MOCK_FAIL === section) throw new Error('KI-Antwort nicht lesbar (' + section + ') [Testabbruch]');
    if (process.env.AI_MOCK) { zaehle(section, { input_tokens: web ? 30000 : 4000, output_tokens: 4000, server_tool_use: { web_search_requests: web ? 3 : 0 } }); return mock(section, mockArg); }
    if (!aiKey()) throw new Error('KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).');
    // JSON aus der Antwort lesen: Codeblöcke entfernen, von { bis }, notfalls überzählige Kommas entfernen
    const lies = (txt) => { const t = String(txt || '').replace(/```(?:json)?/gi, ''), a = t.indexOf('{'), b = t.lastIndexOf('}'); if (a < 0 || b <= a) return null; const roh = t.slice(a, b + 1); try { return JSON.parse(roh); } catch { /* reparieren */ } try { return JSON.parse(roh.replace(/,\s*([}\]])/g, '$1')); } catch { return null; } };
    let tok = maxTok || 8000, letzte = '', stop = '';
    for (let i = 0; i < 3; i++) {
      const user = { role: 'user', content: prompt + '\n\nAntworte ausschließlich mit gültigem JSON (kein Text davor oder danach).' }; let inhalt = [], out = null;
      for (let k = 0; k < 4; k++) { // Web-Suche kann mit „pause_turn“ unterbrechen → fortsetzen
        const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': aiKey(), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: AI_MODEL, max_tokens: tok, ...(/claude-(sonnet|opus|haiku)-5/.test(AI_MODEL) ? { output_config: { effort: 'medium' } } : {}), ...(web ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 6 }] } : {}), messages: inhalt.length ? [user, { role: 'assistant', content: inhalt }] : [user] }), signal: AbortSignal.timeout(600000) });
        out = await r.json(); if (!r.ok) throw new Error(out?.error?.message || 'KI-Fehler ' + r.status); zaehle(section, out.usage);
        inhalt = inhalt.concat(out.content || []); if (out.stop_reason !== 'pause_turn') break;
      }
      stop = out.stop_reason || '';
      // bei Web-Suche: nur der Text nach dem letzten Suchergebnis (die Antwort ist dort oft auf mehrere Textblöcke mit Quellenangaben verteilt)
      let ab = 0; inhalt.forEach((c, n) => { if (/tool_result|tool_use/.test(c.type)) ab = n + 1; });
      const txt = inhalt.slice(ab).filter((c) => c.type === 'text' && c.text).map((c) => c.text).join('') || inhalt.filter((c) => c.type === 'text').map((c) => c.text).join('');
      const j = lies(txt); if (j) return j; letzte = txt;
      if (stop === 'max_tokens') tok = Math.min(20000, Math.round(tok * 1.8)); // abgeschnitten → mehr Platz
    }
    try { fs.writeFileSync(path.join(DATA_DIR, 'ki-fehler-' + section + '.txt'), 'stop_reason: ' + stop + '\n\n' + letzte); } catch { /* */ }
    throw new Error('KI-Antwort nicht lesbar (' + section + ')' + (stop === 'max_tokens' ? ' – Antwort war zu lang und wurde abgeschnitten' : '') + '. Details: Datei ki-fehler-' + section + '.txt im Datenordner.');
  }
  function mock(section, arg) {
    const m = JSON.parse(fs.readFileSync(process.env.AI_MOCK, 'utf8'));
    const pick = (k) => (m[k] === undefined ? {} : m[k]);
    if (section === 'plan') return { untertitel: m.untertitel, zeitraum: m.zeitraum, jahr: m.jahr, kurz: m.textblatt.kurz, kapitel: m.textblatt.kapitel.map((k) => k.titel), zeitstrahl: m.zeitstrahl, prozess: m.prozess, prozess_titel: 'Überblick', epochen: m.epochen, glossar: m.textblatt.glossar, quellenliste: m.quellenliste };
    if (section === 'textblatt') return { kapitel: m.textblatt.kapitel.filter((k) => arg.includes(k.titel)) };
    if (section === 'arbeitsblatt') return m.arbeitsblatt;
    if (section === 'luecken') return { text: m.luecken.text, zusatz: m.luecken.zusatz, kreuzwort: m.kreuzwort };
    if (section === 'kreuzwort') return { kreuzwort: m.kreuzwort };
    if (section === 'podcast') return { titel: m.titel || 'Podcast', abschnitte: (m.textblatt.kapitel || []).map((k) => (k.titel || '') + '. ' + (k.absaetze || []).join(' ')) };
    if (section === 'single') return { single: m.checkup.single };
    if (section === 'multiple') return { multiple: m.checkup.multiple };
    if (section === 'wdh') return { wiederholung: m.wiederholung.slice(arg[0], arg[1]) };
    if (section === 'praesentation') return { praesentation: m.praesentation };
    if (section === 'handout_plan') return { ueberblick: m.textblatt.kurz, kapitel: m.textblatt.kapitel.map((k) => k.titel), didaktik: ['Hinweis 1', 'Hinweis 2'], fragen: [{ frage: 'Warum?', antwort: 'Darum.' }], literatur: m.quellenliste || [] };
    if (section === 'handout') return { kapitel: m.textblatt.kapitel.filter((k) => arg.includes(k.titel)) };
    if (section === 'stunden') return { einheiten: Array.from({ length: arg.n }, (_, i) => ({ thema: `${arg.titel}: Stunde ${i + 1}`, inhalt: 'Inhalt der Stunde ' + (i + 1), ziele: 'Die Schüler:innen können …', methoden: 'Lehrervortrag, Partnerarbeit', ph: [{ t: 'Einstieg', m: 10 }, { t: 'Erarbeitung', m: 25 }, { t: 'Sicherung', m: 10 }], ha: i === arg.n - 1 ? 'Wiederholung' : '' })) };
    return pick(section);
  }
  const SYS = 'Du bist erfahrene Lehrkraft für Geschichte und Politische Bildung an einer österreichischen AHS (Sekundarstufe 2). Du erstellst anspruchsvolles, sachlich korrektes Unterrichtsmaterial in sehr gutem Deutsch (österreichische Rechtschreibung mit ss/ß wie üblich). Erfinde keine Quellenzitate: Zitate nur wörtlich aus den gelieferten Quellen oder als „sinngemäß“ gekennzeichnet. Nenne keine Schülerdaten.';
  const WEBTXT = 'recherchiere selbst im Internet mit der Web-Suche, bevorzuge seriöse Quellen wie Fachlexika, Museen, Archive, Bildungsserver, öffentlich-rechtliche Medien und Universitäten; fasse in eigenen Worten zusammen und nenne die genutzten Quellen im Feld quellenliste';
  const src = (p) => { const own = (p.quellen || []).map((q, i) => `QUELLE ${i + 1} (${q.ref || 'ohne Titel'}):\n${String(q.text || '').slice(0, 9000)}`).join('\n\n').slice(0, 45000);
    if (own) return own + (p.quellenmodus === 'web' ? `\n\n(Zusätzlich zu diesen Quellen: ${WEBTXT}. Die gelieferten Quellen haben Vorrang.)` : '');
    return p.quellenmodus === 'web' ? `(keine Quellen vorgegeben: ${WEBTXT})` : '(keine Quellen angegeben: nutze gesichertes Fachwissen und kennzeichne Unsicheres)'; };
  const head = (p) => `${SYS}\nThema: „${p.titel}“. Klassenstufe: ${p.klasse}. Klasse (AHS Oberstufe; Niveau entsprechend). Epoche: ${p.epoche}${p.zeitraum ? ' (' + p.zeitraum + ')' : ''}.${p.notizen ? '\nWünsche der Lehrkraft: ' + p.notizen : ''}\n\nQUELLENMATERIAL:\n${src(p)}\n\n` + (p.vorher ? p.vorher + '\n\n' : '');

  // Bausteine nach dem Textblatt: in dieser Reihenfolge bei „Material erstellen“; einzeln über „Baustein ergänzen“.
  // Neuer Baustein = Eintrag hier (+ Mock + Funktion in gen/gen.py mit gleichem gen-Schlüssel).
  // Kapitel in Zweiergruppen schreiben lassen; klappt eine Gruppe nicht (z. B. Antwort zu lang), jedes Kapitel einzeln
  async function mitRueckfall(run, part) { try { return await run(part); } catch (e) { if (part.length < 2 || !/nicht lesbar/.test(String(e.message))) throw e; const out = { kapitel: [] }; for (const t of part) { const r = await run([t]); (r.kapitel || []).forEach((k) => out.kapitel.push(k)); } return out; } }
  // Anzahl je Baustein aus der App (Plus/Minus), sonst Standardwert
  const anz = (p, k, d) => Math.max(1, Math.min(100, Math.round(+((p.anzahl || {})[k]) || d)));
  const BAUSTEINE = [
    { k: 'handout', n: 'Lehrer-Handout', nr: 3, gen: ['handout'], has: (d) => !!(d.handout && (d.handout.kapitel || []).length && (d.handout.kapitel.length >= (d.handout.gliederung || []).length)),
      run: async (data, p, say, save) => {
        say('Lehrer-Handout: Gliederung …', 3); const web = p.quellenmodus === 'web';
        if (!(data.handout && (data.handout.gliederung || []).length)) {
        const pl = await aiJson('handout_plan', head(p) + `Plane ein LEHRER-HANDOUT zu diesem Thema: Hintergrundwissen nur für die Lehrkraft zum Einlesen, ca. ${anz(p, 'handout', 30)} Seiten, fachlich anspruchsvoll auf Niveau Lehramtsstudium, deutlich tiefer und detaillierter als ein Schüler-Textblatt (Forschungsstand, Deutungen und Kontroversen, Ursachen und Zusammenhänge, Zahlen, Personen, Begriffe, Gegenwartsbezüge). Antworte als JSON: {"ueberblick":["6–8 Kernaussagen in je 1–2 Sätzen"],"kapitel":["genau ${Math.max(4, Math.round(anz(p, 'handout', 30) / 3))} Kapitelüberschriften in sinnvoller Reihenfolge"],"didaktik":["6–8 Hinweise für den Unterricht: Schülervorstellungen und typische Fehlvorstellungen, gute Einstiege, Gegenwartsbezüge, Stolpersteine"],"fragen":[{"frage":"typische Schülerfrage","antwort":"fundierte Antwort in 2–4 Sätzen"}] (8 Fragen),"literatur":["6–10 seriöse Fachliteratur- und Quellenangaben"]}`, 8000, undefined, web);
        data.handout = { ueberblick: pl.ueberblick || [], kapitel: [], didaktik: pl.didaktik || [], fragen: pl.fragen || [], literatur: pl.literatur || [], gliederung: pl.kapitel || [] }; save();
        }
        const titles = data.handout.gliederung, fertig = () => new Set(data.handout.kapitel.map((k) => k.titel));
        for (let i = 0; i < titles.length; i += 2) {
          const part0 = titles.slice(i, i + 2).filter((t) => !fertig().has(t)); if (!part0.length) continue; say(`Lehrer-Handout: Kapitel ${i + 1}–${Math.min(i + 2, titles.length)} von ${titles.length} …`, 3);
          const r = await mitRueckfall((part) => aiJson('handout', head(p) + `LEHRER-HANDOUT (Hintergrundwissen für die Lehrkraft, Niveau Lehramtsstudium). Gesamtgliederung: ${JSON.stringify(titles)}.\nSchreibe NUR die Kapitel ${JSON.stringify(part)} ausführlich als JSON: {"kapitel":[{"titel":"unverändert","absaetze":["5–7 Absätze, je 150–220 Wörter: fachlich präzise, mit Forschungsstand, Fachbegriffen, Daten, Zusammenhängen, unterschiedlichen Deutungen"],"boxen":[{"typ":"forschung|kontroverse|didaktik|quelle|zahl|merke","titel":"bei quelle: Autor, Werk, Jahr; sonst kurzer Titel","text":"..."}] (2–3 Boxen),"personen":[{"name":"","lebensdaten":"","rolle":"","text":"3–4 Sätze Bedeutung"}] (nur wenn wichtig)}]}. Das ganze Handout hat etwa ${anz(p, 'handout', 30)} Seiten – schreibe hier nur diese Kapitel in der angegebenen Länge.`, 16000, part, web), part0);
          (r.kapitel || []).forEach((k) => data.handout.kapitel.push(k)); save();
        }
      } },
    { k: 'arbeitsblatt', n: 'Arbeitsblatt (mit Lösung)', nr: 3, gen: ['arbeitsblatt'], has: (d) => !!(d.arbeitsblatt && (d.arbeitsblatt.aufgaben || []).length),
      run: async (data, p, say, save) => { say('3/9 Arbeitsblatt …', 3); const ab = await aiJson('arbeitsblatt', head(p) + `Erstelle das Arbeitsblatt „Offene Fragen“ (ohne Punkte, keine Testoptik) als JSON: {"aufgaben":[genau ${anz(p, 'arbeitsblatt', 8)} Aufgaben]}. Jede Aufgabe: {"titel":"","afb":"AFB I|II|III · Operator","einleitung":"optional","quelle":{"label":"Autor/Werk/Jahr","text":"kurzer Quellenauszug AUS DEN QUELLEN"} optional,"typ":"frei|tabelle|skizze","tabelle":{"spalten":["Kriterium","A","B"],"zeilen":[["Kriterium","Lösung A","Lösung B"]]} nur bei typ tabelle,"teile":[{"text":"Arbeitsauftrag mit Operator","erwartung":"Erwartungshorizont (Stichpunkte, ohne Punkte)","zeilen":3–6}]}. ${anz(p, 'arbeitsblatt', 8) === 8 ? `Aufgabe 1–2: Wiedergeben, 3–5: Erklären/Vergleichen (eine mit Quelle, eine Tabelle), 6: Beurteilen mit Klassenbezug ('Notiere, welcher Standpunkt unserer Diskussion vom ______ (Datum) am stärksten war'), 7: Transfer mit selbst erlebtem Beispiel der letzten 7 Tage, 8: typ skizze (Mindmap/Zeitstrahl).` : `Reihenfolge: zuerst Wiedergeben, dann Erklären/Vergleichen (eine mit Quelle, eine Tabelle), dann Beurteilen mit Klassenbezug ('Notiere, welcher Standpunkt unserer Diskussion vom ______ (Datum) am stärksten war'), dann Transfer mit selbst erlebtem Beispiel der letzten 7 Tage, zuletzt eine Aufgabe typ skizze (Mindmap/Zeitstrahl); verteile das passend auf die Anzahl.`} Gestalte die Aufgaben so, dass sie ohne den Unterricht und das Textblatt nicht von einer KI gelöst werden können (Bezug auf Blatt-Quelle, Unterrichtsdiskussion, eigenes Beispiel, Skizze).`, 8000); data.arbeitsblatt = ab; save(); } },
    { k: 'luecken', n: 'Lückentext (mit Lösung)', nr: 4, gen: ['luecken'], has: (d) => !!(d.luecken && d.luecken.text),
      run: async (data, p, say, save) => { say('4/9 Lückentext …', 4); const lk = await aiJson('luecken', head(p) + `Erstelle als JSON: {"text":"zusammenhängender Lückentext, mindestens ${Math.max(300, anz(p, 'luecken', 38) * 16)} Wörter, gegliedert mit **Zwischenüberschrift.** (fett mit zwei Sternchen, endet mit Punkt) vor jedem Abschnitt; etwa ${anz(p, 'luecken', 38)} Lücken, jede Lücke als {Wort} mitten im Satz, nur sinnvolle Fachbegriffe","zusatz":["4 Wörter, die NICHT in den Text passen, aber plausibel wirken"]}`, 8000);
        data.luecken = { text: lk.text, zusatz: lk.zusatz || [] }; save(); } },
    { k: 'kreuzwort', n: 'Kreuzworträtsel (mit Lösung)', nr: 4, gen: ['kreuzwort'], has: (d) => !!(d.kreuzwort || []).length,
      run: async (data, p, say, save) => { say('4/9 Kreuzworträtsel …', 4); const kw = await aiJson('kreuzwort', head(p) + `Erstelle als JSON: {"kreuzwort":[{"wort":"EIN Wort 4–12 Buchstaben ohne Leerzeichen","hinweis":"präzise Frage/Umschreibung"}] (genau ${anz(p, 'kreuzwort', 16)} Begriffe aus dem Thema)}`, 6000);
        data.kreuzwort = kw.kreuzwort || []; save(); } },
    { k: 'single', n: 'Check-up Single Choice', nr: 5, gen: ['checkup'], has: (d) => !!(d.checkup && (d.checkup.single || []).length),
      run: async (data, p, say, save) => { say(`5/9 Check-up Single Choice (${anz(p, 'single', 20)} Fragen) …`, 5); const sc = await aiJson('single', head(p) + `Erstelle ${anz(p, 'single', 20)} Single-Choice-Fragen als JSON: {"single":[{"frage":"max. 120 Zeichen","antworten":["4 Antworten, je max. 75 Zeichen"],"richtig":0 bis 3 (Index, gleichmäßig verteilen)}]}. Anspruchsvoll, eindeutig, plausible Distraktoren, quer durchs Thema.`, 7000); data.checkup = Object.assign({}, data.checkup, { single: sc.single || [] }); save(); } },
    { k: 'multiple', n: 'Check-up Multiple Choice', nr: 6, gen: ['checkup'], has: (d) => !!(d.checkup && (d.checkup.multiple || []).length),
      run: async (data, p, say, save) => { say(`6/9 Check-up Multiple Choice (${anz(p, 'multiple', 20)} Fragen) …`, 6); const mc = await aiJson('multiple', head(p) + `Erstelle ${anz(p, 'multiple', 20)} Multiple-Choice-Fragen (2 oder 3 richtige Antworten von 4) als JSON: {"multiple":[{"frage":"max. 120 Zeichen","antworten":["4 Antworten, je max. 75 Zeichen"],"richtig":[Indizes 0–3]}]}. Andere Fragen als bei Single Choice.`, 7000); data.checkup = Object.assign({}, data.checkup, { multiple: mc.multiple || [] }); save(); } },
    { k: 'wdh', n: 'Mündliche Wiederholungen', nr: 7, gen: ['wiederholung'], has: (d) => !!(d.wiederholung || []).length,
      run: async (data, p, say, save) => { data.wiederholung = [];
        const nW = anz(p, 'wdh', 20), teile = []; for (let a = 0; a < nW; a += 10) teile.push([a, Math.min(nW, a + 10)]);
        for (const [a, b] of teile) {
          say(`7/9 Mündliche Wiederholungen ${a + 1}–${b} von ${nW} …`, 7);
          const w = await aiJson('wdh', head(p) + `Erstelle ${b - a} mündliche Stundenwiederholungen (je max. 5 Minuten) als JSON: {"wiederholung":[{"titel":"Teilthema","fragen":[{"frage":"in 1–2 Sätzen beantwortbar","antwort":"Musterantwort in 1–2 Sätzen","kriterien":["1 oder 2 prüfbare Kriterien, je 1 Punkt"]}] (genau 4 Fragen)}]}. Reihenfolge der Teilthemen chronologisch ab Wiederholung ${a + 1} von ${nW}, die zusammen das ganze Thema abdecken.`, 7000, [a, b]); (w.wiederholung || []).forEach((x) => data.wiederholung.push(x)); save();
        } } },
    { k: 'praesentation', n: 'Präsentation', nr: 8, gen: ['praesentation'], has: (d) => !!(d.praesentation && (d.praesentation.folien || []).length),
      run: async (data, p, say, save) => { const nF = anz(p, 'praesentation', p.folien === 'kurz' ? 15 : p.folien === 'ausfuehrlich' ? 40 : 25); say('8/9 Präsentation planen …', 8); const pr = await aiJson('praesentation', head(p) + `Plane die Präsentation mit ca. ${nF} Folien (insgesamt, ohne Titel-, Video-, Aufgaben- und Quellenfolie) als JSON: {"praesentation":{"titeljahr":"Jahreszahl für die Titelfolie","folien":[ ... ]}}. Folientypen: {"typ":"divider","titel":""} (Kapitelfolie), {"typ":"text","titel":"","untertitel":"","bloecke":[{"lead":"fett","text":"1–2 Sätze, max. 35 Wörter"}] (2–3 Blöcke),"bild":"illus oder person:Name oder zeit oder steps oder null","notizen":"Sprechtext"}, {"typ":"person","titel":"Name","untertitel":"Rolle","personen":[{"name":"","lebensdaten":"","rolle":""}],"bloecke":[{"lead":"","text":""}]}, {"typ":"zeitstrahl","titel":"Zeitstrahl","untertitel":""}. Die Folien sind KEIN Duplikat des Textblatts: Überblick, Zusammenhänge, Personen, Gegenüberstellungen (Vorteile/Nachteile), Impulse und Diskussionsfragen. Setze Divider zur Gliederung ein.`, 8000); data.praesentation = pr.praesentation || {}; save(); } },
    { k: 'podcast', n: 'Podcast zum Anhören', nr: 9, gen: [], has: (d) => !!(d.podcast && d.podcast.datei),
      run: async (data, p, say, save) => {
        const min = anz(p, 'podcast', 25), basis = data.handout && (data.handout.kapitel || []).length ? data.handout : data.textblatt || {};
        const stoff = (basis.kapitel || []).map((k) => (k.titel || '') + ': ' + (k.absaetze || []).join(' ')).join('\n\n').slice(0, 60000);
        say('Podcast: Skript wird geschrieben …', 9);
        const r = await aiJson('podcast', head(p) + `Schreibe ein PODCAST-SKRIPT zum Anhören (z. B. beim Autofahren) für die Lehrkraft, damit sie sich in das Thema einliest. Länge: ca. ${min} Minuten gesprochen (etwa ${min * 130} Wörter). Ein Sprecher, gesprochene Sprache, lebendig erzählt, klar gegliedert mit kurzen Überleitungen, Jahreszahlen und Zahlen so formuliert, dass sie vorgelesen gut klingen, keine Aufzählungszeichen, keine Tabellen, keine Klammern. Beginne mit „${p.themaNr || data.themaNr ? 'Thema ' + (p.themaNr || data.themaNr) + ': ' : ''}${data.titel}“ und einem kurzen Überblick, ende mit einer Zusammenfassung der wichtigsten Punkte. Grundlage ist dieses Material:\n${stoff}\n\nAntworte als JSON: {"titel":"Folgentitel","abschnitte":["Absätze des gesprochenen Textes"]}`, 16000);
        const text = (r.abschnitte || []).join('\n\n'), dir = data._dir; data.podcast = { titel: r.titel || data.titel, minuten: min, woerter: text.split(/\s+/).length }; save();
        const T = String(data.titel || 'Thema').replace(/[^A-Za-z0-9ÄÖÜäöüß_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
        if (dir) fs.writeFileSync(path.join(dir, `09_Podcast-Skript_${T}.txt`), (r.titel || data.titel) + '\n\n' + text);
        if (!podcast || !podcast.eingerichtet()) { data.podcast.hinweis = 'Nur Skript – Sprachausgabe nicht eingerichtet'; save(); throw Object.assign(new Error('Podcast-Skript gespeichert. Für die Audiodatei: Einstellungen → Podcast & Sprachausgabe einrichten, dann „Podcast“ erneut ergänzen.'), { weich: true }); }
        const mp3 = path.join(dir, `09_Podcast_${T}.mp3`), t = await podcast.tts(text, mp3, (m) => say(m, 9));
        if (acc) { acc.usd += t.usd; acc.teile.tts = (acc.teile.tts || 0) + t.usd; }
        const nr = p.themaNr || data.themaNr || 0, kl = +data.klasse || 0;
        data.podcast.datei = podcast.aufnehmen(mp3, { id: data.id, dateiname: `${kl}.${String(nr || 0).padStart(2, '0')} ${data.titel}`, titel: `${kl}. Klasse · ${nr ? String(nr).padStart(2, '0') + ' ' : ''}${data.titel}`, text: data.untertitel || '', epoche: data.epoche, klasse: kl, nr, dauer: (data.podcast.woerter / 130) * 60 });
        data.podcast.zeichen = t.zeichen; save();
      } },
  ];
  // Frühere Ausarbeitungen (gleiches Thema ausführlich, gleiche Epoche kurz) – die KI soll andere Schwerpunkte wählen
  const nrmT = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();
  function vorherText(p) {
    const all = scan().map((x) => x.m), same = all.filter((m) => (p.thema && m.thema === p.thema) || nrmT(m.titel) === nrmT(p.titel)), ep = all.filter((m) => !same.includes(m) && m.epoche === p.epoche);
    if (!same.length && !ep.length) return '';
    const pers = (m) => [...new Set([...((m.textblatt || {}).kapitel || []), ...((m.handout || {}).kapitel || [])].flatMap((k) => (k.personen || []).map((x) => x.name)).filter(Boolean))];
    const kap = (m) => ((m.textblatt || {}).kapitel || []).map((k) => k.titel).filter(Boolean);
    const beg = (m) => ((m.textblatt || {}).glossar || []).map((g) => g.begriff).filter(Boolean);
    let t = 'WICHTIG – BEREITS FRÜHER AUSGEARBEITET (nicht wiederholen):';
    same.forEach((m, i) => { t += `\nFrühere Ausarbeitung ${i + 1} dieses Themas „${m.titel}“${m.untertitel ? ' (' + m.untertitel + ')' : ''}: Kapitel: ${kap(m).join('; ')}. Personen: ${pers(m).join(', ') || '–'}. Begriffe: ${beg(m).join(', ') || '–'}.`; });
    if (ep.length) t += `\nIn anderen Arbeitsaufträgen derselben Epoche schon ausführlich behandelt: ${[...new Set(ep.flatMap((m) => [m.titel, ...pers(m)]))].join(', ')}.`;
    t += '\nWähle deshalb deutlich andere Schwerpunkte, Teilaspekte, Personen, Beispiele und Quellen. Bereits Behandeltes höchstens kurz als Bezug erwähnen, nicht erneut ausführen. Ziel: möglichst wenig Überschneidung.';
    return t.slice(0, 4000);
  }
  // alt = { dir, data } beim Fortsetzen eines abgebrochenen Auftrags: fertige Teile werden übersprungen (nicht noch einmal bezahlt)
  async function erstelle(job, p, alt) {
    if (p.neu !== false && !alt) p.vorher = vorherText(p);
    const say = (m, step) => { job.msg = m; if (step) job.step = step; }; job.total = 9;
    const dir = alt ? alt.dir : path.join(AUF, `${p.klasse}. Klasse`, '_neu_' + job.id); fs.mkdirSync(dir, { recursive: true }); job.dir = dir;
    fs.writeFileSync(path.join(dir, '_param.json'), JSON.stringify(p)); // für „Fortsetzen“ nach einem Abbruch
    acc = neuerZaehler(); job.kosten = acc; if (alt && alt.data.kosten_bisher) acc.usd += alt.data.kosten_bisher;
    const data = alt ? alt.data : { exporte: p.exporte, titel: p.titel, klasse: p.klasse, epoche: p.epoche, zeitraum: p.zeitraum || '', jahr: p.jahr || '', id: job.id, erstellt: Date.now(), anzahl: p.anzahl, optionen: { seiten: p.seiten, folien: p.folien, notizen: p.notizen || '', quellenmodus: p.quellenmodus } };
    const save = () => fs.writeFileSync(path.join(dir, 'auftrag.json'), JSON.stringify(data, null, 1)); job.data = data;
    const kap = Math.max(4, Math.min(20, Math.round(p.seiten * 0.6 + 2)));
    say('Bibliotheken prüfen …', 0); await ensureLibs((m) => say(m)); save();
    if (!(data.textblatt && (data.textblatt.gliederung || []).length)) {
    say('1/9 Gliederung, Zeitstrahl und Epochenübersicht …', 1);
    const plan = await aiJson('plan', head(p) + `Erstelle einen Plan als JSON: {"untertitel":"kurzer Untertitel","zeitraum":"z. B. 1450–1517","jahr":"Jahreszahl als Zahl (Beginn)","kurz":["4–6 Stichpunkte 'Das Wichtigste in Kürze'"],"kapitel":["genau ${kap} Kapitelüberschriften in sinnvoller Reihenfolge"],"zeitstrahl":[{"jahr":1450,"text":"max. 5 Wörter"}] (6 Einträge),"prozess":[{"titel":"max. 3 Wörter","text":"max. 6 Wörter"}] (4–5 Schritte oder Phasen),"prozess_titel":"Überschrift der Grafik","epochen":[{"epoche":"Vor- und Frühgeschichte|Antike|Mittelalter|Neuzeit|Zeitgeschichte","ereignisse":[{"text":"max. 4 Wörter","jahr":"Jahr/Zeitraum","seite":1 oder -1,"hervorheben":true nur beim Thema selbst}]}] (für ALLE fünf Epochen je 2–3 abwechslungsreiche Ereignisse oder Persönlichkeiten, in der Epoche des Themas auch das Thema selbst),"glossar":[{"begriff":"","text":"kurz"}] (8 Einträge),"quellenliste":["3–5 seriöse Literatur-/Quellenangaben; bei gelieferten Quellen deren Titel"]}`, 8000, undefined, p.quellenmodus === 'web');
    Object.assign(data, { untertitel: plan.untertitel || '', zeitraum: p.zeitraum || plan.zeitraum || '', jahr: p.jahr || plan.jahr || '', zeitstrahl: plan.zeitstrahl, prozess: plan.prozess, prozess_titel: plan.prozess_titel, epochen: plan.epochen, quellenliste: [...(plan.quellenliste || []), ...(p.quellen || []).map((q) => q.ref).filter(Boolean)] });
    data.textblatt = { kurz: plan.kurz || [], kapitel: [], glossar: plan.glossar || [], gliederung: plan.kapitel || [] }; save();
    }
    const titles = data.textblatt.gliederung, fertig = () => new Set(data.textblatt.kapitel.map((k) => k.titel));
    for (let i = 0; i < titles.length; i += 2) {
      const part0 = titles.slice(i, i + 2).filter((t) => !fertig().has(t)); if (!part0.length) continue; say(`2/9 Textblatt: Kapitel ${i + 1}–${Math.min(i + 2, titles.length)} von ${titles.length} …`, 2);
      const r = await mitRueckfall((part) => aiJson('textblatt', head(p) + `Gesamtgliederung des Textblatts: ${JSON.stringify(titles)}.\nSchreibe NUR die Kapitel ${JSON.stringify(part)} ausführlich als JSON: {"kapitel":[{"titel":"unverändert","absaetze":["3–4 Absätze, je 100–140 Wörter, Fließtext für Schüler/innen, präzise, mit Fachbegriffen"],"boxen":[{"typ":"merke|begriff|quelle|zahl|nachdenken","titel":"nur bei quelle: Autor, Werk, Jahr","text":"..."}] (2–3 Boxen, darunter mindestens eine 'merke'),"personen":[{"name":"","lebensdaten":"","rolle":"","text":"2–3 Sätze Bedeutung"}] (nur wenn wichtige Personen vorkommen; insgesamt im Textblatt mindestens 5 verschiedene)}]}. Das ganze Textblatt hat etwa ${p.seiten} Seiten – schreibe hier nur diese Kapitel in der angegebenen Länge.`, 12000, part, p.quellenmodus === 'web'), part0);
      (r.kapitel || []).forEach((k) => data.textblatt.kapitel.push(k)); save();
    }
    Object.defineProperty(data, '_dir', { value: dir, enumerable: false, writable: true });
    for (const B of BAUSTEINE) if ((!p.bausteine || p.bausteine.includes(B.k)) && !(alt && B.has(data))) { try { await B.run(data, p, say, save); } catch (e) { if (!e.weich) throw e; job.warn = (job.warn ? job.warn + ' ' : '') + e.message; } }
    data.textblatt.kapitel.sort((a, b) => titles.indexOf(a.titel) - titles.indexOf(b.titel)); delete data.kosten_bisher; delete data.abbruch; try { fs.unlinkSync(path.join(dir, '_param.json')); } catch { /* */ }
    data.kosten = rund(acc); data.thema = p.thema || ''; if (p.themaNr) data.themaNr = p.themaNr; save(); acc = null;
    say('9/9 Dokumente werden erzeugt …', 9); await generiere(job, dir, null, !!(p.bausteine && !p.bausteine.includes('praesentation'))); const fin = path.join(path.dirname(dir), 'zz ' + slug(p.titel) + ' ' + job.id); fs.renameSync(dir, fin); job.dir = fin; renumber(); job.state = 'fertig'; say('Fertig.');
  }
  // Baustein nachträglich: nur dieser KI-Schritt, Grundlage ist das vorhandene Textblatt; nur seine Dateien werden neu gebaut
  async function ergaenze(job, x, B, hint) {
    const say = (m) => { job.msg = m; }, data = x.m, o = data.optionen || {};
    const tb = data.textblatt || {}, text = [(tb.kurz || []).join('\n'), ...(tb.kapitel || []).map((k) => (k.titel || '') + '\n' + (k.absaetze || []).join('\n') + '\n' + (k.boxen || []).map((b) => b.text || '').join('\n'))].join('\n\n');
    const p = { titel: data.titel, klasse: data.klasse, epoche: data.epoche, zeitraum: data.zeitraum || '', seiten: o.seiten || 10, folien: o.folien || 'mittel', anzahl: Object.assign({}, data.anzahl || {}), notizen: [o.notizen, hint].filter(Boolean).join(' · '), quellenmodus: 'eigen', quellen: text.trim() ? [{ ref: 'Textblatt dieses Arbeitsauftrags', text: text.slice(0, 40000) }] : [] };
    if (!p.quellen.length) p.quellenmodus = 'wissen';
    const save = () => fs.writeFileSync(path.join(x.dir, 'auftrag.json'), JSON.stringify(data, null, 1));
    say('Bibliotheken prüfen …'); await ensureLibs(say);
    acc = neuerZaehler(); job.kosten = acc;
    Object.defineProperty(data, '_dir', { value: x.dir, enumerable: false, writable: true });
    try { await B.run(data, p, (m) => say(m.replace(/^\d\/9 /, '')), save); } catch (e) { if (!e.weich) throw e; job.warn = e.message; } finally { const k = rund(acc); acc = null; data.kosten_ergaenzt = (data.kosten_ergaenzt || []).concat([{ k: B.k, usd: k.usd, am: Date.now() }]); save(); }
    say('Dokumente werden erzeugt …'); await generiere(job, x.dir, B.gen); job.state = 'fertig'; say('Fertig: ' + B.n + ' ergänzt.');
  }
  async function generiere(job, dir, nur, ohnePraes) {
    if (nur && !nur.length) return; // Baustein ohne Word-Dateien (z. B. Podcast)
    const cc = path.join(dir, 'cover_custom.png'); void cc;
    const args = ['gen.py', path.join(dir, 'auftrag.json'), dir]; if (fs.existsSync(VORLAGE)) args.push(VORLAGE);
    const r = await py(args, nur ? { env: { ...pyEnv(), NUR: nur.join(',') } } : {}); if (r.code !== 0) throw new Error('Dokumente konnten nicht erzeugt werden: ' + (r.e || r.o).slice(-400));
    if (r.e && /FEHLER/.test(r.e) && job) job.warn = r.e.slice(-400);
    if (!fs.existsSync(VORLAGE) && job && !ohnePraes && (!nur || nur.includes('praesentation'))) job.warn = (job.warn ? job.warn + ' ' : '') + 'Hinweis: Keine Präsentationsvorlage hochgeladen (Material/Vorlage/praesentation.pptx), daher ohne Präsentation.';
  }
  // Abbruch: fertige Teile und bisherige Kosten bleiben gespeichert → „Fortsetzen“ zahlt nur den Rest
  function abbruch(job, e) {
    const k = acc ? acc.usd : 0; acc = null; job.state = 'fehler';
    try { if (job.data && job.dir && fs.existsSync(job.dir)) { job.data.kosten_bisher = k; job.data.abbruch = { fehler: String(e && e.message || e), am: Date.now() }; fs.writeFileSync(path.join(job.dir, 'auftrag.json'), JSON.stringify(job.data, null, 1)); } } catch { /* */ }
    job.msg = String(e && e.message || e) + ' – Bereits Fertiges ist gespeichert: unten bei „Abgebrochene Aufträge“ auf „Fortsetzen“ tippen, dann wird nur der Rest erstellt.';
  }
  function abgebrochen() {
    const out = []; if (!fs.existsSync(AUF)) return out; const laeuft = new Set([...jobs.values()].filter((j) => j.state === 'laeuft').map((j) => j.dir));
    for (const k of fs.readdirSync(AUF)) { const kd = path.join(AUF, k); if (!fs.statSync(kd).isDirectory()) continue;
      for (const a of fs.readdirSync(kd)) { const ad = path.join(kd, a); if (!a.startsWith('_neu_') || laeuft.has(ad) || !fs.existsSync(path.join(ad, '_param.json'))) continue;
        try { const m = JSON.parse(fs.readFileSync(path.join(ad, 'auftrag.json'), 'utf8')), tb = m.textblatt || {}; out.push({ id: m.id, titel: m.titel, klasse: m.klasse, fehler: (m.abbruch || {}).fehler || 'unterbrochen (z. B. Neustart)', usd: m.kosten_bisher || 0, fertig: `Textblatt ${(tb.kapitel || []).length}/${(tb.gliederung || []).length || '?'} Kapitel` + BAUSTEINE.filter((B) => B.has(m)).map((B) => ', ' + B.n).join('') }); } catch { /* */ } } }
    return out;
  }
  const findAbgebrochen = (id) => { if (!fs.existsSync(AUF)) return null; for (const k of fs.readdirSync(AUF)) { const ad = path.join(AUF, k, '_neu_' + String(id).replace(/[^\w]/g, '')); if (fs.existsSync(path.join(ad, '_param.json'))) return ad; } return null; };
  function scan() {
    const out = []; if (!fs.existsSync(AUF)) return out;
    for (const k of fs.readdirSync(AUF)) { const kd = path.join(AUF, k); if (!fs.statSync(kd).isDirectory()) continue;
      for (const a of fs.readdirSync(kd)) { if (a.startsWith('_neu_')) continue; const ad = path.join(kd, a), jf = path.join(ad, 'auftrag.json'); if (!fs.existsSync(jf)) continue; try { const m = JSON.parse(fs.readFileSync(jf, 'utf8')); out.push({ dir: ad, kdir: kd, m }); } catch { /* */ } } }
    return out;
  }
  // Ordnernummern: Aufträge mit Themennummer aus der Jahresplanung tragen diese Nummer, die übrigen folgen danach (nach Epoche/Jahr)
  function renumber() {
    const all = scan(), byK = new Map();
    all.forEach((x) => { const k = x.kdir; if (!byK.has(k)) byK.set(k, []); byK.get(k).push(x); });
    for (const [kd, list] of byK) {
      list.sort((a, b) => (a.m.themaNr || 999) - (b.m.themaNr || 999) || EPOCHEN.indexOf(a.m.epoche) - EPOCHEN.indexOf(b.m.epoche) || yearOf(a.m) - yearOf(b.m) || String(a.m.titel).localeCompare(String(b.m.titel), 'de'));
      const tmp = list.map((x, i) => { const t = path.join(kd, '__t' + i); fs.renameSync(x.dir, t); return t; });
      let next = Math.max(0, ...list.map((x) => x.m.themaNr || 0)) + 1; const used = new Set();
      list.forEach((x, i) => { const nn = String(x.m.themaNr || next++).padStart(2, '0'); let name = `${nn} ${slug(x.m.titel)}`, q = 2; while (used.has(name)) name = `${nn} ${slug(x.m.titel)} (${q++})`; used.add(name); fs.renameSync(tmp[i], path.join(kd, name)); });
    }
  }
  function listing() {
    return scan().map((x) => { const nr = /^(\d+)\s/.exec(path.basename(x.dir)); const rel = path.relative(FILES_DIR, x.dir).split(path.sep).join('/');
      const files = []; const walk = (d, pre) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('_') || e.name === 'auftrag.json' || e.name.startsWith('cover_custom')) continue; if (e.isDirectory()) walk(path.join(d, e.name), pre + e.name + '/'); else files.push(pre + e.name); } }; walk(x.dir, '');
      files.sort((a, b) => (/^\d/.test(a) === /^\d/.test(b) ? a.localeCompare(b, 'de') : /^\d/.test(a) ? -1 : 1));
      return { bs: BAUSTEINE.map((B) => ({ k: B.k, n: B.n, has: B.has(x.m) })), usd: x.m.kosten ? x.m.kosten.usd + (x.m.kosten_ergaenzt || []).reduce((a, b) => a + (b.usd || 0), 0) : null, thema: x.m.thema || '', id: x.m.id, titel: x.m.titel, klasse: x.m.klasse, epoche: x.m.epoche, jahr: x.m.jahr, nr: nr ? nr[1] : '', dir: rel, files, cover: files.find((f) => /^Cover_.*\.jpg$/.test(f)) || '' };
    }).sort((a, b) => String(a.klasse).localeCompare(String(b.klasse)) || String(a.nr).localeCompare(String(b.nr)));
  }
  const findById = (id) => scan().find((x) => String(x.m.id) === String(id));
  // Infos zur Podcast-Folge aus dem Arbeitsauftrag: Cover, Zusammenfassung, Kapitel, Personen, Begriffe (für Shownotes und Suche)
  if (podcast) podcast.setInfo((id) => { const x = findById(id); if (!x) return null; const m = x.m, c = fs.readdirSync(x.dir).find((f) => /^Cover_.*\.jpg$/.test(f)), tb = m.textblatt || {}, ho = m.handout || {};
    const kap = (tb.kapitel || []).concat(ho.kapitel || []);
    return { cover: c ? path.join(x.dir, c) : null, untertitel: m.untertitel || '', kurz: tb.kurz || ho.ueberblick || [], kapitel: (tb.kapitel || []).map((k) => k.titel).filter(Boolean), personen: [...new Set(kap.flatMap((k) => (k.personen || []).map((p) => p.name)).filter(Boolean))], begriffe: (tb.glossar || []).map((g) => g.begriff).filter(Boolean) }; });

  const handle = async function (req, res, url) {
    const p = url.pathname;
    if (p === '/api/auftraege' && req.method === 'GET') return json(res, 200, { abgebrochen: abgebrochen(), laeuft: (() => { const j = [...jobs.entries()].find(([, v]) => v.state === 'laeuft'); return j ? { id: j[0], state: 'laeuft', msg: j[1].msg, step: j[1].step, total: j[1].total, titel: j[1].titel } : null; })(), eurProUsd: await eurKurs(), kursQuelle: kurs.quelle, items: listing(), vorlage: fs.existsSync(VORLAGE), ai: !!aiKey() || !!process.env.AI_MOCK }), true;
    if (p === '/api/auftrag/erstellen' && req.method === 'POST') {
      const q = JSON.parse((await body(req)) || '{}'); if (!q.titel || !EPOCHEN.includes(q.epoche)) return json(res, 400, { error: 'Bitte Thema und Epoche angeben.' }), true;
      if (!aiKey() && !process.env.AI_MOCK) return json(res, 501, { error: 'KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' }), true;
      if ([...jobs.values()].some((j) => j.state === 'laeuft')) return json(res, 409, { error: 'Es läuft bereits eine Erstellung. Bitte warten.' }), true;
      const id = Date.now().toString(36), job = { id, state: 'laeuft', msg: 'Start …', step: 0, total: 9, titel: q.titel }; jobs.set(id, job);
      const prm = { titel: String(q.titel).slice(0, 120), klasse: [5, 6, 7, 8].includes(+q.klasse) ? +q.klasse : 6, epoche: q.epoche, zeitraum: String(q.zeitraum || '').slice(0, 60), jahr: String(q.jahr || '').slice(0, 10), quellenmodus: ['web', 'wissen', 'eigen'].includes(q.quellenmodus) ? q.quellenmodus : 'web', bausteine: Array.isArray(q.bausteine) ? q.bausteine.filter((k) => BAUSTEINE.some((b) => b.k === k)) : null, exporte: q.exporte && typeof q.exporte === 'object' ? { kahoot: q.exporte.kahoot !== false, plickers: q.exporte.plickers !== false, forms: q.exporte.forms !== false } : undefined, thema: String(q.thema || '').slice(0, 80), themaNr: Math.max(0, Math.min(99, parseInt(q.themaNr) || 0)), seiten: Math.max(3, Math.min(40, Math.round(+q.seiten) || 10)), anzahl: q.anzahl && typeof q.anzahl === 'object' ? Object.fromEntries(Object.entries(q.anzahl).map(([a, b]) => [a, Math.max(1, Math.min(100, Math.round(+b) || 0))]).filter(([, b]) => b > 0)) : {}, neu: q.neu !== false, folien: q.folien || 'mittel', notizen: String(q.notizen || '').slice(0, 1500), quellen: Array.isArray(q.quellen) ? q.quellen.slice(0, 20) : [] };
      erstelle(job, prm).catch((e) => abbruch(job, e));
      return json(res, 200, { id }), true;
    }
    if (p === '/api/stunden/plan' && req.method === 'POST') {
      const q = JSON.parse((await body(req)) || '{}'), n = Math.max(1, Math.min(12, +q.std || 1)); if (!q.titel) return json(res, 400, { error: 'Thema fehlt.' }), true;
      if (!aiKey() && !process.env.AI_MOCK) return json(res, 501, { error: 'KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' }), true;
      const prm = { titel: String(q.titel).slice(0, 120), klasse: [5, 6, 7, 8].includes(+q.klasse) ? +q.klasse : 6, epoche: EPOCHEN.includes(q.epoche) ? q.epoche : 'Neuzeit', notizen: String(q.hinweise || '').slice(0, 800), quellen: [], quellenmodus: q.quellenmodus === 'wissen' ? 'wissen' : 'web' }, min = [45, 50, 90].includes(+q.min) ? +q.min : 50;
      try {
        const r = await aiJson('stunden', head(prm) + `Plane das Thema in genau ${n} aufeinanderfolgenden Unterrichtsstunden zu je ${min} Minuten. Jede Stunde baut auf der vorigen auf, hat ein eigenes Stundenthema, konkrete Inhalte, Ziele und abwechslungsreiche Methoden (Quellenarbeit, Kooperation, Sicherung). Antworte als JSON: {"einheiten":[{"thema":"Stundenthema (kurz)","inhalt":"Inhalte und Ablauf in 2–4 Sätzen","ziele":"1–2 Lernziele","methoden":"genutzte Methoden","ph":[{"t":"Phase, z. B. Einstieg","m":Minuten als Zahl}],"ha":"Hausübung oder leer"}]}. Die Minuten der Phasen ergeben je Stunde genau ${min}.`, 6000, { n, titel: prm.titel }, prm.quellenmodus === 'web');
        const E = (Array.isArray(r.einheiten) ? r.einheiten : []).slice(0, n).map((e) => ({ thema: String(e.thema || '').slice(0, 160), inhalt: String(e.inhalt || '').slice(0, 1500), ziele: String(e.ziele || '').slice(0, 500), methoden: String(e.methoden || '').slice(0, 300), ha: String(e.ha || '').slice(0, 300), ph: (Array.isArray(e.ph) ? e.ph : []).slice(0, 8).map((x) => ({ t: String(x.t || '').slice(0, 80), m: Math.max(1, Math.min(90, Math.round(+x.m || 5))) })) }));
        if (!E.length) return json(res, 502, { error: 'KI lieferte keine Stundenplanung.' }), true;
        return json(res, 200, { einheiten: E }), true;
      } catch (e) { return json(res, 502, { error: String(e && e.message || e) }), true; }
    }
    if (p === '/api/auftrag/status' && req.method === 'GET') { const j = jobs.get(url.searchParams.get('id')); return json(res, j ? 200 : 404, j ? { state: j.state, msg: j.msg, step: j.step, total: j.total, warn: j.warn || '', usd: j.kosten ? Math.round(j.kosten.usd * 10000) / 10000 : null, eur: j.kosten ? Math.round(j.kosten.usd * kurs.eur * 100) / 100 : null } : { error: 'unbekannt' }), true; }
    if (p === '/api/auftrag/cover' && req.method === 'POST') {
      const x = findById(url.searchParams.get('id')); if (!x) return json(res, 404, { error: 'Arbeitsauftrag nicht gefunden' }), true;
      const buf = await bodyBuf(req, 25 * 1024 * 1024); fs.writeFileSync(path.join(x.dir, 'cover_custom.png'), buf);
      try { await generiere(null, x.dir); } catch (e) { return json(res, 500, { error: String(e.message || e) }), true; }
      return json(res, 200, { ok: true }), true;
    }
    if (p === '/api/auftrag/fortsetzen' && req.method === 'POST') {
      const ad = findAbgebrochen(url.searchParams.get('id')); if (!ad) return json(res, 404, { error: 'Abgebrochener Auftrag nicht gefunden' }), true;
      if ([...jobs.values()].some((j) => j.state === 'laeuft')) return json(res, 409, { error: 'Es läuft bereits eine Erstellung. Bitte warten.' }), true;
      const prm = JSON.parse(fs.readFileSync(path.join(ad, '_param.json'), 'utf8')), data = JSON.parse(fs.readFileSync(path.join(ad, 'auftrag.json'), 'utf8'));
      const job = { id: data.id, state: 'laeuft', msg: 'Fortsetzen …', step: 0, total: 9, titel: data.titel }; jobs.set(job.id, job);
      erstelle(job, prm, { dir: ad, data }).catch((e) => abbruch(job, e)); return json(res, 200, { id: job.id }), true;
    }
    if (p === '/api/auftrag/abgebrochen' && req.method === 'DELETE') { const ad = findAbgebrochen(url.searchParams.get('id')); if (ad) fs.rmSync(ad, { recursive: true, force: true }); return json(res, 200, { ok: true }), true; }
    if (p === '/api/auftrag/schaetzung' && req.method === 'GET') {
      // Durchschnitt aus bisherigen Aufträgen je Teil; sonst grobe Annahme aus typischen Token-Mengen
      const bs = (url.searchParams.get('bs') || '').split(',').filter(Boolean), web = url.searchParams.get('web') === '1', eigen = +url.searchParams.get('eigen') || 0, seiten = +url.searchParams.get('seiten') || 10, folien = url.searchParams.get('folien') || 'mittel';
      const hist = scan().map((x) => x.m.kosten).filter((k) => k && k.teile), [pi, po] = preis(), kap = Math.max(4, Math.min(20, Math.round(seiten * 0.6 + 2))), extraIn = Math.min(12000, eigen * 2500);
      let az = {}; try { az = JSON.parse(url.searchParams.get('anz') || '{}') || {}; } catch { /* */ } const A2 = (k, d) => Math.max(1, +az[k] || d), hS = A2('handout', 30), pM = A2('podcast', 25);
      const T = { plan: [3000, 3000, 1, true], textblatt: [4000, 6000, Math.ceil(kap / 3), true], handout_plan: [3000, 3000, 1, true], handout: [5000, 9000, Math.ceil(Math.max(4, Math.round(hS / 3)) / 3), true], arbeitsblatt: [3000, 5000 * A2('arbeitsblatt', 8) / 8, 1], luecken: [3000, 4000 * A2('luecken', 38) / 38, 1], kreuzwort: [3000, 1500 * A2('kreuzwort', 16) / 16, 1], single: [3000, 3500 * A2('single', 20) / 20, 1], multiple: [3000, 3500 * A2('multiple', 20) / 20, 1], wdh: [3000, 4000, Math.ceil(A2('wdh', 20) / 10)], praesentation: [3000, 240 * A2('praesentation', folien === 'kurz' ? 15 : folien === 'ausfuehrlich' ? 40 : 25), 1], podcast: [6000 + hS * 600, pM * 130 * 1.6, 1] };
      const teile = ['plan', 'textblatt', ...bs.flatMap((k) => (k === 'handout' ? ['handout_plan', 'handout'] : [k]))];
      const ttsUsd = bs.includes('podcast') && podcast && podcast.eingerichtet() ? (podcast.anbieter() === 'azure' ? pM * 130 * 6.5 * 16 / 1e6 : podcast.anbieter() === 'elevenlabs' ? pM * 130 * 6.5 * 0.0002 : pM * 0.015) : 0; let usd = 0, ausVerlauf = 0;
      teile.forEach((t) => { const h = hist.map((k) => k.teile[t]).filter((v) => v > 0); if (h.length) { usd += h.reduce((a, b) => a + b, 0) / h.length; ausVerlauf++; return; } const d = T[t]; if (!d) return; const ein = (d[0] + extraIn + (web && d[3] ? 30000 : 0)) * d[2], aus = d[1] * d[2] * 1.6; usd += (ein * pi + aus * po) / 1e6 + (web && d[3] ? 3 * d[2] * SUCHE_USD : 0); });
      usd += ttsUsd;
      return json(res, 200, { eur: Math.round(usd * (await eurKurs()) * 100) / 100, usd: Math.round(usd * 100) / 100, basis: ausVerlauf === teile.length ? 'verlauf' : ausVerlauf ? 'gemischt' : 'annahme', modell: AI_MODEL, n: hist.length }), true;
    }
    if (p === '/api/auftrag/baustein' && req.method === 'POST') {
      const x = findById(url.searchParams.get('id')), B = BAUSTEINE.find((b) => b.k === url.searchParams.get('k')); if (!x || !B) return json(res, 404, { error: 'Arbeitsauftrag oder Baustein nicht gefunden' }), true;
      if (!aiKey() && !process.env.AI_MOCK) return json(res, 501, { error: 'KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' }), true;
      if ([...jobs.values()].some((j) => j.state === 'laeuft')) return json(res, 409, { error: 'Es läuft bereits eine Erstellung. Bitte warten.' }), true;
      const q = JSON.parse((await body(req)) || '{}'), id = Date.now().toString(36), job = { id, state: 'laeuft', msg: 'Start …', step: 0, total: 0, titel: x.m.titel + ' – ' + B.n }; jobs.set(id, job);
      ergaenze(job, x, B, String(q.hinweis || '').slice(0, 600)).catch((e) => { acc = null; job.state = 'fehler'; job.msg = String(e && e.message || e); });
      return json(res, 200, { id }), true;
    }
    if (p === '/api/auftrag/nummern' && req.method === 'POST') { const q = JSON.parse((await body(req)) || '{}'), map = q.map && typeof q.map === 'object' ? q.map : {}; scan().forEach((x) => { const n = parseInt(map[x.m.thema]); if (x.m.thema && n > 0 && n !== x.m.themaNr) { x.m.themaNr = n; fs.writeFileSync(path.join(x.dir, 'auftrag.json'), JSON.stringify(x.m, null, 1)); } }); renumber(); return json(res, 200, { ok: true }), true; }
    if (p === '/api/auftrag' && req.method === 'DELETE') { const x = findById(url.searchParams.get('id')); if (!x) return json(res, 404, { error: 'nicht gefunden' }), true; fs.rmSync(x.dir, { recursive: true, force: true }); renumber(); return json(res, 200, { ok: true }), true; }
    return false;
  };
  handle.laeuft = () => [...jobs.values()].some((j) => j.state === 'laeuft'); // für die Selbstaktualisierung: nicht mitten in einer Erstellung neu starten
  return handle;
}
