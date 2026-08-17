import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Safety Standards & CSAE Policy | Loomus",
  description: "Loomus Safety Standards and Policy against Child Sexual Abuse and Exploitation (CSAE).",
};

export default function SafetyStandardsPolicy() {
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
          className="text-pink-500 hover:text-pink-400 text-sm font-medium mb-8 inline-flex items-center transition-colors"
        >
          ← Back to App
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent mb-4">
          Safety Standards &amp; CSAE Policy
        </h1>
        <p className="text-gray-400 text-sm mb-12">Last updated: {currentDate}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">1. Zero Tolerance Policy</h2>
            <p>
              At Loomus, the safety of our community is our highest priority. We have a strict, <strong>zero-tolerance policy</strong> against Child Sexual Abuse and Exploitation (CSAE) and any form of child endangerment. Any content or behavior that promotes, depicts, or facilitates the exploitation or abuse of minors is strictly prohibited.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">2. Prohibited Content and Conduct</h2>
            <p>
              Users of Loomus must not upload, share, or promote any content that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Contains or links to Child Sexual Abuse Material (CSAM).</li>
              <li>Depicts the sexual exploitation or abuse of minors.</li>
              <li>Promotes the grooming, trafficking, or endangerment of children.</li>
              <li>Sexualizes minors in any form.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">3. Enforcement and Moderation</h2>
            <p>
              We employ both automated systems and manual reviews to detect and remove prohibited content. If we discover any content or behavior that violates our CSAE policy, we will take immediate action, which includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Immediate removal of the offending content.</li>
              <li>Permanent banning and deletion of the offending user's account without warning.</li>
              <li>Preservation of account data as required by law.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">4. Reporting to Authorities</h2>
            <p>
              Loomus is fully committed to cooperating with law enforcement agencies worldwide. We will immediately report instances of suspected child exploitation, abuse, or CSAM to the appropriate authorities, including the National Center for Missing &amp; Exploited Children (NCMEC) in the United States, and international equivalents.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">5. User Reporting Mechanism</h2>
            <p>
              We rely on our community to help keep Loomus safe. If you encounter any content or behavior that you suspect violates our safety standards, especially concerning the safety of minors, please report it immediately:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Use the in-app reporting tools available on every post and user profile.</li>
              <li>Contact our trust and safety team directly via email.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">6. Contact Trust &amp; Safety</h2>
            <p>
              For urgent reports regarding child safety, or questions about our safety standards, please contact our dedicated Trust &amp; Safety team:
            </p>
            <div className="bg-[#111111] border border-white/5 rounded-lg p-4 mt-2">
              <a href="mailto:safety@loomus.app" className="text-pink-400 hover:text-pink-300 transition-colors">
                safety@loomus.app
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
