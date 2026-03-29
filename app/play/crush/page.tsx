"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  name: string;
  username: string;
  profile_pic?: string;
};

type Crush = {
  id: string;
  crush_id: string;
  name: string;
  username: string;
  profile_pic?: string;
  is_matched: boolean;
  matched_at?: string;
  created_at: string;
};

type Match = {
  id: string;
  match_id: string;
  name: string;
  username: string;
  profile_pic?: string;
  matched_at: string;
};

export default function CrushPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [crushes, setCrushes] = useState<Crush[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pick" | "crushes" | "matches">("pick");
  const [matchAnimation, setMatchAnimation] = useState<string | null>(null);
  const [sendingCrush, setSendingCrush] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchCrushes(), fetchMatches()]);
    setLoading(false);
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API}/friends`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setFriends(await res.json());
    } catch {}
  };

  const fetchCrushes = async () => {
    try {
      const res = await fetch(`${API}/play/crush/my-crushes`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setCrushes(await res.json());
    } catch {}
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch(`${API}/play/crush/matches`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setMatches(await res.json());
    } catch {}
  };

  const handleCrush = async (friendId: string) => {
    setSendingCrush(friendId);
    try {
      const res = await fetch(`${API}/play/crush`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ crush_id: friendId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.matched) {
          setMatchAnimation(friendId);
          setTimeout(() => setMatchAnimation(null), 3000);
        }
        fetchCrushes();
        fetchMatches();
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) { console.error(err); }
    setSendingCrush(null);
  };

  const handleRemoveCrush = async (crushId: string) => {
    try {
      const res = await fetch(`${API}/play/crush/${crushId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) { fetchCrushes(); fetchMatches(); }
    } catch (err) { console.error(err); }
  };

  const getAvatar = (pic: string | undefined | null, name: string) => {
    if (pic) return pic.startsWith("/uploads") ? `${API}${pic}` : pic;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1117&color=fff`;
  };

  const crushedIds = new Set(crushes.map(c => c.crush_id));

  const filteredFriends = friends.filter(f => {
    if (search) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.username.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .crush-container {
          font-family: 'DM Sans', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .crush-back {
          display: inline-flex; align-items: center; gap: 6px; color: #888;
          font-size: 14px; font-weight: 500; text-decoration: none; margin-bottom: 24px;
          transition: color 0.2s;
        }
        .crush-back:hover { color: #fff; }

        .crush-hero { text-align: center; margin-bottom: 40px; }
        .crush-title {
          font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #ec4899 50%, #be185d 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin: 0;
        }
        .crush-subtitle { color: #666; font-size: 15px; margin-top: 8px; }

        .crush-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 32px; }
        .crush-tab {
          padding: 10px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: #888; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.25s; position: relative;
        }
        .crush-tab:hover { background: rgba(236,72,153,0.08); border-color: rgba(236,72,153,0.2); color: #ec4899; }
        .crush-tab.active { background: rgba(236,72,153,0.15); border-color: rgba(236,72,153,0.35); color: #ec4899; }
        .crush-tab-badge {
          position: absolute; top: -6px; right: -6px;
          background: #ec4899; color: #fff; font-size: 10px; font-weight: 700;
          padding: 2px 7px; border-radius: 999px; min-width: 18px; text-align: center;
        }

        .crush-search {
          width: 100%; max-width: 400px; margin: 0 auto 24px; display: block;
          padding: 12px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: #eee; font-size: 14px;
          outline: none; transition: border 0.3s; font-family: inherit;
        }
        .crush-search:focus { border-color: rgba(236,72,153,0.4); }
        .crush-search::placeholder { color: #444; }

        .crush-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }

        .crush-friend-card {
          background: rgba(20,20,20,0.7); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 20px; display: flex; align-items: center;
          gap: 14px; transition: all 0.3s;
        }
        .crush-friend-card:hover { border-color: rgba(236,72,153,0.15); }
        .crush-friend-card img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
          border: 2px solid rgba(255,255,255,0.08); }

        .crush-friend-info { flex: 1; }
        .crush-friend-name { font-size: 15px; font-weight: 600; color: #fff; }
        .crush-friend-user { font-size: 12px; color: #888; }

        .crush-btn {
          width: 42px; height: 42px; border-radius: 50%; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.3s; font-size: 20px; flex-shrink: 0;
        }
        .crush-btn-heart {
          background: rgba(236,72,153,0.1); color: #ec4899;
          border: 1px solid rgba(236,72,153,0.2);
        }
        .crush-btn-heart:hover { background: rgba(236,72,153,0.25); transform: scale(1.1); }
        .crush-btn-heart.active {
          background: #ec4899; color: #fff;
          border-color: #ec4899; animation: heartPop 0.3s ease;
        }
        .crush-btn-heart.sending {
          opacity: 0.5; pointer-events: none;
        }

        @keyframes heartPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        /* Crush list cards */
        .crush-item {
          display: flex; align-items: center; gap: 16px; padding: 16px 20px;
          background: rgba(236,72,153,0.04); border: 1px solid rgba(236,72,153,0.1);
          border-radius: 16px; margin-bottom: 12px;
        }
        .crush-item img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
          border: 2px solid rgba(236,72,153,0.2); }
        .crush-item-info { flex: 1; }
        .crush-item-name { font-weight: 600; color: #fff; font-size: 15px; }
        .crush-item-user { font-size: 12px; color: #888; }
        .crush-item-status {
          padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .crush-status-secret { background: rgba(236,72,153,0.1); color: #ec4899;
          border: 1px solid rgba(236,72,153,0.2); }
        .crush-status-matched { background: rgba(34,197,94,0.1); color: #22c55e;
          border: 1px solid rgba(34,197,94,0.2); }

        .crush-remove-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #888; padding: 6px 14px; border-radius: 8px; font-size: 12px;
          cursor: pointer; transition: all 0.2s; font-weight: 600;
        }
        .crush-remove-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444;
          border-color: rgba(239,68,68,0.2); }

        /* Matches */
        .match-card {
          display: flex; align-items: center; gap: 16px; padding: 20px;
          background: linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(168,85,247,0.08) 100%);
          border: 1px solid rgba(236,72,153,0.2); border-radius: 20px; margin-bottom: 16px;
          position: relative; overflow: hidden;
        }
        .match-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, #ec4899, #a855f7);
        }
        .match-card img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
          border: 2px solid rgba(236,72,153,0.4); }
        .match-info { flex: 1; }
        .match-name { font-weight: 700; color: #fff; font-size: 17px; }
        .match-user { font-size: 13px; color: #888; margin-top: 2px; }
        .match-date { font-size: 11px; color: #666; margin-top: 4px; }
        .match-msg-btn {
          padding: 10px 22px; border-radius: 12px;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          color: #fff; border: none; font-size: 13px; font-weight: 700;
          cursor: pointer; transition: all 0.3s; text-decoration: none;
        }
        .match-msg-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(236,72,153,0.3); }

        /* Match popup animation */
        .match-popup {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
          z-index: 200; animation: fadeInPop 0.5s ease;
        }
        .match-popup-emoji { font-size: 80px; animation: matchBounce 1s ease infinite; }
        .match-popup-text {
          font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800;
          background: linear-gradient(135deg, #ec4899, #a855f7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin-top: 16px;
        }
        .match-popup-sub { color: #888; font-size: 16px; margin-top: 8px; }

        @keyframes fadeInPop { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes matchBounce { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }

        .crush-empty { text-align: center; padding: 60px 20px; color: #666; }
        .crush-empty-icon { font-size: 48px; margin-bottom: 16px; }
      `}</style>

      <main className="crush-container">
        <Link href="/play" className="crush-back">← Back to Play</Link>

        <div className="crush-hero">
          <h1 className="crush-title">💘 Secret Crush</h1>
          <p className="crush-subtitle">Pick a crush from your friends — if they crush you back, it's a match!</p>
        </div>

        <div className="crush-tabs">
          <button className={`crush-tab ${activeTab === "pick" ? "active" : ""}`} onClick={() => setActiveTab("pick")}>
            Pick a Crush
          </button>
          <button className={`crush-tab ${activeTab === "crushes" ? "active" : ""}`} onClick={() => setActiveTab("crushes")}>
            My Crushes
            {crushes.length > 0 && <span className="crush-tab-badge">{crushes.length}</span>}
          </button>
          <button className={`crush-tab ${activeTab === "matches" ? "active" : ""}`} onClick={() => setActiveTab("matches")}>
            Matches 💘
            {matches.length > 0 && <span className="crush-tab-badge" style={{ background: "#22c55e" }}>{matches.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="crush-empty">Loading...</div>
        ) : activeTab === "pick" ? (
          <>
            <input
              className="crush-search"
              placeholder="Search friends..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filteredFriends.length === 0 ? (
              <div className="crush-empty">
                <div className="crush-empty-icon">👥</div>
                <h3 style={{ color: "#eee", marginBottom: "8px" }}>No friends yet</h3>
                <p>Add friends first to start crushing!</p>
              </div>
            ) : (
              <div className="crush-grid">
                {filteredFriends.map(f => (
                  <div key={f.id} className="crush-friend-card">
                    <img src={getAvatar(f.profile_pic, f.name)} alt={f.name} />
                    <div className="crush-friend-info">
                      <div className="crush-friend-name">{f.name}</div>
                      <div className="crush-friend-user">@{f.username}</div>
                    </div>
                    <button
                      className={`crush-btn crush-btn-heart ${crushedIds.has(f.id) ? "active" : ""} ${sendingCrush === f.id ? "sending" : ""}`}
                      onClick={() => !crushedIds.has(f.id) && handleCrush(f.id)}
                      disabled={crushedIds.has(f.id)}
                      title={crushedIds.has(f.id) ? "Already crushing!" : "Send crush"}
                    >
                      {crushedIds.has(f.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === "crushes" ? (
          crushes.length === 0 ? (
            <div className="crush-empty">
              <div className="crush-empty-icon">💘</div>
              <h3 style={{ color: "#eee", marginBottom: "8px" }}>No crushes yet</h3>
              <p>Go to the "Pick a Crush" tab and select someone!</p>
            </div>
          ) : (
            <div>
              {crushes.map(c => (
                <div key={c.id} className="crush-item">
                  <img src={getAvatar(c.profile_pic, c.name)} alt={c.name} />
                  <div className="crush-item-info">
                    <div className="crush-item-name">{c.name}</div>
                    <div className="crush-item-user">@{c.username}</div>
                  </div>
                  <span className={`crush-item-status ${c.is_matched ? "crush-status-matched" : "crush-status-secret"}`}>
                    {c.is_matched ? "💘 Matched!" : "🤫 Secret"}
                  </span>
                  <button className="crush-remove-btn" onClick={() => handleRemoveCrush(c.id)}>Remove</button>
                </div>
              ))}
            </div>
          )
        ) : (
          // Matches tab
          matches.length === 0 ? (
            <div className="crush-empty">
              <div className="crush-empty-icon">💫</div>
              <h3 style={{ color: "#eee", marginBottom: "8px" }}>No matches yet</h3>
              <p>When someone you've crushed on crushes you back, you'll see it here!</p>
            </div>
          ) : (
            <div>
              {matches.map(m => (
                <div key={m.id} className="match-card">
                  <img src={getAvatar(m.profile_pic, m.name)} alt={m.name} />
                  <div className="match-info">
                    <div className="match-name">{m.name}</div>
                    <div className="match-user">@{m.username}</div>
                    <div className="match-date">Matched {new Date(m.matched_at).toLocaleDateString()}</div>
                  </div>
                  <Link href={`/chat?initiate=${m.match_id}`} className="match-msg-btn">
                    💬 Message
                  </Link>
                </div>
              ))}
            </div>
          )
        )}

        {/* Match Animation Popup */}
        {matchAnimation && (
          <div className="match-popup" onClick={() => setMatchAnimation(null)}>
            <div className="match-popup-emoji">💘</div>
            <div className="match-popup-text">It's a Match!</div>
            <div className="match-popup-sub">You both crushed on each other — go say hi!</div>
          </div>
        )}
      </main>
    </>
  );
}
