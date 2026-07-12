"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { uploadSubmission } from "@/lib/uploadSubmission";
import LocationAutocomplete from "@/components/LocationAutocomplete";

// Types
type Activity = {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  end_date?: string;
  location: string;
  itinerary?: any[];
  banner?: string;
  host_name: string;
  host_pic?: string;
  host_user_id: string;
  member_count: string;
  going_count: string;
  interested_count: string;
  my_rsvp: string | null;
  format: string;
  is_shared?: boolean;
  is_public?: boolean;
};

type Submission = {
  id: string;
  content_url: string;
  description?: string;
  name: string;
  profile_pic?: string;
  created_at: string;
};

type Comment = {
  id: string;
  content: string;
  name: string;
  username: string;
  profile_pic?: string;
  created_at: string;
};

type Announcement = {
  id: string;
  content: string;
  sender_name: string;
  sender_username: string;
  sender_pic?: string;
  created_at: string;
};

type Member = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  rsvp_status: string;
};

const getOrdinalSuffix = (i: number) => {
  const j = i % 10, k = i % 100;
  if (j == 1 && k != 11) return "st";
  if (j == 2 && k != 12) return "nd";
  if (j == 3 && k != 13) return "rd";
  return "th";
};

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dayName = d.toLocaleString('default', { weekday: 'short' });
  return `${d.getDate()}${getOrdinalSuffix(d.getDate())} ${d.toLocaleString('default', { month: 'short' })}, ${dayName}`;
};

