"""
Generates index.html – TMS Positioneringssurvey + Supabase.
Run once:  python build_survey.py
"""
import base64, pathlib, textwrap

# ── tiny SVG logos (dark & white versions of "TMS") ────────
# Replace these with your real PNG by changing LOGO_DARK / LOGO_WHITE
# to  data:image/png;base64,<your_base64>  and deleting these helpers.

def _svg_logo(fill: str) -> str:
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 46">'
        f'<rect width="32" height="46" rx="3" fill="{fill}"/>'
        f'<rect x="0" y="0" width="32" height="10" rx="3" fill="{fill}"/>'
        f'<rect x="11" y="0" width="10" height="46" rx="0" fill="{fill}"/>'
        f'<rect x="40" y="0" width="10" height="46" rx="0" fill="{fill}"/>'
        f'<rect x="40" y="0" width="46" height="10" rx="0" fill="{fill}"/>'
        f'<polygon points="40,0 50,0 74,23 98,0 108,0 108,46 98,46 98,18 74,40 50,18 50,46 40,46" fill="{fill}"/>'
        f'<rect x="118" y="0" width="50" height="10" rx="0" fill="{fill}"/>'
        f'<rect x="118" y="0" width="10" height="28" rx="0" fill="{fill}"/>'
        f'<rect x="118" y="18" width="50" height="10" rx="0" fill="{fill}"/>'
        f'<rect x="158" y="18" width="10" height="28" rx="0" fill="{fill}"/>'
        f'<rect x="118" y="36" width="50" height="10" rx="0" fill="{fill}"/>'
        '</svg>'
    )
    enc = base64.b64encode(svg.encode()).decode()
    return f"data:image/svg+xml;base64,{enc}"

LOGO_DARK  = _svg_logo("#092147")   # for light backgrounds
LOGO_WHITE = _svg_logo("#FFFFFF")   # for dark hero screens

