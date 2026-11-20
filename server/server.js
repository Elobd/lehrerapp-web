// Lehrer-App Server: Dokument-API + Live-Sync (SSE) + Login + KI-Proxy, ohne externe Abhängigkeiten.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dir, '..', 'data');
const WEB_DIR = process.env.WEB_DIR || path.join(__dir, '..', 'web');
const PASSWORD = process.env.APP_PASSWORD || '';
const SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update('lehrerapp|' + PASSWORD).digest('hex');
const AI_KEY = process.env.ANTHROPIC_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';
const COLLECTIONS = new Set(['tests', 'settings']); // werden mit neuen Modulen erweitert
const MAX_BODY = 25 * 1024 * 1024;

if (!PASSWORD || PASSWORD === 'HIER-PASSWORT-EINTRAGEN') { console.error('APP_PASSWORD ist nicht gesetzt (oder noch der Platzhalter). Bitte in docker-compose.yml ein eigenes Passwort eintragen. Abbruch.'); process.exit(1); }
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'lehrerapp.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS docs(coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(coll,id));`);
const qList = db.prepare('SELECT id,data,updated FROM docs WHERE coll=? AND deleted=0');
const qOne = db.prepare('SELECT updated FROM docs WHERE coll=? AND id=?');
const qPut = db.prepare('INSERT INTO docs(coll,id,data,updated,deleted) VALUES(?,?,?,?,0) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data,updated=excluded.updated,deleted=0');
const qDel = db.prepare('INSERT INTO docs(coll,id,data,updated,deleted) VALUES(?,?,?,?,1) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data,updated=excluded.updated,deleted=1');
const qTomb = db.prepare('SELECT id,updated FROM docs WHERE coll=? AND deleted=1');

// ---------- Automatisches Backup (konsistente Kopie der Datenbank) ----------
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const KEEP_BACKUPS = +process.env.KEEP_BACKUPS || 30;
function listBackups() {
  try { return fs.readdirSync(BACKUP_DIR).filter((f) => /^lehrerapp-\d{4}-\d\d-\d\d\.sqlite$/.test(f)).sort().map((f) => ({ name: f, bytes: fs.statSync(path.join(BACKUP_DIR, f)).size })); } catch (e) { return []; }
}
function backupNow() {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const name = 'lehrerapp-' + new Date().toISOString().slice(0, 10) + '.sqlite';
    const tmp = path.join(BACKUP_DIR, '.tmp-' + name), file = path.join(BACKUP_DIR, name);
    try { fs.rmSync(tmp); } catch (e) { /* */ }
    db.exec("VACUUM INTO '" + tmp.replace(/'/g, "''") + "'");
    fs.renameSync(tmp, file);
    const all = listBackups(); all.slice(0, Math.max(0, all.length - KEEP_BACKUPS)).forEach((b) => fs.rmSync(path.join(BACKUP_DIR, b.name)));
    console.log('Backup erstellt: ' + name + ' (' + fs.statSync(file).size + ' Bytes), ' + listBackups().length + ' Sicherungen vorhanden');
    return true;
  } catch (e) { console.error('Backup fehlgeschlagen:', e.message); return false; }
}

// ---------- Sessions ----------
const sign = (v) => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const makeToken = () => { const exp = Date.now() + 90 * 864e5; return exp + '.' + sign(String(exp)); };
const validToken = (t) => { if (!t) return false; const [e, s] = t.split('.'); if (!e || !s || +e < Date.now()) return false; const a = Buffer.from(s), b = Buffer.from(sign(e)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const cookieOf = (req, n) => (req.headers.cookie || '').split(/;\s*/).map((c) => c.split('=')).find((c) => c[0] === n)?.[1];
const authed = (req) => validToken(cookieOf(req, 'sid'));
const fails = new Map();
function throttled(ip) { const f = fails.get(ip); return f && f.n >= 8 && Date.now() - f.t < 15 * 60e3; }

// ---------- Live-Sync ----------
const clients = new Set();
function broadcast(msg, exceptDevice) {
  const line = 'data: ' + JSON.stringify(msg) + '\n\n';
  for (const c of clients) if (c.device !== exceptDevice) c.res.write(line);
}

// ---------- Hilfen ----------
const json = (res, code, obj) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > MAX_BODY) { no(new Error('too large')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch).toString('utf8'))); req.on('error', no); });
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

function serveStatic(req, res, pathname) {
  let p = pathname === '/' ? '/index.html' : pathname;
  const file = path.normalize(path.join(WEB_DIR, p));
  if (!file.startsWith(WEB_DIR) || path.basename(file) === 'original.html') { res.writeHead(404); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': file.endsWith('sw.js') ? 'no-cache' : 'no-cache' });
    res.end(buf);
  });
}

