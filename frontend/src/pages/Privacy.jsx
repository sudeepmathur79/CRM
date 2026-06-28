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

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 prose dark:prose-invert max-w-none">
          <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Information We Collect</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We collect information you provide directly: name, email address, organisation name, and password when you create an account. We also collect lead and contact data you enter into the Service, voice recordings and transcripts you create, and usage analytics via PostHog.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. How We Use Your Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We use your information to: provide and improve the Service; send transactional emails (verification, follow-up reminders); process payments via Stripe; and analyse usage to improve features. We do not sell your personal data to third parties.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. AI Processing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Voice notes and text you submit are processed by AI providers (Groq/Llama) to extract lead information. This processing occurs on third-party infrastructure. We send only the minimum data needed for extraction and do not store it beyond the immediate request.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Data Storage</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Your data is stored in secure cloud databases (Neon PostgreSQL) hosted in the United States. Recordings may be stored in cloud storage (AWS S3 or Cloudinary). We apply industry-standard encryption in transit and at rest.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Data Retention</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We retain your data for as long as your account is active. You may request deletion of your account and all associated data by contacting us. We will action deletion requests within 30 days.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Australian Privacy Act Compliance</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We comply with the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs). You have the right to access, correct, and request deletion of your personal information. Contact us to exercise these rights.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Third-Party Services</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We use the following third-party services: Stripe (payments), Resend (email), PostHog (analytics), Groq (AI inference), Neon (database), Cloudflare Turnstile (bot protection). Each operates under its own privacy policy.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8. Cookies</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We use localStorage to store authentication tokens. PostHog may set analytics cookies. We do not use advertising or tracking cookies.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9. Changes to This Policy</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We may update this Privacy Policy from time to time. We will notify you of significant changes by email. Continued use of the Service after changes constitutes acceptance.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">For privacy enquiries, contact us at <a href="mailto:hello@aussieinnovationfactory.com" className="text-indigo-600 hover:underline">hello@aussieinnovationfactory.com</a>.</p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/terms" className="hover:underline">Terms of Service</Link> · <Link to="/login" className="hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
