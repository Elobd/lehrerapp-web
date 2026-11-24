/* Jahresfahrplan: Themen der Jahresplanung (mit „(n Std.)“) → KI plant die Einzelstunden → Zuordnung auf die Unterrichtstage aller Klassen der Stufe → abhaken, Nicht-Geschafftes rückt nach. */
(() => {
  const jp = () => S.settings.jahresplan || { id: 'jahresplan' };
  const F = () => (U.fp = U.fp || { busy: false, msg: '', ask: false, mode: 'web', stop: false });
  const epGuess = (t) => { t = String(t).toLowerCase(); return /antike|römer|griech|ägypt/.test(t) ? 'Antike' : /mittelalter|ritter|burg|kreuzz|karoling/.test(t) ? 'Mittelalter' : /steinzeit|urgeschicht|frühgeschicht|eiszeit|jäger/.test(t) ? 'Vor- und Frühgeschichte' : /weltkrieg|nationalsozial|zweite republik|kalter krieg/.test(t) ? 'Zeitgeschichte' : 'Neuzeit'; };
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
        for (let i = log.length - 1; i >= 0; i--) { const x = log[i]; if (x.auto && !(x.fp && x.fp.st) && x.date >= TODAY) { if (hasInfo(x)) { ['text', 'plan', 'ph', 'mats', 'auto', 'fp'].forEach((f) => delete x[f]); } else log.splice(i, 1); } }
        dates.forEach((d) => {
          const ex = log.filter((x) => x.date === d); if (ex.some((x) => (x.fp && x.fp.st) || (x.text && String(x.text).trim()))) return; if (qi >= rest.length) return;
          const u = rest[qi++]; let e = ex[0]; if (!e) { e = { id: uid('l'), date: d, text: '' }; log.push(e); }
          const mats = ((sub[u.slug] || {}).mats || []).slice();
          Object.assign(e, { text: u.label, plan: ['Ziele: ' + (u.ziele || ''), 'Inhalt: ' + (u.inhalt || ''), 'Methoden: ' + (u.methoden || '')].join('\n'), ph: (u.ph || []).map((p) => ({ id: uid('p'), t: p.t, m: p.m })), auto: true, fp: { k: u.key } });
          if (u.ha && !e.ho) e.ho = u.ha; if (mats.length && !(Array.isArray(e.mats) && e.mats.length)) e.mats = mats; res.placed++;
        });
      });
      res.over += Math.max(0, rest.length - dates.length);
    });
    return res;
  }
  function undo(k) { let n = 0; groupsOf(k).forEach((G) => saveLog(G.slug, (log) => { for (let i = log.length - 1; i >= 0; i--) { const x = log[i]; if (x.auto && !(x.fp && x.fp.st) && x.date >= TODAY) { n++; if (hasInfo(x)) ['text', 'plan', 'ph', 'mats', 'auto', 'fp'].forEach((f) => delete x[f]); else log.splice(i, 1); } } })); return n; }

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

  window.fpBar = (k, pf) => {
    if (pf !== 'g') return ''; const s = F(), tp = topics(k), st = store(k), have = tp.filter((t) => (st[t.slug] || []).length).length, all = seq(k).length, gs = groupsOf(k), auto = gs.reduce((a, G) => a + (cinfo(G.slug).log || []).filter((x) => x.auto && x.fp).length, 0), okn = gs.reduce((a, G) => a + (cinfo(G.slug).log || []).filter((x) => x.fp && x.fp.st === 'ok').length, 0), todo = tp.length - have;
    const need = tp.slice(0, 0), hrs = tp.filter((t) => !(st[t.slug] || []).length).reduce((a, t) => a + t.n, 0);
    return `<section class="card"><div class="row" style="align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap"><h2 style="margin:0">Jahresfahrplan · ${k}. Klasse</h2><span style="flex:1"></span><span class="muted sm">${have}/${tp.length} Themen geplant · ${all} Stunden · ${auto} zugeordnet · ${okn} geschafft</span></div>
    <p class="muted sm" style="margin:0 0 8px">Die KI plant jedes Thema in seine Einzelstunden (Stundenthema, Inhalte, Phasen mit Minuten, Hausübung) und trägt sie der Reihe nach in die Stundenplanung aller ${gs.length || 0} Klasse(n) dieser Stufe ein. Dort kannst du alles bearbeiten und die Stunde als geschafft, teilweise oder nicht geschafft markieren; Offenes rückt automatisch nach.</p>
    ${s.busy ? `<div class="card" style="margin:0 0 8px;background:var(--surface2)"><b>${esc(s.msg)}</b> <button class="btn sm" data-act="fpstop">Abbrechen nach diesem Thema</button></div>` : s.msg ? `<div class="muted sm" style="margin:0 0 8px">${esc(s.msg)}</div>` : ''}
    ${s.ask && !s.busy ? `<div class="card" style="margin:0 0 8px;background:var(--surface2)"><b>${todo} Thema/Themen (${hrs} Stunden) werden von der KI geplant.</b><div class="muted sm" style="margin:4px 0">Das dauert einige Minuten und verbraucht KI-Guthaben (pro Thema ein Aufruf; mit Internet-Recherche mehr). Gesendet werden nur Thema und Klassenstufe, keine Schülerdaten. Bereits eingetragene, von dir bearbeitete Stunden bleiben unverändert.</div><label class="muted sm">Quellen: <select class="kminp" data-ch="fpmode"><option value="web"${s.mode === 'web' ? ' selected' : ''}>Internet-Recherche</option><option value="wissen"${s.mode === 'wissen' ? ' selected' : ''}>Nur KI-Fachwissen</option></select></label> <button class="btn good" data-act="fpgo" data-k="${k}">Jetzt starten</button> <button class="btn" data-act="fpask" data-v="">Abbrechen</button></div>` : ''}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn good" data-act="${todo ? 'fpask' : 'fpapply'}" data-k="${k}" data-v="1"${s.busy || !tp.length ? ' disabled' : ''}>${todo ? (have ? 'Fehlende Themen einplanen' : 'Jahr einplanen') : 'Neu zuordnen'}</button>${have && todo ? `<button class="btn" data-act="fpapply" data-k="${k}">Neu zuordnen</button>` : ''}${auto ? `<button class="btn" data-act="fpundo" data-k="${k}" title="Entfernt die automatisch eingetragenen, noch nicht abgehakten Stunden ab heute">Zuordnung zurücknehmen</button>` : ''}</div></section>`;
  };
  window.fpRow = (slug, e) => { const v = e.fp && e.fp.st || '', b = (x, t) => `<button class="btn sm${v === x ? ' good' : ''}" data-act="fpst" data-slug="${slug}" data-id="${esc(e.id)}" data-v="${x}">${t}</button>`; return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line)"><div class="muted sm" style="margin-bottom:4px">Jahresfahrplan</div><div class="row" style="gap:6px;flex-wrap:wrap">${b('ok', '✓ geschafft')}${b('teils', '◐ teilweise')}${b('nein', '✗ nicht geschafft')}</div><div class="muted sm" style="margin-top:4px">Teilweise oder nicht Geschafftes wird in der nächsten freien Stunde erneut eingeplant.</div></div>`; };
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
