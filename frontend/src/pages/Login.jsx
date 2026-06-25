import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { authApi } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Shield, ArrowLeft } from 'lucide-react';

// ── 2FA code entry step ───────────────────────────────────────────────────────
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

// ── Main login form ───────────────────────────────────────────────────────────
function LoginForm({ onTwoFactor }) {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.setup({}).catch(e => {
      if (e.response?.status === 400) navigate('/setup');
    });
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result?.requiresTwoFactor) {
        onTwoFactor(result.tempToken);
      } else {
        navigate('/');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async ({ credential }) => {
    try {
      await googleLogin(credential);
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Google sign-in failed');
    }
  };

  return (
    <div className="space-y-5">
      {/* Google Sign-In — only rendered when GoogleOAuthProvider is mounted (clientId exists) */}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google sign-in failed')}
          theme="outline"
          size="large"
          width="360"
          text="signin_with"
          shape="rectangular"
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
        <span className="text-xs text-gray-400">or sign in with password</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-slate-600" />
      </div>

      {/* Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="you@example.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            type="password"
            {...register('password', { required: 'Password is required' })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="••••••••"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [tempToken, setTempToken] = useState(null); // set when 2FA step required

  const inner = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">CRM</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {tempToken ? 'Verify your identity' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          {tempToken ? (
            <TwoFactorStep
              tempToken={tempToken}
              onBack={() => setTempToken(null)}
              onSuccess={() => navigate('/')}
            />
          ) : (
            <LoginForm onTwoFactor={setTempToken} />
          )}
        </div>
      </div>
    </div>
  );

  return inner;
}
