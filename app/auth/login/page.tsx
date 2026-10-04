"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

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
    const checkNative = Capacitor.isNativePlatform();
    setIsNative(checkNative);
    if (checkNative) {
      try {
        GoogleAuth.initialize({
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '179896098236-k92cj68fkliirf291ruuu6sk6rp1e7q4.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });
      } catch (e) {
        console.warn("GoogleAuth initialize warning:", e);
      }
    }
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      document.cookie = `token=${storedToken}; path=/; max-age=31536000; SameSite=Lax`;
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
      if (!res.ok) throw new Error(data.error || "Google Authentication failed");

      if (data.needsCompletion) {
        setProfileCompletion({ id: data.user.id });
        setScreen("register");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        document.cookie = `token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
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
    if (credentialResponse?.credential) {
      processGoogleToken(credentialResponse.credential);
    } else {
      setError("Google Login failed: No credential returned");
    }
  };

  const handleNativeGoogleLogin = async () => {
    setError("");
    try {
      try {
        GoogleAuth.initialize({
          clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '179896098236-k92cj68fkliirf291ruuu6sk6rp1e7q4.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });
      } catch (initErr) {
        console.warn("GoogleAuth init warning:", initErr);
      }

      const user = await GoogleAuth.signIn();
      if (user?.authentication?.idToken) {
        processGoogleToken(user.authentication.idToken);
      } else {
        setError("Google Login failed: No token received");
      }
    } catch (err: any) {
      console.error("Native Google Login error:", err);
      const code = String(err?.code || err?.statusCode || "");
      const msg = typeof err === "string" ? err : (err?.message || JSON.stringify(err));

      if (code === "12501" || msg.includes("12501") || msg.toLowerCase().includes("cancel")) {
        setError("Google Sign-In was cancelled.");
      } else if (code === "10" || msg.includes("10") || msg.includes("DEVELOPER_ERROR")) {
        setError("Google Sign-In Error (Code 10 / DEVELOPER_ERROR): Check OAuth Consent Screen Publishing Status (Publish App / Test Users).");
      } else if (code) {
        setError(`Google Login Failed (Code ${code}): ${msg}`);
      } else if (msg) {
        setError(`Google Login Failed: ${msg}`);
      } else {
        setError("Google Login failed. Please try again or use email sign up.");
      }
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
      document.cookie = `token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
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
      document.cookie = `token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
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
        document.cookie = `token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
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
    login: "Welcome back",
    register: profileCompletion ? "Almost there" : "Create your account",
    otp: "Check your email",
    forgot: "Reset your password",
    reset: "Set new password",
  };

  return (
    <div className="auth-container">
      {/* Aurora Fluid Gradient Background */}
      <div className="aurora-bg"></div>

      {/* Doodle Overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none mix-blend-screen" style={{ backgroundImage: "url('/abstract_doodles.jpg')", backgroundSize: "900px", opacity: 0.05, filter: "invert(1)" }}></div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=Permanent+Marker&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-container {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
          background: #0a0a0a; /* Dark mode background */
        }

        /* The Aurora Background */
        .aurora-bg {
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: 
            radial-gradient(circle at 50% 50%, rgba(255, 107, 107, 0.12), transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(77, 150, 255, 0.12), transparent 45%),
            radial-gradient(circle at 20% 80%, rgba(255, 217, 61, 0.12), transparent 45%),
            radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.12), transparent 45%);
          filter: blur(80px);
          animation: aurora 25s infinite alternate ease-in-out;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes aurora {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .auth-wrapper {
          width: 100%;
          max-width: 440px;
          animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 10;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-card {
          background: rgba(10, 10, 10, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 24px 48px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -1px 0 rgba(255, 255, 255, 0.05);
        }

        .tab-row {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 18px;
          padding: 6px;
          margin-bottom: 32px;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .tab {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          background: transparent;
          color: #aaa;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
        }
        .tab:hover:not(.active) { color: #fff; }
        .tab.active {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1);
        }

        .lbl {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
          margin-left: 4px;
          letter-spacing: 0.02em;
        }
        .inp {
          width: 100%;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          outline: none;
          margin-bottom: 24px;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .inp:focus {
          background: rgba(0, 0, 0, 0.6);
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1), inset 0 2px 4px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }
        .inp::placeholder { color: #666; font-weight: 400; }

        .pw-wrap { position: relative; width: 100%; margin-bottom: 24px; }
        .pw-wrap .inp { padding-right: 42px; margin-bottom: 0; }

        .btn {
          width: 100%;
          padding: 16px;
          background: #2563eb;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 24px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 32px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
          background: #3b82f6;
        }
        .btn:active { transform: translateY(0); box-shadow: 0 4px 12px rgba(37,99,235,0.2); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .err {
          background: rgba(255, 107, 107, 0.08);
          border: 1px solid rgba(255, 107, 107, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #d32f2f;
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 20px;
          animation: shake 0.3s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .suc {
          background: rgba(74, 222, 128, 0.08);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #2e7d32;
          font-weight: 500;
          font-size: 13px;
          margin-bottom: 20px;
          display: flex; align-items: center; gap: 8px;
        }

        .foot { text-align: center; margin-top: 24px; color: #777; font-size: 13px; font-weight: 500; }
        .link {
          color: #111;
          background: none; border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          text-decoration: underline; text-underline-offset: 4px;
          transition: opacity 0.2s;
        }
        .link:hover { opacity: 0.7; }

        .divider {
          text-align: center;
          margin: 32px 0;
          color: #aaa;
          font-size: 12px;
          font-weight: 700;
          position: relative;
        }
        .divider span { background: rgba(0,0,0,0.6); padding: 0 16px; position: relative; z-index: 1; border-radius: 20px; backdrop-filter: blur(10px);}
        .divider::before {
          content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        }

        .otp-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 16px;
          padding: 16px;
          color: #111;
          font-family: 'DM Sans', sans-serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 16px;
          text-align: center;
          outline: none;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }
        .otp-input:focus {
          background: #fff;
          border-color: rgba(77, 150, 255, 0.5);
          box-shadow: 0 0 0 4px rgba(77, 150, 255, 0.1);
        }

        .google-wrap {
          display: flex; justify-content: center;
          transition: all 0.3s ease;
        }
        .google-wrap:hover { transform: translateY(-1px); }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #aaa;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; border-radius: 12px; padding: 8px 14px; margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        .back-btn:hover { background: rgba(255,255,255,0.1); color: #fff; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.2); }

        /* Polaroid Elements */
        .polaroid {
          background: #e9dec5ff; /* Authentic vintage cream */
          padding: 8px 8px 24px 8px;
          border: 1px solid #f0eee9;
          border-radius: 4px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          backdrop-filter: blur(10px);
          position: relative;
        }
        .polaroid-img {
          width: 140px;
          height: 140px;
          background: #eee;
          object-fit: cover;
          border-radius: 2px;
        }
        .polaroid-caption {
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 700;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        @media (max-width: 768px) {
          .polaroid {
            padding: 6px 6px 18px 6px;
          }
          .polaroid-img {
            width: 90px;
            height: 90px;
          }
          .polaroid-caption {
            font-size: 7px;
            margin-top: 6px;
          }
        }
        @keyframes sway-1 {
          0%, 100% { transform: translateY(0) rotate(-10deg); }
          50% { transform: translateY(-12px) rotate(-8deg); }
        }
        @keyframes sway-2 {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-15px) rotate(10deg); }
        }
        @keyframes sway-3 {
          0%, 100% { transform: translateY(0) rotate(8deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }
        .polaroid-1 { animation: sway-1 10s ease-in-out infinite; }
        .polaroid-2 { animation: sway-2 12s ease-in-out infinite; }
        .polaroid-3 { animation: sway-3 11s ease-in-out infinite; }
      `}</style>

      {/* Scrapbook Background Elements */}
      <div className="absolute top-[8%] left-[2%] md:top-[15%] md:left-[8%] z-[5] polaroid-1">
        <div className="polaroid">
          <img className="polaroid-img" src="/polaroid1.jpg" alt="Memory" />
          <div className="polaroid-caption">
            <span>DELHI, IND</span>
            <span>02:30 PM</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[10%] left-[4%] md:bottom-[15%] md:left-[12%] z-[5] polaroid-2">
        <div className="polaroid">
          <img className="polaroid-img" src="/polaroid2.jpg" alt="Memory" />
          <div className="polaroid-caption">
            <span>UTTARAKHAND, IND</span>
            <span>11:45 PM</span>
          </div>
        </div>
      </div>
      <div className="absolute top-[20%] right-[2%] md:top-[25%] md:right-[10%] z-[5] polaroid-3">
        <div className="polaroid">
          <img className="polaroid-img" src="/polaroid3.jpg" alt="Memory" />
          <div className="polaroid-caption">
            <span>PUNE, IND</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>08:15 AM</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="3" style={{ opacity: 0.6 }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-[15%] right-[2%] md:bottom-[20%] md:right-[15%] z-[5] polaroid-1" style={{ animationDelay: '2s' }}>
        <div className="polaroid">
          <img className="polaroid-img" src="/polaroid4.jpg" alt="Memory" />
          <div className="polaroid-caption">
            <span>GOA, IND</span>
            <span>05:20 PM</span>
          </div>
        </div>
      </div>

      <div className="auth-wrapper" key={screen}>
        {/* Logo */}
        <div style={{ marginBottom: "36px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>

          <div style={{ position: "relative", display: "inline-block", margin: "10px 0" }}>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "40px",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                position: "relative",
                zIndex: 2,
                textShadow: "0 8px 24px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.9)"
              }}
            >
              <span style={{ color: "#fcf9f2" }}>Loom</span>
              <span style={{ color: "#60a5fa" }}>us</span>
            </div>
          </div>
          <div style={{ marginTop: "12px" }}>
            <p className="inline-block" style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, background: "rgba(0,0,0,0.4)", padding: "6px 14px", borderRadius: "16px", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              {subtitles[screen]}
            </p>
          </div>
        </div>

        <div className="auth-card">
          {/* ── OTP SCREEN ── */}
          {screen === "otp" && (
            <>
              <button className="back-btn" onClick={() => { setScreen("register"); setOtp(""); }}>
                ← Back
              </button>
              <p style={{ color: "#666", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
                We sent a 6-digit code to
                <br />
                <span style={{ color: "#1A1A1A", fontWeight: 800 }}>{pendingEmail}</span>
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
              <p style={{ color: "#666", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
                Enter the code sent to <span style={{ color: "#1A1A1A", fontWeight: 800 }}>{forgotEmail}</span>
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
                              onError={() => {
                                console.error("Web Google Login failed - check Authorized JavaScript origins in Google Cloud Console");
                                setError("Google Login Failed on Web. Please check Authorized Origins in Google Console or use Email OTP.");
                              }}
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
                            style={{ background: "#fff", color: "#1A1A1A", marginBottom: "4px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                            onClick={handleNativeGoogleLogin}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
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
                      <p style={{ color: "#ffffff", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
                        Signing in as <span style={{ color: "#60a5fa", fontWeight: 800 }}>{loginIdentifier}</span>
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
                        <button className="link" style={{ color: "#ffffff" }} onClick={() => setScreen("forgot")}>
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
                      <p style={{ color: "#666", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
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
                                  onError={() => {
                                    console.error("Web Google Sign-up failed - check Authorized JavaScript origins in Google Cloud Console");
                                    setError("Google Login Failed on Web. Please check Authorized Origins in Google Console or use Email OTP.");
                                  }}
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
                                style={{ background: "#fff", color: "#1A1A1A", marginBottom: "4px", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                                onClick={handleNativeGoogleLogin}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
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
                          <p style={{ color: "#666", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
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
                          <p style={{ color: "#666", fontSize: "14px", fontWeight: 700, marginBottom: "20px", textAlign: "center" }}>
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


      </div>
    </div>
  );
}