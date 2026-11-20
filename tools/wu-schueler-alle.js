/* Lesezeichen "Alle Klassen holen": läuft im angemeldeten WebUntis-Tab (beliebige Seite), NUR LESEND.
   Lädt je Klasse/Fach eine deiner Stunden (Anwesenheitsseite) und liest daraus die Schülerliste.
   Kopiert alles für die App: Stundenplan-Karte → "Alle Schülerlisten aus WebUntis einfügen". */
(async () => {
  if (window.__wuBusy) return;
  const TEST = !!window.__WU_TEST;
  if (!TEST && !/webuntis\.com$/i.test(location.host)) { alert('Bitte dieses Lesezeichen im angemeldeten WebUntis-Tab anklicken.'); return; }
  window.__wuBusy = true;
  const p2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const normC = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '').replace(/^0+(?=\d)/, '');
  const nice = (s) => { s = String(s || '').trim(); return s && s === s.toUpperCase() && /[A-ZÄÖÜ]/.test(s) ? s.toLowerCase().replace(/(^|[\s-])(\S)/g, (m, a, b) => a + b.toUpperCase()) : s; };
  const el = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
  const ov = el('div', 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:grid;place-items:center;font:14px/1.4 system-ui,sans-serif');
  const box = el('div', 'background:#fff;color:#111;border-radius:12px;padding:16px;width:min(760px,96vw);max-height:90vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.4)');
  ov.appendChild(box); document.body.appendChild(ov);
  const close = () => { ov.remove(); window.__wuBusy = false; };
  const btn = (label, bg, fn) => { const b = el('button', 'font:600 14px system-ui;padding:8px 14px;border:0;border-radius:8px;cursor:pointer;margin:8px 8px 0 0;color:#fff;background:' + bg, label); b.onclick = fn; return b; };
  const show = (title, ...nodes) => box.replaceChildren(el('h2', 'margin:0 0 8px;font-size:18px', title), ...nodes);
  const para = (t, css) => el('p', 'margin:6px 0;' + (css || ''), t);
  try {
    show('Klassen werden gesucht …', para('Es wird nur gelesen, nichts in WebUntis verändert.'));
    const tok = (await (await fetch('/WebUntis/api/token/new', { credentials: 'same-origin' })).text()).trim();
    let claims = {}; try { claims = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { /* */ }
    const pid = claims.person_id; if (!pid) throw new Error('Nicht angemeldet (kein Token).');
    const H = { accept: 'application/json', authorization: 'Bearer ' + tok };
    const getJson = async (u) => { const r = await fetch(u, { credentials: 'same-origin', headers: H }); if (!r.ok) throw new Error('HTTP ' + r.status + ' bei ' + u.split('?')[0]); return r.json(); };
    const pick = (g) => {
      const cls = [], subj = [];
      ['position1', 'position2', 'position3', 'position4', 'position5', 'position6', 'position7'].forEach((k) => (g[k] || []).forEach((x) => { const c = x && x.current; if (!c) return; const t = String(c.type || '').toUpperCase(), n = c.shortName || c.displayName || ''; if (/CLASS/.test(t)) cls.push(n); else if (/SUBJECT/.test(t)) subj.push(n); }));
      return { cls, subj };
    };
    const detail = async (g) => {
      const q = new URLSearchParams({ elementId: pid, elementType: 2, startDateTime: g.duration.start, endDateTime: g.duration.end, calendarEntryId: g.ids[0] });
      const d = ((await getJson('/WebUntis/api/rest/view/v2/calendar-entry/detail?' + q)).calendarEntries || [])[0] || {};
      return { cls: (d.klasses || []).map((k) => k.shortName || k.displayName), subj: d.subject ? [d.subject.shortName || d.subject.displayName] : [] };
    };
    /* ---- Klassen/Fächer der nächsten Wochen sammeln: je Gruppe eine Stunde ---- */
    const base = new Date(); base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    const groups = {}; let calls = 0;
    for (let w = 0; w < 4; w++) {
      const mon = new Date(base); mon.setDate(base.getDate() + 7 * w); const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
      let tt; try { tt = await getJson('/WebUntis/api/rest/view/v1/timetable/entries?start=' + ymd(mon) + '&end=' + ymd(fri) + '&format=1&resourceType=TEACHER&resources=' + pid + '&periodTypes=&timetableType=MY_TIMETABLE&layer=1'); } catch (e) { continue; }
      for (const day of tt.days || []) for (const g of day.gridEntries || []) {
        if (g.type !== 'NORMAL_TEACHING_PERIOD' || g.status === 'CANCELLED') continue;
        let p = pick(g); if ((!p.cls.length || !p.subj.length) && calls < 80) { calls++; try { p = await detail(g); } catch (e) { /* */ } }
        if (!p.cls.length) continue;
        const key = p.cls.map(normC).sort().join(',') + '|' + (p.subj[0] || '');
        if (!groups[key]) groups[key] = { classes: p.cls, subject: p.subj[0] || '', ttid: g.ids[0], date: day.date };
      }
    }
    const list = Object.values(groups);
    if (!list.length) throw new Error('Keine Unterrichtsstunden in den nächsten 4 Wochen gefunden.');
    /* ---- Schülerlisten lesen ---- */
    const parse = (t) => {
      const doc = new DOMParser().parseFromString(t, 'text/html');
      const form = doc.querySelector('[data-dojo-type$="ClassregPageFormAdapter"]'); if (!form) throw new Error('Formular nicht gefunden');
      const props = form.getAttribute('data-dojo-props') || ''; const i = props.indexOf('viewModel:'); const j = props.indexOf('{', i); if (i < 0 || j < 0) throw new Error('viewModel fehlt');
      let depth = 0, inStr = false, esc = false, k = j;
      for (; k < props.length; k++) { const ch = props[k]; if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; } else if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) { k++; break; } } }
      return JSON.parse(props.slice(j, k));
    };
    let n = 0;
    for (const g of list) {
      show('Schülerlisten werden gelesen …', para((++n) + ' von ' + list.length + ': ' + g.classes.join('+') + ' · ' + g.subject));
      try {
        const r = await fetch('/WebUntis/classregpage.do?ttid=' + g.ttid + '&isBlockSelected=false&request.preventCache=' + Date.now(), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const vm = parse(await r.text());
        g.students = (vm.students || []).map((s) => ({ nn: nice(s.longName), vn: nice(s.foreName), kl: (s.klasse && (s.klasse.name || s.klasse.shortName)) || (g.classes.length === 1 ? g.classes[0] : ''), wu: s.id })).filter((s) => s.nn || s.vn)
          .sort((a, b) => a.nn.localeCompare(b.nn, 'de') || a.vn.localeCompare(b.vn, 'de'));
      } catch (e) { g.err = e.message; g.students = []; }
    }
    const out = { v: 1, kind: 'students_all', created: Date.now(), groups: list.map((g) => ({ classes: g.classes, subject: g.subject, students: g.students })) };
    const tb = el('table', 'border-collapse:collapse;width:100%;font-size:13px');
    const hd = el('tr'); ['Klasse · Fach', 'Schüler'].forEach((h) => hd.appendChild(el('th', 'text-align:left;border-bottom:2px solid #ccc;padding:4px 6px', h))); tb.appendChild(hd);
    list.forEach((g) => { const tr = el('tr'); tr.appendChild(el('td', 'border-bottom:1px solid #e3e3e3;padding:4px 6px;font-weight:600', g.classes.join('+') + ' · ' + g.subject)); tr.appendChild(el('td', 'border-bottom:1px solid #e3e3e3;padding:4px 6px;color:' + (g.err ? '#b3261e' : '#111'), g.err ? 'Fehler: ' + g.err : g.students.length + ' Schüler')); tb.appendChild(tr); });
    const total = list.reduce((a, g) => a + g.students.length, 0), acts = el('div');
    acts.appendChild(btn('In Zwischenablage kopieren', '#1b7f4b', async () => {
      const txt = JSON.stringify(out);
      try { await navigator.clipboard.writeText(txt); close(); alert('Kopiert. Jetzt in der App im Stundenplan auf „Alle Schülerlisten aus WebUntis einfügen“ klicken.'); } catch (e) { prompt('Bitte alles kopieren und in der App einfügen:', txt); close(); }
    }));
    acts.appendChild(btn('Abbrechen', '#555', close));
    show(list.length + ' Klassen/Fächer, ' + total + ' Schüler', para('Es wurde nur gelesen. Das Geschlecht liefert WebUntis nicht und wird nicht übernommen.', 'color:#566377'), tb, acts);
  } catch (e) {
    show('Fehler', para(String((e && e.message) || e), 'color:#b3261e'), btn('Schließen', '#555', close));
  }
})();
