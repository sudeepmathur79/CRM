/**
 * Spike test — 0 → 200 VUs in 10 seconds, then back to 0.
 * Simulates a sudden traffic burst (product launch, press mention).
 * Key question: does the app recover after the spike, or does it stay degraded?
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '10s', target: 200 }, // spike
    { duration: '1m',  target: 200 }, // hold spike
    { duration: '10s', target: 0   }, // drop
    { duration: '2m',  target: 10  }, // recovery check at normal load
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],  // tolerate up to 10% during spike
    // Recovery phase (last 2min at 10 VUs) should be fast again
    http_req_duration: ['p(95)<3000'],
  },
};

const BASE = __ENV.TARGET_URL || 'https://crm-staging.onrender.com';

export default function () {
  const r = http.get(`${BASE}/api/config`);
  errorRate.add(r.status !== 200);
  check(r, { 'alive': res => res.status < 500 });
  sleep(1);
}
