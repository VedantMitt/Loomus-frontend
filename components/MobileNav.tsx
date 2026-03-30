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
  if (!user) return null;

  const links = [
    {
      name: "Discover",
      href: "/discover",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
    {
      name: "Friends",
      href: "/friends",
      badge: hasBadge,
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      name: "Chat",
      href: "/chat",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
    },
    {
      name: "Play",
      href: "/play",
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
    {
      name: "Profile",
      href: `/profile/${user?.username}`,
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#3b82f6" : "#666"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .mobile-nav {
          display: none;
        }

        @media (max-width: 767px) {
          .mobile-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 60;
            background: rgba(10, 10, 10, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding: 8px 0 calc(8px + env(safe-area-inset-bottom, 0px));
            justify-content: space-around;
            align-items: center;
          }

          .mobile-nav-spacer {
            display: block;
            height: calc(72px + env(safe-area-inset-bottom, 0px));
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
          gap: 3px;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 12px;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }

        .mn-link:active {
          transform: scale(0.9);
        }

        .mn-label {
          font-size: 10px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }

        .mn-label.active {
          color: #3b82f6;
        }

        .mn-label.inactive {
          color: #555;
        }

        .mn-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
        }
      `}</style>

      <div className="mobile-nav">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link key={link.name} href={link.href} className="mn-link">
              {link.badge && <div className="mn-badge" />}
              {link.icon(isActive)}
              <span className={`mn-label ${isActive ? "active" : "inactive"}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mobile-nav-spacer" />
    </>
  );
}
