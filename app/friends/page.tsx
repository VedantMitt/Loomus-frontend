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
    
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
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

        .friends-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 60px 24px 100px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .fp-hero {
          text-align: center;
          margin-bottom: 48px;
        }

        .fp-title {
          font-family: 'Syne', sans-serif;
          font-size: 44px;
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
          margin-bottom: 40px;
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
          padding: 10px 24px;
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
          padding: 28px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          margin-bottom: 20px;
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
          padding: 100px 40px;
          background: rgba(255,255,255,0.02);
          border-radius: 40px;
          border: 1px dashed rgba(255,255,255,0.1);
        }
      `}</style>

      <main className="friends-container">
        <div className="fp-hero">
          <h1 className="fp-title">Your Circle</h1>
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
              <div className="fp-empty">Loading circle...</div>
            ) : friends.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                {friends.map((f) => (
                  <FriendCard key={f.id} friend={f} onRemove={fetchFriends} />
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
          </>
        ) : (
          loadingRequests ? (
            <div className="fp-empty">Checking incoming...</div>
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
                        <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>@{req.username} • {req.college}</div>
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
