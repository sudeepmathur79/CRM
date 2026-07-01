import { ArrowRight, Check, Mic, BarChart2, Users, Zap, Bell, Glasses } from 'lucide-react';

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
              <div className="flex-shrink-0 text-3xl font-extrabold leading-none" style={{ color: '#2B2A28', opacity: 1, fontVariantNumeric: 'tabular-nums', minWidth: '2.5rem' }}>
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
            {[
              { step: '01', title: 'Sign up in 30 seconds', body: "No credit card. No setup wizard. Create your account and you're in — with a live pipeline ready to use." },
              { step: '02', title: 'Add leads by voice or text', body: "Tap the mic and describe a lead, or use Smart Add to type in plain English. AI does the data entry." },
              { step: '03', title: 'Close deals, not spreadsheets', body: "Your pipeline stays current. Follow-up reminders fire on time. AI tells you which leads to prioritise." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="text-6xl font-extrabold mb-4 leading-none" style={{ color: '#2B2A28', opacity: 1 }}>{s.step}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: ink }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>{s.body}</p>
              </div>
            ))}
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
        <div
          className="rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6"
          style={{ background: ink, border: `2px solid ${ink}` }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: terra + '22' }}>
            <Glasses className="w-7 h-7" style={{ color: terra }} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: terra }}>Coming soon</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: bg }}>
              Introducing <span style={{ color: terra }}>GlassCast</span>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: bg + 'aa' }}>
              SalesFlow hands-free. Smart glasses capture every meeting automatically. Walk in, have the conversation, walk out. Your CRM is already updated.
            </p>
          </div>
          <a
            href="mailto:support@aifstud.io?subject=GlassCast waitlist"
            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
            style={{ background: terra, color: '#fff' }}
          >
            Join waitlist <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

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
