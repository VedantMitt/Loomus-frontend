"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NebulaBackground from "@/components/NebulaBackground";

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
  participant_previews?: { name: string; profile_pic: string }[] | null;
  max_participants?: number;
  host_id?: string;
  mode?: string;
  is_free?: boolean;
  price?: number;
};

const EXPERIENCE_CATEGORIES = [
  {
    key: "bowling",
    label: "Bowling",
    emoji: "🎳",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    vibe: "Competitive & fun",
    aiSuggestion: "Book lanes at a nearby bowling alley. Split into teams, play 3 rounds, loser buys snacks. Perfect for groups of 4-8.",
  },
  {
    key: "golf",
    label: "Golf",
    emoji: "⛳",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    vibe: "Chill & classy",
    aiSuggestion: "Mini golf or driving range session. Great for casual hangs. No skill needed. Grab smoothies after.",
  },
  {
    key: "pickleball",
    label: "Pickleball",
    emoji: "🏓",
    gradient: "linear-gradient(135deg, #F09819 0%, #EDDE5D 100%)",
    vibe: "Active & energetic",
    aiSuggestion: "Book a court for 2 hours. Doubles tournament style. Bring water bottles. Winner gets bragging rights forever.",
  },
  {
    key: "clubbing",
    label: "Clubbing",
    emoji: "🎶",
    gradient: "linear-gradient(135deg, #e040fb 0%, #7c4dff 100%)",
    vibe: "Wild & spontaneous",
    aiSuggestion: "Pre-game at someone's place. Hit the club by 11. Set a budget. Designate a navigator. Dance like nobody's watching.",
  },
  {
    key: "cafe_hopping",
    label: "Café Hopping",
    emoji: "☕",
    gradient: "linear-gradient(135deg, #D4A373 0%, #FAEDCD 100%)",
    vibe: "Cozy & aesthetic",
    aiSuggestion: "Pick 3-4 cafés in one area. Try a different drink at each. Rate them. Find your new favourite spot. Take aesthetic photos.",
  },
  {
    key: "movie",
    label: "Movie",
    emoji: "🎬",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #e94560 100%)",
    vibe: "Relaxed & cinematic",
    aiSuggestion: "Pick the movie together. Book seats in the last row. Sneak in snacks (or don't 😂). Post-movie dinner to discuss plot holes.",
  },
  {
    key: "trip",
    label: "Trip",
    emoji: "🧳",
    gradient: "linear-gradient(135deg, #0575E6 0%, #021B79 100%)",
    vibe: "Adventure & memories",
    aiSuggestion: "Pick a destination within 4-6 hours. Split costs equally. Make a shared playlist. Assign roles: navigator, DJ, photographer, snack manager.",
  },
  {
    key: "road_trip",
    label: "Road Trip",
    emoji: "🚗",
    gradient: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    vibe: "Freedom & vibes",
    aiSuggestion: "Midnight drive or sunrise chase. Pick a route with scenic stops. Fuel up the car. Aux cord rules: driver picks first song. Stop at every dhaba.",
  },
  {
    key: "city_exploration",
    label: "City Exploration",
    emoji: "🏙️",
    gradient: "linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)",
    vibe: "Curious & spontaneous",
    aiSuggestion: "Pick an area you've never been to. Walk around with no plan. Try street food. Talk to locals. Document everything. Get lost on purpose.",
  },
  {
    key: "explore_spot",
    label: "Explore a Spot",
    emoji: "📍",
    gradient: "linear-gradient(135deg, #00b09b 0%, #96c93d 100%)",
    vibe: "Discover & wander",
    aiSuggestion: "Explore a hidden gem. Eat local food, visit shops, find street art. Take candid photos. Make it a chapter worth remembering.",
  },
  {
    key: "gaming",
    label: "Gaming Night",
    emoji: "🎮",
    gradient: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
    vibe: "Competitive & loud",
    aiSuggestion: "Pick the game: Valorant, FIFA, Mario Kart, or board games. Set up a tournament bracket. Loser does a dare. Stream it in a Room.",
  },
  {
    key: "watch_party",
    label: "Watch Party",
    emoji: "📺",
    gradient: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
    vibe: "Cozy & connected",
    aiSuggestion: "Pick a series or movie. Sync up on a Room. React together in real time. Bring blankets and snacks. The best kind of lazy plan.",
  },
  {
    key: "study_session",
    label: "Study Session",
    emoji: "📖",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
    vibe: "Productive & focused",
    aiSuggestion: "Pick a café or library. Set pomodoro timers. No phones for 25 mins. Break together. Accountability partners make all the difference.",
  },
  {
    key: "food_walk",
    label: "Food Walk",
    emoji: "🍜",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    vibe: "Hungry & adventurous",
    aiSuggestion: "Pick a food street. Try 5 different things. Rate each one. Split the bill. Find the best momos in Delhi. Document the journey.",
  },
  {
    key: "workout",
    label: "Workout",
    emoji: "💪",
    gradient: "linear-gradient(135deg, #434343 0%, #000000 100%)",
    vibe: "Grind & discipline",
    aiSuggestion: "Gym session or outdoor run. Push each other. Spot each other. Post-workout protein shake. Consistency > motivation.",
  },
  {
    key: "concert",
    label: "Concert / Gig",
    emoji: "🎤",
    gradient: "linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)",
    vibe: "Electric & alive",
    aiSuggestion: "Find a live gig or open mic. Get there early for good spots. Sing along. Record clips for the chapter. Feel the bass in your chest.",
  },
];

