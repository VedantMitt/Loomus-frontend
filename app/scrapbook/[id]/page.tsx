"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

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
};

export default function ScrapbookStoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
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

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const aRes = await fetch(`${API}/activities/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (aRes.ok) setActivity(await aRes.json());

        const sRes = await fetch(`${API}/activities/${id}/submissions`);
        if (sRes.ok) {
          const subs = await sRes.json();
          // Sort chronologically for story mode
          subs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setSubmissions(subs);
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
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="font-bold text-sm text-pink-100">{s.name}</span>
                        <span className="text-xs text-gray-500">{timeStr}</span>
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
    </div>
  );
}
