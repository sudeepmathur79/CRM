/**
 * Smoke test — 1 VU, 30 seconds.
 * Validates core paths are reachable and responding within SLA.
 * Run against staging before every production deploy.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration', true);
const leadsApiDuration = new Trend('leads_api_duration', true);

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],          // <1% errors
    http_req_duration: ['p(95)<2000'],       // 95th percentile < 2s
    login_duration: ['p(95)<3000'],          // login < 3s
    leads_api_duration: ['p(95)<1500'],      // leads API < 1.5s
    errors: ['rate<0.05'],
  },
};

const BASE = __ENV.STAGING_URL || __ENV.TARGET_URL || 'https://crm-mjky.onrender.com';
const EMAIL = __ENV.STAGING_EMAIL || __ENV.TEST_EMAIL || 'gopal2@crm.com';
const PASSWORD = __ENV.STAGING_PASSWORD || __ENV.TEST_PASSWORD || 'gopal_user';

export default function () {
  // 1. Health — static asset load
  const home = http.get(`${BASE}/`);
  check(home, { 'homepage 200': r => r.status === 200 });
  errorRate.add(home.status !== 200);

  // 2. API config endpoint
  const config = http.get(`${BASE}/api/config`);
  check(config, {
    'config 200': r => r.status === 200,
    'config has turnstile key': r => JSON.parse(r.body).turnstileSiteKey !== null,
  });

  // 3. Login
  const loginStart = Date.now();
  const login = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, captchaToken: __ENV.K6_BYPASS_TOKEN || 'k6-nfr-bypass-2026' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  loginDuration.add(Date.now() - loginStart);

  const loggedIn = check(login, {
    'login 200': r => r.status === 200,
    'login returns accessToken': r => {
      try { return !!JSON.parse(r.body).accessToken; } catch { return false; }
    },
  });
  errorRate.add(!loggedIn);

  if (!loggedIn) { sleep(1); return; }

  const { accessToken } = JSON.parse(login.body);
  const authHeaders = { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } };

  // 4. Leads API
  const leadsStart = Date.now();
  const leads = http.get(`${BASE}/api/leads`, authHeaders);
  leadsApiDuration.add(Date.now() - leadsStart);
  check(leads, { 'leads API 200 or 403': r => [200, 403].includes(r.status) });

  // 5. Org endpoint
  const org = http.get(`${BASE}/api/org`, authHeaders);
  check(org, { 'org API 200': r => r.status === 200 });

  // 6. Messages unread
  const msgs = http.get(`${BASE}/api/messages/unread-count`, authHeaders);
  check(msgs, { 'messages API responds': r => r.status < 500 });

  sleep(1);
}
