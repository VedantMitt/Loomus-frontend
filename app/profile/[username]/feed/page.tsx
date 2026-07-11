"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, MessageCircle, Trash2 } from "lucide-react";

type Snap = {
  id: string;
  content_url: string;
  description: string;
  created_at: string;
  activity_title?: string;
  activity_id?: string;
  user_name?: string;
  user_username?: string;
  user_pic?: string;
};

export default function UserFeedPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock likes/comments for UI matching
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
        const [userRes, snapsRes] = await Promise.all([
          fetch(`${API}/users/${username}`),
          fetch(`${API}/users/${username}/snaps`)
        ]);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        if (snapsRes.ok) {
          const snapsData = await snapsRes.json();
          setSnaps(snapsData);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  const handleToggleLike = (id: string) => {
    const isLiked = likes[id];
    setLikes(p => ({ ...p, [id]: !isLiked }));
    setLikeCounts(p => ({ ...p, [id]: (p[id] || 0) + (isLiked ? -1 : 1) }));
  };

  const handleDelete = async (snapId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/submissions/${snapId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSnaps(prev => prev.filter(s => s.id !== snapId));
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting post");
    }
  };

  if (loading) {
    return <div style={{ color: "#fff", textAlign: "center", paddingTop: "50px" }}>Loading feed...</div>;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", color: "#fff", paddingBottom: "80px", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{user?.name || username}'s Posts</h1>
      </div>

      {/* Feed Container */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
        {snaps.map((snap) => (
          <div id={snap.id} key={snap.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            
            {/* Post Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <Link href={`/profile/${username}`}>
                <img 
                  src={user?.profile_pic?.startsWith('/uploads') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.profile_pic}` : user?.profile_pic || `https://ui-avatars.com/api/?name=${username}&background=111&color=fff`} 
                  style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} 
                  alt={username}
                />
              </Link>
              <div style={{ flex: 1 }}>
                <Link href={`/profile/${username}`} style={{ textDecoration: "none" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>{user?.name || username}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>@{username}</div>
                </Link>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                {new Date(snap.created_at).toLocaleDateString()}
              </div>
              
              {currentUserId === user?.id && (
                <button 
                  onClick={() => handleDelete(snap.id)}
                  style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: "8px", padding: "8px" }}
                  title="Delete post"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Post Title */}
            {snap.activity_title && (
              <div style={{ marginBottom: "16px", fontSize: "16px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                {snap.activity_title}
              </div>
            )}

            {/* Media */}
            <div style={{ aspectRatio: "3/4", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)", background: "#111" }}>
              {snap.content_url.endsWith('.mp4') ? (
                <video
                  src={snap.content_url.startsWith('http') ? snap.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${snap.content_url}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  controls
                  autoPlay
                  playsInline
                  loop
                />
              ) : (
                <img 
                  src={snap.content_url.startsWith('http') ? snap.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${snap.content_url}`}
                  alt={snap.description || "Snap"}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Description */}
            {snap.description && (
              <div style={{ marginTop: "16px", fontSize: "14px", color: "rgba(255,255,255,0.8)", lineHeight: "1.5" }}>
                <span style={{ fontWeight: 700, marginRight: "8px", color: "#fff" }}>{username}</span>
                {snap.description}
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  onClick={() => handleToggleLike(snap.id)}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${likes[snap.id] ? 'bg-pink-500/20 border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <Heart className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 ${likes[snap.id] ? 'fill-pink-500 text-pink-500' : 'text-gray-300 group-hover:text-pink-400'}`} />
                  <span className={`text-[13px] font-bold ${likes[snap.id] ? 'text-pink-400' : 'text-gray-300 group-hover:text-pink-400'}`}>
                    {likeCounts[snap.id] > 0 ? likeCounts[snap.id] : "0"}
                  </span>
                </button>
                <button 
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all border bg-white/5 border-white/10 hover:bg-white/10`}
                >
                  <MessageCircle className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-110 text-gray-300 group-hover:text-blue-400`} />
                  <span className={`text-[13px] font-bold text-gray-300 group-hover:text-blue-400`}>0</span>
                </button>
              </div>
              
              <Link 
                href={`/scrapbook/${snap.activity_id}`} 
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full font-bold text-[13px] text-white bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 transition-all border border-white/10 hover:border-pink-500/30 no-underline shadow-lg shadow-black/20 whitespace-nowrap"
              >
                See full <span style={{ opacity: 0.6 }}>↗</span>
              </Link>
            </div>

          </div>
        ))}

        {snaps.length === 0 && (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: "40px" }}>
            No posts found.
          </div>
        )}
      </div>
    </div>
  );
}
