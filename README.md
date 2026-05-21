<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SimatsSeatSync — README</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0e1a;
    --bg2: #111627;
    --bg3: #161d30;
    --surface: #1a2238;
    --surface2: #1e2840;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --text: #e8edf7;
    --muted: #8a96b0;
    --accent: #4f8ef7;
    --accent2: #7c4dff;
    --accent3: #00d4aa;
    --accent4: #ff6b6b;
    --accent5: #ffd166;
    --grad: linear-gradient(135deg, #4f8ef7 0%, #7c4dff 100%);
    --grad2: linear-gradient(135deg, #00d4aa 0%, #4f8ef7 100%);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-xs: 5px;
    --mono: 'JetBrains Mono', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── GRID NOISE BG ── */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .wrapper {
    position: relative;
    z-index: 1;
    max-width: 860px;
    margin: 0 auto;
    padding: 0 24px 80px;
  }

  /* ── HERO ── */
  .hero {
    padding: 72px 0 56px;
    border-bottom: 1px solid var(--border);
    position: relative;
  }

  .hero::after {
    content: '';
    position: absolute;
    top: 0; left: -100px; right: -100px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79,142,247,0.4), rgba(124,77,255,0.4), transparent);
  }

  .badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 100px;
    letter-spacing: 0.02em;
    border: 1px solid;
    font-family: var(--mono);
  }

  .badge-blue   { background: rgba(79,142,247,0.1); color: #7db5ff; border-color: rgba(79,142,247,0.25); }
  .badge-purple { background: rgba(124,77,255,0.1); color: #b08fff; border-color: rgba(124,77,255,0.25); }
  .badge-teal   { background: rgba(0,212,170,0.1);  color: #4dffce; border-color: rgba(0,212,170,0.25); }
  .badge-amber  { background: rgba(255,209,102,0.1);color: #ffd166; border-color: rgba(255,209,102,0.25); }
  .badge-red    { background: rgba(255,107,107,0.1);color: #ff8f8f; border-color: rgba(255,107,107,0.25); }

  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(40px, 6vw, 60px);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
    margin-bottom: 16px;
  }

  .hero-title .grad-text {
    background: var(--grad);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-sub {
    font-size: 18px;
    color: var(--muted);
    font-weight: 300;
    max-width: 560px;
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .cta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 10px 20px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s;
    cursor: pointer;
    border: none;
    font-family: 'DM Sans', sans-serif;
  }

  .btn-primary {
    background: var(--grad);
    color: #fff;
    box-shadow: 0 0 20px rgba(79,142,247,0.25);
  }
  .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 0 30px rgba(79,142,247,0.35); }

  .btn-ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--border2);
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--border2); background: var(--surface); }

  /* ── SECTIONS ── */
  section { padding: 56px 0 0; }

  .section-label {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--accent);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-label::before {
    content: '';
    display: block;
    width: 18px;
    height: 1px;
    background: var(--accent);
  }

  h2 {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 24px;
    color: var(--text);
  }

  h3 {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--text);
  }

  p { color: var(--muted); font-size: 15px; margin-bottom: 12px; }
  p:last-child { margin-bottom: 0; }

  /* ── FEATURES GRID ── */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
  }

  .feature-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 20px;
    transition: border-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .feature-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .feature-card:hover::before { opacity: 1; }

  .feature-card.blue::before  { background: var(--grad); }
  .feature-card.teal::before  { background: var(--grad2); }
  .feature-card.amber::before { background: linear-gradient(135deg, #ffd166, #ff9f43); }
  .feature-card.red::before   { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }

  .feature-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-bottom: 14px;
  }

  .icon-blue   { background: rgba(79,142,247,0.12); }
  .icon-teal   { background: rgba(0,212,170,0.12); }
  .icon-amber  { background: rgba(255,209,102,0.12); }
  .icon-red    { background: rgba(255,107,107,0.12); }
  .icon-purple { background: rgba(124,77,255,0.12); }

  /* ── TECH STACK ── */
  .stack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }

  .stack-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stack-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .stack-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .stack-role { font-size: 11px; color: var(--muted); margin-top: 1px; font-family: var(--mono); }

  /* ── CODE BLOCKS ── */
  .code-block {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin: 16px 0;
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }

  .code-dots { display: flex; gap: 6px; }
  .code-dot {
    width: 11px; height: 11px;
    border-radius: 50%;
  }
  .dot-red    { background: #ff5f57; }
  .dot-yellow { background: #ffbd2e; }
  .dot-green  { background: #28ca41; }

  .code-title { font-family: var(--mono); font-size: 12px; color: var(--muted); }

  pre {
    padding: 18px 20px;
    overflow-x: auto;
    font-family: var(--mono);
    font-size: 13px;
    line-height: 1.65;
    color: #c9d1d9;
  }

  .t-blue   { color: #79b8ff; }
  .t-green  { color: #85e89d; }
  .t-yellow { color: #ffea7f; }
  .t-orange { color: #ffab70; }
  .t-muted  { color: #6a737d; }
  .t-red    { color: #f97583; }

  code {
    font-family: var(--mono);
    font-size: 12.5px;
    background: rgba(79,142,247,0.1);
    color: #7db5ff;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(79,142,247,0.15);
  }

  /* ── STRUCTURE TREE ── */
  .tree {
    font-family: var(--mono);
    font-size: 13px;
    line-height: 2;
    color: var(--muted);
  }

  .tree .dir  { color: #7db5ff; }
  .tree .file { color: var(--muted); }
  .tree .ann  { color: #4dffce; font-style: italic; }

  /* ── STEPS ── */
  .steps { display: flex; flex-direction: column; gap: 0; }

  .step {
    display: flex;
    gap: 20px;
    padding-bottom: 32px;
    position: relative;
  }

  .step:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 18px;
    top: 38px;
    bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, var(--accent), transparent);
    opacity: 0.3;
  }

  .step-num {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--grad);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 500;
    color: #fff;
    flex-shrink: 0;
  }

  .step-body { padding-top: 6px; flex: 1; }
  .step-body h3 { margin-bottom: 6px; font-size: 15px; }

  /* ── FUNCTIONS TABLE ── */
  .fn-table { width: 100%; border-collapse: collapse; }

  .fn-table th {
    text-align: left;
    font-size: 11px;
    font-family: var(--mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
  }

  .fn-table td {
    padding: 14px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
    vertical-align: top;
  }

  .fn-table tr:last-child td { border-bottom: none; }
  .fn-table tr:hover td { background: var(--surface2); }

  .fn-name { font-family: var(--mono); color: var(--accent); font-size: 12.5px; }
  .fn-desc { color: var(--muted); font-size: 13px; }
  .fn-trigger { display: inline-flex; align-items: center; gap: 4px; }

  /* ── RULES GRID ── */
  .rules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .rule-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 18px;
  }

  .rule-card h3 { font-size: 13px; color: var(--text); margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }

  .rule-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12.5px;
    padding: 5px 0;
    border-bottom: 1px solid var(--border);
    gap: 8px;
  }
  .rule-row:last-child { border-bottom: none; }
  .rule-who { color: var(--muted); }
  .rule-what { font-family: var(--mono); font-size: 11px; text-align: right; }
  .perm-r  { color: var(--accent3); }
  .perm-w  { color: var(--accent5); }
  .perm-d  { color: var(--accent4); }
  .perm-a  { color: var(--accent); }

  /* ── SCRIPTS TABLE ── */
  .scripts {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .script-row {
    display: flex;
    align-items: center;
    gap: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
  }

  .script-cmd { font-family: var(--mono); font-size: 13px; color: var(--accent3); min-width: 160px; }
  .script-desc { color: var(--muted); font-size: 13px; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--border);
    padding: 32px 0 0;
    margin-top: 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  footer p { font-size: 13px; color: var(--muted); margin: 0; }
  footer a { color: var(--accent); text-decoration: none; }
  footer a:hover { text-decoration: underline; }

  /* ── DIVIDER ── */
  .divider {
    height: 1px;
    background: var(--border);
    margin: 48px 0 0;
  }

  /* ── ENV TABLE ── */
  .env-block {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-top: 16px;
  }

  .env-row {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--border);
  }
  .env-row:last-child { border-bottom: none; }

  .env-key {
    font-family: var(--mono);
    font-size: 12.5px;
    color: #7db5ff;
    padding: 11px 16px;
    min-width: 240px;
    border-right: 1px solid var(--border);
    background: var(--surface);
  }

  .env-val {
    font-family: var(--mono);
    font-size: 12px;
    color: #85e89d;
    padding: 11px 16px;
    align-self: center;
  }

  @media (max-width: 600px) {
    .hero { padding: 48px 0 40px; }
    .hero-title { font-size: 36px; }
    .hero-sub { font-size: 16px; }
    .env-key { min-width: 160px; font-size: 11px; }
    .env-val { font-size: 11px; }
  }
</style>
</head>
<body>
<div class="wrapper">

  <!-- ══════════════ HERO ══════════════ -->
  <header class="hero">
    <div class="badge-row">
      <span class="badge badge-blue">React 19</span>
      <span class="badge badge-purple">TypeScript</span>
      <span class="badge badge-teal">Firebase</span>
      <span class="badge badge-amber">Tailwind CSS 4</span>
      <span class="badge badge-red">SendGrid</span>
    </div>

    <h1 class="hero-title">
      Simats<span class="grad-text">SeatSync</span>
    </h1>

    <p class="hero-sub">
      A real-time workshop &amp; seminar booking platform for SIMATS — helping students register for events, and admins manage seats — all with automated email notifications.
    </p>

    <div class="cta-row">
      <a class="btn btn-primary" href="https://simats-seat-sync.vercel.app" target="_blank">
        ↗ Live Demo
      </a>
      <a class="btn btn-ghost" href="https://github.com/dharanigovardhan2008/SimatsSeatSync" target="_blank">
        ⌥ View on GitHub
      </a>
    </div>
  </header>


  <!-- ══════════════ FEATURES ══════════════ -->
  <section>
    <div class="section-label">What it does</div>
    <h2>Features</h2>

    <div class="features-grid">
      <div class="feature-card blue">
        <div class="feature-icon icon-blue">📅</div>
        <h3>Event Browsing</h3>
        <p>Students can browse all upcoming workshops and seminars in one place, with full event details and seat availability.</p>
      </div>

      <div class="feature-card teal">
        <div class="feature-icon icon-teal">🎫</div>
        <h3>Seat Booking</h3>
        <p>Authenticated users can register for events with a single action. Real-time Firestore keeps seat counts accurate across all users.</p>
      </div>

      <div class="feature-card amber">
        <div class="feature-icon icon-amber">⚙️</div>
        <h3>Admin Panel</h3>
        <p>Admins can create, update, and delete events. All changes are reflected instantly for all users via Firestore's live listeners.</p>
      </div>

      <div class="feature-card red">
        <div class="feature-icon icon-purple">✉️</div>
        <h3>Email Notifications</h3>
        <p>Automated emails on signup, booking confirmation, and new event announcements — powered by SendGrid Cloud Functions.</p>
      </div>

      <div class="feature-card blue">
        <div class="feature-icon icon-blue">🔐</div>
        <h3>Role-Based Access</h3>
        <p>Firestore security rules enforce strict student vs. admin permissions so users can only access what they're allowed to.</p>
      </div>

      <div class="feature-card teal">
        <div class="feature-icon icon-teal">☁️</div>
        <h3>Serverless Backend</h3>
        <p>No dedicated server required. Firebase Auth, Firestore, and Cloud Functions handle all authentication, data, and triggers.</p>
      </div>
    </div>
  </section>


  <!-- ══════════════ TECH STACK ══════════════ -->
  <section>
    <div class="section-label">Built with</div>
    <h2>Tech Stack</h2>

    <div class="stack-grid">
      <div class="stack-card">
        <div class="stack-dot" style="background:#61dafb;"></div>
        <div>
          <div class="stack-name">React 19</div>
          <div class="stack-role">UI framework</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#3178c6;"></div>
        <div>
          <div class="stack-name">TypeScript 5</div>
          <div class="stack-role">Type safety</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#646cff;"></div>
        <div>
          <div class="stack-name">Vite 7</div>
          <div class="stack-role">Build tool</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#38bdf8;"></div>
        <div>
          <div class="stack-name">Tailwind CSS 4</div>
          <div class="stack-role">Styling</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#f5820d;"></div>
        <div>
          <div class="stack-name">Firebase</div>
          <div class="stack-role">Auth, Firestore, Functions</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#00d4aa;"></div>
        <div>
          <div class="stack-name">SendGrid</div>
          <div class="stack-role">Transactional email</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#000;"></div>
        <div>
          <div class="stack-name">Vercel</div>
          <div class="stack-role">Frontend hosting</div>
        </div>
      </div>
      <div class="stack-card">
        <div class="stack-dot" style="background:#4f8ef7;"></div>
        <div>
          <div class="stack-name">React Router 7</div>
          <div class="stack-role">Client-side routing</div>
        </div>
      </div>
    </div>
  </section>


  <!-- ══════════════ PROJECT STRUCTURE ══════════════ -->
  <section>
    <div class="section-label">Codebase</div>
    <h2>Project Structure</h2>

    <div class="code-block">
      <div class="code-header">
        <div class="code-dots">
          <div class="code-dot dot-red"></div>
          <div class="code-dot dot-yellow"></div>
          <div class="code-dot dot-green"></div>
        </div>
        <span class="code-title">SimatsSeatSync/</span>
        <span></span>
      </div>
      <pre class="tree">
<span class="dir">SimatsSeatSync/</span>
├── <span class="dir">src/</span>                         <span class="ann"># React + TypeScript frontend</span>
│   ├── <span class="dir">components/</span>              <span class="ann"># Reusable UI components</span>
│   ├── <span class="dir">pages/</span>                   <span class="ann"># Route-level page components</span>
│   ├── <span class="dir">hooks/</span>                   <span class="ann"># Custom React hooks</span>
│   ├── <span class="dir">lib/</span>                     <span class="ann"># Firebase client config</span>
│   └── <span class="file">main.tsx</span>                 <span class="ann"># App entry point</span>
├── <span class="dir">functions/</span>                   <span class="ann"># Firebase Cloud Functions</span>
│   ├── <span class="file">index.js</span>                 <span class="ann"># All function handlers</span>
│   └── <span class="file">package.json</span>
├── <span class="file">firebase.json</span>                <span class="ann"># Firebase project config</span>
├── <span class="file">firestore.rules</span>              <span class="ann"># Security rules</span>
├── <span class="file">firestore.indexes.json</span>       <span class="ann"># Composite query indexes</span>
├── <span class="file">index.html</span>                   <span class="ann"># HTML shell</span>
├── <span class="file">vite.config.ts</span>               <span class="ann"># Vite build config</span>
├── <span class="file">tsconfig.json</span>                <span class="ann"># TypeScript config</span>
└── <span class="file">FIREBASE_SETUP.md</span>            <span class="ann"># Firebase deployment guide</span></pre>
    </div>
  </section>


  <!-- ══════════════ GETTING STARTED ══════════════ -->
  <section>
    <div class="section-label">Setup</div>
    <h2>Getting Started</h2>

    <p>You'll need <strong style="color:var(--text);">Node.js 18+</strong>, a <strong style="color:var(--text);">Firebase project</strong> with Auth, Firestore, Functions &amp; Hosting enabled, and a <strong style="color:var(--text);">SendGrid account</strong> for email.</p>

    <div class="steps" style="margin-top: 28px;">

      <div class="step">
        <div class="step-num">1</div>
        <div class="step-body">
          <h3>Clone the repo</h3>
          <div class="code-block">
            <div class="code-header">
              <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
              <span class="code-title">bash</span>
              <span></span>
            </div>
            <pre><span class="t-blue">git</span> clone https://github.com/dharanigovardhan2008/SimatsSeatSync.git
<span class="t-blue">cd</span> SimatsSeatSync</pre>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">2</div>
        <div class="step-body">
          <h3>Install dependencies</h3>
          <div class="code-block">
            <div class="code-header">
              <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
              <span class="code-title">bash</span><span></span>
            </div>
            <pre><span class="t-blue">npm</span> install</pre>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">3</div>
        <div class="step-body">
          <h3>Configure Firebase environment</h3>
          <p>Create a <code>.env</code> file at the project root with your Firebase credentials:</p>
          <div class="env-block">
            <div class="env-row"><span class="env-key">VITE_FIREBASE_API_KEY</span><span class="env-val">your_api_key</span></div>
            <div class="env-row"><span class="env-key">VITE_FIREBASE_AUTH_DOMAIN</span><span class="env-val">your_project.firebaseapp.com</span></div>
            <div class="env-row"><span class="env-key">VITE_FIREBASE_PROJECT_ID</span><span class="env-val">your_project_id</span></div>
            <div class="env-row"><span class="env-key">VITE_FIREBASE_STORAGE_BUCKET</span><span class="env-val">your_project.appspot.com</span></div>
            <div class="env-row"><span class="env-key">VITE_FIREBASE_MESSAGING_SENDER_ID</span><span class="env-val">your_sender_id</span></div>
            <div class="env-row"><span class="env-key">VITE_FIREBASE_APP_ID</span><span class="env-val">your_app_id</span></div>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">4</div>
        <div class="step-body">
          <h3>Set SendGrid API key</h3>
          <div class="code-block">
            <div class="code-header">
              <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
              <span class="code-title">bash</span><span></span>
            </div>
            <pre><span class="t-blue">firebase</span> login
<span class="t-blue">firebase</span> functions:config:set <span class="t-green">sendgrid.key</span>=<span class="t-yellow">"YOUR_SENDGRID_API_KEY"</span></pre>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="step-num">5</div>
        <div class="step-body">
          <h3>Run the development server</h3>
          <div class="code-block">
            <div class="code-header">
              <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
              <span class="code-title">bash</span><span></span>
            </div>
            <pre><span class="t-blue">npm</span> run dev
<span class="t-muted"># → http://localhost:5173</span></pre>
          </div>
        </div>
      </div>

    </div>
  </section>


  <!-- ══════════════ DEPLOYMENT ══════════════ -->
  <section>
    <div class="section-label">Shipping</div>
    <h2>Deployment</h2>

    <div class="code-block">
      <div class="code-header">
        <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
        <span class="code-title">Deploy everything at once</span><span></span>
      </div>
      <pre><span class="t-blue">npm</span> run build
<span class="t-blue">firebase</span> deploy</pre>
    </div>

    <p style="margin-top: 8px;">Or deploy individual targets:</p>

    <div class="code-block" style="margin-top: 12px;">
      <div class="code-header">
        <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
        <span class="code-title">Granular deployment</span><span></span>
      </div>
      <pre><span class="t-muted"># Frontend only (Firebase Hosting)</span>
<span class="t-blue">npm</span> run build && firebase deploy --only hosting

<span class="t-muted"># Cloud Functions only</span>
<span class="t-blue">cd</span> functions && npm install && cd ..
<span class="t-blue">firebase</span> deploy --only functions

<span class="t-muted"># Firestore security rules only</span>
<span class="t-blue">firebase</span> deploy --only firestore:rules</pre>
    </div>
  </section>


  <!-- ══════════════ CLOUD FUNCTIONS ══════════════ -->
  <section>
    <div class="section-label">Serverless</div>
    <h2>Cloud Functions</h2>
    <p>Three Firebase Cloud Functions handle all automated email workflows via SendGrid.</p>

    <div class="code-block" style="margin-top: 20px;">
      <div class="code-header">
        <div class="code-dots"><div class="code-dot dot-red"></div><div class="code-dot dot-yellow"></div><div class="code-dot dot-green"></div></div>
        <span class="code-title">functions/index.js</span><span></span>
      </div>
      <table class="fn-table">
        <thead>
          <tr>
            <th>Function</th>
            <th>Trigger</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code class="fn-name">sendWelcomeEmail</code></td>
            <td><span class="fn-trigger"><span class="badge badge-blue" style="font-size:10px;">Auth</span> New user created</span></td>
            <td class="fn-desc">Sends an HTML welcome email to the newly registered user</td>
          </tr>
          <tr>
            <td><code class="fn-name">sendRegistrationEmail</code></td>
            <td><span class="fn-trigger"><span class="badge badge-teal" style="font-size:10px;">Firestore</span> New registration doc</span></td>
            <td class="fn-desc">Sends booking confirmation with event title, type, and date</td>
          </tr>
          <tr>
            <td><code class="fn-name">sendNewEventNotification</code></td>
            <td><span class="fn-trigger"><span class="badge badge-purple" style="font-size:10px;">Firestore</span> New event doc</span></td>
            <td class="fn-desc">Notifies all students of the new event with a register button</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>


  <!-- ══════════════ SECURITY RULES ══════════════ -->
  <section>
    <div class="section-label">Permissions</div>
    <h2>Firestore Security Rules</h2>
    <p>Role-based rules ensure students can only access their own data, while admins have broader control.</p>

    <div class="rules-grid" style="margin-top: 20px;">
      <div class="rule-card">
        <h3>👤 Users Collection</h3>
        <div class="rule-row">
          <span class="rule-who">Student — own profile</span>
          <span class="rule-what"><span class="perm-r">read</span> <span class="perm-w">write</span></span>
        </div>
        <div class="rule-row">
          <span class="rule-who">Admin — all users</span>
          <span class="rule-what"><span class="perm-r">read</span></span>
        </div>
      </div>

      <div class="rule-card">
        <h3>📅 Events Collection</h3>
        <div class="rule-row">
          <span class="rule-who">Student — all events</span>
          <span class="rule-what"><span class="perm-r">read</span></span>
        </div>
        <div class="rule-row">
          <span class="rule-who">Admin — all events</span>
          <span class="rule-what"><span class="perm-r">read</span> <span class="perm-w">write</span> <span class="perm-d">delete</span></span>
        </div>
      </div>

      <div class="rule-card">
        <h3>🎫 Registrations Collection</h3>
        <div class="rule-row">
          <span class="rule-who">Student — own records</span>
          <span class="rule-what"><span class="perm-r">read</span> <span class="perm-a">create</span> <span class="perm-d">delete</span></span>
        </div>
        <div class="rule-row">
          <span class="rule-who">Admin — all records</span>
          <span class="rule-what"><span class="perm-r">read</span></span>
        </div>
        <div class="rule-row">
          <span class="rule-who">Anyone</span>
          <span class="rule-what perm-d">no update</span>
        </div>
      </div>
    </div>
  </section>


  <!-- ══════════════ NPM SCRIPTS ══════════════ -->
  <section>
    <div class="section-label">Scripts</div>
    <h2>Available Commands</h2>

    <div class="scripts">
      <div class="script-row">
        <span class="script-cmd">npm run dev</span>
        <span class="script-desc">Start the Vite development server at localhost:5173</span>
      </div>
      <div class="script-row">
        <span class="script-cmd">npm run build</span>
        <span class="script-desc">Compile TypeScript and bundle for production</span>
      </div>
      <div class="script-row">
        <span class="script-cmd">npm run preview</span>
        <span class="script-desc">Serve the production build locally for final checks</span>
      </div>
    </div>
  </section>


  <!-- ══════════════ TROUBLESHOOTING ══════════════ -->
  <section>
    <div class="section-label">Help</div>
    <h2>Troubleshooting</h2>

    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div class="rule-card">
        <h3>📧 SendGrid email not sending</h3>
        <p style="font-size: 13px; margin-top: 6px;">Verify the sender email is authenticated in your SendGrid dashboard. Check function logs with <code>firebase functions:log</code>. Confirm the API key is set: <code>firebase functions:config:get</code>.</p>
      </div>
      <div class="rule-card">
        <h3>🚫 Function deployment fails</h3>
        <p style="font-size: 13px; margin-top: 6px;">Confirm your Node.js version is 18 or later. Run <code>npm install</code> inside the <code>functions/</code> folder and check for syntax errors in <code>index.js</code>.</p>
      </div>
      <div class="rule-card">
        <h3>🔒 Firestore permission denied</h3>
        <p style="font-size: 13px; margin-top: 6px;">Confirm the user is authenticated and check <code>firestore.rules</code> for the correct permissions. Redeploy rules with <code>firebase deploy --only firestore:rules</code>.</p>
      </div>
    </div>
  </section>


  <!-- ══════════════ FOOTER ══════════════ -->
  <footer>
    <p>Built by <a href="https://github.com/dharanigovardhan2008" target="_blank">@dharanigovardhan2008</a></p>
    <p>
      <a href="https://simats-seat-sync.vercel.app" target="_blank">Live Demo</a>
      &nbsp;·&nbsp;
      <a href="https://github.com/dharanigovardhan2008/SimatsSeatSync" target="_blank">GitHub</a>
      &nbsp;·&nbsp;
      <a href="https://github.com/dharanigovardhan2008/SimatsSeatSync/blob/main/FIREBASE_SETUP.md" target="_blank">Firebase Setup Guide</a>
    </p>
  </footer>

</div>
</body>
</html>
