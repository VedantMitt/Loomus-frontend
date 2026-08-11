import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Loomus",
  description: "Privacy Policy for Loomus App",
};

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-6 sm:px-12 lg:px-24">
      <div className="max-w-3xl mx-auto">
        <Link 
          href="/" 
          className="text-blue-500 hover:text-blue-400 text-sm font-medium mb-8 inline-flex items-center transition-colors"
        >
          ← Back to App
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: {currentDate}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
            <p>
              Welcome to Loomus. We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy will inform you as to how we look after your personal data when you visit our 
              application and tell you about your privacy rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
            <p>
              When you use Loomus, we may collect, use, and store the following types of data:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li><strong className="text-gray-200">Identity Data:</strong> First name, last name, username, and profile picture (retrieved via Google Sign-in or manual upload).</li>
              <li><strong className="text-gray-200">Contact Data:</strong> Email address.</li>
              <li><strong className="text-gray-200">Profile Data:</strong> Your college, graduation year, bio, and interactions on the platform.</li>
              <li><strong className="text-gray-200">Technical Data:</strong> Internet Protocol (IP) address, login data, device type, and app usage statistics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data for the following purposes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>To register you as a new user and manage your account.</li>
              <li>To provide the campus community services and features.</li>
              <li>To manage our relationship with you, including sending verification emails and updates.</li>
              <li>To improve our application, services, and overall user experience.</li>
              <li>To keep our platform safe and secure.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Data Sharing and Third Parties</h2>
            <p>
              <strong>We do not sell your personal data.</strong> We may share your data with trusted third parties solely 
              for the purpose of operating our service (such as cloud hosting providers and email delivery services). 
              These third parties are bound by strict confidentiality agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
              used, or accessed in an unauthorized way, altered, or disclosed. All communication is encrypted using HTTPS.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Your Data Rights</h2>
            <p>
              You have the right to request access, correction, or erasure of your personal data. 
              If you wish to delete your account and all associated data, you can do so from the App Settings or 
              contact us directly.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-[#111111] border border-white/5 rounded-lg p-4 mt-2">
              <a href="mailto:support@loomus.app" className="text-blue-400 hover:text-blue-300 transition-colors">
                support@loomus.app
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
