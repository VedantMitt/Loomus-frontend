"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings } from "lucide-react";

type User = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  interests?: string[];
  vibe_tags?: string[];
  current_status?: string;
  status_updated_at?: string;
  friends_if?: string;
  profile_pic?: string;
  followers_count?: number;
  chapters_count?: number;
  looms_count?: number;
};

type Snap = {
  id: string;
  content_url: string;
  description: string;
  created_at: string;
  activity_title?: string;
  activity_id?: string;
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "chapters">("posts");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<"none" | "friends" | "request_sent" | "request_received" | "loading">("loading");
  
  const [isHoveringFriend, setIsHoveringFriend] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(payload.id);
    } catch (err) {
      console.error("Token decode error");
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const [userRes, snapsRes, chaptersRes] = await Promise.all([
          fetch(`${API}/users/${username}`),
          fetch(`${API}/users/${username}/snaps`),
          fetch(`${API}/users/${username}/chapters`)
        ]);
        
        if (!userRes.ok) throw new Error("User not found");
        
        const userData = await userRes.json();
        setUser(userData);

        if (snapsRes.ok) {
          const snapsData = await snapsRes.json();
          setSnaps(snapsData);
        }

        if (chaptersRes.ok) {
          const chaptersData = await chaptersRes.json();
          setChapters(chaptersData);
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  // Check friendship status
  useEffect(() => {
    if (!user || !currentUserId || user.id === currentUserId) {
      setFriendStatus("none");
      return;
    }

    async function checkStatus() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/friends/status/${user!.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setFriendStatus(data.status);
        } else {
          setFriendStatus("none");
        }
      } catch (err) {
        setFriendStatus("none");
      }
    }
    checkStatus();
  }, [user, currentUserId]);

  const handleAddFriend = async () => {
    if (!user) return;
    try {
      setFriendStatus("loading");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/request/${user.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setFriendStatus("request_sent");
      } else {
        setFriendStatus("none");
      }
    } catch {
      setFriendStatus("none");
    }
  };

  const handleAcceptFriend = async () => {
    if (!user) return;
    try {
      setFriendStatus("loading");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/accept/${user.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setFriendStatus("friends");
      } else {
        setFriendStatus("request_received");
      }
    } catch {
      setFriendStatus("request_received");
    }
  };

  const handleRemoveFriend = async () => {
    if (!user) return;
    try {
      setFriendStatus("loading");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/remove/${user.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setFriendStatus("none");
      } else {
        setFriendStatus("friends");
      }
    } catch {
      setFriendStatus("friends");
    }
  };

  const handleBlockUser = async () => {
    if (!user || !confirm(`Are you sure you want to block ${user.name}? You will no longer see each other's profiles.`)) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/${user.id}/block`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        router.push("/");
      } else {
        alert("Failed to block user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportUser = async () => {
    if (!user) return;
    const reason = prompt(`Why are you reporting ${user.name}?`);
    if (!reason) return;

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/${user.id}/report`, {
        method: "POST",
        headers: token ? { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        } : {},
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert("User reported successfully. Our team will review this shortly.");
      } else {
        alert("Failed to report user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async () => {
    if (!user) return;
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/initiate/${user.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat?conversation=${data.conversation_id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading profile...
      </div>
    );

  if (!user)
    return <div className="p-6 text-red-500">User not found</div>;

  const isOwnProfile = currentUserId === user.id;

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-12" style={{ paddingTop: '8px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .profile-container { max-width: 720px; margin: 0 auto; font-family: 'DM Sans', sans-serif; padding-bottom: 100px; }

        .profile-header {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 20px;
          padding: 24px;
          background: linear-gradient(145deg, rgba(40, 40, 40, 0.6), rgba(15, 15, 15, 0.8));
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }
        .profile-header::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 50%);
          z-index: 0;
          pointer-events: none;
        }
        .profile-header > * {
          z-index: 1;
        }
        @media (min-width: 640px) {
          .profile-header { gap: 28px; }
        }

        .avatar {
          width: 100px; height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #1a1a1a;
          flex-shrink: 0;
        }
        @media (min-width: 640px) {
          .avatar { width: 120px; height: 120px; }
        }

        .profile-card {
          background: #111;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 20px 24px;
          margin-top: 20px;
        }

        .section-title {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #555;
          margin-bottom: 10px;
        }

        .tag {
          display: inline-block;
          padding: 5px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          margin: 0 6px 6px 0;
        }
        .tag-blue { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .tag-purple { background: rgba(168,85,247,0.12); color: #c084fc; border: 1px solid rgba(168,85,247,0.2); }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.2);
          padding: 8px 16px;
          border-radius: 10px;
          color: #4ade80;
          font-size: 14px;
        }
        .status-dot {
          width: 8px; height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .friends-if-text {
          font-size: 15px;
          color: #ccc;
          line-height: 1.6;
          font-style: italic;
        }
        .friends-if-text::before { content: '"'; color: #555; font-size: 20px; }
        .friends-if-text::after { content: '"'; color: #555; font-size: 20px; }

        .empty-text { color: #444; font-size: 13px; font-style: italic; }
      `}</style>

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <img
            src={
              user.profile_pic
                ? user.profile_pic.startsWith("/uploads")
                  ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${user.profile_pic}`
                  : user.profile_pic
                : `https://ui-avatars.com/api/?name=${user.name}&background=0D1117&color=fff&size=200`
            }
            alt={user.name}
            className="avatar"
          />
          <div style={{ textAlign: "left", flex: 1 }}>
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>{user.name}</h1>
            <p style={{ color: "#666", fontSize: "13px", marginTop: "2px" }}>@{user.username}</p>

            <div style={{ display: 'flex', gap: '20px', marginTop: '12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{user.followers_count || 0}</span>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Followers</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{user.chapters_count || 0}</span>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Chapters</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{user.looms_count || 0}</span>
                <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Looms</span>
              </div>
            </div>

            {user.bio && (
              <p style={{ color: "#999", fontSize: "13px", marginTop: "4px", maxWidth: "400px" }}>
                {user.bio}
              </p>
            )}
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-start" }}>
              {isOwnProfile ? (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => router.push("/profile/edit")}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      color: "#000",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => router.push("/preferences")}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      background: "#222",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="My Preferences"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              ) : (
                <>
                  {friendStatus === "loading" ? (
                    <button style={{ padding: "8px 20px", borderRadius: "8px", background: "#333", color: "#aaa", border: "none", fontWeight: 600, fontSize: "13px" }} disabled>
                      Loading...
                    </button>
                  ) : friendStatus === "friends" ? (
                    <button 
                      onMouseEnter={() => setIsHoveringFriend(true)}
                      onMouseLeave={() => setIsHoveringFriend(false)}
                      onClick={handleRemoveFriend}
                      style={{ padding: "8px 20px", borderRadius: "8px", background: isHoveringFriend ? "rgba(239, 68, 68, 0.15)" : "rgba(52, 211, 153, 0.15)", color: isHoveringFriend ? "#ef4444" : "#34d399", border: isHoveringFriend ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(52, 211, 153, 0.2)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {isHoveringFriend ? "Remove Friend" : "✓ Friends"}
                    </button>
                  ) : friendStatus === "request_sent" ? (
                    <button style={{ padding: "8px 20px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.1)", color: "#ccc", border: "1px solid rgba(255, 255, 255, 0.2)", fontWeight: 600, fontSize: "13px", cursor: "default" }}>
                      Request Sent
                    </button>
                  ) : friendStatus === "request_received" ? (
                    <button onClick={handleAcceptFriend} style={{ padding: "8px 20px", borderRadius: "8px", background: "#34d399", color: "#000", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                      Accept Request
                    </button>
                  ) : (
                    <button onClick={handleAddFriend} style={{ padding: "8px 20px", borderRadius: "8px", background: "#1d4ed8", color: "#fff", border: "none", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                      Add Friend
                    </button>
                  )}
                  <button onClick={handleChat} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", width: "40px", height: "40px", borderRadius: "8px", background: "#1a1a1a", color: "#fff", border: "1px solid #333", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#333"} onMouseLeave={(e)=>e.currentTarget.style.background="#1a1a1a"} title="Direct Message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                  <div style={{ position: "relative" }}>
                    <button onClick={() => setShowOptions(!showOptions)} style={{ padding: "8px 12px", borderRadius: "8px", background: "#1a1a1a", color: "#fff", border: "1px solid #333", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                      •••
                    </button>
                    {showOptions && (
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: "8px", background: "#111", border: "1px solid #333", borderRadius: "8px", overflow: "hidden", zIndex: 10, minWidth: "140px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                        <button onClick={() => { setShowOptions(false); handleReportUser(); }} style={{ display: "block", width: "100%", padding: "12px 16px", background: "transparent", color: "#ccc", border: "none", borderBottom: "1px solid #222", fontSize: "13px", textAlign: "left", cursor: "pointer" }}>
                          Report User
                        </button>
                        <button onClick={() => { setShowOptions(false); handleBlockUser(); }} style={{ display: "block", width: "100%", padding: "12px 16px", background: "transparent", color: "#ef4444", border: "none", fontSize: "13px", textAlign: "left", cursor: "pointer" }}>
                          Block User
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginTop: '24px' }}>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{ 
              flex: 1, padding: '12px', background: 'transparent', border: 'none', 
              color: activeTab === 'posts' ? '#fff' : '#888',
              fontWeight: activeTab === 'posts' ? 'bold' : 'normal',
              borderBottom: activeTab === 'posts' ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Posts
          </button>
          <button 
            onClick={() => setActiveTab('chapters')}
            style={{ 
              flex: 1, padding: '12px', background: 'transparent', border: 'none', 
              color: activeTab === 'chapters' ? '#fff' : '#888',
              fontWeight: activeTab === 'chapters' ? 'bold' : 'normal',
              borderBottom: activeTab === 'chapters' ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Chapters
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: "2px" }}>
          {activeTab === 'posts' && (
            snaps.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "2px"
              }}>
                {snaps.map((snap) => (
                  <div key={snap.id} style={{
                    aspectRatio: "1/1",
                    background: "#222",
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden"
                  }} onClick={() => router.push(`/profile/${username}/feed#${snap.id}`)}>
                    {snap.content_url.endsWith('.mp4') ? (
                      <video
                        src={snap.content_url.startsWith('http') ? snap.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${snap.content_url}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        muted
                        loop
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <img 
                        src={snap.content_url.startsWith('http') ? snap.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${snap.content_url}`}
                        alt={snap.description || "Snap"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                <p style={{ fontSize: "14px" }}>No snaps posted yet</p>
              </div>
            )
          )}

          {activeTab === 'chapters' && (
            chapters.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "16px",
                padding: "16px",
                background: "rgba(255,255,255,0.02)"
              }}>
                {chapters.map((chapter, i) => {
                  const rotate = (i % 5) - 2;
                  return (
                    <div key={chapter.id} onClick={() => router.push(`/scrapbook/${chapter.id}`)} style={{
                      background: '#fff', padding: '8px 8px 30px', borderRadius: '4px', 
                      boxShadow: '0 8px 16px rgba(0,0,0,0.4)', cursor: 'pointer',
                      transform: `rotate(${rotate}deg)`,
                      transition: 'transform 0.2s',
                      display: 'flex', flexDirection: 'column'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = `scale(1.05) rotate(0deg)`} onMouseLeave={(e) => e.currentTarget.style.transform = `scale(1) rotate(${rotate}deg)`}>
                      <img 
                        src={chapter.media_url?.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${chapter.media_url}` : chapter.media_url || `https://source.unsplash.com/random/400x400/?${chapter.type || 'party'}`}
                        alt={chapter.title}
                        style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", backgroundColor: '#eee', borderRadius: '2px' }}
                      />
                      <div style={{ color: '#111', fontWeight: 800, fontSize: '13px', marginTop: '12px', textAlign: 'center', fontFamily: "'Syne', sans-serif" }}>
                        {chapter.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#666" }}>
                <p style={{ fontSize: "14px" }}>No chapters created yet</p>
              </div>
            )
          )}
        </div>

        {/* Logout Button (Own Profile Only) */}
        {isOwnProfile && (
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/auth/login");
              }}
              style={{
                padding: "12px 32px",
                borderRadius: "12px",
                background: "transparent",
                color: "#ef4444",
                border: "2px solid rgba(239, 68, 68, 0.3)",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              }}
            >
              Logout Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}