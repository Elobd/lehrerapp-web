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
  const durIn = (sec) => { sec = +sec; if (!(sec >= 0) || sec !== sec) return ''; const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.round(sec % 60); return h ? h + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s); };
  const parseDur = (t) => {
    t = String(t || '').trim().toLowerCase().replace(',', '.'); if (!t) return null; let m;
    if ((m = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(t))) return +m[1] * 3600 + +m[2] * 60 + +m[3];
    if ((m = /^(\d+):(\d{1,2})$/.exec(t))) return +m[1] * 60 + +m[2];
    if ((m = /^(?:(\d+)\s*(?:std|h)\.?)?\s*(?:(\d+)\s*(?:min|m)\.?)?\s*(?:(\d+)\s*(?:sek|s)\.?)?$/.exec(t)) && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
    if (/^\d+(\.\d+)?$/.test(t)) return Math.round(parseFloat(t) * 60);
    return NaN;
  };
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
    const s = srcOf(id); if (!s || isYt(s.url) || (!force && (s.noThumb || s.thumb || s.kind === 'ppt' || s.type === 'pdf' || s.type === 'buch' || /^Screenshots /.test(s.title || '')))) return;
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
    if (pz.dataset.pzd) { const d = M().drafts.find((x) => x.id === pz.dataset.pzd); if (d) { if (d.thumbUrl && d.thumbUrl.startsWith('blob:')) URL.revokeObjectURL(d.thumbUrl); d.thumbBlob = blob; d.cover = null; d.vid = null; d.noThumb = false; d.tpos = null; d.thumbUrl = URL.createObjectURL(blob); d.thumbSrc = 'Internet (eigene Auswahl)'; } return render(); }
    const id = pz.dataset.pz, s = srcOf(id); if (!s) return;
    try { const nm = QDIR + '/' + id + '-thumb.jpg'; await fput(nm, blob); put('settings', Object.assign({}, srcOf(id), { noThumb: false, tpos: null, thumb: { file: nm, src: 'Internet (eigene Auswahl)', v: Date.now() } })); toast('Vorschaubild gesetzt'); } catch (e) { toast('Fehler: ' + (e.message || e)); }
    render();
  }
  async function clipBlob() {
    if (!navigator.clipboard || !navigator.clipboard.read) throw new Error('nicht unterstützt');
    for (const it of await navigator.clipboard.read()) { const t = it.types.find((x) => /^image\//.test(x)); if (t) return new File([await it.getType(t)], 'zwischenablage.' + t.split('/')[1], { type: t }); }
    return null;
  }
  async function clipInto(pz) {
    try { const f = await clipBlob(); if (!f) return toast('In der Zwischenablage ist kein Bild. Rechtsklick auf ein Bild, „Bild kopieren“, dann hier klicken.'); await takeImage(pz, { files: [f], getData: () => '' }); }
    catch (e) { toast('Zugriff auf die Zwischenablage nicht möglich. Bitte im grau umrandeten Feld Strg+V drücken.'); }
  }
  const pzHtml = (attr) => `<div class="matpz" tabindex="0" ${attr} title="Bild hierher ziehen oder anklicken und Strg+V drücken">Oder Bild hierher ziehen / anklicken und <b>Strg+V</b> drücken</div>`;

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
      m.busy = ''; render(); return { dir, base, docx: dir + '/' + base + '.docx', pdf: dir + '/' + base + '.pdf' };
    } catch (e) { toast('Fehler: ' + (e.message || e)); m.busy = ''; render(); return null; }
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

  /* ---------- Test erstellen aus ausgewählten Quellen (ohne KI) ---------- */
  const pickText = (full) => { const sents = sentences(full); if (!sents.length) return ''; const keys = keyWords(full, 14).map((k) => k.toLowerCase()), sc = sents.map((s, i) => ({ s, i, v: keys.reduce((a, k) => a + (s.toLowerCase().includes(k) ? 1 : 0), 0) })); return sc.sort((a, b) => b.v - a.v || a.i - b.i).slice(0, 16).sort((a, b) => a.i - b.i).map((x) => x.s).join(' ').slice(0, 2600); };
  /* ---------- Test mit KI erstellen (braucht ANTHROPIC_API_KEY auf dem Server) ---------- */
  async function makeTestAi(ids, o) {
    const mats = []; let total = 0;
    for (const id of ids) { const s = srcOf(id); if (!s) continue; const t = await textOf(id), full = (t.pages || []).map((p) => p.t).join(' ').replace(/\s+/g, ' ').trim(); if (!full) continue; const cut = full.length > 9000 ? pickText(full) + ' ' + full.slice(0, 5000) : full; mats.push({ ref: s.vtitle || s.title, t: cut.slice(0, 9500) }); total += cut.length; if (total > 30000) break; }
    if (!mats.length) throw new Error('In den gewählten Materialien wurde kein lesbarer Text gefunden (Bilder oder Scans haben keinen Text).');
    const n = o.n || 10, pts = +o.max > 0 ? +o.max : 40;
    const prompt = `Du bist Lehrkraft für Geschichte (Oberstufe, österreichische AHS) und erstellst einen schriftlichen Test. Verwende ausschließlich den Stoff aus den folgenden Unterrichtsmaterialien, erfinde nichts dazu. Der Test heißt "${o.title || 'Test'}" und hat insgesamt ${pts} Punkte. Erstelle ${n} abwechslungsreiche Aufgaben (Mix aus "mc" = Multiple-Choice mit 4 Optionen und genau einer richtigen, "richtigfalsch" = Aussage mit Begründung, "luecke" = Lückensatz, "offen" = offene Frage mit Erwartungshorizont). Verteile die Punkte so, dass sie genau ${pts} ergeben. Schreibe Deutsch (Österreich).\n\nAntworte als JSON in dieser Form:\n{"titel":"...","aufgaben":[{"typ":"mc|richtigfalsch|luecke|offen","frage":"...","optionen":["...","...","...","..."],"loesung":"...","punkte":4}]}\n"optionen" nur bei "mc". Bei "mc" steht in "loesung" der Buchstabe und die richtige Antwort.\n\nUNTERRICHTSMATERIALIEN:\n` + mats.map((x, i) => '[' + (i + 1) + '] ' + x.ref + ':\n' + x.t).join('\n\n');
    const r = await fetch('/api/ai', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, max_tokens: 7000 }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Die KI hat nicht geantwortet (' + r.status + ')');
    const res = j.result, tasks = res && Array.isArray(res.aufgaben) ? res.aufgaben : []; if (!tasks.length) throw new Error('Die KI hat keine Aufgaben geliefert. Bitte noch einmal versuchen.');
    const title = o.title || res.titel || 'Test', b = head(title).concat([{ t: 'p', x: 'Maximale Punkte: ' + pts + '      Erreichte Punkte: ______      Note: ______' }, { t: 'sp' }]), sol = [{ t: 'h2', x: 'Lösungen und Erwartungshorizont' }];
    tasks.forEach((a, i) => {
      const k = i + 1, p = +a.punkte ? ' (' + a.punkte + (+a.punkte === 1 ? ' Punkt)' : ' Punkte)') : '';
      b.push({ t: 'h2', x: 'Aufgabe ' + k + p }, { t: 'p', x: String(a.frage || '') });
      if (a.typ === 'mc' && Array.isArray(a.optionen)) a.optionen.forEach((op, j) => b.push({ t: 'li', x: 'ABCD'[j] + ')  ' + String(op).replace(/^[A-D][).]\s*/, '') }));
      else if (a.typ === 'richtigfalsch') b.push({ t: 'p', x: '☐ richtig     ☐ falsch      Begründung: ________________________________' }, { t: 'p', x: '________________________________________________________________' });
      else if (a.typ === 'luecke') b.push({ t: 'p', x: '________________________________________________________________' });
      else b.push({ t: 'p', x: '________________________________________________________________' }, { t: 'p', x: '________________________________________________________________' }, { t: 'p', x: '________________________________________________________________' });
      b.push({ t: 'sp' }); sol.push({ t: 'li', x: 'Aufgabe ' + k + ': ' + String(a.loesung || '–') });
    });
    b.push({ t: 'small', x: 'Quellen: ' + mats.map((x) => x.ref).join('; ') }, { t: 'pb' }, { t: 'h2', x: 'Lösung' }, ...sol);
    return await deliver('Test KI', title, b);
  }

  async function makeTest(ids, o) {
    if (o.ai) return makeTestAi(ids, o);
    const m = M(), keep = m.sel, parts = o.parts || { gaps: true, terms: true, questions: true, cross: false };
    try {
      const sel = []; for (const id of ids) { const s = srcOf(id); if (!s) continue; const t = await textOf(id), full = (t.pages || []).map((p) => p.t).join(' '), pk = pickText(full); if (pk) sel.push({ ref: s.vtitle || s.title, t: pk }); }
      if (!sel.length) throw new Error('In den gewählten Materialien wurde kein lesbarer Text gefunden (Bilder oder Scans haben keinen Text).');
      m.sel = sel; const title = o.title || 'Test', txt = allText(), keys = keyWords(txt, 8), b = head(title).concat([{ t: 'p', x: 'Maximale Punkte: ' + (o.max ? o.max : '______') + '      Erreichte Punkte: ______      Note: ______' }, { t: 'sp' }]);
      let n = 0; const sol = [];
      if (parts.gaps) { const g = gapText(); if (g.words.length) { n++; const words = g.words.slice().sort((a, c) => a.localeCompare(c, 'de')); b.push({ t: 'h2', x: 'Aufgabe ' + n + ': Lückentext' }, { t: 'p', x: 'Setze die fehlenden Wörter ein.' }, { t: 'p', x: 'Wörter: ' + words.join('  ·  ') }); for (let i = 0; i < g.text.length; i += 4) b.push({ t: 'p', x: g.text.slice(i, i + 4).join(' ') }); b.push({ t: 'sp' }); sol.push({ t: 'h2', x: 'Aufgabe ' + n + ': Lückentext' }, { t: 'p', x: g.words.map((w, i) => (i + 1) + '. ' + w).join('    ') }); } }
      if (parts.terms && keys.length) { n++; b.push({ t: 'h2', x: 'Aufgabe ' + n + ': Begriffe erklären' }, { t: 'p', x: 'Erkläre die folgenden Begriffe in ein bis zwei Sätzen.' }); keys.slice(0, 6).forEach((k) => b.push({ t: 'li', x: k + ':  ________________________________________________' })); b.push({ t: 'sp' }); sol.push({ t: 'h2', x: 'Aufgabe ' + n + ': Begriffe' }); const ss = sentences(txt); keys.slice(0, 6).forEach((k) => { const f = ss.find((s) => s.toLowerCase().includes(k.toLowerCase())); sol.push({ t: 'li', x: k + ': ' + (f || '–') }); }); }
      if (parts.questions && keys.length) { n++; b.push({ t: 'h2', x: 'Aufgabe ' + n + ': Fragen zum Stoff' }); const q = keys.slice(0, 4); q.forEach((k) => { b.push({ t: 'li', x: 'Was weißt du über „' + k + '“? Nenne mindestens zwei Fakten und erkläre den Zusammenhang.' }, { t: 'p', x: '________________________________________________________________' }, { t: 'p', x: '________________________________________________________________' }); }); b.push({ t: 'sp' }); sol.push({ t: 'h2', x: 'Aufgabe ' + n + ': Erwartungshorizont' }); const ss = sentences(txt); q.forEach((k) => { const f = ss.filter((s) => s.toLowerCase().includes(k.toLowerCase())).slice(0, 2); sol.push({ t: 'li', x: k + ': ' + (f.join(' ') || '–') }); }); }
      if (parts.cross) { const c = crossword(14); if (c) { n++; b.push({ t: 'h2', x: 'Aufgabe ' + n + ': Kreuzworträtsel' }, { t: 'grid', cells: c.cells, sol: false }, { t: 'h2', x: 'Waagrecht' }); c.across.forEach((a) => b.push({ t: 'li', x: a.n + ': ' + a.clue })); b.push({ t: 'h2', x: 'Senkrecht' }); c.down.forEach((a) => b.push({ t: 'li', x: a.n + ': ' + a.clue })); sol.push({ t: 'h2', x: 'Aufgabe ' + n + ': Kreuzworträtsel' }, { t: 'grid', cells: c.cells, sol: true }); } }
      if (!n) throw new Error('Aus dem Text lassen sich keine Aufgaben erzeugen. Wähle mehr oder andere Materialien.');
      b.push(...refs(), { t: 'pb' }, { t: 'h2', x: 'Lösung' }, ...sol);
      return await deliver('Test', title, b);
    } finally { m.sel = keep; }
  }

  /* ---------- Alles-in-einem-Feld: erkennen, Angaben prüfen, dann „Anlegen“ ---------- */
  const newSrc = (title, type, extra) => { const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5); put('settings', Object.assign({ id: 'mat_' + id, title, type, url: '', added: Date.now(), pages: 0 }, extra || {})); return id; };
  const base = (n) => n.replace(/\.[^.]+$/, '');
  const extOf = (n) => ((String(n).match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
  const KLABEL = { ppt: 'PowerPoint', pdf: 'PDF', epub: 'EPUB', yt: 'YouTube-Video', video: 'Video-Datei', bild: 'Screenshots', text: 'Text / Word', link: 'Internetadresse', datei: 'Datei' };
  const PPTEXT = ['pptx', 'ppt', 'pps', 'ppsx', 'odp', 'pptm'];
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
  /* erste Folie als Bild: bevorzugt die in der Datei gespeicherte Vorschau, sonst vereinfachte Darstellung (Hintergrund, Bilder, Formen, Texte) */
  async function slide1Image(z, first) {
    try {
      const P = new DOMParser(), rd = async (n) => { const f = z.file(n); return f ? f.async('string') : null; };
      const pres = (await rd('ppt/presentation.xml')) || ''; let W = 9144000, H = 5143500; const mm = pres.match(/<p:sldSz[^>]*?cx="(\d+)"[^>]*?cy="(\d+)"/); if (mm) { W = +mm[1]; H = +mm[2]; }
      const sx = await rd(first); if (!sx) return null; const doc = P.parseFromString(sx, 'application/xml'), cv = document.createElement('canvas'), SC = 960 / W; cv.width = 960; cv.height = Math.round(H * SC);
      const ctx = cv.getContext('2d'), rels = {}, relP = first.replace('slides/', 'slides/_rels/') + '.rels', rx = (await rd(relP)) || '';
      [...rx.matchAll(/<Relationship[^>]*?Id="([^"]+)"[^>]*?Target="([^"]+)"/g)].forEach((m) => { rels[m[1]] = m[2]; }); [...rx.matchAll(/<Relationship[^>]*?Target="([^"]+)"[^>]*?Id="([^"]+)"/g)].forEach((m) => { rels[m[2]] = m[1]; });
      const lay = Object.values(rels).find((t) => /slideLayouts\//.test(t)), layX = lay ? await rd('ppt/slideLayouts/' + lay.split('/').pop()) : '', layDoc = layX ? P.parseFromString(layX, 'application/xml') : null;
      const bgOf = (x) => { const m = x && x.match(/<p:bg>[\s\S]*?<a:srgbClr val="([0-9A-Fa-f]{6})"/); return m ? '#' + m[1] : null; };
      const masterX = (await rd('ppt/slideMasters/slideMaster1.xml')) || '', bg = bgOf(sx) || bgOf(layX) || bgOf(masterX) || '#ffffff';
      ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
      const lum = (h) => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; }, dark = lum(bg) < 0.5;
      const xf = (el) => { const x = el.getElementsByTagNameNS('*', 'xfrm')[0]; if (!x) return null; const o = x.getElementsByTagNameNS('*', 'off')[0], e = x.getElementsByTagNameNS('*', 'ext')[0]; return o && e ? { x: +o.getAttribute('x'), y: +o.getAttribute('y'), w: +e.getAttribute('cx'), h: +e.getAttribute('cy') } : null; };
      const phX = (sp) => { const ph = sp.getElementsByTagNameNS('*', 'ph')[0]; if (!ph || !layDoc) return null; const ty = ph.getAttribute('type'), ix = ph.getAttribute('idx'); const c = [...layDoc.getElementsByTagNameNS('*', 'sp')].find((l) => { const p2 = l.getElementsByTagNameNS('*', 'ph')[0]; return p2 && ((ix && p2.getAttribute('idx') === ix) || (!ix && p2.getAttribute('type') === ty)); }); return c ? xf(c) : null; };
      const tree = doc.getElementsByTagNameNS('*', 'spTree')[0]; let drew = false;
      for (const el of tree ? [...tree.children] : []) {
        const ln = el.localName;
        if (ln === 'pic') {
          const bl = el.getElementsByTagNameNS('*', 'blip')[0], id = bl && (bl.getAttribute('r:embed') || bl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')), t = id && rels[id], b = xf(el); if (!t || !b) continue;
          const fp = 'ppt/media/' + t.split('/').pop(), fl = z.file(fp); if (!fl) continue;
          try { const bmp = await createImageBitmap(await fl.async('blob')); ctx.drawImage(bmp, b.x * SC, b.y * SC, b.w * SC, b.h * SC); drew = true; } catch (e) { /* Format nicht darstellbar */ }
        } else if (ln === 'sp') {
          const b = xf(el) || phX(el) || { x: W * 0.06, y: H * 0.06, w: W * 0.88, h: H * 0.88 };
          const fillM = el.getElementsByTagNameNS('*', 'spPr')[0] && el.getElementsByTagNameNS('*', 'spPr')[0].innerHTML ? el.getElementsByTagNameNS('*', 'spPr')[0].innerHTML.match(/<a:solidFill>\s*<a:srgbClr val="([0-9A-Fa-f]{6})"/) : null;
          if (fillM) { ctx.fillStyle = '#' + fillM[1]; ctx.fillRect(b.x * SC, b.y * SC, b.w * SC, b.h * SC); drew = true; }
          const paras = [...el.getElementsByTagNameNS('*', 'p')].map((p) => ({ t: [...p.getElementsByTagNameNS('*', 't')].map((x) => x.textContent).join(''), r: p.getElementsByTagNameNS('*', 'rPr')[0] || p.getElementsByTagNameNS('*', 'endParaRPr')[0] })).filter((p) => p.t.trim());
          if (!paras.length) continue;
          const ph = el.getElementsByTagNameNS('*', 'ph')[0], isTitle = ph && /title/i.test(ph.getAttribute('type') || ''); let y = b.y * SC + 6;
          for (const p of paras) {
            const sz = p.r && p.r.getAttribute('sz') ? +p.r.getAttribute('sz') / 100 : isTitle ? 40 : 20, px = Math.max(9, sz * 12700 * SC), cm = p.r && p.r.innerHTML.match(/<a:srgbClr val="([0-9A-Fa-f]{6})"/);
            ctx.font = `${p.r && p.r.getAttribute('b') === '1' || isTitle ? 'bold ' : ''}${px}px sans-serif`; ctx.fillStyle = cm ? '#' + cm[1] : fillM ? (lum('#' + fillM[1]) < 0.5 ? '#fff' : '#222') : dark ? '#fff' : '#222'; ctx.textBaseline = 'top';
            const maxW = b.w * SC - 12; let line = '';
            for (const w of p.t.split(/\s+/)) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { if (y + px > (b.y + b.h) * SC) break; ctx.fillText(line, b.x * SC + 6, y); y += px * 1.2; line = w; } else line = t; }
            if (line && y + px <= (b.y + b.h) * SC + px) { ctx.fillText(line, b.x * SC + 6, y); y += px * 1.5; drew = true; }
          }
        }
      }
      if (!drew) return null;
      return await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));
    } catch (e) { return null; }
  }
  async function readPptx(d, f) {
    const Z = await loadZip(); let z; try { z = await Z.loadAsync(await f.arrayBuffer()); } catch (e) { z = null; }
    d.meta = [['Dateigröße', mb(f.size)]];
    const slides = z ? Object.keys(z.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0])) : [];
    if (!slides.length) { d.warn = 'Den Text dieser Präsentation kann ich nicht lesen (nur .pptx wird ausgelesen). Sie wird als Datei abgelegt, ist aber nicht durchsuchbar.'; return; }
    const txt = (x) => x.replace(/<\/a:p>/g, ' ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/\s+/g, ' ').trim();
    for (let i = 0; i < slides.length; i++) {
      const n = parseInt(slides[i].match(/\d+/)[0]), t = txt(await z.file(slides[i]).async('string')), nf = z.file('ppt/notesSlides/notesSlide' + n + '.xml'), nt = nf ? txt(await nf.async('string')) : '';
      d.pages.push({ p: i + 1, t: (t || '(ohne Text)') + (nt && nt !== String(n) ? ' Notizen: ' + nt : ''), h: 'Folie ' + (i + 1) });
    }
    const core = z.file('docProps/core.xml'); if (core) { const c = await core.async('string'), t = (c.match(/<dc:title>([^<]*)<\/dc:title>/) || [])[1], a = (c.match(/<dc:creator>([^<]*)<\/dc:creator>/) || [])[1]; if (t && t.trim()) d.f.title = t.trim(); if (a) d.f.author = a.trim(); }
    d.meta = [['Folien', String(slides.length)], ['Dateigröße', mb(f.size)], ['Datei', f.name]];
    const th = z.file('docProps/thumbnail.jpeg') || z.file('docProps/thumbnail.jpg') || z.file('docProps/thumbnail.png'); if (th) d.thumbBlob = await th.async('blob'); else { const b1 = await slide1Image(z, slides[0]); if (b1) d.thumbBlob = b1; }
    d.thumbSrc = 'Erste Folie';
  }
  async function readDraft(d) {
    const f = d.file;
    try {
      if (d.kind === 'pdf') await readPdf(d, f);
      else if (d.kind === 'epub') await readEpub(d, f);
      else if (d.kind === 'ppt') await readPptx(d, f);
      else if (d.kind === 'video') { const v = await videoMeta(f); d.seconds = v.seconds; d.f.dur = durIn(v.seconds); d.thumbBlob = v.thumb; d.meta = [['Dauer', v.seconds != null ? dur(v.seconds) : 'unbekannt'], ['Dateigröße', mb(f.size)], ['Datei', f.name]]; }
      else if (d.kind === 'bild') {
        const Tess = await loadOcr(); d.thumbBlob = d.files[0];
        for (let i = 0; i < d.files.length; i++) { d.prog = 'Texterkennung Bild ' + (i + 1) + ' von ' + d.files.length; render(); const r = await Tess.recognize(d.files[i], 'deu'); d.pages.push({ p: i + 1, t: (r.data.text || '').replace(/-\n/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim() }); }
        d.meta = [['Bilder', String(d.files.length)], ['Zeichen', String(textOfDraft(d).length)]];
      } else if (d.kind === 'text') {
        const ext = extOf(f.name); let raw = ext === 'docx' ? await docxText(f) : await f.text(); if (/^html?$/.test(ext)) raw = new DOMParser().parseFromString(raw, 'text/html').body.textContent;
        d.pages.push({ p: 1, t: raw.replace(/\u0000/g, '').replace(/\s+/g, ' ').trim() }); d.meta = [['Wörter', String(d.pages[0].t.split(' ').length)], ['Dateigröße', mb(f.size)], ['Datei', f.name]];
      } else if (d.kind === 'datei') { d.mode = 'file'; d.meta = [['Dateigröße', mb(f.size)], ['Datei', f.name]]; d.warn = 'Dieses Format kenne ich nicht. Es wird als Datei abgelegt (nicht durchsuchbar), oder du wählst „Als Text lesen“.'; }
      else if (d.kind === 'yt') {
        const i = await ytFetch(d.u); Object.assign(d.f, { title: i.title || d.u, channel: i.channel || '', channelUrl: i.channelUrl || '', url: i.url }); d.desc = i.description || ''; d.seconds = i.seconds; d.f.dur = durIn(i.seconds); d.dl = true; d.vid = ytVid(i.url);
        d.meta = [['Dauer', i.seconds != null ? dur(i.seconds) : 'unbekannt']];
      } else if (d.kind === 'link') { let t = d.u; try { const x = new URL(d.u); t = x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? x.pathname.slice(0, 40) : ''); } catch (e) { /* */ } d.f.title = t; d.f.url = d.u; }
      if (d.thumbBlob && !d.thumbUrl) d.thumbUrl = URL.createObjectURL(d.thumbBlob); if (d.cover && !d.thumbUrl) d.thumbUrl = URL.createObjectURL(d.cover.blob);
      propose(d); d.status = 'ready';
    } catch (e) { d.status = 'error'; d.err = (e.message || String(e)) + (d.kind === 'yt' && /server\.js/.test(String(e.message)) ? '' : ''); }
  }
  /* Doppelte vermeiden: gleiche Datei (Name + Größe), gleicher Link, gleicher Inhalt */
  const fnv = (t) => { let h = 2166136261; t = String(t); for (let i = 0; i < Math.min(t.length, 30000); i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + t.length; };
  const normU = (u) => String(u || '').trim().replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
  const textHash = (d) => { const t = textOfDraft(d); return t.length > 40 ? fnv(t) : ''; };
  function dupOfFile(f) { const m = M(); const a = sources().find((s) => s.fileName === f.name && s.size === f.size); if (a) return { id: a.id.replace(/^mat_/, ''), title: a.vtitle || a.title }; const d = m.drafts.find((x) => x.file && x.name === f.name && x.file.size === f.size); return d ? { draft: d.id, title: d.f.title || d.name } : null; }
  function dupOfUrl(u) { const m = M(), vid = ytVid(u), n = normU(u); const a = sources().find((s) => s.url && (vid ? ytVid(s.url) === vid : normU(s.url) === n)); if (a) return { id: a.id.replace(/^mat_/, ''), title: a.vtitle || a.title }; const d = m.drafts.find((x) => (x.u || (x.f && x.f.url)) && (vid ? ytVid(x.u || x.f.url) === vid : normU(x.u || x.f.url) === n)); return d ? { draft: d.id, title: d.f.title || d.u } : null; }
  function dupOfHash(h, self) { if (!h) return null; const a = sources().find((s) => s.hash === h); if (a) return { id: a.id.replace(/^mat_/, ''), title: a.vtitle || a.title }; const d = M().drafts.find((x) => x !== self && x.hash === h && x.status === 'ready'); return d ? { draft: d.id, title: d.f.title || d.name } : null; }
  function flash(dup) { const m = M(); if (dup.id) { m.flash = dup.id; setTimeout(() => { if (U.mat && U.mat.flash === dup.id) { U.mat.flash = null; render(); } }, 3000); } render(); setTimeout(() => { const el = document.querySelector('.matflash, .matdraft[data-d="' + (dup.draft || '') + '"]'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60); }
  async function removeSource(id) {
    const s = srcOf(id); if (!s) return;
    const dels = [QDIR + '/' + id + '.json', s.file, s.epub, s.thumb && s.thumb.file, s.dl && s.dl.file].filter(Boolean);
    for (const p of dels) { try { await fdel(p); } catch (x) { /* */ } }
    delete T[id]; del('settings', 'mat_' + id);
  }
  /* bereits vorhandene Duplikate automatisch löschen (die ältere Quelle bleibt) */
  async function dedupe() {
    const m = M(); if (m.dedupBusy) return; const list = sources().slice().sort((a, b) => (a.added || 0) - (b.added || 0) || String(a.id).localeCompare(String(b.id))); if (list.length < 2) return;
    m.dedupBusy = true; const seen = new Map(), drop = [];
    for (const s of list) {
      const keys = []; if (s.fileName && s.size) keys.push('f:' + s.fileName + '|' + s.size); if (s.url) keys.push('u:' + (ytVid(s.url) || normU(s.url))); if (s.hash) keys.push('h:' + s.hash);
      const hit = keys.map((k) => seen.get(k)).find(Boolean);
      if (hit) { drop.push({ s, keep: hit }); continue; }
      keys.forEach((k) => seen.set(k, s));
    }
    try { for (const d of drop) await removeSource(d.s.id.replace(/^mat_/, '')); } catch (e) { /* */ }
    m.dedupBusy = false;
    if (drop.length) { toast(drop.length === 1 ? 'Ein Duplikat („' + (drop[0].s.vtitle || drop[0].s.title) + '“) wurde automatisch gelöscht.' : drop.length + ' Duplikate wurden automatisch gelöscht.'); render(); }
  }
  async function intake(files, text, att, ao) {
    const m = M(); note(); const imgs = [];
    const push = (d) => { d.attach = att === undefined ? m.attach || null : att; if (ao) d.f.ao = ao; m.drafts.push(d); return d; };
    const todo = [];
    const skipped = [];
    for (const f of files || []) {
      const ext = extOf(f.name || ''), t = f.type || '';
      if (!(IMGEXT.includes(ext) || /^image\//.test(t))) { const dp = dupOfFile(f); if (dp) { skipped.push(dp); continue; } }
      if (ext === 'pdf' || t === 'application/pdf') todo.push(push(mkDraft('pdf', f.name, { file: f })));
      else if (ext === 'epub') todo.push(push(mkDraft('epub', f.name, { file: f })));
      else if (PPTEXT.includes(ext)) todo.push(push(mkDraft('ppt', f.name, { file: f })));
      else if (VIDEXT.includes(ext) || /^video\//.test(t)) todo.push(push(mkDraft('video', f.name, { file: f })));
      else if (IMGEXT.includes(ext) || /^image\//.test(t)) imgs.push(f);
      else if (['docx', 'txt', 'md', 'csv', 'html', 'htm'].includes(ext) || /^text\//.test(t)) todo.push(push(mkDraft('text', f.name, { file: f })));
      else todo.push(push(mkDraft('datei', f.name, { file: f })));
    }
    if (imgs.length) { const d = mkDraft('bild', 'Screenshots ' + today(), { file: imgs[0], files: imgs }); d.f.title = 'Screenshots ' + today(); todo.push(push(d)); }
    const tx = String(text || '').trim();
    if (tx) {
      const parts = tx.split(/\s+/), urls = parts.filter((x) => /^https?:\/\/\S+$/i.test(x));
      if (urls.length && urls.length === parts.length) urls.forEach((u) => { const dp = dupOfUrl(u); if (dp) skipped.push(dp); else todo.push(push(mkDraft(isYt(u) ? 'yt' : 'link', '', { u }))); });
      else if (dupOfHash(fnv(tx.replace(/\s+/g, ' ')))) { skipped.push(dupOfHash(fnv(tx.replace(/\s+/g, ' ')))); }
      else { const d = mkDraft('text', '', { file: null }); d.pages.push({ p: 1, t: tx.replace(/\s+/g, ' ') }); d.f.title = tx.replace(/\s+/g, ' ').slice(0, 50) + (tx.length > 50 ? ' …' : ''); d.meta = [['Wörter', String(parts.length)]]; propose(d); d.status = 'ready'; push(d); }
    }
    if (skipped.length) { toast(skipped.length === 1 ? '„' + skipped[0].title + '“ ist schon vorhanden und wird nicht doppelt angelegt.' : skipped.length + ' Dateien sind schon vorhanden und wurden nicht doppelt angelegt.'); flash(skipped[0]); } else render();
    for (const d of todo) {
      await readDraft(d);
      if (d.status === 'ready') { d.hash = textHash(d); const dp = dupOfHash(d.hash, d); if (dp) { M().drafts = M().drafts.filter((x) => x !== d); toast('Inhalt von „' + (d.f.title || d.name) + '“ ist schon als „' + dp.title + '“ vorhanden und wird nicht doppelt angelegt.'); flash(dp); continue; } }
      render();
    }
  }
  async function commit(d) {
    const m = M(); if (d.status !== 'ready') return; d.status = 'saving'; d.err = ''; render();
    try {
      const f = d.f, tagFix = { epoche: d.ep, tags: d.tg, keys: d.keys };
      const type = d.kind === 'pdf' ? 'pdf' : d.kind === 'epub' ? 'buch' : d.kind === 'yt' || d.kind === 'video' ? 'video' : 'sonst';
      const extra = { lock: true, hash: d.hash || textHash(d), tpos: d.tpos || null, cls: d.cls || {}, kind: d.art || artOf(d), auto: tagFix, author: f.author || '', publisher: f.publisher || '', lang: f.lang || '', year: f.year || '', fileName: d.name || '', size: d.file ? d.file.size : 0, ao: String(f.ao || '').trim() };
      if (d.attach) { extra.pending = true; extra.pfrom = { slug: d.attach.slug, lid: d.attach.lid, date: d.attach.date || '', label: d.attach.label || '' }; }
      if (d.kind === 'yt' || d.kind === 'video') { const ps = parseDur(f.dur); if (ps != null && !Number.isNaN(ps)) d.seconds = ps; else if (!String(f.dur || '').trim()) d.seconds = null; }
      let id;
      if (d.kind === 'yt') { id = newSrc(f.title, 'video', Object.assign(extra, { url: f.url, vtitle: f.title, channel: f.channel, channelUrl: f.channelUrl, seconds: d.seconds == null ? null : d.seconds, desc: d.desc || '' })); }
      else if (d.kind === 'link') id = newSrc(f.title, 'sonst', Object.assign(extra, { url: f.url }));
      else id = newSrc(f.title || d.name, type, extra);
      const setS = (o) => put('settings', Object.assign({}, srcOf(id), o));
      const saveSt = async () => { T[id] = { pages: d.pages }; await fput(QDIR + '/' + id + '.json', new Blob([JSON.stringify(T[id])], { type: 'application/json' })); setS({ pages: d.pages.length }); };
      if (d.kind === 'pdf') { const nm = QDIR + '/' + id + '-' + slugify(base(d.name)) + '.pdf'; await fput(nm, d.file); setS({ file: nm }); await saveSt(); }
      else if (d.kind === 'ppt') { const nm = QDIR + '/' + id + '-' + slugify(d.name); await fput(nm, d.file); setS({ file: nm }); if (d.pages.length) await saveSt(); }
      else if (d.kind === 'epub') { const nm = QDIR + '/' + id + '-' + slugify(base(d.name)) + '.epub'; await fput(nm, d.file); setS({ epub: nm }); await saveSt(); }
      else if (d.kind === 'video') { const nm = 'Material/Videos/' + id + '.' + (extOf(d.name) || 'mp4'); await fput(nm, d.file); setS({ seconds: d.seconds == null ? null : d.seconds, dl: { state: 'done', file: nm, size: d.file.size } }); }
      else if (d.kind === 'bild') { for (let i = 0; i < d.files.length; i++) await fput(QDIR + '/' + id + '-s' + (i + 1) + '.png', d.files[i]); await saveSt(); }
      else if (d.kind === 'text') { await saveSt(); if (d.file && extOf(d.name) === 'docx') { const nm = QDIR + '/' + id + '-' + slugify(d.name); await fput(nm, d.file); setS({ file: nm, needPdf: !!extra.ao }); } }
      else if (d.kind === 'datei') {
        const nm = QDIR + '/' + id + '-' + slugify(d.name); await fput(nm, d.file); setS({ file: nm });
        if (d.mode === 'text') { const raw = (await d.file.text()).replace(/\u0000/g, '').replace(/\s+/g, ' ').trim(); if (raw.length >= 20) { d.pages = [{ p: 1, t: raw }]; await saveSt(); } }
      }
      if (d.kind === 'yt') await saveSt();
      if (d.noThumb) setS({ noThumb: true });
      else if (d.thumbBlob) { const nm = QDIR + '/' + id + '-thumb.jpg'; await fput(nm, d.thumbBlob); setS({ thumb: { file: nm, src: d.thumbSrc || (d.kind === 'ppt' ? 'Präsentation' : d.kind === 'pdf' ? 'PDF, Seite 1' : d.kind === 'bild' ? 'Screenshot' : 'Video') } }); }
      else if (d.cover) { const nm = QDIR + '/' + id + '-thumb.' + d.cover.ext; await fput(nm, d.cover.blob); setS({ thumb: { file: nm, src: 'EPUB-Titelbild' } }); }
      if (d.kind === 'yt' && d.dl) startDownload(id);
      if (!d.noThumb && !d.thumbBlob && !d.cover && d.kind !== 'yt' && d.kind !== 'ppt') autoThumb(id, false);
      if (d.thumbUrl && d.thumbUrl.startsWith('blob:')) URL.revokeObjectURL(d.thumbUrl);
      m.drafts = m.drafts.filter((x) => x.id !== d.id); m.open = null; toast('Angelegt und auf der NAS gespeichert'); setTimeout(() => syncPdfs(false), 400); if (d.attach) document.dispatchEvent(new CustomEvent('matcreated', { detail: { id, attach: d.attach } }));
    } catch (e) { d.status = 'ready'; d.err = e.message || String(e); if (/Failed to fetch|NetworkError|Load failed/i.test(d.err)) d.err = 'Keine Verbindung zum Server auf der NAS (Container lehrerapp oder Tailscale läuft nicht, oder die Datei ist zu groß).'; note('err', 'Anlegen fehlgeschlagen: ' + d.err); }
    render();
  }
  const fld = (d, key, label, ph) => `<div class="kmkvr"><span class="kmk">${label}</span><span class="kmv"><input class="matin" id="dr-${d.id}-${key}" data-ch="mdf" data-d="${d.id}" data-k="${key}" value="${esc(d.f[key] || '')}" placeholder="${esc(ph || '')}" autocomplete="off"></span></div>`;
  const ro = (label, val, link) => `<div class="kmkvr"><span class="kmk">${label}</span><span class="kmv">${link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(val)}</a>` : esc(val)}</span></div>`;
  const epChips = (list, cur, act, did) => list.map((x) => `<button class="mattag ep sel${cur.includes(x) ? ' on' : ''}"${epS(x)} data-act="${act}" data-d="${did}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  const tgChips = (list, cur, act, did) => list.map((x) => `<button class="mattag sel${cur.includes(x) ? ' on' : ''}" data-act="${act}" data-d="${did}" data-v="${esc(x)}">${esc(x)}</button>`).join('');
  const DEFGROUPS = [{ id: 'dok', name: 'Dokument', multi: false, items: ['Arbeitsblatt', 'Lösung'] }, { id: 'form', name: 'Aufgabenform', multi: true, items: ['Lückentext', 'Kreuzworträtsel', 'Offene Antworten'] }];
  const cfgM = () => S.settings.matcfg || {};
  const groups = () => (cfgM().groups && cfgM().groups.length ? cfgM().groups : DEFGROUPS);
  const saveGroups = (g) => put('settings', Object.assign({}, cfgM(), { id: 'matcfg', groups: g }));
  const clsAll = (s) => Object.values(s.cls || {}).flat();
  function clsRows(cur, act, attr) {
    cur = cur || {};
    return groups().map((g) => `<div class="kmkvr"><span class="kmk">${esc(g.name)}${g.custom ? `<button class="matgx matgrpx" data-act="matgrpdel" data-g="${g.id}" title="Einteilung löschen" aria-label="Einteilung löschen">×</button>` : ''}</span><span class="kmv chips">${g.items.map((x) => `<span class="mattag sel matgi${(cur[g.id] || []).includes(x) ? ' on' : ''}" draggable="true" data-g="${g.id}" data-v="${esc(x)}" title="Ziehen zum Verschieben"><button class="matgl" data-act="${act}" ${attr} data-g="${g.id}" data-v="${esc(x)}">${esc(x)}</button><button class="matgx" data-act="matgdel" data-g="${g.id}" data-v="${esc(x)}" title="Aus der Auswahl entfernen" aria-label="Entfernen">×</button></span>`).join('')}<input class="matin" data-ch="matgnew" data-g="${g.id}" placeholder="+ neu" style="width:90px"></span></div>`).join('') + `<div class="kmkvr"><span class="kmk"></span><span class="kmv"><button class="btn sm" data-act="matgrpadd">+ Neue Einteilung</button></span></div>`;
  }
  const clsToggle = (cur, gid, v) => { const g = groups().find((x) => x.id === gid), a = (cur || {})[gid] || []; const n = Object.assign({}, cur || {}); n[gid] = g && g.multi ? (a.includes(v) ? a.filter((x) => x !== v) : a.concat(v)) : (a.includes(v) ? [] : [v]); return n; };
  const artOf = (d) => ({ ppt: 'ppt', pdf: 'pdf', epub: 'epub', video: 'video', yt: 'video', bild: 'bild', text: 'text', link: 'link', datei: 'text' }[d.kind] || 'text');
  function draftCard(d) {
    const k = d.kind, did = d.id, head = `<h2>${KLABEL[k]}${d.name ? ' · ' + esc(d.name) : ''}</h2>`;
    if (d.status === 'reading') return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}<div class="row" style="align-items:center;gap:10px"><span class="muted">⏳ wird gelesen${d.prog ? ' … ' + esc(d.prog) : ' …'}</span><span style="flex:1"></span><button class="btn sm" data-act="mddel" data-d="${did}">Abbrechen</button></div></section>`;
    if (d.status === 'error') return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}<div class="matnote err" style="margin:0 0 10px"><span>Konnte nicht gelesen werden: ${esc(d.err)}</span></div><button class="btn sm" data-act="mddel" data-d="${did}">Entfernen</button></section>`;
    const ths = d.thumbBlob && d.thumbUrl ? d.thumbUrl : d.vid ? `https://i.ytimg.com/vi/${d.vid}/hqdefault.jpg` : d.thumbUrl;
    const rows = [fld(d, 'title', 'Titel'), `<div class="kmkvr"><span class="kmk">Arbeitsauftrag</span><span class="kmv">${aoField(d.f.ao, `id="dr-${d.id}-ao" data-ch="mdf" data-d="${d.id}" data-k="ao"`)}</span></div>`];
    if (k === 'pdf' || k === 'ppt') rows.push(fld(d, 'author', 'Autor'));
    if (k === 'epub') rows.push(fld(d, 'author', 'Autor'), fld(d, 'publisher', 'Verlag'), fld(d, 'lang', 'Sprache'), fld(d, 'year', 'Jahr'));
    if (k === 'yt') rows.push(ro('Kanal', d.f.channel || '–', d.f.channelUrl), ro('Video', d.f.url, d.f.url));
    if (k === 'link') rows.push(ro('Adresse', d.f.url, d.f.url));
    if (k === 'yt' || k === 'video') rows.push(fld(d, 'dur', 'Länge', 'mm:ss oder h:mm:ss'));
    d.meta.forEach(([a, b]) => { if (a !== 'Datei' && !((k === 'yt' || k === 'video') && a === 'Dauer')) rows.push(ro(a, b)); });
    const allTg = TAGS.map((t) => t[0]).filter((x) => !EPOCHS.includes(x)), rest = allTg.filter((x) => !d.tg.includes(x));
    const hasPic = !!ths && !d.noThumb;
    return `<section class="card matdraft" tabindex="-1" data-d="${did}">${head}
      <div class="matdgrid">${true ? `<div>${hasPic ? `<div class="matdpic matpan${/^(buch|pdf|epub)$/.test(k) ? ' matportrait' : ''}" data-pand="${did}" title="Mit gedrückter Maustaste verschieben"><img src="${esc(ths)}" alt="" referrerpolicy="no-referrer" draggable="false"${posS(d.tpos)}></div><div class="muted" style="font-size:11px;margin-top:3px">Bild mit gedrückter Maustaste verschieben</div>` : `<div class="matdpic${/^(buch|pdf|epub)$/.test(k) ? ' matportrait' : ''} matnopic">${d.noThumb ? 'Vorschaubild gelöscht' : 'Kein Vorschaubild'}</div>`}<div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><button class="btn sm" data-act="mdnothumb" data-d="${did}">${d.noThumb ? 'Wieder verwenden' : 'Löschen'}</button><button class="btn sm" data-act="mdgoogle" data-d="${did}">Bild im Internet suchen</button><button class="btn sm" data-act="mdclip" data-d="${did}" title="Bild aus der Zwischenablage einfügen">Strg+V · einfügen</button></div>${pzHtml('data-pzd="' + did + '"')}</div>` : ''}<div>${rows.join('')}${k === 'yt' ? `<label class="matchk"><input type="checkbox" data-ch="mddl" data-d="${did}" ${d.dl ? 'checked' : ''}> Video zusätzlich auf die NAS herunterladen</label>` : ''}</div></div>
      ${d.warn ? `<div class="matnote warn"><span>${esc(d.warn)}</span></div>` : ''}
      ${k === 'datei' ? `<div class="kmkvr"><span class="kmk">Behandeln als</span><span class="kmv"><button class="mattag sel${d.mode === 'file' ? ' on' : ''}" data-act="mdmode" data-d="${did}" data-v="file">Datei ablegen</button><button class="mattag sel${d.mode === 'text' ? ' on' : ''}" data-act="mdmode" data-d="${did}" data-v="text">Als Text lesen</button></span></div>` : ''}
      <div class="kmkvr"><span class="kmk">Art</span><span class="kmv chips">${kindsOrdered().map(([kk, n]) => `<button class="mattag sel matkindchip${(d.art || artOf(d)) === kk ? ' on' : ''}" draggable="true" data-k="${kk}" title="Ziehen zum Verschieben" data-act="mdkind" data-d="${did}" data-v="${kk}">${n}</button>`).join('')}</span></div>
      ${clsRows(d.cls, 'mdcls', 'data-d="' + did + '"')}
      <div class="kmkvr"><span class="kmk">Epoche</span><span class="kmv chips">${epChips(EPOCHS, d.ep, 'mdep', did)}</span></div>
      <div class="kmkvr"><span class="kmk">Themen</span><span class="kmv chips">${tgChips(d.tg, d.tg, 'mdtg', did)}${tgChips(rest.slice(0, 6), d.tg, 'mdtg', did)}<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${tgChips(rest.slice(6), d.tg, 'mdtg', did)}</div></details><input class="matin" id="dr-${did}-new" data-ch="mdnew" data-d="${did}" placeholder="+ eigener Tag" style="width:130px"></span></div>
      <div class="kmkvr"><span class="kmk">Schlagwörter</span><span class="kmv chips">${d.keys.map((x) => `<span class="mattag ky">${esc(x)}<button data-act="mdrmkey" data-d="${did}" data-v="${esc(x)}" aria-label="Entfernen">×</button></span>`).join('')}<input class="matin" id="dr-${did}-newkey" data-ch="mdkey" data-d="${did}" placeholder="+ Schlagwort" style="width:140px"></span></div>
      ${d.err ? `<div class="matnote err"><span>${esc(d.err)}</span></div>` : ''}
      <div class="matfoot">${d.status === 'saving' ? '<span class="muted">⏳ wird auf die NAS geladen …</span>' : `<button class="btn" data-act="mddel" data-d="${did}">Verwerfen</button><button class="btn good" data-act="mdgo" data-d="${did}">Anlegen</button>`}</div></section>`;
  }
  const ICO = {
    ao: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 3h6v3H9zM9 10h6M9 14h6M9 18h3"/>',
    all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/>',
    pdf: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    epub: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19a2 2 0 012-2h13"/>',
    ppt: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/>',
    buch: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z"/><path d="M12 6v14"/>',
    text: '<path d="M4 6h16M4 10h16M4 14h10M4 18h8"/>',
    bild: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
  function view() {
    if (sources().some((x) => x.dl && (x.dl.state === 'running' || x.dl.state === 'queued'))) poll();
    const m = M(), list = sources(), f = filterOf();
    if (m.ddN !== list.length) { m.ddN = list.length; setTimeout(dedupe, 600); }
    const banner = `${m.busy ? `<div class="muted sm" style="margin-bottom:8px">⏳ ${esc(m.busy)}</div>` : ''}${m.note ? `<div class="matnote ${m.note.k}" role="status"><span>${esc(m.note.t)}${/server\.js|Unbekannte API|Verbindung|Keine Verbindung/.test(m.note.t) ? ' <a href="/diagnose.html" style="color:inherit;text-decoration:underline">Diagnose öffnen</a>' : ''}</span><button data-act="matnote0" aria-label="Schließen">×</button></div>` : ''}`;
    const kinds = kindsOrdered();
    const side = `<nav class="kmside" aria-label="Art"><div class="kmsidet">Art</div><button class="kmicon${!f.a ? ' on' : ''}" data-act="matfa" data-v="">${ico('all')}<small>Alle ${list.length}</small></button>${kinds.map(([k, n]) => `<button class="kmicon${f.a === k ? ' on' : ''}${list.some((x) => kindOf(x) === k) ? '' : ' zero'}" draggable="true" data-k="${k}" title="Ziehen zum Verschieben" data-act="matfa" data-v="${k}">${ico(k)}<small>${esc(n.split(' ')[0])} ${list.filter((x) => kindOf(x) === k).length}</small></button>`).join('')}<button class="kmicon${f.a === 'ao' ? ' on' : ''}${aoNames().length ? '' : ' zero'}" data-act="matfa" data-v="ao" title="Arbeitsaufträge: zusammengehörige Dateien">${ico('ao')}<small>Arbeitsaufträge ${aoNames().length}</small></button></nav>`;
    const artName = f.a === 'ao' ? 'Arbeitsaufträge' : (KINDS.find(([k]) => k === f.a) || [0, 'Alle Quellen'])[1];
    const head = `<div class="kmh"><h1>Material<span class="kmsep kmh1">I</span><span class="muted" style="font-weight:500">${esc(f.e || 'Alle Epochen')}${f.a ? ' · ' + esc(artName) : ''}</span></h1></div>`;
    return `<div class="km">${head}${banner}<div class="kmbody">${side}<section class="kmmain">${quellen()}</section></div></div>`;
  }
  function metaLine(s) {
    const a = [['Autor', s.author], ['Verlag', s.publisher], ['Sprache', s.lang], ['Jahr', s.year], ['Datei', s.fileName], ['Größe', s.size ? mb(s.size) : ''], ['Seiten', s.type === 'pdf' && s.pages ? s.pages : '']].filter((x) => x[1]);
    return a.length ? `<div class="sm" style="margin-top:8px">${a.map(([k, v]) => `<span class="muted">${k}:</span> ${esc(v)}`).join(' &nbsp;·&nbsp; ')}</div>` : '';
  }
  function videoBlock(s, id) {
    const d = s.dl || {}, yt = isYt(s.url), done = d.state === 'done' && d.file, busy = d.state === 'running' || d.state === 'queued';
    let h;
    if (yt) {
      h = `<label class="matchk" style="margin:0"><input type="checkbox" data-ch="matdlchk" data-id="${id}" ${done ? 'checked' : ''} ${busy ? 'disabled' : ''}> <b>Auf der NAS gespeichert</b></label>`
        + (busy ? `<div class="sm" style="margin-top:4px">⏳ ${esc(d.msg || (d.state === 'queued' ? 'Download wartet …' : 'Download läuft …'))}</div>`
          : done ? `<div class="sm muted" style="margin:4px 0 6px">${esc(mb(d.size || 0))} · <a href="${url(d.file)}" download>Herunterladen</a> · Haken entfernen löscht die Datei von der NAS</div><video controls preload="metadata" src="${url(d.file, '&inline=1')}" style="max-width:min(560px,100%);border-radius:10px;background:#000"></video>`
          : d.state === 'error' ? `<div class="sm" style="margin-top:4px;color:var(--bad)">Download nicht möglich: ${esc(d.msg || '')} <button class="btn sm" data-act="matdl" data-id="${id}">Erneut versuchen</button></div>`
          : '<div class="sm muted" style="margin-top:4px">Haken setzen, um das Video auf die NAS herunterzuladen.</div>');
    } else if (done) h = `<label class="matchk" style="margin:0"><input type="checkbox" checked disabled> <b>Auf der NAS gespeichert</b></label><div class="sm muted" style="margin-top:4px">${esc(mb(d.size || 0))} · <a href="${url(d.file)}" download>Herunterladen</a></div>`;
    else if (s.file && /\.(mp4|m4v|mov|webm|mkv|avi)$/i.test(s.file)) h = `<label class="matchk" style="margin:0"><input type="checkbox" checked disabled> <b>Auf der NAS gespeichert</b></label>`;
    else h = `<label class="matchk" style="margin:0;opacity:.6"><input type="checkbox" disabled> <b>Auf der NAS gespeichert</b></label><div class="sm muted" style="margin-top:4px">Das Herunterladen ist nur bei YouTube-Videos möglich.</div>`;
    return `<div style="margin-top:10px">${h}</div>`;
  }
  /* Vorschaubild-Bereich der Bearbeiten-Karte: Bild (verschiebbar), Angaben, Schaltflächen */
  function thumbBlock(s, id) {
    const th = s.thumb, has = !s.noThumb && (isYt(s.url) || th);
    const info = isYt(s.url) ? (has ? 'YouTube' : 'keines') : th && !s.noThumb ? esc(th.src || '') + (th.lic ? ` · ${esc(th.by || 'unbekannt')} · ${esc(th.lic)} · <a href="${esc(th.page || '#')}" target="_blank" rel="noopener">Quelle</a>` : '') : 'keines';
    const pt = /^(buch|pdf|epub)$/.test(kindOf(s)) ? ' matportrait' : '', pic = has ? `<div class="matpan matpanbig${pt}" data-pan="${id}" title="Mit gedrückter Maustaste verschieben">${thumbOf(s)}</div>` : `<div class="matpanbig${pt} matnopic">Kein Vorschaubild</div>`;
    return `<div class="matpicrow">${pic}<div class="matpicside"><div class="sm"><span class="muted">Vorschaubild:</span> ${info}</div>${has ? '<div class="muted" style="font-size:11px">Bild mit gedrückter Maustaste im Rahmen verschieben</div>' : ''}<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${has ? `<button class="btn sm bad" data-act="matthumbdel" data-id="${id}" title="Vorschaubild entfernen">Löschen</button>` : ''}${isYt(s.url) && s.noThumb ? `<button class="btn sm" data-act="matthumbdel" data-id="${id}" data-back="1">Wieder anzeigen</button>` : ''}<button class="btn sm" data-act="matgoogle" data-id="${id}" title="Google-Bildersuche in einem Fenster öffnen">Bild im Internet suchen</button><button class="btn sm" data-act="matclip" data-id="${id}" title="Bild aus der Zwischenablage einfügen">Strg+V · einfügen</button></div>${pzHtml('data-pz="' + id + '"')}</div></div>`;
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
  const KINDS = [['video', 'Video'], ['buch', 'Buch'], ['pdf', 'PDF'], ['epub', 'EPUB'], ['ppt', 'PowerPoint'], ['text', 'Text / Word'], ['bild', 'Screenshots'], ['link', 'Link']];
  const aoOf = (s) => String(s.ao || '').trim();
  const aoNames = () => [...new Set(sources().map(aoOf).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));
  const aoField = (val, attrs) => `<input class="matin" list="matao-dl" ${attrs} value="${esc(val || '')}" placeholder="Name, z. B. Römische Republik (Dateien mit gleichem Namen gehören zusammen)" autocomplete="off"><datalist id="matao-dl">${aoNames().map((n) => `<option value="${esc(n)}">`).join('')}</datalist>`;
  const kindsOrdered = () => { const sv = ((S.settings.matcfg || {}).order || []).filter((k) => KINDS.some((x) => x[0] === k)); return sv.map((k) => KINDS.find((x) => x[0] === k)).concat(KINDS.filter((x) => !sv.includes(x[0]))); };
  const kindOf = (s) => (s.kind && KINDS.some((k) => k[0] === s.kind) ? s.kind : isYt(s.url) || s.type === 'video' ? 'video' : s.epub ? 'epub' : /\.(pptx?|ppsx?|odp|pptm)$/i.test(s.file || '') ? 'ppt' : s.type === 'pdf' || /\.pdf$/i.test(s.file || '') ? 'pdf' : s.url && !s.pages ? 'link' : /^Screenshots /.test(s.title || '') ? 'bild' : 'text');
  const newF = () => ({ q: '', e: '', t: [], a: '' });
  function filterOf() { const m = M(); if (!m.f) m.f = newF(); if (m.f.a === undefined) m.f.a = ''; return m.f; }
  const matches = (s) => { const f = filterOf(), t = tagsOf(s); if (f.a === 'ao') { if (!aoOf(s)) return false; } else if (f.a && kindOf(s) !== f.a) return false; if (f.e && !t.epoche.includes(f.e)) return false; if (f.t.some((x) => !t.tags.includes(x) && !t.keys.includes(x))) return false; const q = norm(f.q).split(/\s+/).filter(Boolean); if (q.length) { const hay = norm([s.title, s.vtitle, s.channel, s.notes, s.author, ...clsAll(s), ...t.epoche, ...t.tags, ...t.keys].join(' ')); if (q.some((w) => !hay.includes(w))) return false; } return true; };
  function filterBar(list) {
    const f = filterOf(), eps = EPOCHS.filter((e) => list.some((s) => tagsOf(s).epoche.includes(e))), cnt = {}; list.forEach((s) => { const t = tagsOf(s); t.tags.concat(t.keys).forEach((x) => { cnt[x] = (cnt[x] || 0) + 1; }); });
    const tg = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b, 'de')).slice(0, 30);
    return `<div class="matfilter"><div class="row" style="gap:8px;align-items:center;flex-wrap:wrap"><span class="matinw" style="flex:1;min-width:200px"><input class="kminp" id="matfq" data-ch="matfq" value="${esc(f.q)}" placeholder="Bibliothek filtern: Titel, Kanal, Tag …" style="width:100%">${clearBtn('matfclr', !!f.q)}</span>${f.q || f.e || f.a || f.t.length ? '<button class="btn sm" data-act="matfx">Filter zurücksetzen</button>' : ''}</div>
      ${(() => { const ks = KINDS.filter(([k]) => list.some((s) => kindOf(s) === k)); return ks.length > 1 || f.a ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><span class="muted sm">Art:</span>${ks.map(([k, n]) => `<button class="mattag sel${f.a === k ? ' on' : ''}" data-act="matfa" data-v="${k}">${n}<small> ${list.filter((s) => kindOf(s) === k).length}</small></button>`).join('')}</div>` : ''; })()}
      ${eps.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><span class="muted sm">Epoche:</span>${eps.map((e) => `<button class="mattag ep sel${f.e === e ? ' on' : ''}"${epS(e)} data-act="matfe" data-v="${esc(e)}">${esc(e)}</button>`).join('')}</div>` : ''}
      ${tg.length ? `<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="muted sm">Tags:</span>${tg.map((x) => `<button class="mattag tg sel${f.t.includes(x) ? ' on' : ''}" data-act="matft" data-v="${esc(x)}">${esc(x)}<small> ${cnt[x]}</small></button>`).join('')}</div>` : ''}</div>`;
  }
  const posS = (p) => (p && (p.x != null) ? ` style="object-position:${p.x}% ${p.y}%"` : '');
  function thumbOf(s, big) {
    const vid = s.noThumb ? null : ytVid(s.url), th = s.noThumb ? null : s.thumb, k = kindOf(s);
    if (vid) return `<img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" draggable="false"${posS(s.tpos)}>`;
    if (th && (th.file || th.url)) return `<img src="${th.file ? url(th.file, '&inline=1' + (th.v ? '&v=' + th.v : '')) : esc(th.url)}" alt="" loading="lazy" referrerpolicy="no-referrer" draggable="false"${posS(s.tpos)}>${th.lic ? '<b class="matcc">CC</b>' : ''}`;
    return `<div class="matph t-${esc(s.type || 'sonst')}"><span>${big ? esc(TYPES[s.type] || 'Quelle') : esc(((KINDS.find(([x]) => x === k) || [0, ''])[1] || '').split(' ')[0].slice(0, 5))}</span></div>`;
  }
  const epTags = (s) => tagsOf(s).epoche.map((e) => `<span class="mattag ep on"${epS(e)}>${esc(e)}</span>`).join('') || '<span class="muted sm">–</span>';
  const umfang = (s) => (s.seconds != null ? dur(s.seconds).replace(/ (Min|Std)$/, '') + (/Std/.test(dur(s.seconds)) ? ' Std' : ' Min') : s.pages ? s.pages + (kindOf(s) === 'pdf' ? (s.pages === 1 ? ' Seite' : ' Seiten') : ' Abschn.') : '–');
  const dlPath = (s) => (s.file || s.epub || (s.dl && s.dl.state === 'done' && s.dl.file) || '');
  function editCard(s) {
    const id = s.id.replace(/^mat_/, ''), t = tagsOf(s), allTg = TAGS.map((x) => x[0]).filter((x) => !EPOCHS.includes(x)), restT = allTg.filter((x) => !t.tags.includes(x));
    const tog = (list, cur, ep) => list.map((x) => `<button class="mattag ${ep ? 'ep ' : ''}sel${cur.includes(x) ? ' on' : ''}"${ep ? epS(x) : ''} data-act="mattoggle" data-id="${id}" data-t="${esc(x)}">${esc(x)}</button>`).join('');
    const row = (k, v) => `<div class="kmkvr"><span class="kmk">${k}</span><span class="kmv">${v}</span></div>`;
    const edAV = /^(epub|buch|pdf)$/.test(kindOf(s)), avIn = (f, lab) => row(lab, `<input class="matin" data-ch="matmeta" data-f="${f}" data-id="${id}" value="${esc(s[f] || '')}" placeholder="${lab} eintragen">`), ang = (edAV ? avIn('author', 'Autor') + avIn('publisher', 'Verlag') : '') + [!edAV && ['Autor', s.author], !edAV && ['Verlag', s.publisher], ['Sprache', s.lang], ['Jahr', s.year], ['Datei', s.fileName], ['Größe', s.size ? mb(s.size) : ''], ['Seiten', s.type === 'pdf' && s.pages ? s.pages : '']].filter((x) => x && x[1]).map(([k, v]) => row(k, esc(v))).join('');
    const yt = isYt(s.url) ? row('Kanal', s.channelUrl ? `<a href="${esc(s.channelUrl)}" target="_blank" rel="noopener">${esc(s.channel || '')}</a>` : esc(s.channel || '–')) + row('Video', `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`) + row('Dauer', s.seconds != null ? esc(dur(s.seconds)) : '–') : s.url ? row('Adresse', `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`) : '';
    return `<section class="card" id="matdetail" style="margin-top:14px"><div class="row" style="align-items:center;gap:8px"><h2 style="margin:0">Bearbeiten</h2><span style="flex:1"></span><button class="btn sm good" data-act="matopen" data-id="${id}" title="Änderungen sind gespeichert, Fenster schließen">Speichern</button></div>
      ${thumbBlock(s, id)}
      ${row('Art', `<span class="chips">${kindsOrdered().map(([k, n]) => `<button class="mattag sel matkindchip${kindOf(s) === k ? ' on' : ''}" draggable="true" data-k="${k}" title="Ziehen zum Verschieben" data-act="matkind" data-id="${id}" data-v="${k}">${n}</button>`).join('')}</span>`)}
      ${clsRows(s.cls, 'matcls', 'data-id="' + id + '"')}
      ${row('Titel', `<input class="matin" data-ch="matttl" data-id="${id}" value="${esc(s.vtitle || s.title)}">`)}${kindOf(s) === 'video' ? row('Länge', `<input class="matin" data-ch="matdurin" data-id="${id}" value="${esc(durIn(s.seconds))}" placeholder="mm:ss oder h:mm:ss" style="width:160px"> <span class="muted sm">z. B. 12:34 oder 1:05:20</span>`) : ''}${yt.replace(/<div class="kmkvr"><span class="kmk">Dauer<\/span>[\s\S]*?<\/div>/, '')}${ang}
      ${kindOf(s) === 'video' ? `<div class="kmkvr"><span class="kmk">Video-Datei</span><span class="kmv">${videoBlock(s, id).replace('margin-top:10px', 'margin-top:0')}</span></div>` : ''}
      <div class="kmkvr"><span class="kmk">Epoche</span><span class="kmv chips">${tog(EPOCHS, t.epoche, true)}</span></div>
      <div class="kmkvr"><span class="kmk">Themen</span><span class="kmv chips">${tog(t.tags, t.tags)}${tog(restT.slice(0, 6), t.tags)}<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${tog(restT.slice(6), t.tags)}</div></details><input class="matin" data-ch="matatag" data-id="${id}" placeholder="+ eigener Tag" style="width:130px"></span></div>
      ${row('Schlagwörter', `<span class="chips">${t.keys.map((x) => `<span class="mattag ky">${esc(x)}<button data-act="matrmkey" data-id="${id}" data-t="${esc(x)}" aria-label="Entfernen">×</button></span>`).join('')}<input class="matin" data-ch="matakey" data-id="${id}" placeholder="+ Schlagwort" style="width:140px"></span>`)}
      ${row('Arbeitsauftrag', aoField(s.ao, `data-ch="matao" data-id="${id}"`))}
      ${row('Notiz', `<input class="matin" data-ch="matnote" data-id="${id}" value="${esc(s.notes || '')}" placeholder="Notiz zur Quelle">`)}
      <div class="matfoot"><button class="btn sm" data-act="matretag" data-id="${id}" title="Epoche, Themen und Schlagwörter aus Titel und Text neu bestimmen">Tags neu berechnen</button><button class="btn sm bad" data-act="matdel" data-id="${id}">Löschen</button></div></section>`;
  }
  function addParts() {
    const m = M();
    const zoneBare = `<div class="matdz" id="matdz" tabindex="0" role="button" aria-label="Dateien oder Links hineinziehen"><div class="matdzi">⬇</div><div><b>Alles hierher ziehen</b><div class="muted sm">PDF, EPUB, Video, YouTube-Link, Word, Textdatei, Screenshot oder Internetadresse. Darunter erscheinen die Angaben zum Prüfen. Klicken oder Strg+V geht auch.</div></div><input type="file" id="matdzf" multiple hidden></div>`;
    const zone = `<section class="card"><h2>Neue Quelle</h2>${zoneBare}</section>`;
    const ready = m.drafts.filter((x) => x.status === 'ready').length;
    const drafts = m.drafts.length ? `${ready > 1 ? `<div class="row" style="justify-content:flex-end;margin:12px 0 0"><button class="btn good" data-act="mdall">Alle ${ready} anlegen</button></div>` : ''}${m.drafts.map(draftCard).join('')}` : '';
    return { zone, zoneBare, drafts };
  }
  const adder = (att) => { M().attach = att || null; return addParts(); };
  function quellen() {
    const m = M(), list = sources(), f = filterOf(), shown = list.filter(matches), act = f.q || f.e || f.a || f.t.length;
    const { zone, drafts } = addParts(); m.attach = null;
    const pend = list.filter((x) => x.pending), pendCard = pend.length ? `<section class="card matpend"><div class="row" style="align-items:center;gap:10px;margin-bottom:8px"><h2 style="margin:0">Während der Stundenplanung hinzugefügt (${pend.length})</h2><span class="muted sm">Bitte prüfen und bestätigen</span><span style="flex:1"></span>${pend.length > 1 ? '<button class="btn sm good" data-act="matconfirmall">Alle bestätigen</button>' : ''}</div>${pend.map((x) => { const id = x.id.replace(/^mat_/, ''), pf = x.pfrom || {}; return `<div class="kmli matpendr"><span class="matth2">${thumbOf(x)}</span><span style="flex:1;min-width:0"><b>${esc(x.vtitle || x.title || 'Quelle')}</b><br><small class="muted">${pf.date ? 'Stunde ' + esc(String(pf.date).split('-').reverse().slice(0, 2).join('.')) + '.' : 'Stundenplanung'}${pf.label ? ' · ' + esc(pf.label) : ''}</small></span><button class="btn sm" data-act="matpop" data-id="${id}">Ansehen</button><button class="btn sm" data-act="matpedit" data-id="${id}">Bearbeiten</button><button class="btn sm bad" data-act="matdiscard" data-id="${id}" title="Material wieder löschen">Verwerfen</button><button class="btn sm good" data-act="matconfirm" data-id="${id}">Bestätigen</button></div>`; }).join('')}</section>` : '';
    const cnt = {}; list.forEach((x) => { const t = tagsOf(x); t.tags.forEach((y) => { cnt[y] = (cnt[y] || 0) + 1; }); });
    const tg = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a.localeCompare(b, 'de')), top = tg.slice(0, 12), more = tg.slice(12);
    const tgb = (x) => `<button class="mattag tg sel${f.t.includes(x) ? ' on' : ''}" data-act="matft" data-v="${esc(x)}">${esc(x)}<small> ${cnt[x]}</small></button>`;
    const view = m.view || 'liste';
    const rows = shown.map((s, i) => {
      const id = s.id.replace(/^mat_/, ''), on = m.open === id;
      return `<div class="kmrow kmgo${on ? ' matsel' : ''}${m.flash === id ? ' matflash' : ''}" data-act="matpop" data-id="${id}" tabindex="0" role="link"><span class="kmno">${i + 1}</span><span class="matth2${/^(buch|pdf|epub)$/.test(kindOf(s)) ? ' matportrait' : ''}">${thumbOf(s)}</span><span class="kmnm">${m.editT === id ? `<input class="matin matte" id="mat-ti-${id}" data-act="matnop" data-ch="mattitlein" data-id="${id}" value="${esc(s.vtitle || s.title)}">` : `<b class="mattitle" data-act="mattitleclick" data-id="${id}" title="Klick: öffnen · Doppelklick: umbenennen">${esc(s.vtitle || s.title)}</b>`}<small class="muted"> ${esc(s.channel || '')}</small></span><span class="matc matpick" data-act="matkindmenu" data-id="${id}" title="Art ändern">${esc((KINDS.find(([k]) => k === kindOf(s)) || [0, ''])[1])}${s.dl && s.dl.state === 'done' ? ' <b class="matnas2">NAS</b>' : ''}</span><span class="matc chips2 matpick" data-act="matepmenu" data-id="${id}" title="Epoche ändern">${epTags(s)}</span>${groups().map((g) => `<span class="matc matpick" data-act="matclsmenu" data-id="${id}" data-g="${g.id}" title="${esc(g.name)} ändern">${((s.cls || {})[g.id] || []).map((x) => `<span class="mattag mini">${esc(x)}</span>`).join('') || '<span class="muted sm">–</span>'}</span>`).join('')}${kindOf(s) === 'video' ? `<span class="matc matpick" data-act="matdurmenu" data-id="${id}" title="Länge des Videos eintragen">${s.seconds != null ? esc(umfang(s)) : '<span class="muted sm">Länge eintragen</span>'}</span>` : `<span class="matc">${esc(umfang(s))}</span>`}<span class="matacts"><button class="matedit2" data-act="matopen" data-id="${id}" aria-expanded="${on}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>${dlPath(s) ? `<a class="matedit2 matdl2" href="${url(dlPath(s))}" download title="Herunterladen" aria-label="Herunterladen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg></a>` : '<span class="matedit2 matdl2 off" aria-hidden="true"></span>'}<button class="matedit2 matdel2" data-act="matdel" data-id="${id}" aria-label="Löschen" title="Löschen (Entf)"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg></button></span></div>`;
    }).join('');
    const tile = (s) => { const id = s.id.replace(/^mat_/, ''), on = m.open === id, e0 = tagsOf(s).epoche[0]; return `<div class="mattile${on ? ' on' : ''}${e0 ? ' hasep' : ''}"${epS(e0)}><button class="matmain" data-act="matpop" data-id="${id}" title="Öffnen: ${esc(s.title)}"><span class="matth">${thumbOf(s, true)}${s.dl && s.dl.state === 'done' ? '<b class="matnas" title="Video liegt auf der NAS">NAS</b>' : ''}${s.seconds != null ? `<b class="matdur">${esc(dur(s.seconds).replace(/ (Min|Std)$/, ''))}</b>` : ''}</span><span class="matti">${esc(s.vtitle || s.title)}</span><span class="matsub">${epTags(s)}</span></button>${dlPath(s) ? `<a class="matedit matdlt" href="${url(dlPath(s))}" download title="Herunterladen" aria-label="Herunterladen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M5 21h14"/></svg></a>` : ''}<button class="matedit matdelt" data-act="matdel" data-id="${id}" aria-label="Löschen" title="Löschen"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg></button><button class="matedit" data-act="matopen" data-id="${id}" aria-expanded="${on}" aria-label="Bearbeiten" title="Bearbeiten"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button></div>`; };
    const saved = cfgM().cols || {}, cols = [{ k: 'nr', n: 'Nr', d: '34px', w: 34 }, { k: 'th', n: '', d: '76px', w: 76 }, { k: 'ti', n: 'Titel', d: 'minmax(140px,1.3fr)', w: 140, rs: 1 }, { k: 'art', n: 'Art', d: '90px', w: 90, rs: 1 }, { k: 'ep', n: 'Epoche', d: 'minmax(150px,1.4fr)', w: 150, rs: 1 }].concat(groups().map((g) => ({ k: 'g:' + g.id, n: g.name, d: 'minmax(110px,1fr)', w: 110, rs: 1 })), [{ k: 'um', n: 'Umfang', d: '90px', w: 90, rs: 1 }, { k: 'ac', n: '', d: '112px', w: 112 }]);
    const tmpl = cols.map((c) => (saved[c.k] ? saved[c.k] + 'px' : c.d)).join(' '), tmin = cols.reduce((a, c) => a + (saved[c.k] || c.w), 0);
    const aoBody = () => {
      const g = new Map(); shown.forEach((x) => { const n = aoOf(x), k = norm(n); if (!g.has(k)) g.set(k, { n, items: [] }); g.get(k).items.push(x); });
      const arr = [...g.entries()].sort((a, b) => a[1].n.localeCompare(b[1].n, 'de'));
      const newTile = `<div class="mataonew"><b class="matti">Neuer Arbeitsauftrag</b><input id="mataonn" class="matin" placeholder="Name des Arbeitsauftrags" autocomplete="off" aria-label="Name des neuen Arbeitsauftrags"><div class="mataodz" tabindex="0" role="button" aria-label="Dateien für den Arbeitsauftrag hineinziehen"><span class="matdzi">⬇</span><b>Mehrere Dateien hierher ziehen</b><small class="muted">Der Name gilt für alle Dateien. Klicken geht auch.</small><input type="file" id="mataof" multiple hidden></div></div>`;
      if (!arr.length) return `<div class="mataog">${newTile}</div><p class="muted" style="margin:12px 0 0">` + (aoNames().length ? 'Kein Arbeitsauftrag passt zum Filter.' : 'Noch keine Arbeitsaufträge. Trage beim Anlegen oder Bearbeiten eines Materials im Feld „Arbeitsauftrag“ einen Namen ein. Alle Dateien mit demselben Namen werden hier zu einer Kachel zusammengefasst.') + '</p>';
      return `<div class="mataog">${newTile}${arr.map(([k, gr]) => { const on = m.aoOpen === k, eps = [...new Set(gr.items.flatMap((x) => tagsOf(x).epoche))], e0 = eps[0];
        const tl = `<div class="mattile mataot${on ? ' on' : ''}${e0 ? ' hasep' : ''}"${epS(e0)} draggable="true" data-aok="${esc(k)}" title="Klick: Dateien ansehen und bearbeiten · Ziehen auf eine Epoche oben: Arbeitsauftrag verschieben"><button class="matmain" data-act="mataoopen" data-k="${esc(k)}" aria-expanded="${on}" title="Dateien anzeigen"><span class="matth">${thumbOf(gr.items[0], true)}<b class="matdur">${gr.items.length} ${gr.items.length === 1 ? 'Datei' : 'Dateien'}</b></span><span class="matti">${esc(gr.n)}</span><span class="matsub">${eps.map((e) => `<span class="mattag ep"${epS(e)}>${esc(e)}</span>`).join('')}</span></button></div>`;
        const pn = on ? `<div class="mataop"><div class="muted sm" style="margin-bottom:6px">Dateien dieses Arbeitsauftrags (${gr.items.length})</div>${gr.items.map((x) => { const id = x.id.replace(/^mat_/, ''); return `<div class="kmli matpendr"><span class="matth2${/^(buch|pdf|epub)$/.test(kindOf(x)) ? ' matportrait' : ''}">${thumbOf(x)}</span><span style="flex:1;min-width:0"><b>${esc(x.vtitle || x.title)}</b><br><small class="muted">${esc((KINDS.find(([kk]) => kk === kindOf(x)) || [0, ''])[1])}</small></span><button class="btn sm" data-act="matpop" data-id="${id}">Ansehen</button><button class="btn sm" data-act="matpedit" data-id="${id}">Bearbeiten</button></div>`; }).join('')}</div>` : '';
        return tl; }).join('')}</div>`;
    };
    const body = f.a === 'ao' ? aoBody() : !list.length ? '<p class="muted" style="margin:0">Noch keine Quellen. Ziehe oben ein PDF, ein Video oder einen YouTube-Link hinein.</p>'
      : !shown.length ? '<p class="muted" style="margin:0">Keine Quelle passt zum Filter.</p>'
      : view === 'kacheln' ? `<div class="matgrid">${shown.map(tile).join('')}</div>`
      : `<div class="kmtable" style="--kmgrid:${tmpl};--kmmin:${tmin}px"><div class="kmrow kmth">${cols.map((c) => `<span${c.rs ? ` class="matcolh" data-col="${c.k}"` : ''}>${esc(c.n)}${c.rs ? `<i class="matrs" data-col="${c.k}" title="Ziehen: Breite ändern · Doppelklick: zurücksetzen"></i>` : ''}</span>`).join('')}</div>${rows}</div>`;
    const ecnt = (e) => list.filter((x) => tagsOf(x).epoche.includes(e)).length;
    const epbar = `<div class="kmchips matepinner"><span class="kmchipw"><button class="kmchip matep matall${!f.e ? ' on' : ' dim'}" style="--ec:#6e7480" data-act="matfe" data-v="">Alle<small>${list.length}</small></button></span><span class="kmdiv" style="cursor:default"></span>${EPOCHS.map((e) => `<span class="kmchipw"><button class="kmchip matep${f.e === e ? ' on' : ''}${f.e && f.e !== e ? ' dim' : ''}" style="--ec:${EPCOL[e]}" data-act="matfe" data-v="${esc(e)}" title="${esc(e)}: ${ecnt(e)} Quelle(n)">${esc(e)}<small>${ecnt(e)}</small></button></span>`).join('')}</div>`;
    const lib = list.length ? `<section class="card" style="margin-top:14px"><div class="row" style="align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap"><h2 style="margin:0">Bibliothek (${shown.length}${shown.length !== list.length ? ' von ' + list.length : ''})</h2><span style="flex:1"></span>${Object.keys(saved).length ? '<button class="btn sm" data-act="matcolsreset" style="margin-right:14px" title="Alle Spaltenbreiten auf die Standardwerte zurücksetzen">Spaltenbreiten zurücksetzen</button>' : ''}<span class="matseg"><button class="${view === 'liste' ? 'on' : ''}" data-act="matview" data-v="liste">Liste</button><button class="${view === 'kacheln' ? 'on' : ''}" data-act="matview" data-v="kacheln">Kacheln</button></span></div>
      <div style="margin-bottom:10px">${epbar}</div>
      <div class="row" style="gap:8px;align-items:center;margin-bottom:8px"><span class="matinw" style="flex:1"><input class="kminp" id="matfq" data-ch="matfq" value="${esc(f.q)}" placeholder="Filtern: Titel, Kanal, Autor, Tag …" style="width:100%">${clearBtn('matfclr', !!f.q)}</span>${act ? '<button class="btn sm" data-act="matfx">Zurücksetzen</button>' : ''}</div>
      ${tg.length ? `<div class="chips" style="margin-bottom:12px"><span class="muted sm">Themen:</span>${top.map(tgb).join('')}${more.length ? `<details class="matmore"><summary class="mattag">Weitere ▾</summary><div>${more.map(tgb).join('')}</div></details>` : ''}</div>` : ''}
      ${body}</section>` : '';
    const open = list.find((x) => x.id.replace(/^mat_/, '') === m.open);
    return zone + pendCard + drafts + lib + (open ? editCard(open) : '');
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
    matdiscard: async (e) => {
      const id = e.dataset.id, s0 = srcOf(id); if (!s0) return; const kids = sources().filter((x) => x.pdfFrom === id && x.pending).map((x) => x.id.replace(/^mat_/, '')), all = [id].concat(kids);
      const verb = e.dataset.verb || 'verwerfen'; if (!confirm('„' + (s0.vtitle || s0.title) + '“' + (kids.length ? ' und die daraus erzeugte PDF' : '') + ' ' + verb + '? Die Dateien werden von der NAS gelöscht und aus den Stunden entfernt.')) return;
      for (const x of all) {
        Object.values(S.settings).filter((d) => d && /^cn_/.test(d.id || '') && Array.isArray(d.log) && d.log.some((l) => (l.mats || []).includes(x) || (l.smats || []).includes(x))).forEach((d) => put('settings', Object.assign({}, d, { log: d.log.map((l) => Object.assign({}, l, l.mats ? { mats: l.mats.filter((m) => m !== x) } : {}, l.smats ? { smats: l.smats.filter((m) => m !== x) } : {})) })));
        Object.values(S.tests || {}).filter((t) => t && t.mid === x && !(t.pts && Object.keys(t.pts).length)).forEach((t) => del('tests', t.id));
        await removeSource(x);
      }
      toast(e.dataset.verb === 'löschen' ? 'Gelöscht' : 'Verworfen'); render();
    },
    matconfirm: (e) => { const s0 = srcOf(e.dataset.id); if (s0) put('settings', Object.assign({}, s0, { pending: false })); },
    matconfirmall: () => { sources().filter((x) => x.pending).forEach((x) => put('settings', Object.assign({}, x, { pending: false }))); },
    matpedit: (e) => openEdit(e.dataset.id),
    mdrmkey: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.keys = d.keys.filter((x) => x !== e.dataset.v); render(); } },
    mdcls: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.cls = clsToggle(d.cls, e.dataset.g, e.dataset.v); render(); } },
    matcls: (e) => { const s = srcOf(e.dataset.id); if (s) { put('settings', Object.assign({}, s, { cls: clsToggle(s.cls, e.dataset.g, e.dataset.v) })); render(); } },
    matgdel: (e) => { const g = groups().map((x) => Object.assign({}, x, { items: x.items.slice() })), gr = g.find((x) => x.id === e.dataset.g); if (!gr) return; gr.items = gr.items.filter((x) => x !== e.dataset.v); saveGroups(g); render(); },
    matgrpadd: () => { const n = (prompt('Name der neuen Einteilung (z. B. „Schwierigkeit“):') || '').trim(); if (!n) return; const g = groups().map((x) => Object.assign({}, x, { items: x.items.slice() })); g.push({ id: 'g' + Date.now().toString(36), name: n, multi: true, items: [], custom: true }); saveGroups(g); render(); },
    matgrpdel: (e) => { const gr = groups().find((x) => x.id === e.dataset.g); if (!gr || !confirm('Einteilung „' + gr.name + '“ löschen? Bereits gesetzte Angaben bleiben an den Quellen gespeichert.')) return; saveGroups(groups().filter((x) => x.id !== e.dataset.g)); render(); },
    matnop: () => {},
    mattitleclick: (e) => {
      const m = M(), id = e.dataset.id, now = Date.now();
      if (m.tclk && m.tclk.id === id && now - m.tclk.t < 380) { clearTimeout(m.tclk.timer); m.tclk = null; m.editT = id; render(); setTimeout(() => { const i = document.getElementById('mat-ti-' + id); if (i) { i.focus(); i.select(); } }, 30); return; }
      if (m.tclk) clearTimeout(m.tclk.timer);
      m.tclk = { id, t: now, timer: setTimeout(() => { m.tclk = null; popup(id); }, 330) };
    },
    matclsmenu: (e) => { const id = e.dataset.id, s = srcOf(id), g = groups().find((x) => x.id === e.dataset.g); if (!s || !g) return; const cur = (s.cls || {})[g.id] || []; openMenu(e, `<div class="matmt">${esc(g.name)}</div>${g.items.map((x) => `<button class="matmi${cur.includes(x) ? ' on' : ''}" data-pick="${esc(x)}">${esc(x)}${cur.includes(x) ? ' ✓' : ''}</button>`).join('') || '<div class="muted sm" style="padding:6px 10px">Noch keine Felder. In der Bearbeitung mit „+ neu“ anlegen.</div>'}`, (x) => { put('settings', Object.assign({}, srcOf(id), { cls: clsToggle(srcOf(id).cls, g.id, x) })); render(); }); },
    matdurmenu: (e) => { const id = e.dataset.id, s = srcOf(id); if (!s) return; openMenu(e, `<div class="matmt">Länge des Videos</div><div style="padding:4px 8px 8px"><input class="matin" value="${esc(durIn(s.seconds))}" placeholder="mm:ss oder h:mm:ss" style="width:180px"><div class="muted sm" style="margin:4px 0">z. B. 12:34 oder 1:05:20</div><button class="matmi" data-pick="ok" style="justify-content:center;background:var(--accent-soft)">Speichern</button></div>`, (x, v) => { const ps = parseDur(v); if (Number.isNaN(ps)) return toast('Das Format kenne ich nicht. Bitte so eingeben: 12:34 oder 1:05:20'); put('settings', Object.assign({}, srcOf(id), { seconds: ps })); render(); }); },
    matkindmenu: (e) => { const id = e.dataset.id, s = srcOf(id); if (!s) return; openMenu(e, `<div class="matmt">Art ändern</div>${kindsOrdered().map(([k, n]) => `<button class="matmi${kindOf(s) === k ? ' on' : ''}" data-pick="${k}">${esc(n)}</button>`).join('')}`, (k) => { put('settings', Object.assign({}, srcOf(id), { kind: k })); render(); }); },
    matepmenu: (e) => { const id = e.dataset.id, s = srcOf(id); if (!s) return; const cur = tagsOf(s).epoche; openMenu(e, `<div class="matmt">Epoche wählen</div>${EPOCHS.map((x) => `<button class="matmi${cur.includes(x) ? ' on' : ''}" data-pick="${esc(x)}"><i class="matdot" style="background:${EPCOL[x]}"></i>${esc(x)}${cur.includes(x) ? ' ✓' : ''}</button>`).join('')}`, (x) => A.mattoggle({ dataset: { id, t: x } })); },
    matkind: (e) => { const s = srcOf(e.dataset.id); if (s) { put('settings', Object.assign({}, s, { kind: e.dataset.v })); render(); } },
    mdkind: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d); if (d) { d.art = e.dataset.v; render(); } },
    matclip: (e) => clipInto({ dataset: { pz: e.dataset.id } }),
    mdclip: (e) => clipInto({ dataset: { pzd: e.dataset.d } }),
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
    matcolsreset: () => { put('settings', Object.assign({}, cfgM(), { id: 'matcfg', cols: {} })); render(); },
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
    mataoopen: (e) => { openAo(e.dataset.k, e.closest && e.closest('.mataot')); },
    matopen: (e) => { const m = M(), id = e.dataset.id; m.open = m.open === id ? null : id; render(); if (m.open) setTimeout(() => { const c = document.getElementById('matdetail'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50); },
    matshowf: () => { const m = M(); m.showFiles = !m.showFiles; if (m.showFiles) m.files = null; render(); },
    matyt: async (e) => {
      const s = srcOf(e.dataset.id); if (!s || !s.url) return; const m = M(); m.busy = 'YouTube-Infos werden geholt …'; render();
      try { put('settings', Object.assign({}, s, ytFields(await ytFetch(s.url)))); await retag(e.dataset.id); toast('Infos aktualisiert'); } catch (x) { toast('Nicht abrufbar: ' + (x.message || x)); }
      m.busy = ''; render();
    },
    matdel: (e) => {
      const id = e.dataset.id, s = srcOf(id); if (!s) return;
      const doDel = async () => { await removeSource(id); M().open = null; toast('Gelöscht'); render(); };
      const anchor = (e.getBoundingClientRect && e) || document.querySelector('[data-act=matdel][data-id="' + id + '"]');
      if (!anchor) { if (confirm('Quelle „' + (s.vtitle || s.title) + '“ mit allen Dateien löschen?')) doDel(); return; }
      openMenu(anchor, `<div class="matmt">Löschen?</div><div class="sm" style="padding:2px 10px 8px;max-width:250px;line-height:1.35">„${esc(s.vtitle || s.title)}“ wird mit allen Dateien von der NAS entfernt.</div><div style="display:flex;gap:6px;padding:0 6px 6px"><button class="matmi matyes" data-pick="ja" style="justify-content:center">Ja, löschen</button><button class="matmi" data-pick="nein" style="justify-content:center">Abbrechen</button></div>`, (x) => { if (x === 'ja') doDel(); });
    },
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
    mattitlein: (e) => { const s = srcOf(e.dataset.id), v = e.value.trim(); M().editT = null; if (s && v) put('settings', Object.assign({}, s, s.vtitle ? { vtitle: v, title: v } : { title: v })); render(); },
    matgnew: (e) => { const v = e.value.trim(); if (!v) return; const g = groups().map((x) => Object.assign({}, x, { items: x.items.slice() })), gr = g.find((x) => x.id === e.dataset.g); if (!gr) return; if (!gr.items.includes(v)) gr.items.push(v); saveGroups(g); e.value = ''; render(); },
    matakey: (e) => { const v = e.value.trim(); if (!v) return; const s = srcOf(e.dataset.id); if (!s) return; put('settings', Object.assign({}, s, { mankeys: [...new Set((s.mankeys || []).concat(v))], hid: (s.hid || []).filter((x) => x !== v) })); e.value = ''; render(); },
    mdkey: (e) => { const d = M().drafts.find((x) => x.id === e.dataset.d), v = e.value.trim(); if (!d || !v) return; if (!d.keys.includes(v)) d.keys.push(v); e.value = ''; render(); },
    matdlchk: (e) => {
      const id = e.dataset.id, s = srcOf(id); if (!s) return;
      if (e.checked) { startDownload(id); return; }
      e.checked = true; // erst nach Bestätigung entfernen
      openMenu(e, `<div class="matmt">Video von der NAS löschen?</div><div class="sm" style="padding:2px 10px 8px;max-width:250px;line-height:1.35">Die heruntergeladene Datei wird entfernt. Der Link zum Video bleibt erhalten.</div><div style="display:flex;gap:6px;padding:0 6px 6px"><button class="matmi matyes" data-pick="ja" style="justify-content:center">Ja, löschen</button><button class="matmi" data-pick="nein" style="justify-content:center">Abbrechen</button></div>`, async (x) => { if (x !== 'ja') return render(); const f = ((srcOf(id) || {}).dl || {}).file; if (f) { try { await fdel(f); } catch (z) { /* */ } } setDl(id, { state: 'none', file: null, size: 0, msg: '' }); toast('Video von der NAS gelöscht'); render(); });
    },
    matdurin: (e) => { const s = srcOf(e.dataset.id); if (!s) return; const ps = parseDur(e.value); if (Number.isNaN(ps)) return toast('Das Format kenne ich nicht. Bitte so eingeben: 12:34 oder 1:05:20'); put('settings', Object.assign({}, s, { seconds: ps })); render(); },
    matttl: (e) => { const s = srcOf(e.dataset.id); if (!s) return; const v = e.value.trim(); if (v) put('settings', Object.assign({}, s, s.vtitle ? { vtitle: v, title: v } : { title: v })); render(); },
    matmeta: (e) => { const s = srcOf(e.dataset.id), f = e.dataset.f; if (s && /^(author|publisher)$/.test(f)) put('settings', Object.assign({}, s, { [f]: e.value.trim() })); },
    matao: (e) => { const s = srcOf(e.dataset.id); if (s) { const v = e.value.trim(), o2 = Object.assign({}, s, { ao: v }); if (v && isWord(s) && s.file && !s.pdfOff && !sources().some((x) => x.pdfFrom === e.dataset.id)) o2.needPdf = true; put('settings', o2); setTimeout(() => syncPdfs(false), 400); } },
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
  /* PowerPoint-Präsentation im Fenster abspielen (Folie für Folie) */
  async function showPptx(o, s, id) {
    const view = o.querySelector('.matpptv'), cnt = o.querySelector('[data-ppn]');
    const fallback = async (why) => { const t = await textOf(id); view.innerHTML = `<div style="padding:18px 22px;text-align:left;overflow:auto;height:100%;color:var(--ink);background:var(--surface)"><p class="muted sm">Die Folien lassen sich hier nicht darstellen (${esc(why)}). Der Text der Präsentation:</p>${t.pages.map((p) => `<h3 style="margin:14px 0 4px;font-size:15px">${esc(p.h || 'Folie ' + p.p)}</h3><p style="margin:0;white-space:pre-wrap">${esc(p.t)}</p>`).join('')}</div>`; cnt.textContent = ''; };
    try {
      await loadScript('/vendor/pptx-preview.umd.js', 'pptxPreview');
      const buf = await (await fetch(url(s.file), { credentials: 'same-origin' })).arrayBuffer(); let W = 4, H = 3;
      try { const Z = await loadZip(), z = await Z.loadAsync(buf), px = await z.file('ppt/presentation.xml').async('string'), m = px.match(/<p:sldSz[^>]*?cx="(\d+)"[^>]*?cy="(\d+)"/); if (m) { W = +m[1]; H = +m[2]; } } catch (e) { /* 16:9 annehmen */ }
      const bw = view.clientWidth || 900, bh = view.clientHeight || 500, w = Math.max(320, Math.min(bw - 16, (bh - 16) * W / H)), h = Math.round(w * H / W);
      view.innerHTML = ''; const host = document.createElement('div'); host.style.cssText = 'width:' + Math.round(w) + 'px;height:' + h + 'px;margin:auto;position:relative'; view.appendChild(host);
      const pv = window.pptxPreview.init(host, { width: Math.round(w), height: h, mode: 'slide' }); await pv.preview(buf);
      const upd = () => { cnt.textContent = 'Folie ' + (pv.currentIndex + 1) + ' von ' + pv.slideCount; }; upd();
      const go = (d) => { if (d > 0) pv.renderNextSlide(); else pv.renderPreSlide(); upd(); };
      o.querySelector('.matpdftb').addEventListener('click', (e) => { const b = e.target.closest('[data-pp]'); if (!b) return; if (b.dataset.pp === 'fs') { const el = view; (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el); } else go(b.dataset.pp === '+' ? 1 : -1); });
      const isFs = () => document.fullscreenElement === view || document.webkitFullscreenElement === view;
      const fit = () => {
        if (!document.body.contains(o)) { document.removeEventListener('fullscreenchange', fit); document.removeEventListener('webkitfullscreenchange', fit); window.removeEventListener('resize', fit); return; }
        const f = isFs(); view.style.padding = f ? '0' : ''; view.style.overflow = f ? 'hidden' : ''; host.style.transformOrigin = 'center center';
        host.style.transform = f ? 'scale(' + Math.min(view.clientWidth / w, view.clientHeight / h) + ')' : ''; view.style.cursor = f ? 'pointer' : '';
      };
      document.addEventListener('fullscreenchange', fit); document.addEventListener('webkitfullscreenchange', fit); window.addEventListener('resize', fit);
      host.addEventListener('click', () => { if (isFs()) go(1); });
      const key = (e) => { if (!document.body.contains(o)) return document.removeEventListener('keydown', key); if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); } };
      document.addEventListener('keydown', key);
    } catch (e) { await fallback(e.message || 'Fehler'); }
  }
  /* Doppelklick auf eine Kachel: Quelle als Pop-up öffnen */
  /* EPUB-Leser: Inhaltsverzeichnis, Kapitel, Schriftgröße, Hell/Sepia/Dunkel, merkt sich die Stelle */
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } };
  async function showEpub(o, s, id) {
    const host = o.querySelector('.matepub'), say = (h) => { host.innerHTML = `<div style="padding:24px" class="muted">${h}</div>`; };
    if (!document.getElementById('matepubcss')) {
      const st = document.createElement('style'); st.id = 'matepubcss';
      st.textContent = `.matepub{display:flex;flex-direction:column;height:100%;min-height:0}.matetb{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:0 0 8px}.matetb .sm{font-size:13px}.matebody{display:flex;flex:1;min-height:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;position:relative}.matetoc{width:290px;flex:none;overflow:auto;border-right:1px solid var(--line);background:var(--surface);padding:8px 0;font-size:14px}.matetoc button{display:block;width:100%;text-align:left;background:none;border:0;padding:6px 14px;color:inherit;font:inherit;cursor:pointer;line-height:1.3}.matetoc button:hover{background:var(--surface2)}.matetoc button.on{background:var(--surface2);font-weight:700;box-shadow:inset 3px 0 0 var(--brand,var(--accent))}.matetoc.off{display:none}.matefr{flex:1;min-width:0;border:0;background:#fff}@media(max-width:700px){.matetoc{position:absolute;z-index:2;top:0;bottom:0;left:0;width:82%;box-shadow:4px 0 16px rgba(0,0,0,.25)}}`;
      document.head.appendChild(st);
    }
    let z; try { const Z = await loadZip(), buf = await fgetBuf(s.epub); if (!buf) return say('Die EPUB-Datei wurde auf der NAS nicht gefunden.'); z = await Z.loadAsync(buf); } catch (e) { return say('Die EPUB-Datei konnte nicht geöffnet werden: ' + esc(e.message || e)); }
    const P = new DOMParser(), rd = async (n) => { const f = z.file(n) || z.file(decodeURIComponent(n)); return f ? f.async('string') : null; };
    const res = (b, h) => { try { return decodeURIComponent(new URL(h, 'http://x/' + b).pathname.slice(1)); } catch (e) { return h; } };
    const dirOf = (p) => p.replace(/[^/]*$/, '');
    const cont = await rd('META-INF/container.xml'); if (!cont) return say('Das ist keine gültige EPUB-Datei.');
    const opfPath = P.parseFromString(cont, 'text/xml').querySelector('rootfile').getAttribute('full-path'), bs = dirOf(opfPath), opf = P.parseFromString(await rd(opfPath), 'text/xml');
    const man = {}; opf.querySelectorAll('manifest > item').forEach((it) => { man[it.getAttribute('id')] = { path: res(bs, it.getAttribute('href')), type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' }; });
    const spine = [...opf.querySelectorAll('spine > itemref')].filter((x) => x.getAttribute('linear') !== 'no').map((x) => man[x.getAttribute('idref')]).filter((x) => x && /html|xml/.test(x.type));
    if (!spine.length) return say('Die EPUB enthält keine lesbaren Kapitel (vermutlich Kopierschutz).');
    const idx = {}; spine.forEach((x, i) => { idx[x.path] = i; });
    /* Inhaltsverzeichnis: EPUB3-nav oder NCX */
    let toc = [];
    try {
      const nav = Object.values(man).find((x) => /\bnav\b/.test(x.props));
      if (nav) {
        const d = P.parseFromString(await rd(nav.path), 'text/html'), nv = [...d.querySelectorAll('nav')].find((n) => /toc/.test(n.getAttribute('epub:type') || '')) || d.querySelector('nav');
        const walk = (ol, lv) => { [...ol.children].filter((li) => li.tagName === 'LI').forEach((li) => { const a = li.querySelector(':scope > a, :scope > span'); if (a) toc.push({ t: a.textContent.replace(/\s+/g, ' ').trim(), h: a.getAttribute('href') ? res(dirOf(nav.path), a.getAttribute('href')) : null, lv }); const sub = li.querySelector(':scope > ol'); if (sub) walk(sub, lv + 1); }); };
        const ol = nv && nv.querySelector('ol'); if (ol) walk(ol, 0);
      }
      if (!toc.length) {
        const sp = opf.querySelector('spine'), ncx = sp && man[sp.getAttribute('toc')] || Object.values(man).find((x) => /ncx/.test(x.type));
        if (ncx) {
          const d = P.parseFromString(await rd(ncx.path), 'text/xml'), kids = (el, n) => [...el.children].filter((c) => c.localName === n);
          const walk = (el, lv) => kids(el, 'navPoint').forEach((np) => { const lab = np.getElementsByTagName('text')[0], c = kids(np, 'content')[0]; if (lab && c) toc.push({ t: lab.textContent.replace(/\s+/g, ' ').trim(), h: res(dirOf(ncx.path), c.getAttribute('src')), lv }); walk(np, lv + 1); });
          const nm = d.getElementsByTagName('navMap')[0]; if (nm) walk(nm, 0);
        }
      }
    } catch (e) { toc = []; }
    toc = toc.filter((x) => x.t && x.h && idx[x.h.replace(/#.*$/, '')] != null);
    if (toc.length < 2) toc = spine.map((x, i) => ({ t: 'Abschnitt ' + (i + 1), h: x.path, lv: 0 }));
    const blobs = {}, mime = (p) => ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', css: 'text/css', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf' }[(p.match(/\.(\w+)$/) || [0, ''])[1].toLowerCase()] || 'application/octet-stream');
    const blobUrl = async (p) => { if (blobs[p] !== undefined) return blobs[p]; const f = z.file(p) || z.file(decodeURIComponent(p)); if (!f) return (blobs[p] = null); const b = await f.async('blob'); return (blobs[p] = URL.createObjectURL(new Blob([b], { type: mime(p) }))); };
    const cssFix = async (css, base) => { const refs = [...css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]).filter((u) => !/^(data:|https?:|#)/i.test(u)); const map = {}; for (const u of new Set(refs)) map[u] = await blobUrl(res(base, u.replace(/[?#].*$/, ''))); return css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g, (m, u) => (map[u] ? `url(${map[u]})` : m)); };
    const st = { i: 0, size: lsGet('matepub_size', 100), theme: lsGet('matepub_theme', 'hell'), toc: window.innerWidth > 700 }, last = lsGet('matepub_pos', {})[id];
    const fr = () => host.querySelector('.matefr');
    const themeCss = () => ({ hell: 'html,body{background:#fff!important}', sepia: 'html,body{background:#f4ecd8!important;color:#4b3a22!important}body *{color:inherit!important;background:transparent!important}a{color:#7a4a12!important}', dunkel: 'html,body{background:#16181a!important;color:#d9dcd6!important}body *{color:inherit!important;background:transparent!important}a{color:#8fb8ff!important}img{opacity:.9}' }[st.theme]);
    async function load(i, frag, y) {
      if (i !== st.i) st.pick = null; st.i = Math.max(0, Math.min(spine.length - 1, i)); const it = spine[st.i], html = await rd(it.path); if (html == null) return;
      const d = P.parseFromString(html, 'text/html'), b = dirOf(it.path); let head = '';
      d.querySelectorAll('script,iframe,object,embed').forEach((x) => x.remove());
      for (const l of [...d.querySelectorAll('link[rel~="stylesheet"]')]) { const css = await rd(res(b, l.getAttribute('href') || '')); if (css) head += '<style>' + (await cssFix(css, dirOf(res(b, l.getAttribute('href'))))) + '</style>'; }
      for (const sy of [...d.querySelectorAll('style')]) head += '<style>' + (await cssFix(sy.textContent, b)) + '</style>';
      for (const im of [...d.querySelectorAll('img,image,source')]) for (const a of ['src', 'href', 'xlink:href', 'srcset']) { const v = im.getAttribute(a); if (v && !/^(data:|https?:)/i.test(v)) { const u = await blobUrl(res(b, v.split(/[ ?#]/)[0])); if (u) im.setAttribute(a, u); if (a === 'srcset') im.removeAttribute('srcset'); } }
      const nxt = st.i < spine.length - 1 ? '<p class="matenx"><a href="#" data-n="1">Nächstes Kapitel ▶</a></p>' : '';
      const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<style id="matx">body{max-width:46em;margin:0 auto!important;padding:20px 24px 40px!important;line-height:1.6;box-sizing:border-box}img,svg,video{max-width:100%;height:auto}.matenx{text-align:center;margin:40px 0 0}.matenx a{font-weight:700;text-decoration:none}html{zoom:${st.size / 100}}${themeCss()}</style></head><body>${d.body ? d.body.innerHTML : ''}${nxt}</body></html>`;
      const f = fr(); f.onload = () => {
        const cd = f.contentDocument; if (!cd) return;
        if (frag && cd.getElementById(frag)) cd.getElementById(frag).scrollIntoView(); else if (y) cd.documentElement.scrollTop = y;
        cd.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a'); if (!a) return; e.preventDefault(); if (a.dataset.n) return load(st.i + 1); const h = a.getAttribute('href') || ''; if (/^(https?:|mailto:)/i.test(h)) return window.open(h, '_blank', 'noopener'); const [pp, fg] = h.split('#'), tp = pp ? res(b, pp) : it.path; if (idx[tp] != null) load(idx[tp], fg); else if (fg && cd.getElementById(fg)) cd.getElementById(fg).scrollIntoView(); });
        let tm; cd.addEventListener('scroll', () => { clearTimeout(tm); tm = setTimeout(() => save(cd.documentElement.scrollTop), 400); });
        cd.addEventListener('keydown', (e) => { if (e.key === 'Escape') o.querySelector('[data-x]').click(); });
      };
      f.srcdoc = doc; paint(); save(y || 0);
    }
    const save = (y) => { const m = lsGet('matepub_pos', {}); m[id] = { i: st.i, y: Math.round(y || 0) }; lsSet('matepub_pos', m); };
    const curToc = () => { if (st.pick != null && toc[st.pick] && idx[toc[st.pick].h.replace(/#.*$/, '')] === st.i) return st.pick; let k = -1; toc.forEach((x, n) => { const j = idx[x.h.replace(/#.*$/, '')]; if (j === st.i && (k < 0 || idx[toc[k].h.replace(/#.*$/, '')] !== st.i)) k = n; else if (j < st.i && (k < 0 || idx[toc[k].h.replace(/#.*$/, '')] < st.i)) k = n; }); return k; };
    function paint() {
      const k = curToc(), tt = host.querySelector('.matetoc'); if (!tt) return;
      tt.querySelectorAll('button').forEach((bt, n) => bt.classList.toggle('on', n === k));
      host.querySelector('[data-ep]').textContent = 'Kapitel ' + (st.i + 1) + ' von ' + spine.length; const on = tt.querySelector('button.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    host.innerHTML = `<div class="matetb"><button class="btn sm" data-e="toc" aria-label="Inhaltsverzeichnis ein- oder ausblenden">☰ Inhalt</button><button class="btn sm" data-e="prev" aria-label="Voriges Kapitel">◀</button><span class="sm muted" data-ep style="min-width:110px;text-align:center"></span><button class="btn sm" data-e="next" aria-label="Nächstes Kapitel">▶</button><span style="flex:1"></span><button class="btn sm" data-e="sm" aria-label="Schrift kleiner">A−</button><button class="btn sm" data-e="lg" aria-label="Schrift größer">A+</button><button class="btn sm" data-e="th" title="Darstellung wechseln">Hell</button><a class="btn sm" href="${url(s.epub)}" download>Herunterladen</a></div><div class="matebody"><nav class="matetoc${st.toc ? '' : ' off'}" aria-label="Inhaltsverzeichnis">${toc.map((x) => `<button data-h="${esc(x.h)}" style="padding-left:${14 + x.lv * 16}px">${esc(x.t)}</button>`).join('')}</nav><iframe class="matefr" title="${esc(s.title)}" sandbox="allow-same-origin"></iframe></div>`;
    const thn = { hell: 'Hell', sepia: 'Sepia', dunkel: 'Dunkel' }, setTh = () => { host.querySelector('[data-e=th]').textContent = thn[st.theme]; };
    host.addEventListener('click', (e) => {
      const bt = e.target.closest('button'); if (!bt) return;
      if (bt.dataset.h) { const [pp, fg] = bt.dataset.h.split('#'); load(idx[pp], fg); st.pick = [...bt.parentNode.children].indexOf(bt); if (window.innerWidth <= 700) host.querySelector('.matetoc').classList.add('off'); return; }
      const a = bt.dataset.e; if (!a) return;
      if (a === 'toc') host.querySelector('.matetoc').classList.toggle('off');
      else if (a === 'prev') load(st.i - 1); else if (a === 'next') load(st.i + 1);
      else if (a === 'sm' || a === 'lg') { st.size = Math.max(70, Math.min(200, st.size + (a === 'lg' ? 10 : -10))); lsSet('matepub_size', st.size); load(st.i, null, fr().contentDocument ? fr().contentDocument.documentElement.scrollTop : 0); }
      else if (a === 'th') { st.theme = st.theme === 'hell' ? 'sepia' : st.theme === 'sepia' ? 'dunkel' : 'hell'; lsSet('matepub_theme', st.theme); setTh(); load(st.i, null, fr().contentDocument ? fr().contentDocument.documentElement.scrollTop : 0); }
    });
    setTh(); load(last && last.i != null && last.i < spine.length ? last.i : 0, null, last && last.y);
    const mo = new MutationObserver(() => { if (!document.body.contains(o)) { Object.values(blobs).forEach((u) => u && URL.revokeObjectURL(u)); mo.disconnect(); } }); mo.observe(document.body, { childList: true });
  }
  async function popup(id) {
    const s = srcOf(id); if (!s) return;
    const o = document.createElement('div'); o.className = 'matask'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    const kind = kindOf(s); let body = '';
    if (kind === 'video' && s.file && !(s.dl && s.dl.file) && /\.(mp4|m4v|mov|webm|mkv)$/i.test(s.file)) body = `<video controls autoplay src="${url(s.file, '&inline=1')}" style="width:100%;height:100%;background:#000"></video>`;
    else if (kind === 'ppt' && s.file && /\.(pptx|ppsx|pptm)$/i.test(s.file)) body = `<div class="matppt"><div class="matpdftb"><button class="btn sm" data-pp="-" aria-label="Vorherige Folie">◀</button><span class="sm" data-ppn style="min-width:90px;text-align:center">…</span><button class="btn sm" data-pp="+" aria-label="Nächste Folie">▶</button><button class="btn sm" data-pp="fs" style="margin-left:8px">Vollbild</button><span style="flex:1"></span><a class="btn sm" href="${url(s.file)}" download>Herunterladen</a></div><div class="matpptv"><span class="muted">⏳ Präsentation wird geladen …</span></div></div>`;
    else if (kind === 'pdf' && s.file) body = `<iframe class="matpdfv" title="${esc(s.title)}" src="/pdfjs/web/viewer.html?file=${encodeURIComponent(url(s.file, '&inline=1'))}#zoom=page-width&pagemode=none&locale=de" style="width:100%;height:100%;border:0;background:#fff"></iframe>`;
    else if (kind === 'epub' && s.epub) body = '<div class="matepub"><div style="padding:24px" class="muted">Buch wird geöffnet …</div></div>';
    else if (kind === 'video' && s.dl && s.dl.state === 'done' && s.dl.file) body = `<video controls autoplay src="${url(s.dl.file, '&inline=1')}" style="width:100%;height:100%;background:#000"></video>`;
    else {
      const t = await textOf(id), vid = ytVid(s.url);
      if (vid && kind === 'video') { const emb = `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`; body = `<iframe src="${emb}" title="${esc(s.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;height:100%;border:0;background:#000"></iframe>`; }
      else body = `<div style="padding:18px 22px;overflow:auto;height:100%">${kind === 'ppt' && s.file ? `<p><a class="btn sm" href="${url(s.file)}" download>Präsentation herunterladen</a></p>` : ''}${vid ? `<img src="https://i.ytimg.com/vi/${vid}/hqdefault.jpg" alt="" referrerpolicy="no-referrer" style="max-width:320px;border-radius:10px;float:right;margin:0 0 10px 14px">` : ''}${s.url ? `<p><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>${s.channelUrl ? ` · <a href="${esc(s.channelUrl)}" target="_blank" rel="noopener">Kanal ${esc(s.channel || '')}</a>` : ''}</p>` : ''}${kind === 'video' && !(s.dl && s.dl.state === 'done') ? '<p class="muted sm">Das Video ist noch nicht auf der NAS gespeichert.</p>' : ''}${t.pages.length ? t.pages.map((p) => `<h3 style="margin:16px 0 4px;font-size:15px">${esc(p.h || 'Seite ' + p.p)}</h3><p style="margin:0;white-space:pre-wrap">${esc(p.t)}</p>`).join('') : '<p class="muted">Zu dieser Quelle ist noch kein Text gespeichert.</p>'}</div>`;
    }
    const t0 = tagsOf(s);
    o.innerHTML = `<div class="matbox matbig"><div class="row" style="align-items:center;gap:10px;margin-bottom:8px"><h3 style="margin:0;flex:1">${esc(s.vtitle || s.title)}</h3><span class="muted sm">${t0.epoche.map(esc).join(', ')}</span><button class="btn sm" data-x="1" aria-label="Schließen">Schließen ✕</button></div><div class="matview">${body}</div></div>`;
    const close = () => { o.remove(); document.removeEventListener('keydown', esc1); };
    const esc1 = (e) => { if (e.key === 'Escape') close(); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-x]')) close(); });
    document.addEventListener('keydown', esc1); document.body.appendChild(o);
    if (kind === 'ppt' && s.file && /\.(pptx|ppsx|pptm)$/i.test(s.file)) showPptx(o, s, id);    if (kind === 'epub' && s.epub) showEpub(o, s, id);
  }
  const inView = () => U.view === 'material' || !!document.getElementById('matdz');
  /* Symbole der Seitenleiste per Drag-and-Drop anordnen (wird auf allen Geräten gespeichert) */
  /* Vorschaubild im Rahmen mit gedrückter Maustaste verschieben */
  let pan = null;
  document.addEventListener('pointerdown', (e) => {
    const box = e.target.closest && e.target.closest('.matpan'); if (!box || e.button) return; const img = box.querySelector('img'); if (!img || !img.naturalWidth) return;
    const id = box.dataset.pan, did = box.dataset.pand, src = id ? srcOf(id) : null, d = did ? M().drafts.find((x) => x.id === did) : null, cur = (src && src.tpos) || (d && d.tpos) || { x: 50, y: 50 };
    pan = { box, img, id, did, x0: e.clientX, y0: e.clientY, px: cur.x, py: cur.y, pos: { x: cur.x, y: cur.y } }; box.setPointerCapture && box.setPointerCapture(e.pointerId); box.classList.add('panning'); e.preventDefault();
  });
  document.addEventListener('pointermove', (e) => {
    if (!pan) return; const { box, img } = pan, cw = box.clientWidth, ch = box.clientHeight, sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight), ox = img.naturalWidth * sc - cw, oy = img.naturalHeight * sc - ch;
    const nx = ox > 1 ? Math.max(0, Math.min(100, pan.px - (e.clientX - pan.x0) / ox * 100)) : pan.px, ny = oy > 1 ? Math.max(0, Math.min(100, pan.py - (e.clientY - pan.y0) / oy * 100)) : pan.py;
    pan.pos = { x: Math.round(nx), y: Math.round(ny) }; img.style.objectPosition = pan.pos.x + '% ' + pan.pos.y + '%';
  });
  const panEnd = () => { if (!pan) return; const p = pan; pan = null; p.box.classList.remove('panning'); if (p.id) { const s = srcOf(p.id); if (s) put('settings', Object.assign({}, s, { tpos: p.pos })); render(); } else if (p.did) { const d = M().drafts.find((x) => x.id === p.did); if (d) d.tpos = p.pos; } };
  document.addEventListener('pointerup', panEnd); document.addEventListener('pointercancel', panEnd);
  /* Spaltenbreiten der Bibliothek selbst anpassen */
  let rsz = null;
  document.addEventListener('pointerdown', (e) => {
    const h = e.target.closest && e.target.closest('.matrs'); if (!h || e.button) return; e.preventDefault(); e.stopPropagation();
    const th = h.parentNode, tbl = th.closest('.kmtable'), heads = [...th.parentNode.children], widths = heads.map((x) => x.getBoundingClientRect().width);
    rsz = { tbl, widths, idx: heads.indexOf(th), x0: e.clientX, key: h.dataset.col, w: widths[heads.indexOf(th)], h }; h.setPointerCapture && h.setPointerCapture(e.pointerId); h.classList.add('on');
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (!rsz) return; const w = Math.max(50, Math.round(rsz.widths[rsz.idx] + e.clientX - rsz.x0)), all = rsz.widths.slice(); all[rsz.idx] = w; rsz.w = w;
    rsz.tbl.style.setProperty('--kmgrid', all.map((x) => Math.round(x) + 'px').join(' ')); rsz.tbl.style.setProperty('--kmmin', all.reduce((a, b) => a + b, 0) + 'px');
  });
  let lastTap = null;
  const rszEnd = () => { if (!rsz) return; const r0 = rsz; rsz = null; r0.h.classList.remove('on');
    if (Math.abs(r0.w - r0.widths[r0.idx]) < 3) { const now = Date.now(); if (lastTap && lastTap.k === r0.key && now - lastTap.t < 450) { lastTap = null; const c = Object.assign({}, cfgM().cols || {}); delete c[r0.key]; put('settings', Object.assign({}, cfgM(), { id: 'matcfg', cols: c })); render(); } else lastTap = { k: r0.key, t: now }; return; }
    const nc = Object.assign({}, cfgM().cols || {}); [...r0.tbl.querySelector('.kmth').children].forEach((h, i) => { if (h.dataset.col) nc[h.dataset.col] = Math.round(i === r0.idx ? r0.w : r0.widths[i]); });
    put('settings', Object.assign({}, cfgM(), { id: 'matcfg', cols: nc })); render(); };
  document.addEventListener('pointerup', rszEnd); document.addEventListener('pointercancel', rszEnd);
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.matdl2, .matdlt')) e.stopPropagation(); }, true);
  /* kleines Auswahlmenü an einer Zelle (Art, Epoche) */
  let menuEl = null, menuKey = '', menuSkip = '';
  const closeMenu = () => { if (menuEl) { menuEl.remove(); menuEl = null; menuKey = ''; } };
  const keyOf = (el) => (el && el.dataset ? [el.dataset.act, el.dataset.id, el.dataset.g].join('|') : '');
  function openMenu(el, html, pick) {
    if (menuSkip && menuSkip === keyOf(el)) { menuSkip = ''; return; }
    closeMenu(); const r = el.getBoundingClientRect(), m = document.createElement('div'); m.className = 'matmenu'; m.innerHTML = html;
    m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 240)) + 'px'; m.style.top = Math.min(r.bottom + 4, window.innerHeight - 300) + 'px';
    const fire = (v) => { const inp = m.querySelector('input'), iv = inp ? inp.value : ''; closeMenu(); pick(v, iv); };
    m.addEventListener('click', (ev) => { const b = ev.target.closest('[data-pick]'); if (b) fire(b.dataset.pick); });
    m.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && m.querySelector('input')) { ev.preventDefault(); fire('ok'); } });
    document.body.appendChild(m); menuEl = m; menuKey = keyOf(el); const fi = m.querySelector('input'); if (fi) setTimeout(() => { fi.focus(); fi.select(); }, 20);
  }
  document.addEventListener('click', (e) => { if (menuEl && !menuEl.contains(e.target)) { const a = e.target.closest && e.target.closest('[data-act]'); if (a && keyOf(a) === menuKey) { menuSkip = menuKey; setTimeout(() => { menuSkip = ''; }, 0); } closeMenu(); } }, true);
  /* Klick außerhalb der Bearbeiten-Karte schließt sie */
  document.addEventListener('click', (e) => {
    const m = U.mat; if (!m || !m.open || U.view !== 'material') return; const t = e.target; if (!t || !t.closest) return;
    if (t.closest('#matdetail, .matmenu, .matask, .matedit, .matedit2, .matpick, .mattitle, .matte') || !document.contains(t)) return;
    const was = m.open; setTimeout(() => { if (U.mat && U.mat.open === was) { U.mat.open = null; render(); } }, 0);
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if (e.target && e.target.classList && e.target.classList.contains('matte')) { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } if (e.key === 'Escape') { M().editT = null; render(); } }
  });
  document.addEventListener('focusout', (e) => { if (e.target && e.target.classList && e.target.classList.contains('matte')) setTimeout(() => { if (M().editT) { M().editT = null; render(); } }, 120); });
  let kdrag = null;
  const kicon = (e) => e.target && e.target.closest && e.target.closest('.kmside .kmicon[data-k], .matkindchip');
  document.addEventListener('dragstart', (e) => { const k = inView() && kicon(e); if (!k) return; kdrag = k.dataset.k; k.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', kdrag); } catch (x) { /* */ } });
  document.addEventListener('dragover', (e) => { const k = kdrag && kicon(e); if (k && k.dataset.k !== kdrag) { e.preventDefault(); document.querySelectorAll('.kmicon.over,.matkindchip.over').forEach((x) => x.classList.remove('over')); k.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const k = kicon(e); if (k) k.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    const k = kdrag && kicon(e); if (!k) return; e.preventDefault(); e.stopImmediatePropagation();
    const from = kdrag, to = k.dataset.k; kdrag = null; if (from === to) return;
    const order = kindsOrdered().map((x) => x[0]), fi = order.indexOf(from), ti = order.indexOf(to); order.splice(fi, 1); order.splice(ti, 0, from);
    put('settings', Object.assign({}, cfgM(), { id: 'matcfg', order })); render();
  }, true);
  /* Zeilen der Bearbeitung / des Entwurfs per Drag-and-Drop umsortieren (Reihenfolge wird gespeichert) */
  const rowKey = (r) => { const k = r.querySelector('.kmk'); return k && k.firstChild ? String(k.firstChild.textContent || '').trim() : ''; };
  const scopeOf = (card) => (card.id === 'matdetail' ? 'edit' : 'draft');
  function applyRowOrder() {
    document.querySelectorAll('#matdetail, .matdraft').forEach((card) => {
      if (card.dataset.ro) return; card.dataset.ro = '1';
      const all = [...card.children].filter((c) => c.classList && c.classList.contains('kmkvr')); if (!all.length) return;
      const rows = all.filter((r) => rowKey(r)), fixed = all.filter((r) => !rowKey(r)), ref = all[all.length - 1].nextSibling;
      const saved = ((cfgM().rows || {})[scopeOf(card)] || []), idx = (r) => { const i = saved.indexOf(rowKey(r)); return i < 0 ? 1e6 : i; };
      const ord = rows.map((r, i) => [r, i]).sort((a, b) => idx(a[0]) - idx(b[0]) || a[1] - b[1]).map((x) => x[0]);
      ord.concat(fixed).forEach((r) => card.insertBefore(r, ref));
      rows.forEach((r) => { r.classList.add('rd'); const g = document.createElement('span'); g.className = 'matgrip'; g.draggable = true; g.title = 'Zeile verschieben'; g.textContent = '⋮⋮'; r.insertBefore(g, r.firstChild); });
    });
  }
  let rdrag = null;
  const rowOf = (e) => e.target && e.target.closest && e.target.closest('.kmkvr.rd');
  document.addEventListener('dragstart', (e) => { const g = e.target && e.target.closest && e.target.closest('.matgrip'); if (!g) return; const r = g.parentNode; rdrag = r; r.classList.add('rowdrag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', rowKey(r)); const k = r; e.dataTransfer.setDragImage(k, 10, 10); } catch (x) { /* */ } });
  document.addEventListener('dragover', (e) => { const r = rdrag && rowOf(e); if (r && r !== rdrag && r.parentNode === rdrag.parentNode) { e.preventDefault(); document.querySelectorAll('.kmkvr.rowover').forEach((x) => x.classList.remove('rowover')); r.classList.add('rowover'); } });
  document.addEventListener('drop', (e) => {
    const r = rdrag && rowOf(e); if (!r || r === rdrag || r.parentNode !== rdrag.parentNode) return; e.preventDefault(); e.stopImmediatePropagation();
    const card = r.parentNode, list = [...card.children].filter((c) => c.classList && c.classList.contains('kmkvr') && rowKey(c)), fi = list.indexOf(rdrag), ti = list.indexOf(r);
    if (fi < ti) card.insertBefore(rdrag, r.nextSibling); else card.insertBefore(rdrag, r);
    const keys = [...card.children].filter((c) => c.classList && c.classList.contains('kmkvr') && rowKey(c)).map(rowKey), sc = scopeOf(card);
    rdrag = null; put('settings', Object.assign({}, cfgM(), { id: 'matcfg', rows: Object.assign({}, cfgM().rows || {}, { [sc]: keys }) }));
  }, true);
  document.addEventListener('dragend', () => { rdrag = null; document.querySelectorAll('.kmkvr.rowdrag,.kmkvr.rowover').forEach((x) => x.classList.remove('rowdrag', 'rowover')); });
  try { new MutationObserver(applyRowOrder).observe(document.getElementById('main'), { childList: true, subtree: true }); applyRowOrder(); } catch (e) { /* */ }
  let gdrag = null;
  const gitem = (e) => e.target && e.target.closest && e.target.closest('.matgi');
  document.addEventListener('dragstart', (e) => { const g = gitem(e); if (!g) return; gdrag = { g: g.dataset.g, v: g.dataset.v }; g.classList.add('drag'); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', g.dataset.v); } catch (x) { /* */ } });
  document.addEventListener('dragover', (e) => { const g = gdrag && gitem(e); if (g && g.dataset.g === gdrag.g && g.dataset.v !== gdrag.v) { e.preventDefault(); document.querySelectorAll('.matgi.over').forEach((x) => x.classList.remove('over')); g.classList.add('over'); } });
  document.addEventListener('drop', (e) => {
    const g = gdrag && gitem(e); if (!g || g.dataset.g !== gdrag.g) return; e.preventDefault(); e.stopImmediatePropagation();
    const from = gdrag.v, to = g.dataset.v, gid = gdrag.g; gdrag = null; if (from === to) return;
    const all = groups().map((x) => Object.assign({}, x, { items: x.items.slice() })), gr = all.find((x) => x.id === gid); if (!gr) return;
    const fi = gr.items.indexOf(from), ti = gr.items.indexOf(to); gr.items.splice(fi, 1); gr.items.splice(ti, 0, from); saveGroups(all); render();
  }, true);
  document.addEventListener('dragleave', (e) => { const row = e.target.closest && e.target.closest('.imgover'); if (row && !row.contains(e.relatedTarget)) row.classList.remove('imgover'); });
  document.addEventListener('dragend', () => { gdrag = null; document.querySelectorAll('.matgi.drag,.matgi.over').forEach((x) => x.classList.remove('drag', 'over')); kdrag = null; document.querySelectorAll('.kmicon.drag,.kmicon.over,.matkindchip.drag,.matkindchip.over').forEach((x) => x.classList.remove('drag', 'over')); });
  /* Neuer Arbeitsauftrag: mehrere Dateien auf einmal, ein Name für alle */
  const aoTake = (files, text) => { const inp = document.getElementById('mataonn'), n = inp ? inp.value.trim() : ''; if (!n) { toast('Bitte zuerst den Namen des Arbeitsauftrags eintragen'); if (inp) inp.focus(); return; } M().attach = null; intake(files, text, null, n); };
  const aoZone = (e) => e.target && e.target.closest && e.target.closest('.mataodz');
  document.addEventListener('click', (e) => { if (aoZone(e) && e.target.tagName !== 'INPUT') { const f = document.getElementById('mataof'); if (f) f.click(); } });
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'mataof') { const f = [...e.target.files]; e.target.value = ''; aoTake(f, ''); } });
  document.addEventListener('dragover', (e) => { const z = aoZone(e); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = aoZone(e); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => { const z = aoZone(e); if (!z) return; e.preventDefault(); e.stopImmediatePropagation(); z.classList.remove('over'); const dt = e.dataTransfer, files = [...(dt.files || [])], text = files.length ? '' : (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n').filter((l) => l && l[0] !== '#').join(' '); aoTake(files, text); }, true);
  const zone = (e) => e.target && e.target.closest && e.target.closest('#matdz');
  document.addEventListener('click', (e) => { const pz = e.target.closest && e.target.closest('.matpz'); if (pz) { pz.focus(); return; } if (zone(e) && !(e.target.tagName === 'INPUT')) { const f = document.getElementById('matdzf'); if (f) f.click(); } });
  document.addEventListener('change', (e) => { if (e.target && e.target.id === 'matdzf') { const f = [...e.target.files]; e.target.value = ''; intake(f, ''); } });
  const rowImg = (e) => { if (!inView() || kdrag || gdrag || rdrag || !e.target.closest) return null; const row = e.target.closest('.kmrow[data-id], .mattile'); if (!row) return null; const t = [...(e.dataTransfer ? e.dataTransfer.types : [])]; if (!(t.includes('Files') || t.includes('text/uri-list') || t.includes('text/html'))) return null; return row; };
  const rowId = (row) => row.dataset.id || (row.querySelector('.matmain') || {dataset: {}}).dataset.id;
  document.addEventListener('dragover', (e) => { const row = rowImg(e); if (row) { e.preventDefault(); document.querySelectorAll('.imgover').forEach((x) => x.classList.remove('imgover')); row.classList.add('imgover'); return; } if (inView() && e.target.closest && e.target.closest('.matpz')) { e.preventDefault(); e.target.closest('.matpz').classList.add('over'); return; } if (inView() && zone(e)) { e.preventDefault(); zone(e).classList.add('over'); } });
  document.addEventListener('dragleave', (e) => { const z = zone(e); if (z) z.classList.remove('over'); });
  document.addEventListener('drop', (e) => {
    if (!inView()) return; const imgRow = rowImg(e); if (imgRow) { e.preventDefault(); imgRow.classList.remove('imgover'); const id = rowId(imgRow); if (id) takeImage({ dataset: { pz: id } }, e.dataTransfer); return; } const pzz = e.target.closest && e.target.closest('.matpz'); if (pzz) { e.preventDefault(); pzz.classList.remove('over'); takeImage(pzz, e.dataTransfer); return; } const z = zone(e); if (!z) return; e.preventDefault(); z.classList.remove('over');
    const dt = e.dataTransfer, files = [...(dt.files || [])], text = files.length ? '' : (dt.getData('text/uri-list') || dt.getData('text/plain') || '').split('\n').filter((l) => l && l[0] !== '#').join(' ');
    intake(files, text);
  });
  document.addEventListener('paste', (e) => {
    if (!inView()) return; const ae = document.activeElement; const pz = ae && ae.closest && ae.closest('.matpz'); if (pz) { e.preventDefault(); takeImage(pz, e.clipboardData); return; } if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return;
    const files = [...(e.clipboardData ? e.clipboardData.files : [])], text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    if (!files.length && !text.trim()) return; e.preventDefault(); intake(files, text);
  });
  const st = document.createElement('style');
  st.textContent = `.matpan{cursor:grab;touch-action:none;user-select:none}.matpan.panning{cursor:grabbing;outline:2px solid var(--brand,var(--accent))}.matpan img{pointer-events:none;-webkit-user-drag:none}.matpicrow{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;padding:12px 0 8px;border-top:1px solid var(--line)}.matpicside{flex:1;min-width:220px}
.matpanbig{width:240px;aspect-ratio:16/9;overflow:hidden;border-radius:10px;background:var(--surface2);border:1px solid var(--line)}.matpanbig img{width:100%;height:100%;object-fit:cover;display:block}
.matpick{cursor:pointer;border-radius:6px;padding:2px 4px;margin:-2px -4px}.matpick:hover{background:var(--accent-soft)}.mattitle{cursor:pointer}.mattitle:hover{text-decoration:underline}.matte{width:100%!important;font:700 14px var(--font-body)}.imgover{outline:2px dashed var(--brand,var(--accent));outline-offset:-2px;background:var(--accent-soft)}
.matmenu{position:fixed;z-index:3500;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,.25);padding:6px;min-width:200px;max-height:70vh;overflow:auto}.matmt{font:700 11px var(--font-head);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:4px 8px}.matmi{display:flex;align-items:center;width:100%;text-align:left;border:0;background:transparent;color:inherit;border-radius:8px;padding:7px 10px;font:600 14px var(--font-body);cursor:pointer}.matmi:hover{background:var(--accent-soft)}.matmi.matyes{background:var(--bad-soft);color:var(--bad)}.matmi.matyes:hover{background:var(--bad);color:#fff}.matmi.on{background:var(--accent-soft);color:var(--accent)}
.kmkvr.rd{position:relative}.matgrip{position:absolute;left:-14px;top:8px;cursor:grab;color:var(--muted);opacity:.35;font:700 13px/1 var(--font-body);letter-spacing:-2px;user-select:none;padding:2px}.kmkvr.rd:hover .matgrip{opacity:1}.kmkvr.rowdrag{opacity:.4}.kmkvr.rowover{box-shadow:inset 0 3px 0 var(--brand,var(--accent))}
.matgi{cursor:grab;padding-right:4px}.matgi .matgl{border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;padding:0}.matgx{border:0;background:transparent;color:inherit;opacity:.45;cursor:pointer;font:700 13px/1 var(--font-body);padding:0 2px}.matgx:hover{opacity:1;color:var(--bad)}.matgi.drag{opacity:.35}.matgi.over{box-shadow:inset 3px 0 0 var(--brand,var(--accent))}.matgrpx{margin-left:4px}
.mattag.mini{margin:0 0 0 6px;font-size:10px;padding:0 6px;background:var(--accent-soft);color:var(--accent);border-color:transparent}
.mataoov{background:rgba(10,12,8,.18)!important;display:block!important;padding:0!important;overflow:hidden!important}.mataoov .matedbox{position:fixed;overflow:auto;box-shadow:0 16px 48px rgba(0,0,0,.35);max-width:none}
.mataows{margin-top:14px;padding:12px;border:1px solid var(--accent);border-radius:10px;background:var(--surface2)}.aoover{outline:3px solid var(--accent);outline-offset:2px}.mataot.drag{opacity:.4}
.mataog{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;grid-auto-flow:row dense}.mataonew{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:12px;display:flex;flex-direction:column;gap:8px}.mataonew .matin{width:100%}.mataodz{border:2px dashed var(--line);border-radius:10px;padding:14px 10px;text-align:center;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-height:110px;justify-content:center}.mataodz:hover,.mataodz.over,.mataodz:focus{border-color:var(--accent);background:var(--accent-soft)}
.mataop{grid-column:1/-1;border:1px solid var(--accent);border-radius:12px;padding:10px 14px;background:var(--surface2)}.mataot.on{outline:2px solid var(--accent)}
.matpendr{display:flex;align-items:center;gap:10px;padding:6px 0}.matpend{border-color:var(--accent)}
.matdz{display:flex;gap:16px;align-items:center;border:2px dashed var(--line);cursor:pointer;padding:22px 24px}.matdz:hover,.matdz.over,.matdz:focus{border-color:var(--brand,var(--accent));background:var(--accent-soft);outline:none}.matdzi{font-size:34px;line-height:1;color:var(--muted)}
.matask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:grid;place-items:center;padding:16px}.matbox{background:var(--surface);color:var(--ink);border-radius:14px;padding:20px;max-width:520px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.35)}
.mattag{display:inline-flex;align-items:center;gap:3px;border-radius:7px;padding:3px 10px;font:600 12px var(--font-body);margin:0 4px 4px 0;border:1px solid var(--line);background:var(--surface2);color:var(--ink)}.mattag button{border:0;background:transparent;color:inherit;cursor:pointer;font:700 14px/1 var(--font-body);padding:0 0 0 2px}
.mattag.ep{--ec:#9a8f6c;background:color-mix(in srgb,var(--ec) 18%,var(--surface));border-color:var(--ec);color:var(--ink)}.mattag.ep.sel:hover{background:color-mix(in srgb,var(--ec) 32%,var(--surface))}.mattag.ep.sel.on{background:var(--ec);border-color:var(--ec);color:#fff}
.mattile.hasep{border-top:4px solid var(--ec)}.matepdot{color:var(--ec);font-weight:700}.mattag.ky{background:transparent;border-style:dashed}.mattag.sel{cursor:pointer}.mattag.sel.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}.mattag small{opacity:.7}
.matfilter{margin-top:14px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}.matnas{position:absolute;left:6px;top:6px;background:var(--good);color:#fff;border-radius:5px;padding:1px 6px;font:700 11px var(--font-body)}
.matnote{display:flex;gap:10px;align-items:flex-start;border-radius:10px;padding:10px 14px;margin:-4px 0 12px;font:600 14px var(--font-body)}.matnote.err{background:var(--bad-soft);color:var(--bad)}.matnote.ok{background:var(--good-soft);color:var(--good)}.matnote span{flex:1}.matnote button{border:0;background:transparent;color:inherit;font:700 18px/1 var(--font-body);cursor:pointer}
.matinw{position:relative;display:block}.matinw input{padding-right:30px!important}.matclr{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:var(--surface2);color:var(--muted);width:22px;height:22px;border-radius:50%;cursor:pointer;font:700 15px/1 var(--font-body);display:grid;place-items:center;padding:0}.matclr:hover{background:var(--bad-soft);color:var(--bad)}
.mattag.hq{padding:0 2px 0 4px}.mattag.hq button:first-child{padding:2px 6px 2px 4px;font:600 12px var(--font-body)}.mattag.hq button{color:inherit}
.matppt{display:flex;flex-direction:column;height:100%}.matpptv{flex:1;overflow:auto;background:#374151;display:grid;place-items:center;padding:8px}.matpptv:fullscreen{background:#000}
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
html:root .kmchip.matep{padding:3px 10px;font-size:12.5px;gap:4px;background:var(--ec);border-color:var(--ec);color:#fff}html:root .kmchip.matep.dim{opacity:.45}html:root .kmchip.matep:hover{opacity:1}html:root .kmchip.matep.on{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--ec)}html:root .kmchip.matep small,html:root .kmchip.matep.on small,html:root .kmchip.matep:hover small{color:#fff!important;opacity:1}
.matdot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}.kmchip.zero{opacity:.55}.kmside .kmicon.zero{opacity:.5}.kmside .kmicon[draggable=true]{cursor:grab}.kmside .kmicon.drag{opacity:.35}.matkindchip[draggable=true]{cursor:grab}.matkindchip.drag{opacity:.35}.matkindchip.over{box-shadow:inset 3px 0 0 var(--brand,var(--accent))}.kmside .kmicon.over{box-shadow:inset 0 3px 0 var(--brand,#fff);background:rgba(255,255,255,.18)}.kmside .kmicon.zero:hover{opacity:1}.kmchip small{margin-left:4px}
.matpanbig.matportrait{width:200px;aspect-ratio:2/3}.matdpic.matportrait{aspect-ratio:2/3;width:100%;max-width:200px}.matth2.matportrait{width:40px;height:56px}.matth2.matportrait .matph{font-size:10px}.matth2{display:block;width:64px;height:36px;border-radius:6px;overflow:hidden;background:var(--surface2);position:relative}.matth2 img{width:100%;height:100%;object-fit:cover;display:block}.matth2 .matph{font-size:11px}.matth2 .matcc{display:none}
.kmtable .kmrow .kmnm{white-space:normal;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.25;font-size:13px;text-overflow:ellipsis}.kmtable .kmnm .mattitle{display:inline}
.matc{font-size:13px;color:var(--ink)}.matc.chips2{display:flex;gap:3px;flex-wrap:wrap}.matc.chips2 .mattag{margin:0;font-size:11px;padding:1px 7px}.matnas2{background:var(--good);color:#fff;border-radius:4px;padding:0 5px;font-size:10px}
.kmth .matcolh{position:relative}.matrs{position:absolute;right:0;top:0;bottom:0;width:10px;cursor:col-resize;z-index:3}.matrs::after{content:'';position:absolute;right:2px;top:2px;bottom:2px;width:2px;border-radius:1px;background:var(--line)}.matrs:hover::after,.matrs.on::after{background:var(--brand,var(--accent))}
.matacts{display:inline-flex;gap:2px;justify-content:flex-end}.matdl2.off{visibility:hidden}.matdl2{display:inline-grid;place-items:center;text-decoration:none}.matdl2:hover{background:var(--accent-soft)!important;color:var(--accent)!important}
.matdel2:hover{background:var(--bad-soft)!important;color:var(--bad)!important}.matdelt{right:46px!important}.matdlt{right:80px!important;text-decoration:none}.matdelt:hover{background:var(--bad)!important;color:#fff!important}
.matedit2{border:0;background:transparent;color:var(--muted);cursor:pointer;border-radius:8px;padding:6px}.matedit2:hover,.matedit2[aria-expanded=true]{background:var(--accent-soft);color:var(--accent)}.kmrow.matflash{animation:matfl 1s ease-in-out 3}@keyframes matfl{0%,100%{background:transparent}50%{background:var(--warn-soft)}}
.kmrow.matsel{background:var(--accent-soft)}
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
  /* Bearbeiten-Fenster einer Quelle (zum Beispiel von der Stundenseite aus) */
  /* ---------- Arbeitsauftrag: Popup, Umbenennen, Epoche, Word -> PDF ---------- */
  const isWord = (s) => /\.docx?$/i.test(s.file || s.fileName || '');
  const aoMembers = (k) => sources().filter((x) => norm(aoOf(x)) === k);
  const aoPair = (items) => { const w = items.filter(isWord), p = items.filter((x) => kindOf(x) === 'pdf' && x.file); return w.length === 1 && p.length === 1 ? { w: w[0], p: p[0] } : null; };
  function aoSetEpoch(k, ep) {
    aoMembers(k).forEach((s) => { const cur = tagsOf(s).epoche; let man = (s.man || []).filter((x) => !EPOCHS.includes(x)), hid = (s.hid || []).filter((x) => x !== ep); cur.forEach((y) => { if (y !== ep && !hid.includes(y)) hid.push(y); }); man = man.concat(ep); put('settings', Object.assign({}, s, { man, hid })); });
  }
  const SY = { ok: null, busy: false, err: {}, msg: {} };
  async function convertOk() { if (SY.ok !== null) return SY.ok; try { const r = await fetch('/api/version', { credentials: 'same-origin' }); const j = await r.json(); SY.ok = !!j.convert; } catch { SY.ok = false; } return SY.ok; }
  /* Läuft schon ein Durchgang, wird danach automatisch noch einer gemacht (sonst gehen Dateien verloren, die währenddessen dazukamen) */
  async function syncPdfs(force, onlyId) {
    if (SY.busy) { SY.again = true; return 0; } SY.busy = true; let total = 0;
    try { do { SY.again = false; total += await syncRun(force, onlyId); } while (SY.again); } finally { SY.busy = false; }
    return total;
  }
  async function syncRun(force, onlyId) {
    let n = 0;
    try {
      const need = sources().filter((x) => x.needPdf && x.file && isWord(x) && !onlyId && !(SY.err[x.id] && Date.now() - SY.err[x.id] < 600000));
      if (need.length || true) { if (!(await convertOk())) { if (need.length && !SY.warned) { SY.warned = true; toast('PDF aus Word kann noch nicht erstellt werden: LibreOffice fehlt im Container (Anleitung: Dockerfile neu bauen).'); } return 0; } }
      for (const w of need) {
        const wid = w.id.replace(/^mat_/, ''), cur = srcOf(wid); if (!cur || !cur.needPdf) continue;
        if (sources().some((x) => x.pdfFrom === wid)) { const o3 = Object.assign({}, cur); delete o3.needPdf; put('settings', o3); continue; }
        const title = (cur.vtitle || cur.title || 'Dokument') + ' PDF', pid = Date.now().toString(36) + Math.random().toString(36).slice(2, 5), dst = QDIR + '/' + pid + '-' + slugify(cur.vtitle || cur.title || 'Dokument') + '.pdf';
        try {
          const rr = await fetch('/api/convert', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ src: cur.file, dst }) }); if (!rr.ok) throw new Error(((await rr.json().catch(() => ({}))).error) || 'Fehler ' + rr.status);
          put('settings', { id: 'mat_' + pid, title, type: 'pdf', kind: 'pdf', url: '', added: Date.now(), pages: 0, file: dst, fileName: slugify(cur.vtitle || cur.title) + '.pdf', ao: cur.ao || '', auto: cur.auto, man: cur.man, hid: cur.hid, pdfFrom: wid, pdfAt: Date.now(), pending: cur.pending || false, pfrom: cur.pfrom, lock: true });
          const o4 = Object.assign({}, srcOf(wid)); delete o4.needPdf; put('settings', o4); n++; toast('PDF „' + title + '“ automatisch erstellt');
        } catch (e) { SY.err[w.id] = Date.now(); toast('PDF konnte nicht erstellt werden: ' + (e.message || e)); }
      }
      const links = sources().filter((p) => p.pdfFrom && p.file && (!onlyId || p.id === 'mat_' + onlyId)).map((p) => ({ p, w: srcOf(p.pdfFrom) })).filter((x) => x.w && x.w.file);
      if (!links.length) return 0;
      const r = await fetch('/api/files?dir=Material', { credentials: 'same-origin' }); if (!r.ok) return 0; const mt = {}; ((await r.json()).files || []).forEach((f) => { mt[f.path] = f.mtime; });
      for (const { p, w } of links) {
        if (!mt[w.file]) continue; if (!force && (mt[p.file] || 0) >= mt[w.file] - 1000) continue; if (!force && SY.err[p.id] && Date.now() - SY.err[p.id] < 600000) continue;
        try { const rr = await fetch('/api/convert', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ src: w.file, dst: p.file }) }); if (!rr.ok) throw new Error(((await rr.json().catch(() => ({}))).error) || 'Fehler ' + rr.status); delete SY.err[p.id]; SY.msg[p.id] = ''; n++; put('settings', Object.assign({}, srcOf(p.id.replace(/^mat_/, '')), { pdfAt: Date.now() })); toast('PDF „' + (p.vtitle || p.title) + '“ aus der Word-Datei aktualisiert'); }
        catch (e) { SY.err[p.id] = Date.now(); SY.msg[p.id] = e.message || String(e); }
      }
    } finally { /* */ } return n;
  }
  setTimeout(() => syncPdfs(false), 8000); setInterval(() => syncPdfs(false), 180000);
  async function replaceWord(wid, file) {
    const w = srcOf(wid); if (!w || !file) return; const nm = w.file || (QDIR + '/' + wid + '-' + slugify(file.name));
    await fput(nm, file); const raw = (await docxText(file)).replace(/\u0000/g, '').replace(/\s+/g, ' ').trim();
    put('settings', Object.assign({}, srcOf(wid), { file: nm, fileName: file.name, size: file.size, pages: raw.length >= 20 ? 1 : (srcOf(wid) || {}).pages }));
    if (raw.length >= 20) { T[wid] = { pages: [{ p: 1, t: raw }] }; await fput(QDIR + '/' + wid + '.json', new Blob([JSON.stringify(T[wid])], { type: 'application/json' })); }
    toast('Word-Datei ersetzt');
  }
  function openAo(k, anchor) {
    if (document.getElementById('mataomod') || !aoMembers(k).length) return; const m = M(); m.aoOpen = k; let key = k;
    const o = document.createElement('div'); o.id = 'mataomod'; o.className = 'matedov mataoov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); document.body.appendChild(o);
    const close = () => { o.remove(); document.removeEventListener('keydown', onK); M().aoOpen = ''; render(); }, onK = (e) => { if (e.key === 'Escape' && !document.querySelector('.matask, .matpop, #matedov')) close(); };
    const paint = () => {
      const items = aoMembers(key); if (!items.length) return close(); const name = aoOf(items[0]), eps = new Set(); items.forEach((x) => tagsOf(x).epoche.forEach((e) => eps.add(e)));
      const pr = aoPair(items), link = items.find((x) => x.pdfFrom), words = items.filter(isWord), pdfs = items.filter((x) => kindOf(x) === 'pdf' && x.file);
      let wp = '';
      if (link && srcOf(link.pdfFrom)) { const w = srcOf(link.pdfFrom), id = link.id.replace(/^mat_/, ''), wid = w.id.replace(/^mat_/, ''); wp = `<div class="mataows"><b>PDF wird automatisch aus der Word-Datei aktualisiert ✓</b><div class="muted sm">„${esc(link.vtitle || link.title)}“ entsteht aus „${esc(w.vtitle || w.title)}“. Speicherst du die Word-Datei neu, wird die PDF im Hintergrund angepasst${link.pdfAt ? ' · zuletzt ' + esc(new Date(link.pdfAt).toLocaleString('de-AT')) : ''}.${SY.msg[link.id] ? ' <span style="color:var(--bad,#b3261e)">Fehler: ' + esc(SY.msg[link.id]) + '</span>' : ''}${SY.ok === false ? ' <span style="color:var(--bad,#b3261e)">Der Server kann noch kein Word → PDF (LibreOffice fehlt, Container neu bauen).</span>' : ''}</div><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-aosync="${id}">Jetzt aktualisieren</button><label class="btn sm" style="cursor:pointer">Neue Word-Datei hochladen<input type="file" accept=".doc,.docx" hidden data-aorep="${wid}"></label><button class="btn sm bad" data-aounlink="${id}">Verknüpfung lösen</button></div></div>`; }
      else if (pr) wp = `<div class="mataows"><b>Word- und PDF-Datei erkannt</b><div class="muted sm">Soll die PDF „${esc(pr.p.vtitle || pr.p.title)}“ immer aus der Word-Datei „${esc(pr.w.vtitle || pr.w.title)}“ entstehen? Dann wird sie bei jeder Änderung der Word-Datei automatisch neu erzeugt (überschreibt die bisherige PDF).</div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm good" data-aolink="${pr.p.id.replace(/^mat_/, '')}" data-w="${pr.w.id.replace(/^mat_/, '')}">Automatisch aktualisieren einschalten</button></div></div>`;
      else if (words.length && pdfs.length) wp = `<div class="mataows"><b>Word → PDF</b><div class="muted sm">Für die automatische Aktualisierung braucht der Arbeitsauftrag genau eine Word- und eine PDF-Datei.</div></div>`;
      const keep = o.querySelector('.matedbox'), top = keep ? keep.scrollTop : 0;
      o.innerHTML = `<div class="matedbox"><button class="btn sm matedx" data-edx aria-label="Schließen">Schließen ✕</button><h2 style="margin:0 0 10px">Arbeitsauftrag</h2>
        <div class="kmkvr"><span class="kmk">Name</span><span class="kmv"><input class="matin" id="mataoname" value="${esc(name)}" aria-label="Name des Arbeitsauftrags"></span></div>
        <div class="kmkvr"><span class="kmk">Epoche</span><span class="kmv chips">${EPOCHS.map((x) => `<button class="mattag ep sel${eps.has(x) ? ' on' : ''}"${epS(x)} data-aoep="${esc(x)}">${esc(x)}</button>`).join('')}<small class="muted" style="align-self:center">gilt für alle Dateien</small></span></div>
        <div class="muted sm" style="margin:12px 0 4px">Dateien (${items.length})</div>
        ${items.map((x) => { const id = x.id.replace(/^mat_/, ''); return `<div class="kmli matpendr"><span class="matth2${/^(buch|pdf|epub)$/.test(kindOf(x)) ? ' matportrait' : ''}">${thumbOf(x)}</span><span style="flex:1;min-width:0"><b>${esc(x.vtitle || x.title)}</b><br><small class="muted">${esc((KINDS.find(([kk]) => kk === kindOf(x)) || [0, ''])[1])}${isWord(x) ? ' · Word' : ''}${x.pdfFrom ? ' · aus Word erzeugt' : ''}</small></span><button class="btn sm" data-act="matpop" data-id="${id}">Ansehen</button><button class="btn sm" data-act="matpedit" data-id="${id}">Bearbeiten</button><button class="btn sm bad" data-act="matdiscard" data-verb="löschen" data-id="${id}" title="Datei löschen">Löschen</button></div>`; }).join('')}
        ${wp}</div>`;
      const nb = o.querySelector('.matedbox'); if (nb) { place(nb); nb.scrollTop = top; }
    };
    /* Popup direkt über (sonst unter) der angeklickten Kachel */
    const place = (nb) => {
      if (!anchor || !document.body.contains(anchor)) return; const r = anchor.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, w = Math.min(760, vw - 24), above = r.top - 14, below = vh - r.bottom - 14;
      nb.style.width = w + 'px'; nb.style.left = Math.max(12, Math.min(r.left, vw - w - 12)) + 'px';
      if (above >= 300 || above >= below) { nb.style.top = 'auto'; nb.style.bottom = (vh - r.top + 8) + 'px'; nb.style.maxHeight = Math.max(160, above - 8) + 'px'; }
      else { nb.style.bottom = 'auto'; nb.style.top = (r.bottom + 8) + 'px'; nb.style.maxHeight = Math.max(160, below - 8) + 'px'; }
    };
    o.addEventListener('click', async (e) => {
      if (e.target === o || e.target.closest('[data-edx]')) return close();
      const ep = e.target.closest('[data-aoep]'); if (ep) { aoSetEpoch(key, ep.dataset.aoep); return setTimeout(paint, 120); }
      const lk = e.target.closest('[data-aolink]'); if (lk) { const p = srcOf(lk.dataset.aolink); if (p) put('settings', Object.assign({}, p, { pdfFrom: lk.dataset.w })); setTimeout(() => { paint(); syncPdfs(false); }, 150); return; }
      const ul = e.target.closest('[data-aounlink]'); if (ul) { const p = srcOf(ul.dataset.aounlink); if (p) { const o2 = Object.assign({}, p); delete o2.pdfFrom; put('settings', o2); } return setTimeout(paint, 150); }
      const sy = e.target.closest('[data-aosync]'); if (sy) { toast('PDF wird erstellt …'); const n = await syncPdfs(true, sy.dataset.aosync); if (!n) toast('Nicht aktualisiert: ' + (SY.msg['mat_' + sy.dataset.aosync] || 'Server nicht erreichbar oder LibreOffice fehlt')); return paint(); }
      setTimeout(() => { if (document.getElementById('mataomod')) paint(); }, 250);
      if (e.target.closest('[data-verb]')) setTimeout(() => { if (document.getElementById('mataomod')) paint(); }, 1200);
    });
    o.addEventListener('change', async (e) => {
      const rp = e.target.closest && e.target.closest('[data-aorep]'); if (rp && rp.files[0]) { const f = rp.files[0]; rp.value = ''; toast('Word-Datei wird hochgeladen …'); try { await replaceWord(rp.dataset.aorep, f); const l = sources().find((x) => x.pdfFrom === rp.dataset.aorep); if (l) await syncPdfs(true, l.id.replace(/^mat_/, '')); } catch (er) { toast('Fehler: ' + (er.message || er)); } return paint(); }
      if (e.target.id === 'mataoname') { const nn = e.target.value.trim(); if (!nn) return paint(); aoMembers(key).forEach((s) => put('settings', Object.assign({}, s, { ao: nn }))); key = norm(nn); M().aoOpen = key; setTimeout(paint, 150); }
    });
    document.addEventListener('keydown', onK); paint();
  }
  /* Arbeitsauftrags-Kachel auf eine Epoche ziehen = alle Dateien in diese Epoche verschieben */
  { let aodrag = null;
    document.addEventListener('dragstart', (e) => { const t = e.target.closest && e.target.closest('.mataot'); if (!t) return; aodrag = t.dataset.aok; try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'ao:' + aodrag); } catch (x) { /* */ } t.classList.add('drag'); });
    const chipEp = (e) => e.target && e.target.closest && e.target.closest('.matep[data-v]');
    document.addEventListener('dragover', (e) => { if (!aodrag) return; const c = chipEp(e); if (c && c.dataset.v) { e.preventDefault(); c.classList.add('aoover'); } });
    document.addEventListener('dragleave', (e) => { const c = chipEp(e); if (c) c.classList.remove('aoover'); });
    document.addEventListener('drop', (e) => { if (!aodrag) return; const c = chipEp(e), k = aodrag; aodrag = null; document.querySelectorAll('.aoover').forEach((x) => x.classList.remove('aoover')); if (!c || !c.dataset.v) return; e.preventDefault(); e.stopImmediatePropagation(); aoSetEpoch(k, c.dataset.v); toast('Arbeitsauftrag nach „' + c.dataset.v + '“ verschoben'); }, true);
    document.addEventListener('dragend', () => { aodrag = null; document.querySelectorAll('.mataot.drag,.aoover').forEach((x) => x.classList.remove('drag', 'aoover')); }); }
  function openEdit(id) {
    if (document.getElementById('matedov')) return; const first = srcOf(id); if (!first) return;
    const o = document.createElement('div'); o.id = 'matedov'; o.className = 'matedov'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); document.body.appendChild(o);
    const paint = () => { const s2 = srcOf(id); if (!s2) return close(); const keep = o.querySelector('.matedbox'), top = keep ? keep.scrollTop : 0; o.innerHTML = `<div class="matedbox"><button class="btn sm matedx" data-edx aria-label="Schließen">Schließen ✕</button>${editCard(s2).replace(' style="margin-top:14px"', '')}</div>`; const nb = o.querySelector('.matedbox'); if (nb) nb.scrollTop = top; };
    const close = () => { o.remove(); document.removeEventListener('keydown', onK); render(); }, onK = (e) => { if (e.key === 'Escape' && !document.querySelector('.matask, .matpop')) close(); };
    const later = () => { setTimeout(() => { const a = document.activeElement; if (!document.body.contains(o)) return; if (a && o.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return; paint(); }, 150); };
    o.addEventListener('click', (e) => { if (e.target === o || e.target.closest('[data-edx]')) return close(); const sv = e.target.closest('[data-act="matopen"]'); if (sv) { e.stopPropagation(); return close(); } later(); });
    o.addEventListener('change', later); document.addEventListener('keydown', onK); paint();
  }
  if (!document.getElementById('matedcss')) { const st2 = document.createElement('style'); st2.id = 'matedcss'; st2.textContent = '.matedov{position:fixed;inset:0;z-index:8000;background:rgba(10,12,8,.65);display:flex;align-items:flex-start;justify-content:center;padding:3vh 2vw;overflow:auto}.matedbox{background:var(--bg,#f4f6ef);border-radius:14px;max-width:980px;width:100%;padding:12px 14px;position:relative}.matedx{position:absolute;right:14px;top:12px;z-index:2}.matedbox>.card{margin-top:0;padding-top:34px}'; document.head.appendChild(st2); }
  /* Schnittstelle für die Stundenseite: Quellen auflisten und anzeigen */
  const list = () => sources().map((s) => ({ id: s.id.replace(/^mat_/, ''), title: s.vtitle || s.title || 'Quelle', file: dlPath(s), url: s.url || '', kind: kindOf(s), kindLabel: (KINDS.find(([k]) => k === kindOf(s)) || [0, ''])[1], thumb: thumbOf(s), ep: tagsOf(s).epoche, ao: aoOf(s), hay: norm([s.title, s.vtitle, s.channel, s.author, aoOf(s), ...tagsOf(s).epoche, ...tagsOf(s).tags, ...tagsOf(s).keys].join(' ')) }));
  return { view, picker, adder, take: (files, text, att) => intake(files, text, att), list, edit: openEdit, epochs: EPOCHS, epS, makeTest };
})();
