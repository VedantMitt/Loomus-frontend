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
  const [uploading, setUploading] = useState(false);
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
        <div>
          <button onClick={() => router.push(`/activities/${id}`)} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all flex items-center gap-2">
            View Connected Loom
          </button>
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

      {/* Add Snap Button (Only if myUserId === activity.host_id) */}
      {myUserId === activity.host_id && (
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

    </div>
  );
}
