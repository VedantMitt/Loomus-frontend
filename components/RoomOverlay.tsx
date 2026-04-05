"use client";

import { useRoom } from "@/context/RoomContext";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic<any>(() => import("react-player"), { ssr: false });

export default function RoomOverlay() {
    const { activeRoom, leaveRoom, isMinimized, setIsMinimized, refreshActiveRoom, playing, setPlaying, syncTime } = useRoom();
    const playerRef = useRef<any>(null);
    const [show, setShow] = useState(false);
    const [canAutoplay, setCanAutoplay] = useState(false);
    const pathname = usePathname();
    const isMusic = activeRoom?.media_url?.includes('spotify.com');
    const isVideo = !isMusic && !!activeRoom?.media_url;

    // Sync state with activeRoom
    useEffect(() => {
        if (activeRoom) {
            setShow(true);
            // Delay autoplay to avoid AbortError when navigating
            const timer = setTimeout(() => setCanAutoplay(true), 500);

            const interval = setInterval(refreshActiveRoom, 10000);
            return () => {
                clearInterval(interval);
                clearTimeout(timer);
                setCanAutoplay(false);
            };
        } else {
            setShow(false);
            setCanAutoplay(false);
        }
    }, [activeRoom, refreshActiveRoom]);

    // Handle Global Sync
    useEffect(() => {
        if (syncTime !== null && playerRef.current) {
            if (playerRef.current.seekTo) {
                playerRef.current.seekTo(syncTime);
            }
        }
    }, [syncTime]);

    if (!show || !activeRoom || isMinimized || pathname?.startsWith(`/rooms/${activeRoom.id}`)) {
        // If minimized, we could show a tiny bubble? 
        // User said "show on other tabs with cross and expand", implying a small bar/box.
        if (isMinimized && activeRoom) {
            return (
                <div
                    onClick={() => setIsMinimized(false)}
                    style={{
                        position: "fixed",
                        bottom: "80px",
                        right: "24px",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                        zIndex: 9991,
                        animation: "pulse 2s infinite"
                    }}
                >
                    <span style={{ fontSize: "20px" }}>{activeRoom.type === "MUSIC" ? "🎵" : "📺"}</span>
                    <style>{`
             @keyframes pulse {
               0% { transform: scale(1); }
               50% { transform: scale(1.1); }
               100% { transform: scale(1); }
             }
           `}</style>
                </div>
            );
        }
        return null;
    }

    return (
        <div className="room-overlay">
            <style>{`
        .room-overlay {
          position: fixed;
          bottom: 80px;
          right: 24px;
          width: 300px;
          background: rgba(13, 13, 17, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          z-index: 9990;
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .overlay-header {
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .host-link {
          font-size: 11px;
          font-weight: 700;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .action-icon {
          color: #666;
          cursor: pointer;
          transition: color 0.2s;
          display: flex;
        }
        .action-icon:hover { color: #fff; }

        .overlay-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .room-title {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .room-meta {
          font-size: 12px;
          color: #888;
        }

        .overlay-footer {
          padding: 12px 16px 16px;
        }

        .leave-btn {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .leave-btn:hover {
          background: #ef4444;
          color: #fff;
        }
        .mini-player-container {
          width: 100%;
          aspect-ratio: 16/9;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
          background: #000;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .spotify-mini {
          width: 100%;
          height: 80px;
          border-radius: 12px;
          margin-bottom: 12px;
        }
      `}</style>

            <div className="overlay-header">
                <div className="host-link">Active Party</div>
                <div className="header-actions">
                    <Link href={`/rooms/${activeRoom.id}`} className="action-icon" title="Expand to Full Room">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                    </Link>
                    <div className="action-icon" onClick={() => setIsMinimized(true)} title="Minimize">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </div>
            </div>

            <div className="overlay-body">
                {activeRoom.media_url && (
                    <div className={isMusic ? "" : "mini-player-container"}>
                        {isMusic ? (
                            <iframe
                                src={activeRoom.media_url.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/').replace('/album/', '/embed/album/')}
                                className="spotify-mini"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                            />
                        ) : (
                            <ReactPlayer
                                ref={playerRef}
                                url={activeRoom.media_url || ""}
                                width="100%"
                                height="100%"
                                playing={playing && canAutoplay}
                                muted={!canAutoplay}
                                volume={canAutoplay ? 1 : 0}
                                controls={false}
                            />
                        )}
                    </div>
                )}
                <div className="room-title">{activeRoom.name}</div>
                <div className="room-meta">
                    {activeRoom.type === "MUSIC" ? "🎵 Listening together" : "📺 Watching together"}
                    {" • "} with {activeRoom.host_name}
                </div>
            </div>

            <div className="overlay-footer">
                {!playing && activeRoom.media_url && (
                    <button
                        className="leave-btn"
                        style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)", marginBottom: "8px" }}
                        onClick={() => setPlaying(true)}
                    >
                        ▶ Join Playback
                    </button>
                )}
                <button className="leave-btn" onClick={leaveRoom}>
                    Leave Party Session
                </button>
            </div>
        </div>
    );
}