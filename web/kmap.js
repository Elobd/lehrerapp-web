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
  function view(v) {
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
    return `<div class="km"><div class="kmcls"><div class="kmchips">${chips}</div>${cfg().manual || Number.isInteger(cfg().div) ? `<div class="kmtools"><button class="kmtool" data-act="kmauto" title="Automatische Reihenfolge wiederherstellen">Auto</button></div>` : ''}</div>
      ${headH}<div class="kmbody"><nav class="kmside" aria-label="Bereiche"><div class="kmsidet">Klasse<b${c.names.length > 1 ? ' class="m"' : ''}>${disp(c)}</b></div>${side}</nav><section class="kmmain">${bodyH}</section></div></div>`;
  }

  function general(c) {
    const sts = studentsOf(c), m = sts.filter((s) => s.g === 'm').length, w = sts.filter((s) => s.g === 'w').length, o = sts.length - m - w;
    const c0 = cfg(), isKv = norm(c0.kvClass || '') === c.key, editKv = U.kmKvEdit === c.key;
    const kvFallback = (() => { for (const G of c.groups) { const t = kvText(G, cinfo(G.slug)); if (t) return t; } return ''; })();
    const kvName = (c0.kvn && c0.kvn[c.key]) || kvFallback || (isKv ? 'Ich' : '');
    const subj = c.groups.filter((G) => kind(G)).map((G) => `<div class="kmsj"><b>${SUBJ[kind(G)]}</b>${G.day ? ' <span class="muted sm">(' + esc(G.day) + ')</span>' : ''}${timeRows(G).length ? timeHtml(timeRows(G)) : '<div class="muted sm">keine Stunden im Stundenplan</div>'}</div>`).join('');
    const kvRow = editKv
      ? `<input class="kminp" id="kmkvin" data-ch="kmkvn" data-key="${c.key}" value="${esc(kvName === 'Ich' && !(c0.kvn && c0.kvn[c.key]) ? '' : kvName)}" placeholder="Name des Klassenvorstands" autocomplete="off">`
      : `<span class="kmv">${kvName ? esc(kvName) : '<span class="muted">nicht eingetragen</span>'}</span>`;
    return `<!--H--><div class="kmh"><h1>Klasse ${disp(c)}</h1></div><!--/H-->
    <div class="kmgrid">
      <div class="card"><h2>Überblick</h2>
        <div class="kmkvr"><span class="kmk">Klassenvorstand</span>${kvRow}<button class="kmpen" data-act="kmkvedit" data-key="${c.key}" title="${editKv ? 'Fertig' : 'Klassenvorstand bearbeiten'}" aria-label="Klassenvorstand bearbeiten">${editKv ? '✓' : '✎'}</button></div>
        <div class="kmkvr"><span class="kmk">Schüleranzahl</span><span class="kmv">${sts.length ? sts.length + ' (' + m + 'm / ' + w + 'w' + (o ? ' / ' + o + ' ohne Angabe' : '') + ')' : '<span class="muted">noch keine Schüler</span>'}</span></div>
        <label class="kmchk"><input type="checkbox" data-ch="kmkvme" data-key="${c.key}" ${isKv ? 'checked' : ''}> Das ist meine Klasse als Klassenvorstand (steht immer zuerst)</label></div>
      <div class="card"><h2>Meine Stunden</h2>${subj || '<div class="muted sm">Keine Stunden</div>'}</div>
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
    const all = studentsSorted(G), fl = multi && U.kmcf && U.kmcf[G.slug] && G.classes.includes(U.kmcf[G.slug]) ? U.kmcf[G.slug] : '', both = all.some((x) => x.g === 'm') && all.some((x) => x.g === 'w'), gf = both && U.kmgf && U.kmgf[G.slug] || '', list = all.filter((x) => (!fl || x.kl === fl) && (!gf || x.g === gf)), nl = nextLesson(G), lg = logOf(ci).filter((e) => e.text).slice(0, 3);
    const tests = grpTests(G).filter((t) => t.status === 'geplant' && t.date >= TODAY).slice(0, 3);
    const head = `<!--H--><div class="kmh"><h1>${SUBJ[kd]}<span class="kmsep kmh1">I</span><span class="muted" style="font-weight:500">Klasse ${disp(c)}</span></h1></div><!--/H-->`;
    let cards = `<div class="kmgrid">
      <div class="card"><h2>Nächste Stunde</h2>${nl ? `<div class="kmbig" style="font-size:20px">${esc(dshort(nl.date))}</div><div class="muted">${nl.von ? esc(nl.von) + (nl.bis ? '–' + esc(nl.bis) : '') : ''}${nl.room ? (nl.von ? '<span class="kmsep">I</span>' : '') + esc(nl.room) : ''}</div><button class="btn sm" style="margin-top:8px" data-act="godate" data-slug="${G.slug}" data-d="${nl.date}">Stunde vorbereiten</button>` : '<div class="muted sm">Keine kommende Stunde</div>'}</div>
      <div class="card"><h2>Letzte Stundeninhalte</h2>${lg.length ? lg.map((e) => `<div class="kmli"><a href="#stunde-${G.slug}--${esc(e.id)}" data-act="go" data-v="stunde-${G.slug}--${esc(e.id)}"><b>${esc(dshort(e.date))}</b> ${esc(e.text)}</a></div>`).join('') : '<div class="muted sm">Noch kein Stoff eingetragen</div>'}<a class="kmmore" href="#klasse-${G.slug}" data-act="go" data-v="klasse-${G.slug}">Alle Stunden, Themen und Notizen ›</a></div>
      <div class="card"><h2>Anstehende Tests</h2>${tests.length ? tests.map((t) => `<div class="kmli"><b>${esc(dshort(t.date))}</b> ${esc(t.title || KINDS[t.kind] || 'Test')} <span class="pill">${esc(KINDS[t.kind] || 'Test')}</span></div>`).join('') : '<div class="muted sm">Keine geplanten Tests</div>'}<a class="kmmore" href="#klasse-${G.slug}" data-act="go" data-v="klasse-${G.slug}">Tests verwalten ›</a></div>
    </div>`;
    const pn = U.prn && U.prn[G.slug], isG = kd === 'gpb';
    let tbl, gear = '', colPanel = '', cardsExtraInfo = '';
    if (isG) {
      const cols = visCols(c), ew = resDoc(G).ew || {}, sem = resDoc(G).sem || {}, hb = (cfg().hidb || {})[c.key] || [];
      const m = list.filter((x) => x.g === 'm').length, w = list.filter((x) => x.g === 'w').length;
      const BI = [['pc', 'Gesamt', 'minmax(60px,.45fr)'], ['note', 'Notenstand', 'minmax(112px,.8fr)'], ['s1', 'Note 1. Sem.', 'minmax(58px,.4fr)'], ['s2', 'Note 2. Sem.', 'minmax(58px,.4fr)']].filter((b) => !hb.includes(b[0]));
      const on = (id) => BI.some((b) => b[0] === id);
      const grid = `34px 38px minmax(150px,1.6fr) 44px ${multi ? '56px ' : ''}${cols.map(() => 'minmax(72px,.6fr)').join(' ')} ${BI.map((b) => b[2]).join(' ')}`.replace(/\s+/g, ' ').trim();
      const mn = 294 + (multi ? 64 : 0) + cols.length * 80 + BI.length * 76;
      const th = cols.map((k) => `<span class="kmpc kmcolh" draggable="true" data-col="${k.id}" data-act="kmcol" data-key="${c.key}" data-slug="${G.slug}" title="Klick: Eingabe öffnen · Ziehen: Spalte verschieben" tabindex="0" role="link">${esc(k.name)}</span>`).join('');
      const thb = BI.map((b) => `<span class="kmpc">${b[1]}</span>`).join('');
      const rows = list.map((x, i) => {
        const P = perfOf(G, x, cols), e = ew[x.id] || {}, sm = sem[x.id] || {};
        const ck = (k) => { const d = e[k]; return `<span class="kmpc">${P.note >= 4 || d ? `<span class="kmbox" data-act="kmew" data-slug="${G.slug}" data-id="${esc(x.id)}" data-k="${k}" role="checkbox" aria-checked="${!!d}" tabindex="0" title="${d ? 'Eingetragen am ' + esc(dshort(d)) + ' · Klick zum Zurücknehmen' : 'Klick trägt das heutige Datum ein'}">${d ? '✓' : ''}</span>${d ? `<small class="muted"> ${esc(dshort(d).replace(/^[A-Za-z]+, /, ''))}</small>` : ''}` : ''}</span>`; };
        const sinp = (k) => `<span class="kmpc"><input class="kmsmi" data-act="kmnop" data-ch="kmsem" data-slug="${G.slug}" data-id="${esc(x.id)}" data-s="${k}" inputmode="numeric" maxlength="1" value="${esc(sm[k] || '')}" aria-label="Note ${k}. Semester"></span>`;
        const cells = P.per.map((a) => (a.n ? pctL(a.pc) : '<span class="kmp"></span>')).join('');
        const bi = (on('pc') ? (P.tm ? pctL(P.pc) : '<span class="kmp"></span>') : '') + (on('note') ? (P.tm ? `<span class="kmpc"><span class="kmp ${P.note === 5 ? 'ab' : P.note === 4 ? 'pa' : 'ak'}">${P.note}</span> <span class="muted sm">${GRADES[P.note]}</span></span>` : '<span></span>') : '') + (on('s1') ? sinp(1) : '') + (on('s2') ? sinp(2) : '');
        return `<div class="kmrow kmgo" data-act="kmstu" data-slug="${G.slug}" data-id="${esc(x.id)}" tabindex="0" role="link"><span class="kmno">${i + 1}</span><span class="kmav" aria-hidden="true">${esc((x.vn[0] || '') + (x.nn[0] || ''))}</span><span class="kmnm"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span><span class="kmpc kmgen">${esc(x.g === 'm' || x.g === 'w' || x.g === 'd' ? x.g : '')}</span>${multi ? `<span class="kmcl">${esc(x.kl)}</span>` : ''}${cells}${bi}</div>`;
      }).join('');
      tbl = list.length ? `<div class="kmtable" style="--kmgrid:${grid};--kmmin:${mn}px"><div class="kmrow kmth"><span>Nr</span><span></span><span>Name</span><span class="kmpc kmgh" title="Geschlecht">m/w</span>${multi ? '<span>Klasse</span>' : ''}${th}${thb}</div>${rows}</div>${resItems(G).length ? '' : '<p class="muted sm" style="margin:8px 0 0">Klicke auf den Namen einer Spalte (zum Beispiel „Check-Ups“). Dort trägst du die Punkte ein, die Prozente erscheinen dann hier.</p>'}` : '<p class="muted" style="margin:0">Noch keine Schüler. Im Stundenplan „Von WebUntis übernehmen“ und „Alle Klassen holen“ nutzen.</p>';
      gear = `<button class="btn sm${U.kmColEdit ? ' good' : ''}" data-act="kmcoledit" title="Spalten bearbeiten: umbenennen, ergänzen, ausblenden, Notenschlüssel">✎ Bearbeiten</button>`;
      if (U.kmColEdit) colPanel = `<div class="kmcolp"><div class="muted sm" style="margin-bottom:8px">Die Leistungs-Spalten gelten für alle Geschichte-Klassen. Die Reihenfolge änderst du, indem du eine Spaltenüberschrift in der Liste verschiebst.</div>${colsDef().map((k) => `<div class="kmcolr"><input class="kminp" data-ch="kmcolname" data-col="${k.id}" value="${esc(k.name)}" maxlength="28" aria-label="Spaltenname"><label class="kmchk" style="margin:0"><input type="checkbox" data-ch="kmcolvis" data-col="${k.id}" data-key="${c.key}" ${hiddenOf(c.key).includes(k.id) ? '' : 'checked'}> in dieser Klasse anzeigen</label><button class="btn sm bad" data-act="kmcoldel" data-col="${k.id}">Löschen</button></div>`).join('')}<div class="kmcolr"><input class="kminp" id="kmcolnew" placeholder="Neue Spalte, z. B. Referat" maxlength="28" autocomplete="off"><button class="btn sm good" data-act="kmcoladd">+ Spalte hinzufügen</button></div>
        <div class="kmcolr" style="margin-top:12px"><b class="sm">Weitere Spalten in dieser Klasse:</b>${[['pc', 'Gesamt'], ['note', 'Notenstand'], ['s1', 'Note 1. Semester'], ['s2', 'Note 2. Semester']].map(([id, n]) => `<label class="kmchk" style="margin:0"><input type="checkbox" data-ch="kmbivis" data-b="${id}" data-key="${c.key}" ${hb.includes(id) ? '' : 'checked'}> ${n}</label>`).join('')}</div>
        <div class="kmcolr" style="margin-top:12px;align-items:flex-end"><b class="sm">Notenschlüssel (ab Prozent)</b>${['Sehr gut', 'Gut', 'Befriedigend', 'Genügend'].map((n, i) => `<label class="f" style="width:96px">${n}<input data-ch="kmlimit" data-i="${i}" inputmode="numeric" value="${limits()[i]}"></label>`).join('')}<span class="muted sm">darunter: Nicht genügend. Vorläufige Werte, bitte an deinen Schlüssel anpassen.</span></div></div>`;
      cardsExtraInfo = `${list.length} Schüler${m || w ? ' (' + m + 'm / ' + w + 'w)' : ''}`;
    } else {
      const rows = list.map((x, i) => { const s = stat(G, x); return `<div class="kmrow kmgo" data-act="kmstu" data-slug="${G.slug}" data-id="${esc(x.id)}" tabindex="0" role="link"><span class="kmno">${i + 1}</span><span class="kmav" aria-hidden="true">${esc((x.vn[0] || '') + (x.nn[0] || ''))}</span><span class="kmnm"><b>${esc(up(x.nn))}</b> ${esc(x.vn)}</span><span class="kmpc kmgen">${esc(x.g === 'm' || x.g === 'w' || x.g === 'd' ? x.g : '')}</span>${multi ? `<span class="kmcl">${esc(x.kl)}</span>` : ''}${pct(s.pa, 'ak')}${pct(s.pp, 'pa')}${pct(s.pb, 'ab')}</div>`; }).join('');
      tbl = list.length ? `<div class="kmtable" style="--kmgrid:34px 38px minmax(150px,1.6fr) 44px ${multi ? '56px ' : ''}repeat(3,minmax(58px,.55fr));--kmmin:${multi ? 564 : 500}px"><div class="kmrow kmth"><span>Nr</span><span></span><span>Name</span><span class="kmpc kmgh" title="Geschlecht">m/w</span>${multi ? '<span>Klasse</span>' : ''}<span class="kmpc">aktiv</span><span class="kmpc">passiv</span><span class="kmpc">fehlt</span></div>${rows}</div>${list.some((x) => stat(G, x).t) ? '' : '<p class="muted sm" style="margin:8px 0 0">Prozentwerte erscheinen, sobald du in den Stunden die Anwesenheit kontrollierst.</p>'}` : '<p class="muted" style="margin:0">Noch keine Schüler. Im Stundenplan „Von WebUntis übernehmen“ und „Alle Klassen holen“ nutzen.</p>';
    }
    if (isG) {
      const cols0 = visCols(c), risk = all.map((x) => ({ x, P: perfOf(G, x, cols0) })).filter((r) => r.P.note >= 4);
      cards = cards.replace(/<\/div>\s*$/, `<div class="card"><h2>Notenmäßig gefährdet</h2>${risk.length ? risk.map((r) => `<div class="kmli"><span class="kmp ${r.P.note === 5 ? 'ab' : 'pa'}">${r.P.note}</span> <b>${esc(up(r.x.nn))}</b> ${esc(r.x.vn)} <span class="muted sm">${r.P.pc} %</span></div>`).join('') : '<div class="muted sm">Niemand mit Genügend oder Nicht genügend</div>'}<span class="kmmore" data-act="kmsok" role="button" tabindex="0" style="cursor:pointer">Frühwarnung in Sokrates verfassen ›</span></div></div>`);
    }
    const stu = `<section class="card" style="margin-top:14px"><div class="row" style="margin-bottom:10px"><h2 style="margin:0">Schülerliste</h2><span class="muted sm">${list.length} Schüler (${(list.some((x) => x.g === 'm') ? 'm' : '') + (list.some((x) => x.g === 'm') && list.some((x) => x.g === 'w') ? '/' : '') + (list.some((x) => x.g === 'w') ? 'w' : '')})</span>${multi ? `<span class="kmflt" role="group" aria-label="Nach Klasse filtern">${['', ...G.classes].map((k) => `<button class="kmfb${(fl || '') === k ? ' on' : ''}" data-act="kmcf" data-slug="${G.slug}" data-k="${esc(k)}">${k ? esc(String(k).toUpperCase()) : 'Alle'}</button>`).join('')}</span>` : ''}${both ? `<button class="kmfb on" data-act="kmgf" data-slug="${G.slug}" title="Klick wechselt: m/w, m, w" aria-label="Geschlecht filtern: ${gf || 'm/w'}" style="margin-left:6px;min-width:46px">${gf || 'm/w'}</button>` : ''}<span style="flex:1"></span>${gear}<button class="btn sm pr" data-act="stuprint" data-slug="${G.slug}" aria-expanded="${!!pn}" aria-label="Schülerliste drucken" title="Schülerliste drucken">${prnIcon}</button></div>${colPanel}${prnPanel(G)}${tbl}</section>`;
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
    <section class="card kmprofile"><div class="kmavbig">${esc((x.vn[0] || '') + (x.nn[0] || ''))}</div><div><h1 style="margin:0">${esc(up(x.nn))} ${esc(x.vn)}</h1><div class="muted">Klasse ${esc(x.kl || (c ? c.names[0] : ''))} · ${SUBJ[kd] || esc(G.subject)}${x.g === 'm' || x.g === 'w' ? ' · ' + x.g : ''}</div></div></section>
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
.kmth .kmgh{text-transform:none}.kmgen{color:var(--muted);font-weight:600}.kmflt{display:inline-flex;margin-left:6px;gap:4px;flex-wrap:wrap}.kmfb{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:7px;padding:3px 10px;font:600 13px var(--font-body);cursor:pointer}.kmfb.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
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
.kmli{padding:5px 0;border-top:1px solid var(--line);font-size:14px}.kmli:first-of-type{border-top:0}.kmli a{color:inherit;text-decoration:none}.kmli a:hover{color:var(--accent)}
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
.kmsmi{width:46px;text-align:center;border:1px solid var(--line);border-radius:7px;padding:4px 2px;background:var(--surface);color:var(--ink);font:600 14px var(--font-body)}.kmsmi:focus{border-color:var(--accent);outline:none;box-shadow:0 0 0 2px var(--accent-soft)}
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
