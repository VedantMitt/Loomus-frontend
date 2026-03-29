"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Activity = {
  id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  location: string;
  banner?: string;
  host_name: string;
  host_username?: string;
  host_pic?: string;
  member_count: number;
  going_count: number;
  interested_count: number;
  my_rsvp?: string | null;
  joined?: boolean;
  submission_count?: number;
  participant_previews?: { name: string; profile_pic: string }[] | null;
  max_participants?: number;
  host_id?: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  party: "#f472b6",
  music: "#a78bfa",
  tech: "#60a5fa",
  sports: "#34d399",
  dating: "#fb923c",
  academic: "#fbbf24",
  cultural: "#f87171",
  other: "#94a3b8",
};

function getTimeStatus(dateStr: string): { label: string; color: string; countdown?: string } {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const diff = eventDate.getTime() - now.getTime();

  if (diff < -24 * 60 * 60 * 1000) {
    return { label: "Past", color: "#555" };
  }
  if (diff < 0) {
    return { label: "Live Now", color: "#ef4444" };
  }

  // Countdown
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours < 24) {
    return {
      label: "Upcoming",
      color: "#f59e0b",
      countdown: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  }

  const days = Math.floor(hours / 24);
  return {
    label: "Upcoming",
    color: "#3b82f6",
    countdown: days === 1 ? "1 day" : `${days} days`,
  };
}

function formatDate(dateStr: string): { day: string; month: string; time: string } {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString(),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
  };
}

