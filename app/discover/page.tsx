"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import NebulaBackground from "@/components/NebulaBackground";
import { Heart, MessageCircle, Send, X, UserPlus } from "lucide-react";

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

function timeAgo(dateParam: string | Date | null) {
  if (!dateParam) return "";
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `just now`;
  else if (minutes < 60) return `${minutes} mins ago`;
  else if (hours < 24) return `${hours} hours ago`;
  else if (days < 7) return `${days} days ago`;
  else return date.toLocaleDateString();
}

export default function DiscoverPage() {
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<User[]>([]);
  const [suggestedActivities, setSuggestedActivities] = useState<any[]>([]);
  const [sharedFeed, setSharedFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Local state for feed interactions
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, any>>({});
  const [mentionData, setMentionData] = useState<{ query: string; cursor: number; feedId: string | null }>({ query: "", cursor: -1, feedId: null });
  const [mentionUsers, setMentionUsers] = useState<User[]>([]);
  const [activePhotoIndices, setActivePhotoIndices] = useState<Record<string, number>>({});
  const [showCrewPopup, setShowCrewPopup] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);
  const viewedItemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    observer.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const feedId = entry.target.getAttribute('data-feed-id');
          if (feedId && !viewedItemsRef.current.has(feedId)) {
            viewedItemsRef.current.add(feedId);
            const token = localStorage.getItem("token");
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/activities/${feedId}/view`, {
              method: 'POST',
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            }).catch(console.error);
            observer.current?.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.5 });

    return () => observer.current?.disconnect();
  }, []);

  const feedItemRef = useCallback((node: HTMLDivElement | null) => {
    if (node && observer.current) {
      observer.current.observe(node);
    }
  }, []);

  const handleToggleLike = async (submissionId: string) => {
    const isLiked = likes[submissionId];
    setLikes(p => ({ ...p, [submissionId]: !isLiked }));
    setLikeCounts(p => ({ ...p, [submissionId]: (p[submissionId] || 0) + (isLiked ? -1 : 1) }));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/submissions/${submissionId}/vote`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (submissionId: string) => {
    const text = commentText[submissionId]?.trim();
    if (!text) return;
    
    const parentId = replyingTo[submissionId]?.id || null;
    
    setCommentText(p => ({ ...p, [submissionId]: "" }));
    setReplyingTo(p => { const np = {...p}; delete np[submissionId]; return np; });
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/submissions/${submissionId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content: text, parent_id: parentId })
      });
      if (res.ok) {
        const newComment = await res.json();
        const formatted = { 
          id: newComment.id, 
          text: newComment.content, 
          author: newComment.user_name || newComment.user_username || "You", 
          time: "Just now",
          likes_count: 0,
          has_liked: false,
          parent_id: parentId,
          user_id: myUserId
        };
        setComments(p => ({ ...p, [submissionId]: [...(p[submissionId] || []), formatted] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (submissionId: string, commentId: string, isLiked: boolean) => {
    // Optimistic update
    setComments(p => ({
      ...p,
      [submissionId]: (p[submissionId] || []).map(c => 
        c.id === commentId 
          ? { ...c, has_liked: !isLiked, likes_count: c.likes_count + (isLiked ? -1 : 1) } 
          : c
      )
    }));

    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      if (isLiked) {
        await fetch(`${API}/comments/${commentId}/like`, { method: "DELETE", headers });
      } else {
        await fetch(`${API}/comments/${commentId}/like`, { method: "POST", headers });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async (submissionId: string) => {
    setShowComments(p => {
      const isShowing = !p[submissionId];
      if (isShowing && !comments[submissionId]) {
        // Fetch comments if not loaded yet
        const token = localStorage.getItem("token");
        fetch(`${API}/submissions/${submissionId}/comments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((c: any) => ({
              id: c.id,
              text: c.content,
              author: c.user_name || c.user_username || "Unknown",
              time: new Date(c.created_at).toLocaleDateString(),
              likes_count: parseInt(c.like_count || '0'),
              has_liked: c.has_liked,
              parent_id: c.parent_id,
              user_id: c.user_id
            }));
            setComments(p2 => ({ ...p2, [submissionId]: formatted }));
          }
        })
        .catch(console.error);
      }
      return { ...p, [submissionId]: isShowing };
    });
  };

  const handleDeleteComment = async (submissionId: string, commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    
    // Optimistic update
    setComments(p => ({
      ...p,
      [submissionId]: (p[submissionId] || []).filter(c => c.id !== commentId)
    }));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/comments/${commentId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentChange = async (submissionId: string, value: string) => {
    setCommentText(p => ({ ...p, [submissionId]: value }));
    const match = value.match(/@(\w*)$/);
    if (match) {
      setMentionData({ query: match[1], cursor: value.length, feedId: submissionId });
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API}/users/discover?search=${match[1]}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const users = await res.json();
          setMentionUsers(users.slice(0, 5));
        }
      } catch (err) {}
    } else {
      setMentionData({ query: "", cursor: -1, feedId: null });
    }
  };

  const handleSelectMention = (user: User, submissionId: string) => {
    const text = commentText[submissionId] || "";
    const newText = text.replace(/@\w*$/, `@${user.username} `);
    setCommentText(p => ({ ...p, [submissionId]: newText }));
    setMentionData({ query: "", cursor: -1, feedId: null });
  };

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

        const [userRes, feedRes, suggestRes] = await Promise.all([
          fetch(`${API}/users/discover`, { headers }).catch(() => null),
          fetch(`${API}/activities/feed/shared`, { headers }).catch(() => null),
          fetch(`${API}/suggestions`, { headers }).catch(() => null),
        ]);

        let people = [];
        if (suggestRes?.ok) {
          const suggestData = await suggestRes.json();
          people = suggestData.people || [];
        } else if (userRes?.ok) {
          people = await userRes.json();
        }
        setRecommendedUsers(people);
        if (feedRes?.ok) {
          const feed = await feedRes.json();
          setSharedFeed(feed);
          const initialLikes: Record<string, boolean> = {};
          const initialLikeCounts: Record<string, number> = {};
          feed.forEach((item: any) => {
            if (item.timeline_photos) {
              item.timeline_photos.forEach((photo: any) => {
                if (photo.id) {
                  initialLikes[photo.id] = photo.has_voted;
                  initialLikeCounts[photo.id] = parseInt(photo.vote_count || '0', 10);
                }
              });
            }
          });
          setLikes(initialLikes);
          setLikeCounts(initialLikeCounts);
        }
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

            const participants = feedItem.participant_previews || [];
            const names = Array.from(new Set([feedItem.host_name, ...participants.map((p: any) => p.name)]));
            let displayTitle = names[0];
            if (names.length === 2) {
              displayTitle = `${names[0]} and ${names[1]}`;
            } else if (names.length > 2) {
              displayTitle = `${names[0]}, ${names[1]} & ${names.length - 2} other${names.length - 2 > 1 ? 's' : ''}`;
            }
            
            const avatars = [
              { name: feedItem.host_name, profile_pic: feedItem.host_pic, username: feedItem.host_name },
              ...participants.filter((p: any) => p.name !== feedItem.host_name)
            ];

            return (
              <div key={feedItem.id} style={{ marginBottom: "64px" }} ref={feedItemRef} data-feed-id={feedItem.id}>
                {/* Scrapbook Post */}
                <div className="glass-panel" style={{ borderRadius: "24px", padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px", position: "relative" }}>
                    <div 
                      onClick={() => setShowCrewPopup(showCrewPopup === feedItem.id ? null : feedItem.id)}
                      style={{ display: "flex", alignItems: "center", position: "relative", width: avatars.length > 1 ? `${32 + (Math.min(avatars.length, 3) - 1) * 12}px` : "48px", height: "48px", cursor: "pointer", marginTop: "2px", flexShrink: 0 }}
                      title="View Crew"
                    >
                      {avatars.slice(0, 3).map((p: any, i: number) => (
                        <img 
                          key={i}
                          src={p.profile_pic?.startsWith('/uploads') ? `${API}${p.profile_pic}` : p.profile_pic || `https://ui-avatars.com/api/?name=${p.name}&background=111&color=fff`} 
                          style={{ 
                            width: avatars.length === 1 ? "48px" : "32px", 
                            height: avatars.length === 1 ? "48px" : "32px", 
                            borderRadius: "50%", 
                            objectFit: "cover", 
                            border: "2px solid #1a1a1a", 
                            position: "absolute",
                            left: avatars.length === 1 ? "0" : `${i * 12}px`,
                            top: avatars.length === 1 ? "0" : "8px",
                            zIndex: 3 - i
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ flex: 1, paddingRight: "40px" }}>
                      <div 
                        style={{ fontWeight: 700, fontSize: "16px", color: "#fff", display: "flex", alignItems: "center", cursor: "pointer" }}
                        onClick={() => setShowCrewPopup(showCrewPopup === feedItem.id ? null : feedItem.id)}
                      >
                        {displayTitle}
                        {feedItem.host_id !== myUserId && !feedItem.is_host_friend && !feedItem.host_is_private && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const token = localStorage.getItem("token");
                              fetch(`${API}/friends/request/${feedItem.host_id}`, {
                                method: "POST",
                                headers: token ? { Authorization: `Bearer ${token}` } : {}
                              }).then(() => {
                                alert("Friend request sent!");
                                setSharedFeed(prev => prev.map(f => f.host_id === feedItem.host_id ? { ...f, is_host_friend: true } : f));
                              });
                            }}
                            className="ml-3 bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white px-3 py-1 rounded-full text-[11px] font-bold transition-colors border border-pink-500/30 flex items-center gap-1"
                          >
                            <UserPlus className="w-3 h-3" /> Follow
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: "13px", color: "#888" }}>
                        {feedItem.timeline_photos && feedItem.timeline_photos.length > 0 && feedItem.timeline_photos[0].created_at ? (
                          <>{feedItem.timeline_photos[0].author_name} added to the story • {timeAgo(feedItem.timeline_photos[0].created_at)}</>
                        ) : (
                          <>Shared a chapter • {feedItem.title}</>
                        )}
                      </div>
                      {feedItem.shared_caption && (
                        <div style={{ marginTop: "8px", fontSize: "14px", color: "#eee", lineHeight: "1.4" }}>
                          {feedItem.shared_caption}
                        </div>
                      )}
                      {/* CREW POPUP */}
                      {showCrewPopup === feedItem.id && (
                        <div style={{ position: "relative" }}>
                          <div style={{
                            position: "absolute",
                            top: "8px",
                            left: "0",
                            background: "rgba(20,20,20,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            padding: "12px",
                            width: "220px",
                            zIndex: 50,
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                            maxHeight: "250px",
                            overflowY: "auto"
                          }} className="hide-scroll">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chapter Crew</span>
                              <button onClick={(e) => { e.stopPropagation(); setShowCrewPopup(null); }} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {avatars.map((p: any, i: number) => (
                                <Link 
                                  href={`/profile/${p.username}`} 
                                  key={i}
                                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px", borderRadius: "12px", transition: "all 0.2s", textDecoration: "none" }}
                                  className="hover:bg-white/10"
                                >
                                  <img 
                                    src={p.profile_pic?.startsWith('/uploads') ? `${API}${p.profile_pic}` : p.profile_pic || `https://ui-avatars.com/api/?name=${p.name}&background=111&color=fff`}
                                    style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {p.name} {p.name === feedItem.host_name ? <span style={{ color: "#f472b6", fontSize: "10px", marginLeft: "4px" }}>(Host)</span> : ""}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      @{p.username}
                                    </div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
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
                    <div style={{ position: "relative" }}>
                      <div 
                        onScroll={(e) => {
                          const target = e.target as HTMLElement;
                          // Use 300px as an approx item width for calculating index
                          const index = Math.round(target.scrollLeft / 300);
                          setActivePhotoIndices(p => ({ ...p, [feedItem.id]: Math.min(index, feedItem.timeline_photos.length - 1) }));
                        }}
                        style={{ display: "flex", alignItems: "flex-start", gap: "16px", overflowX: "auto", paddingBottom: "16px", scrollSnapType: "x mandatory" }} 
                        className="hide-scroll"
                      >
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
                            <div key={i} style={{ flex: "0 0 300px", height: "fit-content", padding: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "12px", scrollSnapAlign: "center" }}>
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
                          <div key={i} style={{ flex: "0 0 280px", scrollSnapAlign: "center", display: "flex", flexDirection: "column" }}>
                            <div style={{ aspectRatio: "3/4", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                              <img src={photo.url.startsWith('/uploads') ? `${API}${photo.url}` : photo.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)", pointerEvents: "none" }} />
                              <div style={{ position: "absolute", bottom: "16px", left: "16px", right: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#fbcfe8", background: "rgba(0,0,0,0.4)", padding: "6px 10px", borderRadius: "8px", backdropFilter: "blur(4px)" }}>
                                  📍 {locStr}
                                </div>
                                {timeStr && <div style={{ fontSize: "16px", fontWeight: 800, fontFamily: "Syne, sans-serif", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{timeStr}</div>}
                              </div>
                            </div>
                            
                            <div style={{ marginTop: "12px", display: "flex", gap: "10px", position: "relative", zIndex: 20 }}>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleLike(photo.id); }}
                                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${likes[photo.id] ? 'bg-pink-500/20 border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                              >
                                <Heart className={`w-[16px] h-[16px] transition-transform duration-200 group-hover:scale-110 ${likes[photo.id] ? 'fill-pink-500 text-pink-500' : 'text-gray-300 group-hover:text-pink-400'}`} />
                                <span className={`text-[12px] font-bold ${likes[photo.id] ? 'text-pink-400' : 'text-gray-300 group-hover:text-pink-400'}`}>
                                  {likeCounts[photo.id] > 0 ? likeCounts[photo.id] : "0"}
                                </span>
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleComments(photo.id); }}
                                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${showComments[photo.id] ? 'bg-blue-500/20 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                              >
                                <MessageCircle className={`w-[16px] h-[16px] transition-transform duration-200 group-hover:scale-110 ${showComments[photo.id] ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`} />
                                <span className={`text-[12px] font-bold ${showComments[photo.id] ? 'text-blue-400' : 'text-gray-300 group-hover:text-blue-400'}`}>
                                  {comments[photo.id] ? (comments[photo.id].length > 0 ? comments[photo.id].length : "0") : (parseInt(photo.comment_count || '0', 10) > 0 ? photo.comment_count : "0")}
                                </span>
                              </button>
                            </div>

                            {showComments[photo.id] && (
                              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                                {comments[photo.id] && comments[photo.id].length > 0 ? (
                                  <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2 hide-scroll">
                                    {comments[photo.id].filter((c: any) => !c.parent_id).map((c: any) => (
                                      <div key={c.id} className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                            {c.author.charAt(0)}
                                          </div>
                                          <div className="bg-white/5 rounded-xl rounded-tl-none px-3 py-2 border border-white/5 text-sm w-full">
                                            <div className="flex justify-between items-end mb-1">
                                              <span className="font-bold text-xs text-gray-300">{c.author}</span>
                                              <span className="text-[10px] text-gray-500">{c.time}</span>
                                            </div>
                                            <p className="text-gray-300 m-0 text-[13px] leading-relaxed">
                                              {c.text.split(/(@\w+)/g).map((part: string, x: number) => part.startsWith('@') ? <span key={x} className="text-pink-400 font-semibold">{part}</span> : part)}
                                            </p>
                                            <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-medium">
                                              <button onClick={() => handleLikeComment(photo.id, c.id, c.has_liked)} className={`flex items-center gap-1 ${c.has_liked ? 'text-pink-500' : 'hover:text-white'}`}>
                                                <Heart className={`w-3 h-3 ${c.has_liked ? 'fill-pink-500' : ''}`} /> {c.likes_count || 0}
                                              </button>
                                              <button onClick={() => setReplyingTo(p => ({ ...p, [photo.id]: c }))} className="hover:text-white">Reply</button>
                                              {c.user_id === myUserId && (
                                                <button onClick={() => handleDeleteComment(photo.id, c.id)} className="hover:text-red-400 text-gray-500 ml-auto">Delete</button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {comments[photo.id].filter((reply: any) => reply.parent_id === c.id).length > 0 && (
                                          <div className="pl-8 flex flex-col gap-2 mt-1">
                                            {comments[photo.id].filter((reply: any) => reply.parent_id === c.id).map((reply: any) => (
                                              <div key={reply.id} className="flex gap-2">
                                                <div className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                  {reply.author.charAt(0)}
                                                </div>
                                                <div className="bg-white/5 rounded-xl rounded-tl-none px-3 py-2 border border-white/5 text-sm w-full">
                                                  <div className="flex justify-between items-end mb-1">
                                                    <span className="font-bold text-xs text-gray-300">{reply.author}</span>
                                                    <span className="text-[10px] text-gray-500">{reply.time}</span>
                                                  </div>
                                                  <p className="text-gray-300 m-0 text-[13px] leading-relaxed">
                                                    {reply.text.split(/(@\w+)/g).map((part: string, x: number) => part.startsWith('@') ? <span key={x} className="text-pink-400 font-semibold">{part}</span> : part)}
                                                  </p>
                                                  <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-medium">
                                                    <button onClick={() => handleLikeComment(photo.id, reply.id, reply.has_liked)} className={`flex items-center gap-1 ${reply.has_liked ? 'text-pink-500' : 'hover:text-white'}`}>
                                                      <Heart className={`w-3 h-3 ${reply.has_liked ? 'fill-pink-500' : ''}`} /> {reply.likes_count || 0}
                                                    </button>
                                                    {reply.user_id === myUserId && (
                                                      <button onClick={() => handleDeleteComment(photo.id, reply.id)} className="hover:text-red-400 text-gray-500 ml-auto">Delete</button>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-center text-gray-500 italic py-2">No comments yet. Be the first to spill!</div>
                                )}
                                
                                <div className="relative flex flex-col mt-2">
                                  {mentionData.feedId === photo.id && mentionUsers.length > 0 && (
                                    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                      {mentionUsers.map(u => (
                                        <button key={u.id} onClick={() => handleSelectMention(u, photo.id)} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-[10px] text-white">
                                            {u.profile_pic ? <img src={u.profile_pic} className="w-full h-full rounded-full object-cover" /> : u.username.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="text-sm font-semibold text-white">{u.name}</div>
                                            <div className="text-[10px] text-gray-400">@{u.username}</div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {replyingTo[photo.id] && (
                                    <div className="flex justify-between items-center text-[11px] text-gray-400 mb-2 px-2">
                                      <span>Replying to <span className="text-pink-400 font-bold">@{replyingTo[photo.id].author}</span></span>
                                      <button onClick={() => setReplyingTo(p => { const np = {...p}; delete np[photo.id]; return np; })}><X className="w-3 h-3" /></button>
                                    </div>
                                  )}
                                  <div className="flex gap-2 items-center">
                                    <input 
                                      type="text"
                                      value={commentText[photo.id] || ""}
                                      onChange={(e) => handleCommentChange(photo.id, e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment(photo.id)}
                                      placeholder={replyingTo[photo.id] ? "Write a reply..." : "Add a comment..."}
                                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                                    />
                                    <button 
                                      onClick={() => handlePostComment(photo.id)}
                                      disabled={!commentText[photo.id]?.trim()}
                                      className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-blue-500/20 disabled:hover:text-blue-400"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                      
                      {feedItem.timeline_photos.length > 1 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "-4px", marginBottom: "16px" }}>
                          {feedItem.timeline_photos.map((_: any, i: number) => {
                            const isActive = (activePhotoIndices[feedItem.id] || 0) === i;
                            return (
                              <div key={i} style={{ 
                                width: isActive ? "16px" : "6px", 
                                height: "6px", 
                                borderRadius: "3px", 
                                background: isActive ? "#f472b6" : "rgba(255,255,255,0.2)",
                                transition: "all 0.3s ease"
                              }} />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                     <div style={{ padding: "60px 20px", textAlign: "center", color: "#666", fontSize: "14px", background: "rgba(0,0,0,0.3)", borderRadius: "16px" }}>
                       No photos in this chapter yet.
                     </div>
                  )}

                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <Link 
                      href={`/scrapbook/${feedItem.id}`} 
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full font-bold text-[13px] text-white bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 transition-all border border-white/10 hover:border-pink-500/30 no-underline shadow-lg shadow-black/20 whitespace-nowrap"
                    >
                      See full <span style={{ opacity: 0.6 }}>↗</span>
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
