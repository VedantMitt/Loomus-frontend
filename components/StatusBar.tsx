"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Friend = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  online: boolean;
  current_status?: string;
  status_updated_at?: string;
};

type StatusBarProps = {
  friends: Friend[];
  onStatusUpdate: (newStatus: string) => void;
  currentUser: any;
};

export default function StatusBar({ friends, onStatusUpdate, currentUser }: StatusBarProps) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  
  // Reply states
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [sendingReply, setSendingReply] = useState(false);

  const parseTimestamp = (ts: string) => {
    // If the timestamp doesn't have a timezone, assume it's UTC
    // Many DB drivers return local-looking strings for UTC timestamps
    if (!ts) return new Date();
    const hasZone = ts.includes('Z') || ts.includes('+') || (ts.split(' ').length > 1 && ts.includes(':') && ts.match(/[-+]\d{2}(:?\d{2})?$/));
    return new Date(hasZone ? ts : ts.replace(' ', 'T') + 'Z');
  };

  // Filter friends with active statuses (updated in last 24h)
  const activeFriends = friends.filter(f => {
    if (!f.current_status || !f.status_updated_at) return false;
    const updatedAt = parseTimestamp(f.status_updated_at).getTime();
    const now = new Date().getTime();
    return (now - updatedAt) < (24 * 60 * 60 * 1000);
  });

  const getTimeLeft = (updatedAt: string) => {
    const expiresAt = parseTimestamp(updatedAt).getTime() + (24 * 60 * 60 * 1000);
    const now = new Date().getTime();
    const diff = expiresAt - now;
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h left` : `${mins}m left`;
  };

  const handleUpdate = async () => {
    if (!newStatus.trim()) return;
    if (!currentUser || !currentUser.id) {
      alert("User data missing. Please try logging in again.");
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired. Please login again.");
        return;
      }

      console.log("Updating status for user:", currentUser.id);
      const res = await fetch(`${API}/users/${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current_status: newStatus })
      });

      if (res.ok) {
        onStatusUpdate(newStatus);
        setShowUpdateModal(false);
        setNewStatus("");
        // Alert user
        const event = new CustomEvent("status-updated", { detail: newStatus });
        window.dispatchEvent(event);
      } else {
        const errData = await res.json();
        alert(`Failed to update status: ${errData.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Network error. Please check your connection.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedFriend) return;
    setSendingReply(true);
    try {
      const token = localStorage.getItem("token");
      
      // 1. Initiate/Get conversation
      const initRes = await fetch(`${API}/chat/initiate/${selectedFriend.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!initRes.ok) throw new Error("Failed to initiate chat");
      const { conversation_id } = await initRes.json();

      // 2. Send message
      const msgContent = `💬 Replied to status: "${selectedFriend.current_status}"\n\n${replyText}`;
      const msgRes = await fetch(`${API}/chat/${conversation_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: msgContent })
      });

      if (msgRes.ok) {
        setShowReplyModal(false);
        setReplyText("");
        alert(`Reply sent to ${selectedFriend.name}!`);
      } else {
        alert("Failed to send reply.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const getAvatar = (user: any) => {
    if (!user) return `https://ui-avatars.com/api/?name=User&background=0D1117&color=fff&size=200`;
    if (user.profile_pic) {
      return user.profile_pic.startsWith("/uploads") ? `${API}${user.profile_pic}` : user.profile_pic;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=0D1117&color=fff&size=200`;
  };

  const isMeActive = currentUser?.current_status && currentUser?.status_updated_at && (
    (new Date().getTime() - parseTimestamp(currentUser.status_updated_at).getTime()) < (24 * 60 * 60 * 1000)
  );

  return (
    <>
      <style jsx>{`
        .sb-container {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          overflow-y: visible; /* Important for bubble */
          padding: 80px 10px 24px;
          margin-bottom: 20px;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }
        .sb-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .sb-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 80px;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sb-item:hover { transform: scale(1.05); }

        .sb-avatar-wrap {
          position: relative;
          width: 68px;
          height: 68px;
          border-radius: 24px;
          padding: 3px;
          background: rgba(255, 255, 255, 0.1);
        }
        .sb-avatar-wrap.active {
          background: linear-gradient(135deg, #34d399 0%, #0ea5e9 100%);
          box-shadow: 0 0 15px rgba(52, 211, 153, 0.3);
        }

        .sb-avatar {
          width: 100%;
          height: 100%;
          border-radius: 21px;
          object-fit: cover;
          border: 3px solid #000;
        }

        .sb-name {
          font-size: 12px;
          font-weight: 700;
          color: #888;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        .sb-item:hover .sb-name { color: #eee; }

        .sb-status-bubble {
          position: absolute;
          top: -48px;
          left: 50%;
          transform: translateX(-50%) translateY(-5px) scale(1);
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.95), rgba(16, 185, 129, 0.95));
          backdrop-filter: blur(12px);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          opacity: 1;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 100;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
        }

        .sb-reply-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.8;
          margin-top: 6px;
          color: #fff;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 5px;
          font-weight: 700;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: #111;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 30px;
          padding: 40px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .status-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px;
          color: #fff;
          font-size: 16px;
          font-family: inherit;
          margin-bottom: 24px;
          transition: border-color 0.2s;
        }
        .status-input:focus {
          outline: none;
          border-color: #34d399;
          background: rgba(255, 255, 255, 0.08);
        }

        .modal-btn {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        .btn-update {
          background: linear-gradient(135deg, #34d399 0%, #0ea5e9 100%);
          color: #fff;
        }
        .btn-cancel {
          background: transparent;
          color: #666;
          margin-top: 12px;
        }
      `}</style>

      <div className="sb-container">
        {/* Current User Item */}
        <div className="sb-item" onClick={() => setShowUpdateModal(true)}>
          <div className={`sb-avatar-wrap ${isMeActive ? 'active' : ''}`}>
            <img src={getAvatar(currentUser)} className="sb-avatar" alt="Me" />
            <div style={{ position: "absolute", bottom: -4, right: -4, background: "#34d399", width: 22, height: 22, borderRadius: "50%", border: "3px solid #000", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#000" }}>+</div>
          </div>
          <span className="sb-name">My Status</span>
          {isMeActive && (
            <div className="sb-status-bubble">
              <span style={{ opacity: 0.7, fontSize: 9, marginRight: 6 }}>{getTimeLeft(currentUser.status_updated_at)}</span>
              {currentUser.current_status}
            </div>
          )}
        </div>

        {/* Active Friends */}
        {activeFriends.map(friend => (
          <div key={friend.id} className="sb-item" onClick={() => { setSelectedFriend(friend); setShowReplyModal(true); }}>
            <div className="sb-avatar-wrap active" onClick={(e) => { e.stopPropagation(); }}>
              <Link href={`/profile/${friend.username}`} style={{ textDecoration: "none" }}>
                <img src={getAvatar(friend)} className="sb-avatar" alt={friend.name} />
              </Link>
            </div>
            <span className="sb-name">{friend.name.split(' ')[0]}</span>
            <div className="sb-status-bubble">
              {friend.current_status}
              <span className="sb-reply-hint">Click to reply 💬</span>
            </div>
          </div>
        ))}

        {activeFriends.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 13, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 20 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
            No active vibes in your circle...
          </div>
        )}
      </div>

      {showUpdateModal && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#fff", marginBottom: 8, fontSize: 28, fontWeight: 800 }}>What's the vibe?</h2>
            <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>Share a temporary status with your friends for the next 24h.</p>
            
            <input 
              type="text" 
              className="status-input" 
              placeholder="Doing homework... / Gaming! 🎮"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              maxLength={60}
              autoFocus
            />

            <button className="modal-btn btn-update" onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating..." : "Update Status"}
            </button>
            <button className="modal-btn btn-cancel" onClick={() => setShowUpdateModal(false)}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedFriend && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ borderTop: '4px solid #34d399' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img src={getAvatar(selectedFriend)} style={{ width: 44, height: 44, borderRadius: '14px', border: '2px solid #000' }} alt="" />
              <div>
                <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Reply to {selectedFriend.name.split(' ')[0]}</h3>
                <p style={{ color: "#34d399", fontSize: 13, fontStyle: 'italic', marginTop: 2 }}>"{selectedFriend.current_status}"</p>
              </div>
            </div>
            
            <textarea 
              className="status-input" 
              placeholder={`Send a message to ${selectedFriend.name.split(' ')[0]}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={3}
              style={{ resize: 'none', minHeight: 100 }}
              autoFocus
            />

            <button className="modal-btn btn-update" onClick={handleSendReply} disabled={sendingReply}>
              {sendingReply ? "Sending..." : "Send Reply 🚀"}
            </button>
            <button className="modal-btn btn-cancel" onClick={() => setShowReplyModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
