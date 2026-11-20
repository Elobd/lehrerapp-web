/* Lesezeichen "WebUntis synchronisieren": läuft im angemeldeten WebUntis-Tab (beliebige Seite).
   Gleicht das GANZE SCHULJAHR in beide Richtungen ab:
   - App → WebUntis: Lernstoff (lessontopicdlg.do) und Fehlzeiten (classregpage.do, insert), erst nach Bestätigung
   - WebUntis → App: Stoff und Fehlzeiten, die in der App fehlen (Rückmeldung für die App, ergänzt Neues sofort) */
(async () => {
  if (window.__wuBusy) return;
  const TEST = !!window.__WU_TEST;
  if (!TEST && !/webuntis\.com$/i.test(location.host)) { alert('Bitte dieses Lesezeichen im angemeldeten WebUntis-Tab anklicken.'); return; }
  window.__wuBusy = true;
  const T0 = Date.now();
  const p2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const pd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]/g, '');
  const normC = (s) => norm(s).replace(/^0+(?=\d)/, '');
  const normN = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  const nice = (s) => { s = String(s || '').trim(); return s && s === s.toUpperCase() && /[A-ZÄÖÜ]/.test(s) ? s.toLowerCase().replace(/(^|[\s-])(\S)/g, (m, a, b) => a + b.toUpperCase()) : s; };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (t, css, txt) => { const e = document.createElement(t); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; };
  const ov = el('div', 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:grid;place-items:center;font:14px/1.4 system-ui,sans-serif');
  const box = el('div', 'background:#fff;color:#111;border-radius:12px;padding:16px;width:min(980px,96vw);max-height:90vh;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.4)');
  ov.appendChild(box); document.body.appendChild(ov);
  const close = () => { ov.remove(); window.__wuBusy = false; };
  const btn = (label, bg, fn) => { const b = el('button', 'font:600 14px system-ui;padding:8px 14px;border:0;border-radius:8px;cursor:pointer;margin:6px 8px 0 0;color:#fff;background:' + bg, label); b.onclick = fn; return b; };
  const show = (title, ...nodes) => box.replaceChildren(el('h2', 'margin:0 0 8px;font-size:18px', title), ...nodes);
  const para = (t, css) => el('p', 'margin:6px 0;' + (css || ''), t);
  let lastShow = 0;
  const prog = (label, i, n) => { const now = Date.now(); if (now - lastShow < 150 && i !== n) return; lastShow = now; show('Schuljahr wird abgeglichen …', para(label + (n ? ': ' + i + ' von ' + n : '')), para('Bisher ' + Math.round((now - T0) / 1000) + ' Sekunden. Es wird nur gelesen, nichts geschrieben.', 'color:#566377')); };
  const pool = async (list, n, fn) => { let i = 0; await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => { while (i < list.length) { const k = i++; try { await fn(list[k], k); } catch (e) { /* einzelne Fehler überspringen */ } } })); };
  try {
    /* ---------- Daten aus der App ---------- */
    let raw = ''; try { raw = await navigator.clipboard.readText(); } catch (e) { raw = prompt('Bitte hier den in der App bereitgestellten Inhalt einfügen:') || ''; }
    let data = null; try { data = JSON.parse(raw); } catch (e) { /* */ }
    const hasText = (i) => String(i.text || '').trim(), hasAbs = (i) => Array.isArray(i.absent) && i.absent.length;
    const what = (d) => !d ? 'In der Zwischenablage liegt kein Text aus der App (anderer Inhalt oder leer).' : d.kind ? 'In der Zwischenablage liegt etwas anderes aus der App (' + d.kind + ').' : Array.isArray(d.items) ? 'In der Zwischenablage liegen ' + d.items.length + ' Einträge: ' + d.items.filter(hasText).length + ' mit Stoff, ' + d.items.filter(hasAbs).length + ' mit Fehlzeiten.' : 'In der Zwischenablage liegen Daten, aber nicht aus der App.';
    const items = data && data.v === 1 && Array.isArray(data.items) ? data.items.filter((i) => hasText(i) || hasAbs(i)) : [];
    const appGroups = data && data.v === 1 && Array.isArray(data.groups) ? data.groups : [];
    if (!items.length && !appGroups.length) { show('Nichts zu synchronisieren', para(what(data)), para('Klicke in der App im Stundenplan auf „Für WebUntis bereitstellen“ und dann hier erneut. Zwischendurch nichts anderes kopieren.'), btn('Schließen', '#555', close)); return; }

    /* ---------- WebUntis: Anmeldung, Schuljahr ---------- */
    const tok = (await (await fetch('/WebUntis/api/token/new', { credentials: 'same-origin' })).text()).trim();
    let claims = {}; try { claims = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { /* */ }
    const pid = claims.person_id; if (!pid) throw new Error('Nicht angemeldet (kein Token).');
    const H = { accept: 'application/json', authorization: 'Bearer ' + tok };
    const getJson = async (u) => { const r = await fetch(u, { credentials: 'same-origin', headers: H }); if (!r.ok) throw new Error('HTTP ' + r.status + ' bei ' + u.split('?')[0]); return r.json(); };
    const today = ymd(new Date());
    let from = ''; try { const ap = await getJson('/WebUntis/api/rest/view/v1/app/data'); const s = ap && ap.currentSchoolYear && ap.currentSchoolYear.dateRange && ap.currentSchoolYear.dateRange.start; if (/^\d{4}-\d\d-\d\d/.test(String(s))) from = String(s).slice(0, 10); } catch (e) { /* */ }
    if (!from) { const n = new Date(); from = (n.getMonth() >= 8 ? n.getFullYear() : n.getFullYear() - 1) + '-09-01'; }
    const earliest = items.map((i) => i.date).sort()[0]; if (earliest && earliest < from) from = earliest;
    const to = today;

    /* ---------- Stundenplan des Schuljahres lesen ---------- */
    const weeks = {}; let weekErr = 0;
    const weekDays = (date) => { const d = pd(date); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); const mon = ymd(d); d.setDate(d.getDate() + 4); if (!weeks[mon]) weeks[mon] = getJson('/WebUntis/api/rest/view/v1/timetable/entries?start=' + mon + '&end=' + ymd(d) + '&format=1&resourceType=TEACHER&resources=' + pid + '&periodTypes=&timetableType=MY_TIMETABLE&layer=1').then((j) => j.days || []).catch(() => { weekErr++; return []; }); return weeks[mon]; };
    const mons = []; { const m0 = pd(from); m0.setDate(m0.getDate() - ((m0.getDay() + 6) % 7)); for (const m = new Date(m0); ymd(m) <= to; m.setDate(m.getDate() + 7)) mons.push(ymd(m)); }
    let nW = 0; await pool(mons, 6, async (m) => { await weekDays(m); prog('Stundenplan lesen (Wochen)', ++nW, mons.length); });
    const lessons = [], seenIds = new Set();
    for (const m of mons) for (const day of await weekDays(m)) { if (day.date < from || day.date > to) continue; for (const g of day.gridEntries || []) if (g.type === 'NORMAL_TEACHING_PERIOD' && g.status !== 'CANCELLED' && !seenIds.has(g.ids[0])) { seenIds.add(g.ids[0]); lessons.push({ date: day.date, g, ttid: g.ids[0], time: g.duration.start.slice(11, 16) + '–' + g.duration.end.slice(11, 16) }); } }
    if (!lessons.length) throw new Error('Keine Unterrichtsstunden im Schuljahr gefunden.' + (weekErr ? ' (' + weekErr + ' Wochen nicht lesbar)' : ''));

    /* ---------- Details der Stunden (Klasse, Fach, Stoff) ---------- */
    const DET = {};
    const detail = (e) => { const k = e.ids[0]; if (!DET[k]) { const q = new URLSearchParams({ elementId: pid, elementType: 2, startDateTime: e.duration.start, endDateTime: e.duration.end, calendarEntryId: k }); DET[k] = getJson('/WebUntis/api/rest/view/v2/calendar-entry/detail?' + q).then((j) => (j.calendarEntries || [])[0] || null).catch(() => null); } return DET[k]; };
    let nD = 0; await pool(lessons, 8, async (L) => { L.d = await detail(L.g); prog('Stunden lesen', ++nD, lessons.length); });
    const usable = lessons.filter((L) => L.d);
    usable.forEach((L) => {
      const d = L.d; L.dcs = new Set((d.klasses || []).map((k) => normC(k.shortName || k.displayName)).filter(Boolean));
      L.names = [d.subject && d.subject.shortName, d.subject && d.subject.longName, d.subject && d.subject.displayName].map(norm).filter(Boolean);
      L.subj = (d.subject && d.subject.shortName) || ''; L.wuCls = (d.klasses || []).map((k) => k.shortName || k.displayName).join('+');
    });
    const fits = (cs, sj, L) => { const subjOk = !sj || L.names.some((n) => n === sj || (n.length > 2 && sj.length > 2 && (n.includes(sj) || sj.includes(n)))); if (!subjOk) return 0; const same = L.dcs.size === cs.size && [...cs].every((c) => L.dcs.has(c)); if (same) return 2; return sj && [...cs].some((c) => L.dcs.has(c)) ? 1 : 0; };
    const byDate = {}; usable.forEach((L) => (byDate[L.date] = byDate[L.date] || []).push(L));

    /* ---------- Zuordnung: App-Eintrag → Stunden ---------- */
    const appGrp = appGroups.map((g) => ({ g, cs: new Set((g.classes || []).map(normC).filter(Boolean)), sj: norm(g.subject) }));
    const forward = items.map((it) => { const cs = new Set((it.classes || []).map(normC).filter(Boolean)), sj = norm(it.subject); return { it, ls: (byDate[it.date] || []).filter((L) => fits(cs, sj, L)) }; });
    const back = {};
    usable.forEach((L) => { let best = null, bs = 0; for (const a of appGrp) { const sc = fits(a.cs, a.sj, L); if (sc > bs) { best = a; bs = sc; } } if (best) { L.slug = best.g.slug; const k = best.g.slug + '|' + L.date; (back[k] = back[k] || { slug: best.g.slug, date: L.date, ls: [] }).ls.push(L); } });

    /* ---------- Anwesenheitsseiten (Schüler, Fehlzeiten) ---------- */
    const parseClassreg = (t) => {
      const doc = new DOMParser().parseFromString(t, 'text/html');
      const form = doc.querySelector('[data-dojo-type$="ClassregPageFormAdapter"]'); if (!form) throw new Error('Anwesenheits-Formular nicht gefunden');
      const props = form.getAttribute('data-dojo-props') || ''; const i = props.indexOf('viewModel:'); const j = props.indexOf('{', i); if (i < 0 || j < 0) throw new Error('viewModel fehlt');
      let depth = 0, inStr = false, esc = false, k = j;
      for (; k < props.length; k++) { const ch = props[k]; if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; } else if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) { k++; break; } } }
      const hid = (doc.querySelector('input[name=_csrf]') || {}).value || ((/name="_csrf"[^>]*value="([^"]+)"/.exec(t) || /value="([^"]+)"[^>]*name="_csrf"/.exec(t) || [])[1]) || '';
      return { vm: JSON.parse(props.slice(j, k)), csrf: hid };
    };
    const pages = {};
    const loadPage = (ttid) => { if (!pages[ttid]) pages[ttid] = (async () => { const r = await fetch('/WebUntis/classregpage.do?ttid=' + ttid + '&isBlockSelected=false&request.preventCache=' + Date.now(), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }); if (!r.ok) throw new Error('Anwesenheit HTTP ' + r.status); return parseClassreg(await r.text()); })(); return pages[ttid]; };
    const needPages = new Set(); forward.filter((f) => hasAbs(f.it)).forEach((f) => f.ls.forEach((L) => needPages.add(L.ttid))); Object.values(back).forEach((b) => b.ls.forEach((L) => needPages.add(L.ttid)));
    const pageList = [...needPages]; let nP = 0, pageErr = 0;
    await pool(pageList, 8, async (id) => { try { await loadPage(id); } catch (e) { pageErr++; } prog('Anwesenheiten lesen', ++nP, pageList.length); });
    const getPage = async (id) => { try { return await loadPage(id); } catch (e) { return null; } };

    /* ---------- Stoff-Dialoge (aktueller Stoff je Stunde) ---------- */
    const readDialog = async (selId) => {
      const r = await fetch('/WebUntis/lessontopicdlg.do?selId=' + selId + '&request.preventCache=' + Date.now(), { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!r.ok) throw new Error('Dialog HTTP ' + r.status);
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const form = doc.querySelector('form#lessonTopic') || doc.querySelector('form'); if (!form) throw new Error('Formular nicht gefunden');
      const f = {};
      form.querySelectorAll('input,select,textarea').forEach((c) => {
        const n = c.getAttribute('name'); if (!n || c.disabled) return; const t = (c.getAttribute('type') || '').toLowerCase();
        if (['button', 'submit', 'image', 'file'].includes(t)) return; if ((t === 'checkbox' || t === 'radio') && !c.checked) return;
        f[n] = c.tagName === 'SELECT' ? ((c.querySelector('option[selected]') || c.options[0] || {}).value || '') : c.tagName === 'TEXTAREA' ? c.value || c.textContent : c.getAttribute('value') || '';
      });
      return f;
    };

    /* ---------- Zeilen der Vorschau (App → WebUntis) ---------- */
    const rows = [];
    for (const { it, ls } of forward) {
      if (!ls.length) {
        const cands = (byDate[it.date] || []).map((L) => L.time.slice(0, 5) + ' ' + (L.wuCls || '(keine Klasse)') + ' / ' + (L.subj || '(kein Fach)'));
        const note = (cands.length ? 'WebUntis hat an diesem Tag: ' + cands.join(' | ') + '. App: ' + (it.classes || []).join('+') + ' / ' + it.subject : 'Keine Unterrichtsstunden an diesem Tag gefunden.');
        if (hasText(it)) rows.push({ type: 'Stoff', it, state: 'nicht gefunden', note });
        if (hasAbs(it)) rows.push({ type: 'Fehlzeit', it, a: null, state: 'nicht gefunden', note });
        continue;
      }
      for (const L of ls) {
        if (hasText(it)) rows.push({ type: 'Stoff', it, L, sel: L.ttid, state: '' });
        if (hasAbs(it)) {
          const pg = await getPage(L.ttid);
          for (const a of it.absent) {
            if (!pg) { rows.push({ type: 'Fehlzeit', it, a, L, state: 'fehler', note: 'Anwesenheit nicht lesbar' }); continue; }
            const students = pg.vm.students || [], k = normN(a.nn) + normN(a.vn), alt = normN(a.vn) + normN(a.nn);
            const st = (a.wu && students.find((s) => String(s.id) === String(a.wu))) || students.find((s) => normN(s.longName) + normN(s.foreName) === k) || students.find((s) => normN(s.displayName) === k || normN(s.displayName) === alt) || students.find((s) => { const x = normN(s.longName) + normN(s.foreName); return x.startsWith(k) || k.startsWith(x); });
            rows.push({ type: 'Fehlzeit', it, a, L, pg, st, state: !st ? 'nicht in der Stunde' : st.absent ? 'schon abwesend' : 'eintragen' });
          }
        }
      }
    }
    const topicRows = rows.filter((r) => r.type === 'Stoff' && r.L); let nT = 0; const DLG = {};
    await pool(topicRows, 8, async (r) => {
      try {
        r.f = await readDialog(r.sel); DLG[r.sel] = r.f; const old = String(r.f.topic || '').trim();
        if (String(r.f.date) !== r.it.date.replace(/-/g, '')) { r.state = 'abweichend'; r.note = 'Datum im Dialog weicht ab'; }
        else if (!old) r.state = 'frei'; else if (old === String(r.it.text).trim()) r.state = 'gleich'; else { r.state = 'belegt'; r.note = old; }
      } catch (e) { r.state = 'fehler'; r.note = e.message; }
      prog('Stoff prüfen', ++nT, topicRows.length);
    });
    /* Plausibilität: stimmt der Stoff aus den Stundendetails mit dem Stoff-Dialog überein? */
    let mism = 0, cmp = 0; topicRows.forEach((r) => { if (r.f && r.L.d) { cmp++; if (String(r.f.topic || '').trim() !== String(r.L.d.teachingContent || '').trim()) mism++; } });
    const trustTopic = mism === 0;

    /* ---------- Schreiben ---------- */
    const CHANGE = ['change', 'Ändern', 'Submit'];
    async function writeTopic(row) {
      const fresh = await readDialog(row.sel); let last = '';
      for (const chg of CHANGE) {
        const o = new URLSearchParams(); o.set('selId', row.sel); o.set('request.preventCache', Date.now()); o.set('change', chg);
        const f = Object.assign({}, fresh, { topic: row.it.text });
        for (const k of ['keepOpen', 'topic', 'teachingMethod', 'remark', 'lessonNo', 'date', 'startTime', 'endTime', 'lastUpdate', '_csrf']) o.set(k, f[k] == null ? '' : f[k]);
        Object.keys(f).forEach((k) => { if (!o.has(k)) o.set(k, f[k]); });
        const r = await fetch('/WebUntis/lessontopicdlg.do?request.preventCache=' + Date.now(), { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': f._csrf, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: o.toString() });
        const t = await r.text(); last = 'HTTP ' + r.status + ' ' + t.slice(0, 80);
        let ok = false; try { ok = JSON.parse(t).success === true; } catch (e) { /* */ }
        if (!ok) continue;
        if (String((await readDialog(row.sel)).topic || '').trim() === String(row.it.text).trim()) return 'ok';
        last = 'Antwort „success“, aber Inhalt unverändert (change=' + chg + ')';
      }
      throw new Error(last);
    }
    let csrf2 = null;
    async function writeAbsence(r) {
      if (csrf2 === null) { csrf2 = ''; try { const t = await (await fetch('/WebUntis/embedded.do?isEmbeddedInModal=true', { credentials: 'same-origin' })).text(); const m = /"csrfToken"\s*:\s*"([^"]+)"/.exec(t); csrf2 = m ? m[1] : ''; } catch (e) { /* */ } }
      let last = '';
      for (const hdr of [r.pg.csrf, csrf2].filter(Boolean)) {
        const body = new URLSearchParams({ ttid: r.L.ttid, isBlockSelected: 'false', 'request.preventCache': Date.now(), insert: 'insert', selId: r.st.id, reload: '1', _csrf: r.pg.csrf });
        const res = await fetch('/WebUntis/classregpage.do?request.preventCache=' + Date.now(), { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF-TOKEN': hdr, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body.toString() });
        const t = await res.text(); last = 'HTTP ' + res.status + ' ' + t.slice(0, 80);
        let j = null; try { j = JSON.parse(t); } catch (e) { /* */ }
        const ids = j && j.args && j.args[0] && j.args[0].absentStudentIds;
        if (Array.isArray(ids) && ids.map(String).includes(String(r.st.id))) return 'ok';
      }
      throw new Error(last);
    }

    /* ---------- Rückmeldung WebUntis → App ---------- */
    const buildBack = () => {
      const out = [];
      for (const b of Object.values(back)) {
        const texts = trustTopic ? [...new Set(b.ls.map((L) => String(L.d.teachingContent || '').trim()).filter(Boolean))] : [];
        const abs = {};
        for (const L of b.ls) { const pg = pages[L.ttid] && pages[L.ttid]._v; if (pg) (pg.vm.students || []).forEach((s) => { if (s.absent) abs[s.id] = { wu: s.id, nn: nice(s.longName), vn: nice(s.foreName) }; }); }
        const absent = Object.values(abs); if (!texts.length && !absent.length) continue;
        const item = { slug: b.slug, date: b.date, stoff: texts, absent };
        const appIt = items.find((i) => i.slug === b.slug && i.date === b.date && hasText(i));
        if (appIt && texts.length && texts.join(' | ').replace(/\s+/g, ' ').toLowerCase() !== String(appIt.text).trim().replace(/\s+/g, ' ').toLowerCase()) { const l0 = b.ls.find((L) => String(L.d.teachingContent || '').trim() && DLG[L.ttid]); const lu = l0 && Number(DLG[l0.ttid].lastUpdate); if (lu) item.stoffMod = lu; }
        out.push(item);
      }
      return out;
    };
    /* aufgelöste Seiten für die synchrone Rückmeldung merken */
    for (const id of pageList) { const pg = await getPage(id); if (pg) pages[id]._v = pg; }
    async function copyBack() {
      const out = buildBack(); const payload = JSON.stringify({ v: 1, kind: 'webuntis_back', created: Date.now(), from, to, items: out });
      try { await navigator.clipboard.writeText(payload); alert('Kopiert (' + out.length + ' Tage). Jetzt in der App im Stundenplan auf „Von WebUntis übernehmen“ klicken.'); } catch (e) { prompt('Bitte alles kopieren und in der App einfügen:', payload); }
    }

    /* ---------- Vorschau ---------- */
    const COL = { frei: '#1b7f4b', eintragen: '#1b7f4b', gleich: '#566377', 'schon abwesend': '#566377', belegt: '#9a5b00' };
    const same = (r) => r.state === 'gleich' || r.state === 'schon abwesend';
    const cnt = (type, st) => rows.filter((r) => r.type === type && r.state === st && !r.result).length;
    let busy = false;
    const render = (extra) => {
      const shown = rows.filter((r) => !same(r) || r.result), hidden = rows.length - shown.length;
      const tb = el('table', 'border-collapse:collapse;width:100%;font-size:13px');
      const hd = el('tr'); ['Art', 'Datum · Zeit', 'Klasse · Fach', 'Eintrag', 'Status'].forEach((h) => hd.appendChild(el('th', 'text-align:left;border-bottom:2px solid #ccc;padding:4px 6px', h))); tb.appendChild(hd);
      shown.slice(0, 400).forEach((r) => {
        const tr = el('tr'); const c = (t, css) => tr.appendChild(el('td', 'border-bottom:1px solid #e3e3e3;padding:4px 6px;vertical-align:top;' + (css || ''), t));
        c(r.type, 'font-weight:600;color:' + (r.type === 'Stoff' ? '#2c56c8' : '#b45309'));
        c(r.it.date.split('-').reverse().join('.') + (r.L ? ' ' + r.L.time : ''));
        c(r.L ? (r.it.classes || []).join('+') + (r.L.wuCls && norm(r.L.wuCls) !== norm((r.it.classes || []).join('+')) ? ' → ' + r.L.wuCls : '') + ' · ' + (r.L.subj || r.it.subject) : (r.it.classes || []).join('+') + ' · ' + r.it.subject);
        c(r.type === 'Stoff' ? String(r.it.text).slice(0, 80) + (r.state === 'belegt' ? '  (alt: ' + String(r.note).slice(0, 50) + ')' : '') : (r.a ? r.a.nn + ' ' + r.a.vn : ''));
        c(r.result || r.state + (r.note && r.state !== 'belegt' ? ' [' + String(r.note).slice(0, 300) + ']' : ''), 'font-weight:600;color:' + (r.result === 'ok' ? '#1b7f4b' : COL[r.state] || '#b3261e'));
        tb.appendChild(tr);
      });
      const nS = cnt('Stoff', 'frei'), nF = cnt('Fehlzeit', 'eintragen'), nB = cnt('Stoff', 'belegt'), acts = el('div');
      if (!busy) {
        if (nS || nF) {
          acts.appendChild(btn('Nur Testeintrag (je 1 Stoff und 1 Fehlzeit)', '#2c56c8', () => run(1, false)));
          acts.appendChild(btn('Alles eintragen (' + nS + ' Stoff, ' + nF + ' Fehlzeiten)', '#1b7f4b', () => run(Infinity, false)));
        }
        if (nB) acts.appendChild(btn('Auch belegten Stoff überschreiben (' + nB + ')', '#9a5b00', () => { if (confirm('Vorhandenen Stoff in WebUntis wirklich überschreiben?')) run(Infinity, true); }));
        acts.appendChild(btn('Für die App kopieren (WebUntis → App)', '#6d28d9', copyBack));
      }
      acts.appendChild(btn('Schließen', '#555', close));
      const b0 = buildBack(); const secs = Math.round((Date.now() - T0) / 1000);
      show(extra || 'Schuljahr ' + from.slice(0, 4) + '/' + String(Number(from.slice(0, 4)) + 1).slice(2) + ': ' + nS + ' Stoff, ' + nF + ' Fehlzeiten bereit',
        para('Gelesen: ' + usable.length + ' Stunden vom ' + from.split('-').reverse().join('.') + ' bis heute (' + secs + ' s). Es wird nichts geschrieben, bevor du unten einen Knopf drückst. Belegte Stunden werden nur nach ausdrücklicher Wahl überschrieben, bereits abwesende Schüler bleiben unberührt.' + (hidden ? ' ' + hidden + ' Einträge sind bereits identisch und ausgeblendet.' : ''), 'color:#566377'),
        para('Aus WebUntis: ' + b0.filter((i) => i.stoff.length).length + ' Tage mit Stoff, ' + b0.filter((i) => i.absent.length).length + ' Tage mit Fehlzeiten. Mit „Für die App kopieren“ gehen sie in die App, die Neues sofort ergänzt.' + (trustTopic ? '' : ' Achtung: Der Stoff aus den Stundendetails weicht bei ' + mism + ' von ' + cmp + ' Stunden vom Stoff-Dialog ab, deshalb wird Stoff nicht zurückgemeldet (nur Fehlzeiten).') + (weekErr || pageErr ? ' Nicht lesbar: ' + weekErr + ' Wochen, ' + pageErr + ' Anwesenheiten.' : ''), 'color:#6d28d9'),
        tb, shown.length > 400 ? para('… und ' + (shown.length - 400) + ' weitere Zeilen (werden mit „Alles eintragen“ trotzdem berücksichtigt).', 'color:#566377') : para(''), acts);
    };
    async function run(limit, overwrite) {
      if (busy) return; busy = true; const done = { Stoff: 0, Fehlzeit: 0 }, fail = { Stoff: 0, Fehlzeit: 0 };
      for (const r of rows) {
        if (done[r.type] >= limit || r.result === 'ok') continue;
        const go = r.type === 'Stoff' ? (r.state === 'frei' || (overwrite && r.state === 'belegt')) : r.state === 'eintragen';
        if (!go) continue;
        try { if (r.type === 'Stoff') { await writeTopic(r); r.L.d.teachingContent = r.it.text; } else { await writeAbsence(r); r.st.absent = true; } r.result = 'ok'; done[r.type]++; }
        catch (e) { r.note = e.message; r.state = 'fehler'; fail[r.type]++; }
        const now = Date.now(); if (now - lastShow > 300 || limit === 1) { lastShow = now; render('Schreibe … ' + done.Stoff + ' Stoff, ' + done.Fehlzeit + ' Fehlzeiten'); } await sleep(150);
      }
      busy = false; render('Fertig: ' + done.Stoff + ' Stoff und ' + done.Fehlzeit + ' Fehlzeit(en) eingetragen' + (fail.Stoff + fail.Fehlzeit ? ', ' + (fail.Stoff + fail.Fehlzeit) + ' Fehler' : '') + '. Bitte in WebUntis kontrollieren (Seite neu laden).');
    }
    render();
  } catch (e) {
    show('Fehler', para(String((e && e.message) || e), 'color:#b3261e'), btn('Schließen', '#555', close));
  }
})();
