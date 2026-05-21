"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NebulaBackground from "@/components/NebulaBackground";

export default function ShareScrapbookPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [activity, setActivity] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [actRes, subRes] = await Promise.all([
          fetch(`${API}/activities/${id}`, { headers }),
          fetch(`${API}/activities/${id}/submissions`)
        ]);

        if (!actRes.ok) throw new Error("Activity not found");
        
        const actData = await actRes.json();
        const subData = await subRes.json();
        
        setActivity(actData);
        setSubmissions(subData);
      } catch (err) {
        console.error(err);
        alert("Could not load scrapbook data.");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router, API]);

  const handleShare = async () => {
    if (!activity) return;
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
        router.push("/discover");
      } else {
        const errData = await res.json();
        alert(`Failed: ${errData.error || "Could not share"}`);
        setSharing(false);
      }
    } catch (err) {
      console.error(err);
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        <div className="text-pink-500 font-bold animate-pulse">Loading scrapbook...</div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "#0D1117", color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>
      <NebulaBackground variant="discover" />

      <style>{`
        .hide-scroll::-webkit-scrollbar { display: none; }
        .glass-panel { background: rgba(20,20,20,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.05); }
      `}</style>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(13,17,23,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ color: "#fff", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>
            ←
          </button>
          <h1 style={{ fontSize: "18px", fontWeight: 800, fontFamily: "Syne, sans-serif", margin: 0 }}>New Post</h1>
        </div>
        <button 
          onClick={handleShare}
          disabled={sharing}
          style={{ 
            background: sharing ? "rgba(255,255,255,0.1)" : "none",
            color: sharing ? "#888" : "#f472b6",
            border: "none",
            fontWeight: 800,
            fontSize: "16px",
            cursor: sharing ? "default" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {sharing ? "Sharing..." : "Share"}
        </button>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Caption Area */}
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Avatar Preview */}
          <div style={{ flexShrink: 0 }}>
             <img 
               src={activity?.host_pic?.startsWith('/uploads') ? `${API}${activity.host_pic}` : activity?.host_pic || `https://ui-avatars.com/api/?name=${activity?.host_name}&background=111&color=fff`} 
               style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }}
               alt="User"
             />
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                width: "100%",
                minHeight: "120px",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "16px",
                fontFamily: "inherit",
                resize: "none"
              }}
              autoFocus
            />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.05)" }} />

        {/* Photos Preview */}
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#888", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Scrapbook Photos ({submissions.length})
          </h3>
          
          {submissions.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "16px", color: "#666" }}>
              No photos captured in this chapter yet.
            </div>
          ) : (
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px" }} className="hide-scroll">
              {submissions.map((photo: any, i: number) => {
                let locStr = activity?.location?.split(',')[0] || "Unknown";
                let timeStr = "";
                try {
                   if (photo.description && photo.description.startsWith('{')) {
                     const meta = JSON.parse(photo.description);
                     if (meta.location) locStr = meta.location;
                     if (meta.time) {
                       const timeObj = new Date(meta.time);
                       timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' ', '');
                     }
                   }
                } catch(e) {}
                
                return (
                  <div key={i} style={{ flex: "0 0 200px", aspectRatio: "3/4", borderRadius: "16px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)", background: "#000" }}>
                    <img src={photo.content_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Scrapbook preview" />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "12px", left: "12px", right: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#fbcfe8", background: "rgba(0,0,0,0.4)", padding: "4px 8px", borderRadius: "8px", backdropFilter: "blur(4px)" }}>
                        📍 {locStr}
                      </div>
                      {timeStr && <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "Syne, sans-serif", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{timeStr}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
