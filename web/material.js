/* Material (Stufe 1, ohne KI): Quellen (PDF, Screenshot mit Texterkennung, eingefügter Text, Video-Link),
   Themensuche, Arbeitsblatt / Lückentext / Kreuzworträtsel als Word + PDF, Ablage auf der NAS (data/files/Material). */
const MAT = (() => {
  const ROOT = 'Material', QDIR = ROOT + '/Quellen', ODIR = ROOT + '/Ergebnisse', TPL = ROOT + '/Vorlage/arbeitsblatt.docx';
  const M = () => (U.mat = U.mat || { tab: 'quellen', sel: [], q: '', res: null, busy: '', files: null, open: null });
  const TYPES = { buch: 'Buch', pdf: 'PDF', video: 'Video / Link', sonst: 'Sonstiges' };
  const T = {}; // Textcache je Quelle: { id: {pages:[{p,t}]} }
  const url = (p, extra) => '/api/file?path=' + encodeURIComponent(p) + (extra || '');
  const pad2 = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const slugify = (s) => String(s || 'Material').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Material';

  /* ---------- Dateien auf der NAS ---------- */
  async function fput(path, data) { const r = await fetch(url(path), { method: 'PUT', body: data, credentials: 'same-origin' }); if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Speichern fehlgeschlagen'); return r.json(); }
  async function fgetJson(path) { const r = await fetch(url(path), { credentials: 'same-origin' }); if (!r.ok) return null; return r.json(); }
  async function fgetBuf(path) { const r = await fetch(url(path), { credentials: 'same-origin' }); if (!r.ok) return null; return r.arrayBuffer(); }
  async function fdel(path) { await fetch(url(path), { method: 'DELETE', credentials: 'same-origin' }); }
  async function flist(dir) { const r = await fetch('/api/files?dir=' + encodeURIComponent(dir), { credentials: 'same-origin' }); if (!r.ok) throw new Error('Ablage nicht erreichbar. Die neue server.js muss auf der NAS liegen.'); return (await r.json()).files; }

  const loadScript = (src, glob) => new Promise((ok, no) => { if (window[glob]) return ok(window[glob]); const s = document.createElement('script'); s.src = src; s.onload = () => ok(window[glob]); s.onerror = () => no(new Error('Bibliothek konnte nicht geladen werden (' + glob + ')')); document.head.appendChild(s); });
  const loadZip = () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'JSZip');
  const loadOcr = () => loadScript('https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.5/tesseract.min.js', 'Tesseract');

  /* ---------- YouTube-Infos ---------- */
  const isYt = (u) => /^(https?:\/\/)?((www|m|music)\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(String(u || '').trim());
  const dur = (sec) => { sec = +sec; if (!(sec >= 0)) return ''; const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + pad2(m) : m) + ':' + pad2(s) + (h ? ' Std' : ' Min'); };
  async function ytFetch(u) {
    const r = await fetch('/api/yt?url=' + encodeURIComponent(u), { credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || (r.status === 404 ? 'Die neue server.js fehlt auf der NAS' : 'Abruf fehlgeschlagen'));
    return j;
  }
  const ytVid = (u) => { const m = String(u || '').match(/(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/); return isYt(u) && m ? m[1] : null; };
  const ytFields = (i) => ({ url: i.url, vtitle: i.title || '', channel: i.channel || '', channelUrl: i.channelUrl || '', seconds: i.seconds == null ? null : i.seconds });

  /* ---------- Quellen ---------- */
  const sources = () => Object.values(S.settings).filter((d) => d && /^mat_/.test(d.id || '')).sort((a, b) => (b.added || 0) - (a.added || 0));
  const srcOf = (id) => S.settings['mat_' + id];
  async function textOf(id) {
    if (T[id]) return T[id];
    const j = await fgetJson(QDIR + '/' + id + '.json');
    return (T[id] = j || { pages: [] });
  }
  async function saveText(id) { await fput(QDIR + '/' + id + '.json', new Blob([JSON.stringify(T[id])], { type: 'application/json' })); const s = srcOf(id); if (s) put('settings', Object.assign({}, s, { pages: T[id].pages.length })); }
  async function addPages(id, pages) {
    const t = await textOf(id);
    pages.forEach((p) => { const i = t.pages.findIndex((x) => x.p === p.p); if (i >= 0) t.pages[i] = p; else t.pages.push(p); });
    t.pages.sort((a, b) => a.p - b.p);
    await saveText(id);
  }
  const nextPage = async (id) => { const t = await textOf(id); return (t.pages.reduce((m, x) => Math.max(m, x.p), 0) || 0) + 1; };

  async function importPdf(id, file) {
    const m = M(); m.busy = 'PDF wird gelesen …'; render();
    try {
      const s = srcOf(id), name = id + '-' + slugify(file.name.replace(/\.pdf$/i, '')) + '.pdf';
      await fput(QDIR + '/' + name, file);
      const lib = await loadPdfJs(), doc = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = []; let empty = 0;
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i), c = await pg.getTextContent(), txt = c.items.map((x) => x.str).join(' ').replace(/\s+/g, ' ').trim();
        if (txt.length < 20) empty++;
        pages.push({ p: i, t: txt });
        if (i % 10 === 0) { m.busy = 'PDF wird gelesen … Seite ' + i + ' von ' + doc.numPages; render(); }
      }
      await addPages(id, pages);
      put('settings', Object.assign({}, srcOf(id) || s, { file: QDIR + '/' + name, pages: pages.length }));
      toast('PDF gespeichert: ' + pages.length + ' Seiten' + (empty ? ', ' + empty + ' ohne Text (vermutlich gescannt, dafür „Seite per Screenshot“ nutzen)' : ''));
    } catch (e) { toast('PDF-Fehler: ' + (e.message || e)); }
    m.busy = ''; render();
  }
  async function importEpub(id, file) {
    const m = M(); m.busy = 'EPUB wird gelesen …'; render();
    try {
      const Z = await loadZip(), z = await Z.loadAsync(await file.arrayBuffer()), P = new DOMParser();
      const read = async (n) => { const f = z.file(n); return f ? f.async('string') : null; };
      const cont = await read('META-INF/container.xml'); if (!cont) throw new Error('Das ist keine gültige EPUB-Datei');
      const opfPath = (P.parseFromString(cont, 'text/xml').querySelector('rootfile') || {}).getAttribute?.('full-path'); if (!opfPath) throw new Error('EPUB ohne Inhaltsverzeichnis');
      const opf = P.parseFromString(await read(opfPath), 'text/xml'), base = opfPath.includes('/') ? opfPath.replace(/[^/]*$/, '') : '';
      const man = {}; opf.querySelectorAll('manifest > item').forEach((it) => { man[it.getAttribute('id')] = it.getAttribute('href'); });
      const order = [...opf.querySelectorAll('spine > itemref')].map((x) => man[x.getAttribute('idref')]).filter(Boolean);
      const pages = []; let n = 0;
      for (const href of order) {
        const path = decodeURIComponent((base + href).replace(/#.*$/, '')).replace(/[^/]+\/\.\.\//g, ''), html = await read(path); if (!html) continue;
        const doc = P.parseFromString(html, 'text/html'); doc.querySelectorAll('script,style,nav,head').forEach((x) => x.remove());
        doc.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,br,tr,blockquote').forEach((x) => x.appendChild(doc.createTextNode(' ')));
        const title = ((doc.querySelector('h1,h2,h3') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Abschnitt ' + (pages.length + 1);
        const txt = (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim(); if (txt.length < 30) continue;
        let rest = txt, part = 0;
        while (rest.length) { let cut = rest.length > 2500 ? rest.lastIndexOf('. ', 2500) : rest.length; if (cut < 800) cut = Math.min(rest.length, 2500); else if (cut < rest.length) cut += 1; part++; pages.push({ p: ++n, t: rest.slice(0, cut).trim(), h: title + (txt.length > 2500 ? ' (Teil ' + part + ')' : '') }); rest = rest.slice(cut).trim(); }
        if (n % 20 === 0) { m.busy = 'EPUB wird gelesen … ' + n + ' Abschnitte'; render(); }
      }
      if (!pages.length) throw new Error('Kein Text gefunden. Die Datei ist vermutlich kopiergeschützt (DRM).');
      const name = id + '-' + slugify(file.name.replace(/\.epub$/i, '')) + '.epub';
      await fput(QDIR + '/' + name, file);
      await addPages(id, pages);
      put('settings', Object.assign({}, srcOf(id), { epub: QDIR + '/' + name, pages: pages.length }));
      toast('EPUB gespeichert: ' + pages.length + ' Abschnitte');
    } catch (e) { toast('EPUB-Fehler: ' + (e.message || e)); }
    m.busy = ''; render();
  }
  async function ocrImages(id, files) {
    const m = M(); let p = +document.getElementById('matpg-' + id)?.value || await nextPage(id);
    try {
      m.busy = 'Texterkennung wird geladen …'; render();
      const Tess = await loadOcr(), done = [];
      for (const f of files) {
        m.busy = 'Texterkennung Seite ' + p + ' …'; render();
        const r = await Tess.recognize(f, 'deu');
        const txt = (r.data.text || '').replace(/-\n/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
        done.push({ p, t: txt }); p++;
        try { await fput(QDIR + '/' + id + '-s' + (p - 1) + '.png', f); } catch (e) { /* Bild optional */ }
      }
      await addPages(id, done);
      toast(done.length + ' Seite(n) erkannt und gespeichert. Prüfe bitte den Text in der Quelle.');
    } catch (e) { toast('Texterkennung: ' + (e.message || e)); }
    m.busy = ''; render();
  }

  /* ---------- Suche ---------- */
  const norm = (s) => String(s || '').toLowerCase();
  async function search() {
    const m = M(), q = norm(m.q).split(/[\s,;]+/).filter((x) => x.length > 1);
    if (!q.length) { m.res = []; return render(); }
    m.busy = 'Suche läuft …'; render();
    const res = [];
    for (const s of sources()) {
      const t = await textOf(s.id.replace(/^mat_/, ''));
      t.pages.forEach((pg) => {
        const low = norm(pg.t); let hit = 0, cnt = 0, first = -1;
        q.forEach((w) => { let i = low.indexOf(w), n = 0; if (i >= 0) { hit++; if (first < 0 || i < first) first = i; while (i >= 0 && n < 50) { n++; i = low.indexOf(w, i + w.length); } cnt += n; } });
        if (hit) res.push({ src: s.id.replace(/^mat_/, ''), title: s.title, p: pg.p, h: pg.h, hit, cnt, first, t: pg.t });
      });
    }
    res.sort((a, b) => b.hit - a.hit || b.cnt - a.cnt);
    m.res = res.slice(0, 40); m.busy = ''; render();
  }
  const snippet = (r) => { const a = Math.max(0, r.first - 100); return (a > 0 ? '… ' : '') + r.t.slice(a, a + 320) + (r.t.length > a + 320 ? ' …' : ''); };
  const hl = (txt, q) => { let h = esc(txt); norm(q).split(/[\s,;]+/).filter((x) => x.length > 1).forEach((w) => { h = h.replace(new RegExp('(' + esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); }); return h; };

  /* ---------- Text-Hilfen (ohne KI) ---------- */
  const STOP = new Set('werden wurde wurden worden haben hatte hatten sowie dabei dieser diese dieses diesem diesen jedoch dadurch außerdem zwischen während gegen durch nicht auch einer einem einen eines noch mehr aber oder wenn dann dass sich seine ihrer ihren schon sehr viele einige andere anderen weil damit können konnte wurde nach über unter immer wieder später früher'.split(' '));
  const sentences = (txt) => String(txt).replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ„"])/).filter((x) => x.length > 20);
  function keyWords(txt, n) {
    const cnt = {}, cap = {};
    (String(txt).match(/[A-Za-zÄÖÜäöüß]{5,}/g) || []).forEach((w) => { const l = w.toLowerCase(); if (STOP.has(l)) return; cnt[l] = (cnt[l] || 0) + 1; if (/^[A-ZÄÖÜ]/.test(w)) cap[l] = (cap[l] || 0) + 1; });
    return Object.keys(cnt).filter((l) => (cap[l] || 0) * 2 >= cnt[l]).sort((a, b) => (cnt[b] * Math.min(a.length, 10)) - (cnt[a] * Math.min(b.length, 10)) || a.localeCompare(b)).slice(0, n).map((l) => l[0].toUpperCase() + l.slice(1));
  }
  const allText = () => M().sel.map((x) => x.t).join('\n');

  function gapText() {
    const txt = allText(), sents = sentences(txt), keys = keyWords(txt, 40), used = [], out = [];
    const maxGaps = Math.min(18, Math.max(6, Math.round(sents.length * 0.8)));
    sents.forEach((s) => {
      if (used.length >= maxGaps) { out.push(s); return; }
      const k = keys.find((w) => !used.includes(w) && new RegExp('(?<![A-Za-zÄÖÜäöüß])' + w + '(?![A-Za-zÄÖÜäöüß])').test(s) && s.indexOf(w) > 3);
      if (!k) { out.push(s); return; }
      used.push(k); out.push(s.replace(k, '_'.repeat(Math.max(6, Math.min(k.length + 2, 16)))));
    });
    return { text: out, words: used };
  }

  function crossword(maxWords) {
    const txt = allText(), sents = sentences(txt);
    const cand = keyWords(txt, 40).map((w) => w.toUpperCase()).filter((w) => w.length >= 4 && w.length <= 13 && /^[A-ZÄÖÜß]+$/.test(w));
    const clueOf = (w) => { const s = sents.find((x) => new RegExp('(?<![A-Za-zÄÖÜäöüß])' + w + '(?![A-Za-zÄÖÜäöüß])', 'i').test(x)); return s ? s.replace(new RegExp('(?<![A-Za-zÄÖÜäöüß])' + w + '(?![A-Za-zÄÖÜäöüß])', 'i'), '_____').slice(0, 150) + ' (' + w.length + ' Buchstaben)' : 'Begriff zum Thema (' + w.length + ' Buchstaben)'; };
    const g = new Map(), placed = [], key = (r, c) => r + ',' + c, at = (r, c) => g.get(key(r, c));
    const can = (w, r, c, d) => {
      const dr = d === 'v' ? 1 : 0, dc = d === 'h' ? 1 : 0; let cross = 0;
      if (at(r - dr, c - dc) || at(r + dr * w.length, c + dc * w.length)) return -1;
      for (let i = 0; i < w.length; i++) {
        const rr = r + dr * i, cc = c + dc * i, ex = at(rr, cc);
        if (ex) { if (ex !== w[i]) return -1; cross++; } else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) return -1;
      }
      return cross;
    };
    const put0 = (w, r, c, d) => { const dr = d === 'v' ? 1 : 0, dc = d === 'h' ? 1 : 0; for (let i = 0; i < w.length; i++) g.set(key(r + dr * i, c + dc * i), w[i]); placed.push({ w, r, c, d }); };
    if (!cand.length) return null;
    const sorted = cand.slice().sort((a, b) => b.length - a.length);
    put0(sorted[0], 0, 0, 'h');
    for (const w of sorted.slice(1)) {
      if (placed.length >= maxWords) break;
      let best = null;
      for (const p of placed) for (let i = 0; i < w.length; i++) for (let j = 0; j < p.w.length; j++) {
        if (w[i] !== p.w[j]) continue;
        const d = p.d === 'h' ? 'v' : 'h', r = d === 'v' ? p.r - i : p.r + j, c = d === 'v' ? p.c + j : p.c - i, sc = can(w, r, c, d);
        if (sc > 0 && (!best || sc > best.sc)) best = { r, c, d, sc };
      }
      if (best) put0(w, best.r, best.c, best.d);
    }
    if (placed.length < 3) return null;
    const rs = [...g.keys()].map((k) => +k.split(',')[0]), cs = [...g.keys()].map((k) => +k.split(',')[1]), r0 = Math.min(...rs), c0 = Math.min(...cs), H = Math.max(...rs) - r0 + 1, W = Math.max(...cs) - c0 + 1;
    const cells = Array.from({ length: H }, () => Array(W).fill(null));
    g.forEach((ch, k) => { const [r, c] = k.split(',').map(Number); cells[r - r0][c - c0] = { ch, n: 0 }; });
    placed.forEach((p) => { p.r -= r0; p.c -= c0; });
    let n = 0; const starts = placed.slice().sort((a, b) => a.r - b.r || a.c - b.c);
    starts.forEach((p) => { const cell = cells[p.r][p.c]; if (!cell.n) cell.n = ++n; p.n = cell.n; });
    return { cells, across: placed.filter((p) => p.d === 'h').sort((a, b) => a.n - b.n).map((p) => ({ n: p.n, clue: clueOf(p.w), w: p.w })), down: placed.filter((p) => p.d === 'v').sort((a, b) => a.n - b.n).map((p) => ({ n: p.n, clue: clueOf(p.w), w: p.w })) };
  }

  /* ---------- Dokument-Bausteine -> Word und PDF ---------- */
  const xe = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const run = (t, o) => `<w:r>${o ? `<w:rPr>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${o.sz ? `<w:sz w:val="${o.sz}"/>` : ''}${o.sup ? '<w:vertAlign w:val="superscript"/>' : ''}</w:rPr>` : ''}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  const para = (t, o, after) => `<w:p><w:pPr><w:spacing w:after="${after == null ? 120 : after}"/></w:pPr>${t === '' ? '' : run(t, o)}</w:p>`;
  function bodyXml(blocks) {
    return blocks.map((b) => {
      if (b.t === 'h') return para(b.x, { b: 1, sz: 32 }, 160);
      if (b.t === 'h2') return para(b.x, { b: 1, sz: 26 }, 100);
      if (b.t === 'p') return para(b.x, null);
      if (b.t === 'small') return para(b.x, { i: 1, sz: 18 }, 80);
      if (b.t === 'li') return para('• ' + b.x, null, 60);
      if (b.t === 'sp') return para('', null, 160);
      if (b.t === 'pb') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      if (b.t === 'grid') {
        const W = b.cells[0].length, bd = '<w:tcBorders><w:top w:val="single" w:sz="6"/><w:left w:val="single" w:sz="6"/><w:bottom w:val="single" w:sz="6"/><w:right w:val="single" w:sz="6"/></w:tcBorders>';
        return `<w:tbl><w:tblPr><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${'<w:gridCol w:w="440"/>'.repeat(W)}</w:tblGrid>${b.cells.map((row) => `<w:tr><w:trPr><w:trHeight w:val="440" w:hRule="exact"/></w:trPr>${row.map((c) => `<w:tc><w:tcPr><w:tcW w:w="440" w:type="dxa"/>${c ? bd : ''}</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${c ? (c.n ? run(String(c.n), { sz: 14, sup: 0 }) : '') + (b.sol ? run(c.ch, { b: 1, sz: 24 }) : '') : ''}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>${para('', null, 120)}`;
      }
      return '';
    }).join('');
  }
  const plain = (xml) => (xml.match(/<w:t[ >][^<]*<\/w:t>|<w:t>[^<]*<\/w:t>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join('');
  function fillTemplate(xml, vars, bodyX) {
    return xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (p) => {
      const t = plain(p);
      if (bodyX != null && t.includes('{{INHALT}}')) return bodyX;
      if (!/\{\{(TITEL|DATUM|THEMA)\}\}/.test(t)) return p;
      let done = false; const nt = t.replace(/\{\{(TITEL|DATUM|THEMA)\}\}/g, (_, k) => xe(vars[k] || ''));
      return p.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g, () => { if (done) return '<w:t></w:t>'; done = true; return `<w:t xml:space="preserve">${nt}</w:t>`; });
    });
  }
  async function makeDocx(title, blocks) {
    const Z = await loadZip(), bx = bodyXml(blocks), vars = { TITEL: title, THEMA: title, DATUM: today() };
    const tplBuf = await fgetBuf(TPL);
    if (tplBuf) {
      try {
        const z = await Z.loadAsync(tplBuf), doc = await z.file('word/document.xml').async('string');
        if (doc.includes('INHALT')) {
          let bx2 = bx;
          if (/\{\{(TITEL|THEMA)\}\}/.test(plain(doc)) && blocks[0] && blocks[0].t === 'h') bx2 = bodyXml(blocks.slice(1));
          for (const n of Object.keys(z.files).filter((f) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(f))) {
            const x = await z.file(n).async('string');
            z.file(n, fillTemplate(x, vars, n === 'word/document.xml' ? bx2 : null));
          }
          return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        }
      } catch (e) { /* Vorlage nicht nutzbar, Standardlayout */ }
    }
    const z = new Z();
    z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bx}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  async function makePdf(blocks) {
    const J = await loadJsPdf(), doc = new J({ unit: 'mm', format: 'a4' }), L = 18, R = 192, PB = 282; let y = 22;
    const need = (h) => { if (y + h > PB) { doc.addPage(); y = 22; } };
    const text = (t, size, bold, gap, ind) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); const lines = doc.splitTextToSize(String(t), R - L - (ind || 0)); lines.forEach((ln) => { need(size * 0.45); doc.text(ln, L + (ind || 0), y); y += size * 0.45; }); y += gap; };
    for (const b of blocks) {
      if (b.t === 'h') text(b.x, 18, 1, 4); else if (b.t === 'h2') text(b.x, 13, 1, 2);
      else if (b.t === 'p') text(b.x, 11, 0, 3); else if (b.t === 'small') { doc.setTextColor(110); text(b.x, 9, 0, 2); doc.setTextColor(0); }
      else if (b.t === 'li') text('• ' + b.x, 11, 0, 1.5, 3); else if (b.t === 'sp') y += 5; else if (b.t === 'pb') { doc.addPage(); y = 22; }
      else if (b.t === 'grid') {
        const H = b.cells.length, W = b.cells[0].length, cs = Math.min(9, (R - L) / W); need(H * cs + 4);
        b.cells.forEach((row, r) => row.forEach((c, k) => { if (!c) return; const x = L + k * cs, yy = y + r * cs; doc.setDrawColor(60); doc.rect(x, yy, cs, cs); if (c.n) { doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.text(String(c.n), x + 0.6, yy + 2.3); } if (b.sol) { doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text(c.ch, x + cs / 2, yy + cs * 0.72, { align: 'center' }); } }));
        y += H * cs + 6;
      }
    }
    return doc.output('blob');
  }
  async function deliver(kind, title, blocks) {
    const m = M(); m.busy = 'Datei wird erstellt …'; render();
    try {
      const dir = ODIR + '/' + slugify(title), base = kind + ' ' + slugify(title) + ' ' + new Date().toISOString().slice(0, 10);
      const docx = await makeDocx(title, blocks), pdf = await makePdf(blocks);
      await fput(dir + '/' + base + '.docx', docx); await fput(dir + '/' + base + '.pdf', pdf);
      m.files = null; m.last = { dir, base };
      toast('Gespeichert in „' + dir + '“ (Word + PDF)');
    } catch (e) { toast('Fehler: ' + (e.message || e)); }
    m.busy = ''; render();
  }

  /* ---------- Erzeugen ---------- */
  const head = (title, kind) => [{ t: 'h', x: title }, { t: 'p', x: 'Name: ______________________________      Datum: ' + today() + '      Klasse: ________' }, { t: 'sp' }];
  const refs = () => { const r = [...new Set(M().sel.map((x) => x.ref).filter(Boolean))]; return r.length ? [{ t: 'small', x: 'Quellen: ' + r.join('; ') }] : []; };
  function worksheet(title) {
    const keys = keyWords(allText(), 8), b = head(title).concat([{ t: 'h2', x: 'Text' }]);
    M().sel.forEach((x) => { sentences(x.t).length ? b.push({ t: 'p', x: x.t.replace(/\s+/g, ' ').trim() }) : b.push({ t: 'p', x: x.t }); });
    b.push({ t: 'sp' }, { t: 'h2', x: 'Aufgaben' }, { t: 'li', x: 'Lies den Text genau durch und unterstreiche die wichtigsten Begriffe.' }, { t: 'li', x: 'Fasse den Inhalt in drei bis vier Sätzen mit eigenen Worten zusammen.' });
    if (keys.length) b.push({ t: 'li', x: 'Erkläre die folgenden Begriffe: ' + keys.join(', ') + '.' });
    b.push({ t: 'li', x: 'Formuliere zwei Fragen zum Text, die deine Sitznachbarin oder dein Sitznachbar beantworten soll.' }, { t: 'sp' });
    return b.concat(refs());
  }
  function gaps(title) {
    const g = gapText(); if (!g.words.length) return null;
    const words = g.words.slice().sort((a, b) => a.localeCompare(b, 'de')), b = head(title).concat([{ t: 'h2', x: 'Lückentext' }, { t: 'p', x: 'Setze die fehlenden Wörter ein.' }, { t: 'p', x: 'Wörter: ' + words.join('  ·  ') }, { t: 'sp' }]);
    for (let i = 0; i < g.text.length; i += 4) b.push({ t: 'p', x: g.text.slice(i, i + 4).join(' ') });
    b.push({ t: 'sp' }, ...refs(), { t: 'pb' }, { t: 'h2', x: 'Lösung' }, { t: 'p', x: g.words.map((w, i) => (i + 1) + '. ' + w).join('    ') });
    return b;
  }
  function cross(title) {
    const c = crossword(14); if (!c) return null;
    const b = head(title).concat([{ t: 'h2', x: 'Kreuzworträtsel' }, { t: 'grid', cells: c.cells, sol: false }, { t: 'h2', x: 'Waagrecht' }]);
    c.across.forEach((a) => b.push({ t: 'li', x: a.n + ': ' + a.clue })); b.push({ t: 'h2', x: 'Senkrecht' });
    c.down.forEach((a) => b.push({ t: 'li', x: a.n + ': ' + a.clue }));
    b.push(...refs(), { t: 'pb' }, { t: 'h2', x: 'Lösung' }, { t: 'grid', cells: c.cells, sol: true });
    return b;
  }

  /* ---------- Alles-in-einem-Feld: Format erkennen und Quelle anlegen ---------- */
  const newSrc = (title, type, extra) => { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); put('settings', Object.assign({ id: 'mat_' + id, title, type, url: '', added: Date.now(), pages: 0 }, extra || {})); return id; };
  const base = (n) => n.replace(/\.[^.]+$/, '');
  async function docxText(file) {
    const Z = await loadZip(), z = await Z.loadAsync(await file.arrayBuffer()), f = z.file('word/document.xml'); if (!f) throw new Error('keine gültige Word-Datei');
    const x = await f.async('string');
    return x.replace(/<\/w:p>/g, ' ').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  }
  async function addLink(u) {
    const m = M();
    if (isYt(u)) {
      m.busy = 'YouTube-Infos werden geholt …'; render(); let extra = {}, t = '';
      try { const i = await ytFetch(u); extra = ytFields(i); t = i.title || ''; } catch (e) { toast('YouTube-Infos nicht abrufbar: ' + (e.message || e)); }
      return newSrc(t || u, 'video', Object.assign({ url: u }, extra));
    }
    let t = u; try { const x = new URL(u); t = x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.slice(0, 40) : ''); } catch (e) { /* */ }
    return newSrc(t, 'sonst', { url: u });
  }
  /* Rückfrage bei unbekanntem Format */
  function ask(title, msg, defVal, buttons) {
    return new Promise((ok) => {
      const o = document.createElement('div'); o.className = 'matask';
      o.innerHTML = `<div class="matbox" role="dialog" aria-modal="true"><h3 style="margin:0 0 6px">${esc(title)}</h3><div class="muted sm" style="margin-bottom:10px">${esc(msg)}</div><label class="f">Titel der Quelle<input id="matask-t" value="${esc(defVal)}" autocomplete="off"></label><div class="row" style="gap:8px;margin-top:14px;flex-wrap:wrap">${buttons.map((b) => `<button class="btn ${b.primary ? 'good' : ''}" data-k="${b.k}">${esc(b.label)}</button>`).join('')}</div></div>`;
      o.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (!b) return; const v = o.querySelector('#matask-t').value.trim(); o.remove(); ok({ k: b.dataset.k, v: v || defVal }); });
      document.body.appendChild(o); o.querySelector('button').focus();
    });
  }
  async function unknownFile(f) {
    const n = f.name || 'Datei';
    const a = await ask('Format nicht erkannt: ' + n, 'Was soll ich mit dieser Datei tun?', base(n), [
      { k: 'file', label: 'Als Datei ablegen (nicht durchsuchbar)', primary: true }, { k: 'text', label: 'Als Text lesen (durchsuchbar)' }, { k: 'skip', label: 'Überspringen' }]);
    if (a.k === 'skip') return null;
    const id = newSrc(a.v, 'sonst');
    if (a.k === 'text') {
      const raw = (await f.text()).replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
      if (raw.length < 20) { toast('Kein lesbarer Text gefunden. Die Datei wurde stattdessen abgelegt.'); a.k = 'file'; } else await addPages(id, [{ p: 1, t: raw }]);
    }
    if (a.k === 'file') { const name = id + '-' + slugify(n); await fput(QDIR + '/' + name, f); put('settings', Object.assign({}, srcOf(id), { file: QDIR + '/' + name })); }
    return id;
  }
  async function intake(files, text) {
    const m = M(), made = [], imgs = [];
    try {
      for (const f of files || []) {
        const n = f.name || '', ext = (n.match(/\.([^.]+)$/) || [])[1] ? n.match(/\.([^.]+)$/)[1].toLowerCase() : '';
        if (ext === 'pdf' || f.type === 'application/pdf') { const id = newSrc(base(n), 'pdf'); made.push(id); await importPdf(id, f); }
        else if (ext === 'epub') { const id = newSrc(base(n), 'buch'); made.push(id); await importEpub(id, f); }
        else if (/^image\//.test(f.type) || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) imgs.push(f);
        else if (ext === 'docx') { m.busy = 'Word-Datei wird gelesen …'; render(); const id = newSrc(base(n), 'sonst'); made.push(id); await addPages(id, [{ p: 1, t: await docxText(f) }]); }
        else if (['txt', 'md', 'csv', 'html', 'htm'].includes(ext) || /^text\//.test(f.type)) { const id = newSrc(base(n), 'sonst'); made.push(id); const raw = await f.text(); await addPages(id, [{ p: 1, t: (/html?$/.test(ext) ? new DOMParser().parseFromString(raw, 'text/html').body.textContent : raw).replace(/\s+/g, ' ').trim() }]); }
        else { const id = await unknownFile(f); if (id) made.push(id); }
      }
      if (imgs.length) { const id = (m.open && srcOf(m.open)) ? m.open : newSrc('Screenshots ' + today(), 'sonst'); made.push(id); await ocrImages(id, imgs); }
      const t = String(text || '').trim();
      if (t) {
        const urls = t.split(/\s+/).filter((x) => /^https?:\/\/\S+$/i.test(x));
        if (urls.length && urls.length === t.split(/\s+/).length) { for (const u of urls) made.push(await addLink(u)); }
        else { const id = newSrc(t.replace(/\s+/g, ' ').slice(0, 50) + (t.length > 50 ? ' …' : ''), 'sonst'); made.push(id); await addPages(id, [{ p: 1, t: t.replace(/\s+/g, ' ') }]); }
      }
    } catch (e) { toast('Fehler: ' + (e.message || e)); }
    m.busy = ''; if (made.length) { m.open = made[made.length - 1]; toast(made.length + (made.length === 1 ? ' Quelle angelegt' : ' Quellen angelegt')); }
    render();
  }

  /* ---------- Ansicht ---------- */
  function view() {
    const m = M(), tabs = [['quellen', 'Quellen'], ['suche', 'Suchen und Erstellen'], ['ordner', 'Ordner']];
    const nav = `<div class="row" style="gap:6px;margin-bottom:14px;flex-wrap:wrap">${tabs.map(([k, n]) => `<button class="btn ${m.tab === k ? 'good' : ''}" data-act="mattab" data-t="${k}">${n}${k === 'suche' && m.sel.length ? ' (' + m.sel.length + ')' : ''}</button>`).join('')}${m.busy ? `<span class="muted sm" style="align-self:center">⏳ ${esc(m.busy)}</span>` : ''}</div>`;
    return `<div class="km"><div class="kmh"><h1>Material</h1><div class="muted">Quellen ablegen, Themen suchen, Arbeitsmaterial erstellen. Alles liegt auf deiner NAS.</div></div>${nav}${m.tab === 'quellen' ? quellen() : m.tab === 'suche' ? suche() : ordner()}</div>`;
  }
  function quellen() {
    const m = M(), list = sources();
    const form = `<section class="card matdz" id="matdz" tabindex="0" role="button" aria-label="Dateien oder Links hineinziehen"><div class="matdzi">⬇</div><div><b>Alles hierher ziehen</b><div class="muted sm">PDF, EPUB, Word, Textdatei, Screenshot, YouTube-Link, Internetadresse oder Text. Das Format wird automatisch erkannt und die Quelle angelegt. Du kannst auch hier klicken und mit Strg+V einfügen.</div></div><input type="file" id="matdzf" multiple hidden></section>`;
    const card = (s) => {
      const id = s.id.replace(/^mat_/, '');
      return `<section class="card" style="margin-top:12px"><div class="row" style="align-items:center;gap:8px;flex-wrap:wrap"><h2 style="margin:0">${esc(s.title)}</h2><span class="pill">${esc(TYPES[s.type] || '')}</span><span class="muted sm">${s.pages || 0} Seiten/Abschnitte</span><span style="flex:1"></span>${s.url ? `<a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener">${isYt(s.url) ? 'Video auf YouTube' : 'Link öffnen'}</a>` : ''}${s.channelUrl ? `<a class="btn sm" href="${esc(s.channelUrl)}" target="_blank" rel="noopener">Kanal</a>` : ''}${isYt(s.url) ? `<button class="btn sm" data-act="matyt" data-id="${id}" title="Titel, Dauer und Kanal neu lesen">Infos neu</button>` : ''}${s.file ? `<a class="btn sm" href="${url(s.file, /\.pdf$/i.test(s.file) ? '&inline=1' : '')}" target="_blank">${/\.pdf$/i.test(s.file) ? 'PDF ansehen' : 'Datei öffnen'}</a>` : ''}<button class="btn sm bad" data-act="matdel" data-id="${id}">Löschen</button></div>
      ${s.vtitle || s.channel || s.seconds != null ? `<div class="sm" style="margin-top:8px"><span class="muted">Video:</span> <b>${esc(s.vtitle || s.title)}</b>${s.seconds != null ? ` · <span class="muted">Dauer:</span> ${esc(dur(s.seconds))}` : ''}${s.channel ? ` · <span class="muted">Kanal:</span> ${s.channelUrl ? `<a href="${esc(s.channelUrl)}" target="_blank" rel="noopener">${esc(s.channel)}</a>` : esc(s.channel)}` : ''}</div>` : ''}
      <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap;align-items:flex-end">
        <label class="btn sm">PDF hochladen<input type="file" accept="application/pdf" hidden data-ch="matpdf" data-id="${id}"></label>
        <label class="btn sm">EPUB hochladen<input type="file" accept=".epub,application/epub+zip" hidden data-ch="matepub" data-id="${id}"></label>
        <label class="f" style="width:84px">Ab Seite<input id="matpg-${id}" type="number" min="1" placeholder="auto"></label>
        <label class="btn sm">Screenshot(s) wählen<input type="file" accept="image/*" multiple hidden data-ch="matimg" data-id="${id}"></label>
        <span class="muted sm">Screenshots kannst du auch mit Strg+V einfügen, solange diese Quelle geöffnet ist.</span>
      </div>
      <details style="margin-top:10px"><summary class="sm" style="cursor:pointer">Text einfügen (z. B. Transkript eines Videos, abgetippte Buchseite)</summary><textarea id="matx-${id}" rows="5" style="width:100%;margin-top:6px" placeholder="Text hier einfügen"></textarea><div class="row" style="margin-top:6px"><button class="btn sm good" data-act="mattext" data-id="${id}">Text speichern</button></div></details>
      <div class="sm" style="margin-top:8px"><span class="muted">Notiz:</span> <input class="kminp" data-ch="matnote" data-id="${id}" value="${esc(s.notes || '')}" placeholder="Notiz zur Quelle" style="width:min(520px,100%)"></div></section>`;
    };
    const tile = (s) => {
      const id = s.id.replace(/^mat_/, ''), vid = ytVid(s.url), on = m.open === id;
      const pic = vid ? `<img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<div class="matph t-${esc(s.type || 'sonst')}"><span>${esc((TYPES[s.type] || 'Quelle'))}</span></div>`;
      return `<button class="mattile${on ? ' on' : ''}" data-act="matopen" data-id="${id}" aria-pressed="${on}" title="${esc(s.title)}"><span class="matth">${pic}${s.seconds != null ? `<b class="matdur">${esc(dur(s.seconds).replace(/ (Min|Std)$/, ''))}</b>` : ''}</span><span class="matti">${esc(s.vtitle || s.title)}</span><span class="matsub">${esc(s.channel || TYPES[s.type] || '')}${s.pages ? ' · ' + s.pages + (s.type === 'video' ? ' Textabschn.' : ' S.') : ''}</span></button>`;
    };
    const open = list.find((s) => s.id.replace(/^mat_/, '') === m.open);
    return form + (list.length ? `<div class="matgrid">${list.map(tile).join('')}</div>${open ? card(open) : '<p class="muted sm" style="margin-top:10px">Klicke auf eine Quelle, um PDFs, Screenshots oder Text hinzuzufügen.</p>'}` : '<p class="muted" style="margin-top:12px">Noch keine Quellen. Lege oben eine an und lade ein PDF hoch oder füge Screenshots ein.</p>');
  }
  function suche() {
    const m = M();
    const res = m.res == null ? '' : m.res.length ? m.res.map((r, i) => `<div class="kmli" style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row" style="gap:8px;align-items:center"><b>${esc(r.title)}</b><span class="muted sm">${r.h ? esc(r.h) : 'Seite ' + r.p}</span><span style="flex:1"></span><button class="btn sm good" data-act="matpick" data-i="${i}">Übernehmen</button></div><div class="sm">${hl(snippet(r), m.q)}</div></div>`).join('') : '<p class="muted">Nichts gefunden. Lege mehr Quellen an oder suche mit anderen Wörtern.</p>';
    const sel = m.sel.length ? m.sel.map((x, i) => `<div style="margin-bottom:10px"><div class="row" style="gap:8px"><b class="sm">${esc(x.ref || 'Text')}</b><span style="flex:1"></span><button class="btn sm bad" data-act="matunpick" data-i="${i}" aria-label="Entfernen">×</button></div><textarea rows="5" style="width:100%" data-ch="matsel" data-i="${i}">${esc(x.t)}</textarea></div>`).join('') : '<p class="muted">Noch nichts übernommen. Suche ein Thema und klicke bei den Fundstellen auf „Übernehmen“.</p>';
    const T0 = esc(m.title || m.q || '');
    return `<section class="card"><h2>Thema suchen</h2><div class="row" style="gap:8px"><input id="matq" value="${esc(m.q)}" placeholder="z. B. Römische Republik" style="flex:1;min-width:200px" data-ch="matqs" autocomplete="off"><button class="btn good" data-act="matsearch">Suchen</button></div>${res ? `<div style="margin-top:10px">${res}</div>` : ''}</section>
    <section class="card" style="margin-top:12px"><h2>Auswahl (${m.sel.length})</h2><div class="muted sm" style="margin-bottom:8px">Du kannst die Texte hier kürzen oder ergänzen. Daraus entsteht das Material.</div>${sel}
    ${m.sel.length ? `<div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap;margin-top:6px"><label class="f" style="flex:1;min-width:220px">Titel des Materials<input id="mattitle" value="${T0}" data-ch="mattitles" autocomplete="off"></label><button class="btn good" data-act="matmake" data-k="Arbeitsblatt">Arbeitsblatt</button><button class="btn good" data-act="matmake" data-k="Lückentext">Lückentext</button><button class="btn good" data-act="matmake" data-k="Kreuzworträtsel">Kreuzworträtsel</button></div><div class="muted sm" style="margin-top:6px">Jedes Material wird als Word-Datei und PDF im Ordner gespeichert. Quiz, Test und Wiederholung kommen mit der KI.</div>` : ''}</section>`;
  }
  function ordner() {
    const m = M();
    if (!m.files) { flist(ODIR).then((f) => { m.files = f; render(); }).catch((e) => { m.files = []; m.err = e.message; render(); }); return `<section class="card"><p class="muted">Ordner wird gelesen …</p></section>`; }
    const by = {}; m.files.forEach((f) => { const d = f.path.split('/').slice(0, -1).join('/').replace(ODIR + '/', ''); (by[d] = by[d] || []).push(f); });
    const dirs = Object.entries(by).map(([d, fs]) => `<div style="margin-bottom:14px"><h3 style="margin:0 0 6px">${esc(d)}</h3>${fs.map((f) => { const n = f.path.split('/').pop(); return `<div class="row" style="gap:8px;align-items:center;padding:4px 0"><a href="${url(f.path)}" download>${esc(n)}</a><span class="muted sm">${Math.max(1, Math.round(f.size / 1024))} KB</span><span style="flex:1"></span>${/\.pdf$/i.test(n) ? `<a class="btn sm" href="${url(f.path, '&inline=1')}" target="_blank">Ansehen</a>` : ''}<button class="btn sm bad" data-act="matfdel" data-p="${esc(f.path)}">Löschen</button></div>`; }).join('')}</div>`).join('');
    const tpl = `<section class="card" style="margin-top:12px"><h2>Word-Vorlage</h2><div class="muted sm" style="margin-bottom:8px">Lade eine .docx-Datei hoch. Schreibe an die Stelle des Inhalts <b>{{INHALT}}</b> in einen eigenen Absatz, optional <b>{{TITEL}}</b> und <b>{{DATUM}}</b> (auch in Kopf- oder Fußzeile). Ohne Vorlage verwendet die App ein einfaches Standardlayout.</div><label class="btn sm">Vorlage hochladen<input type="file" accept=".docx" hidden data-ch="mattpl"></label> <span class="muted sm">${m.tpl === undefined ? '' : m.tpl ? 'Vorlage ist hinterlegt.' : 'Noch keine Vorlage.'}</span></section>`;
    if (m.tpl === undefined) { m.tpl = null; fgetBuf(TPL).then((b) => { m.tpl = !!b; render(); }); }
    return `<section class="card"><h2>Fertige Dateien</h2>${m.err ? `<p class="muted">${esc(m.err)}</p>` : ''}${dirs || '<p class="muted">Noch keine Dateien. Erstelle unter „Suchen und Erstellen“ ein Material.</p>'}<div class="muted sm">Auf der NAS: <code>data/files/${ODIR}</code></div></section>${tpl}`;
  }

  /* ---------- Aktionen ---------- */
  Object.assign(A, {
    matopen: (e) => { const m = M(); m.open = m.open === e.dataset.id ? null : e.dataset.id; render(); },
    mattab: (e) => { M().tab = e.dataset.t; if (e.dataset.t === 'ordner') M().files = null; render(); },
    matyt: async (e) => {
      const s = srcOf(e.dataset.id); if (!s || !s.url) return; const m = M(); m.busy = 'YouTube-Infos werden geholt …'; render();
      try { put('settings', Object.assign({}, s, ytFields(await ytFetch(s.url)))); toast('Infos aktualisiert'); } catch (x) { toast('Nicht abrufbar: ' + (x.message || x)); }
      m.busy = ''; render();
    },
    matdel: async (e) => { const s = srcOf(e.dataset.id); if (!s || !confirm('Quelle „' + s.title + '“ mit allen Texten löschen?')) return; await fdel(QDIR + '/' + e.dataset.id + '.json'); if (s.file) await fdel(s.file); if (s.epub) await fdel(s.epub); delete T[e.dataset.id]; del('settings', 'mat_' + e.dataset.id); M().open = null; render(); },
    mattext: async (e) => { const id = e.dataset.id, ta = document.getElementById('matx-' + id), txt = (ta.value || '').replace(/\s+/g, ' ').trim(); if (!txt) return; await addPages(id, [{ p: await nextPage(id), t: txt }]); ta.value = ''; toast('Text gespeichert'); render(); },
    matsearch: () => { const m = M(); m.q = document.getElementById('matq').value; search(); },
    matpick: (e) => { const m = M(), r = m.res[+e.dataset.i]; if (!r) return; const a = Math.max(0, r.first - 200); m.sel.push({ ref: r.title + ', ' + (r.h || 'S. ' + r.p), t: r.t.slice(a, a + 1500) }); toast('Übernommen'); render(); },
    matunpick: (e) => { M().sel.splice(+e.dataset.i, 1); render(); },
    matmake: (e) => {
      const m = M(), k = e.dataset.k, title = (document.getElementById('mattitle').value || m.q || 'Material').trim(); m.title = title;
      const b = k === 'Arbeitsblatt' ? worksheet(title) : k === 'Lückentext' ? gaps(title) : cross(title);
      if (!b) return toast(k === 'Lückentext' ? 'Zu wenig Text für einen Lückentext' : 'Zu wenig passende Begriffe für ein Kreuzworträtsel. Übernimm mehr Text.');
      deliver(k, title, b);
    },
    matfdel: async (e) => { if (!confirm('Datei löschen?')) return; await fdel(e.dataset.p); M().files = null; render(); },
  });
  Object.assign(C, {
    matpdf: (e) => { const f = e.files[0]; if (f) importPdf(e.dataset.id, f); e.value = ''; },
    matepub: (e) => { const f = e.files[0]; if (f) importEpub(e.dataset.id, f); e.value = ''; },
    matimg: (e) => { const fs = [...e.files]; if (fs.length) ocrImages(e.dataset.id, fs); e.value = ''; },
    matnote: (e) => { const s = srcOf(e.dataset.id); if (s) put('settings', Object.assign({}, s, { notes: e.value })); },
    matsel: (e) => { const x = M().sel[+e.dataset.i]; if (x) x.t = e.value; },
    matqs: (e) => { M().q = e.value; },
    mattitles: (e) => { M().title = e.value; },
    mattpl: async (e) => { const f = e.files[0]; if (!f) return; try { await fput(TPL, f); M().tpl = true; toast('Vorlage gespeichert'); } catch (x) { toast('Fehler: ' + x.message); } e.value = ''; render(); },
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'matq') { e.preventDefault(); A.matsearch(); } });
  const inView = () => U.view === 'material' && M().tab === 'quellen';
  const zone = (e) => e.target && e.target.closest && e.target.closest('#matdz');
  document.addEventListener('click', (e) => { if (zone(e) && !(e.target.tagName === 'INPUT')) { const f = document.getElementById('matdzf'); if (f) f.click(); } });
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'matdzf') { const f = [...e.target.files]; e.target.value = ''; intake(f, ''); } });
  document.addEventListener('dragover', (e) => { if (inView() && zone(e)) { e.preventDefault(); zone(e).classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = zone(e); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    if (!inView()) return; const z = zone(e); if (!z) return; e.preventDefault(); z.classList.remove('over');
    const dt = e.dataTransfer, files = [...(dt.files || [])], text = files.length ? '' : (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n').filter((l) => l && l[0] !== '#').join(' ');
    intake(files, text);
  });
  document.addEventListener('paste', (e) => {
    if (!inView()) return; const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])], text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (!files.length && !text.trim()) return; e.preventDefault(); intake(files, text);
  });
  const st = document.createElement('style');
  st.textContent = `.matdz{display:flex;gap:16px;align-items:center;border:2px dashed var(--line);cursor:pointer;padding:22px 24px}.matdz:hover,.matdz.over,.matdz:focus{border-color:var(--brand,var(--accent));background:var(--accent-soft);outline:none}.matdzi{font-size:34px;line-height:1;color:var(--muted)}
.matask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3000;display:grid;place-items:center;padding:16px}.matbox{background:var(--surface);color:var(--ink);border-radius:14px;padding:20px;max-width:520px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.matgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-top:14px}
.mattile{display:flex;flex-direction:column;gap:5px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;color:var(--ink);font:inherit}
.mattile:hover{box-shadow:0 4px 14px rgba(0,0,0,.12)}.mattile.on{border-color:var(--brand,var(--accent));box-shadow:0 0 0 2px var(--brand,var(--accent))}
.matth{position:relative;display:block;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:var(--surface2)}.matth img{width:100%;height:100%;object-fit:cover;display:block}
.matph{width:100%;height:100%;display:grid;place-items:center;font:700 15px var(--font-head);color:#fff;background:#6b7280}.matph.t-buch{background:#587f0e}.matph.t-pdf{background:#b3261e}.matph.t-sonst{background:#6e7480}
.matdur{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.78);color:#fff;border-radius:5px;padding:1px 6px;font:700 12px var(--font-body)}
.matti{font:700 14px/1.25 var(--font-body);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.matsub{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
  document.head.appendChild(st);
  return { view };
})();
