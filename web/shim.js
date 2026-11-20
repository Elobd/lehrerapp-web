/* Ersetzt die Claude-Laufzeit (window.claude.use) durch NAS-Anbindung:
   'db' = Dokument-Speicher mit Offline-Cache, Warteschlange und Live-Sync, 'sample' = KI-Proxy,
   'downloads' = Browser-Download, 'mcp' = Kalender (noch nicht angebunden). */
(function () {
  const LS = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } };
  const device = LS('nas-device') || (function () { const d = Math.random().toString(36).slice(2, 10); LS('nas-device', d); return d; })();
  let cache = LS('nas-cache-v1') || {};      // {coll:{id:{data,ts}}}
  let outbox = LS('nas-outbox-v1') || [];    // [{op,coll,id,data,ts}]
  const subs = {};                           // coll -> [cb]
  let online = false, flushing = false, es = null;
  const saveCache = () => LS('nas-cache-v1', cache);
  const saveBox = () => LS('nas-outbox-v1', outbox);

  function snap(coll, fromCache) {
    const m = cache[coll] || {};
    return { docs: Object.keys(m).map((id) => ({ id, data: () => m[id].data })), metadata: { fromCache } };
  }
  const emit = (coll, fromCache) => (subs[coll] || []).forEach((cb) => cb(snap(coll, fromCache)));

  /* ---------- Login ---------- */
  let loginP = null;
  function needLogin() {
    if (loginP) return loginP;
    loginP = new Promise((ok) => {
      const o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;z-index:999;background:#3a3d42;display:grid;place-items:center;padding:16px;font:16px system-ui,sans-serif';
      o.innerHTML = '<form style="background:#fff;border-radius:12px;padding:24px;max-width:340px;width:100%;display:grid;gap:12px"><h2 style="margin:0">Anmelden</h2><input type="password" placeholder="Passwort" autocomplete="current-password" style="font:inherit;padding:10px;border:1px solid #bbb;border-radius:8px"><button style="font:inherit;font-weight:600;padding:10px;border:0;border-radius:8px;background:#2c56c8;color:#fff">Anmelden</button><div class="err" style="color:#b3261e;min-height:1.2em"></div></form>';
      document.body.appendChild(o);
      const f = o.querySelector('form'), i = o.querySelector('input'), e = o.querySelector('.err');
      i.focus();
      f.onsubmit = async (ev) => {
        ev.preventDefault();
        try {
          const r = await fetch('/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: i.value }) });
          if (r.ok) { o.remove(); loginP = null; ok(); } else e.textContent = (await r.json()).error || 'Fehler';
        } catch (x) { e.textContent = 'Server nicht erreichbar'; }
      };
    });
    return loginP;
  }
  async function api(path, opt) {
    for (;;) {
      const r = await fetch(path, opt);
      if (r.status === 401) { await needLogin(); continue; }
      return r;
    }
  }

  /* ---------- Sync ---------- */
  async function flush() {
    if (flushing) return; flushing = true;
    try {
      while (outbox.length) {
        const o = outbox[0];
        const h = { 'x-device': device, 'x-ts': String(o.ts) };
        const r = await api('/api/c/' + o.coll + '/' + encodeURIComponent(o.id), o.op === 'del' ? { method: 'DELETE', headers: h } : { method: 'PUT', headers: h, body: JSON.stringify(o.data) });
        if (!r.ok && r.status >= 500) throw new Error('server');
        outbox.shift(); saveBox();
      }
      online = true;
    } catch (e) { online = false; } finally { flushing = false; }
  }
  async function pull(coll) {
    try {
      const r = await api('/api/c/' + coll);
      if (!r.ok) throw new Error();
      const srv = await r.json();
      const pending = new Set(outbox.filter((o) => o.coll === coll).map((o) => o.id));
      const m = {};
      srv.docs.forEach((d) => { m[d.id] = { data: d.data, ts: d.updated }; });
      pending.forEach((id) => { if (cache[coll] && cache[coll][id]) m[id] = cache[coll][id]; else delete m[id]; });
      cache[coll] = m; saveCache(); online = true; emit(coll, false);
    } catch (e) { online = false; emit(coll, true); }
  }
  function connect(colls) {
    if (es) es.close();
    es = new EventSource('/api/events?device=' + device);
    es.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.type === 'reload') return colls.forEach(pull);
      if (!colls.includes(m.coll)) return;
      const c = (cache[m.coll] = cache[m.coll] || {});
      if (outbox.some((o) => o.coll === m.coll && o.id === m.id)) return;
      if (m.type === 'put') c[m.id] = { data: m.data, ts: m.updated }; else delete c[m.id];
      saveCache(); emit(m.coll, false);
    };
    es.onopen = async () => { online = true; await flush(); colls.forEach(pull); };
    es.onerror = () => { online = false; };
  }

  const dbApi = {
    collection(coll) {
      return {
        doc(id) {
          return {
            async set(data) { const ts = Date.now(); (cache[coll] = cache[coll] || {})[id] = { data, ts }; saveCache(); outbox = outbox.filter((o) => !(o.coll === coll && o.id === id)); outbox.push({ op: 'put', coll, id, data, ts }); saveBox(); flush(); },
            async delete() { const ts = Date.now(); if (cache[coll]) delete cache[coll][id]; saveCache(); outbox = outbox.filter((o) => !(o.coll === coll && o.id === id)); outbox.push({ op: 'del', coll, id, ts }); saveBox(); flush(); },
          };
        },
        onSnapshot(cb) { (subs[coll] = subs[coll] || []).push(cb); setTimeout(() => cb(snap(coll, true)), 0); dbApi._start(); return () => { subs[coll] = subs[coll].filter((x) => x !== cb); }; },
      };
    },
    _started: false,
    _start() { if (this._started) return; this._started = true; (async () => { try { const r = await fetch('/api/session'); if (r.status === 401) await needLogin(); } catch (e) { /* offline: mit Cache starten */ } connect(['tests', 'settings']); })(); window.addEventListener('online', () => { flush(); ['tests', 'settings'].forEach(pull); }); },
  };

  /* ---------- KI-Proxy ---------- */
  const blobToB64 = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(b); });
  let aiAvail = null;
  const sample = {
    async limits() { return { images: true }; },
    async json(prompt, opt) {
      const images = [];
      for (const im of (opt && opt.images) || []) images.push({ type: im.type || 'image/jpeg', data: await blobToB64(im) });
      const r = await api('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, images }) });
      const j = await r.json();
      if (!r.ok) throw { message: j.error || 'KI-Import nicht verfügbar' };
      return j.result;
    },
  };

  const downloads = {
    async save({ filename, data }) {
      const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },
  };

  const mcp = { async callTool() { throw { code: 'server_not_connected' }; } };

  window.claude = { use: async (n) => ({ db: dbApi, sample, downloads, mcp }[n] || null) };

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