async function handleAi(req, res) {
  if (!AI_KEY) return json(res, 501, { error: 'KI-Import nicht eingerichtet (ANTHROPIC_API_KEY fehlt).' });
  const { prompt, images } = JSON.parse(await body(req));
  const content = [];
  for (const im of images || []) content.push({ type: 'image', source: { type: 'base64', media_type: im.type || 'image/jpeg', data: im.data } });
  content.push({ type: 'text', text: String(prompt || '') + '\n\nAntworte ausschließlich mit gültigem JSON.' });
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 4096, messages: [{ role: 'user', content }] }),
  });
  const out = await r.json();
  if (!r.ok) return json(res, 502, { error: out?.error?.message || 'KI-Fehler' });
  const txt = (out.content || []).map((c) => c.text || '').join('');
  const m = txt.match(/\{[\s\S]*\}/);
  try { return json(res, 200, { result: JSON.parse(m ? m[0] : txt) }); } catch { return json(res, 502, { error: 'KI-Antwort nicht lesbar' }); }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    const ip = req.socket.remoteAddress;

    if (p === '/api/login' && req.method === 'POST') {
      if (throttled(ip)) return json(res, 429, { error: 'Zu viele Versuche. Bitte später erneut.' });
      const { password } = JSON.parse((await body(req)) || '{}');
      const a = Buffer.from(String(password || '')), b = Buffer.from(PASSWORD);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        fails.delete(ip);
        const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
        res.setHeader('set-cookie', `sid=${makeToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${90 * 86400}${secure}`);
        return json(res, 200, { ok: true });
      }
      const f = fails.get(ip) || { n: 0, t: 0 }; f.n++; f.t = Date.now(); fails.set(ip, f);
      return json(res, 401, { error: 'Falsches Passwort' });
    }
    if (p === '/api/session') return json(res, authed(req) ? 200 : 401, { ok: authed(req) });

    if (p.startsWith('/api/')) {
      if (!authed(req)) return json(res, 401, { error: 'Nicht angemeldet' });

      if (p === '/api/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive', 'x-accel-buffering': 'no' });
        res.write('retry: 3000\n\n');
        const c = { res, device: url.searchParams.get('device') || '' };
        clients.add(c);
        const ka = setInterval(() => res.write(': ka\n\n'), 25000);
        req.on('close', () => { clearInterval(ka); clients.delete(c); });
        return;
      }
      if (p === '/api/backups') return json(res, 200, { backups: listBackups(), keep: KEEP_BACKUPS });
      if (p === '/api/backup' && req.method === 'POST') { const ok = backupNow(); return json(res, ok ? 200 : 500, { ok, backups: listBackups() }); }
      if (p === '/api/ai' && req.method === 'POST') return await handleAi(req, res);
      if (p === '/api/export') {
        const out = {};
        for (const c of COLLECTIONS) out[c] = Object.fromEntries(qList.all(c).map((r) => [r.id, JSON.parse(r.data)]));
        res.setHeader('content-disposition', 'attachment; filename="lehrerapp-export.json"');
        return json(res, 200, out);
      }
      if (p === '/api/import' && req.method === 'POST') {
        const inp = JSON.parse(await body(req)); let n = 0; const now = Date.now();
        for (const c of COLLECTIONS) for (const [id, d] of Object.entries(inp[c] || {})) { qPut.run(c, String(id), JSON.stringify(d), now); n++; }
        broadcast({ type: 'reload' });
        return json(res, 200, { imported: n });
      }

      const m = p.match(/^\/api\/c\/([a-z0-9_-]+)(?:\/([^/]+))?$/i);
      if (m && COLLECTIONS.has(m[1])) {
        const [, coll, rawId] = m; const id = rawId && decodeURIComponent(rawId);
        const device = req.headers['x-device'] || '';
        if (!id && req.method === 'GET') {
          return json(res, 200, { docs: qList.all(coll).map((r) => ({ id: r.id, data: JSON.parse(r.data), updated: r.updated })), deleted: qTomb.all(coll).map((r) => ({ id: r.id, updated: r.updated })) });
        }
        if (id && req.method === 'PUT') {
          const ts = +req.headers['x-ts'] || Date.now();
          const cur = qOne.get(coll, id);
          if (cur && cur.updated > ts) return json(res, 200, { ok: true, ignored: true });
          const data = await body(req); JSON.parse(data);
          qPut.run(coll, id, data, ts);
          broadcast({ type: 'put', coll, id, data: JSON.parse(data), updated: ts }, device);
          return json(res, 200, { ok: true });
        }
        if (id && req.method === 'DELETE') {
          const ts = +req.headers['x-ts'] || Date.now();
          const cur = qOne.get(coll, id);
          if (cur && cur.updated > ts) return json(res, 200, { ok: true, ignored: true });
          qDel.run(coll, id, '{}', ts);
          broadcast({ type: 'del', coll, id, updated: ts }, device);
          return json(res, 200, { ok: true });
        }
      }
      return json(res, 404, { error: 'Unbekannte API' });
    }

    if (req.method === 'GET') return serveStatic(req, res, p);
    res.writeHead(405); res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Serverfehler' }); else res.end();
  }
});
server.listen(PORT, () => console.log(`Lehrer-App läuft auf Port ${PORT}, Daten in ${DATA_DIR}`));
backupNow();
setInterval(backupNow, 6 * 3600 * 1000);
