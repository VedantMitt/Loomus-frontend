"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import NebulaBackground from "@/components/NebulaBackground";

type Activity = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  banner?: string;
  host_name: string;
  host_pic?: string;
  member_count: number;
};

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [snapMenuFor, setSnapMenuFor] = useState<string | null>(null);
  const [uploadingChapId, setUploadingChapId] = useState<string | null>(null);

  const handleQuickSnap = async (file: File, source: 'camera' | 'gallery', chapId: string) => {
    setUploadingChapId(chapId);
    setSnapMenuFor(null);
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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

      const ext = file.name.split('.').pop() || 'jpg';
      const fname = `snap_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const psRes = await fetch(`${API}/upload/presigned?filename=${fname}&contentType=${file.type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!psRes.ok) throw new Error("Presigned URL failed");
      const { url, key } = await psRes.json();
      
      const s3Res = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!s3Res.ok) throw new Error("S3 upload failed");
      const fileUrl = `${process.env.NEXT_PUBLIC_S3_PUBLIC_URL}/${key}`;

      const meta = { location: locStr, time: new Date().toISOString(), source };
      const postRes = await fetch(`${API}/activities/${chapId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content_url: fileUrl, description: JSON.stringify(meta) })
      });
      if (!postRes.ok) throw new Error("Submit failed");
      
      alert("Snap added to scrapbook!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploadingChapId(null);
    }
  };

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const token = localStorage.getItem("token");
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/activities?tab=my`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (res.ok) {
          const allData = await res.json();
          const data = allData.map((c: any) => {
            const isPast = !!c.end_date;
            const isLive = !isPast;
            return { ...c, _isLive: isLive };
          });
          
          data.sort((a: any, b: any) => {
            if (a._isLive && !b._isLive) return -1;
            if (!a._isLive && b._isLive) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
          setChapters(data);
        }
      } catch (err) {
        console.error("Failed to fetch chapters", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, []);

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;
    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/activities/${chapterToDelete}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setChapters(prev => prev.filter(c => c.id !== chapterToDelete));
      }
    } catch (err) {
      console.error(err);
    }
    setChapterToDelete(null);
  };

  // Format date: "Oct 24, 2026"
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground orb1="#f472b6" orb2="#c084fc" orb3="#a855f7" orb4="#ec4899" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&family=Caveat:wght@600;700&display=swap');

        .chapters-container {
          max-width: 900px;
          margin: 0 auto;
          padding: calc(80px + env(safe-area-inset-top, 0px)) 24px 120px;
          position: relative;
          z-index: 10;
        }

        .chap-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .chap-title {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 10px;
          letter-spacing: -0.04em;
        }

        .chap-title span {
          background: linear-gradient(135deg, #f472b6, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .chap-subtitle {
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.6);
          font-size: 16px;
          margin: 0;
        }

        .scrapbook-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 32px;
          padding: 20px 0;
        }

        .polaroid {
          background: #fff;
          padding: 12px 12px 24px;
          border-radius: 4px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.1);
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
          position: relative;
        }

        .polaroid:hover {
          transform: translateY(-10px) scale(1.02) rotate(0deg) !important;
          box-shadow: 0 25px 50px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .polaroid-img-wrapper {
          width: 100%;
          aspect-ratio: 1/1;
          background: #1a1a1a;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(0,0,0,0.1);
        }

        .polaroid-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .polaroid:hover .polaroid-img {
          transform: scale(1.05);
        }

        .polaroid-caption {
          font-family: 'Caveat', cursive;
          color: #1a1a1a;
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          margin-top: 16px;
          line-height: 1.1;
        }

        .polaroid-date {
          font-family: 'DM Sans', sans-serif;
          color: #666;
          font-size: 12px;
          text-align: center;
          margin-top: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .polaroid-tape {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%) rotate(-2deg);
          width: 80px;
          height: 25px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          z-index: 2;
        }
        
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 24px;
          backdrop-filter: blur(10px);
        }

        .chap-delete {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          background: rgba(239, 68, 68, 0.9);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 20;
          border: none;
          cursor: pointer;
        }
        .polaroid:hover .chap-delete {
          opacity: 1;
        }
      `}</style>

      <div className="chapters-container">

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.5)" }}>
            Loading your memories...
          </div>
        ) : chapters.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <h3 style={{ color: "#fff", fontFamily: "'Syne', sans-serif", fontSize: 24, margin: "0 0 8px" }}>No chapters yet</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: "0 0 24px", fontFamily: "'DM Sans', sans-serif" }}>Your scrapbook is empty. Go out there and start living!</p>
            <Link href="/discover" style={{ background: "#f472b6", color: "#fff", padding: "12px 24px", borderRadius: "12px", textDecoration: "none", fontWeight: 700 }}>Explore Plans</Link>
          </div>
        ) : (
          <div className="scrapbook-grid">
            {chapters.map((chap, i) => {
              const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
              const bannerUrl = chap.banner 
                ? (chap.banner.startsWith("/uploads") ? `${API}${chap.banner}` : chap.banner)
                : `https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop`;
              
              // Random rotation between -4deg and 4deg for scrapbook feel
              const rotation = (Math.random() * 8) - 4;
              
              const isLive = (chap as any)._isLive;
              return (
                <Link 
                  key={chap.id} 
                  href={`/scrapbook/${chap.id}`} 
                  className="polaroid group relative"
                  style={{ 
                    transform: `rotate(${rotation}deg)`,
                    ...(isLive ? { boxShadow: '0 0 35px rgba(239, 68, 68, 0.4)', border: '1px solid rgba(239, 68, 68, 0.5)' } : {})
                  }}
                >
                  <div className="polaroid-tape"></div>
                  
                  {isLive && (
                    <div className="absolute top-2 left-3 z-20 flex items-center gap-2 bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-100 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      Live Now
                    </div>
                  )}

                  <button 
                    className="chap-delete"
                    onClick={(e) => {
                      e.preventDefault();
                      setChapterToDelete(chap.id);
                    }}
                    title="Delete Chapter"
                  >
                    🗑️
                  </button>

                  <div className="polaroid-img-wrapper">
                    <img src={bannerUrl} alt={chap.title} className="polaroid-img" />
                  </div>
                  <div className="polaroid-caption pr-12">{chap.title}</div>
                  <div className="polaroid-date">{formatDate(chap.date)} • {chap.member_count} Crew</div>

                  {isLive && (
                    <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end" onClick={(e) => e.preventDefault()}>
                      {snapMenuFor === chap.id && (
                        <div className="mb-2 bg-[#111] border border-white/10 rounded-2xl p-2 flex flex-col gap-1 shadow-2xl animate-fade-in-up">
                          <input type="file" accept="image/*" capture="environment" className="hidden" id={`cam-${chap.id}`} onChange={e => { if(e.target.files?.[0]) handleQuickSnap(e.target.files[0], 'camera', chap.id); }} />
                          <input type="file" accept="image/*" className="hidden" id={`gal-${chap.id}`} onChange={e => { if(e.target.files?.[0]) handleQuickSnap(e.target.files[0], 'gallery', chap.id); }} />
                          
                          <label htmlFor={`cam-${chap.id}`} className="bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-pink-500/30">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                            Live Camera
                          </label>
                          <label htmlFor={`gal-${chap.id}`} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-white/10">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            Camera Roll
                          </label>
                        </div>
                      )}
                      
                      <button
                        className={`w-12 h-12 bg-pink-500 hover:bg-pink-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all ${uploadingChapId === chap.id ? 'opacity-80' : 'hover:scale-110 active:scale-95'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (uploadingChapId === chap.id) return;
                          setSnapMenuFor(snapMenuFor === chap.id ? null : chap.id);
                        }}
                        title="Snap a moment"
                      >
                        {uploadingChapId === chap.id ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        )}
                      </button>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Chapter Modal */}
      {chapterToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <h2 className="text-xl font-bold mb-2 font-['Syne'] text-white">Delete Chapter?</h2>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete this chapter? This cannot be undone.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setChapterToDelete(null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteChapter}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
