/* Material (Stufe 1, ohne KI): Quellen (PDF, Screenshot mit Texterkennung, eingefügter Text, Video-Link),
   Themensuche, Arbeitsblatt / Lückentext / Kreuzworträtsel als Word + PDF, Ablage auf der NAS (data/files/Material). */
const MAT = (() => {
  const ROOT = 'Material', QDIR = ROOT + '/Quellen', ODIR = ROOT + '/Ergebnisse', TPL = ROOT + '/Vorlage/arbeitsblatt.docx';
  const note = (k, t) => { M().note = t ? { k, t } : null; };
  const M = () => (U.mat = U.mat || { sel: [], q: '', res: null, busy: '', files: null, open: null, drafts: [] });
  const TYPES = { buch: 'Buch', pdf: 'PDF', video: 'Video / Link', sonst: 'Sonstiges' };
  const T = {}; // Textcache je Quelle: { id: {pages:[{p,t}]} }
  const url = (p, extra) => '/api/file?path=' + encodeURIComponent(p) + (extra || '');
  const pad2 = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return pad2(d.getDate()) + '.' + pad2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const slugify = (s) => String(s || 'Material').replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Material';

  /* ---------- Dateien auf der NAS ---------- */
  async function fput(path, data) { const r = await fetch(url(path), { method: 'PUT', body: data, credentials: 'same-origin' }); if (!r.ok) { const e = (await r.json().catch(() => ({}))).error || 'Speichern fehlgeschlagen'; throw new Error(/Unbekannte API/.test(e) ? 'Auf der NAS läuft noch die alte server.js. Bitte die neue server.js einspielen und den Container lehrerapp neu starten.' : e); } return r.json(); }
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
  const ytFields = (i) => ({ url: i.url, desc: i.description || '', vtitle: i.title || '', channel: i.channel || '', channelUrl: i.channelUrl || '', seconds: i.seconds == null ? null : i.seconds });

  /* ---------- Automatische Tags (Epoche, Themen, Schlagwörter) ohne KI ---------- */
  const EPOCHS = ['Vor- und Frühgeschichte', 'Antike', 'Mittelalter', 'Neuzeit', 'Zeitgeschichte'];
  const LEGACY = { 'Vor- / Frühgeschichte': 'Vor- und Frühgeschichte', 'Urgeschichte': 'Vor- und Frühgeschichte', 'Frühe Neuzeit': 'Neuzeit', '19. Jahrhundert': 'Neuzeit' };
  const leg = (arr) => [...new Set((arr || []).map((x) => LEGACY[x] || x))];
  const TAGS = [
    ['Vor- und Frühgeschichte', 'Vor- und Frühgeschichte', ['urgeschicht', 'steinzeit', 'neandertal', 'jäger und sammler', 'höhlenmalerei', 'faustkeil', 'bronzezeit', 'eisenzeit', 'ötzi', 'neolithisch']],
    ['Antike', 'Antike', ['antike', 'antiken', 'altertum']],
    ['Griechenland', 'Antike', ['griech', 'athen', 'sparta', 'polis', 'olymp', 'perikles', 'sokrates', 'platon', 'aristoteles', 'alexander der große', 'hellenis', 'marathon', 'akropolis']],
    ['Rom', 'Antike', ['röm', 'caesar', 'augustus', 'gladiator', 'legion', 'senat', 'konsul', 'limes', 'kolosseum', 'pompeji', 'hannibal', 'karthago', 'imperium romanum', 'kaiserzeit', 'punische']],
    ['Ägypten', 'Antike', ['ägypt', 'pharao', 'pyramide', 'nil', 'hieroglyph', 'tutanchamun', 'kleopatra', 'mumie']],
    ['Mesopotamien', 'Antike', ['mesopotam', 'babylon', 'sumer', 'assyr', 'keilschrift', 'zweistromland', 'hammurabi']],
    ['Kelten und Germanen', 'Antike', ['kelt', 'germanen', 'hallstatt', 'noricum', 'carnuntum', 'völkerwanderung']],
    ['Mittelalter', 'Mittelalter', ['mittelalter', 'mittelalterlich']],
    ['Ritter und Burgen', 'Mittelalter', ['ritter', 'burg ', 'burgen', 'lehenswesen', 'lehen', 'feudal', 'turnier', 'knappe']],
    ['Karl der Große', 'Mittelalter', ['karl der große', 'karolinger', 'merowinger', 'frankenreich', 'pippin']],
    ['Kreuzzüge', 'Mittelalter', ['kreuzzug', 'kreuzzüge', 'kreuzfahrer', 'jerusalem', 'saladin']],
    ['Wikinger', 'Mittelalter', ['wikinger', 'normannen']],
    ['Stadt im Mittelalter', 'Mittelalter', ['stadtrecht', 'zunft', 'zünfte', 'hanse', 'marktrecht', 'bürger', 'handwerker']],
    ['Kirche und Kloster', 'Mittelalter', ['kloster', 'mönch', 'papst', 'investitur', 'inquisition', 'dom ']],
    ['Pest', 'Mittelalter', ['pest', 'schwarzer tod', 'seuche']],
    ['Neuzeit', 'Neuzeit', ['neuzeit', 'frühe neuzeit', 'neuzeitlich']],
    ['Renaissance', 'Neuzeit', ['renaissance', 'humanismus', 'leonardo', 'michelangelo', 'gutenberg', 'buchdruck']],
    ['Entdeckungen', 'Neuzeit', ['kolumbus', 'entdeckungsreise', 'conquista', 'kolonie', 'magellan', 'azteken', 'inka', 'vasco da gama']],
    ['Reformation', 'Neuzeit', ['reformation', 'luther', 'protestant', 'gegenreformation', 'ablass', 'bauernkrieg']],
    ['Habsburger', 'Neuzeit', ['habsburg', 'maria theresia', 'joseph ii', 'kaiser franz', 'türkenbelagerung', 'prinz eugen', 'kaisertum österreich']],
    ['Absolutismus', 'Neuzeit', ['absolutis', 'ludwig xiv', 'sonnenkönig', 'versailles', 'barock', 'merkantilis']],
    ['Dreißigjähriger Krieg', 'Neuzeit', ['dreißigjährig', 'wallenstein', 'westfälischer frieden']],
    ['Aufklärung', 'Neuzeit', ['aufklär', 'voltaire', 'rousseau', 'montesquieu', 'kant', 'menschenrechte']],
    ['Hexenverfolgung', 'Neuzeit', ['hexe', 'hexenverfolg', 'hexenprozess']],
    ['Französische Revolution', 'Neuzeit', ['französische revolution', 'bastille', 'robespierre', 'jakobiner', 'marie antoinette', 'guillotine', 'sansculotte']],
    ['Napoleon', 'Neuzeit', ['napoleon', 'wiener kongress', 'metternich', 'restauration']],
    ['Revolution 1848', 'Neuzeit', ['1848', 'märzrevolution', 'paulskirche', 'franz joseph', 'biedermeier']],
    ['Industrielle Revolution', 'Neuzeit', ['industrialisier', 'industrielle revolution', 'dampfmaschine', 'fabrik', 'arbeiterbewegung', 'proletar', 'eisenbahn']],
    ['Imperialismus', 'Neuzeit', ['imperialis', 'kolonialismus', 'kolonialmacht', 'berliner konferenz', 'bismarck']],
    ['Erster Weltkrieg', 'Zeitgeschichte', ['erster weltkrieg', 'weltkrieg 1', 'sarajevo', 'schützengraben', 'attentat', '1914', 'giftgas', 'verdun']],
    ['Zwischenkriegszeit', 'Zeitgeschichte', ['zwischenkriegszeit', 'erste republik', 'weimarer', 'weltwirtschaftskrise', 'ständestaat', 'dollfuß', 'inflation']],
    ['Nationalsozialismus', 'Zeitgeschichte', ['nationalsozial', 'nazi', 'hitler', 'ns-', 'anschluss', 'gestapo', 'drittes reich', 'ns-regime']],
    ['Zweiter Weltkrieg', 'Zeitgeschichte', ['zweiter weltkrieg', 'weltkrieg 2', 'blitzkrieg', 'stalingrad', 'd-day', 'kapitulation', '1945', 'luftkrieg']],
    ['Holocaust', 'Zeitgeschichte', ['holocaust', 'shoah', 'konzentrationslager', 'auschwitz', 'mauthausen', 'judenverfolg', 'novemberpogrom', 'widerstand']],
    ['Kalter Krieg', 'Zeitgeschichte', ['kalter krieg', 'berliner mauer', 'eiserner vorhang', 'nato', 'warschauer pakt', 'kubakrise', 'ddr', 'wettrüsten']],
    ['Österreich nach 1945', 'Zeitgeschichte', ['besatzung', 'staatsvertrag', 'neutralität', 'zweite republik', 'wiederaufbau', 'marshallplan']],
    ['Europäische Union', 'Zeitgeschichte', ['europäische union', 'eu-', 'römische verträge', 'maastricht', 'eurozone', 'binnenmarkt']],
    ['Demokratie', null, ['demokrat', 'wahlrecht', 'parlament', 'verfassung', 'gewaltenteilung', 'republik']],
    ['Religion', null, ['christentum', 'judentum', 'islam', 'götter', 'mythologie', 'glaube', 'tempel']],
    ['Alltag', null, ['alltag', 'lebensweise', 'ernährung', 'kleidung', 'wohnen', 'schule im']],
    ['Wirtschaft und Handel', null, ['handel', 'wirtschaft', 'geld ', 'münzen', 'landwirtschaft', 'handwerk', 'markt']],
    ['Krieg und Militär', null, ['schlacht', 'krieg', 'heer ', 'armee', 'soldat', 'waffen', 'belagerung', 'eroberung']],
    ['Frauen', null, ['frauen', 'frauenwahlrecht', 'emanzipation', 'suffragette']],
    ['Sport und Olympia', null, ['olympische spiele', 'olympia', 'leichtathletik', 'turnen', 'sportart', 'fußball', 'athlet', 'training']],
  ];
  const EPCOL = { 'Vor- und Frühgeschichte': '#7b4510', 'Antike': '#f0c030', 'Mittelalter': '#35761f', 'Neuzeit': '#164e5c', 'Zeitgeschichte': '#6aa6df' };
  const epS = (e) => (EPCOL[e] ? ` style="--ec:${EPCOL[e]}"` : '');
  const wordHits = (low, kw) => { let n = 0, i = low.indexOf(kw); while (i >= 0 && n < 40) { if (i === 0 || !/[a-zäöüß]/.test(low[i - 1])) n++; i = low.indexOf(kw, i + kw.length); } return n; };
  function autoTags(title, extra, text) {
    const head = norm(title + ' ' + (extra || '')), body = norm(String(text || '').slice(0, 80000)), tags = [], ep = {};
    TAGS.forEach(([name, epoch, kws]) => {
      let sc = 0; kws.forEach((k) => { sc += wordHits(head, k) * 4 + wordHits(body, k); });
      if (sc >= (name.length && epoch === null ? 4 : 3)) { tags.push([name, sc]); if (epoch) ep[epoch] = (ep[epoch] || 0) + sc; }
    });
    const epochs = EPOCHS.filter((e) => ep[e]).sort((a, b) => ep[b] - ep[a]); const top = epochs.length ? ep[epochs[0]] : 0;
    return { epoche: epochs.filter((e) => ep[e] >= Math.max(3, top * 0.5)).slice(0, 2), tags: tags.sort((a, b) => b[1] - a[1]).map((x) => x[0]).filter((x) => !EPOCHS.includes(x)).slice(0, 8), keys: keyWords((title + ' ' + (extra || '') + ' ' + text), 14).filter((k) => !tags.some((t) => norm(t[0]).startsWith(norm(k).slice(0, 6))) && !EPOCHS.includes(k) && !/^(video|antikes|antike)$/i.test(k)).slice(0, 8) };
  }
  const tagsOf = (s) => { const hid = leg(s.hid), man = leg(s.man), auto = s.auto ? Object.assign({}, s.auto, { epoche: leg(s.auto.epoche) }) : { tags: [], keys: [], epoche: [] }; return { epoche: [...new Set(auto.epoche.filter((x) => !hid.includes(x)).concat(man.filter((x) => EPOCHS.includes(x))))], tags: [...new Set(auto.tags.filter((x) => !hid.includes(x)).concat(man.filter((x) => !EPOCHS.includes(x))))], keys: [...new Set((auto.keys || []).filter((x) => !hid.includes(x)).concat(s.mankeys || []))] }; };
  async function retag(id, force) {
    const s = srcOf(id); if (!s) return; if (s.lock && !force) return; const t = await textOf(id);
    put('settings', Object.assign({}, srcOf(id), { auto: autoTags(s.title + ' ' + (s.vtitle || ''), (s.desc || '') + ' ' + (s.notes || ''), t.pages.map((p) => p.t).join(' ')) }));
    if (!isYt(s.url)) autoThumb(id, false);
  }

  /* ---------- Vorschaubilder: PDF-Seite 1, EPUB-Titelbild, Screenshot, sonst Wikimedia Commons (freie Lizenzen) ---------- */
  const setThumb = (id, th) => { const s = srcOf(id); if (s) put('settings', Object.assign({}, s, { thumb: th })); };
  async function pdfThumbBlob(doc) {
    try {
      const pg = await doc.getPage(1), v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 420 / v1.width }), cv = document.createElement('canvas');
      cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await pg.render({ canvasContext: cx, viewport: vp }).promise;
      return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.82));
    } catch (e) { return null; }
  }
  async function epubCover(z, opf, base) {
    try {
      let href = null; const ci = opf.querySelector('manifest > item[properties~="cover-image"]'); if (ci) href = ci.getAttribute('href');
      if (!href) { const mc = opf.querySelector('metadata > meta[name="cover"]'); if (mc) { const it = opf.querySelector('manifest > item[id="' + mc.getAttribute('content') + '"]'); if (it) href = it.getAttribute('href'); } }
      if (!href) { const it = [...opf.querySelectorAll('manifest > item')].find((x) => /image\//.test(x.getAttribute('media-type') || '') && /cover|titel/i.test(x.getAttribute('href') || '')); if (it) href = it.getAttribute('href'); }
      if (!href) return null; const f = z.file(decodeURIComponent(base + href)); if (!f) return null;
      const ext = (href.match(/\.(jpe?g|png|gif|webp)$/i) || [0, 'jpg'])[1].toLowerCase().replace('jpeg', 'jpg');
      return { blob: await f.async('blob'), ext };
    } catch (e) { return null; }
  }
  const OKLIC = /^(CC BY|CC0|CC-BY|Public domain|PD|Gemeinfrei|Attribution)/i;
  async function commonsFind(q, skip) {
    const api = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=480&format=json&origin=*&gsrsearch=' + encodeURIComponent(q + ' filetype:bitmap');
    const j = await (await fetch(api)).json(), pages = Object.values((j.query || {}).pages || {}).sort((a, b) => a.index - b.index), out = [];
    pages.forEach((p) => { const ii = (p.imageinfo || [])[0]; if (!ii || !/^image\/(jpeg|png)/.test(ii.mime || '')) return; const em = ii.extmetadata || {}, lic = (em.LicenseShortName || {}).value || ''; if (!OKLIC.test(lic)) return;
      out.push({ url: ii.thumburl || ii.url, page: ii.descriptionurl, lic, by: String((em.Artist || {}).value || '').replace(/<[^>]+>/g, '').slice(0, 60), src: 'Wikimedia Commons' }); });
    return skip ? out.filter((x) => !skip.includes(x.url)) : out;
  }
  async function autoThumb(id, force, query) {
    const s = srcOf(id); if (!s || isYt(s.url) || (!force && (s.noThumb || s.thumb || s.type === 'pdf' || s.type === 'buch' || /^Screenshots /.test(s.title || '')))) return;
    const t = tagsOf(s), q = query || (t.tags[0] ? t.tags[0] + (t.epoche[0] ? ' ' + t.epoche[0] : '') : t.epoche[0] || s.title);
    if (!q || /^Screenshots /.test(q)) return;
    try { const c = await commonsFind(q, force && s.thumb ? [s.thumb.url] : null); if (c[0] && (force || !(srcOf(id) || {}).thumb)) setThumb(id, c[0]); } catch (e) { /* offline */ }
  }

  /* ---------- Bild im Internet suchen: Google-Bildersuche im Pop-up, Bild per Strg+V oder Ziehen übernehmen ---------- */
  const googleImg = (q) => window.open('https://www.google.com/search?tbm=isch&tbs=sur:fmc&q=' + encodeURIComponent(q), 'matgoogle', 'popup=yes,width=1100,height=820,left=' + Math.max(0, (screen.width - 1100) / 2) + ',top=40');
  async function shrink(blob) {
    const bmp = await createImageBitmap(blob), w = Math.min(480, bmp.width), cv = document.createElement('canvas'); cv.width = w; cv.height = Math.round(bmp.height * w / bmp.width);
    cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height); return new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));
  }
  async function pickImage(dt) {
    const f = [...(dt.files || [])].find((x) => /^image\//.test(x.type)); if (f) return shrink(f);
    const u = (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n')[0].trim();
    if (/^https?:\/\//i.test(u)) { try { const r = await fetch(u); if (r.ok) return shrink(await r.blob()); } catch (e) { /* CORS */ } }
    const h = dt.getData('text/html'), m = /<img[^>]+src="(data:image[^"]+)"/i.exec(h || ''); if (m) { try { return shrink(await (await fetch(m[1])).blob()); } catch (e) { /* */ } }
    return null;
  }
  async function takeImage(pz, dt) {
    const blob = await pickImage(dt); if (!blob) return toast('Dieses Bild konnte nicht übernommen werden. Rechtsklick auf das Bild, „Bild kopieren“, dann hier Strg+V.');
    if (pz.dataset.pzd) { const d = M().drafts.find((x) => x.id === pz.dataset.pzd); if (d) { if (d.thumbUrl && d.thumbUrl.startsWith('blob:')) URL.revokeObjectURL(d.thumbUrl); d.thumbBlob = blob; d.cover = null; d.vid = null; d.noThumb = false; d.thumbUrl = URL.createObjectURL(blob); d.thumbSrc = 'Internet (eigene Auswahl)'; } return render(); }
    const id = pz.dataset.pz, s = srcOf(id); if (!s) return;
    try { const nm = QDIR + '/' + id + '-thumb.jpg'; await fput(nm, blob); put('settings', Object.assign({}, srcOf(id), { noThumb: false, thumb: { file: nm, src: 'Internet (eigene Auswahl)', v: Date.now() } })); toast('Vorschaubild gesetzt'); } catch (e) { toast('Fehler: ' + (e.message || e)); }
    render();
  }
  const pzHtml = (attr) => `<div class="matpz" tabindex="0" ${attr} title="Bild hierher ziehen oder anklicken und Strg+V drücken">Gefundenes Bild: hier anklicken und <b>Strg+V</b> drücken, oder hineinziehen</div>`;

  /* ---------- Video-Download auf die NAS ---------- */
  const setDl = (id, dl) => { const s = srcOf(id); if (s) put('settings', Object.assign({}, s, { dl: Object.assign({}, s.dl || {}, dl) })); };
  async function startDownload(id) {
    const s = srcOf(id); if (!s || !s.url) return;
    try {
      const r = await fetch('/api/yt/download', { method: 'POST', credentials: 'same-origin', body: JSON.stringify({ url: s.url, id }) }), j = await r.json().catch(() => ({}));
      if (!r.ok) { setDl(id, { state: 'error', msg: j.error || (r.status === 404 ? 'Die neue server.js fehlt auf der NAS' : 'Download nicht möglich') }); return render(); }
      setDl(id, { state: j.state, msg: '' }); poll(); render();
    } catch (e) { setDl(id, { state: 'error', msg: e.message }); render(); }
  }
  async function checkDl(id) {
    const r = await fetch('/api/yt/status?id=' + encodeURIComponent(id), { credentials: 'same-origin' }); if (!r.ok) return null; const j = await r.json();
    if (j.state === 'running' || j.state === 'queued') setDl(id, { state: j.state, msg: j.msg || '' });
    else if (j.state === 'done') {
      setDl(id, { state: 'done', msg: '', file: j.file, size: j.size });
      if (j.transcript) { const words = j.transcript.split(' '), pages = []; let cur = '', n = 0; words.forEach((w) => { cur += (cur ? ' ' : '') + w; if (cur.length > 1800) { pages.push({ p: ++n, t: cur, h: 'Transkript, Teil ' + n }); cur = ''; } }); if (cur) pages.push({ p: ++n, t: cur, h: 'Transkript, Teil ' + n }); await addPages(id, pages); }
    } else if (j.state === 'error') setDl(id, { state: 'error', msg: j.msg || 'Download fehlgeschlagen' });
    else if (j.state === 'none' && (srcOf(id).dl || {}).state === 'running') setDl(id, { state: 'error', msg: 'Der Auftrag ist verloren gegangen (Neustart?). Bitte erneut starten.' });
    return j;
  }
  function poll() {
    const m = M(); if (m.polling) return;
    m.polling = setInterval(async () => {
      const act = sources().filter((s) => s.dl && (s.dl.state === 'running' || s.dl.state === 'queued'));
      if (!act.length) { clearInterval(m.polling); m.polling = null; return; }
      for (const s of act) await checkDl(s.id.replace(/^mat_/, ''));
      if (U.view === 'material') render();
    }, 4000);
  }
  const mb = (n) => (n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? Math.round(n / 1e5) / 10 + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB');

  /* ---------- Quellen ---------- */
  const sources = () => Object.values(S.settings).filter((d) => d && /^mat_/.test(d.id || '')).sort((a, b) => (b.added || 0) - (a.added || 0));
  const srcOf = (id) => S.settings['mat_' + id];
  async function textOf(id) {
    if (T[id]) return T[id];
    const j = await fgetJson(QDIR + '/' + id + '.json');
    return (T[id] = j || { pages: [] });
  }
  async function saveText(id) { await fput(QDIR + '/' + id + '.json', new Blob([JSON.stringify(T[id])], { type: 'application/json' })); const s = srcOf(id); if (s) { put('settings', Object.assign({}, s, { pages: T[id].pages.length })); await retag(id); } }
  async function addPages(id, pages) {
    const t = await textOf(id);
    pages.forEach((p) => { const i = t.pages.findIndex((x) => x.p === p.p); if (i >= 0) t.pages[i] = p; else t.pages.push(p); });
    t.pages.sort((a, b) => a.p - b.p);
    await saveText(id);
  }
  /* ---------- Suche ---------- */
  const norm = (s) => String(s || '').toLowerCase();
  async function search() {
    const m = M(), q = norm(m.q).split(/[\s,;]+/).filter((x) => x.length > 1);
    if (!q.length) { m.res = []; return render(); }
    m.busy = 'Suche läuft …'; render();
    const res = [];
    for (const s of sources().filter(matches)) {
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

  /* ---------- Alles-in-einem-Feld: erkennen, Angaben prüfen, dann „Anlegen“ ---------- */
  const newSrc = (title, type, extra) => { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); put('settings', Object.assign({ id: 'mat_' + id, title, type, url: '', added: Date.now(), pages: 0 }, extra || {})); return id; };
  const base = (n) => n.replace(/\.[^.]+$/, '');
  const extOf = (n) => ((String(n).match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
  const KLABEL = { pdf: 'PDF', epub: 'EPUB', yt: 'YouTube-Video', video: 'Video-Datei', bild: 'Screenshots', text: 'Text / Word', link: 'Internetadresse', datei: 'Datei' };
  const VIDEXT = ['mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi'], IMGEXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
  let dseq = 0;
  async function docxText(file) {
    const Z = await loadZip(), z = await Z.loadAsync(await file.arrayBuffer()), f = z.file('word/document.xml'); if (!f) throw new Error('keine gültige Word-Datei');
    const x = await f.async('string');
    return x.replace(/<\/w:p>/g, ' ').replace(/<w:tab\/>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  }
  const mkDraft = (kind, name, extra) => Object.assign({ id: 'd' + (++dseq), kind, name: name || '', status: 'reading', f: { title: base(name || '') }, meta: [], pages: [], ep: [], tg: [], keys: [], thumbUrl: '', err: '' }, extra || {});
  const textOfDraft = (d) => d.pages.map((p) => p.t).join(' ');
  function propose(d) { const a = autoTags(d.f.title + ' ' + (d.f.author || '') + ' ' + (d.f.channel || ''), d.desc || '', textOfDraft(d)); d.ep = a.epoche; d.tg = a.tags; d.keys = a.keys; }
  const videoMeta = (file) => new Promise((ok) => {
    const v = document.createElement('video'), u = URL.createObjectURL(file); v.preload = 'metadata'; v.muted = true; v.src = u;
    const fin = (r) => { URL.revokeObjectURL(u); ok(r); };
    v.onerror = () => fin({ seconds: null, thumb: null });
    v.onloadedmetadata = () => { const sec = isFinite(v.duration) ? Math.round(v.duration) : null; v.currentTime = Math.min(1, (v.duration || 2) / 2); v.onseeked = () => { try { const cv = document.createElement('canvas'); cv.width = 420; cv.height = Math.round(420 * (v.videoHeight || 9) / (v.videoWidth || 16)); cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height); cv.toBlob((b) => fin({ seconds: sec, thumb: b }), 'image/jpeg', 0.8); } catch (e) { fin({ seconds: sec, thumb: null }); } }; };
    setTimeout(() => fin({ seconds: null, thumb: null }), 15000);
  });
  async function readPdf(d, f) {
    const lib = await loadPdfJs(), doc = await lib.getDocument({ data: await f.arrayBuffer() }).promise; let info = {};
    try { info = (await doc.getMetadata()).info || {}; } catch (e) { /* */ }
    let empty = 0;
    for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i), c = await pg.getTextContent(), txt = c.items.map((x) => x.str).join(' ').replace(/\s+/g, ' ').trim(); if (txt.length < 20) empty++; d.pages.push({ p: i, t: txt }); if (i % 10 === 0) { d.prog = i + ' von ' + doc.numPages + ' Seiten'; render(); } }
    const t = (info.Title || '').trim(); d.f.title = t && !/^(untitled|microsoft word|document)/i.test(t) ? t : base(f.name); d.f.author = (info.Author || '').trim();
    d.meta = [['Seiten', String(doc.numPages)], ['Dateigröße', mb(f.size)], ['Datei', f.name]];
    if (empty === doc.numPages) d.warn = 'Das PDF enthält keinen lesbaren Text (vermutlich ein Scan). Es wird abgelegt, ist aber nicht durchsuchbar.'; else if (empty) d.warn = empty + ' Seite(n) ohne Text (vermutlich gescannt).';
    d.thumbBlob = await pdfThumbBlob(doc);
  }
  async function readEpub(d, f) {
    const Z = await loadZip(), z = await Z.loadAsync(await f.arrayBuffer()), P = new DOMParser();
    const read = async (n) => { const x = z.file(n); return x ? x.async('string') : null; };
    const cont = await read('META-INF/container.xml'); if (!cont) throw new Error('Das ist keine gültige EPUB-Datei');
    const opfPath = (P.parseFromString(cont, 'text/xml').querySelector('rootfile') || {}).getAttribute?.('full-path'); if (!opfPath) throw new Error('EPUB ohne Inhaltsverzeichnis');
    const opf = P.parseFromString(await read(opfPath), 'text/xml'), bs = opfPath.includes('/') ? opfPath.replace(/[^/]*$/, '') : '';
    const dc = (n) => { const e = opf.getElementsByTagNameNS('*', n)[0]; return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; };
    d.f.title = dc('title') || base(f.name); d.f.author = [...opf.getElementsByTagNameNS('*', 'creator')].map((x) => x.textContent.trim()).filter(Boolean).join(', '); d.f.publisher = dc('publisher'); d.f.lang = dc('language'); d.f.year = (dc('date').match(/\d{4}/) || [''])[0];
    const man = {}; opf.querySelectorAll('manifest > item').forEach((it) => { man[it.getAttribute('id')] = it.getAttribute('href'); });
    const order = [...opf.querySelectorAll('spine > itemref')].map((x) => man[x.getAttribute('idref')]).filter(Boolean); let n = 0;
    for (const href of order) {
      const path = decodeURIComponent((bs + href).replace(/#.*$/, '')).replace(/[^/]+\/\.\.\//g, ''), html = await read(path); if (!html) continue;
      const doc = P.parseFromString(html, 'text/html'); doc.querySelectorAll('script,style,nav,head').forEach((x) => x.remove());
      doc.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,br,tr,blockquote').forEach((x) => x.appendChild(doc.createTextNode(' ')));
      const title = ((doc.querySelector('h1,h2,h3') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Abschnitt ' + (d.pages.length + 1);
      const txt = (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim(); if (txt.length < 30) continue;
      let rest = txt, part = 0;
      while (rest.length) { let cut = rest.length > 2500 ? rest.lastIndexOf('. ', 2500) : rest.length; if (cut < 800) cut = Math.min(rest.length, 2500); else if (cut < rest.length) cut += 1; part++; d.pages.push({ p: ++n, t: rest.slice(0, cut).trim(), h: title + (txt.length > 2500 ? ' (Teil ' + part + ')' : '') }); rest = rest.slice(cut).trim(); }
    }
    if (!d.pages.length) throw new Error('Kein Text gefunden. Die Datei ist vermutlich kopiergeschützt (DRM).');
    d.meta = [['Abschnitte', String(d.pages.length)], ['Dateigröße', mb(f.size)], ['Datei', f.name]];
    d.cover = await epubCover(z, opf, bs);
  }
  async function readDraft(d) {
    const f = d.file;
    try {
      if (d.kind === 'pdf') await readPdf(d, f);
      else if (d.kind === 'epub') await readEpub(d, f);
      else if (d.kind === 'video') { const v = await videoMeta(f); d.seconds = v.seconds; d.thumbBlob = v.thumb; d.meta = [['Dauer', v.seconds != null ? dur(v.seconds) : 'unbekannt'], ['Dateigröße', mb(f.size)], ['Datei', f.name]]; }
      else if (d.kind === 'bild') {
        const Tess = await loadOcr(); d.thumbBlob = d.files[0];
        for (let i = 0; i < d.files.length; i++) { d.prog = 'Texterkennung Bild ' + (i + 1) + ' von ' + d.files.length; render(); const r = await Tess.recognize(d.files[i], 'deu'); d.pages.push({ p: i + 1, t: (r.data.text || '').replace(/-\n/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim() }); }
        d.meta = [['Bilder', String(d.files.length)], ['Zeichen', String(textOfDraft(d).length)]];
      } else if (d.kind === 'text') {
        const ext = extOf(f.name); let raw = ext === 'docx' ? await docxText(f) : await f.text(); if (/^html?$/.test(ext)) raw = new DOMParser().parseFromString(raw, 'text/html').body.textContent;
        d.pages.push({ p: 1, t: raw.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim() }); d.meta = [['Wörter', String(d.pages[0].t.split(' ').length)], ['Dateigröße', mb(f.size)], ['Datei', f.name]];
      } else if (d.kind === 'datei') { d.mode = 'file'; d.meta = [['Dateigröße', mb(f.size)], ['Datei', f.name]]; d.warn = 'Dieses Format kenne ich nicht. Es wird als Datei abgelegt (nicht durchsuchbar), oder du wählst „Als Text lesen“.'; }
      else if (d.kind === 'yt') {
        const i = await ytFetch(d.u); Object.assign(d.f, { title: i.title || d.u, channel: i.channel || '', channelUrl: i.channelUrl || '', url: i.url }); d.desc = i.description || ''; d.seconds = i.seconds; d.dl = true; d.vid = ytVid(i.url);
        d.meta = [['Dauer', i.seconds != null ? dur(i.seconds) : 'unbekannt']];
      } else if (d.kind === 'link') { let t = d.u; try { const x = new URL(d.u); t = x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.slice(0, 40) : ''); } catch (e) { /* */ } d.f.title = t; d.f.url = d.u; }
      if (d.thumbBlob && !d.thumbUrl) d.thumbUrl = URL.createObjectURL(d.thumbBlob); if (d.cover && !d.thumbUrl) d.thumbUrl = URL.createObjectURL(d.cover.blob);
      propose(d); d.status = 'ready';
    } catch (e) { d.status = 'error'; d.err = (e.message || String(e)) + (d.kind === 'yt' && /server\.js/.test(String(e.message)) ? '' : ''); }
  }
  async function intake(files, text) {
    const m = M(); note(); const imgs = [];
    const push = (d) => { m.drafts.push(d); return d; };
    const todo = [];
    for (const f of files || []) {
      const ext = extOf(f.name || ''), t = f.type || '';
      if (ext === 'pdf' || t === 'application/pdf') todo.push(push(mkDraft('pdf', f.name, { file: f })));
      else if (ext === 'epub') todo.push(push(mkDraft('epub', f.name, { file: f })));
      else if (VIDEXT.includes(ext) || /^video\//.test(t)) todo.push(push(mkDraft('video', f.name, { file: f })));
      else if (IMGEXT.includes(ext) || /^image\//.test(t)) imgs.push(f);
      else if (['docx', 'txt', 'md', 'csv', 'html', 'htm'].includes(ext) || /^text\//.test(t)) todo.push(push(mkDraft('text', f.name, { file: f })));
      else todo.push(push(mkDraft('datei', f.name, { file: f })));
    }
    if (imgs.length) { const d = mkDraft('bild', 'Screenshots ' + today(), { file: imgs[0], files: imgs }); d.f.title = 'Screenshots ' + today(); todo.push(push(d)); }
    const tx = String(text || '').trim();
    if (tx) {
      const parts = tx.split(/\s+/), urls = parts.filter((x) => /^https?:\/\/\S+$/i.test(x));
      if (urls.length && urls.length === parts.length) urls.forEach((u) => todo.push(push(mkDraft(isYt(u) ? 'yt' : 'link', '', { u }))));
      else { const d = mkDraft('text', '', { file: null }); d.pages.push({ p: 1, t: tx.replace(/\s+/g, ' ') }); d.f.title = tx.replace(/\s+/g, ' ').slice(0, 50) + (tx.length > 50 ? ' …' : ''); d.meta = [['Wörter', String(parts.length)]]; propose(d); d.status = 'ready'; push(d); }
    }
    render();
    for (const d of todo) { await readDraft(d); render(); }
  }
  async function commit(d) {
    const m = M(); d.status = 'saving'; d.err = ''; render();
    try {
      const f = d.f, tagFix = { epoche: d.ep, tags: d.tg, keys: d.keys };
      const type = d.kind === 'pdf' ? 'pdf' : d.kind === 'epub' ? 'buch' : d.kind === 'yt' || d.kind === 'video' ? 'video' : 'sonst';
      const extra = { lock: true, kind: d.art || artOf(d), auto: tagFix, author: f.author || '', publisher: f.publisher || '', lang: f.lang || '', year: f.year || '', fileName: d.name || '', size: d.file ? d.file.size : 0 };
      let id;
      if (d.kind === 'yt') { id = newSrc(f.title, 'video', Object.assign(extra, { url: f.url, vtitle: f.title, channel: f.channel, channelUrl: f.channelUrl, seconds: d.seconds == null ? null : d.seconds, desc: d.desc || '' })); }
      else if (d.kind === 'link') id = newSrc(f.title, 'sonst', Object.assign(extra, { url: f.url }));
      else id = newSrc(f.title || d.name, type, extra);
      const setS = (o) => put('settings', Object.assign({}, srcOf(id), o));
      const saveSt = async () => { T[id] = { pages: d.pages }; await fput(QDIR + '/' + id + '.json', new Blob([JSON.stringify(T[id])], { type: 'application/json' })); setS({ pages: d.pages.length }); };
      if (d.kind === 'pdf') { const nm = QDIR + '/' + id + '-' + slugify(base(d.name)) + '.pdf'; await fput(nm, d.file); setS({ file: nm }); await saveSt(); }
      else if (d.kind === 'epub') { const nm = QDIR + '/' + id + '-' + slugify(base(d.name)) + '.epub'; await fput(nm, d.file); setS({ epub: nm }); await saveSt(); }
      else if (d.kind === 'video') { const nm = 'Material/Videos/' + id + '.' + (extOf(d.name) || 'mp4'); await fput(nm, d.file); setS({ seconds: d.seconds == null ? null : d.seconds, dl: { state: 'done', file: nm, size: d.file.size } }); }
      else if (d.kind === 'bild') { for (let i = 0; i < d.files.length; i++) await fput(QDIR + '/' + id + '-s' + (i + 1) + '.png', d.files[i]); await saveSt(); }
      else if (d.kind === 'text') { await saveSt(); }
      else if (d.kind === 'datei') {
        const nm = QDIR + '/' + id + '-' + slugify(d.name); await fput(nm, d.file); setS({ file: nm });
        if (d.mode === 'text') { const raw = (await d.file.text()).replace(/\u0000/g, '').replace(/\s+/g, ' ').trim(); if (raw.length >= 20) { d.pages = [{ p: 1, t: raw }]; await saveSt(); } }
      }
      if (d.kind === 'yt') await saveSt();
      if (d.noThumb) setS({ noThumb: true });
      else if (d.thumbBlob) { const nm = QDIR + '/' + id + '-thumb.jpg'; await fput(nm, d.thumbBlob); setS({ thumb: { file: nm, src: d.thumbSrc || (d.kind === 'pdf' ? 'PDF, Seite 1' : d.kind === 'bild' ? 'Screenshot' : 'Video') } }); }
      else if (d.cover) { const nm = QDIR + '/' + id + '-thumb.' + d.cover.ext; await fput(nm, d.cover.blob); setS({ thumb: { file: nm, src: 'EPUB-Titelbild' } }); }
      if (d.kind === 'yt' && d.dl) startDownload(id);
      if (!d.noThumb && !d.thumbBlob && !d.cover && d.kind !== 'yt') autoThumb(id, false);
      if (d.thumbUrl && d.thumbUrl.startsWith('blob:')) URL.revokeObjectURL(d.thumbUrl);
      m.drafts = m.drafts.filter((x) => x.id !== d.id); m.open = id; toast('Angelegt und auf der NAS gespeichert');
    } catch (e) { d.status = 'ready'; d.err = e.message || String(e); note('err', 'Anlegen fehlgeschlagen: ' + d.err); }
    render();
  }
  const fld = (d, key, label, ph) => `<div class="kmkvr"><span class="kmk">${label}</span><span class="kmv"><input class="matin" id="dr-${d.id}-${key}" data-ch="mdf" data-d="${d.id}" data-k="${key}" value="${esc(d.f[key] || '')}" placeholder="${esc(ph || '')}" autocomplete="off"></span></div>`;
  const ro = (label, val, link) => `<div class="kmkvr"><span class="kmk">${label}</span><span class="kmv">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(val)}</a>` : esc(val)}</span></div>`;
  const epChips = (list, cur, act, did) => list.map((x) => `<button class="mattag ep sel${cur.includes(x) ? ' on' : ''}"${epS(x)} data-act="${act}" data-d="${did}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  const tgChips = (list, cur, act, did) => list.map((x) => `<button class="mattag sel${cur.includes(x) ? ' on' : ''}" data-act="${act}" data-d="${did}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  const artOf = (d) => ({ pdf: 'pdf', epub: 'epub', video: 'video', yt: 'video', bild: 'bild', text: 'text', link: 'link', datei: 'text' }[d.kind] || 'text');
  function draftCard(d) {
    const k = d.kind, did = d.id, head = `<h2>${KLABEL[k]}${d.name ? ' · ' + esc(d.name) : ''}</h2>`;
    if (d.status === 'reading') return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}<div class="row" style="align-items:center;gap:10px"><span class="muted">⏳ wird gelesen${d.prog ? ' … ' + esc(d.prog) : ' …'}</span><span style="flex:1"></span><button class="btn sm" data-act="mddel" data-d="${did}">Abbrechen</button></div></section>`;
    if (d.status === 'error') return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}<div class="matnote err" style="margin:0 0 10px"><span>Konnte nicht gelesen werden: ${esc(d.err)}</span></div><button class="btn sm" data-act="mddel" data-d="${did}">Entfernen</button></section>`;
    const ths = d.thumbBlob && d.thumbUrl ? d.thumbUrl : d.vid ? `https://i.ytimg.com/vi/${d.vid}/hqdefault.jpg` : d.thumbUrl;
    const rows = [fld(d, 'title', 'Titel')];
    if (k === 'pdf') rows.push(fld(d, 'author', 'Autor'));
    if (k === 'epub') rows.push(fld(d, 'author', 'Autor'), fld(d, 'publisher', 'Verlag'), fld(d, 'lang', 'Sprache'), fld(d, 'year', 'Jahr'));
    if (k === 'yt') rows.push(ro('Kanal', d.f.channel || '–', d.f.channelUrl), ro('Video', d.f.url, d.f.url));
    if (k === 'link') rows.push(ro('Adresse', d.f.url, d.f.url));
    d.meta.forEach(([a, b]) => { if (a !== 'Datei') rows.push(ro(a, b)); });
    const allTg = TAGS.map((t) => t[0]).filter((x) => !EPOCHS.includes(x)), rest = allTg.filter((x) => !d.tg.includes(x));
    const hasPic = !!ths && !d.noThumb;
    return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}
      <div class="matdgrid">${true ? `<div>${hasPic ? `<div class="matdpic"><img src="${esc(ths)}" alt="" referrerpolicy="no-referrer"></div>` : `<div class="matdpic matnopic">${d.noThumb ? 'Vorschaubild gelöscht' : 'Kein Vorschaubild'}</div>`}<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn sm" data-act="mdnothumb" data-d="${did}">${d.noThumb ? 'Wieder verwenden' : 'Löschen'}</button><button class="btn sm" data-act="mdgoogle" data-d="${did}">Bild im Internet suchen</button></div>${pzHtml('data-pzd="' + did + '"')}</div>` : ''}<div>${rows.join('')}${k === 'yt' ? `<label class="matchk"><input type="checkbox" data-ch="mddl" data-d="${did}" ${d.dl ? 'checked' : ''}> Video zusätzlich auf die NAS herunterladen</label>` : ''}</div></div>
      ${d.warn ? `<div class="matnote warn"><span>${esc(d.warn)}</span></div>` : ''}
      ${k === 'datei' ? `<div class="kmkvr"><span class="kmk">Behandeln als</span><span class="kmv"><button class="mattag sel${d.mode === 'file' ? ' on' : ''}" data-act="mdmode" data-d="${did}" data-v="file">Datei ablegen</button><button class="mattag sel${d.mode === 'text' ? ' on' : ''}" data-act="mdmode" data-d="${did}" data-v="text">Als Text lesen</button></span></div>` : ''}
      <div class="kmkvr"><span class="kmk">Art</span><span class="kmv chips">${KINDS.map(([kk, n]) => `<button class="mattag sel${(d.art || artOf(d)) === kk ? ' on' : ''}" data-act="mdkind" data-d="${did}" data-v="${kk}">${n}</button>`).join('')}</span></div>
      <div class="kmkvr"><span class="kmk">Epoche</span><span class="kmv chips">${epChips(EPOCHS, d.ep, 'mdep', did)}</span></div>
      <div class="kmkvr"><span class="kmk">Themen</span><span class="kmv chips">${tgChips(d.tg, d.tg, 'mdtg', did)}${tgChips(rest.slice(0, 6), d.tg, 'mdtg', did)}<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${tgChips(rest.slice(6), d.tg, 'mdtg', did)}</div></details><input class="matin" id="dr-${did}-new" data-ch="mdnew" data-d="${did}" placeholder="+ eigener Tag" style="width:130px"></span></div>
      <div class="kmkvr"><span class="kmk">Schlagwörter</span><span class="kmv chips">${d.keys.map((x) => `<span class="mattag ky">${esc(x)}<button data-act="mdrmkey" data-d="${did}" data-v="${esc(x)}" aria-label="Entfernen">×</button></span>`).join('')}<input class="matin" id="dr-${did}-newkey" data-ch="mdkey" data-d="${did}" placeholder="+ Schlagwort" style="width:140px"></span></div>
      ${d.err ? `<div class="matnote err"><span>${esc(d.err)}</span></div>` : ''}
      <div class="matfoot">${d.status === 'saving' ? '<span class="muted">⏳ wird auf die NAS geladen …</span>' : `<button class="btn" data-act="mddel" data-d="${did}">Verwerfen</button><button class="btn good" data-act="mdgo" data-d="${did}">Anlegen</button>`}</div></section>`;
  }
  const ICO = {
    all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    pdf: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    epub: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19a2 2 0 012-2h13"/>',
    buch: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
    text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h8"/>',
    bild: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
  function view() {
    if (sources().some((x) => x.dl && (x.dl.state === 'running' || x.dl.state === 'queued'))) poll();
    const m = M(), list = sources(), f = filterOf();
    const banner = `${m.busy ? `<div class="muted sm" style="margin-bottom:8px">⏳ ${esc(m.busy)}</div>` : ''}${m.note ? `<div class="matnote ${m.note.k}" role="status"><span>${esc(m.note.t)}${/server\.js|Unbekannte API|Verbindung/.test(m.note.t) ? ' <a href="/diagnose.html" style="color:inherit;text-decoration:underline">Diagnose öffnen</a>' : ''}</span><button data-act="matnote0" aria-label="Schließen">×</button></div>` : ''}`;
    const cnt = (e) => list.filter((x) => tagsOf(x).epoche.includes(e)).length;
    const eps = EPOCHS.map((e) => `<span class="kmchipw"><button class="kmchip matep${f.e === e ? ' on' : ''}${f.e && f.e !== e ? ' dim' : ''}" style="--ec:${EPCOL[e]}" data-act="matfe" data-v="${esc(e)}" title="${esc(e)}: ${cnt(e)} Quelle(n)">${esc(e)}<small>${cnt(e)}</small></button></span>`).join('');
    const bar = `<div class="kmcls"><div class="kmchips"><span class="kmchipw"><button class="kmchip matep matall${!f.e ? ' on' : ' dim'}" style="--ec:#6e7480" data-act="matfe" data-v="">Alle<small>${list.length}</small></button></span><span class="kmdiv" style="cursor:default"></span>${eps}</div></div>`;
    const kinds = kindsOrdered();
    const side = `<nav class="kmside" aria-label="Art"><div class="kmsidet">Art</div><button class="kmicon${!f.a ? ' on' : ''}" data-act="matfa" data-v="">${ico('all')}<small>Alle ${list.length}</small></button>${kinds.map(([k, n]) => `<button class="kmicon${f.a === k ? ' on' : ''}${list.some((x) => kindOf(x) === k) ? '' : ' zero'}" draggable="true" data-k="${k}" title="Ziehen zum Verschieben" data-act="matfa" data-v="${k}">${ico(k)}<small>${esc(n.split(' ')[0])} ${list.filter((x) => kindOf(x) === k).length}</small></button>`).join('')}</nav>`;
    const artName = (KINDS.find(([k]) => k === f.a) || [0, 'Alle Quellen'])[1];
    const head = `<div class="kmh"><h1>Material<span class="kmsep kmh1">I</span><span class="muted" style="font-weight:500">${esc(f.e || 'Alle Epochen')}${f.a ? ' · ' + esc(artName) : ''}</span></h1></div>`;
    return `<div class="km">${bar}${head}${banner}<div class="kmbody">${side}<section class="kmmain">${quellen()}</section></div></div>`;
  }
  function metaLine(s) {
    const a = [['Autor', s.author], ['Verlag', s.publisher], ['Sprache', s.lang], ['Jahr', s.year], ['Datei', s.fileName], ['Größe', s.size ? mb(s.size) : ''], ['Seiten', s.type === 'pdf' && s.pages ? s.pages : '']].filter((x) => x[1]);
    return a.length ? `<div class="sm" style="margin-top:8px">${a.map(([k, v]) => `<span class="muted">${k}:</span> ${esc(v)}`).join(' &nbsp;·&nbsp; ')}</div>` : '';
  }
  function videoBlock(s, id) {
    if (!isYt(s.url)) return '';
    const d = s.dl || {}; let h;
    if (d.state === 'done' && d.file) h = `<div class="sm"><b style="color:var(--good)">✓ Auf der NAS gespeichert</b> <span class="muted">(${esc(mb(d.size || 0))})</span> · <a href="${url(d.file)}" download>Herunterladen</a></div><video controls preload="metadata" src="${url(d.file, '&inline=1')}" style="max-width:min(560px,100%);margin-top:8px;border-radius:10px;background:#000"></video>`;
    else if (d.state === 'running' || d.state === 'queued') h = `<div class="sm">⏳ ${esc(d.msg || (d.state === 'queued' ? 'Download wartet …' : 'Download läuft …'))}</div>`;
    else h = `<div class="sm">${d.state === 'error' ? `<span style="color:var(--bad)">Download nicht möglich: ${esc(d.msg || '')}</span> ` : '<span class="muted">Video ist noch nicht auf der NAS.</span> '}<button class="btn sm" data-act="matdl" data-id="${id}">${d.state === 'error' ? 'Erneut versuchen' : 'Video auf die NAS laden'}</button></div>`;
    return `<div style="margin-top:10px">${h}</div>`;
  }
  function thumbBlock(s, id) {
    const th = s.thumb, has = !s.noThumb && (isYt(s.url) || th);
    const info = isYt(s.url) ? (has ? 'YouTube' : 'keines') : th && !s.noThumb ? esc(th.src || '') + (th.lic ? ` · ${esc(th.by || 'unbekannt')} · ${esc(th.lic)} · <a href="${esc(th.page || '#')}" target="_blank" rel="noopener">Quelle</a>` : '') : 'keines';
    return `<div class="sm" style="margin-top:10px"><span class="muted">Vorschaubild:</span> ${info} ${has ? `<button class="btn sm bad" data-act="matthumbdel" data-id="${id}" title="Vorschaubild entfernen">Löschen</button>` : ''}${isYt(s.url) && s.noThumb ? ` <button class="btn sm" data-act="matthumbdel" data-id="${id}" data-back="1">Wieder anzeigen</button>` : ''} <button class="btn sm" data-act="matgoogle" data-id="${id}" title="Google-Bildersuche in einem Fenster öffnen">Bild im Internet suchen</button>${!isYt(s.url) ? ` <button class="btn sm" data-act="matthumb" data-id="${id}" title="Freie Bilder von Wikimedia Commons">Freie Bilder (Wikimedia)</button>` : ''}<div style="margin-top:6px">${pzHtml('data-pz="' + id + '"')}</div></div>`;
  }
  function tagBlock(s, id) {
    const t = tagsOf(s), chip = (x, k) => `<span class="mattag ${k}"${k === 'ep' ? epS(x) : ''}>${esc(x)}<button data-act="matrm" data-id="${id}" data-t="${esc(x)}" aria-label="Entfernen">×</button></span>`;
    return `<div style="margin-top:10px" class="sm"><span class="muted">Epoche:</span> ${t.epoche.map((x) => chip(x, 'ep')).join('') || '<span class="muted">nicht erkannt</span>'} &nbsp; <span class="muted">Themen:</span> ${t.tags.map((x) => chip(x, 'tg')).join('') || '<span class="muted">–</span>'} &nbsp; <span class="muted">Schlagwörter:</span> ${t.keys.map((x) => chip(x, 'ky')).join('') || '<span class="muted">–</span>'}
      <div class="row" style="gap:6px;margin-top:6px;align-items:center"><input class="kminp" data-ch="matatag" data-id="${id}" placeholder="Tag hinzufügen (Enter)" style="width:200px"><button class="btn sm" data-act="matretag" data-id="${id}" title="Epoche, Themen und Schlagwörter aus Titel und Text neu bestimmen">Tags neu berechnen</button></div></div>`;
  }
  const setIn = (id, v) => { const i = document.getElementById(id); if (i) i.value = v; };
  const hist = () => ((S.settings.matq_hist || {}).items || []);
  const saveHist = (items) => put('settings', { id: 'matq_hist', items: items.slice(0, 12) });
  const clearBtn = (act, show) => (show ? `<button class="matclr" data-act="${act}" title="Eingabe löschen" aria-label="Eingabe löschen">×</button>` : '');
  const KINDS = [['video', 'Video'], ['buch', 'Buch'], ['pdf', 'PDF'], ['epub', 'EPUB'], ['text', 'Text / Word'], ['bild', 'Screenshots'], ['link', 'Link']];
  const kindsOrdered = () => { const sv = ((S.settings.matcfg || {}).order || []).filter((k) => KINDS.some((x) => x[0] === k)); return sv.map((k) => KINDS.find((x) => x[0] === k)).concat(KINDS.filter((x) => !sv.includes(x[0]))); };
  const kindOf = (s) => (s.kind && KINDS.some((k) => k[0] === s.kind) ? s.kind : isYt(s.url) || s.type === 'video' ? 'video' : s.epub ? 'epub' : s.type === 'pdf' || /\.pdf$/i.test(s.file || '') ? 'pdf' : s.url && !s.pages ? 'link' : /^Screenshots /.test(s.title || '') ? 'bild' : 'text');
  const newF = () => ({ q: '', e: '', t: [], a: '' });
  function filterOf() { const m = M(); if (!m.f) m.f = newF(); if (m.f.a === undefined) m.f.a = ''; return m.f; }
  const matches = (s) => { const f = filterOf(), t = tagsOf(s); if (f.a && kindOf(s) !== f.a) return false; if (f.e && !t.epoche.includes(f.e)) return false; if (f.t.some((x) => !t.tags.includes(x) && !t.keys.includes(x))) return false; const q = norm(f.q).split(/\s+/).filter(Boolean); if (q.length) { const hay = norm([s.title, s.vtitle, s.channel, s.notes, ...t.epoche, ...t.tags, ...t.keys].join(' ')); if (q.some((w) => !hay.includes(w))) return false; } return true; };
  function filterBar(list) {
    const f = filterOf(), eps = EPOCHS.filter((e) => list.some((s) => tagsOf(s).epoche.includes(e))), cnt = {}; list.forEach((s) => { const t = tagsOf(s); t.tags.concat(t.keys).forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; }); });
    const tg = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b, 'de')).slice(0, 30);
    return `<div class="matfilter"><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="matinw" style="flex:1;min-width:200px"><input class="kminp" id="matfq" data-ch="matfq" value="${esc(f.q)}" placeholder="Bibliothek filtern: Titel, Kanal, Tag …" style="width:100%">${clearBtn('matfclr', !!f.q)}</span>${f.q || f.e || f.a || f.t.length ? '<button class="btn sm" data-act="matfx">Filter zurücksetzen</button>' : ''}</div>
      ${(() => { const ks = KINDS.filter(([k]) => list.some((s) => kindOf(s) === k)); return ks.length > 1 || f.a ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><span class="muted sm">Art:</span>${ks.map(([k, n]) => `<button class="mattag sel${f.a === k ? ' on' : ''}" data-act="matfa" data-v="${k}">${n}<small> ${list.filter((s) => kindOf(s) === k).length}</small></button>`).join('')}</div>` : ''; })()}
      ${eps.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><span class="muted sm">Epoche:</span>${eps.map((e) => `<button class="mattag ep sel${f.e === e ? ' on' : ''}"${epS(e)} data-act="matfe" data-v="${esc(e)}">${esc(e)}</button>`).join('')}</div>` : ''}
      ${tg.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted sm">Tags:</span>${tg.map((x) => `<button class="mattag tg sel${f.t.includes(x) ? ' on' : ''}" data-act="matft" data-v="${esc(x)}">${esc(x)}<small> ${cnt[x]}</small></button>`).join('')}</div>` : ''}</div>`;
  }
  function thumbOf(s, big) {
    const vid = s.noThumb ? null : ytVid(s.url), th = s.noThumb ? null : s.thumb, k = kindOf(s);
    if (vid) return `<img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer">`;
    if (th && (th.file || th.url)) return `<img src="${th.file ? url(th.file, '&inline=1' + (th.v ? '&v=' + th.v : '')) : esc(th.url)}" alt="" loading="lazy" referrerpolicy="no-referrer">${th.lic ? '<b class="matcc">CC</b>' : ''}`;
    return `<div class="matph t-${esc(s.type || 'sonst')}"><span>${big ? esc(TYPES[s.type] || 'Quelle') : esc(((KINDS.find(([x]) => x === k) || [0, ''])[1] || '').split(' ')[0].slice(0, 5))}</span></div>`;
  }
  const epTags = (s) => tagsOf(s).epoche.map((e) => `<span class="mattag ep on"${epS(e)}>${esc(e)}</span>`).join('') || '<span class="muted sm">–</span>';
  const umfang = (s) => (s.seconds != null ? dur(s.seconds).replace(/ (Min|Std)$/, '') + (/Std/.test(dur(s.seconds)) ? ' Std' : ' Min') : s.pages ? s.pages + (kindOf(s) === 'pdf' ? (s.pages === 1 ? ' Seite' : ' Seiten') : ' Abschn.') : '–');
  function editCard(s) {
    const id = s.id.replace(/^mat_/, ''), t = tagsOf(s), allTg = TAGS.map((x) => x[0]).filter((x) => !EPOCHS.includes(x)), restT = allTg.filter((x) => !t.tags.includes(x));
    const tog = (list, cur, ep) => list.map((x) => `<button class="mattag ${ep ? 'ep ' : ''}sel${cur.includes(x) ? ' on' : ''}"${ep ? epS(x) : ''} data-act="mattoggle" data-id="${id}" data-t="${esc(x)}">${esc(x)}</button>`).join('');
    const row = (k, v) => `<div class="kmkvr"><span class="kmk">${k}</span><span class="kmv">${v}</span></div>`;
    const ang = [['Autor', s.author], ['Verlag', s.publisher], ['Sprache', s.lang], ['Jahr', s.year], ['Datei', s.fileName], ['Größe', s.size ? mb(s.size) : ''], ['Seiten', s.type === 'pdf' && s.pages ? s.pages : '']].filter((x) => x[1]).map(([k, v]) => row(k, esc(v))).join('');
    const yt = isYt(s.url) ? row('Kanal', s.channelUrl ? `<a href="${esc(s.channelUrl)}" target="_blank" rel="noopener">${esc(s.channel || '')}</a>` : esc(s.channel || '–')) + row('Video', `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`) + row('Dauer', s.seconds != null ? esc(dur(s.seconds)) : '–') : s.url ? row('Adresse', `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`) : '';
    return `<section class="card" id="matdetail" style="margin-top:14px"><div class="row" style="align-items:center;gap:8px"><h2 style="margin:0">Bearbeiten</h2><span style="flex:1"></span><button class="btn sm" data-act="matopen" data-id="${id}">Schließen</button></div>
      ${row('Art', `<span class="chips">${KINDS.map(([k, n]) => `<button class="mattag sel${kindOf(s) === k ? ' on' : ''}" data-act="matkind" data-id="${id}" data-v="${k}">${n}</button>`).join('')}</span>`)}
      ${row('Titel', `<input class="matin" data-ch="matttl" data-id="${id}" value="${esc(s.vtitle || s.title)}">`)}${yt}${ang}
      ${s.file ? row('Datei', `<a href="${url(s.file, /\.pdf$/i.test(s.file) ? '&inline=1' : '')}" target="_blank">${/\.pdf$/i.test(s.file) ? 'PDF ansehen' : 'Datei öffnen'}</a>`) : ''}
      ${isYt(s.url) ? `<div class="kmkvr"><span class="kmk">Video-Datei</span><span class="kmv">${videoBlock(s, id).replace('margin-top:10px', 'margin-top:0')}</span></div>` : ''}
      <div class="kmkvr"><span class="kmk">Vorschaubild</span><span class="kmv">${thumbBlock(s, id).replace('<span class="muted">Vorschaubild:</span>', '').replace('margin-top:10px', 'margin-top:0')}</span></div>
      <div class="kmkvr"><span class="kmk">Epoche</span><span class="kmv chips">${tog(EPOCHS, t.epoche, true)}</span></div>
      <div class="kmkvr"><span class="kmk">Themen</span><span class="kmv chips">${tog(t.tags, t.tags)}${tog(restT.slice(0, 6), t.tags)}<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${tog(restT.slice(6), t.tags)}</div></details><input class="matin" data-ch="matatag" data-id="${id}" placeholder="+ eigener Tag" style="width:130px"></span></div>
      ${row('Schlagwörter', `<span class="chips">${t.keys.map((x) => `<span class="mattag ky">${esc(x)}<button data-act="matrmkey" data-id="${id}" data-t="${esc(x)}" aria-label="Entfernen">×</button></span>`).join('')}<input class="matin" data-ch="matakey" data-id="${id}" placeholder="+ Schlagwort" style="width:140px"></span>`)}
      ${row('Notiz', `<input class="matin" data-ch="matnote" data-id="${id}" value="${esc(s.notes || '')}" placeholder="Notiz zur Quelle">`)}
      <div class="matfoot"><button class="btn sm" data-act="matretag" data-id="${id}" title="Epoche, Themen und Schlagwörter aus Titel und Text neu bestimmen">Tags neu berechnen</button><button class="btn sm bad" data-act="matdel" data-id="${id}">Löschen</button></div></section>`;
  }
  function quellen() {
    const m = M(), list = sources(), f = filterOf(), shown = list.filter(matches), act = f.q || f.e || f.a || f.t.length;
    const zone = `<section class="card"><h2>Neue Quelle</h2><div class="matdz" id="matdz" tabindex="0" role="button" aria-label="Dateien oder Links hineinziehen"><div class="matdzi">⬇</div><div><b>Alles hierher ziehen</b><div class="muted sm">PDF, EPUB, Video, YouTube-Link, Word, Textdatei, Screenshot oder Internetadresse. Darunter erscheinen die Angaben zum Prüfen. Klicken oder Strg+V geht auch.</div></div><input type="file" id="matdzf" multiple hidden></div></section>`;
    const ready = m.drafts.filter((x) => x.status === 'ready').length;
    const drafts = m.drafts.length ? `${ready > 1 ? `<div class="row" style="justify-content:flex-end;margin:12px 0 0"><button class="btn good" data-act="mdall">Alle ${ready} anlegen</button></div>` : ''}${m.drafts.map(draftCard).join('')}` : '';
    const cnt = {}; list.forEach((x) => { const t = tagsOf(x); t.tags.forEach((y) => { cnt[y] = (cnt[y] || 0) + 1; }); });
    const tg = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b, 'de')), top = tg.slice(0, 12), more = tg.slice(12);
    const tgb = (x) => `<button class="mattag tg sel${f.t.includes(x) ? ' on' : ''}" data-act="matft" data-v="${esc(x)}">${esc(x)}<small> ${cnt[x]}</small></button>`;
    const view = m.view || 'liste';
    const rows = shown.map((s, i) => {
      const id = s.id.replace(/^mat_/, ''), on = m.open === id;
      return `<div class="kmrow kmgo${on ? ' matsel' : ''}" data-act="matpop" data-id="${id}" tabindex="0" role="link"><span class="kmno">${i + 1}</span><span class="matth2">${thumbOf(s)}</span><span class="kmnm"><b>${esc(s.vtitle || s.title)}</b><small class="muted"> ${esc(s.channel || s.author || '')}</small></span><span class="matc">${esc((KINDS.find(([k]) => k === kindOf(s)) || [0, ''])[1])}${s.dl && s.dl.state === 'done' ? ' <b class="matnas2">NAS</b>' : ''}</span><span class="matc chips2">${epTags(s)}</span><span class="matc">${esc(umfang(s))}</span><button class="matedit2" data-act="matopen" data-id="${id}" aria-expanded="${on}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></div>`;
    }).join('');
    const tile = (s) => { const id = s.id.replace(/^mat_/, ''), on = m.open === id, e0 = tagsOf(s).epoche[0]; return `<div class="mattile${on ? ' on' : ''}${e0 ? ' hasep' : ''}"${epS(e0)}><button class="matmain" data-act="matpop" data-id="${id}" title="Öffnen: ${esc(s.title)}"><span class="matth">${thumbOf(s, true)}${s.dl && s.dl.state === 'done' ? '<b class="matnas" title="Video liegt auf der NAS">NAS</b>' : ''}${s.seconds != null ? `<b class="matdur">${esc(dur(s.seconds).replace(/ (Min|Std)$/, ''))}</b>` : ''}</span><span class="matti">${esc(s.vtitle || s.title)}</span><span class="matsub">${epTags(s)}</span></button><button class="matedit" data-act="matopen" data-id="${id}" aria-expanded="${on}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></div>`; };
    const body = !list.length ? '<p class="muted" style="margin:0">Noch keine Quellen. Ziehe oben ein PDF, ein Video oder einen YouTube-Link hinein.</p>'
      : !shown.length ? '<p class="muted" style="margin:0">Keine Quelle passt zum Filter.</p>'
      : view === 'kacheln' ? `<div class="matgrid">${shown.map(tile).join('')}</div>`
      : `<div class="kmtable" style="--kmgrid:34px 76px minmax(200px,2.2fr) 90px minmax(150px,1.4fr) 90px 40px;--kmmin:680px"><div class="kmrow kmth"><span>Nr</span><span></span><span>Titel</span><span>Art</span><span>Epoche</span><span>Umfang</span><span></span></div>${rows}</div>`;
    const lib = list.length ? `<section class="card" style="margin-top:14px"><div class="row" style="align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap"><h2 style="margin:0">Bibliothek (${shown.length}${shown.length !== list.length ? ' von ' + list.length : ''})</h2><span style="flex:1"></span><span class="matseg"><button class="${view === 'liste' ? 'on' : ''}" data-act="matview" data-v="liste">Liste</button><button class="${view === 'kacheln' ? 'on' : ''}" data-act="matview" data-v="kacheln">Kacheln</button></span></div>
      <div class="row" style="gap:8px;align-items:center;margin-bottom:8px"><span class="matinw" style="flex:1"><input class="kminp" id="matfq" data-ch="matfq" value="${esc(f.q)}" placeholder="Filtern: Titel, Kanal, Autor, Tag …" style="width:100%">${clearBtn('matfclr', !!f.q)}</span>${act ? '<button class="btn sm" data-act="matfx">Zurücksetzen</button>' : ''}</div>
      ${tg.length ? `<div class="chips" style="margin-bottom:12px"><span class="muted sm">Themen:</span>${top.map(tgb).join('')}${more.length ? `<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${more.map(tgb).join('')}</div></details>` : ''}</div>` : ''}
      ${body}</section>` : '';
    const open = list.find((x) => x.id.replace(/^mat_/, '') === m.open);
    return zone + drafts + lib + (open ? editCard(open) : '');
  }
  function suche() {
    const m = M();
    const res = m.res == null ? '' : m.res.length ? m.res.map((r, i) => `<div class="kmli" style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row" style="gap:8px;align-items:center"><b>${esc(r.title)}</b><span class="muted sm">${r.h ? esc(r.h) : 'Seite ' + r.p}</span><span style="flex:1"></span><button class="btn sm good" data-act="matpick" data-i="${i}">Übernehmen</button></div><div class="sm">${hl(snippet(r), m.q)}</div></div>`).join('') : '<p class="muted">Nichts gefunden. Lege mehr Quellen an oder suche mit anderen Wörtern.</p>';
    const sel = m.sel.length ? m.sel.map((x, i) => `<div style="margin-bottom:10px"><div class="row" style="gap:8px"><b class="sm">${esc(x.ref || 'Text')}</b><span style="flex:1"></span><button class="btn sm bad" data-act="matunpick" data-i="${i}" aria-label="Entfernen">×</button></div><textarea rows="5" style="width:100%" data-ch="matsel" data-i="${i}">${esc(x.t)}</textarea></div>`).join('') : '<p class="muted">Noch nichts übernommen. Suche ein Thema und klicke bei den Fundstellen auf „Übernehmen“.</p>';
    const T0 = esc(m.title || m.q || ''), fl = filterOf(), act = fl.q || fl.e || fl.a || fl.t.length, srcs = sources(), hit = srcs.filter(matches);
    const srcList = act ? `<div style="margin-top:10px"><div class="muted sm" style="margin-bottom:4px">${hit.length} Quelle(n) passen zum Filter:</div>${hit.map((s) => { const id = s.id.replace(/^mat_/, ''), t = tagsOf(s); return `<div class="row" style="gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--line)"><b class="sm">${esc(s.vtitle || s.title)}</b><span class="muted sm">${esc((KINDS.find(([k]) => k === kindOf(s)) || [0, TYPES[s.type] || ''])[1])} · ${s.pages || 0} Abschn.</span><span>${t.epoche.map((x) => `<span class="mattag ep"${epS(x)}>${esc(x)}</span>`).join('')}</span><span style="flex:1"></span><button class="btn sm" data-act="matall" data-id="${id}">Ganze Quelle übernehmen</button></div>`; }).join('') || '<span class="muted sm">–</span>'}</div>` : '';
    return `<section class="card"><h2>Thema suchen</h2>${srcs.length ? filterBar(srcs) : ''}<div class="row" style="gap:8px;margin-top:10px"><span class="matinw" style="flex:1;min-width:200px"><input id="matq" value="${esc(m.q)}" placeholder="z. B. Römische Republik" style="width:100%" data-ch="matqs" autocomplete="off">${clearBtn('matqclr', !!m.q)}</span><button class="btn good" data-act="matsearch">Suchen</button></div>${hist().length ? `<div class="row" style="gap:4px;flex-wrap:wrap;margin-top:8px;align-items:center"><span class="muted sm">Zuletzt gesucht:</span>${hist().map((q) => `<span class="mattag hq"><button data-act="mathq" data-q="${esc(q)}" title="Noch einmal suchen">${esc(q)}</button><button data-act="mathqx" data-q="${esc(q)}" aria-label="Aus dem Verlauf löschen" title="Aus dem Verlauf löschen">×</button></span>`).join('')}<button class="btn sm" data-act="mathqall">Alle löschen</button></div>` : ''}${srcList}${res ? `<div style="margin-top:10px">${res}</div>` : ''}</section>
    <section class="card" style="margin-top:12px"><h2>Auswahl (${m.sel.length})</h2><div class="muted sm" style="margin-bottom:8px">Du kannst die Texte hier kürzen oder ergänzen. Daraus entsteht das Material.</div>${sel}
    ${m.sel.length ? `<div class="row" style="gap:8px;align-items:flex-end;flex-wrap:wrap;margin-top:6px"><label class="f" style="flex:1;min-width:220px">Titel des Materials<input id="mattitle" value="${T0}" data-ch="mattitles" autocomplete="off"></label><button class="btn good" data-act="matmake" data-k="Arbeitsblatt">Arbeitsblatt</button><button class="btn good" data-act="matmake" data-k="Lückentext">Lückentext</button><button class="btn good" data-act="matmake" data-k="Kreuzworträtsel">Kreuzworträtsel</button><button class="btn" data-act="matai" data-k="Quiz">Quiz</button><button class="btn" data-act="matai" data-k="Test">Test</button><button class="btn" data-act="matai" data-k="Forms">Google/Microsoft Forms</button></div><div class="muted sm" style="margin-top:6px">Jedes Material wird als Word-Datei und PDF im Ordner gespeichert. Quiz, Test und Forms brauchen die KI und sind noch nicht freigeschaltet.</div>` : ''}</section>`;
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
    matall: async (e) => { const id = e.dataset.id, s = srcOf(id), t = await textOf(id); if (!t.pages.length) return toast('Diese Quelle hat noch keinen Text'); M().sel.push({ ref: (s.vtitle || s.title) + ' (ganze Quelle)', t: t.pages.map((p) => p.t).join('\n').slice(0, 15000) }); toast('Übernommen'); render(); },
    matai: (e) => toast(e.dataset.k + ': Dafür brauche ich den KI-Schlüssel. Das schalten wir in der nächsten Stufe frei, die Auswahl bleibt erhalten.'),
    matnote0: () => { note(); render(); },
    matrmkey: (e) => { const s = srcOf(e.dataset.id); if (!s) return; const t = e.dataset.t, mk = (s.mankeys || []).filter((x) => x !== t), hid = (s.hid || []).slice(); if (!(s.mankeys || []).includes(t) && !hid.includes(t)) hid.push(t); put('settings', Object.assign({}, s, { mankeys: mk, hid })); render(); },
    mdrmkey: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.keys = d.keys.filter((x) => x !== e.dataset.v); render(); } },
    matkind: (e) => { const s = srcOf(e.dataset.id); if (s) { put('settings', Object.assign({}, s, { kind: e.dataset.v })); render(); } },
    mdkind: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.art = e.dataset.v; render(); } },
    matgoogle: (e) => { const s = srcOf(e.dataset.id); if (!s) return; googleImg(((s.vtitle || s.title || '') + ' ' + (tagsOf(s).epoche[0] || '')).trim()); },
    mdgoogle: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) googleImg((d.f.title || d.name || '').trim()); },
    matthumbdel: async (e) => { const id = e.dataset.id, s = srcOf(id); if (!s) return; if (e.dataset.back) { put('settings', Object.assign({}, s, { noThumb: false })); return render(); } if (s.thumb && s.thumb.file) { try { await fdel(s.thumb.file); } catch (x) { /* */ } } const n = Object.assign({}, s, { noThumb: true }); delete n.thumb; put('settings', n); toast('Vorschaubild entfernt'); render(); },
    mdnothumb: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.noThumb = !d.noThumb; render(); } },
    matthumb: async (e) => {
      const id = e.dataset.id, s = srcOf(id), t = tagsOf(s), q = prompt('Suchbegriff für das Vorschaubild (freie Bilder von Wikimedia Commons):', (s.thumb && s.thumb.q) || t.tags[0] || t.epoche[0] || s.title); if (!q) return;
      const m = M(); m.busy = 'Bild wird gesucht …'; render();
      try { const c = await commonsFind(q, s.thumb && s.thumb.url ? [s.thumb.url] : null); if (!c.length) toast('Kein passendes freies Bild gefunden. Versuche einen anderen Suchbegriff.'); else { put('settings', Object.assign({}, srcOf(id), { noThumb: false, thumb: Object.assign({ q }, c[0]) })); toast('Vorschaubild gesetzt'); } } catch (x) { toast('Bildsuche nicht möglich: ' + (x.message || x)); }
      m.busy = ''; render();
    },
    matdl: (e) => startDownload(e.dataset.id),
    matview: (e) => { M().view = e.dataset.v; render(); },
    mattoggle: (e) => { const id = e.dataset.id, s = srcOf(id); if (!s) return; const t = e.dataset.t, tt = tagsOf(s), has = tt.epoche.includes(t) || tt.tags.includes(t); let man = (s.man || []).slice(), hid = (s.hid || []).slice(); if (has) { if (man.includes(t)) man = man.filter((x) => x !== t); else if (!hid.includes(t)) hid.push(t); } else { if (!man.includes(t)) man.push(t); hid = hid.filter((x) => x !== t); } put('settings', Object.assign({}, s, { man, hid })); render(); },
    mdgo: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d && d.status === 'ready') commit(d); },
    mdall: async () => { for (const d of M().drafts.filter((x) => x.status === 'ready')) await commit(d); },
    mddel: (e) => { const m = M(); m.drafts = m.drafts.filter((x) => x.id !== e.dataset.d); render(); },
    mdep: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (!d) return; const v = e.dataset.v; d.ep = d.ep.includes(v) ? d.ep.filter((x) => x !== v) : d.ep.concat(v); render(); },
    mdtg: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (!d) return; const v = e.dataset.v; d.tg = d.tg.includes(v) ? d.tg.filter((x) => x !== v) : d.tg.concat(v); render(); },
    mdmode: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.mode = e.dataset.v; render(); } },
    matretag: async (e) => { await retag(e.dataset.id, true); toast('Tags neu berechnet'); render(); },
    matrm: (e) => { const s = srcOf(e.dataset.id); if (!s) return; const t = e.dataset.t, man = (s.man || []).filter((x) => x !== t), hid = (s.hid || []).slice(); if ((s.man || []).includes(t)) { /* manuell entfernt */ } else if (!hid.includes(t)) hid.push(t); put('settings', Object.assign({}, s, { man, hid })); render(); },
    matfa: (e) => { const f = filterOf(); f.a = f.a === e.dataset.v ? '' : e.dataset.v; render(); },
    matfe: (e) => { const f = filterOf(); f.e = f.e === e.dataset.v ? '' : e.dataset.v; render(); },
    matft: (e) => { const f = filterOf(), v = e.dataset.v; f.t = f.t.includes(v) ? f.t.filter((x) => x !== v) : f.t.concat(v); render(); },
    matfx: () => { M().f = newF(); setIn('matfq', ''); render(); },
    matpop: (e) => popup(e.dataset.id),
    matopen: (e) => { const m = M(), id = e.dataset.id; m.open = m.open === id ? null : id; render(); if (m.open) setTimeout(() => { const c = document.getElementById('matdetail'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50); },
    matshowf: () => { const m = M(); m.showFiles = !m.showFiles; if (m.showFiles) m.files = null; render(); },
    matyt: async (e) => {
      const s = srcOf(e.dataset.id); if (!s || !s.url) return; const m = M(); m.busy = 'YouTube-Infos werden geholt …'; render();
      try { put('settings', Object.assign({}, s, ytFields(await ytFetch(s.url)))); await retag(e.dataset.id); toast('Infos aktualisiert'); } catch (x) { toast('Nicht abrufbar: ' + (x.message || x)); }
      m.busy = ''; render();
    },
    matdel: async (e) => { const s = srcOf(e.dataset.id); if (!s || !confirm('Quelle „' + s.title + '“ mit allen Texten löschen?')) return; await fdel(QDIR + '/' + e.dataset.id + '.json'); if (s.file) await fdel(s.file); if (s.epub) await fdel(s.epub); delete T[e.dataset.id]; del('settings', 'mat_' + e.dataset.id); M().open = null; render(); },
    matsearch: () => { const m = M(); m.q = document.getElementById('matq').value; const q = m.q.trim(); if (q) saveHist([q].concat(hist().filter((x) => x.toLowerCase() !== q.toLowerCase()))); search(); },
    mathq: (e) => { const m = M(); m.q = e.dataset.q; setIn('matq', m.q); saveHist([m.q].concat(hist().filter((x) => x !== m.q))); search(); },
    mathqx: (e) => { saveHist(hist().filter((x) => x !== e.dataset.q)); render(); },
    mathqall: () => { saveHist([]); render(); },
    matqclr: () => { const m = M(); m.q = ''; m.res = null; setIn('matq', ''); render(); setTimeout(() => { const i = document.getElementById('matq'); if (i) i.focus(); }, 30); },
    matfclr: () => { filterOf().q = ''; setIn('matfq', ''); render(); setTimeout(() => { const i = document.getElementById('matfq'); if (i) i.focus(); }, 30); },
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
    mdf: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) d.f[e.dataset.k] = e.value; },
    mddl: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) d.dl = e.checked; },
    mdnew: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d), v = e.value.trim(); if (!d || !v) return; if (!d.tg.includes(v)) d.tg.push(v); e.value = ''; render(); },
    matatag: (e) => { const v = e.value.trim(); if (!v) return; const s = srcOf(e.dataset.id); if (!s) return; put('settings', Object.assign({}, s, { man: [...new Set((s.man || []).concat(v)) ], hid: (s.hid || []).filter((x) => x !== v) })); e.value = ''; render(); },
    matfq: (e) => { filterOf().q = e.value; render(); },
    matakey: (e) => { const v = e.value.trim(); if (!v) return; const s = srcOf(e.dataset.id); if (!s) return; put('settings', Object.assign({}, s, { mankeys: [...new Set((s.mankeys || []).concat(v))], hid: (s.hid || []).filter((x) => x !== v) })); e.value = ''; render(); },
    mdkey: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d), v = e.value.trim(); if (!d || !v) return; if (!d.keys.includes(v)) d.keys.push(v); e.value = ''; render(); },
    matttl: (e) => { const s = srcOf(e.dataset.id); if (!s) return; const v = e.value.trim(); if (v) put('settings', Object.assign({}, s, s.vtitle ? { vtitle: v, title: v } : { title: v })); render(); },
    matnote: (e) => { const s = srcOf(e.dataset.id); if (s) put('settings', Object.assign({}, s, { notes: e.value })); },
    matsel: (e) => { const x = M().sel[+e.dataset.i]; if (x) x.t = e.value; },
    matqs: (e) => { M().q = e.value; },
    mattitles: (e) => { M().title = e.value; },
    mattpl: async (e) => { const f = e.files[0]; if (!f) return; try { await fput(TPL, f); M().tpl = true; toast('Vorlage gespeichert'); } catch (x) { toast('Fehler: ' + x.message); } e.value = ''; render(); },
  });
  /* Entf: markierte Kachel bzw. markierten Entwurf löschen */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Delete' || U.view !== 'material' || document.querySelector('.matask')) return;
    const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    const dr = ae && ae.closest && ae.closest('.matdraft'); if (dr) { e.preventDefault(); A.mddel({ dataset: { d: dr.dataset.d } }); return; }
    const tile = ae && ae.closest && ae.closest('.mattile'), row = ae && ae.closest && ae.closest('.kmrow[data-id]'), mm = tile && tile.querySelector('.matmain'), id = (mm && mm.dataset.id) || (row && row.dataset.id) || M().open;
    if (id && srcOf(id)) { e.preventDefault(); A.matdel({ dataset: { id } }); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'matq') { e.preventDefault(); A.matsearch(); } });
  /* PDF originalgetreu (mit Bildern, Layout) Seite für Seite anzeigen */
  async function showPdf(o, file, title) {
    const box = o.querySelector('.matpdfs'), zl = o.querySelector('[data-zl]'), pgl = o.querySelector('[data-pg]'); let zoom = 1, doc;
    try { const lib = await loadPdfJs(); doc = await lib.getDocument({ url: url(file), withCredentials: true }).promise; } catch (e) { box.innerHTML = `<div class="matnote err"><span>PDF konnte nicht angezeigt werden: ${esc(e.message || e)}</span></div>`; return; }
    const first = await doc.getPage(1), v1 = first.getViewport({ scale: 1 }), dpr = Math.min(2, window.devicePixelRatio || 1);
    const build = () => {
      box.innerHTML = ''; const w = Math.min(box.clientWidth - 24, 1000) * zoom, sc = w / v1.width, ph = [];
      const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { const i = +en.target.dataset.i; if (!en.target.dataset.done) { en.target.dataset.done = '1'; draw(en.target, i, sc); } pgl.textContent = 'Seite ' + i + ' von ' + doc.numPages; } }), { root: box, rootMargin: '300px' });
      for (let i = 1; i <= doc.numPages; i++) { const d = document.createElement('div'); d.className = 'matpdfpg'; d.dataset.i = i; d.style.width = w + 'px'; d.style.height = Math.round(v1.height * sc) + 'px'; box.appendChild(d); io.observe(d); }
      zl.textContent = Math.round(zoom * 100) + ' %';
    };
    const draw = async (el, i, sc) => { try { const pg = await doc.getPage(i), vp = pg.getViewport({ scale: sc * dpr }), cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height); cv.style.width = '100%'; cv.style.height = '100%'; await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; el.style.height = ''; el.appendChild(cv); } catch (e) { el.textContent = 'Seite ' + i + ' konnte nicht gezeigt werden'; } };
    o.querySelector('.matpdftb').addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (!b) return; zoom = Math.max(0.5, Math.min(3, zoom + (b.dataset.z === '+' ? 0.25 : -0.25))); build(); });
    build();
  }
  /* Doppelklick auf eine Kachel: Quelle als Pop-up öffnen */
  async function popup(id) {
    const s = srcOf(id); if (!s) return;
    const o = document.createElement('div'); o.className = 'matask'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    const kind = kindOf(s); let body = '';
    if (kind === 'video' && s.file && !(s.dl && s.dl.file) && /\.(mp4|m4v|mov|webm|mkv)$/i.test(s.file)) body = `<video controls autoplay src="${url(s.file, '&inline=1')}" style="width:100%;height:100%;background:#000"></video>`;
    else if (kind === 'pdf' && s.file) body = `<div class="matpdf"><div class="matpdftb"><button class="btn sm" data-z="-" aria-label="Verkleinern">−</button><span class="muted sm" data-zl>100 %</span><button class="btn sm" data-z="+" aria-label="Vergrößern">+</button><span class="muted sm" data-pg style="margin-left:10px"></span><span style="flex:1"></span><a class="btn sm" href="${url(s.file, '&inline=1')}" target="_blank" rel="noopener">In neuem Tab öffnen</a></div><div class="matpdfs">⏳ PDF wird geladen …</div></div>`;
    else if (kind === 'video' && s.dl && s.dl.state === 'done' && s.dl.file) body = `<video controls autoplay src="${url(s.dl.file, '&inline=1')}" style="width:100%;height:100%;background:#000"></video>`;
    else {
      const t = await textOf(id), vid = ytVid(s.url);
      if (vid && kind === 'video') { const emb = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`; body = `<iframe src="${emb}" title="${esc(s.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;background:#000"></iframe>`; }
      else body = `<div style="padding:18px 22px;overflow:auto;height:100%">${vid ? `<img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" referrerpolicy="no-referrer" style="max-width:320px;border-radius:10px;float:right;margin:0 0 10px 14px">` : ''}${s.url ? `<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>${s.channelUrl ? ` · <a href="${esc(s.channelUrl)}" target="_blank" rel="noopener">Kanal ${esc(s.channel || '')}</a>` : ''}</p>` : ''}${kind === 'video' && !(s.dl && s.dl.state === 'done') ? '<p class="muted sm">Das Video ist noch nicht auf der NAS gespeichert.</p>' : ''}${t.pages.length ? t.pages.map((p) => `<h3 style="margin:16px 0 4px;font-size:15px">${esc(p.h || 'Seite ' + p.p)}</h3><p style="margin:0;white-space:pre-wrap">${esc(p.t)}</p>`).join('') : '<p class="muted">Zu dieser Quelle ist noch kein Text gespeichert.</p>'}</div>`;
    }
    const t0 = tagsOf(s);
    o.innerHTML = `<div class="matbox matbig"><div class="row" style="align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0;flex:1">${esc(s.vtitle || s.title)}</h3><span class="muted sm">${t0.epoche.map(esc).join(', ')}</span><button class="btn sm" data-x="1" aria-label="Schließen">Schließen ✕</button></div><div class="matview">${body}</div></div>`;
    const close = () => { o.remove(); document.removeEventListener('keydown', esc1); };
    const esc1 = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', esc1); document.body.appendChild(o);
    if (kind === 'pdf' && s.file) showPdf(o, s.file, s.title);
  }
  const inView = () => U.view === 'material';
  /* Symbole der Seitenleiste per Drag-and-Drop anordnen (wird auf allen Geräten gespeichert) */
  let kdrag = null;
  const kicon = (e) => e.target && e.target.closest && e.target.closest('.kmside .kmicon[data-k]');
  document.addEventListener('dragstart', (e) => { const k = inView() && kicon(e); if (!k) return; kdrag = k.dataset.k; k.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', kdrag); } catch (x) { /* */ } });
  document.addEventListener('dragover', (e) => { const k = kdrag && kicon(e); if (k && k.dataset.k !== kdrag) { e.preventDefault(); document.querySelectorAll('.kmicon.over').forEach((x) => x.classList.remove('over')); k.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const k = kicon(e); if (k) k.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    const k = kdrag && kicon(e); if (!k) return; e.preventDefault(); e.stopImmediatePropagation();
    const from = kdrag, to = k.dataset.k; kdrag = null; if (from === to) return;
    const order = kindsOrdered().map((x) => x[0]), fi = order.indexOf(from), ti = order.indexOf(to); order.splice(fi, 1); order.splice(ti, 0, from);
    put('settings', { id: 'matcfg', order }); render();
  }, true);
  document.addEventListener('dragend', () => { kdrag = null; document.querySelectorAll('.kmicon.drag,.kmicon.over').forEach((x) => x.classList.remove('drag', 'over')); });
  const zone = (e) => e.target && e.target.closest && e.target.closest('#matdz');
  document.addEventListener('click', (e) => { const pz = e.target.closest && e.target.closest('.matpz'); if (pz) { pz.focus(); return; } if (zone(e) && !(e.target.tagName === 'INPUT')) { const f = document.getElementById('matdzf'); if (f) f.click(); } });
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'matdzf') { const f = [...e.target.files]; e.target.value = ''; intake(f, ''); } });
  document.addEventListener('dragover', (e) => { if (inView() && e.target.closest && e.target.closest('.matpz')) { e.preventDefault(); e.target.closest('.matpz').classList.add('over'); return; } if (inView() && zone(e)) { e.preventDefault(); zone(e).classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = zone(e); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    if (!inView()) return; const pzz = e.target.closest && e.target.closest('.matpz'); if (pzz) { e.preventDefault(); pzz.classList.remove('over'); takeImage(pzz, e.dataTransfer); return; } const z = zone(e); if (!z) return; e.preventDefault(); z.classList.remove('over');
    const dt = e.dataTransfer, files = [...(dt.files || [])], text = files.length ? '' : (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n').filter((l) => l && l[0] !== '#').join(' ');
    intake(files, text);
  });
  document.addEventListener('paste', (e) => {
    if (!inView()) return; const ae = document.activeElement; const pz = ae && ae.closest && ae.closest('.matpz'); if (pz) { e.preventDefault(); takeImage(pz, e.clipboardData); return; } if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])], text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (!files.length && !text.trim()) return; e.preventDefault(); intake(files, text);
  });
  const st = document.createElement('style');
  st.textContent = `.matdz{display:flex;gap:16px;align-items:center;border:2px dashed var(--line);cursor:pointer;padding:22px 24px}.matdz:hover,.matdz.over,.matdz:focus{border-color:var(--brand,var(--accent));background:var(--accent-soft);outline:none}.matdzi{font-size:34px;line-height:1;color:var(--muted)}
.matask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3000;display:grid;place-items:center;padding:16px}.matbox{background:var(--surface);color:var(--ink);border-radius:14px;padding:20px;max-width:520px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.mattag{display:inline-flex;align-items:center;gap:3px;border-radius:7px;padding:3px 10px;font:600 12px var(--font-body);margin:0 4px 4px 0;border:1px solid var(--line);background:var(--surface2);color:var(--ink)}.mattag button{border:0;background:transparent;color:inherit;cursor:pointer;font:700 14px/1 var(--font-body);padding:0 0 0 2px}
.mattag.ep{--ec:#9a8f6c;background:color-mix(in srgb,var(--ec) 18%,var(--surface));border-color:var(--ec);color:var(--ink)}.mattag.ep.sel:hover{background:color-mix(in srgb,var(--ec) 32%,var(--surface))}.mattag.ep.sel.on{background:var(--ec);border-color:var(--ec);color:#fff}
.mattile.hasep{border-top:4px solid var(--ec)}.matepdot{color:var(--ec);font-weight:700}.mattag.ky{background:transparent;border-style:dashed}.mattag.sel{cursor:pointer}.mattag.sel.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}.mattag small{opacity:.7}
.matfilter{margin-top:14px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.matnas{position:absolute;left:6px;top:6px;background:var(--good);color:#fff;border-radius:5px;padding:1px 6px;font:700 11px var(--font-body)}
.matnote{display:flex;gap:10px;align-items:flex-start;border-radius:10px;padding:10px 14px;margin:-4px 0 12px;font:600 14px var(--font-body)}.matnote.err{background:var(--bad-soft);color:var(--bad)}.matnote.ok{background:var(--good-soft);color:var(--good)}.matnote span{flex:1}.matnote button{border:0;background:transparent;color:inherit;font:700 18px/1 var(--font-body);cursor:pointer}
.matinw{position:relative;display:block}.matinw input{padding-right:30px!important}.matclr{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:var(--surface2);color:var(--muted);width:22px;height:22px;border-radius:50%;cursor:pointer;font:700 15px/1 var(--font-body);display:grid;place-items:center;padding:0}.matclr:hover{background:var(--bad-soft);color:var(--bad)}
.mattag.hq{padding:0 2px 0 4px}.mattag.hq button:first-child{padding:2px 6px 2px 4px;font:600 12px var(--font-body)}.mattag.hq button{color:inherit}
.matpdf{display:flex;flex-direction:column;height:100%}.matpdftb{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid var(--line);background:var(--surface2)}.matpdfs{flex:1;overflow:auto;background:#6b7280;padding:12px;text-align:center;color:#fff}.matpdfpg{margin:0 auto 12px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35)}.matpdfpg canvas{display:block}
.matbig{max-width:1100px;width:96vw;height:88vh;display:flex;flex-direction:column}.matview{flex:1;min-height:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--surface)}
.matcc{position:absolute;left:6px;top:6px;background:rgba(255,255,255,.9);color:#222;border-radius:5px;padding:0 5px;font:700 10px var(--font-body)}
.matdraft{margin-top:12px}.matdgrid{display:grid;grid-template-columns:190px minmax(0,1fr);gap:16px;align-items:start}.matdpic{aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:var(--surface2)}.matdpic img{width:100%;height:100%;object-fit:cover;display:block}
.matflds{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}.matfld{display:flex;flex-direction:column;gap:2px;font-size:12px;color:var(--muted)}.matfld:first-child{grid-column:1/-1}.matfld input{font:600 14px var(--font-body);padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink)}.matfld.ro div{font:600 14px var(--font-body);color:var(--ink);padding:6px 8px;background:var(--surface2);border-radius:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.matdrow{display:grid;grid-template-columns:70px 1fr;gap:10px;align-items:start;margin-top:10px}.matchk{display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px}
@media(max-width:640px){.matdgrid{grid-template-columns:1fr}}
.matin{font:600 14px var(--font-body);padding:5px 8px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);width:min(420px,100%)}.kmkvr .kmv.chips,.chips{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.matdz{display:flex;gap:16px;align-items:center;border:2px dashed var(--line);border-radius:12px;cursor:pointer;padding:18px 22px}.matdz:hover,.matdz.over,.matdz:focus{border-color:var(--brand,var(--accent));background:var(--accent-soft);outline:none}.matdzi{font-size:30px;line-height:1;color:var(--muted)}
.matnopic{display:grid;place-items:center;color:var(--muted);font-size:12px;border:1px dashed var(--line);background:transparent!important}
.matpz{margin-top:6px;border:2px dashed var(--line);border-radius:8px;padding:8px 10px;font-size:12px;color:var(--muted);cursor:pointer;line-height:1.35}.matpz:hover,.matpz:focus,.matpz.over{border-color:var(--brand,var(--accent));background:var(--accent-soft);outline:none;color:var(--ink)}
.matdgrid{display:grid;grid-template-columns:200px minmax(0,1fr);gap:18px;align-items:start}.matdgrid.nopic{grid-template-columns:1fr}.matdpic{aspect-ratio:16/9;border-radius:10px;overflow:hidden;background:var(--surface2)}.matdpic img{width:100%;height:100%;object-fit:cover;display:block}
.matfoot{display:flex;justify-content:flex-end;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line)}.matnote.warn{background:var(--warn-soft);color:var(--warn);margin:10px 0}
.matmore{display:inline}.matmore summary{list-style:none;cursor:pointer;display:inline-flex}.matmore[open] summary{background:var(--accent-soft)}.matmore>div{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
html:root .kmchip.matep{background:var(--ec);border-color:var(--ec);color:#fff}html:root .kmchip.matep.dim{opacity:.45}html:root .kmchip.matep:hover{opacity:1}html:root .kmchip.matep.on{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--ec)}html:root .kmchip.matep small,html:root .kmchip.matep.on small,html:root .kmchip.matep:hover small{color:#fff!important;opacity:1}
.matdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.kmchip.zero{opacity:.55}.kmside .kmicon.zero{opacity:.5}.kmside .kmicon[draggable=true]{cursor:grab}.kmside .kmicon.drag{opacity:.35}.kmside .kmicon.over{box-shadow:inset 0 3px 0 var(--brand,#fff);background:rgba(255,255,255,.18)}.kmside .kmicon.zero:hover{opacity:1}.kmchip small{margin-left:4px}
.matth2{display:block;width:64px;height:36px;border-radius:6px;overflow:hidden;background:var(--surface2);position:relative}.matth2 img{width:100%;height:100%;object-fit:cover;display:block}.matth2 .matph{font-size:11px}.matth2 .matcc{display:none}
.matc{font-size:13px;color:var(--ink)}.matc.chips2{display:flex;gap:3px;flex-wrap:wrap}.matc.chips2 .mattag{margin:0;font-size:11px;padding:1px 7px}.matnas2{background:var(--good);color:#fff;border-radius:4px;padding:0 5px;font-size:10px}
.matedit2{border:0;background:transparent;color:var(--muted);cursor:pointer;border-radius:8px;padding:6px}.matedit2:hover,.matedit2[aria-expanded=true]{background:var(--accent-soft);color:var(--accent)}.kmrow.matsel{background:var(--accent-soft)}
.matseg{display:inline-flex;border:1px solid var(--line);border-radius:8px;overflow:hidden}.matseg button{border:0;background:var(--surface);color:var(--ink);padding:5px 12px;font:600 13px var(--font-body);cursor:pointer}.matseg button.on{background:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
.matgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-top:14px}
.mattile{position:relative;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:8px;color:var(--ink);font:inherit}.matmain{display:flex;flex-direction:column;gap:5px;text-align:left;background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit;width:100%}.matedit{position:absolute;right:12px;top:12px;display:inline-flex;align-items:center;gap:2px;border:0;border-radius:8px;padding:5px 7px;background:rgba(0,0,0,.65);color:#fff;cursor:pointer;z-index:2}.matedit:hover,.matedit[aria-expanded=true]{background:var(--brand,var(--accent));color:var(--brand-ink,#fff)}
.mattile:hover{box-shadow:0 4px 14px rgba(0,0,0,.12)}.mattile.on{border-color:var(--brand,var(--accent));box-shadow:0 0 0 2px var(--brand,var(--accent))}
.matth{position:relative;display:block;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:var(--surface2)}.matth img{width:100%;height:100%;object-fit:cover;display:block}
.matph{width:100%;height:100%;display:grid;place-items:center;font:700 15px var(--font-head);color:#fff;background:#6b7280}.matph.t-buch{background:#587f0e}.matph.t-pdf{background:#b3261e}.matph.t-sonst{background:#6e7480}
.matdur{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.78);color:#fff;border-radius:5px;padding:1px 6px;font:700 12px var(--font-body)}
.matti{font:700 14px/1.25 var(--font-body);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.matsub{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
  document.head.appendChild(st);
  const pickerFiles = () => { const m = M(); return `<section class="card" style="margin-top:12px"><div class="row" style="align-items:center;gap:10px"><h2 style="margin:0">Erstellte Dateien und Word-Vorlage</h2><span style="flex:1"></span><button class="btn sm" data-act="matshowf">${m.showFiles ? 'Ausblenden' : 'Anzeigen'}</button></div>${m.showFiles ? ordner() : '<div class="muted sm" style="margin-top:6px">Hier liegen die fertigen Arbeitsblätter (Word und PDF) und deine Vorlage.</div>'}</section>`; };
  const picker = () => `<div class="kmh" style="margin:24px 0 10px"><h1 style="font-size:22px">Material suchen und auswählen</h1><div class="muted sm">Durchsucht alle Quellen (PDF, EPUB, Videos, Texte). Aus der Auswahl kannst du Material erstellen.</div></div>${suche()}${pickerFiles()}`;
  return { view, picker };
})();
