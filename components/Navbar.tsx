"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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
  const [isInvisible, setIsInvisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  useEffect(() => {
     const checkUser = () => {
       try {
         const storedUser = localStorage.getItem("user");
         if (storedUser) {
           const parsed = JSON.parse(storedUser);
           setUser(parsed);
           setIsInvisible(!!parsed.is_invisible);
         } else {
           setUser(null);
         }
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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
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
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 24px 24px;
          display: flex;
          justify-content: center;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
          max-width: 1100px;
          background: rgba(10, 10, 12, 0.35);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          padding: 10px 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Outfit', sans-serif;
        }

        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
          letter-spacing: -0.05em;
          display: flex;
          align-items: center;
          transition: transform 0.3s ease;
        }
        .nav-logo:hover { transform: scale(1.05); }

        .nav-logo span {
          background: linear-gradient(135deg, #f472b6 0%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-left: 0.5px;
        }

        .nav-links {
          display: none;
          align-items: center;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .nav-links { display: flex; }
        }

        .nav-link {
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          padding: 8px 4px;
        }
        .nav-link:hover { color: #fff; }
        .nav-link.active { color: #fff; }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f472b6, transparent);
          transition: all 0.3s ease;
          transform: translateX(-50%);
          opacity: 0;
        }
        .nav-link:hover::after, .nav-link.active::after {
          width: 20px;
          opacity: 1;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-action-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        .nav-action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
          transform: translateY(-2px);
        }

        .nav-profile-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 14px 6px 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .nav-profile-pill:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateX(4px);
        }

        .nav-avatar-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f472b6 0%, #c084fc 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 4px 10px rgba(244, 114, 182, 0.3);
        }

        .nav-logout-btn {
          padding: 8px 16px;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 100, 100, 0.7);
          background: rgba(255, 100, 100, 0.05);
          border: 1px solid rgba(255, 100, 100, 0.15);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .nav-logout-btn:hover {
          background: rgba(255, 100, 100, 0.15);
          border-color: rgba(255, 100, 100, 0.3);
          color: #ff6b6b;
        }

        .notif-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #f472b6;
          border-radius: 50%;
          box-shadow: 0 0 10px #f472b6;
          border: 2px solid #000;
        }

        .notif-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 16px;
          width: 340px;
          background: #121216;
          backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
          z-index: 1000;
          max-height: 400px;
          overflow-y: auto;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-spacer { height: 100px; }

        @media (max-width: 767px) {
          .nav-wrapper { padding: 12px; }
          .nav-container { border-radius: 20px; padding: 8px 16px; }
          .nav-profile-pill, .nav-logout-btn, .nav-action-btn-text { display: none !important; }
          .notif-panel { position: fixed; top: 80px; left: 12px; right: 12px; width: auto; }
        }
      `}</style>

      <div className={`nav-wrapper ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            Loom<span>us</span>
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
                  <div className="notif-dot" style={{ top: 0, right: 0 }} />
                )}
              </Link>
            ))}
          </div>
 
          <div className="nav-actions">
            {user ? (
              <>
                <Link href="/chat" className="nav-action-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  {hasUnreadDMs && <div className="notif-dot" />}
                </Link>
 
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button className="nav-action-btn" onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {notifications.some(n => !n.is_read) && <div className="notif-dot" />}
                  </button>
 
                  {showDropdown && (
                    <div className="notif-panel">
                      <h4 style={{ color: "#fff", margin: "0 0 16px", fontSize: "16px", fontWeight: 800 }}>Activity</h4>
                      {pendingRequests.length === 0 && notifications.length === 0 ? (
                        <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>No new activity</div>
                      ) : (
                        <>
                          {pendingRequests.map(req => {
                            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                            const avatar = req.profile_pic ? (req.profile_pic.startsWith("/uploads") ? `${API}${req.profile_pic}` : req.profile_pic) : `https://ui-avatars.com/api/?name=${req.name}&background=0D1117&color=fff`;
                            return (
                              <div key={req.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderRadius: "16px", background: "rgba(59, 130, 246, 0.08)", marginBottom: "12px", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                                <img src={avatar} alt="" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} />
                                <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.3" }}>
                                  <Link href={`/profile/${req.username}`} onClick={() => setShowDropdown(false)} style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}>{req.name}</Link>
                                  <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>Friend request</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <button onClick={(e) => handleAcceptRequest(req.id, e)} style={{ padding: "6px 12px", background: "#f472b6", color: "#fff", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>Accept</button>
                                  <button onClick={(e) => handleRejectRequest(req.id, e)} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.08)", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>Ignore</button>
                                </div>
                              </div>
                            );
                          })}
 
                          {notifications.map(n => {
                            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                            const avatar = n.profile_pic ? (n.profile_pic.startsWith("/uploads") ? `${API}${n.profile_pic}` : n.profile_pic) : `https://ui-avatars.com/api/?name=${n.name}&background=0D1117&color=fff`;
                            
                            let message = "interacted with you.";
                            let link = `/profile/${n.username}`;
                            const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
 
                            if (n.type === 'friend_accepted') message = "accepted your request!";
                            if (n.type === 'game_invite') {
                              const gName = meta?.game_name || (meta?.game_type === 'gtl' ? 'Guess the Lie' : 'DM Roulette');
                              message = `invited you to play ${gName}!`;
                              link = meta?.game_type === 'gtl' 
                                ? `/play/guess-the-lie?game=${meta.game_id}` 
                                : `/play/roulette?pool=${meta.game_id}`;
                            }
                            if (n.type === 'room_invite') {
                              message = "invited you to a room!";
                              link = `/rooms/${meta?.room_id}`;
                            }
                            if (n.type === 'room_approved') {
                              message = "approved your room request!";
                              link = `/rooms/${meta?.room_id}`;
                            }
                            if (n.type === 'activity_invite') {
                              message = "invited you to an activity!";
                              link = `/activities/${meta?.activity_id}`;
                            }
                            if (n.type === 'activity_announcement') {
                              message = `posted an announcement in ${meta?.title || 'an activity'}!`;
                              link = `/activities/${meta?.activity_id}?tab=announcements`;
                            }
 
                             return (
                               <div key={n.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderRadius: "16px", background: n.is_read ? "rgba(255,255,255,0.02)" : (n.type === 'game_invite' ? "rgba(6, 182, 212, 0.08)" : (n.type === 'room_invite' ? "rgba(6, 182, 212, 0.08)" : "rgba(244, 114, 182, 0.08)")), marginBottom: "4px", border: n.is_read ? "1px solid rgba(255,255,255,0.05)" : (['game_invite', 'room_invite'].includes(n.type) ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(244, 114, 182, 0.2)"), opacity: n.is_read ? 0.6 : 1, transition: 'all 0.3s ease' }}>
                                 <img src={avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                                 <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>
                                   <Link href={link} onClick={() => { markNotifRead(n.id); setShowDropdown(false); }} style={{ color: "inherit", textDecoration: "none" }}>
                                      <span style={{ color: "#fff", fontWeight: 700 }}>{n.name}</span>
                                      {" "}{message}
                                      {(n.type === 'game_invite' || n.type === 'room_invite') && meta?.title && (
                                        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{n.type === 'game_invite' ? 'Party' : 'Room'}: {meta.title}</div>
                                      )}
                                   </Link>
                                 </div>
                                 {(n.type === 'game_invite' || n.type === 'room_invite') && !n.is_read ? (
                                   <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                      <button 
                                        onClick={() => { window.location.href = link; markNotifRead(n.id); setShowDropdown(false); }} 
                                        style={{ padding: "5px 10px", background: n.type === 'game_invite' ? "#f472b6" : "#06b6d4", color: "#fff", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                                      >
                                        Join
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); markNotifRead(n.id); }} 
                                        style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                      >
                                        Ignore
                                      </button>
                                   </div>
                                 ) : (
                                   !n.is_read && (
                                     <button onClick={() => markNotifRead(n.id)} style={{ padding: "6px", background: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: "18px" }}>×</button>
                                   )
                                 )}
                               </div>
                             );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
 
                 <Link href={`/profile/${user.username}`} className="nav-profile-pill">
                   <div className="nav-avatar-circle" style={{ background: isInvisible ? "#333" : "linear-gradient(135deg, #f472b6 0%, #c084fc 100%)", boxShadow: isInvisible ? "none" : "0 4px 10px rgba(244, 114, 182, 0.3)" }}>
                     {user.name?.charAt(0).toUpperCase() || "U"}
                   </div>
                   <span className="nav-action-btn-text" style={{ color: isInvisible ? "#888" : "#fff" }}>{user.username}</span>
                 </Link>
 
                 {/* Invisible Mode Toggle */}
                 <button 
                   onClick={async () => {
                     try {
                       const newVal = !isInvisible;
                       const token = localStorage.getItem("token");
                       const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                       const res = await fetch(`${API}/users/${user.id}`, {
                         method: "PUT",
                         headers: {
                           "Content-Type": "application/json",
                           Authorization: `Bearer ${token}`
                         },
                         body: JSON.stringify({ is_invisible: newVal })
                       });
                       if (res.ok) {
                         setIsInvisible(newVal);
                         const updatedUser = { ...user, is_invisible: newVal };
                         localStorage.setItem("user", JSON.stringify(updatedUser));
                       }
                     } catch (err) {
                       console.error(err);
                     }
                   }}
                   className="nav-action-btn"
                   title={isInvisible ? "Invisible Mode (ON)" : "Invisible Mode (OFF)"}
                   style={{ 
                     background: isInvisible ? "rgba(244, 114, 182, 0.15)" : "rgba(255, 255, 255, 0.05)",
                     borderColor: isInvisible ? "rgba(244, 114, 182, 0.3)" : "rgba(255, 255, 255, 0.1)",
                     color: isInvisible ? "#f472b6" : "rgba(255, 255, 255, 0.6)"
                   }}
                 >
                   {isInvisible ? (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                       <line x1="1" y1="1" x2="23" y2="23"></line>
                     </svg>
                   ) : (
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                       <circle cx="12" cy="12" r="3"></circle>
                     </svg>
                   )}
                 </button>
 
                 <button onClick={handleLogout} className="nav-logout-btn">
                   Logout
                 </button>
              </>
            ) : (
              <Link href="/auth/login" className="nav-profile-pill" style={{ paddingLeft: "14px" }}>
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