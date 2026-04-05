"use client";

import { useEffect, useState, useCallback } from "react";
import UserCard from "@/components/UserCard";
import Link from "next/link";
import ActivityCard from "@/components/ActivityCard";
import NebulaBackground from "@/components/NebulaBackground";

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

  // --- Dynamic Subtitle Cycling ---
  const taglines = [
    "Your college life, woven together.",
    "Find your crowd. Play your part.",
    "Play. Watch. Connect. Belong"
  ];
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [visibleWordsCount, setVisibleWordsCount] = useState(0);
  const subtitleWords = taglines[taglineIndex].split(" ");

  useEffect(() => {
    // 1. Reveal words one by one
    if (visibleWordsCount < subtitleWords.length) {
      const timer = setTimeout(() => {
        setVisibleWordsCount(prev => prev + 1);
      }, 180);
      return () => clearTimeout(timer);
    }

    // 2. Lingering pause, then cycle back
    const cycleTimer = setTimeout(() => {
      setVisibleWordsCount(0);
      setTaglineIndex(prev => (prev + 1) % taglines.length);
    }, 4500); // 4.5 second pause before next tagline

    return () => clearTimeout(cycleTimer);
  }, [visibleWordsCount, taglineIndex, subtitleWords.length]);

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

        // 1. Fetch Recommended Users
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
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground variant="discover" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .discover-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 100px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .discover-hero {
          text-align: center;
          margin-bottom: 64px;
        }
        .discover-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(40px, 8vw, 76px);
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.045em;
          line-height: 1.1;
          filter: drop-shadow(0 0 30px rgba(99, 102, 241, 0.15));
        }
        .discover-subtitle {
          color: #888;
          font-size: 17px;
          margin-top: 14px;
          min-height: 26px;
          font-weight: 500;
          letter-spacing: 0.04em;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
        }
        .word {
          opacity: 0;
          transform: translateY(4px);
          animation: wordFadeIn 0.4s forwards cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes wordFadeIn {
          to { opacity: 1; transform: translateY(0); }
        }
        .cursor {
          width: 2px;
          height: 1.25em;
          background-color: #6366f1;
          display: inline-block;
          animation: blink 0.8s infinite;
          margin-left: -2px;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* 🔎 Search Component */
        .search-container {
          position: relative;
          max-width: 650px;
          margin: 0 auto 80px;
          z-index: 100;
        }
        .search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 18px 24px 18px 60px;
          border-radius: 24px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          outline: none;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .search-input:focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 15px 50px rgba(99, 102, 241, 0.15);
          transform: translateY(-2px);
        }
        .search-icon {
          position: absolute;
          left: 20px;
          color: #666;
          pointer-events: none;
        }
        .search-clear {
          position: absolute;
          right: 20px;
          color: #666;
          cursor: pointer;
          transition: 0.2s;
        }
        .search-clear:hover { color: #fff; }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 14px);
          left: 0; right: 0;
          background: rgba(13, 13, 17, 0.85);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.7);
          overflow: hidden;
          animation: dropSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes dropSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          text-decoration: none;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .suggestion-item:hover { background: rgba(255,255,255,0.05); }

        /* Discovery Sections */
        .discover-section { margin-top: 72px; position: relative; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 0;
          letter-spacing: -0.03em;
        }

        .section-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 18px;
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .section-explore {
          font-size: 14px;
          font-weight: 700;
          color: #818cf8;
          text-decoration: none;
          padding: 6px 14px;
          border-radius: 99px;
          background: rgba(99, 102, 241, 0.05);
          transition: 0.3s;
        }
        .section-explore:hover { 
          transform: translateX(6px); 
          background: rgba(99, 102, 241, 0.15);
          color: #fff;
        }

        .horizontal-slider {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          overflow-y: visible;
          padding: 10px 4px 44px;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
        }
        .horizontal-slider::-webkit-scrollbar { display: none; }
        .slider-item { scroll-snap-align: start; flex-shrink: 0; transition: transform 0.4s; }
        .slider-item:hover { transform: translateY(-8px); }

        /* Card Stylings */
        .top-card {
          width: 290px;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 22px;
          text-decoration: none;
          display: block;
          transition: 0.4s;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
        }
        .top-card:hover { border-color: rgba(99, 102, 241, 0.4); background: rgba(255,255,255,0.05); }

        .card-visual {
          width: 100%;
          height: 150px;
          border-radius: 16px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }
        .card-title { font-size: 17px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .card-info { font-size: 13px; color: #888; display: flex; align-items: center; gap: 8px; }

        /* ✅ Restored Premium Caught Up Card */
        .caught-up-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(15px);
          border-radius: 32px;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          text-align: center;
        }
        .check-circle {
          width: 56px; height: 56px;
          borderRadius: 50%;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin-bottom: 20px;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
        }
      `}</style>

      <div className="discover-page">
        {/* Header Section */}
        <div className="discover-hero">
          <h1 className="discover-title">Discover</h1>
          <p className="discover-subtitle">
            {subtitleWords.slice(0, visibleWordsCount).map((word, i) => (
              <span key={`${taglineIndex}-${i}`} className="word">{word}</span>
            ))}
            <span className="cursor" />
          </p>
        </div>

        {/* 🔎 Search Bar + Floating Results */}
        <div className="search-container">
          <div className="search-input-wrap">
            <div className="search-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 13 }}>Searching Loomus...</div>
              ) : searchSuggestions.length > 0 ? (
                searchSuggestions.map((user: User) => (
                  <Link key={user.id} href={`/profile/${user.username}`} className="suggestion-item">
                    <img src={getAvatar(user.profile_pic, user.name)} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>@{user.username}</div>
                      <div style={{ fontSize: 11, color: "#6366f1" }}>{user.college}</div>
                    </div>
                  </Link>
                ))
              ) : (
                !isSearching && <div style={{ padding: 20, textAlign: "center", color: "#666", fontSize: 13 }}>No users found for "{search}"</div>
              )}
            </div>
          )}
        </div>

        {/* --- 👤 RECOMMENDED USERS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">✨ Suggestions For You</h2>
            <Link href="/discover/people" className="section-explore">See More →</Link>
          </div>
          <div className="horizontal-slider">
            {loading ? (
              Array(4).fill(0).map((_, i) => <div key={i} className="slider-item" style={{ width: 290, height: 280, background: "#111", borderRadius: 24, opacity: 0.3 }} />)
            ) : recommendedUsers.length > 0 ? (
              recommendedUsers.map((user: User, idx: number) => (
                <div key={user.id} className="slider-item">
                  <UserCard user={user} index={idx} />
                </div>
              ))
            ) : (
              <div className="caught-up-card">
                <div className="check-circle">✓</div>
                <h3 style={{ color: "#eee", fontSize: 19, fontWeight: 700, margin: 0 }}>You're all caught up!</h3>
                <p style={{ color: "#666", fontSize: 14, marginTop: 8 }}>No more people to recommend right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- 🔥 HOT EVENTS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon" style={{ background: "rgba(244, 114, 182, 0.1)", color: "#f472b6" }}>🔥</div>
              Hot Events
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
              <div className="section-icon" style={{ background: "rgba(52, 211, 153, 0.1)", color: "#34d399" }}>🎮</div>
              Play
            </h2>
            <Link href="/play" className="section-explore">Play More →</Link>
          </div>
          <div className="horizontal-slider">
            {[
              { id: "roulette", name: "DM Roulette", emoji: "🎰", color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", tag: "Talk for 24h", ready: true },
              { id: "crush", name: "Secret Crush", emoji: "💘", color: "#ec4899", gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)", tag: "Match friends", ready: true },
              { id: "guess-the-lie", name: "Guess the Lie", emoji: "🤥", color: "#06b6d4", gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", tag: "2 truths, 1 lie", ready: true },
              { id: "mafia", name: "Mafia", emoji: "🔫", color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", tag: "Coming Soon", ready: false }
            ].map((game) => (
              <div key={game.id} className="slider-item">
                <Link 
                  href={game.ready ? `/play/${game.id}` : "#"} 
                  className={`top-card ${!game.ready ? 'disabled' : ''}`}
                  style={{ 
                    borderBottom: `4px solid ${game.color}`,
                    opacity: game.ready ? 1 : 0.6,
                    cursor: game.ready ? "pointer" : "default"
                  }}
                  onClick={(e) => { if (!game.ready) e.preventDefault(); }}
                >
                  <div className="card-visual" style={{ background: game.gradient }}>
                    <span style={{ fontSize: 44 }}>{game.emoji}</span>
                    <div style={{ position: "absolute", bottom: 10, right: 10, padding: "3px 8px", background: "rgba(0,0,0,0.6)", borderRadius: "6px", fontSize: "10px", color: "#fff", fontWeight: 800 }}>
                      {game.ready ? 'GAMES' : 'SOON'}
                    </div>
                  </div>
                  <div className="card-title">{game.name}</div>
                  <div className="card-info" style={{ color: game.color }}>{game.tag}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* --- 🎧 ROOMS --- */}
        <div className="discover-section">
          <div className="section-header">
            <h2 className="section-title">
              <div className="section-icon" style={{ background: "rgba(99, 102, 241, 0.1)", color: "#818cf8" }}>🎧</div>
              Rooms
            </h2>
            <Link href="/rooms" className="section-explore">All Rooms →</Link>
          </div>
          <div className="horizontal-slider">
            {topRooms.map((room: TopRoom) => (
              <div key={room.id} className="slider-item">
                <Link href={`/rooms/${room.id}`} className="top-card" style={{ borderBottom: "4px solid rgba(129, 140, 248, 0.3)" }}>
                  <div className="card-visual" style={{ background: "linear-gradient(135deg, #312e81 0%, #3730a3 100%)" }}>
                    <span style={{ fontSize: 42 }}>{room.type === 'WATCH PARTY' ? '📺' : '💬'}</span>
                  </div>
                  <div className="card-title">{room.name}</div>
                  <div className="card-info" style={{ color: "#818cf8" }}>{room.member_count} online</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
