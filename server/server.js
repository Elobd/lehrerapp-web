// Startpunkt (Docker: node server/server.js). Startet die eigentliche App (app.js) als Unterprozess.
// Nach einer Selbstaktualisierung beendet sich die App mit Code 75 und wird hier sofort mit den neuen Dateien neu gestartet –
// der Container muss dafür nicht neu gestartet werden. AUTO_UPDATE=0 schaltet das ab (App läuft dann direkt).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIR = path.dirname(fileURLToPath(import.meta.url));
if (process.env.LA_KIND === '1' || process.env.AUTO_UPDATE === '0') {
  await import('./app.js');
} else {
  let kind = null, stop = false, fehl = 0;
  const run = async () => {
    if (fehl >= 3) { try { const { holeServerDateien } = await import('./aktualisierung.js?' + Date.now()); const r = await holeServerDateien(path.join(DIR, '..'), process.env.DATA_DIR || path.join(DIR, '..', 'data')); if (r.geschrieben.length) console.log('Aufpasser: nach Abstürzen neue Dateien geladen', r.geschrieben); } catch (e) { console.log('Aufpasser: Aktualisierung fehlgeschlagen', e.message); } }
    const t0 = Date.now(); kind = spawn(process.execPath, [path.join(DIR, 'app.js')], { env: { ...process.env, LA_KIND: '1' }, stdio: 'inherit' });
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
