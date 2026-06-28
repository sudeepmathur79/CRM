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

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-8 prose dark:prose-invert max-w-none">
          <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">By accessing or using SalesFlow CRM ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Description of Service</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">SalesFlow CRM is an AI-powered customer relationship management platform that helps sales teams capture, track, and manage leads and customer interactions.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. User Accounts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Acceptable Use</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) transmit any spam or unsolicited communications; (c) infringe the intellectual property rights of others; (d) engage in any activity that disrupts or impairs the Service.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Data and Privacy</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Your use of the Service is subject to our <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>. By using the Service, you consent to our collection and use of data as described therein.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Subscription and Billing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">The Service is offered on a free tier (up to 10 captures/month) and paid plans. Paid subscriptions are billed monthly or annually. You may cancel at any time; cancellation takes effect at the end of your current billing period.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Intellectual Property</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">The Service and its original content, features, and functionality are owned by Aussie Innovation Factory and are protected by international copyright, trademark, and other intellectual property laws.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8. Limitation of Liability</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">To the maximum extent permitted by law, Aussie Innovation Factory shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9. Changes to Terms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">We reserve the right to modify these terms at any time. We will notify users of significant changes via email. Continued use of the Service after changes constitutes acceptance of the new terms.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">10. Contact</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">For questions about these Terms, contact us at <a href="mailto:hello@aussieinnovationfactory.com" className="text-indigo-600 hover:underline">hello@aussieinnovationfactory.com</a>.</p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link> · <Link to="/login" className="hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
