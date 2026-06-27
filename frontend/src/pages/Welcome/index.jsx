import { ArrowRight, Check, ChevronDown, Mic, Zap, RefreshCw } from 'lucide-react';

const highlightSignIn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signin') === '1';

const PAIN_POINTS = [
  {
    emoji: '🕐',
    title: 'Sunday night CRM catch-up',
    body: 'The average field rep spends 3.5 hours/week on manual data entry. That\'s 182 hours a year.',
  },
  {
    emoji: '😤',
    title: 'Details forgotten before you\'re back at your desk',
    body: 'Human memory starts degrading within minutes. Your best deals deserve better notes.',
  },
  {
    emoji: '📉',
    title: 'Your pipeline is fiction',
    body: 'CRM data reflects what reps remembered to log — not what actually happened in the field.',
  },
];

const STEPS = [
  {
    icon: <Mic className="w-6 h-6 text-indigo-400" />,
    title: 'Speak',
    body: 'Open fieldlens after a meeting. Tap record. Speak naturally for 30 seconds.',
  },
  {
    icon: <Zap className="w-6 h-6 text-indigo-400" />,
    title: 'Extract',
    body: 'AI pulls out the name, company, deal value, next steps — automatically.',
  },
  {
    icon: <RefreshCw className="w-6 h-6 text-indigo-400" />,
    title: 'Sync',
    body: 'Updates your HubSpot, Salesforce, or internal pipeline. No typing.',
  },
];

const FREE_FEATURES = [
  '10 captures / month',
  'Internal pipeline',
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
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="/" className="flex items-center">
            <img src="/fieldlens-logo.png" alt="fieldlens" className="h-10 w-auto" />
          </a>
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
            <a
              href="/signup"
              className="text-sm bg-white text-slate-900 hover:bg-slate-100 transition-colors px-4 py-2 rounded-lg font-semibold"
            >
              Start free →
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        {/* Logo mark — large in hero */}
        <div className="flex justify-center mb-10">
          <img src="/fieldlens-logo.png" alt="fieldlens" className="h-28 sm:h-36 w-auto" />
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Your meetings, logged.<br className="hidden sm:block" />
          <span className="text-indigo-400"> Automatically.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Speak naturally after every call. fieldlens captures, extracts, and updates your CRM — no typing required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <a
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/30"
          >
            Start free — no credit card
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-500 transition-colors px-7 py-3.5 rounded-xl font-semibold text-base text-slate-300 hover:text-white"
          >
            See how it works
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>
        <p className="text-sm text-slate-500">10 captures free every month. No credit card. No catch.</p>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-slate-800 bg-slate-800/30 py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-400 text-sm">
          Built for <span className="text-white font-medium">field sales reps</span> and <span className="text-white font-medium">SMB owners</span> who sell in the real world, not at a desk
        </div>
      </div>

      {/* Pain section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-slate-100">
          Sound familiar?
        </h2>
        <p className="text-center text-slate-500 mb-12 text-sm">If any of these hit — fieldlens is for you.</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {PAIN_POINTS.map((p) => (
            <div key={p.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="text-3xl mb-4">{p.emoji}</div>
              <h3 className="font-semibold text-base mb-2 text-white leading-snug">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">How it works</h2>
          <p className="text-center text-slate-400 mb-14 text-sm">Three steps. Thirty seconds.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
          Stop losing deals to bad notes.
        </h2>
        <p className="text-slate-400 mb-8">Start capturing in 60 seconds. Free forever for 10 captures a month.</p>
        <a
          href="/signup"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/30"
        >
          Get started free
          <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* Pricing */}
      <section className="bg-slate-800/30 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Simple pricing</h2>
          <p className="text-center text-slate-400 mb-14 text-sm">Start free. Upgrade when you need more.</p>
          <div className="grid sm:grid-cols-3 gap-5 items-start">

            {/* Free */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 flex flex-col">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Free</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold">$0</span>
              </div>
              <div className="text-slate-500 text-sm mb-6">forever</div>
              <ul className="space-y-3 mb-8 flex-1">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/signup" className="w-full text-center border border-slate-600 hover:border-indigo-500 hover:text-white transition-all px-4 py-3 rounded-xl font-semibold text-sm text-slate-300">
                Start free
              </a>
              <p className="text-center text-xs text-slate-500 mt-3">No credit card required</p>
            </div>

            {/* Pro */}
            <div className="bg-indigo-950/60 border-2 border-indigo-500 rounded-2xl p-7 flex flex-col relative shadow-xl shadow-indigo-900/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most popular
                </span>
              </div>
              <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Pro</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="text-slate-400 text-sm mb-1">/seat</span>
              </div>
              <div className="text-slate-400 text-sm mb-6">per month</div>
              <ul className="space-y-3 mb-8 flex-1">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-200">
                    <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/signup" className="w-full text-center bg-indigo-600 hover:bg-indigo-500 transition-colors px-4 py-3 rounded-xl font-semibold text-sm shadow-md">
                Start free trial
              </a>
            </div>

            {/* Premium */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-7 flex flex-col opacity-60">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Premium</div>
              <div className="text-2xl font-extrabold text-slate-300 mb-1">Coming soon</div>
              <div className="text-slate-500 text-sm mb-6">&nbsp;</div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-400"><Check className="w-4 h-4 text-slate-500 flex-shrink-0" />Everything in Pro</li>
                <li className="flex items-center gap-3 text-sm text-slate-400"><Check className="w-4 h-4 text-slate-500 flex-shrink-0" />Hardware bundle included</li>
              </ul>
              <button disabled className="w-full text-center border border-slate-700 px-4 py-3 rounded-xl font-semibold text-sm text-slate-500 cursor-not-allowed">
                Join waitlist
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm border-t border-slate-800">
        <div className="flex items-center gap-3">
          <img src="/fieldlens-logo.png" alt="fieldlens" className="h-6 w-auto opacity-60" />
          <span>© 2026 SalesFlow. Built for field sales reps.</span>
        </div>
        <div className="flex gap-6">
          <a href="/login" className="hover:text-slate-300 transition-colors">Sign in</a>
          <a href="/signup" className="hover:text-slate-300 transition-colors">Sign up</a>
        </div>
      </footer>

    </div>
  );
}
