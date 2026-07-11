"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Loader2, ArrowLeft } from "lucide-react";

const POPULAR_INTERESTS = [
  "Coding", "Gym", "Anime", "Movies", "Music", 
  "Travel", "Photography", "Gaming", "Reading", 
  "Coffee", "Foodie", "Art", "Fashion", "Tech"
];

const POPULAR_VIBES = [
  "Late Night Coder", "Gym Rat", "Early Bird", 
  "Introvert", "Extrovert", "Coffee Addict", 
  "Nature Lover", "Thrill Seeker", "Chill"
];

export default function PreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [vibeInput, setVibeInput] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) {
      router.push("/auth/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      if (parsedUser.interests) setInterests(parsedUser.interests);
      if (parsedUser.vibe_tags) setVibeTags(parsedUser.vibe_tags);
    }
  }, [router]);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      if (interests.length < 10) setInterests([...interests, interest]);
    }
    setInterestInput("");
  };

  const toggleVibe = (vibe: string) => {
    if (vibeTags.includes(vibe)) {
      setVibeTags(vibeTags.filter(v => v !== vibe));
    } else {
      if (vibeTags.length < 5) setVibeTags([...vibeTags, vibe]);
    }
    setVibeInput("");
  };

  const handleSave = async () => {
    if (!user || !token) return;
    setLoading(true);

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interests,
          vibe_tags: vibeTags
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
        router.push(`/profile/${user.username}`);
      } else {
        alert(data.error || "Failed to update preferences");
      }
    } catch (e) {
      console.error("Update failed", e);
      alert("Failed to connect to server");
    }
    setLoading(false);
  };

  const filteredInterests = POPULAR_INTERESTS.filter(
    i => i.toLowerCase().includes(interestInput.toLowerCase()) && !interests.includes(i)
  );

  const filteredVibes = POPULAR_VIBES.filter(
    v => v.toLowerCase().includes(vibeInput.toLowerCase()) && !vibeTags.includes(v)
  );

  if (!user) return <div style={{ background: "#0a0a0a", height: "100vh" }} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => router.back()} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", marginRight: "16px" }}>
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>My Preferences</h1>
        </div>

        <p style={{ color: "#888", marginBottom: "32px", fontSize: "14px" }}>
          Tell us what you're into. We'll use this to suggest people and activities you might like.
        </p>

        {/* Interests Section */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Interests & Hobbies ({interests.length}/10)</h2>
          
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "14px", color: "#666" }} />
            <input
              type="text"
              placeholder="Search interests..."
              value={interestInput}
              onChange={e => setInterestInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && interestInput.trim() && !interests.includes(interestInput.trim())) {
                  toggleInterest(interestInput.trim());
                }
              }}
              style={{
                width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px",
                background: "#1a1a1a", border: "1px solid #333", color: "#fff", outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {interests.map(interest => (
              <div 
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={{
                  padding: "8px 16px", borderRadius: "20px", background: "#3b82f6", color: "#fff",
                  fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"
                }}
              >
                {interest}
                <X size={14} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Suggested</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {filteredInterests.slice(0, 8).map(interest => (
              <div 
                key={interest}
                onClick={() => toggleInterest(interest)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", background: "transparent", color: "#ccc",
                  border: "1px solid #444", fontSize: "13px", cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#666"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#444"}
              >
                + {interest}
              </div>
            ))}
          </div>
        </div>

        {/* Vibe Tags Section */}
        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>Your Vibe ({vibeTags.length}/5)</h2>
          
          <div style={{ position: "relative", marginBottom: "16px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "14px", color: "#666" }} />
            <input
              type="text"
              placeholder="Search vibes..."
              value={vibeInput}
              onChange={e => setVibeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && vibeInput.trim() && !vibeTags.includes(vibeInput.trim())) {
                  toggleVibe(vibeInput.trim());
                }
              }}
              style={{
                width: "100%", padding: "12px 12px 12px 40px", borderRadius: "12px",
                background: "#1a1a1a", border: "1px solid #333", color: "#fff", outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {vibeTags.map(vibe => (
              <div 
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                style={{
                  padding: "8px 16px", borderRadius: "20px", background: "#8b5cf6", color: "#fff",
                  fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer"
                }}
              >
                {vibe}
                <X size={14} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Suggested</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {filteredVibes.slice(0, 8).map(vibe => (
              <div 
                key={vibe}
                onClick={() => toggleVibe(vibe)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", background: "transparent", color: "#ccc",
                  border: "1px solid #444", fontSize: "13px", cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#666"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#444"}
              >
                + {vibe}
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", background: "#fff", color: "#000",
            border: "none", fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", opacity: loading ? 0.7 : 1
          }}
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          Save Preferences
        </button>

      </div>
    </div>
  );
}
