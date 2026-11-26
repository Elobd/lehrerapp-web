/* Lehrmaterial erarbeiten: Quellen wählen, Optionen setzen, „Material erstellen“ – die KI schreibt, der Server baut Word/PowerPoint/Excel. */
(() => {
  const BS = [['arbeitsblatt', 'Arbeitsblatt', 'offene Fragen, mit Lösung'], ['luecken', 'Lückentext & Kreuzworträtsel', 'jeweils mit Lösung'], ['single', 'Check-up Single Choice', '20 Fragen'], ['multiple', 'Check-up Multiple Choice', '20 Fragen'], ['wdh', 'Mündliche Wiederholungen', '20 kurze Wiederholungen'], ['praesentation', 'Präsentation', 'PowerPoint mit Vorlage']];
  const EX = [['kahoot', 'Kahoot'], ['plickers', 'Plickers'], ['forms', 'MS Forms']];
  const E = () => (U.erb = U.erb || { f: { titel: '', thema: '', klasse: '5', epoche: 'Neuzeit', zeitraum: '', jahr: '', seiten: '10', folien: 'mittel', notizen: '', quellenmodus: 'web', bs: Object.fromEntries(BS.map((b) => [b[0], true])), ex: { kahoot: true, plickers: true, forms: true } }, sel: new Set(), q: '', items: null, vorlage: null, ai: null, job: null, loading: false, est: null });
  const load = () => { const s = E(); if (s.loading) return; s.loading = true; fetch('/api/auftraege', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { s.items = j.items || []; s.vorlage = !!j.vorlage; s.ai = !!j.ai; s.loading = false; render(); }).catch(() => { s.items = []; s.loading = false; render(); }); };
  const EP = ['Vor- und Frühgeschichte', 'Antike', 'Mittelalter', 'Neuzeit', 'Zeitgeschichte'];
  const usd = (v) => (v == null ? '–' : (v < 0.01 ? '< 0,01' : v.toFixed(2).replace('.', ',')) + ' $');
  const jpLines = (k) => String(((S.settings.jahresplan || {})['g' + k]) || '').split('\n').filter((l) => l.trim());
  // Themen der Jahresplanung einer Klassenstufe, mit Abschnitt (## Überschrift)
  const jpTopics = (k) => { let sec = ''; const out = []; jpLines(k).forEach((l) => { if (/^##\s*/.test(l)) { sec = l.replace(/^##\s*/, '').trim(); return; } out.push({ slug: jpSlug(l), title: l.replace(/\s*\(\d+\s*Std\.?\)\s*$/, '').trim(), sec }); }); return out; };
  const nrm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();
  window.erbItems = () => { const s = E(); if (s.items === null) load(); return s.items || []; };
  window.erbPrefill = (f, slug) => { const s = E(); Object.assign(s.f, f); s.f.klasse = String(f.klasse || s.f.klasse); s.f.thema = slug || ''; s.fromSlug = slug || ''; };
  const estimate = () => { const s = E(), f = s.f, bs = BS.filter((b) => f.bs[b[0]]).map((b) => b[0]), key = [bs.join(','), f.quellenmodus === 'web' ? 1 : 0, s.sel.size, f.seiten, f.folien].join('|');
    if (s.est && s.est.key === key) return s.est; s.est = { key, v: null };
    fetch('/api/auftrag/schaetzung?bs=' + bs.join(',') + '&web=' + (f.quellenmodus === 'web' ? 1 : 0) + '&eigen=' + s.sel.size + '&seiten=' + f.seiten + '&folien=' + f.folien, { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { if (s.est && s.est.key === key) { s.est.v = j; const el = document.getElementById('erbest'); if (el) el.innerHTML = estHtml(j); } }).catch(() => {});
    return s.est; };
  const estHtml = (j) => (j && j.usd != null ? `<b>ca. ${usd(j.usd)}</b> <span class="muted sm">${j.basis === 'verlauf' ? `Durchschnitt deiner bisherigen ${j.n} Aufträge` : j.basis === 'gemischt' ? 'teils aus bisherigen Aufträgen, teils geschätzt' : 'grobe Schätzung – wird mit jedem Auftrag genauer'}</span>` : '<span class="muted sm">wird berechnet …</span>');
  const chip = (it, b, busy) => `<button class="erbchip ${b.has ? 'ok' : 'miss'}" data-act="erbbsx" data-id="${esc(it.id)}" data-k="${esc(b.k)}" data-has="${b.has ? 1 : ''}" data-n="${esc(b.n)}"${busy ? ' disabled' : ''} title="${b.has ? 'Vorhanden – antippen, um neu zu erstellen' : 'Fehlt – antippen, um zu ergänzen'}">${b.has ? '✓' : '+'} ${esc(b.n.replace(/ \(.*\)$/, ''))}</button>`;
  const itemHtml = (it, busy, open) => `<div class="erbit"><div class="erbith">${it.cover ? `<img src="/api/file?path=${encodeURIComponent(it.dir + '/' + it.cover)}" alt="">` : '<span class="erbnoc"></span>'}<div class="erbitt"><b>${esc(it.titel)}</b><small class="muted">${esc(it.klasse)}. Klasse · ${esc(it.epoche)}${it.usd != null ? ' · Kosten ' + usd(it.usd) : ''}</small></div></div>
      <div class="erbchips">${(it.bs || []).map((b) => chip(it, b, busy)).join('')}</div>
      <details class="erbfiles"${open ? ' open' : ''}><summary>Dateien (${it.files.length})</summary><div class="erbfl">${it.files.map((fn) => `<a href="/api/file?path=${encodeURIComponent(it.dir + '/' + fn)}" download>${esc(fn)}</a>`).join('')}</div><div class="row" style="gap:6px;margin-top:8px"><label class="btn sm" style="cursor:pointer">Cover tauschen<input type="file" accept="image/*" hidden data-ch="erbcov" data-id="${esc(it.id)}"></label><button class="btn sm bad" data-act="erbdel" data-id="${esc(it.id)}">Löschen</button></div></details></div>`;
  window.erarbView = function () {
    const s = E(); if (s.items === null) load(); const f = s.f, k = +f.klasse || 5;
    const lib = typeof MAT !== 'undefined' && MAT.list ? MAT.list() : [], words = norm(s.q || '').split(/\s+/).filter(Boolean), res = lib.filter((m) => s.sel.has(m.id) || !words.length || words.every((w) => m.hay.includes(w))).slice(0, 60);
    const opt = (v, t, cur) => `<option value="${esc(v)}"${String(cur) === String(v) ? ' selected' : ''}>${esc(t)}</option>`;
    const job = s.job, busy = job && job.state === 'laeuft', items = s.items || [];
    const status = job ? `<div id="erbstat" class="erbstat ${job.state}"><b>${job.state === 'laeuft' ? 'Wird erstellt …' : job.state === 'fertig' ? '✓ Fertig' : 'Fehler'}</b> <span id="erbmsg">${esc(job.msg || '')}</span>${job.state === 'fertig' && job.usd != null ? `<div class="sm" style="margin-top:4px">Kosten bei Anthropic: <b>${usd(job.usd)}</b></div>` : ''}${job.warn ? `<div class="muted sm" style="margin-top:4px">${esc(job.warn)}</div>` : ''}${busy ? `<div class="erbbarw"><i id="erbbar" style="width:${Math.round(((job.step || 0) / (job.total || 9)) * 100)}%"></i></div>` : ''}</div>` : '';
    const tps = jpTopics(k); let lastSec = null;
    const jpSel = tps.length ? `<label class="f erbf"><span class="lsl">Thema aus der Jahresplanung (${k}. Klasse)</span><select class="kminp" data-ch="erbjp" aria-label="Thema aus der Jahresplanung"><option value=""${f.thema ? '' : ' selected'}>– Thema wählen –</option>${tps.map((t) => { const h = t.sec !== lastSec && t.sec ? `<option disabled>— ${esc(t.sec)} —</option>` : ''; lastSec = t.sec; return h + opt(t.slug, t.title, f.thema); }).join('')}</select></label>` : `<p class="muted sm" style="margin:4px 0">Für die ${k}. Klasse ist noch keine Jahresplanung eingetragen (Material → Jahresplanung).</p>`;
    const cTop = `<section class="card erbc"><div class="erbh"><span class="erbn">1</span><h2>Klasse und Thema</h2></div>
      <nav class="tscats spdisc2 erbkl" aria-label="Klassenstufe">${[5, 6, 7, 8].map((q) => `<div class="tscat${q === k ? ' on' : ''}" data-act="erbkl" data-v="${q}" role="button" tabindex="0">${q}. Klasse</div>`).join('')}</nav>
      ${jpSel}
      <label class="f erbf"><span class="lsl">Thema / Titel des Arbeitsauftrags</span><input class="kminp" data-ch="erbf" data-f="titel" value="${esc(f.titel || '')}" placeholder="z. B. Der Buchdruck – frei eingeben oder oben wählen" autocomplete="off"></label>
      <label class="f erbf"><span class="lsl">Epoche</span><select class="kminp" data-ch="erbf" data-f="epoche">${EP.map((e) => opt(e, e, f.epoche)).join('')}</select></label>
      <details class="erbmore"><summary>Weitere Angaben (optional)</summary><div class="erbg2"><label class="f erbf"><span class="lsl">Zeitraum</span><input class="kminp" data-ch="erbf" data-f="zeitraum" value="${esc(f.zeitraum || '')}" placeholder="z. B. 1450–1517"></label><label class="f erbf"><span class="lsl">Jahr (Titelfolie, Sortierung)</span><input class="kminp" data-ch="erbf" data-f="jahr" value="${esc(f.jahr || '')}" placeholder="z. B. 1450"></label></div><label class="f erbf"><span class="lsl">Wünsche und Schwerpunkte</span><textarea class="kminp" rows="3" data-ch="erbf" data-f="notizen" placeholder="z. B. mehr Personen, Quellenarbeit, Bezug zu Österreich …">${esc(f.notizen || '')}</textarea></label></details></section>`;
    // Schon vorhanden zu diesem Thema
    const tn = nrm(f.titel), same = items.filter((it) => (f.thema && it.thema === f.thema) || (tn && nrm(it.titel) === tn));
    const cHave = same.length ? `<section class="card erbc erbhave"><div class="erbh"><span class="erbn">✓</span><h2>Zu diesem Thema schon vorhanden</h2></div><p class="muted sm" style="margin:0 0 6px">✓ = fertig, + = fehlt. Antippen, um einen Baustein zu ergänzen oder neu zu erstellen – der Rest bleibt unverändert.</p>${same.map((it) => itemHtml(it, busy, false)).join('')}</section>` : '';
    const cSrc = `<section class="card erbc"><div class="erbh"><span class="erbn">2</span><h2>Quellen</h2></div>
      <label class="f erbf"><span class="lsl">Woher nimmt die KI ihr Wissen?</span><select class="kminp" data-ch="erbf" data-f="quellenmodus">${[['web', 'Internet-Recherche + meine Quellen (empfohlen)'], ['eigen', 'Nur meine Quellen'], ['wissen', 'Nur KI-Fachwissen (ohne Internet)']].map(([v, t]) => opt(v, t, f.quellenmodus)).join('')}</select></label>
      <details class="erbmore"${s.sel.size ? ' open' : ''}><summary>Eigene Quellen aus der Bibliothek (${s.sel.size} gewählt)</summary><input class="kminp" data-ch="erbq" value="${esc(s.q)}" placeholder="Material suchen …" aria-label="Material suchen" style="width:100%;box-sizing:border-box;margin:6px 0">
      ${res.length ? `<div class="erbsrc">${res.map((m) => `<label class="kmchk"><input type="checkbox" data-ch="erbsel" data-id="${esc(m.id)}"${s.sel.has(m.id) ? ' checked' : ''}><span><b>${esc(m.title)}</b> <small class="muted">${esc(m.kindLabel)}${m.ep.length ? ' · ' + esc(m.ep.join(', ')) : ''}</small></span></label>`).join('')}</div>` : '<div class="muted sm">Keine Quellen gefunden (Material → Bibliothek).</div>'}</details></section>`;
    const anyCk = f.bs.single || f.bs.multiple;
    const cBs = `<section class="card erbc"><div class="erbh"><span class="erbn">3</span><h2>Was soll erstellt werden?</h2></div>
      <div class="erbbs"><label class="erbbx on dis"><input type="checkbox" checked disabled><span><b>Textblatt</b><small>immer dabei – Grundlage für alles</small></span></label>${BS.map(([key, n, d]) => `<label class="erbbx${f.bs[key] ? ' on' : ''}"><input type="checkbox" data-ch="erbbs2" data-k="${key}"${f.bs[key] ? ' checked' : ''}><span><b>${n}</b><small>${d}</small></span></label>`).join('')}</div>
      <div class="erbex${anyCk ? '' : ' dis'}"><span class="lsl">Quiz-Exporte aus den Check-ups</span><div class="row" style="gap:8px;flex-wrap:wrap">${EX.map(([key, n]) => `<label class="erbbx sm${f.ex[key] && anyCk ? ' on' : ''}"><input type="checkbox" data-ch="erbex" data-k="${key}"${f.ex[key] ? ' checked' : ''}${anyCk ? '' : ' disabled'}><span><b>${n}</b></span></label>`).join('')}</div></div>
      <div class="erbg2"><label class="f erbf"><span class="lsl">Länge des Textblatts</span><select class="kminp" data-ch="erbf" data-f="seiten">${[['10', 'ca. 10 Seiten'], ['14', 'ca. 14 Seiten'], ['18', 'ca. 18 Seiten']].map(([v, t]) => opt(v, t, f.seiten)).join('')}</select></label>${f.bs.praesentation ? `<label class="f erbf"><span class="lsl">Länge der Präsentation</span><select class="kminp" data-ch="erbf" data-f="folien">${[['kurz', 'kurz (ca. 15 Folien)'], ['mittel', 'mittel (ca. 25 Folien)'], ['ausfuehrlich', 'ausführlich (ca. 40 Folien)']].map(([v, t]) => opt(v, t, f.folien)).join('')}</select></label>` : ''}</div>
      ${f.bs.praesentation && s.vorlage === false ? `<div class="muted sm" style="margin-top:6px">Für die Präsentation fehlt noch die Vorlage (.pptx): <label class="btn sm" style="cursor:pointer">Vorlage wählen<input type="file" accept=".pptx" hidden data-ch="erbvl"></label></div>` : ''}</section>`;
    const est = estimate();
    const cGo = `<section class="card erbc erbgo"><div class="erbh"><span class="erbn">4</span><h2>Erstellen</h2></div>${s.ai === false ? `<div class="erbwarn">KI ist noch nicht eingerichtet. <a href="#ki" data-act="setnav" data-v="ki">Einstellungen → KI-Schlüssel ›</a></div>` : ''}
      <div class="erbcost"><span class="lsl">Voraussichtliche Kosten</span><div id="erbest">${estHtml(est.v)}</div><div class="muted sm">Abgerechnet von Anthropic in US-Dollar. Nach dem Erstellen siehst du die tatsächlichen Kosten.</div></div>
      <div class="row" style="gap:10px;align-items:center;margin-top:10px;flex-wrap:wrap"><button class="btn good" data-act="erbgo"${busy || s.ai === false ? ' disabled' : ''}>${busy ? 'Wird erstellt …' : 'Material erstellen'}</button><span class="muted sm">Dauert einige Minuten – die Seite kann offen bleiben.</span></div>${status}</section>`;
    const cList = `<section class="card erbc"><div class="hd"><div class="hl"><h2>Alle Arbeitsaufträge</h2></div><button class="btn sm" data-act="erbnum" title="Ordnernummern nach Klasse, Epoche und Jahr neu vergeben">Nummerierung aktualisieren</button></div>${items.length ? [5, 6, 7, 8].map((q) => { const l = items.filter((it) => +it.klasse === q); return l.length ? `<h3 class="erbsec">${q}. Klasse</h3>${l.map((it) => itemHtml(it, busy, false)).join('')}` : ''; }).join('') : '<div class="muted sm">Noch nichts erstellt.</div>'}</section>`;
    return setBar('erarbeiten') + `<div class="erbwrap">${cTop}${cHave}${cSrc}${cBs}${cGo}${cList}</div>`;
  };
  /* Einstellungen → KI-Schlüssel */
  window.kiPage = function () {
    const s = E(); if (s.ki === undefined && !s.kiLoading) { s.kiLoading = true; fetch('/api/ki-schluessel', { credentials: 'same-origin' }).then((r) => r.json()).then((j) => { s.ki = !!j.gesetzt; s.kiLoading = false; render(); }).catch(() => { s.ki = false; s.kiLoading = false; }); }
    if (s.items === null) load(); const tot = (s.items || []).reduce((a, it) => a + (it.usd || 0), 0), nK = (s.items || []).filter((it) => it.usd != null).length;
    return `<div class="sch"><section class="dd"><div class="ddh" style="background:#1E293B;color:#fff"><b>KI-Schlüssel (Anthropic)</b></div>
      <div class="rw"><small>Status</small><b>${s.ki === undefined ? '…' : s.ki ? '✓ Schlüssel hinterlegt' : 'Kein Schlüssel hinterlegt'}</b></div>
      <div class="rw"><small>Wofür ist das?</small><span class="v" style="white-space:normal">Mit diesem Schlüssel greift die App auf die KI von Anthropic (Claude) zu. Gebraucht wird er für: <b>Lehrmaterial erarbeiten</b> (Textblatt, Arbeitsblätter, Check-ups, Präsentation), <b>Baustein ergänzen</b>, die <b>Einzelstunden-Planung</b> in der Jahresplanung, <b>KI-Tests</b> in den Leistungen, das <b>Auslesen von Turnbefreiungen</b> und das <b>Ergänzen offener Stunden</b>. Jeder Aufruf kostet etwas Guthaben auf deinem Anthropic-Konto (console.anthropic.com → Billing).</span></div>
      <div class="rw"><small>Woher bekomme ich ihn?</small><span class="v" style="white-space:normal">console.anthropic.com → API Keys → „Create Key“. Er beginnt mit <b>sk-ant-</b>. Er wird nur auf deiner NAS gespeichert, nie angezeigt und nie ins Repo übertragen.</span></div>
      <div class="rw"><div class="row" style="gap:6px;flex-wrap:wrap;width:100%"><input class="kminp" id="kikey" type="password" autocomplete="off" placeholder="sk-ant-…" style="flex:1;min-width:200px"><button class="btn good" data-act="kisave">Speichern</button><button class="btn" data-act="kitest">Verbindung testen</button>${s.ki ? '<button class="btn bad sm" data-act="kidel">Entfernen</button>' : ''}</div><div id="kimsg" class="sm" style="margin-top:6px"></div></div>
      <div class="rw"><small>Bisherige Kosten für Arbeitsaufträge</small><b>${nK ? usd(tot) + ' (' + nK + ' Aufträge mit Kostenerfassung)' : 'noch keine erfasst'}</b></div></section></div>`;
  };
  const poll = (id) => { const s = E(); const t = setInterval(async () => { try { const j = await (await fetch('/api/auftrag/status?id=' + id, { credentials: 'same-origin' })).json(); s.job = Object.assign(s.job || {}, j); const m = document.getElementById('erbmsg'), b = document.getElementById('erbbar'); if (m) m.textContent = j.msg || ''; if (b) b.style.width = Math.round(((j.step || 0) / (j.total || 9)) * 100) + '%'; if (j.state !== 'laeuft') { clearInterval(t); if (j.state === 'fertig' && s.job && s.job.slug) { const slug = s.job.slug, d = S.settings.jahresplan || { id: 'jahresplan' }, sub = Object.assign({}, d.sub || {}), it = Object.assign({}, sub[slug] || {}); it.auftraege = (it.auftraege || []).concat([{ id, titel: s.job.titel }]); sub[slug] = it; put('settings', Object.assign({}, d, { id: 'jahresplan', sub })); s.job.slug = ''; } s.items = null; s.est = null; render(); } } catch (x) { /* weiter */ } }, 3000); };
  const kimsg = (t, bad) => { const m = document.getElementById('kimsg'); if (m) { m.textContent = t; m.style.color = bad ? '#b3261e' : '#2e7d32'; } };
  const ask = (m, o) => (window.askUI ? window.askUI(m, o) : Promise.resolve(o ? window.prompt(m, '') : window.confirm(m)));
  async function addBs(id, k, has, nm) {
    if (has && !(await ask('„' + nm + '“ neu erstellen? Die bisherigen Dateien dieses Bausteins werden überschrieben, alles andere bleibt unverändert.'))) return;
    const hint = await ask('Wunsch an die KI für „' + nm + '“ (optional, z. B. „leichter“, „Schwerpunkt Alltag“):', { input: true, def: '' }); if (hint == null) return;
    const r = await fetch('/api/auftrag/baustein?id=' + encodeURIComponent(id) + '&k=' + encodeURIComponent(k), { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hinweis: hint }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { toast(j.error || 'Fehler'); return; } const s = E(); s.job = { id: j.id, state: 'laeuft', msg: 'Start …', titel: nm }; toast('„' + nm + '“ wird erstellt – Fortschritt bei „Erstellen“'); poll(j.id); render();
  }
  Object.assign(A, {
    kisave: async () => { const v = (document.getElementById('kikey') || {}).value || ''; const r = await fetch('/api/ki-schluessel', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: v }) }); const j = await r.json().catch(() => ({})); if (!r.ok) return kimsg(j.error || 'Fehler', true); E().ki = true; E().items = null; toast('Schlüssel gespeichert'); render(); setTimeout(() => A.kitest(), 300); },
    kitest: async () => { kimsg('Teste …'); const r = await fetch('/api/ki-test', { method: 'POST', credentials: 'same-origin' }); const j = await r.json().catch(() => ({})); kimsg(r.ok ? '✓ Verbindung zur KI funktioniert.' : 'Fehler: ' + (j.error || r.status), !r.ok); },
    kidel: async () => { if (!(await ask('Gespeicherten Schlüssel entfernen?'))) return; await fetch('/api/ki-schluessel', { method: 'DELETE', credentials: 'same-origin' }); E().ki = false; E().items = null; render(); },
    erbkl: (e) => { const s = E(); s.f.klasse = String(e.dataset.v); s.f.thema = ''; render(); },
    erbbsx: (e) => { addBs(e.dataset.id, e.dataset.k, !!e.dataset.has, e.dataset.n); },
    erbgo: async () => { const s = E(), f = s.f; if (!String(f.titel).trim()) return toast('Bitte ein Thema eingeben oder aus der Jahresplanung wählen'); toast('Quellen werden gelesen …');
      const quellen = []; for (const id of s.sel) { const m = (MAT.list() || []).find((x) => x.id === id); let text = ''; try { text = await MAT.textOf(id); } catch (x) { /* */ } if (text) quellen.push({ ref: m ? m.title : id, text }); }
      const qm = f.quellenmodus === 'eigen' && !quellen.length ? 'wissen' : f.quellenmodus;
      try { const r = await fetch('/api/auftrag/erstellen', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({}, f, { quellen, quellenmodus: qm, bausteine: BS.filter((b) => f.bs[b[0]]).map((b) => b[0]), exporte: f.ex, thema: f.thema || '' })) }); const j = await r.json(); if (!r.ok) return toast(j.error || 'Start fehlgeschlagen'); s.job = { id: j.id, state: 'laeuft', msg: 'Start …', step: 0, total: 9, slug: f.thema || s.fromSlug || '', titel: f.titel }; s.fromSlug = ''; render(); poll(j.id); } catch (x) { toast('Start fehlgeschlagen'); } },
    erbnum: async () => { await fetch('/api/auftrag/nummern', { method: 'POST', credentials: 'same-origin' }); E().items = null; render(); toast('Nummerierung aktualisiert'); },
    erbdel: async (e) => { if (!(await ask('Diesen Arbeitsauftrag mit allen Dateien löschen?'))) return; await fetch('/api/auftrag?id=' + encodeURIComponent(e.dataset.id), { method: 'DELETE', credentials: 'same-origin' }); E().items = null; render(); }
  });
  Object.assign(C, {
    erbf: (e) => { E().f[e.dataset.f] = e.value; if (['epoche', 'quellenmodus', 'seiten', 'folien'].includes(e.dataset.f)) render(); },
    erbjp: (e) => { const s = E(), t = jpTopics(+s.f.klasse || 5).find((x) => x.slug === e.value); s.f.thema = e.value; if (t) { s.f.titel = t.title; const g = typeof window.fpEpGuess === 'function' ? window.fpEpGuess(t.title + ' ' + t.sec) : s.f.epoche; s.f.epoche = g; } render(); },
    erbbs2: (e) => { E().f.bs[e.dataset.k] = e.checked; render(); },
    erbex: (e) => { E().f.ex[e.dataset.k] = e.checked; render(); },
    erbq: (e) => { E().q = e.value; render(); },
    erbsel: (e) => { const s = E(); if (e.checked) s.sel.add(e.dataset.id); else s.sel.delete(e.dataset.id); render(); },
    erbvl: async (e) => { const f = e.files[0]; if (!f) return; const r = await fetch('/api/file?path=' + encodeURIComponent('Material/Vorlage/praesentation.pptx'), { method: 'PUT', body: f, credentials: 'same-origin' }); toast(r.ok ? 'Vorlage gespeichert' : 'Upload fehlgeschlagen'); E().items = null; render(); },
    erbbs: (e) => { const k = e.value, o = e.selectedOptions[0]; e.value = ''; if (k) addBs(e.dataset.id, k, !!o.dataset.has, o.textContent.replace(/^[✓+] /, '').replace(/ – .*$/, '')); },
    erbcov: async (e) => { const f = e.files[0]; if (!f) return; toast('Cover wird getauscht und alle Dokumente werden neu erzeugt …'); const r = await fetch('/api/auftrag/cover?id=' + encodeURIComponent(e.dataset.id), { method: 'POST', body: f, credentials: 'same-origin' }); const j = await r.json().catch(() => ({})); toast(r.ok ? 'Cover getauscht, Dokumente aktualisiert' : (j.error || 'Fehler')); E().items = null; render(); }
  });
  const st = document.createElement('style'); st.id = 'erb46'; st.textContent = `
.erbwrap{display:grid;gap:12px}
.erbc{margin:0}.erbh{display:flex;align-items:center;gap:10px;margin-bottom:10px}.erbh h2{margin:0}
.erbn{flex:none;width:28px;height:28px;border-radius:7px;background:#d99a26;color:#fff;display:grid;place-items:center;font-weight:800;font-size:14px}
.erbf{display:block;margin:8px 0}.erbf .kminp{width:100%;box-sizing:border-box}
.erbkl{margin:0 0 6px;flex-wrap:wrap}
.erbmore{margin-top:8px;border-top:1px solid var(--line,#e5e7eb);padding-top:8px}.erbmore>summary{cursor:pointer;font-weight:700;font-size:14px;color:#475569}
.erbg2{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:0 12px}
.erbsrc{max-height:260px;overflow:auto;border:1px solid var(--line,#e5e7eb);border-radius:8px;padding:4px 8px}.erbsrc .kmchk{display:flex;gap:8px;align-items:center;padding:5px 0;margin:0}
.erbbs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.erbbx{display:flex;gap:10px;align-items:flex-start;border:1.5px solid #d6dde6;border-radius:8px;padding:9px 10px;cursor:pointer;background:#fff}
.erbbx.on{border-color:#d99a26;background:#fdf6e9}.erbbx.dis{opacity:.75;cursor:default}.erbbx input{margin-top:3px;accent-color:#d99a26}
.erbbx span{display:flex;flex-direction:column;min-width:0}.erbbx small{color:#64748b;font-size:12px}.erbbx.sm{padding:6px 10px}
.erbex{margin:12px 0 4px}.erbex.dis{opacity:.5}
.erbcost{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}.erbcost #erbest{margin:2px 0;font-size:16px}
.erbwarn{background:#fdecea;color:#b3261e;border-radius:8px;padding:8px 10px;margin-bottom:8px;font-weight:600}
.erbstat{margin-top:10px;border-radius:8px;padding:10px 12px;background:#f1f5f9}.erbstat.fehler{background:#fdecea}.erbstat.fertig{background:#edf7ee}
.erbbarw{height:6px;border-radius:3px;background:#ddd;margin-top:6px}.erbbarw i{display:block;height:6px;border-radius:3px;background:#d99a26}
.erbit{border-top:1px solid var(--line,#e5e7eb);padding:10px 0}.erbith{display:flex;gap:10px;align-items:center}.erbith img,.erbnoc{width:84px;height:47px;object-fit:cover;border-radius:6px;flex:none;background:#eef1f5}
.erbitt{display:flex;flex-direction:column;min-width:0}.erbitt b{font-size:15px}
.erbchips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 4px}
.erbchip{border:1.5px solid;border-radius:7px;padding:4px 9px;font-weight:700;font-size:12.5px;font-family:inherit;cursor:pointer;background:#fff}
.erbchip.ok{border-color:#86c79a;color:#1f7a3a;background:#edf7ee}.erbchip.miss{border-color:#d6dde6;color:#64748b;border-style:dashed}.erbchip:disabled{opacity:.5;cursor:default}
.erbfiles>summary{cursor:pointer;color:#475569;font-size:13px;font-weight:600}.erbfl{display:flex;flex-direction:column;gap:3px;margin-top:6px;font-size:13px;word-break:break-word}
.erbsec{margin:14px 0 4px;font-size:15px;color:#d99a26;text-transform:uppercase;letter-spacing:.04em}
`; document.head.appendChild(st);
  setTimeout(() => { try { if (U.view === 'erarbeiten' || U.view === 'ki') render(); } catch (x) { /* */ } }, 0);
})();

/* ===== Jahresfahrplan (früher fahrplan.js) ===== */
/* Jahresfahrplan: Themen der Jahresplanung (mit „(n Std.)“) → KI plant die Einzelstunden → Zuordnung auf die Unterrichtstage aller Klassen der Stufe → abhaken, Nicht-Geschafftes rückt nach. */
(() => {
  const jp = () => S.settings.jahresplan || { id: 'jahresplan' };
  const F = () => (U.fp = U.fp || { busy: false, msg: '', ask: false, mode: 'web', stop: false });
  const epGuess = (t) => { t = String(t).toLowerCase(); return /antike|römer|griech|ägypt/.test(t) ? 'Antike' : /mittelalter|ritter|burg|kreuzz|karoling/.test(t) ? 'Mittelalter' : /steinzeit|urgeschicht|frühgeschicht|eiszeit|jäger/.test(t) ? 'Vor- und Frühgeschichte' : /weltkrieg|nationalsozial|zweite republik|kalter krieg/.test(t) ? 'Zeitgeschichte' : 'Neuzeit'; };
  window.fpEpGuess = epGuess;
  const topics = (k) => String(jp()['g' + k] || '').split('\n').filter((l) => l.trim() && !/^##\s*/.test(l)).map((l) => { const m = l.match(/\((\d+)\s*Std\.?\)\s*$/); return { slug: jpSlug(l), title: l.replace(/\s*\(\d+\s*Std\.?\)\s*$/, '').trim(), n: m ? Math.max(1, Math.min(12, +m[1])) : 1 }; });
  const store = (k) => (((jp().fp || {})['g' + k]) || {});
  const seq = (k) => { const st = store(k), out = []; topics(k).forEach((t) => (st[t.slug] || []).forEach((u, i, a) => out.push(Object.assign({}, u, { key: t.slug + '#' + i, slug: t.slug, label: t.title + (a.length > 1 ? ' (' + (i + 1) + '/' + a.length + ')' : '') + ': ' + (u.thema || '') })))); return out; };
  const groupsOf = (k) => groups().filter((G) => !G.sprech && subjKind(G.subject) === 'gpb' && parseInt(G.label) === k);
  const putUnits = (k, slug, list) => { const d = jp(), fp = Object.assign({}, d.fp || {}), g = Object.assign({}, fp['g' + k] || {}); g[slug] = list; fp['g' + k] = g; put('settings', Object.assign({}, d, { id: 'jahresplan', fp })); };
  const hasInfo = (x) => (Array.isArray(x.abs) && x.abs.length) || x.chk || (Array.isArray(x.sn) && x.sn.length);

  // Einheiten auf die künftigen Unterrichtstage legen; erledigte bleiben, offene rücken nach
  function apply(k) {
    const sq = seq(k), res = { placed: 0, over: 0, classes: 0 }; if (!sq.length) return res; const sub = jp().sub || {};
    groupsOf(k).forEach((G) => {
      const log0 = Array.isArray(cinfo(G.slug).log) ? cinfo(G.slug).log : [], done = new Set(log0.filter((x) => x.fp && x.fp.st === 'ok').map((x) => x.fp.k)), rest = sq.filter((u) => !done.has(u.key));
      const dates = lessonDates(G, null, 0, dayDiff(JP_END)).filter((d) => d >= TODAY && d <= JP_END); let qi = 0; res.classes++;
      saveLog(G.slug, (log) => {
        for (let i = log.length - 1; i >= 0; i--) { const x = log[i]; if (x.auto && !(x.fp && x.fp.st) && x.date >= TODAY) { if (hasInfo(x)) { ['text', 'plan', 'ph', 'mats', 'auto', 'fp', 'af'].forEach((f) => delete x[f]); } else log.splice(i, 1); } }
        dates.forEach((d) => {
          const ex = log.filter((x) => x.date === d); if (ex.some((x) => (x.fp && x.fp.st) || (x.text && String(x.text).trim()))) return; if (qi >= rest.length) return;
          const u = rest[qi++]; let e = ex[0]; if (!e) { e = { id: uid('l'), date: d, text: '' }; log.push(e); }
          const mats = ((sub[u.slug] || {}).mats || []).slice();
          Object.assign(e, { text: u.label, plan: ['Ziele: ' + (u.ziele || ''), 'Inhalt: ' + (u.inhalt || ''), 'Methoden: ' + (u.methoden || '')].join('\n'), ph: (u.ph || []).map((p) => ({ id: uid('p'), t: p.t, m: p.m })), auto: true, fp: { k: u.key } });
          if (u.ha && !e.ho) e.ho = u.ha; if (mats.length && !(Array.isArray(e.mats) && e.mats.length)) e.mats = mats; const af = ((sub[u.slug] || {}).af || {})[u.key.split('#')[1]]; if (af && af.length) e.af = af; res.placed++;
        });
      });
      res.over += Math.max(0, rest.length - dates.length);
    });
    return res;
  }
  function undo(k) { let n = 0; groupsOf(k).forEach((G) => saveLog(G.slug, (log) => { for (let i = log.length - 1; i >= 0; i--) { const x = log[i]; if (x.auto && !(x.fp && x.fp.st) && x.date >= TODAY) { n++; if (hasInfo(x)) ['text', 'plan', 'ph', 'mats', 'auto', 'fp', 'af'].forEach((f) => delete x[f]); else log.splice(i, 1); } } })); return n; }

  async function generate(k) {
    const s = F(); s.busy = true; s.stop = false; const todo = topics(k).filter((t) => !(store(k)[t.slug] || []).length), g0 = groupsOf(k)[0], bl = g0 ? mergeRows(g0.rows)[0] : null, min = bl && bl.p2 > bl.p1 ? 90 : 50; let i = 0;
    for (const t of todo) {
      if (s.stop) break; s.msg = `Stundenplanung ${++i}/${todo.length}: ${t.title} …`; render();
      try {
        const r = await fetch('/api/stunden/plan', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ titel: t.title, klasse: k, epoche: epGuess(t.title), std: t.n, min, quellenmodus: s.mode }) }), j = await r.json();
        if (!r.ok) { s.msg = 'Fehler bei „' + t.title + '“: ' + (j.error || r.status); break; } putUnits(k, t.slug, j.einheiten);
      } catch (x) { s.msg = 'Fehler bei „' + t.title + '“: ' + (x.message || x); break; }
    }
    s.busy = false; if (/^Fehler/.test(s.msg)) return render(); const r = apply(k); s.msg = s.stop ? 'Abgebrochen. Bisherige Themen wurden zugeordnet.' : `Fertig: ${r.placed} Stunden in ${r.classes} Klasse(n) eingetragen.` + (r.over ? ` ${r.over} Stunde(n) passen nicht mehr ins Schuljahr.` : ''); render();
  }

  /* Arbeitsauftrag-Dateien eines Themas auf seine Stunden verteilen (automatischer Vorschlag oder von Hand/Ziehen) */
  const afLabel = (f) => { const segs = f.replace(/\.[^.]+$/, '').split('_'), lo = segs[segs.length - 1] === 'LOESUNG'; if (lo) segs.pop(); if (segs.length > 1) segs.pop(); return segs.filter((x) => !/^\d+$/.test(x)).join(' ').replace(/-/g, ' ').replace('Lueckentext', 'Lückentext').replace('Kreuzwortraetsel', 'Kreuzworträtsel').replace('Wiederholung muendlich', 'Wiederholung mündlich').replace('Check up', 'Check-up').replace('SingleChoice', 'Single Choice').replace('MultipleChoice', 'Multiple Choice') + (lo ? ' (Lösung)' : '') + (/\.pptx$/i.test(f) ? ' (PowerPoint)' : /\.xlsx$/i.test(f) ? ' (Excel)' : /\.csv$/i.test(f) ? ' (CSV)' : ''); };
  const afTopic = (slug) => { for (const k of [5, 6, 7, 8]) { const t = topics(k).find((x) => x.slug === slug); if (t) return { k, t }; } return null; };
  const afFiles = (slug) => { const sub = (jp().sub || {})[slug] || {}, ids = new Set((sub.auftraege || []).map((a) => a.id)), its = (window.erbItems ? window.erbItems() : []).filter((it) => ids.has(it.id) || it.thema === slug);
    return { its, files: its.flatMap((it) => it.files.filter((f) => /\.(docx|pptx|xlsx|csv)$/i.test(f) && !/^Import\//.test(f)).map((f) => ({ a: it.id, f, n: afLabel(f) + (its.length > 1 ? ' · ' + it.titel : '') }))) }; };
  const afSync = (k, slug, af) => { const sub = (jp().sub || {})[slug] || {}, zuw = Array.isArray(sub.zuw) ? sub.zuw : [];
    groupsOf(k).forEach((G) => { const zd = zuw.filter((z) => z.g === G.slug).map((z) => z.d).sort(); saveLog(G.slug, (log) => { log.forEach((x) => { let i = -1; if (x.fp && typeof x.fp.k === 'string' && x.fp.k.startsWith(slug + '#')) i = +x.fp.k.split('#')[1]; else if (zd.includes(x.date)) i = zd.indexOf(x.date); if (i < 0) return; if (af[i] && af[i].length) x.af = af[i]; else delete x.af; }); }); }); };
  const afSave = (slug, fn) => { const T = afTopic(slug); if (!T) return; const d = jp(), sub = Object.assign({}, d.sub || {}), it = Object.assign({}, sub[slug] || {}), af = JSON.parse(JSON.stringify(it.af || {})); fn(af); it.af = af; sub[slug] = it; put('settings', Object.assign({}, d, { id: 'jahresplan', sub })); afSync(T.k, slug, af); render(); };
  // Vorschlag: Stunde 1 Präsentation + Textblatt; Übungen auf die mittleren Stunden; Check-ups und Quiz in die letzte Stunde; mündliche Wiederholungen ab Stunde 2
  const afAuto = (files, n) => { const af = {}, put1 = (i, x) => { i = Math.max(0, Math.min(n - 1, i)); (af[i] = af[i] || []).push(x); }, has = (re) => files.filter((x) => re.test(x.f));
    has(/Praesentation|\.pptx$/i).concat(has(/^02_Textblatt/)).forEach((x) => put1(0, x));
    const ueb = [has(/^03_Arbeitsblatt/), has(/^04_Lueckentext/), has(/^05_Kreuzwort/)].filter((g) => g.length), mid = n > 2 ? n - 2 : Math.max(1, n - 1);
    ueb.forEach((g, j) => g.forEach((x) => put1(n === 1 ? 0 : 1 + (j % mid), x)));
    has(/^08_Wiederholung/).forEach((x) => put1(n > 1 ? 1 : 0, x));
    has(/Check-up|Kahoot|Plickers|MS-Forms/i).forEach((x) => put1(n - 1, x));
    return af; };
  window.jpAfHtml = (slug) => {
    const T = afTopic(slug); if (!T) return ''; const units = store(T.k)[slug] || [], n = units.length || T.t.n, sub = (jp().sub || {})[slug] || {}, af = sub.af || {}, { its, files } = afFiles(slug);
    const head = '<div class="jpafhd"><b>Arbeitsaufträge auf die Stunden verteilen</b>';
    if (!its.length) return `<div class="jpaf">${head}</div><div class="muted sm">Noch kein Arbeitsauftrag zu diesem Thema. <a class="kmmore" href="#erarbeiten" data-act="jpmk" data-k="${esc(slug)}">Lehrmaterial erarbeiten ›</a></div></div>`;
    const key = (x) => x.a + '|' + x.f, used = new Set(Object.values(af).flat().map(key));
    const chip = (x, i) => `<span class="jpafchip" draggable="true" data-afd="${esc(key(x))}" data-afk="${esc(slug)}" data-afi="${i}"><span>${esc(x.n)}</span><button data-act="jpafrm" data-k="${esc(slug)}" data-i="${i}" data-v="${esc(key(x))}" aria-label="Entfernen">×</button></span>`;
    const rows = Array.from({ length: n }, (_, i) => { const l = af[i] || [], free = files.filter((x) => !l.some((y) => key(y) === key(x)));
      return `<div class="jpafu" data-afu="${i}" data-afk="${esc(slug)}"><div class="jpafh"><b>Stunde ${i + 1}</b>${units[i] && units[i].thema ? `<span class="muted sm">${esc(units[i].thema)}</span>` : ''}</div><div class="jpafc">${l.map((x) => chip(x, i)).join('') || '<span class="muted sm">– noch nichts –</span>'}${free.length ? `<select class="jpafadd" data-ch="jpafadd" data-k="${esc(slug)}" data-i="${i}" aria-label="Datei zu Stunde ${i + 1} hinzufügen"><option value="" hidden selected>＋ Datei</option>${free.map((x) => `<option value="${esc(key(x))}">${used.has(key(x)) ? '' : '• '}${esc(x.n)}</option>`).join('')}</select>` : ''}</div></div>`; }).join('');
    return `<div class="jpaf">${head}<span style="flex:1"></span><button class="btn sm good" data-act="jpafauto" data-k="${esc(slug)}">Automatisch verteilen</button>${Object.keys(af).length ? `<button class="btn sm" data-act="jpafclr" data-k="${esc(slug)}">Alle entfernen</button>` : ''}</div><div class="muted sm" style="margin:2px 0 8px">Vorschlag: Stunde 1 Präsentation und Textblatt, danach die Übungen, Check-ups und Quiz in der letzten Stunde. Dateien per ＋ hinzufügen oder (am Computer) in eine andere Stunde ziehen. In den eingeplanten Stunden sind sie dann direkt aufrufbar.</div>${rows}</div>`;
  };
  window.afRow = (e) => { const its = window.erbItems ? window.erbItems() : [], by = new Map(its.map((it) => [it.id, it])); return `<div class="jpafl"><div class="muted sm" style="margin-bottom:4px">Arbeitsauftrag-Dateien für diese Stunde</div><div class="jpafc">${e.af.map((x) => { const it = by.get(x.a); return it && it.files.includes(x.f) ? `<a class="jpafchip lk" href="/api/file?path=${encodeURIComponent(it.dir + '/' + x.f)}&inline=1" target="_blank" rel="noopener">${esc(x.n)}</a>` : `<span class="jpafchip gone">${esc(x.n)} (nicht mehr vorhanden)</span>`; }).join('')}</div></div>`; };
  const afFind = (slug, v) => afFiles(slug).files.find((x) => x.a + '|' + x.f === v);
  Object.assign(A, {
    jpafauto: (e) => { const slug = e.dataset.k, T = afTopic(slug); if (!T) return; const { files } = afFiles(slug), n = (store(T.k)[slug] || []).length || T.t.n; afSave(slug, (af) => { Object.keys(af).forEach((x) => delete af[x]); Object.assign(af, afAuto(files, n)); }); toast('Dateien auf ' + n + ' Stunde(n) verteilt'); },
    jpafclr: (e) => afSave(e.dataset.k, (af) => Object.keys(af).forEach((x) => delete af[x])),
    jpafrm: (e) => afSave(e.dataset.k, (af) => { const i = e.dataset.i; af[i] = (af[i] || []).filter((x) => x.a + '|' + x.f !== e.dataset.v); if (!af[i].length) delete af[i]; }),
  });
  Object.assign(C, { jpafadd: (e) => { const x = afFind(e.dataset.k, e.value); if (!x) return; afSave(e.dataset.k, (af) => { (af[e.dataset.i] = af[e.dataset.i] || []).push(x); }); } });
  let afDr = null; const afClr = () => document.querySelectorAll('.jpafu.over').forEach((x) => x.classList.remove('over'));
  document.addEventListener('dragstart', (e) => { const c = e.target.closest && e.target.closest('[data-afd]'); if (!c) return; afDr = { v: c.dataset.afd, k: c.dataset.afk, from: c.dataset.afi }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', 'af:' + afDr.v); });
  document.addEventListener('dragover', (e) => { if (!afDr) return; const u = e.target.closest && e.target.closest('.jpafu'); afClr(); if (u && u.dataset.afk === afDr.k) { e.preventDefault(); u.classList.add('over'); } });
  document.addEventListener('drop', (e) => { if (!afDr) return; const m = afDr, u = e.target.closest && e.target.closest('.jpafu'); afDr = null; afClr(); if (!u || u.dataset.afk !== m.k || u.dataset.afu === m.from) return; e.preventDefault(); const x = afFind(m.k, m.v); if (!x) return; afSave(m.k, (af) => { af[m.from] = (af[m.from] || []).filter((y) => y.a + '|' + y.f !== m.v); if (!af[m.from].length) delete af[m.from]; const l = (af[u.dataset.afu] = af[u.dataset.afu] || []); if (!l.some((y) => y.a + '|' + y.f === m.v)) l.push(x); }); });
  document.addEventListener('dragend', () => { afDr = null; afClr(); });
  { const st = document.createElement('style'); st.id = 'jpaf46'; st.textContent = `
.jpaf{margin-top:14px;border-top:1px solid var(--line,#e5e7eb);padding-top:10px}.jpafhd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.jpafu{border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;margin:6px 0;background:#fff}.jpafu.over{border-color:#d99a26;background:#fdf6e9}
.jpafh{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin-bottom:6px}
.jpafc{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.jpafchip{display:inline-flex;align-items:center;gap:4px;border:1.5px solid #e3c88f;background:#fdf6e9;color:#1E293B;border-radius:7px;padding:3px 4px 3px 8px;font-size:12.5px;font-weight:600;cursor:grab;text-decoration:none}
.jpafchip.lk{padding:4px 9px;cursor:pointer}.jpafchip.gone{opacity:.55}
.jpafchip button{border:0;background:none;font-size:15px;line-height:1;cursor:pointer;color:#94a3b8;padding:0 3px}
.jpafadd{width:auto!important;padding:3px 8px!important;font-size:12.5px!important;border-radius:7px!important;border:1.5px dashed #cbd5e1!important;background:#fff;-webkit-appearance:none;appearance:none}
.jpafl{margin-top:10px;padding-top:8px;border-top:1px solid var(--line,#e5e7eb)}
.jpane h4.gbe{font:800 15px var(--font-head,inherit)!important;color:#1E293B!important;background:#fdf6e9;border:0!important;border-left:4px solid #d99a26!important;padding:8px 10px!important;border-radius:6px;margin:20px 0 8px!important;text-transform:none!important;letter-spacing:0!important}
`; document.head.appendChild(st); }
  window.fpBar = (k, pf) => {
    if (pf !== 'g') return ''; const s = F(), tp = topics(k), st = store(k), have = tp.filter((t) => (st[t.slug] || []).length).length, all = seq(k).length, gs = groupsOf(k), auto = gs.reduce((a, G) => a + (cinfo(G.slug).log || []).filter((x) => x.auto && x.fp).length, 0), okn = gs.reduce((a, G) => a + (cinfo(G.slug).log || []).filter((x) => x.fp && x.fp.st === 'ok').length, 0), todo = tp.length - have;
    const need = tp.slice(0, 0), hrs = tp.filter((t) => !(st[t.slug] || []).length).reduce((a, t) => a + t.n, 0);
    return `<section class="card"><div class="row" style="align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap"><h2 style="margin:0">Jahresplan · ${k}. Klasse</h2><span style="flex:1"></span><span class="muted sm">${have}/${tp.length} Themen geplant · ${all} Stunden · ${auto} zugeordnet · ${okn} geschafft</span></div>
    <p class="muted sm" style="margin:0 0 8px">Die KI plant jedes Thema in seine Einzelstunden (Stundenthema, Inhalte, Phasen mit Minuten, Hausübung) und trägt sie der Reihe nach in die Stundenplanung aller ${gs.length || 0} Klasse(n) dieser Stufe ein. Dort kannst du alles bearbeiten und die Stunde als geschafft, teilweise oder nicht geschafft markieren; Offenes rückt automatisch nach.</p>
    ${s.busy ? `<div class="card" style="margin:0 0 8px;background:var(--surface2)"><b>${esc(s.msg)}</b> <button class="btn sm" data-act="fpstop">Abbrechen nach diesem Thema</button></div>` : s.msg ? `<div class="muted sm" style="margin:0 0 8px">${esc(s.msg)}</div>` : ''}
    ${s.ask && !s.busy ? `<div class="card" style="margin:0 0 8px;background:var(--surface2)"><b>${todo} Thema/Themen (${hrs} Stunden) werden von der KI geplant.</b><div class="muted sm" style="margin:4px 0">Das dauert einige Minuten und verbraucht KI-Guthaben (pro Thema ein Aufruf; mit Internet-Recherche mehr). Gesendet werden nur Thema und Klassenstufe, keine Schülerdaten. Bereits eingetragene, von dir bearbeitete Stunden bleiben unverändert.</div><label class="muted sm">Quellen: <select class="kminp" data-ch="fpmode"><option value="web"${s.mode === 'web' ? ' selected' : ''}>Internet-Recherche</option><option value="wissen"${s.mode === 'wissen' ? ' selected' : ''}>Nur KI-Fachwissen</option></select></label> <button class="btn good" data-act="fpgo" data-k="${k}">Jetzt starten</button> <button class="btn" data-act="fpask" data-v="">Abbrechen</button></div>` : ''}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn good" data-act="${todo ? 'fpask' : 'fpapply'}" data-k="${k}" data-v="1"${s.busy || !tp.length ? ' disabled' : ''}>${todo ? (have ? 'Fehlende Themen einplanen' : 'Jahr einplanen') : 'Neu zuordnen'}</button>${have && todo ? `<button class="btn" data-act="fpapply" data-k="${k}">Neu zuordnen</button>` : ''}${auto ? `<button class="btn" data-act="fpundo" data-k="${k}" title="Entfernt die automatisch eingetragenen, noch nicht abgehakten Stunden ab heute">Zuordnung zurücknehmen</button>` : ''}</div></section>`;
  };
  window.fpRow = (slug, e) => { const v = e.fp && e.fp.st || '', b = (x, t) => `<button class="btn sm${v === x ? ' good' : ''}" data-act="fpst" data-slug="${slug}" data-id="${esc(e.id)}" data-v="${x}">${t}</button>`; return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line)"><div class="muted sm" style="margin-bottom:4px">Jahresplan</div><div class="row" style="gap:6px;flex-wrap:wrap">${b('ok', '✓ geschafft')}${b('teils', '◐ teilweise')}${b('nein', '✗ nicht geschafft')}</div><div class="muted sm" style="margin-top:4px">Teilweise oder nicht Geschafftes wird in der nächsten freien Stunde erneut eingeplant.</div></div>`; };
  Object.assign(A, {
    fpask: (e) => { F().ask = !!e.dataset.v; render(); },
    fpstop: () => { F().stop = true; },
    fpgo: (e) => { const s = F(); s.ask = false; generate(+e.dataset.k); },
    fpapply: (e) => { const r = apply(+e.dataset.k); F().msg = `${r.placed} Stunden in ${r.classes} Klasse(n) neu zugeordnet.` + (r.over ? ` ${r.over} passen nicht mehr ins Schuljahr.` : ''); render(); },
    fpundo: (e) => { const n = undo(+e.dataset.k); F().msg = n + ' automatische Stunden entfernt.'; render(); },
    fpst: (e) => { const slug = e.dataset.slug, v = e.dataset.v; saveLog(slug, (log) => { const x = log.find((y) => y.id === e.dataset.id); if (x && x.fp) x.fp = Object.assign({}, x.fp, { st: x.fp.st === v ? '' : v }); }); const G = groups().find((g) => g.slug === slug); if (G) { const r = apply(parseInt(G.label)); if (v !== 'ok' && r.over) toast(r.over + ' Stunde(n) passen nicht mehr ins Schuljahr'); } render(); },
  });
  Object.assign(C, { fpmode: (e) => { F().mode = e.value === 'wissen' ? 'wissen' : 'web'; } });
})();
