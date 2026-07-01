import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'sf_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'all');
    setVisible(false);
  };

  const essential = () => {
    localStorage.setItem(STORAGE_KEY, 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  const ink = '#2B2A28';
  const bg = '#FAF6EF';
  const terra = '#c65f2f';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl shadow-2xl"
        style={{ background: ink, border: `1.5px solid ${ink}` }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4">
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed" style={{ color: bg + 'cc' }}>
              We use cookies to keep you signed in and to understand how people use SalesFlow (via PostHog analytics). No advertising cookies, ever.{' '}
              <a href="/privacy" className="underline" style={{ color: terra }}>Privacy policy</a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={essential}
              className="text-xs px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all"
              style={{ background: bg + '15', color: bg + 'aa', border: `1px solid ${bg}20` }}
            >
              Essential only
            </button>
            <button
              onClick={accept}
              className="text-xs px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all"
              style={{ background: terra, color: '#fff' }}
            >
              Accept all
            </button>
            <button
              onClick={essential}
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: bg + '10' }}
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" style={{ color: bg + '70' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
