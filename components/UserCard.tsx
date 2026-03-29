"use client";

import Link from "next/link";

type User = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  college: string;
  year?: string;
  interests?: string[];
  vibe_tags?: string[];
  current_status?: string;
  status_updated_at?: string;
  friends_if?: string;
  profile_pic?: string;
};

export default function UserCard({ user, index = 0 }: { user: User; index?: number }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const avatarUrl = user.profile_pic
    ? user.profile_pic.startsWith("/uploads")
      ? `${API}${user.profile_pic}`
      : user.profile_pic
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D1117&color=fff&size=200`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .discover-card {
          font-family: 'DM Sans', sans-serif;
          background: linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          animation: cardFadeIn 0.5s ease forwards;
          opacity: 0;
          transform: translateY(16px);
        }
        .discover-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(168,85,247,0.5), transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .discover-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.2);
          box-shadow: 0 12px 40px rgba(99,102,241,0.08), 0 4px 12px rgba(0,0,0,0.3);
        }
        .discover-card:hover::before { opacity: 1; }

        @keyframes cardFadeIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .dc-avatar {
          width: 56px; height: 56px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }

        .dc-name { font-size: 17px; font-weight: 700; color: #f0f0f0; margin: 0; }
        .dc-username { font-size: 13px; color: #666; margin-top: 1px; }
        .dc-college { font-size: 12px; color: #3b82f6; margin-top: 2px; font-weight: 500; }
        .dc-bio { font-size: 13px; color: #888; margin-top: 10px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

        .dc-tag {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          margin: 0 5px 5px 0;
          letter-spacing: 0.01em;
        }
        .dc-tag-interest { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.15); }
        .dc-tag-vibe { background: rgba(168,85,247,0.1); color: #c084fc; border: 1px solid rgba(168,85,247,0.15); }

        .dc-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(34,197,94,0.08);
          border: 1px solid rgba(34,197,94,0.15);
          padding: 5px 12px;
          border-radius: 8px;
          color: #4ade80;
          font-size: 12px;
          font-weight: 500;
          margin-top: 12px;
        }
        .dc-status-dot {
          width: 6px; height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        .dc-view-btn {
          display: block;
          text-align: center;
          margin-top: 16px;
          padding: 10px 0;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #ccc;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .dc-view-btn:hover {
          background: rgba(99,102,241,0.12);
          border-color: rgba(99,102,241,0.3);
          color: #a5b4fc;
        }
      `}</style>

      <div className="discover-card" style={{ animationDelay: `${index * 0.06}s` }}>
        {/* Header */}
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <img src={avatarUrl} alt={user.name} className="dc-avatar" />
          <div>
            <p className="dc-name">{user.name}</p>
            <p className="dc-username">@{user.username}</p>
            <p className="dc-college">
              {user.college}{user.year ? ` '${user.year.toString().slice(-2)}` : ""}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && <p className="dc-bio">{user.bio}</p>}

        {/* Current Status */}
        {user.current_status && (
          <div className="dc-status">
            <div className="dc-status-dot" />
            {user.current_status}
          </div>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            {user.interests.slice(0, 4).map((item, i) => (
              <span key={i} className="dc-tag dc-tag-interest">{item}</span>
            ))}
            {user.interests.length > 4 && (
              <span className="dc-tag dc-tag-interest">+{user.interests.length - 4}</span>
            )}
          </div>
        )}

        {/* Vibe Tags */}
        {user.vibe_tags && user.vibe_tags.length > 0 && (
          <div style={{ marginTop: user.interests?.length ? "4px" : "14px" }}>
            {user.vibe_tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="dc-tag dc-tag-vibe">{tag}</span>
            ))}
            {user.vibe_tags.length > 3 && (
              <span className="dc-tag dc-tag-vibe">+{user.vibe_tags.length - 3}</span>
            )}
          </div>
        )}

        {/* View Profile */}
        <Link href={`/profile/${user.username}`} className="dc-view-btn">
          View Profile →
        </Link>
      </div>
    </>
  );
}
