/**
 * Load test — ramp to 20 VUs over 1min, hold 5min, ramp down.
 * Simulates a normal busy day with 20 concurrent users.
 * NFR targets: p95 < 1.5s, error rate < 1%, no memory leak signal.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const authLatency = new Trend('auth_latency', true);
const readLatency = new Trend('read_latency', true);
const writeLatency = new Trend('write_latency', true);
const leadCreated = new Counter('leads_created');

export const options = {
  stages: [
    { duration: '1m',  target: 20 },   // ramp up
    { duration: '5m',  target: 20 },   // hold
    { duration: '30s', target: 0  },   // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    auth_latency:      ['p(95)<2000'],
    read_latency:      ['p(95)<1000'],
    write_latency:     ['p(95)<2000'],
    errors:            ['rate<0.01'],
  },
};

const BASE = __ENV.TARGET_URL || 'https://crm-staging.onrender.com';
const EMAIL = __ENV.TEST_EMAIL || 'gopal2@crm.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'gopal_user';

// Shared token cache — login once per VU iteration cycle
let token = null;

function login() {
  const t0 = Date.now();
  const r = http.post(
    `${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD, captchaToken: __ENV.K6_BYPASS_TOKEN || 'k6-nfr-bypass-2026' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  authLatency.add(Date.now() - t0);
  if (r.status === 200) {
    try { return JSON.parse(r.body).accessToken; } catch {}
  }
  errorRate.add(1);
  return null;
}

export default function () {
  if (!token) token = login();
  if (!token) { sleep(2); return; }

  const h = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

  group('read operations', () => {
    const t0 = Date.now();
    const leads = http.get(`${BASE}/api/leads?limit=20`, h);
    readLatency.add(Date.now() - t0);
    const ok = check(leads, { 'leads list ok': r => [200, 403].includes(r.status) });
    errorRate.add(!ok);

    if (leads.status === 401) { token = null; return; } // token expired

    const t1 = Date.now();
    http.get(`${BASE}/api/org`, h);
    readLatency.add(Date.now() - t1);

    const t2 = Date.now();
    http.get(`${BASE}/api/messages/unread-count`, h);
    readLatency.add(Date.now() - t2);
  });

  sleep(Math.random() * 2 + 1); // 1-3s think time between page actions

  group('write operations', () => {
    // Create a lead (1 in 5 iterations to avoid flooding DB)
    if (Math.random() < 0.2) {
      const t0 = Date.now();
      const r = http.post(
        `${BASE}/api/leads`,
        JSON.stringify({ name: `Load Test Lead ${Date.now()}`, email: `lt${Date.now()}@test.com`, stage: 'new' }),
        h
      );
      writeLatency.add(Date.now() - t0);
      if (r.status === 201) leadCreated.add(1);
      if (r.status === 401) token = null;
    }
  });

  sleep(Math.random() * 3 + 2); // 2-5s between full iterations
}
