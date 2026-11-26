// Selbstaktualisierung: holt geänderte Dateien aus server/ vom öffentlichen GitHub-Repo (Branch main)
// und startet die App neu, sobald gerade keine Material-Erstellung läuft. Abschalten mit AUTO_UPDATE=0.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const REPO = process.env.UPDATE_REPO || 'Elobd/lehrerapp-web';
const BRANCH = process.env.UPDATE_BRANCH || 'main';
const H = { 'user-agent': 'lehrerapp-aktualisierung' };
const blobSha = (buf) => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const nimm = (rel) => rel.startsWith('server/') && !/__pycache__|node_modules|\.pruef\.mjs$/.test(rel);

// Ist der App-Ordner schreibgeschützt (EROFS), landen die Aktualisierungen in DATA_DIR/server-overlay (vollständige Kopie von server/);
// der Aufpasser (server.js) startet die App dann von dort.
export const overlayDir = (DATA_DIR) => path.join(DATA_DIR || os.tmpdir(), 'server-overlay');
export const dateiHash = (f) => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch { return ''; } };
const beschreibbar = (d) => { try { fs.accessSync(d, fs.constants.W_OK); const t = path.join(d, '.schreibtest'); fs.writeFileSync(t, ''); fs.rmSync(t, { force: true }); return true; } catch { return false; } };

export function lokaleStaende(ROOT) {
  const out = {}, walk = (d) => { let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) { const a = path.join(d, e.name), rel = path.relative(ROOT, a).split(path.sep).join('/'); if (!nimm(rel + (e.isDirectory() ? '/' : ''))) continue; if (e.isDirectory()) walk(a); else { try { out[rel] = blobSha(fs.readFileSync(a)); } catch { /* */ } } } };
  walk(path.join(ROOT, 'server')); return out;
}

