/**
 * Mailer — Resend API (primary) with SMTP fallback.
 * Circuit breaker opens after 5 consecutive failures, resets after 60s.
 * Logs only message-id metadata, never email content or addresses.
 */

const { validateBccEmail } = require('./crmExporter');

const CB = { failures: 0, openUntil: 0, THRESHOLD: 5, RESET_MS: 60_000 };

function circuitOpen() {
  if (CB.openUntil && Date.now() < CB.openUntil) return true;
  if (CB.openUntil && Date.now() >= CB.openUntil) { CB.failures = 0; CB.openUntil = 0; }
  return false;
}

function recordFailure() {
  CB.failures += 1;
  if (CB.failures >= CB.THRESHOLD) CB.openUntil = Date.now() + CB.RESET_MS;
}

async function sendViaResend({ from, to, subject, html, text }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || 'Resend error'), { code: data.name });
  return { messageId: data.id };
}

async function sendViaSMTP({ from, to, subject, html, text }) {
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: true },
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  });
  const info = await transport.sendMail({ from, to, subject, html, text });
  return { messageId: info.messageId };
}

async function sendMail({ to, subject, html, text, retry = 0 }) {
  if (!validateBccEmail(to)) throw new Error('Invalid or unsafe recipient address');
  if (circuitOpen()) throw new Error('Mail circuit breaker open — too many consecutive failures');

  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    throw new Error('No mail transport configured. Set RESEND_API_KEY or SMTP_HOST.');
  }

  const from = process.env.FROM_EMAIL || 'SalesFlow CRM <hello@aussieinnovationfactory.com>';

  try {
    const result = process.env.RESEND_API_KEY
      ? await sendViaResend({ from, to, subject, html, text })
      : await sendViaSMTP({ from, to, subject, html, text });

    CB.failures = 0;
    console.log('[mailer] sent messageId=%s', result.messageId);
    return { ok: true, messageId: result.messageId };
  } catch (err) {
    recordFailure();
    const code = err.code || 'UNKNOWN';
    console.error('[mailer] send failed code=%s attempt=%d', code, retry + 1);
    if (retry < 2) {
      await new Promise(r => setTimeout(r, Math.pow(2, retry) * 2000));
      return sendMail({ to, subject, html, text, retry: retry + 1 });
    }
    throw err;
  }
}

async function sendCrmActivityLog({ to, subject, html, text }) {
  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendCrmActivityLog };
