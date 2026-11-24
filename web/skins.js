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
html:root{--bg:#ececec;--hd-bg:#1a1a1a;--hd-fg:#ffffff;--surface:#ffffff;--surface2:#f3f3f3;--ink:#1a1a1a;--muted:#6b6b6b;--line:#e4e4e4;--accent:#1a1a1a;--accent-ink:#ffffff;--accent-soft:#e9e9e9;--r:16px;--tab-h:46px}
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
.ttiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ttile{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 10px;border-radius:16px;border:0;font:700 16px var(--font-body);cursor:pointer}.ttile.g{background:#F5C518;color:#1c1c1c}.ttile.s{background:#216FB9;color:#fff}

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
body[data-fach=gpb]{--fc:#F5C518;--fon:#1c1c1c}body[data-fach=bspk]{--fc:#216FB9;--fon:#ffffff}
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
    build(); const v = U.view || 'klassen', b = document.getElementById('tback'); document.body.dataset.v = v; if (b) b.hidden = TOP.has(v) || v === 'uebersicht' && false;
    const bar = (U.toolsPop ? toolsSheet() : '') + (U.srchPop ? srchSheet() : ''); const old = document.getElementById('uisheet'); if (old) old.remove();
    if (bar) document.body.insertAdjacentHTML('beforeend', `<div id="uisheet">${bar}</div>`);
    document.querySelectorAll('.ttmenu').forEach((m) => { const on = m.querySelector('.ttchip.on'); if (on && m.scrollWidth > m.clientWidth) m.scrollLeft = Math.max(0, on.parentElement.offsetLeft - 24); });
    const s = document.getElementById('srq'); if (s && !s.dataset.f) { s.dataset.f = '1'; s.focus(); }
  };
  const sheet = (title, inner) => `<div class="lspop" data-ui="1"><div class="lspopb" role="dialog" aria-label="${title}" style="max-width:640px;width:min(640px,100%)"><div class="lspoph"><h2 style="margin:0">${title}</h2><button class="btn sm" data-act="uisheetx">Schließen</button></div><div class="lspopc" style="padding:14px">${inner}</div></div></div>`;
  function toolsSheet() {
    const p = U.toolsPop; if (p === true) return sheet('Klassentools', `<div class="ttiles"><button class="ttile g" data-act="toolsopen" data-kd="gpb">${IC.book}Geschichte</button><button class="ttile s" data-act="toolsopen" data-kd="bspk">${IC.run}Sport</button></div>`);
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
  (() => { let t0 = null;
    document.addEventListener('touchstart', (e) => { const p = e.target.closest && e.target.closest('.uipane'); if (!p || e.target.closest('input,textarea,select,.kmtable,.wk,.nspl,[data-noswipe]') || e.touches.length !== 1) { t0 = null; return; } t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY, p }; }, { passive: true });
    document.addEventListener('touchend', (e) => { if (!t0) return; const c = e.changedTouches[0], dx = c.clientX - t0.x, dy = c.clientY - t0.y, p = t0.p; t0 = null; if (Math.abs(dx) < 70 || Math.abs(dy) > 45 || Math.abs(dx) < Math.abs(dy) * 2) return;
      const ks = p.dataset.tabs.split(','), i = ks.indexOf(p.dataset.cur), n = ks[i + (dx < 0 ? 1 : -1)]; if (n && A[p.dataset.act2]) A[p.dataset.act2]({ dataset: { p: n } }); }, { passive: true });
  })();
  /* Home: Heute · Anwesenheit · Stundenplan · Stundeninhalte */
  const HT = [['t', 'Heute'], ['a', 'Anwesenheit'], ['p', 'Stundenplan'], ['i', 'Stundeninhalte']];
  window.homeShell = (dayBody, planPane, nxO, lessonStatus) => {
    const cur = HT.some((x) => x[0] === U.hp) ? U.hp : 't'; let inner = '';
    if (cur === 't') inner = dayBody; else if (cur === 'p') inner = planPane;
    else if (cur === 'a') {
      const h = U.hcur, G = h && groups().find((g) => g.slug === h.slug);
      if (!G || !nxO) inner = '<div class="card"><p class="muted">Keine laufende oder nächste Stunde.</p></div>';
      else { const key = G.slug + '|' + h.date, sv = U.attOpen; U.attOpen = key; const ls = lessonStatus(G, nxO, false); U.attOpen = sv; const x = ls.ics, panel = x.slice(x.indexOf('</div>') + 6).replace(/<div class="attp inhp">[\s\S]*$/, '');
        inner = `<div class="card"><div class="muted sm" style="margin-bottom:8px">${esc(LB(G))} · ${esc(G.subject)} · ${esc(dshort(h.date))}${h.von ? ' · ' + esc(h.von) + '–' + esc(h.bis || '') : ''}</div>${panel || '<p class="muted">Noch keine Schüler in dieser Klasse.</p>'}</div>`; }
    } else {
      const h = U.hcur, G = h && groups().find((g) => g.slug === h.slug);
      if (!G) inner = '<div class="card"><p class="muted">Keine Klasse gewählt.</p></div>';
      else { const lg = (cinfo(G.slug).log || []).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
        inner = `<div class="card"><div class="muted sm" style="margin-bottom:6px">${esc(LB(G))} · ${esc(G.subject)} – alle Stunden</div>${lg.length ? lg.map((x) => `<button class="srow" data-act="go" data-v="stunde-${esc(G.slug)}--${esc(x.id)}"><span><b>${esc(dshort(x.date))}</b>&nbsp; ${esc(x.text || '–')}</span><small>${x.date > TODAY ? 'geplant' : ''}</small></button>`).join('') : '<p class="muted">Noch keine Stunden eingetragen.</p>'}</div>`; }
    }
    return UI.tabs(HT, cur, 'homepane') + UI.pane(HT, cur, 'homepane', inner);
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
