"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

 type Friend = {
   id: string;
   name: string;
   username: string;
   profile_pic?: string;
   online: boolean;
   current_status?: string;
   status_updated_at?: string;
   active_rooms?: { id: string, name: string }[];
   active_pools?: { id: string, title: string }[];
   active_gtl?: { id: string, title: string }[];
   active_activities?: { id: string, title: string }[];
   shared_chapters?: { id: string, title: string }[];
 };

export default function FriendCard({ friend, onRemove }: { friend: Friend, onRemove?: () => void }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const avatarUrl = friend.profile_pic
    ? friend.profile_pic.startsWith("/uploads")
      ? `${API}${friend.profile_pic}`
      : friend.profile_pic
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=0D1117&color=fff&size=200`;

  const router = useRouter();

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${friend.name} from your friends?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/friends/remove/${friend.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok && onRemove) {
        onRemove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/chat/initiate/${friend.id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat?conversation=${data.conversation_id}`);
      }
    } catch (err) {
      console.error(err);
    }
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .fc-card {
          font-family: 'DM Sans', sans-serif;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s ease;
        }

        .fc-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .fc-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .fc-avatar-container {
          position: relative;
        }

        .fc-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .fc-status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #0f0f0f;
        }
        .fc-status-online {
          background: #4ade80;
          box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
        }
        .fc-status-offline {
          background: #6b7280;
        }

        .fc-name {
          font-size: 16px;
          font-weight: 600;
          color: #eee;
          text-decoration: none;
          display: block;
        }
        .fc-name:hover {
          color: #fff;
        }

        .fc-username {
          font-size: 13px;
          color: #888;
          margin-top: 2px;
        }

        .fc-actions {
          display: flex;
          gap: 8px;
        }

        .fc-btn {
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fc-btn-icon {
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
        }

        .fc-btn-chat {
          background: rgba(255,255,255,0.05);
          color: #60a5fa;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .fc-btn-chat:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .fc-btn-party {
          background: rgba(168, 85, 247, 0.12);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }
        .fc-btn-party:hover {
          background: rgba(168, 85, 247, 0.22);
          border-color: rgba(168, 85, 247, 0.35);
        }

        .fc-btn-play {
          background: rgba(245, 158, 11, 0.12);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .fc-btn-play:hover {
          background: rgba(245, 158, 11, 0.22);
          border-color: rgba(245, 158, 11, 0.35);
        }

        .fc-btn-remove {
          background: rgba(107, 114, 128, 0.1);
          color: #9ca3af;
          border: 1px solid rgba(107, 114, 128, 0.2);
        }
        .fc-btn-remove:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* Dropdown Menus */
        .fc-dropdown-wrap {
          position: relative;
        }

        .fc-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 220px;
          background: rgba(20, 20, 22, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 8px;
          z-index: 100;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          animation: fcDropIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes fcDropIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .fc-dropdown-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #666;
          padding: 8px 12px 6px;
        }

        .fc-dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
          color: #ddd;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.15s ease;
        }

        .fc-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
        }

        .fc-dropdown-item:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .fc-dropdown-item:disabled:hover {
          background: transparent;
          color: #ddd;
        }

        .fc-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          font-size: 18px;
          flex-shrink: 0;
        }

        .fc-item-icon-party-music { background: rgba(168, 85, 247, 0.15); }
        .fc-item-icon-party-video { background: rgba(239, 68, 68, 0.15); }
        .fc-item-icon-game-roulette { background: rgba(245, 158, 11, 0.15); }
        .fc-item-icon-game-crush { background: rgba(236, 72, 153, 0.15); }
        .fc-item-icon-game-gtl { background: rgba(6, 182, 212, 0.15); }

        .fc-item-label { font-weight: 600; font-size: 13px; }
        .fc-item-desc { font-size: 11px; color: #888; margin-top: 1px; }

        @media (max-width: 640px) {
          .fc-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .fc-actions {
            width: 100%;
          }
          .fc-btn-icon, .fc-btn-chat {
            flex: 1;
            text-align: center;
          }
          .fc-dropdown {
            right: auto;
            left: 0;
            min-width: 200px;
          }
        }
      `}</style>

      <div className="fc-card">
        {/* Left: Avatar & Info */}
        <div className="fc-left">
          <Link href={`/profile/${friend.username}`} className="fc-avatar-container">
            <img src={avatarUrl} alt={friend.name} className="fc-avatar" />
            <div className={`fc-status-dot ${friend.online ? 'fc-status-online' : 'fc-status-offline'}`} />
          </Link>
          <div>
            <Link href={`/profile/${friend.username}`} className="fc-name">
              {friend.name}
            </Link>
            <div className="fc-username">@{friend.username}</div>
             {friend.current_status && friend.status_updated_at && (new Date().getTime() - new Date(friend.status_updated_at).getTime()) < (24 * 60 * 60 * 1000) && (
               <div style={{ marginTop: 8, fontSize: 13, color: '#34d399', fontWeight: 600, fontStyle: 'italic', background: 'rgba(52, 211, 153, 0.08)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.15)', display: 'inline-block', marginRight: 8 }}>
                 "{friend.current_status}"
               </div>
             )}
 
             {/* Live Activity Chips */}
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
               {friend.active_activities?.map(a => (
                 <Link key={a.id} href={`/activities/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '4px 10px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', fontSize: '11px', fontWeight: 700, color: '#60a5fa', transition: 'all 0.2s' }}>
                   <span>🏮</span> Activity: {a.title}
                 </Link>
               ))}
             </div>

             {/* Shared Chapters */}
             {friend.shared_chapters && friend.shared_chapters.length > 0 && (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                 <div style={{ fontSize: '11px', color: '#888', fontWeight: 600, width: '100%', marginBottom: '2px' }}>SHARED CHAPTERS</div>
                 {friend.shared_chapters.map(c => (
                   <Link key={c.id} href={`/activities/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '4px 10px', background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.1), rgba(192, 132, 252, 0.1))', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#e879f9', transition: 'all 0.2s' }}>
                     <span>📖</span> {c.title}
                   </Link>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="fc-actions">
          {/* DM Button */}
          <button
            className="fc-btn fc-btn-icon fc-btn-chat"
            onClick={handleChat}
            aria-label="Direct Message"
            title="Direct Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>



          {/* Remove */}
          <button
            className="fc-btn fc-btn-icon fc-btn-remove"
            onClick={handleRemove}
            title="Remove Friend"
          >
            🗑
          </button>
        </div>
      </div>
    </>
  );
}
