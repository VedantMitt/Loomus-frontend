"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";
import SearchableSelector from "@/components/SearchableSelector";
import NebulaBackground from "@/components/NebulaBackground";
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

const MODES = [
  { key: "all", label: "Any Mode" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
];

const PRICES = [
  { key: "all", label: "Any Price" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
];

const STATUSES = [
  { key: "all", label: "Any Status" },
  { key: "live", label: "Live Now" },
  { key: "upcoming", label: "Upcoming" },
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
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground variant="discover" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .act-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 100px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .act-hero {
          text-align: center;
          margin-bottom: 48px;
        }

        .act-title {
          font-family: 'Syne', sans-serif;
          font-size: 44px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #f472b6 40%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.04em;
        }

        .act-subtitle {
          color: #888;
          font-size: 17px;
          margin-top: 14px;
          font-weight: 500;
        }

        .act-search-row {
          display: flex;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto 16px;
          align-items: center;
        }

        .act-search {
          flex: 1;
          padding: 18px 24px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: all 0.3s;
          margin: 0;
        }
        .act-search:focus {
          border-color: rgba(244, 114, 182, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 30px rgba(244, 114, 182, 0.1);
        }

        .act-filter-btn {
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: #fff;
          cursor: pointer;
          transition: all 0.3s;
        }
        .act-filter-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }
        .act-filter-btn.active {
          background: linear-gradient(135deg, rgba(244, 114, 182, 0.2), rgba(192, 132, 252, 0.2));
          border-color: rgba(244, 114, 182, 0.4);
          color: #f472b6;
        }

        .act-filters-panel {
          max-width: 800px;
          margin: 0 auto 40px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 32px;
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          z-index: 100;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.1em;
          margin-left: 4px;
        }
        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .act-tab {
          padding: 8px 18px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.3s;
          background: rgba(255, 255, 255, 0.02);
          color: #888;
        }
        .act-tab.active {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .act-cat-chip {
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #888;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .act-cat-chip.active {
          background: rgba(244, 114, 182, 0.1);
          color: #f472b6;
          border-color: rgba(244, 114, 182, 0.3);
        }

        .act-grid { 
          display: flex;
          overflow-x: auto;
          gap: 24px;
          padding: 10px 0 32px;
          scroll-snap-type: x mandatory;
        }
        .act-grid::-webkit-scrollbar { display: none; }
        
        .act-grid > * {
          flex: 0 0 360px;
          scroll-snap-align: start;
        }

        .act-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          width: 60px;
          height: 60px;
          border-radius: 20px;
          background: linear-gradient(135deg, #f472b6 0%, #c084fc 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 32px;
          box-shadow: 0 15px 35px rgba(244, 114, 182, 0.3);
          text-decoration: none;
          z-index: 100;
          transition: all 0.3s;
        }
        .act-fab:hover { transform: translateY(-4px) scale(1.05); }

        .act-skeleton {
          background: rgba(255,255,255,0.03);
          border-radius: 28px;
          height: 380px;
          border: 1px solid rgba(255,255,255,0.08);
          animation: skeleton-pulse 1.5s infinite;
        }
        @keyframes skeleton-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>

      <main className="act-container">
        <div className="act-hero">
          <h1 className="act-title">Activities</h1>
          <p className="act-subtitle">Find your tribe at events and competitions 🎪</p>
        </div>

        <div className="act-search-row">
          <input
            type="text"
            className="act-search"
            placeholder="Search events, cities, colleges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button 
            className={`act-filter-btn ${showFilters || hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className="act-filters-panel">
            <div className="filter-group">
              <span className="filter-label">Categories</span>
              <div className="filter-options">
                {CATEGORIES.map((cat) => (
                  <button key={cat.key} className={`act-cat-chip ${activeCategory === cat.key ? "active" : ""}`} onClick={() => setActiveCategory(cat.key)}>
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div className="filter-group">
                <span className="filter-label">Status</span>
                <div className="filter-options">
                  {STATUSES.map(s => (
                    <button key={s.key} className={`act-tab ${activeStatus === s.key ? 'active' : ''}`} onClick={() => setActiveStatus(s.key)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Mode</span>
                <div className="filter-options">
                  {MODES.map(m => (
                    <button key={m.key} className={`act-tab ${activeMode === m.key ? 'active' : ''}`} onClick={() => setActiveMode(m.key)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-label">Price</span>
                <div className="filter-options">
                  {PRICES.map(p => (
                    <button key={p.key} className={`act-tab ${activePrice === p.key ? 'active' : ''}`} onClick={() => setActivePrice(p.key)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="filter-group">
                <span className="filter-label">City</span>
                <SearchableSelector
                  options={INDIAN_CITIES}
                  placeholder="All Cities"
                  value={citySearch}
                  onChange={setCitySearch}
                />
              </div>
              <div className="filter-group">
                <span className="filter-label">College</span>
                <SearchableSelector
                  options={INDIAN_COLLEGES}
                  placeholder="All Colleges"
                  value={collegeSearch}
                  onChange={setCollegeSearch}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button 
                onClick={() => {
                  setActiveCategory("all");
                  setActiveStatus("all");
                  setActiveMode("all");
                  setActivePrice("all");
                  setCitySearch("");
                  setCollegeSearch("");
                }}
                style={{ alignSelf: "center", background: "none", border: "none", color: "#f472b6", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 10 }}
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {error && <div style={{ textAlign: "center", color: "#f43f5e" }}>{error}</div>}

        {loading ? (
          <div className="act-grid">
            {[...Array(4)].map((_, i) => <div key={i} className="act-skeleton" />)}
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: "center", color: "#666", padding: "80px 0" }}>No activities found. Try a different category!</div>
        ) : (
          <>
            {liveActivities.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: "#f43f5e", boxShadow: "0 0 10px #f43f5e" }} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Live Now</span>
                </div>
                <div className="act-grid">
                  {liveActivities.map((a) => <ActivityCard key={a.id} activity={a} onRsvpChange={handleRsvpChange} />)}
                </div>
              </>
            )}

            {upcomingActivities.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, marginTop: 32 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: "#c084fc" }} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>Upcoming</span>
                </div>
                <div className="act-grid">
                  {upcomingActivities.map((a) => <ActivityCard key={a.id} activity={a} onRsvpChange={handleRsvpChange} />)}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Link href="/activities/create" className="act-fab">+</Link>
    </div>
  );
}