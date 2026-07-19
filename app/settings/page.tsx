"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Settings as SettingsIcon, User } from "lucide-react";

export default function SettingsMenu() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .settings-container { max-width: 560px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
        .settings-card { 
          background: #111; 
          border: 1px solid #1e1e1e; 
          border-radius: 14px; 
          overflow: hidden;
          margin-bottom: 24px;
        }
        .settings-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #1e1e1e;
        }
        .settings-item:last-child {
          border-bottom: none;
        }
        .settings-item:hover {
          background: #1a1a1a;
        }
        .settings-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .settings-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #222;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .settings-label {
          font-size: 15px;
          font-weight: 500;
          color: #fff;
        }
        .logout-btn {
          width: 100%; padding: 14px; background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }
        .logout-btn:active { transform: scale(0.98); }
      `}</style>

      <div className="settings-container">
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "24px" }}>Settings</h1>

        <div className="settings-card">
          <div className="settings-item" onClick={() => router.push("/preferences")}>
            <div className="settings-item-left">
              <div className="settings-icon-wrap">
                <SettingsIcon size={18} />
              </div>
              <span className="settings-label">My Preferences</span>
            </div>
            <ChevronRight size={18} color="#666" />
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
}
