"use client";

import { useEffect, useState, useCallback } from "react";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import NebulaBackground from "@/components/NebulaBackground";

type User = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  college: string;
  year?: string;
  interests?: string[];
  vibe_tags?: string[];
  current_status?: string;
  status_updated_at?: string;
  friends_if?: string;
  profile_pic?: string;
  mutual_count?: number;
};

export default function DiscoverPage() {
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [sharedFeed, setSharedFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setMyUserId(payload.userId || payload.id);
      }
    } catch(e) {}
  }, []);

  const handleDeleteFromFeed = async (id: string) => {
    if (!confirm("Remove this chapter from the public feed?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/unshare`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setSharedFeed(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

        const [userRes, feedRes] = await Promise.all([
          fetch(`${API}/users/discover`, { headers }).catch(() => null),
          fetch(`${API}/activities/feed/shared`, { headers }).catch(() => null),
        ]);

        if (userRes?.ok) setRecommendedUsers(await userRes.json());
        if (feedRes?.ok) setSharedFeed(await feedRes.json());
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  // Group suggested users into chunks of 4 to insert between feed posts
  const usersChunks: User[][] = [];
  for (let i = 0; i < recommendedUsers.length; i += 4) {
    usersChunks.push(recommendedUsers.slice(i, i + 4));
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground variant="discover" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .discover-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 80px 20px 100px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .horizontal-slider {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 10px 4px 44px;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
        }
        .horizontal-slider::-webkit-scrollbar { display: none; }
        .slider-item { scroll-snap-align: start; flex-shrink: 0; transition: transform 0.4s; }
        .slider-item:hover { transform: translateY(-8px); }

        .glass-panel { background: rgba(20,20,20,0.6); backdrop-filter: blur(20px); }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div className="discover-page">
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading feed...</div>
        ) : sharedFeed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 20px", color: "#555" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🌍</div>
            <div style={{ fontSize: "18px", marginBottom: "24px" }}>Feed is empty. Be the first to share a scrapbook!</div>
          </div>
        ) : (
          sharedFeed.map((feedItem, index) => {
            const chunkIndex = Math.floor(index / 2);
            const showSuggestions = (index + 1) % 2 === 0 && usersChunks[chunkIndex];

            return (
              <div key={feedItem.id} style={{ marginBottom: "64px" }}>
                {/* Scrapbook Post */}
                <div className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px", position: "relative" }}>
                    <img 
                      src={feedItem.host_pic?.startsWith('/uploads') ? `${API}${feedItem.host_pic}` : feedItem.host_pic || `https://ui-avatars.com/api/?name=${feedItem.host_name}&background=111&color=fff`} 
                      style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)", marginTop: "2px" }}
                    />
                    <div style={{ flex: 1, paddingRight: "40px" }}>
                      <div style={{ fontWeight: 700, fontSize: "16px", color: "#fff" }}>{feedItem.host_name}</div>
                      <div style={{ fontSize: "13px", color: "#888" }}>Shared a chapter • {feedItem.title}</div>
                      {feedItem.shared_caption && (
                        <div style={{ marginTop: "8px", fontSize: "14px", color: "#eee", lineHeight: "1.4" }}>
                          {feedItem.shared_caption}
                        </div>
                      )}
                    </div>
                    {feedItem.host_id === myUserId && (
                      <button 
                        onClick={() => handleDeleteFromFeed(feedItem.id)}
                        className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        title="Remove from Feed"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {feedItem.timeline_photos && feedItem.timeline_photos.length > 0 ? (
                    <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "16px" }} className="hide-scroll">
                      {feedItem.timeline_photos.map((photo: any, i: number) => {
                        let locStr = feedItem.location?.split(',')[0] || "Unknown";
                        let timeStr = "";
                        try {
                           if (photo.desc && photo.desc.startsWith('{')) {
                             const meta = JSON.parse(photo.desc);
                             if (meta.location) locStr = meta.location;
                             if (meta.time) {
                               const timeObj = new Date(meta.time);
                               timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '');
                             }
                           }
                        } catch(e) {}
                        if (photo.url === 'note') {
                          return (
                            <div key={i} style={{ flex: "0 0 300px", padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <img src={photo.author_pic?.startsWith('/uploads') ? `${API}${photo.author_pic}` : photo.author_pic || `https://ui-avatars.com/api/?name=${photo.author_name}&background=111&color=fff`} style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", objectFit: "cover", flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "14px", color: "rgba(255,255,255,0.9)" }}>{photo.author_name || feedItem.host_name}</div>
                                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span>{timeStr}</span>
                                    <span>•</span>
                                    <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📍 {locStr}</span>
                                  </div>
                                </div>
                              </div>
                              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: 500, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                                {(() => {
                                  try {
                                    return JSON.parse(photo.desc)?.note || "";
                                  } catch(e) { return ""; }
                                })()}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div key={i} style={{ flex: "0 0 280px", aspectRatio: "3/4", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                            <img src={photo.url.startsWith('/uploads') ? `${API}${photo.url}` : photo.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)", pointerEvents: "none" }} />
                            <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbcfe8", background: "rgba(0,0,0,0.4)", padding: "6px 10px", borderRadius: "8px", backdropFilter: "blur(4px)" }}>
                                📍 {locStr}
                              </div>
                              {timeStr && <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "Syne, sans-serif", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{timeStr}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                     <div style={{ padding: "60px 20px", textAlign: "center", color: "#666", fontSize: "14px", background: "rgba(0,0,0,0.3)", borderRadius: "16px" }}>
                       No photos in this chapter yet.
                     </div>
                  )}

                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                    <Link href={`/scrapbook/${feedItem.id}`} style={{ fontSize: "13px", fontWeight: 700, color: "#f472b6", textDecoration: "none", background: "rgba(244, 114, 182, 0.1)", padding: "10px 20px", borderRadius: "12px", border: "1px solid rgba(244, 114, 182, 0.2)", transition: "all 0.3s" }}>
                      Open Chapter ↗
                    </Link>
                  </div>
                </div>

                {/* Interleaved Suggestions */}
                {showSuggestions && (
                  <div style={{ marginTop: "64px", marginBottom: "32px", position: "relative" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "20px", paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: "#a8a29e" }}>✨</span> People you might know
                    </div>
                    <div className="horizontal-slider" style={{ paddingBottom: "20px" }}>
                      {showSuggestions.map((user: User, idx: number) => (
                        <div key={user.id} className="slider-item">
                          <UserCard user={user} index={idx} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* If feed is shorter than required to show all suggestions, we can append remaining suggestions at the end */}
        {!loading && sharedFeed.length <= 1 && usersChunks.length > 0 && (
          <div style={{ marginTop: "32px" }}>
             <div style={{ fontSize: "14px", fontWeight: 700, color: "#888", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "20px", paddingLeft: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#a8a29e" }}>✨</span> People you might know
             </div>
             <div className="horizontal-slider">
                {usersChunks[0].map((user: User, idx: number) => (
                  <div key={user.id} className="slider-item">
                    <UserCard user={user} index={idx} />
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
