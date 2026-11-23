// Lehrer-App Server: Dokument-API + Live-Sync (SSE) + Login + KI-Proxy, ohne externe Abhängigkeiten.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
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
/* Lokale Spracherkennung (z. B. Whisper-Container auf der NAS): STT_URL=http://whisper:8000, STT_MODEL=Systran/faster-whisper-small */
/* USB-Stick an der NAS: in der docker-compose.yml z. B. /volumeUSB1/usbshare:/usb einbinden (USB_PATH=/usb) */
const USB_PATH = process.env.USB_PATH || '/usb';
const usbOk = () => { try { return fs.statSync(USB_PATH).isDirectory() && (fs.accessSync(USB_PATH, fs.constants.W_OK), true); } catch { return false; } };
const STT_URL = (process.env.STT_URL || '').replace(/\/+$/, '');
const STT_MODEL = process.env.STT_MODEL || 'Systran/faster-whisper-small';
const COLLECTIONS = new Set(['tests', 'settings']); // werden mit neuen Modulen erweitert
const MAX_BODY = 25 * 1024 * 1024;

if (!PASSWORD || PASSWORD === 'HIER-PASSWORT-EINTRAGEN') { console.error('APP_PASSWORD ist nicht gesetzt (oder noch der Platzhalter). Bitte in docker-compose.yml ein eigenes Passwort eintragen. Abbruch.'); process.exit(1); }
fs.mkdirSync(DATA_DIR, { recursive: true });

