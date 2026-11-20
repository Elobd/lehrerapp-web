/* Lesezeichen "Stundenplan holen": läuft im angemeldeten WebUntis-Tab, NUR LESEND.
   Liest dein Zeitraster und deinen Wochenplan (aktuelle + 3 Folgewochen), bildet daraus den Regelplan
   und kopiert ihn für die App in die Zwischenablage. In der App: "Aus WebUntis einfügen". */
(async () => {
  if (window.__wuBusy) return;
  const TEST = !!window.__WU_TEST;
  if (!TEST && !/webuntis\.com$/i.test(location.host)) { alert('Bitte dieses Lesezeichen im angemeldeten WebUntis-Tab anklicken.'); return; }
  window.__wuBusy = true;
  const p2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const hmS = (m) => p2(Math.floor(m / 60)) + ':' + p2(m % 60);
  const parseHM = (v) => {
    if (v == null) return null; const s = String(v);
    let m = /(\d{1,2}):(\d{2})/.exec(s); if (m) return +m[1] * 60 + +m[2];
    m = /^(\d{1,2})(\d{2})$/.exec(s); if (m) return +m[1] * 60 + +m[2];
    return null;
  };
  const el = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
  const ov = el('div', 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:grid;place-items:center;font:14px/1.4 system-ui,sans-serif');
  const box = el('div', 'background:#fff;color:#111;border-radius:12px;padding:16px;width:min(900px,96vw);max-height:90vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.4)');
  ov.appendChild(box); document.body.appendChild(ov);
  const close = () => { ov.remove(); window.__wuBusy = false; };
  const btn = (label, bg, fn) => { const b = el('button', 'font:600 14px system-ui;padding:8px 14px;border:0;border-radius:8px;cursor:pointer;margin:8px 8px 0 0;color:#fff;background:' + bg, label); b.onclick = fn; return b; };
  const show = (title, ...nodes) => box.replaceChildren(el('h2', 'margin:0 0 8px;font-size:18px', title), ...nodes);
  const para = (t, css) => el('p', 'margin:6px 0;' + (css || ''), t);
  try {
    show('Stundenplan wird gelesen …', para('Es wird nur gelesen, nichts in WebUntis verändert.'));
    const tok = (await (await fetch('/WebUntis/api/token/new', { credentials: 'same-origin' })).text()).trim();
    let claims = {}; try { claims = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { /* */ }
    const pid = claims.person_id; if (!pid) throw new Error('Nicht angemeldet (kein Token).');
    const H = { accept: 'application/json', authorization: 'Bearer ' + tok };
    const getJson = async (u) => { const r = await fetch(u, { credentials: 'same-origin', headers: H }); if (!r.ok) throw new Error('HTTP ' + r.status + ' bei ' + u.split('?')[0]); return r.json(); };

    /* ---- Zeitraster ---- */
    let units = [];
    try {
      const app = await getJson('/WebUntis/api/rest/view/v1/app/data');
      const raw = (app.currentSchoolYear && app.currentSchoolYear.timeGrid && app.currentSchoolYear.timeGrid.units) || [];
      raw.forEach((u, i) => {
        const ks = Object.keys(u); const sk = ks.find((k) => /start/i.test(k)), ek = ks.find((k) => /end/i.test(k));
        const von = sk ? parseHM(u[sk]) : null, bis = ek ? parseHM(u[ek]) : null;
        if (von != null && bis != null) units.push({ von, bis });
      });
      units.sort((a, b) => a.von - b.von);
    } catch (e) { units = []; }

    /* ---- Wochen lesen ---- */
    const base = new Date(); base.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    const weeks = [];
    for (let w = 0; w < 4; w++) {
      const mon = new Date(base); mon.setDate(base.getDate() + 7 * w); const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
      try { weeks.push(await getJson('/WebUntis/api/rest/view/v1/timetable/entries?start=' + ymd(mon) + '&end=' + ymd(fri) + '&format=1&resourceType=TEACHER&resources=' + pid + '&periodTypes=&timetableType=MY_TIMETABLE&layer=1')); } catch (e) { weeks.push({ days: [] }); }
    }
    const pick = (g) => {
      const cls = [], subj = [], room = [], info = [];
      ['position1', 'position2', 'position3', 'position4', 'position5', 'position6', 'position7'].forEach((k) => (g[k] || []).forEach((x) => {
        const c = x && x.current; if (!c) return; const t = String(c.type || '').toUpperCase(), n = c.shortName || c.displayName || '';
        if (/CLASS/.test(t)) cls.push(n); else if (/SUBJECT/.test(t)) subj.push(n); else if (/ROOM/.test(t)) room.push(n); else if (/INFO/.test(t)) info.push(n);
      }));
      return { cls, subj, room, info };
    };
    const detail = async (g) => {
      const q = new URLSearchParams({ elementId: pid, elementType: 2, startDateTime: g.duration.start, endDateTime: g.duration.end, calendarEntryId: g.ids[0] });
      const d = ((await getJson('/WebUntis/api/rest/view/v2/calendar-entry/detail?' + q)).calendarEntries || [])[0] || {};
      return { cls: (d.klasses || []).map((k) => k.shortName || k.displayName), subj: d.subject ? [d.subject.shortName || d.subject.displayName] : [], room: (d.rooms || []).map((r) => r.shortName || r.displayName) };
    };
    const weekData = []; let detailCalls = 0; const cache = {};
    for (let wi = 0; wi < weeks.length; wi++) {
      const wk = weeks[wi]; const wmon = new Date(base); wmon.setDate(base.getDate() + 7 * wi); const list = [];
      for (const day of wk.days || []) {
        for (const g of day.gridEntries || []) {
          if (g.type === 'EVENT') {
            const p0 = pick(g), a0 = new Date(g.duration.start), b0 = new Date(g.duration.end);
            list.push({ wd: ((a0.getDay() + 6) % 7) + 1, von: a0.getHours() * 60 + a0.getMinutes(), bis: b0.getHours() * 60 + b0.getMinutes(), classes: [p0.info[0] || g.name || 'Veranstaltung'], subject: 'Veranstaltung', room: '', st: String(g.status || 'REGULAR'), date: day.date, ev: true });
            continue;
          }
          if (g.type !== 'NORMAL_TEACHING_PERIOD') continue;
          let p = pick(g);
          if (!p.cls.length || !p.subj.length) { const key = g.ids[0]; if (!cache[key] && detailCalls < 120) { detailCalls++; try { cache[key] = await detail(g); } catch (e) { cache[key] = p; } } p = cache[key] || p; }
          if (!p.cls.length) continue;
          const a = new Date(g.duration.start), b = new Date(g.duration.end);
          list.push({ wd: ((a.getDay() + 6) % 7) + 1, von: a.getHours() * 60 + a.getMinutes(), bis: b.getHours() * 60 + b.getMinutes(), classes: p.cls, subject: p.subj[0] || '', room: p.room[0] || '', st: String(g.status || 'REGULAR'), date: day.date });
        }
      }
      weekData.push({ mon: ymd(wmon), list });
    }
    const seenWeeks = weekData.map((w) => w.list.filter((l) => l.st !== 'CANCELLED' && !l.ev)).filter((l) => l.length);
    if (!seenWeeks.length) throw new Error('Keine Unterrichtsstunden in den nächsten 4 Wochen gefunden.');
    const need = seenWeeks.length >= 2 ? 2 : 1, cnt = {};
    seenWeeks.forEach((wk) => { const seen = new Set(); wk.forEach((l) => { const k = [l.wd, l.von, l.bis, l.classes.slice().sort().join(','), l.subject].join('|'); if (seen.has(k)) return; seen.add(k); (cnt[k] = cnt[k] || { n: 0, l }).n++; }); });
    let lessons = Object.values(cnt).filter((x) => x.n >= need).map((x) => x.l);
    if (!lessons.length) lessons = seenWeeks[0];

    /* ---- Raster: aus WebUntis, sonst aus den Stunden abgeleitet ---- */
    let fromGrid = units.length > 0;
    if (!fromGrid) {
      const u = []; lessons.forEach((l) => { if (!u.some((x) => Math.abs(x.von - l.von) <= 2)) u.push({ von: l.von, bis: l.bis }); }); u.sort((a, b) => a.von - b.von); units = u;
    }
    const times = {}; units.forEach((u, i) => { times[i + 1] = { von: hmS(u.von), bis: hmS(u.bis) }; });
    const toRows = (ls, withSt) => {
      const rr = [];
      ls.forEach((l) => units.forEach((u, i) => {
        const ov2 = Math.min(u.bis, l.bis) - Math.max(u.von, l.von);
        if (ov2 >= 0.5 * (u.bis - u.von)) { const o = { wd: l.wd, period: i + 1, classes: l.classes, cls: l.classes.join(', '), subject: l.subject, room: l.room }; if (withSt && l.st !== 'REGULAR') o.st = l.st; if (l.ev) o.ev = 1; rr.push(o); }
      }));
      return rr.sort((a, b) => a.wd - b.wd || a.period - b.period);
    };
    const rows = toRows(lessons, false);
    const wk = {}; weekData.forEach((w) => { if (w.list.length) wk[w.mon] = toRows(w.list, true); });
    const changes = []; weekData.forEach((w) => w.list.filter((l) => l.st !== 'REGULAR').forEach((l) => changes.push(l)));
    const stats = {}; changes.forEach((l) => { stats[l.st] = (stats[l.st] || 0) + 1; });
    const out = { v: 1, kind: 'timetable', source: 'webuntis', fromGrid, times, rows, weeks: wk, created: Date.now() };

    /* ---- Vorschau ---- */
    const groups = {};
    rows.forEach((r) => { const k = r.cls + ' · ' + r.subject; (groups[k] = groups[k] || []).push(['Mo', 'Di', 'Mi', 'Do', 'Fr'][r.wd - 1] + r.period); });
    const tb = el('table', 'border-collapse:collapse;width:100%;font-size:13px');
    const hd = el('tr'); ['Klasse · Fach', 'Termine (Tag + Stunde)'].forEach((h) => hd.appendChild(el('th', 'text-align:left;border-bottom:2px solid #ccc;padding:4px 6px', h))); tb.appendChild(hd);
    Object.keys(groups).sort().forEach((k) => { const tr = el('tr'); tr.appendChild(el('td', 'border-bottom:1px solid #e3e3e3;padding:4px 6px;font-weight:600', k)); tr.appendChild(el('td', 'border-bottom:1px solid #e3e3e3;padding:4px 6px', groups[k].join(', '))); tb.appendChild(tr); });
    const chBox = el('div', 'margin-top:10px');
    chBox.appendChild(el('b', '', changes.length ? 'Änderungen in den nächsten Wochen (' + Object.entries(stats).map(([k, v]) => v + '× ' + k).join(', ') + ')' : 'Keine Änderungen gegenüber dem Regelplan in den nächsten Wochen.'));
    changes.slice(0, 25).forEach((l) => chBox.appendChild(el('div', 'font-size:13px;padding:2px 0;color:' + (l.st === 'CANCELLED' ? '#b3261e' : '#9a5b00'), l.date.split('-').reverse().join('.') + ' ' + hmS(l.von) + ' · ' + l.classes.join('+') + ' · ' + l.subject + ' → ' + l.st)));
    const acts = el('div');
    acts.appendChild(btn('In Zwischenablage kopieren', '#1b7f4b', async () => {
      const txt = JSON.stringify(out);
      try { await navigator.clipboard.writeText(txt); close(); alert('Kopiert. Jetzt in der App bei „Stundenplan“ auf „Aus WebUntis einfügen“ klicken.'); } catch (e) { prompt('Bitte alles kopieren und in der App einfügen:', txt); close(); }
    }));
    acts.appendChild(btn('Abbrechen', '#555', close));
    show('Dein Stundenplan: ' + Object.keys(groups).length + ' Klassen/Fächer, ' + rows.length + ' Stunden pro Woche (Regelplan)',
      para(seenWeeks.length + ' Woche(n) ausgewertet. Zeitraster ' + (fromGrid ? 'aus WebUntis (' + units.length + ' Einheiten)' : 'aus den Stunden abgeleitet') + '. Nichts wurde in WebUntis verändert.', 'color:#566377'), tb, chBox, acts);
  } catch (e) {
    show('Fehler', para(String((e && e.message) || e), 'color:#b3261e'), btn('Schließen', '#555', close));
  }
})();
