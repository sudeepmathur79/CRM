import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function Terms() {
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
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-xs text-gray-500 mb-8">Last updated: 29 June 2026 · Effective: 29 June 2026</p>

          <p>These Terms of Service ("Terms") form a legally binding agreement between you ("Customer", "you") and the operator of SalesFlow CRM ("SalesFlow", "we", "us"), a service operated from the United Kingdom. By accessing or using the Service you confirm you have read, understood, and agree to these Terms. If you do not agree, stop using the Service immediately.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">1. The Service</h2>
          <p>SalesFlow CRM is an AI-powered customer relationship management platform enabling sales professionals to capture leads by voice, manage pipeline stages, score leads with AI, and collaborate with team members. We offer a free tier and paid subscription plans as described at <Link to="/welcome#pricing" className="text-indigo-600 hover:underline">our pricing page</Link>.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">2. Eligibility</h2>
          <p>You must be at least 18 years old and legally capable of entering a binding contract to use the Service. By using the Service on behalf of an organisation, you represent that you have authority to bind that organisation.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">3. Account Registration and Security</h2>
          <p>You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@aifstud.io" className="text-indigo-600 hover:underline">support@aifstud.io</a> if you suspect unauthorised access.</p>
          <p>We reserve the right to suspend or terminate accounts that appear to have been compromised or are being used in breach of these Terms.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">4. Subscription Plans and Pricing</h2>
          <p><strong>Free tier:</strong> Up to 10 lead captures per month per organisation. No credit card required. Voice recordings and file storage are available on paid plans only.</p>
          <p><strong>Pro plan (£29 / admin seat / month):</strong> Unlimited lead captures, AI lead scoring, AI agents, voice capture with transcription, follow-up reminders, team management (up to 2 sub-users per admin seat), and priority support. Additional seats billed at the same per-seat rate.</p>
          <p>Prices are displayed in GBP and exclusive of any applicable taxes (including VAT where applicable). We will clearly display any applicable taxes at checkout.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">5. Billing, Payment, and Renewal</h2>
          <p>Paid subscriptions are billed monthly in advance via Stripe. Your subscription renews automatically at the end of each billing period unless cancelled. You authorise us to charge your payment method on file at each renewal.</p>
          <p>If payment fails, we will attempt to re-charge and notify you by email. Accounts with overdue balances may be suspended after 7 days.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">6. Cancellation and Refunds</h2>
          <p>You may cancel your subscription at any time from Settings → Billing. Cancellation takes effect at the end of the current billing period; you retain access to paid features until then. We do not offer pro-rata refunds for unused time within a billing period.</p>
          <p><strong>Statutory cooling-off (UK and EU consumers):</strong> If you are a consumer (not purchasing for business purposes) and reside in the UK or EEA, you have the right to cancel within 14 days of purchase without giving a reason. To exercise this right, email <a href="mailto:support@aifstud.io" className="text-indigo-600 hover:underline">support@aifstud.io</a>. If you have already used the Service during this period, we may charge a pro-rata amount for use to date.</p>
          <p><strong>Australian consumers:</strong> Nothing in these Terms limits rights you have under the Australian Consumer Law.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">7. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Violate any applicable law or regulation, including data protection laws in your jurisdiction</li>
            <li>Transmit unsolicited commercial communications (spam) in breach of applicable anti-spam laws (CAN-SPAM, CASL, UK PECR, etc.)</li>
            <li>Store or process data that you do not have a lawful basis to process</li>
            <li>Infringe intellectual property rights of third parties</li>
            <li>Attempt to gain unauthorised access to any part of the Service or other users' accounts</li>
            <li>Introduce malicious code, conduct denial-of-service attacks, or scrape the Service</li>
            <li>Resell or white-label the Service without our prior written consent</li>
          </ul>
          <p className="mt-3">You are solely responsible for the lawfulness of the data you enter, including lead and contact data and the legal basis on which you collected it.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">8. Your Data and Content</h2>
          <p>You retain all ownership rights to the data and content you upload or input ("Customer Data"). You grant us a limited licence to host, process, and transmit Customer Data solely to provide the Service.</p>
          <p>You are the data controller for all personal data you enter into the Service. We act as your data processor. Our processing activities are described in the <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> and our Data Processing Agreement (available on request).</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">9. AI Features and Accuracy</h2>
          <p>The Service uses AI to extract lead information from voice recordings and text, score leads, and suggest actions. AI outputs are probabilistic and may contain errors. You are responsible for verifying AI-generated content before acting on it. We make no warranty that AI outputs are accurate, complete, or fit for any particular purpose.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">10. Intellectual Property</h2>
          <p>The Service, its visual design, underlying code, trademarks, and all content produced by us are our exclusive property and protected by UK and international intellectual property law. You may not copy, modify, distribute, or create derivative works without our express written permission.</p>
          <p>Nothing in these Terms transfers any intellectual property right to you except the limited right to use the Service as permitted herein.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">11. Third-Party Services</h2>
          <p>The Service integrates with third-party providers including Stripe (payments), Resend (email), PostHog (analytics), Groq (AI inference), Neon (database hosting), and Cloudflare (bot protection). Your use of these integrations is subject to those providers' own terms and privacy policies. We are not responsible for the acts or omissions of third-party providers.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">12. Service Availability and Modifications</h2>
          <p>We aim to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features with reasonable notice (typically 30 days for material changes). In the event of discontinuation of the Service, we will provide at least 30 days' notice and allow you to export your data.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">13. Disclaimer of Warranties</h2>
          <p>The Service is provided "as is" and "as available". To the maximum extent permitted by applicable law, we disclaim all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be error-free or that defects will be corrected.</p>
          <p>Nothing in this clause limits our liability for fraud, death or personal injury caused by negligence, or any other liability that cannot be excluded by law.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">14. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, our total liability to you for all claims arising out of or related to these Terms or the Service in any 12-month period is limited to the greater of (a) the total fees you paid to us in the preceding 3 months or (b) £100.</p>
          <p>We are not liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, data, or goodwill, even if advised of the possibility of such damages.</p>
          <p><strong>Australian users:</strong> Our liability is not excluded where prohibited by the Australian Consumer Law.</p>
          <p><strong>UK and EU consumers:</strong> Nothing in this clause affects your statutory consumer rights.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">15. Indemnification</h2>
          <p>You agree to indemnify and hold us harmless from any claims, damages, and expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">16. Governing Law and Dispute Resolution</h2>
          <p>These Terms are governed by the laws of England and Wales. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales, except where mandatory consumer protection laws in your jurisdiction require otherwise.</p>
          <p><strong>EU consumers:</strong> You may also bring proceedings in the courts of your country of residence and may use the EU Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ec.europa.eu/consumers/odr</a>.</p>
          <p><strong>UK consumers:</strong> You may contact the UK ODR platform or Citizens Advice for guidance on your rights.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">17. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. For material changes, we will provide at least 30 days' notice by email or in-app notification. Continued use of the Service after the effective date of changes constitutes acceptance. If you do not agree with the changes, you may cancel your subscription before they take effect.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">18. General</h2>
          <p>If any provision of these Terms is found to be unenforceable, the remaining provisions remain in full force. Our failure to enforce any provision does not waive our right to enforce it in the future. These Terms, together with the Privacy Policy, constitute the entire agreement between you and us regarding the Service.</p>

          <h2 className="text-base font-semibold mt-8 mb-2 text-gray-900 dark:text-white">19. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:support@aifstud.io" className="text-indigo-600 hover:underline">support@aifstud.io</a>. We aim to respond within 5 business days.</p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link> · <Link to="/login" className="hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
