import { useState, useEffect } from 'react';

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

  const reject = () => {
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
      aria-modal="true"
    >
      <div
        className="max-w-4xl mx-auto rounded-2xl shadow-2xl"
        style={{ background: ink }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 px-6 py-5">

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1" style={{ color: bg }}>This website uses cookies</p>
            <p className="text-sm leading-relaxed" style={{ color: bg + 'aa' }}>
              We use strictly necessary cookies to operate the service and, with your consent, analytics cookies to understand how visitors use SalesFlow so we can improve it. We do not use advertising or tracking cookies.{' '}
              <a href="/privacy#cookies" className="underline decoration-dotted" style={{ color: terra }}>Cookie policy</a>
            </p>
          </div>

          {/* Actions — reject must be equally prominent per ICO guidance */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={reject}
              className="text-sm px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all text-center"
              style={{ background: bg + '12', color: bg, border: `1.5px solid ${bg}25` }}
            >
              Reject non-essential
            </button>
            <button
              onClick={accept}
              className="text-sm px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all text-center"
              style={{ background: terra, color: '#fff' }}
            >
              Accept all cookies
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
