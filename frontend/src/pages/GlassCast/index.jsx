import { useState } from 'react';
import { ArrowRight, ArrowLeft, Eye, Mic, Zap, Radio, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const bg = '#FAF6EF';
const ink = '#2B2A28';
const terra = '#c65f2f';
const inkFaint = ink + '18';

function GlassCastLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ink }}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
          <path d="M4 22 L9 12 L13 18 L17 10 L23 22" stroke={bg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="23" cy="22" r="2" fill={terra}/>
        </svg>
      </div>
      <div>
        <span className="font-bold tracking-tight text-lg" style={{ color: ink }}>
          Glass<span style={{ color: terra }}>Cast</span>
        </span>
        <span className="text-xs ml-2 font-medium" style={{ color: ink + '60' }}>by SalesFlow</span>
      </div>
    </div>
  );
}

// ── Meeting scene illustration ───────────────────────────────────────────────
function MeetingScene() {
  return (
    <div className="relative w-full max-w-2xl mx-auto select-none">
      <svg viewBox="0 0 560 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
        {/* Room / table */}
        <ellipse cx="280" cy="230" rx="220" ry="40" fill={ink} opacity="0.06"/>
        <rect x="80" y="200" width="400" height="16" rx="8" fill={ink} opacity="0.10"/>

        {/* Person left (client) — silhouette */}
        <ellipse cx="155" cy="188" rx="28" ry="28" fill={ink} opacity="0.10"/>
        <rect x="127" y="200" width="56" height="70" rx="28" fill={ink} opacity="0.08"/>

        {/* Person right (user with glasses) — slightly larger / focal */}
        <ellipse cx="405" cy="182" rx="32" ry="32" fill={terra} opacity="0.18"/>
        {/* Glasses on face */}
        <rect x="380" y="170" width="50" height="22" rx="10" fill="none" stroke={ink} strokeWidth="3.5" opacity="0.7"/>
        <path d="M405 181 L405 181" stroke={ink} strokeWidth="3.5" strokeLinecap="round" opacity="0.5"/>
        {/* Left lens */}
        <rect x="382" y="172" width="21" height="18" rx="8" fill={ink} opacity="0.5"/>
        {/* Right lens */}
        <rect x="407" y="172" width="21" height="18" rx="8" fill={ink} opacity="0.5"/>
        {/* Nose bridge */}
        <path d="M403 181 L408 181" stroke={ink} strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        {/* Body */}
        <rect x="373" y="214" width="64" height="80" rx="32" fill={terra} opacity="0.12"/>

        {/* HUD overlay — floating from glasses */}
        <rect x="240" y="80" width="190" height="100" rx="12" fill={ink} opacity="0.88"/>
        <rect x="240" y="80" width="190" height="100" rx="12" fill="none" stroke={terra} strokeWidth="1.5" opacity="0.5"/>
        {/* Connector line from glasses to HUD */}
        <path d="M405 171 Q380 140 430 80" stroke={terra} strokeWidth="1" strokeDasharray="4,3" opacity="0.35"/>
        {/* HUD content */}
        <text x="255" y="100" fontSize="7.5" fill={terra} fontWeight="700" fontFamily="monospace" letterSpacing="1">NEXT: SARAH MITCHELL</text>
        <rect x="255" y="105" width="90" height="2.5" rx="1.25" fill={terra} opacity="0.3"/>
        <text x="255" y="116" fontSize="7" fill="#FAF6EF" fontFamily="monospace" opacity="0.8">Score  9/10  ·  Proposal stage</text>
        <text x="255" y="128" fontSize="7" fill="#f59e0b" fontFamily="monospace" opacity="0.9">⚠  Follow-up overdue 2 days</text>
        <rect x="255" y="134" width="155" height="1" fill="#FAF6EF" opacity="0.1"/>
        <text x="255" y="145" fontSize="7" fill="#FAF6EF" fontFamily="monospace" opacity="0.55">Last: Discussed Q3 budget</text>
        <text x="255" y="155" fontSize="7" fill="#FAF6EF" fontFamily="monospace" opacity="0.4">Acme Corp  ·  £24k deal value</text>
        {/* Live dot */}
        <circle cx="415" cy="90" r="4" fill={terra}>
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="415" cy="90" r="4" fill={terra} opacity="0.3">
          <animate attributeName="r" values="4;9;4" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>

        {/* Speech bubbles between people */}
        <ellipse cx="280" cy="165" rx="55" ry="20" fill={ink} opacity="0.04"/>
        <rect x="240" y="148" width="80" height="28" rx="10" fill="#fff" opacity="0.08"/>

        {/* Caption */}
        <text x="280" y="305" fontSize="9" fill={ink} opacity="0.35" fontFamily="sans-serif" textAnchor="middle">Your pipeline, visible in your field of view · no phone required</text>
      </svg>
    </div>
  );
}

// ── HUD Visualisation ────────────────────────────────────────────────────────
function GlassesHero() {
  return (
    <div className="relative flex items-center justify-center py-8 select-none">
      {/* Glasses SVG */}
      <svg viewBox="0 0 520 200" className="w-full max-w-2xl" xmlns="http://www.w3.org/2000/svg">
        {/* Frame */}
        <rect x="10" y="70" width="220" height="100" rx="50" fill="none" stroke={ink} strokeWidth="8"/>
        <rect x="290" y="70" width="220" height="100" rx="50" fill="none" stroke={ink} strokeWidth="8"/>
        <path d="M230 110 L290 110" stroke={ink} strokeWidth="8" strokeLinecap="round"/>
        {/* Temples */}
        <path d="M10 110 L-10 120" stroke={ink} strokeWidth="6" strokeLinecap="round"/>
        <path d="M510 110 L530 120" stroke={ink} strokeWidth="6" strokeLinecap="round"/>

        {/* Left lens HUD — pipeline data */}
        <rect x="22" y="82" width="196" height="76" rx="42" fill={ink} opacity="0.92"/>
        <text x="42" y="104" fontSize="9" fill={terra} fontWeight="700" fontFamily="monospace" letterSpacing="1">TOP LEADS</text>
        <text x="42" y="120" fontSize="8.5" fill={bg} fontFamily="monospace">Sarah M.  ·  9/10  ●</text>
        <text x="42" y="132" fontSize="8.5" fill={bg + 'bb'} fontFamily="monospace">Priya S.  ·  8/10  ○</text>
        <text x="42" y="144" fontSize="8.5" fill={bg + 'bb'} fontFamily="monospace">James O.  ·  7/10  ○</text>

        {/* Right lens HUD — follow-ups */}
        <rect x="302" y="82" width="196" height="76" rx="42" fill={ink} opacity="0.92"/>
        <text x="322" y="104" fontSize="9" fill={terra} fontWeight="700" fontFamily="monospace" letterSpacing="1">FOLLOW-UPS</text>
        <text x="322" y="120" fontSize="8.5" fill="#f59e0b" fontFamily="monospace">2 overdue  ⚠</text>
        <text x="322" y="132" fontSize="8.5" fill={bg + 'bb'} fontFamily="monospace">Next: Sarah M.</text>
        <text x="322" y="144" fontSize="8.5" fill={bg + '70'} fontFamily="monospace">Today 3pm</text>

        {/* Live indicator */}
        <circle cx="492" cy="88" r="5" fill={terra} opacity="0.9"/>
        <circle cx="492" cy="88" r="5" fill={terra} opacity="0.4">
          <animate attributeName="r" values="5;10;5" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
      </svg>

      {/* Caption */}
      <p className="absolute bottom-0 text-center text-xs font-medium w-full" style={{ color: ink + '50' }}>
        Artist's impression · Ray-Ban Meta compatible
      </p>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // In production this would POST to a waitlist API
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 px-6 py-4 rounded-xl" style={{ background: terra + '15', border: `1.5px solid ${terra}40` }}>
        <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: terra }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: ink }}>You're on the list.</p>
          <p className="text-xs mt-0.5" style={{ color: ink + '70' }}>We'll reach out before anyone else when GlassCast launches.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium outline-none"
        style={{ background: '#fff', border: `1.5px solid ${ink}20`, color: ink }}
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap"
        style={{ background: terra, color: '#fff' }}
      >
        Join waitlist <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}

const TIMELINE = [
  {
    status: 'live',
    label: 'Built',
    title: 'Heads-up display',
    body: 'Real-time pipeline view on Ray-Ban Meta glasses. Top leads by AI score, overdue follow-ups, live clock. Works today for Pro subscribers.',
  },
  {
    status: 'building',
    label: 'In development',
    title: 'Voice capture from glasses',
    body: 'Tap the glasses frame after a meeting. Describe what happened. GlassCast transcribes and pushes the lead update to SalesFlow — no phone required.',
  },
  {
    status: 'planned',
    label: 'Planned',
    title: 'Ambient meeting capture',
    body: 'With consent, GlassCast listens during the conversation and drafts the lead summary automatically. You review and confirm. Your CRM updates before you leave the room.',
  },
  {
    status: 'planned',
    label: 'Planned',
    title: 'Navigation to next lead',
    body: 'GlassCast shows turn-by-turn directions to your next nearby stale lead. Route your day around your pipeline, not the other way around.',
  },
];

const STATUS_STYLE = {
  live: { dot: terra, label: terra, bg: terra + '15' },
  building: { dot: '#f59e0b', label: '#b45309', bg: '#fef3c7' },
  planned: { dot: ink + '50', label: ink + '70', bg: inkFaint },
};

