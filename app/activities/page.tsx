"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";

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

const CATEGORIES = [
  { key: "all", label: "All", icon: "🎪" },
  { key: "party", label: "Party", icon: "🎉" },
  { key: "music", label: "Music", icon: "🎵" },
  { key: "tech", label: "Tech", icon: "💻" },
  { key: "sports", label: "Sports", icon: "⚽" },
  { key: "dating", label: "Dating", icon: "💕" },
  { key: "academic", label: "Academic", icon: "📚" },
  { key: "cultural", label: "Cultural", icon: "🎭" },
  { key: "other", label: "Other", icon: "✨" },
];

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  const fetchActivities = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to view activities.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const params = new URLSearchParams();
      if (activeCategory !== "all") params.set("type", activeCategory);
      if (search.trim()) params.set("search", search.trim());
      if (activeTab === "my") params.set("tab", "my");

      const res = await fetch(`${API}/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch activities");
      const data = await res.json();
      setActivities(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeTab, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchActivities(), 300);
    return () => clearTimeout(timeout);
  }, [fetchActivities]);

  const handleRsvpChange = (activityId: string, data: any) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              my_rsvp: data.my_rsvp,
              going_count: data.going_count,
              interested_count: data.interested_count,
            }
          : a
      )
    );
  };

  // Group activities by status
  const now = new Date();
  const liveActivities = activities.filter((a) => {
    const d = new Date(a.date);
    return d.getTime() <= now.getTime() && d.getTime() > now.getTime() - 24 * 60 * 60 * 1000;
  });
  const upcomingActivities = activities.filter((a) => new Date(a.date) > now);
  const pastActivities = activities.filter((a) => {
    const d = new Date(a.date);
    return d.getTime() <= now.getTime() - 24 * 60 * 60 * 1000;
  });

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .act-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          font-family: 'DM Sans', sans-serif;
        }

        /* Hero */
        .act-hero {
          text-align: center;
          margin-bottom: 36px;
        }
        .act-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #f472b6 40%, #a78bfa 70%, #60a5fa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .act-subtitle {
          color: #555;
          font-size: 15px;
          margin-top: 8px;
        }

        /* Search */
        .act-search-wrap {
          position: relative;
          max-width: 520px;
          margin: 0 auto 24px;
        }
        .act-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          font-size: 16px;
          pointer-events: none;
        }
        .act-search {
          width: 100%;
          padding: 14px 18px 14px 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #eee;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.3s ease;
        }
        .act-search::placeholder { color: #444; }
        .act-search:focus {
          border-color: rgba(244,114,182,0.4);
          box-shadow: 0 0 0 3px rgba(244,114,182,0.08);
          background: rgba(255,255,255,0.05);
        }

        /* Category Chips */
        .act-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 20px;
        }
        .act-cat-chip {
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #888;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .act-cat-chip:hover {
          background: rgba(244,114,182,0.08);
          border-color: rgba(244,114,182,0.2);
          color: #f472b6;
        }
        .act-cat-chip.active {
          background: rgba(244,114,182,0.15);
          border-color: rgba(244,114,182,0.35);
          color: #f472b6;
        }

        /* Tab Toggle */
        .act-tabs {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-bottom: 32px;
          background: rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 4px;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }
        .act-tab {
          flex: 1;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
          color: #666;
          background: transparent;
        }
        .act-tab.active {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        .act-tab:hover:not(.active) {
          color: #aaa;
        }

        /* Section Headers */
        .act-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          margin-top: 32px;
        }
        .act-section-header:first-of-type { margin-top: 0; }
        .act-section-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .act-section-title {
          font-size: 16px;
          font-weight: 700;
          color: #eee;
        }
        .act-section-count {
          font-size: 12px;
          color: #555;
          font-weight: 500;
        }

        /* Horizontal Scroll Row */
        .act-grid {
          display: flex;
          overflow-x: auto;
          gap: 20px;
          padding-bottom: 24px;
          margin-bottom: 8px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }
        
        .act-grid::-webkit-scrollbar {
          height: 6px;
        }
        .act-grid::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
          border-radius: 4px;
        }
        .act-grid::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        .act-grid::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        .act-grid > * {
          flex: 0 0 calc(100% - 32px);
          max-width: 380px;
          scroll-snap-align: start;
        }
        
        @media (min-width: 640px) {
          .act-grid > * { flex: 0 0 320px; }
        }
        @media (min-width: 960px) {
          .act-grid > * { flex: 0 0 360px; }
        }

        /* FAB */
        .act-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f472b6 0%, #a78bfa 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          color: #fff;
          box-shadow: 0 8px 32px rgba(244,114,182,0.3);
          transition: all 0.3s ease;
          z-index: 40;
          text-decoration: none;
        }
        .act-fab:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 12px 40px rgba(244,114,182,0.4);
        }

        /* Skeleton */
        .act-skeleton {
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        .act-skeleton-banner {
          width: 100%;
          height: 160px;
          background: rgba(255,255,255,0.04);
        }
        .act-skeleton-body { padding: 18px; }
        .act-skeleton-row {
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          margin-bottom: 10px;
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Empty */
        .act-empty {
          text-align: center;
          padding: 60px 20px;
          color: #444;
        }
        .act-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .act-empty-text { font-size: 16px; font-weight: 500; }
        .act-empty-sub { font-size: 13px; color: #333; margin-top: 6px; }

        /* Error */
        .act-error {
          text-align: center;
          padding: 40px 20px;
          color: #ef4444;
          font-size: 14px;
        }

        /* Result count */
        .act-result-count {
          text-align: center;
          font-size: 12px;
          color: #444;
          margin-bottom: 20px;
          font-weight: 500;
        }
      `}</style>

      <main className="act-page">
        {/* Hero */}
        <div className="act-hero">
          <h1 className="act-title">Campus Activities</h1>
          <p className="act-subtitle">
            Events, competitions, and hangouts — all happening around you
          </p>
        </div>

        {/* Search */}
        <div className="act-search-wrap">
          <span className="act-search-icon">🔍</span>
          <input
            type="text"
            className="act-search"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category chips */}
        <div className="act-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`act-cat-chip ${activeCategory === cat.key ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="act-tabs">
          <button
            className={`act-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Events
          </button>
          <button
            className={`act-tab ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            My Events
          </button>
        </div>

        {/* Error */}
        {error && <div className="act-error">{error}</div>}

        {/* Loading skeleton */}
        {loading ? (
          <div className="act-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="act-skeleton" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="act-skeleton-banner" />
                <div className="act-skeleton-body">
                  <div className="act-skeleton-row" style={{ width: "75%", height: 18 }} />
                  <div className="act-skeleton-row" style={{ width: "50%", height: 12 }} />
                  <div className="act-skeleton-row" style={{ width: "60%", height: 12 }} />
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <div className="act-skeleton-row" style={{ width: 70, height: 28, borderRadius: 999, marginBottom: 0 }} />
                    <div className="act-skeleton-row" style={{ width: 36, height: 28, borderRadius: 999, marginBottom: 0 }} />
                    <div className="act-skeleton-row" style={{ width: 50, height: 28, borderRadius: 999, marginBottom: 0 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !error && activities.length === 0 ? (
          <div className="act-empty">
            <div className="act-empty-icon">🎪</div>
            <p className="act-empty-text">No activities found</p>
            <p className="act-empty-sub">
              {search || activeCategory !== "all"
                ? "Try adjusting your search or filters"
                : activeTab === "my"
                ? "You haven't joined any events yet"
                : "Be the first to host an event!"}
            </p>
          </div>
        ) : !error ? (
          <>
            {/* Result count */}
            <div className="act-result-count">
              {activities.length} {activities.length === 1 ? "event" : "events"} found
            </div>

            {/* 🔴 Live Now */}
            {liveActivities.length > 0 && (
              <>
                <div className="act-section-header">
                  <div className="act-section-dot" style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.5)", animation: "pulse-live 1.5s infinite" }} />
                  <span className="act-section-title">Live Now</span>
                  <span className="act-section-count">{liveActivities.length}</span>
                </div>
                <div className="act-grid">
                  {liveActivities.map((a) => (
                    <ActivityCard key={a.id} activity={a} onRsvpChange={handleRsvpChange} />
                  ))}
                </div>
              </>
            )}

            {/* ⏰ Coming Up */}
            {upcomingActivities.length > 0 && (
              <>
                <div className="act-section-header">
                  <div className="act-section-dot" style={{ background: "#3b82f6" }} />
                  <span className="act-section-title">Coming Up</span>
                  <span className="act-section-count">{upcomingActivities.length}</span>
                </div>
                <div className="act-grid">
                  {upcomingActivities.map((a) => (
                    <ActivityCard key={a.id} activity={a} onRsvpChange={handleRsvpChange} />
                  ))}
                </div>
              </>
            )}

            {/* 📋 Past Events */}
            {pastActivities.length > 0 && (
              <>
                <div className="act-section-header">
                  <div className="act-section-dot" style={{ background: "#555" }} />
                  <span className="act-section-title">Past Events</span>
                  <span className="act-section-count">{pastActivities.length}</span>
                </div>
                <div className="act-grid" style={{ opacity: 0.7 }}>
                  {pastActivities.map((a) => (
                    <ActivityCard key={a.id} activity={a} onRsvpChange={handleRsvpChange} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </main>

      {/* Floating Action Button */}
      <Link href="/activities/create" className="act-fab" title="Host an Event">
        +
      </Link>
    </div>
  );
}