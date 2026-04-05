"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/context/RoomContext";
import ReactPlayer from "react-player";
const Player = ReactPlayer as any;
import Link from "next/link";

type UserAction = {
  id: string;
  name: string;
  username: string;
  profile_pic: string;
};

export default function ActiveRoomPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const { activeRoom, socket, leaveRoom, joinRoom } = useRoom();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);

  const [participants, setParticipants] = useState<Map<string, UserAction>>(new Map());
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tabs & Queue
  const [activeTab, setActiveTab] = useState<'CHAT' | 'QUEUE' | 'PEOPLE'>('CHAT');
  const [queueInput, setQueueInput] = useState("");

  // Media Sync State (Connected to Global Context)
  const { playing, setPlaying, syncTime, setSyncTime } = useRoom();
  const playerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const lastPlayed = useRef(0);
  const isSeeking = useRef(false);

  // 1. Setup Auth
  useEffect(() => {
    setIsClient(true);
    const token = localStorage.getItem("token");
    if (!token) return router.push("/auth/login");
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(payload);
    } catch {
      router.push("/auth/login");
    }
  }, [router]);

  // 2. Fetch Room & Join via Context
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const res = await fetch(`${API}/rooms/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            return router.push("/auth/login");
          }
          if (res.status === 404) return router.push("/rooms");
          throw new Error(`Failed to fetch room`);
        }

        const roomData = await res.json();
        if (isMounted) {
          setRoom(roomData);
          joinRoom(roomData);
        }
      } catch (err) {
        console.error(err);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [currentUser, params.id, router, joinRoom]);

  // 3. Socket Listeners (Using Context Socket)
  useEffect(() => {
    if (!socket || !currentUser) return;

    socket.on("room_action", (data: any) => {
      if (data.type === "JOIN") {
        setParticipants(prev => {
          const next = new Map(prev);
          next.set(data.user.id, data.user);
          return next;
        });
      } else if (data.type === "LEAVE") {
        setParticipants(prev => {
          const next = new Map(prev);
          next.delete(data.userId);
          return next;
        });
      }
    });

    socket.on("receive_room_message", (msg: any) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on("room_update", (updatedRoom: any) => {
      setRoom(updatedRoom);
    });

    socket.on("room_deleted", () => {
      router.push("/rooms");
    });

    return () => {
      setPlaying(false);
      socket.off("room_action");
      socket.off("receive_room_message");
      socket.off("room_update");
      socket.off("room_deleted");
      // Explicitly leave the room when the page is closed/navigated away from
      leaveRoom();
    };
  }, [socket, currentUser, router, setPlaying, leaveRoom]);

  // 4. Respond to Global Sync Time
  useEffect(() => {
    if (syncTime !== null && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : lastPlayed.current;
      // Small buffer (2s) to avoid constant seeking
      if (Math.abs(currentTime - syncTime) > 2.5) {
         isSeeking.current = true;
         playerRef.current.seekTo(syncTime, 'seconds');
         lastPlayed.current = syncTime;
         setTimeout(() => { 
           isSeeking.current = false; 
         }, 1000);
      }
    }
  }, [syncTime]);

  // Handle Chat Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendRoomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !currentUser) return;

    const msg = {
      id: Date.now().toString(),
      sender_name: currentUser.name,
      sender_pic: currentUser.profile_pic,
      content: chatInput,
      created_at: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, msg]);
    socket.emit("send_room_message", { roomId: params.id, message: msg });
    setChatInput("");
  };

  if (!room) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888", background: "#0a0a0a" }}>
        Loading Session...
      </div>
    );
  }

  const myRole = currentUser ? (room.host_id === currentUser.id ? 'ADMIN' : (room.roles || {})[currentUser.id] || 'VIEWER') : 'VIEWER';
  const canAdd = myRole === 'ADMIN' || myRole === 'CONTRIBUTOR';
  const canManage = myRole === 'ADMIN';

  const isVideo = room.type === 'VIDEO';

  const handlePlay = () => {
    if (!socket || !room) return;
    setPlaying(true);
    socket.emit("sync_play", { roomId: room.id, currentTime: lastPlayed.current });
  };

  const handlePause = () => {
    if (!socket || !room) return;
    setPlaying(false);
    socket.emit("sync_pause", { roomId: room.id, currentTime: lastPlayed.current });
  };

  const handleSeek = (seconds: number) => {
    if (!socket || !room) return;
    setSyncTime(seconds); // Update local context too
    socket.emit("sync_seek", { roomId: room.id, currentTime: seconds });
  };

  const handleTimeUpdate = (state: any) => {
    const time = state.playedSeconds || 0;
    if (isSeeking.current) {
      lastPlayed.current = time;
      return;
    }
    // If the user manually jumps (more than 3s difference), broadcast seek
    if (Math.abs(time - lastPlayed.current) > 3) {
      handleSeek(time);
    }
    lastPlayed.current = time;
  };

  const getSpotifyEmbedUrl = (url: string) => {
    if (!url.includes('spotify.com')) return url;
    // convert https://open.spotify.com/track/123 to https://open.spotify.com/embed/track/123
    let embed = url.replace('/track/', '/embed/track/');
    embed = embed.replace('/playlist/', '/embed/playlist/');
    embed = embed.replace('/album/', '/embed/album/');
    // Clean up query params if needed
    return embed.split('?')[0];
  };

  const playQueueItem = async (q: any) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      if (socket) {
        setPlaying(true);
        socket.emit("sync_play", { roomId: room.id, currentTime: 0 });
      }
      await fetch(`${API}/rooms/${room.id}/media`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ media_url: q.url })
      });
      await fetch(`${API}/rooms/${room.id}/queue/${q.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
  };

  const removeQueueItem = async (id: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/rooms/${room.id}/queue/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) { console.error(e); }
  };

  const handleQueueAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueInput.trim()) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/rooms/${room.id}/queue`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: queueInput, title: queueInput })
      });
      setQueueInput("");
    } catch (e) { console.error(e); }
  };

  const deleteRoom = async () => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/rooms/${room.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) router.push("/rooms");
    } catch (e) { console.error(e); }
  };

  const handleExitRoom = async () => {
    if (!confirm("Are you sure you want to leave the party?")) return;
    await leaveRoom();
    router.push("/rooms");
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/rooms/${room.id}/roles`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUserId, role: newRole })
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="elite-room-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        .elite-room-root {
          font-family: 'Outfit', sans-serif;
          height: 100vh;
          width: 100vw;
          background: #020205;
          color: #fff;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .ambient-glow {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
          pointer-events: none;
          z-index: 0;
        }

        /* --- Main Layout --- */
        .room-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          z-index: 1;
        }

        .elite-navbar {
          height: 80px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          background: rgba(13, 13, 18, 0.5);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          gap: 24px;
        }

        .nav-back-button {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .nav-back-button:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: translateX(-4px);
          border-color: rgba(99, 102, 241, 0.3);
        }

        .room-header-info {
          flex: 1;
        }

        .room-name-title {
          font-family: 'Plus+Jakarta+Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .room-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .room-actions-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-button-premium {
          padding: 12px 20px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-leave {
          background: rgba(239, 68, 68, 0.05);
          color: #ef4444;
        }

        .btn-leave:hover {
          background: #ef4444;
          color: #fff;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
        }

        /* --- Media Area --- */
        .media-super-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
        }

        .main-media-frame {
          width: 100%;
          max-width: 1000px;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 24px;
          position: relative;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }

        /* --- Sidebar (Elite Glass Panel) --- */
        .elite-sidebar {
          width: 400px;
          background: rgba(10, 10, 14, 0.6);
          backdrop-filter: blur(40px);
          border-left: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .sidebar-tabs {
          display: flex;
          padding: 24px 24px 0;
          gap: 8px;
        }

        .sidebar-tab {
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s;
          position: relative;
        }

        .sidebar-tab.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.04);
        }

        .sidebar-tab.active::after {
          content: '';
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          width: 32px;
          height: 3px;
          background: #6366f1;
          border-radius: 3px 3px 0 0;
          box-shadow: 0 -2px 10px rgba(99, 102, 241, 0.8);
        }

        .sidebar-content-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-top: 24px;
        }

        /* --- Chat UI --- */
        .chat-messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .chat-bubble-row {
          display: flex;
          gap: 14px;
        }

        .chat-avatar-wrapper {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          overflow: hidden;
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .chat-message-info {
          flex: 1;
        }

        .chat-sender-name {
          font-size: 13px;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .chat-text-content {
          font-size: 14px;
          line-height: 1.6;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.03);
          padding: 12px 16px;
          border-radius: 0 16px 16px 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: fit-content;
          max-width: 90%;
        }

        .chat-input-bar {
          padding: 24px;
          background: rgba(0,0,0,0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .premium-input-box {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 8px;
          align-items: center;
          transition: all 0.3s;
        }

        .premium-input-box:focus-within {
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }

        .sidebar-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          padding: 8px 12px;
          font-size: 14px;
          font-family: inherit;
        }

        .send-button-circle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #6366f1;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .send-button-circle:hover {
          transform: scale(1.05);
          background: #4f46e5;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        /* --- People (Participant Cards) --- */
        .participant-grid {
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .elite-person-card {
          padding: 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: 0.3s;
        }

        .elite-person-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .role-pill {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .role-host { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .role-admin { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
        .role-viewer { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }

        /* --- Custom Scrollbar --- */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
      `}</style>

      <div className="ambient-glow" />

      {/* LEFT CONTENT */}
      <div className="room-main-content">
        <nav className="elite-navbar">
          <Link href="/rooms" className="nav-back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </Link>

          <div className="room-header-info">
            <h1 className="room-name-title">{room.name}</h1>
            <div className="room-status-badge">
              <div className="status-dot" />
              <span>LIVE</span>
              <span style={{ opacity: 0.3 }}>|</span>
              <span>{participants.size + 1} synchronized users</span>
            </div>
          </div>

          <div className="room-actions-group">
            {room.host_id === currentUser?.id && (
              <button
                onClick={deleteRoom}
                className="action-button-premium"
                style={{ background: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.1)' }}
              >
                Delete Room
              </button>
            )}
            <button onClick={handleExitRoom} className="action-button-premium btn-leave">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Leave Session
            </button>
          </div>
        </nav>

        <div className="media-super-container">
          <div className="main-media-frame">
            {room.media_url ? (
              isVideo ? (
                isClient && (
                  <Player
                    ref={playerRef}
                    url={room.media_url}
                    width="100%"
                    height="100%"
                    playing={playing}
                    controls={canManage}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onProgress={(state: any) => handleTimeUpdate(state)}
                    config={{
                      youtube: { playerVars: { origin: window.location.origin } }
                    }}
                  />
                )
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0d0d12, #18181b)" }}>
                  <iframe
                    src={getSpotifyEmbedUrl(room.media_url)}
                    width="90%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ borderRadius: "24px", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}
                  ></iframe>
                </div>
              )
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#64748b", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ width: 120, height: 120, borderRadius: "40px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="6" ry="6"></rect><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "20px" }}>Empty Stage</h3>
                <p style={{ fontSize: "14px", marginTop: "8px", opacity: 0.6 }}>{canManage ? "Paste a link in the input below to start" : "Waiting for the host to play something..."}</p>

                {canManage && (
                  <div style={{ marginTop: "32px", width: "100%", maxWidth: "400px" }}>
                    <div className="premium-input-box">
                      <input
                        type="text"
                        className="sidebar-input"
                        placeholder="Paste YouTube or Video link..."
                        onKeyDown={async (e: any) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            const token = localStorage.getItem('token');
                            if (val && token) {
                              try {
                                await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/rooms/${room.id}/media`, {
                                  method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ media_url: val })
                                });
                              } catch (err) { console.error(err); }
                            }
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SIDEBAR PANEL */}
      <aside className="elite-sidebar">
        <div className="sidebar-tabs">
          <div className={`sidebar-tab ${activeTab === 'CHAT' ? 'active' : ''}`} onClick={() => setActiveTab('CHAT')}>Chat</div>
          <div className={`sidebar-tab ${activeTab === 'QUEUE' ? 'active' : ''}`} onClick={() => setActiveTab('QUEUE')}>
            Queue <span style={{ opacity: 0.4, marginLeft: 4 }}>{room.queue?.length || 0}</span>
          </div>
          <div className={`sidebar-tab ${activeTab === 'PEOPLE' ? 'active' : ''}`} onClick={() => setActiveTab('PEOPLE')}>
            Synced <span style={{ opacity: 0.4, marginLeft: 4 }}>{participants.size + 1}</span>
          </div>
        </div>

        <div className="sidebar-content-view">
          {activeTab === 'CHAT' && (
            <>
              <div className="chat-messages-container">
                <div style={{ textAlign: "center", display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "1px" }}>Secure Session Start</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                </div>

                {chatMessages.map(msg => {
                  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                  const avatar = msg.sender_pic
                    ? msg.sender_pic.startsWith("/uploads") ? `${API}${msg.sender_pic}` : msg.sender_pic
                    : `https://ui-avatars.com/api/?name=${msg.sender_name}&background=1e1b4b&color=fff`;

                  return (
                    <div key={msg.id} className="chat-bubble-row">
                      <div className="chat-avatar-wrapper">
                        <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      </div>
                      <div className="chat-message-info">
                        <div className="chat-sender-name">{msg.sender_name}</div>
                        <div className="chat-text-content">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} style={{ height: 20 }} />
              </div>

              <div className="chat-input-bar">
                <form onSubmit={sendRoomMessage} className="premium-input-box">
                  <input
                    type="text"
                    className="sidebar-input"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="send-button-circle" disabled={!chatInput.trim()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </>
          )}

          {activeTab === 'QUEUE' && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                {(room.queue || []).map((q: any) => (
                  <div key={q.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "20px", transition: "0.2s" }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff", marginBottom: "4px" }}>{q.title}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Added by {q.addedBy}</div>
                    {canManage && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => playQueueItem(q)} style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#6366f1", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Watch Now</button>
                        <button onClick={() => removeQueueItem(q.id)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", cursor: "pointer" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {(!room.queue || room.queue.length === 0) && (
                  <div style={{ textAlign: "center", marginTop: "100px" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "20px", background: "rgba(255,255,255,0.02)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </div>
                    <p style={{ color: "#475569", fontSize: "14px" }}>Queue is empty</p>
                  </div>
                )}
              </div>

              {canAdd && (
                <div className="chat-input-bar">
                  <form onSubmit={handleQueueAdd} className="premium-input-box">
                    <input
                      type="text"
                      className="sidebar-input"
                      placeholder="Add media URL to queue..."
                      value={queueInput}
                      onChange={e => setQueueInput(e.target.value)}
                    />
                    <button type="submit" className="send-button-circle" style={{ background: "#22c55e" }} disabled={!queueInput.trim()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PEOPLE' && (
            <div style={{ flex: 1, overflowY: "auto" }} className="participant-grid">
              <div style={{ padding: "0 4px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: "12px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.5px" }}>Current Session Nodes</span>
              </div>

              {/* Self Card */}
              <div className="elite-person-card" style={{ background: "rgba(99, 102, 241, 0.05)", borderColor: "rgba(99, 102, 241, 0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <img src={currentUser?.profile_pic?.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${currentUser.profile_pic}` : currentUser?.profile_pic || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=1e1b4b&color=fff`} style={{ width: 44, height: 44, borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)" }} alt="" />
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{currentUser?.name} <span style={{ opacity: 0.5, fontWeight: 400 }}>(You)</span></div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                      <span className={`role-pill ${room.host_id === currentUser?.id ? 'role-host' : 'role-viewer'}`}>
                        {room.host_id === currentUser?.id ? 'OWNER' : myRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Others */}
              {Array.from(participants.values()).map(p => {
                const pRole = (room.roles || {})[p.id] || (room.host_id === p.id ? 'ADMIN' : 'VIEWER');
                const avatar = p.profile_pic ? (p.profile_pic.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${p.profile_pic}` : p.profile_pic) : `https://ui-avatars.com/api/?name=${p.name}&background=1e1b4b&color=fff`;

                return (
                  <div key={p.id} className="elite-person-card">
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <img src={avatar} style={{ width: 44, height: 44, borderRadius: "14px" }} alt="" />
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff" }}>{p.name}</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                          <span className={`role-pill ${pRole === 'ADMIN' ? 'role-host' : pRole === 'CONTRIBUTOR' ? 'role-admin' : 'role-viewer'}`}>
                             {room.host_id === p.id ? 'OWNER' : pRole}
                          </span>
                        </div>
                      </div>
                    </div>

                    {room.host_id === currentUser?.id && room.host_id !== p.id && (
                      <select
                        value={pRole}
                        onChange={(e) => handleRoleChange(p.id, e.target.value)}
                        style={{ background: "#111", color: "#ddd", border: "1px solid #333", borderRadius: "10px", padding: "6px 10px", fontSize: "12px", outline: "none", cursor: "pointer" }}
                      >
                        <option value="VIEWER">Make Viewer</option>
                        <option value="CONTRIBUTOR">Make Contributor</option>
                        <option value="ADMIN">Make Admin</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
