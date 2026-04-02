import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  mutual_friends?: number;
};

export default function UserCard({ user, index = 0 }: { user: User; index?: number }) {
  const router = useRouter();
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API}/friends/status/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'request_sent') setFriendStatus('pending');
          else if (data.status === 'friends') setFriendStatus('friends');
        }
      } catch {}
    };
    checkStatus();
  }, [user.id, API]);

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (friendStatus !== 'none' || loading) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/friends/request/${user.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFriendStatus('pending');
      }
    } catch (err) {
      console.error("Add friend error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
  };

  if (isDismissed) return null;

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
          width: 300px;
        }
        .discover-card:hover {
          transform: translateY(-4px);
          border-color: rgba(99,102,241,0.2);
          box-shadow: 0 12px 40px rgba(99,102,241,0.08), 0 4px 12px rgba(0,0,0,0.3);
        }

        @keyframes cardFadeIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .dc-dismiss-btn {
          position: absolute;
          top: 12px; right: 12px;
          background: transparent;
          border: none;
          color: #555;
          cursor: pointer;
          transition: color 0.2s;
          padding: 4px;
          z-index: 5;
        }
        .dc-dismiss-btn:hover { color: #fff; }

        .dc-header {
            display: flex; gap: 14px; align-items: center; text-decoration: none; margin-bottom: 12px;
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
          display: inline-block; padding: 4px 12px; border-radius: 999px;
          font-size: 11px; font-weight: 600; margin: 0 5px 5px 0;
        }
        .dc-tag-interest { background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.15); }
        .dc-tag-vibe { background: rgba(168,85,247,0.1); color: #c084fc; border: 1px solid rgba(168,85,247,0.15); }

        .dc-mutual-badge {
          position: absolute; top: 0; right: 0; 
          background: rgba(99, 102, 241, 0.15); color: #a5b4fc; 
          font-size: 10px; font-weight: 700; padding: 4px 8px; 
          border-radius: 0 0 0 12px; border-left: 1px solid rgba(99,102,241,0.2); border-bottom: 1px solid rgba(99,102,241,0.2);
        }

        .dc-action-btn {
          display: block; width: 100%; text-align: center; margin-top: 16px; padding: 10px 0;
          border-radius: 10px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); color: #ccc;
          font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
        }
        .dc-action-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.3); color: #a5b4fc;
        }
        .dc-btn-pending { color: #666; cursor: default; }
        .dc-btn-friends { color: #10b981; border-color: rgba(16,185,129,0.3); cursor: default; }
      `}</style>

      <div className="discover-card" style={{ animationDelay: `${index * 0.06}s` }}>
        {/* Dismiss Button */}
        <button className="dc-dismiss-btn" onClick={handleDismiss} title="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Mutual Friends Badge (Moved back to top right) */}
        {user.mutual_friends && user.mutual_friends > 0 && (
          <div className="dc-mutual-badge">
            ✨ {user.mutual_friends} {user.mutual_friends === 1 ? 'Mutual' : 'Mutuals'}
          </div>
        )}

        <Link href={`/profile/${user.username}`} className="dc-header">
          <img src={avatarUrl} alt={user.name} className="dc-avatar" />
          <div>
            <p className="dc-name">{user.name}</p>
            <p className="dc-username">@{user.username}</p>
            <p className="dc-college">
              {user.college}{user.year ? ` '${user.year.toString().slice(-2)}` : ""}
            </p>
          </div>
        </Link>

        {/* Bio */}
        {user.bio && <p className="dc-bio">{user.bio}</p>}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            {user.interests.slice(0, 4).map((item, i) => (
              <span key={i} className="dc-tag dc-tag-interest">{item}</span>
            ))}
          </div>
        )}

        {/* Vibe Tags */}
        {user.vibe_tags && user.vibe_tags.length > 0 && (
          <div style={{ marginTop: "4px" }}>
            {user.vibe_tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="dc-tag dc-tag-vibe">{tag}</span>
            ))}
          </div>
        )}

        {/* Action Button */}
        {friendStatus === 'none' ? (
          <button className="dc-action-btn" onClick={handleAddFriend} disabled={loading}>
            {loading ? '...' : '+ Add Friend'}
          </button>
        ) : friendStatus === 'pending' ? (
          <button className="dc-action-btn dc-btn-pending" disabled>
            Request Sent
          </button>
        ) : (
          <button className="dc-action-btn dc-btn-friends" disabled>
            Friends
          </button>
        )}
      </div>
    </>
  );
}
