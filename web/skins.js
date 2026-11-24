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
    build(); const v = U.view || 'klassen', b = document.getElementById('tback'); document.body.dataset.v = v; try { const m = document.querySelector('meta[name=theme-color]'), f = document.body.dataset.fach; if (m) m.content = f === 'gpb' ? '#F5C518' : f === 'bspk' ? '#216FB9' : '#2f3640'; } catch (e) { /* */ } if (b) b.hidden = TOP.has(v) || v === 'uebersicht' && false;
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
html:root .hero{background:#2f3640!important;box-shadow:0 0 0 100vmax #2f3640!important;color:#fff!important}
.tb .tdate b,.tb .tdate span,.tb button{color:#fff!important}.tb button:hover{background:rgba(255,255,255,.12)!important}
html:root body[data-fach] .hero{margin-bottom:0!important}
html:root body[data-fach=gpb] .hero{background:#F5C518!important;box-shadow:0 0 0 100vmax #F5C518!important}html:root body[data-fach=bspk] .hero{background:#216FB9!important;box-shadow:0 0 0 100vmax #216FB9!important}
body[data-fach=gpb] .tb .tdate b,body[data-fach=gpb] .tb .tdate span,body[data-fach=gpb] .tb button{color:#1c1c1c!important}
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
.ccard[data-k=gpb]{--fc:#F5C518;--fon:#1c1c1c}.ccard[data-k=bspk]{--fc:#216FB9;--fon:#fff}
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
  function sbHtml() { const b = SB(), r = rule(), ord = b.flip ? [1, 0] : [0, 1], sets = r.wins > 0;
    const team = (i) => `<div class="sbteam" style="background:${b.c[i]}">${r.serve && b.srv === i ? '<span class="sbball" title="Aufschlag">🏐</span>' : ''}<div class="sbname">${esc2(tn(i))}</div><div class="sbpts" data-sbp="${i}">${b.p[i]}</div>${sets ? `<div class="sbsets" data-sbs="${i}"><small>Sätze</small>${b.s[i]}</div>` : '<div></div>'}</div>`;
    return `<div id="sbbox" class="sbbox${b.full ? ' sbfull' + (b.rot ? ' rot' : '') : ''}"><div class="sbtop"><b>${esc2(r.n)}</b><span><button data-act="sbflip" title="Seiten wechseln">⇄ Seitenwechsel</button> <button data-act="sbfull">${b.full ? '✕ Schließen' : '⛶ Quer/Vollbild'}</button> <button data-act="sbreset">↺ Zurücksetzen</button></span></div><div class="sbrow">${team(ord[0])}<div class="sbmid"><button data-act="sbflip" aria-label="Seiten wechseln">⇄</button></div>${team(ord[1])}</div>${b.win >= 0 ? `<div class="sbwin">🏆 ${esc2(tn(b.win))} gewinnt${b.hist.length ? ' (' + b.hist.join(', ') + ')' : ''}</div>` : (b.hist.length ? `<div class="sbhist">Sätze: ${b.hist.join('  ·  ')}</div>` : '')}<div class="sbhist" style="opacity:.6">Tippen = +1 · nach unten wischen = −1</div></div>`; }
  (() => { let t = null;
    document.addEventListener('pointerdown', (e) => { const el = e.target.closest && e.target.closest('[data-sbp],[data-sbs]'); if (!el) { t = null; return; } t = { el, x: e.clientX, y: e.clientY }; });
    document.addEventListener('pointerup', (e) => { if (!t) return; const { el } = t, dy = e.clientY - t.y, dx = e.clientX - t.x; t = null; const pts = el.dataset.sbp !== undefined, i = +(pts ? el.dataset.sbp : el.dataset.sbs); const f = pts ? sbPoint : sbSet; if (dy > 28 && Math.abs(dx) < 40) f(i, -1); else if (Math.abs(dy) < 16 && Math.abs(dx) < 16) f(i, 1); });
    document.addEventListener('contextmenu', (e) => { const el = e.target.closest && e.target.closest('[data-sbp],[data-sbs]'); if (el) { e.preventDefault(); const pts = el.dataset.sbp !== undefined; (pts ? sbPoint : sbSet)(+(pts ? el.dataset.sbp : el.dataset.sbs), -1); } });
  })();
  const dd = (k, title, body, open) => `<section class="dd"><button class="ddh" data-act="tdd" data-k="${k}" aria-expanded="${open}"><b>${title}</b><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg></button>${open ? `<div class="ddb">${body}</div>` : ''}</section>`;
  function teamsHtml() { const b = SB(), gs = (typeof groups === 'function' ? groups() : []).filter((G) => !G.sprech && subjKind(G.subject) === 'bspk'), cls = b.cls && gs.some((G) => G.slug === b.cls) ? b.cls : (gs[0] || {}).slug || '', sts = cls && KM.studentsOf ? KM.studentsOf(cls) : [];
    return `<div class="sbcfg"><label>Klasse<select data-ch="sbcls">${gs.map((G) => `<option value="${esc2(G.slug)}"${G.slug === cls ? ' selected' : ''}>${esc2(LB(G))}</option>`).join('')}</select></label><div class="tmgrid">${sts.map((x) => `<button class="tmst" data-act="tmpick" data-id="${esc2(x.id)}">${esc2(x.vn)} ${esc2(x.nn)}${b.assign[x.id] ? `<b style="background:${COLS[(b.assign[x.id] - 1) % 8]}">${b.assign[x.id]}</b>` : ''}</button>`).join('') || '<span class="muted sm">Keine Schüler.</span>'}</div>${[1, 2, 3, 4, 5, 6, 7, 8].filter((n) => sts.some((x) => b.assign[x.id] === n)).map((n) => `<div class="sm"><b>${n <= 2 ? esc2(tn(n - 1)) : 'Team ' + n}:</b> ${sts.filter((x) => b.assign[x.id] === n).map((x) => esc2(x.vn)).join(', ')}</div>`).join('')}</div>`; }
  function cfgHtml() { const b = SB(); return `<div class="sbcfg"><label>Sportart / Regeln<select data-ch="sbsport">${Object.entries(SPORT_SB).map(([k, v]) => `<option value="${k}"${k === b.sport ? ' selected' : ''}>${esc2(v[0])}</option>`).join('')}</select></label>${[0, 1].map((i) => `<label>Team ${i + 1}<input data-ch="sbname" data-i="${i}" value="${esc2(b.n[i])}" placeholder="Team ${i + 1}"></label><div class="sbsw">${COLS.map((c) => `<i style="background:${c}" class="${b.c[i] === c ? 'on' : ''}" data-act="sbcol" data-i="${i}" data-c="${c}"></i>`).join('')}</div>`).join('')}</div>`; }
  /* Spotify (PKCE, nur mit eigener Client-ID) */
  const SP = { tok: null, now: null, timer: null };
  const lsGet = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* */ } };
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const redirect = () => location.origin + '/';
  async function spToken(body) { const r = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body) }); if (!r.ok) throw new Error('Spotify-Anmeldung fehlgeschlagen'); const j = await r.json(); SP.tok = j.access_token; lsSet('sp_at', j.access_token); lsSet('sp_exp', String(Date.now() + (j.expires_in - 60) * 1000)); if (j.refresh_token) lsSet('sp_rt', j.refresh_token); }
  async function spAuthOk() { const cid = lsGet('sp_cid'); if (!cid) return false; if (+lsGet('sp_exp') > Date.now() && lsGet('sp_at')) { SP.tok = lsGet('sp_at'); return true; } const rt = lsGet('sp_rt'); if (!rt) return false; try { await spToken({ grant_type: 'refresh_token', refresh_token: rt, client_id: cid }); return true; } catch (e) { return false; } }
  async function spApi(path, method, q) { if (!(await spAuthOk())) throw new Error('nicht verbunden'); const r = await fetch('https://api.spotify.com/v1' + path + (q ? '?' + new URLSearchParams(q) : ''), { method: method || 'GET', headers: { authorization: 'Bearer ' + SP.tok } }); if (r.status === 204) return null; if (r.status === 401) { lsSet('sp_exp', '0'); throw new Error('Anmeldung abgelaufen'); } if (!r.ok) { const t = await r.text(); throw new Error(r.status === 404 ? 'Kein aktives Gerät: Spotify am Handy öffnen und etwas abspielen.' : r.status === 403 ? 'Spotify Premium erforderlich.' : 'Spotify-Fehler ' + r.status + ' ' + t.slice(0, 60)); } try { return await r.json(); } catch (e) { return null; } }
  async function spPoll() { const box = document.getElementById('spnow'); if (!box) { clearInterval(SP.timer); SP.timer = null; return; } try { const j = await spApi('/me/player'); SP.now = j; SP.err = ''; } catch (e) { SP.err = e.message; } if (document.getElementById('spnow')) document.getElementById('spnow').outerHTML = spNowHtml(); }
  function spNowHtml() { const j = SP.now, it = j && j.item; if (!lsGet('sp_cid')) return '<div id="spnow"></div>'; if (SP.err) return `<div id="spnow" class="muted sm">${esc2(SP.err)}</div>`; if (!it) return '<div id="spnow" class="muted sm">Nichts wird abgespielt. Starte in der Spotify-App eine Playlist.</div>'; const img = (it.album && it.album.images && it.album.images[0] || {}).url || '';
    return `<div id="spnow"><div class="spbox">${img ? `<img class="spcov" src="${esc2(img)}" alt="Cover">` : '<div class="spcov"></div>'}<div style="min-width:0"><div class="spt">${esc2(it.name)}</div><div class="sps">${esc2((it.artists || []).map((a) => a.name).join(', '))}</div><div class="sps">${esc2((j.device || {}).name || '')}</div></div></div><div class="spctl"><button data-act="spprev" aria-label="Zurück">⏮</button><button class="big" data-act="sptog" aria-label="Start/Pause">${j.is_playing ? '⏸' : '▶'}</button><button data-act="spnext" aria-label="Weiter">⏭</button><input type="range" min="0" max="100" value="${(j.device || {}).volume_percent == null ? 50 : j.device.volume_percent}" data-ch="spvol" aria-label="Lautstärke" style="flex:1"></div></div>`; }
  function spHtml() { const cid = lsGet('sp_cid'); setTimeout(() => { if (cid && !SP.timer) { SP.timer = setInterval(spPoll, 4000); } if (cid) spPoll(); }, 50);
    return `<p class="muted sm" style="margin:0 0 8px">Steuert die laufende Spotify-Wiedergabe (Playlist weiterschalten, Pause, Lautstärke, Cover). Braucht Spotify Premium und eine eigene Client-ID (kostenlos auf developer.spotify.com, Redirect-URI: <b>${esc2(redirect())}</b>).</p>${cid && lsGet('sp_rt') ? spNowHtml() : `<div class="sbcfg"><label>Client-ID<input id="spcid" value="${esc2(cid)}" placeholder="Client-ID einfügen" autocomplete="off"></label><button class="btn good" data-act="spconn">Mit Spotify verbinden</button></div>`}${cid && lsGet('sp_rt') ? '<button class="btn sm" data-act="spoff" style="margin-top:10px">Verbindung trennen</button>' : ''}`; }
  (async () => { try { const q = new URLSearchParams(location.search); if (q.get('code') && q.get('state') === 'lehrerapp-sp') { await spToken({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: redirect(), client_id: lsGet('sp_cid'), code_verifier: lsGet('sp_ver') }); history.replaceState(null, '', location.pathname + '#werkzeug-bspk'); U.view = 'werkzeug-bspk'; U.tdd = Object.assign({}, U.tdd, { media: true }); if (typeof render === 'function') render(); } } catch (e) { /* */ } })();

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
    sbfull: () => { const b = SB(); b.full = !b.full; b.rot = false; sbDraw(); const el = document.getElementById('sbbox'); if (b.full) { try { const p = el.requestFullscreen && el.requestFullscreen(); if (p && p.then) p.then(() => { try { return screen.orientation.lock('landscape'); } catch (x) { return null; } }).catch(() => { if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } }); else if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } } catch (x) { if (innerHeight > innerWidth) { b.rot = true; sbDraw(); } } } else { try { if (document.fullscreenElement) document.exitFullscreen(); screen.orientation.unlock(); } catch (x) { /* */ } } },
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
.dd.fg .ddh{background:#F5C518!important;color:#fff!important;text-shadow:0 1px 2px rgba(0,0,0,.3)}
.dd.fs .ddh{background:#216FB9!important;color:#fff!important}
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
