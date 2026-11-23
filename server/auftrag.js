// Lehrmaterial erarbeiten: KI erzeugt den Inhalt (JSON), Python-Generatoren (server/gen) bauen daraus Word, PowerPoint, Excel usw.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.join(__dir, 'gen');
const EPOCHEN = ['Vor- und Frühgeschichte', 'Antike', 'Mittelalter', 'Neuzeit', 'Zeitgeschichte'];
const jobs = new Map();
const slug = (s) => String(s || 'Arbeitsauftrag').normalize('NFC').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Arbeitsauftrag';
const yearOf = (m) => { const x = /-?\d{3,4}/.exec(String(m.jahr || m.zeitraum || '')); return x ? +x[0] : 9999; };

export function createAuftrag(ctx) {
  const { FILES_DIR, DATA_DIR, AI_KEY, AI_MODEL, json, body, bodyBuf } = ctx;
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

  // ---------- KI ----------
  async function aiJson(section, prompt, maxTok, mockArg) {
    if (process.env.AI_MOCK) return mock(section, mockArg);
    if (!AI_KEY) throw new Error('KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).');
    for (let i = 0; i < 2; i++) {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: AI_MODEL, max_tokens: maxTok || 8000, messages: [{ role: 'user', content: prompt + '\n\nAntworte ausschließlich mit gültigem JSON (kein Text davor oder danach).' }] }), signal: AbortSignal.timeout(300000) });
      const out = await r.json(); if (!r.ok) throw new Error(out?.error?.message || 'KI-Fehler ' + r.status);
      const txt = (out.content || []).map((c) => c.text || '').join(''), a = txt.indexOf('{'), b = txt.lastIndexOf('}');
      try { return JSON.parse(txt.slice(a, b + 1)); } catch { /* zweiter Versuch */ }
    }
    throw new Error('KI-Antwort nicht lesbar (' + section + ')');
  }
  function mock(section, arg) {
    const m = JSON.parse(fs.readFileSync(process.env.AI_MOCK, 'utf8'));
    const pick = (k) => (m[k] === undefined ? {} : m[k]);
    if (section === 'plan') return { untertitel: m.untertitel, zeitraum: m.zeitraum, jahr: m.jahr, kurz: m.textblatt.kurz, kapitel: m.textblatt.kapitel.map((k) => k.titel), zeitstrahl: m.zeitstrahl, prozess: m.prozess, prozess_titel: 'Überblick', epochen: m.epochen, glossar: m.textblatt.glossar, quellenliste: m.quellenliste };
    if (section === 'textblatt') return { kapitel: m.textblatt.kapitel.filter((k) => arg.includes(k.titel)) };
    if (section === 'arbeitsblatt') return m.arbeitsblatt;
    if (section === 'luecken') return { text: m.luecken.text, zusatz: m.luecken.zusatz, kreuzwort: m.kreuzwort };
    if (section === 'single') return { single: m.checkup.single };
    if (section === 'multiple') return { multiple: m.checkup.multiple };
    if (section === 'wdh') return { wiederholung: m.wiederholung.slice(arg[0], arg[1]) };
    if (section === 'praesentation') return { praesentation: m.praesentation };
    return pick(section);
  }
  const SYS = 'Du bist erfahrene Lehrkraft für Geschichte und Politische Bildung an einer österreichischen AHS (Sekundarstufe 2). Du erstellst anspruchsvolles, sachlich korrektes Unterrichtsmaterial in sehr gutem Deutsch (österreichische Rechtschreibung mit ss/ß wie üblich). Erfinde keine Quellenzitate: Zitate nur wörtlich aus den gelieferten Quellen oder als „sinngemäß“ gekennzeichnet. Nenne keine Schülerdaten.';
  const src = (p) => (p.quellen || []).map((q, i) => `QUELLE ${i + 1} (${q.ref || 'ohne Titel'}):\n${String(q.text || '').slice(0, 9000)}`).join('\n\n').slice(0, 45000) || '(keine Quellen angegeben: nutze gesichertes Fachwissen und kennzeichne Unsicheres)';
  const head = (p) => `${SYS}\nThema: „${p.titel}“. Klassenstufe: ${p.klasse}. Klasse (AHS Oberstufe; Niveau entsprechend). Epoche: ${p.epoche}${p.zeitraum ? ' (' + p.zeitraum + ')' : ''}.${p.notizen ? '\nWünsche der Lehrkraft: ' + p.notizen : ''}\n\nQUELLENMATERIAL:\n${src(p)}\n\n`;

  async function erstelle(job, p) {
    const say = (m, step) => { job.msg = m; if (step) job.step = step; }; job.total = 9;
    const dir = path.join(AUF, `${p.klasse}. Klasse`, '_neu_' + job.id); fs.mkdirSync(dir, { recursive: true }); job.dir = dir;
    const data = { titel: p.titel, klasse: p.klasse, epoche: p.epoche, zeitraum: p.zeitraum || '', jahr: p.jahr || '', id: job.id, erstellt: Date.now() };
    const save = () => fs.writeFileSync(path.join(dir, 'auftrag.json'), JSON.stringify(data, null, 1));
    const kap = p.seiten >= 18 ? 12 : p.seiten >= 14 ? 10 : 8, nF = p.folien === 'kurz' ? 15 : p.folien === 'ausfuehrlich' ? 40 : 25;
    say('Bibliotheken prüfen …', 0); await ensureLibs((m) => say(m)); save();
    say('1/9 Gliederung, Zeitstrahl und Epochenübersicht …', 1);
    const plan = await aiJson('plan', head(p) + `Erstelle einen Plan als JSON: {"untertitel":"kurzer Untertitel","zeitraum":"z. B. 1450–1517","jahr":"Jahreszahl als Zahl (Beginn)","kurz":["4–6 Stichpunkte 'Das Wichtigste in Kürze'"],"kapitel":["genau ${kap} Kapitelüberschriften in sinnvoller Reihenfolge"],"zeitstrahl":[{"jahr":1450,"text":"max. 5 Wörter"}] (6 Einträge),"prozess":[{"titel":"max. 3 Wörter","text":"max. 6 Wörter"}] (4–5 Schritte oder Phasen),"prozess_titel":"Überschrift der Grafik","epochen":[{"epoche":"Vor- und Frühgeschichte|Antike|Mittelalter|Neuzeit|Zeitgeschichte","ereignisse":[{"text":"max. 4 Wörter","jahr":"Jahr/Zeitraum","seite":1 oder -1,"hervorheben":true nur beim Thema selbst}]}] (für ALLE fünf Epochen je 2–3 abwechslungsreiche Ereignisse oder Persönlichkeiten, in der Epoche des Themas auch das Thema selbst),"glossar":[{"begriff":"","text":"kurz"}] (8 Einträge),"quellenliste":["3–5 seriöse Literatur-/Quellenangaben; bei gelieferten Quellen deren Titel"]}`, 5000);
    Object.assign(data, { untertitel: plan.untertitel || '', zeitraum: p.zeitraum || plan.zeitraum || '', jahr: p.jahr || plan.jahr || '', zeitstrahl: plan.zeitstrahl, prozess: plan.prozess, prozess_titel: plan.prozess_titel, epochen: plan.epochen, quellenliste: [...(plan.quellenliste || []), ...(p.quellen || []).map((q) => q.ref).filter(Boolean)] });
    data.textblatt = { kurz: plan.kurz || [], kapitel: [], glossar: plan.glossar || [] }; save();
    const titles = plan.kapitel || []; let n = 0;
    for (let i = 0; i < titles.length; i += 3) {
      const part = titles.slice(i, i + 3); say(`2/9 Textblatt: Kapitel ${i + 1}–${Math.min(i + 3, titles.length)} von ${titles.length} …`, 2);
      const r = await aiJson('textblatt', head(p) + `Gesamtgliederung des Textblatts: ${JSON.stringify(titles)}.\nSchreibe NUR die Kapitel ${JSON.stringify(part)} ausführlich als JSON: {"kapitel":[{"titel":"unverändert","absaetze":["3–4 Absätze, je 100–140 Wörter, Fließtext für Schüler/innen, präzise, mit Fachbegriffen"],"boxen":[{"typ":"merke|begriff|quelle|zahl|nachdenken","titel":"nur bei quelle: Autor, Werk, Jahr","text":"..."}] (2–3 Boxen, darunter mindestens eine 'merke'),"personen":[{"name":"","lebensdaten":"","rolle":"","text":"2–3 Sätze Bedeutung"}] (nur wenn wichtige Personen vorkommen; insgesamt im Textblatt mindestens 5 verschiedene)}]}. Insgesamt soll das Textblatt etwa ${p.seiten} Seiten füllen.`, 8000, part);
      (r.kapitel || []).forEach((k) => data.textblatt.kapitel.push(k)); save();
    }
    say('3/9 Arbeitsblatt …', 3);
    const ab = await aiJson('arbeitsblatt', head(p) + `Erstelle das Arbeitsblatt „Offene Fragen“ (ohne Punkte, keine Testoptik) als JSON: {"aufgaben":[genau 8 Aufgaben]}. Jede Aufgabe: {"titel":"","afb":"AFB I|II|III · Operator","einleitung":"optional","quelle":{"label":"Autor/Werk/Jahr","text":"kurzer Quellenauszug AUS DEN QUELLEN"} optional,"typ":"frei|tabelle|skizze","tabelle":{"spalten":["Kriterium","A","B"],"zeilen":[["Kriterium","Lösung A","Lösung B"]]} nur bei typ tabelle,"teile":[{"text":"Arbeitsauftrag mit Operator","erwartung":"Erwartungshorizont (Stichpunkte, ohne Punkte)","zeilen":3–6}]}. Aufgabe 1–2: Wiedergeben, 3–5: Erklären/Vergleichen (eine mit Quelle, eine Tabelle), 6: Beurteilen mit Klassenbezug ('Notiere, welcher Standpunkt unserer Diskussion vom ______ (Datum) am stärksten war'), 7: Transfer mit selbst erlebtem Beispiel der letzten 7 Tage, 8: typ skizze (Mindmap/Zeitstrahl). Gestalte die Aufgaben so, dass sie ohne den Unterricht und das Textblatt nicht von einer KI gelöst werden können (Bezug auf Blatt-Quelle, Unterrichtsdiskussion, eigenes Beispiel, Skizze).`, 8000); data.arbeitsblatt = ab; save();
    say('4/9 Lückentext und Kreuzworträtsel …', 4);
    const lk = await aiJson('luecken', head(p) + `Erstelle als JSON: {"text":"zusammenhängender Lückentext, mindestens 600 Wörter, gegliedert mit **Zwischenüberschrift.** (fett mit zwei Sternchen, endet mit Punkt) vor jedem Abschnitt; 35–40 Lücken, jede Lücke als {Wort} mitten im Satz, nur sinnvolle Fachbegriffe","zusatz":["4 Wörter, die NICHT in den Text passen, aber plausibel wirken"],"kreuzwort":[{"wort":"EIN Wort 4–12 Buchstaben ohne Leerzeichen","hinweis":"präzise Frage/Umschreibung"}] (genau 16 Begriffe aus dem Thema)}`, 8000);
    data.luecken = { text: lk.text, zusatz: lk.zusatz || [] }; data.kreuzwort = lk.kreuzwort || []; save();
    say('5/9 Check-up Single Choice (20 Fragen) …', 5);
    const sc = await aiJson('single', head(p) + `Erstelle 20 Single-Choice-Fragen als JSON: {"single":[{"frage":"max. 120 Zeichen","antworten":["4 Antworten, je max. 75 Zeichen"],"richtig":0 bis 3 (Index, gleichmäßig verteilen)}]}. Anspruchsvoll, eindeutig, plausible Distraktoren, quer durchs Thema.`, 7000); data.checkup = { single: sc.single || [] }; save();
    say('6/9 Check-up Multiple Choice (20 Fragen) …', 6);
    const mc = await aiJson('multiple', head(p) + `Erstelle 20 Multiple-Choice-Fragen (2 oder 3 richtige Antworten von 4) als JSON: {"multiple":[{"frage":"max. 120 Zeichen","antworten":["4 Antworten, je max. 75 Zeichen"],"richtig":[Indizes 0–3]}]}. Andere Fragen als bei Single Choice.`, 7000); data.checkup.multiple = mc.multiple || []; save();
    data.wiederholung = [];
    for (const [a, b] of [[0, 10], [10, 20]]) {
      say(`7/9 Mündliche Wiederholungen ${a + 1}–${b} …`, 7);
      const w = await aiJson('wdh', head(p) + `Erstelle ${b - a} mündliche Stundenwiederholungen (je max. 5 Minuten) als JSON: {"wiederholung":[{"titel":"Teilthema","fragen":[{"frage":"in 1–2 Sätzen beantwortbar","antwort":"Musterantwort in 1–2 Sätzen","kriterien":["1 oder 2 prüfbare Kriterien, je 1 Punkt"]}] (genau 4 Fragen)}]}. Reihenfolge der Teilthemen chronologisch ab Wiederholung ${a + 1} von 20, die zusammen das ganze Thema abdecken.`, 7000, [a, b]); (w.wiederholung || []).forEach((x) => data.wiederholung.push(x)); save();
    }
    say('8/9 Präsentation planen …', 8);
    const pr = await aiJson('praesentation', head(p) + `Plane die Präsentation mit ca. ${nF} Folien (insgesamt, ohne Titel-, Video-, Aufgaben- und Quellenfolie) als JSON: {"praesentation":{"titeljahr":"Jahreszahl für die Titelfolie","folien":[ ... ]}}. Folientypen: {"typ":"divider","titel":""} (Kapitelfolie), {"typ":"text","titel":"","untertitel":"","bloecke":[{"lead":"fett","text":"1–2 Sätze, max. 35 Wörter"}] (2–3 Blöcke),"bild":"illus oder person:Name oder zeit oder steps oder null","notizen":"Sprechtext"}, {"typ":"person","titel":"Name","untertitel":"Rolle","personen":[{"name":"","lebensdaten":"","rolle":""}],"bloecke":[{"lead":"","text":""}]}, {"typ":"zeitstrahl","titel":"Zeitstrahl","untertitel":""}. Die Folien sind KEIN Duplikat des Textblatts: Überblick, Zusammenhänge, Personen, Gegenüberstellungen (Vorteile/Nachteile), Impulse und Diskussionsfragen. Setze Divider zur Gliederung ein.`, 8000);
    data.praesentation = pr.praesentation || {}; save();
    say('9/9 Dokumente werden erzeugt …', 9); await generiere(job, dir); const fin = path.join(path.dirname(dir), 'zz ' + slug(p.titel) + ' ' + job.id); fs.renameSync(dir, fin); job.dir = fin; renumber(); job.state = 'fertig'; say('Fertig.');
  }
  async function generiere(job, dir) {
    const cc = path.join(dir, 'cover_custom.png'); void cc;
    const args = ['gen.py', path.join(dir, 'auftrag.json'), dir]; if (fs.existsSync(VORLAGE)) args.push(VORLAGE);
    const r = await py(args); if (r.code !== 0) throw new Error('Dokumente konnten nicht erzeugt werden: ' + (r.e || r.o).slice(-400));
    if (r.e && /FEHLER/.test(r.e) && job) job.warn = r.e.slice(-400);
    if (!fs.existsSync(VORLAGE) && job) job.warn = (job.warn ? job.warn + ' ' : '') + 'Hinweis: Keine Präsentationsvorlage hochgeladen (Material/Vorlage/praesentation.pptx), daher ohne Präsentation.';
  }
  function scan() {
    const out = []; if (!fs.existsSync(AUF)) return out;
    for (const k of fs.readdirSync(AUF)) { const kd = path.join(AUF, k); if (!fs.statSync(kd).isDirectory()) continue;
      for (const a of fs.readdirSync(kd)) { if (a.startsWith('_neu_')) continue; const ad = path.join(kd, a), jf = path.join(ad, 'auftrag.json'); if (!fs.existsSync(jf)) continue; try { const m = JSON.parse(fs.readFileSync(jf, 'utf8')); out.push({ dir: ad, kdir: kd, m }); } catch { /* */ } } }
    return out;
  }
  function renumber() {
    const all = scan().filter((x) => !x.m.id || true), byK = new Map();
    all.forEach((x) => { const k = x.kdir; if (!byK.has(k)) byK.set(k, []); byK.get(k).push(x); });
    for (const [kd, list] of byK) {
      list.sort((a, b) => EPOCHEN.indexOf(a.m.epoche) - EPOCHEN.indexOf(b.m.epoche) || yearOf(a.m) - yearOf(b.m) || String(a.m.titel).localeCompare(String(b.m.titel), 'de'));
      const tmp = list.map((x, i) => { const t = path.join(kd, '__t' + i); fs.renameSync(x.dir, t); return t; });
      list.forEach((x, i) => { const nn = String(i + 1).padStart(2, '0'); fs.renameSync(tmp[i], path.join(kd, `${nn} ${slug(x.m.titel)}`)); });
    }
  }
  function listing() {
    return scan().map((x) => { const nr = /^(\d+)\s/.exec(path.basename(x.dir)); const rel = path.relative(FILES_DIR, x.dir).split(path.sep).join('/');
      const files = []; const walk = (d, pre) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('_') || e.name === 'auftrag.json' || e.name.startsWith('cover_custom')) continue; if (e.isDirectory()) walk(path.join(d, e.name), pre + e.name + '/'); else files.push(pre + e.name); } }; walk(x.dir, '');
      files.sort((a, b) => (/^\d/.test(a) === /^\d/.test(b) ? a.localeCompare(b, 'de') : /^\d/.test(a) ? -1 : 1));
      return { id: x.m.id, titel: x.m.titel, klasse: x.m.klasse, epoche: x.m.epoche, jahr: x.m.jahr, nr: nr ? nr[1] : '', dir: rel, files, cover: files.find((f) => /^Cover_.*\.jpg$/.test(f)) || '' };
    }).sort((a, b) => String(a.klasse).localeCompare(String(b.klasse)) || String(a.nr).localeCompare(String(b.nr)));
  }
  const findById = (id) => scan().find((x) => String(x.m.id) === String(id));

  return async function handle(req, res, url) {
    const p = url.pathname;
    if (p === '/api/auftraege' && req.method === 'GET') return json(res, 200, { items: listing(), vorlage: fs.existsSync(VORLAGE), ai: !!AI_KEY || !!process.env.AI_MOCK }), true;
    if (p === '/api/auftrag/erstellen' && req.method === 'POST') {
      const q = JSON.parse((await body(req)) || '{}'); if (!q.titel || !EPOCHEN.includes(q.epoche)) return json(res, 400, { error: 'Bitte Thema und Epoche angeben.' }), true;
      if (!AI_KEY && !process.env.AI_MOCK) return json(res, 501, { error: 'KI nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' }), true;
      if ([...jobs.values()].some((j) => j.state === 'laeuft')) return json(res, 409, { error: 'Es läuft bereits eine Erstellung. Bitte warten.' }), true;
      const id = Date.now().toString(36), job = { id, state: 'laeuft', msg: 'Start …', step: 0, total: 9, titel: q.titel }; jobs.set(id, job);
      const prm = { titel: String(q.titel).slice(0, 120), klasse: [5, 6, 7, 8].includes(+q.klasse) ? +q.klasse : 6, epoche: q.epoche, zeitraum: String(q.zeitraum || '').slice(0, 60), jahr: String(q.jahr || '').slice(0, 10), seiten: +q.seiten || 10, folien: q.folien || 'mittel', notizen: String(q.notizen || '').slice(0, 1500), quellen: Array.isArray(q.quellen) ? q.quellen.slice(0, 20) : [] };
      erstelle(job, prm).catch((e) => { job.state = 'fehler'; job.msg = String(e && e.message || e); try { if (job.dir) fs.rmSync(job.dir, { recursive: true, force: true }); } catch { /* */ } });
      return json(res, 200, { id }), true;
    }
    if (p === '/api/auftrag/status' && req.method === 'GET') { const j = jobs.get(url.searchParams.get('id')); return json(res, j ? 200 : 404, j ? { state: j.state, msg: j.msg, step: j.step, total: j.total, warn: j.warn || '' } : { error: 'unbekannt' }), true; }
    if (p === '/api/auftrag/cover' && req.method === 'POST') {
      const x = findById(url.searchParams.get('id')); if (!x) return json(res, 404, { error: 'Arbeitsauftrag nicht gefunden' }), true;
      const buf = await bodyBuf(req, 25 * 1024 * 1024); fs.writeFileSync(path.join(x.dir, 'cover_custom.png'), buf);
      try { await generiere(null, x.dir); } catch (e) { return json(res, 500, { error: String(e.message || e) }), true; }
      return json(res, 200, { ok: true }), true;
    }
    if (p === '/api/auftrag/nummern' && req.method === 'POST') { renumber(); return json(res, 200, { ok: true }), true; }
    if (p === '/api/auftrag' && req.method === 'DELETE') { const x = findById(url.searchParams.get('id')); if (!x) return json(res, 404, { error: 'nicht gefunden' }), true; fs.rmSync(x.dir, { recursive: true, force: true }); renumber(); return json(res, 200, { ok: true }), true; }
    return false;
  };
}