const TOP_LIVE_EVENTS = [
  {
    id: "live_1",
    title: "Karan Aujla Concert",
    location: "JLN Stadium, Delhi",
    time: "Starting in 30 mins",
    type: "Concert",
    image: "https://images.unsplash.com/photo-1540039155733-d7696d4eb959?w=600&h=400&fit=crop",
    gradient: "rgba(255, 65, 108, 0.4)",
  },
  {
    id: "live_2",
    title: "Standup Comedy Open Mic",
    location: "Hauz Khas Social",
    time: "Live Now",
    type: "Comedy",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop",
    gradient: "rgba(17, 153, 142, 0.4)",
  },
  {
    id: "live_3",
    title: "Street Dance Battle",
    location: "Connaught Place",
    time: "8:00 PM",
    type: "Dance",
    image: "https://images.unsplash.com/photo-1535592201833-53b47814b7e8?w=600&h=400&fit=crop",
    gradient: "rgba(142, 45, 226, 0.4)",
  },
  {
    id: "live_4",
    title: "Midnight Run Fest",
    location: "India Gate",
    time: "11:30 PM",
    type: "Fitness",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop",
    gradient: "rgba(0, 210, 255, 0.4)",
  },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"discover" | "my_plans">("discover");
  const [myPlans, setMyPlans] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [topEvents, setTopEvents] = useState(TOP_LIVE_EVENTS);

  useEffect(() => {
    const fetchHotEvents = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/ai/hot-events`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setTopEvents(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch AI hot events", err);
      }
    };
    fetchHotEvents();
  }, []);

  const fetchMyPlans = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoading(true);
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/activities?tab=my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyPlans(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "my_plans") fetchMyPlans();
  }, [activeTab, fetchMyPlans]);

  const handleCategoryClick = (categoryKey: string) => {
    router.push(`/activities/create?type=${categoryKey}`);
  };

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <NebulaBackground variant="discover" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .exp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: calc(60px + env(safe-area-inset-top, 0px)) 24px 120px;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          z-index: 10;
        }

        .exp-hero {
          position: relative;
          text-align: center;
          margin-bottom: 48px;
          padding-top: 24px;
        }
        .exp-hero::before {
          content: '';
          position: absolute;
          top: 0%; left: 50%;
          transform: translate(-50%, -40%);
          width: 80vw;
          height: 250px;
          background: radial-gradient(circle, rgba(192,132,252,0.2) 0%, rgba(244,114,182,0.15) 30%, transparent 70%);
          filter: blur(40px);
          z-index: -1;
          pointer-events: none;
        }

        .exp-title {
          font-family: 'Syne', sans-serif;
          font-size: 52px;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 0%, #c084fc 40%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .exp-subtitle {
          color: #a8a29e;
          font-size: 18px;
          margin-top: 16px;
          font-weight: 500;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .exp-tabs {
          display: flex;
          gap: 4px;
          justify-content: center;
          margin-bottom: 32px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 4px;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
        }

        .exp-tab {
          flex: 1;
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          background: transparent;
          color: #666;
          font-family: 'DM Sans', sans-serif;
        }
        .exp-tab.active {
          background: rgba(255,255,255,0.08);
          color: #fff;
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }

        /* HORIZONTAL SCROLL CONTAINERS */
        .live-scroll, .vibe-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 24px;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .live-scroll::-webkit-scrollbar, .vibe-scroll::-webkit-scrollbar {
          display: none;
        }

        /* BLEED EFFECT FOR MOBILE */
        @media (max-width: 640px) {
          .live-scroll, .vibe-scroll {
            margin-right: -16px; 
            padding-right: 16px;
          }
        }

        /* LIVE CARDS */
        .live-card {
          flex: 0 0 320px;
          scroll-snap-align: start;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          aspect-ratio: 16/10;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        @media (max-width: 640px) {
          .live-card { flex: 0 0 82%; aspect-ratio: 16/11; }
        }
        .live-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 0;
          transition: transform 0.5s;
        }
        .live-card:hover .live-img { transform: scale(1.05); }
        .live-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .live-content {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
        }
        .live-badge {
          position: absolute;
          top: 16px; left: 16px;
          background: rgba(239, 68, 68, 0.9);
          backdrop-filter: blur(8px);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
        .live-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #fff;
          animation: exp-pulse 1.5s infinite;
        }
        .live-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin: 0 0 6px; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .live-meta { display: flex; gap: 12px; font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500; }
        .live-meta span { display: flex; align-items: center; gap: 4px; }

        /* VIBE CARDS */
        .vibe-card-wrapper {
          flex: 0 0 280px;
          scroll-snap-align: start;
        }
        @media (max-width: 640px) {
          .vibe-card-wrapper { flex: 0 0 65%; }
        }

        .exp-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255,255,255,0.06);
          aspect-ratio: 4/3.5;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
          height: 100%;
        }
        .exp-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
        }
        .exp-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.85) 100%);
          z-index: 1;
        }

        .exp-card-emoji {
          font-size: 48px;
          position: absolute;
          top: 20px;
          right: 20px;
          z-index: 2;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
          transition: all 0.3s;
        }
        .exp-card:hover .exp-card-emoji {
          transform: scale(1.2) rotate(-5deg);
        }

        .exp-card-content {
          position: relative;
          z-index: 2;
        }

        .exp-card-label {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .exp-card-vibe {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }

        .exp-card-ai {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.3s;
        }
        .exp-card:hover .exp-card-ai {
          opacity: 1;
          transform: translateY(0);
        }

        .exp-card-arrow {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s;
        }
        .exp-card:hover .exp-card-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* My Plans styles */
        .plan-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 20px;
          transition: all 0.3s;
          cursor: pointer;
          text-decoration: none;
          display: block;
        }
        .plan-card:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.12);
          transform: translateY(-2px);
        }
        .plan-title {
          font-size: 17px;
          font-weight: 700;
          color: #f0f0f0;
          margin: 0 0 8px;
        }
        .plan-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }
        .plan-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .plan-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .plan-people {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
        }
        .plan-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid rgba(10,10,10,1);
          margin-left: -6px;
          object-fit: cover;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
        }
        .plan-avatar:first-child { margin-left: 0; }
        .plan-count {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }

        .exp-empty {
          text-align: center;
          padding: 80px 20px;
          color: #555;
        }
        .exp-empty-emoji {
          font-size: 48px;
          margin-bottom: 16px;
        }
        .exp-empty-text {
          font-size: 16px;
          margin-bottom: 24px;
        }
        .exp-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          border-radius: 14px;
          background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
        }
        .exp-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(192, 132, 252, 0.3);
        }

        .exp-skeleton {
          background: rgba(255,255,255,0.03);
          border-radius: 20px;
          aspect-ratio: 4/3;
          border: 1px solid rgba(255,255,255,0.06);
          animation: exp-pulse 1.5s infinite;
        }
        @keyframes exp-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

        .exp-section-label {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
          padding-left: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .exp-section-label .glow-icon {
          color: #f472b6;
          filter: drop-shadow(0 0 8px rgba(244, 114, 182, 0.6));
        }

        @media (max-width: 640px) {
          .exp-container { padding: calc(32px + env(safe-area-inset-top, 0px)) 16px 120px; }
          .exp-title { font-size: 32px; }
          .exp-subtitle { font-size: 15px; }
          .exp-card { padding: 16px; aspect-ratio: 4/4; }
          .exp-card-emoji { font-size: 32px; top: 12px; right: 12px; }
          .exp-card-label { font-size: 16px; }
          .exp-card-ai { display: none; }
        }
      `}</style>

      <main className="exp-container">
        <div className="exp-hero">
          <h1 className="exp-title">What are we doing today?</h1>
          <p className="exp-subtitle">
            Pick an experience. Plan it. Live it. Remember it forever. ✨
          </p>
        </div>

        <div className="exp-tabs">
          <button
            className={`exp-tab ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            ✨ Start a Plan
          </button>
          <button
            className={`exp-tab ${activeTab === "my_plans" ? "active" : ""}`}
            onClick={() => setActiveTab("my_plans")}
          >
            📋 My Plans
          </button>
        </div>

        {activeTab === "discover" && (
          <>
            <div className="exp-section-label">
              <span className="glow-icon">🔥</span> Top Live Events
            </div>
            
            <div className="live-scroll">
              {topEvents.map((event) => (
                <div key={event.id} className="live-card">
                  <img src={event.image} alt={event.title} className="live-img" />
                  <div 
                    className="live-overlay" 
                    style={{ background: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, ${event.gradient} 60%, transparent 100%)` }} 
                  />
                  <div className="live-badge">
                    <div className="live-badge-dot" /> LIVE
                  </div>
                  <div className="live-content">
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', width: 'max-content', marginBottom: '8px' }}>
                      {event.type}
                    </div>
                    <h3 className="live-title">{event.title}</h3>
                    <div className="live-meta">
                      <span>📍 {event.location}</span>
                      <span>⏰ {event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="exp-section-label" style={{ marginTop: 24 }}>
              <span>✨</span> Pick your vibe
            </div>
            <div className="vibe-scroll">
              {EXPERIENCE_CATEGORIES.map((cat) => (
                <div key={cat.key} className="vibe-card-wrapper">
                  <div
                    className="exp-card"
                    style={{ background: cat.gradient }}
                    onClick={() => handleCategoryClick(cat.key)}
                    onMouseEnter={() => setHoveredCard(cat.key)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="exp-card-emoji">{cat.emoji}</div>
                    <div className="exp-card-content">
                      <h3 className="exp-card-label">{cat.label}</h3>
                      <div className="exp-card-vibe">{cat.vibe}</div>
                      <div className="exp-card-ai">{cat.aiSuggestion}</div>
                    </div>
                    <div className="exp-card-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "my_plans" && (
          <>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[...Array(6)].map((_, i) => <div key={i} className="exp-skeleton" style={{ width: '100%', aspectRatio: '16/4' }} />)}
              </div>
            ) : myPlans.length === 0 ? (
              <div className="exp-empty">
                <div className="exp-empty-emoji">🌙</div>
                <div className="exp-empty-text">No plans yet. Start one!</div>
                <button className="exp-empty-btn" onClick={() => setActiveTab("discover")}>
                  ✨ Create a Plan
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myPlans.map((plan) => {
                  const d = new Date(plan.date);
                  const now = new Date();
                  const isLive = d.getTime() <= now.getTime() && d.getTime() > now.getTime() - 24 * 60 * 60 * 1000;
                  const isUpcoming = d > now;
                  const previews = plan.participant_previews || [];

                  return (
                    <Link
                      key={plan.id}
                      href={`/activities/${plan.id}`}
                      className="plan-card"
                    >
                      {isLive && (
                        <div className="plan-status" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#ef4444", animation: "exp-pulse 1.5s infinite" }} />
                          Live Now
                        </div>
                      )}
                      {isUpcoming && (
                        <div className="plan-status" style={{ background: "rgba(192,132,252,0.1)", color: "#c084fc" }}>
                          Upcoming
                        </div>
                      )}
                      {!isLive && !isUpcoming && (
                        <div className="plan-status" style={{ background: "rgba(255,255,255,0.05)", color: "#555" }}>
                          Past
                        </div>
                      )}

                      <div className="plan-title">{plan.title}</div>
                      <div className="plan-meta">
                        <span className="plan-meta-item">📍 {plan.location}</span>
                        <span className="plan-meta-item">
                          📅 {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        <span className="plan-meta-item">
                          🕐 {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                        </span>
                      </div>

                      <div className="plan-people">
                        {previews.slice(0, 4).map((p, i) => {
                          const src = p.profile_pic
                            ? p.profile_pic.startsWith("/uploads")
                              ? `${API}${p.profile_pic}`
                              : p.profile_pic
                            : null;
                          return src ? (
                            <img key={i} src={src} alt="" className="plan-avatar" />
                          ) : (
                            <div key={i} className="plan-avatar">{p.name?.charAt(0)}</div>
                          );
                        })}
                        {Number(plan.going_count) > 0 && (
                          <span className="plan-count">{plan.going_count} going</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}