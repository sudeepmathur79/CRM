import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api';
import { Zap, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
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
          <p className="text-gray-500 dark:text-gray-400 text-sm">Reset your password</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <span className="text-2xl">✉️</span>
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Check your inbox</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                If <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span> has an account, you'll receive a reset link shortly. Check your spam folder if it doesn't arrive.
              </p>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline mt-4">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Forgot your password?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors text-sm">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-6 transition-colors">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
