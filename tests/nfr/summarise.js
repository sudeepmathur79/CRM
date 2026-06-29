#!/usr/bin/env node
/**
 * Parse k6 JSON output and produce a GitHub Actions step summary.
 * Usage: node tests/nfr/summarise.js <k6-output.json>
 */
const fs = require('fs');
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.log('No k6 results file found'); process.exit(0); }

const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
const metrics = {};

for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'Point' && obj.metric) {
      if (!metrics[obj.metric]) metrics[obj.metric] = [];
      metrics[obj.metric].push(obj.data.value);
    }
  } catch {}
}

function percentile(arr, p) {
  if (!arr?.length) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}

function avg(arr) {
  if (!arr?.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

const dur = metrics['http_req_duration'] || [];
const failed = metrics['http_req_failed'] || [];
const reqs = metrics['http_reqs'] || [];

const errorPct = failed.length ? (failed.filter(v => v === 1).length / failed.length * 100).toFixed(2) : '0.00';
const totalReqs = reqs.length;

const p50 = percentile(dur, 50);
const p95 = percentile(dur, 95);
const p99 = percentile(dur, 99);
const avgDur = avg(dur);

const nfrPass = p95 < 1500 && parseFloat(errorPct) < 1;

console.log(`## NFR Test Results\n`);
console.log(`| Metric | Value | Target | Status |`);
console.log(`|--------|-------|--------|--------|`);
console.log(`| Total requests | ${totalReqs} | — | — |`);
console.log(`| Error rate | ${errorPct}% | <1% | ${parseFloat(errorPct) < 1 ? '✅' : '❌'} |`);
console.log(`| p50 latency | ${p50}ms | — | — |`);
console.log(`| p95 latency | ${p95}ms | <1500ms | ${p95 < 1500 ? '✅' : '❌'} |`);
console.log(`| p99 latency | ${p99}ms | <3000ms | ${p99 < 3000 ? '✅' : '❌'} |`);
console.log(`| Avg latency | ${avgDur}ms | — | — |`);
console.log(`\n**Overall: ${nfrPass ? '✅ PASS' : '❌ FAIL'}**`);
