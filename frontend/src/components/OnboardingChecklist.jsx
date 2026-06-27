import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { onboardingApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function OnboardingChecklist() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);
  const isAgent = user?.role === 'agent';

  useEffect(() => {
    onboardingApi.status()
      .then(r => setData(r.data))
      .catch(() => {}); // silently ignore — checklist is non-critical
  }, []);

  async function handleDismiss() {
    setHidden(true);
    try { await onboardingApi.dismiss(); } catch {}
  }

  useEffect(() => {
    if (data?.allDone && !data?.dismissed) {
      const t = setTimeout(() => handleDismiss(), 3000);
      return () => clearTimeout(t);
    }
  }, [data?.allDone]);

  if (!data || data.dismissed || hidden) return null;

  // Filter out adminOnly steps for agents
  const visibleSteps = data.steps.filter(s => !(s.adminOnly && isAgent));
  const doneCount = visibleSteps.filter(s => s.done).length;
  const total = visibleSteps.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  function StepAction({ step }) {
    if (step.done) return null;
    if (step.id === 'add_lead')
      return <Link to="/leads" className="text-xs text-indigo-500 hover:underline ml-auto flex-shrink-0">Add lead</Link>;
    if (step.id === 'voice_capture')
      return (
        <button
          onClick={() => window.__openVoiceCapture?.()}
          className="text-xs text-indigo-500 hover:underline ml-auto flex-shrink-0"
        >
          Open
        </button>
      );
    if (step.id === 'invite_teammate')
      return <Link to="/settings" className="text-xs text-indigo-500 hover:underline ml-auto flex-shrink-0">Invite</Link>;
    if (step.id === 'connect_crm')
      return <Link to="/settings" className="text-xs text-indigo-500 hover:underline ml-auto flex-shrink-0">Connect</Link>;
    return null;
  }

  return (
    <div className="w-full sm:max-w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold">Get started</span>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 -mr-1"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      {data.allDone ? (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">You're all set! 🎉</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-2">{doneCount}/{total} complete</p>
          <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5 mb-3">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <ul className="space-y-2">
            {visibleSteps.map(step => (
              <li key={step.id} className="flex items-center gap-2">
                {step.done
                  ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  : <Circle size={16} className="text-gray-300 dark:text-slate-500 flex-shrink-0" />
                }
                <span className={`text-xs flex-1 ${step.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {step.label}
                </span>
                <StepAction step={step} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