HTML = f"""<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#092147">
<title>TMS · Positioneringssurvey</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;800&display=swap" rel="stylesheet">
<!-- Supabase JS (UMD – creates window.supabase) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<style>
:root{{
  --navy:#092147; --navycard:#0E2A55; --red:#CD0039; --teal:#39B2AD;
  --sage:#B1CF99; --lime:#D8F9C2; --off:#F5F0EC; --lightblue:#D9E1EC;
  --grey:#667780; --ink:#1A1A1A; --white:#FFFFFF; --line:#E6DDD4;
  --accent:var(--red); --accent-soft:rgba(205,0,57,.08);
}}
*{{box-sizing:border-box;-webkit-tap-highlight-color:transparent}}
html,body{{height:100%;margin:0}}
body{{
  font-family:'Sora',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  color:var(--navy); background:var(--off);
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
}}
button{{font-family:inherit}}
.app{{position:relative; height:100dvh; display:flex; flex-direction:column; overflow:hidden}}
.topbar{{height:60px; flex:none; display:flex; align-items:center; gap:14px;
  padding:0 clamp(16px,5vw,40px); z-index:5}}
.back{{width:38px;height:38px;border:none;background:transparent;border-radius:10px;
  display:grid;place-items:center;cursor:pointer;color:var(--grey);transition:background .15s,color .15s}}
.back:hover{{background:rgba(9,33,71,.06);color:var(--navy)}}
.back svg{{width:20px;height:20px}}
.back[disabled]{{opacity:0;pointer-events:none}}
.prog{{flex:1;height:4px;border-radius:99px;background:rgba(9,33,71,.12);overflow:hidden}}
.prog-fill{{height:100%;width:0;border-radius:99px;
  background:linear-gradient(90deg,var(--red),var(--teal));transition:width .45s cubic-bezier(.4,0,.2,1)}}
.brand-mono{{height:24px;width:auto;flex:none}}
.hero .back:hover{{background:rgba(255,255,255,.1);color:#fff}}
.hero .back{{color:rgba(255,255,255,.6)}}
.hero .prog{{background:rgba(255,255,255,.16)}}
.screen{{flex:1; overflow-y:auto; overflow-x:hidden; position:relative; z-index:2;
  display:flex; flex-direction:column; justify-content:center;
  padding:18px clamp(18px,6vw,40px) 8px}}
.wrap{{width:100%; max-width:640px; margin:0 auto}}
.reveal{{animation:rise .42s cubic-bezier(.16,.84,.44,1) both}}
@keyframes rise{{from{{opacity:0;transform:translateY(14px)}}to{{opacity:1;transform:none}}}}
.eyebrow{{font-weight:600;font-size:.74rem;letter-spacing:.13em;text-transform:uppercase;
  color:var(--accent);margin:0 0 14px;display:flex;align-items:center;gap:8px}}
.eyebrow .qn{{background:var(--accent);color:#fff;border-radius:6px;padding:2px 7px;font-size:.7rem;letter-spacing:.04em}}
.q{{font-weight:800;font-size:clamp(1.45rem,5.4vw,2.25rem);line-height:1.14;
  letter-spacing:-.01em;color:var(--navy);margin:0 0 12px}}
.help{{font-size:clamp(.95rem,3.6vw,1.05rem);line-height:1.5;color:var(--grey);margin:0 0 22px;max-width:34em}}
em.k{{font-style:normal;color:var(--red)}}
.opts{{display:flex;flex-direction:column;gap:10px;margin:0}}
.opt{{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;
  background:var(--white);border:1.5px solid var(--line);border-radius:14px;
  padding:15px 16px 15px 18px;font-size:clamp(.97rem,3.7vw,1.06rem);font-weight:500;color:var(--navy);
  cursor:pointer;transition:border-color .15s,background .15s,transform .08s;line-height:1.35}}
.opt:hover{{border-color:var(--accent)}}
.opt:active{{transform:scale(.992)}}
.opt .tick{{flex:none;width:24px;height:24px;border-radius:7px;border:1.6px solid var(--line);
  display:grid;place-items:center;transition:.15s}}
.opt .tick svg{{width:14px;height:14px;opacity:0;transform:scale(.6);transition:.15s;color:#fff}}
.opt.sel{{border-color:var(--accent);background:var(--accent-soft)}}
.opt.sel::before{{content:"";position:absolute;left:0;top:11px;bottom:11px;width:5px;border-radius:0 4px 4px 0;background:var(--accent)}}
.opt.sel .tick{{background:var(--accent);border-color:var(--accent)}}
.opt.sel .tick svg{{opacity:1;transform:none}}
.opt.disabled{{opacity:.5;pointer-events:none}}
.opt .ot{{flex:1}}
.opt .rank-badge{{flex:none;width:26px;height:26px;border-radius:50%;border:1.6px solid var(--line);
  display:grid;place-items:center;font-weight:700;font-size:.85rem;color:var(--grey)}}
.opt.sel .rank-badge{{background:var(--accent);border-color:var(--accent);color:#fff}}
.alloc{{display:flex;flex-direction:column;gap:16px;margin-bottom:8px}}
.arow{{background:var(--white);border:1.5px solid var(--line);border-radius:14px;padding:14px 16px}}
.arow .top{{display:flex;align-items:center;gap:10px;margin-bottom:10px}}
.dot{{width:12px;height:12px;border-radius:50%;flex:none}}
.arow .name{{font-weight:600;font-size:.98rem;flex:1}}
.stepper{{display:flex;align-items:center;gap:10px}}
.sbtn{{width:40px;height:40px;border-radius:11px;border:1.5px solid var(--line);background:var(--white);
  font-size:1.3rem;font-weight:600;color:var(--navy);cursor:pointer;display:grid;place-items:center;transition:.12s}}
.sbtn:hover{{border-color:var(--navy)}}
.sbtn:active{{transform:scale(.94)}}
.ninput{{width:62px;text-align:center;font-family:inherit;font-weight:800;font-size:1.3rem;color:var(--navy);
  border:none;background:transparent;outline:none;-moz-appearance:textfield}}
.ninput::-webkit-outer-spin-button,.ninput::-webkit-inner-spin-button{{-webkit-appearance:none;margin:0}}
.abar{{height:6px;border-radius:99px;background:rgba(9,33,71,.08);margin-top:12px;overflow:hidden}}
.abar > i{{display:block;height:100%;width:0;border-radius:99px;transition:width .25s}}
.total{{margin-top:6px;display:flex;align-items:center;justify-content:center;gap:8px;
  font-weight:600;font-size:.95rem;color:var(--grey)}}
.total .badge{{font-weight:800;font-size:1.05rem;padding:3px 12px;border-radius:99px;
  background:rgba(9,33,71,.07);color:var(--navy);transition:.2s}}
.total.ok .badge{{background:rgba(57,178,173,.16);color:#1F7A75}}
.total.over .badge{{background:rgba(205,0,57,.12);color:var(--red)}}
.scale{{display:flex;gap:7px;justify-content:space-between;max-width:430px;margin:2px 0 14px}}
.sc{{flex:1;aspect-ratio:1/1;min-width:0;border:1.5px solid var(--line);border-radius:12px;background:var(--white);
  font-weight:700;font-size:clamp(.95rem,4vw,1.1rem);color:var(--navy);cursor:pointer;transition:.13s}}
.sc:hover{{border-color:var(--accent)}}
.sc.sel{{background:var(--accent);border-color:var(--accent);color:#fff;transform:translateY(-2px)}}
.ends{{display:flex;justify-content:space-between;max-width:430px;font-size:.8rem;color:var(--grey);margin-bottom:4px}}
textarea{{width:100%;min-height:120px;resize:vertical;font-family:inherit;font-size:1.05rem;line-height:1.5;
  color:var(--navy);background:var(--white);border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;outline:none;transition:border-color .15s}}
textarea::placeholder{{color:#aeb7bd}}
textarea:focus{{border-color:var(--navy)}}
.tinput{{width:100%;font-family:inherit;font-size:1.05rem;color:var(--navy);background:var(--white);
  border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;outline:none;transition:border-color .15s}}
.tinput:focus{{border-color:var(--navy)}}
.footer{{flex:none;display:flex;align-items:center;gap:14px;z-index:5;
  padding:14px clamp(18px,6vw,40px) calc(16px + env(safe-area-inset-bottom))}}
.btn{{border:none;border-radius:13px;padding:14px 26px;font-weight:600;font-size:1.02rem;cursor:pointer;
  display:inline-flex;align-items:center;gap:9px;transition:transform .08s,opacity .15s,background .15s}}
.btn svg{{width:17px;height:17px}}
.btn:active{{transform:scale(.97)}}
.btn-primary{{background:var(--accent);color:#fff}}
.btn-primary[disabled]{{opacity:.35;pointer-events:none}}
.btn-ghost{{background:transparent;color:var(--grey);padding:14px 8px}}
.btn-ghost:hover{{color:var(--navy)}}
.btn-light{{background:var(--white);color:var(--navy);border:1.5px solid var(--line)}}
.btn-on-dark{{background:var(--white);color:var(--navy)}}
.keyhint{{font-size:.78rem;color:var(--grey);display:flex;align-items:center;gap:6px}}
.keyhint b{{background:rgba(9,33,71,.07);border-radius:5px;padding:2px 7px;font-weight:600;color:var(--navy)}}
.hero .keyhint{{color:rgba(255,255,255,.55)}} .hero .keyhint b{{background:rgba(255,255,255,.12);color:#fff}}
.app.hero{{background:var(--navy);color:#fff}}
.hero .q{{color:#fff}}
.hero .help{{color:var(--lightblue)}}
.hero-mono{{height:38px;margin-bottom:26px}}
.disc-list{{display:flex;flex-direction:column;gap:9px;margin:20px 0 26px}}
.disc{{display:flex;gap:11px;align-items:flex-start;font-size:.92rem;line-height:1.4;color:var(--lightblue)}}
.disc b{{color:#fff;font-weight:600}}
.disc .dot{{margin-top:5px}}
.modes{{display:flex;gap:10px;margin:6px 0 4px;flex-wrap:wrap}}
.mode{{flex:1;min-width:150px;text-align:left;background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.16);
  border-radius:14px;padding:14px 16px;cursor:pointer;color:#fff;transition:.15s}}
.mode:hover{{border-color:rgba(255,255,255,.4)}}
.mode.sel{{border-color:var(--teal);background:rgba(57,178,173,.12)}}
.mode .mt{{font-weight:600;font-size:1rem;margin-bottom:3px;display:flex;align-items:center;gap:8px}}
.mode .md{{font-size:.82rem;color:var(--lightblue)}}
.mode .mtick{{width:18px;height:18px;border-radius:50%;border:1.6px solid rgba(255,255,255,.4);display:inline-grid;place-items:center}}
.mode.sel .mtick{{background:var(--teal);border-color:var(--teal)}}
.mode .mtick svg{{width:11px;height:11px;color:#fff;opacity:0}}.mode.sel .mtick svg{{opacity:1}}
.foot-note{{font-size:.82rem;color:var(--grey);margin-top:14px;line-height:1.4}}
.hero .foot-note{{color:rgba(255,255,255,.45)}}
.shape{{position:absolute;right:-14vmin;bottom:-14vmin;width:48vmin;height:48vmin;
  border-top-left-radius:100%;background:var(--accent);opacity:.06;z-index:0;pointer-events:none;transition:background .4s}}
.app.hero .shape{{opacity:.10;background:var(--teal)}}
@media (max-width:560px){{
  .screen{{justify-content:flex-start;padding-top:10px}}
}}
@media (prefers-reduced-motion:reduce){{
  *{{animation:none!important;transition:none!important}}
}}
:focus-visible{{outline:3px solid var(--teal);outline-offset:2px;border-radius:8px}}
</style>
</head>
<body>
<div class="app" id="app">
  <div class="shape" id="shape" aria-hidden="true"></div>
  <header class="topbar" id="topbar" style="visibility:hidden">
    <button class="back" id="back" aria-label="Vorige"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
    <div class="prog"><div class="prog-fill" id="progfill"></div></div>
    <img class="brand-mono" id="topmono" alt="TMS">
  </header>
  <main class="screen" id="screen" tabindex="-1"></main>
  <footer class="footer" id="footer"></footer>
</div>

<script>
// ═══════════════════════════════════════════════════════════
//  SUPABASE CONFIG  –  replace these two values
// ═══════════════════════════════════════════════════════════
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // public anon key from project settings

const _sb = (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && typeof window.supabase !== 'undefined')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ═══════════════════════════════════════════════════════════
//  ICONS & LOGO IMAGES
// ═══════════════════════════════════════════════════════════
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const MONO_R = '{LOGO_DARK}';   // dark logo for light backgrounds
const MONO_W = '{LOGO_WHITE}';  // white logo for dark hero screens

// ═══════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════
const DISC = {{
  oe:{{label:'Operationele excellentie', dot:'#092147', desc:'Betrouwbaar, vlot, scherp geprijsd. Maximaal gemak en voorspelbaarheid.'}},
  pl:{{label:'Productleiderschap',       dot:'#39B2AD', desc:'De beste, meest geavanceerde oplossing. Voorop in vakmanschap.'}},
  ki:{{label:'Klantintimiteit',          dot:'#CD0039', desc:'De klant en zijn installatie door en door kennen. Maatwerk, partnerschap.'}},
}};
const PART = {{
  A:{{name:'Deel A · Vandaag vs. ambitie', color:'#CD0039'}},
  B:{{name:'Deel B · Hoe we winnen en kiezen', color:'#39B2AD'}},
  C:{{name:'Deel C · In je eigen woorden', color:'#092147'}},
  D:{{name:'Deel D · Afstemming', color:'#8FAE73'}},
}};

const QS = [
  {{id:'A1', part:'A', core:true, type:'alloc',
   q:'Hoe concurreert en wint TMS <em class="k">vandaag</em> écht?',
   help:'Verdeel 100 punten over de drie disciplines.'}},
  {{id:'A2', part:'A', core:true, type:'alloc',
   q:'Hoe zou TMS over <em class="k">3 jaar</em> moeten concurreren?',
   help:'Verdeel opnieuw 100 punten — waar willen we in leiden?'}},
  {{id:'A3', part:'A', core:true, type:'single',
   q:'Eén discipline kan dominant zijn. Welke moet dat voor TMS zijn?',
   opts:[['oe',DISC.oe.label],['pl',DISC.pl.label],['ki',DISC.ki.label]]}},
  {{id:'A4', part:'A', core:true, type:'single',
   q:'Op welke discipline aanvaarden we bewust "enkel marktstandaard"?',
   help:'Goed genoeg, geen koploper.',
   opts:[['oe',DISC.oe.label],['pl',DISC.pl.label],['ki',DISC.ki.label]]}},

  {{id:'B1', part:'B', core:false, type:'multi2',
   q:'"Een klant kiest voor TMS vooral omdat…"',
   help:'Kies je top 2.',
   opts:[
     ['a','we betrouwbaar, veilig en vlot leveren tegen een scherpe prijs'],
     ['b','we hun installatie en proces beter kennen dan wie ook'],
     ['c','we technisch het meest geavanceerd zijn / het complexe aankunnen'],
     ['d','we snel mensen beschikbaar hebben']]}},
  {{id:'B2', part:'B', core:true, type:'single',
   q:'Detachering / "outsourcing" sturen we het best op:',
   opts:[
     ['a','bezettingsgraad, fill rate, kost-per-uur'],
     ['b','diepte en duur van de klantrelatie, herhaalopdrachten, kennisopbouw bij de klant'],
     ['c','de moeilijkheidsgraad en specialisatie van de geplaatste profielen']]}},
  {{id:'B3', part:'B', core:true, type:'single',
   q:'De grootste groei de komende 2 jaar komt vooral uit:',
   opts:[
     ['a','nieuwe klanten in nieuwe markten'],
     ['b','uitbreiding en consolidatie bij bestaande klanten'],
     ['c','nieuwe klanten via een scherp geprijsd, schaalbaar standaardaanbod']]}},
  {{id:'B4', part:'B', core:false, type:'single',
   q:'Een trouwe klant vraagt een complexe klus tegen dunne marge om de relatie te onderhouden. We…',
   opts:[
     ['a','houden onze prijs/marge aan, ook als we de klus mislopen'],
     ['b','nemen het als investering in de relatie'],
     ['c','nemen het enkel als het technisch uitdagend of referentiewaardig is']]}},
  {{id:'B5', part:'B', core:false, type:'rank',
   q:'Waarin moet TMS de komende jaren het meest investeren?',
   help:'Tik in volgorde van belang — 1 is het belangrijkst.',
   items:[
     ['p','Processen, efficiëntie, prijs- en kostenstructuur'],
     ['k','Kennisopbouw over klanten, accountteams, relatiemanagement, managed services'],
     ['r','Technische R&D, nieuwe methodes, specialisatie']]}},

  {{id:'C1', part:'C', core:true, type:'text',
   q:'In één zin: waarom kiest een klant voor TMS en niet voor een concurrent?',
   ph:'Typ je antwoord…'}},
  {{id:'C2', part:'C', core:true, type:'text',
   q:'Wat zou TMS bewust <em class="k">níét</em> (meer) moeten doen?',
   ph:'Typ je antwoord…'}},
  {{id:'C3', part:'C', core:false, type:'text',
   q:'Welke (soort) concurrent vrees je het meest, en waarom?',
   ph:'Typ je antwoord…'}},
  {{id:'C4', part:'C', core:false, type:'text',
   q:'Als TMS over 3 jaar om één ding bekend zou staan — wat zou dat zijn?',
   ph:'Typ je antwoord…'}},

  {{id:'D1', part:'D', core:true, type:'scale',
   q:'Hoe sterk denk je dat de rest van StratCom het met jouw antwoorden eens is?',
   lo:'totaal niet', hi:'volledig'}},
  {{id:'D2', part:'D', core:false, type:'scale',
   q:'Hoe duidelijk is de strategische positionering van TMS vandaag, voor jou?',
   lo:'heel onduidelijk', hi:'heel duidelijk'}},

  {{id:'naam', part:'D', core:true, type:'name',
   q:'Tot slot — je naam en rol',
   help:'Zodat we bij de bespreking de juiste context hebben (optioneel).',
   ph:'Naam · rol'}},
];

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
const state = {{ mode:'full', pos:0, answers:{{}} }};
const app       = document.getElementById('app'),
      shape     = document.getElementById('shape'),
      topbar    = document.getElementById('topbar'),
      screen    = document.getElementById('screen'),
      footer    = document.getElementById('footer'),
      progfill  = document.getElementById('progfill'),
      backBtn   = document.getElementById('back'),
      topmono   = document.getElementById('topmono');

function activeQs(){{ return QS.filter(q=> state.mode==='full' || q.core); }}
function screens(){{ return ['intro', ...activeQs().map(q=>q.id), 'done']; }}
function current(){{ return screens()[state.pos]; }}
function setAccent(c){{ document.documentElement.style.setProperty('--accent', c);
  const rgb = hexRGB(c); document.documentElement.style.setProperty('--accent-soft', `rgba(${{rgb}},.09)`); }}
function hexRGB(h){{h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)].join(',');}}

backBtn.onclick=()=>{{ if(state.pos>0){{ state.pos--; render(); }} }};

// ═══════════════════════════════════════════════════════════
//  SUPABASE SAVE
// ═══════════════════════════════════════════════════════════
async function saveResponse() {{
  // Update the save-status indicator in the done screen immediately
  const setStatus = (msg, color) => {{
    const el = document.getElementById('db-status');
    if (el) {{ el.textContent = msg; el.style.color = color; }}
  }};

  if (!_sb) {{
    setStatus('(Supabase niet geconfigureerd – gebruik "Kopieer" als back-up)', 'rgba(255,255,255,.35)');
    return;
  }}

  setStatus('Opslaan in database…', 'rgba(255,255,255,.5)');

  const A = state.answers;
  const row = {{
    naam:  A.naam  || null,
    mode:  state.mode,
    // Deel A – allocations
    a1_oe: A.A1 ? (parseInt(A.A1.oe) || 0) : null,
    a1_pl: A.A1 ? (parseInt(A.A1.pl) || 0) : null,
    a1_ki: A.A1 ? (parseInt(A.A1.ki) || 0) : null,
    a2_oe: A.A2 ? (parseInt(A.A2.oe) || 0) : null,
    a2_pl: A.A2 ? (parseInt(A.A2.pl) || 0) : null,
    a2_ki: A.A2 ? (parseInt(A.A2.ki) || 0) : null,
    a3:    A.A3  || null,
    a4:    A.A4  || null,
    // Deel B
    b1:    (A.B1 && A.B1.length) ? A.B1 : null,
    b2:    A.B2  || null,
    b3:    A.B3  || null,
    b4:    A.B4  || null,
    b5:    (A.B5 && A.B5.length) ? A.B5 : null,
    // Deel C – free text
    c1:    A.C1  || null,
    c2:    A.C2  || null,
    c3:    A.C3  || null,
    c4:    A.C4  || null,
    // Deel D – scales
    d1:    A.D1  || null,
    d2:    A.D2  || null,
  }};

  try {{
    const {{ error }} = await _sb.from('survey_responses').insert(row);
    if (error) {{
      console.error('Supabase save error:', error);
      setStatus('⚠ Opslaan mislukt – gebruik "Kopieer mijn antwoorden" als back-up.', '#FF6B6B');
    }} else {{
      setStatus('✓ Antwoorden opgeslagen in database', '#39B2AD');
    }}
  }} catch(e) {{
    console.error('Save error:', e);
    setStatus('⚠ Opslaan mislukt – gebruik "Kopieer mijn antwoorden" als back-up.', '#FF6B6B');
  }}
}}

// ═══════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════
function render(){{
  const id = current();
  const isHero = (id==='intro'||id==='done');
  app.classList.toggle('hero', isHero);
  topmono.src = isHero ? MONO_W : MONO_R;
  topbar.style.visibility = (id==='intro') ? 'hidden' : 'visible';
  backBtn.disabled = (state.pos<=1);
  const qs=activeQs();
  if(id==='intro'){{ setAccent('#CD0039'); progfill.style.width='0%'; }}
  else if(id==='done'){{ setAccent('#CD0039'); progfill.style.width='100%'; }}
  else{{
    const q=QS.find(x=>x.id===id); setAccent(PART[q.part].color);
    const n=qs.findIndex(x=>x.id===id);
    progfill.style.width = ((n)/(qs.length))*100 + '%';
  }}
  screen.scrollTop=0;
  if(id==='intro') return renderIntro();
  if(id==='done')  return renderDone();
  renderQuestion(QS.find(x=>x.id===id), qs);
}}

function renderIntro(){{
  screen.innerHTML = `<div class="wrap reveal">
    <img class="hero-mono" src="${{MONO_W}}" alt="TMS">
    <p class="eyebrow" style="color:var(--teal)">Strategische positionering · Treacy &amp; Wiersema</p>
    <h1 class="q">Positioneringssurvey</h1>
    <p class="help">Leg vóór de werksessie individueel vast waar TMS volgens jou staat en waar we naartoe moeten. Er zijn geen juiste of foute antwoorden — net de verschillen tussen ons maken het gesprek waardevol.</p>
    <div class="disc-list">
      ${{Object.values(DISC).map(d=>`<div class="disc"><span class="dot" style="background:${{d.dot}}"></span><span><b>${{d.label}}</b> — ${{d.desc}}</span></div>`).join('')}}
    </div>
    <div class="modes" id="modes">
      <button class="mode ${{state.mode==='full'?'sel':''}}" data-m="full">
        <span class="mt"><span class="mtick">${{CHECK}}</span>Volledige survey</span>
        <span class="md">15 vragen · ± 15 min</span></button>
      <button class="mode ${{state.mode==='core'?'sel':''}}" data-m="core">
        <span class="mt"><span class="mtick">${{CHECK}}</span>Korte kern</span>
        <span class="md">9 vragen · ± 10 min</span></button>
    </div>
  </div>`;
  footer.innerHTML = `<button class="btn btn-primary" id="next">Start <span>${{ARROW}}</span></button>
    <span class="keyhint">druk <b>Enter ↵</b></span>`;
  document.getElementById('modes').onclick=(e)=>{{ const b=e.target.closest('.mode'); if(!b)return;
    state.mode=b.dataset.m; render(); }};
  document.getElementById('next').onclick=advance;
}}

function renderDone(){{
  const filled = activeQs().filter(q=>hasAnswer(q.id)).length;
  screen.innerHTML = `<div class="wrap reveal" style="text-align:center">
    <img class="hero-mono" src="${{MONO_W}}" alt="TMS" style="margin-inline:auto">
    <h1 class="q" style="text-align:center">Bedankt — dit is binnen.</h1>
    <p class="help" style="margin-inline:auto;text-align:center">Je antwoorden zijn klaar. We bespreken de <b style="color:#fff;font-weight:600">geaggregeerde</b> resultaten samen binnen StratCom.</p>
    <p class="foot-note" style="text-align:center">${{filled}} van ${{activeQs().length}} vragen ingevuld.</p>
    <p id="db-status" class="foot-note" style="text-align:center;transition:color .4s">Opslaan in database…</p>
  </div>`;
  footer.innerHTML = `<button class="btn btn-on-dark" id="copy"><span>${{ARROW}}</span> Kopieer mijn antwoorden</button>
    <button class="btn btn-ghost" id="dl" style="color:rgba(255,255,255,.7)">Download .txt</button>`;
  footer.style.flexWrap='wrap';
  document.getElementById('copy').onclick=()=>copyOut(document.getElementById('copy'));
  document.getElementById('dl').onclick=downloadOut;
  // trigger the async save (it will update #db-status when done)
  saveResponse();
}}

function renderQuestion(q, qs){{
  const n=qs.findIndex(x=>x.id===q.id)+1;
  let body='';
  if(q.type==='single'||q.type==='multi2'){{
    const sel = state.answers[q.id] || (q.type==='multi2'?[]:null);
    body=`<div class="opts" id="opts">`+ q.opts.map(([v,t])=>{{
      const on = q.type==='multi2' ? sel.includes(v) : sel===v;
      const dis = q.type==='multi2' && !on && sel.length>=2 ? 'disabled':'';
      return `<button class="opt ${{on?'sel':''}} ${{dis}}" data-v="${{v}}">
        <span class="ot">${{t}}</span>
        <span class="tick">${{CHECK}}</span></button>`;
    }}).join('')+`</div>`;
  }}
  else if(q.type==='rank'){{
    const sel = state.answers[q.id] || [];
    body=`<div class="opts" id="opts">`+ q.items.map(([v,t])=>{{
      const r = sel.indexOf(v); const on=r>=0;
      return `<button class="opt ${{on?'sel':''}}" data-v="${{v}}">
        <span class="rank-badge">${{on?(r+1):''}}</span>
        <span class="ot">${{t}}</span></button>`;
    }}).join('')+`</div>`;
  }}
  else if(q.type==='alloc'){{
    const a = state.answers[q.id] || {{oe:'',pl:'',ki:''}};
    body=`<div class="alloc" id="alloc">`+ Object.entries(DISC).map(([k,d])=>`
      <div class="arow">
        <div class="top"><span class="dot" style="background:${{d.dot}}"></span>
          <span class="name">${{d.label}}</span></div>
        <div class="stepper">
          <button class="sbtn" data-k="${{k}}" data-s="-5" aria-label="min">−</button>
          <input class="ninput" data-k="${{k}}" inputmode="numeric" value="${{a[k]===''?'':a[k]}}" placeholder="0" maxlength="3">
          <button class="sbtn" data-k="${{k}}" data-s="5" aria-label="plus">+</button>
        </div>
        <div class="abar"><i data-bar="${{k}}" style="background:${{d.dot}}"></i></div>
      </div>`).join('')+`</div>
      <div class="total" id="total"><span>Totaal</span><span class="badge" id="tbadge">0</span><span>/ 100</span></div>`;
  }}
  else if(q.type==='scale'){{
    const sel=state.answers[q.id];
    body=`<div class="ends"><span>${{q.lo}}</span><span>${{q.hi}}</span></div>
      <div class="scale" id="scale">`+[1,2,3,4,5,6,7].map(n=>`<button class="sc ${{sel===n?'sel':''}}" data-v="${{n}}">${{n}}</button>`).join('')+`</div>`;
  }}
  else if(q.type==='text'){{
    body=`<textarea id="ta" placeholder="${{q.ph||''}}">${{state.answers[q.id]||''}}</textarea>`;
  }}
  else if(q.type==='name'){{
    body=`<input class="tinput" id="nm" placeholder="${{q.ph||''}}" value="${{(state.answers[q.id]||'').replace(/"/g,'&quot;')}}">`;
  }}

  screen.innerHTML = `<div class="wrap reveal">
    <p class="eyebrow"><span class="qn">${{q.id.toUpperCase()}}</span>${{PART[q.part].name}}</p>
    <h2 class="q">${{q.q}}</h2>
    ${{q.help?`<p class="help">${{q.help}}</p>`:''}}
    ${{body}}
  </div>`;

  const auto = (q.type==='single'||q.type==='scale');
  footer.innerHTML = `<button class="btn btn-primary" id="next">${{state.pos===screens().length-2?'Afronden':'Volgende'}} <span>${{ARROW}}</span></button>
    <span class="keyhint">${{auto?'tik om te kiezen':'<b>Enter ↵</b>'}}</span>`;
  const nextBtn=document.getElementById('next');

  wireQuestion(q, nextBtn);
}}

function wireQuestion(q, nextBtn){{
  const setNext=(ok)=>{{ nextBtn.disabled=!ok; }};
  if(q.type==='single'){{
    setNext(!!state.answers[q.id]);
    document.getElementById('opts').onclick=(e)=>{{ const b=e.target.closest('.opt'); if(!b)return;
      state.answers[q.id]=b.dataset.v;
      [...b.parentNode.children].forEach(c=>c.classList.toggle('sel',c===b));
      setNext(true); setTimeout(advance,360); }};
  }}
  else if(q.type==='multi2'){{
    let sel=state.answers[q.id]||[]; state.answers[q.id]=sel;
    setNext(sel.length>=1);
    document.getElementById('opts').onclick=(e)=>{{ const b=e.target.closest('.opt'); if(!b||b.classList.contains('disabled'))return;
      const v=b.dataset.v; const i=sel.indexOf(v);
      if(i>=0) sel.splice(i,1); else {{ if(sel.length>=2) return; sel.push(v); }}
      renderQuestion(q, activeQs()); }};
  }}
  else if(q.type==='rank'){{
    let sel=state.answers[q.id]||[]; state.answers[q.id]=sel;
    setNext(sel.length===q.items.length);
    document.getElementById('opts').onclick=(e)=>{{ const b=e.target.closest('.opt'); if(!b)return;
      const v=b.dataset.v; const i=sel.indexOf(v);
      if(i>=0) sel.splice(i,1); else sel.push(v);
      renderQuestion(q, activeQs()); }};
  }}
  else if(q.type==='alloc'){{
    const a=state.answers[q.id]||{{oe:'',pl:'',ki:''}}; state.answers[q.id]=a;
    const upd=()=>{{ let tot=0; Object.keys(DISC).forEach(k=>{{ const v=parseInt(a[k])||0; tot+=v;
        const bar=document.querySelector(`[data-bar="${{k}}"]`); if(bar) bar.style.width=Math.min(v,100)+'%'; }});
      const t=document.getElementById('total'), bd=document.getElementById('tbadge');
      bd.textContent=tot; t.classList.toggle('ok',tot===100); t.classList.toggle('over',tot>100);
      setNext(tot===100); }};
    document.getElementById('alloc').addEventListener('click',(e)=>{{ const b=e.target.closest('.sbtn'); if(!b)return;
      const k=b.dataset.k, s=parseInt(b.dataset.s); let v=(parseInt(a[k])||0)+s; v=Math.max(0,Math.min(100,v));
      a[k]=v; const inp=document.querySelector(`.ninput[data-k="${{k}}"]`); inp.value=v; upd(); }});
    document.getElementById('alloc').addEventListener('input',(e)=>{{ const inp=e.target.closest('.ninput'); if(!inp)return;
      let v=inp.value.replace(/[^0-9]/g,'').slice(0,3); if(v!=='') v=Math.min(100,parseInt(v)); inp.value=v;
      a[inp.dataset.k]= v===''?'':v; upd(); }});
    upd();
  }}
  else if(q.type==='scale'){{
    setNext(!!state.answers[q.id]);
    document.getElementById('scale').onclick=(e)=>{{ const b=e.target.closest('.sc'); if(!b)return;
      state.answers[q.id]=parseInt(b.dataset.v);
      [...b.parentNode.children].forEach(c=>c.classList.toggle('sel',c===b));
      setNext(true); setTimeout(advance,360); }};
  }}
  else if(q.type==='text'){{
    setNext(true);
    const ta=document.getElementById('ta'); ta.oninput=()=>{{ state.answers[q.id]=ta.value; }};
  }}
  else if(q.type==='name'){{
    setNext(true);
    const nm=document.getElementById('nm'); nm.oninput=()=>{{ state.answers[q.id]=nm.value; }};
  }}
  nextBtn.onclick=advance;
}}

function hasAnswer(id){{ const v=state.answers[id];
  if(v==null) return false;
  if(Array.isArray(v)) return v.length>0;
  if(typeof v==='object') return Object.values(v).some(x=>x!=='' && x!=null);
  return String(v).trim()!=='';
}}

function advance(){{
  if(state.pos < screens().length-1){{ state.pos++; render(); }}
}}

// keyboard: Enter advances
document.addEventListener('keydown',(e)=>{{
  if(e.key==='Enter' && !(e.target.tagName==='TEXTAREA' && !e.shiftKey && e.metaKey===false && e.ctrlKey===false)){{
    const nb=document.getElementById('next');
    if(nb && !nb.disabled){{ if(e.target.tagName!=='TEXTAREA'){{ e.preventDefault(); nb.click(); }} }}
  }}
}});

// ═══════════════════════════════════════════════════════════
//  TEXT OUTPUT (copy / download)
// ═══════════════════════════════════════════════════════════
function buildOutput(){{
  const A=state.answers; const L=[];
  L.push('TMS · Positioneringssurvey — antwoorden');
  L.push('Naam / rol: '+(A.naam||'—'));
  L.push('');
  const al=(o)=> o? `OE ${{o.oe||0}} · PL ${{o.pl||0}} · KI ${{o.ki||0}}` : '—';
  const di=(v)=> v?DISC[v].label:'—';
  const op=(q,v)=>{{ const o=QS.find(x=>x.id===q).opts.find(([k])=>k===v); return o?o[1]:'—'; }};
  L.push('A1 · Vandaag:  '+al(A.A1));
  L.push('A2 · Ambitie (3j):  '+al(A.A2));
  L.push('A3 · Dominant:  '+di(A.A3));
  L.push('A4 · Enkel marktstandaard:  '+di(A.A4));
  if(A.B1) L.push('B1 · Klant kiest TMS omdat:  '+A.B1.map(v=>op('B1',v)).join('  |  '));
  if(A.B2) L.push('B2 · Detachering sturen op:  '+op('B2',A.B2));
  if(A.B3) L.push('B3 · Grootste groei uit:  '+op('B3',A.B3));
  if(A.B4) L.push('B4 · Complexe klus dunne marge:  '+op('B4',A.B4));
  if(A.B5){{ const it=QS.find(x=>x.id==='B5').items; L.push('B5 · Investeren (1→3):  '+A.B5.map((v,i)=>`${{i+1}}. ${{it.find(([k])=>k===v)[1]}}`).join('  |  ')); }}
  if(A.C1) L.push('C1 · Waarom TMS:  '+A.C1);
  if(A.C2) L.push('C2 · Niet (meer) doen:  '+A.C2);
  if(A.C3) L.push('C3 · Meest gevreesde concurrent:  '+A.C3);
  if(A.C4) L.push('C4 · Bekend om over 3j:  '+A.C4);
  if(A.D1) L.push('D1 · Afstemming met StratCom:  '+A.D1+'/7');
  if(A.D2) L.push('D2 · Duidelijkheid positionering:  '+A.D2+'/7');
  return L.join('\\n');
}}
function copyOut(btn){{
  const txt=buildOutput();
  const done=()=>{{ const o=btn.innerHTML; btn.innerHTML='<span>'+CHECK+'</span> Gekopieerd'; setTimeout(()=>btn.innerHTML=o,1800); }};
  if(navigator.clipboard&&navigator.clipboard.writeText){{ navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt,done)); }}
  else fallbackCopy(txt,done);
}}
function fallbackCopy(txt,done){{ const t=document.createElement('textarea'); t.value=txt; t.style.position='fixed';t.style.opacity=0;
  document.body.appendChild(t); t.select(); try{{document.execCommand('copy');done();}}catch(e){{alert(txt);}} document.body.removeChild(t); }}
function downloadOut(){{ const txt=buildOutput(); const b=new Blob([txt],{{type:'text/plain'}});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b);
  a.download='TMS-positioneringssurvey-'+(((state.answers.naam||'antwoord').replace(/[^a-z0-9]+/gi,'-').toLowerCase()))+'.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); }}

render();
</script>
</body>
</html>"""

