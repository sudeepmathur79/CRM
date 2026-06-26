import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    // The backend GET /auth/verify-email redirects to /login?verified=1 on success.
    // This page is a fallback in case the redirect doesn't land cleanly.
    // We can also call it directly via the API path.
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    fetch(`${apiBase}/auth/verify-email?token=${encodeURIComponent(token)}`, { redirect: 'follow' })
      .then(res => {
        if (res.ok || res.redirected) {
          setStatus('success');
        } else {
          return res.json().then(d => { throw new Error(d.error || 'Verification failed'); });
        }
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-10 max-w-sm w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto" />
            <p className="text-slate-600 dark:text-slate-300 text-sm">Verifying your email…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 size={48} className="text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email verified!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Your account is now active. You can sign in.</p>
            <Link to="/login" className="inline-block mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Go to login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verification failed</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {message || 'This link is invalid or has already been used.'}
            </p>
            <Link to="/login" className="inline-block mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
