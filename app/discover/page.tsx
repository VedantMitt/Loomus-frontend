"use client";

import { useEffect, useState, useCallback } from "react";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";

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
  mutual_count?: number;
};

type TopEvent = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  banner?: string;
  host_name: string;
  host_username?: string;
  host_pic?: string;
  going_count: number;
  interested_count: number;
  mode?: string;
  is_free?: boolean;
  price?: number;
  my_rsvp?: string | null;
  member_count?: number;
  participant_previews?: any[];
};

type TopGame = {
  id: string;
  name: string;
  game_type: string;
  visibility: string;
  host_name: string;
  host_username: string;
  host_pic: string;
  player_count: number;
};

type TopRoom = {
  id: string;
  name: string;
  type: string;
  visibility: string;
  host_name: string;
  host_username: string;
  host_profile_pic: string;
  member_count: number;
};

export default function DiscoverPage() {
  const [recommendedUsers, setRecommendedUsers] = useState<User[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");

  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [topRooms, setTopRooms] = useState<TopRoom[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // 🔎 Live Search Logic
  const fetchSearchSuggestions = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setSearchSuggestions([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/users/discover?search=${searchTerm.trim()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setSearchSuggestions(data);
        }
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    },
    [API]
  );

  // Initial Recommended Load
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch Recommended Users (Static)
        const userRes = await fetch(`${API}/users/discover`, { headers });
        if (userRes.ok) {
          const data = await userRes.json();
          setRecommendedUsers(data);
        }

        // 2. Parallel Fetch top lists
        const [evtRes, gameRes, roomRes] = await Promise.all([
          fetch(`${API}/activities/top`, { headers }).catch(() => null),
          fetch(`${API}/play/top-games`, { headers }).catch(() => null),
          fetch(`${API}/rooms/top`, { headers }).catch(() => null),
        ]);

        if (evtRes?.ok) setTopEvents(await evtRes.json());
        if (gameRes?.ok) setTopGames(await gameRes.json());
        if (roomRes?.ok) setTopRooms(await roomRes.json());
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  const handleEventRsvpChange = (eventId: string, data: any) => {
    setTopEvents((prev: TopEvent[]) =>
      prev.map((e: TopEvent) =>
        e.id === eventId
          ? {
            ...e,
            my_rsvp: data.my_rsvp,
            going_count: data.going_count,
            interested_count: data.interested_count,
          }
          : e
      )
    );
  };

  // Handle Search Input Change (Debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search) fetchSearchSuggestions(search);
      else setSearchSuggestions([]);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchSearchSuggestions]);

  const getAvatar = (pic?: string, name?: string) => {
    if (pic) return pic.startsWith("/uploads") ? `${API}${pic}` : pic;
    return `https://ui-avatars.com/api/?name=${name || "U"}&background=0D1117&color=fff`;
  };

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
          font-size: 42px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .discover-subtitle {
          color: #666;
          font-size: 15px;
          margin-top: 8px;
        }

        /* 🔎 Search Component */
        .search-container {
          position: relative;
          max-width: 600px;
          margin: 0 auto 48px;
          z-index: 100;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input {
          width: 100%;
          background: rgba(22, 22, 26, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 16px 20px 16px 48px;
          border-radius: 16px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          outline: none;
          transition: all 0.3s;
        }
        .search-input:focus {
          border-color: #6366f1;
          background: rgba(26, 26, 32, 0.8);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.1);
        }
        .search-icon {
          position: absolute;
          left: 18px;
          color: #555;
        }
        .search-clear {
          position: absolute;
          right: 18px;
          color: #555;
          cursor: pointer;
          transition: color 0.2s;
        }
        .search-clear:hover { color: #fff; }

        /* 📋 Suggestions Dropdown */
        .search-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          left: 0; right: 0;
          background: rgba(13, 13, 17, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          box-shadow: 0 24px 48px -12px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: dropSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          text-decoration: none;
          transition: all 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .suggestion-item:last-child { border: none; }
        .suggestion-item:hover {
          background: rgba(255,255,255,0.04);
        }
        .sug-avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          object-fit: cover;
        }
        .sug-name { font-size: 14px; font-weight: 600; color: #fff; }
        .sug-user { font-size: 12px; color: #666; }
        .sug-meta { font-size: 11px; color: #3b82f6; margin-top: 1px; }

        .search-loading {
          padding: 20px;
          text-align: center;
          color: #555;
          font-size: 13px;
        }

        /* Discovery Sections */
        .discover-section { margin-top: 48px; position: relative; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .section-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 18px;
        }
        .section-explore {
          font-size: 13px;
          font-weight: 600;
          color: #6366f1;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .section-explore:hover { transform: translateX(4px); }

        .horizontal-slider {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 8px 4px 40px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          scroll-snap-type: x mandatory;
          scroll-padding: 20px;
        }
        .horizontal-slider::-webkit-scrollbar { display: none; }
        .slider-item { 
          scroll-snap-align: start; 
          flex-shrink: 0; 
          transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .slider-item:active { transform: scale(0.98); }

        /* Card Styles */
        .top-card {
          width: 280px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 22px;
          padding: 20px;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          text-decoration: none;
          display: block;
          position: relative;
          overflow: hidden;
        }
        .top-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .card-visual {
          width: 100%;
          height: 140px;
          border-radius: 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: rgba(0,0,0,0.2);
        }

        /* Activity Card overrides for slider */
        .slider-item .activity-card {
          width: 350px;
        }
        .card-title { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .card-info { font-size: 12px; color: #888; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        .card-host { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
        .host-img { width: 20px; height: 20px; border-radius: 50%; }
        .host-name { font-size: 11px; color: #aaa; font-weight: 500; }
        .badge-live { padding: 3px 8px; background: rgba(239, 68, 68, 0.15); color: #ef4444; font-size: 10px; font-weight: 700; border-radius: 6px; text-transform: uppercase; }
      `}</style>

      <div className="discover-page">
        {/* Header Section */}
        <div className="discover-hero">
          <h1 className="discover-title">Discover</h1>
          <p className="discover-subtitle">Beyond your campus gates.</p>
        </div>

        {/* 🔎 Search Bar + Floating Results */}
        <div className="search-container">
          <div className="search-input-wrap">
            <div className="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Search people by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => { if (search) setIsSearching(true); }}
              onBlur={() => setTimeout(() => setIsSearching(false), 200)}
            />
            {search && (
              <div className="search-clear" onClick={() => { setSearch(""); setSearchSuggestions([]); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {(search.trim() && (isSearching || searchSuggestions.length > 0)) && (
            <div className="search-dropdown">
              {isSearching && searchSuggestions.length === 0 ? (
                <div className="search-loading">Searching Loomus...</div>
              ) : searchSuggestions.length > 0 ? (
                searchSuggestions.map((user: User) => (
                  <Link key={user.id} href={`/profile/${user.username}`} className="suggestion-item">
                    <img src={getAvatar(user.profile_pic, user.name)} alt="" className="sug-avatar" />
                    <div>
                      <div className="sug-name">{user.name}</div>
                      <div className="sug-user">@{user.username}</div>
                      <div className="sug-meta">
                        {user.college}{user.year ? ` '${user.year.toString().slice(-2)}` : ""}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                !isSearching && <div className="search-loading">No users found for "{search}"</div>
              )}
            </div>
          )}
        </div>

        {/* --- 👤 RECOMMENDED USERS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">✨ SUGGESTED FOR YOU</h2>
            <Link href="/discover/people" className="section-explore">See More →</Link>
          </div>
          <div className="horizontal-slider">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="slider-item" style={{ width: 300, height: 280, background: "#111", borderRadius: 20, opacity: 0.3 }} />)
            ) : recommendedUsers.length > 0 ? (
              recommendedUsers.map((user: User, idx: number) => (
                <div key={user.id} className="slider-item">
                  <UserCard user={user} index={idx} />
                </div>
              ))
            ) : (
              <div
                className="slider-item"
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 0",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 24,
                  border: "1px dashed rgba(255,255,255,0.05)"
                }}
              >
                <div style={{
                  width: 48, height: 48,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  fontSize: 24
                }}>
                  ✓
                </div>
                <h3 style={{ color: "#eee", fontSize: 18, fontWeight: 700, margin: 0 }}>You're all caught up!</h3>
                <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>No more people to recommend right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- 🔥 HOT EVENTS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon" style={{ background: "rgba(244, 114, 182, 0.15)", color: "#f472b6" }}>🔥</div>
              HOT EVENTS
            </h2>
            <Link href="/activities" className="section-explore">Collection →</Link>
          </div>
          <div className="horizontal-slider">
            {topEvents.map((evt: TopEvent) => (
              <div key={evt.id} className="slider-item">
                <ActivityCard activity={evt as any} onRsvpChange={handleEventRsvpChange} />
              </div>
            ))}
          </div>
        </div>

        {/* --- 🎮 PLAY --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399" }}>🎮</div>
              PLAY
            </h2>
            <Link href="/play" className="section-explore">Play More →</Link>
          </div>
          <div className="horizontal-slider">
            {topGames.map((game: TopGame) => (
              <div key={game.id} className="slider-item">
                <Link href={`/play/${game.id}`} className="top-card" style={{ borderBottom: "4px solid rgba(52, 211, 153, 0.3)" }}>
                  <div className="card-visual" style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)" }}>
                    <span className="badge-live">{game.game_type}</span>
                    <div style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 8px", background: "rgba(0,0,0,0.6)", borderRadius: "8px", fontSize: "10px", color: "#34d399", fontWeight: 700 }}>LIVE</div>
                  </div>
                  <div className="card-title">{game.name}</div>
                  <div className="card-info" style={{ color: "#34d399" }}>● {game.player_count} playing</div>
                  <div className="card-host">
                    <img src={getAvatar(game.host_pic, game.host_name)} className="host-img" alt="" />
                    <span className="host-name">Host: {game.host_name}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* --- 🎧 ROOMS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>🎧</div>
              ROOMS
            </h2>
            <Link href="/rooms" className="section-explore">All Rooms →</Link>
          </div>
          <div className="horizontal-slider">
            {topRooms.map((room: TopRoom) => (
              <div key={room.id} className="slider-item">
                <Link href={`/rooms/${room.id}`} className="top-card" style={{ borderBottom: "4px solid rgba(129, 140, 248, 0.3)" }}>
                  <div className="card-visual" style={{ background: "linear-gradient(135deg, #312e81 0%, #3730a3 100%)" }}>
                    <span style={{ fontSize: 40, filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.3))" }}>
                      {room.type === 'WATCH PARTY' ? '📺' : '💬'}
                    </span>
                  </div>
                  <div className="card-title">{room.name}</div>
                  <div className="card-info" style={{ color: "#818cf8" }}>{room.member_count} members online</div>
                  <div className="card-host">
                    <img src={getAvatar(room.host_profile_pic, room.host_name)} className="host-img" alt="" />
                    <span className="host-name">Admin: {room.host_name}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
