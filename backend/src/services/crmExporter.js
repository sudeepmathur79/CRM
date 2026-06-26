/**
 * CRM Exporter — formats AI-generated capture payloads into professional
 * HTML activity logs suitable for HubSpot, Salesforce, Zoho BCC pipelines.
 *
 * Security: no PII written to console logs (Agent B — SOC 2).
 * Performance: pure synchronous transformation, no I/O (Agent C).
 */

const CRM_TYPES = ['HUBSPOT', 'SALESFORCE', 'ZOHO', 'OTHER'];

/**
 * Validate that a string is a safe BCC email address.
 * Rejects anything with injection characters.
 */
function validateBccEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  // RFC 5321 + reject header-injection chars
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email) &&
    !/[\r\n\t]/.test(email);
}

/**
 * Escape HTML special characters to prevent XSS in email bodies.
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Format a capture payload into a professional HTML email body.
 *
 * @param {object} opts
 * @param {object} opts.lead        - { name, company, status, value }
 * @param {object} opts.capture     - { transcript, summary, nextSteps, agentName, recordedAt }
 * @param {object} opts.agent       - { name, email }
 * @param {string} opts.crmType     - One of CRM_TYPES
 * @param {string} opts.appUrl      - Public URL of the CRM app
 * @returns {object}                - { subject, html, text }
 */
function formatActivityLog({ lead, capture, agent, crmType = 'OTHER', appUrl = '' }) {
  const recordedAt = capture.recordedAt
    ? new Date(capture.recordedAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })
    : new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

  const leadName = esc(lead?.name || 'Unknown Lead');
  const company = esc(lead?.company || '');
  const status = esc(lead?.status || '');
  const agentName = esc(agent?.name || 'Agent');
  const summary = esc(capture.summary || '');
  const transcript = esc(capture.transcript || '');

  // Parse nextSteps — could be a string or array
  let nextStepsHtml = '';
  if (capture.nextSteps) {
    const steps = Array.isArray(capture.nextSteps)
      ? capture.nextSteps
      : String(capture.nextSteps).split('\n').filter(Boolean);
    nextStepsHtml = steps.map(s => `<li style="margin:4px 0;">${esc(s.replace(/^[\d\.\-\*]\s*/, ''))}</li>`).join('');
  }

  const subject = `[Sales Capture] ${lead?.name || 'Lead'} — ${company || recordedAt}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:20px 28px;">
            <p style="margin:0;font-size:11px;color:#c7d2fe;letter-spacing:1px;text-transform:uppercase;">Sales Activity Log</p>
            <h1 style="margin:4px 0 0;font-size:20px;color:#ffffff;font-weight:700;">${leadName}${company ? ` &mdash; ${company}` : ''}</h1>
          </td>
        </tr>

        <!-- Meta row -->
        <tr>
          <td style="background:#f8fafc;padding:12px 28px;border-bottom:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#64748b;">
                  📅 <strong>${esc(recordedAt)}</strong>
                  &nbsp;&nbsp;|&nbsp;&nbsp;
                  👤 Logged by <strong>${agentName}</strong>
                  ${status ? `&nbsp;&nbsp;|&nbsp;&nbsp; 🏷️ <strong>${status}</strong>` : ''}
                  ${lead?.value ? `&nbsp;&nbsp;|&nbsp;&nbsp; 💰 <strong>$${Number(lead.value).toLocaleString()}</strong>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Summary -->
        ${summary ? `
        <tr>
          <td style="padding:20px 28px 0;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#4f46e5;text-transform:uppercase;letter-spacing:1px;">Summary</p>
            <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.6;">${summary}</p>
          </td>
        </tr>` : ''}

        <!-- Next Steps -->
        ${nextStepsHtml ? `
        <tr>
          <td style="padding:16px 28px 0;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">Next Steps</p>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:#1e293b;line-height:1.5;">
              ${nextStepsHtml}
            </ul>
          </td>
        </tr>` : ''}

        <!-- Transcript -->
        ${transcript ? `
        <tr>
          <td style="padding:16px 28px 0;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Transcript</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;font-size:12px;color:#475569;line-height:1.7;max-height:200px;overflow:hidden;">
              ${transcript.length > 800 ? transcript.slice(0, 800) + '…' : transcript}
            </div>
          </td>
        </tr>` : ''}

        <!-- Footer -->
        <tr>
          <td style="padding:20px 28px;border-top:1px solid #e2e8f0;margin-top:16px;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              Auto-logged via SalesFlow CRM Context-Capture
              ${appUrl ? ` &mdash; <a href="${esc(appUrl)}" style="color:#4f46e5;">View in CRM</a>` : ''}
              &mdash; ${crmType !== 'OTHER' ? `Forwarded to ${esc(crmType)}` : 'Saved to pipeline'}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Plain-text fallback
  const text = [
    `SALES ACTIVITY LOG`,
    `==================`,
    `Lead: ${lead?.name || ''}${company ? ` (${company})` : ''}`,
    `Date: ${recordedAt}`,
    `Logged by: ${agent?.name || ''}`,
    status ? `Status: ${status}` : '',
    lead?.value ? `Value: $${Number(lead.value).toLocaleString()}` : '',
    '',
    summary ? `SUMMARY\n${capture.summary}` : '',
    capture.nextSteps ? `\nNEXT STEPS\n${Array.isArray(capture.nextSteps) ? capture.nextSteps.join('\n') : capture.nextSteps}` : '',
    capture.transcript ? `\nTRANSCRIPT\n${capture.transcript.slice(0, 600)}` : '',
    '',
    `Auto-logged via SalesFlow CRM`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

module.exports = { formatActivityLog, validateBccEmail, CRM_TYPES };
