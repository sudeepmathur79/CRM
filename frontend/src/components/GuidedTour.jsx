import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Sparkles, LayoutDashboard, Users, Columns, MessageSquare, Settings, BarChart2 } from 'lucide-react';

const TOUR_KEY = 'crm_tour_done';

const STEPS = [
  {
    route: '/',
    icon: Sparkles,
    title: 'Welcome to the CRM demo 👋',
    body: "You're looking at a fully-loaded demo with real pipeline data, AI analysis, team conversations, and more. This quick tour takes 2 minutes.",
    tip: null,
    cta: 'Start the tour',
  },
  {
    route: '/',
    icon: LayoutDashboard,
    title: 'Dashboard — your pipeline at a glance',
    body: 'The Overview tab shows live stats: total leads, conversion rate, overdue follow-ups, and total pipeline value. Charts update in real time.',
    tip: '💡 Switch to the Management tab to see AI-powered team insights.',
    cta: 'Next',
  },
  {
    route: '/?tab=mgmt',
    icon: BarChart2,
    title: 'Management view — AI recommendations',
    body: "The Management tab shows per-agent performance (leads, conversion %, pipeline value) alongside AI recommendations based on live data. Stale and unassigned leads are flagged automatically.",
    tip: '💡 Click "Management" tab in the top-right of the dashboard.',
    cta: 'Next',
  },
  {
    route: '/leads',
    icon: Users,
    title: 'Leads — your full pipeline',
    body: 'Search, filter by status, bulk-select, import via CSV, or use Smart Add to paste any text and let AI extract contact details automatically.',
    tip: '💡 Try the ✨ Smart Add button — paste an email, LinkedIn bio, or voice memo and AI creates the lead.',
    cta: 'Next',
  },
  {
    route: '/kanban',
    icon: Columns,
    title: 'Kanban — drag to update status',
    body: 'Every lead is a card. Drag it across columns to move it through the pipeline. Each column shows the total deal value at stake.',
    tip: '💡 Cards show deal value, assigned agent, and next follow-up date.',
    cta: 'Next',
  },
  {
    route: '/leads',
    icon: Users,
    title: 'Lead detail — full deal context',
    body: "Click any lead to see its full timeline: notes, AI-generated call summaries, recordings, activity history, and a direct message button to the assigned agent.",
    tip: '💡 Open the Michael Torres lead — it has an AI call summary and a deal thread in messages.',
    cta: 'Next',
  },
  {
    route: '/inbox',
    icon: MessageSquare,
    title: 'Messages — deal threads',
    body: "Team conversations are grouped by deal. Every message sent from inside a lead stays attached to that deal thread — no context lost. @ mention teammates to loop them in.",
    tip: '💡 Open the conversation with James Miller to see a live deal thread for NovaTech Solutions.',
    cta: 'Next',
  },
  {
    route: '/settings',
    icon: Settings,
    title: "That's the tour! 🎉",
    body: "You've seen the main features. Settings lets you manage your profile, switch dark/light mode, and (as admin) manage team members. Any questions — just reply to the demo link.",
    tip: null,
    cta: 'Close tour',
  },
];

export default function GuidedTour() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Show tour if not yet completed and not on login/setup page
    const done = localStorage.getItem(TOUR_KEY);
    const onAuth = location.pathname === '/login' || location.pathname === '/setup';
    if (!done && !onAuth) setVisible(true);
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, 'true');
    setVisible(false);
  };

  const go = (nextStep) => {
    setStep(nextStep);
    const target = STEPS[nextStep].route;
    // Navigate, but strip query params — we just tell the user what to click
    navigate(target.split('?')[0]);
  };

  const handleNext = () => {
    if (isLast) { dismiss(); return; }
    go(step + 1);
  };

  const handlePrev = () => { if (!isFirst) go(step - 1); };

  return (
    <>
      {/* Semi-transparent backdrop — subtle, doesn't block interaction */}
      <div className="fixed inset-0 z-40 pointer-events-none" style={{ background: 'rgba(0,0,0,0.15)' }} />

      {/* Tour card — bottom centre on mobile, bottom-right on desktop */}
      <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 dark:bg-slate-700">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="text-xs text-gray-400">{step + 1} of {STEPS.length}</div>
              </div>
              <button onClick={dismiss} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-base mb-1.5">{current.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{current.body}</p>

            {current.tip && (
              <div className="mt-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                {current.tip}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Skip tour
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button onClick={handlePrev}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <ChevronLeft size={15} /> Back
                  </button>
                )}
                <button onClick={handleNext}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white transition-colors">
                  {current.cta} {!isLast && <ChevronRight size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-2">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-primary-500 w-4' : 'bg-gray-300 dark:bg-slate-600'}`} />
          ))}
        </div>
      </div>
    </>
  );
}

// Re-launch button shown in Settings for demo exploration
export function TourLauncher() {
  return (
    <button
      onClick={() => { localStorage.removeItem(TOUR_KEY); window.location.reload(); }}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-600 dark:text-gray-400">
      <Sparkles size={16} className="text-violet-500" />
      Restart guided tour
    </button>
  );
}
