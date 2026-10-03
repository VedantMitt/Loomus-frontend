"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Image as ImageIcon, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // User state
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Form Fields
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [interests, setInterests] = useState("");
  const [vibeTags, setVibeTags] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) {
      router.push("/auth/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      
      // Optionally pre-fill if they already have some data
      if (parsedUser.profile_pic) setProfilePic(parsedUser.profile_pic);
      if (parsedUser.bio) setBio(parsedUser.bio);
      if (parsedUser.interests) setInterests(parsedUser.interests.join(", "));
      if (parsedUser.vibe_tags) setVibeTags(parsedUser.vibe_tags.join(", "));
      if (parsedUser.instagram) setInstagram(parsedUser.instagram);
      if (parsedUser.linkedin) setLinkedin(parsedUser.linkedin);
      if (parsedUser.is_private !== undefined) setIsPrivate(parsedUser.is_private);
    }
  }, [router]);

  useEffect(() => {
    if (step === 3 && !locationName && !locationLat) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            setLocationLat(position.coords.latitude);
            setLocationLng(position.coords.longitude);
            // Optionally could reverse geocode here, but for now just set a generic message or keep it empty if we want them to enter city manually.
            // Let's set it to a generic shared string so the form passes validation, but they can edit it.
            setLocationName("GPS Location Shared");
          },
          (error) => {
            console.log("Auto-location failed or denied", error);
          }
        );
      }
    }
  }, [step]);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch(`${API}/upload/profile-pic`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProfilePic(data.profile_pic);
      // Update local storage user
      const updatedUser = { ...user, profile_pic: data.profile_pic };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!user || !token) return;
    setLoading(true);

    const payload: any = {};
    if (step === 2) {
      payload.bio = bio;
      payload.gender = gender;
      payload.dob = dob;
      payload.is_private = isPrivate;
    }
    if (step === 3) {
      payload.location_name = locationName;
      payload.location_lat = locationLat;
      payload.location_lng = locationLng;
    }
    if (step === 4) {
      payload.interests = interests.split(",").map((s) => s.trim()).filter(Boolean);
      payload.vibe_tags = vibeTags.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (step === 5) {
      payload.instagram = instagram;
      payload.linkedin = linkedin;
    }

    try {
      // Step 1 (profile pic) is already saved when uploaded
      if (step > 1) {
        const res = await fetch(`${API}/users/${user.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("user", JSON.stringify({ ...user, ...data }));
          setUser({ ...user, ...data });
        }
      }
    } catch (e) {
      console.error("Update failed", e);
    }

    setLoading(false);
    if (step < 5) {
      setStep((prev) => prev + 1);
    } else {
      router.push(`/profile/${user.username}`);
    }
  };

  const skipStep = () => {
    if (step < 5) {
      setStep((prev) => prev + 1);
    } else {
      router.push(`/profile/${user?.username}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-wrapper { width: 100%; max-width: 400px; }

        .auth-card {
          background: #111;
          border: 1px solid #222;
          border-radius: 20px;
          padding: 40px 32px;
          position: relative;
          overflow: hidden;
        }
        .auth-card::before {
          content: '';
          position: absolute;
          top: -60px; left: -60px;
          width: 180px; height: 180px;
          background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .lbl {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .inp {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 14px 16px;
          color: #f0f0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          margin-bottom: 20px;
          transition: border-color 0.2s;
        }
        .inp:focus { border-color: #3b82f6; }
        .inp::placeholder { color: #444; }

        .btn {
          width: 100%;
          padding: 14px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn:hover { background: #2563eb; }
        .btn:active { transform: scale(0.98); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .skip-btn {
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #888;
          border: 1px solid #333;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
        }
        .skip-btn:hover { border-color: #555; color: #ccc; }

        .avatar-upload {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #1a1a1a;
          border: 2px dashed #333;
          margin: 0 auto 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .avatar-upload:hover { border-color: #3b82f6; }
        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .avatar-upload:hover .avatar-overlay { opacity: 1; }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #222;
          border-radius: 2px;
          margin-bottom: 32px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }
      `}</style>

      <div className="auth-wrapper">
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "28px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Loom<span style={{ color: "#3b82f6" }}>us</span>
          </div>
          <p style={{ color: "#888", fontSize: "14px", marginTop: "8px" }}>
            Let's set up your profile
          </p>
        </div>

        <div className="auth-card">
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ color: "#fff", fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>
              {step === 1 && "Add a Profile Picture 📸"}
              {step === 2 && "Tell us about yourself 📝"}
              {step === 3 && "Where are you located? 📍"}
              {step === 4 && "Pick your vibe ✨"}
              {step === 5 && "Connect Socials 🔗"}
            </h2>
            <p style={{ color: "#666", fontSize: "14px" }}>Step {step} of 5</p>
          </div>

          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <div className="avatar-upload" onClick={() => fileInputRef.current?.click()}>
                {profilePic ? (
                  <>
                    <img src={profilePic} alt="Profile" className="avatar-image" />
                    <div className="avatar-overlay">
                      <Camera size={24} color="#fff" />
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#666" }}>
                    <ImageIcon size={32} style={{ marginBottom: "8px" }} />
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>Upload</span>
                  </div>
                )}
                {loading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={24} color="#fff" className="animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              <label className="lbl">Bio</label>
              <textarea
                className="inp"
                style={{ resize: "none", height: "80px" }}
                placeholder="Always looking for the next adventure | Coffee addict"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <label className="lbl">Gender</label>
              <select 
                className="inp" 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                style={{ appearance: "none", cursor: "pointer" }}
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <label className="lbl">Date of Birth</label>
              <input
                className="inp"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
              <label className="lbl">Account Privacy</label>
              <select 
                className="inp" 
                value={isPrivate ? "true" : "false"} 
                onChange={(e) => setIsPrivate(e.target.value === "true")}
                style={{ appearance: "none", cursor: "pointer" }}
              >
                <option value="false">Public</option>
                <option value="true">Private</option>
              </select>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <button 
                  className="btn" 
                  style={{ background: "#222", border: "1px solid #333", color: "#ccc" }}
                  onClick={() => {
                    if (navigator.geolocation) {
                      setLoading(true);
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          setLocationLat(position.coords.latitude);
                          setLocationLng(position.coords.longitude);
                          // Option to reverse geocode here if desired, otherwise just show a success message
                          setLocationName("Location Shared Successfully");
                          setLoading(false);
                        },
                        (error) => {
                          console.error("Error getting location", error);
                          alert(`Could not get location: ${error.message}. Please enter it manually or check your browser permissions.`);
                          setLoading(false);
                        }
                      );
                    } else {
                      alert("Geolocation is not supported by this browser.");
                    }
                  }}
                  type="button"
                >
                  📍 Share Current Location
                </button>
              </div>
              
              <label className="lbl">Or Enter Manually (City, Country)</label>
              <input
                className="inp"
                type="text"
                placeholder="New York, USA"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </>
          )}

          {step === 4 && (
            <>
              <label className="lbl">Interests (Comma separated)</label>
              <input
                className="inp"
                type="text"
                placeholder="Coding, Football, Music"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
              <label className="lbl">Vibe Tags (Comma separated)</label>
              <input
                className="inp"
                type="text"
                placeholder="Late Night Coder, Gym Rat"
                value={vibeTags}
                onChange={(e) => setVibeTags(e.target.value)}
              />
            </>
          )}

          {step === 5 && (
            <>
              <label className="lbl">Instagram Username</label>
              <input
                className="inp"
                type="text"
                placeholder="username"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <label className="lbl">LinkedIn URL</label>
              <input
                className="inp"
                type="text"
                placeholder="linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </>
          )}

          <button 
            className="btn" 
            onClick={handleSaveAndContinue} 
            disabled={loading || (step === 1 && !profilePic && !loading) || (step === 3 && !locationName)}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {loading ? "Saving..." : step === 5 ? "Complete Setup" : "Continue"}
          </button>
          
          {step !== 3 && (
            <button 
              className="skip-btn" 
              onClick={skipStep} 
              disabled={loading}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
