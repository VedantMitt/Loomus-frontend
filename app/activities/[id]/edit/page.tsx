"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadSubmission } from "@/lib/uploadSubmission";
import Link from "next/link";
import CitySelector from "@/components/CitySelector";

const CATEGORIES = [
  "Party", "Music", "Tech", "Sports", "Dating", "Academic", "Cultural", "Other"
];

export default function EditActivityPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Party");
  const [date, setDate] = useState("");
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    setMinDate(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
  }, []);

  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | "">("");
  const [banner, setBanner] = useState<File | null>(null);
  const [currentBanner, setCurrentBanner] = useState<string | null>(null);
  const [allowSubmissions, setAllowSubmissions] = useState(false);
  
  const [format, setFormat] = useState("Event");
  const [socialLinks, setSocialLinks] = useState([{ name: "", url: "" }]);
  const [mode, setMode] = useState("offline");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<number | "">("");
  const [selectedCity, setSelectedCity] = useState("");
  const [isOfficial, setIsOfficial] = useState(false);
  const [hostedByName, setHostedByName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [societyName, setSocietyName] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/login");

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const myUserId = payload.userId || payload.id;

        const res = await fetch(`${API}/activities/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to load activity");
        const data = await res.json();

        // Security check
        if (data.host_user_id !== myUserId) {
          router.push(`/activities/${id}`);
          return;
        }

        setTitle(data.title || "");
        setType(data.type || "Party");
        // format date for datetime-local
        if (data.date) {
            const d = new Date(data.date);
            const pad = (n: number) => n.toString().padStart(2, '0');
            const formatted = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            setDate(formatted);
        }
        setLocation(data.location || "");
        setDescription(data.description || "");
        setMaxParticipants(data.max_participants || "");
        setCurrentBanner(data.banner);
        setAllowSubmissions(!!data.allow_submissions);
        setFormat(data.format || "Event");
        
        // Detailed fields
        setMode(data.mode || "offline");
        setIsFree(data.is_free !== undefined ? data.is_free : true);
        setPrice(data.price || "");
        setIsOfficial(!!data.is_official);
        setHostedByName(data.hosted_by_name || "");
        setCollegeName(data.college_name || "");
        setSocietyName(data.society_name || "");

        // Parse location/city
        const rawLoc = data.location || "";
        if (rawLoc.includes(": ")) {
          const [city, ...rest] = rawLoc.split(": ");
          setSelectedCity(city);
          setLocation(rest.join(": "));
        } else {
          setLocation(rawLoc);
        }
        
        if (data.social_links && Array.isArray(data.social_links) && data.social_links.length > 0) {
            setSocialLinks(data.social_links);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router, API]);

  const updateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return setError("Please enter an event title");
    if (!type.trim()) return setError("Please select a category");
    if (!date) return setError("Please provide a valid date and time.");
    if (!location.trim()) return setError("Please enter a location");

    try {
      setSubmitting(true);
      setError(null);

      let bannerUrl = currentBanner;
      if (banner) {
        bannerUrl = await uploadSubmission(banner);
      }

      const finalLocation = (mode === 'offline' || mode === 'hybrid') 
        ? (selectedCity ? `${selectedCity}: ${location}` : location)
        : location;

      const payload = {
        title,
        type,
        date,
        location: finalLocation,
        description,
        banner: bannerUrl,
        max_participants: maxParticipants !== "" ? Number(maxParticipants) : null,
        allow_submissions: allowSubmissions,
        format,
        mode,
        is_free: isFree,
        price: isFree ? 0 : (price !== "" ? Number(price) : 0),
        social_links: socialLinks.filter(l => l.name.trim() && l.url.trim()),
        is_official: isOfficial,
        hosted_by_name: isOfficial ? "" : hostedByName,
        college_name: isOfficial ? collegeName : "",
        society_name: isOfficial ? societyName : ""
      };

      const res = await fetch(`${API}/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update activity");
      }

      router.push(`/activities/${id}`);
    } catch (err: any) {
      setError(err.message || "Server error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-20 text-white">Loading...</div>;

  return (
    <div className="cac-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        .cac-container {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cac-card {
          width: 100%;
          max-width: 580px;
          background: rgba(20, 20, 22, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
        }

        .cac-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .cac-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0;
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cac-back {
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          transition: color 0.2s;
        }
        .cac-back:hover { color: #fff; }

        .cac-form-group { margin-bottom: 24px; }

        .cac-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cac-input, .cac-select, .cac-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.3s ease;
          outline: none;
        }
        
        .cac-input::placeholder, .cac-textarea::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .cac-input:focus, .cac-select:focus, .cac-textarea:focus {
          border-color: rgba(167, 139, 250, 0.5);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
        }

        .cac-select {
          appearance: none;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="rgba(255,255,255,0.5)" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 48px;
        }
        
        .cac-select option { background: #1a1a1c; color: #fff; }

        .cac-textarea { resize: vertical; min-height: 100px; }

        .cac-row { display: flex; gap: 16px; }
        .cac-col { flex: 1; }

        .cac-upload-area {
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }
        .cac-upload-area:hover {
          border-color: rgba(167, 139, 250, 0.4);
          background: rgba(167, 139, 250, 0.05);
        }
        .cac-upload-input {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0; cursor: pointer; z-index: 10;
        }
        .cac-upload-content {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          position: relative; z-index: 5;
        }
        .cac-upload-icon { font-size: 28px; color: rgba(255, 255, 255, 0.4); }
        .cac-upload-text { font-size: 14px; color: rgba(255, 255, 255, 0.6); font-weight: 500; }

        .cac-banner-preview {
          width: 100%; height: 160px; object-fit: cover; border-radius: 12px;
          margin-top: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
        }

        .cac-char-count { font-size: 12px; color: rgba(255, 255, 255, 0.4); text-align: right; margin-top: 6px; }
        
        .cac-error {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444; padding: 12px 16px; border-radius: 12px; font-size: 14px; margin-bottom: 24px;
        }

        .cac-submit {
          width: 100%; padding: 16px; border-radius: 14px;
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
          color: #fff; font-size: 16px; font-weight: 700; border: none; cursor: pointer;
          font-family: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(167, 139, 250, 0.25);
          display: flex; justify-content: center; align-items: center; gap: 10px;
        }
        .cac-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(167, 139, 250, 0.35); }
        .cac-submit:disabled { opacity: 0.7; cursor: not-allowed; filter: grayscale(0.5); }
        
        .cac-spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff; border-radius: 50%;
          animation: cac-spin 1s linear infinite;
        }
        @keyframes cac-spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .cac-card { padding: 24px; }
          .cac-row { flex-direction: column; gap: 0; }
          .cac-row .cac-col { margin-bottom: 24px; }
        }

        .cac-checkbox-wrapper { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; cursor: pointer; }
        .cac-checkbox { width: 20px; height: 20px; accent-color: #a78bfa; cursor: pointer; }

        .cac-format-btn {
          flex: 1; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.02); border-radius: 12px; cursor: pointer;
          font-weight: 600; font-size: 14px; color: rgba(255,255,255,0.6); transition: all 0.2s;
        }
        .cac-format-btn:hover { background: rgba(255,255,255,0.05); }
        .cac-format-btn.active { background: rgba(167, 139, 250, 0.15); border-color: rgba(167, 139, 250, 0.5); color: #fff; }
      `}</style>

      <div className="cac-card">
        <div className="cac-header">
          <h1 className="cac-title">Edit Event</h1>
          <Link href={`/activities/${id}`} className="cac-back">
            Cancel
          </Link>
        </div>

        {error && <div className="cac-error">{error}</div>}

        <form onSubmit={updateEvent}>
          <div className="cac-form-group">
            <label className="cac-label">Activity Format *</label>
            <div className="cac-row">
              {['Event', 'Competition', 'Hangout'].map(f => (
                <div 
                  key={f}
                  className={`cac-format-btn ${format === f ? 'active' : ''}`}
                  onClick={() => setFormat(f)}
                >
                  {f === 'Event' ? '🎉 Event' : f === 'Competition' ? '🏆 Competition' : '☕ Hangout'}
                </div>
              ))}
            </div>
          </div>

          <div className="cac-form-group">
            <label className="cac-label">Event Banner (Optional)</label>
            <div className="cac-upload-area">
              <input
                type="file"
                accept="image/*"
                className="cac-upload-input"
                onChange={(e) => setBanner(e.target.files?.[0] || null)}
              />
              <div className="cac-upload-content">
                <div className="cac-upload-icon">🖼️</div>
                <div className="cac-upload-text">
                  {banner ? banner.name : (currentBanner ? "Click to replace current banner" : "Click or drag image to upload")}
                </div>
              </div>
            </div>
            {banner ? (
              <img src={URL.createObjectURL(banner)} alt="Banner preview" className="cac-banner-preview" />
            ) : currentBanner ? (
              <img src={currentBanner} alt="Current banner" className="cac-banner-preview" />
            ) : null}
          </div>

          <div className="cac-form-group">
            <label className="cac-label">Event Title *</label>
            <input type="text" className="cac-input" placeholder="e.g. Hacker House Open Mic" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="cac-row">
            <div className="cac-col">
              <div className="cac-form-group">
                <label className="cac-label">Category *</label>
                <select className="cac-select" value={type} onChange={(e) => setType(e.target.value)}>
                  {CATEGORIES.map((cat) => ( <option key={cat} value={cat}>{cat}</option> ))}
                </select>
              </div>
            </div>
            <div className="cac-col" style={{ marginBottom: 0 }}>
              <div className="cac-form-group">
                <label className="cac-label">Date & Time *</label>
                <input type="datetime-local" className="cac-input" value={date} min={minDate} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="cac-row">
            <div className="cac-col">
              <div className="cac-form-group">
                <label className="cac-label">
                  {(mode === 'offline' || mode === 'hybrid') ? "Venue / Address *" : "Location / URL *"}
                </label>
                <input 
                  type="text" 
                  className="cac-input" 
                  placeholder={(mode === 'offline' || mode === 'hybrid') ? "e.g. Main Auditorium" : "e.g. Zoom Link / Discord"} 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                />
              </div>
            </div>
            <div className="cac-col" style={{ marginBottom: 0 }}>
              <div className="cac-form-group">
                <label className="cac-label">Max Participants (Optional)</label>
                <input type="number" className="cac-input" placeholder="Unlimited" min="1" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : "")} />
              </div>
            </div>
          </div>

          <div className="cac-form-group">
            <label className="cac-label">Description</label>
            <textarea className="cac-textarea" placeholder="Tell people what to expect..." value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))} />
            <div className="cac-char-count">{description.length} / 500</div>
          </div>

          <div className="cac-form-group">
            <label className="cac-label">Socials & Links</label>
            {socialLinks.map((link, i) => (
              <div key={i} className="cac-row" style={{ marginBottom: '12px' }}>
                <input type="text" className="cac-input" placeholder="Platform" value={link.name} onChange={(e) => { const n = [...socialLinks]; n[i].name = e.target.value; setSocialLinks(n); }} style={{ flex: 1 }} />
                <input type="text" className="cac-input" placeholder="URL (https://...)" value={link.url} onChange={(e) => { const n = [...socialLinks]; n[i].url = e.target.value; setSocialLinks(n); }} style={{ flex: 2 }} />
                <button type="button" className="ad-btn" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0 16px', borderRadius: '12px', cursor: 'pointer', outline: 'none'}} onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))}>X</button>
              </div>
            ))}
            <button type="button" className="ad-btn ad-btn-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setSocialLinks([...socialLinks, { name: "", url: "" }])}>
              + Add Link
            </button>
          </div>

          {/* Mode */}
          <div className="cac-form-group">
            <label className="cac-label">Mode</label>
            <div className="cac-row">
              {['offline', 'online', 'hybrid'].map(m => (
                <div 
                  key={m}
                  className={`cac-format-btn ${mode === m ? 'active' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m === 'offline' ? '📍 Offline' : m === 'online' ? '💻 Online' : '🔀 Hybrid'}
                </div>
              ))}
            </div>
          </div>

          {/* Conditional City Dropdown */}
          {(mode === 'offline' || mode === 'hybrid') && (
            <div className="cac-form-group" style={{ animation: 'dropReveal 0.4s ease' }}>
              <label className="cac-label">Select City *</label>
              <CitySelector 
                value={selectedCity} 
                onChange={setSelectedCity} 
                placeholder="Select city where event is happening"
              />
            </div>
          )}

          {/* Host Information */}
          <div className="cac-form-group">
            <label className="cac-label">Host Information</label>
            <div className="cac-row" style={{ marginBottom: '16px' }}>
              <div 
                className={`cac-format-btn ${!isOfficial ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setIsOfficial(false)}
              >
                👤 Unofficial
              </div>
              <div 
                className={`cac-format-btn ${isOfficial ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setIsOfficial(true)}
              >
                🏛️ Official
              </div>
            </div>

            {!isOfficial ? (
              <div style={{ animation: 'dropReveal 0.3s ease' }}>
                <label className="cac-label" style={{ fontSize: '13px', opacity: 0.7 }}>Hosted By (Personal / Group Name)</label>
                <input
                  type="text"
                  className="cac-input"
                  placeholder="e.g. Your Name, Friends Group, etc."
                  value={hostedByName}
                  onChange={(e) => setHostedByName(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ animation: 'dropReveal 0.3s ease' }}>
                <label className="cac-label" style={{ fontSize: '13px', opacity: 0.7 }}>Society/Organization Name (Optional)</label>
                <input
                  type="text"
                  className="cac-input"
                  placeholder="e.g. DevClub"
                  value={societyName}
                  onChange={(e) => setSocietyName(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="cac-form-group">
            <label className="cac-label">Pricing</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>
                <input type="radio" name="pricing" checked={isFree} onChange={() => { setIsFree(true); setPrice(''); }} />
                Free
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#fff', fontSize: '14px' }}>
                <input type="radio" name="pricing" checked={!isFree} onChange={() => setIsFree(false)} />
                Paid
              </label>
            </div>
            {!isFree && (
              <input
                type="number"
                className="cac-input"
                placeholder="Price (₹)"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : "")}
              />
            )}
          </div>

          <label className="cac-checkbox-wrapper">
            <input type="checkbox" className="cac-checkbox" checked={allowSubmissions} onChange={(e) => setAllowSubmissions(e.target.checked)} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px' }}>Allow Submissions & Leaderboard</span>
          </label>

          <button type="submit" className="cac-submit" disabled={submitting}>
            {submitting ? <><span className="cac-spinner" />Saving Changes...</> : "Update Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