// Aktuellen Stand von main abfragen (ohne GitHub-API-Limit)
async function neuesterCommit() {
  const t = await (await fetch(`https://github.com/${REPO}.git/info/refs?service=git-upload-pack`, { headers: { 'user-agent': H['user-agent'] }, signal: AbortSignal.timeout(20000) })).text();
  const m = new RegExp('([0-9a-f]{40}) refs/heads/' + BRANCH).exec(t); if (!m) throw new Error('GitHub nicht erreichbar'); return m[1];
}
// Lädt alle geänderten Serverdateien (nur wenn sich main geändert hat). Erst wird alles geprüft (node --check), dann geschrieben.
export async function holeServerDateien(ROOT, DATA_DIR, immer) {
  if (fs.existsSync(path.join(ROOT, '.git'))) return { commit: '', geschrieben: [], hinweis: 'App-Ordner ist ein Git-Ordner – Aktualisierung übernimmt dein Git-Abgleich' };
  const SF = path.join(DATA_DIR || os.tmpdir(), 'aktualisierung.json'), alt = (() => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return {}; } })();
  const sha = await neuesterCommit(); if (sha === alt.commit && !immer) return { commit: sha.slice(0, 7), geschrieben: [] };
  const tbase = (() => { try { const d = path.join(DATA_DIR || os.tmpdir(), '_akt-tmp'); fs.mkdirSync(d, { recursive: true }); return d; } catch { return os.tmpdir(); } })(), tmp = fs.mkdtempSync(path.join(tbase, 'lehrerapp-akt-')), tgz = path.join(tmp, 'a.tgz');
  try {
    const r = await fetch(`https://codeload.github.com/${REPO}/tar.gz/${sha}`, { signal: AbortSignal.timeout(120000) }); if (!r.ok) throw new Error('Download fehlgeschlagen (' + r.status + ')');
    fs.writeFileSync(tgz, Buffer.from(await r.arrayBuffer()));
    const x = spawnSync('tar', ['-xzf', tgz, '-C', tmp]); if (x.status !== 0) throw new Error('Entpacken fehlgeschlagen');
    const wurzel = fs.readdirSync(tmp, { withFileTypes: true }).find((e) => e.isDirectory()); if (!wurzel) throw new Error('Paket leer');
    let ZIEL = ROOT; const ovl = !beschreibbar(path.join(ROOT, 'server'));
    if (ovl) { ZIEL = overlayDir(DATA_DIR); const bf = path.join(ZIEL, 'basis.json'), basis = dateiHash(path.join(ROOT, 'server', 'app.js')); let b = {}; try { b = JSON.parse(fs.readFileSync(bf, 'utf8')); } catch { /* neu */ } if (b.app !== basis) { fs.rmSync(ZIEL, { recursive: true, force: true }); } fs.mkdirSync(ZIEL, { recursive: true }); fs.writeFileSync(bf, JSON.stringify({ app: basis })); }
    const QROOT = path.join(tmp, wurzel.name), quelle = lokaleStaende(QROOT), hier = lokaleStaende(ZIEL), neu = [];
    for (const rel of Object.keys(quelle)) {
      if (quelle[rel] === hier[rel]) continue;
      const buf = fs.readFileSync(path.join(QROOT, rel)), abs = path.join(ZIEL, rel);
      if (/\.js$/.test(rel)) { const pf = abs + '.pruef.mjs'; fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(pf, buf); const c = spawnSync(process.execPath, ['--check', pf]); fs.rmSync(pf, { force: true }); if (c.status !== 0) throw new Error('Fehlerhafte Datei abgelehnt: ' + rel); }
      neu.push({ abs, buf, rel });
    }
    for (const n of neu) { fs.mkdirSync(path.dirname(n.abs), { recursive: true }); fs.writeFileSync(n.abs + '.neu', n.buf); fs.renameSync(n.abs + '.neu', n.abs); }
    fs.writeFileSync(SF, JSON.stringify({ commit: sha, am: Date.now() }));
    return { commit: sha.slice(0, 7), geschrieben: neu.map((n) => n.rel), ziel: ZIEL, overlay: ovl };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

export function createAktualisierung({ ROOT, DATA_DIR, json, istFrei }) {
  const start = lokaleStaende(ROOT), aus = process.env.AUTO_UPDATE === '0';
  const stand = { aktiv: !aus, unterAufsicht: process.env.LA_KIND === '1', geprueft: 0, commit: '', meldung: aus ? 'Ausgeschaltet (AUTO_UPDATE=0)' : 'Noch nicht geprüft', geladen: [] };
  let wartet = null;
  const neustartWennFrei = () => { if (wartet || !stand.unterAufsicht) return; wartet = setInterval(() => { if (istFrei()) { clearInterval(wartet); console.log('Aktualisierung: Neustart mit neuer Serverversion'); process.exit(75); } }, 5000); };
  async function pruefen(manuell) {
    if (aus) return stand; stand.geprueft = Date.now();
    try {
      const r = await holeServerDateien(ROOT, DATA_DIR, manuell); if (r.commit) stand.commit = r.commit; if (r.geschrieben.length) stand.geladen = r.geschrieben;
      const jetzt = lokaleStaende(ROOT), geaendert = r.overlay ? r.geschrieben.filter((k) => /\.js$/.test(k)) : Object.keys(jetzt).filter((k) => jetzt[k] !== start[k] && /\.js$/.test(k));
      if (geaendert.length) { stand.meldung = stand.unterAufsicht ? 'Neue Serverversion geladen – startet automatisch neu, sobald keine Erstellung läuft' : 'Neue Serverversion geladen – bitte Container „lehrerapp-app“ einmal neu starten (danach automatisch)'; neustartWennFrei(); }
      else stand.meldung = r.hinweis || 'Server ist aktuell';
      stand.zusatzordner = !!r.overlay || ROOT.includes('server-overlay');
    } catch (e) { stand.meldung = 'Prüfung fehlgeschlagen: ' + String(e.message || e); }
    return stand;
  }
  if (!aus) { setTimeout(pruefen, 60e3); setInterval(pruefen, 15 * 60e3); }
  return async function api(req, res, url) {
    if (url.pathname !== '/api/system/aktualisierung') return false;
    if (req.method === 'POST') await pruefen(true);
    return json(res, 200, stand), true;
  };
}
