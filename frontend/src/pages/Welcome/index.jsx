import { useState, useEffect } from 'react';
import { ArrowRight, Check, Mic, BarChart2, Users, Zap, Bell, Glasses, X } from 'lucide-react';

const highlightSignIn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signin') === '1';

// ── SalesFlow wordmark ──────────────────────────────────────────────────────
function SalesFlowLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#2B2A28' }}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
          <path d="M4 22 L9 12 L13 18 L17 10 L23 22" stroke="#FAF6EF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="23" cy="22" r="2" fill="#c65f2f"/>
        </svg>
      </div>
      <span className="font-bold tracking-tight text-lg" style={{ color: '#2B2A28' }}>
        Sales<span style={{ color: '#c65f2f' }}>Flow</span>
      </span>
    </div>
  );
}

// ── Marker highlight ─────────────────────────────────────────────────────────
function Highlight({ children }) {
  return (
    <span className="relative inline-block">
      <span
        className="absolute inset-0 -skew-x-2 -rotate-1 rounded"
        style={{ background: '#c65f2f', opacity: 0.18, transform: 'skewX(-3deg) rotate(-1deg) scaleX(1.04)', bottom: '-2px', top: '-2px' }}
      />
      <span className="relative" style={{ color: '#c65f2f' }}>{children}</span>
    </span>
  );
}

// ── Polaroid demo card ────────────────────────────────────────────────────────
function PolaroidCard() {
  return (
    <div className="rotate-2 shadow-2xl rounded-sm bg-white p-3 pb-10 w-full max-w-sm mx-auto" style={{ boxShadow: '4px 8px 32px rgba(43,42,40,0.18)' }}>
      {/* Mock app UI */}
      <div className="rounded bg-slate-900 overflow-hidden" style={{ aspectRatio: '4/3' }}>
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-slate-500 font-mono">SalesFlow CRM</span>
        </div>
        <div className="p-3 space-y-2">
          {/* Lead cards */}
          {[
            { name: 'Sarah Mitchell', co: 'Acme Corp', score: 9, status: 'Qualified', color: '#6366f1' },
            { name: 'James Okonkwo', co: 'BuildCo Ltd', score: 7, status: 'Contacted', color: '#f59e0b' },
            { name: 'Priya Sharma', co: 'TechStart', score: 8, status: 'Proposal', color: '#10b981' },
          ].map((l) => (
            <div key={l.name} className="flex items-center justify-between rounded-lg bg-slate-800/80 px-2.5 py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: l.color }}>
                  {l.name[0]}
                </div>
                <div>
                  <div className="text-white text-xs font-medium leading-none">{l.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5">{l.co}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: l.color + '22', color: l.color }}>{l.status}</span>
                <span className="text-xs font-bold text-white">{l.score}/10</span>
              </div>
            </div>
          ))}
          {/* AI score bar */}
          <div className="rounded-lg bg-indigo-950/60 border border-indigo-500/20 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              <span className="text-xs text-indigo-300 font-medium">AI scored 3 leads just now</span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs mt-3 font-medium" style={{ color: '#2B2A28', opacity: 0.5 }}>Your pipeline. Always current.</p>
    </div>
  );
}

const FEATURES = [
  {
    n: '01',
    icon: <Mic className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'Voice capture',
    body: 'Speak naturally after every call. AI pulls out names, companies, deal values, and next steps — no typing required.',
  },
  {
    n: '02',
    icon: <Zap className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'AI lead scoring',
    body: 'Every lead is automatically scored 1–10 based on conversation content, sentiment, and engagement history.',
  },
  {
    n: '03',
    icon: <BarChart2 className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'Smart Add',
    body: 'Describe a lead in plain English and AI creates the record instantly. No form. No fields.',
  },
  {
    n: '04',
    icon: <Bell className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'Follow-up reminders',
    body: 'Set follow-up dates on any lead. Get reminders before they go cold. No lead falls through the cracks.',
  },
  {
    n: '05',
    icon: <BarChart2 className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'Live pipeline',
    body: 'Kanban or list — your call. See every deal, stage, and value in one view. Filter in seconds.',
  },
  {
    n: '06',
    icon: <Users className="w-5 h-5" style={{ color: '#c65f2f' }} />,
    title: 'Team ready',
    body: 'Add up to 2 team members on Pro. Assign leads, track activity, see performance — all in one workspace.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['10 lead captures / month', 'Built-in pipeline', 'AI Smart Add', 'No credit card required'],
    cta: 'Start free',
    ctaHref: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited lead captures', 'Voice capture + AI transcription', 'AI lead scoring', 'Follow-up reminders', 'Up to 2 team members', 'File & recording storage', 'Priority support'],
    cta: 'Get started',
    ctaHref: '/signup',
    highlight: true,
  },
];

// ── Shared section heading ────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-3 h-3 rounded-sm rotate-45" style={{ background: '#c65f2f' }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#c65f2f' }}>{children}</span>
    </div>
  );
}

