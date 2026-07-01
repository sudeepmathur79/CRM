import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">SalesFlow CRM</span>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-gray-500 mb-2">Last updated: 29 June 2026 · Effective: 29 June 2026</p>
          <p className="text-xs text-gray-500 mb-8">This policy applies to users worldwide. Jurisdiction-specific supplements are included in Sections 10–14.</p>

          <p>SalesFlow CRM ("SalesFlow", "we", "us") is operated from the United Kingdom. We are the data controller for personal data we collect directly. For personal data you enter about your leads and contacts, you are the data controller and we act as your data processor.</p>
          <p className="mt-2">This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights. If you have questions, contact us at <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a>.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">1. What Data We Collect</h2>
          <p><strong>Account data:</strong> Name, email address, organisation name, and hashed password when you create an account.</p>
          <p><strong>Customer Data you enter:</strong> Lead and contact records, notes, deal values, company information, tags, and pipeline stages you create within the Service.</p>
          <p><strong>Voice recordings and transcripts:</strong> Audio you record via the voice capture feature and the AI-generated transcript.</p>
          <p><strong>Usage data:</strong> Pages visited, features used, browser type, device type, IP address, and timestamps. Collected via PostHog analytics.</p>
          <p><strong>Payment data:</strong> Billing name, email, and payment method details processed by Stripe. We do not store full card numbers; Stripe holds payment credentials under their PCI-DSS compliance.</p>
          <p><strong>Communications:</strong> Emails you send us and support tickets.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">2. Lawful Basis for Processing (UK GDPR / EU GDPR)</h2>
          <p>We process personal data on the following lawful bases:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Contract performance:</strong> Processing your account data and Customer Data to deliver the Service you have signed up for.</li>
            <li><strong>Legitimate interests:</strong> Usage analytics to improve the Service; fraud prevention and security; sending transactional notifications (e.g., follow-up reminders you configured). Our legitimate interests do not override your rights.</li>
            <li><strong>Legal obligation:</strong> Retaining billing records as required by UK tax law.</li>
            <li><strong>Consent:</strong> Optional analytics. You may opt out at any time via the in-app settings or by emailing us.</li>
          </ul>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, operate, and improve the Service</li>
            <li>Send transactional emails: account verification, password reset, follow-up reminders, billing receipts</li>
            <li>Process payments and manage subscriptions via Stripe</li>
            <li>Detect and prevent fraud, abuse, and security incidents</li>
            <li>Comply with legal obligations</li>
            <li>Analyse aggregated, anonymised usage to improve product features</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties. We do not use your Customer Data to train AI models.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">4. AI Processing</h2>
          <p>Voice recordings and text notes are transmitted to Groq (an AI inference provider) to extract lead information, score leads, and generate suggested actions. We send only the minimum data necessary for each request. Groq processes this data under our data processing agreement and does not retain it beyond the duration of the inference request.</p>
          <p>You should not enter special category data (health, biometric, political, or financial data about individuals) into the Service without a clear lawful basis for doing so.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">5. Data Storage and Security</h2>
          <p>Your account and lead data is stored in Neon PostgreSQL databases hosted in the United States. Voice recordings may be stored in AWS S3 or Cloudinary (also US-hosted). We apply industry-standard security measures including TLS encryption in transit, encryption at rest, and access controls limiting data access to authorised personnel.</p>
          <p>International transfers from the UK and EEA to the US are governed by UK International Data Transfer Agreements (IDTAs) and EU Standard Contractual Clauses (SCCs) with our sub-processors. A list of sub-processors is available on request.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">6. Data Retention</h2>
          <p>We retain your account and Customer Data for as long as your account is active. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain records by law (e.g., financial records retained for 7 years under UK law).</p>
          <p>Voice recordings are retained until you delete them or delete your account.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">7. Third-Party Sub-Processors</h2>
          <table className="w-full text-xs border-collapse mt-2 mb-2">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700">
                <th className="text-left p-2 font-semibold">Provider</th>
                <th className="text-left p-2 font-semibold">Purpose</th>
                <th className="text-left p-2 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Stripe', 'Payment processing', 'US / global'],
                ['Resend', 'Transactional email', 'US'],
                ['PostHog', 'Product analytics', 'US (EU hosting available)'],
                ['Groq', 'AI inference', 'US'],
                ['Neon', 'Database hosting', 'US'],
                ['AWS S3 / Cloudinary', 'File and recording storage', 'US'],
                ['Cloudflare', 'Bot protection / CDN', 'Global'],
              ].map(([p, q, l]) => (
                <tr key={p} className="border-t border-gray-200 dark:border-slate-600">
                  <td className="p-2">{p}</td>
                  <td className="p-2">{q}</td>
                  <td className="p-2">{l}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">8. Cookies and Tracking</h2>
          <p>We use localStorage to store authentication tokens (no cookies for auth). PostHog may set first-party analytics cookies. We do not use advertising cookies, third-party tracking pixels, or retargeting cookies. You can disable PostHog analytics tracking at any time via Settings or by emailing us.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">9. Your Rights (All Users)</h2>
          <p>Regardless of your location, you may:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correct:</strong> Request correction of inaccurate data</li>
            <li><strong>Delete:</strong> Request deletion of your account and associated data</li>
            <li><strong>Export:</strong> Request your Customer Data in a machine-readable format (CSV)</li>
            <li><strong>Withdraw consent:</strong> Opt out of non-essential analytics at any time</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, email <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a>. We will respond within 30 days (or sooner as required by applicable law).</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">10. UK and EU Users (UK GDPR / EU GDPR)</h2>
          <p>You have the following additional rights under UK GDPR and EU GDPR:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Right to object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to restriction:</strong> Request that we limit processing of your data</li>
            <li><strong>Right to portability:</strong> Receive your data in a structured, commonly-used format</li>
            <li><strong>Right not to be subject to automated decisions</strong> that produce legal or similarly significant effects without human review</li>
          </ul>
          <p className="mt-2"><strong>UK users</strong> may lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ico.org.uk</a>.</p>
          <p><strong>EU users</strong> may lodge a complaint with the data protection authority in your country of residence. A list of EU DPAs is available at <a href="https://edpb.europa.eu/about-edpb/about-edpb/members_en" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">edpb.europa.eu</a>.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">11. Australian Users (Privacy Act 1988)</h2>
          <p>We comply with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs). You have the right to access and correct your personal information held by us. If you believe we have not complied with the APPs, you may first contact us at <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a> to resolve the matter. If unresolved, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">oaic.gov.au</a>.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">12. Indian Users (Digital Personal Data Protection Act 2023)</h2>
          <p>We process personal data of Indian users as a Data Fiduciary under the Digital Personal Data Protection Act 2023 (DPDPA). We collect and process your data on the basis of your consent (provided at signup) and for the purposes described in this policy. You have the right to access, correct, and erase your personal data, and to withdraw consent. To exercise these rights, contact our Grievance Officer at <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a>. We will respond within the timeframes prescribed by the DPDPA.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">13. US Users (CCPA / State Privacy Laws)</h2>
          <p>If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA) including the right to know, delete, and opt out of the sale of personal information. We do not sell personal information. For other US state privacy laws (Virginia, Colorado, Texas, etc.), many of the rights described in Section 9 apply. To exercise your rights, email <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a>.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">14. Other Jurisdictions</h2>
          <p>For users in jurisdictions not specifically addressed above, we apply UK GDPR standards as our baseline, which we consider to meet or exceed the requirements of most data protection frameworks globally.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">15. Children's Privacy</h2>
          <p>The Service is not directed at children under 18. We do not knowingly collect personal data from anyone under 18. If you believe a child has provided us with personal data, contact us and we will delete it promptly.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">16. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. For material changes, we will notify you by email at least 30 days before the change takes effect. The "Last updated" date at the top reflects the most recent revision. Continued use after the effective date constitutes acceptance.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">17. Contact</h2>
          <p>For privacy enquiries or to exercise your rights:<br />
          Email: <a href="mailto:privacy@aifstud.io" className="text-indigo-600 hover:underline">privacy@aifstud.io</a><br />
          We aim to respond within 5 business days and will complete all requests within 30 days (or as required by applicable law).</p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/terms" className="hover:underline">Terms of Service</Link> · <Link to="/login" className="hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
