"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { uploadSubmission } from "@/lib/uploadSubmission";
import Link from "next/link";

type Activity = {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  location: string;
  banner?: string;
  host_name: string;
  host_pic?: string;
  host_user_id: string;
  member_count: string;
  going_count: string;
  interested_count: string;
  my_rsvp: string | null;
  has_joined: boolean;
  submission_count: string;
  comment_count: string;
  allow_submissions: boolean;
  format: string;
  social_links?: {name: string, url: string}[];
  is_official?: boolean;
  hosted_by_name?: string;
  college_name?: string;
  society_name?: string;
};

type Submission = {
  id: string;
  content_url: string;
  description?: string;
  name: string;
  profile_pic?: string;
  vote_count: number;
  has_voted?: boolean;
  created_at: string;
  rank?: number;
};

type Comment = {
  id: string;
  content: string;
  name: string;
  username: string;
  profile_pic?: string;
  created_at: string;
};

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  const [activeTab, setActiveTab] = useState<"gallery" | "leaderboard" | "comments" | "polls">("gallery");
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);

  // Polls
  const [polls, setPolls] = useState<any[]>([]);
  const [newPollQ, setNewPollQ] = useState("");
  const [newPollOpts, setNewPollOpts] = useState(["", ""]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [subDesc, setSubDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteeId, setInviteeId] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const myUserId = payload.userId || payload.id;

        // Fetch activity
        const aRes = await fetch(`${API}/activities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!aRes.ok) throw new Error("Activity not found");
        const aData = await aRes.json();
        setActivity(aData);
        setIsHost(aData.host_user_id === myUserId);
        if (aData.format === 'Hangout') setActiveTab('polls');
        else if (aData.format === 'Event' || !aData.allow_submissions) setActiveTab('comments');

        // Fetch submissions
        const sRes = await fetch(`${API}/activities/${id}/submissions`);
        if (sRes.ok) setSubmissions(await sRes.json());
        
        // Fetch comments
        const cRes = await fetch(`${API}/activities/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cRes.ok) setComments(await cRes.json());

        // Fetch analytics if host
        if (aData.host_user_id === myUserId) {
          const anRes = await fetch(`${API}/activities/${id}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (anRes.ok) setAnalytics(await anRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  const fetchLeaderboard = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/activities/${id}/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setSubmissions(await res.json());
  };

  const fetchGallery = async () => {
    const res = await fetch(`${API}/activities/${id}/submissions`);
    if (res.ok) setSubmissions(await res.json());
  };

  const fetchPolls = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/activities/${id}/polls`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setPolls(await res.json());
  };

  useEffect(() => {
    if (activeTab === "leaderboard") fetchLeaderboard();
    else if (activeTab === "gallery") fetchGallery();
    else if (activeTab === "polls") fetchPolls();
  }, [activeTab]);

  const handleRsvp = async (status: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setActivity((prev) => prev ? {
          ...prev,
          my_rsvp: data.my_rsvp,
          going_count: data.going_count,
          interested_count: data.interested_count
        } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
      if (res.ok) {
        const newC = await res.json();
        setComments((prev) => [...prev, newC]);
        setCommentText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  const handleCreatePoll = async () => {
    const validOpts = newPollOpts.filter(o => o.trim() !== "");
    if (!newPollQ.trim() || validOpts.length < 2) return alert("Need a question and at least 2 options");
    
    setCreatingPoll(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: newPollQ, options: validOpts })
      });
      if (res.ok) {
        setNewPollQ("");
        setNewPollOpts(["", ""]);
        fetchPolls();
      } else alert("Failed to create poll");
    } catch(err) { console.error(err); }
    setCreatingPoll(false);
  };

  const handleVotePoll = async (optionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/polls/${optionId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchPolls();
    } catch(err) { console.error(err); }
  };

  const handleSubmit = async () => {
    if (!file) return alert("Select a file to submit");
    setSubmitting(true);
    try {
      const content_url = await uploadSubmission(file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content_url, description: subDesc })
      });
      if (res.ok) {
        const newSub = await res.json();
        setSubmissions((prev) => [{ ...newSub, vote_count: 0 }, ...prev]);
        setFile(null);
        setSubDesc("");
        alert("Submitted successfully!");
      } else {
        const err = await res.json();
        alert(err.error || "Submit failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/submissions/${submissionId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions((prev) =>
          prev.map((sub) =>
            sub.id === submissionId
              ? { ...sub, vote_count: Number(data.voteCount), has_voted: data.voted }
              : sub
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.push("/activities");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete");
    }
  };

  const handleInvite = async () => {
    if (!inviteeId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invitee_id: inviteeId })
      });
      if (res.ok) {
        alert("Friend invited!");
        setShowInviteModal(false);
        setInviteeId("");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to invite");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!activity) return <div className="text-center mt-20 text-white">Activity not found</div>;

  const d = new Date(activity.date);
  const formattedDate = d.toLocaleString("en-US", { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const hostPic = activity.host_pic?.startsWith("/uploads") ? `${API}${activity.host_pic}` : activity.host_pic || `https://ui-avatars.com/api/?name=${activity.host_name}&background=0D1117&color=fff`;

  return (
    <div className="ad-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .ad-page {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          color: #eee;
          padding-bottom: 80px;
        }

        /* Banner Phase */
        .ad-banner-wrap {
          position: relative;
          width: 100%;
          height: 380px;
          background: #111;
        }
        .ad-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.8;
        }
        .ad-banner-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #f472b6 0%, #a78bfa 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 80px;
          opacity: 0.6;
        }
        .ad-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, #09090b 0%, rgba(9, 9, 11, 0.5) 40%, transparent 100%);
        }

        /* Container */
        .ad-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          margin-top: -100px;
        }

        /* Header Info */
        .ad-header-card {
          background: rgba(20, 20, 22, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .ad-header-card {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
        }
        
        .ad-title {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 12px;
          background: linear-gradient(135deg, #fff 0%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .ad-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ad-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.04);
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .ad-host {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ad-host-pic {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .ad-host-info {
          display: flex;
          flex-direction: column;
        }
        .ad-host-label { font-size: 12px; color: rgba(255, 255, 255, 0.4); }
        .ad-host-name { font-size: 14px; font-weight: 600; color: #fff; }

        /* Action Buttons */
        .ad-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 220px;
        }
        .ad-btn {
          width: 100%;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .ad-btn-primary {
          background: linear-gradient(135deg, #ec4899 0%, #a78bfa 100%);
          color: #fff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.3);
        }
        .ad-btn-primary:active { transform: scale(0.98); }
        
        .ad-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .ad-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Stats */
        .ad-stats {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }
        .ad-stat {
          display: flex;
          flex-direction: column;
        }
        .ad-stat-val { font-size: 20px; font-weight: 700; color: #fff; font-family: 'Syne', sans-serif; }
        .ad-stat-label { font-size: 12px; color: rgba(255, 255, 255, 0.5); text-transform: uppercase; letter-spacing: 0.05em; }

        /* Content Grid */
        .ad-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .ad-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        /* Description blocks */
        .ad-block {
          background: rgba(20, 20, 22, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
        }
        .ad-block-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ad-desc-text {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          white-space: pre-wrap;
        }

        /* Tabs */
        .ad-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .ad-tab {
          padding: 12px 20px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .ad-tab:hover { color: rgba(255, 255, 255, 0.8); }
        .ad-tab.active {
          color: #f472b6;
          border-bottom-color: #f472b6;
        }

        /* Submissions Grid */
        .ad-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .ad-sub-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .ad-sub-card:hover { transform: translateY(-4px); }
        .ad-sub-img {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }
        .ad-sub-body { padding: 16px; }
        .ad-sub-author { font-size: 12px; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }
        
        .ad-leaderboard-row {
          display: flex;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-bottom: 12px;
          gap: 16px;
        }
        .ad-rank {
          font-size: 24px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.2);
          width: 40px;
          text-align: center;
          font-family: 'Syne', sans-serif;
        }
        .ad-rank-1 { color: #fbbf24; }
        .ad-rank-2 { color: #94a3b8; }
        .ad-rank-3 { color: #b45309; }

        /* Comments */
        .ad-comment-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;
        }
        .ad-comment {
          display: flex;
          gap: 12px;
        }
        .ad-c-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #333;
        }
        .ad-c-body {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 16px;
          border-radius: 16px;
          border-top-left-radius: 4px;
        }
        .ad-c-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
        .ad-c-text { font-size: 14px; color: rgba(255, 255, 255, 0.8); line-height: 1.5; }

        .ad-c-input-wrap {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }
        .ad-c-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
          resize: none;
          outline: none;
        }
        .ad-c-input:focus { border-color: rgba(244, 114, 182, 0.5); }

        /* Host Area */
        .ad-host-panel {
          background: linear-gradient(135deg, rgba(244, 114, 182, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%);
          border: 1px solid rgba(244, 114, 182, 0.2);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .ad-hp-title {
          font-size: 16px;
          font-weight: 700;
          color: #f472b6;
          margin: 0 0 16px;
        }
        .ad-hp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .ad-hp-stat {
          background: rgba(0, 0, 0, 0.2);
          padding: 16px;
          border-radius: 12px;
        }

        /* Modal */
        .ad-modal-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
          z-index: 100; display: flex; align-items: center; justify-content: center;
        }
        .ad-modal {
          background: #18181b; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;
          padding: 32px; width: 100%; max-width: 400px;
        }
      `}</style>

      {/* Hero Banner */}
      <div className="ad-banner-wrap">
        {activity.banner ? (
          <img src={activity.banner} alt="Banner" className="ad-banner-img" />
        ) : (
          <div className="ad-banner-placeholder">🎪</div>
        )}
        <div className="ad-banner-overlay" />
      </div>

      <div className="ad-container">
        {/* Header Card */}
        <div className="ad-header-card">
          <div className="ad-header-main">
            <h1 className="ad-title">{activity.title}</h1>
            
            <div className="ad-meta">
              <span className="ad-meta-item">📍 {activity.location}</span>
              <span className="ad-meta-item">📅 {formattedDate}</span>
              <span className="ad-meta-item" style={{ background: 'rgba(244, 114, 182, 0.1)', color: '#f472b6', borderColor: 'rgba(244, 114, 182, 0.2)' }}>
                {activity.type}
              </span>
            </div>

            <div className="ad-host">
              <img src={hostPic} alt="Host" className="ad-host-pic" />
              <div className="ad-host-info">
                <span className="ad-host-label">Hosted by</span>
                <span className="ad-host-name">
                  {activity.is_official 
                    ? (activity.society_name ? `${activity.society_name}, ${activity.college_name}` : activity.college_name)
                    : (activity.hosted_by_name || activity.host_name)
                  }
                  {activity.is_official && <span title="Official Event" style={{ marginLeft: '6px' }}>🏛️</span>}
                </span>
              </div>
            </div>
            
            <div className="ad-stats">
              <div className="ad-stat">
                <span className="ad-stat-val">{activity.member_count}</span>
                <span className="ad-stat-label">Joined</span>
              </div>
              <div className="ad-stat">
                <span className="ad-stat-val">{activity.going_count || 0}</span>
                <span className="ad-stat-label">Going</span>
              </div>
            </div>
          </div>

          <div className="ad-actions">
            {new Date(activity.date).getTime() > new Date().getTime() - 24 * 60 * 60 * 1000 && (
              <>
                <button 
                  className={`ad-btn ${activity.my_rsvp === 'going' ? 'ad-btn-primary' : 'ad-btn-secondary'}`}
                  onClick={() => handleRsvp(activity.my_rsvp === 'going' ? 'not_going' : 'going')}
                >
                  {activity.my_rsvp === 'going' ? 'Joined' : 'Join'}
                </button>
                <button className="ad-btn ad-btn-secondary" onClick={() => setShowInviteModal(true)}>
                  💌 Invite Friend
                </button>
              </>
            )}
            {activity.social_links && activity.social_links.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                {activity.social_links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="ad-btn ad-btn-secondary" style={{textDecoration: 'none', padding: '8px', fontSize: '13px'}}>
                    🔗 {link.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="ad-grid">
          {/* Main Left Column */}
          <div className="ad-main">
            <div className="ad-block">
              <h2 className="ad-block-title">About this Event</h2>
              <div className="ad-desc-text">
                {activity.description || "No description provided. Come and find out what it's all about!"}
              </div>
            </div>

            {/* Submissions & Tabs */}
            <div className="ad-block">
              <div className="ad-tabs">
                {activity.allow_submissions && (
                  <>
                    <button className={`ad-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
                      Gallery View
                    </button>
                    <button className={`ad-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                      Leaderboard 🏆
                    </button>
                  </>
                )}
                {activity.format === 'Hangout' && (
                  <button className={`ad-tab ${activeTab === 'polls' ? 'active' : ''}`} onClick={() => setActiveTab('polls')}>
                    Polls 📊
                  </button>
                )}
                <button className={`ad-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                  Discussion ({comments.length})
                </button>
              </div>

              {activeTab === 'gallery' && (
                <div className="ad-gallery">
                  {submissions.map((s) => (
                    <div key={s.id} className="ad-sub-card">
                      <img src={s.content_url} className="ad-sub-img" />
                      <div className="ad-sub-body">
                        <div className="ad-sub-author">{s.name}</div>
                        <button 
                          onClick={() => handleVote(s.id)}
                          className={`ad-btn ${s.has_voted ? 'ad-btn-primary' : 'ad-btn-secondary'}`}
                          style={{ padding: '6px', fontSize: '12px' }}
                        >
                          {s.has_voted ? `❤️ ${s.vote_count}` : `🤍 ${s.vote_count}`}
                        </button>
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && <div className="text-gray-500 py-8 text-center">No submissions yet!</div>}
                </div>
              )}

              {activeTab === 'leaderboard' && (
                <div className="ad-leaderboard">
                  {submissions.map((s, i) => (
                    <div key={s.id} className="ad-leaderboard-row">
                      <div className={`ad-rank ${i===0 ? 'ad-rank-1' : i===1 ? 'ad-rank-2' : i===2 ? 'ad-rank-3' : ''}`}>#{i+1}</div>
                      <img src={s.content_url} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <div className="text-white font-semibold">{s.name}</div>
                        <div className="text-sm text-gray-400">{s.vote_count} votes</div>
                      </div>
                      <button 
                        onClick={() => handleVote(s.id)}
                        className={`ad-btn ${s.has_voted ? 'ad-btn-primary' : 'ad-btn-secondary'}`}
                        style={{ width: 'auto', padding: '8px 16px' }}
                      >
                        {s.has_voted ? 'Voted' : 'Vote'}
                      </button>
                    </div>
                  ))}
                  {submissions.length === 0 && <div className="text-gray-500 py-8 text-center">No entries for leaderboard yet!</div>}
                </div>
              )}

              {activeTab === 'polls' && (
                <div>
                  {isHost && (
                    <div className="mb-8 bg-white/5 border border-white/10 p-4 rounded-xl">
                      <h4 className="text-sm font-bold mb-3 text-pink-400">Create New Poll</h4>
                      <input type="text" placeholder="Ask a question..." value={newPollQ} onChange={e=>setNewPollQ(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white text-sm mb-3 outline-none" />
                      {newPollOpts.map((opt, i) => (
                        <input key={i} type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e=>{const n=[...newPollOpts]; n[i]=e.target.value; setNewPollOpts(n)}} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm mb-2 outline-none" />
                      ))}
                      <div className="flex gap-2 mt-2">
                        <button className="text-xs text-gray-400 hover:text-white" onClick={()=>setNewPollOpts([...newPollOpts, ""])}>+ Add Option</button>
                        <button className="ml-auto ad-btn ad-btn-primary" style={{width: 'auto', padding: '6px 12px', fontSize: '12px'}} onClick={handleCreatePoll} disabled={creatingPoll}>Create</button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-6">
                    {polls.map((p) => {
                      const totalVotes = p.options.reduce((sum: number, o: any) => sum + o.vote_count, 0);
                      return (
                        <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                          <h3 className="text-lg font-bold text-white mb-4">{p.question}</h3>
                          <div className="flex flex-col gap-3">
                            {p.options.map((o: any) => {
                              const pct = totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0;
                              return (
                                <div key={o.id} className="relative overflow-hidden rounded-lg cursor-pointer bg-black/40 border border-white/5 hover:border-white/20 transition-all" onClick={() => handleVotePoll(o.id)}>
                                  <div className="absolute inset-y-0 left-0 bg-pink-500/20" style={{width: `${pct}%`}}></div>
                                  <div className="relative p-3 flex justify-between items-center z-10">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${o.has_voted ? 'border-pink-500' : 'border-gray-500'}`}>
                                        {o.has_voted && <div className="w-2 h-2 rounded-full bg-pink-500"></div>}
                                      </div>
                                      <span className="text-sm text-white font-medium">{o.option_text}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{pct}% ({o.vote_count})</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-4 text-xs text-gray-500">Created by {p.creator_name} • {totalVotes} total votes</div>
                        </div>
                      );
                    })}
                    {polls.length === 0 && <div className="text-center text-gray-500 py-8">No polls active right now.</div>}
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div>
                  <div className="ad-comment-list">
                    {comments.map((c) => (
                      <div key={c.id} className="ad-comment">
                        <img src={c.profile_pic?.startsWith('/uploads') ? `${API}${c.profile_pic}` : c.profile_pic || `https://ui-avatars.com/api/?name=${c.name}&background=0D1117&color=fff`} className="ad-c-avatar" />
                        <div className="ad-c-body">
                          <div className="ad-c-name">{c.name} <span style={{color: '#666', fontWeight: 400}}>@{c.username}</span></div>
                          <div className="ad-c-text">{c.content}</div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && <div className="text-gray-500 py-4 text-center">Be the first to comment!</div>}
                  </div>
                  <div className="ad-c-input-wrap">
                    <textarea 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Type your message..." 
                      className="ad-c-input" 
                      rows={1}
                    />
                    <button onClick={handleComment} disabled={commenting} className="ad-btn ad-btn-primary" style={{ width: 'auto' }}>
                      {commenting ? '...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="ad-sidebar">
            {isHost && (
              <div className="ad-host-panel">
                <h3 className="ad-hp-title">🛠️ Host Tools</h3>
                
                {analytics && (
                  <div className="ad-hp-grid mb-6">
                    <div className="ad-hp-stat">
                      <div className="ad-stat-val">{analytics.view_count || 0}</div>
                      <div className="ad-stat-label">Views</div>
                    </div>
                    <div className="ad-hp-stat">
                      <div className="ad-stat-val">{analytics.submission_count || 0}</div>
                      <div className="ad-stat-label">Submissions</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="ad-btn ad-btn-secondary flex-1" onClick={() => router.push(`/activities/${id}/edit`)}>
                    ✏️ Edit
                  </button>
                  <button className="ad-btn flex-1" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }} onClick={handleDelete}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}

            {/* Submission Box */}
            {activity.allow_submissions && (
              <div className="ad-block">
                <h3 className="ad-block-title">Submit Entry</h3>
                <p className="text-sm text-gray-400 mb-4">Participate in this event by submitting your photo or content.</p>
                
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full mb-3 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600" />
                
                <textarea 
                  value={subDesc} onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Caption (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-4 outline-none focus:border-pink-500"
                  rows={2}
                />
                
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="ad-btn ad-btn-primary"
                >
                  {submitting ? 'Uploading...' : 'Submit Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="ad-modal-bg" onClick={() => setShowInviteModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Invite a Friend</h2>
            <p className="text-sm text-gray-400 mb-4">Enter your friend's user ID to invite them to this activity.</p>
            <input 
              type="text" 
              placeholder="Friend's User ID" 
              value={inviteeId} 
              onChange={e => setInviteeId(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-6 outline-none focus:border-pink-500"
            />
            <div className="flex gap-3">
              <button className="ad-btn ad-btn-secondary flex-1" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="ad-btn ad-btn-primary flex-1" onClick={handleInvite}>Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}