# ── inject logo data URIs ────────────────────────────────────
HTML = HTML.replace('{LOGO_DARK}',  LOGO_DARK)
HTML = HTML.replace('{LOGO_WHITE}', LOGO_WHITE)

# Also set the topbar <img> src in the HTML
HTML = HTML.replace(
    '<img class="brand-mono" id="topmono" alt="TMS">',
    f'<img class="brand-mono" id="topmono" alt="TMS" src="{LOGO_DARK}">'
)

out = pathlib.Path(__file__).parent / "index.html"
out.write_text(HTML, encoding="utf-8")
print(f"OK  Written  {out}  ({out.stat().st_size // 1024} KB)")
print()
print("Next steps:")
print("  1. Open schema.sql in your Supabase SQL editor and run it.")
print("  2. Copy your Project URL and anon key from")
print("     Supabase → Settings → API.")
print("  3. Edit index.html – replace the two placeholder values near the top:")
print("       const SUPABASE_URL      = 'YOUR_SUPABASE_URL';")
print("       const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';")
print("  4. Open index.html in any browser – survey answers are saved")
print("     automatically to the survey_responses table on submit.")
print()
print("Tip: to view results, open the Supabase Table Editor.")
print("     For a quick CSV export: Storage → SQL → SELECT * FROM survey_responses;")
