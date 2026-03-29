"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayHub() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, [router]);

  const games = [
    {
      id: "roulette",
      name: "DM Roulette",
      emoji: "🎰",
      tagline: "Get randomly paired. Talk for 24 hours.",
      description: "Join a pool, set your preferences, and spin! You'll be randomly paired with someone to chat.",
      color: "#f59e0b",
      shadowColor: "rgba(245, 158, 11, 0.25)",
      gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      href: "/play/roulette",
      ready: true,
    },
    {
      id: "crush",
      name: "Secret Crush",
      emoji: "💘",
      tagline: "Crush anonymously. Match if mutual.",
      description: "Select your crush from friends — they won't know. But if they crush you back... it's a match!",
      color: "#ec4899",
      shadowColor: "rgba(236, 72, 153, 0.25)",
      gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
      href: "/play/crush",
      ready: true,
    },
    {
      id: "gtl",
      name: "Guess the Lie",
      emoji: "🤥",
      tagline: "2 truths, 1 lie. Can they guess?",
      description: "Say 3 statements — 2 true, 1 lie. Others vote on which one is the lie. Host public or private parties!",
      color: "#06b6d4",
      shadowColor: "rgba(6, 182, 212, 0.25)",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      href: "/play/guess-the-lie",
      ready: true,
    },
    {
      id: "mafia",
      name: "Mafia",
      emoji: "🔫",
      tagline: "The classic social deduction game.",
      description: "Roles, rounds, votes & deceit. Who's the mafia? Coming soon to CampusConnect.",
      color: "#ef4444",
      shadowColor: "rgba(239, 68, 68, 0.25)",
      gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
      href: "#",
      ready: false,
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .play-container {
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .play-hero {
          text-align: center;
          margin-bottom: 56px;
        }

        .play-title {
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #f59e0b 30%, #ec4899 60%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          animation: shimmerTitle 4s ease infinite;
          background-size: 200% 200%;
        }

        @keyframes shimmerTitle {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .play-subtitle {
          color: #666;
          font-size: 16px;
          margin-top: 12px;
          font-weight: 500;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        @media (max-width: 768px) {
          .games-grid { grid-template-columns: 1fr; }
          .play-title { font-size: 36px; }
        }

        .game-card {
          position: relative;
          background: rgba(20, 20, 20, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 24px;
          padding: 32px;
          text-decoration: none;
          color: inherit;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 16px;
          cursor: pointer;
        }

        .game-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 24px 24px 0 0;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .game-card:hover::before {
          opacity: 1;
        }

        .game-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .game-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .game-card.disabled:hover {
          transform: none;
          border-color: rgba(255, 255, 255, 0.06);
        }

        .game-emoji {
          font-size: 48px;
          line-height: 1;
          filter: saturate(1.2);
        }

        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .coming-soon-badge {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(255, 255, 255, 0.06);
          color: #888;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .game-name {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #fff;
          margin: 0;
        }

        .game-tagline {
          font-size: 15px;
          font-weight: 600;
          margin: 0;
          line-height: 1.3;
        }

        .game-desc {
          font-size: 14px;
          color: #888;
          margin: 0;
          line-height: 1.6;
        }

        .game-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          border: none;
          cursor: pointer;
          margin-top: auto;
          transition: all 0.3s ease;
          width: fit-content;
        }

        .game-play-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        .game-play-btn svg {
          transition: transform 0.3s ease;
        }
        .game-card:hover .game-play-btn svg {
          transform: translateX(3px);
        }

        .game-glow {
          position: absolute;
          bottom: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          filter: blur(80px);
        }

        .game-card:hover .game-glow {
          opacity: 0.15;
        }
      `}</style>

      <main className="play-container">
        <div className="play-hero">
          <h1 className="play-title">Play</h1>
          <p className="play-subtitle">Mini games to break the ice and make campus fun 🎲</p>
        </div>

        <div className="games-grid">
          {games.map((game) => (
            <Link
              key={game.id}
              href={game.ready ? game.href : "#"}
              className={`game-card ${!game.ready ? "disabled" : ""}`}
              onClick={(e) => { if (!game.ready) e.preventDefault(); }}
              style={{ ["--game-color" as any]: game.color }}
            >
              <div className="game-glow" style={{ background: game.color }} />
              <div style={{ background: game.gradient }} className="game-card-before-hack" />
              <style>{`
                .game-card[style*="${game.color}"]::before { background: ${game.gradient}; }
              `}</style>

              <div className="game-header">
                <div className="game-emoji">{game.emoji}</div>
                {!game.ready && <span className="coming-soon-badge">Coming Soon</span>}
              </div>

              <h2 className="game-name">{game.name}</h2>
              <p className="game-tagline" style={{ color: game.color }}>{game.tagline}</p>
              <p className="game-desc">{game.description}</p>

              {game.ready && (
                <button
                  className="game-play-btn"
                  style={{ background: game.gradient, boxShadow: `0 4px 20px ${game.shadowColor}` }}
                >
                  Play Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              )}
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