export default function WelcomePage() {
  const bg = '#FAF6EF';
  const ink = '#2B2A28';
  const terra = '#c65f2f';
  const [glasscastOpen, setGlasscastOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'GLASSCAST_CLOSE') setGlasscastOpen(false);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: bg, color: ink }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: bg + 'f0', backdropFilter: 'blur(12px)', borderColor: ink + '18' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/"><SalesFlowLogo /></a>
          <div className="hidden sm:flex items-center gap-7 text-sm font-medium" style={{ color: ink + 'aa' }}>
            <a href="#features" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.65 }}>Features</a>
            <a href="#pricing" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.65 }}>Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
              style={highlightSignIn
                ? { background: terra, color: '#fff' }
                : { color: ink + 'aa' }}
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm"
              style={{ background: ink, color: bg }}
            >
              Start free →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <div>
            <SectionLabel>AI CRM for solopreneurs &amp; small teams</SectionLabel>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-6">
              The CRM you'll<br />
              <Highlight>actually</Highlight> keep using.
            </h1>

            <p className="text-lg leading-relaxed mb-8" style={{ color: ink + 'bb' }}>
              Capture leads by voice, score them with AI, and keep your pipeline current — automatically. Built for founders and small teams who sell without a sales ops team.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base transition-all shadow-md"
                style={{ background: terra, color: '#fff' }}
              >
                Start free <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border transition-all"
                style={{ borderColor: ink + '30', color: ink }}
              >
                See how it works
              </a>
            </div>
            <p className="text-sm" style={{ color: ink + '70' }}>10 captures free / month. No credit card. No catch.</p>

            {/* Key facts */}
            <div className="mt-10 flex gap-8">
              {[
                { value: '30 sec', label: 'to add a lead by voice' },
                { value: 'Free', label: '10 captures / month' },
                { value: '$29', label: 'flat / month for Pro' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold" style={{ color: ink }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: ink + '70' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — polaroid */}
          <div className="flex justify-center lg:justify-end">
            <PolaroidCard />
          </div>
        </div>
      </section>

      {/* Pull quote testimonial — above pricing */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="-rotate-1 rounded-2xl p-8 relative" style={{ background: '#fff', border: `2px solid ${ink}18`, boxShadow: `3px 4px 0 ${ink}18` }}>
          <div className="text-5xl font-serif leading-none mb-4" style={{ color: terra, opacity: 0.6 }}>"</div>
          <p className="text-lg font-medium leading-relaxed mb-5" style={{ color: ink }}>
            I've tried Pipedrive, HubSpot, Notion — I used none of them consistently. SalesFlow is the first CRM I actually open every day.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: terra }}>AR</div>
            <div>
              <div className="text-sm font-semibold" style={{ color: ink }}>Alex R.</div>
              <div className="text-xs" style={{ color: ink + '70' }}>Freelance Consultant</div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <SectionLabel>Built for</SectionLabel>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: ink }}>If you sell without a sales team, this is for you.</h2>
        <p className="text-base mb-10" style={{ color: ink + '80' }}>SalesFlow is built around one thing: helping one person manage more deals without hiring anyone.</p>
        <div className="grid sm:grid-cols-3 gap-6">
          {/* Consultant */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${ink}12`, boxShadow: `2px 3px 0 ${ink}0a` }}>
            <div className="h-44 flex items-center justify-center p-4" style={{ background: '#FAF6EF' }}>
              <svg viewBox="0 0 200 130" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Desk */}
                <rect x="20" y="100" width="160" height="6" rx="3" fill="#2B2A28" opacity="0.12"/>
                {/* Laptop */}
                <rect x="55" y="52" width="90" height="56" rx="5" fill="#2B2A28" opacity="0.08"/>
                <rect x="60" y="57" width="80" height="43" rx="3" fill="#1e293b"/>
                {/* Screen — mini CRM */}
                <rect x="65" y="62" width="35" height="3.5" rx="1.5" fill="#c65f2f" opacity="0.9"/>
                <rect x="65" y="70" width="65" height="3" rx="1.5" fill="#FAF6EF" opacity="0.25"/>
                <rect x="65" y="76" width="50" height="3" rx="1.5" fill="#FAF6EF" opacity="0.18"/>
                <rect x="65" y="82" width="58" height="3" rx="1.5" fill="#FAF6EF" opacity="0.18"/>
                <rect x="65" y="88" width="42" height="3" rx="1.5" fill="#FAF6EF" opacity="0.12"/>
                {/* Score badge */}
                <rect x="112" y="68" width="22" height="10" rx="3" fill="#c65f2f" opacity="0.8"/>
                <text x="115" y="76" fontSize="6" fill="#FAF6EF" fontWeight="700" fontFamily="monospace">9/10</text>
                {/* Laptop base */}
                <rect x="48" y="108" width="104" height="5" rx="2.5" fill="#2B2A28" opacity="0.10"/>
                {/* Person silhouette */}
                <circle cx="100" cy="32" r="10" fill="#c65f2f" opacity="0.25"/>
                <circle cx="100" cy="30" r="7" fill="#c65f2f" opacity="0.5"/>
                {/* Speech bubble */}
                <rect x="112" y="12" width="58" height="22" rx="7" fill="#c65f2f" opacity="0.12"/>
                <path d="M114 34 L110 42 L120 34" fill="#c65f2f" opacity="0.12"/>
                <rect x="118" y="18" width="38" height="3" rx="1.5" fill="#c65f2f" opacity="0.45"/>
                <rect x="118" y="24" width="28" height="3" rx="1.5" fill="#c65f2f" opacity="0.3"/>
              </svg>
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: terra }}>Consultants &amp; freelancers</p>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>You're the whole sales function. Keep every client conversation captured and every follow-up on track — without a CRM admin.</p>
            </div>
          </div>

          {/* Founder */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${ink}12`, boxShadow: `2px 3px 0 ${ink}0a` }}>
            <div className="h-44 flex items-center justify-center p-4" style={{ background: '#FAF6EF' }}>
              <svg viewBox="0 0 200 130" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Kanban board */}
                <rect x="10" y="30" width="52" height="85" rx="5" fill="#2B2A28" opacity="0.06"/>
                <rect x="74" y="30" width="52" height="85" rx="5" fill="#2B2A28" opacity="0.06"/>
                <rect x="138" y="30" width="52" height="85" rx="5" fill="#c65f2f" opacity="0.08"/>
                {/* Column headers */}
                <rect x="16" y="36" width="30" height="5" rx="2.5" fill="#2B2A28" opacity="0.2"/>
                <rect x="80" y="36" width="30" height="5" rx="2.5" fill="#2B2A28" opacity="0.2"/>
                <rect x="144" y="36" width="30" height="5" rx="2.5" fill="#c65f2f" opacity="0.5"/>
                {/* Cards col 1 */}
                <rect x="16" y="46" width="40" height="20" rx="3" fill="#fff" opacity="0.8"/>
                <rect x="20" y="50" width="25" height="3" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                <rect x="20" y="56" width="18" height="2.5" rx="1.25" fill="#2B2A28" opacity="0.15"/>
                <rect x="16" y="70" width="40" height="20" rx="3" fill="#fff" opacity="0.8"/>
                <rect x="20" y="74" width="25" height="3" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                <rect x="20" y="80" width="18" height="2.5" rx="1.25" fill="#2B2A28" opacity="0.15"/>
                {/* Cards col 2 */}
                <rect x="80" y="46" width="40" height="20" rx="3" fill="#fff" opacity="0.8"/>
                <rect x="84" y="50" width="25" height="3" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                <rect x="84" y="56" width="18" height="2.5" rx="1.25" fill="#2B2A28" opacity="0.15"/>
                {/* Cards col 3 (won) */}
                <rect x="144" y="46" width="40" height="20" rx="3" fill="#c65f2f" opacity="0.15"/>
                <rect x="148" y="50" width="25" height="3" rx="1.5" fill="#c65f2f" opacity="0.5"/>
                <rect x="148" y="56" width="18" height="2.5" rx="1.25" fill="#c65f2f" opacity="0.35"/>
                <rect x="144" y="70" width="40" height="20" rx="3" fill="#c65f2f" opacity="0.15"/>
                <rect x="148" y="74" width="25" height="3" rx="1.5" fill="#c65f2f" opacity="0.5"/>
                <rect x="148" y="80" width="18" height="2.5" rx="1.25" fill="#c65f2f" opacity="0.35"/>
                {/* Checkmark on won column */}
                <circle cx="176" cy="105" r="8" fill="#c65f2f" opacity="0.15"/>
                <path d="M171 105 L175 109 L181 101" stroke="#c65f2f" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>
              </svg>
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: terra }}>Startup founders</p>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>You're in back-to-back meetings all week. SalesFlow keeps your pipeline alive without asking you to become a CRM power user.</p>
            </div>
          </div>

          {/* Small team */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1.5px solid ${ink}12`, boxShadow: `2px 3px 0 ${ink}0a` }}>
            <div className="h-44 flex items-center justify-center p-4" style={{ background: '#FAF6EF' }}>
              <svg viewBox="0 0 200 130" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* 3 people */}
                <circle cx="60" cy="35" r="10" fill="#c65f2f" opacity="0.2"/>
                <circle cx="60" cy="33" r="7" fill="#c65f2f" opacity="0.4"/>
                <path d="M42 70 Q42 52 60 52 Q78 52 78 70" fill="#c65f2f" opacity="0.12"/>
                <circle cx="100" cy="30" r="11" fill="#2B2A28" opacity="0.12"/>
                <circle cx="100" cy="28" r="8" fill="#2B2A28" opacity="0.3"/>
                <path d="M80 68 Q80 48 100 48 Q120 48 120 68" fill="#2B2A28" opacity="0.08"/>
                <circle cx="140" cy="35" r="10" fill="#c65f2f" opacity="0.2"/>
                <circle cx="140" cy="33" r="7" fill="#c65f2f" opacity="0.4"/>
                <path d="M122 70 Q122 52 140 52 Q158 52 158 70" fill="#c65f2f" opacity="0.12"/>
                {/* Arrows pointing to pipeline */}
                <path d="M60 75 L90 88" stroke="#c65f2f" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/>
                <path d="M100 72 L100 85" stroke="#2B2A28" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.3"/>
                <path d="M140 75 L110 88" stroke="#c65f2f" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.4"/>
                {/* Shared pipeline */}
                <rect x="40" y="90" width="120" height="30" rx="6" fill="#2B2A28" opacity="0.07"/>
                <rect x="46" y="96" width="28" height="4" rx="2" fill="#c65f2f" opacity="0.5"/>
                <rect x="80" y="96" width="28" height="4" rx="2" fill="#2B2A28" opacity="0.25"/>
                <rect x="114" y="96" width="28" height="4" rx="2" fill="#2B2A28" opacity="0.2"/>
                <rect x="46" y="104" width="18" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
                <rect x="80" y="104" width="22" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
                <rect x="114" y="104" width="14" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
              </svg>
            </div>
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: terra }}>Small sales teams</p>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>Up to 3 people sharing one pipeline. Assign leads, track who's following up, and see every deal in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — numbered rows */}
      <section id="features" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <SectionLabel>Features</SectionLabel>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: ink }}>Everything you need to close deals</h2>
        <p className="text-base mb-12" style={{ color: ink + '80' }}>No bloat. No six-figure implementation. Just the tools that matter.</p>

        <div className="space-y-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-5 rounded-2xl p-5 transition-all"
              style={{ background: '#fff', border: `1.5px solid ${ink}12`, boxShadow: `2px 3px 0 ${ink}0a` }}
            >
              <div className="flex-shrink-0 text-3xl font-extrabold leading-none" style={{ color: '#e8804f', opacity: 1, fontVariantNumeric: 'tabular-nums', minWidth: '2.5rem' }}>
                {f.n}
              </div>
              <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: terra + '15' }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-base mb-1" style={{ color: ink }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-y" style={{ borderColor: ink + '12' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionLabel>How it works</SectionLabel>
          <h2 className="text-2xl sm:text-3xl font-bold mb-12" style={{ color: ink }}>From meeting to CRM in under a minute</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {/* Step 01 */}
            <div className="relative">
              <div className="text-6xl font-extrabold mb-4 leading-none" style={{ color: '#e8804f', opacity: 1 }}>01</div>
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fff', border: `1.5px solid ${ink}10` }}>
                <svg viewBox="0 0 220 130" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Browser chrome */}
                  <rect x="0" y="0" width="220" height="130" rx="8" fill="#f8fafc"/>
                  <rect x="0" y="0" width="220" height="22" rx="8" fill="#e2e8f0"/>
                  <rect x="0" y="16" width="220" height="6" fill="#e2e8f0"/>
                  <circle cx="12" cy="11" r="3.5" fill="#ef4444" opacity="0.6"/>
                  <circle cx="22" cy="11" r="3.5" fill="#f59e0b" opacity="0.6"/>
                  <circle cx="32" cy="11" r="3.5" fill="#22c55e" opacity="0.6"/>
                  {/* Form */}
                  <rect x="40" y="32" width="140" height="8" rx="4" fill="#c65f2f" opacity="0.18"/>
                  <rect x="60" y="33" width="80" height="6" rx="3" fill="#c65f2f" opacity="0.4"/>
                  <rect x="40" y="46" width="140" height="14" rx="4" fill="#fff" stroke="#2B2A28" strokeOpacity="0.12" strokeWidth="1"/>
                  <rect x="45" y="51" width="60" height="4" rx="2" fill="#2B2A28" opacity="0.2"/>
                  <rect x="40" y="65" width="140" height="14" rx="4" fill="#fff" stroke="#2B2A28" strokeOpacity="0.12" strokeWidth="1"/>
                  <rect x="45" y="70" width="70" height="4" rx="2" fill="#2B2A28" opacity="0.15"/>
                  <rect x="40" y="84" width="140" height="14" rx="4" fill="#fff" stroke="#2B2A28" strokeOpacity="0.12" strokeWidth="1"/>
                  <rect x="45" y="89" width="50" height="4" rx="2" fill="#2B2A28" opacity="0.15"/>
                  {/* CTA button */}
                  <rect x="55" y="104" width="110" height="18" rx="6" fill="#c65f2f"/>
                  <rect x="80" y="109" width="60" height="8" rx="4" fill="#FAF6EF" opacity="0.7"/>
                  {/* Checkmark badge */}
                  <circle cx="185" cy="104" r="12" fill="#22c55e" opacity="0.9"/>
                  <path d="M179 104 L183 108 L191 98" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: ink }}>Sign up in 30 seconds</h3>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>No credit card. No setup wizard. Create your account and you're in — with a live pipeline ready to use.</p>
            </div>

            {/* Step 02 */}
            <div className="relative">
              <div className="text-6xl font-extrabold mb-4 leading-none" style={{ color: '#e8804f', opacity: 1 }}>02</div>
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fff', border: `1.5px solid ${ink}10` }}>
                <svg viewBox="0 0 220 130" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="220" height="130" rx="8" fill="#0f172a"/>
                  {/* Mic circle */}
                  <circle cx="110" cy="50" r="28" fill="#c65f2f" opacity="0.15"/>
                  <circle cx="110" cy="50" r="18" fill="#c65f2f" opacity="0.25"/>
                  {/* Mic icon */}
                  <rect x="104" y="36" width="12" height="20" rx="6" fill="#c65f2f" opacity="0.9"/>
                  <path d="M98 52 Q98 62 110 62 Q122 62 122 52" stroke="#c65f2f" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9"/>
                  <line x1="110" y1="62" x2="110" y2="68" stroke="#c65f2f" strokeWidth="2" opacity="0.7"/>
                  {/* Waveform */}
                  <rect x="40" y="80" width="4" height="10" rx="2" fill="#c65f2f" opacity="0.4"/>
                  <rect x="48" y="75" width="4" height="20" rx="2" fill="#c65f2f" opacity="0.55"/>
                  <rect x="56" y="78" width="4" height="14" rx="2" fill="#c65f2f" opacity="0.45"/>
                  <rect x="64" y="72" width="4" height="26" rx="2" fill="#c65f2f" opacity="0.7"/>
                  <rect x="72" y="76" width="4" height="18" rx="2" fill="#c65f2f" opacity="0.55"/>
                  <rect x="80" y="79" width="4" height="12" rx="2" fill="#c65f2f" opacity="0.4"/>
                  <rect x="136" y="80" width="4" height="10" rx="2" fill="#c65f2f" opacity="0.4"/>
                  <rect x="144" y="75" width="4" height="20" rx="2" fill="#c65f2f" opacity="0.55"/>
                  <rect x="152" y="78" width="4" height="14" rx="2" fill="#c65f2f" opacity="0.45"/>
                  <rect x="160" y="72" width="4" height="26" rx="2" fill="#c65f2f" opacity="0.7"/>
                  <rect x="168" y="77" width="4" height="16" rx="2" fill="#c65f2f" opacity="0.55"/>
                  <rect x="176" y="80" width="4" height="10" rx="2" fill="#c65f2f" opacity="0.4"/>
                  {/* Lead card emerging */}
                  <rect x="60" y="104" width="100" height="20" rx="5" fill="#1e293b"/>
                  <rect x="67" y="109" width="45" height="3.5" rx="1.5" fill="#FAF6EF" opacity="0.6"/>
                  <rect x="67" y="115" width="30" height="3" rx="1.5" fill="#FAF6EF" opacity="0.3"/>
                  <rect x="130" y="108" width="22" height="12" rx="3" fill="#c65f2f" opacity="0.7"/>
                  <text x="133" y="117" fontSize="7" fill="#FAF6EF" fontWeight="700" fontFamily="monospace">9/10</text>
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: ink }}>Add leads by voice or text</h3>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>Tap the mic and describe a lead, or use Smart Add to type in plain English. AI does the data entry.</p>
            </div>

            {/* Step 03 */}
            <div className="relative">
              <div className="text-6xl font-extrabold mb-4 leading-none" style={{ color: '#e8804f', opacity: 1 }}>03</div>
              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#fff', border: `1.5px solid ${ink}10` }}>
                <svg viewBox="0 0 220 130" className="w-full" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="220" height="130" rx="8" fill="#f8fafc"/>
                  {/* Kanban columns */}
                  <rect x="6" y="14" width="60" height="110" rx="5" fill="#2B2A28" opacity="0.05"/>
                  <rect x="80" y="14" width="60" height="110" rx="5" fill="#2B2A28" opacity="0.05"/>
                  <rect x="154" y="14" width="60" height="110" rx="5" fill="#c65f2f" opacity="0.07"/>
                  {/* Column labels */}
                  <rect x="12" y="19" width="35" height="5" rx="2.5" fill="#2B2A28" opacity="0.2"/>
                  <rect x="86" y="19" width="40" height="5" rx="2.5" fill="#2B2A28" opacity="0.2"/>
                  <rect x="160" y="19" width="28" height="5" rx="2.5" fill="#c65f2f" opacity="0.6"/>
                  {/* Cards col 1 */}
                  <rect x="11" y="30" width="50" height="22" rx="3" fill="#fff" stroke="#2B2A28" strokeOpacity="0.08" strokeWidth="1"/>
                  <rect x="16" y="35" width="30" height="3.5" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                  <rect x="16" y="41" width="22" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
                  <rect x="11" y="56" width="50" height="22" rx="3" fill="#fff" stroke="#2B2A28" strokeOpacity="0.08" strokeWidth="1"/>
                  <rect x="16" y="61" width="28" height="3.5" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                  <rect x="16" y="67" width="18" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
                  {/* Cards col 2 */}
                  <rect x="85" y="30" width="50" height="22" rx="3" fill="#fff" stroke="#2B2A28" strokeOpacity="0.08" strokeWidth="1"/>
                  <rect x="90" y="35" width="30" height="3.5" rx="1.5" fill="#2B2A28" opacity="0.3"/>
                  <rect x="90" y="41" width="22" height="3" rx="1.5" fill="#2B2A28" opacity="0.15"/>
                  {/* Cards col 3 — WON (highlighted) */}
                  <rect x="159" y="30" width="50" height="22" rx="3" fill="#c65f2f" opacity="0.15"/>
                  <rect x="164" y="35" width="30" height="3.5" rx="1.5" fill="#c65f2f" opacity="0.6"/>
                  <rect x="164" y="41" width="22" height="3" rx="1.5" fill="#c65f2f" opacity="0.35"/>
                  <rect x="159" y="56" width="50" height="22" rx="3" fill="#c65f2f" opacity="0.15"/>
                  <rect x="164" y="61" width="28" height="3.5" rx="1.5" fill="#c65f2f" opacity="0.6"/>
                  <rect x="164" y="67" width="18" height="3" rx="1.5" fill="#c65f2f" opacity="0.35"/>
                  <rect x="159" y="82" width="50" height="22" rx="3" fill="#c65f2f" opacity="0.15"/>
                  <rect x="164" y="87" width="30" height="3.5" rx="1.5" fill="#c65f2f" opacity="0.6"/>
                  <rect x="164" y="93" width="18" height="3" rx="1.5" fill="#c65f2f" opacity="0.35"/>
                  {/* Win badge */}
                  <circle cx="184" cy="115" r="9" fill="#c65f2f"/>
                  <path d="M179 115 L183 119 L190 108" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: ink }}>Close deals, not spreadsheets</h3>
              <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>Your pipeline stays current. Follow-up reminders fire on time. AI tells you which leads to prioritise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* More testimonials */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <SectionLabel>What early users are saying</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          {[
            { quote: "The AI scoring is genuinely useful. I know exactly which leads to chase first thing Monday morning.", name: 'Sarah M.', role: 'Founder, B2B SaaS', initials: 'SM', rotate: 'rotate-1' },
            { quote: "Voice capture after calls is a game changer. It takes 20 seconds and my notes are better than anything I'd type.", name: 'James O.', role: 'Independent Sales Rep', initials: 'JO', rotate: '-rotate-1' },
          ].map((t) => (
            <div
              key={t.name}
              className={`${t.rotate} rounded-2xl p-6`}
              style={{ background: '#fff', border: `1.5px solid ${ink}12`, boxShadow: `2px 3px 0 ${ink}0a` }}
            >
              <p className="text-sm leading-relaxed mb-4" style={{ color: ink + 'cc' }}>"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: ink }}>
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: ink }}>{t.name}</div>
                  <div className="text-xs" style={{ color: ink + '70' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="py-12 border-y" style={{ borderColor: ink + '12' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: ink }}>Stop losing deals to bad notes.</h2>
          <p className="text-base mb-7" style={{ color: ink + '80' }}>Start capturing in 60 seconds. Free — 10 captures / month, no credit card.</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-md"
            style={{ background: terra, color: '#fff' }}
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Before / After comparison */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <SectionLabel>The difference</SectionLabel>
        <h2 className="text-2xl sm:text-3xl font-bold mb-10" style={{ color: ink }}>Less chaos. More closed deals.</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Before */}
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: `1.5px solid ${ink}12` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: ink + '50' }}>Without SalesFlow</p>
            <div className="space-y-3">
              {[
                'Leads in WhatsApp, notes, and your head',
                'Forgetting to follow up for two weeks',
                'Copy-pasting contact details into a spreadsheet',
                'No idea which deal is closest to closing',
                'Re-reading old emails before every call',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center" style={{ background: ink + '12' }}>
                    <span style={{ color: ink + '50', fontSize: '10px', lineHeight: 1 }}>✕</span>
                  </div>
                  <span className="text-sm leading-relaxed" style={{ color: ink + '80' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
          {/* After */}
          <div className="rounded-2xl p-6" style={{ background: ink }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: terra }}>With SalesFlow</p>
            <div className="space-y-3">
              {[
                'Every lead captured by voice — in 20 seconds',
                'Reminders fire automatically before deals go cold',
                'AI creates the record from plain English',
                'AI score tells you who to call first',
                'Full conversation history on every lead',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center" style={{ background: terra + '30' }}>
                    <span style={{ color: terra, fontSize: '10px', lineHeight: 1 }}>✓</span>
                  </div>
                  <span className="text-sm leading-relaxed" style={{ color: '#FAF6EF' + 'cc' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing — two column */}
      <section id="pricing" className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <SectionLabel>Pricing</SectionLabel>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: ink }}>Simple, honest pricing</h2>
        <p className="text-base mb-12" style={{ color: ink + '80' }}>Start free. Upgrade when you're ready.</p>

        <div className="grid sm:grid-cols-2 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-7 flex flex-col relative"
              style={plan.highlight
                ? { background: ink, border: `2px solid ${ink}`, boxShadow: `4px 6px 0 ${terra}` }
                : { background: '#fff', border: `1.5px solid ${ink}18` }}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6">
                  <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full" style={{ background: terra, color: '#fff' }}>Most popular</span>
                </div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: plan.highlight ? bg + 'aa' : ink + '80' }}>
                {plan.name}
              </div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold" style={{ color: plan.highlight ? bg : ink }}>{plan.price}</span>
                {plan.period && <span className="text-sm mb-1" style={{ color: plan.highlight ? bg + '88' : ink + '70' }}>{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: plan.highlight ? terra : terra }} />
                    <span style={{ color: plan.highlight ? bg + 'dd' : ink + 'cc' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                className="w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                style={plan.highlight
                  ? { background: terra, color: '#fff' }
                  : { background: ink, color: bg }}
              >
                {plan.cta}
              </a>
              {plan.name === 'Free' && (
                <p className="text-center text-xs mt-3" style={{ color: ink + '60' }}>No credit card required</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: ink + '70' }}>
          Need more than 2 team members?{' '}
          <a href="mailto:support@aifstud.io" className="underline" style={{ color: ink }}>Talk to us</a>
        </p>
      </section>

      {/* GlassCast teaser */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <button onClick={() => setGlasscastOpen(true)} className="block w-full text-left group cursor-pointer">
          <div
            className="rounded-3xl overflow-hidden transition-all group-hover:shadow-2xl"
            style={{ background: ink }}
          >
            {/* Top — glasses visualisation */}
            <div className="px-8 pt-10 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ background: terra + '25', color: terra }}>
                <Glasses className="w-3.5 h-3.5" /> Coming soon · Ray-Ban Meta
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: bg }}>
                Your CRM, in your<br />
                <span style={{ color: terra }}>field of view.</span>
              </h3>
              <p className="text-sm leading-relaxed max-w-lg" style={{ color: bg + 'aa' }}>
                GlassCast brings SalesFlow to your smart glasses. See your top leads, follow-up alerts, and deal status — without touching your phone. The heads-up display is built. Voice capture is next.
              </p>
            </div>

            {/* Hero image */}
            <div className="px-8 pb-6">
              <img
                src="/glasscast-hero.png"
                alt="GlassCast HUD showing CRM data in smart glasses lens"
                className="w-full rounded-2xl object-cover"
                style={{ maxHeight: '280px', objectPosition: 'center' }}
              />
            </div>

            {/* Bottom CTA bar */}
            <div className="flex items-center justify-between px-8 py-5 border-t" style={{ borderColor: bg + '12' }}>
              <p className="text-xs font-medium" style={{ color: bg + '60' }}>
                Early access · Pro subscribers first
              </p>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: terra, color: '#fff' }}>
                Learn more &amp; join waitlist <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </button>
      </section>

      {/* GlassCast modal */}
      {glasscastOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(43,42,40,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setGlasscastOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl"
            style={{ maxHeight: '90vh', background: bg }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setGlasscastOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: ink + '18' }}
            >
              <X className="w-4 h-4" style={{ color: ink }} />
            </button>
            <iframe
              src="/glasscast"
              title="GlassCast"
              className="w-full border-0"
              style={{ height: '85vh' }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: ink + '15' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: ink + '70' }}>
          <SalesFlowLogo />
          <span>© 2026 SalesFlow CRM</span>
          <div className="flex gap-6">
            <a href="/login" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Sign in</a>
            <a href="/signup" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Sign up</a>
            <a href="/terms" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Terms</a>
            <a href="/privacy" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Privacy</a>
            <a href="mailto:support@aifstud.io" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