export default function ActivityCard({
  activity,
  onRsvpChange,
}: {
  activity: Activity;
  onRsvpChange?: (id: string, data: any) => void;
}) {
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [timeStatus, setTimeStatus] = useState(getTimeStatus(activity.date));
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStatus(getTimeStatus(activity.date));
    }, 60000);
    return () => clearInterval(interval);
  }, [activity.date]);

  const handleRsvp = async (status: string) => {
    try {
      setRsvpLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/activities/${activity.id}/rsvp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        onRsvpChange?.(activity.id, data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const dateParts = activity.date ? formatDate(activity.date) : null;
  const categoryColor = CATEGORY_COLORS[activity.type?.toLowerCase()] || CATEGORY_COLORS.other;
  const hostAvatar = activity.host_pic
    ? activity.host_pic.startsWith("/uploads")
      ? `${API}${activity.host_pic}`
      : activity.host_pic
    : `https://ui-avatars.com/api/?name=${activity.host_name}&background=0D1117&color=fff&size=40`;

  const previews = activity.participant_previews || [];

  return (
    <>
      <style>{`
        .activity-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        .activity-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
        }
        .ac-banner {
          width: 100%;
          height: 160px;
          object-fit: cover;
          display: block;
        }
        .ac-banner-placeholder {
          width: 100%;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }
        .ac-banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 160px;
          background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%);
          pointer-events: none;
        }
        .ac-date-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 6px 10px;
          text-align: center;
          min-width: 48px;
        }
        .ac-date-day {
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          line-height: 1;
        }
        .ac-date-month {
          font-size: 10px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.08em;
          margin-top: 2px;
        }
        .ac-status-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ac-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          animation: pulse-live 1.5s infinite;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .ac-category-pill {
          position: absolute;
          top: 130px;
          right: 14px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ac-body {
          padding: 18px 18px 16px;
        }
        .ac-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0f0f0;
          margin: 0 0 6px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ac-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }
        .ac-meta-item {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ac-host-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .ac-host-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .ac-host-name {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .ac-host-name strong {
          color: rgba(255,255,255,0.8);
          font-weight: 600;
        }
        .ac-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .ac-avatars {
          display: flex;
          align-items: center;
        }
        .ac-avatar-stack {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 2px solid rgba(10,10,10,1);
          margin-left: -8px;
          object-fit: cover;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
        }
        .ac-avatar-stack:first-child { margin-left: 0; }
        .ac-avatar-more {
          font-size: 10px;
          color: rgba(255,255,255,0.4);
          margin-left: 6px;
          font-weight: 600;
        }
        .ac-actions {
          display: flex;
          gap: 6px;
        }
        .ac-btn {
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ac-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ac-btn-going {
          background: rgba(52, 211, 153, 0.15);
          color: #34d399;
          border: 1px solid rgba(52, 211, 153, 0.25);
        }
        .ac-btn-going:hover { background: rgba(52, 211, 153, 0.25); }
        .ac-btn-going.active {
          background: rgba(52, 211, 153, 0.3);
          border-color: rgba(52, 211, 153, 0.5);
        }
        .ac-btn-interested {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .ac-btn-interested:hover { background: rgba(251, 191, 36, 0.2); }
        .ac-btn-interested.active {
          background: rgba(251, 191, 36, 0.25);
          border-color: rgba(251, 191, 36, 0.45);
        }
        .ac-btn-view {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          text-decoration: none;
        }
        .ac-btn-view:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .ac-countdown {
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .ac-rsvp-counts {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .ac-rsvp-stat {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
        }
        .ac-rsvp-stat strong {
          color: rgba(255,255,255,0.7);
          font-weight: 700;
        }
      `}</style>

      <div className="activity-card">
        {/* Banner */}
        {activity.banner ? (
          <img src={activity.banner} alt="" className="ac-banner" />
        ) : (
          <div
            className="ac-banner-placeholder"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}22 0%, ${categoryColor}08 100%)`,
            }}
          >
            {activity.type === "party" && "🎉"}
            {activity.type === "music" && "🎵"}
            {activity.type === "tech" && "💻"}
            {activity.type === "sports" && "⚽"}
            {activity.type === "dating" && "💕"}
            {activity.type === "academic" && "📚"}
            {activity.type === "cultural" && "🎭"}
            {(!activity.type || activity.type === "other") && "🎪"}
          </div>
        )}
        <div className="ac-banner-overlay" />

        {/* Date badge */}
        {dateParts && (
          <div className="ac-date-badge">
            <div className="ac-date-day">{dateParts.day}</div>
            <div className="ac-date-month">{dateParts.month}</div>
          </div>
        )}

        {/* Status badge */}
        <div
          className="ac-status-badge"
          style={{
            background: `${timeStatus.color}18`,
            color: timeStatus.color,
            border: `1px solid ${timeStatus.color}30`,
          }}
        >
          {timeStatus.label === "Live Now" && (
            <div className="ac-status-dot" style={{ background: timeStatus.color }} />
          )}
          {timeStatus.label}
          {timeStatus.countdown && (
            <span className="ac-countdown">· ⏱ {timeStatus.countdown}</span>
          )}
        </div>

        {/* Category pill */}
        <div
          className="ac-category-pill"
          style={{
            background: `${categoryColor}20`,
            color: categoryColor,
            border: `1px solid ${categoryColor}35`,
          }}
        >
          {activity.type || "Event"}
        </div>

        {/* Body */}
        <div className="ac-body">
          <h3 className="ac-title">{activity.title}</h3>

          <div className="ac-meta">
            <span className="ac-meta-item">📍 {activity.location}</span>
            {dateParts && <span className="ac-meta-item">🕐 {dateParts.time}</span>}
            {activity.submission_count != null && Number(activity.submission_count) > 0 && (
              <span className="ac-meta-item">📎 {activity.submission_count} submissions</span>
            )}
          </div>

          <div className="ac-host-row">
            <img src={hostAvatar} alt="" className="ac-host-avatar" />
            <span className="ac-host-name">
              by <strong>{activity.host_name}</strong>
            </span>
          </div>

          {/* RSVP counts */}
          <div className="ac-rsvp-counts">
            <span className="ac-rsvp-stat">
              <strong>{activity.going_count || 0}</strong> going
            </span>
            <span className="ac-rsvp-stat">
              <strong>{activity.interested_count || 0}</strong> interested
            </span>
          </div>

          <div className="ac-bottom">
            {/* Participant avatars */}
            <div className="ac-avatars">
              {previews.slice(0, 4).map((p, i) => {
                const src = p.profile_pic
                  ? p.profile_pic.startsWith("/uploads")
                    ? `${API}${p.profile_pic}`
                    : p.profile_pic
                  : null;
                return src ? (
                  <img key={i} src={src} alt="" className="ac-avatar-stack" />
                ) : (
                  <div key={i} className="ac-avatar-stack">
                    {p.name?.charAt(0)}
                  </div>
                );
              })}
              {Number(activity.member_count) > 4 && (
                <span className="ac-avatar-more">+{Number(activity.member_count) - 4}</span>
              )}
            </div>

            {/* Action buttons */}
            <div className="ac-actions">
              <button
                className={`ac-btn ac-btn-going ${activity.my_rsvp === "going" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRsvp(activity.my_rsvp === "going" ? "not_going" : "going");
                }}
                disabled={rsvpLoading}
              >
                {activity.my_rsvp === "going" ? "✓ Going" : "Going"}
              </button>
              <button
                className={`ac-btn ac-btn-interested ${activity.my_rsvp === "interested" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRsvp(activity.my_rsvp === "interested" ? "not_going" : "interested");
                }}
                disabled={rsvpLoading}
              >
                {activity.my_rsvp === "interested" ? "✓ Interested" : "★"}
              </button>
              <Link
                href={`/activities/${activity.id}`}
                className="ac-btn ac-btn-view"
                onClick={(e) => e.stopPropagation()}
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}