// Main component
export default function LoomusActivityPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "crew" | "discussion" | "capture">("plan");
  
  const [isWritingNote, setIsWritingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Plan Edit State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editItinerary, setEditItinerary] = useState<any[]>([]);
  const [editDescription, setEditDescription] = useState("");
  const [minDate, setMinDate] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    setMinDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  // Compute possible days based on editDate and editEndDate
  const possibleDays = useMemo(() => {
    if (!editDate) return [];
    const start = new Date(editDate);
    const end = new Date(editDate);
    const days = [];
    let current = new Date(start);
    current.setHours(0,0,0,0);
    const last = new Date(end);
    last.setHours(0,0,0,0);
    
    // Safety check to prevent infinite loops if dates are invalid
    let count = 0;
    while (current <= last && count < 30) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      count++;
    }
    return days;
  }, [editDate]);

  // Inputs
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Invites
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showLoomMenu, setShowLoomMenu] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [editLoomTitle, setEditLoomTitle] = useState("");
  const [editLoomVenue, setEditLoomVenue] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Data fetching
  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const myUserId = payload.userId || payload.id;

        const aRes = await fetch(`${API}/activities/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!aRes.ok) throw new Error("Activity not found");
        const aData = await aRes.json();
        setActivity(aData);
        setIsHost(aData.host_user_id === myUserId);
        if (aData.title) setEditLoomTitle(aData.title);
        if (aData.location) setEditLoomVenue(aData.location);
        if (aData.date) setEditDate(new Date(aData.date).toISOString().slice(0,16));
        if (aData.is_public !== undefined) setEditIsPublic(aData.is_public);
        if (aData.itinerary) setEditItinerary(aData.itinerary);
        if (aData.description) setEditDescription(aData.description);

        const [sRes, cRes, mRes, anRes, pRes] = await Promise.all([
          fetch(`${API}/activities/${id}/submissions`),
          fetch(`${API}/activities/${id}/comments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/activities/${id}/participants`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/activities/${id}/announcements`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/activities/${id}/polls`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (sRes.ok) setSubmissions(await sRes.json());
        if (cRes.ok) setComments(await cRes.json());
        if (mRes.ok) setMembers(await mRes.json());
        if (anRes.ok) setAnnouncements(await anRes.json());
        if (pRes.ok) setPolls(await pRes.json());

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router, API]);

  // Invite Search
  useEffect(() => {
    if (!showInviteModal) return;
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/discover?search=${searchQuery.trim()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [searchQuery, showInviteModal, API]);

  // Actions
  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          date: new Date(editDate).toISOString(),
          itinerary: editItinerary,
          is_public: editIsPublic,
          description: editDescription
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActivity(updated);
        setIsEditingPlan(false);
      }
    } catch (err) { console.error(err); }
    setSavingPlan(false);
  };

  const handleEndPlan = async () => {
    if (!confirm("Are you sure you want to complete this loom right now?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          end_date: new Date().toISOString()
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActivity(updated);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeletePlan = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}?type=loom`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push("/activities");
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleItineraryItem = async (index: number) => {
    if (!isHost) return;
    const newItin = [...(activity?.itinerary || [])];
    newItin[index].checked = !newItin[index].checked;
    
    // Optimistic update
    setActivity(prev => prev ? { ...prev, itinerary: newItin } : null);
    setEditItinerary(newItin);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itinerary: newItin })
      });
    } catch (err) { console.error(err); }
  };

  const handleRsvp = async (status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setActivity(prev => prev ? { ...prev, my_rsvp: data.my_rsvp, going_count: data.going_count } : null);
        const mRes = await fetch(`${API}/activities/${id}/participants`, { headers: { Authorization: `Bearer ${token}` } });
        if (mRes.ok) setMembers(await mRes.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setCommentText("");
      }
    } catch (err) { console.error(err); }
    setCommenting(false);
  };

  const handleSubmit = async (liveLocationStr: string = "") => {
    if (!file && !isWritingNote) return;
    setSubmitting(true);
    try {
      let content_url = 'note';
      if (file) {
        content_url = await uploadSubmission(file);
      }
      const token = localStorage.getItem("token");
      
      const meta: any = {
        location: liveLocationStr,
        time: new Date().toISOString()
      };
      if (isWritingNote) meta.note = noteText;

      const res = await fetch(`${API}/activities/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_url, description: JSON.stringify(meta) })
      });
      if (res.ok) {
        const newSub = await res.json();
        setSubmissions(prev => {
          const idx = prev.findIndex(s => s.id === newSub.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newSub;
            return next;
          }
          return [newSub, ...prev];
        });
        setFile(null);
        setIsWritingNote(false);
        setNoteText("");
      }
    } catch (err) { console.error(err); }
    setSubmitting(false);
  };

  const handleCapturePost = () => {
    setSubmitting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=14`);
            const data = await res.json();
            const area = data.address?.suburb || data.address?.city_district || data.address?.city || data.address?.town || activity?.location?.split(',')[0] || "Unknown";
            handleSubmit(area);
          } catch(e) {
            handleSubmit(activity?.location?.split(',')[0] || "Unknown");
          }
        },
        () => handleSubmit(activity?.location?.split(',')[0] || "Unknown"),
        { timeout: 5000 }
      );
    } else {
      handleSubmit(activity?.location?.split(',')[0] || "Unknown");
    }
  };

  const handleInvite = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invitee_id: userId })
      });
      if (res.ok) alert("Invite sent.");
    } catch (err) { console.error(err); }
  };

  const handleShareScrapbook = async (caption: string = '') => {
    if (!confirm("Share this scrapbook with all your friends on the feed?")) return;
    setSharing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/share`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ caption })
      });
      if (res.ok) {
        alert("Shared to Feed!");
        setActivity(prev => prev ? { ...prev, is_shared: true, shared_caption: caption } : null);
      } else {
        const errData = await res.json();
        alert(`Failed: ${errData.error || "Could not share"}`);
      }
    } catch (err) { console.error(err); }
    setSharing(false);
  };

  const handleVotePoll = async (optionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/polls/${optionId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const pRes = await fetch(`${API}/activities/${id}/polls`, { headers: { Authorization: `Bearer ${token}` } });
        if (pRes.ok) setPolls(await pRes.json());
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#0a0a0a]"><div className="animate-pulse w-12 h-12 rounded-full bg-pink-500/50" /></div>;
  if (!activity) return <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-white">Plan vanished.</div>;

  const handleSaveDetails = async () => {
    setSavingDetails(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: editLoomTitle, location: editLoomVenue })
      });
      if (res.ok) {
        setActivity(prev => prev ? { ...prev, title: editLoomTitle, location: editLoomVenue } : null);
        setShowEditDetailsModal(false);
      } else {
        alert("Failed to save details");
      }
    } catch (err) {
      console.error(err);
    }
    setSavingDetails(false);
  };

  const d = new Date(activity.date);
  const formattedDate = d.toLocaleString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const goingMembers = members.filter(m => m.rsvp_status === 'going');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] font-['DM_Sans'] pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
        .glass-panel { background: rgba(20,20,20,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
        .tab-btn { padding: 12px 16px; font-weight: 600; font-size: 14px; color: #888; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { color: #f472b6; border-bottom-color: #f472b6; }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        .scrapbook-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; padding: 10px; }
        .scrapbook-item { aspect-ratio: 3/4; border-radius: 12px; overflow: hidden; position: relative; background: #000; box-shadow: 0 8px 24px rgba(0,0,0,0.5); transform: rotate(calc(-3deg + 6deg * var(--rand))); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .scrapbook-item:hover { transform: scale(1.08) rotate(0deg); z-index: 10; box-shadow: 0 12px 32px rgba(236,72,153,0.3); border: 1px solid rgba(236,72,153,0.5); }
        .scrapbook-img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(1.1); transition: filter 0.3s; }
        .scrapbook-item:hover .scrapbook-img { filter: contrast(1) saturate(1); }
        
        /* The Polaroid/Stamp Watermark Effect */
        .watermark-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.8) 100%); display: flex; flex-direction: column; justify-content: space-between; padding: 12px; pointer-events: none; }
        .wm-time { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: rgba(255,255,255,0.9); text-shadow: 0 2px 10px rgba(0,0,0,0.5); letter-spacing: -1px; }
        .wm-loc { display: inline-flex; items-center; gap: 4px; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); font-size: 10px; font-weight: 600; color: #fbcfe8; }
        .wm-author { font-size: 11px; font-weight: 700; color: #fff; display: flex; items-center; gap: 6px; }
        .wm-author img { width: 16px; height: 16px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); }
      `}</style>

      {/* Cinematic Hero */}
      {(() => {
        const isPastPlan = activity ? (activity.end_date ? new Date(activity.end_date).getTime() <= new Date().getTime() : new Date(activity.date).getTime() + 24 * 60 * 60 * 1000 <= new Date().getTime()) : false;
        
        return (
          <>
      <div className="relative w-full h-[45vh] min-h-[300px] bg-black">
        {activity.banner ? (
          <img src={activity.banner} className="w-full h-full object-cover opacity-60" alt="Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        
        <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
          {isPastPlan && (
            <Link href={`/scrapbook/${id}`} className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2">
               📸 View Connected Chapter
            </Link>
          )}
          <div className="relative">
            <button onClick={() => setShowLoomMenu(!showLoomMenu)} className="w-10 h-10 bg-black/60 backdrop-blur-md hover:bg-black/80 border border-white/10 rounded-full flex items-center justify-center text-white shadow-lg transition-all">
              <span className="text-xl leading-none -mt-2">...</span>
            </button>
            {showLoomMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                {isHost && (
                  <button onClick={() => { setShowEditDetailsModal(true); setShowLoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors">
                    📝 Edit Details
                  </button>
                )}
                <button onClick={() => { setShowInviteModal(true); setShowLoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 flex items-center gap-2 transition-colors">
                  ✉️ Invite
                </button>
                {!isHost && (
                  <button onClick={() => { setShowLeaveModal(true); setShowLoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                    🚪 Leave Loom
                  </button>
                )}
                {isHost && (
                  <button onClick={() => { setShowDeletePlanModal(true); setShowLoomMenu(false); }} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                    🗑️ Delete Loom
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider text-pink-300 bg-pink-500/20 rounded-full border border-pink-500/30">
            {activity.type}
          </div>
          <h1 className="syne text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            {activity.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-300">
            <div className="flex items-center gap-2"><span className="text-lg">📍</span> <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-pink-300">{activity.location}</a></div>
            <div className="flex items-center gap-2"><span className="text-lg">⏳</span> {formattedDate} {activity.end_date ? ` to ${new Date(activity.end_date).toLocaleString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-2 relative z-10">

        <input 
          type="file" 
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }} 
          className="hidden" 
          id="camera-upload" 
        />
        {!isPastPlan && (
          <div className="glass-panel rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
             <div className="flex items-center gap-3">
               {!file && !isWritingNote ? (
                 <>
                   <label htmlFor="camera-upload" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                     Snap a Moment
                   </label>
                   <button onClick={() => setIsWritingNote(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                     Note
                   </button>
                 </>
               ) : isWritingNote ? (
                 <div className="flex items-center gap-3 w-full">
                   <input 
                     placeholder="Write your note..."
                     className="flex-1 bg-black/50 border border-pink-500/50 rounded-xl px-4 py-2.5 text-white outline-none focus:border-pink-500 text-sm"
                     value={noteText}
                     onChange={e => setNoteText(e.target.value)}
                     autoFocus
                   />
                   <button onClick={handleCapturePost} disabled={submitting || !noteText.trim()} className="bg-pink-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-pink-600">
                     {submitting ? "..." : "Post"}
                   </button>
                   <button onClick={() => { setIsWritingNote(false); setNoteText(""); }} className="bg-white/5 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-white/10">Cancel</button>
                 </div>
               ) : (
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg overflow-hidden border border-pink-500/50">
                     <img src={URL.createObjectURL(file!)} className="w-full h-full object-cover" alt="Preview" />
                   </div>
                   <button onClick={handleCapturePost} disabled={submitting} className="bg-pink-500 text-white font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-pink-600">
                     {submitting ? "..." : "Post"}
                   </button>
                   <button onClick={() => setFile(null)} className="bg-white/5 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-white/10">Cancel</button>
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto hide-scroll">
          {["plan", "crew", "discussion"].map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`tab-btn capitalize ${activeTab === t ? 'active' : ''}`}
            >
              {t === 'plan' ? '📝 Plan' : t === 'crew' ? '🫂 Crew' : '💬 Discussion'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          
          {/* PLAN TAB */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-panel rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="syne text-xl font-bold text-white">📝 The Plan</h3>
                  {isHost && !isEditingPlan && !isPastPlan && (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingPlan(true)} className="bg-white/10 hover:bg-white/20 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">Edit Plan</button>
                      <button onClick={handleEndPlan} className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border border-orange-500/20 hover:border-orange-500/50">End Loom</button>
                    </div>
                  )}
                </div>
                
                {isEditingPlan ? (
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs text-white/50 mb-1 block">Start Date/Time</label>
                        <input type="datetime-local" value={editDate} min={minDate} onChange={e => setEditDate(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500" />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-xs text-white/50 mb-1 block">Description</label>
                      <textarea 
                        value={editDescription} 
                        onChange={e => setEditDescription(e.target.value)} 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 min-h-[100px] text-white"
                        placeholder="Describe the vibe, the plan, the energy..."
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-400 font-bold block">Itinerary</label>
                        <button onClick={() => setEditItinerary([...editItinerary, { location: '', time: '', date: possibleDays.length > 0 ? possibleDays[0].toISOString().split('T')[0] : '', checked: false }])} className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded hover:bg-pink-500 hover:text-white">+ Add Location</button>
                      </div>
                      <div className="space-y-2">
                        {editItinerary.map((item, idx) => (
                          <div key={idx} className="flex gap-2">
                            <LocationAutocomplete value={item.location} onChange={(val) => { const newI = [...editItinerary]; newI[idx].location = val; setEditItinerary(newI); }} className="flex-1" />
                            {possibleDays.length > 1 && (
                              <select 
                                value={item.date || (possibleDays.length > 0 ? possibleDays[0].toISOString().split('T')[0] : '')} 
                                onChange={e => { const newI = [...editItinerary]; newI[idx].date = e.target.value; setEditItinerary(newI); }}
                                className="w-[100px] bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-sm outline-none focus:border-pink-500 text-white"
                              >
                                {possibleDays.map(d => {
                                  const dStr = d.toISOString().split('T')[0];
                                  return <option key={dStr} value={dStr}>{formatDateShort(dStr)}</option>;
                                })}
                              </select>
                            )}
                            <input type="time" value={item.time} onChange={e => { const newI = [...editItinerary]; newI[idx].time = e.target.value; setEditItinerary(newI); }} className="w-24 bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-sm outline-none focus:border-pink-500" />
                            <button onClick={() => setEditItinerary(editItinerary.filter((_, i) => i !== idx))} className="text-red-500 px-2 hover:bg-white/5 rounded-lg">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs text-gray-400 font-bold block mb-2">Visibility</label>
                      <div className="flex gap-2">
                        <div onClick={() => setEditIsPublic(false)} className={`flex-1 p-3 rounded-xl border ${!editIsPublic ? 'border-pink-500 bg-pink-500/10' : 'border-white/10 bg-white/5'} cursor-pointer transition-all text-center`}>
                          <div className="text-lg mb-1">🔒</div>
                          <div className="text-xs font-bold text-white">Private</div>
                          <div className="text-[10px] text-gray-400">Invite only</div>
                        </div>
                        <div onClick={() => setEditIsPublic(true)} className={`flex-1 p-3 rounded-xl border ${editIsPublic ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'} cursor-pointer transition-all text-center`}>
                          <div className="text-lg mb-1">🌍</div>
                          <div className="text-xs font-bold text-white">Public</div>
                          <div className="text-[10px] text-gray-400">Hop into random</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button onClick={() => setIsEditingPlan(false)} className="text-xs font-bold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10">Cancel</button>
                      <button onClick={handleSavePlan} disabled={savingPlan} className="text-xs font-bold px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white">{savingPlan ? 'Saving...' : 'Save Plan'}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">{activity.description || "No description provided. Pure spontaneity."}</p>
                    
                    {activity.itinerary && activity.itinerary.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Itinerary</h4>
                        {activity.itinerary.map((item, idx) => (
                          <div key={idx} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${item.checked ? 'bg-green-500/10 border-green-500/30 opacity-75' : 'bg-white/5 border-white/10 hover:border-pink-500/30'}`}>
                            <div 
                              onClick={() => handleToggleItineraryItem(idx)}
                              className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isHost ? 'cursor-pointer' : 'cursor-default'} ${item.checked ? 'bg-green-500' : 'bg-black/50 border border-white/20'}`}
                            >
                              {item.checked && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                              <span className={`font-bold ${item.checked ? 'text-green-400 line-through' : 'text-white'}`}><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{item.location}</a></span>
                              <span className={`text-xs font-bold px-2 py-1 rounded bg-black/40 ${item.checked ? 'text-green-200' : 'text-pink-300'}`}>
                                {item.date ? `${formatDateShort(item.date)} ` : ''}{item.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Polls */}
              {polls.length > 0 && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="syne text-xl font-bold mb-4 text-white">Polls</h3>
                  <div className="space-y-4">
                    {polls.map(poll => {
                      const totalVotes = poll.options.reduce((sum: number, o: any) => sum + (o.vote_count || 0), 0);
                      return (
                        <div key={poll.id} className="bg-black/40 rounded-xl p-4 border border-white/5">
                          <h4 className="font-bold text-sm mb-3">{poll.question}</h4>
                          <div className="space-y-2">
                            {poll.options.map((opt: any) => {
                              const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                              return (
                                <div key={opt.id} onClick={() => handleVotePoll(opt.id)} className={`relative overflow-hidden p-2.5 rounded-lg border cursor-pointer transition-all ${opt.has_voted ? 'border-pink-500/50 bg-pink-500/10' : 'border-white/5 hover:border-white/20'}`}>
                                  <div className="absolute inset-y-0 left-0 bg-pink-500/20 transition-all duration-500" style={{ width: `${pct}%` }} />
                                  <div className="relative flex justify-between text-xs z-10">
                                    <span>{opt.option_text} {opt.has_voted && "✓"}</span>
                                    <span className="font-bold">{pct}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Announcements */}
              {announcements.length > 0 && (
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="syne text-xl font-bold mb-4 text-white">Announcements</h3>
                  <div className="space-y-3">
                    {announcements.map(ann => (
                      <div key={ann.id} className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <img src={ann.sender_pic?.startsWith('/uploads') ? `${API}${ann.sender_pic}` : ann.sender_pic || `https://ui-avatars.com/api/?name=${ann.sender_name}&background=111&color=fff`} className="w-5 h-5 rounded-full" alt="" />
                          <span className="text-xs font-bold text-pink-300">{ann.sender_name}</span>
                          <span className="text-[10px] text-gray-500 ml-auto">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-pink-50">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isHost && (
                <div className="flex justify-end pt-4 mt-6 border-t border-white/5">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-gray-500 italic">the plan can be edited</span>
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingPlan(true)} className="text-xs font-bold text-white hover:text-pink-300 border border-white/20 hover:border-pink-500/50 px-4 py-2 rounded-lg transition-all">
                        Edit Plan
                      </button>
                      <button onClick={() => setShowDeletePlanModal(true)} className="text-xs font-bold text-red-500/70 hover:text-red-500 border border-red-500/20 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all">
                        Delete Plan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DISCUSSION TAB */}
          {activeTab === 'discussion' && (
            <div className="flex flex-col h-[60vh] max-h-[600px] glass-panel rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                    <span className="text-3xl">💬</span>
                    <p className="text-sm">Start the conversation</p>
                  </div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.profile_pic?.startsWith('/uploads') ? `${API}${c.profile_pic}` : c.profile_pic || `https://ui-avatars.com/api/?name=${c.name}&background=111&color=fff`} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                      <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%]">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{c.name}</span>
                          <span className="text-[10px] text-gray-500">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-gray-200 leading-snug">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 bg-black/40 border-t border-white/5 flex gap-2 items-end">
                <textarea 
                  rows={1}
                  placeholder="Say something..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 transition-all resize-none max-h-32 min-h-[44px]"
                />
                <button 
                  onClick={handleComment}
                  disabled={commenting || !commentText.trim()}
                  className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-all h-[44px] flex items-center justify-center"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* CREW TAB */}
          {activeTab === 'crew' && (
            <div className="glass-panel rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h3 className="syne text-xl font-bold text-white">The Crew</h3>
                {!isPastPlan && (
                  <button onClick={() => setShowInviteModal(true)} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all">
                    + Invite
                  </button>
                )}
              </div>

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No one's in yet. Be the first!</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map(m => {
                    const isPlanHost = activity.host_user_id === m.id;
                    return (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border ${isPlanHost ? 'bg-pink-500/5 border-pink-500/30' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <img src={m.profile_pic?.startsWith('/uploads') ? `${API}${m.profile_pic}` : m.profile_pic || `https://ui-avatars.com/api/?name=${m.name}&background=111&color=fff`} className={`w-10 h-10 rounded-full ${isPlanHost ? 'border-2 border-pink-500/50' : ''}`} alt="" />
                        <div>
                          <div className="text-sm font-bold flex items-center gap-2">
                            {m.name}
                            {isPlanHost && (
                              <span className="text-[9px] uppercase tracking-wider font-bold bg-pink-500 text-white px-1.5 py-0.5 rounded">Host</span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500">@{m.username}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${m.rsvp_status === 'going' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-400'}`}>
                        {m.rsvp_status}
                      </span>
                    </div>
                  )})}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Scrapbook Feed */}
        {submissions.length > 0 && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="syne text-xl font-bold text-white mb-6">📸 Chapter Memories</h3>
            <div className="scrapbook-grid">
              {submissions.map((s, i) => {
                    let meta: any = null;
                    try {
                      if (s.description && s.description.startsWith('{')) {
                        meta = JSON.parse(s.description);
                      }
                    } catch(e) {}

                    const timeObj = meta?.time ? new Date(meta.time) : new Date(s.created_at);
                    const timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '');
                    const locStr = meta?.location || activity.location.split(',')[0] || "Unknown";

                    return (
                      <div key={s.id} className={s.content_url === 'note' ? 'col-span-full mb-4' : 'scrapbook-item'} style={s.content_url !== 'note' ? {"--rand": Math.random()} as any : {}}>
                        {s.content_url === 'note' ? (
                          <div className="flex gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                            <img src={s.profile_pic?.startsWith('/uploads') ? `${API}${s.profile_pic}` : s.profile_pic || `https://ui-avatars.com/api/?name=${s.name}&background=111&color=fff`} className="w-12 h-12 rounded-full border-2 border-white/10 flex-shrink-0 object-cover" alt="Avatar" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-bold text-sm text-white/90">{s.name}</div>
                                  <div className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                                    <span>{timeStr}</span>
                                    <span>•</span>
                                    <span className="truncate max-w-[150px]">📍 {locStr}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-white/80 leading-relaxed font-medium">
                                {meta?.note}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img src={s.content_url.startsWith('/uploads') ? `${API}${s.content_url}` : s.content_url} className="scrapbook-img" alt="Memory" />
                            <div className="watermark-overlay">
                              <div className="flex justify-between items-start">
                                <div className="wm-time">{timeStr}</div>
                                <div className="wm-author">
                                  <img src={s.profile_pic?.startsWith('/uploads') ? `${API}${s.profile_pic}` : s.profile_pic || `https://ui-avatars.com/api/?name=${s.name}&background=111&color=fff`} alt="" />
                                </div>
                              </div>
                              <div className="flex justify-start">
                                <div className="wm-loc">
                                  <span>📍</span> {locStr}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="syne font-bold text-lg">Invite Crew</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="p-5">
              <input 
                autoFocus
                type="text" 
                placeholder="Search username or name..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 mb-4"
              />
              <div className="max-h-[300px] overflow-y-auto space-y-2 hide-scroll">
                {searching ? <div className="text-center py-8 text-gray-500 text-sm">Searching...</div> :
                 searchResults.length === 0 && searchQuery ? <div className="text-center py-8 text-gray-500 text-sm">No one found.</div> :
                 searchResults.map(u => (
                   <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                     <div className="flex items-center gap-3">
                       <img src={u.profile_pic?.startsWith('/uploads') ? `${API}${u.profile_pic}` : u.profile_pic || `https://ui-avatars.com/api/?name=${u.name}&background=111&color=fff`} className="w-10 h-10 rounded-full" alt="" />
                       <div>
                         <div className="text-sm font-bold">{u.name}</div>
                         <div className="text-[10px] text-gray-500">@{u.username}</div>
                       </div>
                     </div>
                     <button onClick={() => handleInvite(u.id)} className="text-xs font-bold bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white px-4 py-2 rounded-lg transition-all">
                       Invite
                     </button>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-xl font-bold mb-2 font-['Syne']">Leave Plan?</h2>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to bail on this plan?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowLeaveModal(false);
                  await handleRsvp('not_going');
                  router.push('/activities');
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                I'm Out 🏃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Modal */}
      {showDeletePlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-xl font-bold mb-2 font-['Syne'] text-white">Delete Plan?</h2>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete this plan completely? This cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeletePlanModal(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  setShowDeletePlanModal(false);
                  await handleDeletePlan();
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {showEditDetailsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 font-['Syne'] text-white">Edit Details</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Rename Loom</label>
                <input 
                  type="text" 
                  value={editLoomTitle} 
                  onChange={e => setEditLoomTitle(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-pink-500 text-white" 
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Change Venue</label>
                <LocationAutocomplete 
                  value={editLoomVenue} 
                  onChange={setEditLoomVenue} 
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEditDetailsModal(false)} className="text-sm font-bold text-gray-400 hover:text-white px-4 py-2 transition-colors">Cancel</button>
              <button onClick={handleSaveDetails} disabled={savingDetails} className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold px-6 py-2 rounded-xl transition-all disabled:opacity-50">
                {savingDetails ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
      </>
        );
      })()}
    </div>
  );
}