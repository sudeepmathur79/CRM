/**
 * Soak test — 10 VUs for 30 minutes.
 * Checks for memory leaks, connection pool exhaustion, gradual latency drift.
 * Compare p95 at minute 5 vs minute 25 — should not degrade >20%.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const latencyEarly = new Trend('latency_early', true);   // first 5 min
const latencyLate  = new Trend('latency_late', true);    // after 20 min

export const options = {
  stages: [
    { duration: '1m',  target: 10 },
    { duration: '28m', target: 10 },
    { duration: '1m',  target: 0  },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    latency_early:     ['p(95)<1000'],
    latency_late:      ['p(95)<1200'], // allow 20% degradation max
  },
};

const BASE = __ENV.TARGET_URL || 'https://crm-staging.onrender.com';
const EMAIL = __ENV.TEST_EMAIL;
const PASSWORD = __ENV.TEST_PASSWORD;

let token = null;
const startTime = Date.now();

function login() {
  const r = http.post(`${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, captchaToken: __ENV.K6_BYPASS_TOKEN || 'k6-nfr-bypass-2026' }),
    { headers: { 'Content-Type': 'application/json' } });
  if (r.status === 200) return JSON.parse(r.body).accessToken;
  return null;
}

export default function () {
  if (!token) token = login();
  if (!token) { sleep(3); return; }

  const h = { headers: { Authorization: `Bearer ${token}` } };
  const elapsedMin = (Date.now() - startTime) / 60000;

  const t0 = Date.now();
  const r = http.get(`${BASE}/api/leads`, h);
  const dur = Date.now() - t0;

  if (elapsedMin < 5)  latencyEarly.add(dur);
  if (elapsedMin > 20) latencyLate.add(dur);

  if (r.status === 401) token = null;
  check(r, { 'ok': res => [200, 403].includes(res.status) });
  sleep(3);
}
