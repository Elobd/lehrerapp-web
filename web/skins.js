/* Designs (Skins): per Knopf oben rechts umschaltbar, pro Gerät gemerkt. Überschreibt nur Farben und Rundungen. */
(() => {
  const SKINS = {
    standard: { name: 'Standard', sw: ['#6e7480', '#2c56c8', '#ffffff'] },
    ozean: { name: 'Ozean', sw: ['#0b3a53', '#0e86c8', '#f2f8fb'] },
    wald: { name: 'Wald (Schulgrün)', sw: ['#3d5217', '#a1c73a', '#f4f7ec'] },
    papier: { name: 'Papier', sw: ['#5a4632', '#c2571a', '#faf6ef'] },
    nacht: { name: 'Nacht', sw: ['#10151f', '#34d399', '#182030'] },
    nachthell: { name: 'Nacht hell', sw: ['#1d2637', '#43dba6', '#212b3e'] },
    daemmer: { name: 'Dämmerung', sw: ['#2a3652', '#3fbf93', '#2e3a55'] },
  };
  const css = `
html:root[data-skin="ozean"]{--bg:#eef5f9;--hd-bg:#0b3a53;--hd-fg:#fff;--surface:#fff;--surface2:#e1edf4;--ink:#0f2a38;--muted:#4d6674;--line:#cfdfe8;--accent:#0e7fbf;--accent-ink:#fff;--accent-soft:#d4eaf6;--good:#1b7f4b;--good-soft:#d6efe1;--warn:#9a5b00;--warn-soft:#fbe8c6;--bad:#b3261e;--bad-soft:#f8d9d6;color-scheme:light}
html:root[data-skin="wald"]{--bg:#f4f7ec;--hd-bg:#3d5217;--hd-fg:#fff;--surface:#fff;--surface2:#e9efd9;--ink:#1a2410;--muted:#55644a;--line:#d9e2c3;--accent:#587f0e;--accent-ink:#fff;--accent-soft:#e6f0c6;--brand:#a1c73a;--brand-ink:#1c2a05;--good:#1b7f4b;--good-soft:#d6efe1;--warn:#9a5b00;--warn-soft:#fbe8c6;--bad:#b3261e;--bad-soft:#f8d9d6;color-scheme:light}
html:root[data-skin="papier"]{--bg:#f6f1e8;--hd-bg:#5a4632;--hd-fg:#fff;--surface:#fffdf8;--surface2:#efe7d8;--ink:#2a2118;--muted:#6f6454;--line:#e0d5c2;--accent:#b5501a;--accent-ink:#fff;--accent-soft:#f6dfcf;--good:#2a7a45;--good-soft:#dcefe0;--warn:#8a5a00;--warn-soft:#f8e6c0;--bad:#a8281d;--bad-soft:#f6dad5;color-scheme:light}
html:root[data-skin="nacht"]{--bg:#0c1018;--hd-bg:#10151f;--hd-fg:#fff;--surface:#161d2a;--surface2:#1f2838;--ink:#e8edf5;--muted:#98a6ba;--line:#2a3548;--accent:#34d399;--accent-ink:#06281c;--accent-soft:#163a31;--good:#52c98a;--good-soft:#13352a;--warn:#e8b04a;--warn-soft:#3a2c0f;--bad:#ff8b82;--bad-soft:#3d1b19;color-scheme:dark}
html:root[data-skin="nachthell"]{--bg:#161d2b;--hd-bg:#1d2637;--hd-fg:#fff;--surface:#212b3e;--surface2:#2c3850;--ink:#eef2f8;--muted:#a9b6ca;--line:#3a4860;--accent:#43dba6;--accent-ink:#06281c;--accent-soft:#1d4a3f;--good:#5dd49a;--good-soft:#1a3d32;--warn:#ecb957;--warn-soft:#3d3015;--bad:#ff958d;--bad-soft:#44201e;color-scheme:dark}
html:root[data-skin="daemmer"]{--bg:#222c40;--hd-bg:#2a3652;--hd-fg:#fff;--surface:#2e3a55;--surface2:#3a4868;--ink:#f3f6fb;--muted:#bac6d9;--line:#4b5b7a;--accent:#3fbf93;--accent-ink:#06281c;--accent-soft:#235246;--good:#5cc79b;--good-soft:#22493d;--warn:#f0c161;--warn-soft:#46391a;--bad:#ff9d95;--bad-soft:#4a2a2a;color-scheme:dark}
html:root[data-skin="daemmer"] .sl li:nth-child(even){background:rgba(255,255,255,.05)}
html:root[data-skin="daemmer"] input,html:root[data-skin="daemmer"] select,html:root[data-skin="daemmer"] textarea{background:var(--surface2);color:var(--ink)}
html:root[data-skin="daemmer"] .kmside{background:#3a4868}
html:root[data-skin="nachthell"] .sl li:nth-child(even){background:rgba(255,255,255,.05)}
html:root[data-skin="nachthell"] input,html:root[data-skin="nachthell"] select,html:root[data-skin="nachthell"] textarea{background:var(--surface2);color:var(--ink)}
html:root[data-skin="nachthell"] .kmside{background:#2c3850}
html:root[data-skin="nacht"] .sl li:nth-child(even){background:rgba(255,255,255,.04)}
html:root[data-skin="nacht"] input,html:root[data-skin="nacht"] select,html:root[data-skin="nacht"] textarea{background:var(--surface2);color:var(--ink)}
html:root[data-skin] body{background:var(--bg)}
html:root[data-skin] .hero{background:var(--hd-bg);box-shadow:0 0 0 100vmax var(--hd-bg)}
html:root[data-skin] .nav{background:color-mix(in srgb,var(--hd-bg) 78%,#fff);box-shadow:0 0 0 100vmax color-mix(in srgb,var(--hd-bg) 78%,#fff)}
html:root[data-skin] .nav a,html:root[data-skin] .nav .bk{border-left-color:color-mix(in srgb,var(--hd-bg) 60%,#fff)}
html:root[data-skin] .nav a:hover{background:color-mix(in srgb,var(--hd-bg) 66%,#fff)}
html:root[data-skin] .nav a.on{background:var(--hd-bg);box-shadow:inset 0 3px 0 var(--brand,var(--accent))}
@media(max-width:640px){html:root[data-skin] .nav{background:color-mix(in srgb,var(--hd-bg) 85%,#fff);box-shadow:0 -2px 10px rgba(0,0,0,.08)}html:root[data-skin] .nav a{background:transparent}html:root[data-skin] .nav a.on{background:var(--hd-bg)}}
html:root[data-skin] .btn.primary{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
html:root[data-skin] .kmtool.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
/* Verfeinerung der Klassenmappen in allen Designs */
html:root[data-skin] .kmcls,html:root[data-skin] .kmmain .card{border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,.05),0 6px 18px rgba(0,0,0,.05)}
html:root[data-skin] .kmside{background:#3a3d42;border-radius:18px;box-shadow:0 6px 18px rgba(0,0,0,.12)}
html:root[data-skin="nacht"] .kmside{background:#262b33}
html:root[data-skin] .kmchip{border-radius:7px}
html:root[data-skin] .kmchip.on{background:var(--brand,var(--accent));border-color:var(--brand,var(--accent));color:var(--brand-ink,var(--accent-ink))}
html:root[data-skin] .kmchip.on small{color:inherit;opacity:.8}
html:root[data-skin] .kmicon.on{background:rgba(255,255,255,.2);box-shadow:inset 3px 0 0 var(--brand,#fff)}
html:root[data-skin] .kmh h1{letter-spacing:-.01em}
html:root[data-skin] .kmrow.kmgo:hover{background:var(--accent-soft)}
.skbtn{position:absolute;right:max(16px,env(safe-area-inset-right,0px));top:12px;background:rgba(255,255,255,.16);color:#fff;border:1px solid rgba(255,255,255,.28);border-radius:10px;width:38px;height:38px;display:grid;place-items:center;cursor:pointer;z-index:40}
.skbtn:hover{background:rgba(255,255,255,.26)}
.skmenu{position:fixed;right:max(16px,env(safe-area-inset-right,0px));top:calc(56px + env(safe-area-inset-top,0px));z-index:2000;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:14px;box-shadow:0 12px 36px rgba(0,0,0,.25);padding:8px;width:210px}
.skmenu button{display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;border-radius:10px;padding:8px 10px;color:inherit;font:600 14px var(--font-body);cursor:pointer;text-align:left}
.skmenu button:hover{background:var(--surface2)}.skmenu button.on{background:var(--accent-soft);color:var(--accent)}
.skmenu i{display:inline-flex;border-radius:7px;overflow:hidden;border:1px solid var(--line);flex:none}.skmenu i b{width:14px;height:20px;display:block}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const get = () => { try { return localStorage.getItem('skin') || 'standard'; } catch (e) { return 'standard'; } };
  const apply = (k) => { if (!SKINS[k]) k = 'standard'; if (k === 'standard') document.documentElement.removeAttribute('data-skin'); else document.documentElement.setAttribute('data-skin', k); try { localStorage.setItem('skin', k); } catch (e) { /* */ } try { document.querySelector('meta[name=theme-color]').content = SKINS[k].sw[0]; } catch (e) { /* */ } };
  apply(get());
  window.SKIN = { list: SKINS, get, apply };
})();

/* ===== Neue Oberfläche (früher ui.js) ===== */
/* Neue Oberfläche (helle Optik): Kopfzeile mit Datum/KW, Tools, Suche, Einstellungen; untere Leiste; Reiter mit Balken; Karten. */
(() => {
  try { document.documentElement.removeAttribute('data-skin'); if (window.SKIN) window.SKIN.apply = () => {}; } catch (e) { /* */ }
  try { const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = '#ffffff'; } catch (e) { /* */ }
  const css = `
html:root{--bg:#ececec;--hd-bg:#1a1a1a;--hd-fg:#ffffff;--surface:#ffffff;--surface2:#f3f3f3;--ink:#1E293B;--muted:#6b6b6b;--line:#e4e4e4;--accent:#1a1a1a;--accent-ink:#ffffff;--accent-soft:#e9e9e9;--r:16px;--tab-h:46px}
html:root body{background:var(--bg)!important;color:var(--ink);font-size:15px}
body[data-fach]{background:var(--bg)!important}
html:root .wrap{max-width:900px;margin-left:auto;margin-right:auto;padding-left:12px;padding-right:12px;box-sizing:border-box}
#appver{display:none}body[data-v=daten] #appver{display:block}
/* Kopfzeile */
html:root .hero{background:#fff!important;color:var(--ink)!important;box-shadow:0 0 0 100vmax #fff;clip-path:inset(-100vmax -100vmax 0 -100vmax);padding:14px 0 10px;margin-bottom:10px;display:block}
.hero>div.side,.hero .clock,.hero #dt,.hero #sub,.hero>div:first-child:not(.tb),#burger{display:none!important}
.tb{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px}
.tb .tl{display:flex;align-items:center;gap:6px;min-width:0}.tb .tdate{display:flex;flex-direction:column;line-height:1.15;min-width:0}.tb .tdate b{font:700 20px var(--font-body);letter-spacing:-.2px;color:var(--ink)}.tb .tdate span{font:500 13px var(--font-body);color:var(--muted)}
.tb .tr{display:flex;align-items:center;gap:2px}
.tb button{background:transparent;border:0;color:var(--ink);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding:0}.tb button:hover{background:#f0f0f0}
.tb .tback{width:40px;height:40px;margin-left:-8px}
/* Untere Leiste */
html:root .nav{position:fixed!important;left:0;right:0;bottom:0;top:auto!important;margin:0!important;padding:0 0 env(safe-area-inset-bottom,0px);background:#fff!important;box-shadow:0 -1px 0 var(--line)!important;clip-path:none!important;z-index:80;display:flex;flex-wrap:nowrap}
html:root .nav a{flex:1 1 0;display:flex!important;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 0 7px!important;background:transparent!important;border:0!important;color:#8a8a8a!important;font:600 11px var(--font-body);box-shadow:none!important;min-height:56px;text-decoration:none}
html:root .nav a .nt{display:block!important;font-size:11px}html:root .nav a .ni{margin:0!important}
html:root .nav a.on{color:#1a1a1a!important}
html:root #main{padding-bottom:84px!important}
/* Reiter mit Balken */
html:root body .ttmenu,html:root body .km>.ttmenu,html:root body .km2>.ttmenu{position:sticky!important;left:auto!important;right:auto!important;bottom:auto!important;top:0!important;display:flex;flex-wrap:nowrap;overflow-x:auto;gap:0;background:var(--bg)!important;box-shadow:none!important;clip-path:none!important;border:0!important;border-bottom:1px solid var(--line)!important;margin:0 0 12px!important;padding:0;z-index:50;scrollbar-width:none}
.ttmenu::-webkit-scrollbar{display:none}
html:root .ttchipw{display:inline-flex;flex:0 0 auto}
html:root .ttchip{position:relative;background:transparent!important;border:0!important;color:#8a8a8a!important;font:600 15px var(--font-body)!important;padding:13px 16px!important;white-space:nowrap;box-shadow:none!important;border-radius:0!important;cursor:pointer}
html:root .ttchip.on{color:#1a1a1a!important}
html:root .ttchip.on::after{content:'';position:absolute;left:14px;right:14px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:#1a1a1a}
html:root .ttchip.fg.on::after{background:#1a1a1a}html:root .ttchip.fs.on::after{background:#1a1a1a}
/* Karten */
html:root .card{background:#fff;border:0;border-radius:16px;box-shadow:none;padding:16px}
html:root .card>.hd:first-child{background:#f5f5f5;color:var(--ink);margin:-16px -16px 14px;padding:13px 16px;border-radius:16px 16px 0 0;border-bottom:0;font:600 16px var(--font-body)}
html:root .card>.hd h2,html:root .card h2{font:600 16px var(--font-body);color:var(--ink)}
html:root .btn{border-radius:99px;border:1px solid #d9d9d9;background:#fff;color:var(--ink);font-weight:600}
html:root .btn.primary,html:root .btn.kmprep{background:#1a1a1a!important;border-color:#1a1a1a!important;color:#fff!important}
html:root .btn.good{background:#e7f4ec;color:#1b7f4b;border-color:#bfe0cc}
html:root .btn.kmprep.done{color:#fff}
.muted{color:var(--muted)}
/* Sheets */
.sheetq{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d9d9d9;border-radius:12px;font:500 16px var(--font-body);background:#fff;color:var(--ink)}
.srow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 4px;border-bottom:1px solid var(--line);cursor:pointer;background:transparent;border-left:0;border-right:0;border-top:0;width:100%;text-align:left;font:500 15px var(--font-body);color:var(--ink)}
.srow small{color:var(--muted)}
.ttiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ttile{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 10px;border-radius:16px;border:0;font:700 16px var(--font-body);cursor:pointer}.ttile.g{background:#d99a26;color:#fff}.ttile.s{background:#3b5978;color:#fff}

html:root body .card h2,html:root body .card>.hd h2{color:var(--ink)!important;text-transform:none!important;letter-spacing:0!important}

/* Leistungen (Sport) */
.sp .spmbox{border:0!important;border-radius:0!important;margin:0 -12px 12px!important;overflow:visible!important;background:transparent!important}
html:root body .sp .spareas{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;gap:0;background:var(--fc)!important;margin:0!important;padding:0 12px!important;border:0!important;border-radius:0!important;box-shadow:0 0 0 100vmax var(--fc);clip-path:inset(0 -100vmax);scrollbar-width:none}
html:root body .sp .spareas .tscat{flex:0 0 auto;position:relative;background:transparent!important;color:var(--fon)!important;opacity:.65;border:0!important;border-radius:0!important;padding:13px 16px!important;font:600 15px var(--font-body)!important;text-transform:none!important;box-shadow:none!important;white-space:nowrap;cursor:pointer}
html:root body .sp .spareas .tscat.on{opacity:1}html:root body .sp .spareas .tscat.on::after{content:'';position:absolute;left:14px;right:14px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:var(--fon)}
html:root body .sp .spdisc2{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;gap:2px;background:#dedede!important;border-radius:12px!important;padding:3px!important;margin:12px 12px 0!important;border:0!important;scrollbar-width:none}
html:root body .sp .spdisc2 .tscat{flex:0 0 auto;background:transparent!important;color:#444!important;border:0!important;border-radius:9px!important;padding:8px 14px!important;font:600 14px var(--font-body)!important;text-transform:none!important;white-space:nowrap;box-shadow:none!important}
html:root body .sp .spdisc2 .tscat.on{background:#fff!important;color:#1a1a1a!important;box-shadow:0 1px 2px rgba(0,0,0,.15)!important}
.sp .kmmain{display:block}.sp .kmmain>*{margin-bottom:12px}
.spyr{margin:12px 12px 0}.spyr label{font:600 13px var(--font-body);color:var(--muted)}.spyr select{margin-left:6px;padding:7px 12px;border:1px solid #d9d9d9;border-radius:10px;background:#fff;font:600 14px var(--font-body);color:var(--ink)}
.sptwo{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sptwo .sptb{width:100%}
/* Klassenliste und Klassenseite */
.dd{background:#fff;border-radius:16px;overflow:hidden;margin:0 0 12px}
.ddh{display:flex;align-items:center;gap:10px;width:100%;padding:15px 16px;background:#f5f5f5;border:0;font:600 16px var(--font-body);color:var(--ink);cursor:pointer;text-align:left}
.ddh b{flex:1}.ddn{background:#e6e6e6;border-radius:99px;padding:2px 9px;font:600 13px var(--font-body);color:#555}.ddh .fdot{width:12px;height:12px}
.crow{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:13px 16px;background:#fff;border:0;border-top:1px solid var(--line);cursor:pointer;text-align:left;color:var(--ink)}
.crow .cn{font:700 20px var(--font-body)}.crow small{display:block;color:var(--muted);font:500 13px var(--font-body);margin-top:2px}
body[data-fach=gpb]{--fc:#d99a26;--fon:#ffffff}body[data-fach=bspk]{--fc:#3b5978;--fon:#ffffff}
body[data-fach] .hero{background:var(--fc)!important;box-shadow:0 0 0 100vmax var(--fc)!important;margin-bottom:0!important}
body[data-fach] .tb .tdate b,body[data-fach] .tb .tdate span,body[data-fach] .tb button{color:var(--fon)!important}
body[data-fach] .tb button:hover{background:rgba(0,0,0,.1)}
.km2>.chead{background:var(--fc);color:var(--fon);margin:-10px -12px 0;padding:2px 20px 16px;display:flex;align-items:center;gap:16px;box-shadow:0 0 0 100vmax var(--fc);clip-path:inset(0 -100vmax)}
.chsym{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,.28);color:var(--fon)}
.chn{display:block;font:700 28px var(--font-body);line-height:1.1}.chs{display:block;font:500 16px var(--font-body);opacity:.85}
html:root body[data-fach] .km2>.ttmenu{background:var(--fc)!important;border-bottom:0!important;margin:0 -12px 12px!important;padding:0 12px;box-shadow:0 0 0 100vmax var(--fc)!important;clip-path:inset(0 -100vmax)!important}
html:root body[data-fach] .km2>.ttmenu .ttchip{color:var(--fon)!important;opacity:.65}body[data-fach] .km2>.ttmenu .ttchip.on{opacity:1}body[data-fach] .km2>.ttmenu .ttchip.on::after{background:var(--fon)!important}
.km2 .kmbody2{padding-top:6px}
.notab{border-collapse:collapse;width:100%;font:500 14px var(--font-body)}.notab th,.notab td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}.notab th{color:var(--muted);font-weight:600}

/* ===== kompakte Größen ===== */
html:root body .sp .spareas select,html:root body .sp .spareas .spyr{flex:0 0 auto;margin:6px 0 6px 8px;padding:3px 8px;font-size:12px;border-radius:8px;border:1px solid rgba(255,255,255,.5);background:#fff;color:#1a1a1a}
html:root .wrap{padding-left:6px!important;padding-right:6px!important}
html:root .hero{padding:6px 0 4px!important;margin-bottom:6px!important}
.tb{min-height:36px}.tb .tdate b{font-size:16px!important}.tb .tdate span{font-size:11px!important}
.tb button{width:36px;height:36px}.tb button svg{width:20px;height:20px}.tb .tback{width:34px;height:34px;margin-left:-6px}
html:root .nav a{min-height:48px;padding:5px 0 4px!important;font-size:10px!important}html:root .nav a .nt{font-size:10px!important}html:root .nav a .ni{width:20px;height:20px}
html:root #main{padding-bottom:64px!important}
html:root .ttchip{font-size:13px!important;padding:9px 11px!important}
html:root .ttchip.on::after{left:10px;right:10px;height:2px}
html:root body .ttmenu,html:root body .km>.ttmenu,html:root body .km2>.ttmenu{margin-bottom:8px!important}
html:root .card{border-radius:14px;padding:10px!important}
html:root .card>.hd:first-child{margin:-10px -10px 8px;padding:8px 10px;font-size:13px;border-radius:14px 14px 0 0}
html:root body .card h2,html:root body .card>.hd h2{font-size:13.5px!important;font-weight:700!important;margin:0 0 6px!important}
html:root body .card>.row h2,html:root body .card>.hd h2{margin:0!important}
html:root .card+.card,.kmmain>*{margin-bottom:8px}
html:root body .card h3{font-size:13px!important}
html:root .btn{font-size:12.5px}html:root .btn.sm{padding:4px 10px;font-size:12px}
.dd{border-radius:14px;margin-bottom:8px}.ddh{padding:10px 12px;font-size:14px}.ddn{font-size:12px;padding:1px 8px}
.crow{padding:9px 12px}.crow .cn{font-size:16px}.crow small{font-size:12px;margin-top:1px}
.srow{padding:8px 2px;font-size:14px}
.km2>.chead{margin:-4px -6px 0;padding:0 14px 8px;gap:10px}.chsym{width:44px;height:44px}.chsym svg{width:30px;height:30px}
.chn{font-size:20px}.chs{font-size:13px}
body[data-fach] .km2>.ttmenu{margin:0 -6px 8px!important;padding:0 6px}
html:root body .sp .spareas{padding:0 6px!important}
html:root body .sp .spareas .tscat{font-size:13px!important;padding:9px 11px!important}
html:root body .sp .spareas .tscat.on::after{left:10px;right:10px;height:2px}
html:root body .sp .spdisc2{margin:8px 6px 0!important;padding:2px!important;border-radius:10px!important}
html:root body .sp .spdisc2 .tscat{font-size:12px!important;padding:5px 9px!important;border-radius:8px!important}
.spyr{margin:8px 6px 0}.spyr label{font-size:12px}.spyr select{padding:4px 9px;font-size:12.5px}
.sp .spmbox{margin:0 -6px 8px!important}
.sptwo{gap:8px}
.notab{font-size:13px}.notab th,.notab td{padding:6px 8px}
.ttile{padding:16px 8px;font-size:14px}
.sheetq{padding:9px 12px;font-size:15px}
.nspager button{padding:7px 0;font-size:13px}
html:root .ccard{padding:10px}
`;
  const st = document.createElement('style'); st.id = 'ui2'; st.textContent = css; document.head.appendChild(st);
  const IC = {
    book: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5z"/><path d="M4 21.5A2.5 2.5 0 016.5 19H20M9 7h7"/></svg>',
    run: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="15" cy="4.5" r="2"/><path d="M12 8.5l-3 2.5-2 3M12 8.5l3.5 2 3 .5M12 8.5l-1 4 3 2.5 1 5M10.5 12.5L8 19"/></svg>',
    tools: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  };
  window.UI = { IC };
  const TOP = new Set(['klassen', 'mappe', 'leistungen', 'material']);
  const SHORTWD = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'], SHORTM = ['Jän.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  function build() {
    const h = document.querySelector('.hero'); if (!h || h.querySelector('.tb')) return;
    const tb = document.createElement('div'); tb.className = 'tb';
    tb.innerHTML = `<div class="tl"><button class="tback" id="tback" data-act="back" aria-label="Zurück" title="Zurück" hidden>${IC.back}</button><div class="tdate"><b id="tdd">–</b><span id="tkw"></span></div></div><div class="tr"><button data-act="toolsopen" aria-label="Klassentools" title="Klassentools">${IC.tools}</button><button data-act="srchopen" aria-label="Suchen" title="Schüler suchen">${IC.search}</button><button data-act="uigear" aria-label="Einstellungen" title="Einstellungen">${IC.gear}</button></div>`;
    h.insertBefore(tb, h.firstChild);
  }
  window.uiTick = function (n) {
    build(); const d = document.getElementById('tdd'), k = document.getElementById('tkw'); if (!d) return;
    const a = SHORTWD[n.getDay()] + ', ' + n.getDate() + '. ' + SHORTM[n.getMonth()], b = 'KW ' + (typeof isoWeek === 'function' ? isoWeek(n) : '');
    if (d.textContent !== a) d.textContent = a; if (k.textContent !== b) k.textContent = b;
  };
  window.uiAfterRender = function () {
    build(); const v = U.view || 'klassen', b = document.getElementById('tback'); document.body.dataset.v = v; try { const m = document.querySelector('meta[name=theme-color]'), f = document.body.dataset.fach; if (m) m.content = f === 'gpb' ? '#d99a26' : f === 'bspk' ? '#3b5978' : '#1E293B'; } catch (e) { /* */ } if (b) b.hidden = TOP.has(v) || v === 'uebersicht' && false;
    const bar = (U.toolsPop ? toolsSheet() : '') + (U.srchPop ? srchSheet() : ''); const old = document.getElementById('uisheet'); if (old) old.remove();
    if (bar) document.body.insertAdjacentHTML('beforeend', `<div id="uisheet">${bar}</div>`);
    document.querySelectorAll('.ttmenu').forEach((m) => { const on = m.querySelector('.ttchip.on'); if (on && m.scrollWidth > m.clientWidth) m.scrollLeft = Math.max(0, on.parentElement.offsetLeft - 24); });
    const s = document.getElementById('srq'); if (s && !s.dataset.f) { s.dataset.f = '1'; s.focus(); }
  };
  const sheet = (title, inner) => `<div class="lspop" data-ui="1"><div class="lspopb" role="dialog" aria-label="${title}" style="max-width:640px;width:min(640px,100%)"><div class="lspoph"><h2 style="margin:0">${title}</h2><button class="btn sm" data-act="uisheetx">Schließen</button></div><div class="lspopc" style="padding:14px">${inner}</div></div></div>`;
  function toolsSheet() {
    const p = U.toolsPop; if (p === true) return sheet('Klassentools', `<div class="ttiles"><button class="ttile g" data-act="toolsgo" data-kd="gpb">${IC.book}Geschichte</button><button class="ttile s" data-act="toolsgo" data-kd="bspk">${IC.run}Sport</button></div>`);
    const h = (typeof KM !== 'undefined' && KM.toolsSheetHtml) ? KM.toolsSheetHtml(p) : ''; return sheet('Klassentools · ' + (p.kd === 'gpb' ? 'Geschichte' : 'Sport'), h || '<p class="muted">Für dieses Fach gibt es keine Stunde im Stundenplan.</p>');
  }
  const allStudents = () => { const out = []; groups().forEach((G) => { (Array.isArray(cinfo(G.slug).students) ? cinfo(G.slug).students : []).forEach((x) => out.push({ G, x })); }); return out; };
  const resHtml = (q) => { q = norm(q || ''); if (!q) return '<p class="muted sm" style="margin:8px 4px">Name oder Teil des Namens eingeben.</p>'; const seen = new Set(), r = allStudents().filter(({ G, x }) => norm((x.vn || '') + ' ' + (x.nn || '')).includes(q) || norm((x.nn || '') + ' ' + (x.vn || '')).includes(q)).filter(({ G, x }) => { const k = G.slug + x.id; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 30);
    return r.length ? r.map(({ G, x }) => `<button class="srow" data-act="srchgo" data-slug="${esc(G.slug)}" data-id="${esc(x.id)}"><span><b>${esc(x.nn || '')}</b> ${esc(x.vn || '')}</span><small>${esc(LB(G))} · ${esc(G.subject)}</small></button>`).join('') : '<p class="muted sm" style="margin:8px 4px">Kein Schüler gefunden.</p>'; };
  const srchSheet = () => sheet('Schüler suchen', `<input id="srq" class="sheetq" type="search" placeholder="Name suchen …" autocomplete="off" aria-label="Schüler suchen"><div id="srr" style="margin-top:8px">${resHtml('')}</div>`);
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'srq') { const r = document.getElementById('srr'); if (r) r.innerHTML = resHtml(e.target.value); } });

  /* Wiederverwendbare Reiter: UI.tabs(liste, aktiv, aktion) – Wischen wechselt den Reiter */
  UI.tabs = (items, cur, act) => `<div class="ttmenu" role="tablist">${items.map(([k, t]) => `<span class="ttchipw"><button class="ttchip${k === cur ? ' on' : ''}" role="tab" aria-selected="${k === cur}" data-act="${act}" data-p="${k}">${t}</button></span>`).join('')}</div>`;
  UI.pane = (items, cur, act, inner) => `<div class="uipane" data-tabs="${items.map((x) => x[0]).join(',')}" data-cur="${cur}" data-act2="${act}">${inner}</div>`;

  /* Home: Heute · Anwesenheit · Stundenplan · Stundeninhalte */
  const HT = [['t', 'Heute'], ['a', 'Anwesenheit'], ['p', 'Stundenplan'], ['i', 'Stundeninhalte']];
  window.homeShell = (dayBody, planPane, nxO, lessonStatus) => {
    const cur = HT.some((x) => x[0] === U.hp) ? U.hp : 't', P = { t: dayBody, p: planPane };
    const h = U.hcur, G = h && groups().find((g) => g.slug === h.slug);
    if (!G || !nxO) P.a = '<div class="card"><p class="muted">Keine laufende oder nächste Stunde.</p></div>';
    else { const key = G.slug + '|' + h.date, sv = U.attOpen; U.attOpen = key; const ls = lessonStatus(G, nxO, false); U.attOpen = sv; const x = ls.ics, panel = x.slice(x.indexOf('</div>') + 6).replace(/<div class="attp inhp">[\s\S]*$/, '');
      P.a = `<div class="card" style="padding:8px 0"><div class="muted sm" style="margin:0 12px 6px">${esc(LB(G))} · ${esc(G.subject)} · ${esc(dshort(h.date))}${h.von ? ' · ' + esc(h.von) + '–' + esc(h.bis || '') : ''}</div>${panel || '<p class="muted" style="margin:6px 12px">Noch keine Schüler in dieser Klasse.</p>'}</div>`; }
    if (!G) P.i = '<div class="card"><p class="muted">Keine Klasse gewählt.</p></div>';
    else { const lg = (cinfo(G.slug).log || []).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
      P.i = `<div class="card"><div class="muted sm" style="margin-bottom:6px">${esc(LB(G))} · ${esc(G.subject)} – alle Stunden</div>${lg.length ? lg.map((x) => `<button class="srow" data-act="go" data-v="stunde-${esc(G.slug)}--${esc(x.id)}"><span><b>${esc(dshort(x.date))}</b>&nbsp; ${esc(x.text || '–')}</span><small>${x.date > TODAY ? 'geplant' : ''}</small></button>`).join('') : '<p class="muted">Noch keine Stunden eingetragen.</p>'}</div>`; }
    return UI.tabs(HT, cur, 'homepane') + UI.carousel(HT, cur, 'homepane', P);
  };
  Object.assign(A, { homepane: (e) => { const p = e.dataset.p; if (p === 'a' && U.hcur) { const h = U.hcur; if (!(cinfo(h.slug).log || []).some((x) => x.date === h.date)) saveLog(h.slug, (log) => log.push({ id: uid('l'), date: h.date, text: '' })); } U.hp = p; render(); } });
  document.addEventListener('click', (e) => { const t = e.target; if (t && t.classList && t.classList.contains('lspop') && t.dataset.ui) A.uisheetx(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && (U.toolsPop || U.srchPop)) A.uisheetx(); });
  Object.assign(A, {
    uigear: () => { if (typeof drwOpen === 'function') drwOpen(); },
    toolsopen: (e) => { const kd = e && e.dataset && e.dataset.kd; if (!kd) { U.toolsPop = true; U.srchPop = false; render(); return; } const r = typeof KM !== 'undefined' && KM.toolsPrepare ? KM.toolsPrepare(kd) : null; U.toolsPop = r || { kd }; render(); },
    srchopen: () => { U.srchPop = true; U.toolsPop = null; render(); },
    srchgo: (e) => { U.srchPop = false; render(); setView('schueler-' + e.dataset.slug + '--' + e.dataset.id); },
    uisheetx: () => { U.toolsPop = null; U.srchPop = false; render(); },
  });
})();

/* ===== Oberfläche Teil 2: Wisch-Karussell, Home-Karten, Klassentools als Vollbildseite ===== */
(() => {
  if (!window.UI) return;
  const css = `
/* Kopfzeile abgesetzt */
html:root .hero{background:#1E293B!important;box-shadow:0 0 0 100vmax #1E293B!important;color:#fff!important}
.tb .tdate b,.tb .tdate span,.tb button{color:#fff!important}.tb button:hover{background:rgba(255,255,255,.12)!important}
html:root body[data-fach] .hero{margin-bottom:0!important}
html:root body[data-fach=gpb] .hero{background:#d99a26!important;box-shadow:0 0 0 100vmax #d99a26!important}html:root body[data-fach=bspk] .hero{background:#3b5978!important;box-shadow:0 0 0 100vmax #3b5978!important}
body[data-fach=gpb] .tb .tdate b,body[data-fach=gpb] .tb .tdate span,body[data-fach=gpb] .tb button{color:#ffffff!important}
body[data-fach=bspk] .tb .tdate b,body[data-fach=bspk] .tb .tdate span,body[data-fach=bspk] .tb button{color:#fff!important}
/* untere Leiste höher */
html:root .nav a{min-height:72px!important;padding:12px 0 10px!important;gap:5px!important}html:root .nav a .ni{width:26px!important;height:26px!important}html:root .nav a .nt{font-size:11px!important}
html:root #main{padding-bottom:96px!important}
/* Ränder schmaler */
html:root body{padding-left:0!important;padding-right:0!important}
html:root .wrap{padding-left:4px!important;padding-right:4px!important;row-gap:0!important}
html:root #main.wrap{padding-left:0!important;padding-right:0!important}
html:root body[data-fach=""] #main{padding-top:8px}
/* Reiter: bündig, ohne Trennlinien */
html:root .ttchipw{display:flex!important;border:0!important;align-items:stretch}.ttchipw>button{display:block!important;line-height:1.2}
html:root body .ttmenu{align-items:stretch!important;padding-bottom:0!important}
/* Klassenseite: weiße Schrift, keine Lücke */
.km2>.chead{margin:0 -4px!important;padding:6px 14px 10px!important;--fon:#fff}
body[data-fach] .km2 .chn,body[data-fach] .km2 .chs,body[data-fach] .km2 .chsym{color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.35)}
html:root body[data-fach] .km2>.ttmenu{margin:0 -4px 8px!important}
html:root body[data-fach] .km2>.ttmenu .ttchip{color:#fff!important;opacity:.75;text-shadow:0 1px 2px rgba(0,0,0,.35)}html:root body[data-fach] .km2>.ttmenu .ttchip.on{opacity:1}
html:root body[data-fach] .km2>.ttmenu .ttchip.on::after{background:#fff!important}
.km2 .kmbody2{padding-top:0}.km2 .kmbody2 .card{margin-top:0}
/* Schülerliste */
.km2 .kmth [data-kw=nr],.km2 .kmno{font-size:0!important;width:0!important;padding:0!important;overflow:hidden}.km2 .kmno{font-size:0!important;overflow:hidden;width:0!important;padding:0!important}.km2 .kmtable{--nrw:0px!important}
.km2 .kmnm{display:flex!important;flex-direction:column;align-items:flex-start!important;text-align:left!important;line-height:1.15}.km2 .kmnm b{display:block}
.km2 .kmth .gfs{font-weight:600}.km2 .kmth .gfb{cursor:pointer;opacity:.55;padding:0 3px}.km2 .kmth .gfb.on{opacity:1;color:var(--ink);text-decoration:underline}
.km2 .kmbody2 .card{padding:8px 6px!important}.km2 .kmbody2 .card>.row{padding:0 6px}
/* Karussell */
.car{overflow:hidden;position:relative}.cartr{display:flex;will-change:transform;transition:transform .28s cubic-bezier(.22,.8,.3,1)}.cartr.nodur{transition:none}
.carp{flex:0 0 100%;min-width:0;max-height:0;overflow:hidden}.carp.on,.car.drag .carp,.car.anim .carp{max-height:none;overflow:visible}
/* Home: Tage und Karten */
.dsec{display:block!important;margin:0 0 6px!important}.dayl{padding:10px 8px 6px;font:500 14px var(--font-body);color:#444}.dayl b{font-weight:700;color:#1a1a1a}.dayl span{color:#777;font-size:12px}
html:root body .ccard{background:#f1f1f1!important;border:0!important;border-radius:14px!important;padding:0 0 10px!important;overflow:hidden;box-shadow:none}
.ccard[data-k=gpb]{--fc:#d99a26;--fon:#ffffff}.ccard[data-k=bspk]{--fc:#3b5978;--fon:#fff}
html:root body .ccard>a.cl{display:flex!important;align-items:baseline;gap:10px;flex-wrap:wrap;background:var(--fc,#ddd);color:var(--fon,#222);padding:10px 14px!important;margin:0!important;text-decoration:none}
.ccard>a.cl b{font:700 20px var(--font-body)!important}.ccard>a.cl .sj{font:600 14px var(--font-body)!important}.ccard>a.cl .mt{margin-left:auto;font:600 14px var(--font-body)!important;text-align:right}
html:root body .ccard[data-k] a.cl b,html:root body .ccard[data-k] a.cl .sj,html:root body .ccard[data-k] a.cl .mt{color:var(--fon)!important}
html:root body .ccard>.prg{top:auto;bottom:auto}
html:root body .ccard>.lg{background:#fff!important;border-radius:0!important;margin:0!important;padding:8px 14px!important}
html:root body .ccard>.ics{margin:10px 10px 0!important;display:flex!important;gap:8px}
html:root body .ccard .ics .attb{background:#fff!important;color:#1a1a1a!important;border:1px solid #d6d6d6!important;flex:1;justify-content:center;font-size:15px!important;padding:12px 16px!important;border-radius:12px!important}
html:root body .ccard>.attp{background:#fff!important;border-radius:0!important;margin:10px 0 0!important;padding:10px 8px!important;border:0!important}
.attp .attt2{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.micbig{display:inline-flex!important;align-items:center;gap:8px;font-size:15px!important;padding:10px 16px!important;border-radius:12px!important}
.attp .attl li .nm{display:flex;flex-direction:column;line-height:1.15}.attp .attl li .nm a{display:flex;flex-direction:column}
.ccard .micb svg{display:block}
/* Pop-ups oben */
#uisheet .lspop{place-items:start center!important;padding-top:6px!important}
/* Klassentools-Seite */
.tl2>.chead{margin:0 -4px;padding:6px 14px 12px;display:flex;align-items:center;gap:14px;background:var(--fc);color:var(--fon);box-shadow:0 0 0 100vmax var(--fc);clip-path:inset(0 -100vmax)}
.tl2 .chsym{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.28);display:grid;place-items:center}
.tl2 .chn{font:700 20px var(--font-body)}.tl2 .chs{font:500 13px var(--font-body);opacity:.9}
.tl2 .ddb{padding:10px 8px}.tl2 .dd{margin:8px 0 0}
.tl2 .card{box-shadow:none}
/* Anzeigetafel */
.sbbox{background:#101418;color:#fff;border-radius:14px;padding:10px;user-select:none;-webkit-user-select:none}
.sbtop{display:flex;gap:8px;align-items:center;justify-content:space-between;margin-bottom:8px}
.sbrow{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:stretch}
.sbteam{border-radius:12px;padding:8px;text-align:center;color:#fff;position:relative;min-height:150px;display:flex;flex-direction:column;justify-content:space-between}
.sbname{font:700 16px var(--font-body);min-height:22px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sbpts{font:800 84px/1 var(--font-body);touch-action:none;cursor:pointer;padding:6px 0}
.sbsets{font:700 22px var(--font-body);touch-action:none;cursor:pointer;opacity:.95;padding:4px 0}.sbsets small{font-size:12px;font-weight:600;opacity:.8;display:block}
.sbmid{display:flex;flex-direction:column;justify-content:center;gap:8px}
.sbmid button,.sbtop button{background:#2a323b;color:#fff;border:0;border-radius:10px;padding:10px 12px;font:600 14px var(--font-body);cursor:pointer}
.sbball{position:absolute;top:6px;right:8px;font-size:22px}
.sbhist{font:500 13px var(--font-body);opacity:.85;margin-top:8px;text-align:center}
.sbwin{background:#fff;color:#111;border-radius:10px;padding:6px 10px;font:700 15px var(--font-body);margin-top:8px;text-align:center}
.sbfull{position:fixed;inset:0;z-index:5000;border-radius:0;display:flex;flex-direction:column;justify-content:center}
.sbfull .sbteam{min-height:60vh}.sbfull .sbpts{font-size:min(34vh,40vw)}
.sbfull.rot{transform:rotate(90deg);transform-origin:top left;width:100vh;height:100vw;left:100%}
.sbcfg{display:grid;gap:8px;margin-top:10px}.sbcfg label{font:600 13px var(--font-body);color:var(--muted)}.sbcfg input,.sbcfg select{padding:8px 10px;border:1px solid #d9d9d9;border-radius:10px;font:500 15px var(--font-body);width:100%;box-sizing:border-box;background:#fff;color:#1a1a1a}
.sbsw{display:flex;gap:6px;flex-wrap:wrap}.sbsw i{width:26px;height:26px;border-radius:50%;border:3px solid transparent;cursor:pointer;display:block}.sbsw i.on{border-color:#1a1a1a}
.tmgrid{display:flex;flex-wrap:wrap;gap:6px}.tmst{padding:8px 10px;border-radius:10px;background:#f1f1f1;border:0;font:500 14px var(--font-body);cursor:pointer;text-align:left;color:#1a1a1a}.tmst b{display:inline-block;min-width:20px;padding:0 6px;border-radius:99px;background:#1a1a1a;color:#fff;font-size:12px;margin-left:6px}
.tmdig{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.tmdig button{padding:16px 0;border-radius:12px;border:0;background:#f1f1f1;font:700 20px var(--font-body);cursor:pointer;color:#1a1a1a}
/* Spotify */
.spbox{display:flex;gap:12px;align-items:center}.spcov{width:88px;height:88px;border-radius:10px;background:#ddd;object-fit:cover;flex:0 0 auto}
.spt{font:700 16px var(--font-body);color:#1a1a1a}.sps{font:500 13px var(--font-body);color:var(--muted)}
.spctl{display:flex;gap:10px;align-items:center;margin-top:10px}.spctl button{width:52px;height:52px;border-radius:50%;border:0;background:#1a1a1a;color:#fff;font:700 18px var(--font-body);cursor:pointer}.spctl button.big{width:64px;height:64px;background:#1db954}
`;
  const st = document.createElement('style'); st.id = 'ui3'; st.textContent = css; document.head.appendChild(st);
  const esc2 = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---- Wisch-Karussell: die Seiten laufen mit dem Finger mit ---- */
  UI.carousel = (items, cur, act, panes) => { const ks = items.map((x) => x[0]), idx = Math.max(0, ks.indexOf(cur)); return `<div class="car" data-tabs="${ks.join(',')}" data-cur="${cur}" data-act2="${act}"><div class="cartr" style="transform:translateX(${-idx * 100}%)">${ks.map((k) => `<section class="carp${k === cur ? ' on' : ''}" data-k="${k}">${k === cur || true ? (panes[k] || '') : ''}</section>`).join('')}</div></div>`; };
  /* Wisch-Handler: siehe Feinabstimmung S8 */

  /* ---- Klassentools als Seite ---- */
  const SPORT_SB = { vb25: ['Volleyball (25)', 25, 15, 2, 3, 1, 0], vb21: ['Volleyball (21)', 21, 15, 2, 3, 1, 0], beach: ['Beachvolleyball (21)', 21, 15, 2, 2, 1, 0], bad: ['Badminton (21)', 21, 21, 2, 2, 0, 30], tt: ['Tischtennis (11)', 11, 11, 2, 3, 0, 0], faust: ['Faustball (11)', 11, 11, 2, 3, 0, 0], free: ['Allgemein (nur zählen)', 0, 0, 0, 0, 0, 0], bask: ['Basketball', 0, 0, 0, 0, 0, 0], hand: ['Handball', 0, 0, 0, 0, 0, 0], fuss: ['Fußball', 0, 0, 0, 0, 0, 0], uni: ['Unihockey', 0, 0, 0, 0, 0, 0], ultim: ['Ultimate Frisbee', 0, 0, 0, 0, 0, 0] };
  const COLS = ['#d32f2f', '#1976d2', '#2e7d32', '#f9a825', '#7b1fa2', '#ef6c00', '#00838f', '#455a64'];
  const SB = () => (U.sb = U.sb || { sport: 'vb25', n: ['', ''], c: [COLS[0], COLS[1]], p: [0, 0], s: [0, 0], hist: [], srv: 0, flip: false, win: -1, assign: {}, cls: '', full: false, rot: false });
  const rule = () => { const r = SPORT_SB[SB().sport] || SPORT_SB.free; return { n: r[0], pt: r[1], last: r[2], by: r[3], wins: r[4], serve: !!r[5], cap: r[6] }; };
  const tn = (i) => SB().n[i] || ('Team ' + (i + 1));
  function sbPoint(i, d) { const b = SB(), r = rule(), o = 1 - i; if (b.win >= 0 && d > 0) return; b.p[i] = Math.max(0, b.p[i] + d); if (d > 0 && r.serve) b.srv = i;
    if (d > 0 && r.pt) { const dec = r.wins && b.s[0] === r.wins - 1 && b.s[1] === r.wins - 1, tg = dec ? (r.last || r.pt) : r.pt; if ((b.p[i] >= tg && b.p[i] - b.p[o] >= r.by) || (r.cap && b.p[i] >= r.cap)) { b.s[i]++; b.hist.push(b.p[0] + ':' + b.p[1]); b.p = [0, 0]; if (r.wins && b.s[i] >= r.wins) b.win = i; } } sbDraw(); }
  function sbSet(i, d) { const b = SB(); b.s[i] = Math.max(0, b.s[i] + d); if (d < 0) b.win = -1; sbDraw(); }
  const sbDraw = () => { const el = document.getElementById('sbbox'); if (el) el.outerHTML = sbHtml(); };
  function spMini() { const j = SP.now, it = j && j.item; if (!lsGet('sp_rt')) return ''; return `<div class="sbmini" id="spmini"><button data-act="spprev">⏮</button><button data-act="sptog">${j && j.is_playing ? '⏸' : '▶'}</button><button data-act="spnext">⏭</button>${it ? `<span>${esc2(it.name)}</span>` : ''}</div>`; }
  function sbHtml() { const b = SB(), r = rule(), ord = b.flip ? [1, 0] : [0, 1], sets = r.wins > 0;
    const team = (i) => `<div class="sbteam" style="background:${b.c[i]}">${r.serve && b.srv === i ? '<span class="sbball" title="Aufschlag">🏐</span>' : ''}<div class="sbname">${esc2(tn(i))}</div><div class="sbpts" data-sbp="${i}">${b.p[i]}</div>${sets ? `<div class="sbsets" data-sbs="${i}"><small>Sätze</small>${b.s[i]}</div>` : '<div></div>'}</div>`;
    return `<div id="sbbox" class="sbbox${b.full ? ' sbfull' + (b.rot ? ' rot' : '') : ''}">${b.full ? spMini() : ''}<div class="sbrow">${team(ord[0])}<div class="sbmid"><button data-act="sbflip" aria-label="Seiten wechseln">⇄</button><button data-act="sbreset" aria-label="Zurücksetzen">↺</button></div>${team(ord[1])}</div>${b.win >= 0 ? `<div class="sbwin">🏆 ${esc2(tn(b.win))} gewinnt${b.hist.length ? ' (' + b.hist.join(', ') + ')' : ''}</div>` : (b.hist.length ? `<div class="sbhist">Sätze: ${b.hist.join('  ·  ')}</div>` : '')}<div class="sbfoot"><b>${esc2(r.n)}</b><button class="sbclose" data-act="sbfull">${b.full ? 'Schließen' : '⛶ Vollbild'}</button></div></div>`; }
  (() => { let t = null;
    document.addEventListener('pointerdown', (e) => { const el = e.target.closest && e.target.closest('[data-sbp],[data-sbs]'); if (!el) { t = null; return; } t = { el, x: e.clientX, y: e.clientY }; });
    document.addEventListener('pointerup', (e) => { if (!t) return; const { el } = t, dy = e.clientY - t.y, dx = e.clientX - t.x; t = null; const pts = el.dataset.sbp !== undefined, i = +(pts ? el.dataset.sbp : el.dataset.sbs); const f = pts ? sbPoint : sbSet; if (dy > 28 && Math.abs(dx) < 40) f(i, -1); else if (Math.abs(dy) < 16 && Math.abs(dx) < 16) f(i, 1); });
    document.addEventListener('contextmenu', (e) => { const el = e.target.closest && e.target.closest('[data-sbp],[data-sbs]'); if (el) { e.preventDefault(); const pts = el.dataset.sbp !== undefined; (pts ? sbPoint : sbSet)(+(pts ? el.dataset.sbp : el.dataset.sbs), -1); } });
  })();
  const dd = (k, title, body, open) => `<section class="dd"><button class="ddh" data-act="tdd" data-k="${k}" aria-expanded="${open}"><b>${title}</b><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg></button>${open ? `<div class="ddb">${body}</div>` : ''}</section>`;
  function teamsHtml() { const b = SB(), gs = (typeof groups === 'function' ? groups() : []).filter((G) => !G.sprech && subjKind(G.subject) === 'bspk'), cls = b.cls && gs.some((G) => G.slug === b.cls) ? b.cls : (gs[0] || {}).slug || '', G0 = gs.find((G) => G.slug === cls), sts = cls && KM.studentsOf ? KM.studentsOf(cls) : [];
    return `<div class="sbcfg"><label>Klasse<select data-ch="sbcls">${gs.map((G) => `<option value="${esc2(G.slug)}"${G.slug === cls ? ' selected' : ''}>${esc2(LB(G))}</option>`).join('')}</select></label><div class="tmgrid">${sts.map((x) => `<button class="tmst" data-act="tmpick" data-id="${esc2(x.id)}">${KM.avSpan ? KM.avSpan(x, 'kmav', G0) : ''}<span>${esc2(x.vn)} ${esc2(x.nn)}</span>${b.assign[x.id] ? `<b style="background:${COLS[(b.assign[x.id] - 1) % 8]}">${b.assign[x.id]}</b>` : ''}</button>`).join('') || '<span class="muted sm">Keine Schüler.</span>'}</div>${[1, 2, 3, 4, 5, 6, 7, 8].filter((n) => sts.some((x) => b.assign[x.id] === n)).map((n) => `<div class="sm"><b>${n <= 2 ? esc2(tn(n - 1)) : 'Team ' + n}:</b> ${sts.filter((x) => b.assign[x.id] === n).map((x) => esc2(x.vn)).join(', ')}</div>`).join('')}</div>`; }
  function cfgHtml() { const b = SB(); return `<div class="sbcfg"><label>Sportart / Regeln<select data-ch="sbsport">${Object.entries(SPORT_SB).map(([k, v]) => `<option value="${k}"${k === b.sport ? ' selected' : ''}>${esc2(v[0])}</option>`).join('')}</select></label><div class="sbinfo" style="color:#475569;opacity:1">${esc2((UI._SPI || {})[b.sport] || '')}</div>${[0, 1].map((i) => `<label>Team ${i + 1}<input data-ch="sbname" data-i="${i}" value="${esc2(b.n[i])}" placeholder="Team ${i + 1}"></label><div class="sbsw">${COLS.map((c) => `<i style="background:${c}" class="${b.c[i] === c ? 'on' : ''}" data-act="sbcol" data-i="${i}" data-c="${c}"></i>`).join('')}</div>`).join('')}</div>`; }
  /* Spotify (PKCE, nur mit eigener Client-ID) */
  const SP = { tok: null, now: null, timer: null };
  const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* */ } };
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const redirect = () => location.origin + '/';
  async function spToken(body) { const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) }); if (!r.ok) throw new Error('Spotify-Anmeldung fehlgeschlagen'); const j = await r.json(); SP.tok = j.access_token; lsSet('sp_at', j.access_token); lsSet('sp_exp', String(Date.now() + (j.expires_in - 60) * 1000)); if (j.refresh_token) lsSet('sp_rt', j.refresh_token); }
  async function spAuthOk() { const cid = lsGet('sp_cid'); if (!cid) return false; if (+lsGet('sp_exp') > Date.now() && lsGet('sp_at')) { SP.tok = lsGet('sp_at'); return true; } const rt = lsGet('sp_rt'); if (!rt) return false; try { await spToken({ grant_type: 'refresh_token', refresh_token: rt, client_id: cid }); return true; } catch (e) { return false; } }
  async function spApi(path, method, q) { if (!(await spAuthOk())) throw new Error('nicht verbunden'); const r = await fetch('https://api.spotify.com/v1' + path + (q ? '?' + new URLSearchParams(q) : ''), { method: method || 'GET', headers: { authorization: 'Bearer ' + SP.tok } }); if (r.status === 204) return null; if (r.status === 401) { lsSet('sp_exp', '0'); throw new Error('Anmeldung abgelaufen'); } if (!r.ok) { const t = await r.text(); throw new Error(r.status === 404 ? 'Kein aktives Gerät: Spotify am Handy öffnen und etwas abspielen.' : r.status === 403 ? 'Spotify Premium erforderlich.' : 'Spotify-Fehler ' + r.status + ' ' + t.slice(0, 60)); } try { return await r.json(); } catch (e) { return null; } }
  async function spPoll() { const box = document.getElementById('spnow') || document.getElementById('spmini'); if (!box) { clearInterval(SP.timer); SP.timer = null; return; } try { const j = await spApi('/me/player'); SP.now = j; SP.err = ''; } catch (e) { SP.err = e.message; } if (document.getElementById('spnow')) document.getElementById('spnow').outerHTML = spNowHtml(); if (document.getElementById('spmini')) document.getElementById('spmini').outerHTML = spMini(); }
  function spNowHtml() { const j = SP.now, it = j && j.item; if (!lsGet('sp_cid')) return '<div id="spnow"></div>'; if (SP.err) return `<div id="spnow" class="muted sm">${esc2(SP.err)}</div>`; if (!it) return '<div id="spnow" class="muted sm">Nichts wird abgespielt. Starte in der Spotify-App eine Playlist.</div>'; const img = (it.album && it.album.images && it.album.images[0] || {}).url || '';
    return `<div id="spnow"><div class="spbox">${img ? `<img class="spcov" src="${esc2(img)}" alt="Cover">` : '<div class="spcov"></div>'}<div style="min-width:0"><div class="spt">${esc2(it.name)}</div><div class="sps">${esc2((it.artists || []).map((a) => a.name).join(', '))}</div><div class="sps">${esc2((j.device || {}).name || '')}</div></div></div><div class="splinks">${j.context && j.context.external_urls && j.context.external_urls.spotify ? `<a href="${esc2(j.context.external_urls.spotify)}" target="_blank" rel="noopener">Playlist öffnen / bearbeiten ↗</a>` : ''}${it.external_urls && it.external_urls.spotify ? `<a href="${esc2(it.external_urls.spotify)}" target="_blank" rel="noopener">Titel in Spotify ↗</a>` : ''}<a href="https://open.spotify.com/collection/playlists" target="_blank" rel="noopener">Meine Playlists ↗</a></div><div class="spctl"><button data-act="spprev" aria-label="Zurück">⏮</button><button class="big" data-act="sptog" aria-label="Start/Pause">${j.is_playing ? '⏸' : '▶'}</button><button data-act="spnext" aria-label="Weiter">⏭</button><input type="range" min="0" max="100" value="${(j.device || {}).volume_percent == null ? 50 : j.device.volume_percent}" data-ch="spvol" aria-label="Lautstärke" style="flex:1"></div></div>`; }
  function spHtml() { const cid = lsGet('sp_cid'); setTimeout(() => { if (cid && !SP.timer) { SP.timer = setInterval(spPoll, 4000); } if (cid) spPoll(); }, 50);
    return `<p class="muted sm" style="margin:0 0 8px">Steuert die laufende Spotify-Wiedergabe (Playlist weiterschalten, Pause, Lautstärke, Cover). Braucht Spotify Premium und eine eigene Client-ID (kostenlos auf developer.spotify.com, Redirect-URI: <b>${esc2(redirect())}</b>).</p>${cid && lsGet('sp_rt') ? spNowHtml() : `<div class="sbcfg"><label>Client-ID<input id="spcid" value="${esc2(cid)}" placeholder="Client-ID einfügen" autocomplete="off"></label><button class="btn good" data-act="spconn">Mit Spotify verbinden</button></div>`}${cid && lsGet('sp_rt') ? '<button class="btn sm" data-act="spoff" style="margin-top:10px">Verbindung trennen</button>' : ''}`; }
  (async () => { try { const q = new URLSearchParams(location.search); if (q.get('code') && q.get('state') === 'lehrerapp-sp') { await spToken({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: redirect(), client_id: lsGet('sp_cid'), code_verifier: lsGet('sp_ver') }); history.replaceState(null, '', location.pathname + '#werkzeug-bspk'); U.view = 'werkzeug-bspk'; U.tdd = Object.assign({}, U.tdd, { media: true }); if (typeof render === 'function') render(); } } catch (e) { /* */ } })();

  UI._sbHtml = sbHtml; UI._sbFull = () => sbHtml() + cfgHtml(); UI._teamsHtml = teamsHtml; UI._spHtml = spHtml; UI._COLS = COLS;
  UI.toolsPage = (kd) => { const gpb = kd === 'gpb'; U.tdd = U.tdd || { clock: true }; const prep = typeof KM !== 'undefined' && KM.toolsPrepare ? KM.toolsPrepare(kd) : null, T = prep && KM.toolsObj ? KM.toolsObj(prep) : null, o = U.tdd;
    const head = `<div class="chead ${gpb ? 'fg' : 'fs'}"><span class="chsym">${gpb ? KM.SVG_HELM.replace('width="64" height="64"', 'width="30" height="30"') : KM.SVG_RUN.replace('width="64" height="64"', 'width="30" height="30"')}</span><span><span class="chn" style="display:block">Klassentools</span><span class="chs" style="display:block">${gpb ? 'Geschichte' : 'Sport'}</span></span></div>`;
    const strip = (h) => (h || '').replace(/<h2[^>]*>.*?<\/h2>/, '').replace(/^<div class="card"[^>]*>/, '<div>');
    const parts = [];
    if (T) { parts.push(dd('clock', 'Stoppuhr und Countdown', strip(T.clock), !!o.clock)); parts.push(dd('rnd', 'Zufallsgenerator', strip(T.rnd), !!o.rnd)); parts.push(dd('grp', 'Gruppen bilden', strip(T.grp), !!o.grp)); if (gpb) parts.push(dd('noise', 'Lautstärke', strip(T.noise), !!o.noise)); parts.push(dd('board', 'Tafel', strip(T.board), !!o.board)); if (gpb) parts.push(dd('seat', 'Testplatzzuweisung', strip(T.seat), !!o.seat)); }
    else parts.push('<section class="card"><p class="muted">Für dieses Fach gibt es keine Stunde im Stundenplan. Die Werkzeuge beziehen sich auf die laufende bzw. nächste Stunde.</p></section>');
    if (!gpb) { parts.splice(1, 0, dd('score', 'Anzeigetafel und Punkte zählen', sbHtml() + cfgHtml(), !!o.score)); parts.push(dd('teams', 'Teams einteilen', teamsHtml(), !!o.teams)); parts.push(dd('media', 'Musik / Mediensteuerung', spHtml(), !!o.media)); }
    return `<div class="km2 tl2">${head}<div style="padding-top:8px">${parts.join('')}</div></div>`; };
  Object.assign(A, {
    tdd: (e) => { U.tdd = Object.assign({}, U.tdd, { [e.dataset.k]: !(U.tdd || {})[e.dataset.k] }); render(); },
    toolsgo: (e) => { U.toolsPop = null; setView('werkzeug-' + e.dataset.kd); },
    sbflip: () => { const b = SB(); b.flip = !b.flip; sbDraw(); },
    sbreset: () => { const b = SB(); b.p = [0, 0]; b.s = [0, 0]; b.hist = []; b.win = -1; b.srv = 0; sbDraw(); },
    sbcol: (e) => { SB().c[+e.dataset.i] = e.dataset.c; render(); },
    sbfull: () => { const b = SB(); b.full = !b.full; b.rot = false; sbDraw(); if (b.full && lsGet('sp_rt')) setTimeout(() => { if (!SP.timer) SP.timer = setInterval(spPoll, 4000); spPoll(); }, 300); const el = document.getElementById('sbbox'); if (b.full) { try { const p = el.requestFullscreen && el.requestFullscreen(); if (p && p.then) p.then(() => { try { return screen.orientation.lock('landscape'); } catch (x) { return null; } }).catch(() => { if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } }); else if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } } catch (x) { if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } } } else { try { if (document.fullscreenElement) document.exitFullscreen(); screen.orientation.unlock(); } catch (x) { /* */ } } },
    tmpick: (e) => { U.tmPop = e.dataset.id; U.toolsPop = 'team'; render(); },
    tmset: (e) => { const b = SB(), n = +e.dataset.n; if (n) b.assign[U.tmPop] = n; else delete b.assign[U.tmPop]; U.tmPop = null; U.toolsPop = null; render(); },
    spconn: async () => { const cid = ((document.getElementById('spcid') || {}).value || '').trim(); if (!cid) return toast('Bitte Client-ID eintragen'); lsSet('sp_cid', cid); const ver = b64(crypto.getRandomValues(new Uint8Array(48))); lsSet('sp_ver', ver); const ch = b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ver))); location.href = 'https://accounts.spotify.com/authorize?' + new URLSearchParams({ response_type: 'code', client_id: cid, scope: 'user-read-playback-state user-modify-playback-state', redirect_uri: redirect(), state: 'lehrerapp-sp', code_challenge_method: 'S256', code_challenge: ch }); },
    spoff: () => { ['sp_rt', 'sp_at', 'sp_exp', 'sp_ver'].forEach((k) => lsSet(k, '')); SP.now = null; render(); },
    sptog: async () => { try { await spApi((SP.now && SP.now.is_playing) ? '/me/player/pause' : '/me/player/play', 'PUT'); setTimeout(spPoll, 400); } catch (e) { toast(e.message); } },
    spnext: async () => { try { await spApi('/me/player/next', 'POST'); setTimeout(spPoll, 600); } catch (e) { toast(e.message); } },
    spprev: async () => { try { await spApi('/me/player/previous', 'POST'); setTimeout(spPoll, 600); } catch (e) { toast(e.message); } },
  });
  Object.assign(C, {
    sbsport: (e) => { const b = SB(); b.sport = e.value; A.sbreset(); render(); },
    sbname: (e) => { SB().n[+e.dataset.i] = e.value; sbDraw(); },
    sbcls: (e) => { SB().cls = e.value; render(); },
    spvol: async (e) => { try { await spApi('/me/player/volume', 'PUT', { volume_percent: e.value }); } catch (x) { toast(x.message); } },
  });
  /* Auswahl-Sheet: Fach wählen und Teamnummer */
  const oldAfter = window.uiAfterRender;
  window.uiAfterRender = function () { oldAfter && oldAfter(); if (U.toolsPop === 'team') { const old = document.getElementById('uisheet'); if (old) old.remove(); document.body.insertAdjacentHTML('beforeend', `<div id="uisheet"><div class="lspop" data-ui="1"><div class="lspopb" style="max-width:420px;width:min(420px,100%)"><div class="lspoph"><h2 style="margin:0">Team wählen</h2><button class="btn sm" data-act="uisheetx">Schließen</button></div><div class="lspopc" style="padding:14px"><div class="tmdig">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<button data-act="tmset" data-n="${n}" style="border-bottom:4px solid ${COLS[(n - 1) % 8]}">${n}</button>`).join('')}<button data-act="tmset" data-n="0" style="grid-column:span 4;font-size:14px">Kein Team</button></div></div></div></div></div>`); } };
})();

/* ===== Feinabstimmung (S7): Menü, Karten, Kopfzeile ===== */
(() => {
  const st = document.createElement('style'); st.id = 'ui4'; st.textContent = `
html:root .hero{padding:20px 0 14px!important}
html:root body[data-fach] .hero{padding:20px 0 12px!important}
.tb{min-height:44px!important}
html:root .nav a{min-height:58px!important;padding:8px 0 7px!important;gap:3px!important}html:root .nav a .ni{width:23px!important;height:23px!important}html:root .nav a .nt{font-size:10.5px!important}
html:root #main{padding-bottom:78px!important}
html:root body .ccard.nx,html:root body .ccard.nx[data-k]{box-shadow:none!important;outline:0!important}
html:root body .ccard>a.cl{padding:8px 12px!important;gap:8px}
.ccard>a.cl b{font-size:17px!important}.ccard>a.cl .sj{font-size:13px!important}.ccard>a.cl .mt{font-size:13px!important}
html:root body .ccard{border-radius:12px!important;padding-bottom:8px!important}
html:root body .ccard>.lg{padding:6px 12px!important}
html:root body .ccard>.ics{margin:8px 8px 0!important}
html:root body .ccard .ics .attb{font-size:14px!important;padding:9px 14px!important;border-radius:10px!important}
.micbig{font-size:14px!important;padding:8px 14px!important;border-radius:10px!important}
html:root .card{padding:9px!important}
html:root body .card h2,html:root body .card>.hd h2{font-size:13px!important}
.dayl{padding:8px 6px 4px;font-size:13px}
`; document.head.appendChild(st);
})();

/* ===== Feinabstimmung S8: Wischen überall, Tabellen, Klassenliste, Material, Kopfzeile ===== */
(() => {
  const st = document.createElement('style'); st.id = 'ui5'; st.textContent = `
html:root .wrap{padding-left:6px!important;padding-right:6px!important}
html:root .card{padding:8px!important;border-radius:12px!important}
html:root .card>.hd:first-child{margin:-8px -8px 8px!important;padding:7px 9px!important}
.km2>.chead,.tl2>.chead{margin-left:-6px!important;margin-right:-6px!important}
html:root body[data-fach] .km2>.ttmenu{margin-left:-6px!important;margin-right:-6px!important}
html:root body .sp .spareas{padding:0 6px!important}
.sp .spmbox{margin-left:-6px!important;margin-right:-6px!important}
/* Kopfzeile: auf allen Seiten gleich hoch, mehr Abstand Datum/Klasse */
html:root .hero{padding:20px 0 14px!important}
html:root body[data-fach=""] .hero{padding-bottom:88px!important}
html:root body[data-fach=gpb] .hero,html:root body[data-fach=bspk] .hero{padding-bottom:24px!important}
.km2>.chead,.tl2>.chead{padding-top:10px!important}
/* Desktop: untere Leiste nur so breit wie der Inhalt */
@media(min-width:700px){html:root .nav{justify-content:center!important}html:root .nav a{flex:0 1 225px!important}}
/* Klassenliste */
.dd{margin:0 0 14px!important;border-radius:12px!important}
.ddh{padding:20px 14px!important;font-size:17px!important}
.dd.fg .ddh{background:#d99a26!important;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.dd.fs .ddh{background:#3b5978!important;color:#fff!important}
.dd .ddh .ddn{background:rgba(255,255,255,.3)!important;color:#fff!important}
.crow{padding:7px 14px!important;background:#fff!important}.crow .cn{font-size:15px!important}.crow small{font-size:11.5px!important}
/* Schülerliste: Bild und Name bleiben links stehen */
.km2 .kmrow>:nth-child(2){position:sticky;left:8px;z-index:6;background:#fff}
.km2 .kmrow>:nth-child(3){position:sticky;left:54px;z-index:6;background:#fff}
.km2 .kmth{background:#fff}.km2 .kmth>:nth-child(2),.km2 .kmth>:nth-child(3){background:#fff}
/* Reiter-Balken weich */
.ttchip::after{transition:opacity .15s}
html:root .ttchip:not(.on)::after{opacity:0}
/* Material */
.matepw{margin-bottom:8px}.matepw .matepinner{display:flex!important;flex-wrap:nowrap!important;gap:4px!important;overflow:hidden}.matepw .kmdiv{display:none!important}.matepw .kmchipw{flex:1 1 auto;min-width:0;display:flex}
.matepw .kmchip{font-size:9.5px!important;padding:5px 4px!important;white-space:nowrap;flex:1;display:flex;align-items:center;justify-content:center;gap:2px;overflow:hidden;text-overflow:ellipsis}.matepw .kmchip small{font-size:8.5px!important;opacity:.8}
.matkw .matkm{margin-top:0!important;padding:3px!important;gap:3px;border-radius:10px!important}.matkw .matchip{font-size:11px!important;padding:5px 8px!important;border-radius:8px!important}.matkw .matchip.on{background:#1a1a1a!important;color:#fff!important}
`; document.head.appendChild(st);

  /* Wischen: auf der ganzen Seite; Tabellen ausgenommen, außer im unteren Streifen */
  const EX = 'input,textarea,select,.ttmenu,.kmtable,[data-noswipe],.spdisc2,.spareas,.sbbox,[data-sbp],[data-sbs],#uisheet,.ttile,.matkm,.kmchips';
  const liveTab = (host, key) => { const bar = document.querySelector('.ttmenu[role=tablist]'); if (!bar) return; bar.querySelectorAll('.ttchip').forEach((b) => { const on = b.dataset.p === key; if (b.classList.contains('on') !== on) b.classList.toggle('on', on); if (on && bar.scrollWidth > bar.clientWidth) bar.scrollTo({ left: Math.max(0, b.parentElement.offsetLeft - 24), behavior: 'smooth' }); }); };
  (() => { let g = null;
    const navTop = () => { const n = document.getElementById('nav'); return n ? n.getBoundingClientRect().top : innerHeight; };
    document.addEventListener('touchstart', (e) => { if (e.touches.length !== 1) { g = null; return; } const t = e.target; if (t.closest && t.closest('.hero,#nav,#uisheet')) { g = null; return; }
      const car = document.querySelector('.car'), pane = car ? null : document.querySelector('.uipane'), host = car || pane; if (!host) { g = null; return; }
      const y = e.touches[0].clientY, zone = y > navTop() - 130 && y < navTop(); if (t.closest && t.closest(EX) && !zone) { g = null; return; }
      const ks = host.dataset.tabs.split(','); g = { host, car: !!car, tr: car ? car.firstElementChild : null, x: e.touches[0].clientX, y, t: Date.now(), ks, i: ks.indexOf(host.dataset.cur), w: host.clientWidth || innerWidth, lock: 0, d: 0 }; }, { passive: true });
    document.addEventListener('touchmove', (e) => { if (!g) return; const dx = e.touches[0].clientX - g.x, dy = e.touches[0].clientY - g.y;
      if (!g.lock) { if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { g.lock = 1; if (g.car) { g.host.classList.add('drag'); g.tr.classList.add('nodur'); } } else if (Math.abs(dy) > 10) { g = null; return; } else return; }
      if (e.cancelable) e.preventDefault(); let d = dx; if ((g.i === 0 && dx > 0) || (g.i === g.ks.length - 1 && dx < 0)) d = dx * 0.3; g.d = d;
      if (g.car) { g.tr.style.transform = `translateX(${-g.i * g.w + d}px)`; const ni = Math.max(0, Math.min(g.ks.length - 1, Math.round(g.i - d / g.w))); if (ni !== g.live) { g.live = ni; liveTab(g.host, g.ks[ni]); } } }, { passive: false });
    document.addEventListener('touchend', () => { if (!g || !g.lock) { g = null; return; } const x = g; g = null; const d = x.d || 0, v = Math.abs(d) / Math.max(1, Date.now() - x.t); let n = x.i; if (Math.abs(d) > x.w * 0.2 || (v > 0.35 && Math.abs(d) > 28) || (!x.car && Math.abs(d) > 40)) n = Math.max(0, Math.min(x.ks.length - 1, x.i + (d < 0 ? 1 : -1)));
      const act = x.host.dataset.act2;
      if (!x.car) { if (n !== x.i && A[act]) A[act]({ dataset: { p: x.ks[n] } }); return; }
      liveTab(x.host, x.ks[n]); x.tr.classList.remove('nodur'); x.host.classList.add('anim'); x.tr.style.transform = `translateX(${-n * 100}%)`;
      setTimeout(() => { x.host.classList.remove('drag', 'anim'); if (n !== x.i && A[act]) A[act]({ dataset: { p: x.ks[n] } }); }, 240); }, { passive: true });
  })();
})();

/* ===== S9: Farben, Icons, Schulinformation, Schüler 2, Lektionsseite ===== */
(() => {
  if (!window.UI) return;
  const H = 'data:image/png;base64,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', B = 'data:image/png;base64,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';
  UI.ICO = { gpb: H, bspk: B };
  UI.IC.book = `<img src="${H}" width="34" height="34" alt="">`; UI.IC.run = `<img src="${B}" width="34" height="34" alt="">`;
  const st = document.createElement('style'); st.id = 'ui6'; st.textContent = `
html:root{--ink:#1E293B;--text:#1E293B}
html:root body{color:#1E293B}
html:root .hero{background:#1E293B!important;box-shadow:0 0 0 100vmax #1E293B!important}
html:root body[data-fach=gpb] .hero{background:#d99a26!important;box-shadow:0 0 0 100vmax #d99a26!important}html:root body[data-fach=bspk] .hero{background:#3b5978!important;box-shadow:0 0 0 100vmax #3b5978!important}
.ccard[data-k=gpb]{--fc:#d99a26;--fon:#fff}.ccard[data-k=bspk]{--fc:#3b5978;--fon:#fff}
body[data-fach=gpb]{--fc:#d99a26;--fon:#fff}body[data-fach=bspk]{--fc:#3b5978;--fon:#fff}
.tb .tdate b{font-size:20px!important}.tb .tdate span{font-size:13px!important}
html:root body .wrap{padding-left:8px!important;padding-right:8px!important}
.km2>.chead,.tl2>.chead{margin-left:-8px!important;margin-right:-8px!important}
html:root body[data-fach] .km2>.ttmenu{margin-left:-8px!important;margin-right:-8px!important}
html:root body .card{padding:7px!important}html:root body .card>.hd:first-child{margin:-7px -7px 7px!important}
.chsym img,.tl2 .chsym img{width:36px;height:36px;display:block}
.ttile img{width:40px;height:40px}
#main .dd:first-child{margin-top:14px!important}
.ddh{display:flex;align-items:center;gap:10px;padding:22px 14px!important;font:700 18px var(--font-body);cursor:default}
.dd.fg .ddh{background:#d99a26!important}.dd.fs .ddh{background:#3b5978!important}
.crow small{display:block}
html:root body .brk{background:#e8eef5!important;border:1px solid #b9c7d8!important;border-radius:10px!important;color:#1E293B!important;padding:10px 12px!important;margin:4px 0!important;font-weight:700!important}
html:root body .brk span{font:700 14px var(--font-body)!important;color:#1E293B!important}
html:root body .attp .attl li{padding-top:14px!important;padding-bottom:14px!important;min-height:66px;align-items:center}
.km2 .kmbody2 .card{padding-left:0!important;padding-right:0!important}
.km2 .kmbody2 .card>.row,.km2 .kmbody2 .card>h2,.km2 .kmbody2 .card>p{padding-left:8px;padding-right:8px}
.km2 .kmrow>:nth-child(2){position:sticky!important;left:0!important;margin-left:-8px;z-index:20!important;background:#fff}
.km2 .kmrow>:nth-child(3){position:sticky!important;left:46px!important;z-index:20!important;background:#fff}
.km2 .kmrs{z-index:1!important}.km2 .kmth>span{overflow:visible}
.km2 .kmth{background:#fff;position:relative;z-index:1}
.s2seg{display:flex;gap:4px;padding:0 8px 8px}.s2seg button{flex:1;border:0;background:#e9edf2;border-radius:9px;padding:8px 6px;font:600 13px var(--font-body);color:#1E293B;cursor:pointer}.s2seg button.on{background:#3b5978;color:#fff}
.s2leg{display:flex;gap:14px;padding:0 12px 6px;font:500 12px var(--font-body);color:#64748b}.s2leg i,.s2num b{font-style:normal}.s2leg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px}
.ak{color:#1b7f4b}.pa{color:#b27300}.ab{color:#b3261e}.s2leg i.ak,.s2bar i.ak{background:#3fa66b}.s2leg i.pa,.s2bar i.pa{background:#e0a21a}.s2leg i.ab,.s2bar i.ab{background:#d9534f}
.s2row{display:grid;grid-template-columns:110px 1fr 44px;gap:8px;align-items:center;width:100%;border:0;border-top:1px solid #e6ebf1;background:#fff;padding:10px 12px;text-align:left;cursor:pointer;color:#1E293B}
.s2row.risk{background:#fff6f5}.s2nm{display:flex;flex-direction:column;line-height:1.15}.s2nm b{font:700 14px var(--font-body)}.s2nm span{font:500 13px var(--font-body);color:#475569}
.s2bar{display:flex;height:10px;border-radius:5px;overflow:hidden;background:#e6ebf1}.s2bar i{display:block;height:100%}
.s2num{display:block;margin-top:4px;font:500 12px var(--font-body);color:#475569}.s2num small{color:#94a3b8}
.s2pc{text-align:right;font:700 14px var(--font-body)}.s2w{display:block;color:#b3261e}
.les>.chead{margin:0 -8px!important;padding:10px 14px!important;--fon:#fff;display:flex;align-items:center;gap:14px;background:var(--fc);color:#fff;box-shadow:0 0 0 100vmax var(--fc);clip-path:inset(0 -100vmax)}
.les .chn,.les .chs{color:#fff!important}.les>.ttmenu{margin:0 -8px 8px!important}
.lestm{display:flex;justify-content:flex-end;margin-bottom:6px}
.nxl{cursor:pointer}.nxl .thm{display:block}.nxl .thm span{display:block;font:600 11px var(--font-body);color:#64748b;margin-bottom:2px}.nxl .thm input{width:100%;box-sizing:border-box;padding:9px 10px;border:1px dashed #94a3b8;border-radius:8px;font:600 15px var(--font-body);background:#fff;color:#1E293B}
.sch label{display:block;margin:8px 0 3px;font:600 12px var(--font-body);color:#64748b}.sch input,.sch textarea{width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid #d5dbe3;border-radius:9px;font:500 15px var(--font-body);background:#fff;color:#1E293B}.sch textarea{min-height:70px}
.sch .foto{width:88px;height:88px;border-radius:50%;object-fit:cover;background:#e2e8f0;display:block}.sch .arz{display:flex;gap:12px;align-items:center}
`; document.head.appendChild(st);
  const esc2 = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  UI.schoolPage = () => { const d = S.settings.schule || {}, a = d.arzt || {}, f = (k, l, ph, ml) => `<label>${l}</label>${ml ? `<textarea data-ch="schulf" data-f="${k}" placeholder="${ph}">${esc2(d[k] || '')}</textarea>` : `<input data-ch="schulf" data-f="${k}" value="${esc2(d[k] || '')}" placeholder="${ph}">`}`, g = (k, l, ph, ml) => `<label>${l}</label>${ml ? `<textarea data-ch="schulf" data-f="arzt.${k}" placeholder="${ph}">${esc2(a[k] || '')}</textarea>` : `<input data-ch="schulf" data-f="arzt.${k}" value="${esc2(a[k] || '')}" placeholder="${ph}">`}`;
    return `<div class="sch"><section class="card"><h2>Schule</h2>${f('name', 'Schulname', 'Name der Schule')}${f('adresse', 'Adresse', 'Straße, PLZ Ort', true)}${f('skz', 'Schulkennzahl', 'z. B. 3xxxxx')}${f('tel', 'Telefon / E-Mail', 'Sekretariat')}</section><section class="card"><h2>Schulärztin</h2><div class="arz">${a.foto ? `<img class="foto" src="${esc2(a.foto)}" alt="">` : '<div class="foto"></div>'}<div style="flex:1"><label style="margin-top:0">Foto</label><input type="file" accept="image/*" data-ch="schulfoto"></div></div>${g('name', 'Name', 'Name der Schulärztin')}${g('zeiten', 'Sprech- und Dienstzeiten', 'z. B. Di 8:00–10:00', true)}${g('kontakt', 'Kontakt', 'Telefon / E-Mail')}</section></div>`; };
  Object.assign(C, {
    schulf: (e) => { const d = S.settings.schule || { id: 'schule' }, f = e.dataset.f; let n = Object.assign({}, d, { id: 'schule' }); if (f.startsWith('arzt.')) n.arzt = Object.assign({}, d.arzt || {}, { [f.slice(5)]: e.value }); else n[f] = e.value; put('settings', n); },
    schulfoto: (e) => { const file = e.files && e.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 320 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); const d = S.settings.schule || { id: 'schule' }; put('settings', Object.assign({}, d, { id: 'schule', arzt: Object.assign({}, d.arzt || {}, { foto: cv.toDataURL('image/jpeg', 0.8) }) })); render(); }; im.src = r.result; }; r.readAsDataURL(file); },
  });
})();

(() => { const st = document.createElement('style'); st.id = 'ui7'; st.textContent = `.drwg{display:none!important}.drwi{touch-action:none;cursor:grab;padding-left:6px}.drwi .drwt{flex:1;text-align:left}`; document.head.appendChild(st); })();

/* ===== S10: Klassentools neu, Animationen, Material, Schulinformation ===== */
(() => {
  if (!window.UI) return;
  const st = document.createElement('style'); st.id = 'ui8'; st.textContent = `
/* Auswahlfelder: passendes Grau statt Schwarz */
html:root body .pastbox .attb,html:root body .ccard .ics .attb.open{background:#e2e8f0!important;color:#1E293B!important;border:1px solid #cbd5e1!important}
.matkw .matchip.on,.s2seg button.on{background:#cfd8e3!important;color:#1E293B!important;font-weight:700}
.matkw .matchip.on small,.matkw .matchip.on .matcnt{color:#1E293B!important;opacity:1!important}
.matkw .matchip small,.matkw .matchip .matcnt{color:#64748b}
.matkw .matchip{border-radius:8px!important}
/* Epochen ohne Klammern, weniger rund */
.matepw .kmchip::before,.matepw .kmchip::after,.matepw .kmchipw::before,.matepw .kmchipw::after{display:none!important;content:none!important}
.matepw .kmchip{border-radius:7px!important;box-shadow:none!important;outline:0!important}
.libhd{position:sticky;top:0;z-index:40;background:#fff;margin:-7px -7px 8px;padding:7px 7px 6px;border-radius:12px 12px 0 0;box-shadow:0 2px 0 #eef1f5}
/* Anwesenheit */
.attp .attt2 .micbig{display:none!important}
.attp .attt2{justify-content:flex-end}
.attp .attc{padding:14px 18px!important;font-size:14px!important;border-radius:10px!important;min-height:48px}
.attl li .btn.sm,.attl li .btn{border-radius:10px!important;padding:13px 14px!important;font-size:14px!important;min-height:46px;min-width:92px}
.attl li .micb{min-width:54px!important;padding:0!important;display:inline-flex!important;align-items:center;justify-content:center}
.attl li .micb svg{margin:0 auto}
.attl li .pcs{display:inline-flex;gap:10px;margin:0 8px}.attl li .pcs i{font-style:normal;font-size:14px;font-weight:700}
/* Unterseiten: Einrückung wie Klassenliste */
.km2 .kmbody2 .srow,.km2 .kmbody2 .kmli{padding-left:14px!important;padding-right:14px!important}
.km2 .kmbody2 .card>h2{padding:2px 14px 6px}.km2 .kmbody2 .card p{padding-left:14px;padding-right:14px}
.km2 .kmbody2 .card.nxl{padding:10px 14px!important}
.km2 .kmbody2 .kmphwide .card{padding:10px 14px!important}
.km2 .kmrow{padding-left:0!important}
.km2.stu .kmprofile{margin-left:0}.km2.stu .kmprofile .kmsb{display:none}
.km2.stu .kmbody2 .card{padding:8px 0!important}
/* Schüler Probe */
.pcard{border-top:1px solid #e6ebf1;background:#fff}.pcard:first-of-type{border-top:0}
.pch{display:grid;grid-template-columns:auto 1fr auto 20px;gap:12px;align-items:center;width:100%;border:0;background:transparent;padding:10px 14px;text-align:left;cursor:pointer;color:#1E293B}
.pnm{display:flex;flex-direction:column;line-height:1.15}.pnm b{font:700 14px var(--font-body)}.pnm span{font:500 13px var(--font-body);color:#475569}
.pkp{display:flex;flex-direction:column;align-items:flex-end;gap:2px}.pnote{font:500 11px var(--font-body);color:#64748b}
.pdet{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;padding:2px 14px 10px}
.pcol{background:#f1f5f9;border-radius:10px;padding:7px 9px;display:flex;flex-direction:column;gap:3px}.pcol small{font:600 11px var(--font-body);color:#64748b}
.pact{padding:0 14px 10px}
/* Klassentools */
.dd.tdr .ddh{display:flex;align-items:center;gap:10px;padding:13px 14px!important;font:700 15px var(--font-body);background:#f1f5f9!important;color:#1E293B!important;text-shadow:none!important;cursor:pointer;touch-action:pan-y}
.dd.tdr .ddh .ti{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#3b5978;color:#fff;flex:0 0 auto}.dd.tdr .ddh .ti svg{width:20px;height:20px}
.dd.tdr .ddh b{flex:1}
.dd.tdr.drag{box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:.95;position:relative;z-index:50}
.tl2 .btn,.tl2 button.btn{border-radius:10px!important}
.tmc .tmtop{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.tmc .tmtop b{font:700 14px var(--font-body)}
.tmc .tmfs{width:40px;height:36px;border-radius:10px;border:0;background:#e2e8f0;color:#1E293B;cursor:pointer;font-size:18px}
.tmrow{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:stretch}
.tmdisp{display:flex;align-items:center;justify-content:center;font:800 40px/1 var(--font-body);font-variant-numeric:tabular-nums;background:#f1f5f9;border-radius:12px;padding:20px 6px;min-height:84px;color:#1E293B}
.tmbtns{display:flex;gap:8px}.tmb{width:84px;height:84px;border-radius:14px;border:0;font:700 17px var(--font-body);cursor:pointer;background:#e2e8f0;color:#1E293B}.tmb.start{background:#1b7f4b;color:#fff}.tmb.start.run{background:#b3261e}
.tmpre{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.tmpre button{border:0;border-radius:9px;background:#e2e8f0;padding:8px 12px;font:600 13px var(--font-body);color:#1E293B;cursor:pointer}
.tmc:fullscreen{background:#101418;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:20px;box-sizing:border-box}
.tmc:fullscreen .tmdisp{font-size:min(22vw,34vh);background:transparent;color:#fff}.tmc:fullscreen .tmtop b{color:#fff}.tmc:fullscreen .tmb{width:min(18vw,24vh);height:min(18vw,24vh)}
.sbteam,.sbmid button,.sbtop button{border-radius:14px!important}
.sbmid button{width:88px;height:88px;font-size:34px;padding:0!important}
.sbsw i{border-radius:8px!important;width:30px!important;height:30px!important}
.tmdig button,.tmst,.tmst b{border-radius:10px!important}
.tmst{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px}.tmst .kmav{width:32px;height:32px}
.sbinfo{font:500 13px var(--font-body);opacity:.85;margin-top:8px;line-height:1.35}
.sbfoot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}
.sbfoot b{font:700 14px var(--font-body)}
.sbclose{background:#2a323b;color:#fff;border:0;border-radius:12px;padding:12px 18px;font:700 15px var(--font-body);cursor:pointer}
.sbmini{position:absolute;left:10px;top:10px;display:flex;gap:6px;align-items:center;z-index:3;font:600 12px var(--font-body);color:#fff;max-width:46vw}.sbmini button{width:40px;height:40px;border-radius:10px;border:0;background:#2a323b;color:#fff;font-size:16px}
.sbfull{padding:14px!important}
.spctl button{border-radius:14px!important;width:64px!important;height:56px!important}.spctl button.big{width:84px!important;height:56px!important}
.splinks{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.splinks a{border-radius:10px;background:#e2e8f0;color:#1E293B;padding:10px 14px;font:600 13px var(--font-body);text-decoration:none}
/* Schule */
.sch .logo{width:84px;height:84px;border-radius:50%;background:#1E293B;color:#fff;display:grid;place-items:center;font:800 26px var(--font-body);flex:0 0 auto}
.sch .row2{display:flex;gap:14px;align-items:center}.sch dl{margin:10px 0 0}.sch dt{font:600 12px var(--font-body);color:#64748b;margin-top:10px}.sch dd{margin:2px 0 0;font:500 15px var(--font-body);color:#1E293B}.sch dd.off{color:#94a3b8;font-style:italic}
.sch a{color:#3b5978}
`; document.head.appendChild(st);

  const esc2 = (x) => String(x == null ? '' : x).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ICS = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const TI = { media: ICS('<circle cx="12" cy="12" r="9"/><path d="M8 10c3-1 6-1 8 .5M8.5 13c2.5-.8 5-.5 6.5.5M9 16c2-.5 4-.3 5 .4"/>'), clock: ICS('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'), score: ICS('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M7 10v4M17 10v4"/>'), rnd: ICS('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>'), grp: ICS('<circle cx="8" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M2.5 19c.5-3 3-5 5.5-5s5 2 5.5 5M14.5 15c2-.5 5 .5 6 4"/>'), teams: ICS('<path d="M4 20V10l8-6 8 6v10z"/><path d="M9 20v-6h6v6"/>'), board: ICS('<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l2-4M16 20l-2-4"/>'), noise: ICS('<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>'), seat: ICS('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>') };

  /* ---------- Stoppuhr und Countdown, getrennt und gleichzeitig nutzbar ---------- */
  const TM = { cd: { ms: 300000, run: false, t0: 0, acc: 0, done: false }, sw: { run: false, t0: 0, acc: 0 } };
  const tmNow = (k) => { const t = TM[k]; const el = t.acc + (t.run ? Date.now() - t.t0 : 0); return k === 'cd' ? Math.max(0, t.ms - el) : el; };
  const tmFmt = (ms) => { const t = Math.floor(ms / 10), cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + ',' + String(cs).padStart(2, '0'); };
  const beep = () => { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.value = 0.2; o.start(); setTimeout(() => { o.stop(); a.close(); }, 700); } catch (e) { /* */ } };
  let tmTimer = null;
  const tmLoop = () => { if (tmTimer) return; tmTimer = setInterval(() => { let any = false; ['cd', 'sw'].forEach((k) => { const el = document.getElementById('tmd-' + k); if (el) el.textContent = tmFmt(tmNow(k)); if (TM[k].run) any = true; }); if (TM.cd.run && tmNow('cd') <= 0) { TM.cd.run = false; TM.cd.acc = TM.cd.ms; TM.cd.done = true; beep(); const b = document.querySelector('[data-act=tmgo][data-k=cd]'); if (b) { b.textContent = 'Start'; b.classList.remove('run'); } } if (!any && !document.getElementById('tmd-cd')) { clearInterval(tmTimer); tmTimer = null; } }, 40); };
  const tmCard = (k) => { const cd = k === 'cd', t = TM[k]; return `<div class="tmc" id="tmc-${k}"><div class="tmtop"><b>${cd ? 'Countdown' : 'Stoppuhr'}</b><button class="tmfs" data-act="tmfs" data-k="${k}" aria-label="Vollbild" title="Vollbild">⛶</button></div><div class="tmrow"><div class="tmdisp" id="tmd-${k}">${tmFmt(tmNow(k))}</div><div class="tmbtns"><button class="tmb start${t.run ? ' run' : ''}" data-act="tmgo" data-k="${k}">${t.run ? 'Stopp' : 'Start'}</button><button class="tmb" data-act="tmrs" data-k="${k}" aria-label="Zurücksetzen">↺</button></div></div>${cd ? `<div class="tmpre">${[1, 3, 5, 10, 15, 20].map((m) => `<button data-act="tmset" data-m="${m}">${m} Min</button>`).join('')}<button data-act="tmadd" data-m="1">+1</button><button data-act="tmadd" data-m="-1">−1</button></div>` : ''}</div>`; };
  const tmBody = () => { setTimeout(tmLoop, 30); return tmCard('cd') + '<div style="height:14px"></div>' + tmCard('sw'); };

  /* ---------- Sportarten: Regeln ---------- */
  const SPI = { vb25: 'Volleyball: ein Satz geht bis 25 Punkte (mind. 2 Punkte Vorsprung). Der 5. Satz geht nur bis 15. Gewonnen hat, wer 3 Sätze holt.', vb21: 'Volleyball (Schulregel): Satz bis 21 Punkte mit 2 Punkten Vorsprung, 3. Satz bis 15. Wer 3 Sätze holt, gewinnt.', beach: 'Beachvolleyball: Satz bis 21 Punkte (2 Punkte Vorsprung), 3. Satz bis 15. Zwei gewonnene Sätze entscheiden.', bad: 'Badminton: Satz bis 21 Punkte, 2 Punkte Vorsprung, bei 29:29 entscheidet der Punkt 30. Zwei gewonnene Sätze.', tt: 'Tischtennis: Satz bis 11 Punkte, 2 Punkte Vorsprung. Meist Best-of-5 (3 Sätze).', faust: 'Faustball: Satz bis 11 Punkte, 2 Punkte Vorsprung. Meist 3 gewonnene Sätze.', free: 'Einfach zählen: Punkte antippen, kein automatisches Satzende.', bask: 'Basketball: Punkte zählen (1, 2 oder 3 pro Korb). Kein automatisches Satzende.', hand: 'Handball: Tore zählen. Kein automatisches Satzende.', fuss: 'Fußball: Tore zählen. Kein automatisches Satzende.', uni: 'Unihockey: Tore zählen. Kein automatisches Satzende.', ultim: 'Ultimate Frisbee: Punkte zählen. Kein automatisches Satzende.' };

  /* ---------- Teams, Medien, Reihenfolge ---------- */
  const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* */ } };
  const ORD = { bspk: ['media', 'clock', 'score', 'rnd', 'grp', 'teams', 'board'], gpb: ['clock', 'rnd', 'grp', 'noise', 'board', 'seat'] };
  const order = (kd) => { let o = []; try { o = JSON.parse(lsGet('tl_order_' + kd) || '[]'); } catch (e) { /* */ } const def = ORD[kd]; return o.filter((k) => def.includes(k)).concat(def.filter((k) => !o.includes(k))); };
  UI.toolsPage = (kd) => { const gpb = kd === 'gpb'; U.tdd = U.tdd || { clock: true }; const prep = typeof KM !== 'undefined' && KM.toolsPrepare ? KM.toolsPrepare(kd) : null, T = prep && KM.toolsObj ? KM.toolsObj(prep) : null, o = U.tdd, SBH = UI._sbHtml, strip = (h) => (h || '').replace(/<h2[^>]*>.*?<\/h2>/, '').replace(/^<div class="card"[^>]*>/, '<div>');
    const head = `<div class="chead ${gpb ? 'fg' : 'fs'}"><span class="chsym">${gpb ? KM.SVG_HELM : KM.SVG_RUN}</span><span><span class="chn" style="display:block">Klassentools</span><span class="chs" style="display:block">${gpb ? 'Geschichte' : 'Sport'}</span></span></div>`;
    const TT = { media: 'Musik / Spotify', clock: 'Stoppuhr und Countdown', score: 'Anzeigetafel', rnd: 'Zufallsgenerator', grp: 'Gruppen bilden', teams: 'Teams einteilen', board: 'Tafel', noise: 'Lautstärke', seat: 'Testplatzzuweisung' };
    const body = (k) => k === 'media' ? UI._spHtml() : k === 'clock' ? tmBody() : k === 'score' ? UI._sbFull() : k === 'teams' ? UI._teamsHtml() : T ? strip(T[k]) : '<p class="muted">Keine Stunde im Stundenplan.</p>';
    const parts = order(kd).filter((k) => ['media', 'clock', 'score', 'teams'].includes(k) || T).map((k) => `<section class="dd tdr" data-tk="${k}"><div class="ddh" data-act="tdd" data-k="${k}" role="button" tabindex="0"><span class="ti">${TI[k] || ''}</span><b>${TT[k]}</b><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${o[k] ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg></div>${o[k] ? `<div class="ddb">${body(k)}</div>` : ''}</section>`);
    return `<div class="km2 tl2" data-tkd="${kd}">${head}<div style="padding-top:8px">${parts.join('')}</div></div>`; };
  /* Ziehen der Bereiche ohne sichtbaren Griff (nach kurzem Halten) */
  (() => { let d = null; const kd = () => (document.querySelector('.tl2') || {}).dataset && document.querySelector('.tl2').dataset.tkd;
    document.addEventListener('pointerdown', (e) => { const h = e.target.closest && e.target.closest('.dd.tdr > .ddh'); if (!h || e.target.closest('button,input,a')) return; d = { el: h.parentElement, y: e.clientY, t: setTimeout(() => { if (d) { d.on = true; d.el.classList.add('drag'); try { navigator.vibrate && navigator.vibrate(15); } catch (x) { /* */ } } }, 350), moved: false }; });
    document.addEventListener('pointermove', (e) => { if (!d) return; if (!d.on) { if (Math.abs(e.clientY - d.y) > 10) { clearTimeout(d.t); d = null; } return; } e.preventDefault(); const l = d.el.parentNode, its = [...l.children].filter((x) => x !== d.el); let before = null; for (const it of its) { const r = it.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { before = it; break; } } l.insertBefore(d.el, before); d.moved = true; }, { passive: false });
    const end = () => { if (!d) return; clearTimeout(d.t); if (d.on) { d.el.classList.remove('drag'); const k = kd(); if (k) lsSet('tl_order_' + k, JSON.stringify([...d.el.parentNode.children].map((x) => x.dataset.tk))); window.__noClick = Date.now(); } d = null; };
    document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
    document.addEventListener('click', (e) => { if (window.__noClick && Date.now() - window.__noClick < 400) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.dd.tdr')) e.preventDefault(); }); })();

  Object.assign(A, {
    tmgo: (e) => { const k = e.dataset.k, t = TM[k]; if (t.run) { t.acc += Date.now() - t.t0; t.run = false; } else { if (k === 'cd' && (t.done || tmNow('cd') <= 0)) { t.acc = 0; t.done = false; } t.t0 = Date.now(); t.run = true; } e.textContent = t.run ? 'Stopp' : 'Start'; e.classList.toggle('run', t.run); tmLoop(); },
    tmrs: (e) => { const k = e.dataset.k, t = TM[k]; t.run = false; t.acc = 0; t.done = false; const b = document.querySelector(`[data-act=tmgo][data-k=${k}]`); if (b) { b.textContent = 'Start'; b.classList.remove('run'); } const el = document.getElementById('tmd-' + k); if (el) el.textContent = tmFmt(tmNow(k)); },
    tmset: (e) => { const t = TM.cd; t.ms = +e.dataset.m * 60000; t.run = false; t.acc = 0; t.done = false; render(); },
    tmadd: (e) => { const t = TM.cd; t.ms = Math.max(10000, t.ms + (+e.dataset.m) * 60000); const el = document.getElementById('tmd-cd'); if (el) el.textContent = tmFmt(tmNow('cd')); },
    tmfs: (e) => { const el = document.getElementById('tmc-' + e.dataset.k); if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); },
  });

  UI._SPI = SPI;
  /* ---------- Einschub-Animation beim Öffnen von Seiten ---------- */
  const depth = (v) => (/^(klassen|uebersicht|mappe|leistungen|material|daten|jahresplan|erarbeiten|druck)$/.test(v) ? 0 : /^(schueler-|stunde-)/.test(v) ? 2 : 1);
  let prevView = null; const oldAfter2 = window.uiAfterRender;
  window.uiAfterRender = function () { oldAfter2 && oldAfter2(); const v = U.view || 'klassen';
    if (prevView !== null && prevView !== v) { const d0 = depth(prevView), d1 = depth(v); if (d0 !== d1) { const m = document.querySelector('body > .wrap') || document.getElementById('main'); if (m && m.animate) { try { m.animate([{ transform: `translateX(${d1 > d0 ? 70 : -70}px)`, opacity: 0.1 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(.22,.8,.3,1)' }); } catch (x) { /* */ } } } }
    prevView = v;
    if (window.__libStuck) { const h = document.querySelector('.libhd'); if (h) { const c = h.closest('.card'); if (c) window.scrollTo(0, c.getBoundingClientRect().top + window.scrollY - 2); } window.__libStuck = false; } };
  document.addEventListener('pointerdown', (e) => { const h = e.target.closest && e.target.closest('.libhd'); if (h) window.__libStuck = h.getBoundingClientRect().top <= 3; });
  document.addEventListener('keydown', (e) => { const h = e.target.closest && e.target.closest('.libhd'); if (h) window.__libStuck = h.getBoundingClientRect().top <= 3; });
  /* ---------- Schulinformation (nur Anzeige) ---------- */
  UI.schoolPage = () => { const d = S.settings.schule || {}, a = d.arzt || {}, v = (x, f) => (x ? `<dd>${esc2(x)}</dd>` : `<dd class="off">${f || 'noch nicht gefunden'}</dd>`);
    return `<div class="sch"><section class="card" style="padding:10px 14px!important"><div class="row2"><div class="logo">ORG</div><div><div style="font:700 17px var(--font-body)">BORG / ORG Guntramsdorf</div><div class="muted sm">Karl-Sonnweber-Gymnasium</div></div></div><dl><dt>Adresse</dt><dd>Friedhofstraße 36<br>2353 Guntramsdorf</dd><dt>Telefon</dt><dd><a href="tel:+43223650201">+43 (0)2236 502001</a></dd><dt>E-Mail Sekretariat</dt><dd><a href="mailto:sekretariat@org-guntramsdorf.at">sekretariat@org-guntramsdorf.at</a></dd><dt>Website</dt><dd><a href="https://www.org-guntramsdorf.at" target="_blank" rel="noopener">www.org-guntramsdorf.at</a></dd><dt>Schulkennzahl</dt>${v(d.skz)}</dl></section><section class="card" style="padding:10px 14px!important"><h2 style="padding:0 0 4px!important">Schulärztin</h2><dl style="margin-top:0"><dt>Name</dt>${v(a.name)}<dt>Sprech- und Dienstzeiten</dt>${v(a.zeiten)}<dt>Kontakt</dt>${v(a.kontakt)}</dl></section><p class="muted sm" style="padding:2px 6px">Quellen: öffentliche Schulverzeichnisse. Die Schulwebsite war aus meiner Umgebung nicht erreichbar; Schulkennzahl, Schulärztin und Logo ließen sich nicht finden und sind offen.</p></div>`; };
})();

/* ===== S11: Home-Trennlinien, Schülerprofil, Notizen, Animation ===== */
(() => {
  if (!window.UI) return;
  const st = document.createElement('style'); st.id = 'ui9'; st.textContent = `
body{overflow-x:hidden}
/* Home */
html:root body .dsec+.dsec{border-top:3px solid #b6c2d2!important;margin-top:10px!important;padding-top:2px!important}
.dayl{font-size:16px!important;padding:12px 6px 6px!important}.dayl span{font-size:13px!important}
html:root body .ccard>a.cl b .dayn,html:root body .ccard>a.cl .dayn{color:inherit!important;opacity:.95;font-weight:600}
/* Schüler (Sport) */
.s2row{grid-template-columns:auto 104px 1fr 44px!important}.s2av .kmav{width:36px;height:36px}
.s2st{text-align:right}.s2num{text-align:right!important}
/* Schülerprofil */
.km2.stu .carp{padding:0 10px;box-sizing:border-box}
.km2.stu .kmbody2 .card{padding:8px 12px!important;border-radius:12px}
.km2.stu .kmprofile{padding:10px 12px!important}
.hallrows{display:grid;gap:10px}.hallrow{display:grid;grid-template-columns:92px 1fr;gap:8px;align-items:center}.hallrow>b{font:700 13px var(--font-body)}
.fehlc .s2num{display:block;margin-top:3px}
/* Notizen */
.notes{padding:0!important}
.nhd{position:sticky;top:46px;z-index:30;background:#fff;display:flex;justify-content:space-between;gap:10px;padding:10px 12px 8px;border-bottom:1px solid #e6ebf1;border-radius:12px 12px 0 0}
.nhl{display:flex;flex-direction:column;gap:2px;min-width:0}.nhl b{font:700 14px var(--font-body)}
.nhr{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.nbub{width:48px;height:42px;border-radius:10px;border:0;background:#e2e8f0;color:#1E293B;display:grid;place-items:center;cursor:pointer}
.nhr .narch{border-radius:10px!important;padding:8px 12px!important;background:#e2e8f0;font:600 13px var(--font-body);cursor:pointer;color:#1E293B}
.nlist{padding:4px 12px 10px}
.nrow{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #eef1f5;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.nrow:last-child{border-bottom:0}
.nbar{flex:0 0 4px;border-radius:2px;background:#d99a26}.nrow.fs .nbar{background:#3b5978}
.nmeta{display:flex;gap:8px;align-items:baseline;margin-bottom:2px}.nmeta b{font:700 13px var(--font-body)}.ntag{font:600 11px var(--font-body);color:#64748b}
.ntxt{font:500 15px/1.35 var(--font-body);color:#1E293B}
`; document.head.appendChild(st);

  /* Lange drücken auf eine Notiz: archivieren / löschen */
  (() => { let t = null, pos = null;
    const open = (el) => { const k = el.dataset.nk, a = el.dataset.na === '1'; const old = document.getElementById('uisheet'); if (old) old.remove(); try { navigator.vibrate && navigator.vibrate(20); } catch (e) { /* */ } window.__noClick = Date.now();
      document.body.insertAdjacentHTML('beforeend', `<div id="uisheet"><div class="lspop" data-ui="1"><div class="lspopb" style="max-width:420px;width:min(420px,100%)"><div class="lspoph"><h2 style="margin:0">Notiz</h2><button class="btn sm" data-act="uisheetx">Abbrechen</button></div><div class="lspopc" style="padding:14px;display:grid;gap:10px"><button class="btn" style="padding:14px" data-act="noteact" data-op="${a ? 'unarch' : 'arch'}" data-k="${k.replace(/"/g, '&quot;')}">${a ? 'Wiederherstellen' : 'Archivieren'}</button><button class="btn bad" style="padding:14px" data-act="noteact" data-op="del" data-k="${k.replace(/"/g, '&quot;')}">Löschen</button></div></div></div></div>`); };
    document.addEventListener('pointerdown', (e) => { const el = e.target.closest && e.target.closest('.nrow'); if (!el) return; pos = { x: e.clientX, y: e.clientY }; clearTimeout(t); t = setTimeout(() => open(el), 520); });
    document.addEventListener('pointermove', (e) => { if (t && pos && (Math.abs(e.clientX - pos.x) > 10 || Math.abs(e.clientY - pos.y) > 10)) { clearTimeout(t); t = null; } });
    ['pointerup', 'pointercancel'].forEach((n) => document.addEventListener(n, () => { clearTimeout(t); t = null; }));
    document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.nrow')) e.preventDefault(); }); })();

  /* Kopf im Schülerprofil folgt dem gewählten Fach; Einschub-Animation für die ganze Seite */
  const prev = window.uiAfterRender;
  window.uiAfterRender = function () {
    if (/^schueler-/.test(U.view || '')) { const ch = document.querySelector('.km2.stu .chead'); if (ch) { const f = ch.classList.contains('fs') ? 'bspk' : 'gpb'; document.body.dataset.fach = f; try { const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = f === 'gpb' ? '#d99a26' : '#3b5978'; } catch (e) { /* */ } } }
    prev && prev();
  };
})();

(() => { const st = document.createElement('style'); st.id = 'ui10'; st.textContent = `
html:root body[data-fach] .km2.stu .ttmenu{background:var(--fc)!important;margin:0 -8px 8px!important;padding:0 8px!important;box-shadow:0 0 0 100vmax var(--fc)!important;clip-path:inset(0 -100vmax)!important;border:0!important}
html:root body[data-fach] .km2.stu .ttmenu .ttchip{color:#fff!important;opacity:.75;text-shadow:0 1px 2px rgba(0,0,0,.35)}html:root body[data-fach] .km2.stu .ttmenu .ttchip.on{opacity:1}html:root body[data-fach] .km2.stu .ttmenu .ttchip.on::after{background:#fff!important}
.km2.stu .kmprofile{margin:8px 0!important}
`; document.head.appendChild(st); })();
