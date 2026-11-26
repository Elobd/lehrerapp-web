// Startpunkt (Docker: node server/server.js). Startet die eigentliche App (app.js) als Unterprozess.
// Nach einer Selbstaktualisierung beendet sich die App mit Code 75 und wird hier sofort mit den neuen Dateien neu gestartet –
// der Container muss dafür nicht neu gestartet werden. AUTO_UPDATE=0 schaltet das ab (App läuft dann direkt).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DIR = path.dirname(fileURLToPath(import.meta.url));
if (process.env.LA_KIND === '1' || process.env.AUTO_UPDATE === '0') {
  await import('./app.js');
} else {
  let kind = null, stop = false, fehl = 0;
  // Schreibgeschützter App-Ordner: Aktualisierungen liegen in DATA_DIR/server-overlay (nur gültig, solange die Basis-app.js unverändert ist)
  const DATA = process.env.DATA_DIR || path.join(DIR, '..', 'data'), OV = path.join(DATA, 'server-overlay'); let ovAus = false;
  const sha = (f) => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch { return ''; } };
  const einstieg = () => { try { const app = path.join(OV, 'server', 'app.js'); if (!ovAus && fs.existsSync(app) && JSON.parse(fs.readFileSync(path.join(OV, 'basis.json'), 'utf8')).app === sha(path.join(DIR, 'app.js'))) return app; } catch { /* Basis */ } return path.join(DIR, 'app.js'); };
  const run = async () => {
    if (fehl >= 3) { try { const { holeServerDateien } = await import('./aktualisierung.js?' + Date.now()); const r = await holeServerDateien(path.join(DIR, '..'), process.env.DATA_DIR || path.join(DIR, '..', 'data')); if (r.geschrieben.length) console.log('Aufpasser: nach Abstürzen neue Dateien geladen', r.geschrieben); } catch (e) { console.log('Aufpasser: Aktualisierung fehlgeschlagen', e.message); } }
    const t0 = Date.now(); const ein = einstieg(); if (fehl >= 2 && ein !== path.join(DIR, 'app.js')) { ovAus = true; } kind = spawn(process.execPath, [ovAus ? path.join(DIR, 'app.js') : ein], { env: { ...process.env, LA_KIND: '1' }, stdio: 'inherit' });
    kind.on('exit', (code) => {
      if (stop) return process.exit(0);
      if (code === 75) { fehl = 0; return run(); } // geplanter Neustart nach Aktualisierung
      fehl = Date.now() - t0 < 30000 ? fehl + 1 : 0; console.log('Aufpasser: App beendet (Code ' + code + '), Neustart …');
      setTimeout(run, Math.min(60000, 2000 * 2 ** Math.min(fehl, 5)));
    });
  };
  for (const s of ['SIGTERM', 'SIGINT']) process.on(s, () => { stop = true; if (kind) kind.kill(s); setTimeout(() => process.exit(0), 5000); });
  run();
}
