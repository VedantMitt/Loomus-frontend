"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [hasUnreadDMs, setHasUnreadDMs] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        else setUser(null);
      } catch (err) {
        console.error("Error parsing user");
      }
    };
    
    checkUser();
    
    // Custom event listener for instant auth state updates without route changes
    window.addEventListener("auth-change", checkUser);
    return () => window.removeEventListener("auth-change", checkUser);
  }, [pathname]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const [reqRes, notifRes, chatRes] = await Promise.all([
          fetch(`${API}/friends/pending`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        let hasAlert = false;
        if (reqRes.ok) {
          const data = await reqRes.json();
          setPendingRequests(data);
          if (data.length > 0) hasAlert = true;
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data);
          if (data.length > 0) hasAlert = true;
        }
        setHasPendingRequests(hasAlert);

        if (chatRes.ok) {
          const data = await chatRes.json();
          setHasUnreadDMs(data.some((c: any) => parseInt(c.unread_count) > 0));
        }
      } catch (err) {
        console.error("Failed to fetch alerts in Navbar", err);
      }
    };

    fetchAlerts();

    // Re-check periodically
    const interval = setInterval(fetchAlerts, 30000); // every 30 seconds

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, []);

  const markNotifRead = async (id: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${API}/friends/accept/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      setHasPendingRequests(pendingRequests.length - 1 > 0 || notifications.length > 0);
    } catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${API}/friends/remove/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      setHasPendingRequests(pendingRequests.length - 1 > 0 || notifications.length > 0);
    } catch (err) { console.error(err); }
  };

  const hideNavOn = ["/auth/login", "/login"];
  if (hideNavOn.includes(pathname)) return null;

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/auth/login";
  };

  const navLinks = [
    { name: "Discover", href: "/discover" },
    { name: "Friends", href: "/friends" },
    { name: "Activities", href: "/activities" },
    { name: "Play", href: "/play" },
    { name: "Rooms", href: "/rooms" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;600;700&family=Syne:wght@700;800&display=swap');

        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 16px 24px;
          display: flex;
          justify-content: center;
          pointer-events: none;
          transition: padding 0.3s ease;
        }

        .nav-wrapper.scrolled {
          padding: 12px 24px;
        }

        .nav-container {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1200px;
          background: rgba(15, 15, 15, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 12px 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-logo span {
          background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-links {
          display: none;
        }
        @media (min-width: 768px) {
          .nav-links {
            display: flex;
            align-items: center;
            gap: 18px;
          }
        }

        .nav-link {
          color: #999;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s ease;
          position: relative;
        }

        .nav-link:hover {
          color: #fff;
        }

        .nav-link.active {
          color: #fff;
          font-weight: 600;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .nav-btn {
          font-size: 13px;
          font-weight: 600;
          color: #ccc;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .nav-btn:hover { color: #fff; }

        .nav-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 14px 6px 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .nav-profile:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .nav-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a5b4fc 0%, #c084fc 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #000;
        }

        .nav-notification-dot {
          position: absolute;
          top: -4px;
          right: -10px;
          width: 8px;
          height: 8px;
          background-color: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        /* Spacer to prevent content from hiding behind fixed nav */
        .nav-spacer {
          height: 90px;
        }

        /* Mobile: hide profile pill, logout, username text */
        @media (max-width: 767px) {
          .nav-profile, .nav-btn { display: none !important; }
          .nav-container { padding: 10px 16px; border-radius: 16px; }
          .nav-wrapper { padding: 10px 12px; }
          .nav-spacer { height: 70px; }
          .notif-dropdown-mobile {
            position: fixed !important;
            top: 60px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
            max-height: calc(100vh - 160px) !important;
          }
        }
      `}</style>

      <div className={`nav-wrapper ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            Campus<span>Connect</span>
          </Link>

          <div className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`nav-link ${pathname.startsWith(link.href) ? "active" : ""}`}
              >
                {link.name}
                {link.name === "Friends" && hasPendingRequests && (
                  <div className="nav-notification-dot" />
                )}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", marginRight: "12px" }}>
                  <Link href="/chat" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.8, transition: "opacity 0.2s", color: "#ccc" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.color = "#ccc"; }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    {hasUnreadDMs && (
                      <div className="nav-notification-dot" style={{ top: "-2px", right: "-4px" }} />
                    )}
                  </Link>

                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowDropdown(!showDropdown)} style={{ background: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", opacity: 0.8, transition: "opacity 0.2s", color: "#ccc" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.color = "#ccc"; }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                      </svg>
                      {notifications.length > 0 && (
                        <div className="nav-notification-dot" style={{ top: "-2px", right: "-4px" }} />
                      )}
                    </button>

                    {showDropdown && (
                      <div className="notif-dropdown-mobile" style={{ position: "absolute", top: "100%", right: "-60px", marginTop: "16px", width: "340px", background: "rgba(15,15,15,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", zIndex: 100, maxHeight: "400px", overflowY: "auto" }}>
                        <h4 style={{ color: "#fff", margin: "0 0 12px 8px", fontSize: "15px", fontWeight: 700 }}>Activity</h4>
                        {pendingRequests.length === 0 && notifications.length === 0 ? (
                          <div style={{ padding: "20px", textAlign: "center", color: "#666", fontSize: "13px" }}>No new activity</div>
                        ) : (
                          <>
                            {pendingRequests.map(req => {
                              const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                              const avatar = req.profile_pic ? (req.profile_pic.startsWith("/uploads") ? `${API}${req.profile_pic}` : req.profile_pic) : `https://ui-avatars.com/api/?name=${req.name}&background=0D1117&color=fff`;
                              return (
                                <div key={req.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.05)", marginBottom: "8px", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                                  <img src={avatar} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                                  <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.3" }}>
                                    <Link href={`/profile/${req.username}`} onClick={() => setShowDropdown(false)} style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>{req.name}</Link>
                                    <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>Requests to follow you</div>
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <button onClick={(e) => handleAcceptRequest(req.id, e)} style={{ padding: "5px 10px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#2563eb"} onMouseLeave={(e) => e.currentTarget.style.background = "#3b82f6"}>Accept</button>
                                    <button onClick={(e) => handleRejectRequest(req.id, e)} style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#ccc", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>Ignore</button>
                                  </div>
                                </div>
                              );
                            })}

                            {notifications.map(n => {
                              const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                              const avatar = n.profile_pic ? (n.profile_pic.startsWith("/uploads") ? `${API}${n.profile_pic}` : n.profile_pic) : `https://ui-avatars.com/api/?name=${n.name}&background=0D1117&color=fff`;
                              return (
                                <div key={n.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", marginBottom: "4px" }}>
                                  <img src={avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }} />
                                  <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>
                                    <Link href={`/profile/${n.username}`} onClick={() => setShowDropdown(false)} style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>{n.name}</Link>
                                    {n.type === 'friend_accepted' ? " accepted your request!" : " interacted with you."}
                                  </div>
                                  <button onClick={() => markNotifRead(n.id)} style={{ padding: "6px", background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "18px", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#fff"} onMouseLeave={(e) => e.currentTarget.style.color = "#555"}>×</button>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Link href={`/profile/${user.username}`} className="nav-profile">
                  <div className="nav-avatar">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  {user.username}
                </Link>
                <button onClick={handleLogout} className="nav-btn">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="nav-profile" style={{ paddingLeft: "14px" }}>
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="nav-spacer" />
    </>
  );
}