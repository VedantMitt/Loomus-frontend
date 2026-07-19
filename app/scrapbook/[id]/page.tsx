"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Heart, MessageCircle, Send, X } from "lucide-react";

type Activity = {
  id: string;
  title: string;
  location: string;
  date: string;
  banner?: string;
  is_shared?: boolean;
  host_id?: string;
};

type Submission = {
  id: string;
  content_url: string;
  description?: string;
  name: string;
  profile_pic?: string;
  created_at: string;
  user_id?: string;
};

export default function ScrapbookStoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editLocationSub, setEditLocationSub] = useState<Submission | null>(null);
  const [newLocation, setNewLocation] = useState("");

  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, any>>({});
  const [mentionData, setMentionData] = useState<{ query: string; cursor: number; submissionId: string | null }>({ query: "", cursor: -1, submissionId: null });
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);

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

  const handleQuickSnap = async (file: File, source: 'camera' | 'gallery') => {
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      let lat = 0, lng = 0;
      let locStr = "Unknown";
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 }));
        lat = pos.coords.latitude; lng = pos.coords.longitude;
        const geoRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.features?.[0]) locStr = geoData.features[0].place_name.split(',')[0];
        }
      } catch (e) {}

      const formData = new FormData();
      formData.append("image", file);

      const upRes = await fetch(`${API}/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!upRes.ok) throw new Error("Upload failed");
      const { url } = await upRes.json();

      const meta = { location: locStr, time: new Date().toISOString(), source };
      const postRes = await fetch(`${API}/activities/${id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_url: url, description: JSON.stringify(meta) })
      });
      if (!postRes.ok) throw new Error("Submit failed");
      
      const newSub = await postRes.json();
      // append the new submission to the UI
      setSubmissions(prev => [...prev, {
        ...newSub,
        name: "You", // placeholder until refresh
      }]);
      
      // Refresh activity to get updated cover if it changed
      fetch(`${API}/activities/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.ok && res.json())
        .then(data => data && setActivity(data))
        .catch(console.error);

      alert("Snap added to scrapbook!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleUnshare = async () => {
    if (!confirm("Remove this chapter from the public feed?")) return;
    setSharing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/unshare`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setActivity(prev => prev ? { ...prev, is_shared: false } : prev);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to remove.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to remove.");
    }
    setSharing(false);
  };

  const handleSetCover = async (content_url: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/cover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cover_url: content_url })
      });
      if (res.ok) {
        alert("Cover image updated!");
        setActivity(prev => prev ? { ...prev, banner: content_url } : prev);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update cover.");
      }
    } catch (e) {
      alert("Error setting cover");
    }
  };

  const handleDeleteSubmission = async (subId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/submissions/${subId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== subId));
        // Refresh activity to get updated cover if it changed
        fetch(`${API}/activities/${id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.ok && res.json())
          .then(data => data && setActivity(data))
          .catch(console.error);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete.");
      }
    } catch (e) {
      alert("Error deleting photo");
    }
  };

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
    } catch (err) {}
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
      setMentionData({ query: match[1], cursor: value.length, submissionId });
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
      setMentionData({ query: "", cursor: -1, submissionId: null });
    }
  };

  const handleSelectMention = (user: any, submissionId: string) => {
    const text = commentText[submissionId] || "";
    const newText = text.replace(/@\w*$/, `@${user.username} `);
    setCommentText(p => ({ ...p, [submissionId]: newText }));
    setMentionData({ query: "", cursor: -1, submissionId: null });
  };

  const handleUpdateLocation = async () => {
    if (!editLocationSub) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/submissions/${editLocationSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location: newLocation })
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(prev => prev.map(s => s.id === editLocationSub.id ? { ...s, description: data.description } : s));
        setEditLocationSub(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update location.");
      }
    } catch (e) {
      alert("Error updating location");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const aRes = await fetch(`${API}/activities/${id}`, { headers });
        if (aRes.ok) setActivity(await aRes.json());

        const sRes = await fetch(`${API}/activities/${id}/submissions`, { headers });
        if (sRes.ok) {
          const subs = await sRes.json();
          // Sort chronologically for story mode
          subs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setSubmissions(subs);
          
          const initialLikes: Record<string, boolean> = {};
          const initialLikeCounts: Record<string, number> = {};
          subs.forEach((sub: any) => {
            initialLikes[sub.id] = sub.has_voted;
            initialLikeCounts[sub.id] = parseInt(sub.vote_count || '0', 10);
          });
          setLikes(initialLikes);
          setLikeCounts(initialLikeCounts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, API]);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading story...</div>;
  if (!activity) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Scrapbook not found.</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-['DM_Sans'] relative overflow-x-hidden">
      {/* Background blur */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-['Syne'] font-bold text-lg leading-tight">{activity.title}</h1>
            <p className="text-xs text-gray-400">Scrapbook Story</p>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push(`/activities/${id}?modal=invite`)} className="text-xs font-bold text-white bg-pink-500/20 hover:bg-pink-500/40 px-3 py-2 rounded-lg transition-all flex items-center gap-2">
              ✉️ Invite
            </button>
            <button onClick={() => router.push(`/activities/${id}`)} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all flex items-center gap-2">
              View Loom
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 relative z-10 pb-32">
        {submissions.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">📖</div>
            <p>This chapter is empty.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-pink-500/50 via-purple-500/50 to-transparent z-0"></div>

            <div className="space-y-12">
              {submissions.map((s, i) => {
                let meta: any = null;
                try { if (s.description && s.description.startsWith('{')) meta = JSON.parse(s.description); } catch(e) {}
                
                const timeObj = meta?.time ? new Date(meta.time) : new Date(s.created_at);
                const timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isNote = s.content_url === 'note';

                return (
                  <div key={s.id} className="relative flex gap-6 group">
                    {/* Timeline Node */}
                    <div className="relative z-10 w-14 flex-shrink-0 flex flex-col items-center">
                      <img 
                        src={s.profile_pic?.startsWith('/uploads') ? `${API}${s.profile_pic}` : s.profile_pic || `https://ui-avatars.com/api/?name=${s.name}&background=111&color=fff`} 
                        className="w-14 h-14 rounded-full object-cover border-4 border-[#0a0a0a] shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-110 transition-transform duration-300" 
                        alt={s.name} 
                      />
                    </div>

                    {/* Content Bubble */}
                    <div className="flex-1 pt-2">
                      <div className="flex items-center gap-2 mb-2 relative z-20">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm text-pink-100">{s.name}</span>
                          <span className="text-xs text-gray-500">{timeStr}</span>
                        </div>
                        {myUserId === s.user_id && (
                          <div className="relative ml-2">
                            <button 
                              onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                              className="p-1.5 flex items-center justify-center hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                            </button>
                            {openMenuId === s.id && (
                              <div className="absolute top-8 right-0 w-44 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                <button 
                                  onClick={() => { 
                                    let curLoc = "";
                                    try { curLoc = JSON.parse(s.description || '{}').location || ""; } catch(e){}
                                    setNewLocation(curLoc);
                                    setEditLocationSub(s); 
                                    setOpenMenuId(null); 
                                  }} 
                                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                                >
                                  <span style={{ fontSize: 14 }}>📍</span> Edit Location
                                </button>
                                <div className="h-[1px] bg-white/10 w-full" />
                                <button 
                                  onClick={() => { handleDeleteSubmission(s.id); setOpenMenuId(null); }} 
                                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                                >
                                  <span style={{ fontSize: 14 }}>🗑️</span> Delete Memory
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className={`p-1 rounded-2xl transition-all duration-300 ${isNote ? 'bg-white/5 border border-white/10 p-4 hover:bg-white/10' : 'hover:scale-[1.02]'}`}>
                        {isNote ? (
                          <p className="text-sm text-gray-200 leading-relaxed font-medium">
                            {meta?.note}
                          </p>
                        ) : (
                          <div 
                            className="relative rounded-xl overflow-hidden border border-white/10"
                            style={meta?.source === 'gallery' ? { boxShadow: '0 0 35px rgba(80, 125, 42, 0.8)' } : meta?.source === 'camera' ? { boxShadow: '0 0 35px rgba(239, 68, 68, 0.8)' } : { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                          >
                            <img src={s.content_url.startsWith('/uploads') ? `${API}${s.content_url}` : s.content_url} className="w-full max-h-[500px] object-cover" alt="Memory" />
                            {myUserId === activity.host_id && (
                              <button 
                                onClick={() => handleSetCover(s.content_url)}
                                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Set as Cover
                              </button>
                            )}
                            {meta?.location && (
                              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                <span className="text-xs font-bold text-pink-300">📍 {meta.location}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-4 mt-3 pl-2">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleLike(s.id); }}
                          className={`group flex items-center gap-1.5 transition-all ${likes[s.id] ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}
                        >
                          <Heart className={`w-[16px] h-[16px] transition-transform duration-200 group-hover:scale-110 ${likes[s.id] ? 'fill-pink-500' : ''}`} />
                          <span className="text-[12px] font-bold">
                            {likeCounts[s.id] > 0 ? likeCounts[s.id] : ""}
                          </span>
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleComments(s.id); }}
                          className={`group flex items-center gap-1.5 transition-all ${showComments[s.id] ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}
                        >
                          <MessageCircle className="w-[16px] h-[16px] transition-transform duration-200 group-hover:scale-110" />
                          <span className="text-[12px] font-bold">
                            {comments[s.id] ? (comments[s.id].length > 0 ? comments[s.id].length : "") : (parseInt((s as any).comment_count || '0', 10) > 0 ? (s as any).comment_count : "")}
                          </span>
                        </button>
                      </div>

                      {/* Comment Section */}
                      {showComments[s.id] && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                          {comments[s.id] && comments[s.id].length > 0 ? (
                            <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-2 hide-scroll">
                              {comments[s.id].filter((c: any) => !c.parent_id).map((c: any) => (
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
                                        <button onClick={() => handleLikeComment(s.id, c.id, c.has_liked)} className={`flex items-center gap-1 ${c.has_liked ? 'text-pink-500' : 'hover:text-white'}`}>
                                          <Heart className={`w-3 h-3 ${c.has_liked ? 'fill-pink-500' : ''}`} /> {c.likes_count || 0}
                                        </button>
                                        <button onClick={() => setReplyingTo(p => ({ ...p, [s.id]: c }))} className="hover:text-white">Reply</button>
                                        {c.user_id === myUserId && (
                                          <button onClick={() => handleDeleteComment(s.id, c.id)} className="hover:text-red-400 text-gray-500 ml-auto">Delete</button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {comments[s.id].filter((reply: any) => reply.parent_id === c.id).length > 0 && (
                                    <div className="pl-8 flex flex-col gap-2 mt-1">
                                      {comments[s.id].filter((reply: any) => reply.parent_id === c.id).map((reply: any) => (
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
                                              <button onClick={() => handleLikeComment(s.id, reply.id, reply.has_liked)} className={`flex items-center gap-1 ${reply.has_liked ? 'text-pink-500' : 'hover:text-white'}`}>
                                                <Heart className={`w-3 h-3 ${reply.has_liked ? 'fill-pink-500' : ''}`} /> {reply.likes_count || 0}
                                              </button>
                                              {reply.user_id === myUserId && (
                                                <button onClick={() => handleDeleteComment(s.id, reply.id)} className="hover:text-red-400 text-gray-500 ml-auto">Delete</button>
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
                            {mentionData.submissionId === s.id && mentionUsers.length > 0 && (
                              <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                                {mentionUsers.map(u => (
                                  <button key={u.id} onClick={() => handleSelectMention(u, s.id)} className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2">
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
                            {replyingTo[s.id] && (
                              <div className="flex justify-between items-center text-[11px] text-gray-400 mb-2 px-2">
                                <span>Replying to <span className="text-pink-400 font-bold">@{replyingTo[s.id].author}</span></span>
                                <button onClick={() => setReplyingTo(p => { const np = {...p}; delete np[s.id]; return np; })}><X className="w-3 h-3" /></button>
                              </div>
                            )}
                            <div className="flex gap-2 items-center">
                              <input 
                                type="text"
                                value={commentText[s.id] || ""}
                                onChange={(e) => handleCommentChange(s.id, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment(s.id)}
                                placeholder={replyingTo[s.id] ? "Write a reply..." : "Add a comment..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                              />
                              <button 
                                onClick={() => handlePostComment(s.id)}
                                disabled={!commentText[s.id]?.trim()}
                                className="p-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-blue-500/20 disabled:hover:text-blue-400"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-center mt-12 relative z-10">
              <div className="w-3 h-3 rounded-full bg-pink-500/50 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Add Snap Button (Available for all members) */}
      {(
        <div className="fixed bottom-24 right-6 z-50 flex items-end gap-2">
          <input type="file" accept="image/*" className="hidden" id="gal-scrapbook" onChange={e => { if(e.target.files?.[0]) handleQuickSnap(e.target.files[0], 'gallery'); }} />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              document.getElementById('gal-scrapbook')?.click();
            }}
            className="w-12 h-12 bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-white shadow-lg transition-all mb-1 hover:scale-110 active:scale-95"
            title="Camera Roll"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>

          <input type="file" accept="image/*" capture="environment" className="hidden" id="cam-scrapbook" onChange={e => { if(e.target.files?.[0]) handleQuickSnap(e.target.files[0], 'camera'); }} />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (uploading) return;
              document.getElementById('cam-scrapbook')?.click();
            }}
            className={`w-14 h-14 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all ${uploading ? 'opacity-80' : 'hover:scale-110 active:scale-95'}`}
            title="Snap a moment"
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            )}
          </button>
        </div>
      )}

      {/* Edit Location Modal */}
      {editLocationSub && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-['Syne'] text-white">Edit Location</h2>
            <input 
              type="text" 
              value={newLocation} 
              onChange={e => setNewLocation(e.target.value)} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 mb-6 text-white" 
              placeholder="E.g. Central Park"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditLocationSub(null)} className="text-sm font-bold text-gray-400 hover:text-white px-4 py-2 transition-colors">Cancel</button>
              <button onClick={handleUpdateLocation} disabled={!newLocation.trim()} className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold px-6 py-2 rounded-xl transition-all disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
