"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Room = {
  id: string;
  name: string;
  type: string;
  host_username: string;
  host_name: string;
  host_profile_pic: string;
  created_at: string;
};

export default function RoomsHub() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("VIDEO");
  const [mediaUrl, setMediaUrl] = useState("");

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/auth/login");
      
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [router]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a Room Name before continuing.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/rooms`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, type, media_url: mediaUrl })
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/rooms/${data.id}`);
      } else {
        const errData = await res.json();
        alert(`Failed: ${errData.error || res.statusText}`);
      }
    } catch(err) {
      console.error(err);
      alert(`Network Error: ${err}`);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .hub-container {
          font-family: 'DM Sans', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
        }

        .hub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }

        .hub-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .create-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 99px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .room-card {
          background: rgba(25, 25, 25, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-decoration: none;
        }

        .room-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .room-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .type-video {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .type-music {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .room-name {
          font-size: 20px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          line-height: 1.3;
        }

        .room-host {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: auto;
        }

        .host-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .host-info {
          font-size: 13px;
          color: #ccc;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: #111;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          color: #888;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .form-input, .form-select {
          width: 100%;
          padding: 14px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          outline: none;
          transition: border 0.3s;
          font-family: inherit;
        }
        .form-input:focus, .form-select:focus {
          border-color: #3b82f6;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 32px;
        }
      `}</style>
      
      <div className="hub-container">
        <header className="hub-header">
          <h1>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Active Rooms
          </h1>
          <button className="create-btn" onClick={() => setShowCreate(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Room
          </button>
        </header>

        {loading ? (
          <div style={{ textAlign: "center", color: "#888", marginTop: "100px" }}>Loading active rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", marginTop: "100px" }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{margin: "0 auto 16px auto"}}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2 style={{ color: "#eee", marginBottom: "8px" }}>No Active Rooms</h2>
            <p>It's quiet here. Be the first to start a Watch Party or Listen Together!</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => {
              const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
              const avatar = room.host_profile_pic 
                ? room.host_profile_pic.startsWith("/uploads") ? `${API}${room.host_profile_pic}` : room.host_profile_pic 
                : `https://ui-avatars.com/api/?name=${room.host_name}&background=0D1117&color=fff`;

              const isVideo = room.type === 'VIDEO';

              return (
                <Link href={`/rooms/${room.id}`} key={room.id} className="room-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div className={`room-type-badge ${isVideo ? 'type-video' : 'type-music'}`}>
                      {isVideo ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                          Watch Party
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                          Listen Together
                        </>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="room-name">{room.name}</h3>
                  
                  <div className="room-host">
                    <img src={avatar} alt="" className="host-avatar" />
                    <div className="host-info">
                      Hosted by <strong style={{color: "#fff"}}>{room.host_name}</strong>
                    </div>
                  </div>
                </Link>
             );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: "0 0 24px 0", fontSize: "24px" }}>Start a Room</h2>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                  <option value="VIDEO">Watch Party (YouTube)</option>
                  <option value="MUSIC">Listen Together (Spotify)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Room Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Late Night Vibes" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{type === 'VIDEO' ? 'YouTube URL (Optional)' : 'Spotify Track/Playlist URL (Optional)'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://..." 
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreate(false)}
                  style={{ flex: 1, padding: "14px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#ccc", borderRadius: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 2, padding: "14px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: "12px", cursor: "pointer", fontWeight: 600 }}
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
