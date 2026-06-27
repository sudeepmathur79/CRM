import { Mic, ArrowRight, Check, ChevronDown } from 'lucide-react';

const highlightSignIn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signin') === '1';

const PAIN_POINTS = [
  {
    emoji: '🕐',
    title: 'Sunday night CRM catch-up',
    body: 'The average field rep spends 3.5 hours/week on manual data entry. That\'s 182 hours a year.',
  },
  {
    emoji: '😤',
    title: 'You forget details by the time you\'re back at your desk',
    body: 'The human memory starts degrading within minutes. Your best deals deserve better notes.',
  },
  {
    emoji: '📉',
    title: 'Your pipeline is fiction',
    body: 'CRM data reflects what reps remembered to log — not what actually happened in the meeting.',
  },
];

const STEPS = [
  {
    emoji: '🎤',
    title: 'Speak',
    body: 'Open fieldlens after a meeting. Tap record. Speak naturally for 30 seconds.',
  },
  {
    emoji: '✨',
    title: 'Extract',
    body: 'AI pulls out the name, company, deal value, next steps — automatically.',
  },
  {
    emoji: '🔄',
    title: 'Sync',
    body: 'Updates your HubSpot, Salesforce, or internal pipeline. No typing.',
  },
];

const FREE_FEATURES = [
  '10 captures / month',
  'Internal pipeline only',
  'No credit card required',
];

const PRO_FEATURES = [
  'Unlimited captures',
  'HubSpot + Salesforce + Zoho sync',
  'AI lead scoring',
  'Follow-up reminders',
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center">
            <img src="/fieldlens-logo.png" alt="fieldlens" className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className={`text-sm transition-colors ${highlightSignIn ? 'text-white font-semibold ring-1 ring-indigo-400 px-3 py-1.5 rounded-lg' : 'text-slate-400 hover:text-white'}`}>
              Sign in
            </a>
            <a
              href="/signup"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-2 rounded-lg font-medium"
            >
              Start free
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Your meetings, logged.<br className="hidden sm:block" /> Automatically.
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Speak naturally after every call. SalesFlow captures, extracts, and updates your CRM — no typing required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <a
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-6 py-3 rounded-xl font-semibold text-base"
          >
            Start free — no credit card
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 transition-colors px-6 py-3 rounded-xl font-semibold text-base text-slate-300 hover:text-white"
          >
            See how it works
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
        <p className="text-sm text-slate-500">10 captures free every month. No credit card required.</p>
      </section>

      {/* Pain section */}
      <section className="bg-slate-800/40 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-slate-100">
            Sound familiar?
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p) => (
              <div
                key={p.title}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
              >
                <div className="text-3xl mb-4">{p.emoji}</div>
                <h3 className="font-semibold text-lg mb-2 text-white">{p.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">How it works</h2>
        <p className="text-center text-slate-400 mb-14">Three steps. Thirty seconds.</p>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-4">
                {step.emoji}
              </div>
              <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                Step {i + 1}
              </div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-800/40 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-center text-slate-400 mb-14">Start free. Upgrade when you need more.</p>
          <div className="grid sm:grid-cols-3 gap-6 items-start">
            {/* Free */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">Free</div>
                <div className="text-4xl font-extrabold">$0</div>
                <div className="text-slate-500 text-sm mt-1">forever</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className="w-full text-center border border-slate-600 hover:border-slate-400 transition-colors px-4 py-3 rounded-xl font-semibold text-sm text-slate-300 hover:text-white"
              >
                Start free
              </a>
              <p className="text-center text-xs text-slate-500 mt-3">No credit card required</p>
            </div>

            {/* Pro */}
            <div className="bg-indigo-700/20 border-2 border-indigo-500 rounded-2xl p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <div className="text-indigo-300 text-sm font-semibold uppercase tracking-widest mb-2">Pro</div>
                <div className="text-4xl font-extrabold">$29</div>
                <div className="text-slate-400 text-sm mt-1">per seat / month</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="/signup"
                className="w-full text-center bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-3 rounded-xl font-semibold text-sm"
              >
                Start free trial
              </a>
            </div>

            {/* Premium */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col opacity-70">
              <div className="mb-6">
                <div className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-2">Premium</div>
                <div className="text-2xl font-extrabold text-slate-300">Coming soon</div>
                <div className="text-slate-500 text-sm mt-1">&nbsp;</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-400">
                  <Check className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  Hardware bundle included
                </li>
              </ul>
              <a
                href="mailto:hello@salesflow.app"
                className="w-full text-center border border-slate-600 px-4 py-3 rounded-xl font-semibold text-sm text-slate-400 cursor-not-allowed"
              >
                Join waitlist
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
        <span>© 2026 SalesFlow. Built for field sales reps.</span>
        <div className="flex gap-6">
          <a href="/login" className="hover:text-slate-300 transition-colors">Sign in</a>
          <a href="/signup" className="hover:text-slate-300 transition-colors">Sign up</a>
        </div>
      </footer>
    </div>
  );
}
