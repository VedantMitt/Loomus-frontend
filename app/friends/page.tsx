"use client";

import { useEffect, useState, useCallback } from "react";
import FriendCard from "@/components/FriendCard";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  online: boolean;
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
  
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

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
  }, [fetchFriends, fetchRequests, fetchNotifications]);

  const acceptRequest = async (userId: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/accept/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh both lists
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

  const markNotifRead = async (id: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Error marking notification read", err);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .friends-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          font-family: 'DM Sans', sans-serif;
        }

        .fp-hero {
          text-align: center;
          margin-bottom: 40px;
        }

        .fp-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #34d399 50%, #0284c7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .fp-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 20px;
        }

        .fp-tab {
          padding: 10px 24px;
          background: transparent;
          border: none;
          color: #888;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          border-radius: 12px;
        }

        .fp-tab:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.03);
        }

        .fp-tab.active {
          color: #fff;
          background: rgba(99, 102, 241, 0.1);
        }

        .fp-tab.active::after {
          content: "";
          position: absolute;
          bottom: -21px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 3px;
          background: linear-gradient(90deg, #a5b4fc, #c084fc);
          border-radius: 999px;
        }

        .fp-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #ef4444;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          margin-left: 8px;
        }

        .fp-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .fp-empty {
          text-align: center;
          padding: 60px 20px;
          color: #666;
          background: rgba(255, 255, 255, 0.01);
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        
        .fp-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .fp-empty-text { font-size: 18px; font-weight: 600; color: #eee; }
        .fp-empty-sub { font-size: 14px; margin-top: 8px; max-width: 400px; margin-left: auto; margin-right: auto; }

        .fp-discover-btn {
          display: inline-block;
          margin-top: 24px;
          padding: 12px 28px;
          background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
          color: white;
          font-weight: 600;
          font-size: 14px;
          border-radius: 12px;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .fp-discover-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(147, 51, 234, 0.3);
        }

        /* Requests specific */
        .req-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }
        
        /* Notifications specific */
        .notif-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.15);
          border-radius: 16px;
          margin-bottom: 12px;
        }
        .notif-btn {
          padding: 6px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: #fff;
          transition: all 0.2s;
        }
        .notif-btn:hover { background: rgba(255,255,255,0.1); }
        .req-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .req-avatar {
          width: 56px; height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.1);
          object-fit: cover;
        }
        .req-actions {
          display: flex;
          gap: 12px;
        }
        .req-btn {
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        .req-btn-accept {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.2);
        }
        .req-btn-accept:hover { background: rgba(52, 211, 153, 0.25); }
        .req-btn-reject {
          background: rgba(255, 255, 255, 0.05);
          color: #ccc;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .req-btn-reject:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        
        .req-name-link { text-decoration: none; color: inherit; }
        .req-name-link:hover { text-decoration: underline; }

        @media (max-width: 640px) {
          .req-card { flex-direction: column; align-items: stretch; gap: 20px; }
          .req-actions { justify-content: stretch; }
          .req-btn { flex: 1; text-align: center; }
        }
      `}</style>

      <main className="friends-page">
        {/* Hero */}
        <div className="fp-hero">
          <h1 className="fp-title">Your Circle</h1>
        </div>

        {/* Tabs */}
        <div className="fp-tabs">
          <button
            className={`fp-tab ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            My Friends
          </button>
          <button
            className={`fp-tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Friend Requests
            {requests.length > 0 && (
              <span className="fp-badge">{requests.length}</span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "friends" ? (
          /* FRIENDS TAB */
          loadingFriends ? (
            <div className="fp-empty">Loading friends...</div>
          ) : friends.length > 0 ? (
            <div className="fp-grid">
              {friends.map((f) => (
                <FriendCard key={f.id} friend={f} onRemove={fetchFriends} />
              ))}
            </div>
          ) : (
            <div className="fp-empty">
              <div className="fp-empty-icon">🤝</div>
              <h3 className="fp-empty-text">No friends yet</h3>
              <p className="fp-empty-sub">
                Your circle is empty! Browse the platform and connect with classmates.
              </p>
              <Link href="/discover" className="fp-discover-btn">
                Discover People
              </Link>
            </div>
          )
        ) : (
          /* REQUESTS TAB */
          loadingRequests ? (
            <div className="fp-empty">Loading requests...</div>
          ) : requests.length > 0 ? (
            <div className="fp-grid">
              {requests.map((req) => {
                const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                const avatar = req.profile_pic
                  ? req.profile_pic.startsWith("/uploads")
                    ? `${API}${req.profile_pic}`
                    : req.profile_pic
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(req.name)}&background=0D1117&color=fff&size=200`;

                return (
                  <div key={req.id} className="req-card">
                    <div className="req-info">
                      <Link href={`/profile/${req.username}`}>
                        <img src={avatar} alt={req.name} className="req-avatar" />
                      </Link>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#eee" }}>
                          <Link href={`/profile/${req.username}`} className="req-name-link">
                            {req.name}
                          </Link>
                        </div>
                        <div style={{ fontSize: "13px", color: "#888", marginTop: "2px" }}>
                          @{req.username} • {req.college}{req.year ? ` '${req.year.toString().slice(-2)}` : ""}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                          Requested {new Date(req.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="req-actions">
                      <button className="req-btn req-btn-reject" onClick={() => rejectRequest(req.id)}>
                        Ignore
                      </button>
                      <button className="req-btn req-btn-accept" onClick={() => acceptRequest(req.id)}>
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="fp-empty">
              <div className="fp-empty-icon">📫</div>
              <h3 className="fp-empty-text">No pending requests</h3>
              <p className="fp-empty-sub">
                You're all caught up! No incoming connection requests right now.
              </p>
            </div>
          )
        )}
      </main>
    </>
  );
}
