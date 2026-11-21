/* Klassenmappen (Etappe 1): eine Mappe je Klasse, Klassenleiste mit Sortierung und Drag-and-Drop,
   Icon-Leiste links (Allgemein, Geschichte, Sport), breite Schülerliste, einfache Schülerseite.
   Nutzt die Daten und Hilfsfunktionen von index.html (groups, cinfo, studentsSorted, saveLog, put, ...). */
const KM = (() => {
  const SUBJ = { gpb: 'Geschichte', bspk: 'Bewegung und Sport' };
  /* Symbole der Seitenleiste: Allgemein (Info), Geschichte (Schwerter), Sport (Läufer) */
  const ICON = {
    i: { fill: true, d: '<path fill-rule="evenodd" d="M5.7 2.5h12.6a3.2 3.2 0 0 1 3.2 3.2v12.6a3.2 3.2 0 0 1-3.2 3.2H5.7a3.2 3.2 0 0 1-3.2-3.2V5.7a3.2 3.2 0 0 1 3.2-3.2zM8.6 10h4.8v7.4h2.1V19h-7v-1.6h2.1v-5.8h-2zM12 4.4a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5z"/>' },
    g: { fill: true, d: '<defs><mask id="kmswm" maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32"><rect x="-4" y="-4" width="32" height="32" fill="#fff"/><g transform="translate(12 12.5) rotate(45) scale(1.3)"><path d="M-1.8-8L1.8-10.2V1.5h-3.6z" fill="#000" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/></g></mask></defs><g mask="url(#kmswm)"><g transform="translate(12 12.5) rotate(-45) scale(1.3)"><path d="M-1.8-8L1.8-10.2V1.5h-3.6zM-3.7 1.8h7.4v1.8h-7.4zM-.85 3.6h1.7v2.2h-1.7zM0 5.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z"/></g></g><g transform="translate(12 12.5) rotate(45) scale(1.3)"><path d="M-1.8-8L1.8-10.2V1.5h-3.6zM-3.7 1.8h7.4v1.8h-7.4zM-.85 3.6h1.7v2.2h-1.7zM0 5.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z"/></g>' },
    s: { fill: true, d: '<circle cx="17.2" cy="5" r="2.1"/><g fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 8.6L10.6 13.4"/><path d="M14 8.6L9.2 9.8"/><path d="M14.6 9.4L17.6 11L20 8.4"/><path d="M10.6 13.4L15.6 14.2L12.2 18.6"/><path d="M10.6 13.4L6.8 17.4"/></g><g stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M4 6.2h4.2"/><path d="M2.4 8.8h5"/><path d="M4.6 11.4h2.6"/></g>' },
  };
  const svg = (k, s) => ICON[k].fill ? `<svg viewBox="0 0 24 24" width="${s || 24}" height="${s || 24}" fill="currentColor" stroke="none" aria-hidden="true">${ICON[k].d}</svg>` : `<svg viewBox="0 0 24 24" width="${s || 24}" height="${s || 24}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k].d}</svg>`;
  const cfg = () => S.settings.kmap || { id: 'kmap' };
  /* Spaltenbreiten der Schülerlisten: gespeichert je Listenart (g = Geschichte, s = Sport) */
  const kmw = (kind) => ((cfg().kmw || {})[kind]) || {};
  const gridOf = (kind, defs) => { const sv = kmw(kind); return { grid: defs.map((d) => (sv[d.k] ? sv[d.k] + 'px' : d.d)).join(' '), min: defs.reduce((a, d) => a + (sv[d.k] || d.w), 0) + defs.length * 8 }; };
  const hcell = (k, inner, cls, extra, rs) => `<span${cls ? ` class="${cls}"` : ''} data-kw="${k}"${extra || ''}>${inner}${rs === false ? '' : `<i class="kmrs" data-kw="${k}" draggable="false" title="Ziehen: Breite ändern · Doppelklick: zurücksetzen"></i>`}</span>`;
  const saveCfg = (o) => put('settings', Object.assign({}, cfg(), o, { id: 'kmap' }));
  const kind = (G) => subjKind(G.subject);
  const up = (t) => String(t).replace(/ß/g, '\u0001').toUpperCase().replace(/\u0001/g, 'ß');

  /* ---------- Klassen ---------- */
  function classes() {
    const m = {};
    groups().filter((G) => !G.sprech && G.label !== SPR).forEach((G) => {
      const c = (m[G.label] = m[G.label] || { label: G.label, key: norm(G.label), groups: [], gpb: [], bspk: [], names: [] });
      c.groups.push(G); if (kind(G) === 'gpb') c.gpb.push(G); else if (kind(G) === 'bspk') c.bspk.push(G);
      G.classes.forEach((n) => { if (!c.names.includes(n)) c.names.push(n); });
    });
    return Object.values(m).map((c) => Object.assign(c, { jg: parseInt(c.label) || 0 }));
  }
  function sorted() {
    const cs = classes(), c = cfg(), kv = norm(c.kvClass || '');
    const auto = (a, b) => (a.key === kv ? -1 : b.key === kv ? 1 : 0) || (a.gpb.length ? 0 : 1) - (b.gpb.length ? 0 : 1) || a.jg - b.jg || a.label.localeCompare(b.label, 'de');
    if (c.manual && Array.isArray(c.order)) {
      const idx = new Map(c.order.map((k, i) => [k, i]));
      return cs.sort((a, b) => (a.key === kv ? -1 : b.key === kv ? 1 : 0) || ((idx.has(a.key) ? idx.get(a.key) : 1e6) - (idx.has(b.key) ? idx.get(b.key) : 1e6)) || auto(a, b));
    }
    return cs.sort(auto);
  }
  /* Trennlinie: Position = Anzahl der Klassen (ohne KV) links davon. Standard: vor der ersten Klasse ohne Geschichte, sonst am Ende. */
  function divAt(rest) { const d = cfg().div; if (Number.isInteger(d)) return Math.max(0, Math.min(rest.length, d)); const i = rest.findIndex((x) => !x.gpb.length); return i < 0 ? rest.length : i; }
  const tabsOf = (c) => ['i'].concat(c.gpb.length ? ['g'] : [], c.bspk.length ? ['s'] : []);
  const primary = (list) => list.slice().sort((a, b) => (cinfo(b.slug).students || []).length - (cinfo(a.slug).students || []).length)[0];
  const studentsOf = (c) => { const m = new Map(); c.groups.forEach((G) => stAct(Array.isArray(cinfo(G.slug).students) ? cinfo(G.slug).students : []).forEach((s) => { const k = (s.nn + '|' + s.vn).toLowerCase(); if (!m.has(k)) m.set(k, s); })); return [...m.values()]; };
  function timeRows(G) {
    const T = TIMES();
    return mergeRows(G.rows).sort((a, b) => a.wd - b.wd || a.p1 - b.p1).map((b) => { const a = T[b.p1], z = T[b.p2]; return { d: WD[b.wd], t: (b.p2 > b.p1 ? b.p1 + './' + b.p2 + '. Std' : b.p1 + '. Std') + (a && z ? ' (' + a.von + '–' + z.bis + ')' : ''), r: b.room || '' }; });
  }
  /* Tag | Zeit | I | Ort in ausgerichteten Spalten (Zeitangaben stehen untereinander) */
  const timeHtml = (rows, inline) => `<div class="kmtls${inline ? ' inl' : ''}">${rows.map((x) => `<div class="kmtl"><span class="kmd">${esc(x.d)}</span><span class="kmt">${esc(x.t)}</span>${x.r ? `<span class="kmsep">I</span><span class="kmr">${esc(x.r)}</span>` : '<span></span><span></span>'}</div>`).join('')}</div>`;
  function stat(G, x) {
    const log = (cinfo(G.slug).log || []).filter((e) => e.date <= TODAY && (e.chk || (Array.isArray(e.abs) && e.abs.length)));
    let a = 0, p = 0, b = 0;
    log.forEach((e) => { if (x.ein && e.date < x.ein) return; if (x.aus && e.date > x.aus) return; if ((e.abs || []).includes(x.id)) b++; else if ((e.pas || []).includes(x.id)) p++; else a++; });
    const t = a + p + b, pc = (v) => (t ? Math.round((v * 100) / t) : null);
    return { a, p, b, t, pa: pc(a), pp: pc(p), pb: pc(b) };
  }
  /* ---------- Geschichte: Leistungsspalten (Prozent aus Einzelleistungen) ---------- */
  const DEF_COLS = [{ id: 'c1', name: 'AA Unterricht' }, { id: 'c2', name: 'Check-Ups' }, { id: 'c3', name: 'Microsoft Forms' }, { id: 'c4', name: 'Tests' }];
  const PALETTE = ['#a8aab0', '#7dd6a3', '#2e9aa0', '#a8aab0', '#c4b0e6', '#f0b27a'];
  const colColor = (k, i) => k.color || PALETTE[i % PALETTE.length];
  const darkText = (hex) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)); return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) > 140; };
  const colsDef = () => { const d = S.settings.kmcols; return d && Array.isArray(d.cols) ? d.cols : DEF_COLS; };
  const saveCols = (cols) => put('settings', { id: 'kmcols', cols });
  const hiddenOf = (key) => (cfg().hid || {})[key] || [];
  const visCols = (c) => colsDef().filter((x) => !hiddenOf(c.key).includes(x.id));
  const resItems = (G) => { const d = S.settings['kmr_' + G.slug]; return d && Array.isArray(d.items) ? d.items : []; };
  const resDoc = (G) => S.settings['kmr_' + G.slug] || { id: 'kmr_' + G.slug, items: [] };
  const saveRes = (G, items) => put('settings', Object.assign({}, resDoc(G), { id: 'kmr_' + G.slug, items }));
  const patchRes = (G, o) => put('settings', Object.assign({}, resDoc(G), o, { id: 'kmr_' + G.slug }));
  const GRADES = { 1: 'Sehr gut', 2: 'Gut', 3: 'Befriedigend', 4: 'Genügend', 5: 'Nicht genügend' };
  const limits = () => { const d = S.settings.kmgrade; return d && Array.isArray(d.limits) && d.limits.length === 4 ? d.limits : [88, 76, 60, 50]; };
  const gradeOf = (p) => { if (p == null) return null; const L = limits(); return p >= L[0] ? 1 : p >= L[1] ? 2 : p >= L[2] ? 3 : p >= L[3] ? 4 : 5; };
  const r1 = (v) => fmt(Math.round(v * 10) / 10);
  function perfOf(G, x, cols) {
    const per = cols.map((k) => { let p = 0, m = 0, n = 0; resItems(G).filter((e) => e.col === k.id && has(e, x)).forEach((e) => { p += +e.pts[x.id]; m += +e.max || 0; n++; }); return { p, m, n, pc: m > 0 ? Math.round((p * 100) / m) : null }; });
    const tp = per.reduce((a, b) => a + b.p, 0), tm = per.reduce((a, b) => a + b.m, 0), pc = tm > 0 ? Math.round((tp * 100) / tm) : null;
    return { per, tp, tm, pc, note: gradeOf(pc) };
  }
  const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
  const has = (e, x) => e.pts && e.pts[x.id] !== undefined && e.pts[x.id] !== null && e.pts[x.id] !== '';
  function colPct(G, x, col) { let p = 0, m = 0; resItems(G).filter((e) => e.col === col && has(e, x)).forEach((e) => { p += +e.pts[x.id]; m += +e.max || 0; }); return m > 0 ? Math.round((p * 100) / m) : null; }
  const lvl = (v) => (v == null ? '' : v >= 75 ? 'ak' : v >= 50 ? 'pa' : 'ab');
  const pctL = (v) => `<span class="kmp ${lvl(v)}">${v == null ? '–' : v + ' %'}</span>`;
  const fmt = (n) => String(n).replace('.', ',');
  const pct = (v, cls) => `<span class="kmp ${cls}">${v == null ? '–' : v + ' %'}</span>`;
  const disp = (c) => c.names.length > 1 ? c.names.map((n) => esc(String(n).toUpperCase())).join('<span class="kmsep">I</span>') : esc(c.label);
  const route = (key, tab, col) => 'mappe-' + key + '-' + tab + (col ? '-' + col : '');
  function parse(v) {
    const m = /^mappe(?:-([a-z0-9äöü]+)(?:-([igs])(?:-([a-z0-9]+))?)?)?$/.exec(v) || [];
    const list = sorted(); let c = list.find((x) => x.key === m[1]);
    if (!c) { let last = null; try { last = JSON.parse(localStorage.getItem('kmLast')); } catch (e) { /* */ } c = list.find((x) => last && x.key === last.key) || list[0]; }
    let tab = m[2]; if (c && !tabsOf(c).includes(tab)) tab = null;
    if (c && !tab) tab = c.gpb.length ? 'g' : c.bspk.length ? 's' : 'i';
    return { list, c, tab: tab || 'i', col: tab === 'g' ? m[3] : null };
  }

  /* ---------- Ansicht ---------- */
  /* Geschlecht aus dem Vornamen vermuten (ohne KI, nur Namenslisten und Endungen) */
  const GM_E = new Set('luca luka nikola nicola elia elija ilja joshua noah jona mustafa zakaria sasha sascha mika kosta costa mike ole uwe rene andre philippe felipe emre berke kaan enrique jose pepe dave steve ante nele'.split(' ').filter((x) => x !== 'nele'));
  const GF_X = new Set('ines karin birgit miriam mirjam ruth carmen nadin sarah hannah jasmin yasmin kathrin katrin kerstin christin vivien elif esra merve zeynep selin özlem ceren hatice fatma emine meryem rukiye sümeyye sumeyye beyza ecrin zehra eylül damla derya gül gülsüm nur nour noor iman ayşe ayse aysel aylin lejla nejla emily lily mandy kitty sandy cindy jenny lilly milly kelly holly molly nelly romy sunny mia lea lia ria eva ida ela amy joy beatrice alice leonie melanie sophie marie lilli anni mimi leoni nini nelli lotti charlotte ronja andrea'.split(' '));
  const GM_I = new Set('ali tommi benni luki sami mati fabi alexi toni nikki jaki dani nuri rami bobi giorgi yusuf'.split(' '));
  function guessGender(vn) {
    const t = String(vn || '').toLowerCase().trim().split(/[\s-]+/)[0].replace(/[^a-zäöüßçşéèíóúñ]/g, ''); if (!t) return 'm';
    if (GF_X.has(t)) return 'w'; if (GM_E.has(t)) return 'm'; if (GM_I.has(t)) return 'm';
    if (/(a|e|ie|ine|ette|elle|ella|ia|ika|ica)$/.test(t)) return 'w'; if (/i$/.test(t) && t.length > 3) return /(ni|li|ti)$/.test(t) ? 'w' : 'm'; return 'm';
  }
  /* Schüler ohne Geschlecht: vermutetes eintragen (in BSPK-Klassen immer m, weil dort nur Buben sind) */
  function ensureGenders() {
    try { groups().forEach((G) => { const ci = cinfo(G.slug), st = ci.students; if (!Array.isArray(st) || !st.some((x) => !x.g)) return; const bsp = false; put('settings', Object.assign({}, ci, { id: 'cn_' + G.slug, students: st.map((x) => (x.g ? x : Object.assign({}, x, { g: bsp ? 'm' : guessGender(x.vn) }))) })); }); } catch (e) { /* */ }
  }
  function view(v) {
    ensureGenders();
    const { list, c, tab, col } = parse(v);
    if (!list.length) return `<section class="card"><div class="hd"><h2>Klassenmappen</h2></div><p class="muted">Klassen entstehen aus deinem Stundenplan. Hole ihn im Stundenplan über „Von WebUntis übernehmen“.</p></section>`;
    try { localStorage.setItem('kmLast', JSON.stringify({ key: c.key })); } catch (e) { /* */ }
    const kvKey = norm(cfg().kvClass || '');
    const chip = (x) => { const isKv = x.key === kvKey; return `<span class="kmchipw"><button class="kmchip${x.key === c.key ? ' on' : ''}" data-act="kmsel" data-key="${x.key}" data-tab="${tab}" ${isKv ? '' : 'draggable="true"'} title="${isKv ? 'Meine Klasse als Klassenvorstand' : 'Ziehen zum Verschieben'}"><span>${isKv ? '★ ' : ''}${disp(x)}</span><small>${[x.gpb.length ? 'GPB' : '', x.bspk.length ? 'BSPK' : ''].filter(Boolean).join(' · ')}</small></button></span>`; };
    const kvC = list.find((x) => x.key === kvKey), rest = list.filter((x) => x.key !== kvKey), d = divAt(rest);
    const chips = (kvC ? chip(kvC) : '') + rest.map((x, i) => (i === d ? '<span class="kmdiv" draggable="true" data-key="|" title="Trennlinie, ziehbar"></span>' : '') + chip(x)).join('') + (d >= rest.length && rest.length ? '<span class="kmdiv" draggable="true" data-key="|" title="Trennlinie, ziehbar"></span>' : '');
    const side = tabsOf(c).map((t) => `<button class="kmicon${t === tab ? ' on' : ''}" data-act="kmtab" data-key="${c.key}" data-tab="${t}" title="${t === 'i' ? 'Allgemeine Informationen' : t === 'g' ? 'Geschichte' : 'Bewegung und Sport'}" aria-label="${t === 'i' ? 'Allgemein' : t === 'g' ? 'Geschichte' : 'Sport'}">${svg(t, 26)}<small>${t === 'i' ? 'Allgemein' : t === 'g' ? 'Geschichte' : 'Sport'}</small></button>`).join('');
    const body = tab === 'i' ? general(c) : tab === 'g' && col ? colPage(c, col) : subject(c, tab === 'g' ? 'gpb' : 'bspk');
    const hm = /<!--H-->([\s\S]*?)<!--\/H-->/.exec(body), headH = hm ? hm[1] : '', bodyH = hm ? body.replace(hm[0], '') : body;
    return `<div class="km"><div class="kmcls"><div class="kmchips">${chips}</div></div>
      ${headH}<div class="kmbody"><nav class="kmside" aria-label="Bereiche"><div class="kmsidet">Klasse<b${c.names.length > 1 ? ' class="m"' : ''}>${disp(c)}</b></div>${side}</nav><section class="kmmain">${bodyH}</section></div></div>`;
  }

  /* ---------- Klassenfoto, Gesichtserkennung (lokal im Browser) und Profilfotos ---------- */
  const skey = (x) => (x.kv ? '__kv__' : ((x.nn || '') + '|' + (x.vn || '')).toLowerCase());
  const dname = (x) => (x.kv ? 'Klassenvorstand' + (x.full ? ': ' + x.full : '') : x.nn + ' ' + x.vn);
  function kvNameOf(c) {
    const c0 = cfg(), isKv = norm(c0.kvClass || '') === c.key; let fb = ''; for (const G of c.groups) { const t = kvText(G, cinfo(G.slug)); if (t) { fb = t; break; } }
    return (c0.kvn && c0.kvn[c.key]) || fb || (isKv ? 'Ich' : '');
  }
  const kvPh = (c) => ((cfg().kvph || {})[c.key]) || null;
  function kvPerson(c) {
    const full = kvNameOf(c), real = full && full !== 'Ich' ? full : '', toks = real.replace(/\b(mag|dr|dipl|ing|prof|mmag|msc|bsc|ba|ma|bed|med|di|ofr|fachlehrer)\b\.?/gi, ' ').replace(/\(.*?\)/g, ' ').split(/[\s,]+/).filter((t) => t.length > 1), ph = kvPh(c) || {};
    return { kv: true, full: real, nn: toks.length ? toks[toks.length - 1] : 'Klassenvorstand', vn: toks.slice(0, -1).join(' '), photo: ph.photo || '', pv: ph.pv, pfrom: ph.pfrom || '' };
  }
  const peopleOf = (c, part) => subStudents(c, part).concat([kvPerson(c)]);
  const fileUrl = (p, v) => '/api/file?path=' + encodeURIComponent(p) + '&inline=1' + (v ? '&v=' + v : '');
  const photoOf = (x) => (x && x.photo ? fileUrl(x.photo, x.pv) : '');
  const avSpan = (x, cls, G) => `<span class="${cls}"${G ? ` data-act="kmavedit" data-slug="${G.slug}" data-id="${esc(x.id)}" role="button" tabindex="0" title="${x.photo ? 'Foto vergrößert: Hover · Klick = Zuordnung bearbeiten' : 'Foto zuordnen (Klassenfoto bearbeiten)'}"` : ' aria-hidden="true"'}>${x.photo ? `<img src="${photoOf(x)}" alt="" loading="lazy">` : esc((x.vn[0] || '') + (x.nn[0] || ''))}</span>`;
  async function putFile(path, blob) { const r = await fetch('/api/file?path=' + encodeURIComponent(path), { method: 'PUT', body: blob, credentials: 'same-origin' }); if (!r.ok) { const e = (await r.json().catch(() => ({}))).error || ''; throw new Error(e || 'Speichern auf der NAS fehlgeschlagen (' + r.status + ')'); } }
  const loadImgUrl = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Das Bild konnte nicht gelesen werden')); i.src = src; });
  async function shrinkImage(file, max) { const u = URL.createObjectURL(file); try { const i = await loadImgUrl(u), k = Math.min(1, max / Math.max(i.naturalWidth, i.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.round(i.naturalWidth * k); cv.height = Math.round(i.naturalHeight * k); cv.getContext('2d').drawImage(i, 0, 0, cv.width, cv.height); const b = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.86)); return { blob: b, w: cv.width, h: cv.height }; } finally { URL.revokeObjectURL(u); } }
  /* je Klasse (oder Teilklasse): mehrere Fotos {id,file,v,w,h,faces}, eines davon ist das angezeigte Klassenfoto (main) */
  const cmeta = (key) => { const m = (cfg().cphoto || {})[key]; if (!m) return null; return m.photos ? m : { photos: [{ id: 'p0', file: m.file, v: m.v, w: m.w, h: m.h, faces: m.faces || [] }], main: 'p0' }; };
  const cphoto = (key, id) => { const m = cmeta(key); if (!m || !m.photos.length) return null; return m.photos.find((x) => x.id === (id || m.main)) || m.photos[0]; };
  const saveCm = (key, m) => { const a = Object.assign({}, cfg().cphoto || {}); if (m && m.photos.length) a[key] = m; else delete a[key]; saveCfg({ cphoto: a }); };
  const addPhoto = (key, p) => { const m = cmeta(key) || { photos: [], main: '' }; saveCm(key, { photos: m.photos.concat([p]), main: m.main && m.photos.some((x) => x.id === m.main) ? m.main : p.id }); };
  const updPhoto = (key, id, patch) => { const m = cmeta(key); if (!m) return; saveCm(key, Object.assign({}, m, { photos: m.photos.map((x) => (x.id === id ? Object.assign({}, x, patch) : x)) })); };
  const delPhoto = (key, id) => { const m = cmeta(key); if (!m) return; const ph = m.photos.filter((x) => x.id !== id); saveCm(key, { photos: ph, main: ph.some((x) => x.id === m.main) ? m.main : (ph[0] ? ph[0].id : '') }); };
  const allSids = (key, exceptId) => { const m = cmeta(key), out = new Set(); (m ? m.photos : []).forEach((p) => { if (p.id !== exceptId) (p.faces || []).forEach((f) => { if (f.sid) out.add(f.sid); }); }); return out; };
  const pkey = (c, n) => (c.names.length > 1 ? c.key + '::' + norm(n) : c.key);
  const subStudents = (c, part) => studentsOf(c).filter((x) => !part || !x.kl || norm(x.kl) === part);
  function classPhotoCard(c) {
    const multi = c.names.length > 1, parts = multi ? c.names : [c.label];
    const one = (n) => {
      const key = pkey(c, n), part = multi ? norm(n) : '', m = cphoto(key), nm = multi ? 'Klasse ' + esc(String(n).toUpperCase()) : 'der Klasse', nS = subStudents(c, part).length;
      if (!m) return `<div class="kmphone"><div class="kmphdz" data-key="${esc(key)}" tabindex="0" role="button" aria-label="Foto ${nm} hierher ziehen oder klicken"><b>Foto ${nm} hierher ziehen</b><span class="muted sm">oder klicken, um eine Datei zu wählen</span><input type="file" accept="image/*" class="kmphf" data-key="${esc(key)}" hidden></div></div>`;
      const done = allSids(key).size, np = cmeta(key).photos.length;
      return `<div class="kmphone">${multi ? `<div class="kmphlab">Klasse ${esc(String(n).toUpperCase())}</div>` : ''}<button class="kmphth" data-act="kmphview" data-key="${esc(key)}" title="Klick zum Vergrößern" aria-label="Klassenfoto vergrößern"><img src="${fileUrl(m.file, m.v)}" alt="Klassenfoto ${esc(String(n))}"></button><div class="row" style="gap:8px;align-items:center;margin-top:6px"><span class="muted sm" style="flex:1">${done ? done + ' von ' + nS + ' Profilfotos zugeordnet' : 'Noch keine Profilfotos zugeordnet'}${np > 1 ? ' · ' + np + ' Fotos' : ''}</span><button class="btn sm" data-act="kmphopen" data-key="${esc(key)}" title="Gesichter erkennen und Namen zuordnen">✎ Bearbeiten</button></div></div>`;
    };
    return `<div class="card kmph"><h2>Klassenfoto</h2>${parts.map(one).join('')}</div>`;
  }
  async function newClassPhoto(key, file, quiet) {
    if (!file || !/^image\//.test(file.type)) { toast('Bitte ein Foto (Bilddatei) verwenden'); return null; }
    try { toast('Foto wird gespeichert …'); const sh = await shrinkImage(file, 2400), id = 'p' + Date.now().toString(36), path = 'Klassenfotos/' + key.replace(/[^a-z0-9äöüß]+/gi, '_') + '_' + id + '.jpg'; await putFile(path, sh.blob); addPhoto(key, { id, file: path, v: Date.now(), w: sh.w, h: sh.h, faces: [] }); if (!quiet) setTimeout(() => openPhoto(key, true, id), 300); return id; }
    catch (e) { toast(e.message || 'Foto konnte nicht gespeichert werden'); return null; }
  }
  let faceReady = null;
  function loadFaces() {
    if (faceReady) return faceReady;
    faceReady = (async () => {
      if (!window.faceapi) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = '/vendor/face-api.js'; s.onload = ok; s.onerror = () => no(new Error('Die Gesichtserkennung konnte nicht geladen werden')); document.head.appendChild(s); });
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/vendor/faceapi-models');
    })().catch((e) => { faceReady = null; throw e; });
    return faceReady;
  }
  const iou = (a, b) => { const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)), i = x * y; return i / (a.w * a.h + b.w * b.h - i || 1); };
  async function detectFaces(img) {
    await loadFaces(); const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const res = await faceapi.detectAllFaces(cv, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }));
    return res.map((r) => ({ x: r.box.x / cv.width, y: r.box.y / cv.height, w: r.box.width / cv.width, h: r.box.height / cv.height })).filter((b) => b.w > 0.01);
  }
  const sortFaces = (fs) => { const hs = fs.map((f) => f.h).sort((a, b) => a - b), mh = hs[Math.floor(hs.length / 2)] || 0.05; return fs.slice().sort((a, b) => { const ra = Math.round((a.y + a.h / 2) / (mh * 1.2)), rb = Math.round((b.y + b.h / 2) / (mh * 1.2)); return ra - rb || a.x - b.x; }); };
  function cropFace(img, f, size) {
    const cx = (f.x + f.w / 2) * img.naturalWidth, cy = (f.y + f.h / 2) * img.naturalHeight - f.h * img.naturalHeight * 0.04, side = Math.max(f.w * img.naturalWidth, f.h * img.naturalHeight) * 1.55, cv = document.createElement('canvas'); cv.width = cv.height = size;
    cv.getContext('2d').drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size); return cv;
  }
  function patchStudent(c, key, patch) {
    if (key === '__kv__') { const a = Object.assign({}, cfg().kvph || {}); if (patch.photo) a[c.key] = { photo: patch.photo, pv: patch.pv || Date.now(), pfrom: patch.pfrom || '' }; else delete a[c.key]; return saveCfg({ kvph: a }); }
    c.groups.forEach((G) => { const ci = cinfo(G.slug); if (!Array.isArray(ci.students) || !ci.students.some((x) => skey(x) === key)) return; put('settings', Object.assign({}, ci, { id: 'cn_' + G.slug, students: ci.students.map((x) => (skey(x) === key ? Object.assign({}, x, patch) : x)) })); });
  }
  const phPath = (key) => 'Schuelerfotos/' + key.replace(/[^a-z0-9äöüß]+/gi, '_') + '.jpg';
  /* Namen unter den Einzelbildern einer Foto-Collage lesen (Texterkennung lokal im Browser) und den Schülern zuordnen */
  const loadOcr = () => (window.Tesseract ? Promise.resolve(window.Tesseract) : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js'; sc.onload = () => ok(window.Tesseract); sc.onerror = () => no(new Error('Die Texterkennung konnte nicht geladen werden (Internetverbindung nötig)')); document.head.appendChild(sc); }));
  const nrm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z]+/g, ' ').trim();
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const wsim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length);
  function nameScore(text, st) {
    const words = nrm(text).split(' ').filter((w) => w.length > 2), toks = (nrm(st.vn) + ' ' + nrm(st.nn)).split(' ').filter((t) => t.length > 1); if (!words.length || !toks.length) return 0;
    let sc = 0; toks.forEach((t) => { let best = 0; words.forEach((w) => { best = Math.max(best, wsim(t, w)); }); if (best >= (t.length <= 3 ? 0.99 : 0.76)) sc += best; }); return sc / toks.length;
  }
  async function ocrNames(img, fs, idxs, prog) {
    const T = await loadOcr(), wk = await T.createWorker('deu'); try { await wk.setParameters({ tessedit_pageseg_mode: '6' }); } catch (e) { /* */ }
    const W = img.naturalWidth, H = img.naturalHeight, out = [];
    try {
      for (let k = 0; k < idxs.length; k++) {
        prog(k + 1, idxs.length); const f = fs[idxs[k]], fx = f.x * W, fy = f.y * H, fw = f.w * W, fh = f.h * H, cx = fx + fw / 2, cy = fy + fh / 2;
        const same = fs.filter((g, j) => j !== idxs[k] && Math.abs((g.y + g.h / 2) * H - cy) < fh * 0.7), dist = same.map((g) => Math.abs((g.x + g.w / 2) * W - cx)).filter((d) => d > fw * 0.5), half = dist.length ? Math.max(fw * 0.8, Math.min(fw * 2, Math.min(...dist) / 2)) : fw * 1.3;
        const below = fs.filter((g) => g.y * H > fy + fh + fh * 0.4 && Math.abs((g.x + g.w / 2) * W - cx) < half * 1.2).map((g) => g.y * H), y0 = Math.min(H - 2, fy + fh), y1 = Math.min(H, below.length ? Math.min(...below) : H, fy + fh + fh * 2.6), x0 = Math.max(0, cx - half), x1 = Math.min(W, cx + half);
        if (y1 - y0 < 8 || x1 - x0 < 8) { out.push(''); continue; }
        const sc = Math.min(4, Math.max(1, 150 / (y1 - y0))), cv = document.createElement('canvas'); cv.width = Math.round((x1 - x0) * sc); cv.height = Math.round((y1 - y0) * sc); const cc = cv.getContext('2d'); cc.fillStyle = '#fff'; cc.fillRect(0, 0, cv.width, cv.height); cc.drawImage(img, x0, y0, x1 - x0, y1 - y0, 0, 0, cv.width, cv.height);
        const r = await wk.recognize(cv); out.push((r.data.text || '').replace(/\s+/g, ' ').trim());
      }
    } finally { await wk.terminate(); }
    return out;
  }
  /* Ganze Collage lesen: Wörter mit Position, dann Namen den Gesichtern über der Beschriftung zuordnen */
  async function ocrWords(img) {
    const T = await loadOcr(), wk = await T.createWorker('deu'); try { await wk.setParameters({ tessedit_pageseg_mode: '11' }); } catch (e) { /* */ }
    const W = img.naturalWidth, H = img.naturalHeight, k = Math.min(3, Math.max(1, 2400 / Math.max(W, H))), cv = document.createElement('canvas'); cv.width = Math.round(W * k); cv.height = Math.round(H * k); const cc = cv.getContext('2d'); cc.fillStyle = '#fff'; cc.fillRect(0, 0, cv.width, cv.height); cc.drawImage(img, 0, 0, cv.width, cv.height);
    try { const r = await wk.recognize(cv); return (r.data.words || []).filter((w) => w.text && w.confidence > 25).map((w) => ({ t: w.text, x0: w.bbox.x0 / k, y0: w.bbox.y0 / k, x1: w.bbox.x1 / k, y1: w.bbox.y1 / k })); } finally { await wk.terminate(); }
  }
  function matchLabels(words, sts, fs, W, H) {
    const ws = words.map((w) => Object.assign({ n: nrm(w.t) }, w)).filter((w) => w.n.length > 2), labels = [], cx = (w) => (w.x0 + w.x1) / 2, cy = (w) => (w.y0 + w.y1) / 2;
    sts.forEach((st0) => {
      const tv = nrm(st0.vn).split(' ').filter((x) => x.length > 1), tn = nrm(st0.nn).split(' ').filter((x) => x.length > 1);
      const hits = (toks) => { const a = []; ws.forEach((w) => toks.forEach((t) => { const sc = wsim(t, w.n); if (sc >= (t.length <= 3 ? 0.99 : 0.76)) a.push({ w, sc, t }); })); return a; };
      const hv = hits(tv), hn = hits(tn); let any = false;
      hv.forEach((a) => hn.forEach((b) => { if (a.w === b.w) return; const h = Math.max(a.w.y1 - a.w.y0, b.w.y1 - b.w.y0), dx = Math.max(0, Math.max(a.w.x0, b.w.x0) - Math.min(a.w.x1, b.w.x1)), dy = Math.abs(cy(a.w) - cy(b.w)); if (dx > h * 4 || dy > h * 2.4) return; any = true; labels.push({ key: skey(st0), sc: (a.sc + b.sc) / 2, x: (cx(a.w) + cx(b.w)) / 2, y: (cy(a.w) + cy(b.w)) / 2 }); }));
      if (!any) hv.concat(hn).forEach((a) => { if (sts.some((o) => o !== st0 && nrm(o.vn + ' ' + o.nn).split(' ').some((t) => t.length > 1 && wsim(t, a.t) >= 0.85))) return; labels.push({ key: skey(st0), sc: a.sc * 0.55, x: cx(a.w), y: cy(a.w) }); });
    });
    const pairs = []; labels.forEach((L) => fs.forEach((f, i) => { if (f.sid || f.skip) return; const fw = f.w * W, fh = f.h * H, fcx = (f.x + f.w / 2) * W, fb = (f.y + f.h) * H, dx = Math.abs(L.x - fcx) / fw, dy = (L.y - fb) / fh; if (dx > 1.4 || dy < -0.3 || dy > 3.6) return; pairs.push({ i, key: L.key, sc: L.sc, cost: dx + 0.3 * Math.max(0, dy) - (L.sc - 0.5) * 0.6 }); }));
    pairs.sort((a, b) => a.cost - b.cost); const fu = new Set(), su = new Set(), out = [];
    pairs.forEach((p) => { if (fu.has(p.i) || su.has(p.key)) return; fu.add(p.i); su.add(p.key); out.push(p); }); return out;
  }
  function viewPhoto(key, src0) {
    const m = src0 ? { file: '', v: 0 } : cphoto(key); if (!m || document.getElementById('kmphview')) return;
    const o = document.createElement('div'); o.id = 'kmphview'; o.className = 'kmphov kmphvw'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.innerHTML = `<button class="btn sm kmphvx" aria-label="Schließen">Schließen ✕</button><img src="${src0 || fileUrl(m.file, m.v)}" alt="Foto" draggable="false">`;
    const close = () => { o.remove(); document.removeEventListener('keydown', onK); }, onK = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', close); document.addEventListener('keydown', onK); document.body.appendChild(o);
  }
  async function openPhoto(key, autoDetect, pid, focusSid) {
    if (document.getElementById('kmphov')) return;
    const ck = key.split('::')[0], part = key.includes('::') ? key.split('::')[1] : '', getC = () => classes().find((k) => k.key === ck); if (!getC() || !cphoto(key)) return;
    const partName = () => { const c = getC(); return part && c ? (c.names.find((n) => norm(n) === part) || part) : ''; }, subs = () => peopleOf(getC(), part);
    const o = document.createElement('div'); o.id = 'kmphov'; o.className = 'kmphov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); document.body.appendChild(o);
    const st = { cur: pid || (cmeta(key) || {}).main, img: null, act: -1, pend: null, pop: null, popEl: null, hot: -1, draw: false, busy: false, msg: '', thumbs: {} };
    const cp = () => cphoto(key, st.cur), faces = () => (cp() || {}).faces || [], setFaces = (fs) => updPhoto(key, cp().id, { faces: fs }), usedElsewhere = () => allSids(key, cp() && cp().id);
    const close = () => { clearTimeout(st.tm); closePop(); o.remove(); document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown, true); }, closePop = () => { if (st.popEl) st.popEl.remove(); st.popEl = null; st.pop = null; },
    onDown = (e) => { if (st.popEl && !e.target.closest('.kmpop') && !e.target.closest('.kmfx')) closePop(); },
    popList = (i) => { const others = new Set(faces().filter((f, j) => j !== i).map((f) => f.sid).filter(Boolean)); usedElsewhere().forEach((k) => others.add(k)); return subs().filter((x) => !others.has(skey(x))).sort((a, b) => (a.nn + a.vn).localeCompare(b.nn + b.vn, 'de')); },
    drawPop = () => {
      const pp = st.pop; if (!pp) return; const f = faces()[pp.i], list = popList(pp.i); if (!st.popEl) { st.popEl = document.createElement('div'); st.popEl.className = 'kmpop'; document.body.appendChild(st.popEl); }
      st.popEl.innerHTML = `<div class="kmpoph"><b>Gesicht ${pp.i + 1}</b><span class="muted sm"> · Name wählen</span><button class="kmpx" data-pc aria-label="Schließen">×</button></div><div class="kmpopl">${list.length ? list.map((x) => `<button class="kmpi${skey(x) === pp.hl ? ' hl' : ''}" data-sid="${esc(skey(x))}">${esc(dname(x))}${skey(x) === (f && f.sid) ? ' ✓' : ''}</button>`).join('') : '<div class="muted sm" style="padding:8px">Alle Namen sind schon vergeben.</div>'}</div><div class="kmpopf muted sm">Buchstabe tippen = springen · Enter = übernehmen${f && f.sid ? ' <button class="kmpclr" data-clr>Zuordnung entfernen</button>' : ''}</div>`;
      const el = st.popEl, w = 250, h = Math.min(el.offsetHeight || 360, innerHeight * 0.7); el.style.left = Math.max(6, Math.min(pp.x + 12, innerWidth - w - 8)) + 'px'; el.style.top = Math.max(6, Math.min(pp.y + 12, innerHeight - h - 8)) + 'px';
      const hl = el.querySelector('.kmpi.hl'); if (hl) hl.scrollIntoView({ block: 'nearest' });
    },
    pick = async (i, sid) => { closePop(); await assign(i, sid); const fs2 = faces(); const nx = fs2.findIndex((f, j) => j !== i && !f.sid && !f.skip); st.act = nx < 0 ? i : nx; paint(); },
    onKey = (e) => {
      if (e.key === 'Escape') { if (st.popEl) { closePop(); } else if (st.draw) { st.draw = false; paint(); } else close(); return; }
      if (st.popEl && st.pop) {
        const pp = st.pop, list = popList(pp.i);
        if (e.key === 'Enter') { e.preventDefault(); if (pp.hl) pick(pp.i, pp.hl); return; }
        if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); const i = pp.i; closePop(); assign(i, ''); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const ix = list.findIndex((x) => skey(x) === pp.hl), n = list.length; if (n) { pp.hl = skey(list[(ix + (e.key === 'ArrowDown' ? 1 : -1) + n) % n]); drawPop(); } return; }
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && /[a-zäöüß]/i.test(e.key)) {
          e.preventDefault(); const L = nrm(e.key)[0] || e.key.toLowerCase(); let l2 = list.filter((x) => nrm(x.nn).startsWith(L)); if (!l2.length) l2 = list.filter((x) => nrm(x.vn).startsWith(L));
          if (l2.length) { const ix = l2.findIndex((x) => skey(x) === pp.hl); pp.hl = skey(l2[(ix + 1) % l2.length]); drawPop(); }
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || st.draw || st.busy || (e.target.closest && e.target.closest('select, input, textarea'))) return;
      const fs = faces(); if (!fs.length) return;
      const firstOpen = () => { const j = fs.findIndex((f) => !f.sid && !f.skip); return j < 0 ? 0 : j; };
      if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); flush(); let j = (st.act < 0 ? -1 : st.act); for (let k = 1; k <= fs.length; k++) { const t = (j + k) % fs.length; if (e.key !== 'Enter' || !faces()[t].sid) { j = t; break; } if (k === fs.length) j = (j + 1) % fs.length; } st.act = j; paint(); const r = o.querySelector('.kmfcr.act'); if (r) r.scrollIntoView({ block: 'nearest' }); return; }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); flush(); st.act = (st.act <= 0 ? fs.length : st.act) - 1; paint(); const r = o.querySelector('.kmfcr.act'); if (r) r.scrollIntoView({ block: 'nearest' }); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { if (st.act >= 0) { e.preventDefault(); st.pend = null; clearTimeout(st.tm); assign(st.act, ''); } return; }
      if (e.key.length === 1 && /[a-zäöüß]/i.test(e.key)) {
        e.preventDefault(); if (st.act < 0 || !fs[st.act]) st.act = firstOpen(); const i = st.act, L = nrm(e.key)[0] || e.key.toLowerCase(), others = new Set(fs.filter((f, j) => j !== i).map((f) => f.sid).filter(Boolean).concat([...usedElsewhere()]));
        let list = subs().filter((x) => !others.has(skey(x)) && nrm(x.nn).startsWith(L)); if (!list.length) list = subs().filter((x) => !others.has(skey(x)) && nrm(x.vn).startsWith(L));
        list.sort((a, b) => (a.nn + a.vn).localeCompare(b.nn + b.vn, 'de')); const m = o.querySelector('.kmphmsg');
        if (!list.length) { if (m) m.textContent = 'Kein freier Name mit „' + e.key.toUpperCase() + '“.'; return; }
        const cur = st.pend && st.pend.i === i ? st.pend.sid : fs[i].sid, ix = list.findIndex((x) => skey(x) === cur), nx = list[(ix + 1) % list.length];
        st.pend = { i, sid: skey(nx) }; const sel = o.querySelector('.kmfcr[data-i="' + i + '"] select'); if (sel) sel.value = skey(nx);
        if (m) m.textContent = e.key.toUpperCase() + ': ' + dname(nx) + ' (' + ((ix + 1) % list.length + 1) + ' von ' + list.length + ') · weiter mit demselben Buchstaben, Enter = nächstes Gesicht';
        clearTimeout(st.tm); st.tm = setTimeout(flush, 700);
      }
    }, flush = () => { clearTimeout(st.tm); const p = st.pend; st.pend = null; if (p && faces()[p.i] && faces()[p.i].sid !== p.sid) return assign(p.i, p.sid); };
    document.addEventListener('keydown', onKey);
    async function assign(i, sid) {
      const c = getC(), fs = faces().map((f) => Object.assign({}, f)), old = fs[i] && fs[i].sid;
      if (old && old !== sid) { const os = peopleOf(c, part).find((x) => skey(x) === old); if (os && os.pfrom === 'klassenfoto') patchStudent(c, old, { photo: '', pfrom: '' }); }
      fs.forEach((f, j) => { if (sid && f.sid === sid && j !== i) { f.sid = ''; } }); fs[i].sid = sid || ''; if (sid) fs[i].skip = false;
      if (sid) { try { const cv = cropFace(st.img, fs[i], 256), blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.88)), path = sid === '__kv__' ? phPath('kv_' + c.key) : phPath(sid); await putFile(path, blob); patchStudent(c, sid, { photo: path, pv: Date.now(), pfrom: 'klassenfoto' }); st.msg = 'Profilfoto gespeichert.'; } catch (e) { st.msg = e.message || 'Profilfoto konnte nicht gespeichert werden.'; } }
      setFaces(fs); paint();
    }
    async function names() {
      const sts0 = subs(), fs0 = faces().map((f) => Object.assign({}, f));
      if (!fs0.some((f) => !f.sid && !f.skip)) { st.msg = 'Alle Gesichter sind schon zugeordnet.'; return paint(); }
      if (!sts0.length) { st.msg = 'In dieser Klasse gibt es noch keine Schüler, denen Namen zugeordnet werden könnten.'; return paint(); }
      st.busy = true; st.msg = 'Die Beschriftungen im Foto werden gelesen … (beim ersten Mal wird die Texterkennung geladen)'; paint(); st.cnt = 0;
      try {
        const used0 = new Set(fs0.map((f) => f.sid).filter(Boolean).concat([...usedElsewhere()])), words = await ocrWords(st.img), pick = matchLabels(words, sts0.filter((x) => !used0.has(skey(x))), fs0, st.img.naturalWidth, st.img.naturalHeight);
        for (const x of pick) await assign(x.i, x.key); st.cnt = pick.length;
      } catch (e) { st.msg = 'Die Beschriftungen konnten nicht gelesen werden: ' + (e.message || e); }
      return namesRegion();
    }
    async function namesRegion() {
      const c = getC(), sts = subs(), fs = faces().map((f) => Object.assign({}, f)), idxs = fs.map((f, i) => i).filter((i) => !fs[i].sid && !fs[i].skip);
      if (!idxs.length) { st.msg = (st.cnt || 0) + ' Namen automatisch zugeordnet. Bitte kontrolliere die Zuordnung.'; st.busy = false; return paint(); }
      st.busy = true; st.msg = 'Weitere Namen werden gesucht …'; paint();
      try {
        const texts = await ocrNames(st.img, fs, idxs, (k, n) => { st.msg = 'Namen lesen … ' + k + ' von ' + n; const m = o.querySelector('.kmphmsg'); if (m) m.textContent = st.msg; });
        idxs.forEach((i, k) => { fs[i].t = (texts[k] || '').slice(0, 70); });
        const used = new Set(fs.map((f) => f.sid).filter(Boolean).concat([...usedElsewhere()])), cand = [];
        idxs.forEach((i) => { const sc = sts.filter((x) => !used.has(skey(x))).map((x) => ({ i, key: skey(x), sc: nameScore(fs[i].t, x) })).sort((a, b) => b.sc - a.sc); if (sc[0] && sc[0].sc >= 0.45 && (!sc[1] || sc[1].sc < sc[0].sc - 0.2 || sc[0].sc >= 0.95)) cand.push(sc[0]); });
        cand.sort((a, b) => b.sc - a.sc); const pick = [], taken = new Set(); cand.forEach((x) => { if (!taken.has(x.key)) { taken.add(x.key); pick.push(x); } });
        setFaces(fs); st.thumbs = {};
        for (const x of pick) await assign(x.i, x.key);
        const tot = (st.cnt || 0) + pick.length; st.msg = tot ? tot + ' Namen automatisch zugeordnet. Bitte kontrolliere die Zuordnung und ergänze den Rest. Tipp: Gesicht anklicken und den Anfangsbuchstaben des Nachnamens drücken.' : 'Es konnten keine Namen sicher zugeordnet werden. Klicke ein Gesicht an und drücke den Anfangsbuchstaben des Nachnamens, mehrfach zum Weiterschalten.';
      } catch (e) { st.msg = 'Die Namen konnten nicht gelesen werden: ' + (e.message || e); }
      st.busy = false; paint();
    }
    async function run() {
      st.busy = true; st.msg = 'Gesichter werden gesucht … (läuft nur auf diesem Gerät, beim ersten Mal wird das Modell geladen)'; paint();
      try {
        const found = await detectFaces(st.img), keep = faces().filter((f) => f.sid), add = found.filter((b) => !keep.some((k) => iou(k, b) > 0.25)), fs = sortFaces(add.concat(keep).map((f) => ({ x: f.x, y: f.y, w: f.w, h: f.h, sid: f.sid || '', t: f.t || '', skip: !!f.skip })));
        setFaces(fs); st.msg = found.length ? found.length + ' Gesichter erkannt.' : 'Es wurden keine Gesichter erkannt. Nutze „Gesicht markieren“ und ziehe einen Rahmen um das Gesicht.';
        if (found.length) { st.busy = false; paint(); return names(); }
      } catch (e) { st.msg = 'Die Erkennung ist fehlgeschlagen: ' + (e.message || e) + ' Du kannst Gesichter mit „Gesicht markieren“ von Hand einzeichnen.'; }
      st.busy = false; paint();
    }
    function paint() {
      const c = getC(), m = cp(); if (!c || !m) return close(); const ml = cmeta(key);
      const fs = faces(), sts = subs().slice().sort((a, b) => (a.nn + a.vn).localeCompare(b.nn + b.vn, 'de')), used = new Set(fs.map((f) => f.sid).filter(Boolean).concat([...usedElsewhere()])), nmMap = new Map(peopleOf(c, part).map((x) => [skey(x), dname(x)])), nmOf = (k) => nmMap.get(k) || '';
      const grp = (f) => (f.sid ? 1 : f.skip ? 2 : 0), order = fs.map((f, i) => i).sort((a, b) => grp(fs[a]) - grp(fs[b]) || (grp(fs[a]) === 1 ? nmOf(fs[a].sid).localeCompare(nmOf(fs[b].sid), 'de') : a - b));
      const boxes = fs.map((f, i) => `<div class="kmfx${f.sid ? ' ok' : ''}${st.hot === i ? ' hot' : ''}${st.act === i ? ' act' : ''}" data-i="${i}" style="left:${f.x * 100}%;top:${f.y * 100}%;width:${f.w * 100}%;height:${f.h * 100}%"><b>${i + 1}</b><span class="kmtip${f.y > 0.78 ? ' up' : ''}">${f.sid && nmOf(f.sid) ? `<span class="kmtipn">${esc(nmOf(f.sid))}</span><button class="kmtipx" data-tx="${i}" title="Zuordnung löschen und neu wählen" aria-label="Zuordnung löschen">×</button>` : '<span class="kmtipn muted">nicht zugeordnet · klicken</span>'}</span></div>`).join('');
      const rows = order.map((i) => { const f = fs[i]; if (!st.thumbs[i + '|' + f.x + f.y + f.w]) { try { st.thumbs[i + '|' + f.x + f.y + f.w] = cropFace(st.img, f, 72).toDataURL('image/jpeg', 0.8); } catch (e) { /* */ } } return `<div class="kmfcr${st.hot === i ? ' hot' : ''}${st.act === i ? ' act' : ''}" data-i="${i}"><img src="${st.thumbs[i + '|' + f.x + f.y + f.w] || ''}" alt=""><b>${i + 1}</b><div style="min-width:0"><select data-i="${i}" aria-label="Name zu Gesicht ${i + 1}"><option value="">– wer ist das? –</option>${sts.filter((x) => !used.has(skey(x)) || skey(x) === f.sid).map((x) => `<option value="${esc(skey(x))}"${skey(x) === f.sid ? ' selected' : ''}>${esc(dname(x))}</option>`).join('')}</select>${f.t && !f.sid ? `<small class="muted" style="display:block;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="Gelesener Text unter dem Bild">gelesen: ${esc(f.t)}</small>` : ''}</div><button class="kmfd" data-del="${i}" title="${f.sid ? 'Zuordnung entfernen, Feld nach unten' : 'Gesicht löschen'}" aria-label="${f.sid ? 'Zuordnung entfernen' : 'Gesicht löschen'}">×</button></div>`; }).join('');
      o.innerHTML = `<div class="kmphbox"><div class="kmphtop"><h3>Klassenfoto ${part ? esc(String(partName()).toUpperCase()) : disp(c)}</h3><span style="flex:1"></span><button class="btn sm good" data-x="run"${st.busy ? ' disabled' : ''}>Gesichter erkennen</button><button class="btn sm" data-x="names" title="Liest die Namen unter den Einzelbildern der Collage und ordnet sie zu"${st.busy ? ' disabled' : ''}>Namen lesen</button><button class="btn sm${st.draw ? ' good' : ''}" data-x="draw" title="Ziehe auf dem Foto einen Rahmen um ein Gesicht">${st.draw ? 'Rahmen ziehen …' : 'Gesicht markieren'}</button><button class="btn sm" data-x="add" title="Weiteres Foto derselben Klasse hinzufügen, zum Beispiel wenn auf dem ersten Personen fehlen">+ Weiteres Foto</button><button class="btn sm" data-x="rep">Foto ersetzen</button><button class="btn sm bad" data-x="del">Foto löschen</button><button class="btn sm" data-x="close">Schließen ✕</button><input type="file" accept="image/*" id="kmphrep" hidden><input type="file" accept="image/*" id="kmphadd" hidden></div>${ml.photos.length > 1 ? `<div class="kmphstrip"><span class="muted sm">Fotos dieser Klasse:</span>${ml.photos.map((p, k) => `<button class="kmphs${p.id === m.id ? ' on' : ''}" data-ph="${p.id}" title="Foto ${k + 1} bearbeiten"><img src="${fileUrl(p.file, p.v)}" alt="Foto ${k + 1}">${p.id === ml.main ? '<b title="Wird als Klassenfoto angezeigt">★</b>' : ''}</button>`).join('')}${m.id === ml.main ? '<span class="muted sm">★ wird als Klassenfoto angezeigt</span>' : '<button class="btn sm good" data-x="main">★ Als Klassenfoto anzeigen</button>'}</div>` : ''}
        <div class="kmphmsg muted sm" role="status">${esc(st.msg || (fs.length ? '' : 'Noch keine Gesichter. Klicke auf „Gesichter erkennen“.'))}</div>
        <div class="kmphbody"><div class="kmphimgw"><div class="kmphimg${st.draw ? ' drawing' : ''}" id="kmphimg"><img src="${fileUrl(m.file, m.v)}" alt="Klassenfoto" draggable="false">${boxes}</div></div><div class="kmphside"><div class="muted sm" style="margin-bottom:6px">${fs.filter((f) => f.sid).length} von ${sts.length} Personen zugeordnet</div>${rows || '<div class="muted sm">Noch keine Gesichter.</div>'}</div></div></div>`;
    }
    o.addEventListener('click', async (e) => {
      if (e.target === o) return close(); const b = e.target.closest('[data-x]'), d = e.target.closest('[data-del]'), bx = e.target.closest('.kmfx');
      const ph = e.target.closest('[data-ph]'); if (ph) { await switchTo(ph.dataset.ph); return; }
      const tx = e.target.closest('[data-tx]');
      if (tx) { const i = +tx.dataset.tx, X = e.clientX, Y = e.clientY; st.act = i; await assign(i, ''); const list = popList(i); st.pop = { i, x: X, y: Y, hl: list[0] ? skey(list[0]) : '' }; drawPop(); return; }
      if (d && faces()[+d.dataset.del] && faces()[+d.dataset.del].sid) { const i = +d.dataset.del; await assign(i, ''); const fs = faces().map((f) => Object.assign({}, f)); fs[i].skip = true; st.thumbs = {}; setFaces(fs); if (st.act === i) st.act = -1; return paint(); }
      if (d) { const fs = faces().slice(), f = fs[+d.dataset.del]; if (f && f.sid) { const c = getC(), os = peopleOf(c, part).find((x) => skey(x) === f.sid); if (os && os.pfrom === 'klassenfoto') patchStudent(c, f.sid, { photo: '', pfrom: '' }); } fs.splice(+d.dataset.del, 1); st.thumbs = {}; setFaces(fs); return paint(); }
      if (bx && !st.draw) { st.act = +bx.dataset.i; const f0 = faces()[st.act]; st.pop = { i: st.act, x: e.clientX, y: e.clientY, hl: (f0 && f0.sid) || (popList(st.act)[0] ? skey(popList(st.act)[0]) : '') }; paint(); drawPop(); const r = o.querySelector('.kmfcr[data-i="' + st.act + '"]'); if (r) r.scrollIntoView({ block: 'nearest' }); return; }
      const rw = e.target.closest('.kmfcr'); if (rw && !e.target.closest('select, button')) { st.act = +rw.dataset.i; paint(); return; }
      if (!b) return; const a = b.dataset.x;
      if (a === 'close') close(); else if (a === 'run') run(); else if (a === 'names') names(); else if (a === 'draw') { st.draw = !st.draw; paint(); }
      else if (a === 'rep') o.querySelector('#kmphrep').click(); else if (a === 'add') o.querySelector('#kmphadd').click(); else if (a === 'main') { const m0 = cmeta(key); saveCm(key, Object.assign({}, m0, { main: st.cur })); paint(); }
      else if (a === 'del') { if (!confirm('Dieses Foto löschen? Bereits gespeicherte Profilfotos bleiben erhalten.')) return; const m = cp(); try { await fetch('/api/file?path=' + encodeURIComponent(m.file), { method: 'DELETE', credentials: 'same-origin' }); } catch (e2) { /* */ } delPhoto(key, m.id); const rest = cmeta(key); if (!rest) return close(); await switchTo(rest.main); }
    });
    o.addEventListener('change', async (e) => {
      if (e.target.id === 'kmphrep') { const f = e.target.files[0]; if (!f) return; const old = cp(), wasMain = cmeta(key).main === old.id, id = await newClassPhoto(key, f, true); if (!id) return; try { await fetch('/api/file?path=' + encodeURIComponent(old.file), { method: 'DELETE', credentials: 'same-origin' }); } catch (e2) { /* */ } if (wasMain) saveCm(key, Object.assign({}, cmeta(key), { main: id })); delPhoto(key, old.id); await switchTo(id); run(); return; }
      if (e.target.id === 'kmphadd') { const f = e.target.files[0]; e.target.value = ''; if (!f) return; const id = await newClassPhoto(key, f, true); if (!id) return; await switchTo(id); run(); return; }
      const sel = e.target.closest('select[data-i]'); if (sel) assign(+sel.dataset.i, sel.value);
    });
    o.addEventListener('mouseover', (e) => { const t = e.target.closest('.kmfx, .kmfcr'); const i = t ? +t.dataset.i : -1; if (i !== st.hot) { st.hot = i; o.querySelectorAll('.kmfx,.kmfcr').forEach((x) => x.classList.toggle('hot', +x.dataset.i === i)); } });
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('click', (e) => {
      const pe = st.popEl; if (!pe || !pe.contains(e.target)) return; const b = e.target.closest('button'); if (!b || !st.pop) return;
      if (b.dataset.sid) pick(st.pop.i, b.dataset.sid); else if (b.dataset.pc !== undefined) closePop(); else if (b.dataset.clr !== undefined) { const i = st.pop.i; closePop(); assign(i, ''); }
    });
    let dr = null;
    o.addEventListener('pointerdown', (e) => { const w = e.target.closest('#kmphimg'); if (!st.draw || !w || e.button) return; e.preventDefault(); const r = w.getBoundingClientRect(); dr = { r, x0: (e.clientX - r.left) / r.width, y0: (e.clientY - r.top) / r.height, el: document.createElement('div') }; dr.el.className = 'kmfx hot'; w.appendChild(dr.el); w.setPointerCapture && w.setPointerCapture(e.pointerId); });
    o.addEventListener('pointermove', (e) => { if (!dr) return; const x = Math.max(0, Math.min(1, (e.clientX - dr.r.left) / dr.r.width)), y = Math.max(0, Math.min(1, (e.clientY - dr.r.top) / dr.r.height)); Object.assign(dr.el.style, { left: Math.min(dr.x0, x) * 100 + '%', top: Math.min(dr.y0, y) * 100 + '%', width: Math.abs(x - dr.x0) * 100 + '%', height: Math.abs(y - dr.y0) * 100 + '%' }); });
    o.addEventListener('pointerup', (e) => { if (!dr) return; const d = dr; dr = null; const x = Math.max(0, Math.min(1, (e.clientX - d.r.left) / d.r.width)), y = Math.max(0, Math.min(1, (e.clientY - d.r.top) / d.r.height)), f = { x: Math.min(d.x0, x), y: Math.min(d.y0, y), w: Math.abs(x - d.x0), h: Math.abs(y - d.y0), sid: '' }; d.el.remove(); st.draw = false; if (f.w * d.r.width < 14 || f.h * d.r.height < 14) { st.msg = 'Der Rahmen war zu klein. Ziehe ihn um das ganze Gesicht.'; return paint(); } st.thumbs = {}; setFaces(sortFaces(faces().concat([f]))); st.msg = 'Gesicht hinzugefügt. Wähle rechts den Namen.'; paint(); });
    async function switchTo(id) { st.cur = id; st.img = null; st.thumbs = {}; st.act = -1; st.msg = ''; closePop(); paint(); try { const p = cp(); st.img = await loadImgUrl(fileUrl(p.file, p.v)); } catch (e) { st.msg = e.message; } st.act = faces().findIndex((f) => !f.sid && !f.skip); paint(); }
    try { st.img = await loadImgUrl(fileUrl(cp().file, cp().v)); } catch (e) { st.msg = e.message; }
    st.act = faces().findIndex((f) => !f.sid); paint();
    if (focusSid && st.img) { const idx = faces().findIndex((f) => f.sid === focusSid); if (idx >= 0) { st.act = idx; paint(); const bxe = o.querySelector('.kmfx[data-i="' + idx + '"]'); if (bxe) { bxe.scrollIntoView({ block: 'center', inline: 'center' }); const r = bxe.getBoundingClientRect(); st.pop = { i: idx, x: r.right, y: r.top, hl: focusSid }; drawPop(); } } else { const pn = peopleOf(getC(), part).find((x) => skey(x) === focusSid); st.msg = 'Dieses Foto ist noch keinem Gesicht zugeordnet. Klicke auf das Gesicht von ' + (pn ? dname(pn) : 'der Person') + ' und wähle den Namen.'; paint(); } return; } if (autoDetect && st.img) run(); else if (st.img && faces().some((f) => !f.sid && !f.t) && subs().length) names();
  }
  /* Foto in der Schülerliste beim Darüberfahren vergrößern */
  let zoomEl = null;
  const hideZoom = () => { if (zoomEl) { zoomEl.remove(); zoomEl = null; } };
  document.addEventListener('mouseover', (e) => {
    const a = e.target.closest && e.target.closest('.kmav'); if (!a) return; const im = a.querySelector('img'); if (!im) return; hideZoom();
    zoomEl = document.createElement('div'); zoomEl.className = 'kmavzoom'; zoomEl.innerHTML = '<img alt="" src="' + im.src.replace(/"/g, '') + '">'; document.body.appendChild(zoomEl);
    const r = a.getBoundingClientRect(), w = 240; zoomEl.style.left = Math.max(6, Math.min(r.right + 10, innerWidth - w - 8)) + 'px'; zoomEl.style.top = Math.max(6, Math.min(r.top - 90, innerHeight - w - 8)) + 'px';
  });
  document.addEventListener('mouseout', (e) => { const a = e.target.closest && e.target.closest('.kmav'); if (a && !a.contains(e.relatedTarget)) hideZoom(); });
  document.addEventListener('scroll', hideZoom, true);
  document.addEventListener('dragover', (e) => { if (e.target.closest && e.target.closest('.kmphdz') && [...(e.dataTransfer ? e.dataTransfer.types : [])].includes('Files')) { e.preventDefault(); e.target.closest('.kmphdz').classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = e.target.closest && e.target.closest('.kmphdz'); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => { const z = e.target.closest && e.target.closest('.kmphdz'); if (!z) return; e.preventDefault(); z.classList.remove('over'); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) newClassPhoto(z.dataset.key, f); });
  document.addEventListener('click', (e) => { const z = e.target.closest && e.target.closest('.kmphdz'); if (z && !e.target.matches('input')) { const i = z.querySelector('input.kmphf'); if (i) i.click(); } });
  document.addEventListener('change', (e) => { const i = e.target; if (i.classList && i.classList.contains('kmphf')) { const f = i.files[0]; if (f) newClassPhoto(i.dataset.key, f); i.value = ''; } });

  function general(c) {
    const sts = studentsOf(c), m = sts.filter((s) => s.g === 'm').length, w = sts.filter((s) => s.g === 'w').length, o = sts.length - m - w;
    const c0 = cfg(), isKv = norm(c0.kvClass || '') === c.key, editKv = U.kmKvEdit === c.key;
    const kvName = kvNameOf(c), kvp = kvPh(c);
    const subj = c.groups.filter((G) => kind(G)).map((G) => `<div class="kmsj"><b>${SUBJ[kind(G)]}</b>${G.day ? ' <span class="muted sm">(' + esc(G.day) + ')</span>' : ''}${timeRows(G).length ? timeHtml(timeRows(G)) : '<div class="muted sm">keine Stunden im Stundenplan</div>'}</div>`).join('');
    const kvRow = editKv
      ? `<input class="kminp" id="kmkvin" data-ch="kmkvn" data-key="${c.key}" value="${esc(kvName === 'Ich' && !(c0.kvn && c0.kvn[c.key]) ? '' : kvName)}" placeholder="Name des Klassenvorstands" autocomplete="off">`
      : `<span class="kmv kmkvv">${kvp && kvp.photo ? `<button class="kmkvph" data-act="kmimgview" data-src="${esc(fileUrl(kvp.photo, kvp.pv))}" title="Klick zum Vergrößern" aria-label="Foto des Klassenvorstands vergrößern"><img src="${fileUrl(kvp.photo, kvp.pv)}" alt=""></button>` : ''}${kvName ? esc(kvName) : '<span class="muted">nicht eingetragen</span>'}</span>`;
    return `<!--H--><div class="kmh"><h1>Klasse ${disp(c)}</h1></div><!--/H-->
    <div class="kmgrid">
      <div class="card"><h2>Überblick</h2>
        <div class="kmkvr"><span class="kmk">Klassenvorstand</span><span style="flex:1"></span><button class="kmpen" data-act="kmkvedit" data-key="${c.key}" title="${editKv ? 'Fertig' : 'Klassenvorstand bearbeiten'}" aria-label="Klassenvorstand bearbeiten">${editKv ? '✓' : '✎'}</button></div>
        <div class="kmkvr kmkv2">${kvRow}</div>
        <div class="kmkvr"><span class="kmk">Schüleranzahl</span><span class="kmv">${sts.length ? sts.length + ' (' + m + 'm / ' + w + 'w' + (o ? ' / ' + o + ' ohne Angabe' : '') + ')' : '<span class="muted">noch keine Schüler</span>'}</span></div>
        <label class="kmchk"><input type="checkbox" data-ch="kmkvme" data-key="${c.key}" ${isKv ? 'checked' : ''}> Das ist meine Klasse als Klassenvorstand (steht immer zuerst)</label></div>
      <div class="card"><h2>Meine Stunden</h2>${subj || '<div class="muted sm">Keine Stunden</div>'}</div>
      ${classPhotoCard(c)}
    </div>
    ${isKv ? `<div class="card" style="margin-top:14px"><h2>Klassenvorstand-Übersicht</h2><p class="muted sm" style="margin:0">Lehrpersonen mit Fächern und Notenübersicht aller Fächer folgen in einem späteren Schritt.</p></div>` : ''}`;
  }

  /* ---------- Eingabeseite einer Spalte (Eingabeblatt) ---------- */
  function colPage(c, colId) {
    const G = primary(c.gpb), col = colsDef().find((k) => k.id === colId), back = route(c.key, 'g');
    if (!col) return `<section class="card"><p class="muted">Diese Spalte gibt es nicht (mehr).</p><button class="btn" data-act="go" data-v="${back}">Zur Notenübersicht</button></section>`;
    const sts = studentsSorted(G), items = resItems(G).filter((e) => e.col === colId).sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
    const ds = `data-slug="${G.slug}"`;
    const eh = items.map((e) => `<th class="kmeh"><button class="kmedel" data-act="kmedel" ${ds} data-eid="${esc(e.id)}" title="Eintrag löschen" aria-label="Eintrag löschen">×</button><input class="kmet" data-ch="kmetitle" ${ds} data-eid="${esc(e.id)}" value="${esc(e.title)}" placeholder="Titel" aria-label="Titel"><input class="kmed" type="date" data-ch="kmedate" ${ds} data-eid="${esc(e.id)}" value="${esc(e.date)}" aria-label="Datum"><label class="kmem2">max. <input class="kmem" data-ch="kmemax" ${ds} data-eid="${esc(e.id)}" inputmode="decimal" value="${esc(fmt(e.max))}" aria-label="Höchstpunktzahl"> Pkt.</label></th>`).join('');
    const rows = sts.map((x, i) => `<tr data-sid="${esc(x.id)}"><td class="kmno">${i + 1}</td><td class="kmn"><span class="kmnl" data-act="kmstu" ${ds} data-id="${esc(x.id)}" role="link" tabindex="0"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span></td>${items.map((e) => `<td class="kmpt"><input data-ch="kmept" ${ds} data-eid="${esc(e.id)}" data-sid="${esc(x.id)}" inputmode="decimal" autocomplete="off" value="${has(e, x) ? esc(fmt(e.pts[x.id])) : ''}" aria-label="Punkte ${esc(x.nn)}"></td>`).join('')}<td class="kmsp kmtot"></td><td class="kmsm2 kmtot"></td><td class="kmspc kmtot"></td></tr>`).join('');
    const avg = `<tr class="kmavg"><td colspan="2">Durchschnitt in Prozent</td>${items.map((e) => `<td data-avg="${esc(e.id)}"></td>`).join('')}<td colspan="3"></td></tr>`;
    return `<!--H--><div class="kmh"><a class="kmmore" href="#${back}" data-act="go" data-v="${back}" style="margin:0 0 6px">‹ Zurück zur Notenübersicht</a><h1>${esc(col.name)}<span class="kmsep kmh1">I</span><span class="muted" style="font-weight:500">Klasse ${disp(c)}</span></h1></div><!--/H-->
    <section class="card"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Eingabe</h2><span class="muted sm">${items.length} Einträge · ${sts.length} Schüler</span><span style="flex:1"></span><button class="btn good" data-act="kmeadd" ${ds} data-col="${colId}">+ Neuer Eintrag</button></div>
      ${sts.length ? `<div class="kmnwrap"><table class="kmin" data-col="${colId}" ${ds}><thead><tr><th class="kmsub" colspan="2" style="text-align:left">Punkte pro Eintrag</th>${eh}<th class="kmvh kmtot"><span>Summe Punkte</span></th><th class="kmvh kmtot"><span>Summe Maximum</span></th><th class="kmvh kmtot"><span>Prozent</span></th></tr></thead><tbody>${rows}${avg}</tbody></table></div>
      <p class="muted sm" style="margin:8px 0 0">Leer lassen heißt „nicht teilgenommen“ und zählt nicht. Mit Enter springst du eine Zeile nach unten, mit Tab ein Feld nach rechts. Alles wird sofort gespeichert.</p>` : '<p class="muted" style="margin:0">Noch keine Schüler in dieser Klasse.</p>'}
      ${items.length || !sts.length ? '' : '<p class="muted" style="margin:12px 0 0">Noch kein Eintrag. Mit „+ Neuer Eintrag“ legst du zum Beispiel einen Check-Up an.</p>'}</section>`;
  }
  /* Summen und Durchschnitt der Eingabeseite sofort aktualisieren (ohne die Seite neu zu zeichnen) */
  function sheetRefresh() {
    const t = document.querySelector('.kmin'); if (!t) return; const G = groups().find((g) => g.slug === t.dataset.slug); if (!G) return;
    const items = resItems(G).filter((e) => e.col === t.dataset.col);
    t.querySelectorAll('tbody tr[data-sid]').forEach((tr) => { const sid = tr.dataset.sid; let p = 0, m = 0, n = 0; items.forEach((e) => { if (has(e, { id: sid })) { p += +e.pts[sid]; m += +e.max || 0; n++; } }); const pc = m > 0 ? Math.round((p * 100) / m) : null; tr.querySelector('.kmsp').textContent = n ? r1(p) : ''; tr.querySelector('.kmsm2').textContent = n ? r1(m) : ''; const c = tr.querySelector('.kmspc'); c.textContent = pc == null ? '' : pc; c.className = 'kmspc kmtot kmpc2 ' + lvl(pc); });
    items.forEach((e) => { const ids = Object.keys(e.pts || {}).filter((id) => has(e, { id })), cell = t.querySelector('[data-avg="' + e.id + '"]'); if (cell) cell.textContent = ids.length && +e.max ? Math.round(ids.reduce((a, id) => a + +e.pts[id], 0) * 100 / (ids.length * +e.max)) : ''; });
  }
  const prnIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="9" rx="2"/><path d="M7 14h10v7H7z"/></svg>';
  function subject(c, kd) {
    const G = primary(kd === 'gpb' ? c.gpb : c.bspk), ci = cinfo(G.slug), multi = G.classes.length > 1;
    const all = studentsSorted(G), fl = multi && U.kmcf && U.kmcf[G.slug] && G.classes.includes(U.kmcf[G.slug]) ? U.kmcf[G.slug] : '', both = (all.some((x) => x.g === 'm') && all.some((x) => x.g === 'w')) || (kd !== 'gpb' && all.length > 0), gf = both && U.kmgf && U.kmgf[G.slug] || '', list = all.filter((x) => (!fl || x.kl === fl) && (!gf || x.g === gf)), nl = nextLesson(G), lg = logOf(ci).filter((e) => e.text).slice(0, 3);
    const tests = grpTests(G).filter((t) => t.status === 'geplant' && t.date >= TODAY).slice(0, 3);
    const head = `<!--H--><div class="kmh"><h1>${SUBJ[kd]}<span class="kmsep kmh1">I</span><span class="muted" style="font-weight:500">Klasse ${disp(c)}</span></h1></div><!--/H-->`;
    let cards = `<div class="kmgrid">
      <div class="card"><h2>Nächste Stunde</h2>${nl ? `<div class="kmbig" style="font-size:20px">${esc(dshort(nl.date))}</div><div class="muted">${nl.von ? esc(nl.von) + (nl.bis ? '–' + esc(nl.bis) : '') : ''}${nl.room ? (nl.von ? '<span class="kmsep">I</span>' : '') + esc(nl.room) : ''}</div><button class="btn sm" style="margin-top:8px" data-act="godate" data-slug="${G.slug}" data-d="${nl.date}">Stunde vorbereiten</button>` : '<div class="muted sm">Keine kommende Stunde</div>'}</div>
      <div class="card"><h2>Letzte Stundeninhalte</h2>${lg.length ? lg.map((e) => `<div class="kmli"><a href="#stunde-${G.slug}--${esc(e.id)}" data-act="go" data-v="stunde-${G.slug}--${esc(e.id)}"><b class="kmdt">${esc(dshort(e.date))}</b> ${esc(e.text)}</a></div>`).join('') : '<div class="muted sm">Noch kein Stoff eingetragen</div>'}<a class="kmmore" href="#klasse-${G.slug}" data-act="go" data-v="klasse-${G.slug}">Alle Stunden, Themen und Notizen ›</a></div>
      <div class="card"><h2>Anstehende Tests</h2>${tests.length ? tests.map((t) => `<div class="kmli"><b>${esc(dshort(t.date))}</b> ${esc(t.title || KINDS[t.kind] || 'Test')} <span class="pill">${esc(KINDS[t.kind] || 'Test')}</span></div>`).join('') : '<div class="muted sm">Keine geplanten Tests</div>'}<a class="kmmore" href="#klasse-${G.slug}" data-act="go" data-v="klasse-${G.slug}">Tests verwalten ›</a></div>
    </div>`;
    const pn = U.prn && U.prn[G.slug], isG = kd === 'gpb';
    let tbl, gear = '', colPanel = '', cardsExtraInfo = '';
    if (isG) {
      const cols = visCols(c), ew = resDoc(G).ew || {}, sem = resDoc(G).sem || {}, hb = (cfg().hidb || {})[c.key] || [];
      const m = list.filter((x) => x.g === 'm').length, w = list.filter((x) => x.g === 'w').length;
      const BI = [['note', 'Notenstand', 'minmax(112px,.8fr)'], ['s1', 'Note 1. Sem.', 'minmax(58px,.4fr)'], ['s2', 'Note 2. Sem.', 'minmax(58px,.4fr)']].filter((b) => !hb.includes(b[0]));
      const on = (id) => BI.some((b) => b[0] === id);
      const gd = [{ k: 'nr', d: '34px', w: 34 }, { k: 'av', d: '38px', w: 38 }, { k: 'nm', d: 'minmax(150px,1.6fr)', w: 150 }, { k: 'g', d: '44px', w: 44 }].concat(multi ? [{ k: 'kl', d: '56px', w: 56 }] : [], cols.map((k) => ({ k: 'c:' + k.id, d: 'minmax(72px,.6fr)', w: 72 })), BI.map((b) => ({ k: 'b:' + b[0], d: b[2], w: 58 }))), { grid, min: mn } = gridOf('g', gd);
      const th = cols.map((k) => `<span class="kmpc kmcolh" draggable="true" data-col="${k.id}" data-act="kmcol" data-key="${c.key}" data-slug="${G.slug}" title="Klick: Eingabe öffnen · Ziehen: Spalte verschieben" tabindex="0" role="link" data-kw="c:${k.id}">${esc(k.name)}<i class="kmrs" data-kw="c:${k.id}" draggable="false" title="Ziehen: Breite ändern · Doppelklick: zurücksetzen"></i></span>`).join('');
      const thb = BI.map((b) => hcell('b:' + b[0], b[1], 'kmpc')).join('');
      const rows = list.map((x, i) => {
        const P = perfOf(G, x, cols), e = ew[x.id] || {}, sm = sem[x.id] || {};
        const ck = (k) => { const d = e[k]; return `<span class="kmpc">${P.note >= 4 || d ? `<span class="kmbox" data-act="kmew" data-slug="${G.slug}" data-id="${esc(x.id)}" data-k="${k}" role="checkbox" aria-checked="${!!d}" tabindex="0" title="${d ? 'Eingetragen am ' + esc(dshort(d)) + ' · Klick zum Zurücknehmen' : 'Klick trägt das heutige Datum ein'}">${d ? '✓' : ''}</span>${d ? `<small class="muted"> ${esc(dshort(d).replace(/^[A-Za-z]+, /, ''))}</small>` : ''}` : ''}</span>`; };
        const sinp = (k) => `<span class="kmpc"><input class="kmsmi" data-act="kmnop" data-ch="kmsem" data-slug="${G.slug}" data-id="${esc(x.id)}" data-s="${k}" inputmode="numeric" maxlength="1" value="${esc(sm[k] || '')}" aria-label="Note ${k}. Semester"></span>`;
        const cells = P.per.map((a) => (a.n ? pctL(a.pc) : '<span class="kmp"></span>')).join('');
        const bi = (on('pc') ? (P.tm ? pctL(P.pc) : '<span class="kmp"></span>') : '') + (on('note') ? (P.tm ? `<span class="kmpc"><span class="kmp ${P.note === 5 ? 'ab' : P.note === 4 ? 'pa' : 'ak'}">${P.note}</span> <span class="muted sm">${GRADES[P.note]}</span></span>` : '<span></span>') : '') + (on('s1') ? sinp(1) : '') + (on('s2') ? sinp(2) : '');
        return `<div class="kmrow kmgo" data-act="kmstu" data-slug="${G.slug}" data-id="${esc(x.id)}" tabindex="0" role="link"><span class="kmno">${i + 1}</span>${avSpan(x, 'kmav', G)}<span class="kmnm"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span><span class="kmpc kmgen kmgtog" data-act="kmgtog" data-slug="${G.slug}" data-id="${esc(x.id)}" role="button" tabindex="0" title="Klick wechselt zwischen m und w">${esc(x.g === 'm' || x.g === 'w' || x.g === 'd' ? x.g : '–')}</span>${multi ? `<span class="kmcl">${esc(x.kl)}</span>` : ''}${cells}${bi}</div>`;
      }).join('');
      tbl = list.length ? `<div class="kmtable" data-kt="g" style="--kmgrid:${grid};--kmmin:${mn}px"><div class="kmrow kmth">${hcell('nr', 'Nr', '', '', false)}${hcell('av', '', '', '', false)}${hcell('nm', 'Name')}${hcell('g', 'm/w', 'kmpc kmgnh', ' title="Geschlecht"')}${multi ? hcell('kl', 'Klasse') : ''}${th}${thb}</div>${rows}</div>${resItems(G).length ? '' : '<p class="muted sm" style="margin:8px 0 0">Klicke auf den Namen einer Spalte (zum Beispiel „Check-Ups“). Dort trägst du die Punkte ein, die Prozente erscheinen dann hier.</p>'}` : '<p class="muted" style="margin:0">Noch keine Schüler. Im Stundenplan „Von WebUntis übernehmen“ und „Alle Klassen holen“ nutzen.</p>';
      gear = `<button class="btn sm${U.kmColEdit ? ' good' : ''}" data-act="kmcoledit" title="Spalten bearbeiten: umbenennen, ergänzen, ausblenden, Notenschlüssel">✎ Bearbeiten</button>`;
      if (U.kmColEdit) colPanel = `<div class="kmcolp"><div class="muted sm" style="margin-bottom:8px">Die Leistungs-Spalten gelten für alle Geschichte-Klassen. Die Reihenfolge änderst du, indem du eine Spaltenüberschrift in der Liste verschiebst.</div>${colsDef().map((k) => `<div class="kmcolr"><input class="kminp" data-ch="kmcolname" data-col="${k.id}" value="${esc(k.name)}" maxlength="28" aria-label="Spaltenname"><label class="kmchk" style="margin:0"><input type="checkbox" data-ch="kmcolvis" data-col="${k.id}" data-key="${c.key}" ${hiddenOf(c.key).includes(k.id) ? '' : 'checked'}> in dieser Klasse anzeigen</label><button class="btn sm bad" data-act="kmcoldel" data-col="${k.id}">Löschen</button></div>`).join('')}<div class="kmcolr"><input class="kminp" id="kmcolnew" placeholder="Neue Spalte, z. B. Referat" maxlength="28" autocomplete="off"><button class="btn sm good" data-act="kmcoladd">+ Spalte hinzufügen</button></div>
        <div class="kmcolr" style="margin-top:12px"><b class="sm">Weitere Spalten in dieser Klasse:</b>${[['note', 'Notenstand'], ['s1', 'Note 1. Semester'], ['s2', 'Note 2. Semester']].map(([id, n]) => `<label class="kmchk" style="margin:0"><input type="checkbox" data-ch="kmbivis" data-b="${id}" data-key="${c.key}" ${hb.includes(id) ? '' : 'checked'}> ${n}</label>`).join('')}</div>
        <div class="kmcolr" style="margin-top:12px;align-items:flex-end"><b class="sm">Notenschlüssel (ab Prozent)</b>${['Sehr gut', 'Gut', 'Befriedigend', 'Genügend'].map((n, i) => `<label class="f" style="width:96px">${n}<input data-ch="kmlimit" data-i="${i}" inputmode="numeric" value="${limits()[i]}"></label>`).join('')}<span class="muted sm">darunter: Nicht genügend. Vorläufige Werte, bitte an deinen Schlüssel anpassen.</span></div></div>`;
      cardsExtraInfo = `${list.length} Schüler${m || w ? ' (' + m + 'm / ' + w + 'w)' : ''}`;
    } else {
      const sg = gridOf('s', [{ k: 'nr', d: '34px', w: 34 }, { k: 'av', d: '38px', w: 38 }, { k: 'nm', d: 'minmax(150px,1.6fr)', w: 150 }, { k: 'g', d: '44px', w: 44 }].concat(multi ? [{ k: 'kl', d: '56px', w: 56 }] : [], [{ k: 'pa', d: 'minmax(58px,.55fr)', w: 58 }, { k: 'pp', d: 'minmax(58px,.55fr)', w: 58 }, { k: 'pb', d: 'minmax(58px,.55fr)', w: 58 }]));
      const rows = list.map((x, i) => { const s = stat(G, x); return `<div class="kmrow kmgo" data-act="kmstu" data-slug="${G.slug}" data-id="${esc(x.id)}" tabindex="0" role="link"><span class="kmno">${i + 1}</span>${avSpan(x, 'kmav', G)}<span class="kmnm"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span><span class="kmpc kmgen kmgtog" data-act="kmgtog" data-slug="${G.slug}" data-id="${esc(x.id)}" role="button" tabindex="0" title="Klick wechselt zwischen m und w">${esc(x.g === 'm' || x.g === 'w' || x.g === 'd' ? x.g : '–')}</span>${multi ? `<span class="kmcl">${esc(x.kl)}</span>` : ''}${pct(s.pa, 'ak')}${pct(s.pp, 'pa')}${pct(s.pb, 'ab')}</div>`; }).join('');
      tbl = list.length ? `<div class="kmtable" data-kt="s" style="--kmgrid:${sg.grid};--kmmin:${sg.min}px"><div class="kmrow kmth">${hcell('nr', 'Nr', '', '', false)}${hcell('av', '', '', '', false)}${hcell('nm', 'Name')}${hcell('g', 'm/w', 'kmpc kmgnh', ' title="Geschlecht"')}${multi ? hcell('kl', 'Klasse') : ''}${hcell('pa', 'aktiv', 'kmpc')}${hcell('pp', 'passiv', 'kmpc')}${hcell('pb', 'fehlt', 'kmpc')}</div>${rows}</div>${list.some((x) => stat(G, x).t) ? '' : '<p class="muted sm" style="margin:8px 0 0">Prozentwerte erscheinen, sobald du in den Stunden die Anwesenheit kontrollierst.</p>'}` : '<p class="muted" style="margin:0">Noch keine Schüler. Im Stundenplan „Von WebUntis übernehmen“ und „Alle Klassen holen“ nutzen.</p>';
    }
    if (isG) {
      const cols0 = visCols(c), risk = all.map((x) => ({ x, P: perfOf(G, x, cols0) })).filter((r) => r.P.note >= 4);
      cards = cards.replace(/<\/div>\s*$/, `<div class="card"><h2>Notenmäßig gefährdet</h2>${risk.length ? risk.map((r) => `<div class="kmli"><span class="kmp ${r.P.note === 5 ? 'ab' : 'pa'}">${r.P.note}</span> <b>${esc(up(r.x.nn))}</b> ${esc(r.x.vn)} <span class="muted sm">${r.P.pc} %</span></div>`).join('') : '<div class="muted sm">Niemand mit Genügend oder Nicht genügend</div>'}<span class="kmmore" data-act="kmsok" role="button" tabindex="0" style="cursor:pointer">Frühwarnung in Sokrates verfassen ›</span></div></div>`);
    }
    const stu = `<section class="card" style="margin-top:14px"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Schülerliste</h2><span class="muted sm" style="display:inline-block;min-width:122px;white-space:nowrap">${list.length} Schüler (${(list.some((x) => x.g === 'm') ? 'm' : '') + (list.some((x) => x.g === 'm') && list.some((x) => x.g === 'w') ? '/' : '') + (list.some((x) => x.g === 'w') ? 'w' : '')})</span>${multi ? `<span class="kmflt" role="group" aria-label="Nach Klasse filtern">${['', ...G.classes].map((k) => `<button class="kmfb${(fl || '') === k ? ' on' : ''}" data-act="kmcf" data-slug="${G.slug}" data-k="${esc(k)}">${k ? esc(String(k).toUpperCase()) : 'Alle'}</button>`).join('')}</span>` : ''}${both ? `<button class="kmfb" data-act="kmgf" data-slug="${G.slug}" title="Klick wechselt: m/w, m, w" aria-label="Geschlecht filtern: ${gf || 'm/w'}" style="margin-left:6px;min-width:46px">${gf || 'm/w'}</button>` : ''}<span style="flex:1"></span>${gear}<button class="btn sm pr" data-act="stuprint" data-slug="${G.slug}" aria-expanded="${!!pn}" aria-label="Schülerliste drucken" title="Schülerliste drucken">${prnIcon}</button></div>${colPanel}${prnPanel(G)}${tbl}</section>`;
    return head + cards + stu;
  }

  function studentPage(slug, id) {
    const G = groups().find((g) => g.slug === slug), x = G && (cinfo(slug).students || []).find((s) => s.id === id);
    if (!G || !x) return `<section class="card"><p class="muted">Schüler nicht gefunden.</p><button class="btn" data-act="go" data-v="mappe">Zu den Klassenmappen</button></section>`;
    const c = classes().find((k) => k.label === G.label), kd = kind(G), s = stat(G, x);
    const absDates = (cinfo(slug).log || []).filter((e) => (e.abs || []).includes(x.id)).sort((a, b) => b.date.localeCompare(a.date));
    const back = c ? route(c.key, kd === 'gpb' ? 'g' : 's') : 'mappe';
    const perf = `<div class="card"><h2>Leistungen</h2>${(() => { const P = perfOf(G, x, visCols(c || { key: '' })); return P.tm ? `<div class="kmli"><b>Gesamt</b> ${pctL(P.pc)} <span class="muted sm">${r1(P.tp)} von ${r1(P.tm)} Punkten</span> · <b>${GRADES[P.note]}</b> (${P.note})</div>` : ''; })()}${colsDef().map((k) => { const its = resItems(G).filter((e) => e.col === k.id && has(e, x)); return `<div class="kmli"><b>${esc(k.name)}</b> ${pctL(colPct(G, x, k.id))}${its.map((e) => `<div class="muted sm">${esc(dshort(e.date))} · ${esc(e.title)}: ${fmt(e.pts[x.id])} / ${fmt(e.max)}</div>`).join('')}</div>`; }).join('')}</div>`;
    return `<div class="kmh"><a class="kmmore" href="#${back}" data-act="go" data-v="${back}">‹ Zurück zur Klassenmappe ${c ? esc(c.label) : ''}</a></div>
    <section class="card kmprofile">${avSpan(x, 'kmavbig').replace('<span','<div').replace(/<\/span>$/,'</div>')}<div><h1 style="margin:0">${esc(up(x.nn))} ${esc(x.vn)}</h1><div class="muted">Klasse ${esc(x.kl || (c ? c.names[0] : ''))} · ${SUBJ[kd] || esc(G.subject)}${x.g === 'm' || x.g === 'w' ? ' · ' + x.g : ''}</div></div></section>
    <div class="kmgrid" style="margin-top:14px">
      ${kd === 'gpb' ? perf : `<div class="card"><h2>Anwesenheit</h2><div class="row" style="gap:14px">${pct(s.pa, 'ak')}${pct(s.pp, 'pa')}${pct(s.pb, 'ab')}</div><div class="muted sm" style="margin-top:6px">${s.t ? s.t + ' kontrollierte Stunden: ' + s.a + ' aktiv, ' + s.p + ' passiv, ' + s.b + ' abwesend' : 'Noch keine Kontrolle erfasst'}</div></div>`}
      <div class="card"><h2>Fehlzeiten</h2>${absDates.length ? absDates.slice(0, 12).map((e) => `<div class="kmli"><a href="#stunde-${slug}--${esc(e.id)}" data-act="go" data-v="stunde-${slug}--${esc(e.id)}">${esc(dshort(e.date))}</a></div>`).join('') : '<div class="muted sm">Keine</div>'}</div>
      <div class="card"><h2>Weitere Bereiche</h2><p class="muted sm" style="margin:0">Bild, Noten, Sportwerte, Befreiungen und Notizen folgen in den nächsten Schritten.</p></div>
    </div>`;
  }

  /* ---------- Aktionen ---------- */
  function move(from, to) {
    const kv = norm(cfg().kvClass || ''), keys = sorted().map((x) => x.key).filter((k) => k !== kv), rest = sorted().filter((x) => x.key !== kv);
    const all = keys.slice(); all.splice(divAt(rest), 0, '|');
    const a = all.indexOf(from), b = all.indexOf(to); if (a < 0 || b < 0 || a === b) return;
    all.splice(a, 1); all.splice(b, 0, from);
    const newKeys = all.filter((k) => k !== '|'), changed = JSON.stringify(newKeys) !== JSON.stringify(keys);
    saveCfg(Object.assign({ div: all.indexOf('|') }, changed ? { manual: true, order: newKeys } : {}));
  }
  Object.assign(A, {
    kmsel: (e) => setView('mappe-' + e.dataset.key),
    kmcf: (e) => { U.kmcf = U.kmcf || {}; U.kmcf[e.dataset.slug] = e.dataset.k; render(); },
    kmgf: (e) => { U.kmgf = U.kmgf || {}; const c = U.kmgf[e.dataset.slug] || ''; U.kmgf[e.dataset.slug] = c === '' ? 'm' : c === 'm' ? 'w' : ''; render(); },
    kmtab: (e) => setView(route(e.dataset.key, e.dataset.tab)),
    kmkvedit: (e) => { U.kmKvEdit = U.kmKvEdit === e.dataset.key ? null : e.dataset.key; render(); if (U.kmKvEdit) setTimeout(() => { const i = document.getElementById('kmkvin'); if (i) { i.focus(); i.select(); } }, 30); },
    kmnop: () => {},
    kmew: (e) => { const G = groups().find((g) => g.slug === e.dataset.slug); if (!G) return; const ew = Object.assign({}, resDoc(G).ew || {}), cur = Object.assign({}, ew[e.dataset.id] || {}), k = e.dataset.k; if (cur[k]) { delete cur[k]; toast('Eintrag zurückgenommen'); } else { cur[k] = TODAY; toast(k === 'out' ? 'Frühwarnung als ausgeteilt vermerkt' : 'Rückmeldung vermerkt'); } ew[e.dataset.id] = cur; patchRes(G, { ew }); },
    kmsok: () => { const old = document.querySelector('.kmmodal'); if (old) old.remove(); const el = document.createElement('div'); el.className = 'kmmodal'; el.innerHTML = `<div class="kmmbox" role="dialog"><div class="kmmh"><h2>Frühwarnung in Sokrates verfassen</h2></div><p class="muted sm" style="margin:0 0 8px">Schreibe hier deine Schritte auf, damit es beim nächsten Mal schnell geht. Der Text bleibt gespeichert und ist auf allen Geräten sichtbar.</p><textarea id="kmsoktx" class="kminp" rows="9" style="width:100%" placeholder="1. In Sokrates anmelden\n2. …">${esc(cfg().sokrates || '')}</textarea><div class="row" style="margin-top:12px"><button class="btn good" data-m="sok">Speichern</button><button class="btn" data-m="close">Schließen</button></div></div>`; document.body.appendChild(el); el.addEventListener('mousedown', (ev) => { if (ev.target === el) el.remove(); }); el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-m]'); if (!b) return; if (b.dataset.m === 'sok') { saveCfg({ sokrates: el.querySelector('#kmsoktx').value }); toast('Gespeichert'); } el.remove(); }); const t = el.querySelector('#kmsoktx'); if (t) t.focus(); },
    kmcol: (e) => setView(route(e.dataset.key, 'g', e.dataset.col)),
    kmeadd: (e) => { const G = groups().find((g) => g.slug === e.dataset.slug), col = colsDef().find((k) => k.id === e.dataset.col); if (!G || !col) return; const items = resItems(G), n = items.filter((x) => x.col === col.id).length + 1, id = uid('r'); saveRes(G, items.concat([{ id, col: col.id, title: col.name + ' ' + n, date: TODAY, max: 10, pts: {} }])); render(); setTimeout(() => { const i = document.querySelector('.kmet[data-eid="' + id + '"]'); if (i) { i.focus(); i.select(); } }, 40); },
    kmedel: (e) => { const G = groups().find((g) => g.slug === e.dataset.slug); if (!G || !confirm('Diesen Eintrag samt allen Punkten löschen?')) return; saveRes(G, resItems(G).filter((x) => x.id !== e.dataset.eid)); render(); },
    kmgtog: (e) => { const slug = e.dataset.slug, ci = cinfo(slug); if (!Array.isArray(ci.students)) return; put('settings', Object.assign({}, ci, { id: 'cn_' + slug, students: ci.students.map((x) => (x.id === e.dataset.id ? Object.assign({}, x, { g: x.g === 'm' ? 'w' : 'm' }) : x)) })); render(); },
    kmphopen: (e) => openPhoto(e.dataset.key),
    kmphview: (e) => viewPhoto(e.dataset.key),
    kmavedit: (e) => {
      hideZoom(); const G = groups().find((g) => g.slug === e.dataset.slug); if (!G) return; const x = studentsSorted(G).find((y) => y.id === e.dataset.id); if (!x) return;
      const c = classes().find((k) => k.groups.some((g) => g.slug === G.slug)); if (!c) return; const multi = c.names.length > 1, keys = (multi ? c.names.map((n) => pkey(c, n)) : [c.key]).filter((k) => cmeta(k)), sk = skey(x);
      if (!keys.length) return toast('Für diese Klasse gibt es noch kein Klassenfoto. Lade eines unter „Allgemein“ hoch.');
      let key = keys.find((k) => cmeta(k).photos.some((p) => (p.faces || []).some((f) => f.sid === sk))); if (!key) key = keys.find((k) => k.endsWith('::' + norm(x.kl))) || keys[0];
      const ph = cmeta(key).photos.find((p) => (p.faces || []).some((f) => f.sid === sk)); openPhoto(key, false, ph ? ph.id : undefined, sk);
    },
    kmimgview: (e) => viewPhoto('', e.dataset.src),
    kmnew: (e) => { modal = { type: 'form', slug: e.dataset.slug, col: e.dataset.col, entry: null }; showModal(); },
    kmcoledit: () => { U.kmColEdit = !U.kmColEdit; render(); },
    kmcoladd: () => { const i = document.getElementById('kmcolnew'), n = i ? i.value.trim() : ''; if (!n) return toast('Bitte einen Namen für die Spalte eingeben'); if (i) { i.value = ''; i.blur(); } saveCols(colsDef().concat([{ id: 'c' + Date.now().toString(36), name: n }])); toast('Spalte „' + n + '“ hinzugefügt'); },
    kmcoldel: (e) => { const k = colsDef().find((x) => x.id === e.dataset.col); if (!k || !confirm('Die Spalte „' + k.name + '“ samt allen zugehörigen Einträgen in allen Geschichte-Klassen löschen?')) return; saveCols(colsDef().filter((x) => x.id !== k.id)); Object.keys(S.settings).filter((n) => n.startsWith('kmr_')).forEach((n) => { const d = S.settings[n]; if (d && Array.isArray(d.items) && d.items.some((it) => it.col === k.id)) put('settings', Object.assign({}, d, { id: n, items: d.items.filter((it) => it.col !== k.id) })); }); },
    kmauto: () => { saveCfg({ manual: false, order: [], div: null }); toast('Reihenfolge wird automatisch gebildet'); },
    kmstu: (e) => setView('schueler-' + e.dataset.slug + '--' + e.dataset.id),
    prngf: (e) => { const p = U.prn && U.prn[e.dataset.slug]; if (!p) return; p.gf = e.dataset.g; render(); },
  });
  Object.assign(C, {
    kmkvn: (e) => { const m = Object.assign({}, cfg().kvn || {}); m[e.dataset.key] = e.value.trim(); U.kmKvEdit = null; if (e.blur) e.blur(); saveCfg({ kvn: m }); render(); },
    kmetitle: (e) => entryOp(e, (it) => { it.title = e.value.trim() || it.title; e.value = it.title; return it; }),
    kmedate: (e) => entryOp(e, (it) => { it.date = e.value || it.date; return it; }),
    kmemax: (e) => entryOp(e, (it) => { const n = num(e.value); if (!(n > 0)) { toast('Bitte eine Höchstpunktzahl größer 0 eintragen'); e.value = fmt(it.max); return it; } it.max = n; e.value = fmt(n); return it; }),
    kmept: (e) => entryOp(e, (it) => { const v = e.value.trim(), pts = Object.assign({}, it.pts || {}); if (v === '') delete pts[e.dataset.sid]; else { const n = num(v); if (n == null || n < 0) { toast('Bitte nur Zahlen ab 0 eintragen'); e.value = pts[e.dataset.sid] !== undefined ? fmt(pts[e.dataset.sid]) : ''; return it; } pts[e.dataset.sid] = n; } it.pts = pts; return it; }),
    kmbivis: (e) => { if (e.blur) e.blur(); const h = Object.assign({}, cfg().hidb || {}), l = new Set(h[e.dataset.key] || []); if (e.checked) l.delete(e.dataset.b); else l.add(e.dataset.b); h[e.dataset.key] = [...l]; saveCfg({ hidb: h }); },
    kmsem: (e) => { const G = groups().find((g) => g.slug === e.dataset.slug); if (!G) return; let v = e.value.trim(); if (v && !/^[1-5]$/.test(v)) { toast('Bitte eine Note von 1 bis 5 eintragen'); v = ''; e.value = ''; } const sem = Object.assign({}, resDoc(G).sem || {}), cur = Object.assign({}, sem[e.dataset.id] || {}); if (v) cur[e.dataset.s] = v; else delete cur[e.dataset.s]; sem[e.dataset.id] = cur; const orig = window.scheduleRender; window.scheduleRender = () => {}; try { patchRes(G, { sem }); } finally { window.scheduleRender = orig; } },
    kmlimit: (e) => { const L = limits().slice(), n = parseInt(e.value, 10); if (!(n >= 0 && n <= 100)) { toast('Bitte einen Prozentwert von 0 bis 100 eintragen'); return render(); } L[+e.dataset.i] = n; if (e.blur) e.blur(); put('settings', { id: 'kmgrade', limits: L }); },
    kmcolname: (e) => { if (e.blur) e.blur(); const n = e.value.trim(); if (!n) { toast('Der Name darf nicht leer sein'); return render(); } saveCols(colsDef().map((k) => (k.id === e.dataset.col ? Object.assign({}, k, { name: n }) : k))); },
    kmcolvis: (e) => { if (e.blur) e.blur(); const h = Object.assign({}, cfg().hid || {}), l = new Set(h[e.dataset.key] || []); if (e.checked) l.delete(e.dataset.col); else l.add(e.dataset.col); h[e.dataset.key] = [...l]; saveCfg({ hid: h }); },
    kmkvme: (e) => { const on = e.checked, key = e.dataset.key; if (e.blur) e.blur(); saveCfg({ kvClass: on ? key : '' }); toast(on ? 'Diese Klasse steht jetzt immer an erster Stelle' : 'Klassenvorstand-Markierung entfernt'); },
  });
  /* ---------- Einträge verwalten (Fenster) ---------- */
  let modal = null;
  const closeModal = () => { modal = null; const m = document.querySelector('.kmmodal'); if (m) m.remove(); };
  const gOf = () => groups().find((g) => g.slug === (modal && modal.slug));
  function listHtml(G, col) {
    const items = resItems(G).filter((e) => e.col === col.id).sort((a, b) => b.date.localeCompare(a.date));
    return `<div class="kmmh"><h2>${esc(col.name)} <span class="muted" style="font-weight:500">· Klasse ${esc(G.label)} Geschichte</span></h2></div>
    ${items.length ? items.map((e) => { const v = Object.keys(e.pts || {}).filter((id) => e.pts[id] !== '' && e.pts[id] != null), avg = v.length && +e.max ? Math.round(v.reduce((a, id) => a + +e.pts[id], 0) * 100 / (v.length * +e.max)) : null; return `<div class="kmer"><div><b>${esc(e.title)}</b><div class="muted sm">${esc(dshort(e.date))} · max. ${fmt(e.max)} Punkte · ${v.length} Schüler${avg == null ? '' : ' · Ø ' + avg + ' %'}</div></div><span style="flex:1"></span><button class="btn sm" data-m="edit" data-id="${esc(e.id)}">Bearbeiten</button><button class="btn sm bad" data-m="del" data-id="${esc(e.id)}">Löschen</button></div>`; }).join('') : '<p class="muted">Noch keine Einträge in dieser Spalte.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn good" data-m="new">+ Neuer Eintrag</button><span style="flex:1"></span><button class="btn" data-m="close">Schließen</button></div>`;
  }
  function formHtml(G, col, e) {
    const en = e || { id: '', title: '', date: TODAY, max: 10, pts: {} }, sts = studentsSorted(G);
    return `<div class="kmmh"><h2>${e ? 'Eintrag bearbeiten' : 'Neuer Eintrag'} <span class="muted" style="font-weight:500">· ${esc(col.name)} · Klasse ${esc(G.label)}</span></h2></div>
    <div class="kmfg"><label class="f">Titel<input id="kmf-t" value="${esc(en.title)}" placeholder="z. B. ${esc(col.name)} Römische Republik" autocomplete="off"></label><label class="f">Datum<input id="kmf-d" type="date" value="${esc(en.date)}"></label><label class="f">Höchstpunktzahl<input id="kmf-m" inputmode="decimal" value="${esc(fmt(en.max))}" style="max-width:110px"></label></div>
    <p class="muted sm" style="margin:8px 0">Punkte pro Schüler. Leer lassen, wenn jemand nicht teilgenommen hat (zählt dann nicht in die Prozent). Mit Enter springst du zum nächsten Feld.</p>
    <div class="kmfl">${sts.map((x, i) => `<label class="kmfr"><span class="kmno">${i + 1}</span><span class="kmnm"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span><input class="kmf-p" data-sid="${esc(x.id)}" inputmode="decimal" autocomplete="off" value="${en.pts && en.pts[x.id] !== undefined && en.pts[x.id] !== '' ? esc(fmt(en.pts[x.id])) : ''}"></label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn good" data-m="save" ${e ? 'data-id="' + esc(e.id) + '"' : ''}>Speichern</button><button class="btn" data-m="list">Abbrechen</button></div>`;
  }
  function showModal() {
    const old = document.querySelector('.kmmodal'); if (old) old.remove(); if (!modal) return;
    const G = gOf(), col = colsDef().find((k) => k.id === modal.col); if (!G || !col) return closeModal();
    const el = document.createElement('div'); el.className = 'kmmodal';
    el.innerHTML = `<div class="kmmbox" role="dialog" aria-modal="true">${modal.type === 'form' ? formHtml(G, col, modal.entry) : listHtml(G, col)}</div>`;
    document.body.appendChild(el);
    el.addEventListener('mousedown', (ev) => { if (ev.target === el) closeModal(); });
    el.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeModal(); if (ev.key === 'Enter' && ev.target.classList && ev.target.classList.contains('kmf-p')) { ev.preventDefault(); const all = [...el.querySelectorAll('.kmf-p')], i = all.indexOf(ev.target); (all[i + 1] || ev.target).focus(); if (all[i + 1]) all[i + 1].select(); } });
    el.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-m]'); if (!b) return; const m = b.dataset.m;
      if (m === 'close') return closeModal();
      if (m === 'list') { modal = { type: 'list', slug: modal.slug, col: modal.col }; return showModal(); }
      if (m === 'new') { modal = { type: 'form', slug: modal.slug, col: modal.col, entry: null }; return showModal(); }
      if (m === 'edit') { modal = { type: 'form', slug: modal.slug, col: modal.col, entry: resItems(G).find((e) => e.id === b.dataset.id) || null }; return showModal(); }
      if (m === 'del') { if (!confirm('Diesen Eintrag löschen?')) return; saveRes(G, resItems(G).filter((e) => e.id !== b.dataset.id)); return showModal(); }
      if (m === 'save') {
        const max = num(el.querySelector('#kmf-m').value), date = el.querySelector('#kmf-d').value || TODAY; if (!(max > 0)) return toast('Bitte eine Höchstpunktzahl größer 0 angeben');
        const pts = {}; let bad = false; el.querySelectorAll('.kmf-p').forEach((i) => { const v = i.value.trim(); if (v === '') return; const n = num(v); if (n == null || n < 0) { bad = true; i.style.outline = '2px solid var(--bad)'; return; } pts[i.dataset.sid] = n; });
        if (bad) return toast('Bitte nur Zahlen ab 0 eintragen');
        const title = el.querySelector('#kmf-t').value.trim() || (col.name + ' ' + dshort(date)), id = b.dataset.id || uid('r'), en = { id, col: col.id, title, date, max, pts };
        const items = resItems(G).filter((e) => e.id !== id).concat([en]); saveRes(G, items); toast('Eintrag gespeichert'); modal = { type: 'list', slug: modal.slug, col: modal.col }; return showModal();
      }
    });
    const first = el.querySelector('#kmf-t, .kmmbox button'); if (first) first.focus();
  }
  function entryOp(e, fn) { const G = groups().find((g) => g.slug === e.dataset.slug); if (!G) return; const orig = window.scheduleRender; window.scheduleRender = () => {}; try { saveRes(G, resItems(G).map((it) => (it.id === e.dataset.eid ? fn(Object.assign({}, it)) : it))); } finally { window.scheduleRender = orig; } sheetRefresh(); }
  const moveCol = (from, to) => { const arr = colsDef().slice(), a = arr.findIndex((k) => k.id === from), b = arr.findIndex((k) => k.id === to); if (a < 0 || b < 0 || a === b) return; arr.splice(b, 0, arr.splice(a, 1)[0]); saveCols(arr); };
  /* Drag and Drop der Spaltenüberschriften */
  let dragCol = null;
  const colOf = (ev) => ev.target && ev.target.closest && ev.target.closest('.kmcolh');
  document.addEventListener('dragstart', (ev) => { const h = colOf(ev); if (!h) return; dragCol = h.dataset.col; try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', dragCol); } catch (e) { /* */ } h.classList.add('drag'); });
  document.addEventListener('dragover', (ev) => { const h = colOf(ev); if (h && dragCol && h.dataset.col !== dragCol) { ev.preventDefault(); h.classList.add('over'); } });
  document.addEventListener('dragleave', (ev) => { const h = colOf(ev); if (h) h.classList.remove('over'); });
  document.addEventListener('drop', (ev) => { const h = colOf(ev); if (h && dragCol) { ev.preventDefault(); const f = dragCol; dragCol = null; moveCol(f, h.dataset.col); } });
  document.addEventListener('dragend', () => { dragCol = null; document.querySelectorAll('.kmcolh.drag,.kmcolh.over').forEach((x) => x.classList.remove('drag', 'over')); });
  /* Drag and Drop der Klassenleiste */
  let drag = null;
  const chipOf = (ev) => ev.target && ev.target.closest && ev.target.closest('.kmchip,.kmdiv');
  document.addEventListener('dragstart', (ev) => { const c = chipOf(ev); if (!c || c.getAttribute('draggable') !== 'true') return; drag = c.dataset.key; try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', drag); } catch (e) { /* */ } c.classList.add('drag'); });
  document.addEventListener('dragover', (ev) => { const c = chipOf(ev); if (c && drag && c.dataset.key !== drag && c.getAttribute('draggable') === 'true') { ev.preventDefault(); c.classList.add('over'); } });
  document.addEventListener('dragleave', (ev) => { const c = chipOf(ev); if (c) c.classList.remove('over'); });
  document.addEventListener('drop', (ev) => { const c = chipOf(ev); if (c && drag && c.getAttribute('draggable') === 'true') { ev.preventDefault(); const f = drag; drag = null; move(f, c.dataset.key); } });
  document.addEventListener('dragend', () => { drag = null; document.querySelectorAll('.kmchip.drag,.kmchip.over,.kmdiv.drag,.kmdiv.over').forEach((x) => x.classList.remove('drag', 'over')); });
  document.addEventListener('keydown', (ev) => { const t1 = ev.target; if (ev.key === 'Enter' && t1 && t1.classList && t1.classList.contains('kmsmi')) { ev.preventDefault(); const all = [...document.querySelectorAll('.kmsmi[data-s="' + t1.dataset.s + '"]')], i = all.indexOf(t1); if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); } else t1.blur(); return; } const t0 = ev.target; if (ev.key === 'Enter' && t0 && t0.classList && t0.classList.contains('kmept') === false && t0.closest && t0.closest('.kmin') && t0.dataset && t0.dataset.ch === 'kmept') { ev.preventDefault(); const all = [...document.querySelectorAll('.kmin input[data-eid="' + t0.dataset.eid + '"][data-sid]')], i = all.indexOf(t0); if (all[i + 1]) { all[i + 1].focus(); all[i + 1].select(); } return; } if (ev.key === 'Enter' && ev.target && ev.target.id === 'kmkvin') { ev.target.blur(); return; } if (ev.key === 'Escape' && U.kmKvEdit) { U.kmKvEdit = null; render(); return; } if (ev.key === 'Enter' && ev.target && ev.target.classList && ev.target.classList.contains('kmgo')) A.kmstu(ev.target); });
  /* Spaltenbreiten der Schülerlisten per Ziehen ändern */
  { let rz = null, lastT = null;
    document.addEventListener('mousedown', (e) => { if (e.target.closest && e.target.closest('.kmrs')) { e.preventDefault(); e.stopPropagation(); } }, true);
    document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.kmrs')) { e.preventDefault(); e.stopPropagation(); } }, true);
    document.addEventListener('pointerdown', (e) => {
      const h = e.target.closest && e.target.closest('.kmrs'); if (!h || e.button) return; e.preventDefault(); e.stopPropagation();
      const th = h.parentNode, row = th.parentNode, tbl = row.closest('.kmtable'), heads = [...row.children], widths = heads.map((x) => x.getBoundingClientRect().width - 8 + 8);
      rz = { tbl, row, heads, widths, idx: heads.indexOf(th), x0: e.clientX, w: widths[heads.indexOf(th)], h }; h.setPointerCapture && h.setPointerCapture(e.pointerId); h.classList.add('on');
    }, true);
    document.addEventListener('pointermove', (e) => {
      if (!rz) return; const w = Math.max(34, Math.round(rz.widths[rz.idx] + e.clientX - rz.x0)), all = rz.widths.slice(); all[rz.idx] = w; rz.w = w;
      rz.tbl.style.setProperty('--kmgrid', all.map((x) => Math.round(x) + 'px').join(' ')); rz.tbl.style.setProperty('--kmmin', all.reduce((a, b) => a + b, 0) + all.length * 8 + 'px');
    });
    const end = () => {
      if (!rz) return; const r = rz; rz = null; r.h.classList.remove('on'); const kind = r.tbl.dataset.kt, all = Object.assign({}, cfg().kmw || {});
      if (Math.abs(r.w - r.widths[r.idx]) < 3) { const now = Date.now(); if (lastT && now - lastT < 450) { lastT = null; delete all[kind]; saveCfg({ kmw: all }); render(); } else { lastT = now; render(); } return; }
      const nw = {}; r.heads.forEach((h, i) => { if (h.dataset.kw) nw[h.dataset.kw] = Math.round(i === r.idx ? r.w : r.widths[i]); }); all[kind] = nw; saveCfg({ kmw: all }); render();
    };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end); }
  /* Semesternoten: mit gedrückter Maustaste mehrere Felder markieren, Entf löscht alle markierten */
  { let ds = null, sel = [], swallow = 0;
    document.addEventListener('click', (e) => { if (Date.now() - swallow < 300) { e.stopPropagation(); e.preventDefault(); } }, true);
    const clearSel = () => { sel.forEach((x) => x.classList.remove('kmsel')); sel = []; if (ta && document.activeElement === ta) ta.blur(); };
    const inRect = (a, b) => { const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(), x0 = Math.min(r1.left, r2.left), x1 = Math.max(r1.right, r2.right), y0 = Math.min(r1.top, r2.top), y1 = Math.max(r1.bottom, r2.bottom); return [...document.querySelectorAll('.kmsmi')].filter((x) => { const r = x.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2; return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1; }); };
    document.addEventListener('pointerdown', (e) => { const t = e.target; if (e.button === 0 && t.classList && t.classList.contains('kmsmi') && e.pointerType === 'mouse') ds = { el: t, multi: false }; else { ds = null; if (!(t.closest && t.closest('.kmsel'))) clearSel(); } }, true);
    document.addEventListener('pointermove', (e) => {
      if (!ds || !(e.buttons & 1)) return; const o = document.elementFromPoint(e.clientX, e.clientY), t = o && o.classList && o.classList.contains('kmsmi') ? o : null;
      if (!ds.multi) { if (!t || t === ds.el) return; ds.multi = true; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); document.body.style.userSelect = 'none'; const sl = window.getSelection && window.getSelection(); if (sl) sl.removeAllRanges(); }
      e.preventDefault(); if (t) { clearSel(); sel = inRect(ds.el, t); sel.forEach((x) => x.classList.add('kmsel')); }
    }, true);
    document.addEventListener('pointerup', () => { if (ds && ds.multi) { document.body.style.userSelect = ''; swallow = Date.now(); if (sel.length) { grab(); toast(sel.length + ' Felder markiert · Strg+C kopiert, Entf löscht'); } } ds = null; }, true);
    const tsv = () => { const rows = []; sel.forEach((x) => { const r = x.closest('.kmrow'); if (r && !rows.includes(r)) rows.push(r); }); const cols = [...new Set(sel.map((x) => x.dataset.s))].sort(); return rows.map((r) => cols.map((c) => { const x = sel.find((y) => y.dataset.s === c && y.closest('.kmrow') === r); return x ? x.value : ''; }).join('\t')).join('\n'); };
    let ta = null; const grab = () => { if (!ta) { ta = document.createElement('textarea'); ta.setAttribute('aria-hidden', 'true'); ta.tabIndex = -1; ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(ta); } ta.value = tsv(); ta.focus({ preventScroll: true }); ta.select(); };
    document.addEventListener('copy', (e) => {
      if (!sel.length || !e.clipboardData) return;
      e.clipboardData.setData('text/plain', tsv()); e.preventDefault(); toast(sel.length + ' Felder kopiert');
    }, true);
    document.addEventListener('keydown', (ev) => {
      if (!sel.length) return;
      if (ev.key === 'Escape') { clearSel(); return; }
      if (ev.key !== 'Delete' && ev.key !== 'Backspace') return;
      ev.preventDefault(); ev.stopPropagation();
      const G = groups().find((g) => g.slug === sel[0].dataset.slug); if (!G) { clearSel(); return; }
      const sem = Object.assign({}, resDoc(G).sem || {});
      sel.forEach((x) => { const cur = Object.assign({}, sem[x.dataset.id] || {}); delete cur[x.dataset.s]; sem[x.dataset.id] = cur; x.value = ''; });
      const orig = window.scheduleRender; window.scheduleRender = () => {}; try { patchRes(G, { sem }); } finally { window.scheduleRender = orig; }
      const n = sel.length; clearSel(); toast(n + ' Noten gelöscht');
    }, true); }

  /* ---------- Stil ---------- */
  const st = document.createElement('style');
  st.textContent = `
.km{display:grid;gap:26px;grid-template-columns:minmax(0,1fr)}
html{overflow-y:scroll;scrollbar-gutter:stable}
.kmmain{width:100%}.kmmain>*{min-width:0}
.kmcls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:8px 10px}
.kmchips{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}.kmchipw{display:inline-flex;align-items:center;gap:2px}
.kmchip{white-space:nowrap;font:600 14px var(--font-body);background:var(--surface2);color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:6px 14px;cursor:pointer;display:inline-flex;align-items:baseline;gap:6px}
.kmchip small{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.04em}.kmchip:hover{border-color:var(--accent)}
.kmchip.on{background:var(--hd-bg);color:#fff;border-color:var(--hd-bg)}.kmchip.on small{color:#d5d8dd}
.kmchip.drag,.kmdiv.drag{opacity:.4}.kmchip.over{outline:2px dashed var(--accent);outline-offset:2px}
.kmdiv{display:inline-block;flex:none;width:16px;height:32px;cursor:grab;position:relative;align-self:center}.kmdiv::before{content:'';position:absolute;left:7px;top:3px;bottom:3px;width:2px;border-radius:2px;background:var(--muted);opacity:.45;transition:opacity .15s,background .15s}.kmdiv:hover::before,.kmdiv.over::before{opacity:1;background:var(--accent)}.kmdiv.over{outline:2px dashed var(--accent);outline-offset:-2px;border-radius:6px}
.kmarr{display:inline-flex;gap:2px}.kmarr button{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:6px;width:24px;height:28px;cursor:pointer;font-size:16px;line-height:1}
.kmtools{display:flex;gap:6px}.kmtool{border:1px solid var(--line);background:var(--surface2);color:var(--ink);border-radius:8px;padding:6px 9px;cursor:pointer;font:600 12px var(--font-body);display:inline-flex;align-items:center}.kmtool.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.kmth .kmgnh{text-transform:none}.kmgen{color:var(--muted);font-weight:600}.kmth>span{position:relative}.kmrs{position:absolute;right:-5px;top:-3px;bottom:-3px;width:10px;cursor:col-resize;z-index:3}.kmrs::after{content:'';position:absolute;left:4px;top:3px;bottom:3px;width:2px;border-radius:1px;background:var(--line)}.kmrs:hover::after,.kmrs.on::after{background:var(--accent)}.kmav[data-act]{cursor:pointer}.kmavzoom{position:fixed;z-index:9200;width:240px;height:240px;border-radius:16px;overflow:hidden;border:3px solid #fff;box-shadow:0 12px 36px rgba(0,0,0,.45);pointer-events:none;background:var(--surface2)}.kmavzoom img{width:100%;height:100%;object-fit:cover;display:block}
.kmav img,.kmavbig img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}.kmav{overflow:hidden}.kmavbig{overflow:hidden}
.kmphone+.kmphone{margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}.kmphlab{font:700 13px var(--font-body);margin:0 0 6px}.kmph .kmphdz{border:2px dashed var(--line);border-radius:12px;padding:22px 12px;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:4px;background:var(--surface2)}.kmphdz:hover,.kmphdz.over{border-color:var(--accent);background:var(--accent-soft)}
.kmphth{display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:zoom-in;background:var(--surface2)}.kmphth img{width:100%;height:auto;max-height:360px;object-fit:contain;display:block}
.kmkv2{padding-top:2px}.kmkv2 .kmv{display:flex}.kmkvv{display:flex;align-items:center;gap:10px}.kmkvph{width:46px;height:46px;border-radius:50%;overflow:hidden;padding:0;border:2px solid var(--line);background:var(--surface2);cursor:zoom-in;flex:none}.kmkvph img{width:100%;height:100%;object-fit:cover;display:block}
.kmphstrip{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 0 6px}.kmphs{position:relative;width:64px;height:48px;padding:0;border:2px solid var(--line);border-radius:8px;overflow:hidden;cursor:pointer;background:var(--surface2)}.kmphs img{width:100%;height:100%;object-fit:cover;display:block}.kmphs.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}.kmphs b{position:absolute;right:2px;top:0;color:#ffc400;font-size:14px;text-shadow:0 0 3px #000}
.kmphvw{cursor:zoom-out}.kmphvw img{max-width:96vw;max-height:94vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.5)}.kmphvx{position:fixed;top:14px;right:14px;z-index:2}
.kmphov{position:fixed;inset:0;background:rgba(10,12,8,.72);z-index:9000;display:flex;align-items:center;justify-content:center;padding:2vh 2vw}.kmphbox{background:var(--surface,#fff);color:var(--ink);border-radius:14px;max-width:1500px;width:100%;height:96vh;display:flex;flex-direction:column;padding:12px 14px;min-height:0}
.kmphtop{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.kmphtop h3{margin:0}.kmphmsg{min-height:20px;margin:6px 0}.kmphbody{display:flex;gap:14px;flex:1;min-height:0}.kmphimgw{flex:1;min-width:0;overflow:auto;display:flex;align-items:flex-start;justify-content:center;background:#111;border-radius:10px}
.kmphimg{position:relative;display:inline-block;line-height:0;max-width:100%}.kmphimg img{max-width:100%;max-height:calc(96vh - 130px);width:auto;height:auto;display:block;-webkit-user-drag:none;user-select:none}.kmphimg.drawing{cursor:crosshair;touch-action:none}
.kmfx{position:absolute;border:2px solid #ffb400;border-radius:6px;box-sizing:border-box;pointer-events:auto}.kmfx b{position:absolute;left:-2px;top:-20px;background:#ffb400;color:#000;font:700 12px var(--font-body);line-height:1;padding:3px 6px;border-radius:5px}.kmfx.ok{border-color:#2fb36b}.kmfx.ok b{background:#2fb36b;color:#fff}.kmfx.hot{box-shadow:0 0 0 3px rgba(255,255,255,.9);z-index:2}
.kmphside{width:300px;flex:none;overflow:auto}.kmfcr{display:grid;grid-template-columns:28px 18px minmax(0,1fr) 20px;gap:6px;align-items:center;padding:2px 3px;border-top:1px solid var(--line);border-radius:6px}.kmfx .kmtip{display:none;position:absolute;left:0;top:100%;margin-top:3px;white-space:nowrap;z-index:5;background:#1b1d1a;color:#fff;border-radius:7px;padding:3px 4px 3px 8px;font:600 12px var(--font-body);line-height:1.2;align-items:center;gap:6px;box-shadow:0 4px 14px rgba(0,0,0,.5)}.kmfx .kmtip.up{top:auto;bottom:100%;margin:0 0 3px}.kmfx:hover .kmtip{display:inline-flex}.kmtipx{border:0;background:#c0392b;color:#fff;border-radius:5px;width:20px;height:20px;line-height:1;font-size:15px;cursor:pointer;padding:0}.kmtipn.muted{color:#cfd3c8;font-weight:500}
.kmpop{position:fixed;z-index:9100;width:250px;max-height:70vh;display:flex;flex-direction:column;background:var(--surface,#fff);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden}.kmpoph{display:flex;align-items:center;gap:4px;padding:8px 10px;border-bottom:1px solid var(--line)}.kmpx{margin-left:auto;border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:var(--muted)}.kmpopl{overflow:auto;padding:4px}.kmpi{display:block;width:100%;text-align:left;border:0;background:none;color:inherit;font:inherit;font-size:14px;padding:7px 10px;border-radius:7px;cursor:pointer}.kmpi:hover,.kmpi.hl{background:var(--accent-soft)}.kmpi.hl{outline:2px solid var(--accent)}.kmpopf{padding:6px 10px;border-top:1px solid var(--line)}.kmpclr{display:inline-block;margin-top:4px;border:1px solid var(--line);background:var(--surface2);border-radius:7px;padding:3px 8px;cursor:pointer;font:inherit;font-size:12px;color:var(--bad)}
.kmfcr.hot,.kmfcr.act{background:var(--accent-soft)}.kmfcr.act{outline:2px solid var(--accent)}.kmfx.act{box-shadow:0 0 0 3px #fff,0 0 0 5px var(--accent);z-index:3}.kmfcr img{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;background:var(--surface2)}.kmfcr b{width:20px;flex:none;text-align:center;font-size:13px}.kmfcr select{width:100%;min-width:0;margin:0;font:inherit;font-size:14px;padding:5px;border:1px solid var(--line);border-radius:7px;background:var(--surface);color:var(--ink)}.kmfd{flex:none;width:24px;padding:0;border:0;background:none;font-size:20px;line-height:1;cursor:pointer;color:var(--muted)}.kmfd:hover{color:var(--bad)}
@media(max-width:800px){.kmphbody{flex-direction:column}.kmphside{width:auto;max-height:38vh}}
.kmgtog{cursor:pointer;border-radius:6px;user-select:none}.kmgtog:hover{background:var(--accent-soft);color:var(--ink)}.kmflt{display:inline-flex;margin-left:6px;gap:4px;flex-wrap:wrap}.kmfb{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:7px;padding:3px 10px;font:600 13px var(--font-body);cursor:pointer}.kmfb.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
.km>.kmh{margin:18px 0 12px}
.kmchip .kmsep,.kmsidet .kmsep{margin:0 .35em;color:inherit;opacity:.55;font-weight:400}.kmsidet{overflow-wrap:normal}.kmsidet .kmsep{margin:0 .2em}.kmsidet b.m{font-size:14px;white-space:nowrap}.kmsidet b{display:block;text-transform:none;letter-spacing:0;font-size:15px;margin-top:3px}
.kmbody{display:grid;grid-template-columns:112px minmax(0,1fr);gap:12px;align-items:start}
.kmside{position:sticky;top:8px;display:flex;flex-direction:column;gap:6px;background:#3a3d42;border-radius:var(--r);padding:10px 6px;color:#fff}
.kmsidet{font:700 11px var(--font-head);text-transform:uppercase;letter-spacing:.05em;text-align:center;opacity:.85;padding:2px 2px 6px;border-bottom:1px solid rgba(255,255,255,.25);margin-bottom:2px;overflow-wrap:anywhere}
.kmicon{background:none;border:0;color:#fff;opacity:.72;border-radius:10px;padding:8px 2px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px}.kmicon small{font-size:10px;font-weight:600}
.kmicon:hover{opacity:1;background:rgba(255,255,255,.1)}.kmicon.on{opacity:1;background:rgba(255,255,255,.18);box-shadow:inset 3px 0 0 var(--accent)}
.kmmain{min-width:0}.kmh{margin:0 0 12px}.kmh h1{font-size:26px;margin:0}
.kmgrid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.kmgrid .card h2,.kmmain>.card h2,.kmmain section.card h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 8px}
.kmbig{font:700 34px/1.1 var(--font-head)}.kmsj{margin:0 0 8px}
.kminp{flex:1;min-width:0}.kmkvr{display:flex;align-items:baseline;gap:10px;padding:7px 0;border-top:1px solid var(--line)}.kmkvr:first-of-type{border-top:0}.kmk{flex:none;width:130px;color:var(--muted);font-size:13px}.kmv{flex:1;font-weight:700;font-size:14px;line-height:1.5}.kmpen{border:1px solid var(--line);background:var(--surface2);color:var(--ink);border-radius:8px;width:30px;height:28px;cursor:pointer;flex:none;line-height:1}.kmpen:hover{border-color:var(--accent)}
.kmtls{font-size:14px;line-height:1.5;display:grid;grid-template-columns:max-content max-content max-content max-content;align-items:baseline;margin-top:4px}.kmtl{display:contents}.kmd{font-weight:700;padding-right:1.2em}.kmt{white-space:nowrap}.kmsep{margin:0 .8em;color:var(--muted);font-weight:300}.kmsep.kmh1{margin:0 .7em}.kmr{white-space:nowrap;color:var(--muted)}
.kmtls.inl{display:flex;flex-wrap:wrap;gap:2px 28px}.kmtls.inl .kmtl{display:inline-flex;align-items:baseline}.kmtls.inl .kmd{padding-right:.6em}
.kmchk{margin-top:8px;display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--muted)}
.kmli{padding:5px 0;border-top:1px solid var(--line);font-size:14px}.kmli:first-of-type{border-top:0}.kmli a{color:inherit;text-decoration:none}.kmli a:hover{color:var(--accent)}.kmli .kmdt{color:var(--accent)}
.kmmore{display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:var(--accent);text-decoration:none}
.kmtable{overflow-x:auto}.kmrow{display:grid;grid-template-columns:var(--kmgrid,34px 38px minmax(150px,1.6fr) 56px repeat(3,minmax(58px,.55fr)));gap:8px;align-items:center;padding:6px 8px;border-top:1px solid var(--line);min-width:var(--kmmin,520px)}
.kmrow.kmgo{cursor:pointer}.kmrow.kmgo:hover{background:var(--accent-soft)}.kmth{font:700 11px var(--font-head);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-top:0;padding-bottom:4px}
.kmno{color:var(--muted);text-align:right;font-size:13px}.kmnm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kmcl{color:var(--muted);font-size:13px}.kmpc{text-align:center}
.kmav{width:30px;height:30px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:inline-grid;place-items:center;font:700 11px var(--font-body)}
.kmp{text-align:center;font-weight:700;font-size:14px}.kmp.ak{color:var(--good)}.kmp.pa{color:var(--warn)}.kmp.ab{color:var(--bad)}
.kmprofile{display:flex;gap:16px;align-items:center}.kmavbig{width:84px;height:84px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font:700 28px var(--font-body);flex:none}

.kmcolh{display:flex;align-items:center;justify-content:center;gap:5px;cursor:grab;border-radius:7px;padding:3px 4px;text-transform:none}.kmcolh:hover{background:var(--accent-soft)}.kmcolh.drag{opacity:.4}.kmcolh.over{outline:2px dashed var(--accent);outline-offset:-2px}
.kmcoln{cursor:pointer;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:.04em;font-size:11px}.kmcoln:hover{color:var(--accent)}
.kmplus{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;border:1px solid var(--line);background:var(--surface);color:var(--accent);font:800 13px/1 var(--font-body);cursor:pointer}.kmplus:hover{background:var(--accent);color:var(--accent-ink,#fff)}
.kmcolp{border:1px solid var(--line);background:var(--surface2);border-radius:10px;padding:12px;margin-bottom:12px}.kmcolr{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}.kmcolr .kminp{max-width:240px}
.kmmodal{position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:12px}.kmmbox{background:var(--surface);color:var(--ink);border-radius:14px;padding:16px 18px;width:min(640px,100%);max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.kmmh h2{margin:0 0 10px;font-size:18px}.kmer{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)}.kmer:first-of-type{border-top:0}
.kmfg{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}.kmfg .f:first-child{flex:1;min-width:200px}.kmfl{display:grid;gap:2px;max-height:46vh;overflow:auto;border:1px solid var(--line);border-radius:10px;padding:4px 8px}.kmfr{display:grid;grid-template-columns:28px minmax(0,1fr) 90px;gap:8px;align-items:center;padding:3px 0}.kmfr input{width:100%;text-align:right}

.kmnwrap{overflow:auto;border:1px solid var(--line);border-radius:10px;max-height:78vh}
.kmnt{border-collapse:separate;border-spacing:0;font-size:13px;width:max-content;min-width:100%}
.kmnt th,.kmnt td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px 6px;text-align:center;white-space:nowrap}
.kmnt thead th{position:sticky;background:var(--surface2);z-index:3}.kmnt .kmr1 th{top:0;height:40px}.kmnt .kmr2 th{top:40px}
.kmtitle{background:#4a4e55!important;color:#fff;text-align:left!important;font:800 16px var(--font-head);letter-spacing:.02em;min-width:300px;position:sticky!important;left:0;z-index:5!important}.kmtitle small{display:block;font:600 12px var(--font-body);opacity:.8}
.kmgh{background:var(--c,#a8aab0)!important;font:700 13px var(--font-head)}.kmgesamt{background:#f4d35e!important;color:#3a2e00}.kmwarnh{background:#b9bcc2!important;color:#17212b}
.kmcolh{display:flex;align-items:center;justify-content:center;gap:6px;cursor:grab;border-radius:7px;padding:1px 6px}.kmcolh:hover{background:rgba(255,255,255,.35)}.kmcolh.drag{opacity:.4}.kmcolh.over{outline:2px dashed var(--accent);outline-offset:-2px}
.kmcoln{cursor:pointer;font-weight:800;color:inherit}.kmcoln:hover{text-decoration:underline}
.kmplus{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:5px;border:1px solid rgba(0,0,0,.25);background:rgba(255,255,255,.85);color:#17212b;font:800 13px/1 var(--font-body);cursor:pointer}.kmplus:hover{background:#fff}
.kmsok{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#4a4e55;color:#fff;font:700 12px/1 var(--font-body);cursor:pointer;margin-left:4px}
.kmvh{height:96px;width:44px;min-width:44px;padding:4px 2px!important}.kmvh span{writing-mode:vertical-rl;transform:rotate(180deg);font:600 11px var(--font-body);color:var(--muted);display:inline-block;max-height:90px}.kmvh.wide{width:auto}.kmvh .h{writing-mode:horizontal-tb;transform:none;font:700 12px var(--font-body);color:var(--ink)}
.kmsub{vertical-align:bottom;text-align:left!important;position:sticky!important;left:0;z-index:5!important}.kmcnt{display:inline-block;background:#d9d9dc;color:#333;border-radius:4px;padding:2px 8px;font:600 12px var(--font-body)}
.kmnt tbody td{background:var(--surface)}.kmnt tbody tr:hover td{filter:brightness(.97)}
.kmnt td.kmno{color:var(--muted);width:30px;position:sticky;left:0;z-index:2;text-align:right}.kmnt td.kmn{text-align:left;min-width:230px;position:sticky;left:30px;z-index:2}.kmnt td.kmmw{width:40px;color:var(--muted)}
.kmnl{cursor:pointer}.kmnl:hover{color:var(--accent)}
.kmc{background:color-mix(in srgb,var(--c,transparent) 14%,var(--surface))!important;min-width:44px}.kmpc2.ak{color:var(--good);font-weight:700}.kmpc2.pa{color:var(--warn);font-weight:700}.kmpc2.ab{color:var(--bad);font-weight:700}
.kmtot{background:color-mix(in srgb,#f4d35e 20%,var(--surface))!important}.kmns{min-width:110px}.kmnn{width:30px}
tr.kmbad td{background:var(--bad-soft)!important}tr.kmwarn td{background:var(--warn-soft)!important}tr.kmbad td.kmc,tr.kmwarn td.kmc{background:inherit}
.kmsm input{width:34px;text-align:center;border:1px solid var(--line);border-radius:6px;padding:2px;background:var(--surface);color:var(--ink)}
.kmck{min-width:70px}.kmbox{display:inline-grid;place-items:center;width:20px;height:20px;border:1.5px solid var(--muted);border-radius:4px;cursor:pointer;background:var(--surface);font-weight:800;color:var(--good);vertical-align:middle}.kmck.on .kmbox{border-color:var(--good)}.kmck small{display:block;font-size:10px;color:var(--muted)}

.kmcat{width:44px;min-width:44px;height:132px;padding:6px 2px!important;background:var(--c,#a8aab0)!important;vertical-align:bottom}.kmcat .kmcolh{display:flex;justify-content:center;height:100%;padding:2px 0;cursor:grab}.kmcat .kmcolh:hover{background:rgba(255,255,255,.3)}
.kmvt{writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap;font:800 12px var(--font-body);max-height:118px;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.kmlb{background:var(--surface2)!important;text-align:center;font:700 12px var(--font-body)}
.kmin th.kmeh{min-width:128px;vertical-align:top;background:var(--surface2);padding:6px;position:relative}.kmin .kmet,.kmin .kmed{width:100%;display:block;margin-bottom:4px;font:600 13px var(--font-body);border:1px solid var(--line);border-radius:6px;padding:3px 6px;background:var(--surface);color:var(--ink)}.kmin .kmem2{font:500 12px var(--font-body);color:var(--muted);display:flex;align-items:center;gap:4px;justify-content:center}.kmin .kmem{width:52px;text-align:center;border:1px solid var(--line);border-radius:6px;padding:2px;background:var(--surface);color:var(--ink)}
.kmedel{position:absolute;top:2px;right:2px;width:20px;height:20px;border:0;border-radius:50%;background:transparent;color:var(--bad);font:700 16px/1 var(--font-body);cursor:pointer;z-index:1}.kmedel:hover{background:var(--bad-soft)}
.kmin{border-collapse:separate;border-spacing:0;font-size:13px;width:max-content;min-width:100%}.kmin th,.kmin td{border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:4px 6px;text-align:center;white-space:nowrap}.kmin td{background:var(--surface)}.kmin thead th{position:sticky;top:0;z-index:3}
.kmin td.kmno{position:sticky;left:0;z-index:2;color:var(--muted);text-align:right;width:30px}.kmin td.kmn{position:sticky;left:30px;z-index:2;text-align:left;min-width:220px}.kmin th.kmsub{position:sticky;left:0;z-index:5}
.kmpt input{width:70px;text-align:center;border:1px solid transparent;border-radius:6px;padding:4px 2px;background:transparent;color:var(--ink);font:inherit}.kmpt input:hover{border-color:var(--line)}.kmpt input:focus{border-color:var(--accent);background:var(--surface);outline:none}
.kmin tr.kmavg td{background:var(--surface2);font-weight:700;color:var(--muted)}.kmin tr.kmavg td:first-child{text-align:right}
.kmin .kmpc2.ak{color:var(--good);font-weight:700}.kmin .kmpc2.pa{color:var(--warn);font-weight:700}.kmin .kmpc2.ab{color:var(--bad);font-weight:700}

.kmtable .kmrow:focus-within{background:var(--accent-soft);box-shadow:inset 3px 0 0 var(--accent)}
.kmin tbody tr:focus-within td{background:var(--accent-soft)}
.kmth .kmcolh{display:block;text-align:center;cursor:pointer;border-radius:6px;padding:2px 4px;text-transform:uppercase;font:inherit;letter-spacing:inherit}.kmth .kmcolh:hover{background:var(--accent-soft);color:var(--accent)}.kmth .kmcolh.over{outline:2px dashed var(--accent)}
.kmsmi{width:46px;text-align:center;border:1px solid var(--line);border-radius:7px;padding:4px 2px;background:var(--surface);color:var(--ink);font:600 14px var(--font-body)}.kmsmi.kmsel{background:var(--accent-soft);border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}.kmsmi:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 2px var(--accent-soft)}
@media(max-width:700px){.kmbody{grid-template-columns:1fr}.kmside{position:sticky;top:0;z-index:5;flex-direction:row;overflow-x:auto;align-items:center;padding:6px}.kmsidet{border:0;margin:0;padding:0 8px;white-space:nowrap}.kmicon{flex:1;min-width:64px}}
`;
  document.head.appendChild(st);

  /* Eingabeseite nach jedem Zeichnen berechnen */
  new MutationObserver(() => { const t = document.querySelector('.kmin'); if (t && !t.dataset.done) { t.dataset.done = '1'; sheetRefresh(); } }).observe(document.getElementById('main'), { childList: true, subtree: true });
  return { view, studentPage, sorted, classes };
})();
render();
/* Stand der Programmdateien anzeigen (schreibt der Update-Dienst der NAS) */
try { fetch('/version.txt', { cache: 'no-store' }).then((r) => (r.ok ? r.text() : '')).then((t) => { t = String(t || '').trim(); const e = document.getElementById('appver'); if (t && t.length < 80 && e) e.textContent = 'Stand ' + t; }); } catch (e) { /* */ }
