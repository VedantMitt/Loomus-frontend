"use client";

import { useEffect, useState, useCallback } from "react";
import UserCard from "@/components/UserCard";

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

export default function DiscoverPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCollege, setActiveCollege] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<string | null>(null);

  // Derive filter options from data
  const colleges = [...new Set(users.map((u) => u.college).filter(Boolean))];
  // We'll collect all users first, then derive filters from the full unfiltered set
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const allColleges = [...new Set(allUsers.map((u) => u.college).filter(Boolean))];
  const allYears = [...new Set(allUsers.map((u) => u.year).filter(Boolean))].sort();

  const fetchUsers = useCallback(
    async (searchTerm?: string) => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const params = new URLSearchParams();
        if (searchTerm?.trim()) params.set("search", searchTerm.trim());
        if (activeCollege) params.set("college", activeCollege);
        if (activeYear) params.set("year", activeYear);

        const res = await fetch(`${API}/users/discover?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Discover fetch error:", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [activeCollege, activeYear]
  );

  // Initial load ??? fetch all users to populate filter options
  useEffect(() => {
    (async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/discover`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        }
      } catch {}
    })();
  }, []);

  // Fetch whenever search/filters change (with debounce for search)
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timeout);
  }, [search, fetchUsers]);

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .discover-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px 80px;
          font-family: 'DM Sans', sans-serif;
        }

        .discover-hero {
          text-align: center;
          margin-bottom: 40px;
        }
        .discover-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px;
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #a5b4fc 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .discover-subtitle {
          color: #555;
          font-size: 15px;
          margin-top: 8px;
        }

        /* Search */
        .discover-search-wrap {
          position: relative;
          max-width: 520px;
          margin: 0 auto 28px;
        }
        .discover-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #555;
          font-size: 16px;
          pointer-events: none;
        }
        .discover-search {
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
        .discover-search::placeholder { color: #444; }
        .discover-search:focus {
          border-color: rgba(99,102,241,0.4);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
          background: rgba(255,255,255,0.05);
        }

        /* Filter Chips */
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 32px;
        }
        .filter-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #444;
          display: flex;
          align-items: center;
          margin-right: 4px;
        }
        .filter-chip {
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          color: #888;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .filter-chip:hover {
          background: rgba(99,102,241,0.08);
          border-color: rgba(99,102,241,0.2);
          color: #a5b4fc;
        }
        .filter-chip.active {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.35);
          color: #a5b4fc;
        }

        /* Grid */
        .discover-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
        }
        @media (min-width: 640px) {
          .discover-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 960px) {
          .discover-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Loading */
        .skeleton-card {
          border-radius: 20px;
          background: linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,255,255,0.05);
          padding: 24px;
          height: 260px;
          animation: shimmer 1.8s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .skeleton-row {
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
          margin-bottom: 12px;
        }
        .skeleton-circle {
          width: 56px; height: 56px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }

        /* Empty */
        .discover-empty {
          text-align: center;
          padding: 60px 20px;
          color: #444;
        }
        .discover-empty-icon { font-size: 48px; margin-bottom: 16px; }
        .discover-empty-text { font-size: 16px; font-weight: 500; }
        .discover-empty-sub { font-size: 13px; color: #333; margin-top: 6px; }

        /* Result count */
        .result-count {
          text-align: center;
          font-size: 12px;
          color: #444;
          margin-bottom: 20px;
          font-weight: 500;
        }
      `}</style>

      <main className="discover-page">
        {/* Hero */}
        <div className="discover-hero">
          <h1 className="discover-title">Discover People</h1>
          <p className="discover-subtitle">Find your next study buddy, project partner, or campus bestie</p>
        </div>

        {/* Search */}
        <div className="discover-search-wrap">
          <span className="discover-search-icon">????</span>
          <input
            type="text"
            className="discover-search"
            placeholder="Search by name or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter chips */}
        {(allColleges.length > 1 || allYears.length > 1) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", marginBottom: "32px" }}>
            {allColleges.length > 1 && (
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <span className="filter-label">College</span>
                {allColleges.map((c) => (
                  <button
                    key={c}
                    className={`filter-chip ${activeCollege === c ? "active" : ""}`}
                    onClick={() => setActiveCollege(activeCollege === c ? null : c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
            {allYears.length > 1 && (
              <div className="filter-row" style={{ marginBottom: 0 }}>
                <span className="filter-label">Year</span>
                {allYears.map((y) => (
                  <button
                    key={y}
                    className={`filter-chip ${activeYear === y ? "active" : ""}`}
                    onClick={() => setActiveYear(activeYear === y ? null : (y ?? null))}
                  >
                    '{y?.toString().slice(-2)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Result count */}
        {!loading && users.length > 0 && (
          <div className="result-count">
            {users.length} {users.length === 1 ? "person" : "people"} found
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="discover-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.15}s` }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div className="skeleton-circle" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton-row" style={{ width: "60%", height: "16px" }} />
                    <div className="skeleton-row" style={{ width: "40%", height: "12px" }} />
                  </div>
                </div>
                <div className="skeleton-row" style={{ width: "100%", height: "12px", marginTop: "20px" }} />
                <div className="skeleton-row" style={{ width: "80%", height: "12px" }} />
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <div className="skeleton-row" style={{ width: "60px", height: "24px", borderRadius: "999px" }} />
                  <div className="skeleton-row" style={{ width: "70px", height: "24px", borderRadius: "999px" }} />
                  <div className="skeleton-row" style={{ width: "50px", height: "24px", borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          /* Empty state */
          <div className="discover-empty">
            <div className="discover-empty-icon">????</div>
            <p className="discover-empty-text">No one found</p>
            <p className="discover-empty-sub">
              {search || activeCollege || activeYear
                ? "Try adjusting your search or filters"
                : "Looks like no one's here yet"}
            </p>
          </div>
        ) : (
          /* User grid */
          <div className="discover-grid">
            {users.map((user, i) => (
              <UserCard key={user.id} user={user} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
