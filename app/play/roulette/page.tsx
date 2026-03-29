"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Pool = {
  id: string;
  title: string;
  status: string;
  created_by: string;
  creator_name: string;
  creator_username: string;
  creator_pic: string;
  participant_count: number;
  created_at: string;
};

type Entry = {
  id: string;
  user_id: string;
  name: string;
  username: string;
  profile_pic: string;
  gender: string;
  preferred_gender: string;
};

type Pair = {
  id: string;
  user1_id: string;
  user1_name: string;
  user1_username: string;
  user1_pic: string;
  user2_id: string;
  user2_name: string;
  user2_username: string;
  user2_pic: string;
  initiator_id: string;
  expires_at: string;
};

export default function RoulettePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  // Create pool modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Pool detail view
  const [activePool, setActivePool] = useState<any>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [gender, setGender] = useState("");
  const [preferredGender, setPreferredGender] = useState("any");

  // Spin animation
  const [spinning, setSpinning] = useState(false);
  const [spinComplete, setSpinComplete] = useState(false);

  // My pairs
  const [myPairs, setMyPairs] = useState<Pair[]>([]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/auth/login"); return; }
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    fetchPools();
    fetchMyPairs();
  }, [router]);

  const getToken = () => localStorage.getItem("token");

  const fetchPools = async () => {
    try {
      const res = await fetch(`${API}/play/roulette/pools`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setPools(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchMyPairs = async () => {
    try {
      const res = await fetch(`${API}/play/roulette/my-pairs`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setMyPairs(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPoolDetail = async (id: string) => {
    try {
      const res = await fetch(`${API}/play/roulette/pool/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setActivePool(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleCreatePool = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API}/play/roulette/pool`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setNewTitle("");
        fetchPools();
        fetchPoolDetail(data.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleJoinPool = async () => {
    if (!gender) return alert("Please select your gender");
    try {
      const res = await fetch(`${API}/play/roulette/pool/${activePool.id}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ gender, preferred_gender: preferredGender }),
      });
      if (res.ok) {
        setShowJoin(false);
        fetchPoolDetail(activePool.id);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleSpin = async () => {
    setSpinning(true);
    // Wait a bit for animation
    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/play/roulette/pool/${activePool.id}/spin`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          setSpinComplete(true);
          fetchPoolDetail(activePool.id);
          fetchMyPairs();
        } else {
          const err = await res.json();
          alert(err.error);
        }
      } catch (err) { console.error(err); }
      setSpinning(false);
    }, 2000);
  };

  const getAvatar = (pic: string | null, name: string) => {
    if (pic) return pic.startsWith("/uploads") ? `${API}${pic}` : pic;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1117&color=fff`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .rl-container {
          font-family: 'DM Sans', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        .rl-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #888;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          margin-bottom: 24px;
          transition: color 0.2s;
        }
        .rl-back:hover { color: #fff; }

        .rl-hero { text-align: center; margin-bottom: 40px; }
        .rl-title {
          font-family: 'Syne', sans-serif;
          font-size: 38px; font-weight: 800;
          background: linear-gradient(135deg, #f0f0f0 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          margin: 0;
        }
        .rl-subtitle { color: #666; font-size: 15px; margin-top: 8px; }

        .rl-tabs { display: flex; justify-content: center; gap: 12px; margin-bottom: 32px; }
        .rl-tab {
          padding: 10px 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03); color: #888; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.25s;
        }
        .rl-tab:hover { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); color: #f59e0b; }
        .rl-tab.active { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.35); color: #f59e0b; }

        .rl-create-btn {
          display: flex; align-items: center; gap: 8px; margin: 0 auto 32px;
          padding: 12px 28px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
          font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
        }
        .rl-create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(245,158,11,0.4); }

        .rl-pools-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 20px; }

        .rl-pool-card {
          background: rgba(20,20,20,0.7); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.3s;
        }
        .rl-pool-card:hover { border-color: rgba(245,158,11,0.2); transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2); }

        .rl-pool-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 8px; }
        .rl-pool-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; }
        .rl-pool-meta img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
        .rl-pool-count {
          display: inline-flex; align-items: center; gap: 4px; margin-top: 12px;
          padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
          background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.15);
        }

        /* Pool Detail View */
        .rl-detail { background: rgba(20,20,20,0.5); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 32px; }
        .rl-detail-back { background: none; border: none; color: #888; cursor: pointer;
          display: flex; align-items: center; gap: 6px; font-size: 14px; margin-bottom: 16px; transition: color 0.2s; }
        .rl-detail-back:hover { color: #fff; }
        .rl-detail-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 8px; }
        .rl-detail-status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .rl-status-open { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .rl-status-paired { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }

        .rl-participants { margin-top: 24px; }
        .rl-participants h3 { font-size: 16px; font-weight: 700; color: #ccc; margin: 0 0 16px; }
        .rl-avatars { display: flex; flex-wrap: wrap; gap: 12px; }
        .rl-avatar-item { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .rl-avatar-item img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
          border: 2px solid rgba(245,158,11,0.3); }
        .rl-avatar-item span { font-size: 11px; color: #888; font-weight: 500; }

        .rl-actions { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
        .rl-action-btn {
          padding: 12px 28px; border-radius: 14px; font-size: 14px; font-weight: 700;
          cursor: pointer; transition: all 0.3s; border: none;
        }
        .rl-join-btn { background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3); }
        .rl-join-btn:hover { transform: translateY(-2px); }
        .rl-spin-btn { background: linear-gradient(135deg,#8b5cf6,#7c3aed); color: #fff;
          box-shadow: 0 4px 20px rgba(139,92,246,0.3); }
        .rl-spin-btn:hover { transform: translateY(-2px); }
        .rl-spin-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* Spin animation */
        @keyframes spinEmoji { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(360deg) scale(1.2); } 100% { transform: rotate(720deg) scale(1); } }
        .spin-anim { animation: spinEmoji 2s ease-in-out; }

        /* Pairs */
        .rl-pairs { margin-top: 32px; }
        .rl-pair-card {
          display: flex; align-items: center; gap: 16px; padding: 20px;
          background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.15);
          border-radius: 16px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .rl-pair-user { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 140px; }
        .rl-pair-user img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.1); }
        .rl-pair-vs {
          font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
          color: #f59e0b; padding: 0 8px;
        }
        .rl-pair-badge {
          padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700;
          background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.2);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .rl-pair-timer { font-size: 12px; color: #888; margin-top: 8px; }
        .rl-msg-btn {
          padding: 8px 20px; border-radius: 10px; background: rgba(59,130,246,0.15);
          color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); font-size: 13px;
          font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none;
        }
        .rl-msg-btn:hover { background: rgba(59,130,246,0.25); }

        /* Modal */
        .rl-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 100;
        }
        .rl-modal {
          background: #111; border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px; padding: 32px; width: 100%; max-width: 440px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }
        .rl-modal h2 { margin: 0 0 20px; font-size: 22px; color: #fff; }
        .rl-modal-label { display: block; font-size: 13px; color: #888; margin-bottom: 8px; font-weight: 600; }
        .rl-modal-input, .rl-modal-select {
          width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff;
          font-size: 15px; outline: none; transition: border 0.3s; font-family: inherit; margin-bottom: 16px;
        }
        .rl-modal-input:focus, .rl-modal-select:focus { border-color: #f59e0b; }
        .rl-modal-actions { display: flex; gap: 12px; margin-top: 8px; }
        .rl-modal-cancel {
          flex: 1; padding: 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15);
          color: #ccc; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px;
        }
        .rl-modal-submit {
          flex: 2; padding: 14px; background: linear-gradient(135deg,#f59e0b,#d97706); border: none;
          color: #fff; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 14px;
        }

        .rl-empty { text-align: center; padding: 60px 20px; color: #666; }
        .rl-empty-icon { font-size: 48px; margin-bottom: 16px; }
      `}</style>

      <main className="rl-container">
        <Link href="/play" className="rl-back">
          ← Back to Play
        </Link>

        <div className="rl-hero">
          <h1 className="rl-title">🎰 DM Roulette</h1>
          <p className="rl-subtitle">Join a pool, set your gender preference, and get randomly paired!</p>
        </div>

        {/* If viewing a specific pool */}
        {activePool ? (
          <div className="rl-detail">
            <button className="rl-detail-back" onClick={() => { setActivePool(null); setSpinComplete(false); }}>
              ← Back to pools
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <h2 className="rl-detail-title">{activePool.title}</h2>
              <span className={`rl-detail-status ${activePool.status === "open" ? "rl-status-open" : "rl-status-paired"}`}>
                {activePool.status}
              </span>
            </div>

            <div className="rl-pool-meta" style={{ marginTop: "12px" }}>
              <img src={getAvatar(activePool.creator_pic, activePool.creator_name)} alt="" />
              Created by <strong style={{ color: "#fff" }}>{activePool.creator_name}</strong>
            </div>

            {/* Participants */}
            <div className="rl-participants">
              <h3>👥 Participants ({activePool.entries?.length || 0})</h3>
              {activePool.entries?.length > 0 ? (
                <div className="rl-avatars">
                  {activePool.entries.map((e: Entry) => (
                    <div key={e.id} className="rl-avatar-item">
                      <img src={getAvatar(e.profile_pic, e.name)} alt={e.name} />
                      <span>{e.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#666", fontSize: "14px" }}>No one has joined yet. Be the first!</p>
              )}
            </div>

            {/* Actions */}
            {activePool.status === "open" && (
              <div className="rl-actions">
                {!activePool.my_entry ? (
                  <button className="rl-action-btn rl-join-btn" onClick={() => setShowJoin(true)}>
                    🎲 Join Pool
                  </button>
                ) : (
                  <span style={{ color: "#22c55e", fontSize: "14px", fontWeight: 600 }}>✅ You've joined!</span>
                )}

                {user && activePool.created_by === user.id && (
                  <button
                    className="rl-action-btn rl-spin-btn"
                    onClick={handleSpin}
                    disabled={spinning || (activePool.entries?.length || 0) < 2}
                  >
                    {spinning ? (
                      <span className="spin-anim" style={{ display: "inline-block" }}>🎰</span>
                    ) : (
                      "🎰 Spin!"
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Show pairs */}
            {activePool.pairs?.length > 0 && (
              <div className="rl-pairs">
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
                  🎉 Pairs Revealed!
                </h3>
                {activePool.pairs.map((pair: Pair) => {
                  const isUser1 = user && pair.user1_id === user.id;
                  const isUser2 = user && pair.user2_id === user.id;
                  const isMyPair = isUser1 || isUser2;
                  const isInitiator = user && pair.initiator_id === user.id;
                  const partnerId = isUser1 ? pair.user2_id : pair.user1_id;

                  return (
                    <div key={pair.id} className="rl-pair-card" style={isMyPair ? { background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" } : {}}>
                      <div className="rl-pair-user">
                        <img src={getAvatar(pair.user1_pic, pair.user1_name)} alt="" />
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: "15px" }}>{pair.user1_name}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>@{pair.user1_username}</div>
                          {pair.initiator_id === pair.user1_id && <span className="rl-pair-badge">Initiator</span>}
                        </div>
                      </div>

                      <div className="rl-pair-vs">×</div>

                      <div className="rl-pair-user">
                        <img src={getAvatar(pair.user2_pic, pair.user2_name)} alt="" />
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: "15px" }}>{pair.user2_name}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>@{pair.user2_username}</div>
                          {pair.initiator_id === pair.user2_id && <span className="rl-pair-badge">Initiator</span>}
                        </div>
                      </div>

                      {isMyPair && (
                        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                          <div className="rl-pair-timer">
                            ⏰ Talk for 24h — expires {new Date(pair.expires_at).toLocaleString()}
                          </div>
                          {isInitiator && (
                            <Link href={`/chat?initiate=${partnerId}`} className="rl-msg-btn">
                              💬 Start Chat
                            </Link>
                          )}
                          {!isInitiator && (
                            <span style={{ fontSize: "12px", color: "#a78bfa", fontWeight: 600 }}>Waiting for them to message you...</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Pool List View */
          <>
            <button className="rl-create-btn" onClick={() => setShowCreate(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Roulette Pool
            </button>

            {/* My active pairs */}
            {myPairs.length > 0 && (
              <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>🔥 Your Active Pairs</h3>
                {myPairs.map((pair) => {
                  const isUser1 = user && pair.user1_id === user.id;
                  const partner = isUser1
                    ? { name: pair.user2_name, username: pair.user2_username, pic: pair.user2_pic, id: pair.user2_id }
                    : { name: pair.user1_name, username: pair.user1_username, pic: pair.user1_pic, id: pair.user1_id };
                  const isInitiator = user && pair.initiator_id === user.id;

                  return (
                    <div key={pair.id} className="rl-pair-card">
                      <div className="rl-pair-user">
                        <img src={getAvatar(partner.pic, partner.name)} alt="" />
                        <div>
                          <div style={{ fontWeight: 600, color: "#fff", fontSize: "15px" }}>{partner.name}</div>
                          <div style={{ fontSize: "12px", color: "#888" }}>@{partner.username}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="rl-pair-timer">⏰ {new Date(pair.expires_at).toLocaleString()}</div>
                        {isInitiator ? (
                          <Link href={`/chat?initiate=${partner.id}`} className="rl-msg-btn">💬 Chat</Link>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#a78bfa" }}>Their turn to initiate</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="rl-empty">Loading pools...</div>
            ) : pools.length === 0 ? (
              <div className="rl-empty">
                <div className="rl-empty-icon">🎰</div>
                <h3 style={{ color: "#eee", marginBottom: "8px" }}>No Active Pools</h3>
                <p>Be the first to start a DM Roulette! Create a pool and invite friends.</p>
              </div>
            ) : (
              <div className="rl-pools-grid">
                {pools.map((p) => (
                  <div key={p.id} className="rl-pool-card" onClick={() => fetchPoolDetail(p.id)}>
                    <h3 className="rl-pool-title">{p.title}</h3>
                    <div className="rl-pool-meta">
                      <img src={getAvatar(p.creator_pic, p.creator_name)} alt="" />
                      by {p.creator_name}
                    </div>
                    <div className="rl-pool-count">
                      👥 {p.participant_count} joined
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Pool Modal */}
        {showCreate && (
          <div className="rl-overlay" onClick={() => setShowCreate(false)}>
            <div className="rl-modal" onClick={(e) => e.stopPropagation()}>
              <h2>🎰 Create Roulette Pool</h2>
              <label className="rl-modal-label">Pool Name</label>
              <input
                className="rl-modal-input"
                placeholder="e.g. Late Night DM Roulette"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <div className="rl-modal-actions">
                <button className="rl-modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="rl-modal-submit" onClick={handleCreatePool}>Create Pool</button>
              </div>
            </div>
          </div>
        )}

        {/* Join Pool Modal */}
        {showJoin && (
          <div className="rl-overlay" onClick={() => setShowJoin(false)}>
            <div className="rl-modal" onClick={(e) => e.stopPropagation()}>
              <h2>🎲 Join Pool</h2>
              <label className="rl-modal-label">Your Gender</label>
              <select className="rl-modal-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>

              <label className="rl-modal-label">Pair me with</label>
              <select className="rl-modal-select" value={preferredGender} onChange={(e) => setPreferredGender(e.target.value)}>
                <option value="any">Anyone</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
              </select>

              <div className="rl-modal-actions">
                <button className="rl-modal-cancel" onClick={() => setShowJoin(false)}>Cancel</button>
                <button className="rl-modal-submit" onClick={handleJoinPool}>Join 🎲</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
