"use client";

import { useEffect, useState, useCallback } from "react";
import FriendCard from "@/components/FriendCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NebulaBackground from "@/components/NebulaBackground";
import StatusBar from "@/components/StatusBar";

type Friend = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  online: boolean;
  current_status?: string;
  status_updated_at?: string;
};

type User = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  college: string;
};

type PendingRequest = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  college: string;
  year?: string;
  created_at: string;
};

type AppNotification = {
  id: string;
  type: string;
  created_at: string;
  name: string;
  username: string;
  profile_pic?: string;
  college?: string;
  year?: string;
};

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "notifications">("friends");
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<User[]>([]);

  // Friend suggestions for empty state
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoadingSuggestions(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/discover`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.slice(0, 6)); // Top 6 suggestions
      }
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const fetchSearchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/users/discover?search=${searchTerm.trim()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search) fetchSearchSuggestions(search);
      else setSearchSuggestions([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchSearchSuggestions]);

  const fetchFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to fetch friends", err);
    } finally {
      setLoadingFriends(false);
    }
  }, [router]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/friends/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchNotifications();
    fetchSuggestions();
    
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, [fetchFriends, fetchRequests, fetchNotifications, fetchSuggestions]);

  useEffect(() => {
    const onRefresh = () => {
      fetchFriends();
      fetchRequests();
      fetchNotifications();
    };
    window.addEventListener("app_refresh", onRefresh);
    return () => window.removeEventListener("app_refresh", onRefresh);
  }, [fetchFriends, fetchRequests, fetchNotifications]);

  const handleStatusUpdate = (newStatus: string) => {
    if (currentUser) {
      const updatedUser = { 
        ...currentUser, 
        current_status: newStatus,
        status_updated_at: new Date().toISOString()
      };
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      // Re-fetch friends to see if anyone else's status changed (though unlikely to be needed immediately)
      fetchFriends();
    }
  };

  const acceptRequest = async (userId: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/accept/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRequests();
        fetchFriends();
        setActiveTab("friends");
      }
    } catch (err) {
      console.error("Error accepting request", err);
    }
  };

  const rejectRequest = async (userId: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/remove/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error("Error rejecting request", err);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground orb1="#34d399" orb2="#0ea5e9" orb3="#a855f7" orb4="#6366f1" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        /* 🔎 Search Component */
        .search-container {
          position: relative;
          max-width: 650px;
          margin: 0 auto 16px;
          z-index: 100;
        }
        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 12px 18px 12px 44px;
          border-radius: 20px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .search-input:focus {
          border-color: #34d399;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 15px 50px rgba(52, 211, 153, 0.15);
          transform: translateY(-2px);
        }
        .search-icon {
          position: absolute;
          left: 18px;
          top: 16px;
          color: #666;
          pointer-events: none;
        }
        .search-clear {
          position: absolute;
          right: 18px;
          top: 16px;
          color: #666;
          cursor: pointer;
          transition: 0.2s;
        }
        .search-clear:hover { color: #fff; }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          left: 0; right: 0;
          background: rgba(13, 13, 17, 0.85);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.7);
          overflow: hidden;
          animation: dropSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          text-decoration: none;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .suggestion-item:hover { background: rgba(255,255,255,0.05); }

        .friends-container {
          max-width: 900px;
          margin: 0 auto;
          padding: calc(50px + env(safe-area-inset-top, 0px)) 16px 100px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .fp-hero {
          position: relative;
          text-align: center;
          margin-bottom: 20px;
          padding-top: 8px;
        }
        .fp-hero::before {
          content: '';
          position: absolute;
          top: 0%; left: 50%;
          transform: translate(-50%, -40%);
          width: 80vw;
          height: 250px;
          background: radial-gradient(circle, rgba(52,211,153,0.15) 0%, rgba(14,165,233,0.1) 30%, transparent 70%);
          filter: blur(40px);
          z-index: -1;
          pointer-events: none;
        }

        .fp-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #34d399 50%, #0ea5e9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .fp-tabs {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px;
          border-radius: 18px;
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fp-tab {
          padding: 8px 20px;
          background: transparent;
          border: none;
          color: #888;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 12px;
        }

        .fp-tab:hover {
          color: #fff;
        }

        .fp-tab.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .fp-badge {
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 99px;
          margin-left: 8px;
        }

        .req-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          margin-bottom: 12px;
          transition: all 0.3s;
        }
        .req-card:hover {
          border-color: rgba(52, 211, 153, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .req-avatar {
          width: 64px; height: 64px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.1);
          object-fit: cover;
        }

        .req-btn {
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s;
        }
        .req-btn-accept {
          background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
          color: #fff;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
        }
        .req-btn-reject {
          background: rgba(255, 255, 255, 0.05);
          color: #888;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .fp-empty {
          text-align: center;
          padding: 60px 24px;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
          border: 1px dashed rgba(255,255,255,0.1);
        }
      `}</style>

      <main className="friends-container">

        {/* 🔎 Search Bar + Floating Results */}
        <div className="search-container">
          <div style={{ position: 'relative' }}>
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Search people by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (search) setIsSearching(true); }}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            />
            {search && (
              <div className="search-clear" onClick={() => { setSearch(""); setSearchSuggestions([]); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {(search.trim() && (isSearching || searchSuggestions.length > 0)) && (
            <div className="search-dropdown">
              {isSearching && searchSuggestions.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 13 }}>Searching Loomus...</div>
              ) : searchSuggestions.length > 0 ? (
                searchSuggestions.map((user: User) => {
                  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                  const avatar = user.profile_pic ? (user.profile_pic.startsWith("/uploads") ? `${API}${user.profile_pic}` : user.profile_pic) : `https://ui-avatars.com/api/?name=${user.name}&background=0D1117&color=fff`;
                  return (
                    <Link key={user.id} href={`/profile/${user.username}`} className="suggestion-item">
                      <img src={avatar} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: "#666" }}>@{user.username}</div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                !isSearching && <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 13 }}>No users found for "{search}"</div>
              )}
            </div>
          )}
        </div>

        <div className="fp-tabs">
          <button className={`fp-tab ${activeTab === "friends" ? "active" : ""}`} onClick={() => setActiveTab("friends")}>Friends</button>
          <button className={`fp-tab ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
            Requests {requests.length > 0 && <span className="fp-badge">{requests.length}</span>}
          </button>
        </div>

        {activeTab === "friends" ? (
          <>
            <StatusBar 
              friends={friends} 
              currentUser={currentUser} 
              onStatusUpdate={handleStatusUpdate} 
            />
            {loadingFriends ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={`skel-f-${i}`} className="exp-skeleton" style={{ width: '100%', height: '80px', borderRadius: '18px' }} />
                ))}
              </div>
            ) : friends.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                {friends.map((f) => (
                  <FriendCard key={f.id} friend={f} onRemove={fetchFriends} />
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h2 style={{ color: "#eee", fontSize: 22, fontWeight: 800 }}>Suggested Friends</h2>
                  <p style={{ color: "#888", fontSize: 14 }}>People you might know</p>
                </div>
                {loadingSuggestions ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    {[...Array(3)].map((_, i) => (
                      <div key={`skel-sug-${i}`} className="exp-skeleton" style={{ width: '100%', maxWidth: '300px', height: '140px', borderRadius: '18px' }} />
                    ))}
                  </div>
                ) : suggestions.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
                    {suggestions.map((user, i) => (
                      <div key={user.id} style={{ 
                        background: "rgba(255,255,255,0.03)", 
                        border: "1px solid rgba(255,255,255,0.08)", 
                        borderRadius: "20px", 
                        padding: "16px", 
                        width: "100%", 
                        maxWidth: "340px",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px"
                      }}>
                        <Link href={`/profile/${user.username}`}>
                          <img 
                            src={user.profile_pic ? (user.profile_pic.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${user.profile_pic}` : user.profile_pic) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D1117&color=fff`} 
                            alt="" 
                            style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} 
                          />
                        </Link>
                        <div style={{ flex: 1 }}>
                          <Link href={`/profile/${user.username}`} style={{ textDecoration: "none", color: "#fff", fontWeight: 700, fontSize: "16px" }}>
                            {user.name}
                          </Link>
                          <div style={{ color: "#888", fontSize: "13px", marginTop: "2px" }}>@{user.username}</div>
                        </div>
                        <Link href={`/profile/${user.username}`} style={{ padding: "8px 16px", background: "#3b82f6", color: "#fff", textDecoration: "none", borderRadius: "12px", fontWeight: 700, fontSize: "13px", transition: "0.2s" }}>
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="fp-empty">
                    <div style={{ fontSize: 48, marginBottom: 20 }}>🤝</div>
                    <h2 style={{ color: "#eee", fontSize: 24, fontWeight: 800 }}>No friends yet</h2>
                    <p style={{ color: "#666", maxWidth: 400, margin: "12px auto 24px" }}>Start exploring the campus and build your dream team!</p>
                    <Link href="/discover" style={{ display: "inline-block", padding: "14px 32px", background: "#34d399", color: "#fff", borderRadius: 16, fontWeight: 800, textDecoration: "none", boxShadow: "0 10px 25px rgba(52, 211, 153, 0.25)" }}>Discover People</Link>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          loadingRequests ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(3)].map((_, i) => (
                <div key={`skel-req-${i}`} className="exp-skeleton" style={{ width: '100%', height: '90px', borderRadius: '18px' }} />
              ))}
            </div>
          ) : requests.length > 0 ? (
            <div>
              {requests.map((req) => {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const avatar = req.profile_pic
                  ? req.profile_pic.startsWith("/uploads") ? `${API}${req.profile_pic}` : req.profile_pic
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(req.name)}&background=0D1117&color=fff&size=200`;

                return (
                  <div key={req.id} className="req-card">
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                      <Link href={`/profile/${req.username}`}><img src={avatar} className="req-avatar" alt="" /></Link>
                      <div>
                        <Link href={`/profile/${req.username}`} style={{ textDecoration: "none", color: "#fff", fontSize: 18, fontWeight: 800 }}>{req.name}</Link>
                        <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>@{req.username}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button className="req-btn req-btn-reject" onClick={() => rejectRequest(req.id)}>Ignore</button>
                      <button className="req-btn req-btn-accept" onClick={() => acceptRequest(req.id)}>Accept</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fp-empty">
              <div style={{ fontSize: 48, marginBottom: 20 }}>📬</div>
              <h2 style={{ color: "#eee", fontSize: 24, fontWeight: 800 }}>Clean Inbox</h2>
              <p style={{ color: "#666" }}>No pending requests at the moment.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
