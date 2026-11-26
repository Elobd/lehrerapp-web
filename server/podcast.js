// Podcast: Sprachausgabe (externer Dienst) + privater Podcast-Feed für Podcast-Apps.
// Folgen liegen in files/Podcast (*.mp3 + folgen.json). Der Feed ist über einen geheimen Link ohne Anmeldung erreichbar
// (Podcast-Apps können sich nicht anmelden); der Link funktioniert nur im eigenen Tailscale-Netz.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export function createPodcast({ FILES_DIR, DATA_DIR, json, body }) {
  const DIR = path.join(FILES_DIR, 'Podcast');
  const META = path.join(DIR, 'folgen.json');
  const CFG = path.join(DATA_DIR, 'sprachausgabe.json'); // { anbieter, key, region, stimme } – Schlüssel wird nie zurückgegeben
  const TOK = path.join(DATA_DIR, 'podcast-token.txt');
  const rd = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
  const cfg = () => rd(CFG, {});
  const token = () => { try { const t = fs.readFileSync(TOK, 'utf8').trim(); if (t) return t; } catch { /* neu */ } const t = crypto.randomBytes(18).toString('hex'); fs.writeFileSync(TOK, t); return t; };
  const folgen = () => rd(META, []);
  let coverOf = () => null; // wird von auftrag.js gesetzt: Auftrags-ID → Pfad des Coverbilds
  const sortKey = (x) => (x.klasse || 9) * 1000 + (x.nr || 999);
  const xml = (t) => String(t == null ? '' : t).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
  const STIMMEN = {
    azure: [['de-AT-IngridNeural', 'Ingrid (österreichisch, weiblich)'], ['de-AT-JonasNeural', 'Jonas (österreichisch, männlich)'], ['de-DE-SeraphinaMultilingualNeural', 'Seraphina (deutsch, weiblich)'], ['de-DE-FlorianMultilingualNeural', 'Florian (deutsch, männlich)'], ['de-DE-KatjaNeural', 'Katja (deutsch, weiblich)'], ['de-DE-ConradNeural', 'Conrad (deutsch, männlich)']],
    elevenlabs: [['onwK4e9ZLuTAKqWW03F9', 'Daniel (ruhig, männlich)'], ['JBFqnCBsd6RMkjVDRZzb', 'George (warm, männlich)'], ['pNInz6obpgDQGcFmaJgB', 'Adam (tief, männlich)'], ['EXAVITQu4vr4xnSDxMaL', 'Sarah (weiblich)'], ['21m00Tcm4TlvDq8ikWAM', 'Rachel (weiblich)']],
    openai: [['onyx', 'Onyx (tief, männlich)'], ['nova', 'Nova (weiblich)'], ['alloy', 'Alloy (neutral)'], ['echo', 'Echo (männlich)'], ['shimmer', 'Shimmer (weiblich)']],
  };
  // ungefähre Listenpreise in US-Dollar (bitte beim Anbieter prüfen): Azure Neural ca. 16 $ / 1 Mio. Zeichen (500.000 Zeichen/Monat gratis im Gratis-Tarif); OpenAI ca. 0,015 $ / Minute
  // ElevenLabs: Gratis-Tarif ca. 10.000 Zeichen/Monat, danach ca. 0,17–0,30 $ pro 1000 Zeichen (je nach Tarif)
  const kostenUsd = (an, zeichen) => (an === 'azure' ? (zeichen / 1e6) * 16 : an === 'elevenlabs' ? (zeichen / 1000) * 0.2 : (zeichen / 900) * 0.015);

  // Text in Stücke an Satzgrenzen teilen (Dienste begrenzen die Länge pro Anfrage)
  function stuecke(text, max) {
    const out = []; let cur = '';
    for (const satz of String(text).replace(/\s+/g, ' ').split(/(?<=[.!?…])\s+/)) {
      if ((cur + ' ' + satz).length > max && cur) { out.push(cur.trim()); cur = ''; }
      cur += ' ' + satz; while (cur.length > max) { out.push(cur.slice(0, max)); cur = cur.slice(max); }
    }
    if (cur.trim()) out.push(cur.trim()); return out;
  }
  async function sprich(c, teil) {
    if (c.anbieter === 'azure') {
      const ssml = `<speak version='1.0' xml:lang='de-AT'><voice name='${xml(c.stimme || 'de-AT-JonasNeural')}'>${xml(teil)}</voice></speak>`;
      const r = await fetch(`https://${encodeURIComponent(c.region || 'westeurope')}.tts.speech.microsoft.com/cognitiveservices/v1`, { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': c.key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3', 'User-Agent': 'lehrerapp' }, body: ssml, signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error('Sprachdienst Azure: Fehler ' + r.status + ' ' + (await r.text()).slice(0, 200));
      return Buffer.from(await r.arrayBuffer());
    }
    if (c.anbieter === 'openai') {
      const r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST', headers: { authorization: 'Bearer ' + c.key, 'content-type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: c.stimme || 'onyx', input: teil, response_format: 'mp3', instructions: 'Sprich auf Deutsch (österreichische Lehrkraft), ruhig, klar und lebendig wie in einem Wissens-Podcast.' }), signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error('Sprachdienst OpenAI: Fehler ' + r.status + ' ' + (await r.text()).slice(0, 200));
      return Buffer.from(await r.arrayBuffer());
    }
    if (c.anbieter === 'elevenlabs') {
      const v = String(c.stimme || 'onwK4e9ZLuTAKqWW03F9').replace(/[^A-Za-z0-9]/g, '');
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v}?output_format=mp3_44100_128`, { method: 'POST', headers: { 'xi-api-key': c.key, 'content-type': 'application/json', accept: 'audio/mpeg' }, body: JSON.stringify({ text: teil, model_id: 'eleven_multilingual_v2', language_code: 'de' }), signal: AbortSignal.timeout(180000) });
      if (!r.ok) throw new Error('Sprachdienst ElevenLabs: Fehler ' + r.status + ' ' + (await r.text()).slice(0, 200));
      return Buffer.from(await r.arrayBuffer());
    }
    throw new Error('Kein Sprachdienst eingerichtet (Einstellungen → Podcast & Sprachausgabe).');
  }
  // Text → MP3-Datei; liefert { bytes, zeichen, usd }
  async function tts(text, ziel, say) {
    const c = cfg(); if (!c.key) throw new Error('Kein Sprachdienst eingerichtet (Einstellungen → Podcast & Sprachausgabe).');
    const teile = stuecke(text, c.anbieter === 'openai' ? 3800 : c.anbieter === 'elevenlabs' ? 2500 : 3000), tmp = ziel + '.teile'; fs.mkdirSync(tmp, { recursive: true });
    try {
      const files = [];
      for (let i = 0; i < teile.length; i++) { if (say) say(`Podcast: Sprachaufnahme ${i + 1} von ${teile.length} …`); const f = path.join(tmp, String(i).padStart(3, '0') + '.mp3'); fs.writeFileSync(f, await sprich(c, teile[i])); files.push(f); }
      const list = path.join(tmp, 'liste.txt'); fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
      const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', ziel]);
      if (r.status !== 0 || !fs.existsSync(ziel)) fs.writeFileSync(ziel, Buffer.concat(files.map((f) => fs.readFileSync(f)))); // ohne ffmpeg: einfach aneinanderhängen
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    const zeichen = teile.reduce((a, b) => a + b.length, 0);
    return { bytes: fs.statSync(ziel).size, zeichen, usd: kostenUsd(c.anbieter, zeichen) };
  }
  // Folge in den Feed aufnehmen (Datei wird nach files/Podcast verlinkt/kopiert)
  function aufnehmen(quelle, info) {
    fs.mkdirSync(DIR, { recursive: true });
    const name = (info.dateiname || 'Folge').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) + '.mp3', ziel = path.join(DIR, name);
    try { fs.rmSync(ziel, { force: true }); fs.linkSync(quelle, ziel); } catch { fs.copyFileSync(quelle, ziel); }
    const l = folgen().filter((x) => x.datei !== name && x.id !== info.id);
    l.push({ id: info.id, datei: name, titel: info.titel, text: info.text || '', klasse: info.klasse, nr: info.nr || 0, epoche: info.epoche || '', dauer: info.dauer || 0, bytes: fs.statSync(ziel).size, datum: Date.now() });
    fs.writeFileSync(META, JSON.stringify(l, null, 1)); return name;
  }
  // Titel beginnen mit „Klasse.Nummer“ (z. B. 5.01) → in der Podcast-App „nach Titel sortieren“ = Reihenfolge der Jahresplanung
  const nrTitel = (x) => (x.klasse ? x.klasse + '.' + String(x.nr || 0).padStart(2, '0') + ' ' : '') + String(x.titel || '').replace(/^\d+\. Klasse · (\d+ )?/, '');
  function feed(base, filt) {
    const t = token(), l = folgen().filter((x) => fs.existsSync(path.join(DIR, x.datei)) && (!filt.epoche || x.epoche === filt.epoche) && (!filt.klasse || +x.klasse === +filt.klasse)).sort((a, b) => sortKey(a) - sortKey(b) || a.datum - b.datum);
    const name = filt.epoche ? ' – ' + filt.epoche : filt.klasse ? ' – ' + filt.klasse + '. Klasse' : '';
    const items = l.map((x) => { const cov = coverOf(x.id) ? `${base}/podcast/${t}/bild/${encodeURIComponent(x.id)}.jpg` : '';
      return `<item><title>${xml(nrTitel(x))}</title><description>${xml([x.klasse ? x.klasse + '. Klasse' : '', x.epoche, x.text, 'erstellt am ' + new Date(x.datum).toLocaleDateString('de-AT')].filter(Boolean).join(' · '))}</description><guid isPermaLink="false">${xml(x.id + '-' + x.datum)}</guid><pubDate>${new Date(x.datum).toUTCString()}</pubDate><enclosure url="${xml(base + '/podcast/' + t + '/' + encodeURIComponent(x.datei))}" length="${x.bytes}" type="audio/mpeg"/>${x.dauer ? `<itunes:duration>${Math.round(x.dauer)}</itunes:duration>` : ''}${x.nr ? `<itunes:episode>${x.nr}</itunes:episode>` : ''}${x.klasse ? `<itunes:season>${x.klasse}</itunes:season>` : ''}${cov ? `<itunes:image href="${xml(cov)}"/>` : ''}</item>`; }).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>Lehrer-App: Geschichte${xml(name)}</title><link>${xml(base)}</link><language>de-at</language><description>Private Podcast-Folgen zu den Themen der Jahresplanung (nur für dich). Titel beginnen mit Klasse.Nummer – nach Titel sortiert ergibt sich die Reihenfolge der Jahresplanung.</description><itunes:block>Yes</itunes:block><itunes:image href="${xml(base + '/podcast/' + t + '/logo.png')}"/><image><url>${xml(base + '/podcast/' + t + '/logo.png')}</url><title>Lehrer-App</title><link>${xml(base)}</link></image>${items}</channel></rss>`;
  }
  const baseOf = (req) => { const h = String(req.headers['x-forwarded-host'] || req.headers.host || ''); return (req.headers['x-forwarded-proto'] || (/\.ts\.net$/i.test(h.replace(/:\d+$/, '')) ? 'https' : 'http')) + '://' + h; }; // Tailscale Serve: immer https

  // öffentlicher Teil (geheimer Link): /podcast/<token>/feed.xml und /podcast/<token>/<datei>.mp3
  function oeffentlich(req, res, url) {
    const m = /^\/podcast\/(?:podcast\/)?([a-f0-9]{20,})\/(.+)$/.exec(url.pathname); if (!m) return false;
    if (m[1] !== token()) { res.writeHead(404); res.end(); return true; }
    const f = decodeURIComponent(m[2]);
    if (f === 'feed.xml') { res.writeHead(200, { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'no-cache' }); const pub = url.searchParams.get('basis') || ''; res.end(feed(/^https:\/\/[a-z0-9.-]+\.ts\.net(:\d{2,5})?$/i.test(pub) ? pub : baseOf(req), { epoche: url.searchParams.get('epoche') || '', klasse: url.searchParams.get('klasse') || '' })); return true; }
    if (f === 'logo.png') { const lg = path.join(process.env.WEB_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'web'), 'icon-512.png'); if (!fs.existsSync(lg)) { res.writeHead(404); res.end(); return true; } res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=86400' }); fs.createReadStream(lg).pipe(res); return true; }
    const bm = /^bild\/([\w-]+)\.jpg$/.exec(f); if (bm) { const c = coverOf(bm[1]); if (!c || !fs.existsSync(c)) { res.writeHead(404); res.end(); return true; } res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'max-age=86400' }); fs.createReadStream(c).pipe(res); return true; }
    const abs = path.join(DIR, path.basename(f)); if (!/\.mp3$/i.test(abs) || !fs.existsSync(abs)) { res.writeHead(404); res.end(); return true; }
    const size = fs.statSync(abs).size, rg = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (rg && (rg[1] || rg[2])) { const a = rg[1] ? +rg[1] : Math.max(0, size - +rg[2]), b = rg[1] && rg[2] ? Math.min(+rg[2], size - 1) : size - 1; if (a > b || a >= size) { res.writeHead(416, { 'content-range': 'bytes */' + size }); res.end(); return true; } res.writeHead(206, { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1 }); fs.createReadStream(abs, { start: a, end: b }).pipe(res); return true; }
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': size }); fs.createReadStream(abs).pipe(res); return true;
  }
  // angemeldeter Teil: Einstellungen und Folgenliste
  async function api(req, res, url) {
    const p = url.pathname;
    if (p === '/api/podcast' && req.method === 'GET') { const c = cfg(); return json(res, 200, { anbieter: c.anbieter || '', region: c.region || '', stimme: c.stimme || '', gesetzt: !!c.key, stimmen: STIMMEN, feed: '/podcast/' + token() + '/feed.xml', basis: '/podcast/' + token() + '/', folgen: folgen().map((x) => Object.assign({}, x, { nrTitel: nrTitel(x), cover: !!coverOf(x.id) })).sort((a, b) => sortKey(a) - sortKey(b) || a.datum - b.datum) }), true; }
    if (p === '/api/podcast' && req.method === 'POST') {
      const q = JSON.parse((await body(req)) || '{}'), c = cfg(); if (!['azure', 'openai', 'elevenlabs'].includes(q.anbieter)) return json(res, 400, { error: 'Bitte einen Anbieter wählen.' }), true;
      const n = { anbieter: q.anbieter, region: String(q.region || c.region || 'westeurope').trim().toLowerCase().replace(/[^a-z0-9]/g, ''), stimme: String(q.stimme || '').slice(0, 60), key: String(q.key || '').trim() || (c.anbieter === q.anbieter ? c.key : '') };
      fs.writeFileSync(CFG, JSON.stringify(n)); return json(res, 200, { ok: true, gesetzt: !!n.key }), true;
    }
    if (p === '/api/podcast' && req.method === 'DELETE') { try { fs.unlinkSync(CFG); } catch { /* */ } return json(res, 200, { ok: true }), true; }
    if (p === '/api/podcast/test' && req.method === 'POST') { try { const ziel = path.join(DATA_DIR, 'tts-test.mp3'); await tts('Hallo! Das ist ein kurzer Test der Sprachausgabe deiner Lehrer-App.', ziel); const b = fs.readFileSync(ziel); fs.unlinkSync(ziel); res.writeHead(200, { 'content-type': 'audio/mpeg', 'content-length': b.length }); res.end(b); } catch (e) { const m = String(e.message || e); json(res, 502, { error: /fetch failed|ENOTFOUND|ECONN|timeout/i.test(m) ? 'Sprachdienst nicht erreichbar – hat die NAS Internet? (' + m + ')' : m }); } return true; }
    if (p === '/api/podcast/neuerlink' && req.method === 'POST') { try { fs.unlinkSync(TOK); } catch { /* */ } return json(res, 200, { feed: '/podcast/' + token() + '/feed.xml' }), true; }
    if (p === '/api/podcast/folge' && req.method === 'DELETE') { const d = url.searchParams.get('datei') || ''; const l = folgen(); const x = l.find((y) => y.datei === d); if (x) { try { fs.unlinkSync(path.join(DIR, path.basename(x.datei))); } catch { /* */ } fs.writeFileSync(META, JSON.stringify(l.filter((y) => y !== x), null, 1)); } return json(res, 200, { ok: true }), true; }
    return false;
  }
  return { setCover: (fn) => { coverOf = (id) => { try { return fn(id); } catch { return null; } }; }, tts, aufnehmen, oeffentlich, api, eingerichtet: () => !!cfg().key, anbieter: () => cfg().anbieter || '' };
}
