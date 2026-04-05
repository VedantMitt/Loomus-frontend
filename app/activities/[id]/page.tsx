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

type Announcement = {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_username: string;
  sender_pic?: string;
  created_at: string;
};

type Moderator = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  assigned_at: string;
};

type Member = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
  rsvp_status: string;
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

  const [activeTab, setActiveTab] = useState<"gallery" | "leaderboard" | "comments" | "polls" | "announcements">("gallery");
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementText, setAnnouncementText] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [isMod, setIsMod] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [showManageRolesModal, setShowManageRolesModal] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Global Search for Invites
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

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
        
        // Auto-select tab from query param or based on format
        const queryParams = new URLSearchParams(window.location.search);
        const tabParam = queryParams.get('tab');
        
        if (tabParam === 'announcements') setActiveTab('announcements');
        else if (tabParam === 'comments') setActiveTab('comments');
        else if (tabParam === 'gallery') setActiveTab('gallery');
        else if (tabParam === 'leaderboard') setActiveTab('leaderboard');
        else if (tabParam === 'polls') setActiveTab('polls');
        else if (aData.format === 'Hangout') setActiveTab('polls');
        else if (aData.format === 'Event' || !aData.allow_submissions) setActiveTab('comments');

        // Fetch submissions
        const sRes = await fetch(`${API}/activities/${id}/submissions`);
        if (sRes.ok) setSubmissions(await sRes.json());
        
        // Fetch comments
        const cRes = await fetch(`${API}/activities/${id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cRes.ok) setComments(await cRes.json());

        // Fetch moderators
        const mRes = await fetch(`${API}/activities/${id}/moderators`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          setModerators(mData);
          setIsMod(mData.some((m: any) => m.id === myUserId));
        }

        // Fetch announcements
        const annRes = await fetch(`${API}/activities/${id}/announcements`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (annRes.ok) setAnnouncements(await annRes.json());

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
  }, [id, router, API]);

  // Global Search for Invites
  useEffect(() => {
    if (!showInviteModal) return;
    
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/discover?search=${searchQuery.trim()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch (err) {
        console.error("Invite search error:", err);
      } finally {
        setSearching(false);
      }
    }, searchQuery ? 300 : 0); // Immediate fetch if empty, else debounce
    return () => clearTimeout(timeout);
  }, [searchQuery, showInviteModal, API]);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/activities/${id}/announcements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setAnnouncements(await res.json());
  };

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMembers(await res.json());
    } catch (err) { console.error(err); }
    setLoadingMembers(false);
  };

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

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    setPostingAnnouncement(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/announcements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: announcementText })
      });
      if (res.ok) {
        setAnnouncementText("");
        fetchAnnouncements();
        alert("Announcement posted!");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to post");
      }
    } catch (err) { console.error(err); }
    setPostingAnnouncement(false);
  };

  const handleAddModerator = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/moderators`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId })
      });
      if (res.ok) {
        // Refresh moderators and members
        const mRes = await fetch(`${API}/activities/${id}/moderators`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mRes.ok) setModerators(await mRes.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleRemoveModerator = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/moderators/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh moderators
        const mRes = await fetch(`${API}/activities/${id}/moderators`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (mRes.ok) setModerators(await mRes.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleInvite = async (userId: string) => {
    if (!userId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${id}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invitee_id: userId })
      });
      if (res.ok) {
        alert("Invitation sent!");
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

        .ad-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          margin-top: -100px;
        }

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
        .ad-btn-primary:hover { transform: scale(0.98); }
        
        .ad-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .ad-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
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
            <div className="flex flex-col gap-2">
              <button 
                className={`ad-btn ${activity.my_rsvp === 'going' ? 'ad-btn-primary' : 'ad-btn-secondary'}`}
                onClick={() => handleRsvp(activity.my_rsvp === 'going' ? 'not_going' : 'going')}
              >
                {activity.my_rsvp === 'going' ? 'Joined' : 'Join'}
              </button>
              <button className="ad-btn ad-btn-secondary" onClick={() => setShowInviteModal(true)}>
                💌 Invite Friend
              </button>
              {isHost && (
                <button 
                  className="ad-btn ad-btn-secondary" 
                  style={{ border: '1px solid rgba(244, 114, 182, 0.4)', color: '#f472b6' }}
                  onClick={() => { fetchMembers(); setShowManageRolesModal(true); }}
                >
                  ⚙️ Manage Roles
                </button>
              )}
            </div>
            
            {activity.social_links && activity.social_links.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {activity.social_links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className="ad-btn ad-btn-secondary !p-2 !text-[13px] no-underline">
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

            {/* Content Tabs */}
            <div className="ad-block">
              <div className="ad-tabs">
                <button className={`ad-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                  Discussion ({comments.length})
                </button>
                <button className={`ad-tab ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
                   📢 Updates ({announcements.length})
                </button>
                {activity.allow_submissions && (
                  <>
                    <button className={`ad-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
                      Gallery
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
              </div>

              {/* Tab Content Rendering */}
              <div className="mt-6">
                {activeTab === 'gallery' && (
                  <div className="ad-gallery">
                    {submissions.map((s) => (
                      <div key={s.id} className="ad-sub-card">
                        <img src={s.content_url} className="ad-sub-img" alt="" />
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
                        <img src={s.content_url} className="w-16 h-16 rounded-xl object-cover" alt="" />
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
                    <div className="space-y-4">
                      {polls.map((poll) => {
                        const totalVotes = poll.options.reduce((sum: number, o: any) => sum + (o.vote_count || 0), 0);
                        return (
                          <div key={poll.id} className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <h4 className="font-bold text-white mb-4">{poll.question}</h4>
                            <div className="space-y-3">
                              {poll.options.map((opt: any) => {
                                const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                                return (
                                  <div key={opt.id} onClick={() => handleVotePoll(opt.id)} className={`relative overflow-hidden p-3 rounded-lg border transition-all cursor-pointer ${opt.has_voted ? 'border-pink-500/50 bg-pink-500/10' : 'border-white/5 bg-white/3 hover:bg-white/5'}`}>
                                    <div className="absolute inset-y-0 left-0 bg-pink-500/10 transition-all" style={{ width: `${pct}%` }} />
                                    <div className="relative flex justify-between items-center text-sm">
                                      <span className="flex items-center gap-2">
                                        {opt.option_text}
                                        {opt.has_voted && <span className="text-[10px] text-pink-400">✓ Voted</span>}
                                      </span>
                                      <span className="font-bold">{pct}%</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 text-xs text-gray-500 flex justify-between">
                              <span>Asked by {poll.creator_name || 'Host'}</span>
                              <span>{totalVotes} total votes</span>
                            </div>
                          </div>
                        );
                      })}
                      {polls.length === 0 && <div className="text-center text-gray-500 py-8">No polls active.</div>}
                    </div>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <>
                    <div className="ad-comment-list">
                      {comments.map((c) => (
                        <div key={c.id} className="ad-comment">
                          <img src={c.profile_pic?.startsWith("/uploads") ? `${API}${c.profile_pic}` : c.profile_pic || `https://ui-avatars.com/api/?name=${c.name}&background=111&color=fff`} alt="" className="ad-c-avatar" />
                          <div className="ad-c-body">
                            <div className="ad-c-name">{c.name} (@{c.username})</div>
                            <div className="ad-c-text">{c.content}</div>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && <div className="text-center text-gray-500 py-4">No comments yet.</div>}
                    </div>
                    <div className="ad-c-input-wrap">
                      <textarea className="ad-c-input" rows={1} placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                      <button className="ad-btn ad-btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleComment} disabled={commenting}>
                        {commenting ? "..." : "Send"}
                      </button>
                    </div>
                  </>
                )}

                {activeTab === "announcements" && (
                  <div className="space-y-6">
                    {(isHost || isMod) && (
                      <div className="bg-pink-500/5 p-5 rounded-2xl border border-pink-500/20">
                        <label className="ad-hp-title !text-xs uppercase tracking-wider mb-2 block">Post Official Announcement</label>
                        <textarea 
                          className="ad-c-input !rounded-xl !bg-black/40 mb-3" 
                          rows={3} 
                          placeholder="Broadcast an update to all members..."
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                        />
                        <button 
                          className="ad-btn ad-btn-primary !w-auto !px-6" 
                          onClick={handlePostAnnouncement}
                          disabled={postingAnnouncement || !announcementText.trim()}
                        >
                          {postingAnnouncement ? "Posting..." : "Broadcast Update 📣"}
                        </button>
                      </div>
                    )}

                    {announcements.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-3">🔕</div>
                        No announcements yet.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {announcements.map((ann) => (
                          <div key={ann.id} className="bg-white/3 border border-white/5 rounded-2xl p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <img src={ann.sender_pic?.startsWith("/uploads") ? `${API}${ann.sender_pic}` : ann.sender_pic || `https://ui-avatars.com/api/?name=${ann.sender_name}&background=111&color=fff`} className="w-8 h-8 rounded-full" alt="" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{ann.sender_name}</span>
                                    <span className="text-[9px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full font-bold uppercase">
                                      {ann.sender_id === activity.host_user_id ? "Host" : "Mod"}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {new Date(ann.created_at).toLocaleDateString()} at {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-[#eee] text-sm leading-relaxed whitespace-pre-wrap">
                              {ann.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar */}
          <div className="ad-sidebar">
            {isHost && (
              <div className="ad-host-panel">
                <h3 className="ad-hp-title">🛠️ Host Manager</h3>
                
                {analytics && (
                  <div className="ad-hp-grid mb-6">
                    <div className="ad-hp-stat">
                      <div className="ad-stat-val text-pink-400">{analytics.view_count || 0}</div>
                      <div className="ad-stat-label">Views</div>
                    </div>
                    <div className="ad-hp-stat">
                      <div className="ad-stat-val">{analytics.submission_count || 0}</div>
                      <div className="ad-stat-label">Entries</div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button className="ad-btn ad-btn-secondary !bg-white/5" onClick={() => router.push(`/activities/${id}/edit`)}>
                    ✏️ Edit Event
                  </button>
                  <button className="ad-btn !bg-red-500/10 !text-red-500 border border-red-500/20" onClick={handleDelete}>
                    🗑️ Delete Event
                  </button>
                </div>
              </div>
            )}

            {/* Submission Box */}
            {activity.allow_submissions && (
              <div className="ad-block">
                <h3 className="ad-block-title">Submit Content</h3>
                <p className="text-xs text-gray-400 mb-4">Share your moments from this event with the community.</p>
                
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full mb-3 text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-pink-500 file:text-white cursor-pointer" />
                
                <textarea 
                  value={subDesc} onChange={(e) => setSubDesc(e.target.value)}
                  placeholder="Tell us about your entry..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-4 outline-none focus:border-pink-500 min-h-[80px]"
                />
                
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className="ad-btn ad-btn-primary"
                >
                  {submitting ? 'Uploading...' : 'Upload Entry'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Invite Button (Desktop) */}
        {!isHost && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="fixed bottom-10 right-10 w-16 h-16 bg-pink-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 border-4 border-black"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="17" y1="11" x2="23" y2="11"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Manage Roles Modal */}
      {showManageRolesModal && (
        <div className="ad-modal-bg" onClick={() => setShowManageRolesModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="ad-block-title !m-0">Manage Roles</h2>
              <button onClick={() => setShowManageRolesModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-gray-400 mb-6">Promote members to <b>Moderator</b>. They will be able to post official announcements to the community.</p>

            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2">
              {loadingMembers ? (
                <div className="text-center py-8 text-gray-500 text-sm">Loading participants...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No members to manage.</div>
              ) : (
                members.map(member => {
                  const isModUser = moderators.some(m => m.id === member.id);
                  const isHostUser = member.id === activity.host_user_id;

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <img src={member.profile_pic?.startsWith('/uploads') ? `${API}${member.profile_pic}` : member.profile_pic || `https://ui-avatars.com/api/?name=${member.name}&background=111&color=fff`} className="w-9 h-9 rounded-full" alt="" />
                        <div>
                          <div className="text-sm font-bold text-white">{member.name}</div>
                          <div className="text-[10px] text-gray-500">@{member.username}</div>
                        </div>
                      </div>
                      
                      {isHostUser ? (
                        <span className="text-[10px] text-pink-400 font-bold uppercase bg-pink-500/10 px-2 py-1 rounded">Host</span>
                      ) : (
                        <button 
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${isModUser ? 'bg-white/10 text-gray-300' : 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'}`}
                          onClick={() => isModUser ? handleRemoveModerator(member.id) : handleAddModerator(member.id)}
                        >
                          {isModUser ? "Demote" : "Make Mod"}
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="ad-modal-bg" onClick={() => setShowInviteModal(false)}>
          <div className="ad-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="ad-block-title !m-0">Find People</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <p className="text-xs text-gray-400 mb-6">Search for anyone on <b>Loomus</b> and invite them to join.</p>

            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search by name or username..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-12 text-white text-sm outline-none focus:border-pink-500 focus:bg-white/10 transition-all"
              />
              <svg className="absolute left-4 top-4 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {searching ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pink-500 mx-auto mb-3"></div>
                  <div className="text-gray-500 text-sm">Searching the campus...</div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-30">🔍</div>
                  <div className="text-gray-400 font-medium">No results found</div>
                  <div className="text-gray-600 text-xs mt-1">Try a different name or username</div>
                </div>
              ) : (
                searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/8 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={user.profile_pic?.startsWith('/uploads') ? `${API}${user.profile_pic}` : user.profile_pic || `https://ui-avatars.com/api/?name=${user.name}&background=111&color=fff`} 
                          className="w-11 h-11 rounded-full object-cover border-2 border-transparent group-hover:border-pink-500/50 transition-all" 
                          alt="" 
                        />
                        {user.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1c] rounded-full" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">{user.name}</div>
                        <div className="text-[10px] text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleInvite(user.id)}
                      className="text-[11px] font-bold px-5 py-2.5 bg-pink-500/10 text-pink-400 rounded-xl hover:bg-pink-500 hover:text-white hover:scale-105 transition-all transform active:scale-95 shadow-lg shadow-black/20"
                    >
                      Invite
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}