/**
 * Mailer — transactional email via Nodemailer (SMTP) or Resend SDK.
 *
 * Agent A (AppSec): validates recipient, enforces TLS, rejects header injection.
 * Agent B (SOC 2): logs only non-PII metadata (message-id, status code).
 * Agent C (NFR): 10s timeout per send; exponential retry ×2; circuit breaker
 *   opens after 5 consecutive failures and resets after 60s.
 */

const nodemailer = require('nodemailer');
const { validateBccEmail } = require('./crmExporter');

// ── Circuit breaker state ────────────────────────────────────────────────────
const CB = { failures: 0, openUntil: 0, THRESHOLD: 5, RESET_MS: 60_000 };

function circuitOpen() {
  if (CB.openUntil && Date.now() < CB.openUntil) return true;
  if (CB.openUntil && Date.now() >= CB.openUntil) {
    CB.failures = 0; CB.openUntil = 0; // half-open: allow next attempt
  }
  return false;
}

function recordFailure() {
  CB.failures += 1;
  if (CB.failures >= CB.THRESHOLD) CB.openUntil = Date.now() + CB.RESET_MS;
}

// ── Transport factory ────────────────────────────────────────────────────────
let _transport = null;

function getTransport() {
  if (_transport) return _transport;

  if (process.env.RESEND_API_KEY) {
    // Resend via SMTP relay (no SDK needed — works with Nodemailer)
    _transport = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY },
    });
  } else if (process.env.SMTP_HOST) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: true }, // enforce TLS (Agent A)
      connectionTimeout: 10_000,
      socketTimeout: 10_000,
    });
  } else {
    throw new Error('No mail transport configured. Set RESEND_API_KEY or SMTP_HOST.');
  }

  return _transport;
}

/**
 * Send a single transactional email.
 * @param {object} opts
 * @param {string} opts.to       - Recipient email (validated)
 * @param {string} opts.subject  - Subject line
 * @param {string} opts.html     - HTML body
 * @param {string} opts.text     - Plain-text fallback
 * @param {number} [opts.retry]  - Current retry attempt (internal)
 */
async function sendMail({ to, subject, html, text, retry = 0 }) {
  // Agent A: re-validate at send time
  if (!validateBccEmail(to)) {
    throw new Error('Invalid or unsafe recipient address');
  }

  // Agent C: circuit breaker
  if (circuitOpen()) {
    throw new Error('Mail circuit breaker open — too many consecutive failures');
  }

  const from = process.env.FROM_EMAIL || 'SalesFlow CRM <noreply@salesflow.app>';

  try {
    const transport = getTransport();
    const info = await transport.sendMail({ from, to, subject, html, text });
    CB.failures = 0; // reset on success
    // Agent B: log only message-id, never email content or addresses
    console.log('[mailer] sent messageId=%s', info.messageId);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    recordFailure();
    // Agent B: log error code only, never the full err.message which may contain addresses
    const code = err.code || err.responseCode || 'UNKNOWN';
    console.error('[mailer] send failed code=%s attempt=%d', code, retry + 1);

    // Exponential retry ×2 with 2s base
    if (retry < 2) {
      const delay = Math.pow(2, retry) * 2000;
      await new Promise(r => setTimeout(r, delay));
      return sendMail({ to, subject, html, text, retry: retry + 1 });
    }
    throw err;
  }
}

/**
 * Send a CRM activity log email to the user's BCC pipeline address.
 */
async function sendCrmActivityLog({ to, subject, html, text }) {
  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendCrmActivityLog };
