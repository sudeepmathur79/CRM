import { ArrowRight, Check, ChevronDown, Mic, BarChart2, RefreshCw, Users, Zap, MapPin, Bell, Star, Glasses } from 'lucide-react';

const highlightSignIn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signin') === '1';

// ── SalesFlow wordmark ──────────────────────────────────────────────────────
function SalesFlowLogo({ className = '', textSize = 'text-xl' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 flex-shrink-0">
        <rect width="32" height="32" rx="8" fill="#6366f1"/>
        <path d="M8 22 L13 12 L16 18 L19 10 L24 22" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="24" cy="22" r="2" fill="#a5b4fc"/>
      </svg>
      <span className={`font-bold tracking-tight ${textSize}`}>
        <span className="text-white">Sales</span><span className="text-indigo-400">Flow</span>
      </span>
    </div>
  );
}

const FEATURES = [
  {
    icon: <Mic className="w-5 h-5 text-indigo-400" />,
    title: 'Voice capture',
    body: 'Speak naturally after every call or meeting. AI pulls out names, companies, deal values, and next steps — no typing required.',
  },
  {
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    title: 'AI lead scoring',
    body: 'Every lead is automatically scored 1–10 based on conversation content, sentiment, and engagement history.',
  },
  {
    icon: <RefreshCw className="w-5 h-5 text-indigo-400" />,
    title: 'Smart Add',
    body: 'Describe a lead in plain English — "Sarah at Acme, interested in the enterprise plan, follow up Thursday" — and AI creates the record instantly.',
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-indigo-400" />,
    title: 'Live pipeline',
    body: 'See every deal, stage, and value in one view. Kanban or list — your call. Filter by status, score, or follow-up date.',
  },
  {
    icon: <Bell className="w-5 h-5 text-indigo-400" />,
    title: 'Follow-up reminders',
    body: 'Set follow-up dates on any lead. Get browser reminders before they go cold. No lead falls through the cracks.',
  },
  {
    icon: <Users className="w-5 h-5 text-indigo-400" />,
    title: 'Team ready',
    body: 'Add up to 2 team members on the Pro plan. Assign leads, track activity, and see team performance — all in one workspace.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign up in 30 seconds',
    body: 'No credit card. No setup wizard. Create your account, and you\'re in — with a live pipeline ready to use.',
  },
  {
    step: '02',
    title: 'Add leads by voice or text',
    body: 'Tap the mic and describe a lead, or use Smart Add to type it in plain English. AI does the data entry for you.',
  },
  {
    step: '03',
    title: 'Close deals, not spreadsheets',
    body: 'Your pipeline stays current automatically. Follow-up reminders fire on time. AI tells you which leads to prioritise.',
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
    badge: 'Most popular',
  },
  {
    name: 'Team',
    price: 'Talk to us',
    period: '',
    features: ['Everything in Pro', 'Unlimited team members', 'Manager dashboard', 'Custom onboarding', 'Dedicated support'],
    cta: 'Contact us',
    ctaHref: 'mailto:support@aifstud.io',
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "I've tried Pipedrive, HubSpot, Notion — I used none of them consistently. SalesFlow is the first CRM I actually open every day.",
    name: 'Alex R.',
    role: 'Freelance Consultant',
    initials: 'AR',
  },
  {
    quote: "The AI scoring is genuinely useful. I know exactly which leads to chase first thing Monday morning.",
    name: 'Sarah M.',
    role: 'Founder, B2B SaaS',
    initials: 'SM',
  },
  {
    quote: "Voice capture after calls is a game changer. It takes 20 seconds and my notes are better than anything I'd type.",
    name: 'James O.',
    role: 'Independent Sales Rep',
    initials: 'JO',
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/"><SalesFlowLogo /></a>
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className={`text-sm px-4 py-2 rounded-lg transition-all ${
                highlightSignIn
                  ? 'text-white font-semibold bg-indigo-600 ring-2 ring-indigo-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Sign in
            </a>
            <a href="/signup" className="text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg font-semibold text-white shadow-lg shadow-indigo-600/30">
              Start free →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 text-center">
        <div className="flex justify-center mb-8">
          <SalesFlowLogo textSize="text-3xl" className="scale-125 origin-center" />
        </div>

        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6 uppercase tracking-wide">
          <Zap className="w-3 h-3" /> AI CRM for solopreneurs &amp; small teams
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          The CRM you'll<br className="hidden sm:block" />
          <span className="text-indigo-400"> actually keep using.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          SalesFlow captures leads by voice, scores them with AI, and keeps your pipeline current — automatically. Built for founders and small teams who sell without a sales ops team behind them.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <a
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/30"
          >
            Start free <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 transition-colors px-8 py-3.5 rounded-xl font-semibold text-base text-slate-300 hover:text-white"
          >
            See how it works <ChevronDown className="w-4 h-4" />
          </a>
        </div>
        <p className="text-sm text-slate-500">10 captures free / month. No credit card. No catch.</p>

        {/* Key facts */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { value: '30 sec', label: 'to add a lead by voice' },
            { value: 'Free', label: '10 captures / month' },
            { value: '$29', label: 'flat / month for Pro' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-slate-800 bg-slate-800/30 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-400 text-sm">
          Built for <span className="text-white font-medium">solopreneurs, consultants, and small sales teams</span> who are tired of CRMs that require a manual to operate
        </div>
      </div>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Everything you need to close deals</h2>
        <p className="text-center text-slate-500 text-sm mb-14">No bloat. No six-figure implementation. Just the tools that actually matter.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-indigo-500/40 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-center text-slate-400 text-sm mb-14">From meeting to CRM in under a minute.</p>
          <div className="grid sm:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="text-5xl font-extrabold text-indigo-600/25 mb-4 leading-none">{s.step}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">What early users are saying</h2>
        <p className="text-center text-slate-500 text-sm mb-14">Real feedback from real sellers.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mid-page CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">Stop losing deals to bad notes.</h2>
        <p className="text-slate-400 mb-8">Start capturing in 60 seconds. Free — 10 captures / month, no credit card.</p>
        <a
          href="/signup"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/30"
        >
          Get started free <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Simple, honest pricing</h2>
          <p className="text-center text-slate-400 text-sm mb-14">Start free. Upgrade when you're ready.</p>
          <div className="grid sm:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 flex flex-col relative ${
                  plan.highlight
                    ? 'bg-indigo-950/60 border-2 border-indigo-500 shadow-xl shadow-indigo-900/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 ${plan.highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-slate-400 text-sm mb-1">{plan.period}</span>}
                </div>
                <div className="h-6 mb-6" />
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-400' : 'text-green-400'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref}
                  className={`w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      : 'border border-slate-600 hover:border-indigo-500 hover:text-white text-slate-300'
                  }`}
                >
                  {plan.cta}
                </a>
                {plan.name === 'Free' && (
                  <p className="text-center text-xs text-slate-500 mt-3">No credit card required</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GlassCast teaser */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative bg-gradient-to-br from-slate-800/80 via-indigo-950/40 to-slate-800/80 border border-indigo-500/20 rounded-3xl p-8 sm:p-12 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
          </div>

          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
              <Glasses className="w-10 h-10 text-indigo-400" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs font-bold text-indigo-300 uppercase tracking-wide mb-3">
                Coming soon
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
                Introducing <span className="text-indigo-400">GlassCast</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                SalesFlow — hands-free. GlassCast pairs with your smart glasses to capture every field meeting automatically. Walk in, have the conversation, walk out. Your CRM is already updated.
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 justify-center sm:justify-start">
                {['On-device AI', 'No phone needed', 'Auto CRM sync', 'Always-on capture'].map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-indigo-400 inline-block" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-shrink-0 text-center">
              <a
                href="mailto:support@aifstud.io?subject=GlassCast waitlist"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 whitespace-nowrap"
              >
                Join the waitlist <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-xs text-slate-500 mt-2">Beta access for Pro subscribers first</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <SalesFlowLogo textSize="text-base" className="opacity-60" />
          <span>© 2026 SalesFlow CRM.</span>
          <div className="flex gap-6">
            <a href="/login" className="hover:text-slate-300 transition-colors">Sign in</a>
            <a href="/signup" className="hover:text-slate-300 transition-colors">Sign up</a>
            <a href="mailto:support@aifstud.io" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
