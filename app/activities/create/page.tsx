"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uploadSubmission } from "@/lib/uploadSubmission";
import Link from "next/link";
import LocationAutocomplete from "@/components/LocationAutocomplete";

const AI_SUGGESTIONS: Record<string, { title: string; description: string; location: string }> = {
  bowling: { title: "Bowling Night", description: "Book lanes, split into teams, play 3 rounds. Loser buys snacks. Perfect for groups of 4-8.", location: "Smaaash (Cyberhub) / Yes Minister (HKV)" },
  golf: { title: "Golf Session", description: "Mini golf or driving range. Great for casual hangs, no skill needed. Grab smoothies after.", location: "Siri Fort Sports Complex / Qutab Golf Course" },
  pickleball: { title: "Pickleball Match", description: "Book a court for 2 hours. Doubles tournament style. Bring water. Winner gets bragging rights.", location: "Hudle Pickleball, Vasant Kunj" },
  clubbing: { title: "Club Night", description: "Pre-game at someone's place. Hit the club by 11. Set a budget. Dance like nobody's watching.", location: "Soho (Ashoka) / Diablo (Mehrauli)" },
  cafe_hopping: { title: "Café Hopping Tour", description: "Pick 3-4 cafés in one area. Try a different drink at each. Rate them all. Find your new spot.", location: "Champa Gali / Dhan Mill Compound" },
  movie: { title: "Movie Plan", description: "Pick the movie together. Book last row seats. Post-movie dinner to discuss plot holes.", location: "PVR Director's Cut / INOX Nehru Place" },
  trip: { title: "Weekend Trip", description: "Pick a destination within 4-6 hours. Split costs. Assign roles: navigator, DJ, photographer, snack manager.", location: "Rishikesh / Jaipur / Neemrana" },
  road_trip: { title: "Road Trip", description: "Midnight drive or sunrise chase. Pick scenic stops. Aux cord rules: driver picks first song. Stop at every dhaba.", location: "Murthal (Amrik Sukhdev) / Leopard Trail" },
  city_exploration: { title: "City Exploration", description: "Pick an area you've never been to. Walk with no plan. Try street food. Talk to locals. Get lost on purpose.", location: "Lodhi Art District / Paharganj" },
  explore_spot: { title: "Explore a Spot", description: "Discover a hidden gem. Eat local food, visit shops, find street art. Take candid photos.", location: "Majnu Ka Tilla / Safdarjung Enclave" },
  gaming: { title: "Gaming Night", description: "Pick the game: Valorant, FIFA, or board games. Tournament bracket. Loser does a dare.", location: "Microgravity (Gurgaon) / Local Cafe" },
  watch_party: { title: "Watch Party", description: "Pick a series or movie. Sync up. React together. Bring blankets and snacks.", location: "Online Room / Friend's House" },
  study_session: { title: "Study Session", description: "Pick a café or library. Pomodoro timers. No phones for 25 mins. Break together.", location: "Blue Tokai / Triveni Terrace Cafe" },
  food_walk: { title: "Food Walk", description: "Pick a food street. Try 5 different things. Rate each. Find the best momos. Document the journey.", location: "Chandni Chowk / Jama Masjid / CR Park" },
  workout: { title: "Workout Session", description: "Gym or outdoor run. Push each other. Post-workout protein shake. Consistency > motivation.", location: "Sanjay Van / Nehru Park / Lodhi Garden" },
  concert: { title: "Concert Night", description: "Find a live gig or open mic. Get there early. Sing along. Record clips for the chapter.", location: "The Piano Man / Auro Kitchen Bar" },
};

type Friend = { id: string; name: string; username: string; profile_pic?: string };

