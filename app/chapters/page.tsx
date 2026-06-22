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

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const token = localStorage.getItem("token");
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        // Fetch past activities the user joined
        const res = await fetch(`${API}/activities?status=past&tab=my`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
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
              
              return (
                <Link 
                  key={chap.id} 
                  href={`/scrapbook/${chap.id}`} 
                  className="polaroid group"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="polaroid-tape"></div>
                  
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
                  <div className="polaroid-caption">{chap.title}</div>
                  <div className="polaroid-date">{formatDate(chap.date)} • {chap.member_count} Crew</div>
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
