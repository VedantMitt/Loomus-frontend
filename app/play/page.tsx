"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NebulaBackground from "@/components/NebulaBackground";

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
      description: "Roles, rounds, votes & deceit. Who's the mafia? Coming soon to Loomus.",
      color: "#ef4444",
      shadowColor: "rgba(239, 68, 68, 0.25)",
      gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
      href: "#",
      ready: false,
    },
  ];

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <NebulaBackground variant="play" />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .play-container {
          font-family: 'DM Sans', sans-serif;
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 24px 100px;
          position: relative;
          z-index: 10;
        }

        .play-hero {
          text-align: center;
          margin-bottom: 64px;
        }

        .play-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(40px, 10vw, 64px);
          font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #f59e0b 30%, #ec4899 60%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          animation: shimmerTitle 6s ease infinite;
          background-size: 200% 200%;
          letter-spacing: -0.05em;
        }

        @keyframes shimmerTitle {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .play-subtitle {
          color: #888;
          font-size: 18px;
          margin-top: 16px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }

        @media (max-width: 768px) {
          .games-grid { grid-template-columns: 1fr; }
        }

        .game-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          padding: 40px;
          text-decoration: none;
          color: inherit;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
        }

        .game-card:hover {
          transform: translateY(-8px);
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }

        .game-card.disabled {
          opacity: 0.5;
          cursor: not-allowed; filter: grayscale(0.8);
        }

        .game-emoji {
          font-size: 56px;
          line-height: 1;
        }

        .coming-soon-badge {
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: rgba(255, 255, 255, 0.05);
          color: #666;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .game-name {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .game-tagline {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          line-height: 1.4;
        }

        .game-desc {
          font-size: 14px;
          color: #999;
          margin: 0;
          line-height: 1.6;
        }

        .game-play-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 18px;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          border: none;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          width: fit-content;
        }

        .game-play-btn:hover {
          transform: scale(1.05);
        }

        .game-glow {
          position: absolute;
          top: -20%;
          left: -20%;
          width: 140%;
          height: 140%;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.6s ease;
          pointer-events: none;
          filter: blur(80px);
          z-index: -1;
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
            >
              <div className="game-glow" style={{ background: game.color }} />

              <div className="game-header">
                <div className="game-emoji">{game.emoji}</div>
                {!game.ready && <span className="coming-soon-badge">Coming Soon</span>}
              </div>

              <div>
                <h2 className="game-name">{game.name}</h2>
                <p className="game-tagline" style={{ color: game.color }}>{game.tagline}</p>
              </div>
              
              <p className="game-desc">{game.description}</p>

              {game.ready && (
                <div
                  className="game-play-btn"
                  style={{ background: game.gradient, boxShadow: `0 8px 30px ${game.shadowColor}` }}
                >
                  Play Now
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
