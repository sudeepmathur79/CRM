/**
 * Stress test — ramp beyond expected capacity to find the breaking point.
 * Goal: identify at what VU count error rate exceeds 5% or p95 > 5s.
 * Run manually (not in CI). Expect failures — that's the point.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('response_time', true);

export const options = {
  stages: [
    { duration: '2m',  target: 20  },
    { duration: '2m',  target: 50  },
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 150 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 0   },  // recovery
  ],
  thresholds: {
    // Informational only — we expect these to fail at high VU count
    http_req_failed: ['rate<0.50'],  // fail test if >50% errors (total collapse)
  },
};

const BASE = __ENV.TARGET_URL || 'https://crm-staging.onrender.com';

export default function () {
  const t0 = Date.now();
  const r = http.get(`${BASE}/api/config`);
  latency.add(Date.now() - t0);
  errorRate.add(r.status !== 200);
  check(r, { 'status ok': res => res.status < 500 });
  sleep(1);
}
