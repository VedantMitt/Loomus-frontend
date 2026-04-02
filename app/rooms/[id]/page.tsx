"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/context/RoomContext";
import ReactPlayer from "react-player";
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
    };
  }, [socket, currentUser, router, setPlaying]);

  // 4. Respond to Global Sync Time
  useEffect(() => {
    if (syncTime !== null && playerRef.current) {
      // Small buffer to avoid constant seeking
      if (Math.abs(lastPlayed.current - syncTime) > 2) {
         isSeeking.current = true;
         // ReactPlayer seekTo uses seconds
         if (playerRef.current.seekTo) {
           playerRef.current.seekTo(syncTime);
         } else if (playerRef.current.currentTime !== undefined) {
           playerRef.current.currentTime = syncTime;
         }
         setTimeout(() => { 
           isSeeking.current = false; 
           lastPlayed.current = syncTime;
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
    socket.emit("sync_seek", { roomId: room.id, currentTime: seconds });
  };

  const handleTimeUpdate = (e: any) => {
    const time = e?.target?.currentTime ?? 0;
    if (isSeeking.current) {
      lastPlayed.current = time;
      return;
    }
    if (Math.abs(time - lastPlayed.current) > 2) {
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        body { margin: 0; padding: 0; background: #0a0a0a; color: #fff; }
        
        .rp-container {
          font-family: 'DM Sans', sans-serif;
          height: calc(100vh - 90px);
          display: flex;
          background: #0a0a0a;
        }

        /* Main View: Media */
        .rp-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.08);
          background: radial-gradient(circle at center, rgba(30,30,40,0.4) 0%, transparent 100%);
        }

        .rp-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rp-back {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .rp-back:hover { background: rgba(255,255,255,0.1); }

        .rp-title { margin: 0; font-size: 20px; font-weight: 700; color: #fff; }

        .rp-media-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }

        .media-placeholder {
          width: 100%; maxWidth: 800px; aspect-ratio: 16/9;
          background: rgba(0,0,0,0.5);
          border-radius: 24px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          color: #555; border: 1px solid rgba(255,255,255,0.05);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        /* Sidebar: Social */
        .rp-sidebar {
          width: 360px;
          display: flex;
          flex-direction: column;
          background: rgba(15,15,15,0.8);
        }

        .rp-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .rp-tab {
          flex: 1;
          padding: 16px;
          text-align: center;
          color: #888;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
        }
        .rp-tab.active { color: #fff; border-bottom-color: #3b82f6; }

        .rp-chat-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        
        .rp-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-row { display: flex; gap: 12px; }
        .chat-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: #222; border: 1px solid rgba(255,255,255,0.1); }
        .chat-content { background: rgba(255,255,255,0.03); padding: 10px 14px; border-radius: 0 16px 16px 16px; font-size: 14px; color: #eee; line-height: 1.4; border: 1px solid rgba(255,255,255,0.05); }
        .chat-sender { font-size: 12px; font-weight: 600; color: #888; margin-bottom: 4px; }

        .rp-chat-input {
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .rp-input-wrapper { display: flex; gap: 8px; }
        .rp-input {
          flex: 1; padding: 12px 16px; border-radius: 99px; background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1); color: #fff; outline: none; font-size: 14px; font-family: inherit;
        }
        .rp-send { background: #3b82f6; color: #fff; border:none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .rp-send:hover { background: #2563eb; transform: scale(1.05); }

        .finish-btn:hover { background: rgba(16,185,129,0.2) !important; transform: translateY(-1px); }
        .finish-btn:active { transform: translateY(0); }
      `}</style>

      <div className="rp-container">
        {/* Main Media Panel */}
        <div className="rp-main">
          <header className="rp-header">
            <Link href="/rooms" className="rp-back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </Link>
            <div>
              <h1 className="rp-title">{room.name}</h1>
              <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: isVideo ? "#ef4444" : "#10b981", fontWeight: 600 }}>{isVideo ? 'WATCH PARTY' : 'LISTEN TOGETHER'}</span>
                • {participants.size + 1} {participants.size + 1 === 1 ? 'person' : 'people'} listening
                {room.total_approved && room.total_approved > 0 && (
                  <> • <span style={{ color: "#3b82f6", fontWeight: 600 }}>{room.done_count}/{room.total_approved} finished</span></>
                )}
              </div>
            </div>
            
            <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
              <button
                onClick={handleExitRoom}
                className="finish-btn"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                Leave Party
              </button>

              {room.host_id === currentUser?.id && (
                <button
                  onClick={deleteRoom}
                  title="Delete Room"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              )}
            </div>
          </header>

          <div className="rp-media-area">
            {room.media_url ? (
              isVideo ? (
                <div style={{ width: "100%", maxWidth: "900px", aspectRatio: "16/9", borderRadius: "16px", overflow: "hidden", background: "#000", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {isClient && (
                    <ReactPlayer
                      ref={playerRef}
                      src={room.media_url}
                      width="100%"
                      height="100%"
                      playing={playing}
                      controls={canManage}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onTimeUpdate={handleTimeUpdate}
                    />
                  )}
                </div>
              ) : (
                <div style={{ width: "100%", maxWidth: "600px", background: "rgba(0,0,0,0.4)", padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
                  <iframe
                    src={getSpotifyEmbedUrl(room.media_url)}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ borderRadius: "12px" }}
                  ></iframe>
                </div>
              )
            ) : (
              <div className="media-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "16px" }}>
                  {isVideo
                    ? <><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></>
                    : <><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></>}
                </svg>
                <h3 style={{ margin: "0 0 8px 0" }}>Waiting for media...</h3>
                {canManage ? (
                  <div style={{ width: "100%", maxWidth: "320px", marginTop: "16px" }}>
                    <input
                      type="text"
                      className="rp-input"
                      placeholder="Paste media URL and press Enter"
                      style={{ width: "100%" }}
                      onKeyDown={async (e) => {
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
                ) : (
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Only admins can select media.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="rp-sidebar">
          <div className="rp-tabs">
            <div className={`rp-tab ${activeTab === 'CHAT' ? 'active' : ''}`} onClick={() => setActiveTab('CHAT')}>Room Chat</div>
            <div className={`rp-tab ${activeTab === 'QUEUE' ? 'active' : ''}`} onClick={() => setActiveTab('QUEUE')}>Queue ({room.queue?.length || 0})</div>
            <div className={`rp-tab ${activeTab === 'PEOPLE' ? 'active' : ''}`} onClick={() => setActiveTab('PEOPLE')}>People ({participants.size + 1})</div>
          </div>

          <div className="rp-chat-area">
            {activeTab === 'CHAT' && (
              <>
                <div className="rp-messages">
                  <div style={{ textAlign: "center", color: "#666", fontSize: "12px", margin: "10px 0 20px" }}>
                    You joined {room.name}
                  </div>

                  {chatMessages.map(msg => {
                    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                    const avatar = msg.sender_pic
                      ? msg.sender_pic.startsWith("/uploads") ? `${API}${msg.sender_pic}` : msg.sender_pic
                      : `https://ui-avatars.com/api/?name=${msg.sender_name}&background=0D1117&color=fff`;

                    return (
                      <div key={msg.id} className="chat-row">
                        <img src={avatar} className="chat-avatar" alt="" />
                        <div>
                          <div className="chat-sender">{msg.sender_name}</div>
                          <div className="chat-content">{msg.content}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                <form className="rp-chat-input" onSubmit={sendRoomMessage}>
                  <div className="rp-input-wrapper">
                    <input
                      type="text"
                      className="rp-input"
                      placeholder="Say something..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="rp-send" disabled={!chatInput.trim()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'QUEUE' && (
              <>
                <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {(room.queue || []).map((q: any) => (
                    <div key={q.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "13px", color: "#eee", marginBottom: "8px", wordBreak: "break-all" }}>
                        {q.title}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#777" }}>Added by {q.addedBy}</span>
                        {canManage && (
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={() => playQueueItem(q)} style={{ background: "#10b981", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>Play</button>
                            <button onClick={() => removeQueueItem(q.id)} style={{ background: "none", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" }}>Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!room.queue || room.queue.length === 0) && (
                    <div style={{ textAlign: "center", color: "#666", marginTop: "32px", fontSize: "13px" }}>
                      The queue is empty.
                    </div>
                  )}
                </div>

                {canAdd && (
                  <form className="rp-chat-input" onSubmit={handleQueueAdd}>
                    <div className="rp-input-wrapper">
                      <input
                        type="text"
                        className="rp-input"
                        placeholder="Paste media URL to add to queue..."
                        value={queueInput}
                        onChange={e => setQueueInput(e.target.value)}
                      />
                      <button type="submit" className="rp-send" disabled={!queueInput.trim()} style={{ background: "#10b981" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'PEOPLE' && (
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Room Members</div>

                {/* Host / Self */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={currentUser?.profile_pic?.startsWith("/uploads") ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${currentUser.profile_pic}` : currentUser?.profile_pic || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=0D1117&color=fff`} style={{ width: 36, height: 36, borderRadius: "50%" }} alt="" />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{currentUser?.name} (You)</div>
                      <div style={{ fontSize: "12px", color: room.host_id === currentUser?.id ? "#f59e0b" : "#3b82f6" }}>{room.host_id === currentUser?.id ? "Host - Admin" : myRole === 'ADMIN' ? 'Admin' : myRole === 'CONTRIBUTOR' ? 'Contributor' : 'Viewer'}</div>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                {Array.from(participants.values()).map(p => {
                  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                  const avatar = p.profile_pic ? (p.profile_pic.startsWith("/uploads") ? `${API}${p.profile_pic}` : p.profile_pic) : `https://ui-avatars.com/api/?name=${p.name}&background=0D1117&color=fff`;
                  const pRole = room.host_id === p.id ? "ADMIN" : (room.roles || {})[p.id] || "VIEWER";

                  return (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img src={avatar} style={{ width: 36, height: 36, borderRadius: "50%" }} alt="" />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{p.name}</div>
                          <div style={{ fontSize: "12px", color: pRole === 'ADMIN' ? "#f59e0b" : pRole === 'CONTRIBUTOR' ? "#10b981" : "#888" }}>{room.host_id === p.id ? "Host - Admin" : pRole === 'ADMIN' ? 'Admin' : pRole === 'CONTRIBUTOR' ? 'Contributor' : 'Viewer'}</div>
                        </div>
                      </div>

                      {/* Role Selector */}
                      {room.host_id === currentUser?.id && room.host_id !== p.id && (
                        <select
                          value={pRole}
                          onChange={(e) => handleRoleChange(p.id, e.target.value)}
                          style={{ background: "#111", color: "#ddd", border: "1px solid #333", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", outline: "none", cursor: "pointer" }}
                        >
                          <option value="VIEWER">Viewer</option>
                          <option value="CONTRIBUTOR">Contributor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </div>
                  );
                })}
                {participants.size === 0 && <div style={{ fontSize: "13px", color: "#666", textAlign: "center", marginTop: "16px" }}>No other people in room</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
