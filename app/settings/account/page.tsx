"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function AccountDetails() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form fields
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) return;
        const u = JSON.parse(stored);

        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/users/${u.username}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        setGender(data.gender || "");
        setDob(data.dob || "");
        setLocationName(data.location_name || "");
        setLocationLat(data.location_lat || null);
        setLocationLng(data.location_lng || null);
        setInstagram(data.instagram || "");
        setLinkedin(data.linkedin || "");
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (!token || !user) return;

      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const payload: any = {
        gender,
        dob,
        location_name: locationName,
        instagram,
        linkedin,
      };
      
      if (locationLat !== null) payload.location_lat = locationLat;
      if (locationLng !== null) payload.location_lng = locationLng;

      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage({ type: "ok", text: "Account details saved! ✅" });
      setTimeout(() => router.push("/settings"), 1200);
    } catch (err: any) {
      setMessage({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLat(position.coords.latitude);
          setLocationLng(position.coords.longitude);
          setLocationName("Location Shared Successfully");
        },
        (error) => {
          console.error("Error getting location", error);
          alert(`Could not get location: ${error.message}. Please enter it manually or check your browser permissions.`);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white px-4 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .edit-container { max-width: 560px; margin: 0 auto; font-family: 'DM Sans', sans-serif; }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #888;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          margin-bottom: 20px;
          padding: 0;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #fff; }
        .edit-card { background: #111; border: 1px solid #1e1e1e; border-radius: 14px; padding: 20px 22px; margin-bottom: 16px; }
        .edit-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin-bottom: 8px; display: block; }
        .edit-input {
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 9px;
          padding: 11px 14px; color: #f0f0f0; font-family: 'DM Sans', sans-serif; font-size: 14px;
          outline: none; transition: border-color 0.2s; margin-bottom: 16px;
        }
        .edit-input:focus { border-color: #1d4ed8; }
        .edit-input::placeholder { color: #333; }
        .save-btn {
          width: 100%; padding: 14px; background: #1d4ed8; color: #fff; border: none; border-radius: 10px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; cursor: pointer;
          transition: background 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .save-btn:hover { background: #1e40af; }
        .save-btn:active { transform: scale(0.98); }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .msg-ok { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; text-align: center; }
        .msg-err { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #f87171; border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; text-align: center; }
        .loc-btn {
          width: 100%; padding: 11px 14px; background: #1a1a1a; color: #ccc; border: 1px solid #2a2a2a; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer;
          margin-bottom: 12px; transition: background 0.2s;
        }
        .loc-btn:hover { background: #222; }
      `}</style>

      <div className="edit-container">
        <button className="back-btn" onClick={() => router.push("/settings")}>
          <ChevronLeft size={16} /> Back to Settings
        </button>
        
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "20px" }}>Account Details</h1>

        {message && (
          <div className={message.type === "ok" ? "msg-ok" : "msg-err"}>
            {message.text}
          </div>
        )}

        <div className="edit-card">
          <label className="edit-label">Gender</label>
          <select 
            className="edit-input" 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
            style={{ appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-Binary">Non-Binary</option>
          </select>

          <label className="edit-label">Date of Birth</label>
          <input
            type="date"
            className="edit-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            style={{ colorScheme: "dark" }}
          />
        </div>

        <div className="edit-card">
          <label className="edit-label">Location</label>
          <button className="loc-btn" onClick={handleGetLocation} type="button">
            📍 Share Current Location
          </button>
          <input
            type="text"
            className="edit-input"
            placeholder="Or enter manually (City, Country)"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        <div className="edit-card">
          <label className="edit-label">Social Links</label>
          <input
            type="text"
            className="edit-input"
            placeholder="Instagram Username"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
          <input
            type="text"
            className="edit-input"
            placeholder="LinkedIn Profile URL"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            style={{ marginBottom: 0 }}
          />
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Save Details"}
        </button>
      </div>
    </div>
  );
}