export default function GlassCastPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ background: bg, color: ink }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: bg + 'f0', backdropFilter: 'blur(12px)', borderColor: inkFaint }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <GlassCastLogo />
          <div className="flex items-center gap-4">
            <Link to="/welcome" className="text-sm font-medium flex items-center gap-1.5" style={{ color: ink + '80' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> SalesFlow
            </Link>
            <Link
              to="/signup"
              className="text-sm px-4 py-2 rounded-lg font-semibold"
              style={{ background: ink, color: bg }}
            >
              Start free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6" style={{ background: terra + '15', color: terra }}>
          <Radio className="w-3 h-3" /> Not available yet · Join the waitlist
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6" style={{ color: ink }}>
          Your CRM, in your<br />
          <span style={{ color: terra }}>field of view.</span>
        </h1>

        <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mb-10" style={{ color: ink + 'bb' }}>
          GlassCast brings SalesFlow to your smart glasses. See your pipeline, get follow-up alerts, and capture meetings by voice — without ever touching your phone. Built for people who sell face-to-face.
        </p>

        <WaitlistForm />

        <p className="text-xs mt-4" style={{ color: ink + '60' }}>
          Early access goes to Pro subscribers first. No spam. Unsubscribe any time.
        </p>
      </section>

      {/* Meeting scene */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-3xl p-6 sm:p-10" style={{ background: '#fff', border: `1.5px solid ${inkFaint}` }}>
          <MeetingScene />
        </div>
      </section>

      {/* Glasses visualisation */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-3xl p-8 sm:p-12" style={{ background: '#fff', border: `1.5px solid ${inkFaint}` }}>
          <GlassesHero />
        </div>
      </section>

      {/* The problem */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-2 h-2 rounded-sm rotate-45 mt-2 flex-shrink-0" style={{ background: terra }} />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: ink }}>The problem with phones in meetings</h2>
            <p className="text-base leading-relaxed mb-4" style={{ color: ink + 'bb' }}>
              Every time you pull out your phone during a client conversation, you break the connection. But if you don't update your CRM in the moment, the details go stale — or disappear entirely.
            </p>
            <p className="text-base leading-relaxed" style={{ color: ink + 'bb' }}>
              GlassCast solves this. Your pipeline lives in your peripheral vision. Post-meeting notes are captured by voice on your way to the car. Your CRM stays current without the friction.
            </p>
          </div>
        </div>
      </section>

      {/* What's built vs coming — timeline */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-2 h-2 rounded-sm rotate-45" style={{ background: terra }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: terra }}>Roadmap</span>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-5 bottom-5 w-px" style={{ background: ink + '15' }} />

          <div className="space-y-8">
            {TIMELINE.map((item, i) => {
              const s = STATUS_STYLE[item.status];
              return (
                <div key={i} className="flex gap-6 pl-12 relative">
                  {/* Dot */}
                  <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: s.bg }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
                  </div>
                  <div className="flex-1">
                    <span className="inline-block text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-2" style={{ background: s.bg, color: s.label }}>
                      {item.label}
                    </span>
                    <h3 className="text-base font-bold mb-1" style={{ color: ink }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-y py-16" style={{ borderColor: inkFaint }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-2 h-2 rounded-sm rotate-45" style={{ background: terra }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: terra }}>Built for</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: <Eye className="w-5 h-5" style={{ color: terra }} />, title: 'Field sales', body: "Walk into every meeting knowing your last interaction, deal value, and next step — without looking at your phone." },
              { icon: <Mic className="w-5 h-5" style={{ color: terra }} />, title: 'Consultants', body: "Capture client meetings by voice. No notes. No missed details. Your CRM updates while you drive to the next appointment." },
              { icon: <Zap className="w-5 h-5" style={{ color: terra }} />, title: 'Founders', body: "You're in back-to-back meetings all day. GlassCast keeps your pipeline alive without adding a single task to your to-do list." },
            ].map((u) => (
              <div key={u.title} className="rounded-2xl p-5" style={{ background: '#fff', border: `1.5px solid ${inkFaint}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: terra + '12' }}>
                  {u.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: ink }}>{u.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>{u.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware note */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl p-6 flex gap-4 items-start" style={{ background: inkFaint, border: `1.5px solid ${ink}12` }}>
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: ink + '70' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: ink }}>Hardware requirement</p>
            <p className="text-sm leading-relaxed" style={{ color: ink + 'aa' }}>
              GlassCast is designed for <strong>Ray-Ban Meta smart glasses</strong>. The heads-up display feature requires the Meta View companion app and a SalesFlow Pro subscription. Future support for other smart glasses hardware is planned but not confirmed.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t" style={{ borderColor: inkFaint }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: ink }}>
            Be first when it launches.
          </h2>
          <p className="text-base mb-8" style={{ color: ink + '80' }}>
            GlassCast is in active development. Waitlist members get early access, shaped by their feedback.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: inkFaint }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: ink + '70' }}>
          <GlassCastLogo />
          <span>© 2026 SalesFlow CRM</span>
          <div className="flex gap-6">
            <Link to="/welcome" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>SalesFlow</Link>
            <Link to="/terms" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Terms</Link>
            <Link to="/privacy" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Privacy</Link>
            <a href="mailto:support@aifstud.io" className="hover:opacity-100 transition-opacity" style={{ opacity: 0.6 }}>Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
