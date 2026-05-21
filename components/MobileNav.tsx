"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [hasBadge, setHasBadge] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        else setUser(null);
      } catch {}
    };
    checkUser();
    window.addEventListener("auth-change", checkUser);
    return () => window.removeEventListener("auth-change", checkUser);
  }, [pathname]);

  // Check for pending friend requests / notifications
  useEffect(() => {
    const checkBadges = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/friends/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHasBadge(data.length > 0);
        }
      } catch {}
    };
    checkBadges();
    const interval = setInterval(checkBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hide on auth pages
  const hideOn = ["/auth/login", "/login"];
  if (hideOn.includes(pathname)) return null;

  const links = [
    {
      name: "Feed",
      href: "/discover",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#888"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
    },
    {
      name: "Friends",
      href: "/friends",
      badge: hasBadge,
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#888"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      name: "Activities",
      href: "/activities",
      isCenter: true,
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      name: "Chapters",
      href: "/chapters",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#888"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: user ? `/profile/${user.username}` : "/auth/login",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#888"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .mobile-nav-wrapper {
          display: none;
        }

        @media (max-width: 767px) {
          .mobile-nav-wrapper {
            display: block;
            position: fixed;
            bottom: calc(16px + env(safe-area-inset-bottom, 0px));
            left: 16px;
            right: 16px;
            z-index: 90;
            pointer-events: none;
          }

          .mobile-nav {
            display: flex;
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 40px;
            padding: 8px 16px;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            pointer-events: auto;
            position: relative;
          }

          .mobile-nav-spacer {
            display: block;
            height: calc(100px + env(safe-area-inset-bottom, 0px));
          }
        }

        @media (min-width: 768px) {
          .mobile-nav-spacer {
            display: none;
          }
        }

        .mn-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .mn-link:active {
          transform: scale(0.85);
        }

        .mn-label {
          font-size: 10px;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
          opacity: 0;
          position: absolute;
          bottom: -8px;
          white-space: nowrap;
        }

        .mn-link.active .mn-label {
          opacity: 1;
          color: #3b82f6;
        }

        .mn-link.center-btn {
          position: absolute;
          left: 50%;
          transform: translateX(-50%) translateY(-22px);
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          width: 60px;
          height: 60px;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4), inset 0 2px 4px rgba(255,255,255,0.3);
          border: 4px solid #141414;
          z-index: 10;
        }

        .mn-link.center-btn:active {
          transform: translateX(-50%) translateY(-18px) scale(0.9);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.6);
        }

        .mn-link.center-btn .mn-label {
          display: none;
        }
        
        .mn-spacer {
          width: 60px;
        }

        .mn-badge {
          position: absolute;
          top: 6px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
        }
      `}</style>

      <div className="mobile-nav-wrapper">
        <div className="mobile-nav">
          {links.map((link) => {
            const isActive = pathname.startsWith(link.href);
            
            if (link.isCenter) {
              return (
                <div key="center-wrapper" style={{ display: "contents" }}>
                  <div className="mn-spacer" />
                  <Link href={link.href} className="mn-link center-btn">
                    {link.icon(isActive)}
                  </Link>
                </div>
              );
            }

            return (
              <Link key={link.name} href={link.href} className={`mn-link ${isActive ? 'active' : ''}`}>
                {link.badge && <div className="mn-badge" />}
                <div style={{ transform: isActive ? 'translateY(-6px)' : 'translateY(0)', transition: 'transform 0.2s' }}>
                  {link.icon(isActive)}
                </div>
                <span className="mn-label">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mobile-nav-spacer" />
    </>
  );
}
