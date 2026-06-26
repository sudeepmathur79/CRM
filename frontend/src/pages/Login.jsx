import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft, Zap } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

// Site key fetched at runtime from backend so it doesn't need to be baked into the Docker image
const SITEKEY = window.__APP_CONFIG__?.turnstileSiteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

function TwoFactorStep({ tempToken, onBack, onSuccess }) {
  const { verify2FA } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await verify2FA({ tempToken, code });
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code');
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <Shield size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">Two-factor authentication</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Enter the 6-digit code from your authenticator app</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full text-center text-2xl tracking-[0.4em] font-mono px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button type="submit" disabled={code.length !== 6 || loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
        <ArrowLeft size={14} /> Back to login
      </button>
    </div>
  );
}

function UnverifiedEmail({ email, onBack }) {
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification(email);
      setResent(true);
    } catch {
      toast.error('Failed to resend. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3">
        Please verify your email address before logging in.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        We sent a verification link to <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>.
      </p>
      {resent ? (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Verification email resent!</p>
      ) : (
        <button onClick={handleResend} disabled={resending}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mx-auto transition-colors">
        <ArrowLeft size={14} /> Back to login
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);

  const justVerified = searchParams.get('verified') === '1';

  useEffect(() => {
    authApi.setup({}).catch(e => {
      if (e.response?.status === 400) navigate('/setup');
    });
  }, []);

  const onSubmit = async (data) => {
    const token = captchaToken || turnstileRef.current?.getResponse() || '';
    if (SITEKEY && !token) {
      toast.error('Please complete the CAPTCHA');
      return;
    }
    setLoading(true);
    try {
      const result = await login({ ...data, captchaToken: token });
      if (result?.requiresTwoFactor) {
        setTempToken(result.tempToken);
      } else {
        navigate('/');
      }
    } catch (e) {
      const err = e.response?.data;
      if (err?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(err.email || getValues('email'));
      } else {
        toast.error(err?.error || 'Login failed');
      }
      turnstileRef.current?.reset();
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">SalesFlow CRM</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            {tempToken ? 'Verify your identity' : unverifiedEmail ? 'Email not verified' : 'Sign in to your account'}
          </p>
        </div>

        {justVerified && !tempToken && !unverifiedEmail && (
          <div className="mb-4 text-center text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-3">
            Email verified! You can now sign in.
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          {tempToken ? (
            <TwoFactorStep
              tempToken={tempToken}
              onBack={() => setTempToken(null)}
              onSuccess={() => navigate('/')}
            />
          ) : unverifiedEmail ? (
            <UnverifiedEmail email={unverifiedEmail} onBack={() => setUnverifiedEmail(null)} />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" {...register('email', { required: 'Email is required' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="you@example.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <Link to="/forgot-password" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input type="password" {...register('password', { required: 'Password is required' })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="••••••••" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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

              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Start free trial</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
