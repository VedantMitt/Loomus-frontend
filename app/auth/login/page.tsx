"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

type Screen = "login" | "register" | "otp" | "forgot" | "reset";

export default function AuthPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Multi-step form state
  const [loginStep, setLoginStep] = useState(1);
  const [regStep, setRegStep] = useState(1);

  // Google Flow
  const [profileCompletion, setProfileCompletion] = useState<{ id: string } | null>(null);

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // OTP field
  const [otp, setOtp] = useState("");

  // Refs for auto-focus
  const loginRef = useRef<HTMLInputElement>(null);
  const regNameRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Detect if running inside Capacitor (Android/iOS WebView)
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    const checkNative = typeof window !== "undefined" &&
      ((window as any).Capacitor !== undefined || navigator.userAgent.includes("wv"));
    setIsNative(checkNative);
    if (checkNative) {
      GoogleAuth.initialize();
    }
  }, []);

  // Auto-focus on screen change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (screen === "login") loginRef.current?.focus();
      else if (screen === "register") regNameRef.current?.focus();
      else if (screen === "otp") otpRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [screen]);

  // Clear messages on screen change
  useEffect(() => {
    setError("");
    setSuccess("");
    setShowPassword(false);
    setLoginStep(1);
    setRegStep(1);
  }, [screen]);

  // ─── GOOGLE LOGIN ─────────────────────────────────
  const processGoogleToken = async (idToken: string) => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.needsCompletion) {
        setProfileCompletion({ id: data.user.id });
        setScreen("register");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.isNewUser) {
          router.push("/onboarding");
        } else {
          router.push(`/profile/${data.user.username}`);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    processGoogleToken(credentialResponse.credential);
  };

  const handleNativeGoogleLogin = async () => {
    setError("");
    try {
      const user = await GoogleAuth.signIn();
      if (user?.authentication?.idToken) {
        processGoogleToken(user.authentication.idToken);
      } else {
        setError("Google Login failed: No token received");
      }
    } catch (err: any) {
      console.error(err);
      setError("Native Google Login Cancelled or Failed");
    }
  };

  const handleLoginNext = () => {
    setError("");
    if (!loginIdentifier) return setError("Enter email or username");
    setLoginStep(2);
  };

  const handleRegNext1 = () => {
    setError("");
    if (!regName || !regEmail) return setError("Enter your name and email");
    setRegStep(2);
  };

  const handleRegNext2 = () => {
    setError("");
    if (!regUsername) return setError("Choose a username");
    if (regUsername.length < 3) return setError("Username must be at least 3 characters");
    setRegStep(3);
  };

  // ─── LOGIN ──────────────────────────────────────────
  const handleLogin = async () => {
    setError("");
    setSuccess("");
    if (!loginIdentifier || !loginPassword) return setError("Fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Failed to communicate with server");
      }
      if (!res.ok) throw new Error(data.error || "Login failed. Please try again.");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push(`/profile/${data.user.username}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER ─────────────────────────────────────
  const handleRegister = async () => {
    setError("");
    setSuccess("");
    if (!regName || !regEmail || !regUsername || !regPassword)
      return setError("Fill in all fields");
    if (regPassword.length < 6)
      return setError("Password must be at least 6 characters");
    if (regUsername.length < 3)
      return setError("Username must be at least 3 characters");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          username: regUsername,
          password: regPassword,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error("Failed to communicate with server");
      }
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setPendingEmail(regEmail);
      setScreen("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── VERIFY OTP ───────────────────────────────────
  const handleVerifyOTP = async () => {
    setError("");
    if (otp.length !== 6) return setError("Enter 6-digit OTP");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── FORGOT PASSWORD ─────────────────────────────
  const handleForgotPassword = async () => {
    setError("");
    if (!forgotEmail) return setError("Enter your email");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Reset code sent! Check your inbox.");
      setTimeout(() => setScreen("reset"), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── RESET PASSWORD ──────────────────────────────
  const handleResetPassword = async () => {
    setError("");
    if (!resetOtp || !newPassword) return setError("Fill in all fields");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: resetOtp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Password reset! Redirecting to sign in...");
      setTimeout(() => {
        setScreen("login");
        setLoginIdentifier(forgotEmail);
        setLoginPassword("");
        setForgotEmail("");
        setResetOtp("");
        setNewPassword("");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── COMPLETE REGISTRATION (Google flow) ──────────
  const handleCompleteRegistration = async () => {
    setError("");
    if (!profileCompletion || !regUsername) return setError("Fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profileCompletion.id,
          username: regUsername,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/onboarding");
      } else {
        setSuccess("Registration complete! Please sign in.");
        setScreen("login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Key handler for Enter
  const onEnter = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !loading) action();
  };

  const EyeIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "#666",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      tabIndex={-1}
    >
      {showPassword ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )}
    </button>
  );

  const subtitles: Record<Screen, string> = {
    login: "Welcome back 👋",
    register: profileCompletion ? "Almost there ✨" : "Create your account",
    otp: "Check your email 📬",
    forgot: "Reset your password 🔑",
    reset: "Set new password 🔐",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-wrapper {
          width: 100%;
          max-width: 380px;
          animation: fadeSlideUp 0.4s ease-out;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .auth-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }
        .auth-card::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .auth-card::after {
          content: '';
          position: absolute;
          bottom: -80px; right: -80px;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .tab-row {
          display: flex;
          background: #1a1a1a;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 24px;
          position: relative;
        }
        .tab {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          color: #666;
          transition: all 0.25s ease;
          position: relative;
          z-index: 1;
        }
        .tab.active {
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #fff;
          box-shadow: 0 2px 8px rgba(37,99,235,0.3);
        }

        .lbl {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .inp {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 12px 14px;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .inp:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .inp::placeholder { color: #3a3a3a; }

        .pw-wrap {
          position: relative;
          width: 100%;
          margin-bottom: 16px;
        }
        .pw-wrap .inp {
          padding-right: 42px;
          margin-bottom: 0;
        }

        .btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn:hover {
          background: linear-gradient(135deg, #1e40af, #1d4ed8);
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
          transform: translateY(-1px);
        }
        .btn:active { transform: scale(0.98) translateY(0); }
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .err {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 16px;
          animation: shake 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .suc {
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.2);
          border-radius: 10px;
          padding: 10px 14px;
          color: #4ade80;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .foot {
          text-align: center;
          margin-top: 20px;
          color: #555;
          font-size: 12px;
        }
        .link {
          color: #60a5fa;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .link:hover { color: #93c5fd; }

        .divider {
          text-align: center;
          margin: 20px 0;
          color: #444;
          font-size: 11px;
          position: relative;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .divider span {
          background: #111;
          padding: 0 12px;
          position: relative;
          z-index: 1;
        }
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(to right, transparent, #333, transparent);
        }

        .otp-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 16px;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 12px;
          text-align: center;
          outline: none;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .otp-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .google-wrap {
          display: flex;
          justify-content: center;
          border-radius: 10px;
          overflow: hidden;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #555;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          margin-bottom: 20px;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #aaa; }
      `}</style>

      <div className="auth-wrapper" key={screen}>
        {/* Logo */}
        <div style={{ marginBottom: "28px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Loom<span style={{ color: "#3b82f6" }}>us</span>
          </div>
          <p style={{ color: "#555", fontSize: "13px", marginTop: "6px" }}>
            {subtitles[screen]}
          </p>
        </div>

        <div className="auth-card">
          {/* ── OTP SCREEN ── */}
          {screen === "otp" && (
            <>
              <button className="back-btn" onClick={() => { setScreen("register"); setOtp(""); }}>
                ← Back
              </button>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                We sent a 6-digit code to
                <br />
                <span style={{ color: "#f0f0f0", fontWeight: 500 }}>{pendingEmail}</span>
              </p>
              {error && <div className="err">⚠ {error}</div>}
              <label className="lbl">Enter OTP</label>
              <input
                ref={otpRef}
                className="otp-input"
                type="text"
                maxLength={6}
                placeholder="······"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => onEnter(e, handleVerifyOTP)}
              />
              <button className="btn" onClick={handleVerifyOTP} disabled={loading}>
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {screen === "forgot" && (
            <>
              <button className="back-btn" onClick={() => setScreen("login")}>
                ← Back to sign in
              </button>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                Enter your email and we&apos;ll send you a reset code.
              </p>
              {error && <div className="err">⚠ {error}</div>}
              {success && <div className="suc">✓ {success}</div>}
              <label className="lbl">Email</label>
              <input
                className="inp"
                type="email"
                placeholder="you@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyDown={(e) => onEnter(e, handleForgotPassword)}
              />
              <button className="btn" onClick={handleForgotPassword} disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code →"}
              </button>
            </>
          )}

          {/* ── RESET PASSWORD ── */}
          {screen === "reset" && (
            <>
              <button className="back-btn" onClick={() => setScreen("forgot")}>
                ← Back
              </button>
              <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                Enter the code sent to <span style={{ color: "#f0f0f0", fontWeight: 500 }}>{forgotEmail}</span>
              </p>
              {error && <div className="err">⚠ {error}</div>}
              {success && <div className="suc">✓ {success}</div>}
              <label className="lbl">Reset Code</label>
              <input
                className="otp-input"
                type="text"
                maxLength={6}
                placeholder="······"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
              />
              <label className="lbl">New Password</label>
              <div className="pw-wrap">
                <input
                  className="inp"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => onEnter(e, handleResetPassword)}
                />
                <EyeIcon />
              </div>
              <button className="btn" onClick={handleResetPassword} disabled={loading}>
                {loading ? "Resetting..." : "Reset Password →"}
              </button>
            </>
          )}

          {/* ── LOGIN / REGISTER ── */}
          {(screen === "login" || screen === "register") && (
            <>
              {/* Tabs */}
              <div className="tab-row">
                <button
                  className={`tab ${screen === "login" ? "active" : ""}`}
                  onClick={() => { setScreen("login"); setProfileCompletion(null); }}
                >
                  Sign In
                </button>
                <button
                  className={`tab ${screen === "register" ? "active" : ""}`}
                  onClick={() => setScreen("register")}
                >
                  Sign Up
                </button>
              </div>

              {error && <div className="err">⚠ {error}</div>}
              {success && <div className="suc">✓ {success}</div>}

              {/* ── LOGIN FORM ── */}
              {screen === "login" && (
                <>
                  {loginStep === 1 && (
                    <>
                      {/* Google Login first for sign in */}
                      {!isNative ? (
                        <>
                          <div className="google-wrap" style={{ marginBottom: "4px" }}>
                            <GoogleLogin
                              text="signin_with"
                              onSuccess={handleGoogleSuccess}
                              onError={() => setError("Google Login Failed")}
                              useOneTap={false}
                              theme="filled_blue"
                              shape="pill"
                              size="large"
                              width="320"
                            />
                          </div>
                          <div className="divider"><span>or continue with email</span></div>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn" 
                            style={{ background: "#fff", color: "#333", marginBottom: "4px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }} 
                            onClick={handleNativeGoogleLogin}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            Continue with Google
                          </button>
                          <div className="divider"><span>or continue with email</span></div>
                        </>
                      )}

                      <label className="lbl">Email or Username</label>
                      <input
                        ref={loginRef}
                        className="inp"
                        type="text"
                        placeholder="email or username"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        onKeyDown={(e) => onEnter(e, handleLoginNext)}
                      />
                      <button className="btn" onClick={handleLoginNext}>
                        Continue →
                      </button>
                    </>
                  )}

                  {loginStep === 2 && (
                    <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                      <button className="back-btn" onClick={() => setLoginStep(1)}>
                        ← Back
                      </button>
                      <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                        Signing in as <span style={{ color: "#f0f0f0", fontWeight: 500 }}>{loginIdentifier}</span>
                      </p>
                      <label className="lbl">Password</label>
                      <div className="pw-wrap">
                        <input
                          autoFocus
                          className="inp"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          onKeyDown={(e) => onEnter(e, handleLogin)}
                        />
                        <EyeIcon />
                      </div>
                      <button className="btn" onClick={handleLogin} disabled={loading}>
                        {loading ? "Signing in..." : "Sign In →"}
                      </button>
                      <div className="foot">
                        <button className="link" onClick={() => setScreen("forgot")}>
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── REGISTER FORM ── */}
              {screen === "register" && (
                <>
                  {profileCompletion ? (
                    <>
                      <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                        Pick your username to finish setup.
                      </p>
                      <label className="lbl">Username</label>
                      <input
                        className="inp"
                        type="text"
                        placeholder="your_username"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        onKeyDown={(e) => onEnter(e, handleCompleteRegistration)}
                      />

                      <button className="btn" onClick={handleCompleteRegistration} disabled={loading}>
                        {loading ? "Finishing..." : "Get Started →"}
                      </button>
                    </>
                  ) : (
                    <>
                      {regStep === 1 && (
                        <>
                          {/* Google Login first for sign up */}
                          {!isNative ? (
                            <>
                              <div className="google-wrap" style={{ marginBottom: "4px" }}>
                                <GoogleLogin
                                  text="signup_with"
                                  onSuccess={handleGoogleSuccess}
                                  onError={() => setError("Google Login Failed")}
                                  useOneTap={false}
                                  theme="filled_blue"
                                  shape="pill"
                                  size="large"
                                  width="320"
                                />
                              </div>
                              <div className="divider"><span>or continue with email</span></div>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn" 
                                style={{ background: "#fff", color: "#333", marginBottom: "4px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }} 
                                onClick={handleNativeGoogleLogin}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                Continue with Google
                              </button>
                              <div className="divider"><span>or continue with email</span></div>
                            </>
                          )}

                          <label className="lbl">Name</label>
                          <input
                            ref={regNameRef}
                            className="inp"
                            type="text"
                            placeholder="John Doe"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            onKeyDown={(e) => onEnter(e, handleRegNext1)}
                          />
                          <label className="lbl">Email</label>
                          <input
                            className="inp"
                            type="email"
                            placeholder="you@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            onKeyDown={(e) => onEnter(e, handleRegNext1)}
                          />
                          <button className="btn" onClick={handleRegNext1}>
                            Continue →
                          </button>
                        </>
                      )}

                      {regStep === 2 && (
                        <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                          <button className="back-btn" onClick={() => setRegStep(1)}>
                            ← Back
                          </button>
                          <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                            Let&apos;s pick a username
                          </p>
                          <label className="lbl">Username</label>
                          <input
                            autoFocus
                            className="inp"
                            type="text"
                            placeholder="johndoe"
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value)}
                            onKeyDown={(e) => onEnter(e, handleRegNext2)}
                          />
                          <button className="btn" onClick={handleRegNext2}>
                            Continue →
                          </button>
                        </div>
                      )}

                      {regStep === 3 && (
                        <div style={{ animation: "fadeSlideUp 0.3s ease-out" }}>
                          <button className="back-btn" onClick={() => setRegStep(2)}>
                            ← Back
                          </button>
                          <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", textAlign: "center" }}>
                            Create a secure password
                          </p>
                          <label className="lbl">Password</label>
                          <div className="pw-wrap">
                            <input
                              autoFocus
                              className="inp"
                              type={showPassword ? "text" : "password"}
                              placeholder="Min. 6 characters"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              onKeyDown={(e) => onEnter(e, handleRegister)}
                            />
                            <EyeIcon />
                          </div>
                          <button className="btn" onClick={handleRegister} disabled={loading}>
                            {loading ? "Sending OTP..." : "Sign Up →"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <p
          style={{
            color: "#333",
            fontSize: "11px",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          Welcome to Loomus ✨
        </p>
      </div>
    </div>
  );
}