const FILES_DIR = path.join(DATA_DIR, 'files');
const MAX_FILE = 1024 * 1024 * 1024;
fs.mkdirSync(FILES_DIR, { recursive: true });
function safeRel(rel) {
  const parts = String(rel).split('/').map((x) => x.replace(/[\\:*?"<>|\u0000-\u001f]/g, '_').trim()).filter((x) => x && x !== '.' && x !== '..').map((x) => x.replace(/^\.+/, '_'));
  return parts.slice(0, 6).join('/');
}
function listFiles(rel) {
  const out = [], root = path.join(FILES_DIR, rel);
  const walk = (d, pre) => { let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; } for (const e of ents) { const r = pre ? pre + '/' + e.name : e.name; if (e.isDirectory()) walk(path.join(d, e.name), r); else { const st = fs.statSync(path.join(d, e.name)); out.push({ path: rel ? rel + '/' + r : r, size: st.size, mtime: st.mtimeMs }); } } };
  walk(root, '');
  return out.sort((a, b) => b.mtime - a.mtime);
}
/* YouTube-Infos (Titel, Dauer, Kanal) für Material-Quellen. Es wird nur die Video-Adresse an YouTube gesendet. */
function ytId(u) {
  let x; try { x = new URL(String(u).trim()); } catch { return null; }
  const h = x.hostname.replace(/^(www\.|m\.|music\.)/, '');
  if (h === 'youtu.be') return /^[\w-]{11}$/.test(x.pathname.slice(1, 12)) ? x.pathname.slice(1, 12) : null;
  if (h !== 'youtube.com' && h !== 'youtube-nocookie.com') return null;
  const v = x.searchParams.get('v') || (x.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/) || [])[1];
  return v && /^[\w-]{11}$/.test(v) ? v : null;
}
const jsUnesc = (t) => String(t || '').replace(/\\u0026/g, '&').replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function parseWatchPage(html) {
  const out = {};
  const len = html.match(/"lengthSeconds":"(\d+)"/); if (len) out.seconds = +len[1];
  else { const d = html.match(/itemprop="duration" content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/); if (d) out.seconds = (+d[1] || 0) * 3600 + (+d[2] || 0) * 60 + (+d[3] || 0); }
  const ch = html.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/); if (ch) out.channel = jsUnesc(ch[1]);
  const id = html.match(/"channelId":"(UC[\w-]{22})"/); if (id) out.channelUrl = 'https://www.youtube.com/channel/' + id[1];
  const desc = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/); if (desc) out.description = jsUnesc(desc[1]).replace(/\\n/g, ' ').slice(0, 1500);
  const t = html.match(/<meta property="og:title" content="([^"]*)"/); if (t) out.title = jsUnesc(t[1]);
  return out;
}
async function ytInfo(rawUrl) {
  const id = ytId(rawUrl); if (!id) return null;
  const url = 'https://www.youtube.com/watch?v=' + id, info = { id, url };
  const hdr = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', 'accept-language': 'de-AT,de;q=0.9', cookie: 'CONSENT=YES+1; SOCS=CAI' };
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(url), { headers: hdr, signal: AbortSignal.timeout(8000) });
    if (r.ok) { const j = await r.json(); info.title = j.title; info.channel = j.author_name; info.channelUrl = j.author_url; }
  } catch { /* weiter mit der Seite */ }
  try {
    const r = await fetch(url, { headers: hdr, signal: AbortSignal.timeout(10000) });
    if (r.ok) { const p = parseWatchPage(await r.text()); for (const k of ['seconds', 'title', 'channel', 'channelUrl', 'description']) if (info[k] == null && p[k] != null) info[k] = p[k]; }
  } catch { /* nur Teilergebnis */ }
  return info;
}
/* Video-Download auf die NAS (yt-dlp) samt Untertitel-Text. Läuft im Hintergrund, ein Auftrag nach dem anderen. */
const YTDLP = (() => { try { const r = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; } catch { return ''; } })();
const jobs = new Map(), queue = [];
const vttText = (v) => { const seen = new Set(), out = []; for (const ln of String(v).split(/\r?\n/)) { const t = ln.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').trim(); if (!t || /^(WEBVTT|Kind:|Language:|NOTE)/.test(t) || /-->/.test(t) || /^\d+$/.test(t)) continue; if (seen.has(t)) continue; seen.add(t); out.push(t); } return out.join(' '); };
function runNext() {
  if (jobs.get('_run') || !queue.length) return;
  const j = queue.shift(); jobs.set('_run', j.id); j.state = 'running'; j.msg = 'Download läuft …';
  const dir = path.join(FILES_DIR, 'Material', 'Videos'); fs.mkdirSync(dir, { recursive: true });
  const args = ['--no-playlist', '--no-progress', '-f', 'bv*[height<=720]+ba/b[height<=720]/b', '--merge-output-format', 'mp4', '--write-subs', '--write-auto-subs', '--sub-langs', 'de.*,en.*', '--sub-format', 'vtt', '--js-runtimes', 'node', '-o', path.join(dir, j.id + '.%(ext)s'), j.url];
  const p = spawn('yt-dlp', args, { stdio: ['ignore', 'pipe', 'pipe'] }); let err = '';
  p.stderr.on('data', (d) => { err = (err + d).slice(-1500); });
  p.stdout.on('data', (d) => { const m = String(d).match(/\[download\]\s+([\d.]+)%/); if (m) j.msg = 'Download läuft … ' + m[1] + ' %'; });
  const done = (code) => {
    jobs.delete('_run');
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(j.id + '.')), mp4 = files.find((f) => /\.(mp4|mkv|webm)$/.test(f)), vtt = files.find((f) => /\.vtt$/.test(f));
    if (code === 0 && mp4) { j.state = 'done'; j.file = 'Material/Videos/' + mp4; j.size = fs.statSync(path.join(dir, mp4)).size; j.transcript = vtt ? vttText(fs.readFileSync(path.join(dir, vtt), 'utf8')) : ''; j.msg = 'fertig'; files.filter((f) => /\.vtt$/.test(f)).forEach((f) => { try { fs.unlinkSync(path.join(dir, f)); } catch { /* */ } }); }
    else { j.state = 'error'; j.msg = (err.split('\n').filter(Boolean).pop() || 'Download fehlgeschlagen').slice(0, 300); }
    runNext();
  };
  p.on('error', (e) => { j.state = 'error'; j.msg = String(e.message); jobs.delete('_run'); runNext(); });
  p.on('close', done);
}
function bodyBuf(req, max) {
  return new Promise((ok, no) => { const ch = []; let n = 0; req.on('data', (c) => { n += c.length; if (n > max) { no(new Error('Datei zu groß')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch))); req.on('error', no); });
}
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
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mkv': 'video/x-matroska', '.vtt': 'text/vtt', '.epub': 'application/epub+zip', '.png': 'image/png', '.css': 'text/css', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

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

      if (p === '/api/version') return json(res, 200, { version: '2026-11-20-material', files: true, ytdlp: !!YTDLP, ai: !!AI_KEY, stt: !!STT_URL, usb: usbOk() });
      if (p === '/api/stt' && req.method === 'POST') {
        if (!STT_URL) return json(res, 501, { error: 'Lokale Spracherkennung nicht eingerichtet (STT_URL fehlt).' });
        const buf = await bodyBuf(req, 25 * 1024 * 1024);
        if (!buf.length) return json(res, 400, { error: 'Keine Aufnahme erhalten' });
        const ct = String(req.headers['content-type'] || 'audio/webm'), ext = /mp4|m4a|aac/.test(ct) ? 'm4a' : /ogg/.test(ct) ? 'ogg' : /wav/.test(ct) ? 'wav' : 'webm';
        const fd = new FormData(); fd.append('file', new Blob([buf], { type: ct.split(';')[0] }), 'aufnahme.' + ext); fd.append('model', STT_MODEL); fd.append('language', 'de'); fd.append('response_format', 'json');
        try {
          const r = await fetch(STT_URL + '/v1/audio/transcriptions', { method: 'POST', body: fd, signal: AbortSignal.timeout(120000) });
          const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch { j = { text: t }; }
          if (!r.ok) return json(res, 502, { error: (j && (j.error && (j.error.message || j.error) || j.detail)) || ('Spracherkennung antwortete mit Fehler ' + r.status) });
          return json(res, 200, { text: String(j.text || '').trim() });
        } catch (e) { return json(res, 502, { error: 'Spracherkennung nicht erreichbar: ' + (e && e.message || e) }); }
      }
      if (p === '/api/usb/copy' && req.method === 'POST') {
        if (!usbOk()) return json(res, 409, { error: 'Kein USB-Stick gefunden. Bitte Stick an die NAS stecken und in der docker-compose.yml einbinden (USB_PATH).' });
        const { files } = JSON.parse((await body(req)) || '{}'); const dir = path.join(USB_PATH, 'Druck'); fs.mkdirSync(dir, { recursive: true });
        const copied = [], failed = [];
        for (const f of Array.isArray(files) ? files : []) {
          try { const rel = safeRel(String(f)); const src = path.join(FILES_DIR, rel); if (!rel || !fs.statSync(src).isFile()) throw new Error('nicht gefunden'); let dst = path.join(dir, path.basename(rel)); const ex = path.extname(dst); let k = 1; while (fs.existsSync(dst)) dst = path.join(dir, path.basename(rel, ex) + ' (' + (++k) + ')' + ex);
            fs.copyFileSync(src, dst); const fd = fs.openSync(dst, 'r'); try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); } copied.push(path.basename(dst)); } catch (e) { failed.push(String(f) + ': ' + (e && e.message || e)); }
        }
        return json(res, 200, { ok: !failed.length, copied, failed, hint: 'Vor dem Abziehen den Stick in DSM auswerfen.' });
      }
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

      if (p === '/api/yt' && req.method === 'GET') {
        const info = await ytInfo(url.searchParams.get('url') || '');
        if (!info) return json(res, 400, { error: 'Das ist kein YouTube-Link.' });
        if (!info.title && info.seconds == null && !info.channel) return json(res, 502, { error: 'YouTube hat keine Daten geliefert.' });
        return json(res, 200, info);
      }
      if (p === '/api/yt/download' && req.method === 'POST') {
        if (!YTDLP) return json(res, 501, { error: 'yt-dlp ist auf der NAS nicht installiert. Der Container muss mit dem neuen Dockerfile neu gebaut werden.' });
        const b = JSON.parse((await body(req)) || '{}'), vid = ytId(b.url || ''), id = String(b.id || '').replace(/[^\w-]/g, '').slice(0, 40);
        if (!vid || !id) return json(res, 400, { error: 'Kein gültiger YouTube-Link' });
        const cur = jobs.get(id);
        if (cur && (cur.state === 'running' || cur.state === 'queued')) return json(res, 200, { state: cur.state });
        const j = { id, url: 'https://www.youtube.com/watch?v=' + vid, state: 'queued', msg: 'wartet' }; jobs.set(id, j); queue.push(j); runNext();
        return json(res, 200, { state: j.state });
      }
      if (p === '/api/yt/status' && req.method === 'GET') {
        const id = String(url.searchParams.get('id') || '').replace(/[^\w-]/g, ''), j = jobs.get(id);
        if (!j) { const f = ['mp4', 'mkv', 'webm'].map((e) => 'Material/Videos/' + id + '.' + e).find((x) => fs.existsSync(path.join(FILES_DIR, x))); return json(res, 200, f ? { state: 'done', file: f, size: fs.statSync(path.join(FILES_DIR, f)).size } : { state: 'none', available: !!YTDLP }); }
        const out = { state: j.state, msg: j.msg, file: j.file, size: j.size, available: !!YTDLP }; if (j.state === 'done' && j.transcript != null) { out.transcript = j.transcript; delete j.transcript; }
        return json(res, 200, out);
      }
      /* Dateiablage (Material): data/files/<Ordner>/<Datei> */
      if (p === '/api/files' && req.method === 'GET') return json(res, 200, { files: listFiles(safeRel(url.searchParams.get('dir') || '')) });
      if (p === '/api/file') {
        const rel = safeRel(url.searchParams.get('path') || '');
        if (!rel) return json(res, 400, { error: 'Pfad fehlt' });
        const abs = path.join(FILES_DIR, rel);
        if (req.method === 'PUT') {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          const tmp = abs + '.part', ws = fs.createWriteStream(tmp); let n = 0, tooBig = false;
          try {
            await new Promise((ok, no) => {
              req.on('data', (c) => { n += c.length; if (n > MAX_FILE && !tooBig) { tooBig = true; no(new Error('Datei zu groß (mehr als 1 GB)')); req.unpipe(ws); ws.destroy(); } });
              req.on('error', no); ws.on('error', no); ws.on('finish', ok);
              req.on('aborted', () => no(new Error('Übertragung abgebrochen')));
              req.pipe(ws);
            });
          } catch (e) { try { ws.destroy(); fs.unlinkSync(tmp); } catch { /* */ } if (!res.headersSent) return json(res, e.message.includes('groß') ? 413 : 500, { error: e.message }); return; }
          fs.renameSync(tmp, abs);
          return json(res, 200, { ok: true, path: rel, size: n });
        }
        if (req.method === 'GET') {
          if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return json(res, 404, { error: 'Datei nicht gefunden' });
          const ext = path.extname(abs).toLowerCase();
          const types = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };
          const size = fs.statSync(abs).size, rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
          if (rg && (rg[1] || rg[2])) {
            let a0 = rg[1] ? +rg[1] : Math.max(0, size - +rg[2]), b0 = rg[1] && rg[2] ? Math.min(+rg[2], size - 1) : size - 1;
            if (a0 > b0 || a0 >= size) { res.writeHead(416, { 'content-range': 'bytes */' + size }); return res.end(); }
            res.writeHead(206, { 'content-type': types[ext] || 'application/octet-stream', 'accept-ranges': 'bytes', 'content-range': `bytes ${a0}-${b0}/${size}`, 'content-length': b0 - a0 + 1 });
            return fs.createReadStream(abs, { start: a0, end: b0 }).pipe(res);
          }
          res.writeHead(200, { 'accept-ranges': 'bytes', 'content-type': types[ext] || 'application/octet-stream', 'content-length': size, 'cache-control': 'no-store', 'content-disposition': `${url.searchParams.get('inline') ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(path.basename(abs))}` });
          return fs.createReadStream(abs).pipe(res);
        }
        if (req.method === 'DELETE') {
          if (fs.existsSync(abs) && fs.statSync(abs).isFile()) fs.unlinkSync(abs);
          const mv = /^Material\/Videos\/([\w-]+)\.[^/]+$/.exec(rel); if (mv) { const vd = path.join(FILES_DIR, 'Material', 'Videos'); try { fs.readdirSync(vd).filter((f) => f.startsWith(mv[1] + '.') && /\.(vtt|part|ytdl)$/.test(f)).forEach((f) => fs.unlinkSync(path.join(vd, f))); } catch { /* */ } }
          return json(res, 200, { ok: true });
        }
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
