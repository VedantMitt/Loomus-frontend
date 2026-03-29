"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  online: boolean;
};

export default function FriendCard({ friend, onRemove }: { friend: Friend, onRemove?: () => void }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const avatarUrl = friend.profile_pic
    ? friend.profile_pic.startsWith("/uploads")
      ? `${API}${friend.profile_pic}`
      : friend.profile_pic
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=0D1117&color=fff&size=200`;

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

  const router = useRouter();
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
  };

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

        .fc-btn-chat {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .fc-btn-chat:hover {
          background: rgba(59, 130, 246, 0.25);
        }

        .fc-btn-icon {
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .fc-btn-music {
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }
        .fc-btn-music:hover {
          background: rgba(168, 85, 247, 0.25);
        }

        .fc-btn-watch {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .fc-btn-watch:hover {
          background: rgba(239, 68, 68, 0.25);
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
        
        @media (max-width: 640px) {
          .fc-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .fc-actions {
            width: 100%;
          }
          .fc-btn-chat {
            flex: 1;
            text-align: center;
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
          </div>
        </div>

        {/* Right: Actions */}
        <div className="fc-actions">
          <button
            className="fc-btn fc-btn-chat"
            onClick={handleChat}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}
            aria-label="Direct Message"
            title="Direct Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
          <button
            className="fc-btn fc-btn-icon fc-btn-music"
            onClick={() => alert(`Invite ${friend.name} to Music Room`)}
            title="Music Room"
          >
            🎧
          </button>
          <button
            className="fc-btn fc-btn-icon fc-btn-watch"
            onClick={() => alert(`Invite ${friend.name} to Watch Party`)}
            title="Watch Party"
          >
            🎬
          </button>
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