export default function CreateActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryType = searchParams.get("type") || "";
  const initialTitle = searchParams.get("title") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialDesc = searchParams.get("desc") || "";

  const suggestion = AI_SUGGESTIONS[categoryType] || { title: "", description: "", location: "" };

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initialTitle || suggestion.title);
  const [date, setDate] = useState("");
  const [location, setLocation] = useState(initialLocation || suggestion.location);
  const [description, setDescription] = useState(initialDesc || suggestion.description);
  const [banner, setBanner] = useState<File | null>(null);

  // Step 2 - Invite
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [invited, setInvited] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Search users for invite
  useEffect(() => {
    if (!friendSearch.trim() || step !== 2 || !token) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API}/users/search?q=${encodeURIComponent(friendSearch)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (e) { console.error(e); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timeout);
  }, [friendSearch, step, API, token]);

  const createActivity = async () => {
    if (!title.trim()) return setError("Enter a name for your plan");
    if (!date) return setError("Pick a date & time");
    if (!location.trim()) return setError("Add a location");

    try {
      setSubmitting(true);
      setError(null);

      let bannerUrl = null;
      if (banner) bannerUrl = await uploadSubmission(banner);

      const res = await fetch(`${API}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, type: categoryType || "other", date, location,
          description, banner: bannerUrl, mode: "offline",
          is_free: true, category: categoryType || "other",
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setCreatedId(data.id);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inviteFriend = async (friendId: string) => {
    if (!createdId || !token) return;
    try {
      await fetch(`${API}/activities/${createdId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ invitee_id: friendId }),
      });
      setInvited(prev => [...prev, friendId]);
    } catch (e) { console.error(e); }
  };

  const goToActivity = () => {
    if (createdId) router.push(`/activities/${createdId}`);
  };

  const stepLabels = ["Plan", "Invite", "Discuss", "Capture"];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", padding: "calc(40px + env(safe-area-inset-top, 0px)) 20px calc(100px + env(safe-area-inset-bottom, 0px))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      {/* Background Glow */}
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translate(-50%, -50%)", width: "100vw", height: "400px", background: "radial-gradient(circle, rgba(192,132,252,0.15) 0%, rgba(244,114,182,0.1) 40%, transparent 70%)", filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        .wiz-card { position: relative; z-index: 10; width: 100%; max-width: 580px; background: rgba(20,20,22,0.65); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; box-shadow: 0 24px 80px rgba(0,0,0,0.4); }
        .wiz-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; margin: 0; background: linear-gradient(135deg, #fff 0%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .wiz-steps { display: flex; gap: 8px; margin: 24px 0 32px; }
        .wiz-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .wiz-step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; transition: all 0.3s; }
        .wiz-step-dot.active { background: linear-gradient(135deg, #c084fc, #f472b6); color: #fff; box-shadow: 0 4px 16px rgba(192,132,252,0.3); }
        .wiz-step-dot.done { background: rgba(52,211,153,0.2); color: #34d399; }
        .wiz-step-dot.pending { background: rgba(255,255,255,0.05); color: #555; }
        .wiz-step-label { font-size: 11px; color: #555; font-weight: 600; }
        .wiz-step-label.active { color: #c084fc; }
        .wiz-step-line { flex: 1; height: 2px; background: rgba(255,255,255,0.06); margin-top: 16px; }
        .wiz-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px 16px; color: #fff; font-size: 15px; font-family: inherit; outline: none; transition: all 0.3s; box-sizing: border-box; }
        .wiz-input::placeholder { color: rgba(255,255,255,0.25); }
        .wiz-input:focus { border-color: rgba(192,132,252,0.5); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 3px rgba(192,132,252,0.1); }
        .wiz-textarea { resize: vertical; min-height: 100px; }
        .wiz-label { display: block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.6); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .wiz-group { margin-bottom: 24px; }
        .wiz-ai-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #c084fc; background: rgba(192,132,252,0.1); padding: 3px 10px; border-radius: 99px; margin-bottom: 8px; font-weight: 600; }
        .wiz-btn { width: 100%; padding: 16px; border-radius: 14px; background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%); color: #fff; font-size: 16px; font-weight: 700; border: none; cursor: pointer; font-family: inherit; transition: all 0.3s; box-shadow: 0 8px 24px rgba(192,132,252,0.25); }
        .wiz-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(192,132,252,0.35); }
        .wiz-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .wiz-btn-secondary { background: rgba(255,255,255,0.06); box-shadow: none; border: 1px solid rgba(255,255,255,0.1); }
        .wiz-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.1); box-shadow: none; }
        .wiz-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 12px 16px; border-radius: 12px; font-size: 14px; margin-bottom: 24px; }
        .wiz-friend { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px; transition: all 0.2s; }
        .wiz-friend:hover { background: rgba(255,255,255,0.06); }
        .wiz-friend-pic { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 14px; }
        .wiz-friend-info { flex: 1; }
        .wiz-friend-name { font-size: 14px; font-weight: 600; color: #fff; }
        .wiz-friend-user { font-size: 12px; color: #666; }
        .wiz-invite-btn { padding: 6px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        @media (max-width: 640px) { .wiz-card { padding: 24px; } }
      `}</style>

      <div className="wiz-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h1 className="wiz-title">
            {step === 1 && "Plan Your Experience"}
            {step === 2 && "Invite Friends"}
            {step === 3 && "Discuss & Finalize"}
            {step === 4 && "Capture Memories"}
          </h1>
          <Link href="/activities" style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>✕</Link>
        </div>

        {/* Step Indicator */}
        <div className="wiz-steps">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const status = num < step ? "done" : num === step ? "active" : "pending";
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div className="wiz-step">
                  <div className={`wiz-step-dot ${status}`}>
                    {status === "done" ? "✓" : num}
                  </div>
                  <span className={`wiz-step-label ${status === "active" ? "active" : ""}`}>{label}</span>
                </div>
                {i < 3 && <div className="wiz-step-line" />}
              </div>
            );
          })}
        </div>

        {error && <div className="wiz-error">{error}</div>}

        {/* STEP 1: Plan */}
        {step === 1 && (
          <>
            {categoryType && AI_SUGGESTIONS[categoryType] && (
              <div className="wiz-ai-badge">✨ AI-suggested plan for {categoryType.replace("_", " ")}</div>
            )}

            <div className="wiz-group">
              <label className="wiz-label">Plan Name *</label>
              <input className="wiz-input" placeholder="What are we calling this?" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="wiz-group">
              <label className="wiz-label">Date & Time *</label>
              <input type="datetime-local" className="wiz-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>

            <div className="wiz-group">
              <label className="wiz-label">Location *</label>
              <LocationAutocomplete 
                value={location} 
                onChange={val => setLocation(val)} 
                placeholder="Where's this happening?" 
                className="" 
                inputClassName="wiz-input"
              />
            </div>

            <div className="wiz-group">
              <label className="wiz-label">What's the plan?</label>
              <textarea className="wiz-input wiz-textarea" placeholder="Describe the vibe, the plan, the energy..." value={description} onChange={e => setDescription(e.target.value.slice(0, 500))} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "right", marginTop: 4 }}>{description.length}/500</div>
            </div>

            <div className="wiz-group">
              <label className="wiz-label">Cover Photo (Optional)</label>
              <div style={{ border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "center", position: "relative", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}>
                <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10 }} onChange={e => setBanner(e.target.files?.[0] || null)} />
                <div style={{ fontSize: 28, marginBottom: 4 }}>🖼️</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{banner ? banner.name : "Click to upload"}</div>
              </div>
            </div>

            <button className="wiz-btn" onClick={createActivity} disabled={submitting}>
              {submitting ? "Creating..." : "Create & Invite Friends →"}
            </button>
          </>
        )}

        {/* STEP 2: Invite */}
        {step === 2 && (
          <>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 20 }}>
              Search and invite friends. They'll get a notification and can say In or Out.
            </p>

            <div className="wiz-group">
              <input className="wiz-input" placeholder="Search by name or username..." value={friendSearch} onChange={e => setFriendSearch(e.target.value)} />
            </div>

            {searching && <div style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>Searching...</div>}

            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 24 }}>
              {searchResults.map(f => {
                const isInvited = invited.includes(f.id);
                const pic = f.profile_pic ? (f.profile_pic.startsWith("/uploads") ? `${API}${f.profile_pic}` : f.profile_pic) : null;
                return (
                  <div key={f.id} className="wiz-friend">
                    {pic ? <img src={pic} alt="" className="wiz-friend-pic" /> : <div className="wiz-friend-pic">{f.name?.charAt(0)}</div>}
                    <div className="wiz-friend-info">
                      <div className="wiz-friend-name">{f.name}</div>
                      <div className="wiz-friend-user">@{f.username}</div>
                    </div>
                    <button
                      className="wiz-invite-btn"
                      style={{
                        background: isInvited ? "rgba(52,211,153,0.15)" : "rgba(192,132,252,0.15)",
                        color: isInvited ? "#34d399" : "#c084fc",
                      }}
                      onClick={() => !isInvited && inviteFriend(f.id)}
                      disabled={isInvited}
                    >
                      {isInvited ? "✓ Invited" : "Invite"}
                    </button>
                  </div>
                );
              })}
            </div>

            {invited.length > 0 && (
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 16 }}>
                {invited.length} friend{invited.length > 1 ? "s" : ""} invited
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button className="wiz-btn wiz-btn-secondary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                Skip for now
              </button>
              <button className="wiz-btn" style={{ flex: 1 }} onClick={() => setStep(3)}>
                Next: Discuss →
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Discuss */}
        {step === 3 && (
          <>
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Discuss & Suggest Changes</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 360, margin: "0 auto 32px", lineHeight: 1.6 }}>
                Head to your plan's page to discuss with friends, suggest changes, vote on ideas, and finalize the details together.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button className="wiz-btn" style={{ width: "auto", padding: "14px 32px" }} onClick={goToActivity}>
                  Open Plan Page 💬
                </button>
                <button className="wiz-btn wiz-btn-secondary" style={{ width: "auto", padding: "14px 32px" }} onClick={() => router.push("/activities")}>
                  Done ✓
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
