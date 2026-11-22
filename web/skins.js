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
