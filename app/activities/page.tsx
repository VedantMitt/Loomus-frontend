"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";
import SearchableSelector from "@/components/SearchableSelector";
import { INDIAN_CITIES } from "@/constants/cities";
import { INDIAN_COLLEGES } from "@/constants/colleges";

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
  mode?: string;
  is_free?: boolean;
  price?: number;
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

const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "expired", label: "Expired" },
];

const MODE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
];

const PRICE_OPTIONS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];



export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeMode, setActiveMode] = useState("all");
  const [activePrice, setActivePrice] = useState("all");
  const [citySearch, setCitySearch] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (activeMode !== "all") params.set("mode", activeMode);
      if (activePrice === "free") params.set("is_free", "true");
      if (activePrice === "paid") params.set("is_free", "false");
      if (citySearch.trim()) params.set("city", citySearch.trim());
      if (collegeSearch.trim()) params.set("college", collegeSearch.trim());

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
  }, [activeCategory, activeTab, search, activeStatus, activeMode, activePrice, citySearch, collegeSearch]);

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

  const hasActiveFilters = activeStatus !== "all" || activeMode !== "all" || activePrice !== "all" || citySearch.trim() !== "";

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

        /* Filter Toggle Button */
        .act-filter-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0 auto 20px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #aaa;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          font-family: 'DM Sans', sans-serif;
          width: fit-content;
        }
        .act-filter-toggle:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .act-filter-toggle.has-active {
          background: rgba(244,114,182,0.1);
          border-color: rgba(244,114,182,0.3);
          color: #f472b6;
        }

        /* Filter Panel */
        .act-filters-panel {
          max-width: 700px;
          margin: 0 auto 28px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          animation: filterSlideIn 0.3s ease;
        }
        @keyframes filterSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .act-filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 140px;
        }
        .act-filter-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #666;
        }
        .act-filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .act-filter-chip {
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #888;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .act-filter-chip:hover {
          background: rgba(167,139,250,0.08);
          border-color: rgba(167,139,250,0.2);
          color: #a78bfa;
        }
        .act-filter-chip.active {
          background: rgba(167,139,250,0.15);
          border-color: rgba(167,139,250,0.35);
          color: #a78bfa;
        }
        .act-city-input {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #eee;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border 0.2s;
          width: 160px;
        }
        .act-city-input:focus {
          border-color: rgba(167,139,250,0.4);
        }
        .act-city-input::placeholder { color: #444; }

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

        @media (max-width: 640px) {
          .act-filters-panel {
            flex-direction: column;
            gap: 16px;
          }
          .act-filter-group { min-width: auto; }
          .act-city-input { width: 100%; }
        }
      `}</style>

      <main className="act-page">
        {/* Hero */}
        <div className="act-hero">
          <h1 className="act-title">Activities</h1>
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

        {/* Filter Toggle */}
        <button
          className={`act-filter-toggle ${hasActiveFilters ? "has-active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="8" y1="12" x2="20" y2="12"></line>
            <line x1="12" y1="18" x2="20" y2="18"></line>
          </svg>
          {showFilters ? "Hide Filters" : "Browse Filters"}
          {hasActiveFilters && <span style={{ background: "#f472b6", color: "#fff", borderRadius: "99px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>ON</span>}
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="act-filters-panel">
            <div className="act-filter-group">
              <span className="act-filter-label">Status</span>
              <div className="act-filter-chips">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.key} className={`act-filter-chip ${activeStatus === s.key ? "active" : ""}`} onClick={() => setActiveStatus(s.key)}>
                    {s.key === "live" && "🔴 "}{s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="act-filter-group">
              <span className="act-filter-label">Mode</span>
              <div className="act-filter-chips">
                {MODE_OPTIONS.map(m => (
                  <button key={m.key} className={`act-filter-chip ${activeMode === m.key ? "active" : ""}`} onClick={() => setActiveMode(m.key)}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="act-filter-group">
              <span className="act-filter-label">Price</span>
              <div className="act-filter-chips">
                {PRICE_OPTIONS.map(p => (
                  <button key={p.key} className={`act-filter-chip ${activePrice === p.key ? "active" : ""}`} onClick={() => setActivePrice(p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
              <div className="act-filter-group">
                <span className="act-filter-label">City</span>
                <SearchableSelector 
                  value={citySearch} 
                  onChange={setCitySearch} 
                  options={INDIAN_CITIES}
                  placeholder="All Regions"
                  icon="📍"
                  typeIcon="📍"
                />
              </div>
              <div className="act-filter-group">
                <span className="act-filter-label">College</span>
                <SearchableSelector 
                  value={collegeSearch} 
                  onChange={setCollegeSearch} 
                  options={INDIAN_COLLEGES}
                  placeholder="All Colleges"
                  icon="🏛️"
                  typeIcon="🏛️"
                />
              </div>
            </div>
          </div>
        )}

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
              {search || activeCategory !== "all" || hasActiveFilters
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