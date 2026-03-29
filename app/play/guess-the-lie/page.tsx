"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Game = {
  id: string;
  host_id: string;
  host_name: string;
  host_username: string;
  host_pic: string;
  title: string;
  visibility: string;
  status: string;
  member_count: number;
  round_count: number;
  my_status: string | null;
  created_at: string;
};

type Member = {
  id: string;
  user_id: string;
  name: string;
  username: string;
  profile_pic: string;
  status: string;
};

type Round = {
  id: string;
  presenter_id: string;
  presenter_name: string;
  presenter_username: string;
  presenter_pic: string;
  statement1: string;
  statement2: string;
  statement3: string;
  lie_index: number;
  status: string;
  vote_count: number;
  my_vote: number | null;
  votes?: any[];
};

export default function GuessTheLiePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"browse" | "detail">("browse");

  // Create game
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVisibility, setNewVisibility] = useState("public");

  // Game detail
  const [gameDetail, setGameDetail] = useState<any>(null);

  // Create round
  const [showNewRound, setShowNewRound] = useState(false);
  const [stmt1, setStmt1] = useState("");
  const [stmt2, setStmt2] = useState("");
  const [stmt3, setStmt3] = useState("");
  const [lieIdx, setLieIdx] = useState(1);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    try { const s = localStorage.getItem("user"); if (s) setUser(JSON.parse(s)); } catch {}
    fetchGames();
  }, [router]);

  const fetchGames = async () => {
    try {
      const res = await fetch(`${API}/play/gtl`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setGames(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchGameDetail = async (id: string) => {
    try {
      const res = await fetch(`${API}/play/gtl/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) {
        const data = await res.json();
        setGameDetail(data);
        setActiveTab("detail");
      }
    } catch {}
  };

  const handleCreateGame = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`${API}/play/gtl`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, visibility: newVisibility }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false); setNewTitle(""); setNewVisibility("public");
        fetchGames();
        fetchGameDetail(data.id);
      }
    } catch (err) { console.error(err); }
  };

  const handleJoinGame = async (gameId: string) => {
    try {
      const res = await fetch(`${API}/play/gtl/${gameId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "pending") alert("Join request sent! Waiting for host approval.");
        fetchGameDetail(gameId);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleApproveMember = async (userId: string, status: string) => {
    if (!gameDetail) return;
    try {
      await fetch(`${API}/play/gtl/${gameDetail.id}/member/${userId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchGameDetail(gameDetail.id);
    } catch (err) { console.error(err); }
  };

  const handleCreateRound = async () => {
    if (!stmt1.trim() || !stmt2.trim() || !stmt3.trim()) return alert("All 3 statements are required");
    try {
      const res = await fetch(`${API}/play/gtl/${gameDetail.id}/round`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ statement1: stmt1, statement2: stmt2, statement3: stmt3, lie_index: lieIdx }),
      });
      if (res.ok) {
        setShowNewRound(false); setStmt1(""); setStmt2(""); setStmt3(""); setLieIdx(1);
        fetchGameDetail(gameDetail.id);
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch (err) { console.error(err); }
  };

  const handleVote = async (roundId: string, idx: number) => {
    try {
      const res = await fetch(`${API}/play/gtl/round/${roundId}/vote`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ guessed_index: idx }),
      });
      if (res.ok) fetchGameDetail(gameDetail.id);
      else { const err = await res.json(); alert(err.error); }
    } catch (err) { console.error(err); }
  };

  const handleReveal = async (roundId: string) => {
    try {
      const res = await fetch(`${API}/play/gtl/round/${roundId}/reveal`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchGameDetail(gameDetail.id);
    } catch (err) { console.error(err); }
  };

  const handleEndGame = async () => {
    if (!gameDetail) return;
    if (!confirm("End this game?")) return;
    try {
      await fetch(`${API}/play/gtl/${gameDetail.id}/end`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setActiveTab("browse");
      setGameDetail(null);
      fetchGames();
    } catch (err) { console.error(err); }
  };

  const getAvatar = (pic: string | null, name: string) => {
    if (pic) return pic.startsWith("/uploads") ? `${API}${pic}` : pic;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1117&color=fff`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .gtl-container { font-family: 'DM Sans', sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 24px 80px; }
        .gtl-back { display: inline-flex; align-items: center; gap: 6px; color: #888; font-size: 14px; font-weight: 500; text-decoration: none; margin-bottom: 24px; transition: color 0.2s; }
        .gtl-back:hover { color: #fff; }
        .gtl-hero { text-align: center; margin-bottom: 40px; }
        .gtl-title { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; background: linear-gradient(135deg,#f0f0f0 0%,#06b6d4 50%,#0891b2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; }
        .gtl-subtitle { color: #666; font-size: 15px; margin-top: 8px; }

        .gtl-top-actions { display: flex; justify-content: center; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .gtl-create-btn { display: flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 14px; border: none; background: linear-gradient(135deg,#06b6d4,#0891b2); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 20px rgba(6,182,212,0.3); }
        .gtl-create-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(6,182,212,0.4); }

        .gtl-games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .gtl-game-card { background: rgba(20,20,20,0.7); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.3s; }
        .gtl-game-card:hover { border-color: rgba(6,182,212,0.2); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        .gtl-game-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .gtl-game-title { font-size: 18px; font-weight: 700; color: #fff; margin: 0; }
        .gtl-vis-badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .gtl-vis-public { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .gtl-vis-private { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .gtl-game-meta { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; }
        .gtl-game-meta img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
        .gtl-game-stats { display: flex; gap: 16px; margin-top: 12px; font-size: 13px; color: #888; }
        .gtl-stat { display: flex; align-items: center; gap: 4px; }

        /* Detail View */
        .gtl-detail { background: rgba(20,20,20,0.5); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 32px; }
        .gtl-detail-back { background: none; border: none; color: #888; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 14px; margin-bottom: 16px; transition: color 0.2s; }
        .gtl-detail-back:hover { color: #fff; }
        .gtl-detail-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 8px; }

        .gtl-members { margin: 24px 0; }
        .gtl-members h3 { font-size: 16px; font-weight: 700; color: #ccc; margin: 0 0 12px; }
        .gtl-member-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 12px; background: rgba(255,255,255,0.02); margin-bottom: 8px; }
        .gtl-member-row img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .gtl-member-info { flex: 1; }
        .gtl-member-name { font-weight: 600; color: #fff; font-size: 14px; }
        .gtl-member-user { font-size: 12px; color: #888; }
        .gtl-pending-badge { padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .gtl-approve-btn { padding: 4px 12px; border-radius: 6px; background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 4px; }
        .gtl-reject-btn { padding: 4px 12px; border-radius: 6px; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.15); font-size: 11px; font-weight: 600; cursor: pointer; }

        .gtl-detail-actions { display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
        .gtl-action-btn { padding: 12px 24px; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; border: none; }
        .gtl-round-btn { background: linear-gradient(135deg,#06b6d4,#0891b2); color: #fff; box-shadow: 0 4px 16px rgba(6,182,212,0.3); }
        .gtl-round-btn:hover { transform: translateY(-2px); }
        .gtl-join-btn { background: linear-gradient(135deg,#22c55e,#16a34a); color: #fff; box-shadow: 0 4px 16px rgba(34,197,94,0.3); }
        .gtl-join-btn:hover { transform: translateY(-2px); }
        .gtl-end-btn { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .gtl-end-btn:hover { background: rgba(239,68,68,0.2); }

        /* Rounds */
        .gtl-rounds { margin-top: 32px; }
        .gtl-round-card { background: rgba(6,182,212,0.04); border: 1px solid rgba(6,182,212,0.12); border-radius: 20px; padding: 24px; margin-bottom: 20px; }
        .gtl-round-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .gtl-round-header img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .gtl-round-by { font-weight: 600; color: #fff; font-size: 14px; }
        .gtl-round-status { margin-left: auto; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .gtl-round-voting { background: rgba(6,182,212,0.1); color: #06b6d4; border: 1px solid rgba(6,182,212,0.2); }
        .gtl-round-revealed { background: rgba(168,85,247,0.1); color: #a855f7; border: 1px solid rgba(168,85,247,0.2); }

        .gtl-statements { display: flex; flex-direction: column; gap: 10px; }
        .gtl-stmt {
          padding: 16px 20px; border-radius: 14px; font-size: 15px; color: #eee;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          transition: all 0.3s; cursor: default;
        }
        .gtl-stmt.votable { cursor: pointer; }
        .gtl-stmt.votable:hover { border-color: rgba(6,182,212,0.3); background: rgba(6,182,212,0.06); }
        .gtl-stmt.voted { border-color: rgba(6,182,212,0.4); background: rgba(6,182,212,0.1); }
        .gtl-stmt.is-lie { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.08); }
        .gtl-stmt.is-truth { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.06); }
        .gtl-stmt-idx { font-size: 13px; font-weight: 700; color: #888; min-width: 20px; }
        .gtl-stmt-text { flex: 1; }
        .gtl-stmt-label { font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
        .gtl-lie-label { background: rgba(239,68,68,0.2); color: #ef4444; }
        .gtl-truth-label { background: rgba(34,197,94,0.15); color: #22c55e; }
        .gtl-my-vote-label { background: rgba(6,182,212,0.15); color: #06b6d4; }

        .gtl-vote-bar { margin-top: 16px; }
        .gtl-vote-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; color: #888; }
        .gtl-vote-bar-bg { flex: 1; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden; }
        .gtl-vote-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

        .gtl-reveal-btn { margin-top: 16px; padding: 10px 22px; border-radius: 12px; background: linear-gradient(135deg,#a855f7,#7c3aed); color: #fff; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
        .gtl-reveal-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(168,85,247,0.3); }

        /* Modal */
        .gtl-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; }
        .gtl-modal { background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); max-height: 90vh; overflow-y: auto; }
        .gtl-modal h2 { margin: 0 0 20px; font-size: 22px; color: #fff; }
        .gtl-modal-label { display: block; font-size: 13px; color: #888; margin-bottom: 8px; font-weight: 600; }
        .gtl-modal-input, .gtl-modal-select, .gtl-modal-textarea {
          width: 100%; padding: 14px 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; color: #fff; font-size: 15px; outline: none; transition: border 0.3s;
          font-family: inherit; margin-bottom: 16px;
        }
        .gtl-modal-textarea { resize: vertical; min-height: 60px; }
        .gtl-modal-input:focus, .gtl-modal-select:focus, .gtl-modal-textarea:focus { border-color: #06b6d4; }
        .gtl-modal-actions { display: flex; gap: 12px; margin-top: 8px; }
        .gtl-modal-cancel { flex: 1; padding: 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #ccc; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px; }
        .gtl-modal-submit { flex: 2; padding: 14px; background: linear-gradient(135deg,#06b6d4,#0891b2); border: none; color: #fff; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 14px; }

        .gtl-lie-selector { display: flex; gap: 8px; margin-bottom: 16px; }
        .gtl-lie-opt { flex: 1; padding: 10px; text-align: center; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: #888; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .gtl-lie-opt.selected { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .gtl-lie-opt:hover { border-color: rgba(255,255,255,0.2); }

        .gtl-empty { text-align: center; padding: 60px 20px; color: #666; }
        .gtl-empty-icon { font-size: 48px; margin-bottom: 16px; }
      `}</style>

      <main className="gtl-container">
        <Link href="/play" className="gtl-back">← Back to Play</Link>

        <div className="gtl-hero">
          <h1 className="gtl-title">🤥 Guess the Lie</h1>
          <p className="gtl-subtitle">2 truths, 1 lie — can they tell which is which?</p>
        </div>

        {activeTab === "detail" && gameDetail ? (
          // ═══ GAME DETAIL VIEW ═══
          <div className="gtl-detail">
            <button className="gtl-detail-back" onClick={() => { setActiveTab("browse"); setGameDetail(null); }}>← Back to games</button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "12px" }}>
              <h2 className="gtl-detail-title">{gameDetail.title}</h2>
              <span className={`gtl-vis-badge ${gameDetail.visibility === "public" ? "gtl-vis-public" : "gtl-vis-private"}`}>
                {gameDetail.visibility === "public" ? "🌍 Public" : "🔒 Private"}
              </span>
            </div>

            <div className="gtl-game-meta">
              <img src={getAvatar(gameDetail.host_pic, gameDetail.host_name)} alt="" />
              Hosted by <strong style={{ color: "#fff" }}>{gameDetail.host_name}</strong>
            </div>

            {/* Members */}
            <div className="gtl-members">
              <h3>👥 Members ({gameDetail.members?.filter((m: Member) => m.status === "approved").length})</h3>
              {gameDetail.members?.map((m: Member) => (
                <div key={m.id} className="gtl-member-row">
                  <img src={getAvatar(m.profile_pic, m.name)} alt="" />
                  <div className="gtl-member-info">
                    <div className="gtl-member-name">{m.name}</div>
                    <div className="gtl-member-user">@{m.username}</div>
                  </div>
                  {m.status === "pending" && (
                    <>
                      <span className="gtl-pending-badge">Pending</span>
                      {user && gameDetail.host_id === user.id && (
                        <>
                          <button className="gtl-approve-btn" onClick={() => handleApproveMember(m.user_id, "approved")}>Accept</button>
                          <button className="gtl-reject-btn" onClick={() => handleApproveMember(m.user_id, "rejected")}>Reject</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="gtl-detail-actions">
              {!gameDetail.my_membership && (
                <button className="gtl-action-btn gtl-join-btn" onClick={() => handleJoinGame(gameDetail.id)}>
                  ✋ Join Game
                </button>
              )}
              {gameDetail.my_membership?.status === "pending" && (
                <span style={{ color: "#f59e0b", fontSize: "14px", fontWeight: 600 }}>⏳ Waiting for host approval</span>
              )}
              {gameDetail.my_membership?.status === "approved" && (
                <button className="gtl-action-btn gtl-round-btn" onClick={() => setShowNewRound(true)}>
                  🎤 My Turn — Say 3 Things
                </button>
              )}
              {user && gameDetail.host_id === user.id && (
                <button className="gtl-action-btn gtl-end-btn" onClick={handleEndGame}>End Game</button>
              )}
            </div>

            {/* Rounds */}
            <div className="gtl-rounds">
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>
                🎤 Rounds ({gameDetail.rounds?.length || 0})
              </h3>

              {gameDetail.rounds?.length === 0 && (
                <div className="gtl-empty">
                  <p style={{ color: "#888" }}>No rounds yet. Be the first to say 3 things!</p>
                </div>
              )}

              {gameDetail.rounds?.map((round: Round) => {
                const isRevealed = round.status === "revealed";
                const isMyRound = user && round.presenter_id === user.id;
                const isHost = user && gameDetail.host_id === user.id;
                const canVote = !isMyRound && !isRevealed && gameDetail.my_membership?.status === "approved";

                const statements = [
                  { idx: 1, text: round.statement1 },
                  { idx: 2, text: round.statement2 },
                  { idx: 3, text: round.statement3 },
                ];

                // Vote distribution for revealed rounds
                const voteCounts = [0, 0, 0]; // index 0=stmt1, 1=stmt2, 2=stmt3
                if (isRevealed && round.votes) {
                  round.votes.forEach((v: any) => { voteCounts[v.guessed_index - 1]++; });
                }
                const totalVotes = voteCounts.reduce((a, b) => a + b, 0);

                return (
                  <div key={round.id} className="gtl-round-card">
                    <div className="gtl-round-header">
                      <img src={getAvatar(round.presenter_pic, round.presenter_name)} alt="" />
                      <div>
                        <div className="gtl-round-by">{round.presenter_name}</div>
                        <div style={{ fontSize: "12px", color: "#888" }}>@{round.presenter_username}</div>
                      </div>
                      <span className={`gtl-round-status ${isRevealed ? "gtl-round-revealed" : "gtl-round-voting"}`}>
                        {isRevealed ? "Revealed" : `Voting (${round.vote_count})`}
                      </span>
                    </div>

                    <div className="gtl-statements">
                      {statements.map(s => {
                        const isLie = isRevealed && s.idx === round.lie_index;
                        const isTruth = isRevealed && s.idx !== round.lie_index;
                        const isMyVote = round.my_vote === s.idx;

                        let cls = "gtl-stmt";
                        if (canVote) cls += " votable";
                        if (isMyVote && !isRevealed) cls += " voted";
                        if (isLie) cls += " is-lie";
                        if (isTruth) cls += " is-truth";

                        return (
                          <div
                            key={s.idx}
                            className={cls}
                            onClick={() => canVote && handleVote(round.id, s.idx)}
                          >
                            <span className="gtl-stmt-idx">#{s.idx}</span>
                            <span className="gtl-stmt-text">{s.text}</span>
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              {isMyVote && !isRevealed && <span className="gtl-stmt-label gtl-my-vote-label">Your vote</span>}
                              {isLie && <span className="gtl-stmt-label gtl-lie-label">🤥 THE LIE</span>}
                              {isTruth && <span className="gtl-stmt-label gtl-truth-label">✅ Truth</span>}
                              {isRevealed && isMyVote && (
                                <span className="gtl-stmt-label" style={{
                                  background: isLie ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                                  color: isLie ? "#22c55e" : "#ef4444"
                                }}>
                                  {isLie ? "✓ Correct!" : "✗ Wrong"}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vote distribution bars (after reveal) */}
                    {isRevealed && totalVotes > 0 && (
                      <div className="gtl-vote-bar">
                        {statements.map((s, i) => (
                          <div key={s.idx} className="gtl-vote-row">
                            <span style={{ minWidth: "28px" }}>#{s.idx}</span>
                            <div className="gtl-vote-bar-bg">
                              <div className="gtl-vote-bar-fill" style={{
                                width: `${totalVotes > 0 ? (voteCounts[i] / totalVotes) * 100 : 0}%`,
                                background: s.idx === round.lie_index
                                  ? "linear-gradient(90deg, #ef4444, #dc2626)"
                                  : "linear-gradient(90deg, #06b6d4, #0891b2)",
                              }} />
                            </div>
                            <span style={{ minWidth: "50px", textAlign: "right" }}>{voteCounts[i]} votes</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reveal button */}
                    {!isRevealed && (isMyRound || isHost) && (
                      <button className="gtl-reveal-btn" onClick={() => handleReveal(round.id)}>
                        🎭 Reveal the Lie
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ═══ BROWSE VIEW ═══
          <>
            <div className="gtl-top-actions">
              <button className="gtl-create-btn" onClick={() => setShowCreate(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Party
              </button>
            </div>

            {loading ? (
              <div className="gtl-empty">Loading games...</div>
            ) : games.length === 0 ? (
              <div className="gtl-empty">
                <div className="gtl-empty-icon">🤥</div>
                <h3 style={{ color: "#eee", marginBottom: "8px" }}>No Active Games</h3>
                <p>Start a party and challenge your friends!</p>
              </div>
            ) : (
              <div className="gtl-games-grid">
                {games.map(g => (
                  <div key={g.id} className="gtl-game-card" onClick={() => fetchGameDetail(g.id)}>
                    <div className="gtl-game-header">
                      <h3 className="gtl-game-title">{g.title}</h3>
                      <span className={`gtl-vis-badge ${g.visibility === "public" ? "gtl-vis-public" : "gtl-vis-private"}`}>
                        {g.visibility === "public" ? "🌍" : "🔒"}
                      </span>
                    </div>
                    <div className="gtl-game-meta">
                      <img src={getAvatar(g.host_pic, g.host_name)} alt="" />
                      by {g.host_name}
                    </div>
                    <div className="gtl-game-stats">
                      <div className="gtl-stat">👥 {g.member_count}</div>
                      <div className="gtl-stat">🎤 {g.round_count} rounds</div>
                      {g.my_status === "approved" && <div className="gtl-stat" style={{ color: "#22c55e" }}>✅ Joined</div>}
                      {g.my_status === "pending" && <div className="gtl-stat" style={{ color: "#f59e0b" }}>⏳ Pending</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create Game Modal */}
        {showCreate && (
          <div className="gtl-overlay" onClick={() => setShowCreate(false)}>
            <div className="gtl-modal" onClick={e => e.stopPropagation()}>
              <h2>🤥 Create a Party</h2>
              <label className="gtl-modal-label">Party Name</label>
              <input className="gtl-modal-input" placeholder="e.g. Truth or Dare Night" value={newTitle} onChange={e => setNewTitle(e.target.value)} />

              <label className="gtl-modal-label">Visibility</label>
              <select className="gtl-modal-select" value={newVisibility} onChange={e => setNewVisibility(e.target.value)}>
                <option value="public">🌍 Public — Anyone can join</option>
                <option value="private">🔒 Private — Approval needed</option>
              </select>

              <div className="gtl-modal-actions">
                <button className="gtl-modal-cancel" onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="gtl-modal-submit" onClick={handleCreateGame}>Create Party</button>
              </div>
            </div>
          </div>
        )}

        {/* Create Round Modal */}
        {showNewRound && (
          <div className="gtl-overlay" onClick={() => setShowNewRound(false)}>
            <div className="gtl-modal" onClick={e => e.stopPropagation()}>
              <h2>🎤 Your Turn</h2>
              <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>
                Say 3 things about yourself — 2 true, 1 lie!
              </p>

              <label className="gtl-modal-label">Statement #1</label>
              <textarea className="gtl-modal-textarea" placeholder="e.g. I've been to 12 countries" value={stmt1} onChange={e => setStmt1(e.target.value)} />

              <label className="gtl-modal-label">Statement #2</label>
              <textarea className="gtl-modal-textarea" placeholder="e.g. I can solve a Rubik's cube in under a minute" value={stmt2} onChange={e => setStmt2(e.target.value)} />

              <label className="gtl-modal-label">Statement #3</label>
              <textarea className="gtl-modal-textarea" placeholder="e.g. I once met a celebrity" value={stmt3} onChange={e => setStmt3(e.target.value)} />

              <label className="gtl-modal-label">Which one is the lie?</label>
              <div className="gtl-lie-selector">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`gtl-lie-opt ${lieIdx === i ? "selected" : ""}`} onClick={() => setLieIdx(i)}>
                    #{i} is the lie
                  </div>
                ))}
              </div>

              <div className="gtl-modal-actions">
                <button className="gtl-modal-cancel" onClick={() => setShowNewRound(false)}>Cancel</button>
                <button className="gtl-modal-submit" onClick={handleCreateRound}>Submit Round</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
