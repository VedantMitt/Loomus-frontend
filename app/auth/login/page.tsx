import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";

type Screen = "login" | "register" | "otp" | "forgot" | "reset";

export default function AuthPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  // Google Flow
  const [googleLoading, setGoogleLoading] = useState(false);
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
  const [regYear, setRegYear] = useState("");

  // OTP field
  const [otp, setOtp] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  // ─── GOOGLE LOGIN ─────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.needsCompletion) {
        setProfileCompletion({ id: data.user.id });
        setScreen("register"); // Redirect to the "Complete Profile" screen (re-using register screen)
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(`/profile/${data.user.username}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    setError("");
    if (!profileCompletion || !regUsername || !regYear) return setError("Fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/complete-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileCompletion.id, username: regUsername, year: regYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(`/profile/${data.user.username}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async () => {
    setError("");
    if (!loginIdentifier || !loginPassword) return setError("Fill in all fields");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: loginIdentifier, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
    if (!regName || !regEmail || !regUsername || !regPassword || !regYear)
      return setError("Fill in all fields");
    if (regPassword.length < 6)
      return setError("Password must be at least 6 characters");
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
          year: regYear,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
      router.push(`/profile/${data.user.username}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

        .auth-wrapper { width: 100%; max-width: 360px; }

        .auth-card {
          background: #111;
          border: 1px solid #222;
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }
        .auth-card::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .tab-row {
          display: flex;
          background: #1a1a1a;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .tab {
          flex: 1;
          padding: 9px;
          border: none;
          border-radius: 7px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          color: #555;
          transition: all 0.2s;
        }
        .tab.active { background: #1d4ed8; color: #fff; }

        .lbl {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 7px;
        }
        .inp {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 9px;
          padding: 12px 14px;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          margin-bottom: 14px;
          transition: border-color 0.2s;
        }
        .inp:focus { border-color: #1d4ed8; }
        .inp::placeholder { color: #333; }

        .btn {
          width: 100%;
          padding: 13px;
          background: #1d4ed8;
          color: #fff;
          border: none;
          border-radius: 9px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 4px;
          transition: background 0.2s, transform 0.1s;
        }
        .btn:hover { background: #1e40af; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .err {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 7px;
          padding: 9px 13px;
          color: #f87171;
          font-size: 12px;
          margin-bottom: 14px;
        }
        .foot {
          text-align: center;
          margin-top: 18px;
          color: #444;
          font-size: 12px;
        }
        .link {
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
        }

        .otp-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 9px;
          padding: 16px;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: 12px;
          text-align: center;
          outline: none;
          margin-bottom: 14px;
          transition: border-color 0.2s;
        }
        .otp-input:focus { border-color: #1d4ed8; }
      `}</style>

      <div className="auth-wrapper">
        {/* Logo */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "24px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Loo<span style={{ color: "#3b82f6" }}>mus</span>
          </div>
          <p style={{ color: "#444", fontSize: "13px", marginTop: "5px" }}>
            {screen === "otp"
              ? "Check your email 📬"
              : screen === "login"
              ? "Welcome back 👋"
              : "Join your campus network"}
          </p>
        </div>

        <div className="auth-card">
          {/* ── OTP SCREEN ── */}
          {screen === "otp" ? (
            <>
              <p
                style={{
                  color: "#666",
                  fontSize: "13px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                We sent a 6-digit code to
                <br />
                <span style={{ color: "#f0f0f0", fontWeight: 500 }}>
                  {pendingEmail}
                </span>
              </p>
              {error && <div className="err">{error}</div>}
              <label className="lbl">Enter OTP</label>
              <input
                className="otp-input"
                type="text"
                maxLength={6}
                placeholder="······"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
              <button
                className="btn"
                onClick={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
              <div className="foot">
                Wrong email?{" "}
                <button
                  className="link"
                  onClick={() => {
                    setScreen("register");
                    setError("");
                    setOtp("");
                  }}
                >
                  Go back
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Tabs */}
              <div className="tab-row">
                <button
                  className={`tab ${screen === "login" ? "active" : ""}`}
                  onClick={() => {
                    setScreen("login");
                    setError("");
                  }}
                >
                  Sign In
                </button>
                <button
                  className={`tab ${screen === "register" ? "active" : ""}`}
                  onClick={() => {
                    setScreen("register");
                    setError("");
                  }}
                >
                  Sign Up
                </button>
              </div>

              {error && <div className="err">{error}</div>}

              {/* ── LOGIN ── */}
              {screen === "login" && (
                <>
                  <label className="lbl">Email or Username</label>
                  <input
                    className="inp"
                    type="text"
                    placeholder="you@college.edu or username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                  <label className="lbl">Password</label>
                  <input
                    className="inp"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    className="btn"
                    onClick={handleLogin}
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In →"}
                  </button>

                  <div style={{ textAlign: "center", margin: "24px 0", color: "#666", fontSize: "12px", position: "relative" }}>
                    <span style={{ background: "#11", padding: "0 10px", position: "relative", zIndex: 1, backgroundColor: "#111" }}>OR</span>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#333", zIndex: 0 }}></div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                    <GoogleLogin
                      text="signin_with"
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google Login Failed")}
                      useOneTap={false}
                      theme="filled_blue"
                      shape="pill"
                      size="large"
                      width="100%"
                    />
                  </div>
                  <div className="foot">
                    <button
                      className="link"
                      onClick={() => { setScreen("forgot"); setError(""); }}
                    >
                      Forgot password?
                    </button>
                    {" · "}
                    <button
                      className="link"
                      onClick={() => { setScreen("register"); setError(""); }}
                    >
                      Create account
                    </button>
                  </div>
                </>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {screen === "forgot" && (
                <>
                  <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
                    Enter your college email and we'll send you a reset code.
                  </p>
                  <label className="lbl">College Email</label>
                  <input
                    className="inp"
                    type="email"
                    placeholder="you@college.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <button
                    className="btn"
                    onClick={async () => {
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
                        setScreen("reset");
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Code →"}
                  </button>
                  <div className="foot">
                    Remember it?{" "}
                    <button className="link" onClick={() => { setScreen("login"); setError(""); }}>
                      Sign in
                    </button>
                  </div>
                </>
              )}

              {/* ── RESET PASSWORD ── */}
              {screen === "reset" && (
                <>
                  <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>
                    Enter the code sent to <span style={{ color: "#f0f0f0", fontWeight: 500 }}>{forgotEmail}</span>
                  </p>
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
                  <input
                    className="inp"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    className="btn"
                    onClick={async () => {
                      setError("");
                      if (!resetOtp || !newPassword) return setError("Fill in all fields");
                      setLoading(true);
                      try {
                        const res = await fetch(`${API}/auth/reset-password`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: forgotEmail, otp: resetOtp, newPassword }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setError("");
                        setScreen("login");
                        setLoginIdentifier(forgotEmail);
                        setLoginPassword("");
                        setForgotEmail("");
                        setResetOtp("");
                        setNewPassword("");
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password →"}
                  </button>
                  <div className="foot">
                    Wrong email?{" "}
                    <button className="link" onClick={() => { setScreen("forgot"); setError(""); }}>
                      Go back
                    </button>
                  </div>
                </>
              )}

              {/* ── REGISTER / COMPLETE PROFILE ── */}
              {screen === "register" && (
                <>
                  <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <h3 style={{ color: "#fff", marginBottom: "8px" }}>
                      {profileCompletion ? "Final Steps 🎓" : "Create Account"}
                    </h3>
                    <p style={{ color: "#666", fontSize: "13px" }}>
                      {profileCompletion 
                        ? "Pick your username and graduation year to finish."
                        : "Sign in with Google below to join Loomus."}
                    </p>
                  </div>

                  {profileCompletion ? (
                    <>
                      <label className="lbl">Username</label>
                      <input
                        className="inp"
                        type="text"
                        placeholder="rahul_dev"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                      <label className="lbl">Graduation Year</label>
                      <select
                        className="inp"
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="" disabled>Select year</option>
                        {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                          <option key={y} value={String(y)} style={{ background: "#1a1a1a" }}>{y}</option>
                        ))}
                      </select>
                      <button
                        className="btn"
                        onClick={async () => {
                          setError("");
                          if (!regUsername || !regYear) return setError("Fill in all fields");
                          setLoading(true);
                          try {
                            const res = await fetch(`${API}/auth/complete-registration`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                userId: profileCompletion.id, 
                                username: regUsername, 
                                year: regYear 
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error);

                            // The backend should return the token and user here
                            // I'll update the backend to do this.
                            if (data.token) {
                              localStorage.setItem("token", data.token);
                              localStorage.setItem("user", JSON.stringify(data.user));
                              router.push(`/profile/${data.user.username}`);
                            } else {
                              setError("Registration complete. Please sign in again.");
                              setScreen("login");
                            }
                          } catch (err: any) {
                            setError(err.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? "Finishing..." : "Start Exploring Campus →"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                        <GoogleLogin
                          text="signup_with"
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError("Google Login Failed")}
                          useOneTap={false}
                          theme="filled_blue"
                          shape="pill"
                          size="large"
                          width="100%"
                        />
                      </div>

                      <div style={{ textAlign: "center", margin: "16px 0", color: "#666", fontSize: "12px", position: "relative" }}>
                        <span style={{ background: "#111", padding: "0 10px", position: "relative", zIndex: 1 }}>OR CONTINUE WITH EMAIL</span>
                        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#333", zIndex: 0 }}></div>
                      </div>

                      <label className="lbl">Name</label>
                      <input
                        className="inp"
                        type="text"
                        placeholder="John Doe"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                      <label className="lbl">College Email</label>
                      <input
                        className="inp"
                        type="email"
                        placeholder="you@college.edu"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                      <label className="lbl">Username</label>
                      <input
                        className="inp"
                        type="text"
                        placeholder="johndoe"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                      />
                      <label className="lbl">Password</label>
                      <input
                        className="inp"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                      <label className="lbl">Graduation Year</label>
                      <select
                        className="inp"
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        style={{ cursor: "pointer" }}
                      >
                        <option value="" disabled>Select year</option>
                        {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                          <option key={y} value={String(y)} style={{ background: "#1a1a1a" }}>{y}</option>
                        ))}
                      </select>
                      <button
                        className="btn"
                        onClick={handleRegister}
                        disabled={loading}
                      >
                        {loading ? "Sending OTP..." : "Continue with Email →"}
                      </button>
                    </>
                  )}

                  {!profileCompletion && (
                    <div className="foot" style={{ marginTop: "24px" }}>
                      Already have an account?{" "}
                      <button
                        className="link"
                        onClick={() => {
                          setScreen("login");
                          setError("");
                        }}
                      >
                        Sign in
                      </button>
                    </div>
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
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          Made for college students 🎓
        </p>
      </div>
    </div>
  );
}