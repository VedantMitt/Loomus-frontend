"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import LocationAutocomplete from "./LocationAutocomplete";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [hasUnreadDMs, setHasUnreadDMs] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInvisible, setIsInvisible] = useState(false);
  const [globalLocation, setGlobalLocation] = useState("");
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchVal, setLocationSearchVal] = useState("");

  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickInDesktop = desktopDropdownRef.current && desktopDropdownRef.current.contains(target);
      const clickInMobile = mobileDropdownRef.current && mobileDropdownRef.current.contains(target);
      
      if (!clickInDesktop && !clickInMobile) {
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

    checkUser();

    const storedLoc = localStorage.getItem("global_location");
    if (storedLoc) {
      setGlobalLocation(storedLoc);
    } else {
      setGlobalLocation("Delhi, India");
      localStorage.setItem("global_location", "Delhi, India");
    }

    // Custom event listener for instant auth state updates without route changes
    window.addEventListener("auth-change", checkUser);
    return () => window.removeEventListener("auth-change", checkUser);
  }, [pathname]);

  const handleGlobalLocationChange = (val: string) => {
    setGlobalLocation(val);
    localStorage.setItem("global_location", val);
    window.dispatchEvent(new CustomEvent("global_location_change", { detail: val }));
  };

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

        if (reqRes.ok) {
          const data = await reqRes.json();
          setPendingRequests(data);
          setHasPendingRequests(data.length > 0);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data);
        }

        if (chatRes.ok) {
          const data = await chatRes.json();
          setHasUnreadDMs(data.some((c: any) => parseInt(c.unread_count) > 0));
        }
      } catch (err) {
        console.warn("Failed to fetch alerts in Navbar", err);
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

  const handleToggleDropdown = () => {
    if (!showDropdown) {
      const hasUnread = notifications.some(n => !n.is_read);
      if (hasUnread) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        if (token) {
          fetch(`${API}/notifications/read-all`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }
          }).catch(err => console.error(err));
        }
      }
    }
    setShowDropdown(!showDropdown);
  };

  const handleAcceptRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${API}/friends/accept/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      setHasPendingRequests(pendingRequests.length - 1 > 0);
    } catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      await fetch(`${API}/friends/remove/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setPendingRequests(prev => prev.filter(r => r.id !== id));
      setHasPendingRequests(pendingRequests.length - 1 > 0);
    } catch (err) { console.error(err); }
  };

  const hideNavOn = ["/", "/auth/login", "/login"];
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
    { name: "Chapters", href: "/chapters" },
    // { name: "Play", href: "/play" },
    // { name: "Rooms", href: "/rooms" },
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

        .nav-location-selector {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 99px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: 20px;
        }
        .nav-location-selector:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(244,114,182,0.4);
        }
        .nav-location-input {
          background: transparent !important;
          border: none !important;
          color: white !important;
          font-size: 13px !important;
          outline: none !important;
          width: 140px;
          text-overflow: ellipsis;
        }
        .nav-location-input::placeholder {
          color: rgba(255,255,255,0.4);
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

        .mobile-top-nav {
          display: none;
        }

        .mtn-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          border-radius: 14px;
          color: #fff;
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .mtn-btn:active {
          transform: scale(0.95);
          background: rgba(255,255,255,0.12);
        }

        @media (max-width: 767px) {
          .nav-wrapper { display: none !important; }
          .nav-spacer { display: block !important; height: calc(76px + env(safe-area-inset-top, 0px)); }
          .notif-panel { position: fixed; top: calc(76px + env(safe-area-inset-top, 0px)); left: 12px; right: 12px; width: auto; z-index: 9999; }
          
          .mobile-top-nav {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 999;
            justify-content: space-between;
            align-items: center;
            padding: calc(16px + env(safe-area-inset-top, 0px)) 20px 16px;
            background: linear-gradient(to bottom, rgba(13, 13, 17, 0.95), rgba(13, 13, 17, 0.75));
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          }
          .mobile-top-nav::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(244,114,182,0.4), rgba(192,132,252,0.4), transparent);
          }
        }
      `}</style>

      <div className={`nav-wrapper ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div style={{ display: "flex", alignItems: "center" }}>
            <Link href="/" className="nav-logo">
              Loom<span>us</span>
            </Link>
            <button className="nav-location-selector" onClick={() => setShowLocationModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, color: '#f472b6', flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span style={{ fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {globalLocation}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 6, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
 
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
 
                <div style={{ position: "relative" }} ref={desktopDropdownRef}>
                  <button className="nav-action-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleToggleDropdown();
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                    {notifications.some(n => !n.is_read) && <div className="notif-dot" />}
                  </button>
 
                  {/* Dropdown rendered outside layout bounds for desktop, but mobile overrides below */}
                  {showDropdown && (
                    <div className="notif-panel desktop-notif">
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
                            if (n.type === 'post_like') {
                              message = "liked your photo!";
                              link = `/scrapbook/${meta?.activity_id}`;
                            }
                            if (n.type === 'post_comment') {
                              message = "commented on your photo!";
                              link = `/scrapbook/${meta?.activity_id}`;
                            }
                            if (n.type === 'comment_like') {
                              message = "liked your comment!";
                              link = `/scrapbook/${meta?.activity_id}`;
                            }
                            if (n.type === 'comment_reply') {
                              message = "replied to your comment!";
                              link = `/scrapbook/${meta?.activity_id}`;
                            }
                            if (n.type === 'comment_mention') {
                              message = "mentioned you in a comment!";
                              link = `/scrapbook/${meta?.activity_id}`;
                            }
 
                             return (
                               <div key={n.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderRadius: "16px", background: n.is_read ? "rgba(255,255,255,0.02)" : (n.type === 'game_invite' ? "rgba(6, 182, 212, 0.08)" : (n.type === 'room_invite' ? "rgba(6, 182, 212, 0.08)" : "rgba(244, 114, 182, 0.08)")), marginBottom: "4px", border: n.is_read ? "1px solid rgba(255,255,255,0.05)" : (['game_invite', 'room_invite'].includes(n.type) ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(244, 114, 182, 0.2)"), opacity: n.is_read ? 0.6 : 1, transition: 'all 0.3s ease' }}>
                                 <img src={avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                                 <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>
                                   <Link href={link} onClick={() => { setShowDropdown(false); }} style={{ color: "inherit", textDecoration: "none" }}>
                                      <span style={{ color: "#fff", fontWeight: 700 }}>{n.name}</span>
                                      {" "}{message}
                                      {(n.type === 'game_invite' || n.type === 'room_invite') && meta?.title && (
                                        <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{n.type === 'game_invite' ? 'Party' : 'Room'}: {meta.title}</div>
                                      )}
                                   </Link>
                                 </div>
                                 {(n.type === 'game_invite' || n.type === 'room_invite' || n.type === 'activity_invite') && (
                                   <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                      <button 
                                        onClick={async (e) => { 
                                          e.stopPropagation();
                                          e.preventDefault();
                                          
                                          if (n.type === 'activity_invite') {
                                            try {
                                              const token = localStorage.getItem("token");
                                              await fetch(`${API}/activities/${meta?.activity_id}/rsvp`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                body: JSON.stringify({ status: 'going' })
                                              });
                                            } catch (e) { console.error(e); }
                                          }
                                          
                                          setShowDropdown(false); 
                                          router.push(link); 
                                        }} 
                                        style={{ padding: "5px 10px", background: (n.type === 'game_invite' || n.type === 'activity_invite') ? "#f472b6" : "#06b6d4", color: "#fff", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                                      >
                                        Join
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)); }} 
                                        style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                      >
                                        Ignore
                                      </button>
                                   </div>
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

      <div className="mobile-top-nav">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/" className="nav-logo" style={{ fontSize: "20px" }}>
            Loom<span>us</span>
          </Link>
          <button style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setShowLocationModal(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, color: '#f472b6', flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', textAlign: 'left' }}>
              {globalLocation}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/chat" className="mtn-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {hasUnreadDMs && <div className="notif-dot" style={{ width: 8, height: 8, top: -2, right: -2, border: "2px solid #141414" }} />}
          </Link>
          <div style={{ position: "relative" }} ref={mobileDropdownRef}>
            <button className="mtn-btn" onClick={(e) => {
              e.stopPropagation();
              handleToggleDropdown();
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {(notifications.some(n => !n.is_read) || hasPendingRequests) && <div className="notif-dot" style={{ width: 8, height: 8, top: -2, right: -2, border: "2px solid #141414" }} />}
            </button>
            {/* Mobile Dropdown reused from above */}
            {showDropdown && (
              <div className="notif-panel mobile-notif">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ color: "#fff", margin: 0, fontSize: "16px", fontWeight: 800 }}>Activity</h4>
                  <button onClick={() => setShowDropdown(false)} style={{ background: "none", border: "none", color: "#666", fontSize: "20px", cursor: "pointer" }}>✕</button>
                </div>
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
                      if (n.type === 'post_like') {
                        message = "liked your photo!";
                        link = `/scrapbook/${meta?.activity_id}`;
                      }
                      if (n.type === 'post_comment') {
                        message = "commented on your photo!";
                        link = `/scrapbook/${meta?.activity_id}`;
                      }
                      if (n.type === 'comment_like') {
                        message = "liked your comment!";
                        link = `/scrapbook/${meta?.activity_id}`;
                      }
                      if (n.type === 'comment_reply') {
                        message = "replied to your comment!";
                        link = `/scrapbook/${meta?.activity_id}`;
                      }
                      if (n.type === 'comment_mention') {
                        message = "mentioned you in a comment!";
                        link = `/scrapbook/${meta?.activity_id}`;
                      }

                        return (
                          <div key={n.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderRadius: "16px", background: n.is_read ? "rgba(255,255,255,0.02)" : (n.type === 'game_invite' ? "rgba(6, 182, 212, 0.08)" : (n.type === 'room_invite' ? "rgba(6, 182, 212, 0.08)" : "rgba(244, 114, 182, 0.08)")), marginBottom: "4px", border: n.is_read ? "1px solid rgba(255,255,255,0.05)" : (['game_invite', 'room_invite'].includes(n.type) ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(244, 114, 182, 0.2)"), opacity: n.is_read ? 0.6 : 1, transition: 'all 0.3s ease' }}>
                            <img src={avatar} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }} />
                            <div style={{ flex: 1, fontSize: "13px", color: "#ccc", lineHeight: "1.4" }}>
                              <Link href={link} onClick={() => { setShowDropdown(false); }} style={{ color: "inherit", textDecoration: "none" }}>
                                <span style={{ color: "#fff", fontWeight: 700 }}>{n.name}</span>
                                {" "}{message}
                                {(n.type === 'game_invite' || n.type === 'room_invite') && meta?.title && (
                                  <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>{n.type === 'game_invite' ? 'Party' : 'Room'}: {meta.title}</div>
                                )}
                              </Link>
                            </div>
                            {(n.type === 'game_invite' || n.type === 'room_invite' || n.type === 'activity_invite') && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <button 
                                  onClick={async (e) => { 
                                    e.stopPropagation();
                                    e.preventDefault();
                                    
                                    if (n.type === 'activity_invite') {
                                      try {
                                        const token = localStorage.getItem("token");
                                        await fetch(`${API}/activities/${meta?.activity_id}/rsvp`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                          body: JSON.stringify({ status: 'going' })
                                        });
                                      } catch (e) { console.error(e); }
                                    }
                                    
                                    setShowDropdown(false); 
                                    router.push(link); 
                                  }} 
                                  style={{ padding: "5px 10px", background: (n.type === 'game_invite' || n.type === 'activity_invite') ? "#f472b6" : "#06b6d4", color: "#fff", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 800, cursor: "pointer" }}
                                >
                                  Join
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setNotifications(prev => prev.filter(x => x.id !== n.id)); }} 
                                  style={{ padding: "5px 10px", background: "rgba(255,255,255,0.08)", color: "#ccc", border: "none", borderRadius: "8px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                >
                                  Ignore
                                </button>
                              </div>
                            )}
                          </div>
                        );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nav-spacer" />
      
      {showLocationModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setShowLocationModal(false)}>
          <div style={{ background: 'rgba(13, 13, 17, 0.85)', backdropFilter: 'blur(40px)', width: '100%', maxWidth: '380px', borderRadius: '28px', padding: '28px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>Set Location</h3>
              <button onClick={() => setShowLocationModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a8a29e', fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='#a8a29e'}>✕</button>
            </div>
            
            <button 
              onClick={() => {
                handleGlobalLocationChange("Current Location");
                setShowLocationModal(false);
              }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '14px', background: 'linear-gradient(145deg, rgba(244,114,182,0.15), rgba(192,132,252,0.1))', border: '1px solid rgba(244,114,182,0.3)', padding: '16px 20px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s ease', marginBottom: '24px', color: '#fff', fontWeight: 700, fontSize: '15px', boxShadow: '0 8px 24px rgba(244,114,182,0.15)' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(244,114,182,0.25)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.5)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(244,114,182,0.15)'; e.currentTarget.style.borderColor = 'rgba(244,114,182,0.3)'; }}
            >
              <div style={{ background: 'rgba(244,114,182,0.2)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              Use current location
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or search manually</div>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '24px', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none', zIndex: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <LocationAutocomplete 
                value={locationSearchVal} 
                onChange={setLocationSearchVal}
                onSelect={(val) => {
                  handleGlobalLocationChange(val);
                  setShowLocationModal(false);
                  setLocationSearchVal("");
                }}
                placeholder="Search for your city..."
                inputClassName="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-2xl pl-[44px] pr-4 py-[14px] text-[15px] outline-none focus:border-[#c084fc] focus:bg-[rgba(255,255,255,0.06)] text-white transition-all placeholder-white/30"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}