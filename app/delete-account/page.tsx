"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DeleteAccount() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus("submitting");
    // Simulate API call for now. In reality, you'd send this to your backend
    // to flag the account for deletion or send an admin email.
    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-20 px-6 sm:px-12 lg:px-24 flex items-center justify-center">
      <div className="max-w-md w-full bg-[#111111] p-8 rounded-2xl border border-white/10 shadow-2xl">
        <Link 
          href="/" 
          className="text-blue-500 hover:text-blue-400 text-sm font-medium mb-6 inline-flex items-center transition-colors"
        >
          ← Back to Home
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-2">
          Delete Account
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Submit a request to permanently delete your Loomus account and all associated data.
        </p>

        {status === "success" ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
            <div className="text-green-400 text-4xl mb-4">✓</div>
            <h3 className="text-green-400 font-semibold mb-2">Request Received</h3>
            <p className="text-green-500/80 text-sm">
              We have received your account deletion request. Your account and all associated data will be permanently deleted within 30 days.
            </p>
            <button 
              onClick={() => setStatus("idle")}
              className="mt-6 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Account Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter the email associated with your account"
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all"
              />
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-xs leading-relaxed">
                <strong>Warning:</strong> This action is irreversible. All your profile data, posts, friends, and chat history will be permanently erased.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex justify-center items-center"
            >
              {status === "submitting" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Request...
                </span>
              ) : (
                "Request Account Deletion"
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
