import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Zap, CheckCircle2, Mail } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

const SITEKEY = window.__APP_CONFIG__?.turnstileSiteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

const PERKS = [
  'AI agents that qualify and coach — on day one',
  'Voice capture in the field → lead updated instantly',
  'Follow-up reminders so no deal goes cold',
  'Pipeline visibility your team has never had',
  'Free for 30 days — no card required',
];

function VerificationSent({ email, onResend }) {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
        <Mail size={28} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Check your inbox</h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
        We sent a verification link to <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
        Click it to activate your account.
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Can't find it? Check your spam folder.
      </p>
      {resent ? (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Verification email resent!</p>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      <div className="pt-2">
        <Link to="/login" className="text-sm text-slate-500 hover:underline dark:text-slate-400">
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function Signup() {
  const [form, setForm] = useState({ orgName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.orgName || !form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (SITEKEY && !captchaToken) {
      setError('Please complete the CAPTCHA');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.signup({ ...form, captchaToken });
      if (data.requiresVerification) {
        setVerificationEmail(data.email);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Signup failed');
      turnstileRef.current?.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: value prop */}
      <div className="hidden lg:flex flex-col justify-center px-12 w-5/12 bg-slate-900 text-white">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">SalesFlow CRM</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight mb-4">
          Your sales team,<br />supercharged by AI.
        </h1>
        <p className="text-slate-400 text-lg mb-10">
          Set up in minutes. Start seeing results on day one.
        </p>
        <ul className="space-y-4">
          {PERKS.map((p, i) => (
            <li key={i} className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300 text-sm">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: form or verification screen */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 bg-white dark:bg-slate-900">
        <div className="max-w-md w-full mx-auto">

          {verificationEmail ? (
            <VerificationSent email={verificationEmail} />
          ) : (
            <>
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white">SalesFlow CRM</span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Start your free trial</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                30 days free · No credit card · Cancel anytime
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organisation name
                  </label>
                  <input
                    type="text"
                    placeholder="Acme Sales Ltd"
                    value={form.orgName}
                    onChange={set('orgName')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your name</label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={set('name')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work email</label>
                  <input
                    type="email"
                    placeholder="jane@acme.com"
                    value={form.email}
                    onChange={set('email')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={set('password')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {SITEKEY && (
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={SITEKEY}
                    onSuccess={setCaptchaToken}
                    onExpire={() => setCaptchaToken('')}
                    options={{ theme: 'auto' }}
                  />
                )}

                {error && (
                  <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                >
                  {loading ? 'Creating your workspace…' : 'Start free trial →'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Sign in</Link>
              </p>

              <p className="mt-4 text-center text-xs text-slate-400">
                By signing up you agree to our{' '}
                <Link to="/terms" className="hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy" className="hover:underline">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
